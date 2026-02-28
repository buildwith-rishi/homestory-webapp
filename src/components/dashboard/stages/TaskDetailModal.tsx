import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Edit3,
  Save,
  UserCheck,
} from "lucide-react";
import { Button } from "../../ui";
import type {
  MatrixTask,
  TaskAttachment,
  UpdateTaskStatusRequest,
  UpdateMatrixTaskRequest,
  AdminUser,
} from "../../../types";
import { adminAPI } from "../../../services/api";
import {
  getMatrixTaskDetails,
  getTaskAttachments,
  uploadTaskAttachment,
  deleteTaskAttachment,
  updateMatrixTaskStatus,
  updateMatrixTask,
} from "../../../services/projectApi";
import toast from "react-hot-toast";

interface TaskDetailModalProps {
  taskId: string;
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
  categories,
  fallbackTask,
  onClose,
  onStatusChanged,
}) => {
  const [task, setTask] = useState<MatrixTask | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "attachments">("details");

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Attachment upload
  const [uploading, setUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Users list for assignee dropdown
  const [users, setUsers] = useState<AdminUser[]>([]);

  // Assignee
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [savingAssignee, setSavingAssignee] = useState(false);

  // Task editing
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditing = () => {
    if (!task) return;
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditCategoryId(task.categoryId || task.category?.id || "");
    setEditAssigneeId(task.assignedToId || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveTaskEdit = async () => {
    if (!task) return;
    if (!editTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSavingEdit(true);
    try {
      // Send ALL task fields (PUT = full replace) so the backend gets a complete object
      const payload: UpdateMatrixTaskRequest = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        categoryId:
          editCategoryId || task.categoryId || task.category?.id || undefined,
        dayNumber: task.dayNumber,
        taskDate: task.taskDate || undefined,
        status: task.status,
        assignedToId: editAssigneeId || null,
      };

      await updateMatrixTask(taskId, payload);
      toast.success("Task updated successfully");
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
      try {
        const response = await adminAPI.getAllUsers();
        let usersList: AdminUser[] = [];
        if (response && typeof response === "object") {
          if ("users" in response && Array.isArray(response.users)) {
            usersList = response.users;
          } else if (Array.isArray(response)) {
            usersList = response;
          }
        }
        // Deduplicate
        const seen = new Set<string>();
        setUsers(usersList.filter((u) => { if (seen.has(u.id)) return false; seen.add(u.id); return true; }));
      } catch {
        // Non-critical, silently fail
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);

    // Fetch task details and attachments independently so one failing doesn't block the other
    let taskData: MatrixTask | null = null;
    let attachData: TaskAttachment[] = [];

    // 1. Fetch task details
    try {
      taskData = await getMatrixTaskDetails(taskId);
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
      setNewStatus(taskData.status);
      setCompletionNotes(taskData.completionNotes || "");
      setSelectedAssigneeId(taskData.assignedToId || "");
    } else {
      toast.error("Failed to load task details");
    }
    setAttachments(attachData);

    setLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const data: UpdateTaskStatusRequest = { status: newStatus };
      if (completionNotes.trim()) data.completionNotes = completionNotes.trim();
      await updateMatrixTaskStatus(taskId, data);
      toast.success("Task status updated");
      await fetchTaskDetails();
      onStatusChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setUpdatingStatus(false);
    }
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
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                          Assigned To
                        </label>
                        <select
                          value={editAssigneeId}
                          onChange={(e) => setEditAssigneeId(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role.replace(/_/g, " ")})
                            </option>
                          ))}
                        </select>
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
                    </div>
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
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Assigned To
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedAssigneeId}
                        onChange={(e) => setSelectedAssigneeId(e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                      >
                        <option value="">— Unassigned —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role.replace(/_/g, " ")})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={savingAssignee || selectedAssigneeId === (task.assignedToId || "")}
                        onClick={async () => {
                          setSavingAssignee(true);
                          try {
                            const payload: UpdateMatrixTaskRequest = {
                              title: task.title,
                              description: task.description,
                              categoryId: task.categoryId || task.category?.id,
                              dayNumber: task.dayNumber,
                              taskDate: task.taskDate || undefined,
                              status: task.status,
                              assignedToId: selectedAssigneeId || null,
                            };
                            await updateMatrixTask(taskId, payload);
                            toast.success(
                              selectedAssigneeId
                                ? `Assigned to ${users.find((u) => u.id === selectedAssigneeId)?.name || "user"}`
                                : "Assignee removed"
                            );
                            await fetchTaskDetails();
                            onStatusChanged();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed to assign");
                          } finally {
                            setSavingAssignee(false);
                          }
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                      >
                        {savingAssignee ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                    {task.assignedTo && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        Currently: <span className="font-medium text-gray-600">{task.assignedTo.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Completion notes (read-only if already set) */}
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

                  {/* Status update form */}
                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Update Status
                    </p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() => setNewStatus(key)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                              newStatus === key
                                ? `${val.bg} ${val.text} ${val.border}`
                                : "border-gray-200 text-gray-400 hover:border-gray-300"
                            }`}
                          >
                            {val.icon}
                            <span className="text-[10px]">{val.label}</span>
                          </button>
                        ))}
                      </div>

                      <textarea
                        placeholder="Completion notes (optional — useful when marking as Completed)"
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
                        rows={2}
                      />

                      <Button
                        size="sm"
                        onClick={handleStatusUpdate}
                        disabled={
                          updatingStatus ||
                          (newStatus === task.status &&
                            completionNotes === (task.completionNotes || ""))
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                      >
                        {updatingStatus ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Status"
                        )}
                      </Button>
                    </div>
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
                        return (
                          <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                          >
                            {attachmentTypeIcon[att.attachmentType] ||
                              attachmentTypeIcon.OTHER}
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
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                                title="Open"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
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
