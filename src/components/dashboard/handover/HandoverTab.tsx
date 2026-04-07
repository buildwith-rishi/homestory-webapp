import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Gift,
  Camera,
  Upload,
  X,
  Save,
  Sparkles,
  IndianRupee,
  Calendar,
  FileText,
  Eye,
  Undo2,
} from "lucide-react";
import { Button, Card, SectionLoader, Spinner } from "../../ui";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

function resolvePhotoUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))
    return fileUrl;
  return `${API_BASE_URL}/${fileUrl}`;
}
import type {
  HandoverActivity,
  CreateHandoverActivityRequest,
  UpdateHandoverActivityRequest,
  HandoverPhoto,
} from "../../../types";
import {
  getHandoverActivities,
  createHandoverActivity,
  updateHandoverActivity,
  deleteHandoverActivity,
  seedHandoverActivities,
  getHandoverPhotos,
  uploadHandoverPhoto,
  deleteHandoverPhoto,
} from "../../../services/projectApi";

// ==========================================
// Helpers
// ==========================================

const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0";
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================
// Props
// ==========================================

interface HandoverTabProps {
  projectId: string;
}

// ==========================================
// Component
// ==========================================

export const HandoverTab: React.FC<HandoverTabProps> = ({ projectId }) => {
  // State
  const [activities, setActivities] = useState<HandoverActivity[]>([]);
  const [photos, setPhotos] = useState<HandoverPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"activities" | "photos">(
    "activities",
  );

  // Activity form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] =
    useState<HandoverActivity | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "",
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Completion form
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoIsPublic, setPhotoIsPublic] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<HandoverPhoto | null>(
    null,
  );

  // ==========================================
  // Data Fetching
  // ==========================================

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHandoverActivities(projectId);
      setActivities(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load activities";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchPhotos = useCallback(async () => {
    setPhotosLoading(true);
    try {
      const data = await getHandoverPhotos(projectId);
      setPhotos(data);
    } catch {
      // Photos error is non-critical
    } finally {
      setPhotosLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivities();
    fetchPhotos();
  }, [fetchActivities, fetchPhotos]);

  // ==========================================
  // Activity CRUD
  // ==========================================

  const handleSeedActivities = async () => {
    setSeeding(true);
    try {
      await seedHandoverActivities(projectId);
      toast.success("Default activities added");
      await fetchActivities();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to seed activities",
      );
    } finally {
      setSeeding(false);
    }
  };

  const openAddForm = () => {
    setEditingActivity(null);
    setFormData({ name: "", description: "", cost: "" });
    setShowAddForm(true);
  };

  const openEditForm = (activity: HandoverActivity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description,
      cost: activity.cost,
    });
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingActivity(null);
    setFormData({ name: "", description: "", cost: "" });
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Activity name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingActivity) {
        const updateData: UpdateHandoverActivityRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          cost: parseFloat(formData.cost) || 0,
        };
        await updateHandoverActivity(projectId, editingActivity.id, updateData);
        toast.success("Activity updated");
      } else {
        const createData: CreateHandoverActivityRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          cost: parseFloat(formData.cost) || 0,
        };
        await createHandoverActivity(projectId, createData);
        toast.success("Activity created");
      }
      closeForm();
      await fetchActivities();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save activity",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    try {
      await deleteHandoverActivity(projectId, activityId);
      toast.success("Activity deleted");
      await fetchActivities();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete activity",
      );
    }
  };

  const handleToggleComplete = async (activity: HandoverActivity) => {
    if (!activity.isCompleted) {
      // Mark as completed
      setCompletingId(activity.id);
      setCompletionNotes("");
      return;
    }
    // Undo completion
    try {
      await updateHandoverActivity(projectId, activity.id, {
        isCompleted: false,
        completedAt: undefined,
        notes: null as unknown as string,
      });
      toast.success("Activity marked as pending");
      await fetchActivities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleConfirmComplete = async (activityId: string) => {
    try {
      await updateHandoverActivity(projectId, activityId, {
        isCompleted: true,
        completedAt: new Date().toISOString(),
        notes: completionNotes.trim() || undefined,
      });
      toast.success("Activity marked as completed!");
      setCompletingId(null);
      setCompletionNotes("");
      await fetchActivities();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete");
    }
  };

  // ==========================================
  // Photo Handling
  // ==========================================

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setSelectedPhotoFile(file);
    e.target.value = "";
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhotoFile) return;

    setUploadingPhoto(true);
    try {
      await uploadHandoverPhoto(
        projectId,
        selectedPhotoFile,
        photoCaption.trim() || undefined,
        photoIsPublic,
      );
      toast.success("Photo uploaded");
      setPhotoCaption("");
      setPhotoIsPublic(true);
      setSelectedPhotoFile(null);
      setShowPhotoUpload(false);
      await fetchPhotos();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await deleteHandoverPhoto(projectId, photoId);
      toast.success("Photo deleted");
      if (lightboxPhoto?.id === photoId) setLightboxPhoto(null);
      await fetchPhotos();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete photo",
      );
    }
  };

  // ==========================================
  // Computed Values
  // ==========================================

  const totalCost = activities.reduce(
    (sum, a) => sum + (parseFloat(a.cost) || 0),
    0,
  );
  const completedCount = activities.filter((a) => a.isCompleted).length;
  const completedCost = activities
    .filter((a) => a.isCompleted)
    .reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0);
  const progress =
    activities.length > 0
      ? Math.round((completedCount / activities.length) * 100)
      : 0;

  // ==========================================
  // Render
  // ==========================================

  if (loading) {
    return <SectionLoader message="Loading handover details..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchActivities}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <Gift className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Handover & Goodwill
            </h2>
            <p className="text-xs text-gray-500">
              Manage handover activities, gifts & photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchActivities();
              fetchPhotos();
            }}
            className="text-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Activities
          </p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {activities.length}
          </p>
        </Card>
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Completed
          </p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">
            {completedCount}/{activities.length}
          </p>
        </Card>
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Total Cost
          </p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {formatCurrency(totalCost)}
          </p>
        </Card>
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Progress
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-emerald-600">
              {progress}%
            </span>
          </div>
        </Card>
      </div>

      {/* Section Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveSection("activities")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeSection === "activities"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Activities ({activities.length})
        </button>
        <button
          onClick={() => setActiveSection("photos")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeSection === "photos"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Camera className="w-4 h-4" />
          Photos ({photos.length})
        </button>
      </div>

      {/* ============= Activities Section ============= */}
      {activeSection === "activities" && (
        <div className="space-y-3">
          {/* Action Buttons */}
          {activities.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={openAddForm}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Activity
              </Button>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="p-4 bg-white border-orange-200 shadow-md">
              <form onSubmit={handleSubmitActivity} className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingActivity ? "Edit Activity" : "New Activity"}
                  </h3>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. Deep Cleaning, Gift Hamper"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Brief description of the activity..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, cost: e.target.value }))
                      }
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    {editingActivity ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Activities List */}
          {activities.length === 0 ? (
            <Card className="p-8 bg-white/80 border-gray-200/50">
              <div className="flex flex-col items-center justify-center text-center">
                <Gift className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  No Handover Activities
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Add handover activities like deep cleaning, gift hampers, key
                  ceremony, and walkthrough demos to track your project handover
                  process.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={openAddForm}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Activity
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeedActivities}
                    disabled={seeding}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    {seeding ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    Auto-Generate Defaults
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <Card
                  key={activity.id}
                  className={`p-4 bg-white/90 border transition-all hover:shadow-md ${
                    activity.isCompleted
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-gray-200/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Completion Toggle */}
                    <button
                      onClick={() => handleToggleComplete(activity)}
                      className={`mt-0.5 flex-shrink-0 transition-colors ${
                        activity.isCompleted
                          ? "text-emerald-500 hover:text-emerald-600"
                          : "text-gray-300 hover:text-emerald-400"
                      }`}
                    >
                      {activity.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-semibold ${
                            activity.isCompleted
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {activity.name}
                        </h4>
                        {activity.isCompleted && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p
                          className={`text-xs mt-0.5 ${
                            activity.isCompleted
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          {activity.description}
                        </p>
                      )}

                      {/* Meta Row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <IndianRupee className="w-3 h-3" />
                          {formatCurrency(activity.cost)}
                        </span>
                        {activity.completedAt && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(activity.completedAt)}
                          </span>
                        )}
                        {activity.notes && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                            <FileText className="w-3 h-3" />
                            {activity.notes}
                          </span>
                        )}
                      </div>

                      {/* Completion Notes Form */}
                      {completingId === activity.id && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
                          <label className="text-xs font-medium text-emerald-700">
                            Completion Notes{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="e.g. Deep cleaning completed by vendor"
                            rows={2}
                            className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={!completionNotes.trim()}
                              onClick={() => handleConfirmComplete(activity.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Mark Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCompletingId(null)}
                              className="text-gray-500"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {activity.isCompleted && (
                        <button
                          onClick={() => handleToggleComplete(activity)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                          title="Undo completion"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(activity)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Cost Summary */}
              <Card className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">
                    Cost Summary
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">
                      Completed:{" "}
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(completedCost)}
                      </span>
                    </span>
                    <span className="text-gray-500">
                      Total:{" "}
                      <span className="font-bold text-gray-900">
                        {formatCurrency(totalCost)}
                      </span>
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ============= Photos Section ============= */}
      {activeSection === "photos" && (
        <div className="space-y-3">
          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowPhotoUpload(!showPhotoUpload)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload Photo
            </Button>
          </div>

          {/* Upload Form */}
          {showPhotoUpload && (
            <Card className="p-4 bg-white border-orange-200 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">
                  Upload Handover Photo
                </h3>
                <button
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setSelectedPhotoFile(null);
                    setPhotoCaption("");
                    setPhotoIsPublic(true);
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Caption (optional)
                  </label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g. Living Room - Final View"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photoIsPublic}
                      onChange={(e) => setPhotoIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20"
                    />
                    <span className="text-sm text-gray-600">Public photo</span>
                  </label>
                </div>

                {/* File selector zone */}
                {!selectedPhotoFile ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors border-gray-300 hover:border-orange-400 hover:bg-orange-50/50">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 font-medium">
                      Click to select photo
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      JPG, PNG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoFileSelect}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {selectedPhotoFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedPhotoFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPhotoFile(null)}
                      className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-400 hover:text-rose-500 flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handlePhotoUpload}
                    disabled={!selectedPhotoFile || uploadingPhoto}
                    className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPhotoUpload(false);
                      setSelectedPhotoFile(null);
                      setPhotoCaption("");
                      setPhotoIsPublic(true);
                    }}
                    disabled={uploadingPhoto}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Photos Grid */}
          {photosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" color="brand" />
            </div>
          ) : photos.length === 0 ? (
            <Card className="p-8 bg-white/80 border-gray-200/50">
              <div className="flex flex-col items-center justify-center text-center">
                <Camera className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  No Handover Photos
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Upload photos of the completed project, key handover ceremony,
                  or the final property walkthrough.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowPhotoUpload(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload First Photo
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="aspect-square">
                    <img
                      src={resolvePhotoUrl(photo.fileUrl)}
                      alt={photo.caption || "Handover photo"}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightboxPhoto(photo)}
                    />
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      {photo.caption && (
                        <p className="text-xs text-white font-medium truncate mb-1.5">
                          {photo.caption}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/70">
                          {formatDate(photo.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setLightboxPhoto(photo)}
                            className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1 rounded-md bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Public Badge */}
                  {photo.isPublic && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-white/90 text-emerald-600 shadow-sm">
                        Public
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============= Lightbox ============= */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={resolvePhotoUrl(lightboxPhoto.fileUrl)}
              alt={lightboxPhoto.caption || "Handover photo"}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {lightboxPhoto.caption && (
              <div className="mt-3 text-center">
                <p className="text-white font-medium">
                  {lightboxPhoto.caption}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  {formatDateTime(lightboxPhoto.createdAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
