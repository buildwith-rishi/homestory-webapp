import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Phone,
  MapPin,
  FileText,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import {
  ScheduleMeetingModal,
  MeetingFormData,
} from "../../components/dashboard/ScheduleMeetingModal";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";

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
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const { selectedProject } = useProjectFilter();

  const handleScheduleMeeting = (meetingData: MeetingFormData) => {
    console.log("New meeting scheduled:", meetingData);
    // Here you would typically send this data to your API
    // For now, we'll just log it
    alert(
      `Meeting "${meetingData.title}" scheduled successfully!\n${
        meetingData.meetingLink
          ? `Meeting Link: ${meetingData.meetingLink}`
          : ""
      }`,
    );
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
          <Button variant="secondary" className="rounded-xl">
            <Calendar className="w-4 h-4" />
            View Calendar
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSubmit={handleScheduleMeeting}
      />

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
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
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
                    <p className="text-gray-600">{selectedMeeting.client}</p>
                  </div>
                  <Badge
                    className={`rounded-lg ${statusColors[selectedMeeting.status].bg} ${statusColors[selectedMeeting.status].text} border ${statusColors[selectedMeeting.status].border}`}
                  >
                    {selectedMeeting.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">Date & Time</p>
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
              : "Schedule your first meeting"}
          </p>
          <Button className="rounded-xl">
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </Card>
      )}
    </div>
  );
};
