import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Phone,
  Users,
  Mail,
  MessageSquare,
  MapPin,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Upload,
  CheckCircle2,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  X,
  Clock,
  Filter,
  ClipboardList,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { Button, Card } from "../../ui";
import toast from "react-hot-toast";
import type { Activity, LogActivityRequest } from "../../../types";
import {
  getActivitiesByEntity,
  logMeeting,
  logCall,
  logNote,
  logWhatsApp,
  logEmail,
  logSiteVisit,
} from "../../../services/activitiesApi";

// ==========================================
// Activity Type Configuration
// ==========================================

type LucideIcon = React.FC<
  React.SVGProps<SVGSVGElement> & { size?: number | string }
>;

const ACTIVITY_TYPE_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    label: string;
    dotColor: string;
  }
> = {
  NOTE: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    label: "Note",
    dotColor: "bg-blue-500",
  },
  CALL: {
    icon: Phone,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    label: "Call",
    dotColor: "bg-green-500",
  },
  MEETING: {
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    label: "Meeting",
    dotColor: "bg-purple-500",
  },
  EMAIL: {
    icon: Mail,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    label: "Email",
    dotColor: "bg-orange-500",
  },
  WHATSAPP: {
    icon: MessageSquare,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    label: "WhatsApp",
    dotColor: "bg-emerald-500",
  },
  SITE_VISIT: {
    icon: MapPin,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    label: "Site Visit",
    dotColor: "bg-red-500",
  },
  STAGE_CHANGE: {
    icon: TrendingUp,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-200",
    label: "Stage Change",
    dotColor: "bg-indigo-500",
  },
  STATUS_CHANGE: {
    icon: RefreshCw,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    label: "Status Change",
    dotColor: "bg-amber-500",
  },
  PAYMENT: {
    icon: CreditCard,
    color: "text-teal-600",
    bgColor: "bg-teal-50 border-teal-200",
    label: "Payment",
    dotColor: "bg-teal-500",
  },
  DOCUMENT_UPLOAD: {
    icon: Upload,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 border-cyan-200",
    label: "Document",
    dotColor: "bg-cyan-500",
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    color: "text-lime-600",
    bgColor: "bg-lime-50 border-lime-200",
    label: "Task Done",
    dotColor: "bg-lime-500",
  },
};

// Quick log types (only the ones that have API endpoints)
const QUICK_LOG_TYPES = [
  "MEETING",
  "CALL",
  "NOTE",
  "WHATSAPP",
  "EMAIL",
  "SITE_VISIT",
] as const;

// ==========================================
// Helpers
// ==========================================

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(dateString);
};

// ==========================================
// Props
// ==========================================

interface ActivitiesTabProps {
  projectId: string;
}

// ==========================================
// Component
// ==========================================

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ projectId }) => {
  // State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState<string>("NOTE");
  const [submitting, setSubmitting] = useState(false);
  const [logForm, setLogForm] = useState({
    description: "",
    durationMinutes: 0,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [displayCount, setDisplayCount] = useState(10);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  // ==========================================
  // Data Fetching
  // ==========================================

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivitiesByEntity("PROJECT", projectId);
      // API may return { data: [...] }, { activities: [...] }, or a raw array
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.activities)
            ? (data as any).activities
            : [];
      setActivities(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load activities";
      setError(message);
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(10);
  }, [activeFilter, debouncedSearch]);

  // ==========================================
  // Filtering
  // ==========================================

  const filteredActivities = activities
    .filter((a) => activeFilter === "ALL" || a.type === activeFilter)
    .filter(
      (a) =>
        !debouncedSearch ||
        a.description.toLowerCase().includes(debouncedSearch.toLowerCase()),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const hasMore = filteredActivities.length > displayCount;
  const displayedActivities = filteredActivities.slice(0, displayCount);

  // Group displayed activities by date
  const getDateGroup = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (date >= today) return "Today";
    if (date >= yesterday) return "Yesterday";
    if (date >= thisWeekStart) return "This Week";
    if (date >= thisMonthStart) return "This Month";
    return "Earlier";
  };

  const groupedActivities = displayedActivities.reduce<
    Record<string, Activity[]>
  >((groups, activity) => {
    const group = getDateGroup(activity.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(activity);
    return groups;
  }, {});

  const dateGroupOrder = [
    "Today",
    "Yesterday",
    "This Week",
    "This Month",
    "Earlier",
  ];

  // Get unique activity types present in data for filter chips
  const presentTypes = Array.from(new Set(activities.map((a) => a.type)));

  // ==========================================
  // Log Activity Handler
  // ==========================================

  const resetForm = () => {
    setLogForm({ description: "", durationMinutes: 0 });
  };

  const openLogModal = (type: string) => {
    setSelectedLogType(type);
    resetForm();
    setShowLogModal(true);
  };

  const handleLogActivity = async () => {
    if (!logForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    setSubmitting(true);
    try {
      const payload: LogActivityRequest = {
        entityType: "PROJECT",
        entityId: projectId,
        description: logForm.description,
        ...((selectedLogType === "CALL" || selectedLogType === "MEETING") &&
        logForm.durationMinutes > 0
          ? { durationMinutes: logForm.durationMinutes }
          : {}),
      };

      // Map to correct API function
      const logFunctions: Record<
        string,
        (data: LogActivityRequest) => Promise<Activity>
      > = {
        MEETING: logMeeting,
        CALL: logCall,
        NOTE: logNote,
        WHATSAPP: logWhatsApp,
        EMAIL: logEmail,
        SITE_VISIT: logSiteVisit,
      };

      const fn = logFunctions[selectedLogType];
      if (!fn) {
        toast.error("Invalid activity type");
        return;
      }

      await fn(payload);
      toast.success(
        `${ACTIVITY_TYPE_CONFIG[selectedLogType]?.label || selectedLogType} logged successfully`,
      );
      setShowLogModal(false);
      resetForm();
      fetchActivities();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to log activity",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Render: Loading State
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mt-2" />
              </div>
            </div>
            <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </Card>
        {/* Timeline skeletons */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-6">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // Render: Error State
  // ==========================================

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Activities
          </h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Button
            onClick={fetchActivities}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // ==========================================
  // Render: Main Component
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ====== Header ====== */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Activity Timeline
              </h2>
              <p className="text-sm text-gray-500">
                {activities.length} activit
                {activities.length === 1 ? "y" : "ies"} logged
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchActivities}
              variant="ghost"
              className="border border-gray-200 hover:bg-gray-50"
              title="Refresh activities"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => openLogModal("NOTE")}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Activity
            </Button>
          </div>
        </div>

        {/* Activity Stats Summary */}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            {presentTypes.map((type) => {
              const config = ACTIVITY_TYPE_CONFIG[type];
              if (!config) return null;
              const count = activities.filter((a) => a.type === type).length;
              const IconComp = config.icon;
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border`}
                >
                  <IconComp className="w-3 h-3" />
                  {count}
                </span>
              );
            })}
          </div>
        )}
      </Card>

      {/* ====== Quick Log Actions ====== */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Log
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LOG_TYPES.map((type) => {
            const config = ACTIVITY_TYPE_CONFIG[type];
            if (!config) return null;
            const IconComp = config.icon;
            return (
              <button
                key={type}
                onClick={() => openLogModal(type)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 ${config.bgColor} ${config.color}`}
              >
                <IconComp className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ====== Filter Bar ====== */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === "ALL"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({activities.length})
            </button>
            {presentTypes.map((type) => {
              const config = ACTIVITY_TYPE_CONFIG[type];
              if (!config) return null;
              const count = activities.filter((a) => a.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setActiveFilter(activeFilter === type ? "ALL" : type)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFilter === type
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
          {/* Search */}
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ====== Activity Timeline ====== */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-6">
        {filteredActivities.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 text-orange-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activities.length === 0
                ? "No Activities Yet"
                : "No Matching Activities"}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {activities.length === 0
                ? "Start logging activities to track your project interactions, meetings, calls, and more."
                : "Try adjusting your filters or search query."}
            </p>
            {activities.length === 0 && (
              <Button
                onClick={() => openLogModal("NOTE")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log First Activity
              </Button>
            )}
          </div>
        ) : (
          /* Timeline */
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-orange-200 via-gray-200 to-gray-100" />

            <div className="space-y-1">
              {dateGroupOrder
                .filter((group) => groupedActivities[group]?.length > 0)
                .map((group) => (
                  <div key={group}>
                    {/* Date group header */}
                    <div className="flex items-center gap-2 py-2 pl-10 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {group}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {groupedActivities[group].map((activity) => {
                      const config = ACTIVITY_TYPE_CONFIG[activity.type] || {
                        icon: FileText,
                        color: "text-gray-600",
                        bgColor: "bg-gray-50 border-gray-200",
                        label: activity.type,
                        dotColor: "bg-gray-400",
                      };
                      const IconComp = config.icon;

                      return (
                        <div
                          key={activity.id}
                          className="relative flex gap-4 pl-1 group cursor-pointer"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          {/* Timeline dot */}
                          <div className="relative z-10 mt-3 shrink-0">
                            <div
                              className={`w-[14px] h-[14px] rounded-full ${config.dotColor} border-2 border-white shadow-sm ring-2 ring-gray-100 group-hover:ring-orange-100 transition-all`}
                            />
                          </div>

                          {/* Activity card */}
                          <div
                            className={`flex-1 mb-4 p-4 rounded-xl border transition-all hover:shadow-md ${config.bgColor} group-hover:border-orange-200/50`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.color} bg-white/60`}
                                >
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <span
                                  className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {activity.durationMinutes &&
                                  activity.durationMinutes > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-xs font-medium text-gray-600 border border-gray-200/50">
                                      <Clock className="w-3 h-3" />
                                      {activity.durationMinutes}m
                                    </span>
                                  )}
                              </div>
                            </div>

                            <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-2">
                              {activity.description}
                            </p>

                            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(activity.createdAt)}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span>{formatDateTime(activity.createdAt)}</span>
                              {activity.createdBy && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span>by {activity.createdBy}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* Show More button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 10)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all hover:shadow-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show More ({filteredActivities.length - displayCount}{" "}
                  remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ====== Log Activity Modal ====== */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = ACTIVITY_TYPE_CONFIG[selectedLogType];
                    if (!config) return null;
                    const IconComp = config.icon;
                    return (
                      <>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor} border`}
                        >
                          <IconComp className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Log {config.label}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Add a new {config.label.toLowerCase()} entry
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => {
                    setShowLogModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Activity Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_LOG_TYPES.map((type) => {
                    const config = ACTIVITY_TYPE_CONFIG[type];
                    if (!config) return null;
                    const IconComp = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedLogType(type)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedLogType === type
                            ? `${config.bgColor} ${config.color} ring-2 ring-orange-300`
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) =>
                    setLogForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={`Enter ${ACTIVITY_TYPE_CONFIG[selectedLogType]?.label.toLowerCase() || "activity"} details...`}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
                />
              </div>

              {/* Duration (for calls/meetings) */}
              {(selectedLogType === "CALL" ||
                selectedLogType === "MEETING") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={logForm.durationMinutes || ""}
                    onChange={(e) =>
                      setLogForm((prev) => ({
                        ...prev,
                        durationMinutes: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowLogModal(false);
                    resetForm();
                  }}
                  variant="ghost"
                  className="flex-1 border border-gray-200"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLogActivity}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  disabled={submitting || !logForm.description.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Log{" "}
                      {ACTIVITY_TYPE_CONFIG[selectedLogType]?.label ||
                        "Activity"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Activity Detail Modal ====== */}
      {selectedActivity &&
        (() => {
          const config = ACTIVITY_TYPE_CONFIG[selectedActivity.type] || {
            icon: FileText,
            color: "text-gray-600",
            bgColor: "bg-gray-50 border-gray-200",
            label: selectedActivity.type,
            dotColor: "bg-gray-400",
          };
          const IconComp = config.icon;
          return (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setSelectedActivity(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Detail Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor} border`}
                      >
                        <IconComp className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {config.label}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Activity Details
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Detail Content */}
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Description
                      </label>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                        {selectedActivity.description}
                      </p>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Created
                        </label>
                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDateTime(selectedActivity.createdAt)}
                        </p>
                      </div>
                      {selectedActivity.updatedAt !==
                        selectedActivity.createdAt && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Updated
                          </label>
                          <p className="text-sm text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatDateTime(selectedActivity.updatedAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    {selectedActivity.durationMinutes &&
                      selectedActivity.durationMinutes > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Duration
                          </label>
                          <p className="text-sm text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {selectedActivity.durationMinutes} minutes
                          </p>
                        </div>
                      )}

                    {/* Entity Info */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Linked To
                      </label>
                      <p className="text-sm text-gray-700">
                        {selectedActivity.entityType} #
                        {selectedActivity.entityId.slice(0, 8)}
                      </p>
                    </div>

                    {/* Created By */}
                    {selectedActivity.createdBy && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Created By
                        </label>
                        <p className="text-sm text-gray-700">
                          {selectedActivity.createdBy}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => setSelectedActivity(null)}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
