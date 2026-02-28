import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  FileText,
  MessageSquare,
  Edit3,
  Trash2,
  Plus,
  Send,
  RefreshCw,
  Bell,
  Check,
  X,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Mic,
  Play,
  Share2,
  ChevronDown,
  Search,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import * as meetingAPI from "../../services/meetingApi";
import {
  getAllTeamMembers,
  type TeamMember,
} from "../../services/teamApi";
import type {
  Meeting,
  MeetingNote,
  Participant,
  TranscriptionSegment,
  LeadReference,
} from "../../types";
import { LeadReferencesManager } from "../../components/leads";
import { useMeetingStore } from "../../stores/meetingStore";

const statusColors: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
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
  PROCESSING: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  ANALYZED: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  COMPLETED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
};

// Participant Form Modal
const ParticipantModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
  }) => Promise<void>;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [participantType, setParticipantType] = useState<"team" | "external">(
    "team",
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] =
    useState<TeamMember | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fetch team members when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTeamLoading(true);
    getAllTeamMembers()
      .then((members) =>
        setTeamMembers(members.filter((m) => m.isActive !== false)),
      )
      .catch(console.error)
      .finally(() => setTeamLoading(false));
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const resetForm = () => {
    setParticipantType("team");
    setSelectedTeamMember(null);
    setDropdownOpen(false);
    setDropdownRect(null);
    setSearchQuery("");
    setFormData({ name: "", email: "", phone: "" });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (participantType === "team" && !selectedTeamMember) {
      newErrors.userId = "Please select a team member";
    }
    if (participantType === "external" && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (participantType === "team" && selectedTeamMember) {
      await onSubmit({ userId: selectedTeamMember.id });
    } else {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
    }
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop — covers every pixel */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ WebkitBackdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative z-[61] bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add Participant
              </h2>
              <p className="text-xs text-gray-500">Add a team member or external guest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
          {/* Type Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setParticipantType("team");
                setErrors({});
                setSelectedTeamMember(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                participantType === "team"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Team Member
            </button>
            <button
              type="button"
              onClick={() => {
                setParticipantType("external");
                setErrors({});
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                participantType === "external"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              External Participant
            </button>
          </div>

          {participantType === "team" ? (
            <div className="space-y-4">
              {/* Team Member Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Team Member *
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => {
                      if (triggerRef.current) {
                        setDropdownRect(triggerRef.current.getBoundingClientRect());
                      }
                      setDropdownOpen(!dropdownOpen);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                      errors.userId ? "border-red-300" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {selectedTeamMember ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {selectedTeamMember.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {selectedTeamMember.role || selectedTeamMember.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className={`text-sm ${teamLoading ? "text-gray-400" : "text-gray-500"}`}>
                        {teamLoading ? "Loading team members..." : "Choose a team member..."}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {dropdownOpen && dropdownRect && createPortal(
                    <div
                      style={{
                        position: "fixed",
                        top: dropdownRect.bottom + 4,
                        left: dropdownRect.left,
                        width: dropdownRect.width,
                        zIndex: 9999,
                      }}
                      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search team members..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredMembers.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No team members found
                          </p>
                        ) : (
                          filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedTeamMember(member);
                                setDropdownOpen(false);
                                setSearchQuery("");
                                setErrors({});
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 text-left transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {member.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {member.email}
                                  {member.role ? ` · ${member.role}` : ""}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
                )}
              </div>

              {/* Auto-filled info preview */}
              {selectedTeamMember && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto-filled from profile
                  </p>
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedTeamMember.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedTeamMember.phone || "—"}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                      errors.name ? "border-red-300" : "border-gray-300 hover:border-gray-400"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="participant@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+919876543210"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl py-2.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Participant
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Speaker Mapping Modal
const SpeakerMapModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (speakerMap: Record<string, string>) => Promise<void>;
  transcript?: TranscriptionSegment[];
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, transcript, isLoading }) => {
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});

  // Extract unique speakers from transcript
  const speakers = useMemo(() => {
    if (!transcript) return [];
    const uniqueSpeakers = new Set<string>();
    transcript.forEach((seg) => uniqueSpeakers.add(seg.speaker));
    return Array.from(uniqueSpeakers);
  }, [transcript]);

  useEffect(() => {
    // Initialize speaker map with existing values
    const initialMap: Record<string, string> = {};
    speakers.forEach((speaker) => {
      initialMap[speaker] = speaker;
    });
    setSpeakerMap(initialMap);
  }, [speakers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(speakerMap);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Map Speakers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Map speaker IDs to real names for better transcript readability.
          </p>

          {speakers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No speakers found in transcript
            </p>
          ) : (
            speakers.map((speaker) => (
              <div key={speaker} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-gray-600">
                  {speaker}:
                </div>
                <input
                  type="text"
                  value={speakerMap[speaker] || ""}
                  onChange={(e) =>
                    setSpeakerMap({ ...speakerMap, [speaker]: e.target.value })
                  }
                  placeholder="Enter name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || speakers.length === 0}
              className="flex-1 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Mapping
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Note Form Component
const NoteForm: React.FC<{
  onSubmit: (content: string) => Promise<void>;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <Button
        type="submit"
        disabled={isLoading || !content.trim()}
        className="rounded-xl"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Add
      </Button>
    </form>
  );
};

export const MeetingDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams<{ meetingId: string }>();
  const { setCurrentMeeting } = useMeetingStore();

  // State
  const [meeting, setMeeting] = useState<
    (Meeting & { participants?: Participant[] }) | null
  >(null);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [references, setReferences] = useState<LeadReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editing states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isPollingTranscript, setIsPollingTranscript] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      // Clear currentMeeting when leaving the page
      setCurrentMeeting(null);
    };
  }, [setCurrentMeeting]);

  // Trigger server-side regeneration to kick off transcription
  const triggerRegeneration = useCallback(async (id: string) => {
    try {
      console.log(
        "[MeetingDetails] Triggering regenerate(all) for meeting:",
        id,
      );
      const regenMeeting = await meetingAPI.regenerate(id, "all");
      console.log(
        "[MeetingDetails] Regenerate response, status:",
        regenMeeting.status,
      );

      const hasTranscript =
        (regenMeeting.transcription && regenMeeting.transcription.length > 0) ||
        (regenMeeting.transcriptText &&
          regenMeeting.transcriptText.length > 0) ||
        (regenMeeting.transcriptJson && regenMeeting.transcriptJson.length > 0);
      const hasSummary = regenMeeting.summary || regenMeeting.aiAnalysis;

      if (hasTranscript || hasSummary) {
        setMeeting(regenMeeting);
        setIsPollingTranscript(false);
        return true; // Done — data arrived immediately
      }
      return false; // Async processing — need to keep polling
    } catch (err) {
      console.warn("[MeetingDetails] Regenerate failed:", err);
      return false;
    }
  }, []);

  // Poll for transcript when meeting is completed/COMPLETED but transcript is empty
  const startTranscriptPolling = useCallback(async () => {
    if (pollTimerRef.current || !meetingId) return;

    setIsPollingTranscript(true);

    // First, trigger regeneration to tell the server to start processing
    const immediateResult = await triggerRegeneration(meetingId);
    if (immediateResult) {
      // Regenerate returned data immediately — no polling needed
      return;
    }

    let attempts = 0;
    const maxAttempts = 60; // 5 mins at 5s intervals
    let hasTriedRegenAgain = false;

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      try {
        const updatedMeeting = await meetingAPI.getMeetingById(meetingId);
        console.log(
          `[MeetingDetails] Poll attempt ${attempts} - status: ${updatedMeeting.status}`,
        );

        // Check if transcript data is now available
        const hasTranscript =
          (updatedMeeting.transcription &&
            updatedMeeting.transcription.length > 0) ||
          (updatedMeeting.transcriptText &&
            updatedMeeting.transcriptText.length > 0) ||
          (updatedMeeting.transcriptJson &&
            updatedMeeting.transcriptJson.length > 0);

        const hasSummary = updatedMeeting.summary || updatedMeeting.aiAnalysis;

        if (
          hasTranscript ||
          hasSummary ||
          updatedMeeting.status === "ANALYZED"
        ) {
          setMeeting(updatedMeeting);
          setIsPollingTranscript(false);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          console.log("[MeetingDetails] Transcript/summary received!");
        } else {
          // Update meeting anyway so status badge refreshes
          setMeeting(updatedMeeting);
        }
      } catch (err) {
        console.warn("[MeetingDetails] Poll error:", err);
      }

      // After 6 attempts (30s) with no data, try regenerate one more time
      if (attempts === 6 && !hasTriedRegenAgain) {
        hasTriedRegenAgain = true;
        console.log(
          "[MeetingDetails] Retrying regenerate after 30s of empty polls...",
        );
        triggerRegeneration(meetingId).then((done) => {
          if (done && pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        });
      }

      if (attempts >= maxAttempts) {
        setIsPollingTranscript(false);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        console.warn("[MeetingDetails] Polling timed out");
      }
    }, 5000);
  }, [meetingId, triggerRegeneration]);

  // Fetch meeting data
  useEffect(() => {
    const fetchMeetingData = async () => {
      if (!meetingId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch meeting details
        const meetingData = await meetingAPI.getMeetingById(meetingId);
        setMeeting(meetingData);
        setCurrentMeeting(meetingData); // Update store for breadcrumb

        // Extract participants from meeting data if available
        if (
          (meetingData as any).participants &&
          Array.isArray((meetingData as any).participants)
        ) {
          setParticipants((meetingData as any).participants);
        } else {
          console.log("No participants found in meeting data");
          setParticipants([]);
        }

        // Fetch notes
        try {
          const notesData = await meetingAPI.getNotes(meetingId);
          setNotes(notesData);
        } catch (e) {
          console.warn("Could not fetch notes:", e);
          setNotes([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load meeting";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingData();
  }, [meetingId]);

  // Auto-start polling when meeting is loaded and transcript is empty but meeting is done
  useEffect(() => {
    if (!meeting) return;

    const isDone =
      meeting.status === "completed" ||
      meeting.status === "COMPLETED" ||
      meeting.status === "PROCESSING";
    const hasTranscript =
      (meeting.transcription && meeting.transcription.length > 0) ||
      (meeting.transcriptText && meeting.transcriptText.length > 0) ||
      (meeting.transcriptJson && meeting.transcriptJson.length > 0);
    const hasSummary = meeting.summary || meeting.aiAnalysis;

    if (isDone && !hasTranscript && !hasSummary && !pollTimerRef.current) {
      console.log(
        "[MeetingDetails] Meeting is done but no transcript — starting poll",
      );
      startTranscriptPolling();
    }
  }, [meeting, startTranscriptPolling]);

  // Action handlers
  const handleAddParticipant = async (data: {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    contactId?: string;
  }) => {
    if (!meetingId) return;

    setActionLoading("addParticipant");
    try {
      const newParticipant = await meetingAPI.addParticipant(meetingId, data);
      setParticipants([...participants, newParticipant]);

      // Also refresh meeting data to get updated participants
      const updatedMeeting = await meetingAPI.getMeetingById(meetingId);
      setMeeting(updatedMeeting);

      // Extract participants from updated meeting data if available
      if (
        (updatedMeeting as any).participants &&
        Array.isArray((updatedMeeting as any).participants)
      ) {
        setParticipants((updatedMeeting as any).participants);
      }
    } catch (err) {
      console.error("Error adding participant:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!meetingId) return;

    setActionLoading(`removeParticipant-${participantId}`);
    try {
      await meetingAPI.removeParticipant(meetingId, participantId);
      setParticipants(participants.filter((p) => p.id !== participantId));

      // Refresh meeting data
      const updatedMeeting = await meetingAPI.getMeetingById(meetingId);
      setMeeting(updatedMeeting);

      // Extract participants from updated meeting data if available
      if (
        (updatedMeeting as any).participants &&
        Array.isArray((updatedMeeting as any).participants)
      ) {
        setParticipants((updatedMeeting as any).participants);
      }
    } catch (err) {
      console.error("Error removing participant:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNote = async (content: string) => {
    if (!meetingId) return;

    setActionLoading("addNote");
    try {
      const newNote = await meetingAPI.addNote(meetingId, {
        content,
        timestamp: Date.now() / 1000, // Current timestamp in seconds
      });
      setNotes([...notes, newNote]);
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    if (!meetingId) return;

    setActionLoading(`updateNote-${noteId}`);
    try {
      const updatedNote = await meetingAPI.updateNote(
        meetingId,
        noteId,
        content,
      );
      setNotes(notes.map((n) => (n.id === noteId ? updatedNote : n)));
      setEditingNoteId(null);
      setEditingNoteContent("");
    } catch (err) {
      console.error("Error updating note:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!meetingId) return;

    setActionLoading(`deleteNote-${noteId}`);
    try {
      await meetingAPI.deleteNote(meetingId, noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSpeakerMap = async (speakerMap: Record<string, string>) => {
    if (!meetingId) return;

    setActionLoading("speakerMap");
    try {
      const updatedMeeting = await meetingAPI.updateSpeakerMap(
        meetingId,
        speakerMap,
      );
      setMeeting(updatedMeeting);
    } catch (err) {
      console.error("Error updating speaker map:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (
    type: "summary" | "transcription" | "all",
  ) => {
    if (!meetingId) return;

    setActionLoading(`regenerate-${type}`);
    try {
      const updatedMeeting = await meetingAPI.regenerate(meetingId, type);
      setMeeting(updatedMeeting);
    } catch (err) {
      console.error("Error regenerating:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendNotifications = async () => {
    if (!meetingId) return;

    setActionLoading("notify");
    try {
      const result = await meetingAPI.sendNotifications(meetingId);
      alert(`Notifications sent to ${result.sentCount} participants`);
    } catch (err) {
      console.error("Error sending notifications:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartMeeting = () => {
    navigate("/dashboard/meeting-room", { state: { meetingId } });
  };

  const handleDeleteMeeting = async () => {
    if (!meetingId) return;

    setActionLoading("delete");
    try {
      await meetingAPI.deleteMeeting(meetingId);
      navigate("/dashboard/meetings");
    } catch (err) {
      console.error("Error deleting meeting:", err);
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(null);
    }
  };

  // Reference handlers
  const handleAddReference = (
    reference: Omit<LeadReference, "id" | "leadId" | "uploadedAt">,
  ) => {
    // TODO: Call API to add reference when backend is ready
    // For now, add to local state optimistically
    const newReference: LeadReference = {
      ...reference,
      id: `ref-${Date.now()}`,
      leadId: meeting?.leadId || "",
      uploadedAt: new Date().toISOString(),
    };

    setReferences([...references, newReference]);
    console.log("Added reference:", newReference);
    // TODO: Persist to API
  };

  const handleDeleteReference = (referenceId: string) => {
    // TODO: Call API to delete reference when backend is ready
    setReferences(references.filter((ref) => ref.id !== referenceId));
    console.log("Deleted reference:", referenceId);
    // TODO: Persist to API
  };

  // Share AI Summary via WhatsApp
  const handleShareWhatsApp = () => {
    if (!meeting?.aiAnalysis && !(meeting as any).summary) return;

    const summary = meeting.aiAnalysis?.summary || (meeting as any).summary;
    const keyPoints =
      meeting.aiAnalysis?.keyPoints || (meeting as any).keyPoints || [];
    const actionItems =
      meeting.aiAnalysis?.actionItems || (meeting as any).actionItems || [];

    let message = `*${meeting.title}* - AI Meeting Summary\n\n`;
    message += `${summary}\n\n`;

    if (keyPoints.length > 0) {
      message += `*Key Points:*\n`;
      keyPoints.forEach((point: any, idx: number) => {
        const text =
          typeof point === "string" ? point : point?.text || point?.point;
        message += `${idx + 1}. ${text}\n`;
      });
      message += `\n`;
    }

    if (actionItems.length > 0) {
      message += `*Action Items:*\n`;
      actionItems.forEach((item: any, idx: number) => {
        const text =
          typeof item === "string"
            ? item
            : item?.task || item?.text || item?.action;
        message += `✓ ${text}\n`;
      });
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Share AI Summary via Email
  const handleShareEmail = () => {
    if (!meeting?.aiAnalysis && !(meeting as any).summary) return;

    const summary = meeting.aiAnalysis?.summary || (meeting as any).summary;
    const keyPoints =
      meeting.aiAnalysis?.keyPoints || (meeting as any).keyPoints || [];
    const actionItems =
      meeting.aiAnalysis?.actionItems || (meeting as any).actionItems || [];

    const subject = `Meeting Summary: ${meeting.title}`;
    let body = `Meeting: ${meeting.title}\n`;
    body += `Date: ${scheduledDate ? new Date(scheduledDate).toLocaleDateString() : "N/A"}\n\n`;
    body += `AI SUMMARY:\n${summary}\n\n`;

    if (keyPoints.length > 0) {
      body += `KEY POINTS:\n`;
      keyPoints.forEach((point: any, idx: number) => {
        const text =
          typeof point === "string" ? point : point?.text || point?.point;
        body += `${idx + 1}. ${text}\n`;
      });
      body += `\n`;
    }

    if (actionItems.length > 0) {
      body += `ACTION ITEMS:\n`;
      actionItems.forEach((item: any) => {
        const text =
          typeof item === "string"
            ? item
            : item?.task || item?.text || item?.action;
        body += `✓ ${text}\n`;
      });
    }

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-12 rounded-xl text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading meeting details...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !meeting) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6 rounded-xl border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Error loading meeting
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error || "Meeting not found"}
              </p>
              <Button
                onClick={() => navigate("/dashboard/meetings")}
                variant="secondary"
                className="mt-3 rounded-lg"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Meetings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const statusColor = statusColors[meeting.status] || statusColors.scheduled;
  const scheduledDate = meeting.scheduledAt || meeting.scheduledDate;
  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No date set";
  const formattedTime = scheduledDate
    ? new Date(scheduledDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

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
              {meeting.title}
            </h1>
            <p className="text-gray-600 mt-1">
              {meeting.description || "No description"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`${statusColor.bg} ${statusColor.text} border ${statusColor.border} rounded-lg px-3 py-1`}
          >
            <div className={`w-2 h-2 rounded-full ${statusColor.dot} mr-2`} />
            {meeting.status}
          </Badge>
          {(meeting.status === "scheduled" ||
            meeting.status === "in_progress") && (
            <Button onClick={handleStartMeeting} className="rounded-xl">
              <Play className="w-4 h-4" />
              {meeting.status === "in_progress"
                ? "Rejoin Meeting"
                : "Start Meeting"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Meeting Info & Actions */}
        <div className="lg:col-span-1 space-y-6 sticky top-6">
          {/* Meeting Details Card */}
          <Card className="p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Meeting Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {formattedTime} ({meeting.duration || 30} mins)
                  </p>
                </div>
              </div>
              {meeting.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {meeting.location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Participants Card */}
          <Card className="p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Participants
              </h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowParticipantModal(true)}
                className="rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {participants && participants.length > 0 ? (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {participant.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {participant.email}
                        </p>
                        {participant.phone && (
                          <p className="text-xs text-gray-500">
                            {participant.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(participant.id)}
                      disabled={
                        actionLoading === `removeParticipant-${participant.id}`
                      }
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ===
                      `removeParticipant-${participant.id}` ? (
                        <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No participants added
                </p>
              )}
            </div>
          </Card>

          {/* References & Inspirations Card */}
          {meeting?.leadId && (
            <Card className="p-6 rounded-xl">
              <LeadReferencesManager
                leadId={meeting.leadId}
                references={references}
                onAddReference={handleAddReference}
                onDeleteReference={handleDeleteReference}
              />
            </Card>
          )}

          {/* Actions Card - Removed */}
        </div>

        {/* Right Column - Notes & Transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary Card */}
          {(meeting.aiAnalysis || (meeting as any).summary) && (
            <Card className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  AI Summary
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    title="Share via WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                    title="Share via Email"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                {meeting.aiAnalysis?.summary || (meeting as any).summary}
              </p>

              {(
                meeting.aiAnalysis?.keyPoints ||
                (meeting as any).keyPoints ||
                []
              ).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Key Points
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(
                      meeting.aiAnalysis?.keyPoints ||
                      (meeting as any).keyPoints ||
                      []
                    ).map((point: any, idx: number) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {typeof point === "string"
                          ? point
                          : point?.text ||
                            point?.point ||
                            JSON.stringify(point)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(
                meeting.aiAnalysis?.actionItems ||
                (meeting as any).actionItems ||
                []
              ).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {(
                      meeting.aiAnalysis?.actionItems ||
                      (meeting as any).actionItems ||
                      []
                    ).map((item: any, idx: number) => {
                      const text =
                        typeof item === "string"
                          ? item
                          : item?.task ||
                            item?.text ||
                            item?.action ||
                            JSON.stringify(item);
                      const assignee =
                        typeof item === "object" && item?.assignee
                          ? item.assignee
                          : null;
                      const dueDate =
                        typeof item === "object" && item?.dueDate
                          ? item.dueDate
                          : null;
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-600">
                              {text}
                            </span>
                            {(assignee || dueDate) && (
                              <div className="flex items-center gap-3 mt-1">
                                {assignee && (
                                  <span className="text-xs text-gray-400">
                                    Assignee: {assignee}
                                  </span>
                                )}
                                {dueDate && (
                                  <span className="text-xs text-gray-400">
                                    Due: {dueDate}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Discussion Points Card */}
          {(meeting as any).discussionPoints &&
            (meeting as any).discussionPoints.length > 0 && (
              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Discussion Points
                </h2>
                <div className="space-y-2">
                  {(
                    (meeting as any).discussionPoints as Array<{
                      key: string;
                      label: string;
                      checked: boolean;
                      notes?: string;
                    }>
                  ).map((point) => (
                    <div
                      key={point.key}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        point.checked
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center ${
                          point.checked
                            ? "bg-emerald-500"
                            : "border-2 border-gray-300"
                        }`}
                      >
                        {point.checked && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${point.checked ? "text-gray-500 line-through" : "text-gray-700"}`}
                        >
                          {point.label}
                        </p>
                        {point.notes && (
                          <p className="text-xs text-gray-400 mt-1">
                            {point.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Notes Card */}
          <Card className="p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Meeting Notes
            </h2>

            <NoteForm
              onSubmit={handleAddNote}
              isLoading={actionLoading === "addNote"}
            />

            <div className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No notes yet. Add your first note above.
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-50 rounded-lg group"
                  >
                    {editingNoteId === note.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingNoteContent}
                          onChange={(e) =>
                            setEditingNoteContent(e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateNote(note.id, editingNoteContent)
                          }
                          disabled={actionLoading === `updateNote-${note.id}`}
                          className="rounded-lg"
                        >
                          {actionLoading === `updateNote-${note.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteContent("");
                          }}
                          className="rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={
                                actionLoading === `deleteNote-${note.id}`
                              }
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              {actionLoading === `deleteNote-${note.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Transcript Card */}
          <Card className="p-6 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Transcript
              {isPollingTranscript && (
                <span className="flex items-center gap-1.5 text-sm font-normal text-yellow-600 ml-auto">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing transcript...
                </span>
              )}
            </h2>

            {meeting.transcription && meeting.transcription.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {meeting.transcription.map((segment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {segment.speaker.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-600">
                          {segment.speaker}
                        </span>
                        <span className="text-xs text-gray-400">
                          {Math.floor(segment.timestamp / 60)}:
                          {String(Math.floor(segment.timestamp % 60)).padStart(
                            2,
                            "0",
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {segment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (meeting as any).transcriptText &&
              (meeting as any).transcriptText.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {(meeting as any).transcriptText}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  {isPollingTranscript
                    ? "Transcript is being processed..."
                    : "No transcript available"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isPollingTranscript
                    ? "This may take a few minutes. The page will update automatically."
                    : "Start a meeting and enable transcription to generate a transcript"}
                </p>
                {!isPollingTranscript &&
                  (meeting.status === "completed" ||
                    meeting.status === "COMPLETED") && (
                    <div className="flex gap-2 mt-4 justify-center">
                      <Button
                        variant="secondary"
                        onClick={startTranscriptPolling}
                        className="rounded-lg"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Check for transcript
                      </Button>
                      <Button
                        variant="primary"
                        onClick={async () => {
                          setIsPollingTranscript(true);
                          const done = await triggerRegeneration(meetingId!);
                          if (!done) {
                            // Start polling after regenerate
                            startTranscriptPolling();
                          }
                        }}
                        className="rounded-lg"
                        size="sm"
                      >
                        <Mic className="w-4 h-4" />
                        Regenerate Transcript
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ParticipantModal
        isOpen={showParticipantModal}
        onClose={() => setShowParticipantModal(false)}
        onSubmit={handleAddParticipant}
        isLoading={actionLoading === "addParticipant"}
      />

      <SpeakerMapModal
        isOpen={showSpeakerModal}
        onClose={() => setShowSpeakerModal(false)}
        onSubmit={handleUpdateSpeakerMap}
        transcript={meeting.transcription}
        isLoading={actionLoading === "speakerMap"}
      />
    </div>
  );
};

export default MeetingDetailsPage;
