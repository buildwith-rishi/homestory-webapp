import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "full" | "auto";
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  /**
   * Backdrop z-index; content wrapper uses stackZIndex + 1.
   * Use for overlays that must sit above app modals (e.g. z-[9999] drawers).
   */
  stackZIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  footer,
  showCloseButton = true,
  stackZIndex,
}) => {
  const backdropZ = stackZIndex ?? 9998;
  const containerZ = stackZIndex != null ? stackZIndex + 1 : 9999;
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const sizeStyles = {
    sm: "max-w-md w-full",
    md: "max-w-[560px] w-full",
    lg: "max-w-[720px] w-full",
    full: "max-w-[90vw] w-full",
    auto: "w-auto max-w-none",
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - covers entire viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(17, 24, 39, 0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: backdropZ,
            }}
          />
          {/* Modal container */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: containerZ,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={`${sizeStyles[size]} bg-white rounded-lg shadow-2xl overflow-hidden`}
              style={{ pointerEvents: "auto" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
            >
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  {title && (
                    <h2
                      id="modal-title"
                      className="font-display text-display-sm text-secondary font-medium"
                    >
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-auto w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors duration-200 text-gray-400 hover:text-gray-600"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}
              <div className="overflow-y-visible">{children}</div>
              {footer && (
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use React Portal to render modal at the root level (body)
  // This ensures it appears above all other content including fixed headers
  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
