import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Plus,
  Filter,
  Search,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Shield,
  Calendar as CalendarIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { IssueCategory, IssueSeverity } from "../../types";
import toast from "react-hot-toast";
import {
  getSiteEngineerIssues,
  updateSiteEngineerIssueStatus,
} from "../../services/siteEngineerApi";

interface Issue {
  id: string;
  projectName: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  location?: string;
}

export function EngineerIssues() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

  const loadIssues = () => {
    setIssuesLoading(true);
    getSiteEngineerIssues()
      .then((data) => setIssues(data as Issue[]))
      .catch((err) => {
        console.warn("Issues fetch failed:", err);
        // Silently fall through – empty list is shown
      })
      .finally(() => setIssuesLoading(false));
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleStatusUpdate = async (
    issueId: string,
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
  ) => {
    setUpdatingIssueId(issueId);
    try {
      const updated = await updateSiteEngineerIssueStatus(issueId, { status });
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? ({
                ...issue,
                status: updated.status,
              } as Issue)
            : issue,
        ),
      );
      toast.success("Issue status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update issue");
    } finally {
      setUpdatingIssueId(null);
    }
  };

  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.MATERIAL:
        return Package;
      case IssueCategory.QUALITY:
        return AlertTriangle;
      case IssueCategory.SAFETY:
        return Shield;
      case IssueCategory.DELAY:
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.CRITICAL:
        return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
      case IssueSeverity.HIGH:
        return {
          bg: "bg-orange-100",
          text: "text-orange-700",
          dot: "bg-orange-500",
        };
      case IssueSeverity.MEDIUM:
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          dot: "bg-yellow-500",
        };
      case IssueSeverity.LOW:
        return { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "OPEN":
        return { bg: "bg-red-50", text: "text-red-700", icon: AlertCircle };
      case "IN_PROGRESS":
        return { bg: "bg-blue-50", text: "text-blue-700", icon: Clock };
      case "RESOLVED":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          icon: CheckCircle2,
        };
      default:
        return { bg: "bg-gray-50", text: "text-gray-700", icon: AlertCircle };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesStatus =
      filterStatus === "ALL" || issue.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openCount = issues.filter((i) => i.status === "OPEN").length;
  const inProgressCount = issues.filter(
    (i) => i.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Issues" showNotifications />

      {/* Stats Summary */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{openCount}</p>
            <p className="text-xs text-gray-600">Open</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {inProgressCount}
            </p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-xs text-gray-600">Resolved</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-20 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              showFilters
                ? "bg-orange-500 text-white"
                : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === status
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="p-4 space-y-3">
        {/* Loading skeleton */}
        {issuesLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!issuesLoading && filteredIssues.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? "No Results" : "No Issues"}
            </h3>
            <p className="text-sm text-gray-600">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "All clear! No issues reported"}
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const CategoryIcon = getCategoryIcon(issue.category);
            const severityColors = getSeverityColor(issue.severity);
            const statusConfig = getStatusConfig(issue.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={issue.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-10 h-10 ${severityColors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <CategoryIcon
                        className={`w-5 h-5 ${severityColors.text}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {issue.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{issue.projectName}</span>
                        {issue.location && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{issue.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityColors.bg} ${severityColors.text}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${severityColors.dot}`}
                    />
                    {issue.severity}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {issue.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {issue.status.replace("_", " ")}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(issue.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {issue.status === "OPEN" && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(issue.id, "IN_PROGRESS")
                      }
                      disabled={updatingIssueId === issue.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 disabled:opacity-60"
                    >
                      {updatingIssueId === issue.id ? "Updating..." : "Start Work"}
                    </button>
                  )}
                  {issue.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleStatusUpdate(issue.id, "RESOLVED")}
                      disabled={updatingIssueId === issue.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 disabled:opacity-60"
                    >
                      {updatingIssueId === issue.id
                        ? "Updating..."
                        : "Mark Resolved"}
                    </button>
                  )}
                  {issue.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusUpdate(issue.id, "OPEN")}
                      disabled={updatingIssueId === issue.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 disabled:opacity-60"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/app/issues/report")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl active:scale-95 transition-all z-20"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
