import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Home,
  Palette,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Trash2,
  Building2,
  Activity,
  Star,
  Plus,
  Loader2,
  Copy,
  Sparkles,
  IndianRupee,
  Ruler,
  Target,
  ArrowRight,
  Check,
  X,
  Image as ImageIcon,
  Pencil,
  Layers,
  ExternalLink,
  Wrench,
  Users,
} from "lucide-react";
import { Button, PageLoader } from "../../components/ui";
import LeadAPI, {
  Lead as APILead,
  LeadActivity as APILeadActivity,
  LeadNote,
  LeadContact,
  LeadStageHistory,
  updateLead,
  LeadSource,
} from "../../services/leadApi";
import { LeadModal } from "./LeadsNew";
import { adminAPI } from "../../services/api";
import { AdminUser } from "../../types";
import CustomerAPI from "../../services/customerApi";
import toast from "react-hot-toast";
import { getSourceLabel } from "../../utils/leadHelpers";
import { LeadReferencesManager } from "../../components/leads";
import { LeadReference } from "../../types";
import { listAttachments, getAttachment, Attachment } from "../../services/attachmentApi";

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<APILead | null>(null);
  const [activities, setActivities] = useState<APILeadActivity[]>([]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [stageHistory, setStageHistory] = useState<LeadStageHistory[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Edit lead modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [leadSources] = useState<LeadSource[]>([]);
  const [teamUsers, setTeamUsers] = useState<AdminUser[]>([]);

  // Convert to Customer state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // References state
  const [references, setReferences] = useState<LeadReference[]>([]);
  const [floorPlanAttachment, setFloorPlanAttachment] =
    useState<Attachment | null>(null);

  // Helper function to safely display field values and prevent "undefined" text
  const safeDisplay = (
    value: string | undefined | null,
    fallback: string = "Not provided",
  ): string => {
    if (!value || value === "undefined" || value === "null") {
      return fallback;
    }
    return value;
  };

  const getFloorPlanDisplayName = (urlOrName: string) => {
    if (!urlOrName) return "View floor plan";
    try {
      // If it looks like a URL, try extracting filename
      if (urlOrName.startsWith("http")) {
        const url = new URL(urlOrName);
        const pathSegments = url.pathname.split("/");
        const lastSegment = pathSegments[pathSegments.length - 1];
        return decodeURIComponent(lastSegment) || "Floor Plan Document";
      }
      return urlOrName;
    } catch {
      return "Floor Plan Document";
    }
  };

  const handleDownloadFloorPlan = async (url: string) => {
    if (!url) {
      toast.error("Floor plan URL is not available yet.");
      return;
    }

    try {
      // Don't send auth headers for public URLs or GCS signed URLs
      const isExternalUrl =
        url.includes("storage.googleapis.com") ||
        url.includes("amazonaws.com") ||
        url.startsWith("http");

      const token = localStorage.getItem("auth_token");
      const headers: HeadersInit =
        token && !isExternalUrl ? { Authorization: `Bearer ${token}` } : {};

      // If it is a GCS URL, just open it
      if (isExternalUrl) {
        window.open(url, "_blank");
        return;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const fileName =
        floorPlanAttachment?.fileName || getFloorPlanDisplayName(url);
      a.download = fileName; // Suggest a filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback to direct navigation if fetch fails (e.g. CORS or public URL)
      window.open(url, "_blank");
    }
  };

  const normalizedLeadFloorPlanUrl =
    lead?.floorPlanUrl &&
    lead.floorPlanUrl !== "undefined" &&
    lead.floorPlanUrl !== "null"
      ? lead.floorPlanUrl
      : "";

  const resolvedFloorPlanUrl =
    floorPlanAttachment?.downloadUrl ||
    floorPlanAttachment?.url ||
    floorPlanAttachment?.fileUrl ||
    floorPlanAttachment?.storageUrl ||
    normalizedLeadFloorPlanUrl ||
    "";

  useEffect(() => {
    console.log("LeadDetails useEffect - ID:", id);

    // Reset state when ID changes to prevent showing stale data
    setLead(null);
    setActivities([]);
    setNotes([]);
    setContacts([]);
    setStageHistory([]);
    setReferences([]);
    setLoading(true);

    if (id) {
      fetchLeadDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Reset state when ID changes to prevent showing previous lead's floor plan
    setFloorPlanAttachment(null);

    const fetchAttachments = async () => {
      if (!id) return;
      try {
        const result = (await listAttachments("LEAD", id)).filter(
          (attachment) => attachment.entityId === id,
        );
        // Find the most recent floor plan attachment
        const floorPlan = result
          .filter((att) => att.attachmentType === "FLOOR_PLAN")
          .sort((a, b) => {
            const dateA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          })[0];

        if (floorPlan) {
          // Fetch full attachment details to get the signed downloadUrl
          try {
            const fullFloorPlan = await getAttachment(floorPlan.id);
            setFloorPlanAttachment(fullFloorPlan);
          } catch (error) {
            console.error("Failed to fetch full floor plan details:", error);
            // Fallback to the listed attachment metadata
            setFloorPlanAttachment(floorPlan);
          }
        }
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
      }
    };

    fetchAttachments();
  }, [id]);

  // Fetch users for the edit modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminAPI.getAllUsers();
        const usersArray = Array.isArray(response)
          ? response
          : (response as any)?.users || [];
        const seen = new Set<string>();
        const unique: AdminUser[] = [];
        for (const u of usersArray) {
          if (u.id && !seen.has(u.id) && !u.isBanned) {
            seen.add(u.id);
            unique.push(u);
          }
        }
        setTeamUsers(unique);
      } catch {
        // non-critical, users list just won't populate
      }
    };
    fetchUsers();
  }, []);

  const handleConvertToCustomer = async () => {
    console.log("handleConvertToCustomer called");
    console.log("Lead object:", lead);
    console.log("Lead ID from state:", lead?.id);
    console.log("Lead ID from URL:", id);

    // Use lead ID from state, fallback to URL param
    const leadId = lead?.id || id;

    if (!leadId) {
      console.log("No lead ID found, returning early");
      toast.error("No lead ID found");
      return;
    }

    // Guard: lead has already been converted
    if (lead?.convertedToAccount) {
      toast.error(
        `This lead has already been converted to customer "${lead.convertedToAccount.name || "Unknown"}".`,
      );
      setShowConvertModal(false);
      return;
    }

    const customerName = lead?.name || "Unknown Customer";
    console.log("Customer name:", customerName);

    setIsConverting(true);
    try {
      console.log("Making API call to convert lead...");
      console.log("Request payload:", {
        leadId: leadId,
        name: customerName,
      });

      const result = await CustomerAPI.convertLeadToCustomer(
        leadId,
        customerName,
      );

      console.log("Conversion successful:", result);
      setShowConvertModal(false);
      toast.success(
        `Lead "${customerName}" converted to customer successfully!`,
      );

      // Navigate to the customer detail page to see the new customer
      setTimeout(() => {
        navigate(`/dashboard/customers/${result.id}`);
      }, 1500);
    } catch (error) {
      console.error("Conversion error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to convert lead to customer";
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const fetchLeadDetails = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    console.log("Fetching lead details for ID:", id);
    setLoading(true);
    setLead(null); // Clear previous lead data
    setActivities([]); // Clear previous activities
    setNotes([]); // Clear previous notes
    setContacts([]); // Clear previous contacts
    setStageHistory([]); // Clear previous stage history

    try {
      // Fetch the specific lead by ID - response includes contacts, stageHistory, activities, convertedToAccount
      const leadData = await LeadAPI.getLeadById(id);
      console.log("Lead data received for ID", id, ":", leadData);

      // Debug log to identify if API returns undefined values or string "undefined"
      console.log("Lead contact details debug:", {
        id: leadData.id,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        nameType: typeof leadData.name,
        emailType: typeof leadData.email,
        phoneType: typeof leadData.phone,
        nameIsUndefinedString: leadData.name === "undefined",
        emailIsUndefinedString: leadData.email === "undefined",
        phoneIsUndefinedString: leadData.phone === "undefined",
      });

      // Ensure we have the ID in the lead data
      if (leadData && (!leadData.id || leadData.id !== id)) {
        console.warn(
          "Lead data ID mismatch. Expected:",
          id,
          "Received:",
          leadData.id,
        );
        leadData.id = id; // Ensure ID is set
      }

      setLead(leadData);

      // Set contacts from nested response
      if (leadData.contacts && Array.isArray(leadData.contacts)) {
        console.log(
          "Setting contacts from lead response:",
          leadData.contacts.length,
        );
        setContacts(leadData.contacts);
      }

      // Set stage history from nested response
      if (leadData.stageHistory && Array.isArray(leadData.stageHistory)) {
        console.log(
          "Setting stageHistory from lead response:",
          leadData.stageHistory.length,
        );
        setStageHistory(leadData.stageHistory);
      }

      // Use activities from nested response first, fallback to separate API call
      if (
        leadData.activities &&
        Array.isArray(leadData.activities) &&
        leadData.activities.length > 0
      ) {
        console.log(
          "Setting activities from lead response:",
          leadData.activities.length,
        );
        setActivities(leadData.activities);
      } else {
        // Fallback: Fetch activities separately
        try {
          const activitiesData = await LeadAPI.getLeadActivities(id);
          console.log(
            "Activities received from separate API for ID",
            id,
            ":",
            activitiesData?.length || 0,
          );
          setActivities(activitiesData || []);
        } catch (activityError) {
          console.error(
            "Error fetching activities for lead",
            id,
            ":",
            activityError,
          );
          setActivities([]);
        }
      }

      // Load references — fetch real attachments from API
      try {
        const rawAttachments: Attachment[] = await listAttachments("LEAD", id);
        // Strictly filter by entityId on the client side to guarantee isolation
        // between leads even if the backend returns unfiltered results.
        const attachments = rawAttachments.filter((a) => a.entityId === id);
        const mapped: LeadReference[] = attachments.map((a) => ({
          id: a.id,
          leadId: id,
          type: a.fileType?.startsWith("image/")
            ? ("IMAGE" as any)
            : a.fileType === "application/pdf"
              ? ("PDF" as any)
              : a.fileType?.startsWith("video/")
                ? ("VIDEO" as any)
                : ("DOCUMENT" as any),
          title: a.fileName,
          description: a.notes || a.attachmentType?.replace(/_/g, " "),
          url: a.downloadUrl || a.fileUrl || "",
          fileName: a.fileName,
          mimeType: a.fileType,
          category: "Reference" as const,
          uploadedBy: "",
          uploadedAt: a.uploadedAt || a.createdAt || new Date().toISOString(),
          tags: [a.attachmentType],
        }));
        setReferences(mapped);
      } catch {
        // Fall back to embedded references if API fails
        if (leadData.references && Array.isArray(leadData.references)) {
          setReferences(leadData.references);
        } else {
          setReferences([]);
        }
      }

      // Fetch notes for this specific lead (separate endpoint)
      try {
        setLoadingNotes(true);
        const notesData = await LeadAPI.getLeadNotes(id);
        console.log("Notes received for ID", id, ":", notesData?.length || 0);
        setNotes(notesData || []);
      } catch (noteError) {
        console.error("Error fetching notes for lead", id, ":", noteError);
        setNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    } catch (error) {
      console.error("Error fetching lead details for ID", id, ":", error);
      toast.error("Failed to load lead details");
      navigate("/dashboard/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (updatedData: Omit<APILead, "id">) => {
    const leadId = lead?.id || id;
    if (!leadId) throw new Error("No lead ID found");
    await updateLead(leadId, updatedData);
    setShowEditModal(false);
    toast.success("Lead updated successfully");
    fetchLeadDetails();
  };

  const handleDeleteLead = async () => {
    // Use lead ID from state, fallback to URL param
    const leadId = lead?.id || id;

    if (!leadId) {
      toast.error("No lead ID found");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${lead?.name || "this lead"}"?`,
      )
    )
      return;

    try {
      console.log("Deleting lead with ID:", leadId);
      await LeadAPI.deleteLead(leadId);
      toast.success("Lead deleted successfully");
      navigate("/dashboard/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete lead";
      toast.error(errorMessage);
    }
  };

  // Function to refresh just the notes without clearing other data
  const refreshNotes = async () => {
    const leadId = lead?.id || id;
    if (!leadId) return;

    try {
      setLoadingNotes(true);
      const notesData = await LeadAPI.getLeadNotes(leadId);
      console.log("Notes refreshed:", notesData?.length || 0);
      setNotes(notesData || []);
    } catch (error) {
      console.error("Error refreshing notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    // Use lead ID from state, fallback to URL param
    const leadId = lead?.id || id;

    if (!leadId) {
      toast.error("No lead ID found");
      return;
    }

    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setAddingNote(true);
    try {
      console.log("Adding note to lead with ID:", leadId);
      // Use the new API endpoint for adding notes
      const addedNote = await LeadAPI.addLeadNote(leadId, {
        content: newNote.trim(),
        type: "GENERAL",
      });

      console.log("Note added successfully:", addedNote);
      toast.success("Note added successfully");
      setNewNote("");

      // Optimistically add the new note to the top of the list
      setNotes([addedNote, ...notes]);

      // Refresh notes from API to ensure consistency
      await refreshNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add note";
      toast.error(errorMessage);
    } finally {
      setAddingNote(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // References handlers
  // Note: actual API upload/delete is handled inside LeadReferencesManager.
  // These handlers only keep local React state in sync.
  const handleAddReference = (
    reference: Omit<LeadReference, "id" | "leadId" | "uploadedAt">,
  ) => {
    const newReference: LeadReference = {
      ...reference,
      // id may already be set by the manager (to the real attachment uuid)
      id: (reference as any).id || `ref-${Date.now()}`,
      leadId: lead?.id || id || "",
      uploadedAt: new Date().toISOString(),
    };
    setReferences((prev) => [...prev, newReference]);
  };

  const handleDeleteReference = (referenceId: string) => {
    setReferences((prev) => prev.filter((ref) => ref.id !== referenceId));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "from-emerald-500 to-green-500";
    if (score >= 40) return "from-amber-500 to-yellow-500";
    return "from-red-500 to-orange-500";
  };

  const formatEnum = (value: string): string =>
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return <PageLoader message="Loading lead details..." />;
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Lead Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The lead you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          onClick={() => navigate("/dashboard/leads")}
          className="rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  const score = lead.score || 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <button
              onClick={() => navigate("/dashboard/leads")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Leads</span>
            </button>
          </div>

          {/* Lead Header */}
          <div className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-orange-200/50">
                    {(lead.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                {/* Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {safeDisplay(lead.name, "Unknown Lead")}
                    </h1>
                    {lead.priority === "high" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                        <Sparkles className="w-3 h-3" />
                        Hot Lead
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {lead.phone &&
                      lead.phone !== "undefined" &&
                      lead.phone !== "null" && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    {lead.email &&
                      lead.email !== "undefined" &&
                      lead.email !== "null" && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    {lead.source && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-blue-700">
                          {getSourceLabel(lead.source)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.status === "QUALIFIED" ||
                        lead.status === "Qualified"
                          ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                          : lead.status === "WORKING" ||
                              lead.status === "Contacted"
                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20"
                            : lead.status === "DISQUALIFIED" ||
                                lead.status === "Disqualified"
                              ? "bg-red-100 text-red-700 ring-1 ring-red-600/20"
                              : lead.status === "CONVERTED" ||
                                  lead.status === "Won"
                                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20"
                                : lead.status === "NEW" || lead.status === "New"
                                  ? "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20"
                                  : lead.status === "Proposal"
                                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-600/20"
                                    : "bg-gray-100 text-gray-700 ring-1 ring-gray-600/20"
                      }`}
                    >
                      {lead.status || lead.stage || "New"}
                    </span>
                    {score > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-700">
                          {score}% Score
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowEditModal(true)}
                  className="rounded-xl"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Lead
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDeleteLead}
                  className="rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    console.log("Convert to Customer button clicked!");
                    console.log("Current lead state:", lead);
                    console.log("Lead ID from state:", lead?.id);
                    setShowConvertModal(true);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50"
                >
                  <Building2 className="w-4 h-4" />
                  Convert to Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lead Score Card */}
            {score > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getScoreBg(score)} flex items-center justify-center`}
                      >
                        <Target className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          Lead Score
                        </h3>
                        <p className="text-xs text-gray-500">
                          Engagement & profile
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(score)}`}
                    >
                      {score}%
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(score)} transition-all duration-700`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Contact Information
                </h3>
              </div>
              <div className="p-4">
                {!lead.phone &&
                !lead.email &&
                !lead.location &&
                !lead.city &&
                !lead.source ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-3">
                      No contact information available
                    </p>
                    <button
                      onClick={() => navigate(`/dashboard/leads/${id}/edit`)}
                      className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Add Contact Details →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lead.phone &&
                      lead.phone !== "undefined" &&
                      lead.phone !== "null" && (
                        <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Phone
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {lead.phone}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(lead.phone!, "Phone")
                            }
                            className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      )}

                    {lead.email &&
                      lead.email !== "undefined" &&
                      lead.email !== "null" && (
                        <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">
                              Email
                            </p>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {lead.email}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(lead.email!, "Email")
                            }
                            className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      )}

                    {(lead.location || lead.city) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Location
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.location || lead.city}
                          </p>
                        </div>
                      </div>
                    )}

                    {lead.source && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Source</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {getSourceLabel(lead.source)}
                          </p>
                          {lead.sourceDetails &&
                            Object.values(lead.sourceDetails).some(Boolean) && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(lead.sourceDetails)
                                  .filter(([, v]) => v)
                                  .map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                                    >
                                      {k}: {v}
                                    </span>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {lead.assignedTo && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Assigned To
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.assignedTo.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {lead.companyName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Company
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.companyName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Requirements - Only show if data exists */}
            {(lead.propertyType ||
              lead.bhkConfig ||
              lead.carpetArea ||
              lead.budget ||
              lead.budgetRange ||
              lead.timeline ||
              (lead.scopeOfWork && lead.scopeOfWork.length > 0) ||
              (lead.servicesInterested && lead.servicesInterested.length > 0) ||
              lead.serviceInterest ||
              lead.homeType ||
              lead.projectType ||
              lead.propertyProjectType ||
              lead.area ||
              lead.startTimeline ||
              lead.budgetComfort ||
              lead.projectScope) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Project Requirements
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Primary Details Grid */}
                  {(lead.serviceInterest ||
                    lead.propertyType ||
                    lead.homeType ||
                    lead.bhkConfig ||
                    lead.projectType) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {lead.serviceInterest && (
                        <div className="p-3 bg-amber-50 rounded-lg text-center">
                          <Wrench className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">
                            Service Interest
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatEnum(lead.serviceInterest)}
                          </p>
                        </div>
                      )}
                      {lead.propertyType && (
                        <div className="p-3 bg-orange-50 rounded-lg text-center">
                          <Building2 className="w-5 h-5 text-orange-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">
                            Property Type
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatEnum(lead.propertyType)}
                          </p>
                        </div>
                      )}
                      {(lead.homeType || lead.bhkConfig) && (
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <Home className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">
                            Home Type
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {lead.homeType
                              ? formatEnum(lead.homeType)
                              : lead.bhkConfig}
                          </p>
                        </div>
                      )}
                      {lead.projectType && (
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <Layers className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">
                            Project Type
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatEnum(lead.projectType)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Secondary Details Grid */}
                  {(lead.propertyProjectType ||
                    lead.projectStage ||
                    lead.area ||
                    lead.carpetArea) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {lead.propertyProjectType && (
                        <div className="p-3 bg-teal-50 rounded-lg text-center">
                          <Target className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">
                            Property Project
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatEnum(lead.propertyProjectType)}
                          </p>
                        </div>
                      )}
                      {lead.projectStage && (
                        <div className="p-3 bg-indigo-50 rounded-lg text-center">
                          <ArrowRight className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">
                            Project Stage
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatEnum(lead.projectStage)}
                          </p>
                        </div>
                      )}
                      {(lead.area || lead.carpetArea) && (
                        <div className="p-3 bg-pink-50 rounded-lg text-center">
                          <Ruler className="w-5 h-5 text-pink-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">Area</p>
                          <p className="text-sm font-bold text-gray-900">
                            {lead.area || lead.carpetArea} sqft
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  {(lead.startTimeline || lead.timeline) && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">
                          Start Timeline
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.startTimeline
                            ? formatEnum(lead.startTimeline)
                            : lead.timeline}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {(lead.budgetComfort || lead.budgetRange || lead.budget) && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">
                          Budget Comfort
                        </p>
                        <p className="text-sm font-semibold text-green-700">
                          {lead.budgetComfort
                            ? formatEnum(lead.budgetComfort)
                            : lead.budgetRange || lead.budget}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Project Scope */}
                  {(lead.projectScope ||
                    (lead.scopeOfWork && lead.scopeOfWork.length > 0)) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Project Scope
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lead.projectScope ? (
                          <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                            {formatEnum(lead.projectScope)}
                          </span>
                        ) : (
                          lead.scopeOfWork?.map((scope, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                            >
                              {scope}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {lead.servicesInterested &&
                    lead.servicesInterested.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Services Interested
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {lead.servicesInterested.map((service, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Floor Plan URL - Show either from Lead Details or Attachments API */}
            {(resolvedFloorPlanUrl || floorPlanAttachment) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      <h3 className="font-semibold text-gray-900 text-sm">
                        Floor Plan
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => handleDownloadFloorPlan(resolvedFloorPlanUrl)}
                      className="w-full group flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-200 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                            {floorPlanAttachment?.fileName ||
                              getFloorPlanDisplayName(resolvedFloorPlanUrl)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Click to view document
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </button>
                  </div>
                </div>
              )}

            {/* Referral & Agent - Only show if data exists */}
            {(lead.referrerName ||
              lead.referrerPhone ||
              lead.referrerProjectNumber ||
              lead.agentAgencyName) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Referral & Agent
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {lead.referrerName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Referrer Name
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.referrerName}
                        </p>
                        {lead.referrerPhone && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {lead.referrerPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {lead.referrerProjectNumber && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Referrer Project No.
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.referrerProjectNumber}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.agentAgencyName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Agency</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.agentAgencyName}
                        </p>
                        {lead.agentAgencyDetails && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {lead.agentAgencyDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Design Preferences - Only show if data exists */}
            {((lead.designStyle && lead.designStyle.length > 0) ||
              (lead.colorPreferences && lead.colorPreferences.length > 0)) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Design Preferences
                  </h3>
                </div>
                <div className="p-3">
                  {lead.designStyle && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Preferred Style
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(lead.designStyle)
                          ? lead.designStyle
                          : [lead.designStyle]
                        ).map((style, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded text-xs font-medium"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lead.colorPreferences &&
                    lead.colorPreferences.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Colors
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.colorPreferences.map((color, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Notes & Communication
                </h3>
              </div>
              <div className="p-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    size="sm"
                    className="rounded-lg bg-orange-500 hover:bg-orange-600 text-xs px-3 py-1.5"
                  >
                    {addingNote ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    Add Note
                  </Button>
                </div>

                {/* Display notes from API */}
                {loadingNotes ? (
                  <div className="mt-3 flex justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : notes.length > 0 ? (
                  <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900">
                            {note.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        {note.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            By: {note.createdBy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 p-4 text-center">
                    <p className="text-xs text-gray-500">
                      No notes yet. Add your first note above.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* References & Inspirations */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  References & Inspirations
                </h3>
              </div>
              <div className="p-4">
                <LeadReferencesManager
                  leadId={lead.id || id || ""}
                  references={references}
                  onAddReference={handleAddReference}
                  onDeleteReference={handleDeleteReference}
                  readOnly={false}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Timeline
                </h3>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {lead.createdAt
                      ? new Date(lead.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">Last Contact</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {new Date(lead.lastContactedAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                )}
                {lead.followUpDate && (
                  <div className="flex items-center justify-between px-2 py-1.5 bg-orange-50 rounded-md -mx-1">
                    <span className="text-xs text-orange-700 font-medium">
                      Follow-up
                    </span>
                    <span className="text-xs font-bold text-orange-700">
                      {new Date(lead.followUpDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {lead.expectedStartDate && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">
                      Expected Start
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {new Date(lead.expectedStartDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Converted to Customer Banner */}
            {lead.convertedToAccount && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900 text-sm">
                    Converted to Customer
                  </h3>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-3 p-2.5 bg-white/80 rounded-lg border border-emerald-100">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {lead.convertedToAccount.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lead.convertedToAccount.type || "Customer"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/dashboard/customers/${lead.convertedToAccount!.id}`,
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contacts */}
            {contacts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Contacts
                    </h3>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                      {contacts.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-1.5">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">
                            {(contact.firstName || "U")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {contact.firstName}
                            {contact.lastName ? ` ${contact.lastName}` : ""}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {contact.role && (
                              <span className="text-[10px] text-gray-500 capitalize">
                                {contact.role.toLowerCase().replace("_", " ")}
                              </span>
                            )}
                            {contact.isPrimary && (
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-semibold">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 pl-10">
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 group">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] text-gray-600">
                              {contact.phone}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(contact.phone!, "Phone")
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1.5 group">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] text-gray-600 truncate">
                              {contact.email}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(contact.email!, "Email")
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        )}
                        {contact.preferredChannel && (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-500">
                              Prefers: {contact.preferredChannel.toLowerCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage History */}
            {stageHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Stage History
                  </h3>
                </div>
                <div className="p-3">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200"></div>
                    <div className="space-y-3">
                      {stageHistory.map((stage, idx) => {
                        const stageColors: Record<string, string> = {
                          NEW: "bg-amber-400",
                          WORKING: "bg-blue-400",
                          QUALIFIED: "bg-green-400",
                          DISQUALIFIED: "bg-red-400",
                          CONVERTED: "bg-emerald-500",
                        };
                        const dotColor =
                          stageColors[stage.toStage] || "bg-gray-400";

                        return (
                          <div key={stage.id} className="relative flex gap-3">
                            <div
                              className={`w-[22px] h-[22px] rounded-full ${dotColor} flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white`}
                            >
                              {idx === 0 ? (
                                <CheckCircle className="w-3 h-3 text-white" />
                              ) : (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-gray-900">
                                  {stage.toStage}
                                </span>
                                {stage.fromStage !== stage.toStage && (
                                  <span className="text-[10px] text-gray-400">
                                    from {stage.fromStage}
                                  </span>
                                )}
                              </div>
                              {stage.reason && (
                                <p className="text-[11px] text-gray-600 mb-0.5">
                                  {stage.reason}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">
                                  {new Date(stage.changedAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                {stage.changedByUser && (
                                  <span className="text-[10px] text-gray-400">
                                    • {stage.changedByUser.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activities */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Recent Activities
                </h3>
                {activities.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">
                    {activities.length}
                  </span>
                )}
              </div>
              <div className="p-2">
                {activities.length > 0 ? (
                  <div className="space-y-1.5">
                    {activities.map((activity) => {
                      // Determine icon and color based on activity type
                      const activityType =
                        activity.activityType || activity.type || "GENERAL";
                      const getActivityStyle = (type: string) => {
                        switch (type) {
                          case "NOTE_ADDED":
                            return {
                              icon: (
                                <MessageSquare className="w-3 h-3 text-blue-500" />
                              ),
                              bg: "bg-blue-50",
                              border: "border-blue-100",
                            };
                          case "STATUS_CHANGED":
                          case "STAGE_CHANGED":
                            return {
                              icon: (
                                <TrendingUp className="w-3 h-3 text-purple-500" />
                              ),
                              bg: "bg-purple-50",
                              border: "border-purple-100",
                            };
                          case "MEETING_SCHEDULED":
                            return {
                              icon: (
                                <Calendar className="w-3 h-3 text-orange-500" />
                              ),
                              bg: "bg-orange-50",
                              border: "border-orange-100",
                            };
                          case "CALL_MADE":
                          case "CALL_RECEIVED":
                            return {
                              icon: (
                                <Phone className="w-3 h-3 text-green-500" />
                              ),
                              bg: "bg-green-50",
                              border: "border-green-100",
                            };
                          case "EMAIL_SENT":
                            return {
                              icon: (
                                <Mail className="w-3 h-3 text-indigo-500" />
                              ),
                              bg: "bg-indigo-50",
                              border: "border-indigo-100",
                            };
                          case "LEAD_CREATED":
                            return {
                              icon: <Star className="w-3 h-3 text-amber-500" />,
                              bg: "bg-amber-50",
                              border: "border-amber-100",
                            };
                          default:
                            return {
                              icon: <Clock className="w-3 h-3 text-gray-500" />,
                              bg: "bg-gray-50",
                              border: "border-gray-100",
                            };
                        }
                      };
                      const style = getActivityStyle(activityType);
                      const activityTitle =
                        activity.title ||
                        activityType
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/^\w/, (c) => c.toUpperCase());
                      const activityNotes =
                        activity.notes || activity.description || "";
                      const activityTime =
                        activity.occurredAt || activity.createdAt;
                      const performedBy =
                        activity.performedByUser?.name ||
                        activity.createdBy ||
                        "";

                      return (
                        <div
                          key={activity.id}
                          className={`flex gap-2.5 p-2.5 ${style.bg} rounded-lg border ${style.border}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900">
                              {activityTitle}
                            </p>
                            {activityNotes && (
                              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                {activityNotes}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-400">
                                {activityTime
                                  ? new Date(activityTime).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )
                                  : ""}
                              </span>
                              {performedBy && (
                                <span className="text-[10px] text-gray-400">
                                  • {performedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">No activities yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Account Modal */}
      {showConvertModal && lead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Convert Lead to Customer
                </h2>
                <p className="text-sm text-gray-600">
                  Transform this lead into a customer
                </p>
              </div>
              <button
                onClick={() => {
                  console.log("Close modal button clicked");
                  setShowConvertModal(false);
                }}
                className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Lead Information */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Current Lead Information
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {safeDisplay(lead.name, "Unknown")}
                  </p>
                  {lead.email &&
                    lead.email !== "undefined" &&
                    lead.email !== "null" && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {lead.email}
                      </p>
                    )}
                  {lead.phone &&
                    lead.phone !== "undefined" &&
                    lead.phone !== "null" && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {lead.phone}
                      </p>
                    )}
                  {lead.source && (
                    <p className="text-sm text-gray-600">
                      Source: {lead.source}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">
                      New Customer Preview
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-800">
                        <span className="font-medium">Customer Name:</span>{" "}
                        {safeDisplay(lead.name, "Unknown Customer")}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          This lead will be converted into a customer and
                          removed from the leads list. All contact information
                          will be preserved.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  console.log("Cancel button clicked");
                  setShowConvertModal(false);
                }}
                disabled={isConverting}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Convert button clicked!");
                  console.log("Lead:", lead);
                  console.log("Lead ID:", lead?.id);
                  console.log("Lead Name:", lead?.name);
                  handleConvertToCustomer();
                }}
                disabled={isConverting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Convert to Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      <LeadModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        lead={lead}
        onSave={handleEditSave}
        sources={leadSources}
        users={teamUsers}
      />
    </div>
  );
};

export default LeadDetails;
