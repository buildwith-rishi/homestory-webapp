import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  CheckSquare,
  Wifi,
  WifiOff,
  Calendar,
  ListTodo,
  ClipboardCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui";
import {
  getSiteEngineerTasks,
  getSiteEngineerProfile,
  type SiteEngineerTask,
  type SiteEngineerProfile,
} from "../../services/siteEngineerApi";

export function EngineerHome() {
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

  // Site engineer API data
  const [seTasks, setSeTasks] = useState<SiteEngineerTask[]>([]);
  const [seProfile, setSeProfile] = useState<SiteEngineerProfile | null>(null);

  // Handle retry for tasks
  const handleRetryTasks = async () => {
    setIsRefreshing(true);
    clearError();
    try {
      const [, , tasks, profile] = await Promise.all([
        fetchAllTasks(),
        fetchUpcomingTasks(),
        getSiteEngineerTasks(),
        getSiteEngineerProfile(),
      ]);
      setSeTasks(tasks);
      setSeProfile(profile);
    } catch (err) {
      console.warn("Retry failed:", err);
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

    // Load from site engineer APIs
    Promise.all([getSiteEngineerTasks(), getSiteEngineerProfile()])
      .then(([tasks, profile]) => {
        setSeTasks(tasks);
        setSeProfile(profile);
      })
      .catch((err) => console.warn("Site engineer home API error:", err));

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchProjects, fetchAllTasks, fetchUpcomingTasks]);

  const seTaskIds = new Set(seTasks.map((t) => t.id));
  const today = new Date().toISOString().split("T")[0];
  const seTodayTasks = seTasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate === today,
  );
  const storeTodayTasks = (allTasks || []).filter(
    (t) => !seTaskIds.has(t.id) && !t.completed && t.dueDate === today,
  );
  const todayTasks = [...seTodayTasks, ...storeTodayTasks];

  // Derived stats – come from real API data only
  const todayPhotos = seProfile?.stats?.totalPhotos ?? 0;

  // Get upcoming tasks from SE API + store (next 7 days, limited to 5)
  const seUpcoming = seTasks
    .filter((t) => t.status !== "COMPLETED" && t.dueDate && t.dueDate > today)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const storeUpcoming = (upcomingTasks || []).filter(
    (t) => !seTaskIds.has(t.id) && !t.completed,
  );
  const displayUpcomingTasks = [...seUpcoming, ...storeUpcoming].slice(0, 5);

  // Priority badge helper
  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      URGENT: "bg-red-100 text-red-700",
      HIGH: "bg-orange-100 text-orange-700",
      MEDIUM: "bg-yellow-100 text-yellow-700",
      LOW: "bg-green-100 text-green-700",
    };
    return styles[priority] || "bg-gray-100 text-gray-700";
  };

  // Format due date relative
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return "No due date";

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

  const getProjectDisplayName = (project: {
    name?: string;
    projectName?: string;
  }) => {
    if (project.name?.trim()) return project.name;
    if (project.projectName?.trim()) return project.projectName;
    return "Untitled Project";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader showNotifications />

      <div className="p-4 space-y-5">
        {/* Header Section with Connection Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {greeting}, {user?.name?.split(" ")[0] || "Engineer"}
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

        {/* Today's Summary - Prominent Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-3.5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <ListTodo className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{todayTasks.length}</p>
            <p className="text-xs opacity-90 mt-0.5">Pending Tasks</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-3.5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{todayPhotos}</p>
            <p className="text-xs opacity-90 mt-0.5">Photos Today</p>
          </div>
        </div>

        {/* Quick Actions - Large Touch Targets */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/app/tasks")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md min-h-[120px]"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                View Tasks
              </span>
            </button>
            <button
              onClick={() => navigate("/app/dsr")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-md min-h-[120px]"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 text-center">
                Submit DSR
              </span>
            </button>
          </div>
        </div>

        {/* Upcoming Tasks Section */}
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
                onClick={() => navigate("/app/tasks")}
                className="text-xs text-orange-600 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {tasksLoading || isRefreshing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Spinner size="md" color="brand" className="mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Loading tasks...</p>
            </div>
          ) : tasksError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <RefreshCw className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                Couldn't load tasks
              </p>
              <p className="text-xs text-gray-500 mb-3">{tasksError}</p>
              <button
                onClick={handleRetryTasks}
                className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
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
              <p className="text-sm font-medium text-gray-900">
                All caught up!
              </p>
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
                    onClick={() => navigate("/app/tasks")}
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
                          {project
                            ? getProjectDisplayName(project)
                            : "Unknown Project"}
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
      </div>
    </div>
  );
}
