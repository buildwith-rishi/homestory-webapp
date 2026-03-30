import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Ban,
  AlertTriangle,
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  ExternalLink,
  File,
  Download,
  Edit3,
  Save,
  UserCheck,
  ChevronsRight,
  Mail,
  Send,
} from "lucide-react";
import { Button } from "../../ui";
import type {
  MatrixTask,
  TaskAttachment,
  UpdateMatrixTaskRequest,
  AdminUser,
  NotifyCustomerRequest,
} from "../../../types";
import { adminAPI } from "../../../services/api";
import { getAttachment } from "../../../services/attachmentApi";
import {
  getMatrixTaskDetails,
  getTaskAttachments,
  uploadTaskAttachment,
  deleteTaskAttachment,
  updateMatrixTask,
  pushMatrixTask,
  pushMatrixDayTasks,
  notifyCustomerTaskComplete,
} from "../../../services/projectApi";
import toast from "react-hot-toast";

interface TaskDetailModalProps {
  taskId: string;
  matrixId: string;
  categories: { id: string; name: string; color: string }[];
  fallbackTask?: MatrixTask | null;
  onClose: () => void;
  onStatusChanged: () => void;
}

const statusConfig: Record<
  string,
  {
    icon: React.ReactNode;
    bg: string;
    text: string;
    label: string;
    border: string;
  }
> = {
  PENDING: {
    icon: <Circle className="w-4 h-4" />,
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: "Pending",
    border: "border-gray-300",
  },
  IN_PROGRESS: {
    icon: <Clock className="w-4 h-4" />,
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "In Progress",
    border: "border-blue-300",
  },
  COMPLETED: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Completed",
    border: "border-green-300",
  },
  CANCELLED: {
    icon: <Ban className="w-4 h-4" />,
    bg: "bg-red-50",
    text: "text-red-600",
    label: "Cancelled",
    border: "border-red-300",
  },
  OVERDUE: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Overdue",
    border: "border-amber-300",
  },
};

const attachmentTypeIcon: Record<string, React.ReactNode> = {
  PHOTO: <ImageIcon className="w-4 h-4 text-purple-500" />,
  VIDEO: <Video className="w-4 h-4 text-pink-500" />,
  DOCUMENT: <FileText className="w-4 h-4 text-blue-500" />,
  AUDIO: <File className="w-4 h-4 text-teal-500" />,
  OTHER: <Paperclip className="w-4 h-4 text-gray-500" />,
};

const inferAttachmentType = (file: File): string => {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("image/")) return "PHOTO";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("spreadsheet") ||
    mime.includes("text/")
  )
    return "DOCUMENT";
  return "OTHER";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  matrixId,
  categories,
  fallbackTask,
  onClose,
  onStatusChanged,
}) => {
  const [task, setTask] = useState<MatrixTask | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "attachments">(
    "details",
  );

  // Attachment upload
  const [uploading, setUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const [viewingAttachmentId, setViewingAttachmentId] = useState<string | null>(
    null,
  );
  // Resolved signed download URLs keyed by attachment id
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Users list for assignee dropdown
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Resolve assignee display name from all possible API field shapes.
  // The backend Prisma FK may be "assignedToUserId" while the MatrixTask type
  // declares "assignedToId" — check both so we work regardless of API shape.
  const assignedUserName = useMemo(() => {
    if (!task) return "";
    if (task.assignedTo?.name) return task.assignedTo.name;
    const t = task as unknown as Record<string, unknown>;
    const id =
      task.assignedToId ||
      (t.assignedToUserId as string | undefined) ||
      (t.assigned_to_user_id as string | undefined) ||
      (t.assignedTo as Record<string, string> | null)?.id ||
      null;
    if (!id) return "";
    return users.find((u) => u.id === id)?.name ?? "";
  }, [task, users]);

  // Assignee
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [savingAssignee, setSavingAssignee] = useState(false);

  // Push single task to another day
  const [showPushPanel, setShowPushPanel] = useState(false);
  const [pushTargetDay, setPushTargetDay] = useState<number>(1);
  const [pushReason, setPushReason] = useState("");
  const [pushing, setPushing] = useState(false);

  // Bulk push all tasks from one day to another
  const [showBulkPushPanel, setShowBulkPushPanel] = useState(false);
  const [bulkFromDay, setBulkFromDay] = useState<number>(1);
  const [bulkToDay, setBulkToDay] = useState<number>(2);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkPushing, setBulkPushing] = useState(false);

  // Notify customer
  const [showNotifyPanel, setShowNotifyPanel] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyIncludeAttachments, setNotifyIncludeAttachments] =
    useState(true);
  const [notifying, setNotifying] = useState(false);

  // Task editing
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAssigneeRole, setEditAssigneeRole] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editDayNumber, setEditDayNumber] = useState<number>(1);
  const [editStartDate, setEditStartDate] = useState("");
  const [editCompletionNotes, setEditCompletionNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditing = () => {
    if (!task) return;
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditCategoryId(task.categoryId || task.category?.id || "");
    const t = task as unknown as Record<string, unknown>;
    setEditAssigneeId(
      task.assignedToId || (t.assignedToUserId as string | undefined) || "",
    );
    setEditDayNumber(task.dayNumber || 1);
    // Normalize startDate to YYYY-MM-DD for date input
    const sd = task.startDate || "";
    setEditStartDate(sd ? (sd.includes("T") ? sd.split("T")[0] : sd) : "");
    setEditCompletionNotes(task.completionNotes || "");
    setEditStatus(task.status || "PENDING");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const availableAssigneeRoles = useMemo(
    () => [...new Set(users.map((u) => u.role))].sort(),
    [users],
  );

  const roleFilteredUsers = useMemo(() => {
    if (!editAssigneeRole) return [];
    return users.filter((u) => u.role === editAssigneeRole);
  }, [users, editAssigneeRole]);

  const handleNotifyCustomer = async () => {
    setNotifying(true);
    try {
      const payload: NotifyCustomerRequest = {
        includeAttachments: notifyIncludeAttachments,
      };
      if (notifyMessage.trim()) payload.customMessage = notifyMessage.trim();
      const res = await notifyCustomerTaskComplete(taskId, payload);
      toast.success(
        res.sent
          ? `Email sent to ${res.customerEmail}${
              res.attachmentsCount > 0
                ? ` with ${res.attachmentsCount} attachment(s)`
                : ""
            }`
          : "Notification triggered",
      );
      setShowNotifyPanel(false);
      setNotifyMessage("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send notification",
      );
    } finally {
      setNotifying(false);
    }
  };

  const handleBulkPushTasks = async () => {
    if (!matrixId || bulkFromDay < 1 || bulkToDay < 1) return;
    if (bulkFromDay === bulkToDay) {
      toast.error("From day and To day must be different");
      return;
    }
    setBulkPushing(true);
    try {
      await pushMatrixDayTasks(matrixId, bulkFromDay, bulkToDay, bulkReason);
      toast.success(`All Day ${bulkFromDay} tasks pushed to Day ${bulkToDay}`);
      setShowBulkPushPanel(false);
      setBulkReason("");
      await fetchTaskDetails();
      onStatusChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to bulk push tasks",
      );
    } finally {
      setBulkPushing(false);
    }
  };

  const handlePushTask = async () => {
    if (!task || pushTargetDay < 1) return;
    if (pushTargetDay === task.dayNumber) {
      toast.error("Target day must be different from the current day");
      return;
    }
    setPushing(true);
    try {
      await pushMatrixTask(taskId, pushTargetDay, pushReason);
      // Persist reason locally so it shows on the task row immediately
      if (pushReason.trim()) {
        try {
          const stored = JSON.parse(
            localStorage.getItem("ghs_push_reasons") || "{}",
          );
          stored[taskId] = pushReason.trim();
          localStorage.setItem("ghs_push_reasons", JSON.stringify(stored));
        } catch {
          // non-critical
        }
      }
      toast.success(`Task pushed to Day ${pushTargetDay}`);
      setShowPushPanel(false);
      setPushReason("");
      await fetchTaskDetails();
      onStatusChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push task");
    } finally {
      setPushing(false);
    }
  };

  const handleSaveTaskEdit = async () => {
    if (!task) return;
    if (!editTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSavingEdit(true);
    try {
      // Compute taskDate from editStartDate + editDayNumber so it stays in sync
      const baseDate =
        editStartDate ||
        (task.startDate
          ? task.startDate.includes("T")
            ? task.startDate.split("T")[0]
            : task.startDate
          : "");
      let computedTaskDate: string | undefined = task.taskDate || undefined;
      if (baseDate) {
        const d = new Date(baseDate + "T00:00:00");
        d.setDate(d.getDate() + ((editDayNumber || 1) - 1));
        computedTaskDate = d.toISOString();
      }

      const payload: UpdateMatrixTaskRequest = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        categoryId:
          editCategoryId || task.categoryId || task.category?.id || undefined,
        dayNumber: editDayNumber || task.dayNumber,
        startDate: editStartDate
          ? new Date(editStartDate + "T00:00:00").toISOString()
          : task.startDate || undefined,
        taskDate: computedTaskDate,
        status: editStatus || task.status,
        ...(editCompletionNotes.trim() && {
          completionNotes: editCompletionNotes.trim(),
        }),
        ...(editAssigneeId
          ? { assignedToUserId: editAssigneeId }
          : { assignedToUserId: null }),
      };

      const updatedTask = await updateMatrixTask(taskId, payload);
      toast.success("Task updated successfully");

      // Optimistically apply the updated fields so the UI reflects changes
      // immediately (title, description, status, etc.) without waiting for
      // the refetch — critical when the GET returns partial/stale data.
      setTask((prev) => {
        if (!prev) return prev;
        // Prefer server-returned values; fall through to what the user typed.
        const newTitle = updatedTask?.title || editTitle.trim() || prev.title;
        const newDescription =
          updatedTask?.description !== undefined
            ? updatedTask.description
            : editDescription.trim() || prev.description;
        return {
          ...prev,
          title: newTitle,
          description: newDescription,
          categoryId:
            editCategoryId || prev.categoryId || prev.category?.id || undefined,
          dayNumber: editDayNumber || prev.dayNumber,
          status: editStatus || prev.status,
          ...(editCompletionNotes.trim() && {
            completionNotes: editCompletionNotes.trim(),
          }),
        };
      });

      setIsEditing(false);
      await fetchTaskDetails();
      onStatusChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSavingEdit(false);
    }
  };

  // Fetch users for assignee dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await adminAPI.getAllUsers();
        let usersList: Array<Record<string, unknown>> = [];
        if (Array.isArray(response)) {
          usersList = response as Array<Record<string, unknown>>;
        } else if (response && typeof response === "object") {
          if ("users" in response && Array.isArray(response.users)) {
            usersList = response.users as Array<Record<string, unknown>>;
          } else if (
            "data" in response &&
            response.data &&
            typeof response.data === "object" &&
            "users" in response.data &&
            Array.isArray(
              (response.data as { users: Array<Record<string, unknown>> }).users,
            )
          ) {
            usersList = (
              response.data as { users: Array<Record<string, unknown>> }
            ).users;
          } else if ("data" in response && Array.isArray(response.data)) {
            usersList = response.data as Array<Record<string, unknown>>;
          }
        }

        const normalizedUsers = usersList.map((user) => {
          const roleFromApi =
            user.role ||
            (
              user.credential as { roleKey?: string; name?: string } | undefined
            )?.roleKey ||
            (
              user.credential as { roleKey?: string; name?: string } | undefined
            )?.name ||
            "BDR";

          const roleTitleFromApi =
            (user.roleTitle as string | undefined) ||
            (user.userRoleTitle as string | undefined) ||
            (user.title as string | undefined);

          return {
            ...user,
            role: String(roleFromApi).toUpperCase() as AdminUser["role"],
            roleTitle: roleTitleFromApi,
          } as AdminUser;
        });

        // Deduplicate
        const seen = new Set<string>();
        setUsers(
          normalizedUsers.filter((u) => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return u.isActive !== false && !u.isBanned;
          }),
        );
      } catch {
        // Non-critical, silently fail
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    if (!editAssigneeId) return;
    const assigned = users.find((u) => u.id === editAssigneeId);
    if (assigned && assigned.role !== editAssigneeRole) {
      setEditAssigneeRole(assigned.role);
    }
  }, [isEditing, editAssigneeId, users, editAssigneeRole]);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  // Resolve signed download URLs for all attachments as soon as the list changes
  useEffect(() => {
    if (attachments.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        attachments.map(async (att) => {
          try {
            const detail = await getAttachment(att.id);
            const url =
              detail.downloadUrl ||
              detail.storageUrl ||
              detail.url ||
              detail.fileUrl ||
              att.fileUrl ||
              "";
            return [att.id, url] as const;
          } catch {
            return [att.id, att.fileUrl || ""] as const;
          }
        }),
      );
      if (!cancelled) {
        setResolvedUrls(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attachments]);

  const fetchTaskDetails = async () => {
    setLoading(true);

    // Fetch task details and attachments independently so one failing doesn't block the other
    let taskData: MatrixTask | null = null;
    let attachData: TaskAttachment[] = [];

    // 1. Fetch task details
    try {
      const raw = await getMatrixTaskDetails(taskId);
      // Normalize API response: server may return 'assignedToUser' instead of 'assignedTo'
      const r = raw as unknown as Record<string, unknown>;
      taskData = {
        ...raw,
        assignedTo:
          raw.assignedTo ||
          (r.assignedToUser as MatrixTask["assignedTo"]) ||
          null,
      };
      console.log("[TaskDetailModal] Task data:", taskData);
    } catch (err) {
      console.error("[TaskDetailModal] Failed to fetch task details:", err);
      // Use fallback task data from the list view
      if (fallbackTask) {
        taskData = fallbackTask;
      }
    }

    // 2. Always fetch attachments regardless of task detail success/failure
    try {
      attachData = await getTaskAttachments(taskId);
      console.log("[TaskDetailModal] Attachments data:", attachData);
      if (!Array.isArray(attachData)) {
        console.warn(
          "[TaskDetailModal] attachData is not an array:",
          attachData,
        );
        attachData = [];
      }
    } catch (err) {
      console.error("[TaskDetailModal] Failed to fetch attachments:", err);
      attachData = [];
    }

    // 3. Set state
    if (taskData) {
      setTask(taskData);
      setSelectedAssigneeId(taskData.assignedToId || "");
    } else {
      toast.error("Failed to load task details");
    }
    setAttachments(attachData);
    setResolvedUrls({}); // clear stale URLs when task reloads

    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const attachmentType = inferAttachmentType(file);
      await uploadTaskAttachment(taskId, file, attachmentType);
      // Re-fetch all attachments from API to ensure we have the correct data
      try {
        const freshAttachments = await getTaskAttachments(taskId);
        setAttachments(Array.isArray(freshAttachments) ? freshAttachments : []);
      } catch {
        // Fallback: just refresh everything
        await fetchTaskDetails();
      }
      toast.success("File uploaded");
      onStatusChanged(); // refresh counts
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await deleteTaskAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("Attachment deleted");
      onStatusChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  /** Open attachment using the resolved URL; falls back to fresh API fetch */
  const handleViewAttachment = async (att: TaskAttachment) => {
    // If already resolved, open immediately
    const cached = resolvedUrls[att.id];
    if (cached) {
      window.open(cached, "_blank", "noopener,noreferrer");
      return;
    }
    setViewingAttachmentId(att.id);
    try {
      const detail = await getAttachment(att.id);
      const url =
        detail.downloadUrl ||
        detail.storageUrl ||
        detail.url ||
        detail.fileUrl ||
        att.fileUrl;
      if (url) {
        setResolvedUrls((prev) => ({ ...prev, [att.id]: url }));
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Unable to retrieve file URL");
      }
    } catch {
      if (att.fileUrl?.startsWith("http")) {
        window.open(att.fileUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Unable to open attachment");
      }
    } finally {
      setViewingAttachmentId(null);
    }
  };

  const cfg = statusConfig[task?.status || "PENDING"] || statusConfig.PENDING;
  const catColor =
    categories.find(
      (c) => c.id === task?.categoryId || c.name === task?.category?.name,
    )?.color || "#6b7280";

  const content = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: catColor }}
            />
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {loading ? "Loading..." : task?.title || "Task Details"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : task ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {(
                [
                  { key: "details" as const, label: "Details & Status" },
                  {
                    key: "attachments" as const,
                    label: `Attachments (${attachments.length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeTab === "details" && (
                <div className="space-y-5">
                  {/* Status badge + Edit button row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        Day {task.dayNumber}
                      </span>
                      {task.category && !isEditing && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: catColor }}
                        >
                          {task.category.name}
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={startEditing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Inline editing form */}
                  {isEditing ? (
                    <div className="space-y-4 bg-orange-50/40 border border-orange-200 rounded-xl p-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          placeholder="Task title"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Description
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
                          rows={3}
                          placeholder="Task description (optional)"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Category
                        </label>
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 bg-white"
                        >
                          <option value="">No category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Day Number
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={editDayNumber}
                            onChange={(e) =>
                              setEditDayNumber(Number(e.target.value))
                            }
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Status
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(statusConfig).map(([key, val]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setEditStatus(key)}
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                                editStatus === key
                                  ? `${val.bg} ${val.text} ${val.border}`
                                  : "border-gray-200 text-gray-400 hover:border-gray-300"
                              }`}
                            >
                              {val.icon}
                              <span className="text-[10px]">{val.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Completion Notes
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <textarea
                          value={editCompletionNotes}
                          onChange={(e) =>
                            setEditCompletionNotes(e.target.value)
                          }
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
                          rows={3}
                          placeholder="Completion notes (required)"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Assigned To
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <select
                            value={editAssigneeRole}
                            onChange={(e) => {
                              const nextRole = e.target.value;
                              setEditAssigneeRole(nextRole);
                              setEditAssigneeId("");
                            }}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 bg-white"
                          >
                            <option value="">
                              {usersLoading ? "Loading roles..." : "Select Role"}
                            </option>
                            {availableAssigneeRoles.map((role) => (
                              <option key={role} value={role}>
                                {role.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editAssigneeId}
                            onChange={(e) => setEditAssigneeId(e.target.value)}
                            disabled={!editAssigneeRole}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                          >
                            <option value="">
                              {editAssigneeRole
                                ? "Unassigned"
                                : "Select role first"}
                            </option>
                            {roleFilteredUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={handleSaveTaskEdit}
                          disabled={savingEdit || !editTitle.trim()}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {savingEdit ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <button
                          onClick={cancelEditing}
                          disabled={savingEdit}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Description (read-only) */}
                      {task.description && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Description
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        Created
                      </p>
                      <p className="text-gray-700">
                        {formatDateTime(task.createdAt)}
                      </p>
                    </div>{" "}
                    {task.startDate && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Start Date
                        </p>
                        <p className="text-gray-700">
                          {formatDateTime(task.startDate)}
                        </p>
                      </div>
                    )}{" "}
                    {task.completedAt && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Completed
                        </p>
                        <p className="text-gray-700">
                          {formatDateTime(task.completedAt)}
                        </p>
                      </div>
                    )}
                    {task.completedBy && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Completed By
                        </p>
                        <p className="text-gray-700">{task.completedBy.name}</p>
                      </div>
                    )}
                    {task.taskDate && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Scheduled Date
                        </p>
                        <p className="text-gray-700">
                          {formatDateTime(task.taskDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Assigned To */}
                  {assignedUserName && (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <UserCheck className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">
                          Assigned To
                        </p>
                        <p className="text-sm font-medium text-orange-800">
                          {assignedUserName}
                        </p>
                      </div>
                    </div>
                  )}
                  {task.completionNotes && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        Completion Notes
                      </p>
                      <p className="text-sm text-green-800">
                        {task.completionNotes}
                      </p>
                    </div>
                  )}

                  {/* Push reason — shown when the task was rescheduled */}
                  {(() => {
                    const apiReason = task.pushReason || task.reason;
                    let storedReason = "";
                    try {
                      const map = JSON.parse(
                        localStorage.getItem("ghs_push_reasons") || "{}",
                      );
                      storedReason = map[taskId] || "";
                    } catch {
                      /* noop */
                    }
                    const reason = apiReason || storedReason;
                    return reason ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">🔄</span>
                          <p className="text-xs font-semibold text-amber-700 uppercase">
                            Rescheduled — Reason
                          </p>
                        </div>
                        <p className="text-sm text-amber-800">{reason}</p>
                      </div>
                    ) : null;
                  })()}

                  {/* Push task to another day */}
                  <div className="border-t border-gray-100 pt-5">
                    <button
                      onClick={() => {
                        setShowPushPanel((p) => !p);
                        if (!showPushPanel)
                          setPushTargetDay(task.dayNumber + 1);
                      }}
                      className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase hover:text-orange-600 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronsRight className="w-3.5 h-3.5" />
                        Push to Another Day
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          showPushPanel
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {showPushPanel ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showPushPanel && (
                      <div className="mt-3 space-y-3 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              Target Day <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={pushTargetDay}
                              onChange={(e) =>
                                setPushTargetDay(Number(e.target.value))
                              }
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                              placeholder="e.g. 4"
                            />
                            {pushTargetDay === task.dayNumber && (
                              <p className="text-xs text-red-500 mt-1">
                                Must be different from current Day{" "}
                                {task.dayNumber}
                              </p>
                            )}
                          </div>
                          <div className="pt-5 text-xs text-gray-400 whitespace-nowrap">
                            Currently: Day {task.dayNumber}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Reason (optional)
                          </label>
                          <textarea
                            value={pushReason}
                            onChange={(e) => setPushReason(e.target.value)}
                            placeholder="e.g. Material not delivered yet, rescheduling to Day 4"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                            rows={2}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handlePushTask}
                          disabled={
                            pushing ||
                            pushTargetDay < 1 ||
                            pushTargetDay === task.dayNumber
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-white w-full"
                        >
                          {pushing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Pushing...
                            </>
                          ) : (
                            <>
                              <ChevronsRight className="w-4 h-4 mr-1" />
                              Push to Day {pushTargetDay}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bulk push — all tasks from Day X to Day Y */}
                  <div className="border-t border-gray-100 pt-5">
                    <button
                      onClick={() => {
                        setShowBulkPushPanel((p) => !p);
                        if (!showBulkPushPanel && task) {
                          setBulkFromDay(task.dayNumber);
                          setBulkToDay(task.dayNumber + 1);
                        }
                      }}
                      className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase hover:text-indigo-600 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronsRight className="w-3.5 h-3.5" />
                        Push All Day Tasks
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          showBulkPushPanel
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {showBulkPushPanel ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showBulkPushPanel && (
                      <div className="mt-3 space-y-3 bg-indigo-50/50 border border-indigo-200 rounded-xl p-4">
                        <p className="text-xs text-indigo-700 bg-indigo-100 rounded-lg px-3 py-2">
                          Moves <strong>all tasks</strong> from one day to
                          another across the entire matrix.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              From Day <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={bulkFromDay}
                              onChange={(e) =>
                                setBulkFromDay(Number(e.target.value))
                              }
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                              To Day <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={bulkToDay}
                              onChange={(e) =>
                                setBulkToDay(Number(e.target.value))
                              }
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                            />
                          </div>
                        </div>
                        {bulkFromDay === bulkToDay && bulkFromDay > 0 && (
                          <p className="text-xs text-red-500">
                            From Day and To Day must be different
                          </p>
                        )}
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Reason (optional)
                          </label>
                          <textarea
                            value={bulkReason}
                            onChange={(e) => setBulkReason(e.target.value)}
                            placeholder="e.g. Rain delay — all Day 1 remaining work moved to Day 3"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 resize-none"
                            rows={2}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleBulkPushTasks}
                          disabled={
                            bulkPushing ||
                            bulkFromDay < 1 ||
                            bulkToDay < 1 ||
                            bulkFromDay === bulkToDay
                          }
                          className="bg-indigo-500 hover:bg-indigo-600 text-white w-full"
                        >
                          {bulkPushing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Pushing all tasks...
                            </>
                          ) : (
                            <>
                              <ChevronsRight className="w-4 h-4 mr-1" />
                              Push Day {bulkFromDay} → Day {bulkToDay}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Notify customer — send task completion email */}
                  <div className="border-t border-gray-100 pt-5">
                    <button
                      onClick={() => setShowNotifyPanel((p) => !p)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase hover:text-emerald-600 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Notify Customer
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          showNotifyPanel
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {showNotifyPanel ? "Hide" : "Show"}
                      </span>
                    </button>

                    {showNotifyPanel && (
                      <div className="mt-3 space-y-3 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
                          Sends a task completion email to the customer.
                          Optionally attach uploaded files.
                        </p>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Custom Message (optional)
                          </label>
                          <textarea
                            value={notifyMessage}
                            onChange={(e) => setNotifyMessage(e.target.value)}
                            placeholder="e.g. We have completed the site survey. Please find the attached photos."
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
                            rows={3}
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={notifyIncludeAttachments}
                            onChange={(e) =>
                              setNotifyIncludeAttachments(e.target.checked)
                            }
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                          <span className="text-sm text-gray-700">
                            Include attachments
                            {attachments.length > 0 && (
                              <span className="ml-1 text-xs text-gray-400">
                                ({attachments.length} file
                                {attachments.length !== 1 ? "s" : ""})
                              </span>
                            )}
                          </span>
                        </label>
                        <Button
                          size="sm"
                          onClick={handleNotifyCustomer}
                          disabled={notifying}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
                        >
                          {notifying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Sending email...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Send Completion Email
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "attachments" && (
                <div className="space-y-4">
                  {/* Upload area */}
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <p className="text-sm text-gray-500">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          Click to upload a file
                        </p>
                        <p className="text-xs text-gray-400">
                          Photos, videos, documents, audio
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachment list */}
                  {attachments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4 italic">
                      No attachments yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att) => {
                        const isDeleting = deletingAttachmentId === att.id;
                        const isViewing = viewingAttachmentId === att.id;
                        const isImage =
                          att.attachmentType === "PHOTO" ||
                          att.fileType?.startsWith("image/");
                        const resolvedUrl =
                          resolvedUrls[att.id] || att.fileUrl || "";
                        return (
                          <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                          >
                            {/* Thumbnail for images, icon for others */}
                            {isImage ? (
                              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-200">
                                <img
                                  src={resolvedUrl}
                                  alt={att.fileName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const el = e.currentTarget;
                                    el.style.display = "none";
                                    if (el.parentElement) {
                                      el.parentElement.innerHTML =
                                        '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 m-auto mt-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              attachmentTypeIcon[att.attachmentType] ||
                              attachmentTypeIcon.OTHER
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {att.fileName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{formatFileSize(att.fileSize)}</span>
                                <span>{att.attachmentType}</span>
                                {att.uploadedBy && (
                                  <span>by {att.uploadedBy.name}</span>
                                )}
                              </div>
                              {att.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {att.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewAttachment(att)}
                                disabled={isViewing}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded disabled:opacity-50"
                                title="View"
                              >
                                {isViewing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ExternalLink className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {resolvedUrl && (
                                <a
                                  href={resolvedUrl}
                                  download={att.fileName}
                                  className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteAttachment(att.id)}
                                disabled={isDeleting}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-gray-500">Loading task...</span>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-sm text-gray-400">Task not found</p>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
