import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui";
import { CheckCircle2 } from "lucide-react";
import { EmailTemplate } from "../../types";
import toast from "react-hot-toast";
import { CATEGORY_EMOJI } from "./TemplatePanel";

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  values: Record<string, string>;
  emailType: string;
  onSave: (values: Record<string, string>, emailType: string) => void;
}

const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  template,
  values: initialValues,
  emailType: initialType,
  onSave,
}) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [emailType, setEmailType] = useState(initialType);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      setEmailType(initialType);
    }
  }, [isOpen, initialValues, initialType]);

  if (!template?.variables) return null;

  const handleSubmit = () => {
    const missing = template.variables!.filter(
      (v) => v.required && !values[v.name]?.trim(),
    );
    if (missing.length > 0) {
      toast.error(`Please fill: ${missing.map((m) => m.name).join(", ")}`);
      return;
    }
    onSave(values, emailType);
    onClose();
    toast.success("Variables saved");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fill Template Variables" size="md">
      <div className="px-1">
        <p className="text-xs text-gray-400 px-5 -mt-1 mb-4">
          Customize values for "{template.name}"
        </p>

        <div className="px-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {template.variables.map((variable) => (
            <div key={variable.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {variable.name}
                {variable.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              {variable.description && (
                <p className="text-xs text-gray-400 mb-1.5">
                  {variable.description}
                </p>
              )}
              <input
                type="text"
                value={values[variable.name] || ""}
                onChange={(e) =>
                  setValues({ ...values, [variable.name]: e.target.value })
                }
                placeholder={`Enter ${variable.name}...`}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Type
            </label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
            >
              {Object.entries(CATEGORY_EMOJI).map(([key, emoji]) => (
                <option key={key} value={key}>
                  {emoji}{" "}
                  {key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 mt-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all shadow-md shadow-orange-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Variables
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VariableModal;
