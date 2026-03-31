import { useEffect, useState, useCallback } from "react";
import {
  CalendarClock,
  RefreshCw,
  Clock,
  Users,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { Spinner } from "../../components/ui";
import { getBDRMeetings, BDRMeeting } from "../../services/bdrApi";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    bg: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-100 text-red-700",
    dot: "bg-red-400",
  },
};

function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function MeetingCard({ meeting }: { meeting: BDRMeeting }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.SCHEDULED;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Main row */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <CalendarClock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 leading-snug">
                {meeting.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bg}`}
                >
                  {status.label}
                </span>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {meeting.scheduledAt && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(meeting.scheduledAt)}
                </span>
              )}
              {meeting._count.participants > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  {meeting._count.participants} participant
                  {meeting._count.participants > 1 ? "s" : ""}
                </span>
              )}
              {meeting.entityType && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {meeting.entityType === "PROJECT"
                    ? "Project"
                    : meeting.entityType}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {meeting.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700">{meeting.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Created By
              </p>
              <p className="text-sm text-gray-700">{meeting.createdBy.name}</p>
              <p className="text-xs text-gray-500">{meeting.createdBy.email}</p>
            </div>
            {meeting.meetingType && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Type
                </p>
                <p className="text-sm text-gray-700">{meeting.meetingType}</p>
              </div>
            )}
          </div>

          {meeting.participants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Participants
              </p>
              <div className="space-y-1.5">
                {meeting.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 text-xs font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {p.name}
                      </p>
                      {p.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {p.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meeting.summary && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Summary
              </p>
              <p className="text-sm text-gray-700">{meeting.summary}</p>
            </div>
          )}

          {meeting.transcriptText && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Transcript Preview
              </p>
              <p className="text-xs text-gray-600 line-clamp-3">
                {meeting.transcriptText}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
            {meeting.startedAt && (
              <div>
                <span className="font-medium">Started:</span>{" "}
                {formatDate(meeting.startedAt)}
              </div>
            )}
            {meeting.endedAt && (
              <div>
                <span className="font-medium">Ended:</span>{" "}
                {formatDate(meeting.endedAt)}
              </div>
            )}
            {meeting.durationSeconds && (
              <div>
                <span className="font-medium">Duration:</span>{" "}
                {Math.round(meeting.durationSeconds / 60)} min
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const FILTER_OPTIONS = [
  "All",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

export function BDRMeetings() {
  const [meetings, setMeetings] = useState<BDRMeeting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  const loadMeetings = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBDRMeetings(LIMIT, offset);
      setMeetings(res.meetings);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings(0);
  }, [loadMeetings]);

  const handleRefresh = () => {
    setPage(0);
    loadMeetings(0);
  };

  const filterStatusMap: Record<FilterOption, string | null> = {
    All: null,
    Scheduled: "SCHEDULED",
    "In Progress": "IN_PROGRESS",
    Completed: "COMPLETED",
    Cancelled: "CANCELLED",
  };

  const filteredMeetings = meetings.filter((m) => {
    const statusMatch =
      !filterStatusMap[filter] || m.status === filterStatusMap[filter];
    if (!statusMatch) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.createdBy.name.toLowerCase().includes(q) ||
      m.participants.some((p) => p.name.toLowerCase().includes(q))
    );
  });

  const countByStatus = (status: string) =>
    meetings.filter((m) => m.status === status).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Meetings" showNotifications />

      <div className="p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Meetings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading
                ? "Loading..."
                : `${total} meeting${total !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Stats row */}
        {!loading && !error && meetings.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {(
              ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const
            ).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const count = countByStatus(s);
              return (
                <div
                  key={s}
                  className="bg-white rounded-xl border border-gray-200 p-2.5 text-center shadow-sm"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${cfg.dot} mx-auto mb-1`}
                  />
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {cfg.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === opt
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <Spinner size="lg" color="brand" className="mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading meetings…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Couldn't load meetings
            </p>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">
              {search || filter !== "All"
                ? "No matching meetings"
                : "No meetings yet"}
            </p>
            <p className="text-sm text-gray-500">
              {search || filter !== "All"
                ? "Try adjusting your search or filter"
                : "Your meetings will appear here once scheduled"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={page === 0 || loading}
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    loadMeetings(newPage * LIMIT);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 disabled:opacity-40 shadow-sm"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {page + 1} of {Math.ceil(total / LIMIT)}
                </span>
                <button
                  disabled={(page + 1) * LIMIT >= total || loading}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    loadMeetings(newPage * LIMIT);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 disabled:opacity-40 shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
