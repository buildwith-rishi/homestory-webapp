import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Calendar, FileText } from "lucide-react";
import { Button } from "../../ui";
import type { MatrixCategory } from "../../../types";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

interface NewTaskModalProps {
  matrixId: string;
  dayNumber: number;
  startDate: string;
  categories: MatrixCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper to compute task date from day number
const getTaskDate = (startDate: string, dayNum: number): string => {
  // Handle ISO strings like "2026-02-11T00:00:00.000Z" and plain "2026-02-11"
  const dateOnly = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  const date = new Date(dateOnly + "T00:00:00");
  date.setDate(date.getDate() + (dayNum - 1));
  return date.toISOString();
};

// Helper to format date for display
const formatDateForDisplay = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  matrixId,
  dayNumber,
  startDate,
  categories,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taskDate = getTaskDate(startDate, dayNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    setSaving(true);
    try {
      // Create task via API
      const response = await fetch(
        `${API_BASE_URL}/api/matrices/${matrixId}/tasks`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            dayNumber,
            categoryId,
            title: title.trim(),
            description: description.trim() || undefined,
            taskDate,
            status: "PENDING",
          }),
        },
      );

      if (!response.ok) {
        let errorMessage = `Failed to create task: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success("Task created successfully");
      onSuccess();
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to create task";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Day {dayNumber} • {formatDateForDisplay(taskDate)}
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
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Enter task title..."
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              placeholder="Add task description..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                  {cat.assignedTo && cat.assignedTo !== "unassigned"
                    ? ` (${cat.assignedTo.replace(/-/g, " ")})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Task Date Info */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                This task will be scheduled for <strong>Day {dayNumber}</strong>{" "}
                on <strong>{formatDateForDisplay(taskDate)}</strong>
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
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
              <>
                <FileText className="w-4 h-4 mr-1" />
                Create Task
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
