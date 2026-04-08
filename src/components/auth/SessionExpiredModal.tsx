import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Modal, Button } from "../ui";
import { useAuthStore } from "../../stores/authStore";
import { resetSessionExpiredGuard } from "../../auth/sessionExpired";
import { useSessionExpiredStore } from "../../auth/sessionExpiredStore";

/** Aligns with the whole-second countdown shown in the modal */
const AUTO_REDIRECT_MS = 3000;

/**
 * Must sit above in-app overlays (many screens use z-[9999] / z-[10000]).
 * See Modal stackZIndex prop.
 */
const SESSION_MODAL_STACK_Z = 100000;

/**
 * Shown when APIs return 401 and the session cannot be refreshed.
 * Mounted once at app root (inside the router).
 * Visibility is driven by the session store (and notifySessionExpired) so the
 * dialog always appears; CustomEvent alone is not relied on.
 */
export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const visible = useSessionExpiredStore((s) => s.visible);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const redirectedRef = useRef(false);

  /** Clear auth as soon as the store says session expired (before paint). */
  useLayoutEffect(() => {
    if (!visible) return;
    useAuthStore.getState().setUser(null);
  }, [visible]);

  const redirectToLogin = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    resetSessionExpiredGuard();
    void useAuthStore.getState().logout().finally(() => {
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (!visible) {
      redirectedRef.current = false;
      return;
    }

    setSecondsLeft(Math.ceil(AUTO_REDIRECT_MS / 1000));

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
  }, [visible, redirectToLogin]);

  return (
    <Modal
      isOpen={visible}
      onClose={redirectToLogin}
      showCloseButton={false}
      size="sm"
      stackZIndex={SESSION_MODAL_STACK_Z}
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
            <p className="text-sm text-gray-500 mt-3" aria-live="polite">
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
