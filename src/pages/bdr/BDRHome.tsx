import { useEffect, useState, useCallback } from "react";
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
  RefreshCw,
  Target,
  Users,
  Activity,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useProjectStore } from "../../stores/projectStore";
import { useAuthStore } from "../../stores/authStore";
import { ProjectStage } from "../../types";
import { Spinner } from "../../components/ui";
import {
  getBDRLeads,
  getBDRMeetings,
  getBDRTasks,
  BDRMeeting,
  BDRTaskAPIItem,
} from "../../services/bdrApi";

type BDRHomeTask = {
  id: string;
  title: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  completed: boolean;
};

const fromBDRApiStatus = (status: string): BDRHomeTask["status"] => {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "COMPLETED";
  if (normalized === "in_progress" || normalized === "inprogress") {
    return "IN_PROGRESS";
  }
  return "TODO";
};

const mapBDRHomeTask = (task: BDRTaskAPIItem): BDRHomeTask => {
  const status = fromBDRApiStatus(task.status);
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.split("T")[0] || "",
    priority: task.priority || "MEDIUM",
    status,
    completed: status === "COMPLETED",
  };
};

export function BDRHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    projects,
    fetchProjects,
  } = useProjectStore();
  const [greeting, setGreeting] = useState("Good morning");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // BDR API state
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [meetings, setMeetings] = useState<BDRMeeting[]>([]);
  const [meetingsTotal, setMeetingsTotal] = useState(0);
  const [bdrLoading, setBdrLoading] = useState(true);
  const [bdrError, setBdrError] = useState<string | null>(null);
  const [bdrTasks, setBdrTasks] = useState<BDRHomeTask[]>([]);

  const loadBDRTasks = useCallback(async () => {
    try {
      // BDR must use dedicated endpoint, not generic /api/tasks.
      const taskRes = await getBDRTasks(50, 0, "TODO");
      setBdrTasks((taskRes.tasks || []).map(mapBDRHomeTask));
    } catch {
      setBdrTasks([]);
    }
  }, []);

  const loadBDRData = useCallback(async () => {
    setBdrLoading(true);
    setBdrError(null);
    try {
      const [leadsRes, meetingsRes] = await Promise.all([
        getBDRLeads(20, 0),
        getBDRMeetings(5, 0),
      ]);
      setLeadsTotal(leadsRes.total);
      setMeetings(meetingsRes.meetings);
      setMeetingsTotal(meetingsRes.total);
    } catch (err) {
      setBdrError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setBdrLoading(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchProjects();
    loadBDRData();
  loadBDRTasks();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchProjects, loadBDRData, loadBDRTasks]);

  const activeProjects = (projects || []).filter((p) => p.status === "active");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = bdrTasks.filter((t) => !t.completed && t.dueDate === todayStr);

  const upcomingMeetings = meetings
    .filter((m) => m.status === "SCHEDULED")
    .slice(0, 3);

  const formatMeetingTime = (isoDate: string | null) => {
    if (!isoDate) return "—";
    return new Date(isoDate).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMeetingStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
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
          <div
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-3.5 text-white cursor-pointer active:scale-95 transition-all"
            onClick={() => navigate("/bdr/leads")}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">
              {bdrLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                leadsTotal
              )}
            </p>
            <p className="text-xs opacity-90 mt-0.5">Active Leads</p>
          </div>
          <div
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-3.5 text-white cursor-pointer active:scale-95 transition-all"
            onClick={() => navigate("/bdr/meetings")}
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">
              {bdrLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                meetingsTotal
              )}
            </p>
            <p className="text-xs opacity-90 mt-0.5">Meetings</p>
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
              onClick={() => navigate("/bdr/leads")}
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
              onClick={() => navigate("/bdr/meetings")}
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

        {/* Upcoming Meetings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              Upcoming Meetings
            </h2>
            <button
              onClick={() => navigate("/bdr/meetings")}
              className="text-xs text-purple-600 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {bdrLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Spinner size="md" color="brand" className="mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Loading meetings...</p>
            </div>
          ) : bdrError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                Couldn't load meetings
              </p>
              <button
                onClick={loadBDRData}
                className="inline-flex items-center gap-1.5 bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium mt-2"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CalendarClock className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                No upcoming meetings
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your scheduled meetings will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => navigate("/bdr/meetings")}
                  className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarClock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {meeting.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatMeetingTime(meeting.scheduledAt)}
                      </span>
                      {meeting._count.participants > 0 && (
                        <span className="text-xs text-gray-400">
                          · {meeting._count.participants} participant
                          {meeting._count.participants > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getMeetingStatusBadge(meeting.status)}`}
                  >
                    {meeting.status === "SCHEDULED"
                      ? "Scheduled"
                      : meeting.status === "IN_PROGRESS"
                        ? "In Progress"
                        : meeting.status === "COMPLETED"
                          ? "Done"
                          : "Cancelled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            Active Projects
          </h2>
          <p className="text-xs text-gray-500 mb-2 px-1">
            Task counts on this card use BDR task data from /api/bdr/tasks.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {activeProjects.map((project) => {
              const pendingTaskCount = bdrTasks.filter((t) => !t.completed).length;
              return (
                <div
                  key={project.id}
                  className="flex-shrink-0 w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
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
                        <span>
                          {project.stage ? getStageLabel(project.stage) : ""}
                        </span>
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
                        {pendingTaskCount} {pendingTaskCount === 1 ? "Task" : "Tasks"}
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
