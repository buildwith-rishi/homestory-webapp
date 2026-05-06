import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  MessageSquare,
  Edit3,
  Trash2,
  Plus,
  Send,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Mic,
  Play,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  SectionLoader,
} from "../../components/ui";
import * as meetingAPI from "../../services/meetingApi";
import { adminAPI } from "../../services/api";
import { getLeadById } from "../../services/leadApi";
import { getProjectById } from "../../services/projectApi";
import { sendEmail } from "../../services/emailSendApi";
import type {
  Meeting,
  MeetingNote,
  Participant,
  TranscriptionSegment,
  LeadReference,
  AdminUser,
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

const APPROVED_MEETING_ROLE_OPTIONS = [
  "Accounts / Finance",
  "Admin",
  "Business Development Representative",
  "Designer",
  "Human Resources",
  "Lead Designer",
  "Lead Project Manager",
  "Project Manager",
  "Site Engineer",
  "Super Admin",
] as const;

const normalizeRoleKey = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const APPROVED_ROLE_ALIASES: Record<string, (typeof APPROVED_MEETING_ROLE_OPTIONS)[number]> = {
  ACCOUNTS: "Accounts / Finance",
  ACCOUNTS_FINANCE: "Accounts / Finance",
  FINANCE: "Accounts / Finance",
  ADMIN: "Admin",
  BDR: "Business Development Representative",
  BUSINESS_DEVELOPMENT_REPRESENTATIVE: "Business Development Representative",
  DESIGNER: "Designer",
  HR: "Human Resources",
  HUMAN_RESOURCES: "Human Resources",
  LEAD_DESIGNER: "Lead Designer",
  DESIGN_HEAD: "Lead Designer",
  LEAD_PROJECT_MANAGER: "Lead Project Manager",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  SUPER_ADMIN: "Super Admin",
};

const toApprovedRoleLabel = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const key = normalizeRoleKey(value);
  if (!key) return null;
  return APPROVED_ROLE_ALIASES[key] || null;
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
  // Team member state from User Management
  const [teamMembers, setTeamMembers] = useState<AdminUser[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // External participant state
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getUserRoleLabel = useCallback(
    (user: AdminUser): string | null =>
      toApprovedRoleLabel(user.roleTitle) || toApprovedRoleLabel(user.role),
    [],
  );

  const normalizeUsersResponse = useCallback((response: unknown): AdminUser[] => {
    let usersList: Array<Record<string, unknown>> = [];

    if (Array.isArray(response)) {
      usersList = response as Array<Record<string, unknown>>;
    } else if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.users)) {
        usersList = obj.users as Array<Record<string, unknown>>;
      } else if (Array.isArray(obj.data)) {
        usersList = obj.data as Array<Record<string, unknown>>;
      } else if (
        obj.data &&
        typeof obj.data === "object" &&
        Array.isArray((obj.data as Record<string, unknown>).users)
      ) {
        usersList = (obj.data as Record<string, unknown>).users as Array<
          Record<string, unknown>
        >;
      }
    }

    return usersList
      .filter((user) => user && user.id)
      .map((user) => {
        const roleFromApi =
          user.role ||
          (user.credential as { roleKey?: string; name?: string } | undefined)
            ?.roleKey ||
          (user.credential as { roleKey?: string; name?: string } | undefined)
            ?.name ||
          "BDR";

        const roleTitleFromApi =
          (user.roleTitle as string | undefined) ||
          (user.userRoleTitle as string | undefined) ||
          (user.title as string | undefined);

        return {
          ...user,
          id: String(user.id),
          name: String(user.name || ""),
          email: String(user.email || ""),
          role: String(roleFromApi).toUpperCase() as AdminUser["role"],
          roleTitle: roleTitleFromApi,
          phone: user.phone ? String(user.phone) : undefined,
          isActive: user.isActive !== false,
          isBanned: user.isBanned === true,
          createdAt: String(user.createdAt || ""),
          updatedAt: String(user.updatedAt || ""),
        } as AdminUser;
      })
      .filter((user) => user.isActive !== false && !user.isBanned)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, []);

  // Fetch role + users from User Management when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTeamLoading(true);
    adminAPI
      .getAllUsers()
      .then((usersResponse) => {
        const users = normalizeUsersResponse(usersResponse);
        setTeamMembers(users);
        setRoleOptions([...APPROVED_MEETING_ROLE_OPTIONS]);
      })
      .catch(console.error)
      .finally(() => setTeamLoading(false));
  }, [isOpen, normalizeUsersResponse]);

  const roleUsers = useMemo(() => {
    if (!selectedRole) return [];
    return teamMembers.filter(
      (user) => getUserRoleLabel(user) === selectedRole,
    );
  }, [getUserRoleLabel, selectedRole, teamMembers]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return roleUsers;
    return roleUsers.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query),
    );
  }, [roleUsers, searchQuery]);

  const selectedTeamMember = useMemo(
    () => teamMembers.find((member) => member.id === selectedUserId) || null,
    [selectedUserId, teamMembers],
  );

  const resetForm = () => {
    setParticipantType("team");
    setSelectedRole("");
    setSelectedUserId("");
    setSearchQuery("");
    setFormData({ name: "", email: "", phone: "" });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (participantType === "team" && !selectedUserId) {
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
    if (participantType === "team" && selectedUserId) {
      await onSubmit({ userId: selectedUserId });
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

  const tabs: { key: "team" | "external"; label: string }[] = [
    { key: "team", label: "Team Member" },
    { key: "external", label: "External" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop — covers every pixel */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ WebkitBackdropFilter: "blur(4px)" }}
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
                Add to Meeting
              </h2>
              <p className="text-xs text-gray-500">
                Link a team member or external guest
              </p>
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 p-6 space-y-5 overflow-y-auto"
        >
          {/* Type Toggle — 4 tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setParticipantType(tab.key);
                  setErrors({});
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  participantType === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Team Member ── */}
          {participantType === "team" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Role *
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setSelectedUserId("");
                      setSearchQuery("");
                      setErrors({});
                    }}
                    className={`w-full appearance-none px-4 py-3 border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                      errors.userId
                        ? "border-red-300"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <option value="">
                      {teamLoading ? "Loading roles..." : "Choose a role..."}
                    </option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Team Member *
                </label>
                <div className="relative">
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setErrors({});
                    }}
                    disabled={!selectedRole || teamLoading}
                    className={`w-full appearance-none px-4 py-3 border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                      errors.userId
                        ? "border-red-300"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <option value="">
                      {!selectedRole
                        ? "Select role first"
                        : teamLoading
                          ? "Loading team members..."
                          : "Choose a team member..."}
                    </option>
                    {filteredMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                        {member.email ? ` (${member.email})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {selectedRole && (
                  <div className="mt-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users in selected role..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                )}
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
          )}

          {/* ── External ── */}
          {participantType === "external" && (
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
                      errors.name
                        ? "border-red-300"
                        : "border-gray-300 hover:border-gray-400"
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
  const location = useLocation();
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
  const [resolvedEntityName, setResolvedEntityName] = useState("");

  // Modal states
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);

  // Edit AI Summary states
  const [showEditSummaryModal, setShowEditSummaryModal] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  // Manual refresh state
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Email compose modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

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

  // Fetch meeting data — extracted to a reusable callback for manual refresh
  const fetchMeetingData = useCallback(
    async (showFullLoader = false) => {
      if (!meetingId) return;

      if (showFullLoader) setIsLoading(true);
      setError(null);

      try {
        const meetingData = await meetingAPI.getMeetingById(meetingId);
        setMeeting(meetingData);
        setCurrentMeeting(meetingData);

        if (
          (meetingData as any).participants &&
          Array.isArray((meetingData as any).participants)
        ) {
          setParticipants((meetingData as any).participants);
        } else {
          setParticipants([]);
        }

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
        if (showFullLoader) setIsLoading(false);
      }
    },
    [meetingId, setCurrentMeeting],
  );

  // Initial load
  useEffect(() => {
    fetchMeetingData(true);
  }, [fetchMeetingData]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    if (isManualRefreshing || isPollingTranscript) return;
    setIsManualRefreshing(true);
    try {
      await fetchMeetingData(false);
      // If meeting is completed but still no transcript, kick off auto-polling
      setMeeting((prev) => {
        if (!prev) return prev;
        const isDone =
          prev.status === "completed" ||
          prev.status === "COMPLETED" ||
          prev.status === "PROCESSING";
        const hasTranscript =
          (prev.transcription && prev.transcription.length > 0) ||
          (prev.transcriptText && prev.transcriptText.length > 0) ||
          (prev.transcriptJson && prev.transcriptJson.length > 0);
        const hasSummary = prev.summary || prev.aiAnalysis;
        if (isDone && !hasTranscript && !hasSummary) {
          startTranscriptPolling();
        }
        return prev;
      });
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    isManualRefreshing,
    isPollingTranscript,
    fetchMeetingData,
    startTranscriptPolling,
  ]);

  // Poll immediately if navigating from MeetingRoom (justEnded)
  useEffect(() => {
    const justEnded = (location.state as any)?.justEnded;
    if (justEnded && meetingId && !pollTimerRef.current) {
      console.log("[MeetingDetails] Just ended — forcing immediate poll");
      startTranscriptPolling();
      // Clear location state so we don't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    meetingId,
    startTranscriptPolling,
    navigate,
    location.pathname,
  ]);

  // Auto-start polling when meeting is loaded and transcript is empty but meeting is done
  useEffect(() => {
    if (!meeting) return;

    const isDone =
      meeting.status === "completed" ||
      meeting.status === "COMPLETED" ||
      meeting.status === "PROCESSING";
    const hasTranscript =
      (meeting.transcription && meeting.transcription.length > 0) ||
      ((meeting as any).transcriptText &&
        (meeting as any).transcriptText.length > 0) ||
      ((meeting as any).transcriptJson &&
        (meeting as any).transcriptJson.length > 0);
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

      // Refresh meeting data
      const updatedMeeting = await meetingAPI.getMeetingById(meetingId);
      setMeeting(updatedMeeting);
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
      setNotes((prev) => [...prev, newNote]);

      // Refresh meeting section once after note add so all dependent widgets stay in sync.
      await fetchMeetingData(false);
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

  const handleStartMeeting = () => {
    navigate("/dashboard/meeting-room", { state: { meetingId } });
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

  // Share AI Summary via Email — opens compose modal
  const resolveDefaultRecipientEmail = useCallback(
    async (currentMeeting: Meeting & { participants?: Participant[] }) => {
      const m = currentMeeting as any;
      const directEmail = [
        m.lead?.email,
        m.project?.account?.email,
        m.project?.lead?.email,
        m.customer?.email,
        m.entity?.email,
        ...(Array.isArray(m.participants)
          ? m.participants
              .map((p: any) => p?.email)
              .filter((email: unknown): email is string =>
                typeof email === "string" && email.trim().length > 0,
              )
          : []),
      ].find(
        (email): email is string =>
          typeof email === "string" && email.trim().length > 0,
      );

      if (directEmail) return directEmail;

      const leadId =
        currentMeeting.leadId ||
        (currentMeeting.entityType === "LEAD" ? currentMeeting.entityId : "");
      if (leadId) {
        try {
          const lead = await getLeadById(leadId);
          if (lead?.email) return lead.email;
        } catch (error) {
          console.warn("Failed to resolve lead email for compose modal:", error);
        }
      }

      const projectId =
        currentMeeting.projectId ||
        (currentMeeting.entityType === "PROJECT"
          ? currentMeeting.entityId
          : "");
      if (projectId) {
        try {
          const project = await getProjectById(projectId);
          if (project?.account?.email) return project.account.email;
          if (project?.lead?.email) return project.lead.email;

          if (project?.leadId) {
            const projectLead = await getLeadById(project.leadId);
            if (projectLead?.email) return projectLead.email;
          }
        } catch (error) {
          console.warn(
            "Failed to resolve project email for compose modal:",
            error,
          );
        }
      }

      return "";
    },
    [],
  );

  const handleShareEmail = async () => {
    const currentMeeting = meeting;
    if (!currentMeeting) return;
    if (!currentMeeting.aiAnalysis && !(currentMeeting as any).summary) return;

    const autoRecipientEmail = await resolveDefaultRecipientEmail(currentMeeting);

    const summary =
      currentMeeting.aiAnalysis?.summary || (currentMeeting as any).summary;
    const keyPoints =
      currentMeeting.aiAnalysis?.keyPoints ||
      (currentMeeting as any).keyPoints ||
      [];
    const actionItems =
      currentMeeting.aiAnalysis?.actionItems ||
      (currentMeeting as any).actionItems ||
      [];

    const subjectLine = `Meeting Summary: ${currentMeeting.title}`;

    let body = `<p><strong>Meeting:</strong> ${currentMeeting.title}</p>`;
    body += `<p><strong>Date:</strong> ${scheduledDate ? new Date(scheduledDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "N/A"}</p>`;
    body += `<br/>`;
    body += `<h3 style="margin-bottom:6px;">AI Summary</h3>`;
    body += `<p>${summary}</p>`;

    if (keyPoints.length > 0) {
      body += `<br/><h3 style="margin-bottom:6px;">Key Points</h3><ul>`;
      keyPoints.forEach((point: any) => {
        const text =
          typeof point === "string" ? point : point?.text || point?.point;
        body += `<li>${text}</li>`;
      });
      body += `</ul>`;
    }

    if (actionItems.length > 0) {
      body += `<br/><h3 style="margin-bottom:6px;">Action Items</h3><ul>`;
      actionItems.forEach((item: any) => {
        const text =
          typeof item === "string"
            ? item
            : item?.task || item?.text || item?.action;
        body += `<li>✓ ${text}</li>`;
      });
      body += `</ul>`;
    }

    setEmailTo(autoRecipientEmail || "");
    setEmailSubject(subjectLine);
    setEmailBody(body);
    setEmailSentSuccess(false);
    setEmailSendError(null);
    setShowEmailModal(true);
  };

  // Open edit summary modal
  const handleOpenEditSummary = () => {
    const currentSummary =
      meeting?.aiAnalysis?.summary || (meeting as any)?.summary || "";
    setEditedSummaryText(currentSummary);
    setShowEditSummaryModal(true);
  };

  // Save edited summary
  const handleSaveSummary = async () => {
    if (!meeting) return;
    setIsSavingSummary(true);
    try {
      // Optimistic local update
      setMeeting((prev) => {
        if (!prev) return prev;
        if (prev.aiAnalysis) {
          return {
            ...prev,
            aiAnalysis: { ...prev.aiAnalysis, summary: editedSummaryText },
          };
        }
        return { ...prev, summary: editedSummaryText } as any;
      });
      setShowEditSummaryModal(false);
    } finally {
      setIsSavingSummary(false);
    }
  };

  useEffect(() => {
    if (!meeting) {
      setResolvedEntityName("");
      return;
    }

    const fallbackFromTitle = meeting.title?.includes(" - ")
      ? meeting.title.split(" - ").slice(1).join(" - ").trim()
      : "";

    const directName =
      (meeting as Meeting & {
        lead?: { name?: string | null };
        project?: { projectName?: string | null; name?: string | null };
      }).lead?.name ||
      (meeting as Meeting & {
        lead?: { name?: string | null };
        project?: { projectName?: string | null; name?: string | null };
      }).project?.projectName ||
      (meeting as Meeting & {
        lead?: { name?: string | null };
        project?: { projectName?: string | null; name?: string | null };
      }).project?.name ||
      fallbackFromTitle;

    setResolvedEntityName(directName || "");

    const leadId =
      meeting.leadId || (meeting.entityType === "LEAD" ? meeting.entityId : "");
    const projectId =
      meeting.projectId ||
      (meeting.entityType === "PROJECT" ? meeting.entityId : "");

    if (directName || (!leadId && !projectId)) return;

    let cancelled = false;

    const resolveName = async () => {
      try {
        if (leadId) {
          const lead = await getLeadById(leadId);
          const leadName = lead?.name || "";
          if (!cancelled && leadName) {
            setResolvedEntityName(leadName);
          }
          return;
        }

        if (projectId) {
          const project = await getProjectById(projectId);
          const projectName = project?.projectName || project?.name || "";
          if (!cancelled && projectName) {
            setResolvedEntityName(projectName);
          }
        }
      } catch (resolveError) {
        console.warn(
          "Failed to resolve linked entity name for meeting details:",
          resolveError,
        );
      }
    };

    void resolveName();

    return () => {
      cancelled = true;
    };
  }, [meeting]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="rounded-xl">
          <SectionLoader message="Loading meeting details..." />
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

  // Resolve linked entity (Lead or Project) for the header chip
  const entityLabel = (() => {
    const m = meeting as Meeting & {
      lead?: { name?: string | null };
      project?: { projectName?: string | null; name?: string | null };
    };
    const nameFromTitle = resolvedEntityName || undefined;
    if (meeting.leadId) {
      return {
        type: "Lead" as const,
        name: m.lead?.name || nameFromTitle,
        id: meeting.leadId,
      };
    }
    if (meeting.projectId) {
      return {
        type: "Project" as const,
        name: m.project?.projectName || m.project?.name || nameFromTitle,
        id: meeting.projectId,
      };
    }
    if (meeting.entityType === "LEAD" && meeting.entityId) {
      return {
        type: "Lead" as const,
        name: m.lead?.name || nameFromTitle,
        id: meeting.entityId,
      };
    }
    if (meeting.entityType === "PROJECT" && meeting.entityId) {
      return {
        type: "Project" as const,
        name: m.project?.projectName || m.project?.name || nameFromTitle,
        id: meeting.entityId,
      };
    }
    return null;
  })();
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
            {entityLabel && (
              <div className="mt-2">
                <button
                  onClick={() =>
                    navigate(
                      entityLabel.type === "Lead"
                        ? `/dashboard/leads/${entityLabel.id}`
                        : `/dashboard/projects/${entityLabel.id}`,
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors hover:opacity-80 ${
                    entityLabel.type === "Lead"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <User className="w-3 h-3" />
                  {entityLabel.type}
                  {entityLabel.name ? ` · ${entityLabel.name}` : ""}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh indicator */}
          {isPollingTranscript && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Auto-refreshing…
            </div>
          )}
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || isPollingTranscript}
            title="Refresh meeting data"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isManualRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
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

      {/* Auto-refresh banner — shown when transcription is still being processed */}
      {isPollingTranscript && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Processing your meeting transcription…
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              This page will automatically update once your transcription and AI
              summary are ready. Usually takes 1–3 minutes.
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isManualRefreshing ? "animate-spin" : ""}`}
            />
            Refresh now
          </button>
        </div>
      )}

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
                        {(participant.name || participant.email || "?")
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
                    onClick={handleOpenEditSummary}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                    title="Edit AI Summary"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
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

      {/* Edit AI Summary Modal */}
      {showEditSummaryModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEditSummaryModal(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit AI Summary
                  </h2>
                </div>
                <button
                  onClick={() => setShowEditSummaryModal(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Text
                </label>
                <textarea
                  value={editedSummaryText}
                  onChange={(e) => setEditedSummaryText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all leading-relaxed"
                  placeholder="Enter AI summary..."
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  {editedSummaryText.length} characters
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowEditSummaryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSummary}
                  disabled={isSavingSummary || !editedSummaryText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isSavingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Email Compose Modal */}
      {showEmailModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!isSendingEmail) setShowEmailModal(false);
              }}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Compose Email
                  </h2>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  disabled={isSendingEmail}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto">
                {/* To */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500 w-16 flex-shrink-0">
                    To
                  </span>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 text-sm text-gray-800 bg-transparent focus:outline-none placeholder-gray-400"
                  />
                </div>

                {/* Subject */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500 w-16 flex-shrink-0">
                    Subject
                  </span>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    className="flex-1 text-sm text-gray-800 bg-transparent focus:outline-none placeholder-gray-400"
                  />
                </div>

                {/* Rich-text body */}
                <div className="px-6 pt-4 pb-2">
                  {/* Mini toolbar */}
                  <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-100">
                    {[
                      { label: "B", cmd: "bold", title: "Bold" },
                      { label: "I", cmd: "italic", title: "Italic" },
                      { label: "U", cmd: "underline", title: "Underline" },
                    ].map(({ label, cmd, title }) => (
                      <button
                        key={cmd}
                        type="button"
                        title={title}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          document.execCommand(cmd, false);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-xs font-semibold rounded hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-gray-200 mx-1" />
                    {[
                      { label: "H1", cmd: "formatBlock", val: "H1" },
                      { label: "H2", cmd: "formatBlock", val: "H2" },
                    ].map(({ label, cmd, val }) => (
                      <button
                        key={val}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          document.execCommand(cmd, false, val);
                        }}
                        className="px-2 h-7 flex items-center justify-center text-xs font-semibold rounded hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      title="Bullet List"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        document.execCommand("insertUnorderedList", false);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      •≡
                    </button>
                    <button
                      type="button"
                      title="Numbered List"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        document.execCommand("insertOrderedList", false);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      1≡
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      title="Clear Formatting"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        document.execCommand("removeFormat", false);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      Tx
                    </button>
                  </div>

                  {/* Editable body */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: emailBody }}
                    onInput={(e) =>
                      setEmailBody(
                        (e.currentTarget as HTMLDivElement).innerHTML,
                      )
                    }
                    className="min-h-[280px] text-sm text-gray-800 focus:outline-none leading-relaxed [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                {emailSentSuccess ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <Check className="w-4 h-4" />
                    Email sent successfully!
                  </span>
                ) : emailSendError ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {emailSendError}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    Fill in the recipient and send.
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    disabled={isSendingEmail}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={async () => {
                      if (!emailTo.trim()) return;
                      setIsSendingEmail(true);
                      setEmailSendError(null);
                      try {
                        await sendEmail({
                          to: emailTo.trim(),
                          subject: emailSubject.trim(),
                          htmlBody: emailBody,
                          emailType: "MEETING_SUMMARY",
                        });
                        setEmailSentSuccess(true);
                        setTimeout(() => setShowEmailModal(false), 1800);
                      } catch (err: unknown) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "Failed to send email. Please try again.";
                        setEmailSendError(msg);
                      } finally {
                        setIsSendingEmail(false);
                      }
                    }}
                    disabled={isSendingEmail || !emailTo.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default MeetingDetailsPage;
