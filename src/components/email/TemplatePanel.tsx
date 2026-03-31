import React from "react";
import {
  Sparkles,
  X,
  AlertCircle,
  FileText,
  Pen,
  Trash2,
} from "lucide-react";
import { EmailTemplate } from "../../types";
import { SectionLoader } from "../ui";

const CATEGORY_EMOJI: Record<string, string> = {
  ONBOARDING: "👋",
  PROJECT_UPDATE: "🏗️",
  PAYMENT: "💳",
  COMPLETION: "🎉",
  OTHER: "📧",
  OCCASION: "🎂",
  FOLLOW_UP: "🔁",
};

interface TemplatePanelProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  error: string | null;
  onApply: (template: EmailTemplate) => void;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
  onClose: () => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({
  templates,
  isLoading,
  error,
  onApply,
  onEdit,
  onDelete,
  onClose,
}) => {
  return (
    <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Quick Templates</h3>
          <span className="text-[11px] font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
            {templates.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <SectionLoader size="sm" message="Loading templates…" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <FileText className="w-10 h-10 mb-2 text-gray-300" />
          <p className="text-sm font-medium">No templates yet</p>
          <p className="text-xs mt-0.5">Save your first email template to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {templates.map((t) => (
            <div
              key={t.id}
              className="relative group bg-white rounded-xl border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <button
                onClick={() => onApply(t)}
                className="w-full p-3.5 flex flex-col items-center gap-2 text-center"
              >
                <span className="text-2xl">
                  {CATEGORY_EMOJI[t.category] || "📧"}
                </span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-orange-700 line-clamp-2 leading-tight">
                  {t.name}
                </span>
              </button>
              <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(t);
                  }}
                  className="p-1 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  title="Edit"
                >
                  <Pen className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t);
                  }}
                  className="p-1 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { CATEGORY_EMOJI };
export default TemplatePanel;
