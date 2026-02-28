import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Search,
  MoreVertical,
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
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import toast from "react-hot-toast";
import LeadAPI, {
  Lead,
  LeadActivity,
  LeadSource,
  LeadStatus,
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

const stageColors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 border-gray-200",
  Qualified: "bg-blue-100 text-blue-700 border-blue-200",
  Meeting: "bg-purple-100 text-purple-700 border-purple-200",
  Proposal: "bg-orange-100 text-orange-700 border-orange-200",
  Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// Add/Edit Lead Modal Component
export const LeadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSave: (lead: Omit<Lead, "id">) => Promise<void>;
  sources: LeadSource[];
  users?: AdminUser[];
}> = ({ isOpen, onClose, lead, onSave, sources, users = [] }) => {
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

  const [activeTab, setActiveTab] = useState<"basic" | "property" | "referral">("basic");

  const emptyForm: Omit<Lead, "id"> = {
    name: "",
    email: "",
    phone: "",
    source: availableSources[0]?.value || "WEBSITE",
    companyName: "",
    householdOrCompany: "HOUSEHOLD",
    status: "NEW",
    score: 0,
    serviceInterest: "",
    propertyType: "",
    area: null,
    city: "",
    location: "",
    message: "",
    requirements: "",
    projectType: "",
    propertyProjectType: "",
    homeType: "",
    projectStage: "",
    startTimeline: "",
    budgetComfort: "",
    projectScope: "",
    floorPlanUrl: "",
    wantsExperienceCenterVisit: false,
    canWhatsApp: false,
    assignedToId: "",
    referrerName: "",
    referrerPhone: "",
    referrerProjectNumber: "",
    agentAgencyName: "",
    agentAgencyDetails: "",
  };

  const [formData, setFormData] = useState<Omit<Lead, "id">>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);
  // sourceDetails sub-fields
  const [srcCampaign, setSrcCampaign] = useState("");
  const [srcMedium, setSrcMedium] = useState("");

  const f = (field: keyof Omit<Lead, "id">, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || availableSources[0]?.value || "WEBSITE",
        companyName: lead.companyName || "",
        householdOrCompany: lead.householdOrCompany || "HOUSEHOLD",
        status: lead.status || "NEW",
        score: lead.score || 0,
        serviceInterest: lead.serviceInterest || "",
        propertyType: lead.propertyType || "",
        area: lead.area ?? null,
        city: lead.city || "",
        location: lead.location || "",
        message: lead.message || "",
        requirements: lead.requirements || "",
        projectType: lead.projectType || "",
        propertyProjectType: lead.propertyProjectType || "",
        homeType: lead.homeType || "",
        projectStage: lead.projectStage || "",
        startTimeline: lead.startTimeline || "",
        budgetComfort: lead.budgetComfort || "",
        projectScope: lead.projectScope || "",
        floorPlanUrl: lead.floorPlanUrl || "",
        wantsExperienceCenterVisit: lead.wantsExperienceCenterVisit || false,
        canWhatsApp: lead.canWhatsApp || false,
        assignedToId: lead.assignedToId || "",
        referrerName: lead.referrerName || "",
        referrerPhone: lead.referrerPhone || "",
        referrerProjectNumber: lead.referrerProjectNumber || "",
        agentAgencyName: lead.agentAgencyName || "",
        agentAgencyDetails: lead.agentAgencyDetails || "",
      });
      // Populate sourceDetails sub-fields
      const sd = lead.sourceDetails as Record<string, string> | null;
      setSrcCampaign(sd?.campaign || "");
      setSrcMedium(sd?.medium || "");
    } else {
      setFormData(emptyForm);
      setSrcCampaign("");
      setSrcMedium("");
    }
    setErrors({});
    setFloorPlanFile(null);
    setActiveTab("basic");
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
    if (!formData.serviceInterest) newErrors.serviceInterest = "Service Interest is required";
    if (!formData.propertyType) newErrors.propertyType = "Property Type is required";
    if (!formData.homeType) newErrors.homeType = "Home Type is required";
    if (!formData.city?.trim()) newErrors.city = "City is required";
    if (!formData.startTimeline) newErrors.startTimeline = "Start Timeline is required";
    if (!formData.budgetComfort) newErrors.budgetComfort = "Budget Comfort is required";
    if (!formData.projectScope) newErrors.projectScope = "Project Scope is required";
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const propertyTabFields = ["serviceInterest", "propertyType", "homeType", "city", "startTimeline", "budgetComfort", "projectScope"];
      if (propertyTabFields.some((k) => validationErrors[k])) setActiveTab("property");
      else setActiveTab("basic");
      return;
    }
    setIsSubmitting(true);
    try {
      // Build sourceDetails object from sub-fields
      const sourceDetails: Record<string, string> | null =
        srcCampaign || srcMedium
          ? { ...(srcCampaign && { campaign: srcCampaign }), ...(srcMedium && { medium: srcMedium }) }
          : null;
      // Build explicit payload — convert empty strings to null so Prisma doesn't receive unexpected values
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        source: formData.source || "WEBSITE",
        status: formData.status || "NEW",
        householdOrCompany: formData.householdOrCompany || "HOUSEHOLD",
        companyName: formData.companyName?.trim() || null,
        score: formData.score ?? 0,
        sourceDetails,
        serviceInterest: formData.serviceInterest || null,
        propertyType: formData.propertyType || null,
        homeType: formData.homeType || null,
        projectType: formData.projectType || null,
        area: formData.area !== null && formData.area !== undefined && String(formData.area) !== ""
          ? Number(formData.area)
          : null,
        city: formData.city?.trim() || null,
        location: formData.location?.trim() || null,
        message: formData.message?.trim() || null,
        requirements: formData.requirements?.trim() || null,
        projectStage: formData.projectStage || null,
        startTimeline: formData.startTimeline || null,
        budgetComfort: formData.budgetComfort || null,
        projectScope: formData.projectScope || null,
        floorPlanUrl: formData.floorPlanUrl?.trim() || null,
        wantsExperienceCenterVisit: formData.wantsExperienceCenterVisit || false,
        canWhatsApp: formData.canWhatsApp || false,
        assignedToId: formData.assignedToId?.trim() || null,
        referrerName: formData.referrerName?.trim() || null,
        referrerPhone: formData.referrerPhone?.trim() || null,
        referrerProjectNumber: formData.referrerProjectNumber?.trim() || null,
        agentAgencyName: formData.agentAgencyName?.trim() || null,
        agentAgencyDetails: formData.agentAgencyDetails?.trim() || null,
      };
      await onSave(payload as unknown as Omit<Lead, "id">);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save lead";
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
      err ? "border-red-300 bg-red-50 hover:border-red-400" : "border-gray-200 hover:border-gray-300"
    }`;

  const tabs: { key: "basic" | "property" | "referral"; label: string }[] = [
    { key: "basic", label: "Basic Info" },
    { key: "property", label: "Property & Project" },
    { key: "referral", label: "Referral & Agent" },
  ];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
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
                {lead ? "Update all lead information" : "Fill in the lead details"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
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
                {/* Name */}
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

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => f("email", e.target.value)}
                    placeholder="rahul@example.com"
                    className={inputClass(errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => f("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputClass(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) => f("companyName", e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className={inputClass()}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lead Type</label>
                  <select
                    value={formData.householdOrCompany || "HOUSEHOLD"}
                    onChange={(e) => f("householdOrCompany", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="HOUSEHOLD">Household</option>
                    <option value="COMPANY">Company</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lead Source</label>
                  <select
                    value={formData.source || "WEBSITE"}
                    onChange={(e) => f("source", e.target.value)}
                    className={selectClass()}
                  >
                    {availableSources.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status || "NEW"}
                    onChange={(e) => f("status", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="NEW">New</option>
                    <option value="WORKING">Working</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="DISQUALIFIED">Disqualified</option>
                    <option value="CONVERTED">Converted</option>
                  </select>
                </div>

                {/* Source Campaign */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Source Campaign</label>
                  <input
                    type="text"
                    value={srcCampaign}
                    onChange={(e) => setSrcCampaign(e.target.value)}
                    placeholder="e.g., google_ads"
                    className={inputClass()}
                  />
                </div>

                {/* Source Medium */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Source Medium</label>
                  <input
                    type="text"
                    value={srcMedium}
                    onChange={(e) => setSrcMedium(e.target.value)}
                    placeholder="e.g., cpc"
                    className={inputClass()}
                  />
                </div>

                {/* Score */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lead Score <span className="text-gray-400 font-normal">(0–100)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.score ?? 0}
                    onChange={(e) => f("score", parseInt(e.target.value) || 0)}
                    className={inputClass()}
                  />
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assigned To</label>
                  <select
                    value={formData.assignedToId || ""}
                    onChange={(e) => f("assignedToId", e.target.value || null)}
                    className={selectClass()}
                  >
                    <option value="">— Unassigned —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle row */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canWhatsApp || false}
                    onChange={(e) => f("canWhatsApp", e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Can WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.wantsExperienceCenterVisit || false}
                    onChange={(e) => f("wantsExperienceCenterVisit", e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Wants Experience Center Visit</span>
                </label>
              </div>
            </div>
          )}

          {/* ── Tab 2: Property & Project ── */}
          {activeTab === "property" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">

                {/* Service Interest */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Interest <span className="text-red-500">*</span></label>
                  <select
                    value={formData.serviceInterest || ""}
                    onChange={(e) => f("serviceInterest", e.target.value)}
                    className={selectClass(errors.serviceInterest)}
                  >
                    <option value="">Select...</option>
                    <option value="INTERIOR_DESIGN">Interior Design</option>
                    <option value="RENOVATION_REMODELING">Renovation & Remodeling</option>
                    <option value="CONSULTATION_ADVISORY">Consultation & Advisory</option>
                    <option value="CUSTOM_FURNITURE">Custom Furniture</option>
                    <option value="FULL_HOME_CONSTRUCTION">Full Home Construction</option>
                    <option value="MODULAR_KITCHEN">Modular Kitchen</option>
                    <option value="BATHROOM_RENOVATION">Bathroom Renovation</option>
                    <option value="LANDSCAPE_DESIGN">Landscape Design</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.serviceInterest && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.serviceInterest}
                    </p>
                  )}
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.propertyType || ""}
                    onChange={(e) => f("propertyType", e.target.value)}
                    className={selectClass(errors.propertyType)}
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
                  {errors.propertyType && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.propertyType}
                    </p>
                  )}
                </div>

                {/* Home Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Home Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.homeType || ""}
                    onChange={(e) => f("homeType", e.target.value)}
                    className={selectClass(errors.homeType)}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="ONE_BHK">1 BHK</option>
                    <option value="TWO_BHK">2 BHK</option>
                    <option value="THREE_BHK">3 BHK</option>
                    <option value="FOUR_BHK">4 BHK</option>
                    <option value="VILLA_ROW_HOUSE">Villa / Row House</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="TRIPLEX">Triplex</option>
                    <option value="PENTHOUSE">Penthouse</option>
                    <option value="OTHERS">Others</option>
                  </select>
                  {errors.homeType && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.homeType}
                    </p>
                  )}
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Type</label>
                  <select
                    value={formData.projectType || ""}
                    onChange={(e) => f("projectType", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select...</option>
                    <option value="HOME">Home</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="MIXED_USE">Mixed Use</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>

                {/* Property Project Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property Project Type</label>
                  <select
                    value={formData.propertyProjectType || ""}
                    onChange={(e) => f("propertyProjectType", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select...</option>
                    <option value="HIGHRISE">Highrise</option>
                    <option value="LOWRISE">Lowrise</option>
                    <option value="GATED_COMMUNITY">Gated Community</option>
                    <option value="VILLA">Villa</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="PLOTTED">Plotted</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Area (sqft)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.area ?? ""}
                    onChange={(e) => f("area", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="e.g., 1500"
                    className={inputClass()}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => f("city", e.target.value)}
                    placeholder="e.g., Bangalore"
                    className={inputClass(errors.city)}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.city}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / Address</label>
                  <input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) => f("location", e.target.value)}
                    placeholder="e.g., Whitefield, Bangalore"
                    className={inputClass()}
                  />
                </div>

                {/* Project Stage */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Stage</label>
                  <select
                    value={formData.projectStage || ""}
                    onChange={(e) => f("projectStage", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="NEW_HOME_PENDING">New Home (Pending Possession)</option>
                    <option value="NEW_HOME_RECEIVED">New Home (Received)</option>
                    <option value="RENOVATION">Renovation</option>
                    <option value="COMMERCIAL_FITOUT">Commercial Fitout</option>
                  </select>
                </div>

                {/* Start Timeline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Timeline <span className="text-red-500">*</span></label>
                  <select
                    value={formData.startTimeline || ""}
                    onChange={(e) => f("startTimeline", e.target.value)}
                    className={selectClass(errors.startTimeline)}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="IMMEDIATELY">Immediately</option>
                    <option value="ONE_TO_THREE_MONTHS">1–3 Months</option>
                    <option value="THREE_TO_SIX_MONTHS">3–6 Months</option>
                    <option value="SIX_PLUS_MONTHS">6+ Months</option>
                  </select>
                  {errors.startTimeline && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.startTimeline}
                    </p>
                  )}
                </div>

                {/* Budget Comfort */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget Comfort <span className="text-red-500">*</span></label>
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

                {/* Project Scope */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Scope <span className="text-red-500">*</span></label>
                  <select
                    value={formData.projectScope || ""}
                    onChange={(e) => f("projectScope", e.target.value)}
                    className={selectClass(errors.projectScope)}
                  >
                    <option value="">Select...</option>
                    <option value="NOT_SURE">Not Sure</option>
                    <option value="TURNKEY">Turnkey</option>
                    <option value="DESIGN_ONLY">Design Only</option>
                    <option value="KITCHEN_WARDROBES">Kitchen &amp; Wardrobes</option>
                    <option value="INTERIOR_DESIGN_ONLY">Interior Design Only</option>
                    <option value="INTERIOR_DESIGN_AND_BUILD">Interior Design and Build</option>
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

                {/* Floor Plan Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Floor Plan</label>
                  <div
                    onClick={() => floorPlanInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 shrink-0">
                      <Layers className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {floorPlanFile ? (
                        <p className="text-sm font-medium text-gray-800 truncate">{floorPlanFile.name}</p>
                      ) : (
                        <p className="text-sm text-gray-400">Click to upload floor plan (PDF, PNG, JPG)</p>
                      )}
                    </div>
                    {floorPlanFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFloorPlanFile(null); f("floorPlanUrl", ""); }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={floorPlanInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFloorPlanFile(file);
                      if (file) f("floorPlanUrl", file.name);
                    }}
                  />
                </div>

                {/* Message */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    rows={2}
                    value={formData.message || ""}
                    onChange={(e) => f("message", e.target.value)}
                    placeholder="e.g., Looking for modern interiors"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-300 transition-all resize-none"
                  />
                </div>

                {/* Requirements */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Requirements</label>
                  <textarea
                    rows={2}
                    value={formData.requirements || ""}
                    onChange={(e) => f("requirements", e.target.value)}
                    placeholder="e.g., 3BHK full interior design"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-300 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Referral & Agent ── */}
          {activeTab === "referral" && (
            <div className="space-y-4">
              {/* Referrer section */}
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <h4 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Referrer Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referrer Name</label>
                    <input
                      type="text"
                      value={formData.referrerName || ""}
                      onChange={(e) => f("referrerName", e.target.value)}
                      placeholder="e.g., Referrer Name"
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referrer Phone</label>
                    <input
                      type="tel"
                      value={formData.referrerPhone || ""}
                      onChange={(e) => f("referrerPhone", e.target.value)}
                      placeholder="+91 98765 43211"
                      className={inputClass()}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referrer Project Number</label>
                    <input
                      type="text"
                      value={formData.referrerProjectNumber || ""}
                      onChange={(e) => f("referrerProjectNumber", e.target.value)}
                      placeholder="e.g., GHS-24-0001"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              {/* Agent / Agency section */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Agent / Agency Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Agency Name</label>
                    <input
                      type="text"
                      value={formData.agentAgencyName || ""}
                      onChange={(e) => f("agentAgencyName", e.target.value)}
                      placeholder="e.g., Agency Name"
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Agency Details</label>
                    <textarea
                      rows={3}
                      value={formData.agentAgencyDetails || ""}
                      onChange={(e) => f("agentAgencyDetails", e.target.value)}
                      placeholder="Agency details here"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 hover:border-gray-300 transition-all resize-none"
                    />
                  </div>
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
                  <Check className="w-4 h-4" />
                  {lead ? "Update Lead" : "Create Lead"}
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
    useState<string>("HOUSEHOLD");
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
  } | null>(null);
  const bdrButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
          : response?.users || [];
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
    const handleClickOutside = (e: MouseEvent) => {
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
          value: "HOUSEHOLD",
          label: "Household",
          description: "Individual or family residential customer",
        },
        {
          value: "COMPANY",
          label: "Company",
          description: "Business or commercial customer",
        },
      ]);
      setConvertAccountType("HOUSEHOLD");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, sourcesData, statusesData] = await Promise.all([
        LeadAPI.listLeads(),
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
      const newLead = await LeadAPI.createLead(leadData);

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
      const updatedLead = await LeadAPI.updateLead(leadToEdit.id, leadData);
      setLeads(leads.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
      setShowEditModal(false);
      setLeadToEdit(null);
      if (selectedLead?.id === updatedLead.id) {
        setSelectedLead(updatedLead);
      }
      toast.success("Lead updated successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update lead";
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
      toast.error(
        `This lead has already been converted to a customer.`,
      );
      setShowConvertModal(false);
      return;
    }

    // Validate customer type
    if (
      !convertAccountType ||
      !["HOUSEHOLD", "COMPANY"].includes(convertAccountType)
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
        setUnassignedHasMore(newLeads.length === limit);
      } catch (error) {
        console.error("Error fetching unassigned leads:", error);
        toast.error("Failed to load unassigned leads");
        if (!loadMore) setUnassignedLeads([]);
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
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      setBdrDropdownPos({
        top: rect.bottom + scrollY + 4,
        left: rect.left + scrollX,
      });
    }
    setBdrDropdownOpen((prev) => (prev === leadId ? null : leadId));
  };

  // Close dropdowns on scroll to prevent detachment issues
  useEffect(() => {
    const handleScroll = () => {
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

  const filteredLeads = nonConvertedLeads.filter((lead) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (lead.name?.toLowerCase() || "").includes(searchLower) ||
      (lead.email?.toLowerCase() || "").includes(searchLower) ||
      (lead.phone?.toLowerCase() || "").includes(searchLower);
    const matchesStage =
      selectedStage === "all" ||
      selectedStage === "__unassigned__" ||
      lead.status === selectedStage;
    return matchesSearch && matchesStage;
  });

  // Determine which leads to display
  const displayLeads =
    selectedStage === "__unassigned__" ? unassignedLeads : filteredLeads;

  // Calculate lead counts by status (excluding CONVERTED — they live in Customers)
  const leadCounts = Array.isArray(statuses)
    ? statuses.reduce(
        (acc, status) => {
          acc[status.value] = nonConvertedLeads.filter(
            (l) => l.status === status.value,
          ).length;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

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
          Unassigned
          {unassignedLeads.length > 0
            ? ` (${unassignedLeads.length}${unassignedHasMore ? "+" : ""})`
            : ""}
        </button>
      </div>

      {/* Loading for unassigned tab */}
      {selectedStage === "__unassigned__" && unassignedLoading && (
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
          <div
            key={lead.id}
            className={`group bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 cursor-pointer overflow-hidden relative ${
              lead.id && selectedLeadIds.has(lead.id)
                ? "border-orange-400 ring-2 ring-orange-200"
                : "border-gray-100"
            }`}
            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
          >
            {/* Checkbox */}
            <div
              className={`absolute top-3 left-3 z-10 transition-opacity ${
                selectedLeadIds.size > 0
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (lead.id) toggleLeadSelection(lead.id);
              }}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                  lead.id && selectedLeadIds.has(lead.id)
                    ? "bg-orange-500 border-orange-500"
                    : "border-gray-300 bg-white hover:border-orange-400"
                }`}
              >
                {lead.id && selectedLeadIds.has(lead.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            {/* Accent Line */}
            <div
              className={`h-1 w-full ${
                lead.priority === "high"
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : lead.priority === "medium"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                    : "bg-gradient-to-r from-orange-400 to-orange-500"
              }`}
            ></div>

            {/* Card Content */}
            <div className="p-5">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-orange-200/50">
                      {(lead.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    {/* Online Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  {/* Name & Status */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base group-hover:text-orange-600 transition-colors">
                      {lead.name || "Unknown Lead"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          lead.status === "Qualified"
                            ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                            : lead.status === "Contacted"
                              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                              : lead.status === "Proposal"
                                ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                                : lead.status === "Negotiation"
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                  : lead.status === "Won"
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                    : lead.status === "Lost"
                                      ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                      : "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                        }`}
                      >
                        {lead.status || "New"}
                      </span>
                      {lead.priority === "high" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                          Hot Lead
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLeadToEdit(lead);
                    setShowEditModal(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Contact Info Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Phone */}
                <div className="bg-gray-50 rounded-xl p-3 group/item hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <span className="text-xs text-gray-500">Phone</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.phone || "Not provided"}
                  </p>
                </div>
                {/* Email */}
                <div className="bg-gray-50 rounded-xl p-3 group/item hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-500">Email</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Property & Budget Info */}
              {(lead.propertyType ||
                lead.budget ||
                lead.budgetRange ||
                lead.location) && (
                <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 rounded-xl p-3.5 mb-4 border border-orange-100/50">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-900/80 uppercase tracking-wide">
                      Project Interest
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {lead.propertyType && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Property</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.propertyType}
                          {lead.bhkConfig && ` • ${lead.bhkConfig}`}
                        </p>
                      </div>
                    )}
                    {(lead.budget || lead.budgetRange) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.budgetRange || lead.budget}
                        </p>
                      </div>
                    )}
                    {lead.location && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-0.5">Location</p>
                        <p className="text-sm font-medium text-gray-700">
                          {lead.location}
                          {lead.city && `, ${lead.city}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Score */}
              {lead.score !== undefined && lead.score > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        Lead Score
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        lead.score >= 70
                          ? "text-green-600"
                          : lead.score >= 40
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {lead.score}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lead.score >= 70
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : lead.score >= 40
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                            : "bg-gradient-to-r from-red-400 to-orange-400"
                      }`}
                      style={{ width: `${lead.score}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Source Badge */}
                  {lead.source && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">
                        {getSourceLabel(lead.source)}
                      </span>
                    </div>
                  )}
                  {/* Assign BDR Button */}
                  <button
                    ref={(el) => {
                      if (lead.id) bdrButtonRefs.current[lead.id] = el;
                    }}
                    onClick={(e) => {
                      if (lead.id) openBdrDropdown(lead.id, e);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      lead.assignedTo
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200"
                        : "bg-orange-50 text-orange-700 hover:bg-orange-100 ring-1 ring-orange-200"
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    {lead.assignedTo ? lead.assignedTo.name : "Assign BDR"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                {/* Date & Arrow */}
                <div className="flex items-center gap-2">
                  {lead.createdAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-orange-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More for Unassigned */}
      {selectedStage === "__unassigned__" &&
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
                  <Badge
                    className={`rounded-lg ${stageColors[selectedLead.status || "New"]}`}
                  >
                    {selectedLead.status || "New"}
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
                {(selectedLead.propertyType ||
                  selectedLead.location ||
                  selectedLead.budget) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Property Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedLead.propertyType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">
                            {selectedLead.propertyType}
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
                      {selectedLead.budget && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {selectedLead.budget}
                          </span>
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
          <div
            className="absolute z-[70] bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-56 max-h-64 overflow-y-auto"
            style={{ top: bdrDropdownPos.top, left: bdrDropdownPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Assign BDR
              </p>
            </div>
            {/* Unassign option */}
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAssigning}
              onClick={(e) => {
                e.stopPropagation();
                handleAssignBDR(bdrDropdownOpen, null);
              }}
            >
              {isAssigning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}
              <span>Unassigned</span>
            </button>
            <div className="border-t border-gray-100" />
            {bdrUsers.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAssigning}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignBDR(bdrDropdownOpen, user.id);
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
                  setConvertAccountType(accountTypes[0]?.value || "HOUSEHOLD");
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
