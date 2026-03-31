import { useEffect, useState, useCallback } from "react";
import {
  Users,
  RefreshCw,
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
  Check,
  Upload,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { Spinner } from "../../components/ui";
import {
  getBDRLeads,
  createBDRLead,
  updateBDRLead,
  BDRLead,
  CreateBDRLeadPayload,
} from "../../services/bdrApi";
import { useAuthStore } from "../../stores/authStore";
import { uploadFloorPlan } from "../../services/leadApi";

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-indigo-100 text-indigo-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL: "bg-yellow-100 text-yellow-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  default: "bg-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

function getInitials(name?: string) {
  if (!name) return "L";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const SOURCE_OPTIONS = [
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

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "WORKING", label: "Working" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "DISQUALIFIED", label: "Disqualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED", label: "Converted" },
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  secondaryEmails: [""],
  secondaryPhones: [""],
  companyName: "",
  source: "WEBSITE",
  status: "NEW",
  score: "",
  city: "",
  area: "",
  propertyType: "",
  projectType: "",
  projectStage: "",
  startTimeline: "",
  budgetComfort: "",
  projectScope: "",
  requirements: "",
  message: "",
  canWhatsApp: true,
};

export function BDRLeads() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<BDRLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  // Create lead modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState<BDRLead | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<"basic" | "property">("basic");
  const [pendingFloorPlanFile, setPendingFloorPlanFile] = useState<File | null>(
    null,
  );

  const loadLeads = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBDRLeads(LIMIT, offset);
      setLeads(res.leads);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads(0);
  }, [loadLeads]);

  const handleRefresh = () => {
    setPage(0);
    loadLeads(0);
  };

  const closeLeadModal = () => {
    setShowCreateModal(false);
    setEditingLead(null);
    setCreateError(null);
    setPendingFloorPlanFile(null);
    setActiveTab("basic");
  };

  const openEditModal = (lead: BDRLead) => {
    const secondaryEmails = Array.isArray(lead.secondaryEmails)
      ? (lead.secondaryEmails as string[]).filter(Boolean)
      : [];
    const secondaryPhones = Array.isArray(lead.secondaryPhones)
      ? (lead.secondaryPhones as string[]).filter(Boolean)
      : [];

    setEditingLead(lead);
    setCreateError(null);
    setPendingFloorPlanFile(null);
    setActiveTab("basic");
    setForm({
      ...EMPTY_FORM,
      name: String(lead.name || ""),
      phone: String(lead.phone || ""),
      email: String(lead.email || ""),
      secondaryEmails: secondaryEmails.length > 0 ? secondaryEmails : [""],
      secondaryPhones: secondaryPhones.length > 0 ? secondaryPhones : [""],
      companyName: String(lead.companyName || ""),
      source: String(lead.source || "WEBSITE"),
      status: String(lead.status || "NEW"),
      score:
        lead.score !== null && lead.score !== undefined ? String(lead.score) : "",
      city: String(lead.city || ""),
      area:
        lead.area !== null && lead.area !== undefined ? String(lead.area) : "",
      propertyType: String(lead.propertyType || ""),
      projectType: String(lead.projectType || ""),
      projectStage: String(lead.projectStage || ""),
      startTimeline: String(lead.startTimeline || ""),
      budgetComfort: String(lead.budgetComfort || ""),
      projectScope: String(lead.projectScope || ""),
      requirements: String(
        lead.requirements || lead.specialRequirements || "",
      ),
      message: String(lead.message || ""),
      canWhatsApp:
        typeof lead.canWhatsApp === "boolean" ? lead.canWhatsApp : true,
    });
    setShowCreateModal(true);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const isEditing = Boolean(editingLead?.id);

    if (!isEditing && activeTab === "basic") {
      if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
        setCreateError("Name, phone, and email are required.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
        setCreateError("Please enter a valid email address.");
        return;
      }
      setCreateError(null);
      setActiveTab("property");
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.propertyType ||
      !form.projectType ||
      !form.city.trim() ||
      !form.startTimeline ||
      !form.budgetComfort ||
      !form.projectScope
    ) {
      setCreateError(
        "Please fill all required fields from both tabs before creating the lead.",
      );
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const secondaryEmails = form.secondaryEmails
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      const secondaryPhones = form.secondaryPhones
        .map((value) => value.trim())
        .filter(Boolean);

      const payload: CreateBDRLeadPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        secondaryEmails,
        secondaryPhones,
        assignedToId: user.id,
        source: form.source || "WEBSITE",
        status: form.status || "NEW",
        ...(form.score !== "" && { score: Number(form.score) }),
        ...(form.companyName.trim() && { companyName: form.companyName.trim() }),
        ...(form.city.trim() && { city: form.city.trim() }),
        ...(form.area !== "" && { area: Number(form.area) }),
        ...(form.propertyType && { propertyType: form.propertyType }),
        ...(form.projectType && { projectType: form.projectType }),
        ...(form.projectStage && { projectStage: form.projectStage }),
        ...(form.startTimeline && { startTimeline: form.startTimeline }),
        ...(form.budgetComfort && { budgetComfort: form.budgetComfort }),
        ...(form.projectScope && { projectScope: form.projectScope }),
        ...(form.requirements.trim() && {
          requirements: form.requirements.trim(),
          specialRequirements: form.requirements.trim(),
        }),
        ...(form.message.trim() && { message: form.message.trim() }),
        canWhatsApp: form.canWhatsApp,
      };

      const savedLead = isEditing
        ? await updateBDRLead(editingLead!.id, payload)
        : await createBDRLead(payload);

      const targetLeadId = savedLead.id || editingLead?.id;
      if (pendingFloorPlanFile && targetLeadId) {
        try {
          await uploadFloorPlan(pendingFloorPlanFile, targetLeadId);
        } catch (uploadError) {
          console.error("Floor plan upload failed:", uploadError);
        }
      }

      setShowCreateModal(false);
      setEditingLead(null);
      setForm(EMPTY_FORM);
      setPendingFloorPlanFile(null);
      setActiveTab("basic");
      handleRefresh();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create lead",
      );
    } finally {
      setCreating(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.phone?.includes(q) ||
      lead.city?.toLowerCase().includes(q) ||
      lead.status?.toLowerCase().includes(q)
    );
  });

  const stageLabel = (stage?: string) => {
    if (!stage) return "New";
    return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="My Leads" showNotifications />

      <div className="p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assigned Leads</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading
                ? "Loading..."
                : `${total} lead${total !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <Spinner size="lg" color="brand" className="mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading leads…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Couldn't load leads
            </p>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">
              {search ? "No matching leads" : "No leads assigned"}
            </p>
            <p className="text-sm text-gray-500">
              {search
                ? "Try a different search term"
                : "Leads assigned to you will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => openEditModal(lead)}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(lead.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {lead.name || "Unknown Lead"}
                        </p>
                        {lead.propertyType && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {lead.propertyType}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {lead.stage && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[lead.stage.toUpperCase()] || STAGE_COLORS.default}`}
                          >
                            {stageLabel(lead.stage)}
                          </span>
                        )}
                        {lead.priority && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[lead.priority.toLowerCase()] || "bg-gray-100 text-gray-700"}`}
                          >
                            {lead.priority.charAt(0).toUpperCase() +
                              lead.priority.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 text-xs text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-xs text-orange-600 truncate max-w-[140px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </a>
                      )}
                      {lead.city && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {lead.city}
                        </span>
                      )}
                    </div>

                    {/* Budget / source row */}
                    <div className="flex items-center gap-3 mt-1.5">
                      {(lead.budget || lead.budgetRange) && (
                        <span className="text-xs text-gray-500">
                          Budget:{" "}
                          <span className="font-medium text-gray-700">
                            {lead.budgetRange || lead.budget}
                          </span>
                        </span>
                      )}
                      {lead.source && (
                        <span className="text-xs text-gray-400 capitalize">
                          {lead.source.replace(/_/g, " ").toLowerCase()}
                        </span>
                      )}
                    </div>

                    {lead.notes && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                        {lead.notes}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={page === 0 || loading}
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    loadLeads(newPage * LIMIT);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 disabled:opacity-40 shadow-sm"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {page + 1} of {Math.ceil(total / LIMIT)}
                </span>
                <button
                  disabled={(page + 1) * LIMIT >= total || loading}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    loadLeads(newPage * LIMIT);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 disabled:opacity-40 shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB – Create New Lead */}
      <button
        onClick={() => {
          setEditingLead(null);
          setCreateError(null);
          setForm(EMPTY_FORM);
          setPendingFloorPlanFile(null);
          setActiveTab("basic");
          setShowCreateModal(true);
        }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all z-30"
        aria-label="Create new lead"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Modal header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0">
            <button
              onClick={closeLeadModal}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900">
              {editingLead ? "Edit Lead" : "New Lead"}
            </h2>
            <button
              form="create-lead-form"
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-all"
            >
              {creating
                ? "Saving..."
                : !editingLead && activeTab === "basic"
                  ? "Next"
                  : "Save"}
            </button>
          </div>

          <div className="px-4 border-b border-gray-100 bg-white">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`py-3 text-sm font-semibold border-b-2 ${
                  activeTab === "basic"
                    ? "text-orange-600 border-orange-500"
                    : "text-gray-500 border-transparent"
                }`}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("property")}
                className={`py-3 text-sm font-semibold border-b-2 ${
                  activeTab === "property"
                    ? "text-orange-600 border-orange-500"
                    : "text-gray-500 border-transparent"
                }`}
              >
                Property &amp; Project
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            id="create-lead-form"
            onSubmit={handleCreateLead}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {createError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                {createError}
              </div>
            )}

            {activeTab === "basic" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Secondary Emails
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-orange-600"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          secondaryEmails: [...f.secondaryEmails, ""],
                        }))
                      }
                    >
                      + Add email
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.secondaryEmails.map((value, index) => (
                      <div key={`secondary-email-${index}`} className="flex gap-2">
                        <input
                          type="email"
                          value={value}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              secondaryEmails: f.secondaryEmails.map((item, i) =>
                                i === index ? e.target.value : item,
                              ),
                            }))
                          }
                          placeholder="secondary@example.com"
                          className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              secondaryEmails:
                                f.secondaryEmails.length > 1
                                  ? f.secondaryEmails.filter((_, i) => i !== index)
                                  : [""],
                            }))
                          }
                          className="px-2 text-gray-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Secondary Phones
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-orange-600"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          secondaryPhones: [...f.secondaryPhones, ""],
                        }))
                      }
                    >
                      + Add phone
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.secondaryPhones.map((value, index) => (
                      <div key={`secondary-phone-${index}`} className="flex gap-2">
                        <input
                          type="tel"
                          value={value}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              secondaryPhones: f.secondaryPhones.map((item, i) =>
                                i === index ? e.target.value : item,
                              ),
                            }))
                          }
                          placeholder="+91 98765 43210"
                          className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              secondaryPhones:
                                f.secondaryPhones.length > 1
                                  ? f.secondaryPhones.filter((_, i) => i !== index)
                                  : [""],
                            }))
                          }
                          className="px-2 text-gray-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Acme Corp"
                      value={form.companyName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, companyName: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Lead Source
                    </label>
                    <select
                      value={form.source}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, source: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Lead Score
                    </label>
                    <select
                      value={form.score}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, score: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      <option value="">Select...</option>
                      {Array.from({ length: 100 }, (_, index) => index + 1).map(
                        (score) => (
                          <option key={score} value={String(score)}>
                            {score}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "property" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.propertyType}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, propertyType: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="RESIDENTIAL">Residential</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="MIXED_USE">Mixed Use</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.projectType}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, projectType: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
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
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Area
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g., 1500"
                      value={form.area}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, area: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Stage
                    </label>
                    <select
                      value={form.projectStage}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, projectStage: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Start Timeline <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.startTimeline}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, startTimeline: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="NOT_SURE">Not Sure</option>
                      <option value="IMMEDIATELY">Immediately</option>
                      <option value="ONE_TO_THREE_MONTHS">1-3 Months</option>
                      <option value="THREE_TO_SIX_MONTHS">3-6 Months</option>
                      <option value="SIX_PLUS_MONTHS">6+ Months</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Budget Comfort <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.budgetComfort}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, budgetComfort: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="NOT_SURE">Not Sure</option>
                      <option value="VALUE">Value</option>
                      <option value="BALANCED">Balanced</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="NEED_GUIDANCE">Need Guidance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Scope <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.projectScope}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, projectScope: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="NOT_SURE">Not Sure</option>
                      <option value="TURNKEY">Turnkey</option>
                      <option value="KITCHEN_WARDROBES">Kitchen &amp; Wardrobes</option>
                      <option value="INTERIOR_DESIGN_ONLY">Interior Design Only</option>
                      <option value="INTERIOR_DESIGN_AND_BUILD">Interior Design &amp; Build</option>
                      <option value="ARCHITECTURE_DESIGN_ONLY">Architecture Design Only</option>
                      <option value="RENOVATION">Renovation</option>
                      <option value="SPECIFIC_SPACE">Specific Space</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Floor Plan
                  </label>
                  <label className="w-full flex flex-col items-center justify-center gap-2 px-3 py-5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 cursor-pointer">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span>
                      {pendingFloorPlanFile
                        ? pendingFloorPlanFile.name
                        : "Click to upload floor plan (PDF/Image)"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setPendingFloorPlanFile(file);
                      }}
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Supported formats: PDF, PNG, JPG (Max 10MB)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Message / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Looking for modern interiors"
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Requirements
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Vastu compliant, design preferences"
                    value={form.requirements}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, requirements: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  />
                </div>
              </>
            )}

            {/* Assigned to (read-only info) */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
              <p className="text-xs text-orange-700">
                <span className="font-semibold">Assigned to:</span>{" "}
                {user?.name || "You"} (self-assigned)
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeTab === "basic" ? "bg-orange-500" : "bg-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("property")}
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeTab === "property" ? "bg-orange-500" : "bg-gray-300"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {creating ? (
                  "Saving..."
                ) : !editingLead && activeTab === "basic" ? (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Next
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingLead ? "Update Lead" : "Create Lead"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
