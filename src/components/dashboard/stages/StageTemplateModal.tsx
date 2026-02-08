import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui";
import type {
  StageTemplate,
  StageTemplatePhaseType,
  CreateStageTemplateRequest,
  UpdateStageTemplateRequest,
} from "../../../types";
import {
  createStageTemplate,
  updateStageTemplate,
  getStageTemplatePhaseTypes,
} from "../../../services/projectApi";

interface StageTemplateModalProps {
  template?: StageTemplate | null;
  existingCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const StageTemplateModal: React.FC<StageTemplateModalProps> = ({
  template,
  existingCount,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!template;

  const [code, setCode] = useState(template?.code || "");
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [phaseType, setPhaseType] = useState(template?.phaseType || "DESIGN");
  const [orderIndex, setOrderIndex] = useState(
    template?.orderIndex ?? existingCount + 1,
  );
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [pipelineType, setPipelineType] = useState(
    template?.pipelineType || "",
  );
  const [checklistItems, setChecklistItems] = useState<
    { key: string; label: string }[]
  >(template?.defaultChecklistItems || []);

  const [phaseTypes, setPhaseTypes] = useState<StageTemplatePhaseType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStageTemplatePhaseTypes()
      .then((res) => setPhaseTypes(res.phaseTypes))
      .catch(() => {
        // fallback
        setPhaseTypes([
          { value: "DESIGN", label: "Design Phase" },
          { value: "EXECUTION", label: "Execution Phase" },
        ]);
      });
  }, []);

  const handleCodeChange = (v: string) => {
    setCode(v.toUpperCase().replace(/[^A-Z0-9_]/g, ""));
  };

  const addChecklistItem = () => {
    setChecklistItems((prev) => [
      ...prev,
      { key: `item_${Date.now()}`, label: "" },
    ]);
  };

  const updateChecklistItem = (idx: number, label: string) => {
    setChecklistItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, label } : item)),
    );
  };

  const removeChecklistItem = (idx: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && !code.trim()) {
      setError("Code is required");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && template) {
        const updateData: UpdateStageTemplateRequest = {
          name: name.trim(),
          description: description.trim(),
          isActive,
        };
        await updateStageTemplate(template.id, updateData);
      } else {
        const createData: CreateStageTemplateRequest = {
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          phaseType,
          orderIndex,
          isActive,
          isDefault,
          pipelineType: pipelineType || null,
          defaultChecklistItems:
            checklistItems.filter((i) => i.label.trim()).length > 0
              ? checklistItems.filter((i) => i.label.trim())
              : undefined,
        };
        await createStageTemplate(createData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? "Edit Template" : "Create Stage Template"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Code (only on create) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="e.g. DESIGN_REVIEW"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Uppercase letters, numbers, and underscores only
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="e.g. Design Review"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              placeholder="Brief description of this stage..."
            />
          </div>

          {/* Phase Type */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phase Type
              </label>
              <div className="flex gap-2">
                {(phaseTypes.length > 0
                  ? phaseTypes
                  : [
                      { value: "DESIGN", label: "Design Phase" },
                      { value: "EXECUTION", label: "Execution Phase" },
                    ]
                ).map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setPhaseType(pt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                      phaseType === pt.value
                        ? "bg-orange-50 border-orange-300 text-orange-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Index & Pipeline Type row (only on create) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Index
                </label>
                <input
                  type="number"
                  min={1}
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pipeline Type
                </label>
                <select
                  value={pipelineType}
                  onChange={(e) => setPipelineType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Any Pipeline</option>
                  <option value="DESIGN_AND_EXECUTION">
                    Design &amp; Execution
                  </option>
                  <option value="DESIGN_ONLY">Design Only</option>
                </select>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            {!isEdit && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Default</span>
              </label>
            )}
          </div>

          {/* Checklist Items (only on create) */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Default Checklist Items
                </label>
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>
              {checklistItems.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No checklist items added
                </p>
              ) : (
                <div className="space-y-2">
                  {checklistItems.map((item, idx) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) =>
                          updateChecklistItem(idx, e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder={`Checklist item ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Template"
            ) : (
              "Create Template"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
