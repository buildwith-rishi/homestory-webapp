import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { Task } from "../../types";
import toast from "react-hot-toast";

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

  const tasksForDate = (allTasks || []).filter(
    (t) => t.dueDate === selectedDateStr,
  );
  const pendingTasks = tasksForDate.filter((t) => !t.completed);
  const completedTasks = tasksForDate.filter((t) => t.completed);

  const groupedTasks: Record<string, Task[]> = {};
  pendingTasks.forEach((task) => {
    const project = (projects || []).find((p) => p.id === task.projectId);
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
                          className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all ${
                            completingTaskId === task.id ? "opacity-70" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() =>
                                handleToggleTask(task.id, !task.completed)
                              }
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
                                <p className="text-xs text-gray-500 mt-1">
                                  {task.description}
                                </p>
                              )}
                              {task.dueTime && (
                                <div
                                  className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg ${
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
                        const project = (projects || []).find(
                          (p) => p.id === task.projectId,
                        );
                        return (
                          <div
                            key={task.id}
                            className={`bg-white rounded-xl border border-gray-200 p-4 opacity-70 hover:opacity-100 transition-all ${
                              completingTaskId === task.id ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleTask(task.id, false)}
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
    </div>
  );
}
