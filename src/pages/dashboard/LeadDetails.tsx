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
  IndianRupee,
  Ruler,
  ArrowRight,
  Check,
  X,
  Image as ImageIcon,
  Pencil,
  Layers,
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
import { useAuth } from "../../contexts/AuthContext";
import CustomerAPI from "../../services/customerApi";
import toast from "react-hot-toast";
import { getSourceLabel } from "../../utils/leadHelpers";
import { LeadReferencesManager } from "../../components/leads";
import { LeadReference } from "../../types";
import { listAttachments, Attachment } from "../../services/attachmentApi";

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const formatEnum = (value: string): string =>
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const assignedToDisplayName =
    lead?.assignedTo?.name ||
    (lead?.assignedToId
      ? teamUsers.find((u) => u.id === lead.assignedToId)?.name || lead.assignedToId
      : "");

  const secondaryEmails = (lead?.secondaryEmails || [])
    .map((email) => (email || "").trim())
    .filter(Boolean);
  const secondaryPhones = (lead?.secondaryPhones || [])
    .map((phone) => (phone || "").trim())
    .filter(Boolean);

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
                    {lead.leadNumber && (
                      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                        Lead No: {lead.leadNumber}
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
                secondaryPhones.length === 0 &&
                secondaryEmails.length === 0 &&
                !lead.location &&
                !lead.city &&
                (lead.score === undefined || lead.score === null) &&
                !lead.siteContactName &&
                !lead.siteContactPhone &&
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

                    {secondaryPhones.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Secondary Phones</p>
                          <div className="space-y-1">
                            {secondaryPhones.map((phone, idx) => (
                              <p key={`secondary-phone-${idx}`} className="text-sm font-semibold text-gray-900">
                                {phone}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {typeof lead.canWhatsApp === "boolean" && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            WhatsApp Available
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.canWhatsApp ? "Yes" : "No"}
                          </p>
                        </div>
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

                    {secondaryEmails.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Secondary Emails</p>
                          <div className="space-y-1">
                            {secondaryEmails.map((email, idx) => (
                              <p key={`secondary-email-${idx}`} className="text-sm font-semibold text-gray-900 break-all">
                                {email}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {lead.location && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Location
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {lead.city && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">City</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.city}
                          </p>
                        </div>
                      </div>
                    )}

                    {(lead.score || lead.score === 0) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Lead Score
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.score}/100
                          </p>
                        </div>
                      </div>
                    )}

                    {(lead.siteContactName || lead.siteContactPhone) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Site Contact
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {safeDisplay(lead.siteContactName, "Not provided")}
                          </p>
                          {lead.siteContactPhone && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {lead.siteContactPhone}
                            </p>
                          )}
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
                        </div>
                      </div>
                    )}

                    {assignedToDisplayName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">
                            Assigned To
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {assignedToDisplayName}
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

            {/* Project Requirements - Show all mapped API fields */}
            {(lead.projectCategory ||
              lead.propertyType ||
              lead.projectType ||
              lead.pipelineType ||
              lead.scopeType ||
              lead.projectStage ||
              lead.startTimeline ||
              lead.budgetComfort ||
              lead.projectScope ||
              lead.propertySubtype ||
              lead.propertyBHK ||
              lead.budgetTier ||
              lead.area ||
              lead.area === 0 ||
              lead.city ||
              lead.propertySizeSqft ||
              lead.propertySizeSqft === 0 ||
              lead.constructionStatus ||
              lead.tentativeHandoverDate ||
              lead.propertyAddress ||
              lead.propertyState ||
              lead.propertyPincode ||
              lead.propertyBuilding ||
              lead.propertyUnit ||
              lead.propertyLandmarks ||
              lead.location ||
              lead.designPackage ||
              lead.requirements ||
              lead.specialRequirements ||
              lead.message ||
              typeof lead.wantsExperienceCenterVisit === "boolean") && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Project Requirements
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {lead.projectCategory && (
                      <div className="p-3 bg-amber-50 rounded-lg text-center">
                        <Home className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Project Category</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.projectCategory)}</p>
                      </div>
                    )}
                    {lead.propertyType && (
                      <div className="p-3 bg-slate-50 rounded-lg text-center">
                        <Building2 className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Property Type</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.propertyType)}</p>
                      </div>
                    )}
                    {lead.projectType && (
                      <div className="p-3 bg-cyan-50 rounded-lg text-center">
                        <Layers className="w-5 h-5 text-cyan-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Project Type</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.projectType)}</p>
                      </div>
                    )}
                    {lead.city && (
                      <div className="p-3 bg-emerald-50 rounded-lg text-center">
                        <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">City</p>
                        <p className="text-sm font-bold text-gray-900">{lead.city}</p>
                      </div>
                    )}
                    {lead.pipelineType && (
                      <div className="p-3 bg-orange-50 rounded-lg text-center">
                        <Layers className="w-5 h-5 text-orange-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Pipeline Type</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.pipelineType)}</p>
                      </div>
                    )}
                    {lead.scopeType && (
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <Wrench className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Scope Type</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.scopeType)}</p>
                      </div>
                    )}
                    {lead.projectStage && (
                      <div className="p-3 bg-fuchsia-50 rounded-lg text-center">
                        <ArrowRight className="w-5 h-5 text-fuchsia-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Project Stage</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.projectStage)}</p>
                      </div>
                    )}
                    {lead.startTimeline && (
                      <div className="p-3 bg-yellow-50 rounded-lg text-center">
                        <Clock className="w-5 h-5 text-yellow-700 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Start Timeline</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.startTimeline)}</p>
                      </div>
                    )}
                    {lead.budgetComfort && (
                      <div className="p-3 bg-lime-50 rounded-lg text-center">
                        <IndianRupee className="w-5 h-5 text-lime-700 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Budget Comfort</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.budgetComfort)}</p>
                      </div>
                    )}
                    {lead.projectScope && (
                      <div className="p-3 bg-rose-50 rounded-lg text-center">
                        <Wrench className="w-5 h-5 text-rose-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Project Scope</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.projectScope)}</p>
                      </div>
                    )}
                    {lead.designPackage && (
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <Palette className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Design Package</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.designPackage)}</p>
                      </div>
                    )}
                    {lead.propertySubtype && (
                      <div className="p-3 bg-teal-50 rounded-lg text-center">
                        <Building2 className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Property Subtype</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.propertySubtype)}</p>
                      </div>
                    )}
                    {lead.propertyBHK && (
                      <div className="p-3 bg-indigo-50 rounded-lg text-center">
                        <Home className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Property BHK</p>
                        <p className="text-sm font-bold text-gray-900">{lead.propertyBHK}</p>
                      </div>
                    )}
                    {(lead.area || lead.area === 0 || lead.propertySizeSqft || lead.propertySizeSqft === 0) && (
                      <div className="p-3 bg-pink-50 rounded-lg text-center">
                        <Ruler className="w-5 h-5 text-pink-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Size</p>
                        <p className="text-sm font-bold text-gray-900">{lead.area ?? lead.propertySizeSqft} sqft</p>
                      </div>
                    )}
                    {lead.budgetTier && (
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <IndianRupee className="w-5 h-5 text-green-600 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500 mb-1">Budget Tier</p>
                        <p className="text-sm font-bold text-gray-900">{formatEnum(lead.budgetTier)}</p>
                      </div>
                    )}
                  </div>

                  {(lead.constructionStatus || lead.tentativeHandoverDate || typeof lead.wantsExperienceCenterVisit === "boolean") && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {lead.constructionStatus && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600 mb-0.5">Construction Status</p>
                            <p className="text-sm font-semibold text-gray-900">{formatEnum(lead.constructionStatus)}</p>
                          </div>
                        </div>
                      )}
                      {lead.tentativeHandoverDate && (
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="text-xs text-gray-600 mb-0.5">Tentative Handover</p>
                            <p className="text-sm font-semibold text-gray-900">{new Date(lead.tentativeHandoverDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      {typeof lead.wantsExperienceCenterVisit === "boolean" && (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600 mb-0.5">Experience Center Visit</p>
                            <p className="text-sm font-semibold text-gray-900">{lead.wantsExperienceCenterVisit ? "Yes" : "No"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(lead.propertyAddress || lead.propertyBuilding || lead.propertyUnit || lead.propertyState || lead.propertyPincode || lead.propertyLandmarks || lead.location) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Property Address</p>
                      <div className="space-y-2 text-sm">
                        {lead.propertyAddress && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">Address:</span><span className="font-medium text-right">{lead.propertyAddress}</span></div>
                        )}
                        {lead.location && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">Locality:</span><span className="font-medium text-right">{lead.location}</span></div>
                        )}
                        {lead.propertyBuilding && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">Building:</span><span className="font-medium text-right">{lead.propertyBuilding}</span></div>
                        )}
                        {lead.propertyUnit && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">Unit:</span><span className="font-medium text-right">{lead.propertyUnit}</span></div>
                        )}
                        {lead.propertyState && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">State:</span><span className="font-medium text-right">{lead.propertyState}</span></div>
                        )}
                        {lead.propertyPincode && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">Pincode:</span><span className="font-medium text-right">{lead.propertyPincode}</span></div>
                        )}
                        {lead.propertyLandmarks && (
                          <div className="flex justify-between gap-3"><span className="text-gray-600">Landmarks:</span><span className="font-medium text-right">{lead.propertyLandmarks}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {(lead.requirements || lead.specialRequirements || lead.message) && (
                    <div className="space-y-2">
                      {lead.requirements && (
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Requirements</p>
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{lead.requirements}</p>
                        </div>
                      )}
                      {lead.specialRequirements && (
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Special Requirements</p>
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{lead.specialRequirements}</p>
                        </div>
                      )}
                      {lead.message && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Message</p>
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{lead.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floor Plan URL - Show either from Lead Details or Attachments API - REMOVED from UI */}


            {/* Referral & Agent - Only show if data exists */}
            {(lead.referrerName ||
              lead.referrerPhone ||
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

                  {lead.referrerPhone && !lead.referrerName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Referrer Phone
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.referrerPhone}
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
                        {(note.createdByName || note.createdBy) && (
                          <p className="text-xs text-gray-500 mt-1">
                            By:{" "}
                            {note.createdByName ||
                              (note.createdBy === user?.id
                                ? user?.name
                                : teamUsers.find((u) => u.id === note.createdBy)
                                    ?.name) ||
                              note.createdBy}
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
            {/* Record Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Record Info
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
                {lead.updatedAt && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">Updated</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {new Date(lead.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
