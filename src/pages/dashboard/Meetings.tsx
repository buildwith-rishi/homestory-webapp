import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Loader2,
  AlertCircle,
  Plus,
  ExternalLink,
  Trash2,
  Briefcase,
  UserCircle,
  User,
  Upload,
  Eye,
  Download,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  SectionLoader,
  Spinner,
  Modal,
} from "../../components/ui";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { useMeetingStore } from "../../stores/meetingStore";
import {
  ScheduleMeetingModal,
  MeetingFormData,
} from "../../components/dashboard/ScheduleMeetingModal";
import { listLeads } from "../../services/leadApi";
import { listProjects } from "../../services/projectApi";
import * as meetingAPI from "../../services/meetingApi";
import {
  uploadAttachment,
  listAttachments,
  getAttachment,
  type Attachment,
} from "../../services/attachmentApi";
import { adminAPI } from "../../services/api";
import type { Lead, Project, AdminUser } from "../../types";
import toast from "react-hot-toast";

type MeetingDisplayStatus =
  | "scheduled"
  | "completed"
  | "in_progress"
  | "cancelled";
type MeetingDisplayType =
  | "site_visit"
  | "consultation"
  | "design_review"
  | "virtual";

interface MeetingDisplay {
  id: number | string;
  projectId?: string;
  leadId?: string;
  customerId?: string;
  linkedEntityType?: "Lead" | "Project" | "Customer";
  linkedEntityName?: string;
  title: string;
  client?: string;
  date: string;
  time: string;
  duration: string;
  status: MeetingDisplayStatus;
  type: MeetingDisplayType;
  location?: string;
  transcribed?: boolean;
  actionItems?: number;
  attendees?: string[];
}

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

const normalizeLeads = (items: unknown[]): Lead[] => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => {
      return !!item && typeof item === "object";
    })
    .filter((item) => typeof item.id === "string")
    .map((item) => ({
      ...(item as unknown as Lead),
      id: item.id as string,
    }));
};

const normalizeProjects = (items: unknown[]): Project[] => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => {
      return !!item && typeof item === "object";
    })
    .filter((item) => typeof item.id === "string")
    .map((item) => ({
      ...(item as unknown as Project),
      id: item.id as string,
    }));
};

const isArchivedOrDeleted = (item: Record<string, unknown>): boolean => {
  const status = String(item.status || "").toUpperCase();
  return (
    item.isDeleted === true ||
    !!item.deletedAt ||
    !!item.archivedAt ||
    status === "DELETED" ||
    status === "ARCHIVED"
  );
};

const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const isCurrentLead = (lead: Lead): boolean => {
  const status = String((lead as unknown as Record<string, unknown>).status || "").toUpperCase();
  const stage = String((lead as unknown as Record<string, unknown>).stage || "").toUpperCase();

  if (isArchivedOrDeleted(lead as unknown as Record<string, unknown>)) return false;
  if (["CONVERTED", "DISQUALIFIED", "UNQUALIFIED", "DELETED", "ARCHIVED"].includes(status)) return false;
  if (["WON", "LOST"].includes(stage)) return false;
  return true;
};

const isCurrentProject = (project: Project): boolean => {
  const status = String((project as unknown as Record<string, unknown>).status || "").toUpperCase();

  if (isArchivedOrDeleted(project as unknown as Record<string, unknown>)) return false;
  if (["CANCELLED", "COMPLETED", "DELETED", "ARCHIVED"].includes(status)) return false;
  return true;
};

export const MeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDisplay | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { selectedProject } = useProjectFilter();
  const {
    meetings: apiMeetings,
    isLoading,
    error,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  } = useMeetingStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [showMeetingTypeModal, setShowMeetingTypeModal] = useState(false);

  // MOM (Minutes of Meeting) state
  const [showMomModal, setShowMomModal] = useState(false);
  const [momMeetingId, setMomMeetingId] = useState<string | null>(null);
  const [momMeetingTitle, setMomMeetingTitle] = useState<string>("");
  const [momFile, setMomFile] = useState<File | null>(null);
  const [momFileError, setMomFileError] = useState<string | null>(null);
  const [momNotes, setMomNotes] = useState("");
  const [isUploadingMom, setIsUploadingMom] = useState(false);
  const [momAttachments, setMomAttachments] = useState<Attachment[]>([]);
  const [isFetchingMomAttachments, setIsFetchingMomAttachments] =
    useState(false);
  const [momViewingIds, setMomViewingIds] = useState<Set<string>>(new Set());
  const [momDownloadingIds, setMomDownloadingIds] = useState<Set<string>>(
    new Set(),
  );
  const momFileInputRef = useRef<HTMLInputElement>(null);

  // MOM import-transcript fields
  const [momTitle, setMomTitle] = useState("");
  const [momDescription, setMomDescription] = useState("");
  const [momMeetingType, setMomMeetingType] = useState<
    "RESIDENTIAL" | "COMMERCIAL"
  >("RESIDENTIAL");
  const [momProjectId, setMomProjectId] = useState("");
  const [momLeadId, setMomLeadId] = useState("");
  const [momProjectRole, setMomProjectRole] = useState("");
  const [momLeadRole, setMomLeadRole] = useState("");
  const [momUsers, setMomUsers] = useState<AdminUser[]>([]);
  const [momUsersLoading, setMomUsersLoading] = useState(false);
  const [momScheduledAt, setMomScheduledAt] = useState("");
  const [momTranscriptText, setMomTranscriptText] = useState("");
  const [momParticipants, setMomParticipants] = useState("");

  // New state for lead/project selection
  const [selectedMeetingType, setSelectedMeetingType] = useState<
    "residential" | "commercial" | null
  >(null);
  const [showEntitySelection, setShowEntitySelection] = useState(false);
  const [entityType, setEntityType] = useState<"lead" | "project" | "none">(
    "none",
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const fetchLiveEntities = useCallback(async () => {
    setLoadingEntities(true);
    try {
      const LEAD_PAGE_SIZE = 1000;
      const PROJECT_PAGE_SIZE = 1000;

      const fetchAllLeads = async (): Promise<Lead[]> => {
        let page = 1;
        let total = Number.POSITIVE_INFINITY;
        let collected: Lead[] = [];

        while (collected.length < total) {
          const response = await listLeads({ limit: LEAD_PAGE_SIZE, page });
          const chunk = normalizeLeads(response.leads || []);
          collected = collected.concat(chunk);
          total = Number(response.total || collected.length);
          if (chunk.length < LEAD_PAGE_SIZE) break;
          page += 1;
        }

        return uniqueById(collected);
      };

      const fetchAllProjects = async (): Promise<Project[]> => {
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;
        let collected: Project[] = [];

        while (collected.length < total) {
          const response = await listProjects({
            limit: PROJECT_PAGE_SIZE,
            offset,
          });
          const chunk = normalizeProjects(response.projects || []);
          collected = collected.concat(chunk);
          total = Number(response.total || collected.length);
          if (chunk.length < PROJECT_PAGE_SIZE) break;
          offset += PROJECT_PAGE_SIZE;
        }

        return uniqueById(collected);
      };

      const [allLeads, allProjects] = await Promise.all([
        fetchAllLeads(),
        fetchAllProjects(),
      ]);

      const activeLeads = allLeads.filter(isCurrentLead);
      const activeProjects = allProjects.filter(isCurrentProject);

      setLeads(activeLeads);
      setProjects(activeProjects);
    } catch (error) {
      console.error("Error fetching live leads/projects:", error);
    } finally {
      setLoadingEntities(false);
    }
  }, []);

  // Fetch leads + projects on mount (for entity name lookups in meeting cards)
  useEffect(() => {
    void fetchLiveEntities();
  }, [fetchLiveEntities]);

  // Re-fetch every time link-meeting modal opens to keep dropdowns live
  useEffect(() => {
    if (showMeetingTypeModal) {
      void fetchLiveEntities();
    }
  }, [showMeetingTypeModal, fetchLiveEntities]);

  const momRoles = useMemo(
    () => [...new Set(momUsers.map((u) => u.role))].sort(),
    [momUsers],
  );

  const momProjectRoleUsers = useMemo(() => {
    if (!momProjectRole) return [];
    return momUsers.filter((u) => u.role === momProjectRole);
  }, [momUsers, momProjectRole]);

  const momLeadRoleUsers = useMemo(() => {
    if (!momLeadRole) return [];
    return momUsers.filter((u) => u.role === momLeadRole);
  }, [momUsers, momLeadRole]);

  const ROLE_VALUE_PREFIX = "__role__:";

  const handleMomProjectSelect = (value: string) => {
    if (!value) {
      setMomProjectRole("");
      setMomProjectId("");
      return;
    }
    if (value.startsWith(ROLE_VALUE_PREFIX)) {
      setMomProjectRole(value.replace(ROLE_VALUE_PREFIX, ""));
      setMomProjectId("");
      return;
    }
    setMomProjectId(value);
  };

  const handleMomLeadSelect = (value: string) => {
    if (!value) {
      setMomLeadRole("");
      setMomLeadId("");
      return;
    }
    if (value.startsWith(ROLE_VALUE_PREFIX)) {
      setMomLeadRole(value.replace(ROLE_VALUE_PREFIX, ""));
      setMomLeadId("");
      return;
    }
    setMomLeadId(value);
  };

  // Fetch meetings on mount
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Map API status to display status
  const mapStatus = (apiStatus: string): MeetingDisplayStatus => {
    switch (apiStatus) {
      case "scheduled":
        return "scheduled";
      case "completed":
      case "COMPLETED":
      case "ANALYZED":
        return "completed";
      case "in_progress":
      case "PROCESSING":
        return "in_progress";
      case "cancelled":
        return "cancelled";
      default:
        return "scheduled";
    }
  };

  // Map API meeting type to display type
  const mapType = (apiType?: string): MeetingDisplayType => {
    if (!apiType) return "consultation";
    const lower = apiType.toLowerCase();
    if (lower.includes("site") || lower === "site_visit") return "site_visit";
    if (
      lower.includes("design") ||
      lower === "design_review" ||
      lower === "design_presentation"
    )
      return "design_review";
    if (lower.includes("virtual") || lower === "video") return "virtual";
    return "consultation";
  };

  // Transform API meetings to display format
  const meetings: MeetingDisplay[] = useMemo(() => {
    return apiMeetings.map((meeting) => {
      const scheduledDate =
        meeting.scheduledAt || meeting.scheduledDate || meeting.createdAt;
      let date: Date;
      if (scheduledDate) {
        date = new Date(scheduledDate);
        if (isNaN(date.getTime())) date = new Date();
      } else {
        date = new Date();
      }

      // Parse title to extract lead/project name and meeting type
      // Format: "Meeting Type - Lead/Project Name"
      let displayTitle = meeting.title;
      let displaySubtitle = meeting.description || "";

      if (meeting.title && meeting.title.includes(" - ")) {
        const parts = meeting.title.split(" - ");
        if (parts.length >= 2) {
          // Main title should be the lead/project name (after the dash)
          displayTitle = parts[1].trim();
          // Subtitle should be the meeting type (before the dash)
          displaySubtitle = parts[0].trim();
        }
      }

      // Resolve linked entity type and name from IDs
      let linkedEntityType: "Lead" | "Project" | "Customer" | undefined;
      let linkedEntityName: string | undefined;

      if (meeting.leadId) {
        linkedEntityType = "Lead";
        const lead = leads.find((l) => l.id === meeting.leadId);
        linkedEntityName = lead?.name;
      } else if (meeting.projectId) {
        linkedEntityType = "Project";
        const project = projects.find((p) => p.id === meeting.projectId);
        linkedEntityName = project?.projectName || project?.name;
      } else if (meeting.customerId) {
        linkedEntityType = "Customer";
      }

      // Also check generic entityType/entityId fields
      if (!linkedEntityType && meeting.entityType && meeting.entityId) {
        if (meeting.entityType === "LEAD") {
          linkedEntityType = "Lead";
          const lead = leads.find((l) => l.id === meeting.entityId);
          linkedEntityName = lead?.name;
        } else if (meeting.entityType === "PROJECT") {
          linkedEntityType = "Project";
          const project = projects.find((p) => p.id === meeting.entityId);
          linkedEntityName = project?.projectName || project?.name;
        } else if (meeting.entityType === "CUSTOMER") {
          linkedEntityType = "Customer";
        }
      }

      // Fall back: if name was extracted from title parsing, use it
      if (
        linkedEntityType &&
        !linkedEntityName &&
        displayTitle !== meeting.title
      ) {
        linkedEntityName = displayTitle;
      }

      return {
        id: meeting.id,
        projectId: meeting.projectId || meeting.entityId,
        leadId: meeting.leadId,
        customerId: meeting.customerId,
        linkedEntityType,
        linkedEntityName,
        title: displayTitle,
        client: displaySubtitle,
        date: date.toISOString().split("T")[0],
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: meeting.duration ? `${meeting.duration} mins` : "30 mins",
        status: mapStatus(meeting.status),
        type: mapType(
          (meeting as Record<string, unknown>).type as string | undefined,
        ),
        location: meeting.location,
        transcribed:
          !!meeting.transcription && meeting.transcription.length > 0,
        actionItems: (meeting as Record<string, unknown>).actionItems
          ? ((meeting as Record<string, unknown>).actionItems as string[])
              .length
          : 0,
        attendees: meeting.attendees || [],
      };
    });
  }, [apiMeetings, leads, projects]);

  const handleStartMeeting = () => {
    void fetchLiveEntities();
    setShowMeetingTypeModal(true);
    // Reset selections
    setSelectedMeetingType(null);
    setShowEntitySelection(false);
    setEntityType("none");
    setSelectedLeadId("");
    setSelectedProjectId("");
    setMeetingTitle("");
  };

  const handleStartMeetingWithType = async (
    meetingType: "residential" | "commercial",
  ) => {
    setSelectedMeetingType(meetingType);
    setShowEntitySelection(true);
  };

  const handleFinalStartMeeting = async () => {
    if (!selectedMeetingType) return;

    setShowMeetingTypeModal(false);
    setShowEntitySelection(false);

    try {
      // Determine title and related entity
      let title = meetingTitle;
      let linkedLeadId: string | undefined;
      let linkedProjectId: string | undefined;

      if (entityType === "lead" && selectedLeadId) {
        const lead = leads.find((l) => l.id === selectedLeadId);
        title =
          title ||
          `${selectedMeetingType === "residential" ? "Residential" : "Commercial"} Meeting - ${lead?.name}`;
        linkedLeadId = selectedLeadId;
      } else if (entityType === "project" && selectedProjectId) {
        const project = projects.find((p) => p.id === selectedProjectId);
        title =
          title ||
          `${selectedMeetingType === "residential" ? "Residential" : "Commercial"} Meeting - ${project?.projectName || project?.name}`;
        linkedProjectId = selectedProjectId;
      } else {
        title =
          title ||
          `${selectedMeetingType === "residential" ? "Residential" : "Commercial"} Meeting`;
      }

      // Create a new meeting via API
      const meetingData = {
        title,
        description: `${selectedMeetingType === "residential" ? "Residential" : "Commercial"} meeting`,
        scheduledDate: new Date().toISOString(),
        duration: 30,
        status: "in_progress" as const,
        attendees: [],
        leadId: linkedLeadId,
        projectId: linkedProjectId,
      };

      const created = await createMeeting(meetingData);
      navigate("/dashboard/meeting-room", { state: { meetingId: created.id } });
    } catch (err) {
      console.error("Error creating meeting:", err);
      // Fallback: navigate without meetingId
      navigate("/dashboard/meeting-room");
    }
  };

  const handleOpenCalendar = () => {
    navigate("/dashboard/meetings/calendar");
  };

  const handleOpenMom = async (meetingId: string, meetingTitle: string) => {
    setMomMeetingId(meetingId);
    setMomMeetingTitle(meetingTitle);
    setMomFile(null);
    setMomNotes("");
    setShowMomModal(true);
    setIsFetchingMomAttachments(true);
    try {
      const attachments = await listAttachments("MEETING", meetingId);
      // Filter client-side in case the API returns all meeting attachments
      setMomAttachments(attachments.filter((a) => a.entityId === meetingId));
    } catch {
      setMomAttachments([]);
    } finally {
      setIsFetchingMomAttachments(false);
    }
  };

  const handleMomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Only plain text files are valid — binary files (PDF, DOCX, etc.) contain
    // null bytes (0x00) that the server's PostgreSQL UTF-8 encoding rejects.
    const isPlainText =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isPlainText) {
      setMomFileError(
        `"${file.name}" is a binary file (${file.type || "unknown type"}). The API only accepts plain text (.txt) files. Please paste the transcript text in the field below instead.`,
      );
      setMomFile(null);
      if (momFileInputRef.current) momFileInputRef.current.value = "";
      return;
    }
    setMomFileError(null);
    setMomFile(file);
  };

  const closeMomModal = () => {
    setShowMomModal(false);
    setMomTitle("");
    setMomDescription("");
    setMomProjectId("");
    setMomLeadId("");
    setMomProjectRole("");
    setMomLeadRole("");
    setMomScheduledAt("");
    setMomTranscriptText("");
    setMomParticipants("");
    setMomFile(null);
    setMomFileError(null);
    setMomNotes("");
    if (momFileInputRef.current) momFileInputRef.current.value = "";
  };

  const fetchMomAttachments = async (meetingId: string) => {
    setIsFetchingMomAttachments(true);
    try {
      const atts = await listAttachments("MEETING", meetingId);
      // Filter client-side in case the API returns all meeting attachments
      setMomAttachments(atts.filter((a) => a.entityId === meetingId));
    } catch {
      setMomAttachments([]);
    } finally {
      setIsFetchingMomAttachments(false);
    }
  };

  const handleUploadMom = async () => {
    if (!momTitle.trim()) return;
    if (!momFile && !momTranscriptText.trim()) return;
    if (!momScheduledAt) return;
    setIsUploadingMom(true);
    try {
      // Convert comma-separated participants to JSON array
      let participantsJson: string | undefined;
      if (momParticipants.trim()) {
        const names = momParticipants
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
        participantsJson = JSON.stringify(names.map((name) => ({ name })));
      }

      const selectedEntityType = momProjectId
        ? "PROJECT"
        : momLeadId
          ? "LEAD"
          : undefined;
      const selectedEntityId = momProjectId || momLeadId || undefined;

      await meetingAPI.importTranscript({
        meetingId: momMeetingId || undefined,
        title: momTitle.trim(),
        description: momDescription.trim() || undefined,
        meetingType: momMeetingType,
        entityType: selectedEntityType,
        entityId: selectedEntityId,
        scheduledAt: new Date(momScheduledAt).toISOString(),
        projectId: momProjectId || undefined,
        leadId: momLeadId || undefined,
        transcript: momFile || undefined,
        transcriptText: momTranscriptText.trim() || undefined,
        participants: participantsJson,
      });
      // Reset form
      setMomTitle("");
      setMomDescription("");
      setMomProjectId("");
      setMomLeadId("");
      setMomProjectRole("");
      setMomLeadRole("");
      setMomScheduledAt("");
      setMomTranscriptText("");
      setMomParticipants("");
      setMomFile(null);
      setMomFileError(null);
      setMomNotes("");
      if (momFileInputRef.current) momFileInputRef.current.value = "";
      // Close modal and refresh meetings
      setShowMomModal(false);
      fetchMeetings();
      toast.success("Meeting transcript imported successfully!");
    } catch (err: any) {
      console.error("Error importing transcript:", err);
      toast.error(err?.message || "Failed to import transcript");
    } finally {
      setIsUploadingMom(false);
    }
  };

  const handleDownloadAttachment = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  useEffect(() => {
    const fetchMomUsers = async () => {
      if (!showMomModal) return;
      setMomUsersLoading(true);
      try {
        const response = await adminAPI.getAllUsers();
        let usersList: Array<Record<string, unknown>> = [];

        if (Array.isArray(response)) {
          usersList = response as Array<Record<string, unknown>>;
        } else if (response && typeof response === "object") {
          if ("users" in response && Array.isArray(response.users)) {
            usersList = response.users as Array<Record<string, unknown>>;
          } else if (
            "data" in response &&
            response.data &&
            typeof response.data === "object"
          ) {
            const data = response.data as Record<string, unknown>;
            if (Array.isArray(data)) {
              usersList = data as Array<Record<string, unknown>>;
            } else if ("users" in data && Array.isArray(data.users)) {
              usersList = data.users as Array<Record<string, unknown>>;
            }
          }
        }

        const normalizedUsers = usersList.map((user) => {
          const roleFromApi =
            user.role ||
            (
              user.credential as { roleKey?: string; name?: string } | undefined
            )?.roleKey ||
            (
              user.credential as { roleKey?: string; name?: string } | undefined
            )?.name ||
            "BDR";

          return {
            ...user,
            role: String(roleFromApi).toUpperCase() as AdminUser["role"],
          } as AdminUser;
        });

        const seen = new Set<string>();
        const activeUsers = normalizedUsers.filter((u) => {
          if (!u.id || seen.has(u.id)) return false;
          seen.add(u.id);
          return u.isActive !== false && !u.isBanned;
        });

        setMomUsers(activeUsers);
      } catch {
        setMomUsers([]);
      } finally {
        setMomUsersLoading(false);
      }
    };

    const fetchMomEntities = async () => {
      if (!showMomModal) return;
      await Promise.all([fetchLiveEntities(), fetchMomUsers()]);
    };

    void fetchMomEntities();
  }, [showMomModal, fetchLiveEntities]);

  // View a MOM attachment — fetch fresh signed downloadUrl first
  const handleViewMomAtt = async (att: Attachment) => {
    setMomViewingIds((prev) => new Set(prev).add(att.id));
    try {
      const fresh = await getAttachment(att.id);
      const url = fresh.downloadUrl || fresh.fileUrl || fresh.storageUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // fallback to cached URL
      const url = att.downloadUrl || att.fileUrl || att.storageUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setMomViewingIds((prev) => {
        const n = new Set(prev);
        n.delete(att.id);
        return n;
      });
    }
  };

  // Download a MOM attachment — fetch fresh signed downloadUrl first
  const handleDownloadMomAtt = async (att: Attachment) => {
    setMomDownloadingIds((prev) => new Set(prev).add(att.id));
    try {
      const fresh = await getAttachment(att.id);
      const url = fresh.downloadUrl || fresh.fileUrl || fresh.storageUrl;
      if (!url) return;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = att.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      } catch {
        window.open(url, "_blank");
      }
    } catch {
      // fallback to cached URL
      const url = att.downloadUrl || att.fileUrl || att.storageUrl;
      if (url) window.open(url, "_blank");
    } finally {
      setMomDownloadingIds((prev) => {
        const n = new Set(prev);
        n.delete(att.id);
        return n;
      });
    }
  };

  const handleStartScheduledMeeting = async (
    e: React.MouseEvent,
    meeting: MeetingDisplay,
  ) => {
    e.stopPropagation();
    try {
      await updateMeeting(meeting.id.toString(), { status: "in_progress" });
    } catch (err) {
      console.error("Error updating meeting status:", err);
    }
    navigate("/dashboard/meeting-room", {
      state: { meetingId: meeting.id },
    });
  };

  const handleScheduleMeeting = async (formData: MeetingFormData) => {
    try {
      // Combine date and time into ISO string
      const scheduledDateTime = new Date(`${formData.date}T${formData.time}`);

      // Map form data to Meeting type expected by store
      const meetingData = {
        title: formData.title,
        description: formData.client,
        scheduledDate: scheduledDateTime.toISOString(),
        duration: parseInt(formData.duration),
        location:
          formData.type === "site_visit"
            ? formData.location
            : formData.meetingLink,
        attendees: formData.attendees || [],
        status: "scheduled" as const,
        // Map meeting type appropriately
        leadId: selectedProject?.id, // Link to selected project if available
      };

      const newMeeting = await createMeeting(meetingData);

      // Add selected team members as participants
      if (
        newMeeting?.id &&
        formData.teamMemberIds &&
        formData.teamMemberIds.length > 0
      ) {
        await Promise.allSettled(
          formData.teamMemberIds.map((userId) =>
            meetingAPI.addParticipant(newMeeting.id, { userId }),
          ),
        );
      }

      // Refresh meetings list after creation
      await fetchMeetings();
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      // Error is shown by store's error state
    }
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

  // Apply project and search filters
  const filteredMeetings = useMemo(() => {
    let filtered = meetings;

    // Filter by selected project
    if (selectedProject) {
      filtered = filtered.filter(
        (meeting) => meeting.projectId === selectedProject.id,
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (meeting.client &&
            meeting.client.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    return filtered;
  }, [meetings, selectedProject, searchQuery]);

  const upcomingCount = meetings.filter((m) => m.status === "scheduled").length;
  const completedCount = meetings.filter(
    (m) => m.status === "completed",
  ).length;
  const todayCount = meetings.filter(
    (m) => m.date === new Date().toISOString().split("T")[0],
  ).length;

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
            onClick={() => {
              // Open MOM for the first meeting or a generic modal without a pre-selected meeting
              setMomMeetingId(null);
              setMomMeetingTitle("All Meetings");
              setMomFile(null);
              setMomNotes("");
              setMomAttachments([]);
              setShowMomModal(true);
            }}
          >
            <FileText className="w-4 h-4" />
            MOM
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
                {meetings.length}
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="rounded-xl">
          <SectionLoader message="Loading meetings..." />
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-6 rounded-xl border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Error loading meetings
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                onClick={() => fetchMeetings()}
                variant="secondary"
                className="mt-3 rounded-lg"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Meetings Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting) => {
            const statusColor = statusColors[meeting.status];
            const TypeIcon = typeIcons[meeting.type];

            return (
              <Card
                key={meeting.id}
                className="p-5 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/dashboard/meetings/${meeting.id}`)}
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
                      {meeting.client && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {meeting.client}
                        </p>
                      )}
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${statusColor.dot}`}
                        />
                        <span className="text-xs font-medium">
                          {meeting.status.replace("_", " ")}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMeetingToDelete(meeting.id.toString());
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {/* Linked Entity Chips */}
                {meeting.linkedEntityType && meeting.linkedEntityName && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {meeting.linkedEntityType === "Lead" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-200">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-orange-400 font-normal">
                          Lead
                        </span>
                        <span className="font-semibold">
                          {meeting.linkedEntityName}
                        </span>
                      </div>
                    )}
                    {meeting.linkedEntityType === "Project" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="text-blue-400 font-normal">
                          Project
                        </span>
                        <span className="font-semibold">
                          {meeting.linkedEntityName}
                        </span>
                      </div>
                    )}
                    {meeting.linkedEntityType === "Customer" &&
                      meeting.linkedEntityName && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                          <UserCircle className="w-3.5 h-3.5" />
                          <span className="text-purple-400 font-normal">
                            Customer
                          </span>
                          <span className="font-semibold">
                            {meeting.linkedEntityName}
                          </span>
                        </div>
                      )}
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {new Date(meeting.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{meeting.time}</span>
                    <span className="text-gray-400">({meeting.duration})</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMom(meeting.id.toString(), meeting.title);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      MOM
                    </button>
                    {meeting.status === "scheduled" && (
                      <button
                        onClick={(e) => handleStartScheduledMeeting(e, meeting)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
                        {selectedMeeting.client && (
                          <p className="text-gray-600">
                            {selectedMeeting.client}
                          </p>
                        )}
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
                    {showDeleteConfirm ? (
                      // Delete confirmation view
                      <div className="flex-1 flex flex-col gap-3">
                        <p className="text-sm text-gray-600 text-center">
                          Are you sure you want to delete this meeting?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                              setIsDeleting(true);
                              try {
                                await deleteMeeting(
                                  selectedMeeting.id.toString(),
                                );
                                setShowDeleteConfirm(false);
                                setSelectedMeeting(null);
                                fetchMeetings();
                              } catch (err) {
                                console.error("Error deleting meeting:", err);
                              } finally {
                                setIsDeleting(false);
                              }
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal actions view
                      <>
                        <Button
                          className="flex-1 rounded-xl"
                          onClick={() => {
                            setSelectedMeeting(null);
                            navigate(
                              `/dashboard/meetings/${selectedMeeting.id}`,
                            );
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Details
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1 rounded-xl"
                          onClick={() => {
                            setSelectedMeeting(null);
                            navigate("/dashboard/meeting-room", {
                              state: { meetingId: selectedMeeting.id },
                            });
                          }}
                        >
                          <Video className="w-4 h-4" />
                          Start Meeting
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl px-3"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </>,
          document.body,
        )}

      {/* Empty State */}
      {!isLoading && !error && filteredMeetings.length === 0 && (
        <Card className="p-12 rounded-xl text-center">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No meetings found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your filters"
              : "Schedule your first meeting"}
          </p>
          <Button
            className="rounded-xl"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </Card>
      )}

      {/* Meeting Type Selection Modal */}
      {showMeetingTypeModal &&
        ReactDOM.createPortal(
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowMeetingTypeModal(false)}
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
                className="w-full max-w-2xl rounded-2xl"
                style={{ pointerEvents: "auto" }}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {showEntitySelection
                            ? "Link Meeting"
                            : "Select Meeting Type"}
                        </h2>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {showEntitySelection
                            ? `${selectedMeetingType === "residential" ? "Residential" : "Commercial"} meeting - Link to a lead or project`
                            : "Choose the type of meeting you want to start"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowMeetingTypeModal(false);
                        setShowEntitySelection(false);
                      }}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {!showEntitySelection ? (
                  /* Meeting Type Options */
                  <div className="p-6 space-y-4">
                    {/* Residential Option */}
                    <button
                      onClick={() => handleStartMeetingWithType("residential")}
                      className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all group text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Users className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                            Residential Meeting
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            For individual homeowners, families, and household
                            projects
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                              Home Design
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                              Renovation
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                              Interior Consultation
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-orange-500 transition-colors flex-shrink-0">
                          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white rotate-[-90deg]" />
                        </div>
                      </div>
                    </button>

                    {/* Commercial Option */}
                    <button
                      onClick={() => handleStartMeetingWithType("commercial")}
                      className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all group text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                            Commercial Meeting
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            For businesses, offices, retail spaces, and
                            commercial projects
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200">
                              Office Space
                            </span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200">
                              Retail Design
                            </span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200">
                              Corporate Projects
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-orange-500 transition-colors flex-shrink-0">
                          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white rotate-[-90deg]" />
                        </div>
                      </div>
                    </button>

                    {/* Info Banner */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-900 font-medium mb-1">
                            Why choose a meeting type?
                          </p>
                          <p className="text-xs text-blue-700">
                            Selecting the meeting type helps us customize the
                            experience with relevant tools, templates, and
                            guidance specific to your project needs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Entity Selection */
                  <div className="p-6 space-y-6">
                    {/* Entity Type Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-900">
                        Link this meeting to:
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            setEntityType("lead");
                            setSelectedProjectId("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            entityType === "lead"
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          <UserCircle
                            className={`w-6 h-6 mx-auto mb-2 ${
                              entityType === "lead"
                                ? "text-orange-600"
                                : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              entityType === "lead"
                                ? "text-orange-900"
                                : "text-gray-700"
                            }`}
                          >
                            Lead
                          </p>
                        </button>
                        <button
                          onClick={() => {
                            setEntityType("project");
                            setSelectedLeadId("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            entityType === "project"
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          <Briefcase
                            className={`w-6 h-6 mx-auto mb-2 ${
                              entityType === "project"
                                ? "text-orange-600"
                                : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              entityType === "project"
                                ? "text-orange-900"
                                : "text-gray-700"
                            }`}
                          >
                            Project
                          </p>
                        </button>
                        <button
                          onClick={() => {
                            setEntityType("none");
                            setSelectedLeadId("");
                            setSelectedProjectId("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            entityType === "none"
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          <FileText
                            className={`w-6 h-6 mx-auto mb-2 ${
                              entityType === "none"
                                ? "text-orange-600"
                                : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              entityType === "none"
                                ? "text-orange-900"
                                : "text-gray-700"
                            }`}
                          >
                            None
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Lead Selection */}
                    {entityType === "lead" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                          Select Lead
                        </label>
                        {loadingEntities ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                          </div>
                        ) : leads.length > 0 ? (
                          <select
                            value={selectedLeadId}
                            onChange={(e) => setSelectedLeadId(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Select a lead...</option>
                            {leads.map((lead) => (
                              <option key={lead.id} value={lead.id}>
                                {lead.name}{" "}
                                {lead.email ? `(${lead.email})` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-600 text-center">
                              No leads available. You can still start the
                              meeting without linking it.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Project Selection */}
                    {entityType === "project" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                          Select Project
                        </label>
                        {loadingEntities ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                          </div>
                        ) : projects.length > 0 ? (
                          <select
                            value={selectedProjectId}
                            onChange={(e) =>
                              setSelectedProjectId(e.target.value)
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Select a project...</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.projectName || project.name}{" "}
                                {project.lead?.name
                                  ? `- ${project.lead.name}`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-600 text-center">
                              No projects available. You can still start the
                              meeting without linking it.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meeting Title */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Meeting Title{" "}
                        {entityType === "none" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder={
                          entityType === "none"
                            ? "Enter meeting title..."
                            : "Optional - auto-generated if empty"
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowEntitySelection(false)}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleFinalStartMeeting}
                        disabled={entityType === "none" && !meetingTitle.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start Meeting
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </>,
          document.body,
        )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleMeeting}
      />

      {/* MOM (Minutes of Meeting) Modal */}
      {showMomModal &&
        ReactDOM.createPortal(
          <>
            <div
              onClick={() => closeMomModal()}
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
                className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
                style={{ pointerEvents: "auto" }}
              >
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Import Meeting Transcript
                      </h2>
                      <p className="text-xs text-gray-500">
                        Minutes of Meeting
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => closeMomModal()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={momTitle}
                      onChange={(e) => setMomTitle(e.target.value)}
                      placeholder="e.g. Imported Meeting MoM"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Description{" "}
                      <span className="text-xs font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={momDescription}
                      onChange={(e) => setMomDescription(e.target.value)}
                      placeholder="Brief description of this meeting..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>

                  {/* Meeting Type + Linked IDs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                        Meeting Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={momMeetingType}
                        onChange={(e) =>
                          setMomMeetingType(
                            e.target.value as "RESIDENTIAL" | "COMMERCIAL",
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                        Project ID
                      </label>
                      <select
                        value={
                          momProjectId ||
                          (momProjectRole
                            ? `${ROLE_VALUE_PREFIX}${momProjectRole}`
                            : "")
                        }
                        onChange={(e) => handleMomProjectSelect(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">
                          {momUsersLoading
                            ? "Loading roles..."
                            : "Select project (optional)"}
                        </option>
                        {!momProjectRole &&
                          momRoles.map((role) => (
                            <option
                              key={`mom-project-role-${role}`}
                              value={`${ROLE_VALUE_PREFIX}${role}`}
                            >
                              {role.replace(/_/g, " ")}
                            </option>
                          ))}
                        {momProjectRole && (
                          <>
                            <option value={`${ROLE_VALUE_PREFIX}${momProjectRole}`}>
                              {momProjectRole.replace(/_/g, " ")} (role selected)
                            </option>
                            {momProjectRoleUsers.length === 0 ? (
                              <option value="" disabled>
                                No users in this role
                              </option>
                            ) : (
                              momProjectRoleUsers.map((u) => (
                                <option key={`mom-project-user-${u.id}`} value={u.id}>
                                  {u.name}
                                </option>
                              ))
                            )}
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Lead ID
                    </label>
                    <select
                      value={
                        momLeadId ||
                        (momLeadRole ? `${ROLE_VALUE_PREFIX}${momLeadRole}` : "")
                      }
                      onChange={(e) => handleMomLeadSelect(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">
                        {momUsersLoading
                          ? "Loading roles..."
                          : "Select lead (optional)"}
                      </option>
                      {!momLeadRole &&
                        momRoles.map((role) => (
                          <option
                            key={`mom-lead-role-${role}`}
                            value={`${ROLE_VALUE_PREFIX}${role}`}
                          >
                            {role.replace(/_/g, " ")}
                          </option>
                        ))}
                      {momLeadRole && (
                        <>
                          <option value={`${ROLE_VALUE_PREFIX}${momLeadRole}`}>
                            {momLeadRole.replace(/_/g, " ")} (role selected)
                          </option>
                          {momLeadRoleUsers.length === 0 ? (
                            <option value="" disabled>
                              No users in this role
                            </option>
                          ) : (
                            momLeadRoleUsers.map((u) => (
                              <option key={`mom-lead-user-${u.id}`} value={u.id}>
                                {u.name}
                              </option>
                            ))
                          )}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Scheduled At */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Scheduled Date & Time{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={momScheduledAt}
                      onChange={(e) => setMomScheduledAt(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  {/* Transcript File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Transcript File{" "}
                      <span className="text-xs font-normal text-gray-400">
                        (plain text .txt only)
                      </span>
                    </label>
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                      ⚠️ Only <strong>.txt</strong> plain text files are
                      supported. PDFs, DOCX, and other binary formats will be
                      rejected by the server. For those formats, copy-paste the
                      text below instead.
                    </p>
                    <label
                      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        momFileError
                          ? "border-red-300 bg-red-50 hover:bg-red-50"
                          : momFile
                            ? "border-green-300 bg-green-50 hover:bg-green-50"
                            : "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload
                          className={`w-5 h-5 ${momFileError ? "text-red-400" : momFile ? "text-green-500" : "text-indigo-400"}`}
                        />
                        {momFile ? (
                          <span className="text-sm font-medium text-green-700 text-center px-2">
                            ✓ {momFile.name}
                          </span>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-indigo-600">
                              Click to select .txt file
                            </span>
                            <span className="text-xs text-gray-400">
                              Plain text only
                            </span>
                          </>
                        )}
                      </div>
                      <input
                        ref={momFileInputRef}
                        type="file"
                        className="hidden"
                        accept=".txt,text/plain"
                        onChange={handleMomFileChange}
                      />
                    </label>
                    {momFileError && (
                      <p className="mt-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {momFileError}
                      </p>
                    )}
                    {momFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setMomFile(null);
                          setMomFileError(null);
                          if (momFileInputRef.current)
                            momFileInputRef.current.value = "";
                        }}
                        className="mt-1.5 text-xs text-red-500 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    )}
                  </div>

                  {/* Transcript Text (alternative) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Transcript Text{" "}
                      <span className="text-xs font-normal text-gray-400">
                        (alternative to file — paste text here)
                      </span>
                    </label>
                    <textarea
                      value={momTranscriptText}
                      onChange={(e) => setMomTranscriptText(e.target.value)}
                      placeholder="Paste transcript text here..."
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Participants{" "}
                      <span className="text-xs font-normal text-gray-400">
                        (optional — comma-separated names)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={momParticipants}
                      onChange={(e) => setMomParticipants(e.target.value)}
                      placeholder="e.g. John Doe, Jane Smith"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleUploadMom}
                    disabled={
                      !momTitle.trim() ||
                      (!momFile && !momTranscriptText.trim()) ||
                      !momScheduledAt ||
                      isUploadingMom
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {isUploadingMom ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import Transcript
                      </>
                    )}
                  </button>
                  {!momTitle.trim() && !momScheduledAt && (
                    <p className="text-xs text-gray-400 text-center">
                      Fill in the required fields to import.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </>,
          document.body,
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm && meetingToDelete !== null}
          onClose={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false);
              setMeetingToDelete(null);
            }
          }}
          title="Confirm Deletion"
          size="sm"
          footer={
            <>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMeetingToDelete(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (meetingToDelete) {
                    setIsDeleting(true);
                    try {
                      await deleteMeeting(meetingToDelete);
                      setShowDeleteConfirm(false);
                      setMeetingToDelete(null);
                      toast.success("Meeting deleted successfully");
                      fetchMeetings();
                    } catch (err) {
                      console.error("Error deleting meeting:", err);
                      toast.error("Failed to delete meeting");
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          }
        >
          <div className="p-4 text-gray-600">
            Are you sure you want to delete this meeting? This action cannot be undone.
          </div>
        </Modal>
      </div>
    );
  };

