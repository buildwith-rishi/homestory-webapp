import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Tag, Check } from "lucide-react";
import { addMatrixCategory } from "../../../services/projectApi";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#14b8a6", label: "Teal" },
  { hex: "#a855f7", label: "Purple" },
  { hex: "#64748b", label: "Slate" },
  { hex: "#d97706", label: "Yellow" },
];

interface AddCategoryModalProps {
  matrixId: string;
  /** Current number of categories — used to auto-set orderIndex */
  currentCategoryCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  matrixId,
  currentCategoryCount,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(
    PRESET_COLORS[currentCategoryCount % PRESET_COLORS.length].hex,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    try {
      await addMatrixCategory(matrixId, {
        name: trimmedName,
        orderIndex: currentCategoryCount,
        color,
      });
      toast.success(`Category "${trimmedName}" added`);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add category";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Add Category
              </h3>
              <p className="text-xs text-gray-400">
                New work category for this matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Preview chip */}
          <div className="flex items-center justify-center">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-sm"
              style={{ backgroundColor: color }}
            >
              <div className="w-2 h-2 rounded-full bg-white/70" />
              {name.trim() || "Category Name"}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="e.g. Plumbing, Electrical, Design…"
              required
              autoFocus
              maxLength={80} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>

            {/* Preset swatches */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  title={preset.label}
                  onClick={() => setColor(preset.hex)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all ${
                    color === preset.hex
                      ? "border-gray-800 scale-110 shadow-sm"
                      : "border-transparent hover:border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {color === preset.hex && (
                    <Check
                      className="w-3 h-3 text-white mx-auto"
                      strokeWidth={3}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Custom color picker row */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0 shadow-inner"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-0.5 block">
                  Custom hex
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer flex-shrink-0"
                    title="Pick custom color"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setColor(val);
                    }}
                    className="flex-1 px-2.5 py-1 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="#3b82f6"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order index info */}
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>Will be added as category #{currentCategoryCount + 1}</span>
          </p>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                Add Category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
