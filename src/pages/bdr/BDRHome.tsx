import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Phone,
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  Calendar,
  ListTodo,
  ArrowRight,
  Loader2,
  RefreshCw,
  Target,
  Users,
  Activity,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { useAuthStore } from "../../stores/authStore";
import { ProjectStage } from "../../types";

export function BDRHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    projects,
    allTasks,
    upcomingTasks,
    tasksLoading,
    tasksError,
    fetchProjects,
    fetchAllTasks,
    fetchUpcomingTasks,
    clearError,
  } = useProjectStore();
  const [greeting, setGreeting] = useState("Good morning");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetryTasks = async () => {
    setIsRefreshing(true);
    clearError();
    try {
      await Promise.all([fetchAllTasks(), fetchUpcomingTasks()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchProjects();
    fetchAllTasks();
    fetchUpcomingTasks();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchProjects, fetchAllTasks, fetchUpcomingTasks]);

  const activeProjects = (projects || []).filter((p) => p.status === "active");
  const todayTasks = (allTasks || []).filter(
    (t) => !t.completed && t.dueDate === new Date().toISOString().split("T")[0],
  );
  const openLeads = 5;

  const displayUpcomingTasks = (upcomingTasks || [])
    .filter((t) => !t.completed)
    .slice(0, 5);

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      URGENT: "bg-red-100 text-red-700",
      HIGH: "bg-orange-100 text-orange-700",
      MEDIUM: "bg-yellow-100 text-yellow-700",
      LOW: "bg-green-100 text-green-700",
    };
    return styles[priority] || "bg-gray-100 text-gray-700";
  };

  const formatDueDate = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return new Date(dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const getStageLabel = (stage: ProjectStage) => {
    const labels: Record<ProjectStage, string> = {
      [ProjectStage.PRE_CONSTRUCTION]: "Pre-Construction",
      [ProjectStage.EXECUTION]: "Execution",
      [ProjectStage.FINISHING]: "Finishing",
      [ProjectStage.FINAL_FIXES]: "Final Fixes",
      [ProjectStage.COMPLETE]: "Complete",
    };
    return labels[stage];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader showNotifications />

      <div className="p-4 space-y-5">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {greeting}, {user?.name?.split(" ")[0] || "BDR"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs text-gray-600">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isOnline
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Today's Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-3.5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <ListTodo className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{todayTasks.length}</p>
            <p className="text-xs opacity-90 mt-0.5">Pending Tasks</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-3.5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{openLeads}</p>
            <p className="text-xs opacity-90 mt-0.5">Active Leads</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-3.5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{activeProjects.length}</p>
            <p className="text-xs opacity-90 mt-0.5">Projects</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/bdr/tasks")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md min-h-[120px]"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                My Tasks
              </span>
            </button>
            <button
              onClick={() => navigate("/dashboard/leads")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md min-h-[120px]"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                View Leads
              </span>
            </button>
            <button
              onClick={() => navigate("/dashboard/meetings")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md min-h-[120px]"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Meetings
              </span>
            </button>
            <button
              onClick={() => (window.location.href = "tel:+919876543210")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md min-h-[120px]"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Contact Office
              </span>
            </button>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              Upcoming Tasks
            </h2>
            <div className="flex items-center gap-2">
              {tasksError && (
                <button
                  onClick={handleRetryTasks}
                  disabled={isRefreshing}
                  className="text-xs text-orange-600 font-medium flex items-center gap-1"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Retry
                </button>
              )}
              <button
                onClick={() => navigate("/bdr/tasks")}
                className="text-xs text-orange-600 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {tasksLoading || isRefreshing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Loading tasks...</p>
            </div>
          ) : tasksError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-sm font-medium text-gray-900">
                Couldn't load tasks
              </p>
              <button
                onClick={handleRetryTasks}
                className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium mt-2"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            </div>
          ) : displayUpcomingTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">All caught up!</p>
              <p className="text-xs text-gray-500">No upcoming tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayUpcomingTasks.map((task) => {
                const project = (projects || []).find(
                  (p) => p.id === task.projectId,
                );
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate("/bdr/tasks")}
                    className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        task.priority === "URGENT" || task.priority === "HIGH"
                          ? "bg-red-100"
                          : "bg-orange-100"
                      }`}
                    >
                      <ListTodo
                        className={`w-5 h-5 ${
                          task.priority === "URGENT" || task.priority === "HIGH"
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 truncate">
                          {project?.name || "BDR Task"}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${getPriorityBadge(task.priority || "MEDIUM")}`}
                        >
                          {task.priority || "MEDIUM"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-orange-600">
                        {formatDueDate(task.dueDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            Active Projects
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {activeProjects.map((project) => {
              const projectTasks = (allTasks || []).filter(
                (t) => t.projectId === project.id && !t.completed,
              );
              return (
                <div
                  key={project.id}
                  className="flex-shrink-0 w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
                  onClick={() =>
                    navigate(`/dashboard/projects/${project.id}`)
                  }
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-600">
                          {project.location}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{project.stage ? getStageLabel(project.stage) : ""}</span>
                      </div>
                      <span className="font-bold text-orange-600">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <CheckSquare className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">
                        {projectTasks.length}{" "}
                        {projectTasks.length === 1 ? "Task" : "Tasks"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeProjects.length === 0 && (
              <div className="flex-shrink-0 w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  No Active Projects
                </p>
                <p className="text-xs text-gray-500">
                  You'll see your assigned projects here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
