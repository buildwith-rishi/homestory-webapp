import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "../../ui";
import type { MatrixCategory } from "../../../types";
import { createTaskMatrix } from "../../../services/projectApi";
import toast from "react-hot-toast";

interface AddDayModalProps {
  projectId: string;
  stageId: string;
  currentTotalDays: number;
  startDate: string;
  categories: MatrixCategory[];
  stageName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDayModal: React.FC<AddDayModalProps> = ({
  projectId,
  stageId,
  currentTotalDays,
  startDate,
  categories,
  stageName,
  onClose,
  onSuccess,
}) => {
  const newDayNumber = currentTotalDays + 1;

  // Helper to compute task date from day number
  const getTaskDate = (dayNum: number): string => {
    const dateOnly = startDate.includes("T")
      ? startDate.split("T")[0]
      : startDate;
    const date = new Date(dateOnly + "T00:00:00");
    date.setDate(date.getDate() + (dayNum - 1));
    return date.toISOString();
  };

  // Helper to format ISO date for display
  const formatDateForDisplay = (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const [tasks, setTasks] = useState<
    {
      title: string;
      description: string;
      categoryId: string;
    }[]
  >([
    {
      title: "",
      description: "",
      categoryId: categories[0]?.id || "",
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        categoryId: categories[0]?.id || "",
      },
    ]);
  };

  const updateTask = (
    idx: number,
    field: "title" | "description" | "categoryId",
    value: string,
  ) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    );
  };

  const removeTask = (idx: number) => {
    if (tasks.length === 1) {
      toast.error("Keep at least one task");
      return;
    }
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate tasks
    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      setError("Add at least one task with a title");
      return;
    }
    setSaving(true);
    try {
      const dayDate = getTaskDate(newDayNumber);

      // Build payload to extend matrix and add tasks in a single call
      const payload = {
        totalDays: newDayNumber,
        startDate,
        categories: categories.map((c) => ({
          name: c.name,
          orderIndex: c.orderIndex,
          color: c.color,
          ...(c.assignedTo ? { assignedTo: c.assignedTo } : {}),
        })),
        tasks: validTasks.map((task) => ({
          dayNumber: newDayNumber,
          categoryId: task.categoryId,
          title: task.title,
          description: task.description || undefined,
          taskDate: dayDate,
        })),
      };

      await createTaskMatrix(projectId, stageId, payload, false);

      toast.success(
        `Day ${newDayNumber} added with ${validTasks.length} task${validTasks.length !== 1 ? "s" : ""}`,
      );
      onSuccess();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to add day";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Add Day {newDayNumber}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {stageName} • {formatDateForDisplay(getTaskDate(newDayNumber))}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Tasks for Day {newDayNumber}
                </label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addTask}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Task Title */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Task Title *
                          </label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) =>
                              updateTask(idx, "title", e.target.value)
                            }
                            placeholder="Enter task title"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>

                        {/* Task Description */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <textarea
                            value={task.description}
                            onChange={(e) =>
                              updateTask(idx, "description", e.target.value)
                            }
                            placeholder="Optional description"
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Category *
                          </label>
                          <select
                            value={task.categoryId}
                            onChange={(e) =>
                              updateTask(idx, "categoryId", e.target.value)
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeTask(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-5"
                        title="Remove task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-medium">ℹ️ Adding Day {newDayNumber}</p>
              <p className="mt-1 text-blue-600">
                This will add a new day to your plan and create all the tasks
                you've specified above.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
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
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Adding Day...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Day {newDayNumber}
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
