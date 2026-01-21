import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Users,
  Phone,
  Video,
  MapPin,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Button, Input } from "../ui";

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
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof MeetingFormData, string>>
  >({});
  const [meetingLink, setMeetingLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

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
      });
      setMeetingLink("");
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  const meetingTypes = [
    {
      value: "voice_call",
      label: "Voice Call",
      icon: Phone,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      value: "site_visit",
      label: "Site Visit",
      icon: MapPin,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      value: "consultation",
      label: "Consultation",
      icon: Users,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ];

  const durations = ["15", "30", "45", "60", "90", "120"];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col transform transition-all">
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
      </div>
    </div>
  );
};
