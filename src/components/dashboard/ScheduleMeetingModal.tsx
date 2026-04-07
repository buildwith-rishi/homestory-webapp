import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  Copy,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import { Button, Input } from "../ui";
import { getAllTeamMembers, TeamMember } from "../../services/teamApi";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meeting: MeetingFormData) => void;
}

export interface MeetingFormData {
  title: string;
  client: string;
  date: string;
  time: string;
  duration: string;
  type: "voice_call" | "video_call" | "site_visit" | "consultation";
  location?: string;
  meetingLink?: string;
  notes?: string;
  attendees?: string[];
  teamMemberIds: string[];
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<MeetingFormData>({
    title: "",
    client: "",
    date: "",
    time: "",
    duration: "30",
    type: "voice_call",
    location: "",
    notes: "",
    attendees: [],
    teamMemberIds: [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof MeetingFormData, string>>
  >({});
  const [meetingLink, setMeetingLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Team member dropdown state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch team members when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTeamMembersLoading(true);
    getAllTeamMembers()
      .then((members) => {
        const normalized = [...members].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setTeamMembers(normalized);
      })
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamMembersLoading(false));
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateMeetingLink = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    const link = `https://meet.goodhomestory.com/${randomId}`;
    setMeetingLink(link);
    setFormData((prev) => ({ ...prev, meetingLink: link }));
  };

  const copyToClipboard = async () => {
    if (meetingLink) {
      await navigator.clipboard.writeText(meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleChange = (
    field: keyof MeetingFormData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleTeamMember = (memberId: string) => {
    const current = formData.teamMemberIds;
    const updated = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    setFormData((prev) => ({ ...prev, teamMemberIds: updated }));
  };

  const removeMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.filter((id) => id !== memberId),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MeetingFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = "Meeting title is required";
    if (!formData.client.trim()) newErrors.client = "Client name is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.duration) newErrors.duration = "Duration is required";

    if (formData.type === "site_visit" && !formData.location?.trim()) {
      newErrors.location = "Location is required for site visits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        title: "",
        client: "",
        date: "",
        time: "",
        duration: "30",
        type: "voice_call",
        location: "",
        notes: "",
        attendees: [],
        teamMemberIds: [],
      });
      setMeetingLink("");
      setErrors({});
      setMemberSearch("");
      setDropdownOpen(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const meetingTypes = [
    
    {
      value: "site_visit",
      label: "Site Visit",
      icon: MapPin,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    
  ];

  const durations = ["15", "30", "45", "60", "90", "120"];

  const filteredMembers = teamMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.role || "").toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q)
    );
  });

  const selectedMembers = teamMembers.filter((m) =>
    formData.teamMemberIds.includes(m.id),
  );

  const modalContent = (
    <>
      {/* Backdrop - covers entire viewport */}
      <div
        onClick={onClose}
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

      {/* Modal Container */}
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
          overflow: "auto",
        }}
      >
        <div
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col transform transition-all"
          style={{ pointerEvents: "auto" }}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Schedule Meeting
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Create a new meeting with your client
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="overflow-y-scroll flex-1 p-6 space-y-6 force-scrollbar">
              {/* Meeting Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Meeting Title *
                  </div>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Initial Design Consultation"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Client Name *
                  </div>
                </label>
                <Input
                  value={formData.client}
                  onChange={(e) => handleChange("client", e.target.value)}
                  placeholder="e.g., Rajesh Kumar"
                  className={errors.client ? "border-red-500" : ""}
                />
                {errors.client && (
                  <p className="text-red-500 text-xs mt-1">{errors.client}</p>
                )}
              </div>

              {/* Team Members */}
              <div ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Members (Optional)
                  </div>
                </label>

                {/* Selected member chips */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg font-medium"
                      >
                        {m.name}
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="hover:text-orange-900 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-orange-400 hover:bg-orange-50/30 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <span className="text-gray-500">
                    {teamMembersLoading
                      ? "Loading team members..."
                      : "Select team members..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="mt-1 border border-gray-200 rounded-xl shadow-lg bg-white z-10 relative overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search by name or role..."
                          className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Member list */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No team members found
                        </p>
                      ) : (
                        filteredMembers.map((member) => {
                          const isSelected = formData.teamMemberIds.includes(
                            member.id,
                          );
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => toggleTeamMember(member.id)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors ${
                                isSelected ? "bg-orange-50" : ""
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {member.role}
                                  {member.department
                                    ? ` · ${member.department}`
                                    : ""}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Meeting Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {meetingTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          handleChange("type", type.value);
                          if (
                            type.value === "voice_call" ||
                            type.value === "video_call"
                          ) {
                            generateMeetingLink();
                          } else {
                            setMeetingLink("");
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg ${type.bg} flex items-center justify-center mx-auto mb-2`}
                        >
                          <Icon className={`w-5 h-5 ${type.color}`} />
                        </div>
                        <p
                          className={`text-sm font-medium ${isSelected ? "text-orange-600" : "text-gray-700"}`}
                        >
                          {type.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meeting Link - Show for voice/video calls */}
              {(formData.type === "voice_call" ||
                formData.type === "video_call") &&
                meetingLink && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={meetingLink}
                        readOnly
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-600"
                      />
                      <Button
                        type="button"
                        onClick={copyToClipboard}
                        variant="secondary"
                        className="flex-shrink-0"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.type === "voice_call"
                        ? "🎙️ Voice-only meeting link"
                        : "📹 Video meeting link"}{" "}
                      - Share this with your client
                    </p>
                  </div>
                )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date *
                    </div>
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className={errors.date ? "border-red-500" : ""}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time *
                    </div>
                  </label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange("time", e.target.value)}
                    className={errors.time ? "border-red-500" : ""}
                  />
                  {errors.time && (
                    <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <div className="flex gap-2">
                  {durations.map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => handleChange("duration", duration)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.duration === duration
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location - Show for site visits */}
              {formData.type === "site_visit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </div>
                  </label>
                  <Input
                    value={formData.location || ""}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g., HSR Layout, Sector 2, Bangalore"
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Notes (Optional)
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Add any additional notes or agenda items..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Calendar className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
