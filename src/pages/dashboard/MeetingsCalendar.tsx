import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, dateFnsLocalizer, SlotInfo } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
  isSameDay,
} from "date-fns";
import { enUS } from "date-fns/locale";
import {
  X,
  MapPin,
  Users,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button, Card } from "../../components/ui";

// Setup date-fns localizer
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Meeting types and their configurations
const meetingTypes = {
  site_visit: { label: "Site Visit", icon: MapPin, color: "#f97316" },
  consultation: { label: "Consultation", icon: Users, color: "#3b82f6" },
  design_review: { label: "Design Review", icon: FileText, color: "#8b5cf6" },
  virtual: { label: "Virtual Meeting", icon: Video, color: "#10b981" },
};

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    color: "#3b82f6",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  completed: {
    label: "Completed",
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  in_progress: {
    label: "In Progress",
    color: "#f97316",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  cancelled: {
    label: "Cancelled",
    color: "#6b7280",
    bg: "bg-gray-50",
    text: "text-gray-700",
  },
};

export interface CalendarMeeting {
  id: number;
  title: string;
  client: string;
  start: Date;
  end: Date;
  status: "scheduled" | "completed" | "in_progress" | "cancelled";
  type: "site_visit" | "consultation" | "design_review" | "virtual";
  location?: string;
  attendees?: string[];
  notes?: string;
}

// Mock meetings data
const mockMeetings: CalendarMeeting[] = [
  {
    id: 1,
    title: "Initial Consultation",
    client: "Rajesh Sharma",
    start: new Date(2026, 0, 20, 10, 0),
    end: new Date(2026, 0, 20, 10, 45),
    status: "scheduled",
    type: "consultation",
    location: "HSR Layout Office",
    attendees: ["AR", "RS"],
  },
  {
    id: 2,
    title: "Design Review",
    client: "Priya Kumar",
    start: new Date(2026, 0, 18, 14, 30),
    end: new Date(2026, 0, 18, 15, 45),
    status: "completed",
    type: "design_review",
    location: "Client Site",
    attendees: ["AR", "PK", "MG"],
    notes: "Discussed floor plan changes and material selections.",
  },
  {
    id: 3,
    title: "Site Visit",
    client: "Amit Patel",
    start: new Date(2026, 0, 18, 16, 0),
    end: new Date(2026, 0, 18, 16, 30),
    status: "in_progress",
    type: "site_visit",
    location: "Whitefield Villa",
    attendees: ["RS"],
  },
  {
    id: 4,
    title: "Virtual Walkthrough",
    client: "Sneha Reddy",
    start: new Date(2026, 0, 19, 11, 0),
    end: new Date(2026, 0, 19, 12, 0),
    status: "scheduled",
    type: "virtual",
    attendees: ["AR", "PK"],
  },
];

// Custom toolbar component
const CustomToolbar: React.FC<{
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: "month" | "week" | "day" | "agenda") => void;
  view: string;
}> = ({ date, onNavigate, onView, view }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("TODAY")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Today
        </button>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onNavigate("PREV")}
            className="p-2 hover:bg-white rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => onNavigate("NEXT")}
            className="p-2 hover:bg-white rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {format(date, "MMMM yyyy")}
        </h2>
      </div>
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {(["month", "week", "day", "agenda"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              view === v
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

// Event component for calendar cells
const EventComponent: React.FC<{ event: CalendarMeeting }> = ({ event }) => {
  const typeConfig = meetingTypes[event.type];
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium truncate"
      style={{
        backgroundColor: `${typeConfig.color}15`,
        color: typeConfig.color,
        borderLeft: `3px solid ${typeConfig.color}`,
      }}
    >
      <TypeIcon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{event.title}</span>
    </div>
  );
};

// Add/Edit Meeting Modal
const MeetingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (meeting: Omit<CalendarMeeting, "id"> | CalendarMeeting) => void;
  onDelete?: () => void;
  meeting?: CalendarMeeting | null;
  defaultStart?: Date;
  defaultEnd?: Date;
}> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  meeting,
  defaultStart,
  defaultEnd,
}) => {
  const [formData, setFormData] = useState({
    title: meeting?.title || "",
    client: meeting?.client || "",
    start: meeting?.start || defaultStart || new Date(),
    end: meeting?.end || defaultEnd || addHours(new Date(), 1),
    type: meeting?.type || ("consultation" as CalendarMeeting["type"]),
    status: meeting?.status || ("scheduled" as CalendarMeeting["status"]),
    location: meeting?.location || "",
    attendees: meeting?.attendees?.join(", ") || "",
    notes: meeting?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.client.trim()) newErrors.client = "Client name is required";
    if (formData.start >= formData.end)
      newErrors.end = "End time must be after start time";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const meetingData = {
      ...(meeting?.id ? { id: meeting.id } : {}),
      title: formData.title,
      client: formData.client,
      start: formData.start,
      end: formData.end,
      type: formData.type,
      status: formData.status,
      location: formData.location || undefined,
      attendees: formData.attendees
        ? formData.attendees.split(",").map((a) => a.trim())
        : undefined,
      notes: formData.notes || undefined,
    };

    onSave(meetingData as CalendarMeeting);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {meeting ? "Edit Meeting" : "Schedule New Meeting"}
              </h2>
              <p className="text-sm text-gray-600">
                {meeting
                  ? "Update meeting details"
                  : "Fill in the meeting details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Design Review Meeting"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                errors.title ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.title}
              </p>
            )}
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) =>
                setFormData({ ...formData, client: e.target.value })
              }
              placeholder="e.g., John Smith"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                errors.client ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.client && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.client}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) =>
                  setFormData({ ...formData, start: new Date(e.target.value) })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Time
              </label>
              <input
                type="datetime-local"
                value={format(formData.end, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) =>
                  setFormData({ ...formData, end: new Date(e.target.value) })
                }
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.end ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.end && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.end}
                </p>
              )}
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Meeting Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CalendarMeeting["type"],
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {Object.entries(meetingTypes).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CalendarMeeting["status"],
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Office or Site Address"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attendees (comma-separated initials)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.attendees}
                onChange={(e) =>
                  setFormData({ ...formData, attendees: e.target.value })
                }
                placeholder="e.g., AR, PK, RS"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {meeting && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25"
            >
              <Check className="w-4 h-4" />
              {meeting ? "Update Meeting" : "Schedule Meeting"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Meeting Detail Popup
const MeetingDetailPopup: React.FC<{
  meeting: CalendarMeeting;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ meeting, onClose, onEdit, onDelete }) => {
  const typeConfig = meetingTypes[meeting.type];
  const TypeIcon = typeConfig.icon;
  const status = statusConfig[meeting.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Colored header based on type */}
        <div
          className="px-6 py-5"
          style={{ backgroundColor: `${typeConfig.color}10` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${typeConfig.color}20` }}
              >
                <TypeIcon
                  className="w-6 h-6"
                  style={{ color: typeConfig.color }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {meeting.title}
                </h3>
                <p className="text-sm text-gray-600">{meeting.client}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Status badge */}
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium">
                {format(meeting.start, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-gray-500">
                {format(meeting.start, "h:mm a")} -{" "}
                {format(meeting.end, "h:mm a")}
              </p>
            </div>
          </div>

          {meeting.location && (
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">{meeting.location}</p>
                <p className="text-sm text-gray-500">Location</p>
              </div>
            </div>
          )}

          {meeting.attendees && meeting.attendees.length > 0 && (
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  {meeting.attendees.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold"
                    >
                      {attendee}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {meeting.attendees.length} Attendees
                </p>
              </div>
            </div>
          )}

          {meeting.notes && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {meeting.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Calendar Page Component
export const MeetingsCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">(
    "month",
  );
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<CalendarMeeting | null>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [newEventSlot, setNewEventSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(mockMeetings);

  // Handle slot selection (clicking on empty space)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setNewEventSlot({ start: slotInfo.start, end: slotInfo.end });
    setShowAddModal(true);
  }, []);

  // Handle event selection (clicking on an event)
  const handleSelectEvent = useCallback((event: CalendarMeeting) => {
    setSelectedMeeting(event);
    setShowDetailPopup(true);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  // Handle add meeting
  const handleAddMeeting = (meeting: Omit<CalendarMeeting, "id">) => {
    const newMeeting: CalendarMeeting = {
      ...meeting,
      id: Date.now(),
    };
    setMeetings((prev) => [...prev, newMeeting]);
  };

  // Handle update meeting
  const handleUpdateMeeting = (meeting: CalendarMeeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? meeting : m)));
  };

  // Handle delete meeting
  const handleDeleteMeeting = (id: number) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  // Custom day cell styling
  const dayPropGetter = useCallback((date: Date) => {
    const isToday = isSameDay(date, new Date());
    return {
      className: isToday ? "rbc-today-custom" : "",
      style: isToday ? { backgroundColor: "#fff7ed" } : {},
    };
  }, []);

  // Event styling
  const eventPropGetter = useCallback((event: CalendarMeeting) => {
    const typeConfig = meetingTypes[event.type];
    return {
      style: {
        backgroundColor: `${typeConfig.color}15`,
        borderLeft: `3px solid ${typeConfig.color}`,
        color: typeConfig.color,
        borderRadius: "6px",
        padding: "2px 6px",
      },
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/meetings")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Meeting Calendar
            </h1>
            <p className="text-gray-600 mt-1">
              Schedule and manage all your meetings
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setNewEventSlot({
              start: new Date(),
              end: addHours(new Date(), 1),
            });
            setShowAddModal(true);
          }}
          className="rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Add Meeting
        </Button>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-700">
            Meeting Types:
          </span>
          {Object.entries(meetingTypes).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-sm text-gray-600">{config.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Calendar */}
      <Card
        className="p-6"
        style={{ height: "calc(100vh - 280px)", minHeight: "600px" }}
      >
        <style>{`
          .rbc-calendar {
            height: 100%;
            font-family: inherit;
          }
          .rbc-header {
            padding: 12px 8px;
            font-weight: 600;
            font-size: 0.875rem;
            color: #374151;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb !important;
          }
          .rbc-month-view {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }
          .rbc-month-row {
            border-bottom: 1px solid #e5e7eb;
          }
          .rbc-day-bg {
            transition: background-color 0.15s;
          }
          .rbc-day-bg:hover {
            background-color: #f9fafb;
          }
          .rbc-off-range-bg {
            background-color: #fafafa;
          }
          .rbc-date-cell {
            padding: 8px;
            text-align: right;
            font-size: 0.875rem;
          }
          .rbc-date-cell > a {
            color: #374151;
            font-weight: 500;
          }
          .rbc-today {
            background-color: #fff7ed !important;
          }
          .rbc-today .rbc-button-link {
            color: #ea580c;
            font-weight: 700;
          }
          .rbc-event {
            border: none !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .rbc-event:hover {
            opacity: 0.9;
          }
          .rbc-event-content {
            font-size: 0.75rem;
            font-weight: 500;
          }
          .rbc-time-view {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }
          .rbc-time-header {
            border-bottom: 1px solid #e5e7eb;
          }
          .rbc-time-content {
            border-top: none;
          }
          .rbc-timeslot-group {
            border-bottom: 1px solid #f3f4f6;
            min-height: 60px;
          }
          .rbc-time-slot {
            border-top: none;
          }
          .rbc-label {
            padding: 8px;
            font-size: 0.75rem;
            color: #6b7280;
          }
          .rbc-current-time-indicator {
            background-color: #f97316;
            height: 2px;
          }
          .rbc-current-time-indicator::before {
            content: '';
            position: absolute;
            left: -6px;
            top: -4px;
            width: 10px;
            height: 10px;
            background-color: #f97316;
            border-radius: 50%;
          }
          .rbc-agenda-view {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }
          .rbc-agenda-table {
            border: none;
          }
          .rbc-agenda-date-cell, .rbc-agenda-time-cell {
            padding: 12px;
            white-space: nowrap;
            color: #374151;
            font-size: 0.875rem;
          }
          .rbc-agenda-event-cell {
            padding: 12px;
          }
          .rbc-show-more {
            color: #f97316;
            font-weight: 500;
            font-size: 0.75rem;
            padding: 4px 8px;
          }
          .rbc-toolbar {
            display: none;
          }
        `}</style>
        <CustomToolbar
          date={date}
          onNavigate={(action) => {
            if (action === "TODAY") handleNavigate(new Date());
            else if (action === "PREV") {
              const newDate = new Date(date);
              if (view === "month") newDate.setMonth(newDate.getMonth() - 1);
              else if (view === "week") newDate.setDate(newDate.getDate() - 7);
              else newDate.setDate(newDate.getDate() - 1);
              handleNavigate(newDate);
            } else {
              const newDate = new Date(date);
              if (view === "month") newDate.setMonth(newDate.getMonth() + 1);
              else if (view === "week") newDate.setDate(newDate.getDate() + 7);
              else newDate.setDate(newDate.getDate() + 1);
              handleNavigate(newDate);
            }
          }}
          onView={setView}
          view={view}
        />
        <div className="h-[calc(100%-60px)]">
          <Calendar
            localizer={localizer}
            events={meetings}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onNavigate={handleNavigate}
            onView={(newView) => setView(newView as typeof view)}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
            components={{
              event: EventComponent,
            }}
            popup
            views={["month", "week", "day", "agenda"]}
          />
        </div>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <MeetingModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setNewEventSlot(null);
          }}
          onSave={handleAddMeeting}
          defaultStart={newEventSlot?.start}
          defaultEnd={newEventSlot?.end}
        />
      )}

      {showEditModal && selectedMeeting && (
        <MeetingModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMeeting(null);
          }}
          onSave={(meeting) => handleUpdateMeeting(meeting as CalendarMeeting)}
          onDelete={() => {
            handleDeleteMeeting(selectedMeeting.id);
            setShowEditModal(false);
            setSelectedMeeting(null);
          }}
          meeting={selectedMeeting}
        />
      )}

      {showDetailPopup && selectedMeeting && (
        <MeetingDetailPopup
          meeting={selectedMeeting}
          onClose={() => {
            setShowDetailPopup(false);
            setSelectedMeeting(null);
          }}
          onEdit={() => {
            setShowDetailPopup(false);
            setShowEditModal(true);
          }}
          onDelete={() => {
            handleDeleteMeeting(selectedMeeting.id);
            setShowDetailPopup(false);
            setSelectedMeeting(null);
          }}
        />
      )}
    </div>
  );
};

export default MeetingsCalendarPage;
