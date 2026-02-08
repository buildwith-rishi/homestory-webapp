import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Ban,
  AlertTriangle,
  Filter,
  Eye,
  Paperclip,
} from "lucide-react";
import { Card } from "../../ui";
import type { MatrixTask, MatrixCategory } from "../../../types";
import {
  getMatrixDayTasks,
  getCategoryTasks,
} from "../../../services/projectApi";

interface DayTasksPanelProps {
  matrixId: string;
  dayNumber: number;
  startDate: string;
  categories: MatrixCategory[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  updatingTaskId: string | null;
}

const taskStatusConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; label: string }
> = {
  PENDING: {
    icon: <Circle className="w-3.5 h-3.5" />,
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Pending",
  },
  IN_PROGRESS: {
    icon: <Clock className="w-3.5 h-3.5" />,
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "In Progress",
  },
  COMPLETED: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Completed",
  },
  CANCELLED: {
    icon: <Ban className="w-3.5 h-3.5" />,
    bg: "bg-red-50",
    text: "text-red-500",
    label: "Cancelled",
  },
  OVERDUE: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Overdue",
  },
};

const getDateForDay = (startDate: string, dayNumber: number) => {
  const d = new Date(startDate + "T00:00:00");
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const DayTasksPanel: React.FC<DayTasksPanelProps> = ({
  matrixId,
  dayNumber,
  startDate,
  categories,
  onTaskClick,
  onStatusChange,
  updatingTaskId,
}) => {
  const [tasks, setTasks] = useState<MatrixTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const fetchDayTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMatrixDayTasks(matrixId, dayNumber);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [matrixId, dayNumber]);

  useEffect(() => {
    fetchDayTasks();
  }, [fetchDayTasks]);

  const filteredTasks = tasks.filter((t) => {
    if (
      filterCategory &&
      t.categoryId !== filterCategory &&
      t.category?.name !== filterCategory
    ) {
      return false;
    }
    if (filterStatus && t.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Group by category
  const tasksByCategory: Record<string, MatrixTask[]> = {};
  for (const task of filteredTasks) {
    const catName = task.category?.name || "Uncategorized";
    if (!tasksByCategory[catName]) tasksByCategory[catName] = [];
    tasksByCategory[catName].push(task);
  }

  const statusCounts = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        <span className="ml-2 text-sm text-gray-500">Loading day tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day summary header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Day {dayNumber} — {getDateForDay(startDate, dayNumber)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {statusCounts.completed}/{statusCounts.total} completed
            {statusCounts.inProgress > 0 &&
              ` · ${statusCounts.inProgress} in progress`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Status filter */}
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          {/* Category filter */}
          {categories.length > 1 && (
            <select
              value={filterCategory || ""}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-gray-900">
            {statusCounts.total}
          </p>
          <p className="text-[10px] text-gray-400 font-medium">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-green-600">
            {statusCounts.completed}
          </p>
          <p className="text-[10px] text-green-500 font-medium">Done</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-600">
            {statusCounts.inProgress}
          </p>
          <p className="text-[10px] text-blue-500 font-medium">In Progress</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-amber-600">
            {statusCounts.pending}
          </p>
          <p className="text-[10px] text-amber-500 font-medium">Pending</p>
        </div>
      </div>

      {/* Tasks grouped by category */}
      {filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 italic">
          {tasks.length === 0
            ? "No tasks for this day yet."
            : "No tasks match the selected filters."}
        </p>
      ) : (
        <div className="space-y-3">
          {Object.entries(tasksByCategory).map(([catName, catTasks]) => {
            const cat = categories.find((c) => c.name === catName);
            const catColor = cat?.color || "#6b7280";

            return (
              <div key={catName}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: catColor }}
                  />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {catName}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({catTasks.length})
                  </span>
                </div>

                {/* Task rows */}
                <div className="space-y-1">
                  {catTasks.map((task) => {
                    const cfg =
                      taskStatusConfig[task.status] || taskStatusConfig.PENDING;
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        {/* Status icon */}
                        <span className={`flex-shrink-0 ${cfg.text}`}>
                          {cfg.icon}
                        </span>

                        {/* Task info */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => onTaskClick(task.id)}
                        >
                          <p
                            className={`text-sm font-medium ${
                              task.status === "COMPLETED"
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                          {task.completionNotes && (
                            <p className="text-xs text-green-600 italic mt-0.5">
                              ✓ {task.completionNotes}
                            </p>
                          )}
                        </div>

                        {/* Attachment badge */}
                        {task._count && task._count.attachments > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            <Paperclip className="w-2.5 h-2.5" />
                            {task._count.attachments}
                          </span>
                        )}

                        {/* View detail */}
                        <button
                          onClick={() => onTaskClick(task.id)}
                          className="p-1 text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Status dropdown */}
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        ) : (
                          <select
                            value={task.status}
                            onChange={(e) => {
                              onStatusChange(task.id, e.target.value);
                            }}
                            className={`text-xs px-2 py-1 rounded-md border-0 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 ${cfg.bg} ${cfg.text}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="OVERDUE">Overdue</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
