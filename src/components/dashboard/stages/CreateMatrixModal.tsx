import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "../../ui";
import type { CreateMatrixRequest } from "../../../types";
import { createTaskMatrix } from "../../../services/projectApi";

interface CreateMatrixModalProps {
  projectId: string;
  stageId: string;
  stageCode: string;
  stageTemplateId: string | null;
  stageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export const CreateMatrixModal: React.FC<CreateMatrixModalProps> = ({
  projectId,
  stageId,
  stageCode,
  stageTemplateId,
  stageName,
  onClose,
  onSuccess,
}) => {
  const [totalDays, setTotalDays] = useState(7);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [categories, setCategories] = useState<
    { name: string; orderIndex: number; color: string }[]
  >([
    { name: "Design", orderIndex: 0, color: "#3b82f6" },
    { name: "Civil", orderIndex: 1, color: "#22c55e" },
    { name: "Electrical", orderIndex: 2, color: "#f59e0b" },
  ]);
  const [tasks, setTasks] = useState<
    {
      dayNumber: number;
      title: string;
      description: string;
      taskDate: string;
    }[]
  >([
    {
      dayNumber: 1,
      title: "Site survey",
      description: "Initial site visit",
      taskDate: new Date(startDate + "T00:00:00").toISOString(),
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to compute task date from day number - returns full ISO-8601 DateTime
  const getTaskDate = (dayNum: number): string => {
    const date = new Date(startDate + "T00:00:00");
    date.setDate(date.getDate() + (dayNum - 1));
    return date.toISOString();
  };

  // Helper to format ISO date for display
  const formatDateForDisplay = (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const addTask = () => {
    const nextDay =
      tasks.length > 0
        ? Math.min(tasks[tasks.length - 1].dayNumber + 1, totalDays)
        : 1;
    setTasks((prev) => [
      ...prev,
      {
        dayNumber: nextDay,
        title: "",
        description: "",
        taskDate: getTaskDate(nextDay),
      },
    ]);
  };

  const updateTask = (
    idx: number,
    field: keyof (typeof tasks)[0],
    value: string | number,
  ) => {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== idx) return t;
        if (field === "dayNumber") {
          const dayNum = Number(value);
          return { ...t, dayNumber: dayNum, taskDate: getTaskDate(dayNum) };
        }
        return { ...t, [field]: value };
      }),
    );
  };

  const removeTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCategory = () => {
    const nextColor = DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length];
    setCategories((prev) => [
      ...prev,
      { name: "", orderIndex: prev.length, color: nextColor },
    ]);
  };

  const updateCategory = (
    idx: number,
    field: "name" | "color",
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );
  };

  const removeCategory = (idx: number) => {
    setCategories((prev) =>
      prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, orderIndex: i })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validCategories = categories.filter((c) => c.name.trim());
    if (validCategories.length === 0) {
      setError("Add at least one category");
      return;
    }
    if (totalDays < 1) {
      setError("Total days must be at least 1");
      return;
    }

    // Validate tasks
    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      setError("Add at least one task with a title");
      return;
    }

    // Ensure all tasks have valid day numbers
    const invalidDayTask = validTasks.find(
      (t) => t.dayNumber < 1 || t.dayNumber > totalDays,
    );
    if (invalidDayTask) {
      setError(`Task day must be between 1 and ${totalDays}`);
      return;
    }

    setSaving(true);
    try {
      const data: CreateMatrixRequest = {
        totalDays,
        startDate,
        categories: validCategories,
        tasks: validTasks.map((t) => ({
          dayNumber: t.dayNumber,
          title: t.title,
          description: t.description || undefined,
          taskDate: t.taskDate,
        })),
      };
      // Build candidate list with stageCode FIRST (backend expects stageCode).
      // Falls back to stageId (UUID) and stageTemplateId for robustness.
      const stageCandidates: string[] = [];
      if (stageCode) stageCandidates.push(stageCode);
      if (stageId && stageId !== stageCode) stageCandidates.push(stageId);
      if (
        stageTemplateId &&
        stageTemplateId !== stageCode &&
        stageTemplateId !== stageId
      ) {
        stageCandidates.push(stageTemplateId);
      }

      console.log("[CreateMatrix] stageCandidates:", stageCandidates);

      let lastError: unknown = null;
      for (const sid of stageCandidates) {
        try {
          console.log("[CreateMatrix] attempting with stageIdentifier:", sid);
          // Use createTaskMatrix with stage verification enabled (default)
          // This will automatically handle race conditions with retry logic
          await createTaskMatrix(projectId, sid, data, true);
          console.log("[CreateMatrix] success with stageIdentifier:", sid);
          onSuccess();
          return;
        } catch (innerErr) {
          lastError = innerErr;
          const msg =
            innerErr instanceof Error ? innerErr.message : String(innerErr);
          const lower = msg.toLowerCase();
          const is404 =
            lower.includes("404") ||
            lower.includes("not found") ||
            lower.includes("not_found");

          console.warn(
            `[CreateMatrix] failed with "${sid}":`,
            msg,
            is404 ? "(will try next candidate)" : "(non-404, stopping)",
          );

          // Try next candidate on 404, stop on other errors
          // Note: createTaskMatrix now has built-in retry logic, so repeated 404s
          // indicate a genuine missing stage, not a race condition
          if (is404) continue;
          break;
        }
      }
      const errMsg =
        lastError instanceof Error
          ? lastError.message
          : "Failed to create matrix";
      throw new Error(errMsg);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to create matrix";

      setError(errMsg);
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
          <div>
            <h3 className="text-lg font-bold text-gray-900">Create Day Plan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Stage: {stageName}</p>
          </div>
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

          {/* Duration & Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Days
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Work Categories
              </label>
              <button
                type="button"
                onClick={addCategory}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>

            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Color picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) =>
                        updateCategory(idx, "color", e.target.value)
                      }
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      title="Pick color"
                    />
                  </div>
                  {/* Name */}
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) =>
                      updateCategory(idx, "name", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder={`Category ${idx + 1}`}
                  />
                  {/* Order badge */}
                  <span className="text-[10px] text-gray-400 font-mono w-6 text-center">
                    #{idx + 1}
                  </span>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeCategory(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={categories.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Initial Tasks <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addTask}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <label className="text-xs text-gray-500">Day</label>
                      <input
                        type="number"
                        min={1}
                        max={totalDays}
                        value={task.dayNumber}
                        onChange={(e) =>
                          updateTask(idx, "dayNumber", Number(e.target.value))
                        }
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Title</label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) =>
                          updateTask(idx, "title", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="Task title"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTask(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-4"
                      disabled={tasks.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) =>
                        updateTask(idx, "description", e.target.value)
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    Task Date: {formatDateForDisplay(task.taskDate)}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                  At least one task is required. Click "Add Task" above.
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p>
              This will create a <strong>{totalDays}-day</strong> task plan
              starting{" "}
              <strong>
                {new Date(startDate + "T00:00:00").toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>{" "}
              with{" "}
              <strong>
                {categories.filter((c) => c.name.trim()).length} categories
              </strong>{" "}
              and{" "}
              <strong>
                {tasks.filter((t) => t.title.trim()).length} initial tasks
              </strong>
              .
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
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
                Creating...
              </>
            ) : (
              "Create Day Plan"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
