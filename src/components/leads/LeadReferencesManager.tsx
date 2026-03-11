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
import { Button, Badge } from "../ui";
import { LeadReference, ReferenceType } from "../../types";
import toast from "react-hot-toast";
import {
  uploadAttachment,
  createAttachmentWithUrl,
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
  onAddReference: (
    reference: Omit<LeadReference, "id" | "leadId" | "uploadedAt">,
  ) => void;
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
  const [selectedCategory, setSelectedCategory] =
    useState<LeadReference["category"]>("Inspiration");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachmentType, setSelectedAttachmentType] =
    useState<AttachmentType>("OTHER");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

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

  const handleAddLink = async () => {
    if (!linkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    if (!linkTitle.trim()) {
      toast.error("Please enter a title for the link");
      return;
    }

    setIsAddingLink(true);
    try {
      const attachment = await createAttachmentWithUrl({
        entityType: "LEAD",
        entityId: leadId,
        attachmentType: selectedAttachmentType,
        fileName: linkTitle.trim(),
        fileType: "text/uri-list",
        storageUrl: linkUrl.trim(),
      });

      // Resolve the best URL to use for opening the link
      const resolvedUrl =
        attachment.downloadUrl ||
        attachment.storageUrl ||
        attachment.fileUrl ||
        linkUrl.trim();

      onAddReference({
        type: ReferenceType.LINK,
        title: linkTitle.trim(),
        description: linkUrl.trim(),
        url: resolvedUrl,
        fileName: linkTitle.trim(),
        mimeType: "text/uri-list",
        category: "Reference",
        uploadedBy: "Current User",
        tags: [selectedAttachmentType],
        id: attachment.id,
      } as Omit<LeadReference, "leadId" | "uploadedAt">);

      toast.success("Link added successfully!");
      setLinkTitle("");
      setLinkUrl("");
    } catch (err) {
      console.error("Add link error:", err);
      toast.error("Failed to add link");
    } finally {
      setIsAddingLink(false);
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
          description:
            attachment.notes ||
            `${attachmentType.replace(/_/g, " ")} — ${file.type}`,
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

  const getIconBg = (type: ReferenceType) => {
    switch (type) {
      case ReferenceType.IMAGE:
        return "bg-purple-100 text-purple-600";
      case ReferenceType.PDF:
        return "bg-red-100 text-red-600";
      case ReferenceType.VIDEO:
        return "bg-blue-100 text-blue-600";
      case ReferenceType.LINK:
        return "bg-indigo-100 text-indigo-600";
      default:
        return "bg-amber-100 text-amber-600";
    }
  };

  const getTypeLabel = (reference: LeadReference) => {
    if (reference.tags?.[0]) return reference.tags[0].replace(/_/g, " ");
    if (reference.mimeType) {
      if (reference.mimeType.startsWith("image/")) return "IMAGE";
      if (reference.mimeType === "application/pdf") return "PDF";
      if (reference.mimeType.startsWith("video/")) return "VIDEO";
      if (reference.mimeType === "text/uri-list") return "LINK";
    }
    return "FILE";
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

  const groupedReferences = references.reduce(
    (acc, ref) => {
      const category = ref.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(ref);
      return acc;
    },
    {} as Record<string, LeadReference[]>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            References & Inspirations
          </h3>
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
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-sm">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Add Link</p>
            </div>
            <input
              type="text"
              placeholder="Link title"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="w-full pl-3 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              className="w-full pl-3 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={handleAddLink}
              disabled={isAddingLink || !linkUrl.trim() || !linkTitle.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAddingLink ? (
                <Spinner size="xs" color="brand" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isAddingLink ? "Adding..." : "Add Link"}
            </button>
          </div>
        </div>
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
                <span
                  className={`px-2.5 py-1 rounded-full text-xs ${getCategoryColor(category)}`}
                >
                  {category}
                </span>
                <span className="text-gray-400">({refs.length})</span>
              </h4>
              <div className="flex flex-col gap-2">
                {refs.map((reference) => (
                  <div
                    key={reference.id}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    {/* Icon badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(reference.type)}`}
                    >
                      {getIconForType(reference.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
                        {reference.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                          {getTypeLabel(reference)}
                        </span>
                        {reference.fileSize && (
                          <>
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-[10px] text-gray-400">
                              {formatFileSize(reference.fileSize)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(reference.uploadedAt).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-gray-100 flex-shrink-0" />

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {reference.type === ReferenceType.LINK ? (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <>
                          <button
                            onClick={() => handleView(reference)}
                            disabled={viewingIds.has(reference.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"
                            title="View"
                          >
                            {viewingIds.has(reference.id) ? (
                              <Spinner size="xs" color="muted" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownload(reference)}
                            disabled={downloadingIds.has(reference.id)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-40 transition-colors"
                            title="Download"
                          >
                            {downloadingIds.has(reference.id) ? (
                              <Spinner size="xs" color="muted" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => handleDelete(reference.id)}
                          disabled={deletingIds.has(reference.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-40 transition-colors"
                          title="Delete"
                        >
                          {deletingIds.has(reference.id) ? (
                            <Spinner size="xs" color="muted" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
