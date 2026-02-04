import React, { useState, useRef } from "react";
import {
  Video,
  Upload,
  Star,
  MapPin,
  Calendar,
  Play,
  X,
  Check,
  Eye,
  EyeOff,
  Award,
  Trash2,
  MessageSquare,
  Mic,
  FileText,
  Search,
  Plus,
  Clock,
  User,
  CheckCircle2,
  Loader,
  ChevronDown,
} from "lucide-react";
import { Button, Badge, Card } from "../../ui";
import toast from "react-hot-toast";
import {
  ProjectTestimonial,
  TestimonialType,
  TestimonialStatus,
  ProjectStageCode,
} from "../../../types";

// Helper functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getStatusColor = (status: TestimonialStatus) => {
  const colors = {
    [TestimonialStatus.APPROVED]: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    [TestimonialStatus.PENDING]: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    [TestimonialStatus.REJECTED]: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
    },
    [TestimonialStatus.DRAFT]: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-500",
    },
  };
  return colors[status];
};

// Project Stage Labels
const PROJECT_STAGE_LABELS = {
  [ProjectStageCode.LEAD]: "Lead",
  [ProjectStageCode.SITE_VISIT]: "Site Visit",
  [ProjectStageCode.PROPOSAL]: "Proposal",
  [ProjectStageCode.DESIGN]: "Design",
  [ProjectStageCode.EXECUTION]: "Execution",
  [ProjectStageCode.HANDOVER]: "Handover",
  [ProjectStageCode.WARRANTY]: "Warranty",
};

// Mock testimonials data
const generateMockTestimonials = (projectId: string): ProjectTestimonial[] => {
  return [
    {
      id: "test1",
      projectId,
      projectName: "Modern 3BHK Interior",
      projectStage: ProjectStageCode.HANDOVER,
      clientName: "Rajesh Kumar",
      clientAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
      type: TestimonialType.VIDEO,
      status: TestimonialStatus.APPROVED,
      rating: 5,
      title: "Exceptional Work and Great Team!",
      content:
        "The team at Good Homestory transformed our house into a beautiful home. Their attention to detail and professionalism is outstanding.",
      videoUrl: "https://example.com/testimonial1.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      videoDuration: 125,
      location: "Bangalore",
      projectCategory: "RESIDENTIAL",
      projectValue: 2500000,
      tags: ["Interior Design", "Modular Kitchen", "Living Room"],
      isFeatured: true,
      showOnWebsite: true,
      recordedAt: "2026-01-20T10:30:00Z",
      approvedAt: "2026-01-21T14:00:00Z",
      createdAt: "2026-01-20T10:30:00Z",
      updatedAt: "2026-01-21T14:00:00Z",
    },
    {
      id: "test2",
      projectId,
      projectName: "Modern 3BHK Interior",
      projectStage: ProjectStageCode.EXECUTION,
      clientName: "Priya Sharma",
      clientAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
      type: TestimonialType.TEXT,
      status: TestimonialStatus.APPROVED,
      rating: 5,
      title: "Dream Home Come True",
      content:
        "I couldn't be happier with the results! The design team listened to all our requirements and delivered beyond expectations. The quality of work and materials used is top-notch. Highly recommended!",
      location: "Bangalore",
      tags: ["Full Home Interior", "Contemporary Design"],
      isFeatured: false,
      showOnWebsite: true,
      recordedAt: "2026-01-25T15:45:00Z",
      createdAt: "2026-01-25T15:45:00Z",
      updatedAt: "2026-01-25T15:45:00Z",
    },
    {
      id: "test3",
      projectId,
      projectName: "Modern 3BHK Interior",
      projectStage: ProjectStageCode.DESIGN,
      clientName: "Amit Patel",
      type: TestimonialType.VIDEO,
      status: TestimonialStatus.PENDING,
      rating: 4,
      title: "Great Experience Overall",
      content: "Very satisfied with the work. Minor delays but excellent final result.",
      videoUrl: "https://example.com/testimonial3.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      videoDuration: 95,
      location: "Bangalore",
      tags: ["Bedroom Design", "Wardrobe"],
      isFeatured: false,
      showOnWebsite: false,
      recordedAt: "2026-01-28T11:00:00Z",
      createdAt: "2026-01-28T11:00:00Z",
      updatedAt: "2026-01-28T11:00:00Z",
    },
  ];
};

interface TestimonialsTabProps {
  projectId: string;
  projectName: string;
  clientName: string;
}

export const TestimonialsTab: React.FC<TestimonialsTabProps> = ({
  projectId,
  projectName,
  clientName,
}) => {
  const [testimonials, setTestimonials] = useState<ProjectTestimonial[]>(() =>
    generateMockTestimonials(projectId)
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<ProjectTestimonial | null>(null);
  const [filterStatus, setFilterStatus] = useState<TestimonialStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered testimonials
  const filteredTestimonials = testimonials.filter((t) => {
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: testimonials.length,
    approved: testimonials.filter((t) => t.status === TestimonialStatus.APPROVED).length,
    pending: testimonials.filter((t) => t.status === TestimonialStatus.PENDING).length,
    featured: testimonials.filter((t) => t.isFeatured).length,
    avgRating:
      testimonials.reduce((sum, t) => sum + t.rating, 0) / (testimonials.length || 1),
  };

  const handleApprove = (testimonialId: string) => {
    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === testimonialId
          ? {
              ...t,
              status: TestimonialStatus.APPROVED,
              approvedAt: new Date().toISOString(),
            }
          : t
      )
    );
    toast.success("Testimonial approved successfully");
  };

  const handleReject = (testimonialId: string) => {
    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === testimonialId ? { ...t, status: TestimonialStatus.REJECTED } : t
      )
    );
    toast.success("Testimonial rejected");
  };

  const handleToggleFeatured = (testimonialId: string) => {
    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === testimonialId ? { ...t, isFeatured: !t.isFeatured } : t
      )
    );
    const testimonial = testimonials.find((t) => t.id === testimonialId);
    toast.success(
      testimonial?.isFeatured
        ? "Removed from featured"
        : "Added to featured testimonials"
    );
  };

  const handleToggleWebsite = (testimonialId: string) => {
    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === testimonialId ? { ...t, showOnWebsite: !t.showOnWebsite } : t
      )
    );
    toast.success("Website visibility updated");
  };

  const handleDelete = (testimonialId: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      setTestimonials((prev) => prev.filter((t) => t.id !== testimonialId));
      toast.success("Testimonial deleted");
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Professional Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Client Testimonials</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and showcase client feedback for {projectName}
            </p>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Clean Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-5 bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Featured</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.featured}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.avgRating.toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Clean Filters */}
      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === "ALL"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {Object.values(TestimonialStatus).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Professional Testimonials Grid */}
      {filteredTestimonials.length === 0 ? (
        <Card className="p-16 text-center bg-white border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No testimonials found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterStatus !== "ALL"
              ? "Try adjusting your filters"
              : "Start collecting client testimonials for this project"}
          </p>
          <Button onClick={() => setShowUploadModal(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Add First Testimonial
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              onApprove={handleApprove}
              onReject={handleReject}
              onToggleFeatured={handleToggleFeatured}
              onToggleWebsite={handleToggleWebsite}
              onDelete={handleDelete}
              onView={() => setSelectedTestimonial(testimonial)}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadTestimonialModal
          projectId={projectId}
          projectName={projectName}
          clientName={clientName}
          onClose={() => setShowUploadModal(false)}
          onUpload={(newTestimonial) => {
            setTestimonials((prev) => [newTestimonial, ...prev]);
            toast.success("Testimonial added successfully");
            setShowUploadModal(false);
          }}
        />
      )}

      {/* View Modal */}
      {selectedTestimonial && (
        <ViewTestimonialModal
          testimonial={selectedTestimonial}
          onClose={() => setSelectedTestimonial(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

// Professional Testimonial Card Component
interface TestimonialCardProps {
  testimonial: ProjectTestimonial;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onToggleWebsite: (id: string) => void;
  onDelete: (id: string) => void;
  onView: () => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  onApprove,
  onReject,
  onToggleFeatured,
  onToggleWebsite,
  onDelete,
  onView,
}) => {
  const statusColors = getStatusColor(testimonial.status);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white border border-gray-200">
      {/* Clean Thumbnail/Avatar */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50">
        {testimonial.type === TestimonialType.VIDEO && testimonial.videoThumbnail ? (
          <>
            <img
              src={testimonial.videoThumbnail}
              alt={testimonial.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onView}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group"
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play className="w-7 h-7 text-orange-600 ml-0.5" />
              </div>
            </button>
            {testimonial.videoDuration && (
              <div className="absolute bottom-3 right-3">
                <span className="px-2 py-1 bg-black/70 text-white text-xs rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(testimonial.videoDuration)}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {testimonial.clientAvatar ? (
              <img
                src={testimonial.clientAvatar}
                alt={testimonial.clientName}
                className="w-16 h-16 rounded-full mb-3 border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full mb-3 bg-white flex items-center justify-center shadow-md">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <p className="font-semibold text-gray-900 text-sm">{testimonial.clientName}</p>
            <div className="mt-2 px-2 py-1 bg-white rounded-md shadow-sm flex items-center gap-1">
              {testimonial.type === TestimonialType.TEXT && (
                <FileText className="w-3 h-3 text-gray-600" />
              )}
              {testimonial.type === TestimonialType.AUDIO && (
                <Mic className="w-3 h-3 text-gray-600" />
              )}
              <span className="text-xs text-gray-600 font-medium">{testimonial.type}</span>
            </div>
          </div>
        )}

        {/* Featured Badge */}
        {testimonial.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-semibold rounded shadow-sm flex items-center gap-1">
              <Award className="w-3 h-3" />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Clean Content */}
      <div className="p-5">
        {/* Status and Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
            <span className={`text-xs font-medium ${statusColors.text}`}>
              {testimonial.status}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= testimonial.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base">
          {testimonial.title}
        </h3>

        {/* Content Preview */}
        {testimonial.content && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {testimonial.content}
          </p>
        )}

        {/* Meta Info */}
        <div className="space-y-1.5 mb-4 text-xs text-gray-500">
          {testimonial.projectStage && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-orange-500" />
              <span>{PROJECT_STAGE_LABELS[testimonial.projectStage]}</span>
            </div>
          )}
          {testimonial.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {testimonial.location}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {formatDate(testimonial.recordedAt)}
          </div>
        </div>

        {/* Tags */}
        {testimonial.tags && testimonial.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {testimonial.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded font-medium"
              >
                {tag}
              </span>
            ))}
            {testimonial.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                +{testimonial.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Professional Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {testimonial.status === TestimonialStatus.PENDING && (
            <>
              <button
                onClick={() => onApprove(testimonial.id)}
                className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => onReject(testimonial.id)}
                className="flex-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}

          <div className="flex gap-2 w-full">
            <button
              onClick={() => onToggleFeatured(testimonial.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                testimonial.isFeatured
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={testimonial.isFeatured ? "Remove from featured" : "Add to featured"}
            >
              <Award className="w-3.5 h-3.5" />
              {testimonial.isFeatured ? "Featured" : "Feature"}
            </button>

            <button
              onClick={() => onToggleWebsite(testimonial.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                testimonial.showOnWebsite
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={testimonial.showOnWebsite ? "Hide from website" : "Show on website"}
            >
              {testimonial.showOnWebsite ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              {testimonial.showOnWebsite ? "Visible" : "Hidden"}
            </button>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={onView}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>

            <button
              onClick={() => onDelete(testimonial.id)}
              className="flex-1 px-3 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Professional Upload Modal Component
interface UploadTestimonialModalProps {
  projectId: string;
  projectName: string;
  clientName: string;
  onClose: () => void;
  onUpload: (testimonial: ProjectTestimonial) => void;
}

const UploadTestimonialModal: React.FC<UploadTestimonialModalProps> = ({
  projectId,
  projectName,
  clientName,
  onClose,
  onUpload,
}) => {
  const [type, setType] = useState<TestimonialType>(TestimonialType.VIDEO);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectStage, setProjectStage] = useState<ProjectStageCode>(ProjectStageCode.HANDOVER);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === TestimonialType.VIDEO && !file.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }
      if (type === TestimonialType.AUDIO && !file.type.startsWith("audio/")) {
        toast.error("Please select an audio file");
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (type !== TestimonialType.TEXT && !videoFile) {
      toast.error(`Please select a ${type.toLowerCase()} file`);
      return;
    }

    setUploading(true);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newTestimonial: ProjectTestimonial = {
      id: `test_${Date.now()}`,
      projectId,
      projectName,
      projectStage,
      clientName,
      clientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clientName}`,
      type,
      status: TestimonialStatus.DRAFT,
      rating,
      title: title.trim(),
      content: content.trim() || undefined,
      videoUrl: type === TestimonialType.VIDEO ? "https://example.com/video.mp4" : undefined,
      videoThumbnail:
        type === TestimonialType.VIDEO
          ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
          : undefined,
      videoDuration: type === TestimonialType.VIDEO ? 120 : undefined,
      audioUrl: type === TestimonialType.AUDIO ? "https://example.com/audio.mp3" : undefined,
      audioDuration: type === TestimonialType.AUDIO ? 90 : undefined,
      location: "Bangalore",
      tags: tags.length > 0 ? tags : undefined,
      isFeatured: false,
      showOnWebsite: false,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpload(newTestimonial);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Professional Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Testimonial</h2>
              <p className="text-sm text-gray-600 mt-1">
                Capture client feedback for {projectName}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Testimonial Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: TestimonialType.VIDEO, icon: Video, label: "Video", desc: "Record a video testimonial" },
                { type: TestimonialType.TEXT, icon: FileText, label: "Text", desc: "Written feedback" },
                { type: TestimonialType.AUDIO, icon: Mic, label: "Audio", desc: "Voice recording" },
              ].map(({ type: t, icon: Icon, label, desc }) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    type === t
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      type === t ? "text-orange-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold block ${
                      type === t ? "text-orange-900" : "text-gray-700"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Stage Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Project Stage <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={projectStage}
                onChange={(e) => setProjectStage(e.target.value as ProjectStageCode)}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none text-gray-900 font-medium"
              >
                {Object.entries(PROJECT_STAGE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Select the project stage when this testimonial was recorded</p>
          </div>

          {/* File Upload for Video/Audio */}
          {type !== TestimonialType.TEXT && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Upload {type} File <span className="text-rose-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={type === TestimonialType.VIDEO ? "video/*" : "audio/*"}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer group"
              >
                {videoFile ? (
                  <div>
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">{videoFile.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button className="text-sm text-orange-600 font-medium mt-2 hover:text-orange-700">
                      Change file
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-orange-100 transition-colors flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-7 h-7 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <p className="font-semibold text-gray-900">
                      Click to upload {type.toLowerCase()} file
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {type === TestimonialType.VIDEO
                        ? "MP4, MOV, AVI up to 100MB"
                        : "MP3, WAV, M4A up to 50MB"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Client Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{rating}/5 - {rating >= 4 ? "Excellent" : rating >= 3 ? "Good" : "Needs improvement"}</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Testimonial Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Amazing transformation of our home!"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Testimonial Content {type === TestimonialType.TEXT && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Write the detailed testimonial here..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{type === TestimonialType.TEXT ? "Required for text testimonials" : "Optional transcript or description"}</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tags (Optional)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag and press Enter"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <Button onClick={handleAddTag} className="bg-orange-500 hover:bg-orange-600">Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm flex items-center gap-2 font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-orange-900 focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Professional Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add Testimonial
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// View Modal Component (keeping similar professional style)
interface ViewTestimonialModalProps {
  testimonial: ProjectTestimonial;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ViewTestimonialModal: React.FC<ViewTestimonialModalProps> = ({
  testimonial,
  onClose,
  onApprove,
  onReject,
}) => {
  const statusColors = getStatusColor(testimonial.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {testimonial.clientAvatar && (
                <img
                  src={testimonial.clientAvatar}
                  alt={testimonial.clientName}
                  className="w-16 h-16 rounded-full border-2 border-orange-200"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{testimonial.title}</h2>
                <p className="text-gray-700 mt-1 font-medium">{testimonial.clientName}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
                    <span className={`text-sm font-medium ${statusColors.text}`}>
                      {testimonial.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= testimonial.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {testimonial.projectStage && (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                      {PROJECT_STAGE_LABELS[testimonial.projectStage]}
                    </span>
                  )}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Video Player */}
          {testimonial.type === TestimonialType.VIDEO && testimonial.videoThumbnail && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={testimonial.videoThumbnail}
                alt={testimonial.title}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <button className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-10 h-10 text-orange-600 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {testimonial.content && (
            <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800 leading-relaxed italic">"{testimonial.content}"</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            {testimonial.location && (
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="font-semibold">{testimonial.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Recorded On</p>
                <p className="font-semibold">{formatDate(testimonial.recordedAt)}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {testimonial.tags && testimonial.tags.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {testimonial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {testimonial.status === TestimonialStatus.PENDING && (
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    onReject(testimonial.id);
                    onClose();
                  }}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    onApprove(testimonial.id);
                    onClose();
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsTab;
