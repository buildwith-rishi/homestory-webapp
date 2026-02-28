import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Link2,
  Upload,
  Image,
  FileText,
  File,
  ExternalLink,
  Trash2,
  Edit3,
  Download,
  X,
  Save,
  Loader2,
  Search,
  Filter,
  Grid3X3,
  List,
  StickyNote,
  Tag,
  Calendar,
  User,
  Globe,
  ChevronDown,
  Eye,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { Button, Badge, Card } from "../../ui";
import toast from "react-hot-toast";
import type { ProjectReference } from "../../../types";
import {
  getProjectReferences,
  addLinkReference,
  uploadFileReference,
  updateProjectReference,
  deleteProjectReference,
  downloadProjectReference,
  getReferenceTypes,
} from "../../../services/projectApi";
import type { OptionItemWithDescription } from "../../../types";

interface ProjectReferencesTabProps {
  projectId: string;
}

type ViewMode = "grid" | "list";
type AddMode = "link" | "upload" | "quotation" | null;

const CATEGORY_COLORS: Record<string, string> = {
  "Living Room": "bg-blue-100 text-blue-700",
  Bedroom: "bg-purple-100 text-purple-700",
  Kitchen: "bg-orange-100 text-orange-700",
  Bathroom: "bg-cyan-100 text-cyan-700",
  "Dining Room": "bg-amber-100 text-amber-700",
  "Study/Office": "bg-indigo-100 text-indigo-700",
  "Kids Room": "bg-pink-100 text-pink-700",
  "Balcony/Terrace": "bg-green-100 text-green-700",
  "Entryway/Foyer": "bg-teal-100 text-teal-700",
  "Color Palette": "bg-rose-100 text-rose-700",
  "Furniture Style": "bg-yellow-100 text-yellow-700",
  Lighting: "bg-amber-100 text-amber-700",
  Flooring: "bg-stone-100 text-stone-700",
  "Wall Treatment": "bg-lime-100 text-lime-700",
  Storage: "bg-slate-100 text-slate-700",
  Outdoor: "bg-emerald-100 text-emerald-700",
  "General Inspiration": "bg-violet-100 text-violet-700",
  Other: "bg-gray-100 text-gray-600",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  LINK: <Globe className="w-4 h-4" />,
  PHOTO: <Image className="w-4 h-4" />,
  PDF: <FileText className="w-4 h-4" />,
  DOCUMENT: <File className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  LINK: "bg-blue-50 text-blue-600 border-blue-200",
  PHOTO: "bg-green-50 text-green-600 border-green-200",
  PDF: "bg-red-50 text-red-600 border-red-200",
  DOCUMENT: "bg-purple-50 text-purple-600 border-purple-200",
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ProjectReferencesTab: React.FC<ProjectReferencesTabProps> = ({
  projectId,
}) => {
  const [references, setReferences] = useState<ProjectReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [categories] = useState<string[]>([
    "References",
    "Estimation Value",
    "Design Presentation",
  ]);
  const [referenceTypes, setReferenceTypes] = useState<
    OptionItemWithDescription[]
  >([]);

  // Add link form
  const [linkForm, setLinkForm] = useState({
    linkUrl: "",
    linkTitle: "",
    category: "",
    tags: "",
  });
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    category: "",
    notes: "",
    tags: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quotation upload
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [quotationNotes, setQuotationNotes] = useState("");
  const [isUploadingQuotation, setIsUploadingQuotation] = useState(false);
  const quotationFileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editingRef, setEditingRef] = useState<ProjectReference | null>(null);
  const [editForm, setEditForm] = useState({
    linkTitle: "",
    notes: "",
    category: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview
  const [previewRef, setPreviewRef] = useState<ProjectReference | null>(null);

  // ── Fetch references ──
  const fetchReferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProjectReferences(projectId);
      setReferences(data.references || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching references:", error);
      toast.error("Failed to load references");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // ── Fetch options ──
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const types = await getReferenceTypes().catch(() => []);
        setReferenceTypes(types);
      } catch {
        // Silent fail
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  // ── Filter references ──
  const filteredReferences = references.filter((ref) => {
    const matchesSearch =
      !searchQuery ||
      (ref.linkTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.linkUrl || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || ref.category === categoryFilter;
    const matchesType =
      typeFilter === "all" || ref.referenceType === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // ── Category summary ──
  const categoryCounts = references.reduce(
    (acc, ref) => {
      const cat = ref.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // ── Add link reference ──
  const handleAddLink = async () => {
    if (!linkForm.linkUrl || !linkForm.linkTitle || !linkForm.category) {
      toast.error("Please fill in URL, title, and category");
      return;
    }
    setIsAddingLink(true);
    try {
      const tags = linkForm.tags
        ? linkForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;
      await addLinkReference(projectId, {
        linkUrl: linkForm.linkUrl,
        linkTitle: linkForm.linkTitle,
        category: linkForm.category,
        tags,
      });
      toast.success("Link reference added!");
      setLinkForm({ linkUrl: "", linkTitle: "", category: "", tags: "" });
      setAddMode(null);
      fetchReferences();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add link",
      );
    } finally {
      setIsAddingLink(false);
    }
  };

  // ── Upload file reference ──
  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.category) {
      toast.error("Please select a file and category");
      return;
    }
    setIsUploading(true);
    try {
      const tags = uploadForm.tags
        ? uploadForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;
      await uploadFileReference(
        projectId,
        uploadFile,
        uploadForm.category,
        uploadForm.notes || undefined,
        tags,
      );
      toast.success("File uploaded successfully!");
      setUploadFile(null);
      setUploadForm({ category: "", notes: "", tags: "" });
      setAddMode(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchReferences();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // ── Upload quotation ──
  const handleUploadQuotation = async () => {
    if (!quotationFile) {
      toast.error("Please select a quotation document");
      return;
    }
    setIsUploadingQuotation(true);
    try {
      await uploadFileReference(
        projectId,
        quotationFile,
        "Quotation",
        quotationNotes || undefined,
        undefined,
      );
      toast.success("Quotation uploaded successfully!");
      setQuotationFile(null);
      setQuotationNotes("");
      setAddMode(null);
      if (quotationFileInputRef.current)
        quotationFileInputRef.current.value = "";
      fetchReferences();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload quotation",
      );
    } finally {
      setIsUploadingQuotation(false);
    }
  };

  // ── Update reference ──
  const handleSaveEdit = async () => {
    if (!editingRef) return;
    setIsSavingEdit(true);
    try {
      await updateProjectReference(projectId, editingRef.id, {
        linkTitle: editForm.linkTitle || undefined,
        notes: editForm.notes || undefined,
        category: editForm.category || undefined,
      });
      toast.success("Reference updated!");
      setEditingRef(null);
      fetchReferences();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update reference",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Delete reference ──
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteProjectReference(projectId, deletingId);
      toast.success("Reference deleted");
      setDeletingId(null);
      fetchReferences();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete reference",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Download reference ──
  const handleDownload = async (ref: ProjectReference) => {
    try {
      const blob = await downloadProjectReference(projectId, ref.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = ref.fileName || `reference-${ref.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download",
      );
    }
  };

  const openEdit = (ref: ProjectReference) => {
    setEditingRef(ref);
    setEditForm({
      linkTitle: ref.linkTitle || ref.title || "",
      notes: ref.description || "",
      category: ref.category || "",
    });
  };

  // ── Render ──

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading references...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header & Stats ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
            </span>
            References & Inspirations
          </h2>
          <p className="text-gray-500 mt-1">
            {total} {total === 1 ? "reference" : "references"} saved for this
            project
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddMode("link")}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-xl"
          >
            <Link2 className="w-4 h-4 mr-1.5" />
            Add Link
          </Button>
          <Button
            onClick={() => setAddMode("upload")}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-xl"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Upload File
          </Button>
          <Button
            onClick={() => setAddMode("quotation")}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl"
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            Upload Quotation
          </Button>
        </div>
      </div>

      {/* ── Upload Quotation Modal ── */}
      {addMode === "quotation" && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Upload Quotation
                    </h3>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel documents
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAddMode(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Drop zone */}
                <div
                  onClick={() => quotationFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all"
                >
                  {quotationFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        {quotationFile.type === "application/pdf" ? (
                          <FileText className="w-5 h-5 text-red-600" />
                        ) : (
                          <File className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {quotationFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(quotationFile.size)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuotationFile(null);
                          if (quotationFileInputRef.current)
                            quotationFileInputRef.current.value = "";
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to select quotation document
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, DOCX, XLS, XLSX
                      </p>
                    </>
                  )}
                  <input
                    ref={quotationFileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setQuotationFile(file);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={quotationNotes}
                    onChange={(e) => setQuotationNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g., Revised quotation v2, includes GST..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setAddMode(null)}
                  disabled={isUploadingQuotation}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleUploadQuotation}
                  disabled={isUploadingQuotation}
                >
                  {isUploadingQuotation ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Receipt className="w-4 h-4 mr-2" />
                  )}
                  Upload Quotation
                </Button>
              </div>
            </div>
          </div>
        </div>,
      document.body)}

      {/* ── Category Pills ── */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({total})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() =>
                setCategoryFilter(categoryFilter === cat ? "all" : cat)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? "bg-orange-500 text-white"
                  : CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600"
              }`}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search references..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 min-w-[140px]"
        >
          <option value="all">All Types</option>
          {referenceTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-orange-50 text-orange-600" : "bg-white text-gray-400 hover:text-gray-600"}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-orange-50 text-orange-600" : "bg-white text-gray-400 hover:text-gray-600"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {filteredReferences.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
              ? "No matching references"
              : "No references yet"}
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
              ? "Try changing your search or filter criteria."
              : "Add design inspirations, Pinterest links, mood board images and documents for this project."}
          </p>
          {!searchQuery &&
            categoryFilter === "all" &&
            typeFilter === "all" && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => setAddMode("link")}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl"
                >
                  <Link2 className="w-4 h-4 mr-1.5" />
                  Add a Link
                </Button>
                <Button
                  onClick={() => setAddMode("upload")}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-xl"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload File
                </Button>
              </div>
            )}
        </div>
      )}

      {/* ── Grid View ── */}
      {filteredReferences.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReferences.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              onEdit={() => openEdit(ref)}
              onDelete={() => setDeletingId(ref.id)}
              onDownload={() => handleDownload(ref)}
              onPreview={() => setPreviewRef(ref)}
            />
          ))}
        </div>
      )}

      {/* ── List View ── */}
      {filteredReferences.length > 0 && viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReferences.map((ref) => (
                  <ReferenceRow
                    key={ref.id}
                    reference={ref}
                    onEdit={() => openEdit(ref)}
                    onDelete={() => setDeletingId(ref.id)}
                    onDownload={() => handleDownload(ref)}
                    onPreview={() => setPreviewRef(ref)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Link Modal ── */}
      {addMode === "link" && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Add Link Reference
                    </h3>
                    <p className="text-xs text-gray-500">
                      Pinterest, Instagram, websites
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAddMode(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={linkForm.linkUrl}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, linkUrl: e.target.value })
                    }
                    placeholder="https://pinterest.com/pin/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={linkForm.linkTitle}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, linkTitle: e.target.value })
                    }
                    placeholder="e.g., Modern Kitchen Idea"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={linkForm.category}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tags{" "}
                    <span className="text-gray-400 font-normal">
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={linkForm.tags}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, tags: e.target.value })
                    }
                    placeholder="modern, minimalist, white"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setAddMode(null)}
                  disabled={isAddingLink}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleAddLink}
                  disabled={isAddingLink}
                >
                  {isAddingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Add Link
                </Button>
              </div>
            </div>
          </div>
        </div>,
      document.body)}

      {/* ── Upload File Modal ── */}
      {addMode === "upload" && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Upload File
                    </h3>
                    <p className="text-xs text-gray-500">
                      Images, PDFs, documents
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAddMode(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                >
                  {uploadFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        {uploadFile.type.startsWith("image/") ? (
                          <Image className="w-5 h-5 text-orange-600" />
                        ) : uploadFile.type === "application/pdf" ? (
                          <FileText className="w-5 h-5 text-red-600" />
                        ) : (
                          <File className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.size)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to select a file
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG, WebP, PDF, DOC, XLSX
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadFile(file);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={uploadForm.notes}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, notes: e.target.value })
                    }
                    rows={2}
                    placeholder="Client likes this design..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tags{" "}
                    <span className="text-gray-400 font-normal">
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, tags: e.target.value })
                    }
                    placeholder="modern, minimalist"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setAddMode(null)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleUpload}
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>,
      document.body)}

      {/* ── Edit Modal ── */}
      {editingRef && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Edit Reference
                </h3>
                <button
                  onClick={() => setEditingRef(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.linkTitle}
                    onChange={(e) =>
                      setEditForm({ ...editForm, linkTitle: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingRef(null)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
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
        </div>,
      document.body)}

      {/* ── Delete Confirm ── */}
      {deletingId && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Delete Reference?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeletingId(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDelete}
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
        </div>,
      document.body)}

      {/* ── Preview Modal ── */}
      {previewRef && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${TYPE_COLORS[previewRef.referenceType] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                  >
                    {TYPE_ICONS[previewRef.referenceType]}
                    {previewRef.referenceType}
                  </span>
                  {previewRef.category && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${CATEGORY_COLORS[previewRef.category] || "bg-gray-100 text-gray-600"}`}
                    >
                      {previewRef.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPreviewRef(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {previewRef.linkTitle || previewRef.title || previewRef.fileName || "Untitled"}
              </h3>

              {previewRef.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {previewRef.description}
                </p>
              )}

              {/* Link URL */}
              {previewRef.linkUrl && (
                <a
                  href={previewRef.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors mb-4 text-sm"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{previewRef.linkUrl}</span>
                </a>
              )}

              {/* File info */}
              {previewRef.fileName && (
                <div className="p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {previewRef.fileName}
                      </span>
                    </div>
                    {previewRef.fileSize && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(previewRef.fileSize)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {previewRef.tags && previewRef.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {previewRef.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {previewRef.uploadedBy?.name || "Unknown"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(previewRef.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                {previewRef.linkUrl && (
                  <a
                    href={previewRef.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm">
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Open Link
                    </Button>
                  </a>
                )}
                {previewRef.fileName && (
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                    onClick={() => {
                      handleDownload(previewRef);
                      setPreviewRef(null);
                    }}
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>,
      document.body)}
    </div>
  );
};

// ─── Reference Card (Grid View) ──────────────────────────────────────────────

interface ReferenceItemProps {
  reference: ProjectReference;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
}

const ReferenceCard: React.FC<ReferenceItemProps> = ({
  reference,
  onEdit,
  onDelete,
  onDownload,
  onPreview,
}) => {
  const displayTitle =
    reference.linkTitle || reference.title || reference.fileName || "Untitled";
  const isLink = reference.referenceType === "LINK";

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group overflow-hidden">
      {/* Top colored bar */}
      <div
        className={`h-1.5 ${
          reference.referenceType === "LINK"
            ? "bg-blue-500"
            : reference.referenceType === "PHOTO"
              ? "bg-green-500"
              : reference.referenceType === "PDF"
                ? "bg-red-500"
                : "bg-purple-500"
        }`}
      />

      <div className="p-4">
        {/* Type badge & category */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${TYPE_COLORS[reference.referenceType] || "bg-gray-50 text-gray-600 border-gray-200"}`}
          >
            {TYPE_ICONS[reference.referenceType]}
            {reference.referenceType}
          </span>
          {reference.category && (
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold ${CATEGORY_COLORS[reference.category] || "bg-gray-100 text-gray-600"}`}
            >
              {reference.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h4
          className="font-bold text-gray-900 text-sm mb-1 truncate cursor-pointer hover:text-orange-600"
          onClick={onPreview}
          title={displayTitle}
        >
          {displayTitle}
        </h4>

        {/* URL preview for links */}
        {isLink && reference.linkUrl && (
          <a
            href={reference.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 truncate mb-2"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{reference.linkUrl}</span>
          </a>
        )}

        {/* File size */}
        {reference.fileSize && (
          <p className="text-xs text-gray-400 mb-2">
            {formatFileSize(reference.fileSize)}
          </p>
        )}

        {/* Description */}
        {reference.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            {reference.description}
          </p>
        )}

        {/* Tags */}
        {reference.tags && reference.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {reference.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded"
              >
                {tag}
              </span>
            ))}
            {reference.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">
                +{reference.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(reference.createdAt)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onPreview}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {isLink && reference.linkUrl && (
              <a
                href={reference.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                title="Open link"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              </a>
            )}
            {!isLink && (
              <button
                onClick={onDownload}
                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-3.5 h-3.5 text-green-500" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 className="w-3.5 h-3.5 text-orange-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Reference Row (List View) ───────────────────────────────────────────────

const ReferenceRow: React.FC<ReferenceItemProps> = ({
  reference,
  onEdit,
  onDelete,
  onDownload,
  onPreview,
}) => {
  const displayTitle =
    reference.linkTitle || reference.title || reference.fileName || "Untitled";
  const isLink = reference.referenceType === "LINK";

  return (
    <tr className="hover:bg-orange-50/30 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              reference.referenceType === "LINK"
                ? "bg-blue-100 text-blue-600"
                : reference.referenceType === "PHOTO"
                  ? "bg-green-100 text-green-600"
                  : reference.referenceType === "PDF"
                    ? "bg-red-100 text-red-600"
                    : "bg-purple-100 text-purple-600"
            }`}
          >
            {TYPE_ICONS[reference.referenceType]}
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-orange-600"
              onClick={onPreview}
            >
              {displayTitle}
            </p>
            {isLink && reference.linkUrl && (
              <a
                href={reference.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 truncate block max-w-[250px]"
              >
                {reference.linkUrl}
              </a>
            )}
            {reference.fileSize && (
              <span className="text-xs text-gray-400">
                {formatFileSize(reference.fileSize)}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${TYPE_COLORS[reference.referenceType] || "bg-gray-50 text-gray-600 border-gray-200"}`}
        >
          {TYPE_ICONS[reference.referenceType]}
          {reference.referenceType}
        </span>
      </td>
      <td className="px-4 py-3">
        {reference.category ? (
          <span
            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${CATEGORY_COLORS[reference.category] || "bg-gray-100 text-gray-600"}`}
          >
            {reference.category}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-xs text-gray-600">
            {formatDate(reference.createdAt)}
          </p>
          <p className="text-[10px] text-gray-400">
            {reference.uploadedBy?.name}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onPreview}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {isLink && reference.linkUrl && (
            <a
              href={reference.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              title="Open link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          )}
          {!isLink && (
            <button
              onClick={onDownload}
              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5 text-green-500" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5 text-orange-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
};
