import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  Plus,
  X,
  Search,
  Loader,
  MessageSquare,
  CheckCircle2,
  Clock,
  Upload,
  Trash2,
  Edit3,
  Eye,
  ShieldCheck,
  ShieldX,
  Send,
  MapPin,
  User,
  Camera,
  Video,
  Mic,
  Quote,
  ChevronDown,
  Globe,
  UserCheck,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../ui";
import toast from "react-hot-toast";
import {
  ProjectTestimonial,
  TestimonialStatus,
  CreateTestimonialRequest,
  UpdateTestimonialRequest,
} from "../../../types";
import {
  getProjectTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  uploadTestimonialMedia,
  updateTestimonialStatus,
  getTestimonialStatuses,
} from "../../../services/projectApi";
import { useAuth } from "../../../contexts/AuthContext";

// ==========================================
// Helpers
// ==========================================

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ElementType;
  }
> = {
  DRAFT: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
    icon: Edit3,
  },
  PENDING_APPROVAL: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    icon: Clock,
  },
  APPROVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: ShieldCheck,
  },
  PUBLISHED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: Globe,
  },
  REJECTED: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: ShieldX,
  },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

// ==========================================
// Main Component
// ==========================================

interface TestimonialsTabProps {
  projectId: string;
  projectName?: string;
  clientName?: string;
}

export const TestimonialsTab: React.FC<TestimonialsTabProps> = ({
  projectId,
}) => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<ProjectTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<ProjectTestimonial | null>(null);
  const [viewingTestimonial, setViewingTestimonial] =
    useState<ProjectTestimonial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // ==========================================
  // Data Fetching
  // ==========================================

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectTestimonials(projectId);
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    getTestimonialStatuses()
      .then((opts) =>
        setStatusOptions(
          opts.map((o: { value: string; label: string }) => ({
            value: o.value,
            label: o.label,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  // ==========================================
  // Filtered data
  // ==========================================

  const filteredTestimonials = testimonials.filter((t) => {
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.testimonialText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerCity || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ==========================================
  // Stats
  // ==========================================

  const stats = {
    total: testimonials.length,
    approved: testimonials.filter(
      (t) =>
        t.status === TestimonialStatus.APPROVED ||
        t.status === TestimonialStatus.PUBLISHED,
    ).length,
    pending: testimonials.filter(
      (t) => t.status === TestimonialStatus.PENDING_APPROVAL,
    ).length,
    avgRating:
      testimonials.length > 0
        ? testimonials.reduce((sum, t) => sum + t.rating, 0) /
          testimonials.length
        : 0,
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleStatusChange = async (
    testimonialId: string,
    newStatus: string,
  ) => {
    try {
      const updated = await updateTestimonialStatus(
        projectId,
        testimonialId,
        newStatus,
      );
      setTestimonials((prev) =>
        prev.map((t) => (t.id === testimonialId ? updated : t)),
      );
      toast.success(
        `Status updated to ${STATUS_LABELS[newStatus] || newStatus}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTestimonial(projectId, deletingId);
      setTestimonials((prev) => prev.filter((t) => t.id !== deletingId));
      toast.success("Testimonial deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // Loading State
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Testimonials</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Capture and manage client feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTestimonials}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 font-medium">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.approved}
              </p>
              <p className="text-xs text-gray-500 font-medium">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
              <p className="text-xs text-gray-500 font-medium">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 font-medium">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, text, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                filterStatus === "ALL"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({testimonials.length})
            </button>
            {statusOptions.map((opt) => {
              const count = testimonials.filter(
                (t) => t.status === opt.value,
              ).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === opt.value
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Quote className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {testimonials.length === 0
              ? "No testimonials yet"
              : "No matching testimonials"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            {testimonials.length === 0
              ? "Start capturing client feedback for this project"
              : "Try adjusting your search or filter criteria"}
          </p>
          {testimonials.length === 0 && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Testimonial
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTestimonials.map((testimonial) => (
            <TestimonialRow
              key={testimonial.id}
              testimonial={testimonial}
              onView={() => setViewingTestimonial(testimonial)}
              onEdit={() => setEditingTestimonial(testimonial)}
              onDelete={() => setDeletingId(testimonial.id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* ==========================================
          Modals
          ========================================== */}

      {/* Add Modal */}
      {showAddModal && (
        <AddTestimonialModal
          projectId={projectId}
          designerId={user?.id || ""}
          onClose={() => setShowAddModal(false)}
          onCreated={(t) => {
            setTestimonials((prev) => [t, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingTestimonial && (
        <EditTestimonialModal
          projectId={projectId}
          testimonial={editingTestimonial}
          onClose={() => setEditingTestimonial(null)}
          onUpdated={(t) => {
            setTestimonials((prev) => prev.map((x) => (x.id === t.id ? t : x)));
            setEditingTestimonial(null);
          }}
        />
      )}

      {/* View Modal */}
      {viewingTestimonial && (
        <ViewTestimonialModal
          testimonial={viewingTestimonial}
          onClose={() => setViewingTestimonial(null)}
          onStatusChange={async (status) => {
            await handleStatusChange(viewingTestimonial.id, status);
            const updated = testimonials.find(
              (t) => t.id === viewingTestimonial.id,
            );
            if (updated)
              setViewingTestimonial({
                ...updated,
                status: status as TestimonialStatus,
              });
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete Testimonial?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action cannot be undone. The testimonial will be permanently
              removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Testimonial Row Component
// ==========================================

interface TestimonialRowProps {
  testimonial: ProjectTestimonial;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (id: string, status: string) => void;
}

const TestimonialRow: React.FC<TestimonialRowProps> = ({
  testimonial,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const sc = getStatusConfig(testimonial.status);
  const StatusIcon = sc.icon;
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const hasMedia =
    testimonial.videoUrl ||
    testimonial.audioUrl ||
    testimonial.photoUrls.length > 0;

  const hasVideo = !!testimonial.videoUrl;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all group">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-200">
            <span className="text-lg font-bold text-orange-600">
              {testimonial.customerName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-semibold text-gray-900 text-base">
                    {testimonial.customerName}
                  </h4>
                  {/* Rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= testimonial.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Status Badge */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${sc.bg} ${sc.text} ${sc.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {STATUS_LABELS[testimonial.status] || testimonial.status}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    {showStatusMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowStatusMenu(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[180px]">
                          {Object.entries(STATUS_LABELS).map(
                            ([value, label]) => {
                              const cfg = getStatusConfig(value);
                              const Icon = cfg.icon;
                              return (
                                <button
                                  key={value}
                                  onClick={() => {
                                    onStatusChange(testimonial.id, value);
                                    setShowStatusMenu(false);
                                  }}
                                  disabled={value === testimonial.status}
                                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                                    value === testimonial.status
                                      ? "opacity-40 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                                  {label}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {testimonial.customerCity && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.customerCity}
                    </span>
                  )}
                  {testimonial.customerDesignation && (
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      {testimonial.customerDesignation}
                      {testimonial.customerCompany &&
                        ` at ${testimonial.customerCompany}`}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(testimonial.capturedAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={onView}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Testimonial text */}
            <div className="mt-3 relative">
              <Quote className="w-4 h-4 text-orange-200 absolute -left-0.5 -top-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed pl-5 line-clamp-2">
                {testimonial.testimonialText}
              </p>
            </div>

            {/* Media & Permission badges */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {hasMedia && (
                <div className="flex items-center gap-1.5">
                  {testimonial.videoUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                  {testimonial.audioUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                      <Mic className="w-3 h-3" /> Audio
                    </span>
                  )}
                  {testimonial.photoUrls.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs font-medium">
                      <ImageIcon className="w-3 h-3" />{" "}
                      {testimonial.photoUrls.length} Photo
                      {testimonial.photoUrls.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
              {testimonial.canSharePublicly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
              {testimonial.canUseName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-medium">
                  <UserCheck className="w-3 h-3" /> Name OK
                </span>
              )}
              {testimonial.canUsePhoto && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                  <Camera className="w-3 h-3" /> Photo OK
                </span>
              )}
              {testimonial.capturedByDesigner && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">
                  <User className="w-3 h-3" /> by{" "}
                  {testimonial.capturedByDesigner.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Add Testimonial Modal
// ==========================================

interface AddTestimonialModalProps {
  projectId: string;
  designerId: string;
  onClose: () => void;
  onCreated: (t: ProjectTestimonial) => void;
}

const AddTestimonialModal: React.FC<AddTestimonialModalProps> = ({
  projectId,
  designerId,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState({
    customerName: "",
    testimonialText: "",
    rating: 5,
    customerDesignation: "",
    customerCompany: "",
    customerCity: "",
    canSharePublicly: true,
    canUseName: true,
    canUsePhoto: false,
    notes: "",
  });
  const [mediaFiles, setMediaFiles] = useState<
    { file: File; type: "PHOTO" | "VIDEO" | "AUDIO" }[]
  >([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }
    if (!form.testimonialText.trim()) {
      toast.error("Please enter testimonial text");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateTestimonialRequest = {
        capturedByDesignerId: designerId,
        rating: form.rating,
        testimonialText: form.testimonialText.trim(),
        customerName: form.customerName.trim(),
        canSharePublicly: form.canSharePublicly,
        canUseName: form.canUseName,
        canUsePhoto: form.canUsePhoto,
        ...(form.customerDesignation && {
          customerDesignation: form.customerDesignation.trim(),
        }),
        ...(form.customerCompany && {
          customerCompany: form.customerCompany.trim(),
        }),
        ...(form.customerCity && { customerCity: form.customerCity.trim() }),
        ...(form.notes && { notes: form.notes.trim() }),
      };

      let created = await createTestimonial(projectId, payload);

      // Upload media files if any
      for (const media of mediaFiles) {
        try {
          created = await uploadTestimonialMedia(
            projectId,
            created.id,
            media.file,
            media.type,
          );
        } catch (err) {
          console.error("Media upload failed:", err);
          toast.error(`Failed to upload ${media.file.name}`);
        }
      }

      toast.success("Testimonial created successfully");
      onCreated(created);
    } catch (err: any) {
      toast.error(err.message || "Failed to create testimonial");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: { file: File; type: "PHOTO" | "VIDEO" | "AUDIO" }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let type: "PHOTO" | "VIDEO" | "AUDIO" = "PHOTO";
      if (f.type.startsWith("video/")) type = "VIDEO";
      else if (f.type.startsWith("audio/")) type = "AUDIO";
      newFiles.push({ file: f, type });
    }
    setMediaFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Add Testimonial
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Capture client feedback
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              placeholder="Enter customer name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: s }))}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= form.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-600">
                {form.rating}/5
              </span>
            </div>
          </div>

          {/* Testimonial Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Testimonial <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={form.testimonialText}
              onChange={(e) =>
                setForm((f) => ({ ...f, testimonialText: e.target.value }))
              }
              rows={4}
              placeholder="Write what the client said..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
            />
          </div>

          {/* Customer Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                City
              </label>
              <input
                type="text"
                value={form.customerCity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerCity: e.target.value }))
                }
                placeholder="e.g. Bangalore"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={form.customerDesignation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customerDesignation: e.target.value,
                  }))
                }
                placeholder="e.g. CEO"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company
              </label>
              <input
                type="text"
                value={form.customerCompany}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerCompany: e.target.value }))
                }
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  {
                    key: "canSharePublicly" as const,
                    label: "Share Publicly",
                    desc: "Use on website & marketing",
                    icon: Globe,
                  },
                  {
                    key: "canUseName" as const,
                    label: "Use Name",
                    desc: "Display customer name",
                    icon: UserCheck,
                  },
                  {
                    key: "canUsePhoto" as const,
                    label: "Use Photo",
                    desc: "Display customer photo",
                    icon: Camera,
                  },
                ] as const
              ).map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    form[key]
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={`w-4 h-4 ${
                        form[key] ? "text-orange-600" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        form[key] ? "text-orange-900" : "text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Media (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {/* Video Upload */}
              <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-purple-300 bg-purple-50/30 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-purple-700">
                    Upload Video
                  </span>
                  <p className="text-xs text-purple-600 mt-0.5">
                    MP4, WebM, MOV
                  </p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleAddMedia}
                  className="hidden"
                />
              </label>
              {/* Photo Upload */}
              <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-teal-300 bg-teal-50/30 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Camera className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-teal-700">
                    Upload Photos
                  </span>
                  <p className="text-xs text-teal-600 mt-0.5">JPG, PNG, HEIC</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddMedia}
                  className="hidden"
                />
              </label>
              {/* Audio Upload */}
              <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-indigo-300 bg-indigo-50/30 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Mic className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-indigo-700">
                    Upload Audio
                  </span>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    MP3, WAV, M4A
                  </p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAddMedia}
                  className="hidden"
                />
              </label>
            </div>
            {mediaFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {mediaFiles.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {m.type === "PHOTO" && (
                        <ImageIcon className="w-4 h-4 text-teal-600" />
                      )}
                      {m.type === "VIDEO" && (
                        <Video className="w-4 h-4 text-purple-600" />
                      )}
                      {m.type === "AUDIO" && (
                        <Mic className="w-4 h-4 text-indigo-600" />
                      )}
                      <span className="truncate max-w-[200px]">
                        {m.file.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({(m.file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-rose-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Private notes about this testimonial..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Testimonial
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Edit Testimonial Modal
// ==========================================

interface EditTestimonialModalProps {
  projectId: string;
  testimonial: ProjectTestimonial;
  onClose: () => void;
  onUpdated: (t: ProjectTestimonial) => void;
}

const EditTestimonialModal: React.FC<EditTestimonialModalProps> = ({
  projectId,
  testimonial,
  onClose,
  onUpdated,
}) => {
  const [form, setForm] = useState({
    customerName: testimonial.customerName,
    testimonialText: testimonial.testimonialText,
    rating: testimonial.rating,
    customerDesignation: testimonial.customerDesignation || "",
    customerCompany: testimonial.customerCompany || "",
    customerCity: testimonial.customerCity || "",
    canSharePublicly: testimonial.canSharePublicly,
    canUseName: testimonial.canUseName,
    canUsePhoto: testimonial.canUsePhoto,
    notes: testimonial.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.testimonialText.trim()) {
      toast.error("Testimonial text is required");
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateTestimonialRequest = {
        customerName: form.customerName.trim(),
        testimonialText: form.testimonialText.trim(),
        rating: form.rating,
        canSharePublicly: form.canSharePublicly,
        canUseName: form.canUseName,
        canUsePhoto: form.canUsePhoto,
        ...(form.customerDesignation && {
          customerDesignation: form.customerDesignation.trim(),
        }),
        ...(form.customerCompany && {
          customerCompany: form.customerCompany.trim(),
        }),
        ...(form.customerCity && { customerCity: form.customerCity.trim() }),
        ...(form.notes && { notes: form.notes.trim() }),
      };

      const updated = await updateTestimonial(
        projectId,
        testimonial.id,
        payload,
      );
      toast.success("Testimonial updated");
      onUpdated(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit Testimonial
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Update feedback from {testimonial.customerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: s }))}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= form.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-600">
                {form.rating}/5
              </span>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Testimonial Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={form.testimonialText}
              onChange={(e) =>
                setForm((f) => ({ ...f, testimonialText: e.target.value }))
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                City
              </label>
              <input
                type="text"
                value={form.customerCity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerCity: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={form.customerDesignation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customerDesignation: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company
              </label>
              <input
                type="text"
                value={form.customerCompany}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerCompany: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  {
                    key: "canSharePublicly" as const,
                    label: "Share Publicly",
                    icon: Globe,
                  },
                  {
                    key: "canUseName" as const,
                    label: "Use Name",
                    icon: UserCheck,
                  },
                  {
                    key: "canUsePhoto" as const,
                    label: "Use Photo",
                    icon: Camera,
                  },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                    form[key]
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      form[key] ? "text-orange-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      form[key] ? "text-orange-900" : "text-gray-700"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Internal Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Private notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// View Testimonial Modal
// ==========================================

interface ViewTestimonialModalProps {
  testimonial: ProjectTestimonial;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

const ViewTestimonialModal: React.FC<ViewTestimonialModalProps> = ({
  testimonial,
  onClose,
  onStatusChange,
}) => {
  const sc = getStatusConfig(testimonial.status);
  const StatusIcon = sc.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center border border-orange-200">
                <span className="text-xl font-bold text-orange-600">
                  {testimonial.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {testimonial.customerName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= testimonial.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {STATUS_LABELS[testimonial.status] || testimonial.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Testimonial text */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5">
            <Quote className="w-6 h-6 text-orange-300 mb-2" />
            <p className="text-gray-800 leading-relaxed text-base">
              {testimonial.testimonialText}
            </p>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            {testimonial.customerCity && (
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm font-medium">
                    {testimonial.customerCity}
                  </p>
                </div>
              </div>
            )}
            {testimonial.customerDesignation && (
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Designation</p>
                  <p className="text-sm font-medium">
                    {testimonial.customerDesignation}
                    {testimonial.customerCompany &&
                      ` at ${testimonial.customerCompany}`}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Captured</p>
                <p className="text-sm font-medium">
                  {formatDateTime(testimonial.capturedAt)}
                </p>
              </div>
            </div>
            {testimonial.capturedByDesigner && (
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Captured By</p>
                  <p className="text-sm font-medium">
                    {testimonial.capturedByDesigner.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          {testimonial.photoUrls.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Photos</h4>
              <div className="grid grid-cols-3 gap-2">
                {testimonial.photoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {testimonial.videoUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                Video Testimonial
              </h4>
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <video
                  controls
                  className="w-full max-h-[400px]"
                  src={testimonial.videoUrl}
                >
                  <source src={testimonial.videoUrl} type="video/mp4" />
                  <source src={testimonial.videoUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
              {testimonial.videoFileName && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {testimonial.videoFileName}
                </p>
              )}
            </div>
          )}

          {/* Audio */}
          {testimonial.audioUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Audio</h4>
              <a
                href={testimonial.audioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <Mic className="w-4 h-4" />
                {testimonial.audioFileName || "Listen Audio"}
              </a>
            </div>
          )}

          {/* Permissions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Permissions
            </h4>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  testimonial.canSharePublicly
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <Globe className="w-3 h-3" />
                {testimonial.canSharePublicly
                  ? "Can share publicly"
                  : "Private only"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  testimonial.canUseName
                    ? "bg-sky-50 text-sky-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <UserCheck className="w-3 h-3" />
                {testimonial.canUseName
                  ? "Name can be used"
                  : "Name cannot be used"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  testimonial.canUsePhoto
                    ? "bg-violet-50 text-violet-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <Camera className="w-3 h-3" />
                {testimonial.canUsePhoto
                  ? "Photo can be used"
                  : "Photo cannot be used"}
              </span>
            </div>
          </div>

          {/* Approval Info */}
          {testimonial.approvedAt && testimonial.approvedBy && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Approved by {testimonial.approvedBy.name}
                </p>
                <p className="text-xs text-emerald-600">
                  {formatDateTime(testimonial.approvedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {testimonial.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Internal Notes
              </p>
              <p className="text-sm text-gray-700">{testimonial.notes}</p>
            </div>
          )}
        </div>

        {/* Footer with status actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              {testimonial.status === TestimonialStatus.DRAFT && (
                <button
                  onClick={() =>
                    onStatusChange(TestimonialStatus.PENDING_APPROVAL)
                  }
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </button>
              )}
              {testimonial.status === TestimonialStatus.PENDING_APPROVAL && (
                <>
                  <button
                    onClick={() => onStatusChange(TestimonialStatus.REJECTED)}
                    className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ShieldX className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => onStatusChange(TestimonialStatus.APPROVED)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Approve
                  </button>
                </>
              )}
              {testimonial.status === TestimonialStatus.APPROVED && (
                <button
                  onClick={() => onStatusChange(TestimonialStatus.PUBLISHED)}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsTab;
