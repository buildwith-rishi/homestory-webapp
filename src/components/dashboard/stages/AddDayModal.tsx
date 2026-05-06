import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Plus, Calendar, Hash, ChevronRight } from "lucide-react";
import { Button } from "../../ui";
import { updateMatrix } from "../../../services/projectApi";
import toast from "react-hot-toast";

interface AddDayModalProps {
  matrixId: string;
  currentTotalDays: number;
  startDate: string | null;
  stageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const parseDate = (value?: string | null) => {
  if (typeof value !== "string") return new Date(NaN);
  const trimmed = value.trim();
  if (!trimmed) return new Date(NaN);
  const dateOnly = trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;
  return new Date(dateOnly + "T00:00:00");
};

export const AddDayModal: React.FC<AddDayModalProps> = ({
  matrixId,
  currentTotalDays,
  startDate,
  stageName,
  onClose,
  onSuccess,
}) => {
  const [daysToAdd, setDaysToAdd] = useState(1);
  const [saving, setSaving] = useState(false);

  const newTotal = currentTotalDays + daysToAdd;

  const getDateForDay = (dayNum: number): string => {
    const d = parseDate(startDate);
    if (isNaN(d.getTime())) return "—";
    d.setDate(d.getDate() + (dayNum - 1));
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (daysToAdd < 1) return;
    setSaving(true);
    try {
      await updateMatrix(matrixId, { totalDays: newTotal });
      toast.success(
        `${daysToAdd} day${daysToAdd !== 1 ? "s" : ""} added — plan now has ${newTotal} days`,
      );
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add days");
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Days</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">{stageName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Days to add */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Hash className="w-4 h-4 text-gray-400" />
                Days to Add
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={daysToAdd}
                onChange={(e) =>
                  setDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Current plan:{" "}
                <span className="font-medium text-gray-600">
                  {currentTotalDays} days
                </span>
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium">Current</p>
                  <p className="text-2xl font-bold text-gray-700 mt-0.5">
                    {currentTotalDays}
                  </p>
                  <p className="text-[10px] text-gray-400">days</p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400" />
                <div className="text-center">
                  <p className="text-xs text-orange-600 font-medium">
                    New Total
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-0.5">
                    {newTotal}
                  </p>
                  <p className="text-[10px] text-orange-500">days</p>
                </div>
              </div>

              {/* Date range preview */}
              <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Day {currentTotalDays + 1}:{" "}
                  {getDateForDay(currentTotalDays + 1)}
                </span>
                {daysToAdd > 1 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Day {newTotal}: {getDateForDay(newTotal)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || daysToAdd < 1}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add {daysToAdd} Day{daysToAdd !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
