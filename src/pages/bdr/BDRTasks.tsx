import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Trash2,
  ListChecks,
  Sparkles,
  Grid3X3,
  TrendingUp,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import toast from "react-hot-toast";
import {
  getBDRTasks,
  createBDRTask,
  updateBDRTask,
  deleteBDRTask,
  type BDRTaskAPIItem,
} from "../../services/bdrApi";
import {
  getSiteEngineerTasks,
  updateSiteEngineerTaskStatus,
  type SiteEngineerTask,
} from "../../services/siteEngineerApi";

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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── API ↔ UI mapping helpers ──────────────────────────────────────────────────
/** Convert UI status ("TODO" / "IN_PROGRESS" / "COMPLETED") → API status string */
const toAPIStatus = (s: string): string => {
  const m: Record<string, string> = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
  };
  return m[s.toUpperCase()] ?? "TODO";
};

/** Convert API status string → UI status enum */
const fromAPIStatus = (s: string): BDRTask["status"] => {
  const m: Record<string, BDRTask["status"]> = {
    todo: "TODO",
    pending: "TODO", // API stores initial state as PENDING
    inprogress: "IN_PROGRESS",
    in_progress: "IN_PROGRESS",
    completed: "COMPLETED",
  };
  return m[s.toLowerCase()] ?? "TODO";
};

/** Map a raw API task object to the UI BDRTask shape */
const mapAPITask = (t: BDRTaskAPIItem): BDRTask => ({
  id: t.id,
  title: t.title,
  description: t.description ?? undefined,
  taskType: t.taskType,
  // API returns full ISO timestamp like "2026-03-10T00:00:00.000Z" — strip time
  dueDate: t.dueDate ? t.dueDate.split("T")[0] : t.dueDate,
  dueTime: t.dueTime ?? undefined,
  priority: (t.priority as BDRTask["priority"]) ?? "MEDIUM",
  status: fromAPIStatus(t.status),
  completed: fromAPIStatus(t.status) === "COMPLETED",
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

/** Map a Matrix/SiteEngineer task to the BDRTask shape */
const mapMatrixTask = (t: SiteEngineerTask): BDRTask => ({
  id: t.id,
  title: t.projectName ? `[${t.projectName}] ${t.title}` : t.title,
  description: t.description,
  taskType: "Project Task",
  dueDate: t.dueDate ?? TODAY_STR,
  dueTime: t.dueTime ?? undefined,
  // Normalize priority
  priority:
    t.priority === "URGENT" || t.priority === "HIGH"
      ? "HIGH"
      : t.priority === "LOW"
        ? "LOW"
        : "MEDIUM",
  status:
    t.status === "COMPLETED"
      ? "COMPLETED"
      : t.status === "IN_PROGRESS"
        ? "IN_PROGRESS"
        : "TODO",
  completed: t.status === "COMPLETED",
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  completionPhoto: t.photos?.[0]?.url,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(time?: string) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getMondayWeek(anchor: Date): Date[] {
  const dow = anchor.getDay();
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getMonthCalendar(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BDRTasks() {
  const today = new Date();
  const [tasks, setTasks] = useState<BDRTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [calMonth, setCalMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
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
  const [isSavingNewTask, setIsSavingNewTask] = useState(false);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setTasksError(null);
    try {
      // Fetch both BDR specific tasks and assigned Matrix tasks
      const [bdrRes, matrixRes] = await Promise.all([
        getBDRTasks(100, 0),
        getSiteEngineerTasks().catch(() => []), // Fail gracefully for matrix tasks
      ]);

      const bdrTasks = bdrRes.tasks.map(mapAPITask);
      const matrixTasks = matrixRes.map(mapMatrixTask);

      // Merge and sort by creation date (newest first)
      const allTasks = [...bdrTasks, ...matrixTasks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setTasks(allTasks);
    } catch (err) {
      setTasksError(
        err instanceof Error ? err.message : "Failed to load tasks",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadTasks();
      toast.success("Tasks refreshed");
    } catch {
      // error already shown by loadTasks
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTasks]);

  // ── Calendar navigation ──
  const weekDates = getMondayWeek(weekAnchor);
  const selectedDateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(today);

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
    const needsCompletionPhoto =
      editStatus === "COMPLETED" && !workPhoto && !selectedTask.completionPhoto;
    if (needsCompletionPhoto) {
      toast.error("Please add a completion photo before saving.");
      return;
    }

    setIsSavingStatus(true);
    try {
      let updated: BDRTask;
      if (selectedTask.taskType === "Project Task") {
        // Handle Matrix/Site Engineer Task
        const apiStatus = toAPIStatus(editStatus);
        const seStatus = apiStatus;

        const res = await updateSiteEngineerTaskStatus(selectedTask.id, {
          status: seStatus as "TODO" | "IN_PROGRESS" | "COMPLETED",
        });
        updated = mapMatrixTask(res);
      } else {
        // Handle Standard BDR Task
        const res = await updateBDRTask(selectedTask.id, {
          status: toAPIStatus(editStatus),
        });
        updated = mapAPITask(res);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? updated : t)),
      );
      toast.success("Task status updated!");
      handleCloseTaskDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSavingStatus(false);
    }
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
    setShowAddTask(true);
  };

  const handleCloseAddTask = () => {
    setShowAddTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task?.taskType === "Project Task") {
      toast.error(
        "Project tasks cannot be deleted from here. Go to the project page.",
      );
      return;
    }

    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await deleteBDRTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
      handleCloseTaskDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleSaveNewTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setIsSavingNewTask(true);
    try {
      await createBDRTask({
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        taskType: newTask.taskType.toUpperCase().replace(/[\s-]/g, "_"),
        status: toAPIStatus(newTask.status),
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        dueTime: newTask.dueTime || undefined,
      });
      toast.success("Task added!");
      handleCloseAddTask();
      // Reload from API so the list is always in sync with server state
      await loadTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setIsSavingNewTask(false);
    }
  };

  // ── Cleanup object URLs on unmount ──
  useEffect(() => {
    return () => {
      if (workPhoto?.previewUrl) URL.revokeObjectURL(workPhoto.previewUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build a map of date string → task count for dot indicators
  const taskCountByDate = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.dueDate) acc[t.dueDate] = (acc[t.dueDate] ?? 0) + 1;
    return acc;
  }, {});

  const PRIORITY_BORDER: Record<string, string> = {
    HIGH: "border-l-red-400",
    MEDIUM: "border-l-yellow-400",
    LOW: "border-l-green-400",
  };

  const PRIORITY_BADGE_BG: Record<string, string> = {
    HIGH: "bg-red-50 text-red-600",
    MEDIUM: "bg-yellow-50 text-yellow-600",
    LOW: "bg-green-50 text-green-600",
  };

  const selectedDayLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-24">
      <MobileHeader title="Tasks" showNotifications />

      {/* ── Hero Progress Banner ──────────────────────────────────────────── */}
      <div className="bg-white shadow-sm">
        {/* Top bar: label + refresh */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-bold text-gray-800">
              Today's Progress
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-orange-500 text-xs font-semibold bg-orange-50 px-3 py-1.5 rounded-full disabled:opacity-50 active:scale-95 transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 flex flex-col gap-1 shadow-sm">
            <p className="text-2xl font-extrabold text-white leading-none">
              {totalTasks}
            </p>
            <p className="text-[11px] font-medium text-indigo-100">Total</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-3 flex flex-col gap-1 shadow-sm">
            <p className="text-2xl font-extrabold text-white leading-none">
              {pendingCount}
            </p>
            <p className="text-[11px] font-medium text-orange-100">Pending</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 flex flex-col gap-1 shadow-sm">
            <p className="text-2xl font-extrabold text-white leading-none">
              {completedCount}
            </p>
            <p className="text-[11px] font-medium text-emerald-100">Done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Completion rate</span>
            <span className="font-bold text-gray-800">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Calendar Selector ─────────────────────────────────────────────── */}
      <div className="sticky top-16 bg-white border-b border-gray-100 z-20 shadow-sm">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {viewMode === "month"
              ? `${MONTHS[calMonth.getMonth()]} ${calMonth.getFullYear()}`
              : `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (viewMode === "month") {
                  setCalMonth(
                    new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1),
                  );
                } else {
                  const d = new Date(weekAnchor);
                  d.setDate(d.getDate() - 7);
                  setWeekAnchor(d);
                }
              }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setWeekAnchor(new Date(today));
                setSelectedDate(new Date(today));
                setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
              className="px-3 h-8 rounded-full bg-orange-50 text-orange-600 text-xs font-bold active:scale-95 transition border border-orange-200"
            >
              Today
            </button>
            <button
              onClick={() => {
                if (viewMode === "month") {
                  setCalMonth(
                    new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1),
                  );
                } else {
                  const d = new Date(weekAnchor);
                  d.setDate(d.getDate() + 7);
                  setWeekAnchor(d);
                }
              }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-3 pb-2">
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "week"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Week
            </button>
            <button
              onClick={() => {
                setCalMonth(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    1,
                  ),
                );
                setViewMode("month");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "month"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Month
            </button>
          </div>
        </div>

        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-1.5 px-3 pb-3">
            {weekDates.map((date) => {
              const dateStr = toDateStr(date);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const count = taskCountByDate[dateStr] ?? 0;
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(new Date(date))}
                  className={`flex flex-col items-center justify-center w-full py-2.5 rounded-2xl transition-all active:scale-95 ${
                    isSelected
                      ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-md"
                      : isToday
                        ? "bg-orange-50 text-orange-600 border-2 border-orange-300"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide leading-none ${
                      isSelected
                        ? "text-orange-100"
                        : isToday
                          ? "text-orange-500"
                          : "text-gray-400"
                    }`}
                  >
                    {date
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .slice(0, 2)}
                  </span>
                  <span
                    className={`text-base font-extrabold mt-1 leading-none ${
                      isSelected
                        ? "text-white"
                        : isToday
                          ? "text-orange-600"
                          : "text-gray-700"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1.5 h-1.5 flex items-center justify-center">
                    {count > 0 ? (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white/70" : "bg-orange-400"
                        }`}
                      />
                    ) : (
                      <div className="w-1.5 h-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {viewMode === "month" && (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            {getMonthCalendar(calMonth.getFullYear(), calMonth.getMonth()).map(
              (week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((date, di) => {
                    if (!date)
                      return <div key={`empty-${wi}-${di}`} className="py-1" />;
                    const ds = toDateStr(date);
                    const isSel = ds === selectedDateStr;
                    const isTod = ds === todayStr;
                    const count = taskCountByDate[ds] || 0;
                    return (
                      <button
                        key={ds}
                        onClick={() => {
                          setSelectedDate(new Date(date));
                          setWeekAnchor(new Date(date));
                        }}
                        className="flex flex-col items-center py-1 active:scale-95 transition-all select-none"
                      >
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                            isSel
                              ? "text-white shadow-md"
                              : isTod
                                ? "text-orange-600 ring-2 ring-orange-400 ring-offset-1"
                                : "text-gray-800 hover:bg-gray-100"
                          }`}
                          style={
                            isSel
                              ? {
                                  background:
                                    "linear-gradient(145deg,#f97316,#dc6a0f)",
                                }
                              : {}
                          }
                        >
                          {date.getDate()}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            count > 0
                              ? isSel
                                ? "bg-white/80"
                                : "bg-orange-400"
                              : "bg-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Date label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">
              {selectedDayLabel}
            </span>
          </div>
          {tasksForDate.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {tasksForDate.length}{" "}
              {tasksForDate.length === 1 ? "task" : "tasks"}
            </span>
          )}
        </div>

        {/* Add Task Button */}
        <button
          onClick={handleOpenAddTask}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl py-4 font-bold text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-[0.98] transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
          Add New Task
        </button>

        {/* Loading State */}
        {isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading tasks…</p>
          </div>
        )}

        {/* Error State */}
        {tasksError && (
          <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
            <p className="text-sm text-red-600 mb-3 font-medium">
              {tasksError}
            </p>
            <button
              onClick={loadTasks}
              className="text-sm text-orange-600 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          !tasksError &&
          pendingTasks.length === 0 &&
          completedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-5">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-11 h-11 text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                All Clear!
              </h3>
              <p className="text-sm text-gray-500 max-w-[200px]">
                No tasks scheduled for this day
              </p>
              <button
                onClick={handleOpenAddTask}
                className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Schedule a task
              </button>
            </div>
          )}

        {/* ── Pending Tasks ─────────────────────────────────────────────── */}
        {pendingTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900">
                  Pending Tasks
                </h3>
              </div>
              <span className="ml-auto text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                {pendingTasks.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {pendingTasks.map((task) => {
                const TypeIcon = TASK_TYPE_ICONS[task.taskType] || Briefcase;
                return (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTaskDetail(task)}
                    className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${PRIORITY_BORDER[task.priority] ?? "border-l-gray-200"} p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${PRIORITY_BADGE_BG[task.priority] ?? "bg-gray-50 text-gray-500"}`}
                          >
                            <Flag className="w-2.5 h-2.5" />
                            {task.priority}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[11px] font-semibold">
                            <TypeIcon className="w-2.5 h-2.5" />
                            {task.taskType}
                          </span>
                          {task.dueTime && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-semibold">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTime(task.dueTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Completed Tasks ───────────────────────────────────────────── */}
        {completedTasks.length > 0 && (
          <div className="pb-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm mb-2.5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm font-bold text-gray-800">
                  Completed
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {completedTasks.length}
                </span>
              </div>
              {showCompleted ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showCompleted && (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTaskDetail(task)}
                    className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-emerald-300 p-4 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-400 line-through leading-snug">
                          {task.title}
                        </p>
                        {task.completionPhoto && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                            <Camera className="w-2.5 h-2.5" />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                    {(() => {
                      const Icon =
                        TASK_TYPE_ICONS[selectedTask.taskType] || Briefcase;
                      return <Icon className="w-5 h-5 text-orange-500" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Task Details
                    </p>
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">
                      {selectedTask.taskType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseTaskDetail}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Title */}
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 leading-snug">
                    {selectedTask.title}
                  </h2>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  )}
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${PRIORITY_BADGE_BG[selectedTask.priority] ?? "bg-gray-50 text-gray-600"}`}
                  >
                    <Flag className="w-3 h-3" />
                    {selectedTask.priority} Priority
                  </span>
                  {selectedTask.dueDate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(selectedTask.dueDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  )}
                  {selectedTask.dueTime && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold">
                      <Clock className="w-3 h-3" />
                      {formatTime(selectedTask.dueTime)}
                    </span>
                  )}
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Update Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setEditStatus(opt.value)}
                        className={`py-3 rounded-2xl text-xs font-bold border-2 transition-all ${
                          editStatus === opt.value
                            ? opt.value === "TODO"
                              ? "bg-gray-700 text-white border-gray-700"
                              : opt.value === "IN_PROGRESS"
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camera Section */}
                <div
                  className={`rounded-2xl border-2 transition-all overflow-hidden ${
                    editStatus === "COMPLETED"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-dashed border-gray-200 bg-gray-50 opacity-50"
                  }`}
                >
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera
                        className={`w-4 h-4 ${editStatus === "COMPLETED" ? "text-emerald-600" : "text-gray-400"}`}
                      />
                      <p
                        className={`text-sm font-bold ${editStatus === "COMPLETED" ? "text-emerald-800" : "text-gray-400"}`}
                      >
                        Completion Photo
                      </p>
                    </div>
                    <p
                      className={`text-xs ${editStatus === "COMPLETED" ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {editStatus === "COMPLETED"
                        ? "Capture a photo as proof of task completion."
                        : "Mark task as Completed to enable photo capture."}
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
                          <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
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
                          className="w-full h-32 flex flex-col items-center justify-center gap-2.5 bg-white border-2 border-dashed border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-emerald-700">
                              Capture Photo
                            </p>
                            <p className="text-xs text-emerald-500 mt-0.5">
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
              <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseTaskDetail}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveStatus}
                    disabled={
                      isSavingStatus ||
                      (editStatus === "COMPLETED" &&
                        !workPhoto &&
                        !selectedTask.completionPhoto)
                    }
                    className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-md shadow-orange-200"
                  >
                    {isSavingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Status
                  </button>
                </div>
                <button
                  onClick={() =>
                    selectedTask && handleDeleteTask(selectedTask.id)
                  }
                  className="w-full py-3 rounded-2xl border-2 border-red-100 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ══ Add Task Modal ════════════════════════════════════════════════════ */}
      {showAddTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      Add New Task
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Fill in the details below
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAddTask}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Task Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. Follow up with Sharma — Site Visit"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Add task details, notes, or instructions…"
                    rows={3}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none resize-none"
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Task Type
                  </label>
                  <div className="relative">
                    <select
                      value={newTask.taskType}
                      onChange={(e) =>
                        setNewTask((p) => ({ ...p, taskType: e.target.value }))
                      }
                      className="w-full appearance-none px-4 py-3.5 pr-10 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none"
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          setNewTask((prev) => ({ ...prev, priority: p }))
                        }
                        className={`py-3 rounded-2xl text-xs font-bold border-2 transition-all ${
                          newTask.priority === p
                            ? p === "HIGH"
                              ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200"
                              : p === "MEDIUM"
                                ? "bg-yellow-500 text-white border-yellow-500 shadow-sm shadow-yellow-200"
                                : "bg-green-500 text-white border-green-500 shadow-sm shadow-green-200"
                            : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Initial Status
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
                      className="w-full appearance-none px-4 py-3.5 pr-10 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none"
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask((p) => ({ ...p, dueDate: e.target.value }))
                      }
                      className="w-full px-3 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={newTask.dueTime}
                      onChange={(e) =>
                        setNewTask((p) => ({ ...p, dueTime: e.target.value }))
                      }
                      className="w-full px-3 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={handleCloseAddTask}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewTask}
                  disabled={isSavingNewTask || !newTask.title.trim()}
                  className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-md shadow-orange-200"
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
      {/* Hidden camera input for task detail modal only */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
    </div>
  );
}
