import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui";
import { useAuthStore } from "../../stores/authStore";
import { resetSessionExpiredGuard } from "../../auth/sessionExpired";
import { useSessionExpiredStore } from "../../auth/sessionExpiredStore";

const AUTO_REDIRECT_SECONDS = 5;

/** Above all app UI (z-[10000] modals, drawers, etc.) */
const OVERLAY_Z = 2147483000;

/**
 * SessionExpiredModal — always portaled to `document.body` with a fixed z-index.
 * Does not use the shared Modal/Framer wrapper so nothing can block the overlay.
 */
export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const visible = useSessionExpiredStore((s) => s.visible);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const redirectedRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    useAuthStore.getState().setUser(null);
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    } catch {
      /* ignore */
    }
    navigate("/login", { replace: true });
    resetSessionExpiredGuard();
  }, [navigate]);

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

  if (!visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-desc"
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: OVERLAY_Z,
        backgroundColor: "rgba(17, 24, 39, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={redirectToLogin}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              id="session-expired-title"
              className="text-lg font-bold text-gray-900"
            >
              Session expired
            </h2>
            <p
              id="session-expired-desc"
              className="text-sm text-gray-600 mt-2 leading-relaxed"
            >
              Your session has timed out. Please sign in again to continue
              using the CRM.
            </p>
            {secondsLeft > 0 && (
              <p className="text-xs text-gray-400 mt-3" aria-live="polite">
                Redirecting to login in {secondsLeft}&nbsp;second
                {secondsLeft !== 1 ? "s" : ""}…
              </p>
            )}
          </div>
        </div>
        <div className="mt-8">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            onClick={redirectToLogin}
          >
            Go to login
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
