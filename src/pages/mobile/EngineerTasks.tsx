import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Camera,
  X,
  CalendarDays,
  Wrench,
  Flag,
  Circle,
  PlayCircle,
  Building2,
  RotateCcw,
  Grid3X3,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { Task } from "../../types";
import toast from "react-hot-toast";
import {
  getSiteEngineerTasks,
  getSiteEngineerProjects,
  updateSiteEngineerTaskStatus,
  uploadSiteEngineerTaskPhoto,
  type SiteEngineerTask,
  type SiteEngineerProject,
} from "../../services/siteEngineerApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  {
    value: "TODO",
    label: "To Do",
    Icon: Circle,
    ring: "ring-gray-400",
    pill: "bg-gray-100 text-gray-700",
    dot: "bg-gray-400",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    Icon: PlayCircle,
    ring: "ring-blue-400",
    pill: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    Icon: CheckCircle2,
    ring: "ring-green-400",
    pill: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
] as const;

const PRIORITY_META: Record<
  string,
  { pill: string; dot: string; label: string }
> = {
  URGENT: {
    pill: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    label: "Urgent",
  },
  HIGH: {
    pill: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    label: "High",
  },
  MEDIUM: {
    pill: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
    label: "Medium",
  },
  LOW: {
    pill: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    label: "Low",
  },
};

const STATUS_BORDER: Record<string, string> = {
  TODO: "before:bg-gray-300",
  IN_PROGRESS: "before:bg-blue-500",
  COMPLETED: "before:bg-green-500",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fmtTime(time?: string) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function relDay(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getMonthCalendar(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function EngineerTasks() {
  const {
    projects,
    allTasks,
    tasksLoading,
    tasksError,
    fetchProjects,
    fetchAllTasks,
    completeTask,
    updateTask,
    clearError,
  } = useProjectStore();

  const [seTasks, setSeTasks] = useState<SiteEngineerTask[]>([]);
  const [seProjects, setSeProjects] = useState<SiteEngineerProject[]>([]);
  const [seLoading, setSeLoading] = useState(false);
  const [seError, setSeError] = useState<string | null>(null);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [calMonth, setCalMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [workPhoto, setWorkPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const openDetail = (task: Task) => {
    setSelectedTask(task);
    setEditStatus(task.status || "TODO");
    setWorkPhoto(null);
  };
  const closeDetail = () => {
    setSelectedTask(null);
    setEditStatus("");
    if (workPhoto?.previewUrl) URL.revokeObjectURL(workPhoto.previewUrl);
    setWorkPhoto(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedTask) return;
    setIsSavingStatus(true);
    try {
      if (
        (editStatus === "COMPLETED" || editStatus === "IN_PROGRESS") &&
        workPhoto?.file
      ) {
        const photoLabel =
          editStatus === "COMPLETED"
            ? `Completion – ${selectedTask.title}`
            : `Progress – ${selectedTask.title}`;
        await uploadSiteEngineerTaskPhoto(
          selectedTask.id,
          workPhoto.file,
          photoLabel,
        ).catch(() => {});
      }
      await updateSiteEngineerTaskStatus(selectedTask.id, {
        status: editStatus as "TODO" | "IN_PROGRESS" | "COMPLETED",
        ...(editStatus === "COMPLETED"
          ? { completionNotes: "Updated via mobile app" }
          : {}),
      });
      await updateTask(selectedTask.id, {
        status: editStatus,
        completed: editStatus === "COMPLETED",
      }).catch(() => {});
      getSiteEngineerTasks()
        .then(setSeTasks)
        .catch(() => {});
      fetchAllTasks();
      toast.success("Status updated");
      closeDetail();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (workPhoto?.previewUrl) URL.revokeObjectURL(workPhoto.previewUrl);
    setWorkPhoto({ file, previewUrl: URL.createObjectURL(file) });
    toast.success("Photo captured!");
  };

  useEffect(() => {
    fetchProjects();
    fetchAllTasks();
    setSeLoading(true);
    Promise.all([getSiteEngineerTasks(), getSiteEngineerProjects()])
      .then(([tasks, projs]) => {
        setSeTasks(tasks);
        setSeProjects(projs);
      })
      .catch((e) =>
        setSeError(e instanceof Error ? e.message : "Failed to load"),
      )
      .finally(() => setSeLoading(false));
  }, [fetchProjects, fetchAllTasks]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setSeError(null);
    clearError();
    try {
      const [, , tasks, projs] = await Promise.all([
        fetchProjects(),
        fetchAllTasks(),
        getSiteEngineerTasks(),
        getSiteEngineerProjects(),
      ]);
      setSeTasks(tasks);
      setSeProjects(projs);
      toast.success("Refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchProjects, fetchAllTasks, clearError]);

  const handleToggleTask = async (taskId: string, shouldComplete: boolean) => {
    setCompletingTaskId(taskId);
    try {
      if (shouldComplete) {
        await completeTask(taskId);
        toast.success("Task completed!");
      } else {
        await updateTask(taskId, { completed: false, status: "TODO" });
        toast.success("Task reopened");
      }
    } catch {
      toast.error(shouldComplete ? "Failed to complete" : "Failed to reopen");
    } finally {
      setCompletingTaskId(null);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const weekDates = getMondayWeek(weekAnchor);
  const todayStr = toDateStr(today);
  const selectedStr = toDateStr(selectedDate);

  const seTaskIds = new Set(seTasks.map((t) => t.id));
  // Only show SE tasks that are due on the currently selected date
  const seAsTask: Task[] = seTasks
    .filter((t) => t.dueDate === selectedStr)
    .map((t) => ({
      ...t,
      completed: t.status === "COMPLETED",
    }));
  const storeForDate = (allTasks || []).filter(
    (t) => !seTaskIds.has(t.id) && t.dueDate === selectedStr,
  );
  const allDisplay = [...seAsTask, ...storeForDate];

  const seProjectIds = new Set(seProjects.map((p) => p.id));
  const allDisplayProjects = [
    ...seProjects,
    ...(projects || []).filter((p) => !seProjectIds.has(p.id)),
  ];

  const loading = (tasksLoading || seLoading) && !isRefreshing;
  const error = tasksError || seError;
  const pending = allDisplay.filter((t) => !t.completed);
  const done = allDisplay.filter((t) => t.completed);
  const total = allDisplay.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  // Task dots per date on calendar — use all seTasks (not date-filtered) so dots show on every date that has tasks
  const dotMap: Record<string, number> = {};
  seTasks.forEach((t) => {
    if (t.dueDate) dotMap[t.dueDate] = (dotMap[t.dueDate] || 0) + 1;
  });

  // Group pending by project
  const grouped: Record<string, Task[]> = {};
  pending.forEach((task) => {
    const proj = allDisplayProjects.find((p) => p.id === task.projectId);
    const name =
      (task as Task & { projectName?: string }).projectName ??
      proj?.name ??
      "General Tasks";
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(task);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24">
      <MobileHeader title="Tasks" showNotifications />

      {/* ── Calendar Hero Card ───────────────────────────────────────────── */}
      <div className="bg-white shadow-sm">
        {/* Month + nav */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {viewMode === "month"
                ? `${MONTHS[calMonth.getMonth()]} ${calMonth.getFullYear()}`
                : `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
            </p>
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight mt-0.5">
              {selectedStr === todayStr
                ? "Today's Tasks"
                : selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (viewMode === "month") {
                  setCalMonth(
                    new Date(
                      calMonth.getFullYear(),
                      calMonth.getMonth() - 1,
                      1,
                    ),
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
                    new Date(
                      calMonth.getFullYear(),
                      calMonth.getMonth() + 1,
                      1,
                    ),
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

        {/* Week / Month toggle */}
        <div className="px-5 pb-3">
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

        {/* Week strip */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-3 pt-1">
            {weekDates.map((date, i) => {
              const ds = toDateStr(date);
              const isSel = ds === selectedStr;
              const isTod = ds === todayStr;
              const hasDot = (dotMap[ds] || 0) > 0;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(new Date(date))}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95 select-none"
                  style={
                    isSel
                      ? {
                          background: "linear-gradient(145deg,#f97316,#dc6a0f)",
                          boxShadow: "0 4px 14px rgba(249,115,22,.35)",
                        }
                      : {}
                  }
                >
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      isSel
                        ? "text-orange-100"
                        : isTod
                          ? "text-orange-500"
                          : "text-gray-400"
                    }`}
                  >
                    {DAYS[i]}
                  </span>
                  <span
                    className={`text-[17px] font-extrabold leading-none ${
                      isSel
                        ? "text-white"
                        : isTod
                          ? "text-orange-600"
                          : "text-gray-800"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasDot
                        ? isSel
                          ? "bg-white/75"
                          : "bg-orange-400"
                        : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Month grid */}
        {viewMode === "month" && (
          <div className="px-3 pb-3">
            {/* Day-of-week header */}
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
            {/* Date rows */}
            {getMonthCalendar(calMonth.getFullYear(), calMonth.getMonth()).map(
              (week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((date, di) => {
                    if (!date)
                      return <div key={`empty-${wi}-${di}`} className="py-1" />;
                    const ds = toDateStr(date);
                    const isSel = ds === selectedStr;
                    const isTod = ds === todayStr;
                    const count = dotMap[ds] || 0;
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

        {/* Stat strip */}
        <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: "Total", val: total, color: "text-gray-900" },
            { label: "Pending", val: pending.length, color: "text-orange-500" },
            { label: "Done", val: done.length, color: "text-green-600" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3 gap-0.5"
            >
              <span
                className={`text-xl font-extrabold tabular-nums ${s.color}`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  s.val
                )}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="px-5 pb-4">
            <div className="flex justify-between text-[10px] font-semibold mb-1.5">
              <span className="text-gray-400 uppercase tracking-wide">
                Progress
              </span>
              <span className="text-gray-700">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background:
                    pct === 100
                      ? "linear-gradient(90deg,#22c55e,#16a34a)"
                      : "linear-gradient(90deg,#f97316,#ea580c)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Refresh ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end px-4 pt-3 pb-1">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Task list ────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-4">
        {/* Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-gray-100 rounded-full w-16" />
                      <div className="h-5 bg-gray-100 rounded-full w-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-700 mb-1">
              Failed to load
            </p>
            <p className="text-xs text-red-500 mb-3">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && total === 0 && (
          <div className="flex flex-col items-center pt-16 pb-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center mb-4 shadow-md">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              All Clear!
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              No tasks assigned for this period
            </p>
          </div>
        )}

        {/* Grouped pending tasks */}
        {!loading &&
          !error &&
          Object.entries(grouped).map(([projectName, tasks]) => (
            <div key={projectName}>
              <div className="flex items-center gap-2 mb-2.5 mt-1">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-gray-800 truncate flex-1">
                  {projectName}
                </span>
                <span className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-0.5 font-semibold shrink-0">
                  {tasks.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const stOpt =
                    STATUS_OPTIONS.find(
                      (s) => s.value === (task.status?.toUpperCase() || "TODO"),
                    ) ?? STATUS_OPTIONS[0];
                  const prMeta = task.priority
                    ? PRIORITY_META[task.priority]
                    : undefined;
                  const borderCls =
                    STATUS_BORDER[task.status?.toUpperCase() || "TODO"] ??
                    STATUS_BORDER.TODO;
                  return (
                    <div
                      key={task.id}
                      onClick={() => openDetail(task)}
                      className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:shadow-md hover:border-orange-200
                      before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${borderCls}`}
                    >
                      <div className="pl-5 pr-4 py-3.5 flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task.id, !task.completed);
                          }}
                          disabled={completingTaskId === task.id}
                          className="mt-0.5 shrink-0 active:scale-95 transition-transform"
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              completingTaskId === task.id
                                ? "border-orange-400 bg-orange-50"
                                : task.completed
                                  ? "bg-green-500 border-green-500 shadow-sm"
                                  : "border-gray-300 hover:border-orange-400"
                            }`}
                          >
                            {completingTaskId === task.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                            ) : task.completed ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : null}
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold leading-snug ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${stOpt.pill}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${stOpt.dot}`}
                              />
                              {stOpt.label}
                            </span>
                            {prMeta && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prMeta.pill}`}
                              >
                                <Flag className="w-2.5 h-2.5" />
                                {prMeta.label}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                                <CalendarDays className="w-2.5 h-2.5" />
                                {relDay(task.dueDate)}
                              </span>
                            )}
                            {task.dueTime && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600">
                                <Clock className="w-2.5 h-2.5" />
                                {fmtTime(task.dueTime)}
                              </span>
                            )}
                            {task.taskType && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600">
                                <Wrench className="w-2.5 h-2.5" />
                                {task.taskType}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {/* Completed accordion */}
        {!loading && !error && done.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="flex items-center justify-between w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">
                  Completed
                </span>
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {done.length}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCompleted ? "rotate-180" : ""}`}
              />
            </button>

            {showCompleted && (
              <div className="mt-2 space-y-2">
                {done.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openDetail(task)}
                    className="relative bg-white/70 rounded-2xl border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-all before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-green-400"
                  >
                    <div className="pl-5 pr-4 py-3 flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id, false);
                        }}
                        disabled={completingTaskId === task.id}
                        className="mt-0.5 shrink-0 active:scale-95 transition-transform"
                      >
                        <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center shadow-sm">
                          {completingTaskId === task.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-400 line-through">
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {relDay(task.dueDate)}
                          </p>
                        )}
                      </div>
                      <RotateCcw className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* ── Task Detail Bottom Sheet ──────────────────────────────────────── */}
      {selectedTask &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDetail();
            }}
          >
            <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl flex flex-col max-h-[93dvh]">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                      Task Details
                    </p>
                    <p className="text-xs font-bold text-gray-700 mt-0.5 leading-tight">
                      {(selectedTask as Task & { projectName?: string })
                        .projectName ??
                        allDisplayProjects.find(
                          (p) => p.id === selectedTask.projectId,
                        )?.name ??
                        "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                {/* Title + description */}
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

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2">
                  {selectedTask.dueDate && (
                    <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-2">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-700">
                        {new Date(selectedTask.dueDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  )}
                  {selectedTask.dueTime && (
                    <div className="flex items-center gap-1.5 bg-orange-50 rounded-xl px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-700">
                        {fmtTime(selectedTask.dueTime)}
                      </span>
                    </div>
                  )}
                  {selectedTask.priority &&
                    (() => {
                      const pm = PRIORITY_META[selectedTask.priority];
                      return pm ? (
                        <div
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 ${pm.pill}`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">
                            {pm.label} Priority
                          </span>
                        </div>
                      ) : null;
                    })()}
                  {selectedTask.taskType && (
                    <div className="flex items-center gap-1.5 bg-purple-50 rounded-xl px-3 py-2">
                      <Wrench className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs font-semibold text-purple-700">
                        {selectedTask.taskType}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status picker */}
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                    Update Status
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map(
                      ({ value, label, Icon, ring, pill, dot }) => {
                        const active = editStatus === value;
                        const textColor = pill.split(" ")[1];
                        return (
                          <button
                            key={value}
                            onClick={() => setEditStatus(value)}
                            className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all active:scale-95 ${
                              active
                                ? `border-transparent ring-2 ${ring} bg-white shadow-md`
                                : "border-gray-100 bg-gray-50"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${active ? textColor : "text-gray-300"}`}
                            />
                            <span
                              className={`text-[10px] font-bold ${active ? textColor : "text-gray-400"}`}
                            >
                              {label}
                            </span>
                            {active && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${dot}`}
                              />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Photo capture — enabled for IN_PROGRESS and COMPLETED */}
                {(() => {
                  const photoEnabled =
                    editStatus === "COMPLETED" || editStatus === "IN_PROGRESS";
                  const isComplete = editStatus === "COMPLETED";
                  const accent = isComplete
                    ? {
                        border: "border-green-300",
                        bg: "bg-green-50",
                        icon: "text-green-600",
                        title: "text-green-800",
                        sub: "text-green-700",
                        dashed: "border-green-300 hover:border-green-400",
                        iconBg: "bg-green-100",
                        iconColor: "text-green-600",
                        textColor: "text-green-700",
                        badge: "bg-green-500",
                      }
                    : {
                        border: "border-blue-300",
                        bg: "bg-blue-50",
                        icon: "text-blue-600",
                        title: "text-blue-800",
                        sub: "text-blue-700",
                        dashed: "border-blue-300 hover:border-blue-400",
                        iconBg: "bg-blue-100",
                        iconColor: "text-blue-600",
                        textColor: "text-blue-700",
                        badge: "bg-blue-500",
                      };
                  return (
                    <div
                      className={`rounded-2xl border-2 overflow-hidden transition-all ${
                        photoEnabled
                          ? `${accent.border} ${accent.bg}`
                          : "border-dashed border-gray-200 opacity-50"
                      }`}
                    >
                      <div className="px-4 pt-3.5 pb-2.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Camera
                            className={`w-4 h-4 ${
                              photoEnabled ? accent.icon : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`text-sm font-bold ${
                              photoEnabled ? accent.title : "text-gray-400"
                            }`}
                          >
                            {isComplete ? "Completion Photo" : "Progress Photo"}
                          </p>
                        </div>
                        <p
                          className={`text-xs ${
                            photoEnabled ? accent.sub : "text-gray-400"
                          }`}
                        >
                          {editStatus === "COMPLETED"
                            ? "Attach a photo as proof of completed work."
                            : editStatus === "IN_PROGRESS"
                              ? "Optionally attach a progress photo."
                              : "Select In Progress or Completed to upload a photo."}
                        </p>
                      </div>
                      {photoEnabled && (
                        <div className="px-4 pb-4">
                          {workPhoto ? (
                            <div className="relative">
                              <img
                                src={workPhoto.previewUrl}
                                alt="Work photo"
                                className="w-full h-44 object-cover rounded-xl"
                              />
                              <button
                                onClick={() => setWorkPhoto(null)}
                                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                              <div
                                className={`absolute bottom-2 left-2 ${accent.badge} text-white text-[10px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1`}
                              >
                                <Check className="w-3 h-3" /> Ready
                              </div>
                              <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="absolute bottom-2 right-2 bg-white text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-gray-200"
                              >
                                <Camera className="w-3 h-3" /> Retake
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => cameraInputRef.current?.click()}
                              className={`w-full h-28 flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed ${accent.dashed} rounded-xl active:scale-[0.98] transition`}
                            >
                              <div
                                className={`w-10 h-10 rounded-full ${accent.iconBg} flex items-center justify-center`}
                              >
                                <Camera
                                  className={`w-5 h-5 ${accent.iconColor}`}
                                />
                              </div>
                              <p
                                className={`text-xs font-semibold ${accent.textColor}`}
                              >
                                Tap to capture / choose photo
                              </p>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div
                className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                }}
              >
                <button
                  onClick={closeDetail}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-700 active:scale-[0.97] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatus}
                  disabled={
                    isSavingStatus ||
                    ((editStatus === "IN_PROGRESS" ||
                      editStatus === "COMPLETED") &&
                      !workPhoto)
                  }
                  className="flex-1 py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-200 active:scale-[0.97] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg,#f97316,#dc6a0f)",
                  }}
                >
                  {isSavingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {(editStatus === "IN_PROGRESS" ||
                    editStatus === "COMPLETED") &&
                  !workPhoto
                    ? "Upload Photo First"
                    : "Save Status"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCamera}
      />
    </div>
  );
}
