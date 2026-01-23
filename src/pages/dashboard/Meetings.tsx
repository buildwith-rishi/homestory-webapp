import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Phone,
  MapPin,
  FileText,
  Search,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { useMeetingRoomStore } from "../../stores/meetingRoomStore";

interface Meeting {
  id: number;
  projectId?: string; // Link meetings to projects
  title: string;
  client: string;
  date: string;
  time: string;
  duration: string;
  status: "scheduled" | "completed" | "in_progress" | "cancelled";
  type: "site_visit" | "consultation" | "design_review" | "virtual";
  location?: string;
  transcribed?: boolean;
  actionItems?: number;
  attendees?: string[];
}

const mockMeetings: Meeting[] = [
  {
    id: 1,
    projectId: "1", // Sharma Family project
    title: "Initial Consultation",
    client: "Rajesh Sharma",
    date: "2026-01-20",
    time: "10:00 AM",
    duration: "45 mins",
    status: "scheduled",
    type: "consultation",
    location: "HSR Layout Office",
    attendees: ["AR", "RS"],
  },
  {
    id: 2,
    projectId: "2", // Kumar Residence project
    title: "Design Review",
    client: "Priya Kumar",
    date: "2026-01-18",
    time: "2:30 PM",
    duration: "1 hr 15 mins",
    status: "completed",
    type: "design_review",
    location: "Client Site",
    transcribed: true,
    actionItems: 8,
    attendees: ["AR", "PK", "MG"],
  },
  {
    id: 3,
    projectId: "3", // Patel Home project
    title: "Site Visit",
    client: "Amit Patel",
    date: "2026-01-18",
    time: "4:00 PM",
    duration: "30 mins",
    status: "in_progress",
    type: "site_visit",
    location: "Whitefield Villa",
    attendees: ["RS"],
  },
  {
    id: 4,
    projectId: "4", // TechStart Inc project
    title: "Virtual Walkthrough",
    client: "Sneha Reddy",
    date: "2026-01-19",
    time: "11:00 AM",
    duration: "1 hr",
    status: "scheduled",
    type: "virtual",
    attendees: ["AR", "PK"],
  },
];

const statusColors = {
  scheduled: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  cancelled: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
};

const typeIcons = {
  site_visit: MapPin,
  consultation: Users,
  design_review: FileText,
  virtual: Video,
};

export const MeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedMeetingHistory, setExpandedMeetingHistory] = useState<
    string | null
  >(null);
  const { selectedProject } = useProjectFilter();
  const { completedMeetings } = useMeetingRoomStore();

  const handleStartMeeting = () => {
    navigate("/dashboard/meeting-room");
  };

  const handleOpenCalendar = () => {
    navigate("/dashboard/meetings/calendar");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Apply project filter, status filter, and search filter
  const filteredMeetings = useMemo(() => {
    let filtered = mockMeetings;

    // Filter by selected project
    if (selectedProject) {
      filtered = filtered.filter(
        (meeting) => meeting.projectId === selectedProject.id,
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((meeting) => meeting.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meeting.client.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [selectedProject, filterStatus, searchQuery]);

  const upcomingCount = mockMeetings.filter(
    (m) => m.status === "scheduled",
  ).length;
  const completedCount = mockMeetings.filter(
    (m) => m.status === "completed",
  ).length;
  const todayCount = mockMeetings.filter((m) => m.date === "2026-01-18").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Indicator */}
      {selectedProject && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {selectedProject.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-orange-900">
                Viewing Filtered Meetings
              </p>
              <p className="text-xs text-orange-700">
                {selectedProject.name} - {selectedProject.client}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">
            Schedule and track all client meetings
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={handleOpenCalendar}
          >
            <Calendar className="w-4 h-4" />
            View Calendar
          </Button>
          <Button className="rounded-xl" onClick={handleStartMeeting}>
            <Video className="w-4 h-4" />
            Start Meeting
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {todayCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {upcomingCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {completedCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockMeetings.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search meetings..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "scheduled", "completed", "in_progress"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMeetings.map((meeting) => {
          const statusColor = statusColors[meeting.status];
          const TypeIcon = typeIcons[meeting.type];

          return (
            <Card
              key={meeting.id}
              className="p-5 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedMeeting(meeting)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl ${statusColor.bg} flex items-center justify-center`}
                  >
                    <TypeIcon className={`w-6 h-6 ${statusColor.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {meeting.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {meeting.client}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
                >
                  <div className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                  <span className="text-xs font-medium">
                    {meeting.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(meeting.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-gray-400">•</span>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{meeting.time}</span>
                  <span className="text-gray-400">({meeting.duration})</span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{meeting.location}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex -space-x-2">
                  {meeting.attendees?.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                    >
                      {attendee}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {meeting.transcribed && (
                    <Badge className="text-xs bg-purple-50 text-purple-700 rounded-lg">
                      <FileText className="w-3 h-3 mr-1" />
                      Transcribed
                    </Badge>
                  )}
                  {meeting.actionItems && (
                    <Badge className="text-xs bg-blue-50 text-blue-700 rounded-lg">
                      {meeting.actionItems} tasks
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting &&
        ReactDOM.createPortal(
          <>
            {/* Backdrop - covers entire viewport */}
            <div
              onClick={() => setSelectedMeeting(null)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(17, 24, 39, 0.5)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                zIndex: 9998,
              }}
            />
            {/* Modal */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                pointerEvents: "none",
              }}
            >
              <Card
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
                style={{ pointerEvents: "auto" }}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <h2 className="text-xl font-bold text-gray-900">
                    Meeting Details
                  </h2>
                  <button
                    onClick={() => setSelectedMeeting(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Meeting Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-14 h-14 rounded-xl ${statusColors[selectedMeeting.status].bg} flex items-center justify-center`}
                      >
                        {React.createElement(typeIcons[selectedMeeting.type], {
                          className: `w-7 h-7 ${statusColors[selectedMeeting.status].text}`,
                        })}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedMeeting.title}
                        </h3>
                        <p className="text-gray-600">
                          {selectedMeeting.client}
                        </p>
                      </div>
                      <Badge
                        className={`rounded-lg ${statusColors[selectedMeeting.status].bg} ${statusColors[selectedMeeting.status].text} border ${statusColors[selectedMeeting.status].border}`}
                      >
                        {selectedMeeting.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">
                          Date & Time
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedMeeting.date).toLocaleDateString(
                            "en-US",
                            { month: "long", day: "numeric", year: "numeric" },
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedMeeting.time} • {selectedMeeting.duration}
                        </p>
                      </div>
                      {selectedMeeting.location && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-600 mb-1">Location</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedMeeting.location}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendees */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Attendees
                    </h4>
                    <div className="flex gap-3">
                      {selectedMeeting.attendees?.map((attendee, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                            {attendee}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="flex-1 rounded-xl">
                      <Phone className="w-4 h-4" />
                      Start Call
                    </Button>
                    <Button variant="secondary" className="flex-1 rounded-xl">
                      <FileText className="w-4 h-4" />
                      View Notes
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </>,
          document.body,
        )}

      {/* Meeting History with Notes */}
      {completedMeetings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Past Meeting Notes
            </h2>
            <span className="text-sm text-gray-500">
              {completedMeetings.length} meetings with notes
            </span>
          </div>

          <div className="space-y-3">
            {completedMeetings.map((meeting) => (
              <Card
                key={meeting.id}
                className={`rounded-xl overflow-hidden transition-all duration-300 ${
                  expandedMeetingHistory === meeting.id
                    ? "ring-2 ring-orange-500"
                    : ""
                }`}
              >
                {/* Meeting Header */}
                <button
                  onClick={() =>
                    setExpandedMeetingHistory(
                      expandedMeetingHistory === meeting.id ? null : meeting.id,
                    )
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.duration}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {meeting.participants.length} attendees
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {meeting.notes.length > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        <FileText className="w-3 h-3 mr-1" />
                        {meeting.notes.length} notes
                      </Badge>
                    )}
                    {meeting.transcript.length > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Transcribed
                      </Badge>
                    )}
                    {expandedMeetingHistory === meeting.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedMeetingHistory === meeting.id && (
                  <div className="border-t border-gray-200 bg-gray-50/50">
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Notes Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          Meeting Notes
                        </h4>
                        {meeting.notes.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            No notes were taken during this meeting
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {meeting.notes.map((note) => (
                              <div
                                key={note.id}
                                className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                              >
                                <p className="text-sm text-gray-700">
                                  {note.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(note.timestamp)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Transcript Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          Transcript Highlights
                        </h4>
                        {meeting.transcript.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            No transcript available
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {meeting.transcript.slice(0, 5).map((entry) => (
                              <div
                                key={entry.id}
                                className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                              >
                                <p className="text-xs font-medium text-blue-600 mb-1">
                                  {entry.speaker}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {entry.text}
                                </p>
                              </div>
                            ))}
                            {meeting.transcript.length > 5 && (
                              <p className="text-sm text-gray-500 text-center py-2">
                                +{meeting.transcript.length - 5} more entries
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="px-4 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        Participants
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {meeting.participants.map((participant, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white rounded-full text-sm text-gray-700 border border-gray-200"
                          >
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredMeetings.length === 0 && (
        <Card className="p-12 rounded-xl text-center">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No meetings found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Start your first meeting"}
          </p>
          <Button className="rounded-xl" onClick={handleStartMeeting}>
            <Video className="w-4 h-4" />
            Start Meeting
          </Button>
        </Card>
      )}
    </div>
  );
};
