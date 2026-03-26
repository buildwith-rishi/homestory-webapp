import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { hasPermission, RoleId } from "../../config/rbac";
import {
  ArrowLeft,
  Calendar,
  Users,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  Edit3,
  Trash2,
  Upload,
  X,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Mail,

  MessageSquare,
  Send,
  BellRing,
  FileUp,
  Play,
  Pause,
  StopCircle,
  Ban,
  Image,
  Gift,

  Plus,
  Paperclip,
  Pencil,
  Eye,
  UserCircle,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  PageLoader,
} from "../../components/ui";
import { ProjectStagesSection } from "../../components/dashboard/stages";
import { TestimonialsTab } from "../../components/dashboard/testimonials";
import { ProjectReferencesTab } from "../../components/dashboard/references";
import { HandoverTab } from "../../components/dashboard/handover";
import toast from "react-hot-toast";
import { useProjectStore } from "../../stores/projectStore";
import { useProjectOptions } from "../../hooks/useProjectOptions";
import {
  Project,
  ProjectPayment,
  PaymentStatus,
  UpdateProjectRequest,
  CreatePaymentRequest,
} from "../../types";
import {
  sendPaymentInvoice,
  uploadPaymentDocument,
  sendPaymentReminder,
} from "../../services/projectApi";
import { getLeadById } from "../../services/leadApi";
import {
  createActivity,
} from "../../services/activitiesApi";
import {
  getAllTeamMembers,
  TeamMember,
} from "../../services/teamApi";
import {
  getAttachment,
  listAttachments,
  uploadAttachment,
  updateAttachment,
  deleteAttachment,
  Attachment,
  AttachmentType,
} from "../../services/attachmentApi";


// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

// Helper function to format currency exactly
const formatCurrencyExact = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmailList = (value: string): string[] =>
  value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);

type PaymentDocumentListItem = {
  url: string;
  fileName: string;
  documentType: string;
};

const mergeUniquePaymentDocuments = (
  existing: PaymentDocumentListItem[],
  incoming: PaymentDocumentListItem[],
): PaymentDocumentListItem[] => {
  if (!incoming.length) return existing;
  const merged = [...existing];
  incoming.forEach((doc) => {
    if (!doc.url) return;
    if (!merged.some((existingDoc) => existingDoc.url === doc.url)) {
      merged.push(doc);
    }
  });
  return merged;
};

// Helper function to format date
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const toDateInputValue = (dateString: string | undefined | null): string => {
  if (!dateString) return "";
  // Preserve API calendar date values (e.g. 2026-03-19T00:00:00.000Z) without timezone drift.
  if (dateString.includes("T")) {
    return dateString.split("T")[0];
  }
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format enum values to human-readable labels
const formatEnumLabel = (value: string | undefined | null): string => {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/AND/g, "&")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Stage label mapping for new API stage codes
const getStageLabel = (code: string): string => {
  const map: Record<string, string> = {
    ENQUIRY: "Enquiry",
    DESIGN_SIGNUP: "Design Signup",
    DESIGN: "Design",
    FIRST_PRESENTATION: "First Presentation",
    FINAL_DESIGN: "Final Design",
    COSTING: "Costing",
    EXECUTION: "Execution",
    HANDOVER: "Handover",
    TESTIMONIAL: "Testimonial",
  };
  return (
    map[code] ||
    code
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

// Get status display — handles API uppercase values
const getStatusDisplay = (
  project: Project,
): { label: string; className: string } => {
  const status = (project.status || "").toUpperCase();
  if (status === "COMPLETED") {
    return {
      label: "COMPLETED",
      className: "bg-green-100 text-green-700 border-green-200",
    };
  }
  if (status === "PAUSED" || status === "ON_HOLD") {
    return {
      label: status === "PAUSED" ? "PAUSED" : "ON HOLD",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  }
  if (status === "CANCELLED") {
    return {
      label: "CANCELLED",
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }
  if (status === "YET_TO_START") {
    return {
      label: "YET TO START",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };
  }
  if (status === "ONGOING") {
    return {
      label: "ONGOING",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }
  return {
    label: "ACTIVE",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  };
};

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { roleId, user } = useAuth();
  
  // Permissions
  const canCreatePayment = hasPermission(roleId as RoleId, "payments.create");
  const canUpdatePayment = hasPermission(roleId as RoleId, "payments.update");
  const canDeletePayment = hasPermission(roleId as RoleId, "payments.delete");
  // Basic check for project editing (further scoped by assignment for designers)
  const canEditProjectBase = hasPermission(roleId as RoleId, "projects.update");



  // Store
  const {
    currentProject,
    projectPayments,
    projectStages,
    error,
    pauseStatus,
    fetchProjectById,
    fetchProjectStages,
    fetchProjectPayments,
    updateProjectPayment,
    createProjectPayment,
    deleteProjectPayment,
    updateProject,
    deleteProject,
    clearError,
    startProject,
    pauseProject,
    resumeProject,
    completeProject,
    cancelProject,
    fetchPauseStatus,
    setCurrentProject,
    mergePaymentUpdate,
    fetchPaymentById,
  } = useProjectStore();

  const isAssigned = useMemo(() => {
    if (!currentProject || !user) return false;
    // Check precise ID matches first
    if (currentProject.assignedDesignerId === user.id) return true;
    if (currentProject.assignedPMId === user.id) return true;
    
    // Fallback: Check name matches in string arrays (designTeam, executionTeam are string[])
    if (currentProject.designTeam?.includes(user.name)) return true;
    if (currentProject.executionTeam?.includes(user.name)) return true;
    
    return false;
  }, [currentProject, user]);

  const canEditProject =
    roleId === "SUPER_ADMIN" ||
    roleId === "ADMIN" ||
    roleId === "LEAD_PROJECT_MANAGER" ||
    (canEditProjectBase && (roleId !== "DESIGNER" || isAssigned));

  const canDeleteProject = hasPermission(roleId as RoleId, "projects.delete");

  // Project options from API


  // Local state
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "stages"
    | "payments"
    | "references"
    | "testimonials"
    | "handover"
  >("overview");

  // Payment update modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ProjectPayment | null>(
    null,
  );
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    status: "COLLECTED" as string,
    actualAmount: "",
    paymentMethod: "" as string,
    transactionRef: "",
    notes: "",
  });

  // Payment phase sub-tab
  const [paymentPhaseTab, setPaymentPhaseTab] = useState<
    "DESIGN" | "EXECUTION"
  >("DESIGN");

  // Add payment milestone modal
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isSavingNewPayment, setIsSavingNewPayment] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    title: "",
    description: "",
    stageCode: "",
    projectStageId: "",
    phaseType: "DESIGN" as string,
    paymentStage: 1,
    percentage: 0,
    expectedAmount: "",
    invoiceAmount: "",
    taxPercentage: "",
    dueDate: "",
    notes: "",
    status: PaymentStatus.PENDING as string,
  });

  const [paymentFormErrors, setPaymentFormErrors] = useState({
    percentage: "",
    expectedAmount: "",
    taxPercentage: "",
    invoiceAmount: "",
  });

  // Send Invoice modal state
  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState(false);
  const [invoiceTargetPayment, setInvoiceTargetPayment] =
    useState<ProjectPayment | null>(null);
  const [invoiceSendMode, setInvoiceSendMode] =
    useState<"invoice" | "proforma">("invoice");
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [showInvoiceSentSuccessModal, setShowInvoiceSentSuccessModal] =
    useState(false);
  const [invoiceSentSuccessMessage, setInvoiceSentSuccessMessage] =
    useState("");
  const [sendInvoiceForm, setSendInvoiceForm] = useState({
    toEmail: "",
    ccEmails: "",
    toName: "",
    accountName: "GoodHomeStory Interiors Pvt Ltd",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    customMessage: "",
    attachments: [] as Array<{
      fileName: string;
      fileType: string;
      fileBase64: string;
    }>,
  });

  // Upload Document modal state
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docTargetPayment, setDocTargetPayment] =
    useState<ProjectPayment | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocForm, setUploadDocForm] = useState({
    documentType: "receipt" as "receipt" | "invoice" | "other",
  });
  const [uploadDocFiles, setUploadDocFiles] = useState<
    Array<{ fileName: string; fileType: string; fileBase64: string }>
  >([]);

  // View Receipts modal state
  const [showViewReceiptsModal, setShowViewReceiptsModal] = useState(false);
  const [viewReceiptsPayment, setViewReceiptsPayment] =
    useState<ProjectPayment | null>(null);
  const [viewReceiptsLoading, setViewReceiptsLoading] = useState(false);
  // Tracks all uploaded document URLs per payment
  const [paymentDocumentsMap, setPaymentDocumentsMap] = useState<
    Record<string, PaymentDocumentListItem[]>
  >({});
  const hydratedPaymentsRef = useRef<Record<string, true>>({});

  const paymentDocumentsStorageKey = projectId
    ? `project-payment-documents:${projectId}`
    : null;

  // Send Reminder modal state
  const [showSendReminderModal, setShowSendReminderModal] = useState(false);
  const [reminderTargetPayment, setReminderTargetPayment] =
    useState<ProjectPayment | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [sendReminderForm, setSendReminderForm] = useState({
    toEmail: "",
    toName: "",
    customMessage: "",
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Project attachments state
  const [projectAttachments, setProjectAttachments] = useState<Attachment[]>(
    [],
  );
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showAttachmentUploadModal, setShowAttachmentUploadModal] =
    useState(false);
  const [attachmentUploadContext, setAttachmentUploadContext] = useState<
    "general" | "work"
  >("general");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentUploadForm, setAttachmentUploadForm] = useState({
    attachmentType: "OTHER" as AttachmentType,
    fileName: "",
    fileType: "",
    fileBase64: "",
    notes: "",
  });
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(
    null,
  );
  const [isUpdatingAttachment, setIsUpdatingAttachment] = useState(false);
  const [editAttachmentForm, setEditAttachmentForm] = useState({
    attachmentType: "OTHER" as AttachmentType,
    notes: "",
  });
  const [showWorkAttachmentsModal, setShowWorkAttachmentsModal] =
    useState(false);

  // Edit project modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    projectName: "",
    leadId: "",
    pipelineType: "",
    projectCategory: "",
    scopeType: "",
    budgetTier: "",
    propertySubtype: "",
    propertySizeSqft: "",
    propertyBHK: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyPincode: "",
    propertyBuilding: "",
    propertyUnit: "",
    propertyLandmarks: "",
    siteContactName: "",
    siteContactPhone: "",
    constructionStatus: "",
    tentativeHandoverDate: "",
    specialRequirements: "",
    designTeam: "",
    executionTeam: "",
    assignedDesignerId: "",
    assignedPMId: "",
    designPackage: "",
    design3DStatus: "",
    moodBoardShared: false,
    numberOfMeetings: "",
    currentStageCode: "",
    currentPhase: "",
    totalValue: "",
    designValue: "",
    executionValue: "",
    paidAmount: "",
    billingAddress: "",
    pauseReason: "",
    cancellationReason: "",
    remarks: "",
    status: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (showEditModal) {
      getAllTeamMembers()
        .then((data) => setTeamMembersList(data))
        .catch((err) => console.error("Failed to load team members", err));
    }
  }, [showEditModal]);

  // Pause modal state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseForm, setPauseForm] = useState({ pauseDays: 7, reason: "" });
  const [pauseReasonError, setPauseReasonError] = useState("");
  const [isPausingProject, setIsPausingProject] = useState(false);

  // Status action confirmation
  const [showStatusConfirm, setShowStatusConfirm] = useState<
    "start" | "resume" | "complete" | "cancel" | null
  >(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);



  // Fetch project data on mount
  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
      fetchProjectStages(projectId);
      fetchProjectPayments(projectId);
      fetchProjectAttachments(projectId);
    }
  }, [projectId, fetchProjectById, fetchProjectStages, fetchProjectPayments]);

  // Reset hydrated tracking when project changes
  useEffect(() => {
    hydratedPaymentsRef.current = {};
  }, [projectId]);

  // Restore per-project uploaded documents from local storage so UI persists on refresh.
  useEffect(() => {
    if (!paymentDocumentsStorageKey) return;
    try {
      const raw = localStorage.getItem(paymentDocumentsStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const restored: Record<string, PaymentDocumentListItem[]> = {};

      Object.entries(parsed).forEach(([paymentId, docs]) => {
        if (!Array.isArray(docs)) return;
        const normalizedDocs = docs
          .map((doc) => {
            const item = doc as Partial<PaymentDocumentListItem>;
            if (!item.url || typeof item.url !== "string") return null;
            return {
              url: item.url,
              fileName:
                typeof item.fileName === "string" && item.fileName
                  ? item.fileName
                  : "Document",
              documentType:
                typeof item.documentType === "string" && item.documentType
                  ? item.documentType
                  : "other",
            };
          })
          .filter((doc): doc is PaymentDocumentListItem => doc !== null);

        if (normalizedDocs.length) {
          restored[paymentId] = mergeUniquePaymentDocuments([], normalizedDocs);
        }
      });

      if (Object.keys(restored).length) {
        setPaymentDocumentsMap((prev) => {
          const next = { ...prev };
          Object.entries(restored).forEach(([paymentId, docs]) => {
            next[paymentId] = mergeUniquePaymentDocuments(
              next[paymentId] || [],
              docs,
            );
          });
          return next;
        });
      }
    } catch {
      // Ignore invalid local storage data and continue with API-derived state.
    }
  }, [paymentDocumentsStorageKey]);

  // Persist per-project uploaded documents in local storage.
  useEffect(() => {
    if (!paymentDocumentsStorageKey) return;
    try {
      localStorage.setItem(
        paymentDocumentsStorageKey,
        JSON.stringify(paymentDocumentsMap),
      );
    } catch {
      // Ignore storage quota/errors; UI still works from in-memory state.
    }
  }, [paymentDocumentsMap, paymentDocumentsStorageKey]);

  // Sync paymentDocumentsMap from projectPayments whenever they load/refresh.
  // Merges receiptUrl and documents from each payment so uploaded files remain
  // visible after page reload or any API-triggered payment refresh.
  useEffect(() => {
    if (!projectPayments.length) return;
    setPaymentDocumentsMap((prev) => {
      const next = { ...prev };
      projectPayments.forEach((payment) => {
        const apiDocs: PaymentDocumentListItem[] = [];
        if (payment.documents?.length) {
          payment.documents.forEach((d) => {
            apiDocs.push({
              url: d.url,
              fileName: d.fileName || "Document",
              documentType: d.documentType,
            });
          });
        }
        if (
          payment.receiptUrl &&
          !apiDocs.some((d) => d.url === payment.receiptUrl)
        ) {
          apiDocs.push({
            url: payment.receiptUrl,
            fileName: payment.receiptFileName || "Receipt",
            documentType: "receipt",
          });
        }
        if (apiDocs.length) {
          const existing = next[payment.id] || [];
          next[payment.id] = mergeUniquePaymentDocuments(existing, apiDocs);
        }
      });
      return next;
    });
  }, [projectPayments]);

  // Hydrate each payment from the detail endpoint once so documents[] survives refresh.
  useEffect(() => {
    if (!projectPayments.length) return;
    const pendingHydration = projectPayments.filter(
      (payment) => !hydratedPaymentsRef.current[payment.id],
    );
    if (!pendingHydration.length) return;

    pendingHydration.forEach((payment) => {
      hydratedPaymentsRef.current[payment.id] = true;
      void fetchPaymentById(payment.id);
    });
  }, [projectPayments, fetchPaymentById]);

  const fetchProjectAttachments = async (id: string) => {
    setAttachmentsLoading(true);
    try {
      const items = await listAttachments("PROJECT", id);
      setProjectAttachments(items);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleAttachmentFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAttachmentUploadForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileBase64: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAttachment = async () => {
    if (!projectId) return;
    if (!attachmentUploadForm.fileBase64) {
      toast.error("Please select a file to upload");
      return;
    }
    setIsUploadingAttachment(true);
    try {
      const attachment = await uploadAttachment({
        entityType: "PROJECT",
        entityId: projectId,
        attachmentType:
          attachmentUploadContext === "work"
            ? "QUICK_ACTION"
            : attachmentUploadForm.attachmentType,
        fileName: attachmentUploadForm.fileName,
        fileType: attachmentUploadForm.fileType,
        fileBase64: attachmentUploadForm.fileBase64,
        notes: attachmentUploadForm.notes || undefined,
      });
      setProjectAttachments((prev) => [attachment, ...prev]);
      toast.success("Document uploaded successfully!");
      setShowAttachmentUploadModal(false);
      setAttachmentUploadContext("general");
      setAttachmentUploadForm({
        attachmentType: "OTHER",
        fileName: "",
        fileType: "",
        fileBase64: "",
        notes: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleUpdateAttachment = async () => {
    if (!editingAttachment) return;
    setIsUpdatingAttachment(true);
    try {
      const updated = await updateAttachment(editingAttachment.id, {
        attachmentType: editAttachmentForm.attachmentType,
        notes: editAttachmentForm.notes || undefined,
      });
      setProjectAttachments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      toast.success("Document updated successfully!");
      setEditingAttachment(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update document",
      );
    } finally {
      setIsUpdatingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteAttachment(id);
      setProjectAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Document deleted successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete document",
      );
    }
  };

  const handleViewAttachment = async (attachment: Attachment) => {
    // If we have a direct absolute URL (e.g. from immediate upload response), try opening it.
    // However, signed URLs expire, so fetching fresh is safer.
    // We'll try to fetch fresh details first.
    const toastId = toast.loading("Opening document...");
    try {
      const fullAttachment = await getAttachment(attachment.id);
      const url =
        fullAttachment.downloadUrl ||
        fullAttachment.url ||
        fullAttachment.fileUrl;
      
      if (url && (url.startsWith("http") || url.startsWith("//"))) {
        window.open(url, "_blank");
        toast.dismiss(toastId);
      } else {
        // Fallback to what we have in state if API didn't return a good URL
        // (unlikely if getAttachment is working correctly)
        const fallbackUrl =
          attachment.downloadUrl || attachment.url || attachment.fileUrl;
        if (
          fallbackUrl &&
          (fallbackUrl.startsWith("http") || fallbackUrl.startsWith("//"))
        ) {
          window.open(fallbackUrl, "_blank");
          toast.dismiss(toastId);
        } else {
          toast.error("Could not find a valid download link", { id: toastId });
        }
      }
    } catch (error) {
      console.error("Failed to fetch attachment details:", error);
      // Try fallback from state
      const fallbackUrl =
        attachment.downloadUrl || attachment.url || attachment.fileUrl;
      if (
        fallbackUrl &&
        (fallbackUrl.startsWith("http") || fallbackUrl.startsWith("//"))
      ) {
        window.open(fallbackUrl, "_blank");
        toast.dismiss(toastId);
      } else {
        toast.error("Failed to open document", { id: toastId });
      }
    }
  };

  // Handle create payment milestone
  const handleCreatePayment = async () => {
    if (!projectId) return;
    if (!newPaymentForm.expectedAmount || newPaymentForm.percentage <= 0) {
      toast.error("Please fill in required fields");
      return;
    }
    setIsSavingNewPayment(true);
    try {
      const data: CreatePaymentRequest = {
        projectId,
        title:
          newPaymentForm.title ||
          `${newPaymentForm.phaseType} Payment ${newPaymentForm.paymentStage}`,
        description: newPaymentForm.description || undefined,
        stageCode: newPaymentForm.stageCode || undefined,
        projectStageId: newPaymentForm.projectStageId || undefined,
        phaseType: newPaymentForm.phaseType,
        paymentStage: newPaymentForm.paymentStage,
        percentage: newPaymentForm.percentage,
        expectedAmount: parseFloat(newPaymentForm.expectedAmount),
        invoiceAmount: newPaymentForm.invoiceAmount
          ? parseFloat(newPaymentForm.invoiceAmount)
          : undefined,
        taxPercentage: newPaymentForm.taxPercentage
          ? parseFloat(newPaymentForm.taxPercentage)
          : undefined,
        status: newPaymentForm.status,
        dueDate: newPaymentForm.dueDate || undefined,
        notes: newPaymentForm.notes || undefined,
      };
      await createProjectPayment(projectId, data);
      toast.success("Payment milestone created!");
      setShowAddPaymentModal(false);
      setNewPaymentForm({
        title: "",
        description: "",
        stageCode: "",
        projectStageId: "",
        phaseType: "DESIGN",
        paymentStage: 1,
        percentage: 0,
        expectedAmount: "",
        invoiceAmount: "",
        taxPercentage: "",
        dueDate: "",
        notes: "",
        status: PaymentStatus.PENDING,
      });
      setPaymentFormErrors({
        percentage: "",
        expectedAmount: "",
        taxPercentage: "",
        invoiceAmount: "",
      });
    } catch {
      toast.error("Failed to create payment milestone");
    } finally {
      setIsSavingNewPayment(false);
    }
  };

  // Handle Send Invoice
  const handleOpenSendInvoice = async (
    payment: ProjectPayment,
    mode: "invoice" | "proforma" = "invoice",
  ) => {
    setInvoiceTargetPayment(payment);
    setInvoiceSendMode(mode);
    let toEmail = project?.lead?.email || project?.account?.email || "";
    let toName = project?.lead?.name || project?.account?.name || "";
    if (!toEmail && project?.leadId) {
      try {
        const lead = await getLeadById(project.leadId);
        toEmail = lead.email || "";
        toName = toName || lead.name || "";
      } catch {
        // user can fill in manually
      }
    }
    const displayAmount =
      payment.expectedAmount ??
      payment.invoiceAmount ??
      payment.actualAmount ??
      payment.amount ??
      "";
    setSendInvoiceForm((prev) => ({
      ...prev,
      toEmail,
      ccEmails: "",
      toName,
      attachments: [],
      customMessage:
        mode === "proforma"
          ? `Please make the payment for: ${payment.title || `Stage ${payment.paymentStage}`}. Amount due: ₹${displayAmount}.`
          : `Please find the proforma invoice for: ${payment.title || `Stage ${payment.paymentStage}`}. Amount: ₹${displayAmount}.`,
    }));
    setShowSendInvoiceModal(true);
  };

  const handleSendInvoiceFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readFileAsBase64 =
      (file: File) =>
      new Promise<{ fileName: string; fileType: string; fileBase64: string }>(
        (resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            if (!base64) {
              reject(new Error("Failed to process selected file"));
              return;
            }
            resolve({
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
              fileBase64: base64,
            });
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        },
      );

    void Promise.all(files.map(readFileAsBase64))
      .then((encodedFiles) => {
        setSendInvoiceForm((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...encodedFiles],
        }));
      })
      .catch(() => {
        toast.error("Failed to process selected files");
      });

    // Allow re-selecting the same file.
    e.target.value = "";
  };

  const handleSendInvoice = async () => {
    if (!invoiceTargetPayment) return;
    const toEmail = sendInvoiceForm.toEmail.trim();
    const toName = sendInvoiceForm.toName.trim();
    if (!toEmail || !toName) {
      toast.error("Please fill in recipient email and name");
      return;
    }
    if (!EMAIL_REGEX.test(toEmail)) {
      toast.error("Please enter a valid recipient email");
      return;
    }

    const rawCcEmails = parseEmailList(sendInvoiceForm.ccEmails);
    const invalidCcEmails = rawCcEmails.filter(
      (email) => !EMAIL_REGEX.test(email),
    );
    if (invalidCcEmails.length > 0) {
      toast.error(`Invalid CC email: ${invalidCcEmails[0]}`);
      return;
    }

    const ccEmails = Array.from(
      new Set(rawCcEmails.map((email) => email.toLowerCase())),
    ).filter((email) => email !== toEmail.toLowerCase());

    const attachments = sendInvoiceForm.attachments;

    if (
      invoiceSendMode === "invoice" &&
      (!sendInvoiceForm.accountNumber ||
        !sendInvoiceForm.ifscCode ||
        !sendInvoiceForm.bankName)
    ) {
      toast.error("Please fill in bank details");
      return;
    }
    setIsSendingInvoice(true);
    try {
      const invoicePayload = {
        toEmail,
        toName,
        customMessage: sendInvoiceForm.customMessage || undefined,
        cc: ccEmails,
        attachments,
        ...(invoiceSendMode === "invoice"
          ? {
              bankDetails: {
                accountName: sendInvoiceForm.accountName,
                accountNumber: sendInvoiceForm.accountNumber,
                ifscCode: sendInvoiceForm.ifscCode,
                bankName: sendInvoiceForm.bankName,
                upiId: sendInvoiceForm.upiId || undefined,
              },
            }
          : {}),
      };
      const response = await sendPaymentInvoice(
        invoiceTargetPayment.id,
        invoicePayload,
      );
      setInvoiceSentSuccessMessage(
        response.message ||
          (invoiceSendMode === "proforma"
            ? "Invoice email has been sent successfully."
            : "Proforma invoice email has been sent successfully."),
      );
      setShowInvoiceSentSuccessModal(true);
      setShowSendInvoiceModal(false);
    } catch {
      toast.error(
        invoiceSendMode === "proforma"
          ? "Failed to send invoice"
          : "Failed to send proforma invoice",
      );
    } finally {
      setIsSendingInvoice(false);
    }
  };

  // Handle Upload Document
  const handleOpenUploadDoc = (payment: ProjectPayment) => {
    setDocTargetPayment(payment);
    setUploadDocForm({ documentType: "receipt" });
    setUploadDocFiles([]);
    setShowUploadDocModal(true);
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setUploadDocFiles((prev) => [
          ...prev,
          { fileName: file.name, fileType: file.type, fileBase64: base64 },
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Reset so the same file can be selected again if removed
    e.target.value = "";
  };

  const handleUploadDoc = async () => {
    if (!docTargetPayment) return;
    if (!uploadDocFiles.length) {
      toast.error("Please select at least one file to upload");
      return;
    }
    setIsUploadingDoc(true);
    try {
      const collectedDocs: PaymentDocumentListItem[] = [];
      for (const file of uploadDocFiles) {
        const updated = await uploadPaymentDocument(docTargetPayment.id, {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBase64: file.fileBase64,
          documentType: uploadDocForm.documentType,
        });
        // Immediately merge the full upload response into the store so
        // projectPayments (and thus the useEffect sync) has the documents
        // from this individual call - even before fetchProjectPayments runs.
        mergePaymentUpdate(updated);
        // Collect the URL returned by each upload call.
        // New-style backends return a documents[] array; legacy backends use receiptUrl.
        if (updated.documents?.length) {
          updated.documents.forEach((d) => {
            if (!collectedDocs.some((cd) => cd.url === d.url)) {
              collectedDocs.push({
                url: d.url,
                fileName: d.fileName || file.fileName,
                documentType: d.documentType || uploadDocForm.documentType,
              });
            }
          });
        }
        // Also capture legacy receiptUrl if not already in collectedDocs
        if (
          updated.receiptUrl &&
          !collectedDocs.some((cd) => cd.url === updated.receiptUrl)
        ) {
          collectedDocs.push({
            url: updated.receiptUrl,
            fileName: updated.receiptFileName || file.fileName,
            documentType: uploadDocForm.documentType,
          });
        }
      }
      // Merge newly collected URLs into the per-payment documents map
      if (collectedDocs.length > 0) {
        setPaymentDocumentsMap((prev) => {
          const existing = prev[docTargetPayment.id] || [];
          return {
            ...prev,
            [docTargetPayment.id]: mergeUniquePaymentDocuments(
              existing,
              collectedDocs,
            ),
          };
        });
      }
      toast.success(
        uploadDocFiles.length === 1
          ? "Document uploaded successfully!"
          : `${uploadDocFiles.length} documents uploaded successfully!`,
      );
      setShowUploadDocModal(false);
      if (projectId) fetchProjectPayments(projectId);
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Handle Send Reminder
  const handleOpenSendReminder = async (payment: ProjectPayment) => {
    setReminderTargetPayment(payment);
    let toEmail = project?.lead?.email || project?.account?.email || "";
    let toName = project?.lead?.name || project?.account?.name || "";
    if (!toEmail && project?.leadId) {
      try {
        const lead = await getLeadById(project.leadId);
        toEmail = lead.email || "";
        toName = toName || lead.name || "";
      } catch {
        // user can fill in manually
      }
    }
    const displayAmount =
      payment.expectedAmount ??
      payment.invoiceAmount ??
      payment.actualAmount ??
      payment.amount ??
      "";
    setSendReminderForm({
      toEmail,
      toName,
      customMessage: `Gentle reminder: Payment of ₹${displayAmount} for "${payment.title || `Stage ${payment.paymentStage}`}" is pending. Kindly complete the payment at your earliest convenience.`,
    });
    setShowSendReminderModal(true);
  };

  const handleSendReminder = async () => {
    if (!reminderTargetPayment) return;
    if (!sendReminderForm.toEmail || !sendReminderForm.toName) {
      toast.error("Please fill in recipient email and name");
      return;
    }
    setIsSendingReminder(true);
    try {
      await sendPaymentReminder(reminderTargetPayment.id, {
        toEmail: sendReminderForm.toEmail,
        toName: sendReminderForm.toName,
        customMessage: sendReminderForm.customMessage || undefined,
      });
      toast.success("Reminder sent successfully!");
      setShowSendReminderModal(false);
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Handle payment update
  const handleEditPayment = (payment: ProjectPayment) => {
    setEditingPayment(payment);
    setPaymentForm({
      status: payment.status || "COLLECTED",
      actualAmount: payment.actualAmount?.toString() || "",
      paymentMethod: payment.paymentMethod || "",
      transactionRef: payment.transactionRef || "",
      notes: payment.notes || "",
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (!projectId || !editingPayment) return;
    setIsSavingPayment(true);
    try {
      await updateProjectPayment(projectId, editingPayment.id, {
        status: paymentForm.status,
        actualAmount: paymentForm.actualAmount
          ? parseFloat(paymentForm.actualAmount)
          : undefined,
        paymentMethod: paymentForm.paymentMethod || undefined,
        transactionRef: paymentForm.transactionRef || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success("Payment updated successfully!");
      setShowPaymentModal(false);
      setEditingPayment(null);
      fetchProjectPayments(projectId);
    } catch (error) {
      console.error("Payment update error:", error);
      toast.error("Failed to update payment");
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!projectId) return;

    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success("Project deleted successfully!");
      navigate("/dashboard/projects");
    } catch {
      toast.error("Failed to delete project");
      setIsDeleting(false);
    }
  };

  // Handle edit project
  const handleOpenEdit = () => {
    if (!currentProject) return;
    setEditForm({
      projectName: currentProject.projectName || "",
      leadId: currentProject.leadId || "",
      pipelineType: currentProject.pipelineType || "",
      projectCategory: currentProject.projectCategory || "",
      scopeType: currentProject.scopeType || "",
      budgetTier: currentProject.budgetTier || "",
      propertySubtype: currentProject.propertySubtype || "",
      propertySizeSqft: currentProject.propertySizeSqft
        ? String(currentProject.propertySizeSqft)
        : "",
      propertyBHK: currentProject.propertyBHK || "",
      propertyAddress: currentProject.propertyAddress || "",
      propertyCity: currentProject.propertyCity || "",
      propertyState: currentProject.propertyState || "",
      propertyPincode: currentProject.propertyPincode || "",
      propertyBuilding: currentProject.propertyBuilding || "",
      propertyUnit: currentProject.propertyUnit || "",
      propertyLandmarks: currentProject.propertyLandmarks || "",
      siteContactName: currentProject.siteContactName || "",
      siteContactPhone: currentProject.siteContactPhone || "",
      constructionStatus: currentProject.constructionStatus || "",
      tentativeHandoverDate: currentProject.tentativeHandoverDate
        ? new Date(currentProject.tentativeHandoverDate)
            .toISOString()
            .split("T")[0]
        : "",
      specialRequirements: currentProject.specialRequirements || "",
      designTeam: (currentProject.designTeam || []).join(", "),
      executionTeam: (currentProject.executionTeam || []).join(", "),
      assignedDesignerId: currentProject.assignedDesignerId || "",
      assignedPMId: currentProject.assignedPMId || "",
      designPackage: currentProject.designPackage || "",
      design3DStatus: currentProject.design3DStatus || "",
      moodBoardShared: currentProject.moodBoardShared || false,
      numberOfMeetings:
        currentProject.numberOfMeetings !== undefined &&
        currentProject.numberOfMeetings !== null
          ? String(currentProject.numberOfMeetings)
          : "",
      currentStageCode: currentProject.currentStageCode || "",
      currentPhase: currentProject.currentPhase || "",
      totalValue: currentProject.totalValue
        ? String(currentProject.totalValue)
        : "",
      designValue: currentProject.designValue
        ? String(currentProject.designValue)
        : "",
      executionValue: currentProject.executionValue
        ? String(currentProject.executionValue)
        : "",
      paidAmount: currentProject.paidAmount
        ? String(currentProject.paidAmount)
        : "",
      billingAddress: currentProject.billingAddress || "",
      pauseReason: currentProject.pauseReason || "",
      cancellationReason: currentProject.cancellationReason || "",
      remarks: currentProject.remarks || "",
      status: currentProject.status || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!projectId) return;
    setIsSavingEdit(true);
    try {
      const updates: UpdateProjectRequest = {};
      if (editForm.projectName) updates.projectName = editForm.projectName;
      if (editForm.leadId) updates.leadId = editForm.leadId;
      if (editForm.pipelineType) updates.pipelineType = editForm.pipelineType;
      if (editForm.projectCategory)
        updates.projectCategory = editForm.projectCategory;
      if (editForm.scopeType) updates.scopeType = editForm.scopeType;
      if (editForm.budgetTier) updates.budgetTier = editForm.budgetTier;
      if (editForm.propertySubtype)
        updates.propertySubtype = editForm.propertySubtype;
      if (editForm.propertySizeSqft)
        updates.propertySizeSqft = parseFloat(editForm.propertySizeSqft);
      if (editForm.propertyBHK) updates.propertyBHK = editForm.propertyBHK;
      if (editForm.propertyAddress)
        updates.propertyAddress = editForm.propertyAddress;
      if (editForm.propertyCity) updates.propertyCity = editForm.propertyCity;
      if (editForm.propertyState)
        updates.propertyState = editForm.propertyState;
      if (editForm.propertyPincode)
        updates.propertyPincode = editForm.propertyPincode;
      if (editForm.propertyBuilding)
        updates.propertyBuilding = editForm.propertyBuilding;
      if (editForm.propertyUnit) updates.propertyUnit = editForm.propertyUnit;
      if (editForm.propertyLandmarks)
        updates.propertyLandmarks = editForm.propertyLandmarks;
      if (editForm.siteContactName)
        updates.siteContactName = editForm.siteContactName;
      if (editForm.siteContactPhone)
        updates.siteContactPhone = editForm.siteContactPhone;
      if (editForm.constructionStatus)
        updates.constructionStatus = editForm.constructionStatus;
      if (editForm.tentativeHandoverDate)
        updates.tentativeHandoverDate = new Date(
          editForm.tentativeHandoverDate,
        ).toISOString();
      if (editForm.specialRequirements)
        updates.specialRequirements = editForm.specialRequirements;
      if (editForm.designTeam.trim())
        updates.designTeam = editForm.designTeam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (editForm.executionTeam.trim())
        updates.executionTeam = editForm.executionTeam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (editForm.assignedDesignerId !== undefined)
        updates.assignedDesignerId = editForm.assignedDesignerId || null;
      if (editForm.assignedPMId !== undefined)
        updates.assignedPMId = editForm.assignedPMId || null;
      if (editForm.designPackage)
        updates.designPackage = editForm.designPackage;
      if (editForm.design3DStatus)
        updates.design3DStatus = editForm.design3DStatus;
      updates.moodBoardShared = editForm.moodBoardShared;
      if (editForm.numberOfMeetings !== "")
        updates.numberOfMeetings = parseInt(editForm.numberOfMeetings, 10);
      if (editForm.currentStageCode)
        updates.currentStageCode = editForm.currentStageCode;
      if (editForm.currentPhase) updates.currentPhase = editForm.currentPhase;
      if (editForm.totalValue !== "")
        updates.totalValue = parseFloat(editForm.totalValue);
      if (editForm.designValue !== "")
        updates.designValue = parseFloat(editForm.designValue);
      if (editForm.executionValue !== "")
        updates.executionValue = parseFloat(editForm.executionValue);
      if (editForm.paidAmount !== "")
        updates.paidAmount = parseFloat(editForm.paidAmount);
      if (editForm.billingAddress)
        updates.billingAddress = editForm.billingAddress;
      if (editForm.pauseReason) updates.pauseReason = editForm.pauseReason;
      if (editForm.cancellationReason)
        updates.cancellationReason = editForm.cancellationReason;
      if (editForm.remarks) updates.remarks = editForm.remarks;
      if (editForm.status) updates.status = editForm.status as any;

      await updateProject(projectId, updates);

      // Optimistically merge values into currentProject for immediate UI update
      if (currentProject) {
        setCurrentProject({
          ...currentProject,
          ...(editForm.projectName && { projectName: editForm.projectName }),
          ...(editForm.leadId && { leadId: editForm.leadId }),
          pipelineType: (editForm.pipelineType ||
            currentProject.pipelineType) as any,
          projectCategory: (editForm.projectCategory ||
            currentProject.projectCategory) as any,
          scopeType: (editForm.scopeType || currentProject.scopeType) as any,
          budgetTier: (editForm.budgetTier || currentProject.budgetTier) as any,
          propertySubtype: (editForm.propertySubtype ||
            currentProject.propertySubtype) as any,
          ...(editForm.propertySizeSqft && {
            propertySizeSqft: parseFloat(editForm.propertySizeSqft),
          }),
          ...(editForm.propertyBHK && { propertyBHK: editForm.propertyBHK }),
          ...(editForm.propertyAddress && {
            propertyAddress: editForm.propertyAddress,
          }),
          ...(editForm.propertyCity && { propertyCity: editForm.propertyCity }),
          ...(editForm.propertyState && {
            propertyState: editForm.propertyState,
          }),
          ...(editForm.propertyPincode && {
            propertyPincode: editForm.propertyPincode,
          }),
          ...(editForm.propertyBuilding && {
            propertyBuilding: editForm.propertyBuilding,
          }),
          ...(editForm.propertyUnit && { propertyUnit: editForm.propertyUnit }),
          ...(editForm.propertyLandmarks && {
            propertyLandmarks: editForm.propertyLandmarks,
          }),
          ...(editForm.siteContactName && {
            siteContactName: editForm.siteContactName,
          }),
          ...(editForm.siteContactPhone && {
            siteContactPhone: editForm.siteContactPhone,
          }),
          ...(editForm.constructionStatus && {
            constructionStatus: editForm.constructionStatus,
          }),
          ...(editForm.tentativeHandoverDate && {
            tentativeHandoverDate: new Date(
              editForm.tentativeHandoverDate,
            ).toISOString(),
          }),
          ...(editForm.specialRequirements && {
            specialRequirements: editForm.specialRequirements,
          }),
          ...(editForm.designTeam.trim() && {
            designTeam: editForm.designTeam
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }),
          ...(editForm.executionTeam.trim() && {
            executionTeam: editForm.executionTeam
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }),
          assignedDesignerId:
            editForm.assignedDesignerId || currentProject.assignedDesignerId,
          assignedPMId: editForm.assignedPMId || currentProject.assignedPMId,
          ...(editForm.designPackage && {
            designPackage: editForm.designPackage,
          }),
          ...(editForm.design3DStatus && {
            design3DStatus: editForm.design3DStatus,
          }),
          moodBoardShared: editForm.moodBoardShared,
          ...(editForm.numberOfMeetings !== "" && {
            numberOfMeetings: parseInt(editForm.numberOfMeetings, 10),
          }),
          ...(editForm.currentStageCode && {
            currentStageCode: editForm.currentStageCode,
          }),
          ...(editForm.currentPhase && {
            currentPhase: editForm.currentPhase,
          }),
          ...(editForm.totalValue !== "" && {
            totalValue: parseFloat(editForm.totalValue),
          }),
          ...(editForm.designValue !== "" && {
            designValue: parseFloat(editForm.designValue),
          }),
          ...(editForm.executionValue !== "" && {
            executionValue: parseFloat(editForm.executionValue),
          }),
          ...(editForm.paidAmount !== "" && {
            paidAmount: parseFloat(editForm.paidAmount),
          }),
          ...(editForm.billingAddress && {
            billingAddress: editForm.billingAddress,
          }),
          ...(editForm.pauseReason && { pauseReason: editForm.pauseReason }),
          ...(editForm.cancellationReason && {
            cancellationReason: editForm.cancellationReason,
          }),
          ...(editForm.remarks && { remarks: editForm.remarks }),
          ...(editForm.status && { status: editForm.status as any }),
        });
      }

      toast.success("Project updated successfully!");
      setShowEditModal(false);
      fetchProjectById(projectId);
    } catch {
      toast.error("Failed to update project");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Status management handlers
  const handleStatusAction = async (
    action: "start" | "resume" | "complete" | "cancel",
  ) => {
    if (!projectId) return;
    setIsChangingStatus(true);
    try {
      const previousStatus = currentProject?.status || "UNKNOWN";
      let newStatus = "";
      let successMessage = "";

      switch (action) {
        case "start":
          await startProject(projectId);
          newStatus = "ONGOING";
          successMessage = "Project started successfully!";
          break;
        case "resume":
          await resumeProject(projectId);
          newStatus = "ONGOING";
          successMessage = "Project resumed successfully!";
          break;
        case "complete":
          await completeProject(projectId);
          newStatus = "COMPLETED";
          successMessage = "Project marked as completed!";
          break;
        case "cancel":
          await cancelProject(projectId);
          newStatus = "CANCELLED";
          successMessage = "Project cancelled!";
          break;
      }

      // Log activity for audit trail
      try {
        const resumedOnDate = new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const descriptions: Record<string, string> = {
          start: `Project started — status changed to Ongoing`,
          resume: `Project resumed on ${resumedOnDate} — status changed back to Ongoing`,
          complete: `Project marked as Completed`,
          cancel: `Project has been Cancelled`,
        };

        // Calculate pause duration for resume action
        let pauseDurationDays: number | undefined;
        if (action === "resume" && pauseStatus?.pausedAt) {
          const pausedAtDate = new Date(pauseStatus.pausedAt);
          const nowDate = new Date();
          pauseDurationDays = Math.round(
            (nowDate.getTime() - pausedAtDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
        }

        await createActivity({
          entityType: "PROJECT",
          entityId: projectId,
          type: "STATUS_CHANGE",
          description:
            descriptions[action] ||
            `Project status changed from ${previousStatus} to ${newStatus}`,
          metadata: {
            statusChange: {
              from: previousStatus,
              to: newStatus,
            },
            action,
            ...(action === "resume" && {
              resumedOn: new Date().toISOString(),
              pausedFrom: pauseStatus?.pausedAt || null,
              actualPauseDays: pauseDurationDays,
            }),
          },
        });
        console.log(`✅ Status change activity logged: ${action}`);
      } catch (activityError) {
        console.error(
          "⚠️ Failed to log status change activity:",
          activityError,
        );
        // Don't fail the entire operation if activity logging fails
      }

      toast.success(successMessage);
      setShowStatusConfirm(null);
      fetchProjectById(projectId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Failed to ${action} project`;
      toast.error(msg);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handlePauseProject = async () => {
    if (!projectId) return;
    const trimmedReason = pauseForm.reason.trim();
    if (!trimmedReason) {
      setPauseReasonError("Please add a reason before pausing the project.");
      toast.error("Please add a reason before pausing the project");
      return;
    }
    setPauseReasonError("");
    if (pauseForm.pauseDays < 1) {
      toast.error("Pause days must be at least 1");
      return;
    }
    setIsPausingProject(true);
    try {
      // Calculate expectedResumeDate from pauseDays (midnight UTC to match backend expectation)
      const resumeDate = new Date();
      resumeDate.setUTCDate(resumeDate.getUTCDate() + pauseForm.pauseDays);
      resumeDate.setUTCHours(0, 0, 0, 0);
      const expectedResumeDate = resumeDate.toISOString();

      console.log("🟢 Pausing project:", projectId);
      console.log("🟢 Form data:", pauseForm);
      console.log("🟢 Expected resume date:", expectedResumeDate);
      console.log("🟢 Request payload:", {
        reason: trimmedReason,
        pauseDays: pauseForm.pauseDays,
        expectedResumeDate,
      });

      await pauseProject(projectId, {
        reason: trimmedReason,
        pauseDays: pauseForm.pauseDays,
        expectedResumeDate,
      });

      // Log activity for audit trail
      try {
        const pausedFromDate = new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const pausedUntilDate = new Date(expectedResumeDate).toLocaleDateString(
          "en-IN",
          { day: "2-digit", month: "short", year: "numeric" },
        );
        await createActivity({
          entityType: "PROJECT",
          entityId: projectId,
          type: "STATUS_CHANGE",
          description: `Project paused from ${pausedFromDate} to ${pausedUntilDate} (${pauseForm.pauseDays} days). Reason: ${trimmedReason}`,
          metadata: {
            statusChange: {
              from: "ONGOING",
              to: "PAUSED",
            },
            action: "pause",
            pauseDays: pauseForm.pauseDays,
            reason: trimmedReason,
            pausedFrom: new Date().toISOString(),
            expectedResumeDate,
          },
        });
        console.log("✅ Pause activity logged successfully");
      } catch (activityError) {
        console.error("⚠️ Failed to log pause activity:", activityError);
        // Don't fail the entire operation if activity logging fails
      }

      toast.success(`Project paused for ${pauseForm.pauseDays} days`);
      setShowPauseModal(false);
      setPauseForm({ pauseDays: 7, reason: "" });
      setPauseReasonError("");
      fetchProjectById(projectId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to pause project";
      toast.error(msg);
      console.error("❌ Error in handlePauseProject:", err);
    } finally {
      setIsPausingProject(false);
    }
  };

  // Fetch pause status when project is paused
  useEffect(() => {
    if (projectId && currentProject?.status?.toUpperCase() === "PAUSED") {
      fetchPauseStatus(projectId).catch(() => {});
    }
  }, [projectId, currentProject?.status, fetchPauseStatus]);

  // Get available status actions based on the current status
  const getStatusActions = () => {
    const status = (currentProject?.status || "").toUpperCase();
    const actions: Array<{
      action: "start" | "resume" | "complete" | "cancel" | "pause";
      label: string;
      icon: React.ReactNode;
      className: string;
      confirmTitle: string;
      confirmMessage: string;
    }> = [];

    if (status === "YET_TO_START") {
      actions.push({
        action: "start",
        label: "Start Project",
        icon: <Play className="w-4 h-4 mr-1.5" />,
        className: "bg-green-500 hover:bg-green-600 text-white",
        confirmTitle: "Start Project?",
        confirmMessage:
          'This will change the project status from "Yet to Start" to "Ongoing".',
      });
      actions.push({
        action: "cancel",
        label: "Cancel",
        icon: <Ban className="w-4 h-4 mr-1.5" />,
        className:
          "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300",
        confirmTitle: "Cancel Project?",
        confirmMessage:
          "Are you sure you want to cancel this project? This action may not be reversible.",
      });
    }

    if (status === "ONGOING" || status === "ACTIVE") {
      actions.push({
        action: "pause",
        label: "Pause",
        icon: <Pause className="w-4 h-4 mr-1.5" />,
        className:
          "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300",
        confirmTitle: "",
        confirmMessage: "",
      });
      actions.push({
        action: "complete",
        label: "Complete",
        icon: <StopCircle className="w-4 h-4 mr-1.5" />,
        className:
          "bg-green-100 hover:bg-green-200 text-green-700 border border-green-300",
        confirmTitle: "Complete Project?",
        confirmMessage:
          "Are you sure you want to mark this project as completed?",
      });
      actions.push({
        action: "cancel",
        label: "Cancel",
        icon: <Ban className="w-4 h-4 mr-1.5" />,
        className:
          "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300",
        confirmTitle: "Cancel Project?",
        confirmMessage:
          "Are you sure you want to cancel this project? This action may not be reversible.",
      });
    }

    if (status === "PAUSED") {
      actions.push({
        action: "resume",
        label: "Resume",
        icon: <Play className="w-4 h-4 mr-1.5" />,
        className: "bg-blue-500 hover:bg-blue-600 text-white",
        confirmTitle: "Resume Project?",
        confirmMessage:
          'This will resume the project and change its status back to "Ongoing".',
      });
      actions.push({
        action: "cancel",
        label: "Cancel",
        icon: <Ban className="w-4 h-4 mr-1.5" />,
        className:
          "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300",
        confirmTitle: "Cancel Project?",
        confirmMessage:
          "Are you sure you want to cancel this project? This action may not be reversible.",
      });
    }

    return actions;
  };

  // Calculate payment totals
  const calculatePaymentTotals = () => {
    let totalPaid = 0;
    let totalPending = 0;
    const totalAmount = parseFloat(String(currentProject?.totalValue)) || 0;

    projectPayments.forEach((payment) => {
      const expected = parseFloat(String(payment.expectedAmount)) || 0;
      const actual = parseFloat(String(payment.actualAmount)) || 0;
      const boundedActual = Math.max(0, Math.min(actual, expected));

      if (payment.status === "WAIVED") {
        return;
      }

      if (payment.status === "COLLECTED") {
        totalPaid += actual > 0 ? boundedActual : expected;
        return;
      }

      totalPaid += boundedActual;
      totalPending += Math.max(0, expected - boundedActual);
    });

    return { totalPaid, totalPending, totalAmount };
  };

  // Loading state — shown on initial render (before the API call starts) and
  // during the fetch itself. Using !error as the guard so a 404/network error
  // falls through to the error block below instead of spinning forever.
  if (!currentProject && !error) {
    return <PageLoader message="Loading project details..." />;
  }

  // Error state
  if (error && !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Project
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                clearError();
                if (projectId) fetchProjectById(projectId);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/dashboard/projects")}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The project you are looking for does not exist.
          </p>
          <Button onClick={() => navigate("/dashboard/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const project = currentProject;
  const projectName = project.projectName || project.name || "Untitled Project";
  const statusDisplay = getStatusDisplay(project);
  const paymentTotals = calculatePaymentTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-orange-50/20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-orange-100/60 via-orange-50/80 to-amber-50/60 border-b border-orange-200/60 px-2 sm:px-3 py-3 backdrop-blur-sm">
        <div className="w-full relative z-10">
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to Projects</span>
          </button>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-orange-600 bg-clip-text text-transparent">
                  {projectName}
                </h1>
                {project.projectNumber && (
                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-sm px-3 py-1 font-semibold">
                    Project No: {project.projectNumber}
                  </Badge>
                )}
                <Badge
                  className={`${statusDisplay.className} border text-sm px-3 py-1 font-semibold`}
                >
                  {statusDisplay.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                {(project.account?.name || project.lead?.name) && (
                  <button
                    onClick={() => {
                      if (project.account?.id) {
                        navigate(`/dashboard/customers/${project.account.id}`);
                      } else if (project.lead?.id) {
                        navigate(`/dashboard/leads/${project.lead.id}`);
                      }
                    }}
                    className="flex items-center gap-1.5 text-base font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors group/customer"
                    title="View customer details"
                  >
                    <UserCircle className="w-4 h-4" />
                    {project.account?.name || project.lead?.name}
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/customer:opacity-100 transition-opacity" />
                  </button>
                )}
                {project.propertyCity && (
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    {project.propertyCity}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Status Action Buttons */}
              {canEditProject && getStatusActions().map((statusAction) => (
                <button
                  key={statusAction.action}
                  onClick={() => {
                    if (statusAction.action === "pause") {
                      setShowPauseModal(true);
                    } else {
                      setShowStatusConfirm(statusAction.action);
                    }
                  }}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${statusAction.className}`}
                >
                  {statusAction.icon}
                  {statusAction.label}
                </button>
              ))}

              {canEditProject && (
              <Button
                variant="secondary"
                className="bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 shadow-md"
                onClick={handleOpenEdit}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              )}
              {canDeleteProject && (
              <Button
                variant="secondary"
                className="bg-white hover:bg-red-50 border-2 border-red-400 hover:border-red-500 text-red-600 hover:text-red-700 shadow-md"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CURRENT STAGE
              </p>
              <p className="text-xl font-bold text-gray-900">
                {project.currentStageCode
                  ? getStageLabel(project.currentStageCode)
                  : "N/A"}
              </p>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                TOTAL VALUE
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrencyExact(
                  parseFloat(String(project.totalValue)) || 0,
                )}
              </p>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CATEGORY
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatEnumLabel(project.projectCategory)}
              </p>
            </div>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-300/40 to-amber-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/40 to-amber-100/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Pause Info Banner */}
      {project.status?.toUpperCase() === "PAUSED" && (
        <div className="bg-yellow-50 border border-yellow-200 mt-2 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Pause className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-yellow-800 mb-1">
                Project is Paused
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {project.pauseReason && (
                  <div>
                    <span className="text-yellow-600 font-medium">Reason:</span>{" "}
                    <span className="text-yellow-900">
                      {project.pauseReason}
                    </span>
                  </div>
                )}
                {project.pausedAt && (
                  <div>
                    <span className="text-yellow-600 font-medium">Paused:</span>{" "}
                    <span className="text-yellow-900">
                      {formatDate(project.pausedAt)}
                    </span>
                  </div>
                )}
                {project.pausedUntil && (
                  <div>
                    <span className="text-yellow-600 font-medium">Until:</span>{" "}
                    <span className="text-yellow-900">
                      {formatDate(project.pausedUntil)}
                    </span>
                  </div>
                )}
                {pauseStatus?.daysRemaining != null &&
                  pauseStatus.daysRemaining > 0 && (
                    <div>
                      <span className="text-yellow-600 font-medium">
                        Days Left:
                      </span>{" "}
                      <span className="text-yellow-900 font-bold">
                        {pauseStatus.daysRemaining}
                      </span>
                    </div>
                  )}
                {pauseStatus?.isExpired && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      <AlertCircle className="w-3 h-3" />
                      Pause Expired{" "}
                      {pauseStatus.daysOverdue
                        ? `(${pauseStatus.daysOverdue} days overdue)`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowStatusConfirm("resume")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20 shadow-sm">
        <div className="w-full px-2 sm:px-3">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "stages", label: "Stages", icon: CheckCircle2 },
              // Payments tab hidden from DESIGNER and SITE_ENGINEER roles (field roles)
              ...(!["DESIGNER", "SITE_ENGINEER"].includes(roleId)
                ? [{ id: "payments", label: "Payments", icon: CreditCard }]
                : []),
              { id: "references", label: "References", icon: Image },
              {
                id: "testimonials",
                label: "Testimonials",
                icon: MessageSquare,
              },
              { id: "handover", label: "Handover", icon: Gift },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative flex items-center gap-2 py-4 transition-all group ${
                  activeTab === tab.id
                    ? "text-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-2 sm:px-3 py-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Project Information */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Project Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Customer"
                    value={project.account?.name || "N/A"}
                  />
                  <InfoItem
                    label="Tentative Handover"
                    value={formatDate(project.tentativeHandoverDate)}
                  />
                  <InfoItem
                    label="Budget Value"
                    value={formatCurrencyExact(
                      parseFloat(String(project.totalValue)) || 0,
                    )}
                  />
                  <InfoItem
                    label="Site Contact Name"
                    value={project.siteContactName || "N/A"}
                  />
                  <InfoItem
                    label="Site Contact Phone"
                    value={project.siteContactPhone || "N/A"}
                  />
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Property Address
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 border border-gray-100">
                      {project.propertyAddress || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Billing Address
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 border border-gray-100">
                      {project.billingAddress || "N/A"}
                    </p>
                  </div>
                </div>
              </Card>

              {(project.specialRequirements ||
                project.remarks) && (
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    Requirements & Notes
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Special Requirements
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 border border-gray-100">
                        {project.specialRequirements || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Remarks
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 border border-gray-100">
                        {project.remarks || "N/A"}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Client/Lead Information */}
              {project.lead && (
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Client Information
                  </h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {project.lead.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-lg font-bold text-gray-900">
                        {project.lead.name}
                      </p>
                      {project.lead.email && (
                        <a
                          href={`mailto:${project.lead.email}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600"
                        >
                          <Mail className="w-4 h-4" />
                          {project.lead.email}
                        </a>
                      )}
                      {project.lead.phone && (
                        <a
                          href={`tel:${project.lead.phone}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600"
                        >
                          <Phone className="w-4 h-4" />
                          {project.lead.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Team */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Assigned Teams
                </h2>
                <div className="space-y-3">
                  {(project.designTeam || [])
                    .filter(Boolean)
                    .map((member, idx) => (
                      <TeamMemberItem
                        key={`design-${idx}`}
                        name={member}
                        role="Design Team"
                        badge="Design"
                      />
                    ))}

                  {/* Execution Team members (string array) */}
                  {(project.executionTeam || [])
                    .filter(Boolean)
                    .map((member, idx) => (
                      <TeamMemberItem
                        key={`exec-${idx}`}
                        name={member}
                        role="Execution Team"
                        badge="Execution"
                      />
                    ))}

                  {!(project.designTeam || []).filter(Boolean).length &&
                    !(project.executionTeam || []).filter(Boolean).length && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No team members assigned yet
                        </p>
                      </div>
                    )}
                </div>
              </Card>

              {/* Documents Section */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-white" />
                    </div>
                    Documents
                  </h2>
                  <button
                    onClick={() => {
                      setAttachmentUploadForm({
                        attachmentType: "OTHER",
                        fileName: "",
                        fileType: "",
                        fileBase64: "",
                        notes: "",
                      });
                      setShowAttachmentUploadModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Upload
                  </button>
                </div>
                {attachmentsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      Loading documents...
                    </span>
                  </div>
                ) : projectAttachments.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No documents uploaded yet
                    </p>
                    <button
                      onClick={() => {
                        setAttachmentUploadForm({
                          attachmentType: "OTHER",
                          fileName: "",
                          fileType: "",
                          fileBase64: "",
                          notes: "",
                        });
                        setShowAttachmentUploadModal(true);
                      }}
                      className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Upload first document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectAttachments.map((attachment) => {
                      const isImage = attachment.fileType?.startsWith("image/");
                      // Prefer downloadUrl (signed URL). Only use storageUrl/fileUrl if they are absolute URLs.
                      // Relative storageUrl (e.g. "attachments/...") is not viewable directly.

                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                            {isImage ? (
                              <Image className="w-4 h-4 text-teal-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                {attachment.attachmentType?.replace(/_/g, " ")}
                              </span>
                              {attachment.notes && (
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                  {attachment.notes}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleViewAttachment(attachment)}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors"
                                title="View / Download"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            <button
                              onClick={() => {
                                setEditingAttachment(attachment);
                                setEditAttachmentForm({
                                  attachmentType:
                                    attachment.attachmentType || "OTHER",
                                  notes: attachment.notes || "",
                                });
                              }}
                              className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-500 hover:text-orange-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteAttachment(attachment.id)
                              }
                              className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Customer */}
              {(project.account?.name || project.account?.email || project.account?.phone) && (
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <UserCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    Customer
                  </h3>
                  {project.account?.name && (
                    <p className="text-sm text-gray-700 pl-9 font-semibold">
                      {project.account.name}
                    </p>
                  )}
                  {project.account?.email && (
                    <p className="text-sm text-gray-500 pl-9">
                      {project.account.email}
                    </p>
                  )}
                  {project.account?.phone && (
                    <p className="text-sm text-gray-500 pl-9">
                      {project.account.phone}
                    </p>
                  )}
                </Card>
              )}

              {/* Payment Summary */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-white" />
                  </div>
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrencyExact(
                        parseFloat(String(project.totalValue)) || 0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                    <span className="text-sm text-green-700">Collected</span>
                    <span className="font-bold text-green-600">
                      {formatCurrencyExact(paymentTotals.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-orange-50">
                    <span className="text-sm text-orange-700">Pending</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrencyExact(paymentTotals.totalPending)}
                    </span>
                  </div>
                </div>
              </Card>


            </div>
          </div>
        )}

        {/* Stages Tab */}
        {activeTab === "stages" && <ProjectStagesSection project={project} />}

        {/* Payments Tab */}
        {activeTab === "payments" &&
          (() => {
            const designPayments = projectPayments.filter(
              (p) => p.phaseType === "DESIGN",
            );
            const executionPayments = projectPayments.filter(
              (p) => p.phaseType === "EXECUTION",
            );
            const activePhasePayments =
              paymentPhaseTab === "DESIGN" ? designPayments : executionPayments;
            const designPhaseValue =
              parseFloat(String(project.designValue ?? 0)) || 0;
            const executionPhaseValue =
              parseFloat(String(project.executionValue ?? 0)) || 0;
            const activePhaseValue =
              paymentPhaseTab === "DESIGN"
                ? designPhaseValue
                : executionPhaseValue;
            const workAttachments = projectAttachments.filter(
              (attachment) => attachment.attachmentType === "QUICK_ACTION",
            );

            let phasePaid = 0;
            let phasePending = 0;
            activePhasePayments.forEach((payment) => {
              const expected = parseFloat(String(payment.expectedAmount)) || 0;
              const actual = parseFloat(String(payment.actualAmount)) || 0;
              const boundedActual = Math.max(0, Math.min(actual, expected));
              if (payment.status === "WAIVED") return;
              if (payment.status === "COLLECTED") {
                phasePaid += actual > 0 ? boundedActual : expected;
                return;
              }
              phasePaid += boundedActual;
              phasePending += Math.max(0, expected - boundedActual);
            });

            const renderPaymentCard = (
              payment: (typeof projectPayments)[0],
            ) => {
              const isCollected = payment.status === "COLLECTED";
              const isOverdue = payment.status === "OVERDUE";
              const statusBgMap: Record<string, string> = {
                COLLECTED:
                  "bg-gradient-to-br from-green-500 to-green-600 text-white",
                OVERDUE: "bg-gradient-to-br from-red-500 to-red-600 text-white",
                PARTIALLY_PAID:
                  "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
                WAIVED:
                  "bg-gradient-to-br from-gray-400 to-gray-500 text-white",
                PENDING:
                  "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
              };
              const badgeBgMap: Record<string, string> = {
                COLLECTED: "bg-green-100 text-green-700",
                OVERDUE: "bg-red-100 text-red-700",
                PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
                WAIVED: "bg-gray-100 text-gray-700",
                PENDING: "bg-orange-100 text-orange-700",
              };
              const statusIcon = isCollected ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isOverdue ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              );
              const displayTitle =
                payment.title ||
                `${payment.phaseType} Payment ${payment.paymentStage} (${payment.percentage}%)`;
              const expected = parseFloat(String(payment.expectedAmount)) || 0;
              const invoiceAmount =
                parseFloat(String(payment.invoiceAmount ?? 0)) || 0;
              const actual = parseFloat(String(payment.actualAmount)) || 0;
              const boundedActual = Math.max(0, Math.min(actual, expected));
              const hasActualCollection = boundedActual > 0;
              const headerAmount =
                invoiceAmount > 0
                  ? invoiceAmount
                  : expected;
              return (
                <div
                  key={payment.id}
                  className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all gap-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${statusBgMap[payment.status] || statusBgMap["PENDING"]}`}
                      >
                        {statusIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {displayTitle}
                        </p>
                        {payment.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {payment.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
                          <span>Expected: {formatCurrency(expected)}</span>
                          {hasActualCollection && (
                            <span className="text-green-700 font-medium">
                              Collected: {formatCurrency(boundedActual)}
                            </span>
                          )}
                          {!isCollected && hasActualCollection && (
                            <span className="text-orange-700 font-medium">
                              Remaining: {formatCurrency(expected - boundedActual)}
                            </span>
                          )}
                          {payment.dueDate && (
                            <span className="text-gray-500">
                              Due: {formatDate(payment.dueDate)}
                            </span>
                          )}
                        </div>
                        {(payment.paymentMethod || payment.transactionRef) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                            {payment.paymentMethod && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium">Method:</span>{" "}
                                {payment.paymentMethod.replace(/_/g, " ")}
                              </span>
                            )}
                            {payment.transactionRef && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium">Ref:</span>{" "}
                                {payment.transactionRef}
                              </span>
                            )}
                          </div>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(headerAmount)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                        Invoice Amount
                      </p>
                      <Badge
                        className={`text-xs font-semibold ${badgeBgMap[payment.status] || badgeBgMap["PENDING"]}`}
                      >
                        {payment.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    {canUpdatePayment && (
                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      title="Update payment status"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Update Status
                    </button>
                    )}
                    <button
                      onClick={() => handleOpenSendInvoice(payment)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                      title="Send proforma invoice"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Proforma Invoice
                    </button>
                    <button
                      onClick={() => handleOpenSendInvoice(payment, "proforma")}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      title="Send invoice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Send Invoice
                    </button>
                    <button
                      onClick={() => handleOpenUploadDoc(payment)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                      title="Upload receipt/document"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      Upload Receipt
                    </button>
                    {(payment.receiptUrl ||
                      (paymentDocumentsMap[payment.id] &&
                        paymentDocumentsMap[payment.id].length > 0) ||
                      (payment.documents && payment.documents.length > 0)) && (
                      <button
                        onClick={async () => {
                          setViewReceiptsPayment(payment);
                          setShowViewReceiptsModal(true);
                          // Fetch the individual payment to get the full
                          // documents[] array — the list endpoint omits it.
                          setViewReceiptsLoading(true);
                          try {
                            await fetchPaymentById(payment.id);
                          } finally {
                            setViewReceiptsLoading(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                        title="View uploaded receipts / documents"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Receipts
                        {(() => {
                          const apiDocs = payment.documents?.length ?? 0;
                          const localDocs =
                            paymentDocumentsMap[payment.id]?.length ?? 0;
                          const count =
                            apiDocs > 0
                              ? apiDocs
                              : localDocs > 0
                                ? localDocs
                                : payment.receiptUrl
                                  ? 1
                                  : 0;
                          return count > 1 ? (
                            <span className="ml-1 px-1.5 py-0.5 bg-teal-200 text-teal-800 rounded-full text-xs leading-none">
                              {count}
                            </span>
                          ) : null;
                        })()}
                      </button>
                    )}
                    {(payment.status === "PENDING" ||
                      payment.status === "OVERDUE" ||
                      payment.status === "PARTIALLY_PAID") && (
                      <button
                        onClick={() => handleOpenSendReminder(payment)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                        title="Send reminder"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        Send Reminder
                      </button>
                    )}
                    {canDeletePayment && (
                    <button
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Delete this payment milestone? This cannot be undone.",
                          )
                        )
                          return;
                        try {
                          await deleteProjectPayment(
                            payment.projectId,
                            payment.id,
                          );
                          toast.success("Payment milestone deleted");
                        } catch {
                          toast.error("Failed to delete payment milestone");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors ml-auto"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {/* Overall Payment Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-200/50 shadow-sm">
                    <p className="text-sm text-green-700 mb-2 font-semibold">
                      Collected
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrencyExact(paymentTotals.totalPaid)}
                    </p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-200/50 shadow-sm">
                    <p className="text-sm text-orange-700 mb-2 font-semibold">
                      Pending
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {formatCurrencyExact(paymentTotals.totalPending)}
                    </p>
                  </Card>
                </div>

                {/* Phase Tabs */}
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  {/* Tab header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setPaymentPhaseTab("DESIGN")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          paymentPhaseTab === "DESIGN"
                            ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            paymentPhaseTab === "DESIGN"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                        />
                        Design
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            paymentPhaseTab === "DESIGN"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {designPayments.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setPaymentPhaseTab("EXECUTION")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          paymentPhaseTab === "EXECUTION"
                            ? "bg-white text-orange-700 shadow-sm border border-orange-200"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            paymentPhaseTab === "EXECUTION"
                              ? "bg-orange-500"
                              : "bg-gray-400"
                          }`}
                        />
                        Execution
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            paymentPhaseTab === "EXECUTION"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {executionPayments.length}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setShowWorkAttachmentsModal(true)}
                        className="text-sm px-4 py-2"
                        title="View uploaded work attachments"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View Work
                        {workAttachments.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs rounded-full bg-gray-200 text-gray-700">
                            {workAttachments.length}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setAttachmentUploadContext("work");
                          setAttachmentUploadForm({
                            attachmentType: "QUICK_ACTION",
                            fileName: "",
                            fileType: "",
                            fileBase64: "",
                            notes: "",
                          });
                          setShowAttachmentUploadModal(true);
                        }}
                        className="text-sm px-4 py-2 border border-teal-300 text-teal-700 hover:bg-teal-50"
                        title="Upload work attachment"
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Upload Work
                      </Button>
                      {/* Add Payment for active phase */}
                      {canCreatePayment && (
                      <Button
                        onClick={() => {
                          const nextStage =
                            projectPayments.filter(
                              (p) => p.phaseType === paymentPhaseTab,
                            ).length + 1;
                          setNewPaymentForm((prev) => ({
                            ...prev,
                            phaseType: paymentPhaseTab,
                            paymentStage: nextStage,
                            title: "",
                            description: "",
                            stageCode: "",
                            projectStageId: "",
                            percentage: 0,
                            expectedAmount: "",
                            invoiceAmount: "",
                            taxPercentage: "",
                            dueDate: "",
                            notes: "",
                            status: "PENDING",
                          }));
                          setShowAddPaymentModal(true);
                          if (projectId) fetchProjectStages(projectId);
                        }}
                        className={`text-white text-sm px-4 py-2 ${
                          paymentPhaseTab === "DESIGN"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add{" "}
                        {paymentPhaseTab === "DESIGN"
                          ? "Design"
                          : "Execution"}{" "}
                        Payment
                      </Button>
                      )}
                    </div>
                  </div>

                  {/* Fixed phase values visible for both sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5">
                      <span className="text-sm font-semibold text-blue-700">
                        Design Value
                      </span>
                      <span className="text-base font-bold text-blue-700">
                        {formatCurrencyExact(designPhaseValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-100 px-4 py-2.5">
                      <span className="text-sm font-semibold text-orange-700">
                        Execution Value
                      </span>
                      <span className="text-base font-bold text-orange-700">
                        {formatCurrencyExact(executionPhaseValue)}
                      </span>
                    </div>
                  </div>

                  {/* Phase summary mini-stats */}
                  <div className="flex items-center gap-4 mb-4 px-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                          paymentPhaseTab === "DESIGN"
                            ? "bg-blue-500"
                            : "bg-orange-500"
                        }`}
                      />
                      <span className="text-gray-500">Phase Value:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyExact(activePhaseValue)}
                      </span>
                    </div>
                    <div className="text-gray-300">|</div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                      <span className="text-gray-500">Collected:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyExact(phasePaid)}
                      </span>
                    </div>
                    <div className="text-gray-300">|</div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                      <span className="text-gray-500">Pending:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyExact(phasePending)}
                      </span>
                    </div>
                    <div className="text-gray-300">|</div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-gray-500">Milestones:</span>
                      <span className="font-semibold text-gray-900">
                        {activePhasePayments.length}
                      </span>
                    </div>
                  </div>

                  {/* Payment list for active phase */}
                  {activePhasePayments.length === 0 ? (
                    <div className="text-center py-10">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No{" "}
                        {paymentPhaseTab === "DESIGN" ? "Design" : "Execution"}{" "}
                        payment milestones yet.
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Click &ldquo;Add{" "}
                        {paymentPhaseTab === "DESIGN" ? "Design" : "Execution"}{" "}
                        Payment&rdquo; to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePhasePayments.map(renderPaymentCard)}
                    </div>
                  )}
                </Card>
              </div>
            );
          })()}

        {/* References Tab */}
        {activeTab === "references" && project && (
          <ProjectReferencesTab projectId={project.id} />
        )}

        {/* Testimonials Tab */}
        {activeTab === "testimonials" && project && (
          <TestimonialsTab
            projectId={project.id}
            projectName={project.projectName || project.name}
            clientName={project.lead?.name || "Client"}
          />
        )}

        {/* Handover & Goodwill Tab */}
        {activeTab === "handover" && project && (
          <HandoverTab projectId={project.id} />
        )}
      </div>

      {/* Add Payment Milestone Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Add Payment Milestone
                </h3>
                <button
                  onClick={() => {
                    setShowAddPaymentModal(false);
                    setPaymentFormErrors({ percentage: "", expectedAmount: "", taxPercentage: "", invoiceAmount: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                    <span className="text-gray-400 font-normal ml-1">
                      (optional — auto-generated if blank)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.title}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                    placeholder="e.g. Design Phase - Advance Payment"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.description}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                    placeholder="e.g. Initial design milestone payment"
                  />
                </div>

                {/* Stage Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Stage
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={newPaymentForm.stageCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const matched = projectStages.find(
                        (s) => s.stageCode === code,
                      );
                      setNewPaymentForm({
                        ...newPaymentForm,
                        stageCode: code,
                        projectStageId: matched ? matched.id : "",
                        dueDate: matched
                          ? toDateInputValue(matched.tentativeEndDate)
                          : "",
                        ...(matched
                          ? {
                              phaseType: matched.phaseType,
                              paymentStage:
                                projectPayments.filter(
                                  (p) => p.phaseType === matched.phaseType,
                                ).length + 1,
                            }
                          : {}),
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                  >
                    {projectStages.length === 0 ? (
                      <option value="" disabled>
                        Loading stages…
                      </option>
                    ) : (
                      <>
                        <option value="">— Select a Stage —</option>
                        {projectStages
                          .filter(
                            (stage) => stage.phaseType === paymentPhaseTab,
                          )
                          .map((stage) => (
                            <option key={stage.id} value={stage.stageCode}>
                              {stage.stageName}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Payment Stage + Percentage row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Stage
                      <span className="text-gray-400 font-normal ml-1">
                        (auto-assigned)
                      </span>
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium">
                      Stage {newPaymentForm.paymentStage}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Percentage (%) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newPaymentForm.percentage || ""}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e") e.preventDefault();
                      }}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val < 0) {
                          setPaymentFormErrors((prev) => ({ ...prev, percentage: "Value cannot be negative" }));
                          return;
                        }
                        setPaymentFormErrors((prev) => ({ ...prev, percentage: "", expectedAmount: "" }));
                        const projectTotal = parseFloat(String(project?.totalValue || "0")) || 0;
                        const autoExpected = (!isNaN(val) && val > 0 && projectTotal > 0)
                          ? String(Math.round((val / 100) * projectTotal))
                          : newPaymentForm.expectedAmount;
                        const tax = parseFloat(newPaymentForm.taxPercentage || "0");
                        const autoInvoice = autoExpected
                          ? (parseFloat(autoExpected) * (1 + tax / 100)).toFixed(2)
                          : newPaymentForm.invoiceAmount;
                        setNewPaymentForm({
                          ...newPaymentForm,
                          percentage: val || 0,
                          expectedAmount: autoExpected,
                          invoiceAmount: autoInvoice,
                        });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none ${paymentFormErrors.percentage ? "border-red-400" : "border-gray-200"}`}
                      placeholder="50"
                    />
                    {paymentFormErrors.percentage && (
                      <p className="text-red-500 text-xs mt-1">{paymentFormErrors.percentage}</p>
                    )}
                  </div>
                </div>

                {/* Expected Amount + Tax row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newPaymentForm.expectedAmount}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e") e.preventDefault();
                      }}
                      onChange={(e) => {
                        const expected = e.target.value;
                        if (expected !== "" && parseFloat(expected) < 0) {
                          setPaymentFormErrors((prev) => ({ ...prev, expectedAmount: "Value cannot be negative" }));
                          return;
                        }
                        setPaymentFormErrors((prev) => ({ ...prev, expectedAmount: "" }));
                        const tax = parseFloat(
                          newPaymentForm.taxPercentage || "0",
                        );
                        const auto = expected
                          ? (parseFloat(expected) * (1 + tax / 100)).toFixed(2)
                          : "";
                        setNewPaymentForm({
                          ...newPaymentForm,
                          expectedAmount: expected,
                          invoiceAmount: auto,
                        });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none ${paymentFormErrors.expectedAmount ? "border-red-400" : "border-gray-200"}`}
                      placeholder="50000"
                    />
                    {paymentFormErrors.expectedAmount && (
                      <p className="text-red-500 text-xs mt-1">{paymentFormErrors.expectedAmount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax (%)
                      <span className="text-gray-400 font-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newPaymentForm.taxPercentage}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e") e.preventDefault();
                      }}
                      onChange={(e) => {
                        const tax = e.target.value;
                        if (tax !== "" && parseFloat(tax) < 0) {
                          setPaymentFormErrors((prev) => ({ ...prev, taxPercentage: "Value cannot be negative" }));
                          return;
                        }
                        setPaymentFormErrors((prev) => ({ ...prev, taxPercentage: "" }));
                        const expected = parseFloat(
                          newPaymentForm.expectedAmount || "0",
                        );
                        const auto = newPaymentForm.expectedAmount
                          ? (
                              expected *
                              (1 + parseFloat(tax || "0") / 100)
                            ).toFixed(2)
                          : "";
                        setNewPaymentForm({
                          ...newPaymentForm,
                          taxPercentage: tax,
                          invoiceAmount: auto,
                        });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none ${paymentFormErrors.taxPercentage ? "border-red-400" : "border-gray-200"}`}
                      placeholder="18"
                    />
                    {paymentFormErrors.taxPercentage && (
                      <p className="text-red-500 text-xs mt-1">{paymentFormErrors.taxPercentage}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Amount — auto-calculated from expectedAmount × (1 + tax), user can override */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Amount (₹)
                    <span className="text-gray-400 font-normal ml-1">
                      (auto-calculated, editable)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPaymentForm.invoiceAmount}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "" && parseFloat(val) < 0) {
                        setPaymentFormErrors((prev) => ({ ...prev, invoiceAmount: "Value cannot be negative" }));
                        return;
                      }
                      setPaymentFormErrors((prev) => ({ ...prev, invoiceAmount: "" }));
                      setNewPaymentForm({
                        ...newPaymentForm,
                        invoiceAmount: val,
                      });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none ${paymentFormErrors.invoiceAmount ? "border-red-400" : "border-gray-200"}`}
                    placeholder="Auto-filled from expected amount + tax"
                  />
                  {paymentFormErrors.invoiceAmount && (
                    <p className="text-red-500 text-xs mt-1">{paymentFormErrors.invoiceAmount}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newPaymentForm.status}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COLLECTED">Collected</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="WAIVED">Waived</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={newPaymentForm.dueDate}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={newPaymentForm.notes}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none resize-none"
                    placeholder="e.g. Due before design kickoff"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowAddPaymentModal(false);
                    setPaymentFormErrors({ percentage: "", expectedAmount: "", taxPercentage: "", invoiceAmount: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleCreatePayment}
                  disabled={isSavingNewPayment}
                >
                  {isSavingNewPayment ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isSavingNewPayment ? "Creating..." : "Add Payment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && editingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Update Payment
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {editingPayment.title ||
                      `${editingPayment.phaseType} Payment ${editingPayment.paymentStage}`}
                    {" · "}Expected:{" "}
                    {formatCurrency(
                      parseFloat(String(editingPayment.expectedAmount)) || 0,
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={paymentForm.status}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, status: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COLLECTED">Collected</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="WAIVED">Waived</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                  </select>
                </div>

                {/* Actual Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Amount Collected (₹)
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={paymentForm.actualAmount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        actualAmount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                    placeholder="e.g. 59000"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                  >
                    <option value="">Select method...</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Transaction Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transactionRef}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        transactionRef: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                    placeholder="e.g. UTR123456789"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none resize-none"
                    placeholder="e.g. Payment received via NEFT"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSavePayment}
                  disabled={isSavingPayment}
                >
                  {isSavingPayment ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSavingPayment ? "Saving..." : "Update Payment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Invoice Modal */}
      {showSendInvoiceModal && invoiceTargetPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Send className="w-5 h-5 text-green-600" />
                    {invoiceSendMode === "proforma"
                      ? "Send Invoice"
                      : "Send Proforma Invoice"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {invoiceTargetPayment.title ||
                      `Stage ${invoiceTargetPayment.paymentStage}`}{" "}
                    — ₹{invoiceTargetPayment.expectedAmount}
                  </p>
                </div>
                <button
                  onClick={() => setShowSendInvoiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recipient
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Email *
                    </label>
                    <input
                      type="email"
                      value={sendInvoiceForm.toEmail}
                      onChange={(e) =>
                        setSendInvoiceForm({
                          ...sendInvoiceForm,
                          toEmail: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Name *
                    </label>
                    <input
                      type="text"
                      value={sendInvoiceForm.toName}
                      onChange={(e) =>
                        setSendInvoiceForm({
                          ...sendInvoiceForm,
                          toName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                      placeholder="Client Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CC Emails{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={sendInvoiceForm.ccEmails}
                    onChange={(e) =>
                      setSendInvoiceForm({
                        ...sendInvoiceForm,
                        ccEmails: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none resize-none text-sm"
                    placeholder="finance@example.com, owner@example.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Separate multiple emails with comma, semicolon, space, or
                    new line.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload File{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50/60">
                    <div className="flex flex-col gap-2">
                      {sendInvoiceForm.attachments.length > 0 &&
                        sendInvoiceForm.attachments.map((file, index) => (
                          <div
                            key={`${file.fileName}-${index}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">
                                {file.fileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSendInvoiceForm((prev) => ({
                                  ...prev,
                                  attachments: prev.attachments.filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                      <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer w-fit">
                        <Upload className="w-4 h-4" />
                        {sendInvoiceForm.attachments.length > 0
                          ? "Add More Files"
                          : "Choose File"}
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleSendInvoiceFileChange}
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Selected files will be sent as attachments with this invoice email.
                  </p>
                </div>
                {invoiceSendMode === "invoice" && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
                      Bank Details
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name *
                      </label>
                      <input
                        type="text"
                        value={sendInvoiceForm.accountName}
                        onChange={(e) =>
                          setSendInvoiceForm({
                            ...sendInvoiceForm,
                            accountName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                        placeholder="GoodHomeStory Interiors Pvt Ltd"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          value={sendInvoiceForm.accountNumber}
                          onChange={(e) =>
                            setSendInvoiceForm({
                              ...sendInvoiceForm,
                              accountNumber: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          value={sendInvoiceForm.ifscCode}
                          onChange={(e) =>
                            setSendInvoiceForm({
                              ...sendInvoiceForm,
                              ifscCode: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                          placeholder="HDFC0001234"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          value={sendInvoiceForm.bankName}
                          onChange={(e) =>
                            setSendInvoiceForm({
                              ...sendInvoiceForm,
                              bankName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                          placeholder="HDFC Bank"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          UPI ID{" "}
                          <span className="text-gray-400 font-normal">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={sendInvoiceForm.upiId}
                          onChange={(e) =>
                            setSendInvoiceForm({
                              ...sendInvoiceForm,
                              upiId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none text-sm"
                          placeholder="goodhomestory@upi"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={sendInvoiceForm.customMessage}
                    onChange={(e) =>
                      setSendInvoiceForm({
                        ...sendInvoiceForm,
                        customMessage: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus-visible:outline-none resize-none text-sm"
                    placeholder="Thank you for choosing GoodHomeStory!..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowSendInvoiceModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSendInvoice}
                  disabled={isSendingInvoice}
                >
                  {isSendingInvoice ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSendingInvoice
                    ? "Sending..."
                    : invoiceSendMode === "proforma"
                      ? "Send Invoice"
                      : "Send Proforma Invoice"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoiceSentSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Email Sent Successfully
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {invoiceSentSuccessMessage}
                  </p>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setShowInvoiceSentSuccessModal(false);
                  setInvoiceSentSuccessMessage("");
                }}
              >
                Okay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadDocModal && docTargetPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-purple-600" />
                    Upload Document
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {docTargetPayment.title ||
                      `Stage ${docTargetPayment.paymentStage}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadDocModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={uploadDocForm.documentType}
                    onChange={(e) =>
                      setUploadDocForm({
                        ...uploadDocForm,
                        documentType: e.target.value as
                          | "receipt"
                          | "invoice"
                          | "other",
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus-visible:outline-none"
                  >
                    <option value="receipt">Receipt</option>
                    <option value="invoice">Invoice</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Files *
                  </label>

                  {/* Drop zone — always visible so more files can be added */}
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors">
                    <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">
                      Click to select files
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, JPG, PNG supported · multiple allowed
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleDocFileChange}
                    />
                  </label>

                  {/* Selected files list */}
                  {uploadDocFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {uploadDocFiles.length} file
                        {uploadDocFiles.length > 1 ? "s" : ""} selected
                      </p>
                      {uploadDocFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 px-3 py-2.5 bg-purple-50 border border-purple-100 rounded-xl"
                        >
                          <FileText className="w-5 h-5 text-purple-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {f.fileName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {f.fileType}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setUploadDocFiles((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="p-1 hover:bg-purple-200 rounded-lg transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4 text-purple-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowUploadDocModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleUploadDoc}
                  disabled={isUploadingDoc || uploadDocFiles.length === 0}
                >
                  {isUploadingDoc ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileUp className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingDoc
                    ? "Uploading..."
                    : uploadDocFiles.length > 1
                      ? `Upload ${uploadDocFiles.length} Documents`
                      : "Upload Document"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Receipts Modal */}
      {showViewReceiptsModal && viewReceiptsPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-teal-600" />
                    Uploaded Documents
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {viewReceiptsPayment.title ||
                      `Stage ${viewReceiptsPayment.paymentStage}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewReceiptsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Build deduplicated list: prefer API documents array, then local map, then single receiptUrl */}
              {(() => {
                // Always read the live payment from the store so any mergePaymentUpdate
                // call (from an upload) is reflected without needing to re-open the modal.
                const livePayment =
                  projectPayments.find(
                    (p) => p.id === viewReceiptsPayment.id,
                  ) ?? viewReceiptsPayment;
                const apiDocs: Array<{
                  url: string;
                  fileName: string;
                  documentType: string;
                }> =
                  livePayment.documents && livePayment.documents.length > 0
                    ? livePayment.documents.map((d) => ({
                        url: d.url,
                        fileName: d.fileName || "Document",
                        documentType: d.documentType,
                      }))
                    : [];

                const localDocs =
                  paymentDocumentsMap[viewReceiptsPayment.id] || [];

                // Merge: Combine all document sources
                const merged = [...apiDocs];

                // Add local docs if not already present by URL
                localDocs.forEach((ld) => {
                  if (!merged.some((d) => d.url === ld.url)) {
                    merged.push(ld);
                  }
                });

                // Add legacy receiptUrl if not present
                if (
                  livePayment.receiptUrl &&
                  !merged.some((d) => d.url === livePayment.receiptUrl)
                ) {
                  merged.push({
                    url: livePayment.receiptUrl,
                    fileName: livePayment.receiptFileName || "Receipt",
                    documentType: "receipt",
                  });
                }

                if (merged.length === 0) {
                  return viewReceiptsLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                      <svg
                        className="animate-spin h-4 w-4 text-teal-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Loading documents…
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No documents found.
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {merged.length} document{merged.length > 1 ? "s" : ""}
                      </p>
                      {viewReceiptsLoading && (
                        <span className="flex items-center gap-1 text-xs text-teal-500">
                          <svg
                            className="animate-spin h-3 w-3"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Refreshing…
                        </span>
                      )}
                    </div>
                    {merged.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-teal-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {doc.documentType}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.fileName}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors flex-shrink-0"
                          title="Open / download"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-6">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowViewReceiptsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Attachment Upload Modal */}
      {showAttachmentUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-teal-600" />
                  {attachmentUploadContext === "work"
                    ? "Upload Work"
                    : "Upload Document"}
                </h3>
                <button
                  onClick={() => {
                    setShowAttachmentUploadModal(false);
                    setAttachmentUploadContext("general");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors">
                    {attachmentUploadForm.fileName ? (
                      <div className="text-center px-4">
                        <FileText className="w-8 h-8 text-teal-500 mx-auto mb-1" />
                        <p className="text-sm font-medium text-teal-700 truncate max-w-full">
                          {attachmentUploadForm.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachmentUploadForm.fileType}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Click to select file
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF, JPG, PNG, DOCX supported
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.xls"
                      onChange={handleAttachmentFileChange}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={attachmentUploadForm.notes}
                    onChange={(e) =>
                      setAttachmentUploadForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add any notes about this document..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus-visible:outline-none resize-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowAttachmentUploadModal(false);
                    setAttachmentUploadContext("general");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={handleUploadAttachment}
                  disabled={
                    isUploadingAttachment || !attachmentUploadForm.fileBase64
                  }
                >
                  {isUploadingAttachment ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingAttachment ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Attachments Modal (Payments Tab) */}
      {showWorkAttachmentsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-teal-600" />
                  Uploaded Work Attachments
                </h3>
                <button
                  onClick={() => setShowWorkAttachmentsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {projectAttachments.filter(
                (attachment) => attachment.attachmentType === "QUICK_ACTION",
              ).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No work attachments uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectAttachments
                    .filter(
                      (attachment) => attachment.attachmentType === "QUICK_ACTION",
                    )
                    .map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {formatDate(attachment.createdAt)}
                          </p>
                          {attachment.notes && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {attachment.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewAttachment(attachment)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                          title="View attachment"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowWorkAttachmentsModal(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    setShowWorkAttachmentsModal(false);
                    setAttachmentUploadContext("work");
                    setAttachmentUploadForm({
                      attachmentType: "QUICK_ACTION",
                      fileName: "",
                      fileType: "",
                      fileBase64: "",
                      notes: "",
                    });
                    setShowAttachmentUploadModal(true);
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Work
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attachment Modal */}
      {editingAttachment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-orange-500" />
                  Edit Document
                </h3>
                <button
                  onClick={() => setEditingAttachment(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 truncate">
                {editingAttachment.fileName}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={editAttachmentForm.attachmentType}
                    onChange={(e) =>
                      setEditAttachmentForm((prev) => ({
                        ...prev,
                        attachmentType: e.target.value as AttachmentType,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none"
                  >
                    <option value="FLOOR_PLAN">Floor Plan</option>
                    <option value="SITE_PHOTO">Site Photo</option>
                    <option value="RENDER_3D">3D Render</option>
                    <option value="BOQ">BOQ</option>
                    <option value="QUOTE_PDF">Quote PDF</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="APPROVAL_DOCUMENT">Approval Document</option>
                    <option value="SIGN_OFF">Sign Off</option>
                    <option value="WARRANTY_DOCUMENT">Warranty Document</option>
                    <option value="INVOICE_PDF">Invoice PDF</option>
                    <option value="ID_PROOF">ID Proof</option>
                    <option value="QUICK_ACTION">Quick Action</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editAttachmentForm.notes}
                    onChange={(e) =>
                      setEditAttachmentForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add notes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none resize-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingAttachment(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleUpdateAttachment}
                  disabled={isUpdatingAttachment}
                >
                  {isUpdatingAttachment ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isUpdatingAttachment ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showSendReminderModal && reminderTargetPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-orange-500" />
                    Send Payment Reminder
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {reminderTargetPayment.title ||
                      `Stage ${reminderTargetPayment.paymentStage}`}{" "}
                    — ₹{reminderTargetPayment.expectedAmount}
                  </p>
                </div>
                <button
                  onClick={() => setShowSendReminderModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Email *
                    </label>
                    <input
                      type="email"
                      value={sendReminderForm.toEmail}
                      onChange={(e) =>
                        setSendReminderForm({
                          ...sendReminderForm,
                          toEmail: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none text-sm"
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Name *
                    </label>
                    <input
                      type="text"
                      value={sendReminderForm.toName}
                      onChange={(e) =>
                        setSendReminderForm({
                          ...sendReminderForm,
                          toName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none text-sm"
                      placeholder="Client Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={sendReminderForm.customMessage}
                    onChange={(e) =>
                      setSendReminderForm({
                        ...sendReminderForm,
                        customMessage: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus-visible:outline-none resize-none text-sm"
                    placeholder="Gentle reminder to complete the payment..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowSendReminderModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                >
                  {isSendingReminder ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BellRing className="w-4 h-4 mr-2" />
                  )}
                  {isSendingReminder ? "Sending..." : "Send Reminder"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-orange-50 to-white rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Project
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Update all project details
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              {/* — Basic Info — */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-3">
                  Basic Info
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={editForm.projectName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          projectName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                      placeholder="e.g., Villa Interior Design"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tentative Handover Date
                    </label>
                    <input
                      type="date"
                      value={editForm.tentativeHandoverDate}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          tentativeHandoverDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* — Property Details — */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-3">
                  Property Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Property Address
                    </label>
                    <input
                      type="text"
                      value={editForm.propertyAddress}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          propertyAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="Street address"
                    />
                  </div>
                </div>
              </div>

              {/* — Site Contact — */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-3">
                  Site Contact
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={editForm.siteContactName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          siteContactName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="Site supervisor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.siteContactPhone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          siteContactPhone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* — Team & Design — */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-3">
                  Team & Design
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Design Team
                      </label>
                      <input
                        type="text"
                        value={editForm.designTeam}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            designTeam: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                        placeholder="Sathish, Thrisha"
                      />
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const current = editForm.designTeam
                            ? editForm.designTeam
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : [];
                          if (!current.includes(val)) {
                            setEditForm((prev) => ({
                              ...prev,
                              designTeam: [...current, val].join(", "),
                            }));
                          }
                          e.target.value = "";
                        }}
                        className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="">+ Add Member</option>
                        {teamMembersList.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role?.replace(/_/g, " ")})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Execution Team
                      </label>
                      <input
                        type="text"
                        value={editForm.executionTeam}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            executionTeam: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                        placeholder="Dilip, Santhosh"
                      />
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const current = editForm.executionTeam
                            ? editForm.executionTeam
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : [];
                          if (!current.includes(val)) {
                            setEditForm((prev) => ({
                              ...prev,
                              executionTeam: [...current, val].join(", "),
                            }));
                          }
                          e.target.value = "";
                        }}
                        className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="">+ Add Member</option>
                        {teamMembersList.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role?.replace(/_/g, " ")})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* — Financials — */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-3">
                  Financials
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Design Value (₹)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.designValue}
                      onChange={(e) =>
                        setEditForm({ ...editForm, designValue: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="e.g., 2250000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Execution Value (₹)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.executionValue}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          executionValue: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="e.g., 5250000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Total Value (₹)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.totalValue}
                      onChange={(e) =>
                        setEditForm({ ...editForm, totalValue: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="e.g., 5000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Paid Amount (₹)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.paidAmount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, paidAmount: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                      placeholder="e.g., 2500000"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Billing Address
                  </label>
                  <textarea
                    value={editForm.billingAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        billingAddress: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none resize-none text-sm"
                    placeholder="Updated billing address"
                  />
                </div>
              </div>

              {/* — Notes — */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-3">
                  Notes
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Special Requirements
                    </label>
                    <textarea
                      value={editForm.specialRequirements}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          specialRequirements: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none resize-none text-sm"
                      placeholder="Vastu-compliant, eco-friendly materials, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Remarks
                    </label>
                    <textarea
                      value={editForm.remarks}
                      onChange={(e) =>
                        setEditForm({ ...editForm, remarks: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none resize-none text-sm"
                      placeholder="Internal remarks or priority notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Project?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete &quot;{projectName}&quot;? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Project Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Pause className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Pause Project
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowPauseModal(false);
                    setPauseReasonError("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pause Duration (days){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={pauseForm.pauseDays}
                    onChange={(e) =>
                      setPauseForm({
                        ...pauseForm,
                        pauseDays: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Number of days to pause"
                  />
                </div>

                {/* Pause date range preview */}
                {pauseForm.pauseDays >= 1 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-800">
                        Pause Period
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-yellow-600 font-medium">
                          From
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date().toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex-1 mx-3 border-t border-dashed border-yellow-300 relative">
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-50 px-1.5 text-[10px] text-yellow-600 font-medium">
                          {pauseForm.pauseDays}d
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-yellow-600 font-medium">
                          Until
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {(() => {
                            const d = new Date();
                            d.setDate(d.getDate() + pauseForm.pauseDays);
                            return d.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            });
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pauseForm.reason}
                    onChange={(e) => {
                      const nextReason = e.target.value;
                      setPauseForm({ ...pauseForm, reason: nextReason });
                      if (pauseReasonError && nextReason.trim()) {
                        setPauseReasonError("");
                      }
                    }}
                    onBlur={() => {
                      if (!pauseForm.reason.trim()) {
                        setPauseReasonError(
                          "Please add a reason before pausing the project.",
                        );
                      }
                    }}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 resize-none ${
                      pauseReasonError
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                    placeholder="Why is this project being paused?"
                  />
                  {pauseReasonError && (
                    <p className="mt-2 text-sm text-red-600">{pauseReasonError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowPauseModal(false);
                    setPauseReasonError("");
                  }}
                  disabled={isPausingProject}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handlePauseProject}
                  disabled={isPausingProject}
                >
                  {isPausingProject ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Pause className="w-4 h-4 mr-2" />
                  )}
                  Pause Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {(() => {
                const actions = getStatusActions();
                const action = actions.find(
                  (a) => a.action === showStatusConfirm,
                );
                if (!action) return null;

                const iconBg =
                  showStatusConfirm === "cancel"
                    ? "bg-red-100"
                    : showStatusConfirm === "complete"
                      ? "bg-green-100"
                      : "bg-blue-100";
                const iconColor =
                  showStatusConfirm === "cancel"
                    ? "text-red-600"
                    : showStatusConfirm === "complete"
                      ? "text-green-600"
                      : "text-blue-600";
                const btnClass =
                  showStatusConfirm === "cancel"
                    ? "bg-red-500 hover:bg-red-600"
                    : showStatusConfirm === "complete"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-blue-500 hover:bg-blue-600";

                return (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <div
                        className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center`}
                      >
                        <span className={`${iconColor}`}>{action.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                      {action.confirmTitle}
                    </h3>
                    <p className="text-gray-600 text-center mb-6">
                      {action.confirmMessage}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowStatusConfirm(null)}
                        disabled={isChangingStatus}
                      >
                        Cancel
                      </Button>
                      <Button
                        className={`flex-1 ${btnClass} text-white`}
                        onClick={() => handleStatusAction(showStatusConfirm)}
                        disabled={isChangingStatus}
                      >
                        {isChangingStatus ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          action.icon
                        )}
                        {action.label}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for info items
const InfoItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
      {label}
    </p>
    <p className="text-base font-bold text-gray-900">{value}</p>
  </div>
);

// Helper component for team members
const TeamMemberItem: React.FC<{
  name: string;
  role: string;
  email?: string;
  phone?: string;
  badge?: string;
}> = ({ name, role, email, phone, badge }) => (
  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 via-white to-orange-50/20 rounded-xl border border-gray-100">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
      {name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-bold text-gray-900 truncate">{name}</p>
        {badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">{role}</p>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1 mt-0.5"
        >
          <Phone className="w-3 h-3" />
          {phone}
        </a>
      )}
    </div>
    {email && (
      <a
        href={`mailto:${email}`}
        className="w-10 h-10 rounded-lg bg-white border border-orange-200 flex items-center justify-center text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all flex-shrink-0"
        title={email}
      >
        <Mail className="w-4 h-4" />
      </a>
    )}
  </div>
);
