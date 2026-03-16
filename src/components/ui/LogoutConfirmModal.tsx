import React from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onCancel}
      size="sm"
      showCloseButton={!loading}
      title="Confirm Logout"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            leftIcon={!loading ? <LogOut className="w-4 h-4" /> : undefined}
          >
            Logout
          </Button>
        </>
      }
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">You are about to sign out</p>
            <p className="text-sm text-gray-600 mt-1">
              Are you sure you want to logout from your account?
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutConfirmModal;