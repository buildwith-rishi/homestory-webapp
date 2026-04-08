import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Modal, Button } from "../ui";
import { useAuthStore } from "../../stores/authStore";
import { resetSessionExpiredGuard } from "../../auth/sessionExpired";
import { useSessionExpiredStore } from "../../auth/sessionExpiredStore";

const AUTO_REDIRECT_SECONDS = 5;

/**
 * Must sit above every in-app overlay (many screens use z-[9999] / z-[10000]).
 */
const SESSION_MODAL_STACK_Z = 100000;

/**
 * Shown when ANY API returns 401 and the session cannot be refreshed.
 * Mounted once at app root – outside <Routes> – so it survives route changes.
 *
 * CRITICAL: We deliberately do NOT touch the auth store (setUser, logout) until
 * the user is about to be redirected.  Touching it earlier would flip
 * isAuthenticated → false, which makes ProtectedRoute render <Navigate to="/login" />
 * in the same React render batch, sending the user away before the modal paints.
 */
export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const visible = useSessionExpiredStore((s) => s.visible);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const redirectedRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    // 1. Clear in-memory auth state so the login page renders clean.
    useAuthStore.getState().setUser(null);

    // 2. Belt-and-suspenders: clear any leftover tokens from localStorage
    //    (notifySessionExpired already did this, but be safe).
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    } catch {
      /* SSR guard */
    }

    // 3. Navigate to login BEFORE resetting the guard so the modal stays
    //    visible until the login page is committed.
    navigate("/login", { replace: true });

    // 4. Now hide the modal and allow future session-expired events.
    resetSessionExpiredGuard();
  }, [navigate]);

  // Kick off the countdown + auto-redirect when the modal becomes visible.
  useEffect(() => {
    if (!visible) {
      redirectedRef.current = false;
      setSecondsLeft(AUTO_REDIRECT_SECONDS);
      return;
    }

    setSecondsLeft(AUTO_REDIRECT_SECONDS);

    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          redirectToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [visible, redirectToLogin]);

  return (
    <Modal
      isOpen={visible}
      onClose={redirectToLogin}
      showCloseButton={false}
      size="sm"
      stackZIndex={SESSION_MODAL_STACK_Z}
    >
      <div className="p-6 sm:p-8 max-w-md mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">
              Session Expired
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your session has timed out because of inactivity or the server
              invalidated your credentials. Please log in again to continue.
            </p>
            {secondsLeft > 0 && (
              <p className="text-xs text-gray-400 mt-3" aria-live="polite">
                Redirecting to login in {secondsLeft}&nbsp;second
                {secondsLeft !== 1 && "s"}…
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            onClick={redirectToLogin}
          >
            Go to Login
          </Button>
        </div>
      </div>
    </Modal>
  );
};
