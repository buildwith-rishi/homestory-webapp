import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Modal, Button } from "../ui";
import { useAuthStore } from "../../stores/authStore";
import { resetSessionExpiredGuard } from "../../auth/sessionExpired";

/**
 * Shown when APIs return 401 and the session cannot be refreshed.
 * Mounted once at app root (inside the router).
 */
export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onExpired = () => {
      useAuthStore.getState().setUser(null);
      setOpen(true);
    };
    window.addEventListener("ghs:session-expired", onExpired);
    return () => window.removeEventListener("ghs:session-expired", onExpired);
  }, []);

  const goToLogin = () => {
    setOpen(false);
    resetSessionExpiredGuard();
    void useAuthStore.getState().logout().finally(() => {
      navigate("/login", { replace: true });
    });
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      showCloseButton={false}
      size="sm"
    >
      <div className="p-6 sm:p-8 max-w-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">
              Session expired
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your access token is no longer valid. Please sign in again to
              continue using the CRM.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Dismiss
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={goToLogin}
          >
            Go to login
          </Button>
        </div>
      </div>
    </Modal>
  );
};
