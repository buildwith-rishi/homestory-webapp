import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui";
import { Plus, Trash2, Code, AlertCircle } from "lucide-react";
import { EmailTemplateVariable } from "../../types";

interface TemplateFormData {
  name: string;
  category: "ONBOARDING" | "PROJECT_UPDATE" | "PAYMENT" | "COMPLETION" | "OTHER";
  description: string;
  subject: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: TemplateFormData;
  initialVariables?: EmailTemplateVariable[];
  currentSubject?: string;
  onSave: (data: TemplateFormData, variables: EmailTemplateVariable[]) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  initialVariables,
  currentSubject,
  onSave,
}) => {
  const [formData, setFormData] = useState<TemplateFormData>(
    initialData || { name: "", category: "OTHER", description: "", subject: "" },
  );
  const [variables, setVariables] = useState<EmailTemplateVariable[]>(
    initialVariables || [],
  );

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          name: "",
          category: "OTHER",
          description: "",
          subject: currentSubject || "",
        },
      );
      setVariables(initialVariables || []);
    }
  }, [isOpen, initialData, initialVariables, currentSubject]);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.subject.trim()) return;
    const validVars = variables.filter((v) => v.name.trim() !== "");
    onSave(formData, validVars);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Save as Template" : "Edit Template"}
      size="lg"
    >
      <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
        {/* Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome Email"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as TemplateFormData["category"],
                })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
            >
              <option value="ONBOARDING">👋 Onboarding</option>
              <option value="PROJECT_UPDATE">🏗️ Project Update</option>
              <option value="PAYMENT">💳 Payment</option>
              <option value="COMPLETION">🎉 Completion</option>
              <option value="OTHER">📧 Other</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g., Welcome, {{customerName}}!"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
          />
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Code className="w-3 h-3" />
            {"Use {{variableName}} for dynamic placeholders"}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of when to use this template"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm resize-none transition-colors"
          />
        </div>

        {/* Template Variables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Template Variables
            </label>
            <button
              onClick={() =>
                setVariables([
                  ...variables,
                  { name: "", required: false, description: "" },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Variable
            </button>
          </div>

          {variables.length === 0 ? (
            <div className="text-center py-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Code className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400">No variables defined</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) => {
                      const u = [...variables];
                      u[index] = { ...u[index], name: e.target.value };
                      setVariables(u);
                    }}
                    placeholder="Name"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none bg-white transition-colors" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                  />
                  <input
                    type="text"
                    value={variable.description || ""}
                    onChange={(e) => {
                      const u = [...variables];
                      u[index] = { ...u[index], description: e.target.value };
                      setVariables(u);
                    }}
                    placeholder="Description"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none bg-white transition-colors"
                  />
                  <label className="flex items-center gap-1.5 px-2 text-xs text-gray-500 whitespace-nowrap cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => {
                        const u = [...variables];
                        u[index] = { ...u[index], required: e.target.checked };
                        setVariables(u);
                      }}
                      className="rounded text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
                    />
                    Req
                  </label>
                  <button
                    onClick={() =>
                      setVariables(variables.filter((_, i) => i !== index))
                    }
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Template Content</p>
            <p className="text-amber-700 mt-0.5 text-xs leading-relaxed">
              {mode === "create"
                ? "The current editor content will be saved as the template body."
                : "Saving will update the template with the current editor content."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || !formData.subject.trim()}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === "create" ? "Create Template" : "Update Template"}
        </button>
      </div>
    </Modal>
  );
};

export type { TemplateFormData };
export default TemplateModal;
