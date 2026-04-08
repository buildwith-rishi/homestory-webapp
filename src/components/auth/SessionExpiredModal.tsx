import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Modal, Button } from "../ui";
import { useAuthStore } from "../../stores/authStore";
import { resetSessionExpiredGuard } from "../../auth/sessionExpired";

/** Aligns with the whole-second countdown shown in the modal */
const AUTO_REDIRECT_MS = 3000;

/**
 * Shown when APIs return 401 and the session cannot be refreshed.
 * Mounted once at app root (inside the router).
 * Automatically redirects to the login page after a short delay; user can go immediately.
 */
export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const redirectedRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    setOpen(false);
    resetSessionExpiredGuard();
    void useAuthStore.getState().logout().finally(() => {
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const onExpired = () => {
      redirectedRef.current = false;
      useAuthStore.getState().setUser(null);
      setSecondsLeft(Math.ceil(AUTO_REDIRECT_MS / 1000));
      setOpen(true);
    };
    window.addEventListener("ghs:session-expired", onExpired);
    return () => window.removeEventListener("ghs:session-expired", onExpired);
  }, []);

  useEffect(() => {
    if (!open) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      redirectToLogin();
    }, AUTO_REDIRECT_MS);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirectTimer);
    };
  }, [open, redirectToLogin]);

  return (
    <Modal
      isOpen={open}
      onClose={redirectToLogin}
      showCloseButton={false}
      size="sm"
    >
      <div className="p-6 sm:p-8 max-w-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">Session expired</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your session is no longer valid. Please sign in again to continue
              using the CRM.
            </p>
            <p
              className="text-sm text-gray-500 mt-3"
              aria-live="polite"
            >
              Redirecting to login in {secondsLeft}…
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={redirectToLogin}
          >
            Go to login now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
