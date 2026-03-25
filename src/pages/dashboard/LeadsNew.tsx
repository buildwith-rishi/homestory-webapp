import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { LazyLeadCard } from "./LeadCard";
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Search,
  MapPin,
  Clock,
  User,
  TrendingUp,
  X,
  Edit,
  Trash2,
  Activity,
  Send,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Building2,
  Layers,
  ChevronDown,
  UserPlus,
  Users,
  Upload,
} from "lucide-react";
import { Button, Badge } from "../../components/ui";
import toast from "react-hot-toast";
import LeadAPI, {
  Lead,
  LeadActivity,
  LeadSource,
  LeadStatus,
  uploadFloorPlan,
} from "../../services/leadApi";
import CustomerAPI from "../../services/customerApi";
import { adminAPI } from "../../services/api";
import { AdminUser } from "../../types";
import { getSourceLabel } from "../../utils/leadHelpers";
import {
  getActivityLog,
  clearActivityLog,
  type KanbanActivityEntry,
} from "../../stores/kanbanActivityLog";
import { useLeadStore } from "../../stores/leadStore";

const getStatusColor = (status?: string) => {
  const s = (status || "NEW").toUpperCase();
  if (s === "NEW") return "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "WORKING" || s === "CONTACTED")
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "QUALIFIED") return "bg-green-100 text-green-700 border-green-200";
  if (s === "MEETING") return "bg-purple-100 text-purple-700 border-purple-200";
  if (s === "PROPOSAL")
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === "WON") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "LOST" || s === "DISQUALIFIED")
    return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

function formatEnumValue(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Add/Edit Lead Modal Component
export const LeadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSave: (lead: Omit<Lead, "id">) => Promise<void>;
  sources?: LeadSource[];
  statuses?: LeadStatus[];
  users?: AdminUser[];
}> = ({ isOpen, onClose, lead, onSave, sources = [], statuses = [], users = [] }) => {
  const defaultSources = [
    { value: "WEBSITE", label: "Website" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PHONE", label: "Phone" },
    { value: "INSTAGRAM", label: "Instagram" },
    { value: "FACEBOOK", label: "Facebook" },
    { value: "YOUTUBE", label: "YouTube" },
    { value: "REFERRAL", label: "Referral" },
    { value: "WALK_IN", label: "Walk-in" },
    { value: "EXHIBITION", label: "Exhibition" },
    { value: "EXPO", label: "Expo" },
    { value: "PAID_LEAD", label: "Paid Lead" },
    { value: "CONTACT_FORM", label: "Contact Form" },
    { value: "OTHER", label: "Other" },
  ];

  const availableSources = sources.length > 0 ? sources : defaultSources;
  const defaultStatuses = [
    { value: "NEW", label: "New" },
    { value: "WORKING", label: "Working" },
    { value: "QUALIFIED", label: "Qualified" },
    { value: "DISQUALIFIED", label: "Disqualified" },
    { value: "CONVERTED", label: "Converted" },
  ];
  const availableStatuses = statuses.length > 0 ? statuses : defaultStatuses;

  const [activeTab, setActiveTab] = useState<"basic" | "property">("basic");

  const emptyForm: Omit<Lead, "id"> = {
    name: "",
    email: "",
    phone: "",
    source: availableSources[0]?.value || "WEBSITE",
    score: undefined,
    companyName: "",
    householdOrCompany: "RESIDENTIAL",
    status: "NEW",
    city: "",
    area: null,
    message: "",
    requirements: "",
    floorPlanUrl: "",
    assignedToId: "",
    referrerName: "",
    referrerPhone: "",
    agentAgencyName: "",
    agentAgencyDetails: "",

    // New Fields
    projectCategory: "RESIDENTIAL",
    pipelineType: "",
    scopeType: "",
    propertySubtype: "",
    propertyBHK: "",
    propertyType: "",
    projectType: "",
    projectStage: "",
    startTimeline: "",
    budgetComfort: "",
    projectScope: "",
    budgetTier: "",
    propertySizeSqft: null,
    constructionStatus: "",
    tentativeHandoverDate: "",
    propertyAddress: "",
    propertyState: "",
    propertyPincode: "",
    propertyBuilding: "",
    propertyUnit: "",
    propertyLandmarks: "",
    siteContactName: "",
    siteContactPhone: "",
    specialRequirements: "",
    designPackage: "",
    wantsExperienceCenterVisit: false,
    canWhatsApp: true,
  };

  const [formData, setFormData] = useState<Omit<Lead, "id">>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingDuplicate, setCheckingDuplicate] = useState<{
    email: boolean;
    phone: boolean;
  }>({
    email: false,
    phone: false,
  });

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFloorPlanFile, setPendingFloorPlanFile] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFloorPlanAttachment = Boolean(
    pendingFloorPlanFile || formData.floorPlanUrl,
  );

  const getExistingFloorPlanUrl = (currentLead: Lead): string => {
    // Primary field
    if (currentLead.floorPlanUrl) return currentLead.floorPlanUrl;

    // Fallback fields seen in some API shapes
    const fallbackDirect = (currentLead as Lead & {
      floorPlanFileUrl?: string | null;
      floorPlanAttachmentUrl?: string | null;
      floorPlan?: string | null;
      attachments?: Array<Record<string, unknown>>;
      references?: Array<Record<string, unknown>>;
    });

    if (fallbackDirect.floorPlanFileUrl) return fallbackDirect.floorPlanFileUrl;
    if (fallbackDirect.floorPlanAttachmentUrl)
      return fallbackDirect.floorPlanAttachmentUrl;
    if (fallbackDirect.floorPlan) return fallbackDirect.floorPlan;

    const combined = [
      ...(fallbackDirect.attachments || []),
      ...(fallbackDirect.references || []),
    ];

    const floorPlanEntry = combined.find((entry) => {
      const type = String(
        (entry.attachmentType as string | undefined) ||
          (entry.type as string | undefined) ||
          "",
      ).toUpperCase();
      const category = String(
        (entry.category as string | undefined) || "",
      ).toUpperCase();
      return type.includes("FLOOR") || category.includes("FLOOR");
    });

    if (!floorPlanEntry) return "";

    return (
      (floorPlanEntry.downloadUrl as string | undefined) ||
      (floorPlanEntry.url as string | undefined) ||
      (floorPlanEntry.fileUrl as string | undefined) ||
      ""
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: client-side validation
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max size is 10MB.");
      return;
    }

    // For new leads, defer upload until a real lead ID exists.
    if (!lead?.id) {
      setPendingFloorPlanFile(file);
      toast.success("Floor plan selected. It will be uploaded after lead creation.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadFloorPlan(file, lead.id);
      // Relaxed check: if response is returned, treat as success even if URL is missing
      if (response) {
        setPendingFloorPlanFile(null);
        f("floorPlanUrl", response.url || "_UPLOADED_");
        toast.success("Floor plan uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload floor plan. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const f = (field: keyof Omit<Lead, "id">, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (lead) {
      const existingFloorPlanUrl = getExistingFloorPlanUrl(lead);
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || availableSources[0]?.value || "WEBSITE",
        score: lead.score ?? undefined,
        companyName: lead.companyName || "",
        householdOrCompany: lead.householdOrCompany || "RESIDENTIAL",
        status: lead.status || "NEW",
        city: lead.city || "",
        area: lead.area ?? null,
        message: lead.message || "",
        requirements: lead.requirements || "",
        floorPlanUrl: existingFloorPlanUrl,
        assignedToId: lead.assignedToId || "",
        referrerName: lead.referrerName || "",
        referrerPhone: lead.referrerPhone || "",
        agentAgencyName: lead.agentAgencyName || "",
        agentAgencyDetails: lead.agentAgencyDetails || "",
        
        projectCategory: lead.projectCategory || "RESIDENTIAL",
        pipelineType: lead.pipelineType || "",
        scopeType: lead.scopeType || "",
        propertySubtype: lead.propertySubtype || "",
        propertyBHK: lead.propertyBHK || "",
        propertyType: lead.propertyType || "",
        projectType: lead.projectType || "",
        projectStage: lead.projectStage || "",
        startTimeline: lead.startTimeline || "",
        budgetComfort: lead.budgetComfort || "",
        projectScope: lead.projectScope || "",
        budgetTier: lead.budgetTier || "",
        propertySizeSqft: lead.propertySizeSqft ?? null,
        constructionStatus: lead.constructionStatus || "",
        tentativeHandoverDate: lead.tentativeHandoverDate || "",
        propertyAddress: lead.propertyAddress || "",
        propertyState: lead.propertyState || "",
        propertyPincode: lead.propertyPincode || "",
        propertyBuilding: lead.propertyBuilding || "",
        propertyUnit: lead.propertyUnit || "",
        propertyLandmarks: lead.propertyLandmarks || "",
        siteContactName: lead.siteContactName || "",
        siteContactPhone: lead.siteContactPhone || "",
        specialRequirements: lead.specialRequirements || "",
        designPackage: lead.designPackage || "",
        wantsExperienceCenterVisit: lead.wantsExperienceCenterVisit ?? false,
        canWhatsApp: lead.canWhatsApp ?? true,
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
    setActiveTab("basic");
    setPendingFloorPlanFile(null);
  }, [lead, isOpen]);

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.phone?.trim()) newErrors.phone = "Phone is required";
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone))
      newErrors.phone = "Invalid phone format";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.propertyType?.trim())
      newErrors.propertyType = "Property type is required";
    if (!formData.projectType?.trim())
      newErrors.projectType = "Project type is required";
    if (!formData.city?.trim()) newErrors.city = "City is required";
    if (!formData.startTimeline?.trim())
      newErrors.startTimeline = "Start timeline is required";
    if (!formData.budgetComfort?.trim())
      newErrors.budgetComfort = "Budget comfort is required";
    if (!formData.projectScope?.trim())
      newErrors.projectScope = "Project scope is required";
    setErrors(newErrors);
    return newErrors;
  };

  const normalizeEmail = (value?: string | null) =>
    (value || "").trim().toLowerCase();

  const normalizePhone = (value?: string | null) =>
    (value || "").replace(/\D/g, "");

  const checkDuplicateField = async (
    field: "email" | "phone",
    value?: string | null,
  ) => {
    const raw = (value || "").trim();
    if (!raw) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return false;
    }

    // Skip duplicate check when format itself is invalid.
    if (field === "email" && !/\S+@\S+\.\S+/.test(raw)) return false;
    if (field === "phone" && !/^\+?[\d\s-]{10,}$/.test(raw)) return false;

    setCheckingDuplicate((prev) => ({ ...prev, [field]: true }));
    try {
      const response = await LeadAPI.listLeads({ search: raw, limit: 100 });
      const candidates = response?.leads || [];

      const duplicate = candidates.some((candidate) => {
        if (!candidate?.id || candidate.id === lead?.id) return false;
        if (field === "email") {
          return normalizeEmail(candidate.email) === normalizeEmail(raw);
        }
        return normalizePhone(candidate.phone) === normalizePhone(raw);
      });

      if (duplicate) {
        setErrors((prev) => ({
          ...prev,
          [field]:
            field === "email"
              ? "This email already exists. Please use a different email."
              : "This phone number already exists. Please use a different number.",
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          if (
            (field === "email" &&
              next.email ===
                "This email already exists. Please use a different email.") ||
            (field === "phone" &&
              next.phone ===
                "This phone number already exists. Please use a different number.")
          ) {
            delete next[field];
          }
          return next;
        });
      }

      return duplicate;
    } catch {
      // Keep UX resilient if duplicate check endpoint fails.
      return false;
    } finally {
      setCheckingDuplicate((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // New lead flow UX:
    // On Basic Info tab, primary action should be "Next" and must not trigger validations yet.
    if (!lead && activeTab === "basic") {
      setErrors({});
      setActiveTab("property");
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setActiveTab("basic");
      return;
    }

    const [duplicateEmail, duplicatePhone] = await Promise.all([
      checkDuplicateField("email", formData.email),
      checkDuplicateField("phone", formData.phone),
    ]);

    if (duplicateEmail || duplicatePhone) {
      setActiveTab("basic");
      toast.error(
        duplicateEmail && duplicatePhone
          ? "Email and phone already exist. Please change both fields."
          : duplicateEmail
            ? "This email already exists. Please change it."
            : "This phone number already exists. Please change it.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Only include fields currently exposed in the LeadModal UI.
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        source: formData.source || "WEBSITE",
        status: formData.status || "NEW",
        score:
          formData.score !== null &&
          formData.score !== undefined &&
          String(formData.score) !== ""
            ? Number(formData.score)
            : null,
        companyName: formData.companyName?.trim() || null,
        assignedToId: formData.assignedToId?.trim() || null,

        propertyType: formData.propertyType || null,
        projectType: formData.projectType || null,
        city: formData.city?.trim() || null,
        area:
          formData.area !== null &&
          formData.area !== undefined &&
          String(formData.area) !== ""
            ? Number(formData.area)
            : null,
        projectStage: formData.projectStage || null,
        startTimeline: formData.startTimeline || null,
        budgetComfort: formData.budgetComfort || null,
        projectScope: formData.projectScope || null,

        message: formData.message?.trim() || null,
        requirements: formData.requirements?.trim() || null,
        specialRequirements: formData.requirements?.trim() || null,

        // If we have a pending file (new lead) or just uploaded one without a URL (edit lead using marker),
        // send null so backend doesn't save the marker string. The attachment is already linked.
        floorPlanUrl:
          pendingFloorPlanFile || formData.floorPlanUrl === "_UPLOADED_"
            ? null
            : formData.floorPlanUrl?.trim() || null,
        floorPlanFile: pendingFloorPlanFile,
      };
      await onSave(payload as unknown as Omit<Lead, "id">);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save lead";

      if (/email.*exist|already.*email|duplicate.*email/i.test(errorMessage)) {
        setErrors((prev) => ({
          ...prev,
          email: "This email already exists. Please use a different email.",
        }));
        setActiveTab("basic");
      }

      if (/phone.*exist|already.*phone|duplicate.*phone/i.test(errorMessage)) {
        setErrors((prev) => ({
          ...prev,
          phone: "This phone number already exists. Please use a different number.",
        }));
        setActiveTab("basic");
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (err?: string) =>
    `w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
      err ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
    }`;

  const selectClass = (err?: string) =>
    `w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white appearance-none cursor-pointer transition-all ${
      err
        ? "border-red-300 bg-red-50 hover:border-red-400"
        : "border-gray-200 hover:border-gray-300"
    }`;

  const tabs: { key: "basic" | "property"; label: string }[] = [
    { key: "basic", label: "Basic Info" },
    { key: "property", label: "Property & Project" },
  ];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {lead ? "Edit Lead" : "Add New Lead"}
              </h2>
              <p className="text-sm text-gray-600">
                {lead
                  ? "Update all lead information"
                  : "Fill in the lead details"}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* ── Tab 1: Basic Info ── */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => f("name", e.target.value)}
                    placeholder="e.g., Rahul Sharma"
                    className={inputClass(errors.name)}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => f("email", e.target.value)}
                    onBlur={() => void checkDuplicateField("email", formData.email)}
                    placeholder="rahul@example.com"
                    className={inputClass(errors.email)}
                  />
                  {checkingDuplicate.email && (
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Checking email availability...
                    </p>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => f("phone", e.target.value)}
                    onBlur={() => void checkDuplicateField("phone", formData.phone)}
                    placeholder="+91 98765 43210"
                    className={inputClass(errors.phone)}
                  />
                  {checkingDuplicate.phone && (
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Checking phone availability...
                    </p>
                  )}
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) => f("companyName", e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lead Source
                  </label>
                  <select
                    value={formData.source || "WEBSITE"}
                    onChange={(e) => f("source", e.target.value)}
                    className={selectClass()}
                  >
                    {availableSources.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lead Status
                  </label>
                  <select
                    value={formData.status || "NEW"}
                    onChange={(e) => f("status", e.target.value)}
                    className={selectClass()}
                  >
                    {availableStatuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lead Score
                  </label>
                  <select
                    value={formData.score ?? ""}
                    onChange={(e) =>
                      f("score", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    className={selectClass()}
                  >
                    <option value="">Select...</option>
                    {Array.from({ length: 100 }, (_, index) => index + 1).map((score) => (
                      <option key={score} value={score}>
                        {score}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lead By
                  </label>
                  <select
                    value={formData.assignedToId || ""}
                    onChange={(e) => f("assignedToId", e.target.value || null)}
                    className={selectClass()}
                  >
                    <option value="">Select internal team member...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Property & Project ── */}
          {activeTab === "property" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.propertyType || ""}
                    onChange={(e) => f("propertyType", e.target.value)}
                    className={selectClass(errors.propertyType)}
                  >
                    <option value="">Select...</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="MIXED_USE">Mixed Use</option>
                    <option value="OTHERS">Others</option>
                  </select>
                  {errors.propertyType && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.propertyType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.projectType || ""}
                    onChange={(e) => f("projectType", e.target.value)}
                    className={selectClass(errors.projectType)}
                  >
                    <option value="">Select...</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="VILLA">Villa</option>
                    <option value="ROW_HOUSE">Row House</option>
                    <option value="PENTHOUSE">Penthouse</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="STUDIO">Studio</option>
                    <option value="OFFICE">Office</option>
                    <option value="RETAIL">Retail</option>
                    <option value="WAREHOUSE">Warehouse</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.projectType && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.projectType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Area
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.area ?? ""}
                    onChange={(e) =>
                      f("area", e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="e.g., 1500"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => f("city", e.target.value)}
                    placeholder="e.g., Bengaluru"
                    className={inputClass(errors.city)}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Project Stage
                  </label>
                  <select
                    value={formData.projectStage || ""}
                    onChange={(e) => f("projectStage", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="NEW_HOME_PENDING">New Home - Pending Possession</option>
                    <option value="NEW_HOME_RECEIVED">New Home - Received</option>
                    <option value="RENOVATION">Renovation</option>
                    <option value="COMMERCIAL_FITOUT">Commercial Fitout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Start Timeline <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.startTimeline || ""}
                    onChange={(e) => f("startTimeline", e.target.value)}
                    className={selectClass(errors.startTimeline)}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="IMMEDIATELY">Immediately</option>
                    <option value="ONE_TO_THREE_MONTHS">1-3 Months</option>
                    <option value="THREE_TO_SIX_MONTHS">3-6 Months</option>
                    <option value="SIX_PLUS_MONTHS">6+ Months</option>
                  </select>
                  {errors.startTimeline && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.startTimeline}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Budget Comfort <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.budgetComfort || ""}
                    onChange={(e) => f("budgetComfort", e.target.value)}
                    className={selectClass(errors.budgetComfort)}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="VALUE">Value</option>
                    <option value="BALANCED">Balanced</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="NEED_GUIDANCE">Need Guidance</option>
                  </select>
                  {errors.budgetComfort && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.budgetComfort}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Project Scope <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.projectScope || ""}
                    onChange={(e) => f("projectScope", e.target.value)}
                    className={selectClass(errors.projectScope)}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="TURNKEY">Turnkey</option>
                    <option value="KITCHEN_WARDROBES">Kitchen & Wardrobes</option>
                    <option value="INTERIOR_DESIGN_ONLY">Interior Design Only</option>
                    <option value="INTERIOR_DESIGN_AND_BUILD">Interior Design & Build</option>
                    <option value="ARCHITECTURE_DESIGN_ONLY">Architecture Design Only</option>
                    <option value="RENOVATION">Renovation</option>
                    <option value="SPECIFIC_SPACE">Specific Space</option>
                    <option value="OTHERS">Others</option>
                  </select>
                  {errors.projectScope && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.projectScope}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Floor Plan</span>
                    {hasFloorPlanAttachment && (
                      <span className="text-xs font-normal text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> File uploaded
                      </span>
                    )}
                  </label>
                  <div className="flex flex-col gap-2">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />

                    {/* Upload Button */}
                    {!formData.floorPlanUrl && !pendingFloorPlanFile ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-2 ${
                          isUploading ? "opacity-70 cursor-wait" : ""
                        }`}
                        title="Upload File"
                      >
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400" />
                        )}
                        <span className="text-sm">
                          {isUploading
                            ? "Uploading..."
                            : "Click to upload floor plan (PDF/Image)"}
                        </span>
                      </button>
                    ) : (
                      <div className="w-full px-4 py-8 border-2 border-dashed border-emerald-500 bg-emerald-50/30 rounded-xl flex flex-col items-center justify-center gap-3 relative group">
                        <div className="bg-emerald-100 p-2.5 rounded-full ring-4 ring-emerald-50 text-emerald-600">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-emerald-900">
                          File uploaded
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFloorPlanFile(null);
                            f("floorPlanUrl", "");
                          }}
                          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 rounded-lg border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Supported formats: PDF, PNG, JPG (Max 10MB)
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Message / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.message || ""}
                    onChange={(e) => f("message", e.target.value)}
                    placeholder="e.g., Looking for modern interiors"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-300 transition-all resize-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={formData.requirements || ""}
                    onChange={(e) => {
                      f("requirements", e.target.value);
                      f("specialRequirements", e.target.value);
                    }}
                    placeholder="e.g., Vastu compliant, design preferences"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-300 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeTab === tab.key ? "bg-orange-500" : "bg-gray-300"
                }`}
                onClick={() => setActiveTab(tab.key)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {!lead && activeTab === "basic" ? (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Next
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {lead ? "Update Lead" : "Create Lead"}
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Phone Input Modal for OTP
const PhoneInputModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!/^\+?[\d\s-]{10,}$/.test(phone)) {
      setError("Please enter a valid phone number");
      return;
    }
    onSubmit(phone);
    setPhone("");
    setError("");
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Send OTP</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Enter phone number to send OTP verification code
          </p>

          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="+91 98765 43210"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2 ${
              error ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />

          {error && (
            <p className="text-sm text-red-600 mb-4 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25"
            >
              <Send className="w-4 h-4" />
              Send OTP
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// OTP Verification Modal
const OTPModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerify: (otp: string) => Promise<void>;
}> = ({ isOpen, onClose, phone, onVerify }) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otp);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid OTP";
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Verify OTP</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Enter the OTP sent to <span className="font-semibold">{phone}</span>
          </p>

          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          />

          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Verify OTP
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const LeadsPage: React.FC = () => {
  const UNQUALIFIED_FILTER = "__unqualified__";
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAccountType, setConvertAccountType] =
    useState<string>("RESIDENTIAL");
  const [accountTypes, setAccountTypes] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [otpPhone, setOtpPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [kanbanLog, setKanbanLog] = useState<KanbanActivityEntry[]>([]);

  // BDR Assignment State
  const [bdrUsers, setBdrUsers] = useState<AdminUser[]>([]);
  const [bdrDropdownOpen, setBdrDropdownOpen] = useState<string | null>(null);
  const [bdrDropdownPos, setBdrDropdownPos] = useState<{
    top: number;
    left: number;
    openUpward?: boolean;
  } | null>(null);
  const [bdrSearch, setBdrSearch] = useState("");
  const bdrButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const bdrDropdownRef = useRef<HTMLDivElement | null>(null);
  const bulkBdrDropdownRef = useRef<HTMLDivElement | null>(null);

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkBdrDropdownOpen, setBulkBdrDropdownOpen] = useState(false);
  const bulkBdrButtonRef = useRef<HTMLButtonElement | null>(null);
  const [bulkBdrDropdownPos, setBulkBdrDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Unassigned Filter State
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [unassignedLoading, setUnassignedLoading] = useState(false);
  const [unassignedPage, setUnassignedPage] = useState(0);
  const [unassignedHasMore, setUnassignedHasMore] = useState(false);
  const [, setUnassignedTotal] = useState<number | null>(null);

  // Assignment loading state
  const [isAssigning, setIsAssigning] = useState(false);

  // Load kanban activity log
  useEffect(() => {
    setKanbanLog(getActivityLog());
    const interval = setInterval(() => {
      setKanbanLog(getActivityLog());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch BDR users
  useEffect(() => {
    const fetchBDRs = async () => {
      try {
        const response = await adminAPI.getAllUsers();
        const usersArray = Array.isArray(response)
          ? response
          : (response as { users?: AdminUser[] })?.users || [];
        // Deduplicate by id
        const seen = new Set<string>();
        const uniqueUsers: AdminUser[] = [];
        for (const u of usersArray) {
          if (u.id && !seen.has(u.id) && !u.isBanned) {
            seen.add(u.id);
            uniqueUsers.push(u);
          }
        }
        setBdrUsers(uniqueUsers);
      } catch (error) {
        console.error("Error fetching BDR users:", error);
      }
    };
    fetchBDRs();
  }, []);

  // Fetch initial data
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCustomerTypes();
  }, []);

  // Close BDR dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (bdrDropdownOpen) {
        setBdrDropdownOpen(null);
        setBdrDropdownPos(null);
      }
      if (bulkBdrDropdownOpen) {
        setBulkBdrDropdownOpen(false);
        setBulkBdrDropdownPos(null);
      }
    };
    if (bdrDropdownOpen || bulkBdrDropdownOpen) {
      // Use setTimeout so the click that opens the dropdown doesn't immediately close it
      const timer = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [bdrDropdownOpen, bulkBdrDropdownOpen]);

  const fetchCustomerTypes = async () => {
    try {
      const types = await CustomerAPI.getCustomerTypes();
      setAccountTypes(types);
      if (types.length > 0) {
        setConvertAccountType(types[0].value);
      }
    } catch (error) {
      console.error("Error fetching customer types:", error);
      // Fallback to default types
      setAccountTypes([
        {
          value: "RESIDENTIAL",
          label: "Residential",
          description: "Individual or family residential customer",
        },
        {
          value: "COMMERCIAL",
          label: "Commercial",
          description: "Business or commercial customer",
        },
      ]);
      setConvertAccountType("RESIDENTIAL");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, sourcesData, statusesData] = await Promise.all([
        LeadAPI.listLeads({ limit: 1000 }),
        LeadAPI.getLeadSources(),
        LeadAPI.getLeadStatuses(),
      ]);

      console.log("API Response:", { leadsData, sourcesData, statusesData });

      setLeads(leadsData.leads || []);
      setSources(Array.isArray(sourcesData) ? sourcesData : []);
      setStatuses(Array.isArray(statusesData) ? statusesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);

      // More helpful error message
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load leads data";
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        toast.error(
          "Cannot connect to API. Please check your API URL configuration.",
        );
      } else {
        toast.error(errorMessage);
      }

      // Set empty arrays on error to prevent crashes
      setLeads([]);
      setSources([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOTP = async (phone: string) => {
    try {
      await LeadAPI.sendOTP(phone);
      setOtpPhone(phone);
      setShowOTPModal(true);
      toast.success("OTP sent successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(errorMessage);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otp: string) => {
    const response = await LeadAPI.verifyOTP(otpPhone, otp);
    if (response.success && response.lead) {
      setSelectedLead(response.lead);
      toast.success("OTP verified successfully!");
    }
  };

  // Create Lead
  const handleCreateLead = async (leadData: Omit<Lead, "id">) => {
    try {
      const leadDataWithFile = leadData as Omit<Lead, "id"> & {
        floorPlanFile?: File | null;
      };
      const floorPlanFile = leadDataWithFile.floorPlanFile;

      const payload = {
        ...leadData,
        floorPlanUrl: floorPlanFile ? null : leadData.floorPlanUrl || null,
      } as Omit<Lead, "id">;

      delete (payload as Record<string, unknown>).floorPlanFile;

      let newLead = await LeadAPI.createLead(payload);

      if (floorPlanFile && newLead.id) {
        try {
          const uploaded = await LeadAPI.uploadFloorPlan(floorPlanFile, newLead.id);
          const uploadedUrl = uploaded?.url || "";

          if (uploadedUrl) {
            newLead = await LeadAPI.updateLead(newLead.id, {
              floorPlanUrl: uploadedUrl,
            });
          }
        } catch (uploadError) {
          console.error("Error uploading floor plan after lead creation:", uploadError);
          toast.error(
            "Lead created, but floor plan upload failed. Please upload it from Edit Lead.",
          );
        }
      }

      const floorPlanUrl = newLead.floorPlanUrl || leadData.floorPlanUrl || "";

      console.log("Lead created - API response:", newLead);
      console.log("Original form data:", leadData);

      // Ensure the lead has required fields from form data
      const leadWithData = {
        ...leadData,
        ...newLead,
        name: newLead.name || leadData.name,
        email: newLead.email || leadData.email,
        phone: newLead.phone || leadData.phone,
        source: newLead.source || leadData.source,
        status: newLead.status || leadData.status || "NEW",
        floorPlanUrl,
      };

      console.log("Lead with merged data:", leadWithData);

      setLeads([leadWithData, ...leads]);
      setShowAddModal(false);
      toast.success("Lead created successfully!");

      // Optionally refresh the entire list to get latest data from server
      fetchData();
    } catch (error) {
      console.error("Error creating lead:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  // Update Lead
  const handleUpdateLead = async (leadData: Omit<Lead, "id">) => {
    if (!leadToEdit?.id) return;
    try {
      const leadDataWithFile = leadData as Omit<Lead, "id"> & {
        floorPlanFile?: File | null;
      };
      const floorPlanUrl = leadDataWithFile.floorPlanUrl || "";

      const payload = {
        ...leadData,
        floorPlanUrl: floorPlanUrl || null,
      } as Omit<Lead, "id">;

      delete (payload as Record<string, unknown>).floorPlanFile;

      const updatedLead = await LeadAPI.updateLead(leadToEdit.id, payload);
      setLeads(leads.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
      setShowEditModal(false);
      setLeadToEdit(null);
      if (selectedLead?.id === updatedLead.id) {
        setSelectedLead(updatedLead);
      }
      toast.success("Lead updated successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update lead";
      toast.error(errorMessage);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      await LeadAPI.deleteLead(id);
      setLeads(leads.filter((l) => l.id !== id));
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      toast.success("Lead deleted successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete lead";
      toast.error(errorMessage);
    }
  };

  // Convert Lead to Customer
  const handleConvertToCustomer = async () => {
    if (!selectedLead?.id) return;

    const customerName = selectedLead.name || "Unknown Customer";

    // Guard: lead has already been converted
    if ((selectedLead as any).convertedToAccount) {
      toast.error(`This lead has already been converted to a customer.`);
      setShowConvertModal(false);
      return;
    }

    // Validate customer type
    if (
      !convertAccountType ||
      !["RESIDENTIAL", "COMMERCIAL"].includes(convertAccountType)
    ) {
      toast.error("Please select a valid customer type");
      return;
    }

    try {
      const result = await CustomerAPI.convertLeadToCustomer(
        selectedLead.id,
        customerName,
      );

      // Remove lead from list
      setLeads(leads.filter((l) => l.id !== selectedLead.id));
      setSelectedLead(null);
      setShowConvertModal(false);

      toast.success(
        `Lead converted to customer "${result.name}" successfully!`,
      );

      // Navigate to customers page to see the new customer
      setTimeout(() => {
        window.location.href = "/dashboard/customers";
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to convert lead to customer";
      toast.error(errorMessage);
    }
  };

  // Fetch activities when lead is selected
  useEffect(() => {
    if (selectedLead?.id) {
      fetchActivities(selectedLead.id);
    }
  }, [selectedLead]);

  const fetchActivities = async (leadId: string) => {
    try {
      const data = await LeadAPI.getLeadActivities(leadId);
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  // Fetch unassigned leads when tab selected (supports pagination)
  const fetchUnassignedLeads = useCallback(
    async (loadMore = false) => {
      setUnassignedLoading(true);
      const limit = 50;
      const offset = loadMore ? (unassignedPage + 1) * limit : 0;
      try {
        const response = await LeadAPI.getUnassignedLeads({ limit, offset });
        const newLeads = response.leads || [];
        if (loadMore) {
          setUnassignedLeads((prev) => [...prev, ...newLeads]);
          setUnassignedPage((p) => p + 1);
        } else {
          setUnassignedLeads(newLeads);
          setUnassignedPage(0);
        }
        setUnassignedTotal(
          typeof response.total === "number" ? response.total : null,
        );
        setUnassignedHasMore(newLeads.length === limit);
      } catch (error) {
        console.error("Error fetching unassigned leads:", error);
        toast.error("Failed to load unassigned leads");
        if (!loadMore) {
          setUnassignedLeads([]);
          setUnassignedTotal(null);
        }
      } finally {
        setUnassignedLoading(false);
      }
    },
    [unassignedPage],
  );

  useEffect(() => {
    if (selectedStage === "__unassigned__") {
      fetchUnassignedLeads();
    }
  }, [selectedStage, fetchUnassignedLeads]);

  // Single BDR assignment handler
  const handleAssignBDR = async (leadId: string, userId: string | null) => {
    setIsAssigning(true);
    try {
      if (userId) {
        await LeadAPI.assignLead(leadId, { assigneeUserId: userId });
        const user = bdrUsers.find((u) => u.id === userId);
        toast.success(`Lead assigned to ${user?.name || "user"}`);
      } else {
        // Unassign - assign to empty
        await LeadAPI.assignLead(leadId, { assigneeUserId: "" });
        toast.success("Lead unassigned");
      }
      setBdrDropdownOpen(null);
      setBdrDropdownPos(null);
      fetchData();
      if (selectedStage === "__unassigned__") fetchUnassignedLeads();
      // Sync Zustand store so KanbanView stays in sync
      useLeadStore.getState().fetchLeads();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to assign lead";
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  // Bulk BDR assignment handler
  const handleBulkAssignBDR = async (userId: string) => {
    const leadIds = Array.from(selectedLeadIds);
    const user = bdrUsers.find((u) => u.id === userId);
    if (
      !window.confirm(
        `Assign ${leadIds.length} lead${leadIds.length > 1 ? "s" : ""} to ${user?.name || "user"}?`,
      )
    )
      return;
    setIsAssigning(true);
    try {
      await LeadAPI.bulkAssignLeads({ leadIds, assigneeUserId: userId });
      toast.success(
        `${leadIds.length} lead(s) assigned to ${user?.name || "user"}`,
      );
      setSelectedLeadIds(new Set());
      setBulkBdrDropdownOpen(false);
      setBulkBdrDropdownPos(null);
      fetchData();
      if (selectedStage === "__unassigned__") fetchUnassignedLeads();
      // Sync Zustand store so KanbanView stays in sync
      useLeadStore.getState().fetchLeads();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to bulk assign leads";
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  // Toggle lead checkbox selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  // Open per-card BDR dropdown
  const openBdrDropdown = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const btn = bdrButtonRefs.current[leadId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const dropdownHeight = 300;
      const dropdownWidth = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight + 8;
      // Clamp left so dropdown never overflows the right edge
      const left = Math.min(rect.left, window.innerWidth - dropdownWidth - 8);
      setBdrDropdownPos({
        top: openUpward ? rect.top - 4 : rect.bottom + 4,
        left,
        openUpward,
      });
    }
    setBdrSearch("");
    setBdrDropdownOpen((prev) => (prev === leadId ? null : leadId));
  };

  // Close dropdowns on scroll to prevent detachment issues,
  // but ignore scrolls that originate inside the dropdown itself.
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as Node;
      if (bdrDropdownRef.current?.contains(target)) return;
      if (bulkBdrDropdownRef.current?.contains(target)) return;
      if (bdrDropdownOpen) {
        setBdrDropdownOpen(null);
        setBdrDropdownPos(null);
      }
      if (bulkBdrDropdownOpen) {
        setBulkBdrDropdownOpen(false);
        setBulkBdrDropdownPos(null);
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [bdrDropdownOpen, bulkBdrDropdownOpen]);

  // Open bulk BDR dropdown
  const openBulkBdrDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const btn = bulkBdrButtonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setBulkBdrDropdownPos({ top: rect.top - 4, left: rect.left });
    }
    setBulkBdrDropdownOpen((prev) => !prev);
  };

  // Non-converted leads (converted leads move to Customers section)
  const nonConvertedLeads = leads.filter((lead) => lead.status !== "CONVERTED");
  const searchLower = searchQuery.toLowerCase();

  const isLeadUnassigned = (lead: Lead) => !lead.assignedToId && !lead.assignedTo?.id;

  const isWebsiteSourceLead = (lead: Lead) =>
    String(lead.source || "").toUpperCase() === "WEBSITE";

  const isUnqualifiedLead = (lead: Lead) =>
    lead.status === "DISQUALIFIED" || isWebsiteSourceLead(lead);

  const matchesLeadSearch = (lead: Lead) =>
    (lead.name?.toLowerCase() || "").includes(searchLower) ||
    (lead.email?.toLowerCase() || "").includes(searchLower) ||
    (lead.phone?.toLowerCase() || "").includes(searchLower);

  const filteredLeads = nonConvertedLeads.filter((lead) => {
    const matchesSearch = matchesLeadSearch(lead);
    const matchesStage =
      selectedStage === "all" ||
      selectedStage === "__unassigned__" ||
      (selectedStage === UNQUALIFIED_FILTER
        ? isUnqualifiedLead(lead)
        : lead.status === selectedStage && !isWebsiteSourceLead(lead));
    return matchesSearch && matchesStage;
  });

  // Keep unassigned count and list in sync by using one source of truth.
  // Prefer the already-loaded lead list; fall back to unassigned endpoint if needed.
  const shouldUseUnassignedFallback = nonConvertedLeads.length === 0;
  const unassignedSourceLeads = shouldUseUnassignedFallback
    ? unassignedLeads.filter((lead) => lead.status !== "CONVERTED")
    : nonConvertedLeads;

  const filteredUnassignedLeads = unassignedSourceLeads.filter(
    (lead) => isLeadUnassigned(lead) && matchesLeadSearch(lead),
  );

  // Determine which leads to display
  const displayLeads =
    selectedStage === "__unassigned__" ? filteredUnassignedLeads : filteredLeads;

  // Calculate lead counts by status (excluding CONVERTED — they live in Customers)
  const leadCounts = Array.isArray(statuses)
    ? statuses.reduce(
        (acc, status) => {
          acc[status.value] = nonConvertedLeads.filter(
            (l) => l.status === status.value && !isWebsiteSourceLead(l),
          ).length;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  const unqualifiedCount = nonConvertedLeads.filter(isUnqualifiedLead).length;

  const effectiveUnassignedCount = unassignedSourceLeads.filter(
    isLeadUnassigned,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads & CRM</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales pipeline effectively
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="rounded-xl" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search leads by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setSelectedStage("all");
            setSelectedLeadIds(new Set());
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            selectedStage === "all"
              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({nonConvertedLeads.length})
        </button>
        {Array.isArray(statuses) &&
          statuses
            .filter((status) => status.value !== "CONVERTED")
            .map((status) => (
              <button
                key={status.value}
                onClick={() => {
                  setSelectedStage(status.value);
                  setSelectedLeadIds(new Set());
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedStage === status.value
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.label} ({leadCounts[status.value] || 0})
              </button>
            ))}
        <button
          onClick={() => {
            setSelectedStage(UNQUALIFIED_FILTER);
            setSelectedLeadIds(new Set());
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            selectedStage === UNQUALIFIED_FILTER
              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Unqualified ({unqualifiedCount})
        </button>
        <button
          onClick={() => {
            setSelectedStage("__unassigned__");
            setSelectedLeadIds(new Set());
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedStage === "__unassigned__"
              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Unassigned ({effectiveUnassignedCount})
        </button>
      </div>

      {/* Loading for unassigned tab */}
      {selectedStage === "__unassigned__" &&
        shouldUseUnassignedFallback &&
        unassignedLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-500">
            Loading unassigned leads...
          </span>
        </div>
      )}

      {/* Kanban Activity Log */}
      {kanbanLog.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 transition-all">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Layers className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Kanban Activity Log
                  </h2>
                </div>
                {!isActivityLogOpen && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                    {kanbanLog.length} new
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isActivityLogOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearActivityLog();
                    setKanbanLog([]);
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                  title="Clear all logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isActivityLogOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isActivityLogOpen
                ? "max-h-72 opacity-100 mt-4"
                : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
              {kanbanLog.map((entry) => {
                const time = new Date(entry.timestamp);
                const now = new Date();
                const diffMs = now.getTime() - time.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                const diffHr = Math.floor(diffMin / 60);
                const diffDay = Math.floor(diffHr / 24);
                const relativeTime =
                  diffMin < 1
                    ? "Just now"
                    : diffMin < 60
                      ? `${diffMin}m ago`
                      : diffHr < 24
                        ? `${diffHr}h ago`
                        : diffDay === 1
                          ? "Yesterday"
                          : diffDay < 7
                            ? `${diffDay}d ago`
                            : time.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              });

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50/50 hover:border-orange-100 transition-all"
                  >
                    <div
                      className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.action === "card_moved"
                          ? "bg-blue-100"
                          : "bg-orange-100"
                      }`}
                    >
                      {entry.action === "card_moved" ? (
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Plus className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{entry.cardTitle}</span>
                        {entry.action === "card_moved" ? (
                          <>
                            {" "}
                            moved from{" "}
                            <span className="font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {entry.fromColumn}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {entry.columnName}
                            </span>
                          </>
                        ) : (
                          <>
                            {" "}
                            added to{" "}
                            <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              {entry.columnName}
                            </span>
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relativeTime}
                        </span>
                        {entry.priority && (
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              entry.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : entry.priority === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {entry.priority}
                          </span>
                        )}
                        {entry.assignedTo && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                            <User className="w-3 h-3" />
                            {entry.assignedTo}
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
      )}

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {displayLeads.map((lead) => (
          <LazyLeadCard
            key={lead.id}
            lead={lead}
            selectedLeadIds={selectedLeadIds}
            onToggleSelection={toggleLeadSelection}
            onNavigate={navigate}
            onEdit={(l) => {
              setLeadToEdit(l);
              setShowEditModal(true);
            }}
            onOpenBdrDropdown={openBdrDropdown}
            registerBdrButtonRef={(id, el) => {
              if (id) bdrButtonRefs.current[id] = el;
            }}
          />
        ))}
      </div>

      {/* Load More for Unassigned */}
      {selectedStage === "__unassigned__" &&
        shouldUseUnassignedFallback &&
        unassignedHasMore &&
        !unassignedLoading && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchUnassignedLeads(true)}
              className="px-6 py-2.5 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors ring-1 ring-orange-200"
            >
              Load More Unassigned Leads
            </button>
          </div>
        )}

      {displayLeads.length === 0 && !unassignedLoading && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {selectedStage === "__unassigned__"
              ? "No unassigned leads"
              : "No leads found"}
          </h3>
          <p className="text-gray-500 mb-4">
            {selectedStage === "__unassigned__"
              ? "All leads have been assigned"
              : searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by adding your first lead"}
          </p>
          <Button onClick={() => setShowAddModal(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Lead
          </Button>
        </div>
      )}

      {/* Lead Details Sidebar */}

      {selectedLead &&
        ReactDOM.createPortal(
          <>
            <div
              onClick={() => setSelectedLead(null)}
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
                right: 0,
                bottom: 0,
                width: "100%",
                maxWidth: "500px",
                zIndex: 9999,
                backgroundColor: "white",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "auto",
              }}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold">Lead Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConvertModal(true);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Convert to Customer"
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadToEdit(selectedLead);
                      setShowEditModal(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedLead.id) handleDeleteLead(selectedLead.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Lead Header */}
                <div className="text-center pb-6 border-b">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    {(selectedLead.name || "Unknown")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {selectedLead.name || "Unknown"}
                  </h3>
                  {selectedLead.leadNumber && (
                    <p className="text-sm text-gray-500 mb-2">
                      Lead No: <span className="font-medium">{selectedLead.leadNumber}</span>
                    </p>
                  )}
                  <Badge
                    className={`rounded-lg ${getStatusColor(selectedLead.status || "New")}`}
                  >
                    {formatEnumValue(selectedLead.status || "New")}
                  </Badge>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    {selectedLead.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium">{selectedLead.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium">{selectedLead.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                {(selectedLead.projectCategory ||
                  selectedLead.propertyType ||
                  selectedLead.projectType ||
                  selectedLead.pipelineType ||
                  selectedLead.scopeType ||
                  selectedLead.projectStage ||
                  selectedLead.startTimeline ||
                  selectedLead.budgetComfort ||
                  selectedLead.projectScope ||
                  selectedLead.propertySubtype ||
                  selectedLead.propertyBHK ||
                  selectedLead.budgetTier ||
                  selectedLead.propertySizeSqft ||
                  selectedLead.constructionStatus ||
                  selectedLead.tentativeHandoverDate ||
                  selectedLead.propertyAddress ||
                  selectedLead.propertyState ||
                  selectedLead.propertyPincode ||
                  selectedLead.propertyBuilding ||
                  selectedLead.propertyUnit ||
                  selectedLead.propertyLandmarks ||
                  selectedLead.location ||
                  selectedLead.specialRequirements ||
                  selectedLead.designPackage ||
                  selectedLead.message ||
                  selectedLead.siteContactName ||
                  selectedLead.siteContactPhone ||
                  typeof selectedLead.wantsExperienceCenterVisit === "boolean" ||
                  typeof selectedLead.canWhatsApp === "boolean") && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Property Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedLead.projectCategory && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project Category:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.projectCategory)}
                          </span>
                        </div>
                      )}
                      {selectedLead.propertyType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.propertyType)}
                          </span>
                        </div>
                      )}
                      {selectedLead.projectType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project Type:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.projectType)}
                          </span>
                        </div>
                      )}
                      {selectedLead.pipelineType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pipeline Type:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.pipelineType)}
                          </span>
                        </div>
                      )}
                      {selectedLead.scopeType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Scope Type:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.scopeType)}
                          </span>
                        </div>
                      )}
                      {selectedLead.projectStage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project Stage:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.projectStage)}
                          </span>
                        </div>
                      )}
                      {selectedLead.startTimeline && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Timeline:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.startTimeline)}
                          </span>
                        </div>
                      )}
                      {selectedLead.budgetComfort && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget Comfort:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.budgetComfort)}
                          </span>
                        </div>
                      )}
                      {selectedLead.projectScope && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project Scope:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.projectScope)}
                          </span>
                        </div>
                      )}
                      {selectedLead.propertySubtype && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Subtype:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.propertySubtype)}
                          </span>
                        </div>
                      )}
                      {selectedLead.propertyBHK && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property BHK:</span>
                          <span className="font-medium">{selectedLead.propertyBHK}</span>
                        </div>
                      )}
                      {(selectedLead.propertySizeSqft || selectedLead.propertySizeSqft === 0) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{selectedLead.propertySizeSqft} sqft</span>
                        </div>
                      )}
                      {selectedLead.budgetTier && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget Tier:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.budgetTier)}
                          </span>
                        </div>
                      )}
                      {selectedLead.constructionStatus && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Construction:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.constructionStatus)}
                          </span>
                        </div>
                      )}
                      {selectedLead.tentativeHandoverDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tentative Handover:</span>
                          <span className="font-medium">
                            {new Date(selectedLead.tentativeHandoverDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedLead.designPackage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Design Package:</span>
                          <span className="font-medium">
                            {formatEnumValue(selectedLead.designPackage)}
                          </span>
                        </div>
                      )}
                      {selectedLead.location && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">
                            {selectedLead.location}
                          </span>
                        </div>
                      )}
                      {selectedLead.propertyAddress && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">
                            {selectedLead.propertyAddress}
                          </span>
                        </div>
                      )}
                      {selectedLead.propertyBuilding && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Building:</span>
                          <span className="font-medium">{selectedLead.propertyBuilding}</span>
                        </div>
                      )}
                      {selectedLead.propertyUnit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit:</span>
                          <span className="font-medium">{selectedLead.propertyUnit}</span>
                        </div>
                      )}
                      {selectedLead.propertyState && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="font-medium">{selectedLead.propertyState}</span>
                        </div>
                      )}
                      {selectedLead.propertyPincode && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pincode:</span>
                          <span className="font-medium">{selectedLead.propertyPincode}</span>
                        </div>
                      )}
                      {selectedLead.propertyLandmarks && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Landmarks:</span>
                          <span className="font-medium">{selectedLead.propertyLandmarks}</span>
                        </div>
                      )}
                      {selectedLead.siteContactName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Site Contact:</span>
                          <span className="font-medium">{selectedLead.siteContactName}</span>
                        </div>
                      )}
                      {selectedLead.siteContactPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Site Contact Phone:</span>
                          <span className="font-medium">{selectedLead.siteContactPhone}</span>
                        </div>
                      )}
                      {typeof selectedLead.canWhatsApp === "boolean" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">WhatsApp Available:</span>
                          <span className="font-medium">{selectedLead.canWhatsApp ? "Yes" : "No"}</span>
                        </div>
                      )}
                      {typeof selectedLead.wantsExperienceCenterVisit === "boolean" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Experience Center Visit:</span>
                          <span className="font-medium">{selectedLead.wantsExperienceCenterVisit ? "Yes" : "No"}</span>
                        </div>
                      )}
                      {selectedLead.specialRequirements && (
                        <div>
                          <span className="text-gray-600">Special Requirements:</span>
                          <p className="font-medium mt-1">{selectedLead.specialRequirements}</p>
                        </div>
                      )}
                      {selectedLead.message && (
                        <div>
                          <span className="text-gray-600">Message:</span>
                          <p className="font-medium mt-1">{selectedLead.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lead Source */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Lead Source
                  </h4>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {getSourceLabel(selectedLead.source)}
                  </Badge>
                </div>

                {/* Referral & Agency */}
                {(selectedLead.referrerName ||
                  selectedLead.referrerPhone ||
                  selectedLead.agentAgencyName ||
                  selectedLead.agentAgencyDetails) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Referral & Agency
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedLead.referrerName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Referrer Name:</span>
                          <span className="font-medium">{selectedLead.referrerName}</span>
                        </div>
                      )}
                      {selectedLead.referrerPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Referrer Phone:</span>
                          <span className="font-medium">{selectedLead.referrerPhone}</span>
                        </div>
                      )}
                      {selectedLead.agentAgencyName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agency:</span>
                          <span className="font-medium">{selectedLead.agentAgencyName}</span>
                        </div>
                      )}
                      {selectedLead.agentAgencyDetails && (
                        <div>
                          <span className="text-gray-600">Agency Details:</span>
                          <p className="font-medium mt-1">{selectedLead.agentAgencyDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notes
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}

                {/* Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activities
                  </h4>
                  {activities.length > 0 ? (
                    <div className="space-y-2">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.type}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No activities yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Modals */}
      <LeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateLead}
        sources={sources}
        statuses={statuses}
        users={bdrUsers}
      />

      <LeadModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setLeadToEdit(null);
        }}
        lead={leadToEdit}
        onSave={handleUpdateLead}
        sources={sources}
        statuses={statuses}
        users={bdrUsers}
      />

      <PhoneInputModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handleSendOTP}
      />

      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phone={otpPhone}
        onVerify={handleVerifyOTP}
      />

      {/* Per-card BDR Dropdown Portal */}
      {bdrDropdownOpen &&
        bdrDropdownPos &&
        ReactDOM.createPortal(
          (() => {
            const activeLead = displayLeads.find(
              (l) => l.id === bdrDropdownOpen,
            );
            const currentBdrId = activeLead?.assignedTo?.id ?? null;
            const filteredBdrUsers = bdrSearch.trim()
              ? bdrUsers.filter((u) =>
                  u.name.toLowerCase().includes(bdrSearch.toLowerCase()),
                )
              : bdrUsers;
            return (
              <div
                ref={bdrDropdownRef}
                className="fixed z-[70] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                style={{
                  top: bdrDropdownPos.top,
                  left: bdrDropdownPos.left,
                  width: 240,
                  ...(bdrDropdownPos.openUpward
                    ? { transform: "translateY(-100%)" }
                    : {}),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-3 pt-3 pb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Assign BDR
                  </p>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={bdrSearch}
                      onChange={(e) => {
                        e.stopPropagation();
                        setBdrSearch(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                      autoFocus
                    />
                  </div>
                </div>
                {/* List */}
                <div className="max-h-52 overflow-y-auto pb-1">
                  {/* Unassign option — only show when not filtering */}
                  {!bdrSearch && (
                    <button
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentBdrId === null
                          ? "bg-gray-50 text-gray-700"
                          : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                      }`}
                      disabled={isAssigning}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignBDR(bdrDropdownOpen, null);
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {isAssigning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium">Unassigned</span>
                      {currentBdrId === null && (
                        <Check className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                      )}
                    </button>
                  )}
                  {filteredBdrUsers.length > 0 ? (
                    filteredBdrUsers.map((user) => {
                      const isActive = user.id === currentBdrId;
                      return (
                        <button
                          key={user.id}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isActive
                              ? "bg-orange-50 text-orange-700"
                              : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                          }`}
                          disabled={isAssigning}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignBDR(bdrDropdownOpen, user.id);
                          }}
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.role.replace(/_/g, " ")}
                            </p>
                          </div>
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-orange-500 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-gray-400">
                      {bdrSearch ? "No matches" : "No users available"}
                    </div>
                  )}
                </div>
              </div>
            );
          })(),
          document.body,
        )}

      {/* Bulk Assign Toolbar */}
      {selectedLeadIds.size > 0 &&
        ReactDOM.createPortal(
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="relative">
              <button
                ref={bulkBdrButtonRef}
                onClick={openBulkBdrDropdown}
                disabled={isAssigning}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-200/50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isAssigning ? "Assigning..." : "Assign BDR"}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setSelectedLeadIds(new Set())}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>,
          document.body,
        )}

      {/* Bulk BDR Dropdown Portal */}
      {bulkBdrDropdownOpen &&
        bulkBdrDropdownPos &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-56 max-h-64 overflow-y-auto"
            style={{
              top: bulkBdrDropdownPos.top,
              left: bulkBdrDropdownPos.left,
              transform: "translateY(-100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Bulk Assign BDR
              </p>
            </div>
            {bdrUsers.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAssigning}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBulkAssignBDR(user.id);
                }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.role}</p>
                </div>
              </button>
            ))}
            {bdrUsers.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No users available
              </div>
            )}
          </div>,
          document.body,
        )}

      {/* Convert to Customer Modal */}
      {showConvertModal && selectedLead && (
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
            </div>

            <div className="space-y-4">
              {/* Lead Information */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Current Lead Information
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {selectedLead.name || "Unknown"}
                  </p>
                  {selectedLead.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedLead.email}
                    </p>
                  )}
                  {selectedLead.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedLead.phone}
                    </p>
                  )}
                  {selectedLead.source && (
                    <p className="text-sm text-gray-600">
                      Source: {getSourceLabel(selectedLead.source)}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Type Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={convertAccountType}
                  onChange={(e) => setConvertAccountType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {accountTypes.find((t) => t.value === convertAccountType)
                  ?.description && (
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    {
                      accountTypes.find((t) => t.value === convertAccountType)
                        ?.description
                    }
                  </p>
                )}
              </div>

              {/* Customer Preview */}
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
                        <span className="font-medium">Name:</span>{" "}
                        {selectedLead.name || "Unknown Customer"}
                      </p>
                      <p className="text-blue-800">
                        <span className="font-medium">Type:</span>{" "}
                        {accountTypes.find(
                          (t) => t.value === convertAccountType,
                        )?.label || convertAccountType}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          The lead will be removed from the leads list and
                          converted into a customer with all contact information
                          preserved.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertAccountType(accountTypes[0]?.value || "RESIDENTIAL");
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertToCustomer}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25"
              >
                <Check className="w-4 h-4 mr-2" />
                Convert to Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
