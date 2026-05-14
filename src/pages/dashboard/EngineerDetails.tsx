import React, { useState, useEffect, useCallback, useMemo } from "react";

import { FileText } from "lucide-react";

import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  RotateCcw,
  Trash2,
  Loader2,
  ClipboardList,
  Flag,
  CircleDot,
  CheckCheck,
  Eye,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button, Card, Modal } from "../../components/ui";
import { getTasks } from "../../services/tasksApi";
import {
  getAdminSETasksByUserId,
  getMatrixTaskDetails,
  type SiteEngineerTask,
} from "../../services/siteEngineerApi";
import type { Task } from "../../types";
import {
  getAllTeamMembers,
  getTeamMemberProfile,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
  type DayTask,
  type UpdateTeamMemberPayload,
} from "../../services/teamApi";
import { useTeamMemberStore } from "../../stores/teamMemberStore";
import toast from "react-hot-toast";
import { VendorKycFileField } from "../../components/dashboard/VendorKycFileField";
import { VendorKycDocLink } from "../../components/dashboard/VendorKycDocLink";
import type { VendorKycSlot } from "../../services/vendorKycAttachments";

// ─── Constants ────────────────────────────────────────────────────────────────

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Roles that belong to internal CRM users — role must never be changed here
const INTERNAL_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "BDR",
  "HR",
  "PROJECT_MANAGER",
  "LEAD_PROJECT_MANAGER",
  "ACCOUNTS",
  "SITE_ENGINEER",
  "DESIGNER",
  "DESIGN_HEAD",
  "SALES",
]);

const ROLE_OPTIONS = [
  "Lead Carpenter",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Painter",
  "Mason",
  "Welder",
  "HVAC Technician",
  "Tile Setter",
  "Flooring Specialist",
  "General Contractor",
  "Site Manager",
  "Project Manager",
  "Designer",
  "Other",
];

const DEPARTMENT_OPTIONS = [
  "Design",
  "Execution",
  "Sales",
  "Management",
  "Operations",
  "Finance",
  "HR",
  "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Task helpers ────────────────────────────────────────────────────────────

const TASK_TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP: "Follow-Up",
  MEETING: "Meeting",
  CALL: "Call",
  DEMO: "Demo",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  SITE_VISIT: "Site Visit",
  DOCUMENTATION: "Documentation",
  OTHER: "Other",
};

const PRIORITY_META: Record<string, { bg: string; text: string; dot: string }> =
  {
    HIGH: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    MEDIUM: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    LOW: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  };

const STATUS_META: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    label: string;
    icon: React.ReactNode;
  }
> = {
  todo: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    label: "To Do",
    icon: <CircleDot className="w-3.5 h-3.5" />,
  },
  inprogress: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "In Progress",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Completed",
    icon: <CheckCheck className="w-3.5 h-3.5" />,
  },
};

function formatTaskDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Member Tasks Panel ──────────────────────────────────────────────────────

/** Convert a DayTask (from GET /api/team/:id) into the Task shape used by the panel */
function dayTaskToTask(t: DayTask): Task {
  const rawStatus = (t.status ?? "PENDING").toUpperCase();
  const status =
    rawStatus === "COMPLETED"
      ? "completed"
      : rawStatus === "IN_PROGRESS" || rawStatus === "INPROGRESS"
        ? "inprogress"
        : "todo";

  const dueDate = t.taskDate
    ? t.taskDate.includes("T")
      ? t.taskDate.split("T")[0]
      : t.taskDate
    : undefined;

  return {
    id: t.id,
    projectId: t.project?.id ?? "",
    title: t.title,
    taskType: "OTHER",
    dueDate: dueDate ?? "",
    priority: "MEDIUM",
    status,
    completed: status === "completed",
    createdAt: t.taskDate ?? "",
    updatedAt: t.taskDate ?? "",
    description: t.categoryName ? `Category: ${t.categoryName}` : undefined,
    ...(t.project?.projectName ? { projectName: t.project.projectName } : {}),
  } as unknown as Task;
}

/** Convert a SiteEngineerTask into the Task shape used by the panel UI */
function seTaskToTask(t: SiteEngineerTask): Task {
  // normalise status to lowercase so STATUS_META keys match
  const rawStatus = t.status?.toUpperCase() ?? "TODO";
  const normStatus =
    rawStatus === "PENDING" || rawStatus === "TODO"
      ? "todo"
      : rawStatus === "IN_PROGRESS" || rawStatus === "INPROGRESS"
        ? "inprogress"
        : rawStatus === "COMPLETED"
          ? "completed"
          : "todo";

  return {
    id: t.id,
    projectId: t.projectId ?? "",
    title: t.title,
    taskType: t.taskType ?? "OTHER",
    dueDate: t.dueDate ?? "",
    priority: t.priority ?? "MEDIUM",
    status: normStatus,
    completed: normStatus === "completed",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    description: t.description,
    dueTime: t.dueTime,
    completedAt: t.completedAt,
    // carry project name so the card can display it
    ...(t.projectName ? { projectName: t.projectName } : {}),
  } as unknown as Task;
}

const CalendarToolbar = ({ date, onNavigate, onView, view }: any) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 p-1">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900 capitalize">
          {format(date, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1 ml-4 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => onNavigate("TODAY")}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all shadow-sm"
          >
            Today
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={() => onNavigate("PREV")}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 hover:text-gray-900"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate("NEXT")}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 hover:text-gray-900"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
        {(["month", "week", "day", "agenda"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize font-sans ${
              view === v
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

const MemberTasksPanel: React.FC<{
  memberId: string;
  userId?: string;
  memberName?: string;
  preloadedTasks?: Task[];
}> = ({ memberId, userId, memberName, preloadedTasks }) => {
  const [tasks, setTasks] = useState<Task[]>(preloadedTasks ?? []);
  const [loading, setLoading] = useState(preloadedTasks === undefined);
  const [activeTab, setActiveTab] = useState<
    "all" | "todo" | "inprogress" | "completed"
  >("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list"); // Default View Mode
  const [currentDate, setCurrentDate] = useState(new Date()); // State for calendar date
  const [view, setView] = useState("month"); // State for calendar view

  const onNavigate = useCallback((action: "PREV" | "NEXT" | "TODAY") => {
    switch (action) {
      case "PREV":
        setCurrentDate((prev) => {
          if (view === "month") return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
          if (view === "week") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
          if (view === "day") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1);
          return prev;
        });
        break;
      case "NEXT":
        setCurrentDate((prev) => {
           if (view === "month") return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
           if (view === "week") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
           if (view === "day") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
           return prev;
        });
        break;
      case "TODAY":
        setCurrentDate(new Date());
        break;
    }
  }, [view]);

  const onView = useCallback((newView: any) => setView(newView), []);

  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const handleViewTask = async (taskId: string, taskTitle: string) => {
    if (viewingTaskId) return;
    setViewingTaskId(taskId);
    try {
      const details = await getMatrixTaskDetails(taskId);
      if (details.attachments && details.attachments.length > 0) {
        // Prefer PHOTO type, otherwise take the first one
        const photo =
          details.attachments.find((a) => a.attachmentType === "PHOTO") ||
          details.attachments[0];

        if (photo) {
          setSelectedImage({ url: photo.fileUrl, title: taskTitle });
        } else {
          toast.error("No image found for this task");
        }
      } else {
        toast.error("No attachments found for this task");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task details");
    } finally {
      setViewingTaskId(null);
    }
  };

  useEffect(() => {
    // If tasks were preloaded from the profile API, use them directly
    if (preloadedTasks !== undefined) {
      setTasks(preloadedTasks);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Build the set of IDs to match against — team-member id + auth userId
    const ids = new Set<string>([memberId]);
    if (userId) ids.add(userId);

    // Promises to run in parallel:
    //   1. SE matrix tasks — dual-strategy admin fetch (see siteEngineerApi.ts)
    //      Pass both userId (may be undefined) AND memberId so the helper can
    //      filter by whichever field the server populates.
    //   2. General CRM tasks (filter client-side by assignedToId)
    const sePromise: Promise<Task[]> = getAdminSETasksByUserId(userId, memberId)
      .then((list) => list.map(seTaskToTask))
      .catch(() => []);

    const generalPromise: Promise<Task[]> = getTasks()
      .then((allTasks) =>
        allTasks.filter((t) => {
          if (t.assignedToId && ids.has(t.assignedToId)) return true;
          if (t.assigneeIds?.some((aid) => ids.has(aid))) return true;
          if (t.assignees?.some((a) => ids.has(a.id))) return true;
          if (
            typeof t.assignedTo === "string" &&
            t.assignedTo &&
            ids.has(t.assignedTo)
          )
            return true;
          return false;
        }),
      )
      .catch(() => []);

    Promise.all([sePromise, generalPromise]).then(([seTasks, generalTasks]) => {
      if (cancelled) return;
      // De-duplicate by id — SE tasks take precedence
      const seen = new Set<string>(seTasks.map((t) => t.id));
      const merged = [
        ...seTasks,
        ...generalTasks.filter((t) => !seen.has(t.id)),
      ];
      setTasks(merged);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [memberId, userId, preloadedTasks]);

  // Handle Calendar Navigation
  const handleNavigate = (_date: Date, _view: string, action: string) => {
    onNavigate(action as any);
  };

  const normalize = (s: string) => s.toLowerCase().replace(/[_\-\s]/g, "");
  const total = tasks.length;
  const todoCount = tasks.filter(
    (t) => normalize(t.status) === "todo" || normalize(t.status) === "pending",
  ).length;
  const inProgCount = tasks.filter(
    (t) => normalize(t.status) === "inprogress",
  ).length;
  const doneCount = tasks.filter(
    (t) => normalize(t.status) === "completed" || t.completed,
  ).length;

  const matchTab = (t: Task) => {
    const ns = normalize(t.status);
    if (activeTab === "todo") return ns === "todo" || ns === "pending";
    if (activeTab === "inprogress") return ns === "inprogress";
    if (activeTab === "completed") return ns === "completed" || t.completed;
    return true;
  };
  const filtered = activeTab === "all" ? tasks : tasks.filter(matchTab);

  const tabs = [
    { key: "all", label: "All", count: total },
    { key: "todo", label: "To Do", count: todoCount },
    { key: "inprogress", label: "In Progress", count: inProgCount },
    { key: "completed", label: "Completed", count: doneCount },
  ] as const;

  const calendarEvents = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate || t.createdAt)
      .map((t) => {
        let start = new Date(t.dueDate || t.createdAt);
        // try to parse time if exists
        if (t.dueTime) {
          const timeParts = t.dueTime.match(/(\d+):(\d+)\s?(AM|PM)?/i);
          if (timeParts) {
            let hour = parseInt(timeParts[1]);
            let minute = parseInt(timeParts[2]);
            const ampm = timeParts[3]?.toUpperCase();

            if (ampm === "PM" && hour < 12) hour += 12;
            if (ampm === "AM" && hour === 12) hour = 0;

            start.setHours(hour, minute, 0, 0);
          }
        }

        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        const status = normalize(t.status || "todo");
        let color = "#3b82f6"; // default blue
        if (status === "completed") color = "#10b981"; // green
        else if (status === "inprogress") color = "#f97316"; // orange
        else if (status === "todo" || status === "pending") color = "#8b5cf6"; // purple

        return {
          id: t.id,
          title: t.title,
          start,
          end,
          resource: t,
          status,
          color,
          allDay: !t.dueTime,
        };
      });
  }, [tasks]);

  const eventStyleGetter = (event: any) => {
    // Cleaner style with border on left only, full bg
    return {
      style: {
        backgroundColor: event.color + "15", // Lower opacity for bg
        color: event.color,
        borderLeft: `3px solid ${event.color}`,
        border: "none",
        fontSize: "0.75rem",
        borderRadius: "4px",
        padding: "2px 4px",
        fontWeight: "600",
      },
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Tasks assigned to{" "}
              {memberName ? memberName.split(" ")[0] : "Member"}
            </h2>
            <p className="text-xs text-gray-500">
              All tasks assigned to this team member
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-0.5 bg-gray-100 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            value: total,
            color: "text-gray-900",
            bg: "bg-white",
            border: "border-gray-200",
          },
          {
            label: "To Do",
            value: todoCount,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200",
          },
          {
            label: "In Progress",
            value: inProgCount,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
          },
          {
            label: "Completed",
            value: doneCount,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}
          >
            <p className={`text-2xl font-extrabold ${s.color}`}>
              {loading ? "—" : s.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {activeTab === "all"
                ? "No tasks assigned to this member yet"
                : `No ${activeTab === "inprogress" ? "in-progress" : activeTab} tasks`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const statusMeta =
                STATUS_META[task.status?.toLowerCase()] ?? STATUS_META["todo"];
              const priorityMeta = PRIORITY_META[task.priority ?? "MEDIUM"];
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    task.status === "completed"
                      ? "bg-gray-50/60 border-gray-100 opacity-70"
                      : "bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm"
                  }`}
                >
                  {/* Status icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      task.status === "completed"
                        ? "bg-green-100 border-green-200 text-green-600"
                        : "bg-white border-gray-200 text-gray-400"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <CheckCheck className="w-3.5 h-3.5" />
                    ) : (
                      <CircleDot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        task.status === "completed"
                          ? "line-through text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {/* Type */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
                        <Briefcase className="w-3 h-3" />
                        {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
                      </span>
                      {/* Due date */}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                          <CalendarIcon className="w-3 h-3" />
                          {formatTaskDate(task.dueDate)}
                          {task.dueTime && (
                            <span className="text-gray-400">
                              · {task.dueTime}
                            </span>
                          )}
                        </span>
                      )}
                      {/* Priority */}
                      {task.priority && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${
                            priorityMeta?.bg ?? "bg-gray-50"
                          } ${priorityMeta?.text ?? "text-gray-600"} border-transparent`}
                        >
                          <Flag className="w-3 h-3" />
                          {task.priority}
                        </span>
                      )}
                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                      >
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Created at & Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {formatTaskDate(task.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTask(task.id, task.title);
                      }}
                      disabled={!!viewingTaskId}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View attachment"
                    >
                      {viewingTaskId === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
      </>
      ) : (
        <div className="h-[650px] bg-white rounded-xl border p-4 shadow-sm calendar-wrapper">
          <style>{`
            .rbc-calendar { font-family: inherit; }
            .rbc-header { padding: 12px 4px; font-weight: 600; font-size: 0.875rem; color: #4b5563; }
            .rbc-month-view { border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; }
            .rbc-day-bg { background-color: white; }
            .rbc-off-range-bg { background-color: #f9fafb; }
            .rbc-today { background-color: #fff7ed; }
            .rbc-event { padding: 2px 4px !important; border-radius: 4px !important; }
          `}</style>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={["month", "week", "day", "agenda"]}
            view={view as any} // Controlled View
            onView={onView} // Handle view change
            date={currentDate} // Controlled Date
            onNavigate={handleNavigate} // Handle navigation
            defaultView="month"
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CalendarToolbar,
              event: ({ event }) => (
                <div className="flex items-center gap-1.5 overflow-hidden w-full">
                  {event.status === "completed" ? (
                    <CheckCheck className="w-3 h-3 shrink-0" />
                  ) : (
                    <CircleDot className="w-3 h-3 shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-bold leading-tight">
                      {event.title}
                    </span>
                    {event.allDay === false && (
                      <span className="text-[10px] opacity-80 leading-tight">
                        {format(event.start, "h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              ),
            }}
            onSelectEvent={(event) => handleViewTask(event.id, event.title)}
          />
        </div>
      )}

      {selectedImage && (
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title={`Attachment: ${selectedImage.title}`}
        >
          <div className="flex justify-center bg-gray-50 rounded-lg overflow-hidden p-2">
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const CardHeading: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="mb-5">
    <h2 className="text-sm font-semibold text-gray-900 tracking-tight">{title}</h2>
    {subtitle ? (
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
    ) : null}
  </div>
);

// ─── Page Component ──────────────────────────────────────────────────────────


const KYC_URL_FIELDS: {
  field: keyof TeamMember;
  label: string;
  slot: VendorKycSlot;
}[] = [
  { field: "aadhaarUrl", label: "Aadhaar", slot: "aadhaar" },
  { field: "panUrl", label: "PAN", slot: "pan" },
  { field: "gstCertificateUrl", label: "GST Certificate", slot: "gst" },
  { field: "msmeCertificateUrl", label: "MSME Certificate", slot: "msme" },
];

const VendorComplianceCard: React.FC<{
  member: TeamMember;
  isEditing: boolean;
  editForm: UpdateTeamMemberPayload;
  setEditForm: React.Dispatch<React.SetStateAction<UpdateTeamMemberPayload>>;
}> = ({ member, isEditing, editForm, setEditForm }) => (
  <Card className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-full flex flex-col">
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
        Compliance documents
      </h2>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        {isEditing
          ? "Upload or replace PDFs and images (max 4 MB each). Changes save when you upload."
          : "KYC items on file for this vendor."}
      </p>
    </div>
    <ul className="flex-1 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/30 overflow-hidden">
      {KYC_URL_FIELDS.map(({ field, label, slot }) => {
        const raw = (
          isEditing
            ? (editForm[field as keyof UpdateTeamMemberPayload] as string | undefined)
            : (member[field as keyof TeamMember] as string | undefined)
        )
          ?.trim() ?? "";
        const has = Boolean(raw);
        return (
          <li
            key={field}
            className="flex flex-col gap-3 bg-white px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                {!isEditing && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {has ? "On file" : "Not uploaded"}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full min-w-0 sm:max-w-[240px] shrink-0 sm:ml-auto">
              {isEditing ? (
                <VendorKycFileField
                  hideLabel
                  dense
                  label={label}
                  kycSlot={slot}
                  teamMemberId={member.id}
                  linkedUserId={member.userId}
                  value={raw}
                  onChange={(next) =>
                    setEditForm((p) => ({
                      ...p,
                      [field]: next || null,
                    }))
                  }
                />
              ) : has ? (
                <div className="flex sm:justify-end pt-0.5">
                  <VendorKycDocLink
                    stored={raw}
                    variant="minimal"
                    linkLabel={raw.startsWith("data:") ? "Open file" : "View"}
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-400 sm:block sm:text-right">
                  —
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  </Card>
);

export const EngineerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // The list page passes the full member object via state to avoid a broken GET /api/team/:id
  const stateData =
    (location.state as { member?: TeamMember } | null)?.member ?? null;

  const [member, setMember] = useState<TeamMember | null>(stateData);
  const [profileDayTasks, setProfileDayTasks] = useState<Task[] | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(!stateData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTeamMemberPayload>({});

  const { setCurrentTeamMember } = useTeamMemberStore();

  // Sync breadcrumb store whenever member data changes
  useEffect(() => {
    if (member) setCurrentTeamMember({ id: member.id, name: member.name });
    return () => setCurrentTeamMember(null);
  }, [member, setCurrentTeamMember]);

  // Always call GET /api/team/:id to get the full profile including dayTasks.
  // Falls back to fetching the list if the call fails.
  const loadMember = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    if (!stateData) setIsLoading(true);
    try {
      const profile = await getTeamMemberProfile(id);
      setMember(profile.memberInfo);
      // Convert dayTasks from the profile into the Task shape used by the panel
      const converted = (profile.dayTasks ?? []).map(dayTaskToTask);
      setProfileDayTasks(converted);
    } catch {
      // Direct endpoint failed – fall back to fetching the full list
      try {
        const all = await getAllTeamMembers();
        const found = all.find((m) => String(m.id) === id);
        if (found) {
          setMember(found);
          setProfileDayTasks([]); // no day tasks from list endpoint
        } else if (!stateData) {
          toast.error("Team member not found.");
          navigate("/dashboard/engineers", { replace: true });
        }
      } catch {
        if (!stateData) {
          toast.error("Failed to load team member.");
          navigate("/dashboard/engineers", { replace: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, stateData]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEditing = () => {
    if (!member) return;
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      department: member.department,
      isActive: member.isActive !== false,
      aadhaarUrl: member.aadhaarUrl ?? "",
      panUrl: member.panUrl ?? "",
      gstCertificateUrl: member.gstCertificateUrl ?? "",
      msmeCertificateUrl: member.msmeCertificateUrl ?? "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!member) return;
    setIsSaving(true);
    try {
      // Never send a role change for internal CRM users
      const payload: UpdateTeamMemberPayload = { ...editForm };
      if (INTERNAL_ROLES.has((member.role ?? "").toUpperCase())) {
        delete payload.role;
      }
      const updated = await updateTeamMember(member.id, payload);
      setMember(updated);
      setIsEditing(false);
      setEditForm({});
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (
      !window.confirm(
        `Remove ${member.name} from the team? This cannot be undone.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      await deleteTeamMember(member.id);
      toast.success(`${member.name} has been removed.`);
      navigate("/dashboard/engineers", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 text-sm">Loading team member…</p>
      </div>
    );
  }

  if (!member) return null;

  const isActive = member.isActive !== false;
  // Internal CRM users must not have their role changed from this page
  const isInternalRole = INTERNAL_ROLES.has((member.role ?? "").toUpperCase());

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Back / Header bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate("/dashboard/engineers")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendors
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={cancelEditing}
                className="rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 shadow-none text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Remove
              </button>
              <Button
                onClick={startEditing}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Profile header (minimal) ───────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-2xl font-semibold text-white shadow-md ring-4 ring-orange-500/10">
            {isEditing && editForm.name
              ? getInitials(editForm.name)
              : getInitials(member.name)}
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                value={editForm.name ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mb-2 w-full max-w-xl rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-2xl font-semibold tracking-tight text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
                placeholder="Full name"
              />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                {member.name}
              </h1>
            )}
            {isEditing && !isInternalRole ? (
              <select
                value={editForm.role ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, role: e.target.value }))
                }
                className="mt-2 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
              >
                <option value="" disabled>
                  Select role
                </option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-gray-600">{member.role}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() =>
                    setEditForm((p) => ({
                      ...p,
                      isActive: !(p.isActive ?? isActive),
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    (editForm.isActive ?? isActive)
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {(editForm.isActive ?? isActive) ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Inactive
                    </>
                  )}
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Inactive
                    </>
                  )}
                </span>
              )}
              {member.department && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                  {member.department}
                </span>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex w-full shrink-0 flex-col gap-2 border-t border-gray-100 pt-4 md:w-auto md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <a
                href={`tel:${member.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-gray-300 hover:bg-gray-50"
              >
                <Phone className="h-4 w-4 text-gray-500" />
                Call
              </a>
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:border-gray-300 hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 text-gray-500" />
                Email
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Details grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <Card className="rounded-2xl border border-gray-100 p-5 shadow-sm">
            <CardHeading
              title="Contact"
              subtitle="Reach this vendor directly."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Phone
                </p>
                {isEditing ? (
                  <input
                    value={editForm.phone ?? ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                    placeholder="+91 …"
                  />
                ) : (
                  <>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {member.phone || "—"}
                    </p>
                    {member.phone ? (
                      <a
                        href={`tel:${member.phone}`}
                        className="mt-2 inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
                      >
                        Call now
                      </a>
                    ) : null}
                  </>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Email
                </p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email ?? ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                    placeholder="name@example.com"
                  />
                ) : (
                  <>
                    <p className="mt-2 truncate text-sm font-medium text-gray-900">
                      {member.email || "—"}
                    </p>
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="mt-2 inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
                      >
                        Send email
                      </a>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-100 p-5 shadow-sm">
            <CardHeading title="Role & department" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Job role
                </p>
                {isEditing && !isInternalRole ? (
                  <select
                    value={editForm.role ?? ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, role: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                  >
                    <option value="" disabled>
                      Select role
                    </option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {member.role || "—"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Department
                </p>
                {isEditing ? (
                  <select
                    value={editForm.department ?? ""}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, department: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {member.department || "—"}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <VendorComplianceCard
          member={member}
          isEditing={isEditing}
          editForm={editForm}
          setEditForm={setEditForm}
        />
      </div>

      {/* ── Tasks Section — tasks from GET /api/team/:id (dayTasks) ────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <MemberTasksPanel
          memberId={member.id}
          userId={member.userId}
          memberName={member.name}
          preloadedTasks={profileDayTasks}
        />
      </div>
    </div>
  );
};
