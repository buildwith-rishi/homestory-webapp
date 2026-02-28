import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Camera,
  X,
  Image,
  FileText,
  CalendarDays,
  Wrench,
  Flag,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { Task } from "../../types";
import toast from "react-hot-toast";

// ── Dummy tasks shown alongside real tasks ────────────────────────────────────
const TODAY_STR = new Date().toISOString().split("T")[0];

const DUMMY_TASKS: Task[] = [
  {
    id: "dummy-1",
    projectId: "dummy-project-1",
    title: "Electrical Wiring — Master Bedroom",
    taskType: "Electrical",
    dueDate: TODAY_STR,
    priority: "HIGH",
    status: "TODO",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Complete the full wiring layout for master bedroom — 4 sockets, 2 switch boards, and fan point. Verify earthing connections.",
    dueTime: "10:00",
    assignedTo: "Site Engineer",
  },
  {
    id: "dummy-2",
    projectId: "dummy-project-1",
    title: "Wall Plastering — Living Room (2nd coat)",
    taskType: "Civil",
    dueDate: TODAY_STR,
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Apply second coat plaster on north & east walls of the living room. Ensure surface is level and smooth before coat dries.",
    dueTime: "12:00",
    assignedTo: "Site Engineer",
  },
  {
    id: "dummy-3",
    projectId: "dummy-project-2",
    title: "Tile Inspection — Bathroom 2",
    taskType: "Tiling",
    dueDate: TODAY_STR,
    priority: "HIGH",
    status: "TODO",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Inspect completed tile work in bathroom 2. Check grout lines, tile alignment, and waterproofing joints at edges.",
    dueTime: "14:00",
    assignedTo: "Site Engineer",
  },
  {
    id: "dummy-4",
    projectId: "dummy-project-2",
    title: "Paint — First Coat (Kitchen Ceiling)",
    taskType: "Painting",
    dueDate: TODAY_STR,
    priority: "LOW",
    status: "COMPLETED",
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Apply first coat of off-white (shade 1012) on the kitchen ceiling. Two coats required overall. Allow 4 hrs drying time.",
    dueTime: "09:00",
    assignedTo: "Site Engineer",
    completedAt: new Date().toISOString(),
  },
  {
    id: "dummy-5",
    projectId: "dummy-project-1",
    title: "Plumbing — Bathroom 1 Fixtures",
    taskType: "Plumbing",
    dueDate: TODAY_STR,
    priority: "HIGH",
    status: "TODO",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description:
      "Install basin mixer, shower head, and concealed flush valve in bathroom 1. Pressure test all connections after installation.",
    dueTime: "15:30",
    assignedTo: "Site Engineer",
  },
];

const DUMMY_PROJECTS = [
  { id: "dummy-project-1", name: "Sharma Residence — Sector 15" },
  { id: "dummy-project-2", name: "Patel Villa — Phase 2" },
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [workPhoto, setWorkPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditStatus(task.status || "TODO");
    setWorkPhoto(null);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
    setEditStatus("");
    setWorkPhoto(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedTask) return;
    setIsSavingStatus(true);
    try {
      const isDummy = selectedTask.id.startsWith("dummy-");
      if (!isDummy) {
        await updateTask(selectedTask.id, {
          status: editStatus,
          completed: editStatus === "COMPLETED",
        });
        fetchAllTasks();
      }
      toast.success("Task status updated!");
      handleCloseTaskDetail();
    } catch {
      toast.error("Failed to update status");
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
  };

  // Initial load
  useEffect(() => {
    fetchProjects();
    fetchAllTasks();
  }, [fetchProjects, fetchAllTasks]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearError(); // Clear any previous errors before refreshing
    try {
      await Promise.all([fetchProjects(), fetchAllTasks()]);
      toast.success("Tasks refreshed");
    } catch {
      toast.error("Failed to refresh tasks");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchProjects, fetchAllTasks, clearError]);

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

  // Merge real API tasks with dummy sample tasks
  const allDisplayTasks = [...(allTasks || []), ...DUMMY_TASKS];
  const allDisplayProjects = [
    ...(projects || []),
    ...(DUMMY_PROJECTS as unknown as typeof projects),
  ];

  const tasksForDate = allDisplayTasks.filter(
    (t) => t.dueDate === selectedDateStr,
  );
  const pendingTasks = tasksForDate.filter((t) => !t.completed);
  const completedTasks = tasksForDate.filter((t) => t.completed);

  const groupedTasks: Record<string, Task[]> = {};
  pendingTasks.forEach((task) => {
    const project = allDisplayProjects.find((p) => p.id === task.projectId);
    const projectName = project?.name || "Unknown Project";
    if (!groupedTasks[projectName]) {
      groupedTasks[projectName] = [];
    }
    groupedTasks[projectName].push(task);
  });

  const handleToggleTask = async (taskId: string, shouldComplete: boolean) => {
    setCompletingTaskId(taskId);
    try {
      if (shouldComplete) {
        await completeTask(taskId);
        toast.success("Task completed!");
      } else {
        // To uncomplete, update the task status back to TODO
        await updateTask(taskId, { completed: false, status: "TODO" });
        toast.success("Task reopened");
      }
    } catch (error) {
      toast.error(
        shouldComplete ? "Failed to complete task" : "Failed to reopen task",
      );
    } finally {
      setCompletingTaskId(null);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const totalTasks = tasksForDate.length;
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Tasks" showNotifications />

      {/* Stats Summary with Refresh */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Today's Progress
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || tasksLoading}
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
            <p className="text-2xl font-bold text-green-600">
              {completedCount}
            </p>
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
        {/* Loading State */}
        {tasksLoading && !isRefreshing && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {tasksError && !tasksLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Failed to Load Tasks
            </h3>
            <p className="text-sm text-gray-600 mb-4">{tasksError}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!tasksLoading &&
          !tasksError &&
          pendingTasks.length === 0 &&
          completedTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                All Clear!
              </h3>
              <p className="text-sm text-gray-600">
                No tasks scheduled for this day
              </p>
            </div>
          )}

        {/* Task Content */}
        {!tasksLoading &&
          !tasksError &&
          (pendingTasks.length > 0 || completedTasks.length > 0) && (
            <>
              {Object.entries(groupedTasks).map(
                ([projectName, projectTasks]) => (
                  <div key={projectName}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-5 bg-orange-500 rounded-full" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {projectName}
                      </h3>
                      <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {projectTasks.length}{" "}
                        {projectTasks.length === 1 ? "task" : "tasks"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {projectTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleOpenTaskDetail(task)}
                          className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer ${
                            completingTaskId === task.id ? "opacity-70" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTask(task.id, !task.completed);
                              }}
                              disabled={completingTaskId === task.id}
                              className="mt-0.5 flex-shrink-0 active:scale-95 transition-transform disabled:cursor-not-allowed"
                            >
                              <div
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  completingTaskId === task.id
                                    ? "border-orange-400 bg-orange-50"
                                    : task.completed
                                      ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 shadow-sm"
                                      : "border-gray-300 hover:border-orange-500 hover:bg-orange-50"
                                }`}
                              >
                                {completingTaskId === task.id ? (
                                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                                ) : task.completed ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : null}
                              </div>
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  task.completed
                                    ? "text-gray-400 line-through"
                                    : "text-gray-900"
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {task.dueTime && (
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                                      task.completed
                                        ? "bg-gray-100 text-gray-500"
                                        : "bg-orange-50 text-orange-600"
                                    }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs font-medium">
                                      {formatTime(task.dueTime)}
                                    </span>
                                  </div>
                                )}
                                {task.taskType && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                                    <Wrench className="w-3 h-3" />
                                    {task.taskType}
                                  </span>
                                )}
                                {task.priority && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${PRIORITY_STYLES[task.priority] || "bg-gray-100 text-gray-600"}`}
                                  >
                                    <Flag className="w-3 h-3" />
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}

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
                      {completedTasks.map((task) => {
                        const project = allDisplayProjects.find(
                          (p) => p.id === task.projectId,
                        );
                        return (
                          <div
                            key={task.id}
                            onClick={() => handleOpenTaskDetail(task)}
                            className={`bg-white rounded-xl border border-gray-200 p-4 opacity-70 hover:opacity-100 hover:border-green-300 transition-all cursor-pointer ${
                              completingTaskId === task.id ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(task.id, false);
                                }}
                                disabled={completingTaskId === task.id}
                                className="mt-0.5 flex-shrink-0 active:scale-95 transition-transform disabled:cursor-not-allowed"
                              >
                                <div
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shadow-sm ${
                                    completingTaskId === task.id
                                      ? "border-orange-400 bg-orange-50"
                                      : "bg-gradient-to-br from-green-500 to-green-600 border-green-500"
                                  }`}
                                >
                                  {completingTaskId === task.id ? (
                                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 line-through">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">
                                    {project?.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
      </div>

      {/* ── Task Detail Modal ── */}
      {selectedTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-orange-600" />
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

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                {/* Task Title */}
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

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedTask.taskType && (
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-1">
                        Type
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-800">
                          {selectedTask.taskType}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedTask.priority && (
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
                  )}
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
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
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
                  {/* Status badge preview */}
                  <div className="mt-2">
                    {(() => {
                      const s = STATUS_OPTIONS.find(
                        (o) => o.value === editStatus,
                      );
                      return s ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${s.dot}`}
                          />
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
                        Work Completion Photo
                      </p>
                    </div>
                    <p
                      className={`text-xs ${editStatus === "COMPLETED" ? "text-green-700" : "text-gray-400"}`}
                    >
                      {editStatus === "COMPLETED"
                        ? "Capture or upload a photo as proof of completed work."
                        : "Mark the task as Completed to enable photo capture."}
                    </p>
                  </div>

                  {editStatus === "COMPLETED" && (
                    <div className="px-4 pb-4">
                      {workPhoto ? (
                        /* Photo Preview */
                        <div className="relative">
                          <img
                            src={workPhoto.previewUrl}
                            alt="Work completion"
                            className="w-full h-48 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => setWorkPhoto(null)}
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
                        /* Camera Button */
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
                </div>
              </div>

              {/* Footer Actions */}
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

      {/* Hidden camera/file input */}
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
