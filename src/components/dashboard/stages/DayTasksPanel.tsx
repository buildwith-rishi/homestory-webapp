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
  Plus,
  Calendar,
  Mail,
  Send,
  Bell,
} from "lucide-react";
import { Card, Button } from "../../ui";
import type { MatrixTask, MatrixCategory } from "../../../types";
import {
  getMatrixDayTasks,
  getCategoryTasks,
} from "../../../services/projectApi";
import { sendEmail } from "../../../services/emailSendApi";
import { NewTaskModal } from "./NewTaskModal";
import toast from "react-hot-toast";

interface DayTasksPanelProps {
  matrixId: string;
  projectId: string;
  projectName?: string;
  dayNumber: number;
  startDate: string;
  categories: MatrixCategory[];
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

const getDateForDay = (startDate: string, dayNumber: number) => {
  // Handle ISO strings like "2026-02-11T00:00:00.000Z" and plain "2026-02-11"
  const dateOnly = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  const d = new Date(dateOnly + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
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
  projectId,
  projectName = "",
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
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{
    taskId: string;
    notes: string;
  } | null>(null);

  // Notify customer state
  const [checkedTaskIds, setCheckedTaskIds] = useState<Set<string>>(new Set());
  const [showNotifyCompose, setShowNotifyCompose] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyToName, setNotifyToName] = useState("");
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [sendingNotify, setSendingNotify] = useState(false);

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

  // Auto-uncheck tasks that are no longer COMPLETED
  useEffect(() => {
    const completedIds = new Set(
      tasks.filter((t) => t.status === "COMPLETED").map((t) => t.id),
    );
    setCheckedTaskIds((prev) => {
      const next = new Set([...prev].filter((id) => completedIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [tasks]);

  const fetchNotifyEmail = async () => {
    const firstId = [...checkedTaskIds][0];
    if (!firstId) return;
    setLoadingEmail(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com"}/api/tasks/${firstId}/customer-email`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const email = data.customerEmail || data.email || "";
        const name = data.customerName || data.toName || data.name || "";
        if (email) setNotifyEmail(email);
        if (name) setNotifyToName(name);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingEmail(false);
    }
  };

  const buildNotifyHtml = (opts: {
    customerName: string;
    projectName: string;
    updateTitle: string;
    personalNote: string;
    taskTitles: string[];
    dayNumber: number;
  }) => {
    const taskListItems = opts.taskTitles
      .map((t) => `<li style="padding:4px 0;color:#374151;">✅ ${t}</li>`)
      .join("");

    const noteBlock = opts.personalNote
      ? `<p style="margin:16px 0;color:#374151;line-height:1.6;">${opts.personalNote.replace(/\n/g, "<br/>")}</p>`
      : "";

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">GoodHomeStory</h1>
          <p style="margin:4px 0 0;color:#fed7aa;font-size:13px;">Project Day ${opts.dayNumber} Update</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${opts.customerName}</strong>,</p>
          <p style="margin:0 0 20px;color:#374151;line-height:1.6;">Here's your Day <strong>${opts.dayNumber}</strong> update for <strong>${opts.projectName}</strong>.</p>
          <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:14px 18px;margin:0 0 20px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#c2410c;">${opts.updateTitle}</p>
          </div>
          ${noteBlock}
          <p style="margin:0 0 10px;color:#374151;font-weight:600;font-size:14px;">Completed today:</p>
          <ul style="margin:0 0 24px;padding-left:18px;">${taskListItems}</ul>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">If you have any questions, feel free to reply to this email.<br/>— The GoodHomeStory Team</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">© 2026 GoodHomeStory. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  };

  const handleSendNotify = async () => {
    if (!notifyEmail.trim()) {
      toast.error("Please enter the customer email address");
      return;
    }
    if (!notifySubject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    setSendingNotify(true);
    const checkedTasks = tasks.filter((t) => checkedTaskIds.has(t.id));
    const updateTitle =
      checkedTasks.length === 1
        ? checkedTasks[0].title
        : `Day ${dayNumber} Task Update`;
    const customerName =
      notifyToName.trim() || notifyEmail.trim().split("@")[0];

    const htmlBody = buildNotifyHtml({
      customerName,
      projectName: projectName || "Your Project",
      updateTitle,
      personalNote: notifyMessage.trim(),
      taskTitles: checkedTasks.map((t) => t.title),
      dayNumber,
    });

    try {
      const res = await sendEmail({
        to: notifyEmail.trim(),
        toName: notifyToName.trim() || undefined,
        subject: notifySubject.trim(),
        htmlBody,
        templateName: "project_update",
        variables: {
          customerName,
          projectName: projectName || "Your Project",
          updateTitle,
          updateBody: notifyMessage.trim() || updateTitle,
        },
        emailType: "PROJECT_UPDATE",
        projectId,
      });
      if (res.success) {
        toast.success(`Notification sent to ${notifyEmail.trim()}`);
        setShowNotifyCompose(false);
        setNotifyMessage("");
        setNotifySubject("");
        setNotifyToName("");
        setCheckedTaskIds(new Set());
      } else {
        toast.error(res.message || "Failed to send notification");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send notification",
      );
    } finally {
      setSendingNotify(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              Day {dayNumber}
            </p>
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />
              {getDateForDay(startDate, dayNumber)}
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
                      <div key={task.id} className="rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-gray-50 transition-colors group">
                          {/* Notify checkbox — only enabled when COMPLETED */}
                          <input
                            type="checkbox"
                            disabled={task.status !== "COMPLETED"}
                            checked={checkedTaskIds.has(task.id)}
                            onChange={(e) => {
                              setCheckedTaskIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(task.id);
                                else next.delete(task.id);
                                return next;
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            title={
                              task.status !== "COMPLETED"
                                ? "Only completed tasks can be selected for notification"
                                : "Select for customer notification"
                            }
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 disabled:opacity-25 disabled:cursor-not-allowed flex-shrink-0"
                          />

                          {/* Status icon */}
                          <span className={`flex-shrink-0 ${cfg.text}`}>
                            {cfg.icon}
                          </span>

                          {/* Task info */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => onTaskClick(task.id, task)}
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
                          <div className="px-3 pb-3 pt-2 bg-green-50 border-t border-green-100">
                            <p className="text-[11px] font-semibold text-green-700 mb-1.5">
                              Completion notes (optional)
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
                                  if (e.key === "Enter") {
                                    onStatusChange(
                                      task.id,
                                      "COMPLETED",
                                      completionDialog.notes || undefined,
                                    );
                                    setCompletionDialog(null);
                                  }
                                  if (e.key === "Escape") {
                                    onStatusChange(task.id, "COMPLETED");
                                    setCompletionDialog(null);
                                  }
                                }}
                                placeholder="e.g. Site survey completed, all measurements taken"
                                className="flex-1 text-xs border border-green-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400/40 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  onStatusChange(
                                    task.id,
                                    "COMPLETED",
                                    completionDialog.notes || undefined,
                                  );
                                  setCompletionDialog(null);
                                }}
                                className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
                              >
                                Done
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onStatusChange(task.id, "COMPLETED");
                                  setCompletionDialog(null);
                                }}
                                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-medium transition-colors"
                              >
                                Skip
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

      {/* ── Notify Customer Section ──────────────────────────── */}
      <div
        className={`border rounded-xl transition-all overflow-hidden ${
          checkedTaskIds.size > 0
            ? "border-orange-200 bg-orange-50/60"
            : "border-gray-100 bg-gray-50/40 opacity-60"
        }`}
      >
        {/* Bar / trigger row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell
              className={`w-4 h-4 ${checkedTaskIds.size > 0 ? "text-orange-500" : "text-gray-400"}`}
            />
            <span
              className={`text-sm font-semibold ${
                checkedTaskIds.size > 0 ? "text-orange-700" : "text-gray-400"
              }`}
            >
              Notify Customer
            </span>
            {checkedTaskIds.size > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                {checkedTaskIds.size} task
                {checkedTaskIds.size > 1 ? "s" : ""} selected
              </span>
            )}
            {checkedTaskIds.size === 0 && (
              <span className="text-xs text-gray-400 italic">
                Mark tasks as Completed and check them above to enable
              </span>
            )}
          </div>
          {checkedTaskIds.size > 0 && (
            <button
              onClick={() => {
                if (!showNotifyCompose) {
                  // Auto-fill subject on open
                  if (!notifySubject)
                    setNotifySubject(`Task Update – Day ${dayNumber}`);
                  fetchNotifyEmail();
                }
                setShowNotifyCompose((prev) => !prev);
              }}
              className="text-xs font-medium text-orange-600 hover:text-orange-800 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showNotifyCompose ? "Close" : "Compose Email"}
            </button>
          )}
        </div>

        {/* Compose form — visible only when tasks are checked and compose is open */}
        {showNotifyCompose && checkedTaskIds.size > 0 && (
          <div className="border-t border-orange-100 px-4 pb-4 pt-3 space-y-3">
            {/* Selected task summary */}
            <div className="text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2 space-y-0.5">
              <p className="font-semibold text-gray-600 mb-1">
                Notifying about:
              </p>
              {tasks
                .filter((t) => checkedTaskIds.has(t.id))
                .map((t) => (
                  <p key={t.id} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                    {t.title}
                  </p>
                ))}
            </div>

            {/* To */}
            <div className="flex items-center gap-2">
              <label className="w-16 text-xs font-semibold text-gray-500 uppercase shrink-0">
                To
              </label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                />
                {!notifyEmail && (
                  <button
                    onClick={fetchNotifyEmail}
                    disabled={loadingEmail}
                    className="text-xs text-orange-500 hover:text-orange-700 font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    {loadingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Load email"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="w-16 text-xs font-semibold text-gray-500 uppercase shrink-0">
                Subject
              </label>
              <input
                type="text"
                value={notifySubject}
                onChange={(e) => setNotifySubject(e.target.value)}
                placeholder="Email subject…"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Message (optional)
              </label>
              <textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows={3}
                placeholder="Add a personal note to the customer…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              />
            </div>

            {/* Send button */}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSendNotify}
                disabled={
                  sendingNotify || !notifyEmail.trim() || !notifySubject.trim()
                }
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {sendingNotify ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          matrixId={matrixId}
          dayNumber={dayNumber}
          startDate={startDate}
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
