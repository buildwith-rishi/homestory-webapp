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
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
    },
    [TestimonialStatus.PENDING]: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    [TestimonialStatus.REJECTED]: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
    },
    [TestimonialStatus.DRAFT]: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };
  return colors[status];
};

// Mock testimonials data
const generateMockTestimonials = (projectId: string): ProjectTestimonial[] => {
  return [
    {
      id: "test1",
      projectId,
      projectName: "Modern 3BHK Interior",
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
    toast.success("Testimonial approved!");
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
        : "Added to featured testimonials!"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Testimonials</h2>
          <p className="text-gray-500 mt-1">
            Collect and manage client feedback and reviews
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-gray-900">{stats.featured}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRating.toFixed(1)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterStatus === "ALL"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {Object.values(TestimonialStatus).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterStatus === status
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Testimonials Grid */}
      {filteredTestimonials.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No testimonials found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterStatus !== "ALL"
              ? "Try adjusting your filters"
              : "Start collecting client testimonials for this project"}
          </p>
          <Button onClick={() => setShowUploadModal(true)}>
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
            toast.success("Testimonial added successfully!");
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

// Testimonial Card Component
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail/Avatar */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100">
        {testimonial.type === TestimonialType.VIDEO && testimonial.videoThumbnail ? (
          <img
            src={testimonial.videoThumbnail}
            alt={testimonial.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              {testimonial.clientAvatar ? (
                <img
                  src={testimonial.clientAvatar}
                  alt={testimonial.clientName}
                  className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-white flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <p className="font-semibold text-gray-700">{testimonial.clientName}</p>
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border-0">
            {testimonial.type === TestimonialType.VIDEO && (
              <Video className="w-3 h-3 mr-1" />
            )}
            {testimonial.type === TestimonialType.TEXT && (
              <FileText className="w-3 h-3 mr-1" />
            )}
            {testimonial.type === TestimonialType.AUDIO && (
              <Mic className="w-3 h-3 mr-1" />
            )}
            {testimonial.type}
          </Badge>
        </div>

        {/* Duration for Video/Audio */}
        {(testimonial.videoDuration || testimonial.audioDuration) && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(testimonial.videoDuration || testimonial.audioDuration || 0)}
            </Badge>
          </div>
        )}

        {/* Play Button for Video */}
        {testimonial.type === TestimonialType.VIDEO && (
          <button
            onClick={onView}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-purple-600 ml-1" />
            </div>
          </button>
        )}

        {/* Featured Badge */}
        {testimonial.isFeatured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-yellow-400 text-yellow-900 border-0">
              <Award className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge
            className={`${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
          >
            {testimonial.status}
          </Badge>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= testimonial.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
          {testimonial.title}
        </h3>

        {/* Content Preview */}
        {testimonial.content && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {testimonial.content}
          </p>
        )}

        {/* Meta Info */}
        <div className="space-y-2 mb-4 text-xs text-gray-500">
          {testimonial.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {testimonial.location}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(testimonial.recordedAt)}
          </div>
        </div>

        {/* Tags */}
        {testimonial.tags && testimonial.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {testimonial.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-lg"
              >
                {tag}
              </span>
            ))}
            {testimonial.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                +{testimonial.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {testimonial.status === TestimonialStatus.PENDING && (
            <>
              <button
                onClick={() => onApprove(testimonial.id)}
                className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => onReject(testimonial.id)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Reject
              </button>
            </>
          )}

          <button
            onClick={() => onToggleFeatured(testimonial.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              testimonial.isFeatured
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={testimonial.isFeatured ? "Remove from featured" : "Add to featured"}
          >
            <Award className="w-3 h-3" />
          </button>

          <button
            onClick={() => onToggleWebsite(testimonial.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              testimonial.showOnWebsite
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={
              testimonial.showOnWebsite ? "Hide from website" : "Show on website"
            }
          >
            {testimonial.showOnWebsite ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </button>

          <button
            onClick={onView}
            className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
          </button>

          <button
            onClick={() => onDelete(testimonial.id)}
            className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </Card>
  );
};

// Upload Modal Component
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Testimonial</h2>
              <p className="text-sm text-gray-500 mt-1">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Testimonial Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: TestimonialType.VIDEO, icon: Video, label: "Video" },
                { type: TestimonialType.TEXT, icon: FileText, label: "Text" },
                { type: TestimonialType.AUDIO, icon: Mic, label: "Audio" },
              ].map(({ type: t, icon: Icon, label }) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === t
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      type === t ? "text-purple-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      type === t ? "text-purple-700" : "text-gray-600"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload for Video/Audio */}
          {type !== TestimonialType.TEXT && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload {type} File *
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
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer"
              >
                {videoFile ? (
                  <div>
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">{videoFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">
                      Click to upload {type.toLowerCase()} file
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {type === TestimonialType.VIDEO
                        ? "MP4, MOV, AVI up to 100MB"
                        : "MP3, WAV up to 50MB"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Amazing transformation of our home!"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Testimonial Content {type === TestimonialType.TEXT && "*"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Write the detailed testimonial here..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Add tag and press Enter"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Testimonial
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// View Modal Component
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {testimonial.clientAvatar && (
                <img
                  src={testimonial.clientAvatar}
                  alt={testimonial.clientName}
                  className="w-16 h-16 rounded-full border-4 border-purple-100"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{testimonial.title}</h2>
                <p className="text-gray-600 mt-1">{testimonial.clientName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${statusColors.bg} ${statusColors.text}`}>
                    {testimonial.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= testimonial.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
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
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={testimonial.videoThumbnail}
                alt={testimonial.title}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-purple-600 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {testimonial.content && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 leading-relaxed italic">{testimonial.content}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            {testimonial.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-semibold">{testimonial.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Recorded On</p>
                <p className="font-semibold">{formatDate(testimonial.recordedAt)}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {testimonial.tags && testimonial.tags.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {testimonial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
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
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onReject(testimonial.id);
                    onClose();
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    onApprove(testimonial.id);
                    onClose();
                  }}
                  className="bg-green-500 hover:bg-green-600"
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
