import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Calendar, Hash, Settings } from "lucide-react";
import { Button } from "../../ui";
import type { UpdateMatrixRequest } from "../../../types";
import { updateMatrix } from "../../../services/projectApi";
import toast from "react-hot-toast";

interface EditMatrixModalProps {
  matrixId: string;
  currentTotalDays: number;
  currentStartDate: string | null;
  currentIncludeSundays?: boolean;
  stageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const toDateOnly = (value?: string | null): string => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;
};

const formatDateOnly = (value: string): string => {
  const parsed = new Date(value + "T00:00:00");
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const EditMatrixModal: React.FC<EditMatrixModalProps> = ({
  matrixId,
  currentTotalDays,
  currentStartDate,
  currentIncludeSundays = false,
  stageName,
  onClose,
  onSuccess,
}) => {
  const currentStartDateOnly = toDateOnly(currentStartDate);

  const [totalDays, setTotalDays] = useState(currentTotalDays);
  const [startDate, setStartDate] = useState(currentStartDateOnly);
  const [includeSundays, setIncludeSundays] = useState(currentIncludeSundays);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    totalDays !== currentTotalDays ||
    startDate !== currentStartDateOnly ||
    includeSundays !== currentIncludeSundays;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const data: UpdateMatrixRequest = {};
      if (totalDays !== currentTotalDays) data.totalDays = totalDays;
      if (startDate !== currentStartDateOnly) data.startDate = startDate;
      if (includeSundays !== currentIncludeSundays)
        data.includeSundays = includeSundays;

      await updateMatrix(matrixId, data);
      toast.success("Day plan settings updated");
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit Day Plan Settings
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Add more days or adjust dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-500">
            Update settings for the day plan of{" "}
            <span className="font-semibold text-gray-700">{stageName}</span>.
          </p>

          {/* Total Days */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <Hash className="w-4 h-4 text-gray-400" />
              Total Working Days
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={totalDays}
              onChange={(e) =>
                setTotalDays(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            />
            <p className="text-xs text-gray-400 mt-1">
              Current: {currentTotalDays} days.
              {totalDays > currentTotalDays && (
                <span className="text-green-600 ml-1">
                  +{totalDays - currentTotalDays} day
                  {totalDays - currentTotalDays !== 1 ? "s" : ""} will be added
                </span>
              )}
              {totalDays < currentTotalDays && (
                <span className="text-amber-600 ml-1">
                  {currentTotalDays - totalDays} day
                  {currentTotalDays - totalDays !== 1 ? "s" : ""} will be
                  removed (tasks on those days may be lost)
                </span>
              )}
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            />
            {startDate &&
              startDate !== currentStartDateOnly && (
                <p className="text-xs text-amber-600 mt-1">
                  Changing the start date will shift all day dates accordingly.
                </p>
              )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
              <input
                type="checkbox"
                checked={includeSundays}
                onChange={(e) => setIncludeSundays(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              Include Sundays in plan schedule
            </label>
            <p className="text-xs text-gray-400">
              {includeSundays
                ? "Sunday will be counted as a working day in this plan."
                : "Sunday will be skipped in this plan."}
            </p>
          </div>

          {/* Summary */}
          {hasChanges && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-medium text-orange-800">
                Changes will be applied:
              </p>
              <ul className="text-xs text-orange-700 mt-1 space-y-0.5">
                {totalDays !== currentTotalDays && (
                  <li>
                    • Total days: {currentTotalDays} → {totalDays}
                  </li>
                )}
                {startDate !== currentStartDateOnly && (
                  <li>
                    • Start date: {formatDateOnly(currentStartDateOnly)} →{" "}
                    {formatDateOnly(startDate)}
                  </li>
                )}
                {includeSundays !== currentIncludeSundays && (
                  <li>
                    • Sundays: {currentIncludeSundays ? "Included" : "Excluded"} → {includeSundays ? "Included" : "Excluded"}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
