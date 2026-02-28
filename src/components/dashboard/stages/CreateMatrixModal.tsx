import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Plus, Trash2, Calendar, User, ListChecks } from "lucide-react";
import { Button } from "../../ui";
import type { CreateMatrixRequest, AdminUser } from "../../../types";
import { createTaskMatrix } from "../../../services/projectApi";
import { adminAPI } from "../../../services/api";

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
  const [totalDays, setTotalDays] = useState(1);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  // Inline tasks
  const [tasks, setTasks] = useState<
    { title: string; description: string; dayNumber: number }[]
  >([]);

  useEffect(() => {
    adminAPI.getAllUsers().then((res: unknown) => {
      if (res && typeof res === "object" && "users" in res && Array.isArray((res as { users: AdminUser[] }).users)) {
        setUsers((res as { users: AdminUser[] }).users);
      } else if (Array.isArray(res)) {
        setUsers(res as AdminUser[]);
      }
    }).catch(() => {});
  }, []);

  const addCategory = () => {
    const nextColor = DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length];
    setCategories((prev) => [
      ...prev,
      {
        name: "",
        orderIndex: prev.length,
        color: nextColor,
        assignedTo: "unassigned",
      },
    ]);
  };

  const updateCategory = (
    idx: number,
    field: "name" | "color" | "assignedTo",
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

  const addTask = () =>
    setTasks((prev) => [...prev, { title: "", description: "", dayNumber: 1 }]);

  const updateTask = (
    idx: number,
    field: "title" | "description" | "dayNumber",
    value: string | number,
  ) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    );
  };

  const removeTask = (idx: number) =>
    setTasks((prev) => prev.filter((_, i) => i !== idx));

  // Compute task date from startDate + (dayNumber - 1)
  const getTaskDate = (dayNum: number): string => {
    const date = new Date(startDate + "T00:00:00");
    date.setDate(date.getDate() + (dayNum - 1));
    return date.toISOString();
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

    const validTasks = tasks
      .filter((t) => t.title.trim())
      .map((t) => ({
        dayNumber: t.dayNumber,
        title: t.title.trim(),
        description: t.description.trim() || undefined,
        taskDate: getTaskDate(t.dayNumber),
      }));

    setSaving(true);
    try {
      const data: CreateMatrixRequest = {
        totalDays,
        startDate,
        categories: validCategories,
        tasks: validTasks,
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
            <p className="text-xs text-gray-500 mt-0.5">
              Stage: {stageName} • Plan one day at a time
            </p>
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
                Number of Days
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Recommended: Create 1 day at a time
              </p>
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

            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
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

                  {/* Assigned To */}
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <select
                      value={cat.assignedTo || ""}
                      onChange={(e) =>
                        updateCategory(idx, "assignedTo", e.target.value)
                      }
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white text-gray-700"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 border border-blue-200">
            <p className="font-medium mb-1">Plan Summary:</p>
            <p>
              • Creating{" "}
              <strong>
                {totalDays} day{totalDays > 1 ? "s" : ""}
              </strong>{" "}
              starting{" "}
              <strong>
                {new Date(startDate + "T00:00:00").toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
              <br />•{" "}
              <strong>
                {categories.filter((c) => c.name.trim()).length} work categories
              </strong>
              {tasks.filter((t) => t.title.trim()).length > 0 && (
                <>
                  <br />•{" "}
                  <strong>{tasks.filter((t) => t.title.trim()).length} initial task{tasks.filter((t) => t.title.trim()).length !== 1 ? "s" : ""}</strong>
                </>
              )}
              {totalDays === 1 && " (recommended daily approach)"}
            </p>
          </div>

          {/* Initial Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-gray-400" />
                Initial Tasks
                <span className="text-[10px] font-normal text-gray-400">(optional)</span>
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

            {tasks.length === 0 ? (
              <button
                type="button"
                onClick={addTask}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add tasks to pre-populate this plan
              </button>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(idx, "title", e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="Task title..."
                      />
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-gray-400">Day</label>
                        <input
                          type="number"
                          min={1}
                          max={totalDays}
                          value={task.dayNumber}
                          onChange={(e) => updateTask(idx, "dayNumber", Math.min(totalDays, Math.max(1, Number(e.target.value))))}
                          className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTask(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => updateTask(idx, "description", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="Description (optional)..."
                    />
                  </div>
                ))}
              </div>
            )}
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
