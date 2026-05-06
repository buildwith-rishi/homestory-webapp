import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

/**
 * Modal shown when the API blocks changing a converted lead’s status because
 * the customer has active projects (400 + error body).
 */
const LeadKanbanStatusWarningModal: React.FC<Props> = ({
  open,
  message,
  onClose,
}) => {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-kanban-status-warning-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="flex items-center gap-3 p-6 border-b border-amber-100 bg-amber-50/80">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="lead-kanban-status-warning-title"
              className="text-lg font-bold text-amber-950"
            >
              Cannot change lead status
            </h3>
            <p className="text-sm text-amber-800/90 mt-0.5">
              This lead is linked to a customer with active work
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-amber-100/80 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-amber-900/60" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-950 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold text-sm hover:from-amber-600 hover:to-orange-700 transition-all shadow-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LeadKanbanStatusWarningModal;
