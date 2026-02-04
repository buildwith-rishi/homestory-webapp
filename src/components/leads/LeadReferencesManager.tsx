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
} from "lucide-react";
import { Button, Badge, Card } from "../ui";
import { LeadReference, ReferenceType } from "../../types";
import toast from "react-hot-toast";

interface LeadReferencesManagerProps {
  leadId: string;
  references: LeadReference[];
  onAddReference: (reference: Omit<LeadReference, "id" | "leadId" | "uploadedAt">) => void;
  onDeleteReference: (referenceId: string) => void;
  readOnly?: boolean;
}

export const LeadReferencesManager: React.FC<LeadReferencesManagerProps> = ({
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        // Determine reference type based on file type
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

        // TODO: Upload to actual storage service (S3, Firebase, etc.)
        // For now, create a mock URL
        const mockUrl = URL.createObjectURL(file);

        onAddReference({
          type: refType,
          title: file.name,
          description: `Uploaded ${file.type}`,
          url: mockUrl,
          thumbnailUrl: file.type.startsWith("image/") ? mockUrl : undefined,
          fileSize: file.size,
          fileName: file.name,
          mimeType: file.type,
          category: category,
          uploadedBy: "Current User", // TODO: Get from auth context
          tags: [],
        });

        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleAddLink = () => {
    if (!linkUrl) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(linkUrl); // Validate URL
      
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
    } catch (error) {
      toast.error("Please enter a valid URL");
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
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-orange-400 hover:bg-orange-50/30 transition-all">
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
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-sm">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-7 h-7 text-orange-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {isUploading ? "Uploading..." : "Upload Files"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Images, PDFs, Docs, Videos (Max 10MB)
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
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => onDeleteReference(reference.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
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
