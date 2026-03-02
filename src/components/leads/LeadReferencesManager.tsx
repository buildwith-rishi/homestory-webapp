import React, { useState } from "react";
import {
  Upload,
  Image,
  FileText,
  File,
  Link as LinkIcon,
  Video,
  Trash2,
  Plus,
  Calendar,
  Eye,
  ExternalLink,
  ChevronDown,
  Download,
} from "lucide-react";
import Spinner from "../ui/Spinner";
import { Button, Badge, Card } from "../ui";
import { LeadReference, ReferenceType } from "../../types";
import toast from "react-hot-toast";
import {
  uploadAttachment,
  deleteAttachment,
  getAttachment,
  fileToBase64,
  mimeToAttachmentType,
  AttachmentType,
} from "../../services/attachmentApi";

const ATTACHMENT_TYPES: { label: string; value: AttachmentType }[] = [
  { label: "Site Photo", value: "SITE_PHOTO" },
  { label: "Floor Plan", value: "FLOOR_PLAN" },
  { label: "3D Render", value: "RENDER_3D" },
  { label: "Quote PDF", value: "QUOTE_PDF" },
  { label: "BOQ", value: "BOQ" },
  { label: "Contract", value: "CONTRACT" },
  { label: "ID Proof", value: "ID_PROOF" },
  { label: "Other", value: "OTHER" },
];

interface LeadReferencesManagerProps {
  leadId: string;
  references: LeadReference[];
  onAddReference: (reference: Omit<LeadReference, "id" | "leadId" | "uploadedAt">) => void;
  onDeleteReference: (referenceId: string) => void;
  readOnly?: boolean;
}

export const LeadReferencesManager: React.FC<LeadReferencesManagerProps> = ({
  leadId,
  references,
  onAddReference,
  onDeleteReference,
  readOnly = false,
}) => {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LeadReference["category"]>("Inspiration");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<AttachmentType>("OTHER");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Open the file in a new tab. If url is already stored use it directly;
  // otherwise fetch the single attachment to get a fresh signed downloadUrl.
  const handleView = async (reference: LeadReference) => {
    if (reference.url) {
      window.open(reference.url, "_blank", "noopener,noreferrer");
      return;
    }
    // No URL stored — fetch on demand (list endpoint may not return downloadUrl)
    if (reference.id.startsWith("ref-")) return; // temp link id, nothing to fetch
    setViewingIds((prev) => new Set(prev).add(reference.id));
    try {
      const attachment = await getAttachment(reference.id);
      const url = attachment.downloadUrl || attachment.fileUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Download URL not available");
      }
    } catch {
      toast.error("Failed to fetch download URL");
    } finally {
      setViewingIds((prev) => {
        const next = new Set(prev);
        next.delete(reference.id);
        return next;
      });
    }
  };

  // Download the file. Fetches the attachment to get download URL and triggers download.
  const handleDownload = async (reference: LeadReference) => {
    if (reference.id.startsWith("ref-")) return; // temp link id, nothing to fetch
    
    setDownloadingIds((prev) => new Set(prev).add(reference.id));
    try {
      let url: string | undefined;
      
      // If URL is already stored, use it
      if (reference.url && reference.type !== ReferenceType.LINK) {
        url = reference.url;
      } else {
        // Otherwise fetch the attachment to get a fresh signed downloadUrl
        const attachment = await getAttachment(reference.id);
        url = attachment.downloadUrl || attachment.fileUrl;
      }
      
      if (!url) {
        toast.error("Download URL not available");
        return;
      }
      
      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = reference.fileName || reference.title || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(reference.id);
        return next;
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const attachmentType =
          selectedAttachmentType !== "OTHER"
            ? selectedAttachmentType
            : mimeToAttachmentType(file.type);

        const attachment = await uploadAttachment({
          entityType: "LEAD",
          entityId: leadId,
          attachmentType,
          fileName: file.name,
          fileType: file.type,
          fileBase64: base64,
        });

        // Derive ReferenceType from mime
        let refType: ReferenceType;
        let category: LeadReference["category"] = "Reference";
        if (file.type.startsWith("image/")) {
          refType = ReferenceType.IMAGE;
          category = "Inspiration";
        } else if (file.type === "application/pdf") {
          refType = ReferenceType.PDF;
          category = "Reference";
        } else if (file.type.startsWith("video/")) {
          refType = ReferenceType.VIDEO;
          category = "Inspiration";
        } else {
          refType = ReferenceType.DOCUMENT;
          category = "Reference";
        }

        onAddReference({
          type: refType,
          title: file.name,
          description: attachment.notes || `${attachmentType.replace(/_/g, " ")} — ${file.type}`,
          url: attachment.downloadUrl || attachment.fileUrl || "",
          fileSize: file.size,
          fileName: file.name,
          mimeType: file.type,
          category,
          uploadedBy: "Current User",
          tags: [attachmentType],
          // Store the real attachment id so we can delete it via API
          id: attachment.id,
        } as Omit<LeadReference, "leadId" | "uploadedAt">);

        toast.success(`${file.name} uploaded successfully!`);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    e.target.value = "";
  };

  const handleAddLink = () => {
    if (!linkUrl) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(linkUrl);

      onAddReference({
        type: ReferenceType.LINK,
        title: linkTitle || linkUrl,
        description: linkDescription,
        url: linkUrl,
        category: selectedCategory,
        uploadedBy: "Current User",
        tags: [],
      });

      toast.success("Link added successfully!");
      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");
      setIsAddingLink(false);
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleDelete = async (referenceId: string) => {
    setDeletingIds((prev) => new Set(prev).add(referenceId));
    try {
      // Only call the API if the id looks like a real UUID (not a temp ref-* id)
      if (!referenceId.startsWith("ref-")) {
        await deleteAttachment(referenceId);
      }
      onDeleteReference(referenceId);
      toast.success("Attachment deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete attachment");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(referenceId);
        return next;
      });
    }
  };

  const getIconForType = (type: ReferenceType) => {
    switch (type) {
      case ReferenceType.IMAGE:
        return <Image className="w-5 h-5" />;
      case ReferenceType.PDF:
        return <FileText className="w-5 h-5" />;
      case ReferenceType.VIDEO:
        return <Video className="w-5 h-5" />;
      case ReferenceType.LINK:
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "Inspiration":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Requirement":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Reference":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Competitor":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const groupedReferences = references.reduce((acc, ref) => {
    const category = ref.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(ref);
    return acc;
  }, {} as Record<string, LeadReference[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">References & Inspirations</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload images, documents, and links for reference
          </p>
        </div>
        <Badge variant="info" className="text-sm">
          {references.length} {references.length === 1 ? "file" : "files"}
        </Badge>
      </div>

      {/* Upload Area */}
      {!readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-orange-400 hover:bg-orange-50/30 transition-all">
            {/* Attachment type picker */}
            <div className="relative mb-3">
              <select
                value={selectedAttachmentType}
                onChange={(e) =>
                  setSelectedAttachmentType(e.target.value as AttachmentType)
                }
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              >
                {ATTACHMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,video/*"
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-sm">
                {isUploading ? (
                  <Spinner size="sm" color="brand" />
                ) : (
                  <Upload className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {isUploading ? "Uploading..." : "Upload Files"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Images, PDFs, Docs, Videos (Max 1GB)
                </p>
              </div>
            </label>
          </div>

          {/* Add Link */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
            <button
              onClick={() => setIsAddingLink(!isAddingLink)}
              className="w-full flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-sm">
                <LinkIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Add Link</p>
                <p className="text-xs text-gray-500 mt-1">
                  Pinterest, Houzz, Instagram, etc.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Add Link Form */}
      {isAddingLink && (
        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://pinterest.com/pin/..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Modern Kitchen Design"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <div className="flex gap-2">
                {["Inspiration", "Requirement", "Reference", "Competitor"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat as LeadReference["category"])}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? getCategoryColor(cat)
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Notes about this reference..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLink} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAddingLink(false);
                  setLinkUrl("");
                  setLinkTitle("");
                  setLinkDescription("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* References List */}
      {references.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No references added yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Upload files or add links to get started
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedReferences).map(([category, refs]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs ${getCategoryColor(category)}`}>
                  {category}
                </span>
                <span className="text-gray-400">({refs.length})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {refs.map((reference) => (
                  <Card
                    key={reference.id}
                    className="p-4 hover:shadow-lg transition-all group"
                  >
                    {/* Preview */}
                    {reference.type === ReferenceType.IMAGE && reference.thumbnailUrl ? (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                        <img
                          src={reference.thumbnailUrl}
                          alt={reference.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <div className="text-gray-400">
                          {getIconForType(reference.type)}
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1">
                          {reference.title}
                        </h5>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {reference.type === ReferenceType.LINK ? (
                            <a
                              href={reference.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                              title="Open link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <>
                              <button
                                onClick={() => handleView(reference)}
                                disabled={viewingIds.has(reference.id)}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50"
                                title="View"
                              >
                                {viewingIds.has(reference.id) ? (
                                  <Spinner size="xs" color="muted" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDownload(reference)}
                                disabled={downloadingIds.has(reference.id)}
                                className="p-1.5 hover:bg-green-100 rounded text-green-600 disabled:opacity-50"
                                title="Download"
                              >
                                {downloadingIds.has(reference.id) ? (
                                  <Spinner size="xs" color="muted" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => handleDelete(reference.id)}
                              disabled={deletingIds.has(reference.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-red-600 disabled:opacity-50"
                            >
                              {deletingIds.has(reference.id) ? (
                                <Spinner size="xs" color="muted" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {reference.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {reference.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          {getIconForType(reference.type)}
                          {reference.fileSize && formatFileSize(reference.fileSize)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(reference.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
