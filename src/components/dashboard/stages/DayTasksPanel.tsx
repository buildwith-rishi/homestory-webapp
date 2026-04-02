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
  Send,
  Bell,
  User,
  Upload,
  X,
  Pencil,
} from "lucide-react";
import { Button } from "../../ui";
import type { MatrixTask, MatrixCategory, AdminUser } from "../../../types";
import {
  getMatrixDayTasks,
  getProjectById,
  uploadTaskAttachment,
  updateMatrixTask,
  updateMatrixDayTitle,
} from "../../../services/projectApi";
import { adminAPI } from "../../../services/api";
import { getAllTeamMembers, TeamMember } from "../../../services/teamApi";
import { sendEmail } from "../../../services/emailSendApi";
import { RichTextEditor } from "./RichTextEditor";
import { NewTaskModal } from "./NewTaskModal";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";

interface DayTasksPanelProps {
  matrixId: string;
  projectId: string;
  projectName?: string;
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
  onDayDateUpdated,
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
  const [isEditingDayDate, setIsEditingDayDate] = useState(false);
  const [dayDateInput, setDayDateInput] = useState("");
  const [isUpdatingDayDate, setIsUpdatingDayDate] = useState(false);
  const [savedDayDateOverride, setSavedDayDateOverride] = useState<string | null>(
    null,
  );
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

  // Notify customer state
  const [checkedTaskIds, setCheckedTaskIds] = useState<Set<string>>(new Set());
  const [showNotifyCompose, setShowNotifyCompose] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyCc, setNotifyCc] = useState("");
  const [notifyToName, setNotifyToName] = useState("");
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [sendingNotify, setSendingNotify] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [editorInitialHtml, setEditorInitialHtml] = useState("");

  /** Build a professional pre-filled email template for the message body */
  const buildEmailTemplate = (opts: {
    customerName: string;
    projectName: string;
    dayNumber: number;
    taskTitles: string[];
  }) => {
    const taskItems = opts.taskTitles.map((t) => `<li>${t}</li>`).join("");
    return [
      `<p>Hi <strong>${opts.customerName}</strong>,</p>`,
      `<p>Hope you're doing great! Here's your <strong>Day ${opts.dayNumber}</strong> project update for <strong>${opts.projectName}</strong>.</p>`,
      `<p>We've completed the following tasks today:</p>`,
      `<ul>${taskItems}</ul>`,
      `<p>If you have any questions or need clarification on anything, please feel free to reply to this email — we're always happy to help!</p>`,
      `<p>Warm regards,<br/>The GoodHomeStory Team</p>`,
    ].join("");
  };

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

  const computeDefaultDayDateInput = () => {
    const baseDate = parseDate(startDate);
    if (isNaN(baseDate.getTime())) return "";
    baseDate.setDate(baseDate.getDate() + dayNumber - 1);
    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, "0");
    const dd = String(baseDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentDayDateInput = () => {
    const fromTask = tasks.find((t) => !!t.taskDate)?.taskDate;
    const dateOnly = toDateOnly(fromTask);
    if (dateOnly) return dateOnly;
    const fromSavedOverride = toDateOnly(savedDayDateOverride);
    if (fromSavedOverride) return fromSavedOverride;
    return computeDefaultDayDateInput();
  };

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
    if (savedDayDateOverride) return formatDisplayDate(savedDayDateOverride);
    return getDateForDay(startDate, dayNumber);
  })();

  const handleStartEditDayDate = () => {
    setDayDateInput(getCurrentDayDateInput());
    setIsEditingDayDate(true);
  };

  const handleSaveDayDate = async () => {
    if (!dayDateInput) {
      toast.error("Please choose a valid date.");
      return;
    }

    setIsUpdatingDayDate(true);
    try {
      const isoDate = `${dayDateInput}T00:00:00.000Z`;
      await updateMatrixDayTitle(matrixId, dayNumber, undefined, isoDate);

      if (tasks.length > 0) {
        await Promise.all(
          tasks.map((task) =>
            updateMatrixTask(task.id, {
              dayNumber,
              taskDate: isoDate,
              startDate: task.startDate || startDate || undefined,
            }),
          ),
        );
      }

      setSavedDayDateOverride(isoDate);
      toast.success("Day date updated successfully");
      setIsEditingDayDate(false);
      if (!initialTasks) {
        await fetchDayTasks();
      }
      onDayDateUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update day date",
      );
    } finally {
      setIsUpdatingDayDate(false);
    }
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

  /** Fallback: fetch via task customer-email endpoint */
  const fetchNotifyEmailFallback = async () => {
    const firstId = [...checkedTaskIds][0];
    if (!firstId) return;
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
    }
  };

  /** Auto-populate email from the project's lead or account */
  const fetchProjectEmail = async () => {
    if (!projectId) return;
    setLoadingEmail(true);
    try {
      const project = await getProjectById(projectId);
      const email = project.lead?.email || project.account?.email || "";
      const name = project.lead?.name || project.account?.name || "";
      if (email) setNotifyEmail(email);
      if (name) setNotifyToName(name);
      // Fallback to task-level endpoint if project has no email
      if (!email) await fetchNotifyEmailFallback();
    } catch {
      await fetchNotifyEmailFallback();
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

    const isNoteEmpty = !opts.personalNote.replace(/<[^>]*>/g, "").trim();
    const noteBlock =
      opts.personalNote && !isNoteEmpty
        ? `<div style="margin:16px 0 8px;color:#374151;line-height:1.7;font-size:14px;">${opts.personalNote}</div>`
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
        cc: notifyCc.trim() || undefined,
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
        setNotifyEmail("");
        setNotifyCc("");
        setEditorResetKey((k) => k + 1);
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
            {!isEditingDayDate && (
              <button
                type="button"
                onClick={handleStartEditDayDate}
                className="text-xs text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                title="Edit day date"
              >
                <Pencil className="w-3 h-3" />
                Edit Date
              </button>
            )}
          </div>

          {isEditingDayDate && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="date"
                value={dayDateInput}
                onChange={(e) => setDayDateInput(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={handleSaveDayDate}
                disabled={isUpdatingDayDate}
                className="text-xs bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-600 disabled:opacity-60 inline-flex items-center gap-1"
              >
                {isUpdatingDayDate ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : null}
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDayDate(false)}
                disabled={isUpdatingDayDate}
                className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
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
                  // Auto-populate customer email from the project
                  if (!notifyEmail) fetchProjectEmail();
                  // Build and inject pre-filled email template
                  const checkedTasks = tasks.filter((t) =>
                    checkedTaskIds.has(t.id),
                  );
                  const customerName = notifyToName.trim() || "Customer";
                  const template = buildEmailTemplate({
                    customerName,
                    projectName: projectName || "Your Project",
                    dayNumber,
                    taskTitles: checkedTasks.map((t) => t.title),
                  });
                  setEditorInitialHtml(template);
                  setEditorResetKey((k) => k + 1);
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
                    onClick={fetchProjectEmail}
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
                Cc
              </label>
              <input
                type="text"
                value={notifyCc}
                onChange={(e) => setNotifyCc(e.target.value)}
                placeholder="cc1@example.com, cc2@example.com"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              />
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

            {/* Message — rich text */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                Message (optional)
              </label>
              <RichTextEditor
                onChange={setNotifyMessage}
                placeholder="Add a personal note to the customer…"
                resetKey={editorResetKey}
                initialHtml={editorInitialHtml}
                minHeight="140px"
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
