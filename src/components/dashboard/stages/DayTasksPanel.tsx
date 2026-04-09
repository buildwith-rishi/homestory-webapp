import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Ban,
  AlertTriangle,
  Eye,
  Paperclip,
  Plus,
  Calendar,
  User,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../../ui";
import type { MatrixTask, MatrixCategory, AdminUser } from "../../../types";
import { getMatrixDayTasks, uploadTaskAttachment } from "../../../services/projectApi";
import { adminAPI } from "../../../services/api";
import { getAllTeamMembers, TeamMember } from "../../../services/teamApi";
import { NewTaskModal } from "./NewTaskModal";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";

interface DayTasksPanelProps {
  matrixId: string;
  projectId: string;
  dayNumber: number;
  startDate: string | null;
  categories: MatrixCategory[];
  onTaskClick: (taskId: string, task?: MatrixTask) => void;
  onStatusChange: (
    taskId: string,
    newStatus: string,
    completionNotes?: string,
  ) => void;
  updatingTaskId: string | null;
  onDayDateUpdated?: () => void;
  /** Optional: Pass tasks directly instead of fetching */
  initialTasks?: MatrixTask[];
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

const toDateOnly = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;
};

const parseDate = (d?: string | null) => {
  const dateOnly = toDateOnly(d);
  if (!dateOnly) return new Date(NaN);
  return new Date(dateOnly + "T00:00:00");
};

const getDateForDay = (startDate: string | null, dayNumber: number) => {
  // Handle ISO strings like "2026-02-11T00:00:00.000Z" and plain "2026-02-11"
  const d = parseDate(startDate);
  if (isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PUSH_REASONS_KEY = "ghs_push_reasons";

/** Read all stored push reasons: { [taskId]: reason } */
function getPushReasons(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PUSH_REASONS_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Retrieve push reason for a specific task */
function getPushReason(taskId: string): string {
  return getPushReasons()[taskId] || "";
}

/**
 * Label for grouping tasks: prefer nested API category, else resolve by
 * categoryId from the matrix category list. "Uncategorized" only when the task
 * has no category assignment (no id and no nested name).
 */
function resolveTaskCategoryDisplayName(
  task: MatrixTask,
  matrixCategories: MatrixCategory[],
): string {
  const nested = task.category?.name?.trim();
  if (nested) return nested;

  const id = task.categoryId?.trim();
  if (id) {
    const fromMatrix = matrixCategories.find((c) => c.id === id);
    if (fromMatrix?.name?.trim()) return fromMatrix.name.trim();
  }

  return "Uncategorized";
}

export const DayTasksPanel: React.FC<DayTasksPanelProps> = ({
  matrixId,
  projectId,
  dayNumber,
  startDate,
  categories,
  onTaskClick,
  onStatusChange,
  updatingTaskId,
  initialTasks,
}) => {
  const { user, roleId } = useAuth();

  // "My Tasks" filter: shows only tasks assigned to the current user.
  // Auto-enabled for DESIGNER and SITE_ENGINEER (field roles).
  const isFieldRole = roleId === "DESIGNER" || roleId === "SITE_ENGINEER";
  const [myTasksOnly, setMyTasksOnly] = useState(() => isFieldRole);

  const [tasks, setTasks] = useState<MatrixTask[]>(initialTasks || []);
  const [loading, setLoading] = useState(!initialTasks);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [completionDialog, setCompletionDialog] = useState<{
    taskId: string;
    prevStatus: string;
    notes: string;
    images: File[];
    previews: string[];
    uploading: boolean;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  /** Upload all staged images then commit the COMPLETED status change */
  const handleCompletionDone = async () => {
    if (!completionDialog) return;
    const { taskId, notes, images, previews } = completionDialog;
    setCompletionDialog((prev) => (prev ? { ...prev, uploading: true } : null));
    try {
      for (const file of images) {
        await uploadTaskAttachment(taskId, file, "PHOTO");
      }
      onStatusChange(taskId, "COMPLETED", notes);
      previews.forEach((url) => URL.revokeObjectURL(url));
      setCompletionDialog(null);
    } catch {
      toast.error("Failed to upload images. Please try again.");
      setCompletionDialog((prev) =>
        prev ? { ...prev, uploading: false } : null,
      );
    }
  };

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

  const formatDisplayDate = (isoDate?: string | null) => {
    const d = parseDate(isoDate);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const dayDisplayDate = (() => {
    const fromTask = tasks.find((t) => !!t.taskDate)?.taskDate;
    if (fromTask) return formatDisplayDate(fromTask);
    return getDateForDay(startDate, dayNumber);
  })();

  const getCurrentDayDateInput = (): string => {
    const fromTask = toDateOnly(tasks.find((t) => !!t.taskDate)?.taskDate);
    if (fromTask) return fromTask;

    const base = parseDate(startDate);
    if (isNaN(base.getTime())) return "";

    base.setDate(base.getDate() + dayNumber - 1);
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, "0");
    const day = String(base.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
      setLoading(false);
    } else {
      fetchDayTasks();
    }
  }, [fetchDayTasks, initialTasks]);

  // Fetch users and team members once so we can resolve assignee names by ID
  useEffect(() => {
    adminAPI
      .getAllUsers()
      .then((res: unknown) => {
        if (Array.isArray(res)) setUsers(res as AdminUser[]);
        else if (Array.isArray((res as { users: AdminUser[] }).users))
          setUsers((res as { users: AdminUser[] }).users);
      })
      .catch(() => {
        /* non-critical — assignee names just won't resolve */
      });

    getAllTeamMembers()
      .then((members) => setTeamMembers(members))
      .catch(() => {});
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory) {
      const selected = categories.find((c) => c.id === filterCategory);
      if (selected) {
        if (resolveTaskCategoryDisplayName(t, categories) !== selected.name) {
          return false;
        }
      } else if (
        t.categoryId !== filterCategory &&
        t.category?.name !== filterCategory
      ) {
        return false;
      }
    }
    if (filterStatus && t.status !== filterStatus) {
      return false;
    }
    // "My Tasks" filter: keep only tasks assigned to the current user
    if (myTasksOnly && user?.id) {
      const assignedId = t.assignedToId ?? t.assignedTo?.id;
      if (assignedId !== user.id) return false;
    }
    return true;
  });

  /** Helper: is this task assigned to the currently logged-in user? */
  const isMyTask = (task: MatrixTask): boolean => {
    if (!user?.id) return false;
    const assignedId = task.assignedToId ?? task.assignedTo?.id;
    return assignedId === user.id;
  };

  /** Resolve the display name for a task's assignee. */
  const getAssigneeName = (task: MatrixTask): string | null => {
    // 1. Prefer the nested object the API may return directly
    if (task.assignedTo?.name) return task.assignedTo.name;

    // 2. Collect every possible ID field the backend/API might use
    //    MatrixTask type uses assignedToId but Prisma FK may be assignedToUserId
    const t = task as unknown as Record<string, unknown>;
    const id =
      task.assignedToId ||
      (t.assignedToUserId as string | undefined) ||
      (t.assigned_to_user_id as string | undefined) ||
      (t.assignedTo as Record<string, string> | null)?.id ||
      null;

    if (!id) return null;

    // 3. User table lookup  (assignedToUserId path)
    const byUser = users.find((u) => u.id === id);
    if (byUser?.name) return byUser.name;

    // 4. TeamMember table lookup by PK  (assignedToMemberId path)
    const byMemberId = teamMembers.find((m) => m.id === id);
    if (byMemberId?.name) return byMemberId.name;

    // 5. TeamMember table lookup via User FK
    const byMemberUserId = teamMembers.find((m) => m.userId === id);
    if (byMemberUserId?.name) return byMemberUserId.name;

    return null;
  };

  // Group by category (resolve name from nested object or matrix categories by id)
  const tasksByCategory: Record<string, MatrixTask[]> = {};
  for (const task of filteredTasks) {
    const catName = resolveTaskCategoryDisplayName(task, categories);
    if (!tasksByCategory[catName]) tasksByCategory[catName] = [];
    tasksByCategory[catName].push(task);
  }

  const statusCounts = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    myTasks: user?.id
      ? tasks.filter((t) => (t.assignedToId ?? t.assignedTo?.id) === user.id)
          .length
      : 0,
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
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              Day {dayNumber}
            </p>
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />
              {dayDisplayDate}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {statusCounts.completed}/{statusCounts.total} completed
            {statusCounts.inProgress > 0 &&
              ` · ${statusCounts.inProgress} in progress`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Add Task button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewTaskModal(true)}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Task
          </Button>

          {/* My Tasks toggle */}
          <button
            onClick={() => setMyTasksOnly((v) => !v)}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
              myTasksOnly
                ? "bg-orange-100 text-orange-700 border-orange-300"
                : "bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600"
            }`}
            title="Toggle to show only tasks assigned to you"
          >
            <User className="w-3 h-3" />
            My Tasks
          </button>

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

      {/* "Assigned to me" callout — shown when the current user has tasks this day */}
      {statusCounts.myTasks > 0 && (
        <button
          onClick={() => setMyTasksOnly((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
            myTasksOnly
              ? "bg-orange-50 border-orange-300 text-orange-700"
              : "bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {statusCounts.myTasks} task{statusCounts.myTasks !== 1 ? "s" : ""}{" "}
            assigned to you today
          </span>
          <span className="text-[10px] opacity-70">
            {myTasksOnly ? "Show all" : "Show mine only"}
          </span>
        </button>
      )}

      {/* Tasks grouped by category */}
      {filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 italic">
          {tasks.length === 0
            ? "No tasks for this day yet."
            : myTasksOnly
              ? "No tasks assigned to you for this day."
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
                    const assigneeName = getAssigneeName(task);

                    return (
                      <div key={task.id} className="rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-gray-50 transition-colors group">
                          {/* Status icon */}
                          <span className={`flex-shrink-0 ${cfg.text}`}>
                            {cfg.icon}
                          </span>

                          {/* Task info */}
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
                              {isMyTask(task) && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                  <User className="w-2.5 h-2.5" />
                                  Mine
                                </span>
                              )}
                            </div>
                            {/* Assigned team member name */}
                            {assigneeName && (
                              <p className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5 mt-0.5">
                                <User className="w-2.5 h-2.5 flex-shrink-0" />
                                {assigneeName}
                              </p>
                            )}
                            {task.description && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {task.description}
                              </p>
                            )}
                            {task.taskDate && (
                              <p className="text-[10px] text-blue-500 mt-0.5">
                                📅{" "}
                                {new Date(task.taskDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            )}
                            {task.completionNotes && (
                              <p className="text-xs text-green-600 italic mt-0.5">
                                ✓ {task.completionNotes}
                              </p>
                            )}
                            {(() => {
                              const reason =
                                task.pushReason ||
                                task.reason ||
                                getPushReason(task.id);
                              return reason ? (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-1 inline-flex items-center gap-1">
                                  <span>🔄</span>
                                  <span className="font-medium">
                                    Rescheduled:
                                  </span>{" "}
                                  {reason}
                                </p>
                              ) : null;
                            })()}
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
                            onClick={() => onTaskClick(task.id, task)}
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
                                const newStatus = e.target.value;
                                setTasks((prev) =>
                                  prev.map((t) =>
                                    t.id === task.id
                                      ? { ...t, status: newStatus }
                                      : t,
                                  ),
                                );
                                if (newStatus === "COMPLETED") {
                                  setCompletionDialog({
                                    taskId: task.id,
                                    prevStatus: task.status,
                                    notes: "",
                                    images: [],
                                    previews: [],
                                    uploading: false,
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
                        {/* Inline completion: require photo(s) before saving */}
                        {completionDialog?.taskId === task.id && (
                          <div className="px-3 pb-3 pt-2 bg-green-50 border-t border-green-100">
                            {/* Hidden multi-image file input */}
                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const newPreviews = files.map((f) =>
                                  URL.createObjectURL(f),
                                );
                                setCompletionDialog((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        images: [...prev.images, ...files],
                                        previews: [
                                          ...prev.previews,
                                          ...newPreviews,
                                        ],
                                      }
                                    : null,
                                );
                                if (imageInputRef.current)
                                  imageInputRef.current.value = "";
                              }}
                            />

                            {/* Section header */}
                            <p className="text-[11px] font-semibold text-green-700 mb-2">
                              Complete Task{" "}
                              <span className="font-normal text-gray-500">
                                — photo(s) required{" "}
                                <span className="text-red-500">*</span>
                              </span>
                            </p>

                            {/* Image previews + add-more tile */}
                            {completionDialog.previews.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {completionDialog.previews.map((src, idx) => (
                                  <div
                                    key={idx}
                                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-green-200 flex-shrink-0"
                                  >
                                    <img
                                      src={src}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        URL.revokeObjectURL(src);
                                        setCompletionDialog((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                images: prev.images.filter(
                                                  (_, i) => i !== idx,
                                                ),
                                                previews: prev.previews.filter(
                                                  (_, i) => i !== idx,
                                                ),
                                              }
                                            : null,
                                        );
                                      }}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                      <X className="w-2.5 h-2.5 text-white" />
                                    </button>
                                  </div>
                                ))}
                                {/* Add more tile */}
                                <button
                                  type="button"
                                  onClick={() => imageInputRef.current?.click()}
                                  className="w-16 h-16 rounded-lg border-2 border-dashed border-green-300 flex flex-col items-center justify-center text-green-500 hover:border-green-400 hover:bg-green-100 transition-colors flex-shrink-0"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-[9px] mt-0.5">
                                    More
                                  </span>
                                </button>
                              </div>
                            ) : (
                              /* Empty state — big add button */
                              <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-green-300 rounded-lg py-3 mb-2 text-green-600 hover:border-green-400 hover:bg-green-100 transition-colors text-xs font-medium"
                              >
                                <Upload className="w-4 h-4" />
                                Add Photo(s)
                                <span className="text-red-500 text-[10px]">
                                  (required)
                                </span>
                              </button>
                            )}

                            {/* Notes + action row */}
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={completionDialog.notes}
                                onChange={(e) =>
                                  setCompletionDialog((prev) =>
                                    prev
                                      ? { ...prev, notes: e.target.value }
                                      : null,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    completionDialog.images.length > 0 &&
                                    !completionDialog.uploading
                                  ) {
                                    handleCompletionDone();
                                  }
                                  if (e.key === "Escape") {
                                    setTasks((prev) =>
                                      prev.map((t) =>
                                        t.id === task.id
                                          ? {
                                              ...t,
                                              status:
                                                completionDialog.prevStatus,
                                            }
                                          : t,
                                      ),
                                    );
                                    completionDialog.previews.forEach((url) =>
                                      URL.revokeObjectURL(url),
                                    );
                                    setCompletionDialog(null);
                                  }
                                }}
                                placeholder="Completion notes (Compulsory)"
                                className="flex-1 text-xs border border-green-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400/40 bg-white"
                              />
                              <button
                                type="button"
                                disabled={
                                  completionDialog.images.length === 0 ||
                                  completionDialog.uploading
                                }
                                onClick={handleCompletionDone}
                                title={
                                  completionDialog.images.length === 0
                                    ? "At least 1 photo required"
                                    : ""
                                }
                                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                                  completionDialog.images.length > 0 &&
                                  !completionDialog.uploading
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {completionDialog.uploading ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Uploading…
                                  </>
                                ) : (
                                  "Done"
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={completionDialog.uploading}
                                onClick={() => {
                                  setTasks((prev) =>
                                    prev.map((t) =>
                                      t.id === task.id
                                        ? {
                                            ...t,
                                            status: completionDialog.prevStatus,
                                          }
                                        : t,
                                    ),
                                  );
                                  completionDialog.previews.forEach((url) =>
                                    URL.revokeObjectURL(url),
                                  );
                                  setCompletionDialog(null);
                                }}
                                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-medium transition-colors disabled:opacity-50"
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
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          matrixId={matrixId}
          dayNumber={dayNumber}
          startDate={startDate || ""}
          dayDate={getCurrentDayDateInput()}
          categories={categories}
          onClose={() => setShowNewTaskModal(false)}
          onSuccess={() => {
            setShowNewTaskModal(false);
            fetchDayTasks();
          }}
        />
      )}
    </div>
  );
};
