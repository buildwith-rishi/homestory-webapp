import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Camera,
  X,
  CalendarDays,
  Flag,
  Plus,
  Briefcase,
  FileText,
  Users,
  Target,
  Phone,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BDRTask {
  id: string;
  title: string;
  description?: string;
  taskType: string;
  dueDate: string;
  dueTime?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completionPhoto?: string; // base64 or object URL
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TODAY_STR = new Date().toISOString().split("T")[0];

const INITIAL_TASKS: BDRTask[] = [
  {
    id: "bdr-1",
    title: "Follow up with Arjun Sharma — Site Visit",
    taskType: "Follow-Up",
    dueDate: TODAY_STR,
    dueTime: "10:00",
    priority: "HIGH",
    status: "TODO",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Call Arjun Sharma regarding the 3BHK proposal sent on Monday. Confirm site visit schedule.",
  },
  {
    id: "bdr-2",
    title: "Proposal Presentation — Mehra Family",
    taskType: "Presentation",
    dueDate: TODAY_STR,
    dueTime: "12:00",
    priority: "HIGH",
    status: "IN_PROGRESS",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Present the full home design proposal to the Mehra family. Bring project portfolio and pricing sheet.",
  },
  {
    id: "bdr-3",
    title: "Lead Qualification — Patel Referral",
    taskType: "Lead",
    dueDate: TODAY_STR,
    dueTime: "14:30",
    priority: "MEDIUM",
    status: "TODO",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Qualify new referral lead from Rajesh Patel. Understand scope, budget, and timeline.",
  },
  {
    id: "bdr-4",
    title: "Contract Finalisation — Singh Villa",
    taskType: "Contract",
    dueDate: TODAY_STR,
    dueTime: "09:00",
    priority: "LOW",
    status: "COMPLETED",
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Collect signed contract and advance payment cheque from the Singh family.",
  },
  {
    id: "bdr-5",
    title: "Client Onboarding — Gupta Residence",
    taskType: "Onboarding",
    dueDate: TODAY_STR,
    dueTime: "16:00",
    priority: "HIGH",
    status: "TODO",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Walk the Gupta family through the project onboarding process. Introduce site engineer and share timeline.",
  },
];

const STATUS_OPTIONS = [
  {
    value: "TODO",
    label: "To Do",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

const TASK_TYPES = [
  "Follow-Up",
  "Lead",
  "Presentation",
  "Contract",
  "Onboarding",
  "Meeting",
  "Site Visit",
  "Other",
];

const TASK_TYPE_ICONS: Record<string, typeof Briefcase> = {
  "Follow-Up": Phone,
  Lead: Target,
  Presentation: FileText,
  Contract: FileText,
  Onboarding: Users,
  Meeting: Users,
  "Site Visit": MapPin,
  Other: Briefcase,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(time?: string) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function genId() {
  return `bdr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BDRTasks() {
  const [tasks, setTasks] = useState<BDRTask[]>(INITIAL_TASKS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Task Detail Modal ──
  const [selectedTask, setSelectedTask] = useState<BDRTask | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [workPhoto, setWorkPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── Add Task Modal ──
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    taskType: "Follow-Up",
    priority: "MEDIUM" as BDRTask["priority"],
    dueDate: TODAY_STR,
    dueTime: "",
    status: "TODO" as BDRTask["status"],
  });
  const [addTaskPhoto, setAddTaskPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const addTaskCameraRef = useRef<HTMLInputElement>(null);
  const [isSavingNewTask, setIsSavingNewTask] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsRefreshing(false);
    toast.success("Tasks refreshed");
  }, []);

  // ── Week navigation ──
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  // ── Derived data ──
  const tasksForDate = tasks.filter((t) => t.dueDate === selectedDateStr);
  const pendingTasks = tasksForDate.filter((t) => !t.completed);
  const completedTasks = tasksForDate.filter((t) => t.completed);
  const totalTasks = tasksForDate.length;
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // ── Task Detail handlers ──
  const handleOpenTaskDetail = (task: BDRTask) => {
    setSelectedTask(task);
    setEditStatus(task.status);
    setWorkPhoto(null);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
    setEditStatus("");
    if (workPhoto?.previewUrl) URL.revokeObjectURL(workPhoto.previewUrl);
    setWorkPhoto(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedTask) return;
    setIsSavingStatus(true);
    await new Promise((r) => setTimeout(r, 500));
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              status: editStatus as BDRTask["status"],
              completed: editStatus === "COMPLETED",
              completionPhoto: workPhoto?.previewUrl || t.completionPhoto,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    setIsSavingStatus(false);
    toast.success("Task status updated!");
    handleCloseTaskDetail();
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (workPhoto?.previewUrl) URL.revokeObjectURL(workPhoto.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setWorkPhoto({ file, previewUrl });
    toast.success("Photo captured!");
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleToggleTask = (taskId: string, shouldComplete: boolean) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: shouldComplete,
              status: shouldComplete ? "COMPLETED" : "TODO",
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    toast.success(shouldComplete ? "Task completed!" : "Task reopened");
  };

  // ── Add Task handlers ──
  const handleOpenAddTask = () => {
    setNewTask({
      title: "",
      description: "",
      taskType: "Follow-Up",
      priority: "MEDIUM",
      dueDate: selectedDateStr,
      dueTime: "",
      status: "TODO",
    });
    setAddTaskPhoto(null);
    setShowAddTask(true);
  };

  const handleCloseAddTask = () => {
    setShowAddTask(false);
    if (addTaskPhoto?.previewUrl) URL.revokeObjectURL(addTaskPhoto.previewUrl);
    setAddTaskPhoto(null);
  };

  const handleAddTaskCameraCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (addTaskPhoto?.previewUrl) URL.revokeObjectURL(addTaskPhoto.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setAddTaskPhoto({ file, previewUrl });
    toast.success("Photo captured!");
    e.target.value = "";
  };

  const handleSaveNewTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setIsSavingNewTask(true);
    await new Promise((r) => setTimeout(r, 500));
    const task: BDRTask = {
      id: genId(),
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      taskType: newTask.taskType,
      dueDate: newTask.dueDate,
      dueTime: newTask.dueTime || undefined,
      priority: newTask.priority,
      status: newTask.status,
      completed: newTask.status === "COMPLETED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completionPhoto: addTaskPhoto?.previewUrl,
    };
    setTasks((prev) => [task, ...prev]);
    setIsSavingNewTask(false);
    toast.success("Task added!");
    handleCloseAddTask();
  };

  // ── Cleanup object URLs on unmount ──
  useEffect(() => {
    return () => {
      if (workPhoto?.previewUrl) URL.revokeObjectURL(workPhoto.previewUrl);
      if (addTaskPhoto?.previewUrl)
        URL.revokeObjectURL(addTaskPhoto.previewUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Tasks" showNotifications />

      {/* Stats Summary */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Today's Progress
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-orange-600 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-600">Done</p>
          </div>
        </div>
        {totalTasks > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-bold text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Week Selector */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-20 shadow-sm">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {weekDates.map((date) => {
            const isSelected =
              date.toISOString().split("T")[0] === selectedDateStr;
            const isToday =
              date.toISOString().split("T")[0] ===
              new Date().toISOString().split("T")[0];
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[56px] h-18 rounded-xl transition-all shadow-sm ${
                  isSelected
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white scale-105 shadow-md"
                    : isToday
                      ? "bg-orange-50 text-orange-600 border-2 border-orange-300"
                      : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                <span className="text-xs font-medium">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-xl font-bold mt-0.5">
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Add Task Button */}
        <button
          onClick={handleOpenAddTask}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3.5 font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Task
        </button>

        {/* Empty State */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-sm text-gray-600">
              No tasks scheduled for this day
            </p>
          </div>
        )}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-orange-500 rounded-full" />
              <h3 className="text-sm font-bold text-gray-900">My Tasks</h3>
              <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {pendingTasks.length}{" "}
                {pendingTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>
            <div className="space-y-3">
              {pendingTasks.map((task) => {
                const TypeIcon = TASK_TYPE_ICONS[task.taskType] || Briefcase;
                return (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTaskDetail(task)}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id, !task.completed);
                        }}
                        className="mt-0.5 flex-shrink-0 active:scale-95 transition-transform"
                      >
                        <div className="w-6 h-6 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center transition-all" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {task.dueTime && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50 text-orange-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {formatTime(task.dueTime)}
                              </span>
                            </div>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                            <TypeIcon className="w-3 h-3" />
                            {task.taskType}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                          >
                            <Flag className="w-3 h-3" />
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">
                  Completed Tasks
                </span>
                <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-full">
                  {completedTasks.length}
                </span>
              </div>
              {showCompleted ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showCompleted && (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTaskDetail(task)}
                    className="bg-white rounded-xl border border-gray-200 p-4 opacity-70 hover:opacity-100 hover:border-green-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id, false);
                        }}
                        className="mt-0.5 flex-shrink-0 active:scale-95 transition-transform"
                      >
                        <div className="w-6 h-6 rounded-lg border-2 bg-gradient-to-br from-green-500 to-green-600 border-green-500 flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 line-through">
                          {task.title}
                        </p>
                        {task.completionPhoto && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                            <Camera className="w-3 h-3" />
                            Photo attached
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Task Detail Modal ═════════════════════════════════════════════════ */}
      {selectedTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    {(() => {
                      const Icon =
                        TASK_TYPE_ICONS[selectedTask.taskType] || Briefcase;
                      return <Icon className="w-4 h-4 text-orange-600" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Task Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseTaskDetail}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                {/* Title */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">
                    {selectedTask.title}
                  </h2>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  )}
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-1">
                      Type
                    </p>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const Icon =
                          TASK_TYPE_ICONS[selectedTask.taskType] || Briefcase;
                        return <Icon className="w-3.5 h-3.5 text-purple-600" />;
                      })()}
                      <span className="text-sm font-semibold text-purple-800">
                        {selectedTask.taskType}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`rounded-xl p-3 ${PRIORITY_STYLES[selectedTask.priority] || "bg-gray-50"}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">
                      Priority
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5" />
                      <span className="text-sm font-semibold">
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>
                  {selectedTask.dueDate && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Due Date
                      </p>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-800">
                          {new Date(selectedTask.dueDate).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedTask.dueTime && (
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide mb-1">
                        Time
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-800">
                          {formatTime(selectedTask.dueTime)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Update Status
                  </label>
                  <div className="relative">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="mt-2">
                    {(() => {
                      const s = STATUS_OPTIONS.find(
                        (o) => o.value === editStatus,
                      );
                      return s ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Camera Section — enabled only when COMPLETED */}
                <div
                  className={`rounded-2xl border-2 transition-all overflow-hidden ${
                    editStatus === "COMPLETED"
                      ? "border-green-300 bg-green-50"
                      : "border-dashed border-gray-200 bg-gray-50 opacity-50"
                  }`}
                >
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera
                        className={`w-4 h-4 ${editStatus === "COMPLETED" ? "text-green-600" : "text-gray-400"}`}
                      />
                      <p
                        className={`text-sm font-bold ${editStatus === "COMPLETED" ? "text-green-800" : "text-gray-400"}`}
                      >
                        Task Completion Photo
                      </p>
                    </div>
                    <p
                      className={`text-xs ${editStatus === "COMPLETED" ? "text-green-700" : "text-gray-400"}`}
                    >
                      {editStatus === "COMPLETED"
                        ? "Capture or upload a photo as proof of task completion."
                        : "Mark the task as Completed to enable photo capture."}
                    </p>
                  </div>

                  {editStatus === "COMPLETED" && (
                    <div className="px-4 pb-4">
                      {workPhoto ? (
                        <div className="relative">
                          <img
                            src={workPhoto.previewUrl}
                            alt="Task completion"
                            className="w-full h-48 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => {
                              URL.revokeObjectURL(workPhoto.previewUrl);
                              setWorkPhoto(null);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Photo Ready
                          </div>
                          <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 border border-gray-200"
                          >
                            <Camera className="w-3 h-3" />
                            Retake
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="w-full h-32 flex flex-col items-center justify-center gap-2.5 bg-white border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 hover:border-green-400 active:scale-95 transition-all"
                        >
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-green-700">
                              Capture Photo
                            </p>
                            <p className="text-xs text-green-600 mt-0.5">
                              Tap to open camera or choose from gallery
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show existing completion photo */}
                  {editStatus !== "COMPLETED" &&
                    selectedTask.completionPhoto && (
                      <div className="px-4 pb-4">
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                          Previously attached photo:
                        </p>
                        <img
                          src={selectedTask.completionPhoto}
                          alt="Previous completion"
                          className="w-full h-32 object-cover rounded-xl opacity-50"
                        />
                      </div>
                    )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button
                  onClick={handleCloseTaskDetail}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatus}
                  disabled={isSavingStatus}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isSavingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Status
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ══ Add Task Modal ════════════════════════════════════════════════════ */}
      {showAddTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Add New Task
                    </h3>
                    <p className="text-xs text-gray-500">
                      Fill in the task details below
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAddTask}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. Follow up with Sharma — Site Visit"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Add task details, notes, or instructions..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors outline-none resize-none"
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Task Type
                  </label>
                  <div className="relative">
                    <select
                      value={newTask.taskType}
                      onChange={(e) =>
                        setNewTask((p) => ({ ...p, taskType: e.target.value }))
                      }
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors outline-none"
                    >
                      {TASK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewTask((prev) => ({ ...prev, priority: p }))}
                        className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          newTask.priority === p
                            ? p === "HIGH"
                              ? "bg-red-500 text-white border-red-500"
                              : p === "MEDIUM"
                                ? "bg-yellow-500 text-white border-yellow-500"
                                : "bg-green-500 text-white border-green-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask((p) => ({
                          ...p,
                          status: e.target.value as BDRTask["status"],
                        }))
                      }
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors outline-none"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Due Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask((p) => ({ ...p, dueDate: e.target.value }))
                      }
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={newTask.dueTime}
                      onChange={(e) =>
                        setNewTask((p) => ({ ...p, dueTime: e.target.value }))
                      }
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-colors outline-none"
                    />
                  </div>
                </div>

                {/* Camera — only enabled when status is COMPLETED */}
                <div
                  className={`rounded-2xl border-2 transition-all overflow-hidden ${
                    newTask.status === "COMPLETED"
                      ? "border-green-300 bg-green-50"
                      : "border-dashed border-gray-200 bg-gray-50 opacity-50"
                  }`}
                >
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera
                        className={`w-4 h-4 ${newTask.status === "COMPLETED" ? "text-green-600" : "text-gray-400"}`}
                      />
                      <p
                        className={`text-sm font-bold ${newTask.status === "COMPLETED" ? "text-green-800" : "text-gray-400"}`}
                      >
                        Task Completion Photo
                      </p>
                    </div>
                    <p
                      className={`text-xs ${newTask.status === "COMPLETED" ? "text-green-700" : "text-gray-400"}`}
                    >
                      {newTask.status === "COMPLETED"
                        ? "Capture or upload a photo as proof of task completion."
                        : "Set the status to Completed to enable photo capture."}
                    </p>
                  </div>

                  {newTask.status === "COMPLETED" && (
                    <div className="px-4 pb-4">
                      {addTaskPhoto ? (
                        <div className="relative">
                          <img
                            src={addTaskPhoto.previewUrl}
                            alt="Task completion"
                            className="w-full h-40 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => {
                              URL.revokeObjectURL(addTaskPhoto.previewUrl);
                              setAddTaskPhoto(null);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Photo Ready
                          </div>
                          <button
                            onClick={() => addTaskCameraRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 border border-gray-200"
                          >
                            <Camera className="w-3 h-3" />
                            Retake
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addTaskCameraRef.current?.click()}
                          className="w-full h-28 flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 hover:border-green-400 active:scale-95 transition-all"
                        >
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-green-700">
                              Capture Photo
                            </p>
                            <p className="text-xs text-green-600 mt-0.5">
                              Tap to open camera or gallery
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button
                  onClick={handleCloseAddTask}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewTask}
                  disabled={isSavingNewTask || !newTask.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isSavingNewTask ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Task
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Hidden camera inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      <input
        ref={addTaskCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleAddTaskCameraCapture}
      />
    </div>
  );
}
