import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Edit2,
  Save,
  Award,
  MessageCircle,
  Briefcase,
  UserPlus,
  Gift,
  Trash2,
  FileText,
  Clock,
  Users,
  FolderOpen,
  Upload,
  X,
  Plus,
  AlertCircle,
  StickyNote,
  Link2,
  Download,
  Image,
  File,
  ExternalLink,
  Home,
  DollarSign,
  Layers,
  Tag,
  Info,
  Shield,
  CreditCard,
  Building2,
  BadgeCheck,
  Pencil,
} from "lucide-react";
import { Button, Badge, Card } from "../../components/ui";
import toast from "react-hot-toast";
import ContactAPI, { type Contact } from "../../services/contactApi";
import LeadAPI, { type Lead as LeadOption } from "../../services/leadApi";
import { fetchAPI } from "../../services/api";
import CustomerAPI, {
  Customer as APICustomer,
  uploadKycDocument,
  saveBankDetailsApi,
  getBankDetails,
  type KycDocType,
  type KycDocument,
} from "../../services/customerApi";
import {
  listAttachments,
  getAttachment,
  deleteAttachment,
  uploadAttachment,
  fileToBase64,
  mimeToAttachmentType,
  type Attachment,
} from "../../services/attachmentApi";
import { useCustomerStore } from "../../stores/customerStore";
import { listProjects } from "../../services/projectApi";
import type { Project } from "../../types";

interface FamilyMember {
  id?: string;
  firstName?: string;
  lastName?: string;
  relationship: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  notes?: string;
  // legacy compat
  name?: string;
  age?: string;
}

interface ImportantDate {
  id?: string;
  dateType: string;
  date: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
}

interface Referral {
  name: string;
  phone: string;
  status: "contacted" | "converted" | "pending";
  date: string;
}

interface Note {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface AssignedProject {
  id: string;
  name: string;
  status: "active" | "on_hold" | "completed";
  progress: number;
}

interface Customer {
  id: string | number;
  customerNumber?: string;
  name: string;
  initials: string;
  bankDetails?: string;
  email: string;
  phone: string;
  location: string;
  projects: number;
  totalValue: number;
  status: "active" | "completed" | "inactive";
  rating: number;
  lastContact: string;
  photoUrl?: string;
  alternatePhone?: string;
  secondaryEmails?: string[];
  secondaryPhones?: string[];
  address?: string;
  familyMembers?: FamilyMember[];
  importantDates?: ImportantDate[];
  referrals?: Referral[];
  clientRanking?: "niche" | "regular" | "one-time" | "vip";
  communicationPreference?: "email" | "phone" | "whatsapp" | "in-person";
  notes?: Note[];
  occupation?: string;
  companyName?: string;
  assignedProjects?: AssignedProject[];
  leadId?: string; // Store the lead ID for fetching contacts
  type?: string;
  taxId?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  contactsCount?: number;
  projectsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  convertedFromLead?: APICustomer["convertedFromLead"] | null;
}

const statusColors = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};

const toCurrencyNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatCurrencyINR = (value: unknown): string => {
  const amount = toCurrencyNumber(value);
  return `₹${amount.toLocaleString("en-IN")}`;
};

const LEAD_REFERENCE_RENDERED_KEYS = new Set([
  "id",
  "name",
  "email",
  "phone",
  "source",
  "assignedToId",
  "status",
  "stage",
  "score",
  "priority",
  "createdAt",
  "updatedAt",
  "message",
  "requirements",
  "notes",
  "projectType",
  "propertyProjectType",
  "propertyType",
  "homeType",
  "bhkConfig",
  "carpetArea",
  "area",
  "city",
  "locality",
  "location",
  "projectStage",
  "projectScope",
  "scopeOfWork",
  "servicesInterested",
  "budget",
  "budgetRange",
  "budgetComfort",
  "timeline",
  "startTimeline",
  "expectedStartDate",
  "moveinDate",
  "serviceInterest",
  "designStyle",
  "colorPreferences",
  "referrerName",
  "referrerPhone",
  "referrerProjectNumber",
  "agentAgencyName",
  "agentAgencyDetails",
  "contacts",
  "stageHistory",
  "activities",
  "convertedToAccount",
  "inspirationImages",
  "references",
]);

const isLeadReferenceMeaningful = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

const formatLeadReferenceLabel = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatLeadReferenceValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const v = item as Record<string, unknown>;
          return (
            (v.name as string) ||
            (v.title as string) ||
            (v.label as string) ||
            JSON.stringify(item)
          );
        }
        return String(item);
      })
      .join(", ");
  }

  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    // Handle specific object shapes like { name, email, id }
    if (v.name && typeof v.name === "string") {
      return v.name;
    }
    if (v.title && typeof v.title === "string") {
      return v.title;
    }
    if (v.label && typeof v.label === "string") {
      return v.label;
    }
    
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

const getFileNameFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const rawFileName = pathSegments[pathSegments.length - 1];

    if (rawFileName) {
      return decodeURIComponent(rawFileName);
    }
  } catch {
    // Fall back to a generic label for malformed URLs.
  }

  return "Open file";
};

const getAdditionalLeadReferenceFields = (
  lead: LeadOption | null,
): Array<{ key: string; value: unknown }> => {
  if (!lead) return [];

  return Object.entries(lead)
    .filter(
      ([key, value]) =>
        !LEAD_REFERENCE_RENDERED_KEYS.has(key) &&
        isLeadReferenceMeaningful(value),
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
};

const rankingColors = {
  vip: { bg: "bg-purple-100", text: "text-purple-700", icon: "👑" },
  niche: { bg: "bg-orange-100", text: "text-orange-700", icon: "⭐" },
  regular: { bg: "bg-blue-100", text: "text-blue-700", icon: "👤" },
  "one-time": { bg: "bg-gray-100", text: "text-gray-700", icon: "📋" },
};

export const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { setCurrentCustomer } = useCustomerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "family"
    | "dates"
    | "referrals"
    | "notes"
    | "ranking"
    | "projects"
    | "references"
    | "kyc"
  >("overview");
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const isEditing = editingTab !== null;
  const [isSaving, setIsSaving] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{
    message: string;
    field?: "email" | "phone";
  } | null>(null);

  // Contact info edit state
  const [contactEditForm, setContactEditForm] = useState<{
    email: string;
    phone: string;
    secondaryEmails: string[];
    secondaryPhones: string[];
    newEmail: string;
    newPhone: string;
  }>({
    email: "",
    phone: "",
    secondaryEmails: [],
    secondaryPhones: [],
    newEmail: "",
    newPhone: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contacts state
  const [, setContacts] = useState<Contact[]>([]);

  // API referrals state
  const [apiReferrals, setApiReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Modal states
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form states
  const [familyForm, setFamilyForm] = useState({
    firstName: "",
    lastName: "",
    relationship: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    occupation: "",
    notes: "",
  });
  const [relationshipTypes, setRelationshipTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [dateForm, setDateForm] = useState({
    dateType: "BIRTHDAY",
    date: "",
    isRecurring: true,
    reminderDays: 7,
    notes: "",
  });
  const [referralForm, setReferralForm] = useState({ leadId: "" });
  const [allLeads, setAllLeads] = useState<LeadOption[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [noteForm, setNoteForm] = useState({
    content: "",
  });

  // Local customer data (in production, this would sync with backend)
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Customer projects state
  const [customerProjects, setCustomerProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Lead References state (for converted leads)
  const [leadReferenceData, setLeadReferenceData] = useState<LeadOption | null>(
    null,
  );
  const [leadAttachments, setLeadAttachments] = useState<Attachment[]>([]);
  const [loadingLeadReferences, setLoadingLeadReferences] = useState(false);
  const leadReferenceUploadInputRef = useRef<HTMLInputElement>(null);
  const [referenceUploadTitle, setReferenceUploadTitle] = useState("");
  const [referenceUploadFile, setReferenceUploadFile] = useState<File | null>(
    null,
  );
  const [uploadingReference, setUploadingReference] = useState(false);
  // Tracks which attachment is currently being fetched: { id, action }
  const [attachmentLoading, setAttachmentLoading] = useState<{
    id: string;
    action: "view" | "download";
  } | null>(null);

  // KYC state
  const kycFileInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedKyc = useRef(false);
  const [kycUploadTarget, setKycUploadTarget] = useState<string | null>(null);
  const [kycAttachments, setKycAttachments] = useState<KycDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const [kycDeleting, setKycDeleting] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState("");
  const [bankDetailsEditing, setBankDetailsEditing] = useState(false);
  const [bankDetailsSaving, setBankDetailsSaving] = useState(false);

  // Profile edit state (name, type, status)
  const [profileEditForm, setProfileEditForm] = useState<{
    name: string;
    type: string;
    status: string;
  }>({ name: "", type: "", status: "" });
  const [customerTypes, setCustomerTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [customerStatuses, setCustomerStatuses] = useState<
    { value: string; label: string }[]
  >([]);

  const KYC_DOCS = [
    {
      key: "AADHAR",
      label: "Aadhar Card",
      description: "12-digit government issued identity",
      required: true,
      icon: BadgeCheck,
      color: "blue",
    },
    {
      key: "PAN",
      label: "PAN Card",
      description: "Permanent Account Number card",
      required: true,
      icon: CreditCard,
      color: "orange",
    },
    {
      key: "GST_CERTIFICATE",
      label: "GST Certificate",
      description: "Goods & Services Tax registration",
      required: false,
      icon: Shield,
      color: "green",
    },
  ] as const;

  /**
   * Fetch a fresh signed downloadUrl from GET /api/attachments/:id
   * then open or download the file.
   */
  const handleAttachmentAction = async (
    attachment: Attachment,
    action: "view" | "download",
  ) => {
    if (attachmentLoading?.id === attachment.id) return; // already in-flight
    setAttachmentLoading({ id: attachment.id, action });
    try {
      const fresh = await getAttachment(attachment.id);
      const url = fresh.downloadUrl || fresh.fileUrl || fresh.storageUrl || "";
      if (!url) {
        toast.error("File URL not available");
        return;
      }
      if (action === "view") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        // Trigger download via a temporary anchor
        const a = document.createElement("a");
        a.href = url;
        a.download = fresh.fileName || attachment.fileName;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Failed to fetch attachment URL:", err);
      toast.error("Failed to load file. Please try again.");
    } finally {
      setAttachmentLoading(null);
    }
  };

  const getUploadFileName = (file: File, title: string): string => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return file.name;

    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop()}`
      : "";
    return `${cleanTitle}${extension}`;
  };

  const handleUploadLeadReference = async () => {
    if (uploadingReference) return;
    const leadId = customerData?.leadId;

    if (!leadId) {
      toast.error("Lead reference is not available for this customer");
      return;
    }

    if (!referenceUploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploadingReference(true);
    try {
      const fileBase64 = await fileToBase64(referenceUploadFile);
      const fileName = getUploadFileName(referenceUploadFile, referenceUploadTitle);

      const uploadedAttachment = await uploadAttachment({
        entityType: "LEAD",
        entityId: leadId,
        attachmentType: mimeToAttachmentType(referenceUploadFile.type),
        fileName,
        fileType: referenceUploadFile.type || "application/octet-stream",
        fileBase64,
        notes: referenceUploadTitle.trim() || "Customer reference upload",
      });

      // Fetch the freshly uploaded attachment by id as required by API flow.
      const freshAttachment = await getAttachment(uploadedAttachment.id);
      const normalizedAttachment = {
        ...uploadedAttachment,
        ...freshAttachment,
      } as Attachment;

      setLeadAttachments((prev) => {
        const deduped = prev.filter((a) => a.id !== normalizedAttachment.id);
        return [normalizedAttachment, ...deduped];
      });

      setReferenceUploadTitle("");
      setReferenceUploadFile(null);
      if (leadReferenceUploadInputRef.current) {
        leadReferenceUploadInputRef.current.value = "";
      }

      toast.success("Reference uploaded successfully");
    } catch (err) {
      console.error("Failed to upload reference:", err);
      toast.error("Failed to upload reference");
    } finally {
      setUploadingReference(false);
    }
  };

  // Initialize customer data from API
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) {
        console.error("No customer ID provided");
        return;
      }

      console.log("Fetching customer data for ID:", customerId);
      setLoadingCustomer(true);
      try {
        const apiCustomer = await CustomerAPI.getCustomerById(customerId);
        console.log("API Customer response:", apiCustomer);

        if (!apiCustomer) {
          throw new Error("No customer data received from API");
        }

        // Map API customer to UI format
        const customerName = apiCustomer.name || "Unknown Customer";
        const initials = customerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        // Extract email/phone from contacts array if available
        const apiContacts = apiCustomer.contacts || [];
        const primaryContact =
          apiContacts.find((c) => c.isPrimary) || apiContacts[0];
        const customerEmail =
          apiCustomer.email ||
          primaryContact?.email ||
          apiCustomer.convertedFromLead?.email ||
          "";
        const customerPhone =
          apiCustomer.phone ||
          primaryContact?.phone ||
          apiCustomer.convertedFromLead?.phone ||
          "";

        // Map family members from API
        const apiFamilyMembers: FamilyMember[] = (
          apiCustomer.familyMembers || []
        ).map((fm: any) => ({
          id: fm.id || undefined,
          firstName: fm.firstName || fm.name?.split(" ")[0] || "",
          lastName:
            fm.lastName || fm.name?.split(" ").slice(1).join(" ") || undefined,
          name:
            fm.name ||
            [fm.firstName, fm.lastName].filter(Boolean).join(" ") ||
            "",
          relationship: fm.relationship || "",
          dateOfBirth: fm.dateOfBirth || undefined,
          phone: fm.phone || undefined,
          email: fm.email || undefined,
          occupation: fm.occupation || undefined,
          notes: fm.notes || undefined,
          age: fm.age || undefined,
        }));

        // Map important dates from API
        const apiImportantDates: ImportantDate[] = (
          apiCustomer.importantDates || []
        ).map((d: any) => ({
          id: d.id,
          dateType: (d.dateType || d.type || "OTHER").toUpperCase(),
          date: d.date || "",
          isRecurring: d.isRecurring,
          reminderDays: d.reminderDays,
          notes: d.notes || d.title || "",
        }));

        // Map projects from API
        const apiProjects: AssignedProject[] = (apiCustomer.projects || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name || "Unnamed Project",
            status:
              (p.status?.toLowerCase() as "active" | "on_hold" | "completed") ||
              "active",
            progress: p.progress || 0,
          }),
        );
        const embeddedProjectTotalValue = (apiCustomer.projects || []).reduce(
          (sum: number, project: any) =>
            sum + toCurrencyNumber(project?.totalValue),
          0,
        );

        console.log("Raw API projects:", apiCustomer.projects);
        console.log("Mapped projects:", apiProjects);
        console.log("Projects count:", apiCustomer._count?.projects);

        // Build location from available address fields
        const locationParts = [
          apiCustomer.billingCity || apiCustomer.shippingCity,
          apiCustomer.billingState || apiCustomer.shippingState,
        ].filter(Boolean);
        const location =
          locationParts.length > 0
            ? locationParts.join(", ")
            : apiCustomer.billingAddress ||
              apiCustomer.shippingAddress ||
              "N/A";

        // Conversion responses can vary by backend version.
        // Resolve the original lead id from all known payload shapes.
        const resolvedLeadId =
          apiCustomer.convertedFromLeadId ||
          apiCustomer.convertedFromLead?.id ||
          (apiCustomer as any).leadId ||
          (apiCustomer as any).lead?.id ||
          undefined;

        const mappedCustomer: Customer = {
          id: apiCustomer.id, // Keep UUID as string
          customerNumber: apiCustomer.customerNumber || undefined,
          name: customerName,
          initials,
          bankDetails: apiCustomer.bankDetails || "",
          email: customerEmail,
          phone: customerPhone,
          location,
          projects: apiCustomer._count?.projects || apiProjects.length || 0,
          totalValue: embeddedProjectTotalValue,
          status:
            (apiCustomer.status?.toLowerCase() as
              | "active"
              | "completed"
              | "inactive") || "active",
          rating: 0,
          lastContact: apiCustomer.updatedAt
            ? new Date(apiCustomer.updatedAt).toLocaleDateString()
            : "N/A",
          photoUrl: undefined,
          alternatePhone: undefined,
          secondaryEmails: (apiCustomer as any).secondaryEmails || [],
          secondaryPhones: (apiCustomer as any).secondaryPhones || [],
          address:
            apiCustomer.billingAddress ||
            apiCustomer.shippingAddress ||
            undefined,
          familyMembers: apiFamilyMembers,
          importantDates: apiImportantDates,
          referrals: [],
          clientRanking: undefined,
          communicationPreference: undefined,
          notes: apiCustomer.notes
            ? [
                {
                  id: 1,
                  content: apiCustomer.notes,
                  createdBy: "System",
                  createdAt: apiCustomer.createdAt || "",
                },
              ]
            : [],
          occupation: undefined,
          companyName: undefined,
          assignedProjects: apiProjects,
          leadId: resolvedLeadId,
          type: apiCustomer.type,
          taxId: apiCustomer.taxId,
          billingAddress: apiCustomer.billingAddress,
          billingCity: apiCustomer.billingCity,
          billingState: apiCustomer.billingState,
          billingPincode: apiCustomer.billingPincode,
          shippingAddress: apiCustomer.shippingAddress,
          shippingCity: apiCustomer.shippingCity,
          shippingState: apiCustomer.shippingState,
          shippingPincode: apiCustomer.shippingPincode,
          ownerId: apiCustomer.ownerId,
          ownerName: apiCustomer.owner?.name,
          ownerEmail: apiCustomer.owner?.email,
          contactsCount:
            apiCustomer._count?.contacts || apiContacts.length || 0,
          projectsCount:
            apiCustomer._count?.projects || apiProjects.length || 0,
          createdAt: apiCustomer.createdAt,
          updatedAt: apiCustomer.updatedAt,
          convertedFromLead: apiCustomer.convertedFromLead || null,
        };

        setCustomerData(mappedCustomer);
        setBankDetails(apiCustomer.bankDetails || "");
        setCurrentCustomer({
          id: mappedCustomer.id as string,
          name: mappedCustomer.name,
        });
        console.log("Customer data mapped successfully:", mappedCustomer);
        console.log(
          "Assigned projects in customer:",
          mappedCustomer.assignedProjects,
        );
      } catch (error) {
        console.error("Failed to fetch customer. Error details:", error);
        console.error("Customer ID attempted:", customerId);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to load customer details: ${errorMessage}`);

        // Navigate back after a short delay to allow user to see error
        setTimeout(() => {
          navigate("/dashboard/customers");
        }, 2000);
      } finally {
        setLoadingCustomer(false);
      }
    };

    fetchCustomerData();
  }, [customerId, navigate, setCurrentCustomer]);

  // Reset lead reference data whenever the customer changes so stale
  // files from a previous customer are never shown.
  useEffect(() => {
    setLeadReferenceData(null);
    setLeadAttachments([]);
  }, [customerId]);

  // Load relationship types once on mount
  useEffect(() => {
    CustomerAPI.getFamilyRelationshipTypes().then(setRelationshipTypes);
  }, []);

  // Load customer types and statuses once on mount
  useEffect(() => {
    CustomerAPI.getCustomerTypes()
      .then(setCustomerTypes)
      .catch(() =>
        setCustomerTypes([
          { value: "RESIDENTIAL", label: "Residential" },
          { value: "COMMERCIAL", label: "Commercial" },
        ]),
      );
    CustomerAPI.getCustomerStatuses()
      .then(setCustomerStatuses)
      .catch(() =>
        setCustomerStatuses([
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "COMPLETED", label: "Completed" },
        ]),
      );
  }, []);

  // Clear current customer from store when leaving the page
  useEffect(() => {
    return () => {
      setCurrentCustomer(null);
    };
  }, [setCurrentCustomer]);

  // Fetch referrals from API
  const fetchReferrals = useCallback(async () => {
    if (!customerId) return;
    setLoadingReferrals(true);
    try {
      const data = await fetchAPI<any>(
        `/api/referrals/customer/${customerId}/leads`,
        { method: "GET" },
      );
      // Handle { referredLeads: [...] } shape from API
      const list = Array.isArray(data)
        ? data
        : data?.referredLeads ||
          data?.referrals ||
          data?.leads ||
          data?.data ||
          [];
      setApiReferrals(list);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoadingReferrals(false);
    }
  }, [customerId]);

  // Fetch referrals when the referrals tab is active
  useEffect(() => {
    if (activeTab === "referrals") {
      fetchReferrals();
    }
  }, [activeTab, fetchReferrals]);

  // Fetch KYC documents + bank details when the KYC tab is first opened
  useEffect(() => {
    if (activeTab !== "kyc") return;
    if (!customerId) return;
    if (hasFetchedKyc.current) return;
    hasFetchedKyc.current = true;

    const fetchKyc = async () => {
      setLoadingKyc(true);
      try {
        // Fetch all attachments for this account so we can filter for KYC docs
        // and fetch bank details in parallel
        const [allAttachments, savedBank] = await Promise.all([
          listAttachments("ACCOUNT", customerId, 200).catch((err) => {
            console.error("Failed to list attachments:", err);
            return [];
          }),
          getBankDetails(customerId).catch(() => ""),
        ]);

        // Filter only KYC-related documents
        const kycTypes = ["AADHAR", "PAN", "GST_CERTIFICATE"];
        const kycDocs = allAttachments.filter((a) =>
          kycTypes.includes(a.attachmentType),
        );

        // Fetch fresh details for each document to get the signed downloadUrl
        // This ensures the files don't "disappear" or become inaccessible on refresh
        const refreshedDocsPromises = kycDocs.map(async (doc) => {
          try {
            const fresh = await getAttachment(doc.id);
            return {
              ...doc, // keep list props
              ...fresh, // overwrite with fresh details
              // Normalize URL fields
              downloadUrl:
                fresh.downloadUrl || fresh.url || fresh.fileUrl || fresh.storageUrl,
              attachmentType: fresh.attachmentType as KycDocType,
            } as KycDocument;
          } catch (e) {
            console.warn(`Failed to refresh details for doc ${doc.id}`, e);
            // Fallback to the list item, casting type
            return {
              ...doc,
              attachmentType: doc.attachmentType as KycDocType,
            } as KycDocument;
          }
        });

        const refreshedDocs = await Promise.all(refreshedDocsPromises);
        setKycAttachments(refreshedDocs);

        setBankDetails((savedBank || customerData?.bankDetails || "").trim());
      } catch (error) {
        console.error("Error in KYC fetch flow:", error);
        toast.error("Failed to load KYC documents");
      } finally {
        setLoadingKyc(false);
      }
    };
    fetchKyc();
  }, [activeTab, customerId, customerData?.bankDetails]);

  const handleKycFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !kycUploadTarget || !customerId) return;
    const docType = kycUploadTarget as KycDocType;
    setKycUploadTarget(null);
    setKycUploading(docType);
    try {
      const uploaded = await uploadKycDocument(customerId, file, docType);
      // Replace any existing doc of the same type
      setKycAttachments((prev) => [
        ...prev.filter((a) => a.attachmentType !== docType),
        uploaded,
      ]);
      toast.success(
        `${KYC_DOCS.find((d) => d.key === docType)?.label ?? docType} uploaded successfully`,
      );
    } catch (err) {
      console.error("KYC upload error:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setKycUploading(null);
    }
  };

  const handleKycDelete = async (doc: KycDocument) => {
    if (
      !window.confirm(
        `Remove this ${doc.attachmentType.replace(/_/g, " ").toLowerCase()}?`,
      )
    )
      return;
    setKycDeleting(doc.id);
    try {
      await deleteAttachment(doc.id);
      setKycAttachments((prev) => prev.filter((a) => a.id !== doc.id));
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    } finally {
      setKycDeleting(null);
    }
  };

  const handleKycAction = (doc: KycDocument, action: "view" | "download") => {
    const url = doc.downloadUrl || doc.storageUrl || doc.fileUrl || "";
    if (!url) {
      toast.error("File URL not available");
      return;
    }
    if (action === "view") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!customerId) return;
    setBankDetailsSaving(true);
    try {
      const savedBankDetails = await saveBankDetailsApi(customerId, bankDetails);
      setBankDetails(savedBankDetails);
      setCustomerData((prev) =>
        prev ? { ...prev, bankDetails: savedBankDetails } : prev,
      );
      setBankDetailsEditing(false);
      toast.success("Bank details saved");
    } catch {
      toast.error("Failed to save bank details");
    } finally {
      setBankDetailsSaving(false);
    }
  };

  // Fetch lead reference data when overview/references needs it
  useEffect(() => {
    if (activeTab !== "references" && activeTab !== "overview") return;
    const leadId = customerData?.leadId;
    if (!leadId) return;
    if (leadReferenceData || loadingLeadReferences) return; // already loaded

    const fetchLeadReferences = async () => {
      setLoadingLeadReferences(true);
      try {
        const [leadResult, attachmentsResult] = await Promise.allSettled([
          LeadAPI.getLeadById(leadId),
          listAttachments("LEAD", leadId),
        ]);

        const lead =
          leadResult.status === "fulfilled" ? leadResult.value : null;
        const fallbackLeadFromCustomer =
          (customerData?.convertedFromLead as unknown as LeadOption | null) ||
          null;
        const rawAttachments =
          attachmentsResult.status === "fulfilled" ? attachmentsResult.value : [];

        if (leadResult.status === "rejected") {
          console.warn("Lead details unavailable, using attachments only:", leadResult.reason);
        }

        if (attachmentsResult.status === "rejected") {
          console.warn("Lead attachments unavailable:", attachmentsResult.reason);
        }

        // Filter client-side to guarantee only this lead's files are shown
        const attachments = rawAttachments.filter(
          (a) => a.entityId === leadId,
        );
        setLeadReferenceData(lead || fallbackLeadFromCustomer);
        setLeadAttachments(attachments);
      } catch (err) {
        console.error("Failed to load lead reference data:", err);
        toast.error("Failed to load lead reference data");
      } finally {
        setLoadingLeadReferences(false);
      }
    };

    fetchLeadReferences();
  }, [
    activeTab,
    customerData?.leadId,
    customerData?.convertedFromLead,
    leadReferenceData,
    loadingLeadReferences,
  ]);

  // Load leads list when referral modal opens
  useEffect(() => {
    if (!showReferralModal) return;
    setLoadingLeads(true);
    LeadAPI.listLeads({ limit: 200 })
      .then((res) => setAllLeads(res.leads || []))
      .catch(() => toast.error("Failed to load leads"))
      .finally(() => setLoadingLeads(false));
  }, [showReferralModal]);

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    if (!customerData?.id) return;

    try {
      // Use the customer's leadId if available, otherwise use customer ID
      const leadIdToUse = customerData.leadId || String(customerData.id);
      const response = await ContactAPI.listContacts({ leadId: leadIdToUse });
      const fetchedContacts = response.contacts || [];

      if (fetchedContacts.length > 0) {
        setContacts(fetchedContacts);

        // Update customer email and phone from the primary contact
        const primaryContact =
          fetchedContacts.find((c) => c.isPrimary) || fetchedContacts[0];
        setCustomerData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            email: primaryContact.email || prev.email || "",
            phone: primaryContact.phone || prev.phone || "",
          };
        });
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      // Don't show error toast on initial load - contacts may not exist yet
    }
  }, [customerData?.id, customerData?.leadId]);

  // Load contacts when customerData changes (but only once per customer)
  useEffect(() => {
    if (customerData?.id) {
      fetchContacts();
    }
  }, [customerData?.id, customerData?.leadId, fetchContacts]);

  // Fetch projects for this customer
  useEffect(() => {
    const fetchCustomerProjects = async () => {
      if (!customerData?.id) return;

      setProjectsLoading(true);
      try {
        const response = await listProjects({
          accountId: String(customerData.id),
          limit: 5000,
        });
        setCustomerProjects(response.projects);
        const totalValueFromProjects = (response.projects || []).reduce(
          (sum, project) => sum + toCurrencyNumber(project.totalValue),
          0,
        );
        const projectCount = response.projects?.length || 0;
        setCustomerData((prev) =>
          prev
            ? {
                ...prev,
                projects: projectCount,
                projectsCount: projectCount,
                totalValue: totalValueFromProjects,
              }
            : prev,
        );
        console.log(
          `Found ${response.projects.length} projects for customer:`,
          response.projects,
        );
      } catch (error) {
        console.error("Error fetching customer projects:", error);
        toast.error("Failed to load customer projects");
      } finally {
        setProjectsLoading(false);
      }
    };

    if (customerData?.id) {
      fetchCustomerProjects();
    }
  }, [customerData?.id]);

  const customer = customerData;
  const additionalLeadReferenceFields =
    getAdditionalLeadReferenceFields(leadReferenceData);

  const getValidationDetails = (
    error: unknown,
  ): { message: string; field?: "email" | "phone" } => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to save changes";

    const lowered = message.toLowerCase();
    if (lowered.includes("email") && lowered.includes("exist")) {
      return { message, field: "email" };
    }
    if (lowered.includes("phone") && lowered.includes("exist")) {
      return { message, field: "phone" };
    }

    return { message };
  };

  // Save customer data to backend
  const handleSaveCustomer = async (updates: Partial<Customer>) => {
    if (!customer || isSaving) return;

    setIsSaving(true);
    setValidationAlert(null);
    const previousData = { ...customer };

    // Optimistic update
    setCustomerData((prev) => (prev ? { ...prev, ...updates } : prev));

    try {
      // Map UI fields to API fields
      const apiUpdates: any = {};

      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.status !== undefined)
        apiUpdates.status = updates.status.toUpperCase();
      if (updates.type !== undefined)
        apiUpdates.type = updates.type.toUpperCase();
      if (updates.email !== undefined) {
        const normalizedEmail = updates.email.trim();
        apiUpdates.email = normalizedEmail.length > 0 ? normalizedEmail : null;
      }
      if (updates.phone !== undefined) {
        const normalizedPhone = updates.phone.trim();
        apiUpdates.phone = normalizedPhone.length > 0 ? normalizedPhone : null;
      }
      if (updates.notes !== undefined) {
        apiUpdates.notes =
          updates.notes && updates.notes.length > 0
            ? updates.notes.map((n) => n.content).join("\n")
            : null;
      }
      if (updates.familyMembers !== undefined) {
        apiUpdates.familyMembers = updates.familyMembers;
      }
      if (updates.importantDates !== undefined) {
        apiUpdates.importantDates = updates.importantDates;
      }
      if (updates.secondaryEmails !== undefined) {
        apiUpdates.secondaryEmails = updates.secondaryEmails;
      }
      if (updates.secondaryPhones !== undefined) {
        apiUpdates.secondaryPhones = updates.secondaryPhones;
      }
      if (updates.clientRanking !== undefined) {
        // Store in notes or custom field if available
        const rankingNote = `Client Ranking: ${updates.clientRanking}`;
        apiUpdates.notes = apiUpdates.notes
          ? `${apiUpdates.notes}\n${rankingNote}`
          : rankingNote;
      }

      await CustomerAPI.updateCustomer(String(customer.id), apiUpdates);
      setValidationAlert(null);
      toast.success("Customer updated successfully!");
      return true;
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      // Rollback
      setCustomerData(previousData);
      const { message, field } = getValidationDetails(error);
      setValidationAlert({ message, field });
      toast.error(message || "Failed to save changes");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers
  const resetFamilyForm = () =>
    setFamilyForm({
      firstName: "",
      lastName: "",
      relationship: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      occupation: "",
      notes: "",
    });

  const handleAddFamily = async () => {
    if (!customer || !familyForm.firstName || !familyForm.relationship) return;

    setIsSaving(true);
    try {
      const payload: any = {
        firstName: familyForm.firstName,
        relationship: familyForm.relationship,
      };
      if (familyForm.lastName) payload.lastName = familyForm.lastName;
      if (familyForm.dateOfBirth) payload.dateOfBirth = familyForm.dateOfBirth;
      if (familyForm.phone) payload.phone = familyForm.phone;
      if (familyForm.email) payload.email = familyForm.email;
      if (familyForm.occupation) payload.occupation = familyForm.occupation;
      if (familyForm.notes) payload.notes = familyForm.notes;

      const result = await CustomerAPI.addFamilyMember(
        String(customer.id),
        payload,
      );

      // Optimistically add the new member to local state
      const newMember: FamilyMember = {
        id: result?.familyMember?.id || result?.id || String(Date.now()),
        firstName: familyForm.firstName,
        lastName: familyForm.lastName || undefined,
        relationship: familyForm.relationship,
        dateOfBirth: familyForm.dateOfBirth || undefined,
        phone: familyForm.phone || undefined,
        email: familyForm.email || undefined,
        occupation: familyForm.occupation || undefined,
        notes: familyForm.notes || undefined,
        name: [familyForm.firstName, familyForm.lastName]
          .filter(Boolean)
          .join(" "),
      };

      setCustomerData((prev) =>
        prev
          ? {
              ...prev,
              familyMembers: [...(prev.familyMembers || []), newMember],
            }
          : prev,
      );

      resetFamilyForm();
      setShowFamilyModal(false);
      toast.success("Family member added successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add family member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFamily = async () => {
    if (!editingMember?.id || !familyForm.firstName || !familyForm.relationship)
      return;

    setIsSaving(true);
    try {
      const payload: any = {
        firstName: familyForm.firstName,
        relationship: familyForm.relationship,
      };
      if (familyForm.lastName !== undefined)
        payload.lastName = familyForm.lastName;
      if (familyForm.dateOfBirth !== undefined)
        payload.dateOfBirth = familyForm.dateOfBirth;
      if (familyForm.phone !== undefined) payload.phone = familyForm.phone;
      if (familyForm.email !== undefined) payload.email = familyForm.email;
      if (familyForm.occupation !== undefined)
        payload.occupation = familyForm.occupation;
      if (familyForm.notes !== undefined) payload.notes = familyForm.notes;

      await CustomerAPI.updateFamilyMember(editingMember.id, payload);

      // Update local state
      setCustomerData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          familyMembers: (prev.familyMembers || []).map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  firstName: familyForm.firstName,
                  lastName: familyForm.lastName || undefined,
                  relationship: familyForm.relationship,
                  dateOfBirth: familyForm.dateOfBirth || undefined,
                  phone: familyForm.phone || undefined,
                  email: familyForm.email || undefined,
                  occupation: familyForm.occupation || undefined,
                  notes: familyForm.notes || undefined,
                  name: [familyForm.firstName, familyForm.lastName]
                    .filter(Boolean)
                    .join(" "),
                }
              : m,
          ),
        };
      });

      resetFamilyForm();
      setEditingMember(null);
      setShowFamilyModal(false);
      toast.success("Family member updated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update family member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDate = async () => {
    if (!customer || !dateForm.dateType || !dateForm.date) return;

    setIsSaving(true);
    try {
      const payload = {
        dateType: dateForm.dateType,
        date: dateForm.date,
        isRecurring: dateForm.isRecurring,
        reminderDays: Number(dateForm.reminderDays),
        notes: dateForm.notes,
      };

      const result = await CustomerAPI.addImportantDate(
        String(customer.id),
        payload,
      );

      // Optimistically update local state
      setCustomerData((prev) => {
        if (!prev) return prev;
        const newDate: ImportantDate = {
          id: result.id,
          dateType: result.dateType,
          date: result.date,
          isRecurring: result.isRecurring,
          reminderDays: result.reminderDays,
          notes: result.notes,
        };
        return {
          ...prev,
          importantDates: [...(prev.importantDates || []), newDate],
        };
      });

      setDateForm({
        dateType: "BIRTHDAY",
        date: "",
        isRecurring: true,
        reminderDays: 7,
        notes: "",
      });
      setShowDateModal(false);
      toast.success("Important date added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add important date");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReferral = async () => {
    if (!referralForm.leadId || !customerId) return;

    try {
      await fetchAPI("/api/referrals/refer-lead", {
        method: "POST",
        body: JSON.stringify({
          leadId: referralForm.leadId,
          customerId,
        }),
      });

      setReferralForm({ leadId: "" });
      setShowReferralModal(false);
      toast.success("Referral added successfully!");
      // Refresh the list from API
      fetchReferrals();
    } catch (err) {
      console.error("Failed to add referral:", err);
      toast.error("Failed to add referral. Please try again.");
    }
  };

  const handleAddNote = async () => {
    if (!customer || !noteForm.content) return;

    const newNote = {
      id: Date.now(),
      content: noteForm.content,
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(customer.notes || []), newNote];

    const success = await handleSaveCustomer({ notes: updatedNotes });

    if (success) {
      setNoteForm({ content: "" });
      setShowNoteModal(false);
      toast.success("Note added successfully!");
    }
  };

  // Handle photo upload
  // Handle photo upload
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !customer) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create a preview URL (in production, you'd upload to a server)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoUrl = reader.result as string;
      // Note: The backend API doesn't support photoUrl field yet
      // So we just update local state for now
      setCustomerData((prev) => (prev ? { ...prev, photoUrl } : prev));
      toast.success("Photo uploaded successfully!");
      // TODO: Upload to server and save photoUrl when backend supports it
    };
    reader.readAsDataURL(file);
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!customer || isDeleting) return;

    setIsDeleting(true);

    try {
      // Call API to delete customer
      await CustomerAPI.deleteCustomer(String(customer.id));

      // Show success toast
      toast.success(`Customer "${customer.name}" deleted successfully!`);

      // Navigate back to customers list after short delay
      setTimeout(() => {
        navigate("/dashboard/customers");
      }, 500);
    } catch (error: any) {
      console.error("Failed to delete customer:", error);

      // Show error toast with specific message
      const errorMessage = error?.message || "Failed to delete customer";
      toast.error(errorMessage);

      // Keep dialog open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  // Find customer by ID
  // const customer = mockCustomers.find((c) => c.id === Number(customerId));

  if (loadingCustomer) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-orange-50/30 via-gray-50 to-white py-6">
        <div className="max-w-7xl mx-auto px-4 space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-6 w-44 rounded-lg bg-gray-200" />
            <div className="h-9 w-32 rounded-xl bg-gray-200" />
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="h-9 w-72 rounded-xl bg-gray-200" />
                <div className="h-5 w-56 rounded-lg bg-gray-200" />
              </div>
              <div className="h-8 w-24 rounded-full bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-56 rounded-2xl bg-white border border-gray-200/80" />
              <div className="h-64 rounded-2xl bg-white border border-gray-200/80" />
            </div>
            <div className="space-y-6">
              <div className="h-44 rounded-2xl bg-white border border-gray-200/80" />
              <div className="h-44 rounded-2xl bg-white border border-gray-200/80" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-gray-500">
            <div className="w-6 h-6 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
            <p className="text-sm font-medium tracking-wide">
              Loading customer details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Customer Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The customer you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/dashboard/customers")}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const statusColor =
    statusColors[customer.status as keyof typeof statusColors] ||
    statusColors[customer.status?.toLowerCase() as keyof typeof statusColors] ||
    statusColors.inactive;
  const rankingColor = customer.clientRanking
    ? rankingColors[customer.clientRanking]
    : null;

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/customers")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Customers
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
        {/* Subtle accent bar */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.name}
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {customer.initials}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-white" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {editingTab !== "profile" ? (
                    <>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                          {customer.name}
                        </h1>
                        {customer.customerNumber && (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                            Customer No: {customer.customerNumber}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                          />
                          {customer.status}
                        </span>
                        {rankingColor && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${rankingColor.bg} ${rankingColor.text}`}
                          >
                            {rankingColor.icon} {customer.clientRanking}
                          </span>
                        )}
                        {customer.type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                            {customer.type.toLowerCase()}
                          </span>
                        )}
                      </div>
                      {(customer.occupation || customer.companyName) && (
                        <p className="text-sm text-gray-500">
                          {customer.occupation}
                          {customer.occupation && customer.companyName
                            ? " at "
                            : ""}
                          {customer.companyName}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3 pr-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={profileEditForm.name}
                          onChange={(e) =>
                            setProfileEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                          placeholder="Customer name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Status
                          </label>
                          <select
                            value={profileEditForm.status}
                            onChange={(e) =>
                              setProfileEditForm((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                          >
                            {(customerStatuses.length > 0
                              ? customerStatuses
                              : [
                                  { value: "ACTIVE", label: "Active" },
                                  { value: "INACTIVE", label: "Inactive" },
                                  { value: "COMPLETED", label: "Completed" },
                                ]
                            ).map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Customer Type
                          </label>
                          <select
                            value={profileEditForm.type}
                            onChange={(e) =>
                              setProfileEditForm((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                          >
                            <option value="">Select type...</option>
                            {(customerTypes.length > 0
                              ? customerTypes
                              : [
                                  {
                                    value: "RESIDENTIAL",
                                    label: "Residential",
                                  },
                                  {
                                    value: "COMMERCIAL",
                                    label: "Commercial",
                                  },
                                ]
                            ).map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit / Save button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingTab === "profile" && (
                    <button
                      onClick={() => setEditingTab(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (editingTab === "profile") {
                        if (!profileEditForm.name.trim()) {
                          toast.error("Customer name is required");
                          return;
                        }
                        const updates: Partial<Customer> = {};
                        if (profileEditForm.name !== customer.name)
                          updates.name = profileEditForm.name;
                        if (
                          profileEditForm.status !==
                          customer.status.toUpperCase()
                        )
                          updates.status =
                            profileEditForm.status.toLowerCase() as Customer["status"];
                        if (
                          profileEditForm.type !==
                          (customer.type || "").toUpperCase()
                        )
                          updates.type = profileEditForm.type;
                        if (Object.keys(updates).length === 0) {
                          setEditingTab(null);
                          return;
                        }
                        const success = await handleSaveCustomer(updates);
                        if (success !== false) setEditingTab(null);
                      } else {
                        setProfileEditForm({
                          name: customer.name,
                          type: (customer.type || "").toUpperCase(),
                          status: customer.status.toUpperCase(),
                        });
                        setEditingTab("profile");
                      }
                    }}
                    disabled={isSaving && editingTab === "profile"}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                      editingTab === "profile"
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {isSaving && editingTab === "profile" ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : editingTab === "profile" ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Pencil className="w-3 h-3" />
                    )}
                    {editingTab === "profile" ? "Save" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Contact row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-gray-400" />
                    {customer.phone}
                  </a>
                )}
                {customer.location && customer.location !== "N/A" && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {customer.location}
                  </span>
                )}
                {customer.lastContact && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Last contact: {customer.lastContact}
                  </span>
                )}
              </div>

              {/* Rating */}
              {customer.rating > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(customer.rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-medium text-gray-400 ml-1">
                    {customer.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-0 mt-8 pt-6 border-t border-gray-100">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {customerProjects.length}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                Projects
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {customer.contactsCount || 0}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                Contacts
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">
                ₹{(customer.totalValue / 100000).toFixed(1)}L
              </p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                Total Value
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Customer Information */}
      {(customer.type ||
        customer.ownerName ||
        customer.billingAddress ||
        customer.shippingAddress ||
        customer.taxId ||
        customer.createdAt) && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-5">
            {customer.type && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Customer Type
                </p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {customer.type.toLowerCase()}
                </p>
              </div>
            )}
            {customer.taxId && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Tax ID</p>
                <p className="text-sm font-semibold text-gray-900">
                  {customer.taxId}
                </p>
              </div>
            )}
            {customer.ownerName && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                 Lead By
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {customer.ownerName}
                </p>
                {customer.ownerEmail && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {customer.ownerEmail}
                  </p>
                )}
              </div>
            )}
            {customer.createdAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Created
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(customer.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {customer.updatedAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Last Updated
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(customer.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(customer.updatedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {(customer.billingAddress ||
              customer.billingCity ||
              customer.shippingAddress ||
              customer.shippingCity) && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Client Address
                </p>
                <p className="text-sm text-gray-900">
                  {customer.billingAddress || customer.shippingAddress}
                </p>
                {(() => {
                  const city = customer.billingCity || customer.shippingCity;
                  const state = customer.billingState || customer.shippingState;
                  const pincode =
                    customer.billingPincode || customer.shippingPincode;
                  const parts = [city, state, pincode].filter(Boolean);
                  return parts.length > 0 ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {parts.join(", ")}
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl overflow-x-auto">
        {[
          { key: "overview", label: "Overview", icon: FileText },
          { key: "family", label: "Family", icon: Users },
          { key: "dates", label: "Dates", icon: Calendar },
          { key: "referrals", label: "Referrals", icon: UserPlus },
          { key: "notes", label: "Notes", icon: MessageCircle },
          { key: "ranking", label: "Ranking", icon: Award },
          { key: "projects", label: "Projects", icon: FolderOpen },
          { key: "kyc", label: "KYC", icon: Shield },
          ...(customerData?.leadId
            ? [{ key: "references", label: "References", icon: Link2 }]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab);
                setEditingTab(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Contact Information */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <button
                    onClick={async () => {
                      if (editingTab === "overview") {
                        const success = await handleSaveCustomer({
                          email: contactEditForm.email,
                          phone: contactEditForm.phone,
                          secondaryEmails: contactEditForm.secondaryEmails,
                          secondaryPhones: contactEditForm.secondaryPhones,
                        });
                        if (success !== false) setEditingTab(null);
                      } else {
                        setValidationAlert(null);
                        setContactEditForm({
                          email: customer.email || "",
                          phone: customer.phone || "",
                          secondaryEmails: customer.secondaryEmails || [],
                          secondaryPhones: customer.secondaryPhones || [],
                          newEmail: "",
                          newPhone: "",
                        });
                        setEditingTab("overview");
                      }
                    }}
                    disabled={isSaving}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                      editingTab === "overview"
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : editingTab === "overview" ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Edit2 className="w-3 h-3" />
                    )}
                    {editingTab === "overview" ? "Save" : "Edit"}
                  </button>
                </div>

                {/* VIEW MODE */}
                {editingTab !== "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Primary email */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">
                          Email
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {/* Primary phone */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">
                          Phone
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {/* Secondary emails */}
                    {(customer.secondaryEmails || []).map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-orange-50/40 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Email {idx + 2}
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Secondary phones */}
                    {(customer.secondaryPhones || []).map((phone, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-blue-50/40 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Phone {idx + 2}
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {phone}
                          </p>
                        </div>
                      </div>
                    ))}
                    {customer.communicationPreference && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Preferred Contact
                          </p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {customer.communicationPreference}
                          </p>
                        </div>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl md:col-span-2">
                        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Address
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {customer.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* EDIT MODE */}
                {editingTab === "overview" && (
                  <div className="space-y-5">
                    {validationAlert && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{validationAlert.message}</p>
                      </div>
                    )}

                    {/* Editable primary fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Primary Email
                        </label>
                        <div
                          className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl focus-within:ring-1 ${
                            validationAlert?.field === "email"
                              ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                              : "border-gray-200 focus-within:border-orange-400 focus-within:ring-orange-100"
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <input
                            type="email"
                            value={contactEditForm.email}
                            onChange={(e) =>
                              setContactEditForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="Primary email"
                            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Primary Phone
                        </label>
                        <div
                          className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl focus-within:ring-1 ${
                            validationAlert?.field === "phone"
                              ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                              : "border-gray-200 focus-within:border-blue-400 focus-within:ring-blue-100"
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <input
                            type="tel"
                            value={contactEditForm.phone}
                            onChange={(e) =>
                              setContactEditForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="Primary phone"
                            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Emails */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Additional Emails
                      </p>
                      <div className="space-y-2">
                        {contactEditForm.secondaryEmails.map((email, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-orange-50/50 border border-orange-100 rounded-xl">
                              <Mail className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                              <span className="text-sm text-gray-800 truncate">
                                {email}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryEmails: prev.secondaryEmails.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <input
                              type="email"
                              placeholder="Add email address..."
                              value={contactEditForm.newEmail}
                              onChange={(e) =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  newEmail: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  contactEditForm.newEmail.trim()
                                ) {
                                  setContactEditForm((prev) => ({
                                    ...prev,
                                    secondaryEmails: [
                                      ...prev.secondaryEmails,
                                      prev.newEmail.trim(),
                                    ],
                                    newEmail: "",
                                  }));
                                }
                              }}
                              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (contactEditForm.newEmail.trim()) {
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryEmails: [
                                    ...prev.secondaryEmails,
                                    prev.newEmail.trim(),
                                  ],
                                  newEmail: "",
                                }));
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-500 hover:text-orange-600 transition-colors flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Phones */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Additional Phone Numbers
                      </p>
                      <div className="space-y-2">
                        {contactEditForm.secondaryPhones.map((phone, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <span className="text-sm text-gray-800 truncate">
                                {phone}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryPhones: prev.secondaryPhones.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <input
                              type="tel"
                              placeholder="Add phone number..."
                              value={contactEditForm.newPhone}
                              onChange={(e) =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  newPhone: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  contactEditForm.newPhone.trim()
                                ) {
                                  setContactEditForm((prev) => ({
                                    ...prev,
                                    secondaryPhones: [
                                      ...prev.secondaryPhones,
                                      prev.newPhone.trim(),
                                    ],
                                    newPhone: "",
                                  }));
                                }
                              }}
                              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (contactEditForm.newPhone.trim()) {
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryPhones: [
                                    ...prev.secondaryPhones,
                                    prev.newPhone.trim(),
                                  ],
                                  newPhone: "",
                                }));
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Information */}
              {(customer.occupation || customer.companyName) && (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                    Professional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {customer.occupation && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">
                            Occupation
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {customer.occupation}
                          </p>
                        </div>
                      </div>
                    )}
                    {customer.companyName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">
                            Company
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {customer.companyName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "family" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Family Members
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "family") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("family");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "family"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "family" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "family" ? "Save" : "Edit"}
                </button>
              </div>
              {customer.familyMembers && customer.familyMembers.length > 0 ? (
                <div className="space-y-3">
                  {customer.familyMembers.map((member, index) => {
                    const displayName = member.firstName
                      ? [member.firstName, member.lastName]
                          .filter(Boolean)
                          .join(" ")
                      : member.name || "Unknown";
                    const initial = displayName.charAt(0).toUpperCase();
                    const relLabel =
                      relationshipTypes.find(
                        (r) => r.value === member.relationship,
                      )?.label || member.relationship;
                    return (
                      <div
                        key={member.id || index}
                        className="p-4 bg-gray-50/80 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-sm font-semibold text-orange-600 shrink-0">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                                  {relLabel}
                                </span>
                                {editingTab === "family" && member.id && (
                                  <button
                                    onClick={() => {
                                      setEditingMember(member);
                                      setFamilyForm({
                                        firstName:
                                          member.firstName ||
                                          member.name?.split(" ")[0] ||
                                          "",
                                        lastName:
                                          member.lastName ||
                                          member.name
                                            ?.split(" ")
                                            .slice(1)
                                            .join(" ") ||
                                          "",
                                        relationship: member.relationship || "",
                                        dateOfBirth: member.dateOfBirth || "",
                                        phone: member.phone || "",
                                        email: member.email || "",
                                        occupation: member.occupation || "",
                                        notes: member.notes || "",
                                      });
                                      setShowFamilyModal(true);
                                    }}
                                    className="p-1 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                    title="Edit member"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {member.occupation && (
                                <span className="text-xs text-gray-500">
                                  {member.occupation}
                                </span>
                              )}
                              {member.phone && (
                                <span className="text-xs text-gray-400">
                                  {member.phone}
                                </span>
                              )}
                              {member.email && (
                                <span className="text-xs text-gray-400">
                                  {member.email}
                                </span>
                              )}
                              {member.dateOfBirth && (
                                <span className="text-xs text-gray-400">
                                  DOB:{" "}
                                  {new Date(
                                    member.dateOfBirth,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              {/* legacy age field */}
                              {member.age && !member.dateOfBirth && (
                                <span className="text-xs text-gray-400">
                                  Age {member.age}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No family members added
                  </p>
                </div>
              )}
              {editingTab === "family" && (
                <button
                  onClick={() => setShowFamilyModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 border border-dashed border-orange-300 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Family Member
                </button>
              )}
            </div>
          )}

          {activeTab === "dates" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Important Dates
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "dates") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("dates");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "dates"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "dates" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "dates" ? "Save" : "Edit"}
                </button>
              </div>
              {customer.importantDates && customer.importantDates.length > 0 ? (
                <div className="space-y-3">
                  {customer.importantDates.map((date, index) => {
                    const typeKey = date.dateType?.toLowerCase() || "other";
                    const icons: Record<string, string> = {
                      birthday: "🎂",
                      anniversary: "💐",
                      other: "📅",
                    };
                    const label = date.dateType
                      ? date.dateType.charAt(0).toUpperCase() +
                        date.dateType.slice(1).toLowerCase()
                      : "Date";

                    return (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-xl flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {icons[typeKey] || icons.other}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {label}
                              {date.isRecurring && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Recurring
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(date.date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            {date.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                "{date.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No important dates added
                </p>
              )}
              {editingTab === "dates" && (
                <Button
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowDateModal(true)}
                >
                  <Gift className="w-4 h-4" />
                  Add Important Date
                </Button>
              )}
            </Card>
          )}

          {activeTab === "referrals" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  Referrals
                  {apiReferrals.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
                      {apiReferrals.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-3 h-3" />
                  Add Referral
                </button>
              </div>

              {loadingReferrals ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm text-gray-400">
                  <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  Loading referrals…
                </div>
              ) : apiReferrals.length > 0 ? (
                <div className="space-y-3">
                  {apiReferrals.map((lead: any, index: number) => {
                    const name = lead?.name || "Unnamed Lead";
                    const statusRaw = (lead?.status || "PENDING").toUpperCase();
                    const statusLabel =
                      statusRaw === "CONVERTED"
                        ? "Converted"
                        : statusRaw === "CONTACTED"
                          ? "Contacted"
                          : statusRaw === "NEW"
                            ? "New"
                            : statusRaw
                                .toLowerCase()
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c: string) =>
                                  c.toUpperCase(),
                                );
                    const statusColor =
                      statusRaw === "CONVERTED"
                        ? {
                            bg: "bg-green-50",
                            text: "text-green-700",
                            dot: "bg-green-500",
                          }
                        : statusRaw === "CONTACTED"
                          ? {
                              bg: "bg-blue-50",
                              text: "text-blue-700",
                              dot: "bg-blue-500",
                            }
                          : {
                              bg: "bg-gray-100",
                              text: "text-gray-600",
                              dot: "bg-gray-400",
                            };
                    return (
                      <div
                        key={lead?.id || index}
                        className="p-4 bg-gray-50/80 rounded-xl flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                              {lead?.phone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead?.email && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </span>
                              )}
                              {lead?.city && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {lead.city}
                                </span>
                              )}
                            </div>
                            {lead?.createdAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Referred{" "}
                                {new Date(lead.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                          />
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <UserPlus className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No referrals yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Notes
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "notes") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("notes");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "notes"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "notes" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "notes" ? "Save" : "Edit"}
                </button>
              </div>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-3">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span className="font-medium">{note.createdBy}</span>
                        <span>&middot;</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notes added</p>
                </div>
              )}
              {editingTab === "notes" && (
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 border border-dashed border-orange-300 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              )}
            </div>
          )}

          {/* Ranking Tab */}
          {activeTab === "ranking" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider">
                  Client Ranking
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "ranking") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("ranking");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "ranking"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "ranking" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "ranking" ? "Save" : "Edit"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["vip", "niche", "regular", "one-time"] as const).map(
                  (rank) => {
                    const isSelected = customer.clientRanking === rank;
                    const config = {
                      vip: {
                        color: "purple",
                        label: "VIP",
                        desc: "High-value client",
                      },
                      niche: {
                        color: "blue",
                        label: "Niche",
                        desc: "Specialized projects",
                      },
                      regular: {
                        color: "emerald",
                        label: "Regular",
                        desc: "Standard client",
                      },
                      "one-time": {
                        color: "gray",
                        label: "One-Time",
                        desc: "Single project",
                      },
                    };
                    const c = config[rank];
                    return (
                      <button
                        key={rank}
                        onClick={async () => {
                          if (editingTab === "ranking" && !isSaving) {
                            await handleSaveCustomer({ clientRanking: rank });
                            toast.success(`Client ranking updated to ${rank}`);
                          }
                        }}
                        disabled={editingTab !== "ranking" || isSaving}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-orange-400 bg-orange-50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                        } ${editingTab !== "ranking" || isSaving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <p className="text-sm font-bold text-gray-900 capitalize mb-0.5">
                          {c.label}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {c.desc}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
              {editingTab !== "ranking" && (
                <p className="text-xs font-medium text-gray-500 mt-4 text-center">
                  Click "Edit" to change ranking
                </p>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Assigned Projects
                </h3>
              </div>

              {/* Assigned Projects List */}
              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-500">Loading projects...</p>
                </div>
              ) : customerProjects && customerProjects.length > 0 ? (
                <div className="space-y-3">
                  {customerProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/dashboard/projects/${project.id}`)
                      }
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            project.status === "ACTIVE"
                              ? "bg-blue-100 text-blue-600"
                              : project.status === "COMPLETED"
                                ? "bg-green-100 text-green-600"
                                : project.status === "PAUSED"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {project.projectName ||
                              project.name ||
                              "Unnamed Project"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge
                              className={`text-xs ${
                                project.status === "ACTIVE"
                                  ? "bg-blue-100 text-blue-700"
                                  : project.status === "COMPLETED"
                                    ? "bg-green-100 text-green-700"
                                    : project.status === "PAUSED"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {project.status}
                            </Badge>
                            {project.currentStageCode && (
                              <span className="text-sm text-gray-500">
                                {project.currentStageCode}
                              </span>
                            )}
                            {project.totalValue && (
                              <span className="text-sm font-medium text-gray-700">
                                {formatCurrencyINR(project.totalValue)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No projects found for this customer
                  </p>
                </div>
              )}
            </div>
          )}

          {/* References Tab — Lead data retained after conversion */}
          {/* KYC Tab */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              {/* Hidden file input */}
              <input
                ref={kycFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleKycFileChange}
              />

              {/* KYC Documents */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        KYC Documents
                      </h3>
                      <p className="text-xs text-gray-400">
                        Select document type and upload the file
                      </p>
                    </div>
                  </div>
                  {loadingKyc && (
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </div>

                {/* Single upload row */}
                <div className="flex items-center gap-3">
                  <select
                    value={kycUploadTarget ?? ""}
                    onChange={(e) => setKycUploadTarget(e.target.value || null)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-700"
                  >
                    <option value="">Select document type</option>
                    <option value="AADHAR">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="GST_CERTIFICATE">GST Certificate</option>
                  </select>
                  <button
                    onClick={() => {
                      if (kycUploadTarget) kycFileInputRef.current?.click();
                    }}
                    disabled={!kycUploadTarget || !!kycUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
                  >
                    {kycUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Accepted: JPG, PNG, PDF · Max 10 MB
                </p>

                {/* Uploaded documents list */}
                {kycAttachments.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Uploaded
                    </p>
                    {kycAttachments.map((doc) => {
                      const label =
                        doc.attachmentType === "AADHAR"
                          ? "Aadhar Card"
                          : doc.attachmentType === "PAN"
                            ? "PAN Card"
                            : doc.attachmentType === "GST_CERTIFICATE"
                              ? "GST Certificate"
                              : doc.attachmentType;
                      const isDeleting = kycDeleting === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                        >
                          <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700">
                              {label}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {doc.fileName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleKycAction(doc, "view")}
                              className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                              title="View"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleKycAction(doc, "download")}
                              className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleKycDelete(doc)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              {isDeleting ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Bank Details
                      </h3>
                      <p className="text-xs text-gray-400">
                        Optional · For payment and refund processing
                      </p>
                    </div>
                  </div>
                  {!bankDetailsEditing && (
                    <button
                      onClick={() => setBankDetailsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {bankDetails.trim() ? "Edit" : "Add"}
                    </button>
                  )}
                </div>

                {bankDetailsEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Bank Details
                        <span className="ml-1 text-gray-400 font-normal">
                          (e.g. HDFC Bank, Acc: 123456789, IFSC: HDFC0001234)
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        value={bankDetails}
                        onChange={(e) => setBankDetails(e.target.value)}
                        placeholder="Enter bank name, account number, IFSC code, branch..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveBankDetails}
                        disabled={bankDetailsSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
                      >
                        {bankDetailsSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setBankDetailsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : bankDetails.trim() ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {bankDetails}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      No bank details added yet
                    </p>
                    <button
                      onClick={() => setBankDetailsEditing(true)}
                      className="mt-3 text-xs text-orange-500 hover:text-orange-600 font-medium"
                    >
                      + Add bank details
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === "references" ||
            (activeTab === "overview" && customerData?.leadId)) && (
            <div className="space-y-6">
              {loadingLeadReferences ? (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-500">Loading lead references...</p>
                </div>
              ) : !customerData?.leadId ? (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No lead reference data
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    This customer was not converted from a lead.
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <>
                      {/* Lead Origin Info */}
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-orange-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Lead Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {leadReferenceData?.source && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Source</p>
                          <p className="text-sm font-medium text-gray-800 capitalize">
                            {String(leadReferenceData.source).replace(
                              /_/g,
                              " ",
                            )}
                          </p>
                        </div>
                      )}
                      {leadReferenceData?.status && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Status</p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              leadReferenceData.status === "CONVERTED"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {leadReferenceData.status}
                          </span>
                        </div>
                      )}
                      {leadReferenceData?.stage && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Stage</p>
                          <p className="text-sm font-medium text-gray-800 capitalize">
                            {String(leadReferenceData.stage).replace(/_/g, " ")}
                          </p>
                        </div>
                      )}
                      {leadReferenceData?.score !== undefined && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Lead Score
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {leadReferenceData.score}
                          </p>
                        </div>
                      )}
                      {leadReferenceData?.priority && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Priority
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              leadReferenceData.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : leadReferenceData.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {leadReferenceData.priority}
                          </span>
                        </div>
                      )}
                      {leadReferenceData?.createdAt && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Lead Created
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(
                              leadReferenceData.createdAt,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    {(leadReferenceData?.message ||
                      leadReferenceData?.requirements ||
                      leadReferenceData?.notes) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">
                          Message / Requirements
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {leadReferenceData.message ||
                            leadReferenceData.requirements ||
                            leadReferenceData.notes}
                        </p>
                      </div>
                    )}
                      </div>

                      {/* Project Requirements */}
                      {(leadReferenceData?.projectType ||
                    leadReferenceData?.propertyType ||
                    leadReferenceData?.bhkConfig ||
                    leadReferenceData?.carpetArea ||
                    leadReferenceData?.location ||
                    leadReferenceData?.city ||
                    leadReferenceData?.locality ||
                    leadReferenceData?.homeType ||
                    leadReferenceData?.propertyProjectType ||
                    leadReferenceData?.projectScope ||
                    leadReferenceData?.projectStage ||
                    leadReferenceData?.area) && (
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Home className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Project Requirements
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {leadReferenceData?.projectType && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Project Type
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.projectType}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.propertyProjectType && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Property / Project Type
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.propertyProjectType}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.propertyType && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Property Type
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.propertyType}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.homeType && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Home Type
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.homeType}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.bhkConfig && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              BHK Config
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.bhkConfig}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.carpetArea && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Carpet Area
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.carpetArea} sq.ft
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.area && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Area</p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.area} sq.ft
                            </p>
                          </div>
                        )}
                        {(leadReferenceData?.city ||
                          leadReferenceData?.locality ||
                          leadReferenceData?.location) && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Location
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {[
                                leadReferenceData.locality,
                                leadReferenceData.city,
                                leadReferenceData.location,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.projectStage && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Project Stage
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.projectStage}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.projectScope && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Project Scope
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.projectScope}
                            </p>
                          </div>
                        )}
                      </div>
                      {leadReferenceData?.scopeOfWork &&
                        leadReferenceData.scopeOfWork.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-2">
                              Scope of Work
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {leadReferenceData.scopeOfWork.map((item, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {leadReferenceData?.servicesInterested &&
                        leadReferenceData.servicesInterested.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-2">
                              Services Interested
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {leadReferenceData.servicesInterested.map(
                                (item, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
                                  >
                                    {item}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      )}

                      {/* Budget & Timeline */}
                      {(leadReferenceData?.budget ||
                    leadReferenceData?.budgetRange ||
                    leadReferenceData?.budgetComfort ||
                    leadReferenceData?.timeline ||
                    leadReferenceData?.startTimeline ||
                    leadReferenceData?.expectedStartDate ||
                    leadReferenceData?.moveinDate) && (
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Budget & Timeline
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {leadReferenceData?.budget && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Budget
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.budget}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.budgetRange && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Budget Range
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.budgetRange}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.budgetComfort && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Budget Comfort
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.budgetComfort}
                            </p>
                          </div>
                        )}
                        {(leadReferenceData?.timeline ||
                          leadReferenceData?.startTimeline) && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Timeline
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.timeline ||
                                leadReferenceData.startTimeline}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.expectedStartDate && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Expected Start
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {new Date(
                                leadReferenceData.expectedStartDate,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.moveinDate && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Move-in Date
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {new Date(
                                leadReferenceData.moveinDate,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                        </div>
                      )}

                      {/* Design Preferences */}
                      {(leadReferenceData?.designStyle?.length ||
                    leadReferenceData?.colorPreferences?.length ||
                    leadReferenceData?.serviceInterest) && (
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Design Preferences
                        </h3>
                      </div>
                      {leadReferenceData?.serviceInterest && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-0.5">
                            Service Interest
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {leadReferenceData.serviceInterest}
                          </p>
                        </div>
                      )}
                      {leadReferenceData?.designStyle &&
                        leadReferenceData.designStyle.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-400 mb-2">
                              Design Style
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {leadReferenceData.designStyle.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {leadReferenceData?.colorPreferences &&
                        leadReferenceData.colorPreferences.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-2">
                              Color Preferences
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {leadReferenceData.colorPreferences.map(
                                (c, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-medium"
                                  >
                                    {c}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      )}

                      {/* Referral Info */}
                      {(leadReferenceData?.referrerName ||
                    leadReferenceData?.referrerPhone ||
                    leadReferenceData?.referrerProjectNumber ||
                    leadReferenceData?.agentAgencyName) && (
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-teal-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Referral Source
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {leadReferenceData?.referrerName && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Referrer Name
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.referrerName}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.referrerPhone && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Referrer Phone
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.referrerPhone}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.referrerProjectNumber && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Project Number
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.referrerProjectNumber}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.agentAgencyName && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">
                              Agent / Agency
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.agentAgencyName}
                            </p>
                          </div>
                        )}
                        {leadReferenceData?.agentAgencyDetails && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-400 mb-0.5">
                              Agency Details
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {leadReferenceData.agentAgencyDetails}
                            </p>
                          </div>
                        )}
                      </div>
                        </div>
                      )}

                      {additionalLeadReferenceFields.length > 0 && (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Info className="w-4 h-4 text-amber-700" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Additional Lead Details
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {additionalLeadReferenceFields.map(
                              ({ key, value }) => {
                                const isJsonObject =
                                  typeof value === "object" &&
                                  value !== null &&
                                  !Array.isArray(value);
                                const isStringValue = typeof value === "string";
                                const isUrlValue =
                                  isStringValue && isHttpUrl(value);

                                return (
                                  <div key={key}>
                                    <p className="text-xs text-gray-400 mb-0.5">
                                      {formatLeadReferenceLabel(key)}
                                    </p>
                                    {isJsonObject ? (
                                      <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
                                        {formatLeadReferenceValue(value)}
                                      </pre>
                                    ) : isUrlValue ? (
                                      <a
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline break-all"
                                        title="Open attached file"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{getFileNameFromUrl(value)}</span>
                                      </a>
                                    ) : (
                                      <p className="text-sm font-medium text-gray-800 break-words">
                                        {formatLeadReferenceValue(value)}
                                      </p>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Uploaded Documents & Attachments */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <File className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {activeTab === "references"
                          ? "Uploaded References"
                          : "Documents & Attachments"}
                      </h3>
                      <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {leadAttachments.length} file
                        {leadAttachments.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {activeTab === "references" && (
                      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Upload Reference File
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={referenceUploadTitle}
                              onChange={(e) =>
                                setReferenceUploadTitle(e.target.value)
                              }
                              placeholder="Enter reference title"
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              File
                            </label>
                            <input
                              ref={leadReferenceUploadInputRef}
                              type="file"
                              onChange={(e) =>
                                setReferenceUploadFile(
                                  e.target.files?.[0] ?? null,
                                )
                              }
                              className="block w-full text-xs text-gray-600 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white file:text-gray-700 border border-gray-200 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-gray-400 truncate">
                            {referenceUploadFile
                              ? `Selected: ${referenceUploadFile.name}`
                              : "No file selected"}
                          </p>
                          <button
                            onClick={handleUploadLeadReference}
                            disabled={!referenceUploadFile || uploadingReference}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                          >
                            {uploadingReference ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                Upload
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {leadAttachments.length === 0 ? (
                      <div className="text-center py-8">
                        <File className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          No documents uploaded during the lead phase
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {leadAttachments.map((attachment) => {
                          const isImage =
                            attachment.fileType?.startsWith("image/");
                          const isPdf =
                            attachment.fileType === "application/pdf";
                          const isViewLoading =
                            attachmentLoading?.id === attachment.id &&
                            attachmentLoading.action === "view";
                          const isDownloadLoading =
                            attachmentLoading?.id === attachment.id &&
                            attachmentLoading.action === "download";
                          const fileSizeKB = attachment.fileSize
                            ? attachment.fileSize > 1024 * 1024
                              ? `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`
                              : `${(attachment.fileSize / 1024).toFixed(0)} KB`
                            : null;

                          return (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                            >
                              {/* Icon */}
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isImage
                                    ? "bg-blue-100"
                                    : isPdf
                                      ? "bg-red-100"
                                      : "bg-gray-200"
                                }`}
                              >
                                {isImage ? (
                                  <Image className="w-5 h-5 text-blue-600" />
                                ) : isPdf ? (
                                  <FileText className="w-5 h-5 text-red-600" />
                                ) : (
                                  <File className="w-5 h-5 text-gray-600" />
                                )}
                              </div>

                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {attachment.fileName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-400 capitalize">
                                    {attachment.attachmentType
                                      ?.replace(/_/g, " ")
                                      .toLowerCase()}
                                  </span>
                                  {fileSizeKB && (
                                    <>
                                      <span className="text-gray-300">·</span>
                                      <span className="text-xs text-gray-400">
                                        {fileSizeKB}
                                      </span>
                                    </>
                                  )}
                                  {(attachment.uploadedAt ||
                                    attachment.createdAt) && (
                                    <>
                                      <span className="text-gray-300">·</span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(
                                          attachment.uploadedAt ||
                                            attachment.createdAt ||
                                            "",
                                        ).toLocaleDateString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {attachment.notes && (
                                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                                    {attachment.notes}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() =>
                                    handleAttachmentAction(attachment, "view")
                                  }
                                  disabled={!!attachmentLoading}
                                  className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                  title="View"
                                >
                                  {isViewLoading ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <ExternalLink className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleAttachmentAction(
                                      attachment,
                                      "download",
                                    )
                                  }
                                  disabled={!!attachmentLoading}
                                  className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                  title="Download"
                                >
                                  {isDownloadLoading ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Family Member Modal */}
      {showFamilyModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowFamilyModal(false);
                setEditingMember(null);
                resetFamilyForm();
              }}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-orange-500" />
                {editingMember ? "Edit Family Member" : "Add Family Member"}
              </h3>
              <div className="space-y-4">
                {/* First Name + Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={familyForm.firstName}
                      onChange={(e) =>
                        setFamilyForm({
                          ...familyForm,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={familyForm.lastName}
                      onChange={(e) =>
                        setFamilyForm({
                          ...familyForm,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={familyForm.relationship}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        relationship: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select relationship</option>
                    {relationshipTypes.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={familyForm.dateOfBirth}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={familyForm.phone}
                      onChange={(e) =>
                        setFamilyForm({ ...familyForm, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+91..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={familyForm.email}
                      onChange={(e) =>
                        setFamilyForm({ ...familyForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={familyForm.occupation}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        occupation: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Doctor, Engineer"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={familyForm.notes}
                    onChange={(e) =>
                      setFamilyForm({ ...familyForm, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Any additional notes"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowFamilyModal(false);
                    setEditingMember(null);
                    resetFamilyForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingMember ? handleUpdateFamily : handleAddFamily}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={
                    !familyForm.firstName ||
                    !familyForm.relationship ||
                    isSaving
                  }
                >
                  {isSaving
                    ? editingMember
                      ? "Saving..."
                      : "Adding..."
                    : editingMember
                      ? "Save Changes"
                      : "Add Member"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Important Date Modal */}
      {showDateModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDateModal(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-orange-500" />
                Add Important Date
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={dateForm.dateType}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, dateType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="ANNIVERSARY">Anniversary</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={dateForm.date}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={dateForm.isRecurring}
                      onChange={(e) =>
                        setDateForm({
                          ...dateForm,
                          isRecurring: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label
                      htmlFor="isRecurring"
                      className="text-sm font-medium text-gray-700"
                    >
                      Recurring (Annually)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dateForm.reminderDays}
                    onChange={(e) =>
                      setDateForm({
                        ...dateForm,
                        reminderDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days before the date to send a reminder
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={dateForm.notes}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
                    placeholder="e.g., Send flowers"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDateModal(false);
                    setDateForm({
                      dateType: "BIRTHDAY",
                      date: "",
                      isRecurring: true,
                      reminderDays: 7,
                      notes: "",
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDate}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={!dateForm.dateType || !dateForm.date || isSaving}
                >
                  {isSaving ? "Adding..." : "Add Date"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Referral Modal */}
      {showReferralModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReferralModal(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-orange-500" />
                Add Referral
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Lead *
                  </label>
                  {loadingLeads ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-400">
                      Loading leads…
                    </div>
                  ) : (
                    <select
                      value={referralForm.leadId}
                      onChange={(e) =>
                        setReferralForm({ leadId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="">-- Choose a lead --</option>
                      {allLeads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name || "Unnamed Lead"}
                          {lead.phone ? ` · ${lead.phone}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowReferralModal(false);
                    setReferralForm({ leadId: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddReferral}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={!referralForm.leadId}
                >
                  Add Referral
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Note Modal */}
      {showNoteModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNoteModal(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <StickyNote className="w-6 h-6 text-orange-500" />
                Add Note
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note *
                  </label>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={4}
                    placeholder="Enter your note here..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteForm({ content: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNote}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={!noteForm.content}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-red-50 to-orange-50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 ring-4 ring-red-100">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Delete Customer?
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                {!isDeleting && (
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-2.5 hover:bg-white/60 rounded-xl transition-all hover:scale-110 active:scale-95"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-8 bg-gradient-to-b from-white to-gray-50">
                <p className="text-gray-700 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">
                    {customer.name}
                  </span>
                  ? This will permanently remove the customer and all associated
                  data.
                </p>
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ Warning: This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-6 py-3 text-gray-700 font-medium hover:bg-white rounded-2xl transition-all disabled:opacity-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-semibold rounded-2xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Customer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
