import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Ban,
  AlertTriangle,
  Paperclip,
  Eye,
  Filter,
  User,
} from "lucide-react";
import { Card } from "../../ui";
import type { MatrixTask, MatrixCategory, MatrixStats } from "../../../types";
import { getCategoryTasks } from "../../../services/projectApi";
import { useAuth } from "../../../contexts/AuthContext";

interface CategoryTasksViewProps {
  categories: MatrixCategory[];
  stats: MatrixStats | null;
  matrixId: string;
  onTaskClick: (taskId: string, task?: MatrixTask) => void;
  onStatusChange: (
    taskId: string,
    newStatus: string,
    completionNotes?: string,
  ) => void;
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

export const CategoryTasksView: React.FC<CategoryTasksViewProps> = ({
  categories,
  stats,
  matrixId,
  onTaskClick,
  onStatusChange,
  updatingTaskId,
}) => {
  const { user } = useAuth();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || "",
  );
  const [tasks, setTasks] = useState<MatrixTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [completionDialog, setCompletionDialog] = useState<{
    taskId: string;
    notes: string;
  } | null>(null);

  const fetchCategoryTasks = useCallback(async () => {
    if (!selectedCategoryId) return;
    setLoading(true);
    try {
      const data = await getCategoryTasks(selectedCategoryId, matrixId);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, matrixId]);

  useEffect(() => {
    fetchCategoryTasks();
  }, [fetchCategoryTasks]);

  const selectedCat = categories.find((c) => c.id === selectedCategoryId);

  const filteredTasks = filterStatus
    ? tasks.filter((t) => t.status === filterStatus)
    : tasks;

  // Group by day
  const tasksByDay: Record<number, MatrixTask[]> = {};
  for (const task of filteredTasks) {
    if (!tasksByDay[task.dayNumber]) tasksByDay[task.dayNumber] = [];
    tasksByDay[task.dayNumber].push(task);
  }
  const sortedDays = Object.keys(tasksByDay)
    .map(Number)
    .sort((a, b) => a - b);

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
  };

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => {
          const isActive = cat.id === selectedCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setFilterStatus(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                isActive
                  ? "shadow-sm text-white"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              style={
                isActive
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : undefined
              }
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-white/40" : ""}`}
                style={!isActive ? { backgroundColor: cat.color } : undefined}
              />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Category stats bar */}
      {selectedCat && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-gray-900">{taskStats.total}</p>
            <p className="text-[10px] text-gray-500 font-medium">Total Tasks</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-green-600">
              {taskStats.completed}
            </p>
            <p className="text-[10px] text-green-500 font-medium">Completed</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-blue-600">
              {taskStats.inProgress}
            </p>
            <p className="text-[10px] text-blue-500 font-medium">In Progress</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-amber-600">
              {taskStats.pending}
            </p>
            <p className="text-[10px] text-amber-500 font-medium">Pending</p>
          </div>
        </div>
      )}

      {/* Progress bar for this category */}
      {taskStats.total > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                {selectedCat?.name} Progress
              </span>
              {selectedCat?.assignedTo &&
                selectedCat.assignedTo !== "unassigned" && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {selectedCat.assignedTo.replace(/-/g, " ")}
                  </span>
                )}
            </div>
            <span className="text-xs font-bold text-gray-700">
              {Math.round((taskStats.completed / taskStats.total) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(taskStats.completed / taskStats.total) * 100}%`,
                backgroundColor: selectedCat?.color || "#f97316",
              }}
            />
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <div className="flex gap-1">
          {[
            { key: null, label: "All" },
            { key: "PENDING", label: "Pending" },
            { key: "IN_PROGRESS", label: "In Progress" },
            { key: "COMPLETED", label: "Completed" },
          ].map((f) => (
            <button
              key={f.key || "all"}
              onClick={() => setFilterStatus(f.key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                filterStatus === f.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks by day */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="ml-2 text-sm text-gray-500">Loading tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8 italic">
          {tasks.length === 0
            ? "No tasks in this category yet."
            : "No tasks match the selected filter."}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedDays.map((dayNum) => {
            const dayTasks = tasksByDay[dayNum];
            return (
              <Card
                key={dayNum}
                className="bg-white/80 border-gray-200/50 shadow-sm p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                    {dayNum}
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    Day {dayNum}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="space-y-1">
                  {dayTasks.map((task) => {
                    const cfg =
                      taskStatusConfig[task.status] || taskStatusConfig.PENDING;
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <div key={task.id} className="rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 transition-colors group">
                          <span className={`flex-shrink-0 ${cfg.text}`}>
                            {cfg.icon}
                          </span>

                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => onTaskClick(task.id, task)}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p
                                className={`text-sm font-medium ${
                                  task.status === "COMPLETED"
                                    ? "text-gray-400 line-through"
                                    : "text-gray-900"
                                }`}
                              >
                                {task.title}
                              </p>
                              {/* "Mine" badge for tasks assigned to current user */}
                              {user?.id &&
                                (task.assignedToId ?? task.assignedTo?.id) ===
                                  user.id && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                    <User className="w-2.5 h-2.5" />
                                    Mine
                                  </span>
                                )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-400 truncate">
                                {task.description}
                              </p>
                            )}
                            {task.completionNotes && (
                              <p className="text-xs text-green-600 italic mt-0.5">
                                ✓ {task.completionNotes}
                              </p>
                            )}
                          </div>

                          {task._count && task._count.attachments > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              <Paperclip className="w-2.5 h-2.5" />
                              {task._count.attachments}
                            </span>
                          )}

                          <button
                            onClick={() => onTaskClick(task.id, task)}
                            className="p-1 text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                          ) : (
                            <select
                              value={task.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (newStatus === "COMPLETED") {
                                  setCompletionDialog({
                                    taskId: task.id,
                                    notes: "",
                                  });
                                } else {
                                  setCompletionDialog(null);
                                  onStatusChange(task.id, newStatus);
                                }
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
                        {/* Inline completion notes prompt */}
                        {completionDialog?.taskId === task.id && (
                          <div className="px-2 pb-3 pt-2 bg-green-50 border-t border-green-100">
                            <p className="text-[11px] font-semibold text-green-700 mb-1.5">
                              Completion Notes{" "}
                              <span className="text-red-500">*</span>
                            </p>
                            <div className="flex gap-2">
                              <input
                                autoFocus
                                type="text"
                                value={completionDialog.notes}
                                onChange={(e) =>
                                  setCompletionDialog({
                                    taskId: task.id,
                                    notes: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    completionDialog.notes.trim()
                                  ) {
                                    onStatusChange(
                                      task.id,
                                      "COMPLETED",
                                      completionDialog.notes,
                                    );
                                    setCompletionDialog(null);
                                  }
                                  if (e.key === "Escape") {
                                    setCompletionDialog(null);
                                  }
                                }}
                                placeholder="e.g. Site survey completed, all measurements taken"
                                className="flex-1 text-xs border border-green-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400/40 bg-white"
                              />
                              <button
                                type="button"
                                disabled={!completionDialog.notes.trim()}
                                onClick={() => {
                                  onStatusChange(
                                    task.id,
                                    "COMPLETED",
                                    completionDialog.notes,
                                  );
                                  setCompletionDialog(null);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                                  completionDialog.notes.trim()
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                Done
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletionDialog(null);
                                }}
                                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Day-level stats from matrix stats */}
      {stats && stats.dayStats && stats.dayStats.length > 0 && (
        <Card className="bg-white/80 border-gray-200/50 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Day-wise Progress Overview
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {stats.dayStats.map((ds) => {
              const pct =
                ds.total > 0 ? Math.round((ds.completed / ds.total) * 100) : 0;
              return (
                <div
                  key={ds.dayNumber}
                  className="text-center group relative"
                  title={`Day ${ds.dayNumber}: ${ds.completed}/${ds.total} done`}
                >
                  <div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      pct === 100
                        ? "bg-green-100 text-green-700"
                        : pct > 0
                          ? "bg-blue-50 text-blue-700"
                          : ds.total > 0
                            ? "bg-amber-50 text-amber-600"
                            : "bg-gray-50 text-gray-300"
                    }`}
                  >
                    {ds.dayNumber}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-green-100" /> Complete
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-50" /> Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-50" /> Not started
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-gray-50" /> No tasks
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};
