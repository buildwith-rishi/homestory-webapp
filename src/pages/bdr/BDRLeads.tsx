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
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { Spinner } from "../../components/ui";
import {
  getBDRLeads,
  createBDRLead,
  BDRLead,
  CreateBDRLeadPayload,
} from "../../services/bdrApi";
import { useAuthStore } from "../../stores/authStore";

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
  { value: "REFERRAL", label: "Referral" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "WEBSITE", label: "Website" },
  { value: "HOARDING", label: "Hoarding" },
  { value: "NEWSPAPER", label: "Newspaper" },
  { value: "COLD_CALL", label: "Cold Call" },
  { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  source: "",
  city: "",
  requirements: "",
  message: "",
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
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.name.trim() || !form.phone.trim()) {
      setCreateError("Name and phone are required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const payload: CreateBDRLeadPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        assignedToId: user.id,
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.source && { source: form.source }),
        ...(form.city.trim() && { city: form.city.trim() }),
        ...(form.requirements.trim() && {
          requirements: form.requirements.trim(),
        }),
        ...(form.message.trim() && { message: form.message.trim() }),
        canWhatsApp: form.canWhatsApp,
      };
      await createBDRLead(payload);
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
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
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:scale-[0.98] transition-all"
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
          setCreateError(null);
          setForm(EMPTY_FORM);
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
              onClick={() => setShowCreateModal(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900">New Lead</h2>
            <button
              form="create-lead-form"
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-all"
            >
              {creating ? "Saving…" : "Save"}
            </button>
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

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="e.g. priya@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Source
              </label>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((f) => ({ ...f, source: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
              >
                <option value="">Select source…</option>
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 3BHK interior, budget ₹15L"
                value={form.requirements}
                onChange={(e) =>
                  setForm((f) => ({ ...f, requirements: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>

            {/* Message / Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any additional notes…"
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>

            {/* Assigned to (read-only info) */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
              <p className="text-xs text-orange-700">
                <span className="font-semibold">Assigned to:</span>{" "}
                {user?.name || "You"} (self-assigned)
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
