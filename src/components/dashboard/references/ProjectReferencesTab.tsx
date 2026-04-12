import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
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
  Grid3X3,
  List,
  Calendar,
  User,
  Globe,
  Eye,
  Receipt,
} from "lucide-react";
import { SectionLoader } from "../../ui";
import { Button } from "../../ui";
import { MeetingLinkEntitySelect } from "../MeetingLinkEntitySelect";
import toast from "react-hot-toast";
import type { ProjectReference } from "../../../types";
import {
  getProjectReferences,
  getProjectReference,
  addLinkReference,
  uploadFileReference,
  updateProjectReference,
  deleteProjectReference,
  downloadProjectReference,
  getReferenceTypes,
} from "../../../services/projectApi";
import type { OptionItemWithDescription } from "../../../types";
import {
  listAttachments,
  getAttachment,
  type Attachment,
} from "../../../services/attachmentApi";
import { getCustomerById } from "../../../services/customerApi";
import type { Customer } from "../../../types/customer";

/** Same lead resolution as CustomerDetails when loading references. */
function resolveLeadIdFromCustomerRecord(customer: Customer): string {
  const extra = customer as Customer & {
    leadId?: string | null;
    lead?: { id?: string };
  };
  return (
    extra.convertedFromLeadId?.trim() ||
    customer.convertedFromLead?.id?.trim() ||
    extra.leadId?.trim() ||
    extra.lead?.id?.trim() ||
    ""
  );
}

/** Rows mirrored from customer attachment APIs (not editable as project references). */
export type ReferenceRow = ProjectReference & {
  inheritSource?: "lead" | "account";
  sourceAttachmentId?: string;
};

function attachmentToReferenceRow(
  a: Attachment,
  projectId: string,
  source: "lead" | "account",
): ReferenceRow {
  const refType =
    a.fileType?.startsWith("image/")
      ? "PHOTO"
      : a.fileType === "application/pdf"
        ? "PDF"
        : "DOCUMENT";
  const url =
    a.downloadUrl || a.fileUrl || a.storageUrl || a.url || null;
  const iso = a.createdAt || a.uploadedAt || new Date().toISOString();
  return {
    id: `inherited-${source}-${a.id}`,
    projectId,
    referenceType: refType,
    fileName: a.fileName,
    fileType: a.fileType,
    fileSize: a.fileSize ?? null,
    storageUrl: a.storageUrl ?? a.fileUrl ?? null,
    downloadUrl: url,
    linkUrl: null,
    linkTitle: null,
    title: a.fileName,
    description: a.notes ?? null,
    notes: a.notes ?? null,
    category: "REFERENCES",
    subCategory: null,
    tags: [],
    uploadedById: a.uploadedByUser?.id ?? "",
    createdAt: iso,
    updatedAt: a.updatedAt || iso,
    uploadedBy: {
      id: a.uploadedByUser?.id ?? "",
      name: a.uploadedByUser?.name ?? "",
    },
    inheritSource: source,
    sourceAttachmentId: a.id,
  };
}

function isInheritedRef(ref: ReferenceRow): boolean {
  return ref.inheritSource === "lead" || ref.inheritSource === "account";
}

function getInheritedAttachmentId(ref: ReferenceRow): string | null {
  if (!isInheritedRef(ref)) return null;
  if (ref.sourceAttachmentId) return ref.sourceAttachmentId;
  const match = ref.id.match(/^inherited-(?:lead|account)-(.+)$/);
  return match?.[1] || null;
}

interface ProjectReferencesTabProps {
  projectId: string;
  /** Linked customer account — used to resolve leadId and to load ACCOUNT attachments. */
  accountId?: string | null;
  /** Lead id on the project; if missing, resolved from the customer record when accountId is set. */
  leadId?: string | null;
}

type ViewMode = "grid" | "list";
type AddMode = "link" | "upload" | "quotation" | null;

const CATEGORY_COLORS: Record<string, string> = {
  Quotation: "bg-emerald-100 text-emerald-800",
  REFERENCES: "bg-blue-100 text-blue-700",
  ESTIMATION_VALUE: "bg-amber-100 text-amber-700",
  DESIGN_PRESENTATION: "bg-violet-100 text-violet-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  Quotation: "Quotation",
  REFERENCES: "References",
  ESTIMATION_VALUE: "Estimation Value",
  DESIGN_PRESENTATION: "Design Presentation",
};

const getCategoryLabel = (cat: string | null): string =>
  cat ? (CATEGORY_LABELS[cat] ?? cat) : "";

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

const getReferenceNotes = (reference: ReferenceRow): string => {
  const text = [reference.notes, reference.description].find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return text?.trim() || "";
};

function splitCommaTags(s: string): string[] {
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

const QUOTATION_TAG = "quotation";

function isQuotationCategory(cat: string | null | undefined): boolean {
  return (cat || "").trim().toLowerCase() === "quotation";
}

/** Ensures quotation uploads stay identifiable via tags (API category is also "Quotation"). */
function ensureQuotationTag(tags: string[]): string[] {
  const normalized = tags.map((t) => t.trim()).filter(Boolean);
  if (normalized.some((t) => t.toLowerCase() === QUOTATION_TAG)) {
    return normalized;
  }
  return [QUOTATION_TAG, ...normalized];
}

/** Dedupe case-insensitively; preserve first-seen casing; sort A–Z. */
function uniqueReferenceTagsFromList(refs: ReferenceRow[]): string[] {
  const seen = new Map<string, string>();
  for (const ref of refs) {
    for (const raw of ref.tags || []) {
      const t = typeof raw === "string" ? raw.trim() : "";
      if (!t) continue;
      const key = t.toLowerCase();
      if (!seen.has(key)) seen.set(key, t);
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

const REFERENCE_CATEGORIES: { value: string; label: string }[] = [
  { value: "REFERENCES", label: "References" },
  { value: "ESTIMATION_VALUE", label: "Estimation Value" },
  { value: "DESIGN_PRESENTATION", label: "Design Presentation" },
];

const REFERENCE_SUBCATEGORIES: { value: string; label: string }[] = [
  { value: "Living Room", label: "Living Room" },
  { value: "Bedroom", label: "Bedroom" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "Bathroom", label: "Bathroom" },
  { value: "Dining Room", label: "Dining Room" },
  { value: "Study/Office", label: "Study/Office" },
  { value: "Kids Room", label: "Kids Room" },
  { value: "Balcony/Terrace", label: "Balcony/Terrace" },
  { value: "Entryway/Foyer", label: "Entryway/Foyer" },
  { value: "Color Palette", label: "Color Palette" },
  { value: "Furniture Style", label: "Furniture Style" },
  { value: "Lighting", label: "Lighting" },
  { value: "Flooring", label: "Flooring" },
  { value: "Wall Treatment", label: "Wall Treatment" },
  { value: "Storage", label: "Storage" },
  { value: "Outdoor", label: "Outdoor" },
  { value: "General Inspiration", label: "General Inspiration" },
  { value: "Other", label: "Other" },
];

export const ProjectReferencesTab: React.FC<ProjectReferencesTabProps> = ({
  projectId,
  accountId,
  leadId,
}) => {
  const [references, setReferences] = useState<ReferenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [referenceTypes, setReferenceTypes] = useState<
    OptionItemWithDescription[]
  >([]);

  // Add link form
  const [linkForm, setLinkForm] = useState({
    linkUrl: "",
    linkTitle: "",
    category: "",
    subCategory: "",
    tags: "",
  });
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Upload form (multiple files share category, notes, tags)
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadForm, setUploadForm] = useState({
    category: "",
    subCategory: "",
    notes: "",
    tags: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quotation upload
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [quotationNotes, setQuotationNotes] = useState("");
  const [quotationTags, setQuotationTags] = useState("");
  const [isUploadingQuotation, setIsUploadingQuotation] = useState(false);
  const quotationFileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editingRef, setEditingRef] = useState<ReferenceRow | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    notes: "",
    category: "",
    subCategory: "",
    linkUrl: "",
    linkTitle: "",
    tags: "",
  });
  const [editReplaceFile, setEditReplaceFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const subCategorySelectOptions = useMemo(() => {
    const base = REFERENCE_SUBCATEGORIES.map((s) => ({
      id: s.value,
      title: s.label,
    }));
    const cur = editForm.subCategory?.trim();
    if (cur && !base.some((o) => o.id === cur)) {
      return [{ id: cur, title: cur }, ...base];
    }
    return base;
  }, [editForm.subCategory]);

  /** Includes Quotation (upload-quotation flow) plus standard reference categories. */
  const referenceCategoryEditOptions = useMemo(
    () => [
      { id: "Quotation", title: "Quotation" },
      ...REFERENCE_CATEGORIES.map((c) => ({
        id: c.value,
        title: c.label,
      })),
    ],
    [],
  );

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview
  const [previewRef, setPreviewRef] = useState<ReferenceRow | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // ── Fetch references: project API + customer lead & account attachments ──
  const fetchReferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const accountIdTrim = accountId?.trim() || "";
      let leadIdTrim = leadId?.trim() || "";

      // When a customer is linked, their record is the source of truth for lead-phase files
      // (same as Customer → References). Also fills leadId when the project only had account set.
      if (accountIdTrim) {
        try {
          const customer = await getCustomerById(accountIdTrim);
          const fromCustomer = resolveLeadIdFromCustomerRecord(customer);
          if (fromCustomer) {
            leadIdTrim = fromCustomer;
          }
        } catch (e) {
          console.warn(
            "Could not load customer for project references (lead/account files):",
            e,
          );
        }
      }

      const [projectRes, leadAtts, accountAtts] = await Promise.all([
        getProjectReferences(projectId),
        leadIdTrim
          ? listAttachments("LEAD", leadIdTrim, 200).catch((e) => {
              console.warn("Lead attachments for project references:", e);
              return [] as Attachment[];
            })
          : Promise.resolve([] as Attachment[]),
        accountIdTrim
          ? listAttachments("ACCOUNT", accountIdTrim, 200).catch((e) => {
              console.warn("Account attachments for project references:", e);
              return [] as Attachment[];
            })
          : Promise.resolve([] as Attachment[]),
      ]);

      const projectRefs: ReferenceRow[] = (projectRes.references || []).map(
        (r) => ({ ...r }),
      );

      const seenAttachmentIds = new Set<string>();
      const inherited: ReferenceRow[] = [];

      for (const a of leadAtts.filter((x) => x.entityId === leadIdTrim)) {
        if (seenAttachmentIds.has(a.id)) continue;
        seenAttachmentIds.add(a.id);
        inherited.push(attachmentToReferenceRow(a, projectId, "lead"));
      }
      for (const a of accountAtts.filter((x) => x.entityId === accountIdTrim)) {
        if (seenAttachmentIds.has(a.id)) continue;
        seenAttachmentIds.add(a.id);
        inherited.push(attachmentToReferenceRow(a, projectId, "account"));
      }

      const merged: ReferenceRow[] = [...inherited, ...projectRefs];
      setReferences(merged);
      setTotal(merged.length);
    } catch (error) {
      console.error("Error fetching references:", error);
      toast.error("Failed to load references");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, accountId, leadId]);

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

  const uniqueReferenceTags = useMemo(
    () => uniqueReferenceTagsFromList(references),
    [references],
  );

  useEffect(() => {
    if (tagFilter === "all") return;
    const stillValid = uniqueReferenceTags.some(
      (t) => t.toLowerCase() === tagFilter.toLowerCase(),
    );
    if (!stillValid) setTagFilter("all");
  }, [uniqueReferenceTags, tagFilter]);

  // ── Filter references ──
  const filteredReferences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return references.filter((ref) => {
      const matchesSearch =
        !q ||
        (ref.linkTitle || "").toLowerCase().includes(q) ||
        (ref.title || "").toLowerCase().includes(q) ||
        (ref.fileName || "").toLowerCase().includes(q) ||
        (ref.linkUrl || "").toLowerCase().includes(q) ||
        (ref.category || "").toLowerCase().includes(q) ||
        (ref.tags || []).some((t) =>
          (t || "").toLowerCase().includes(q),
        );
      const matchesCategory =
        categoryFilter === "all" || ref.category === categoryFilter;
      const matchesType =
        typeFilter === "all" || ref.referenceType === typeFilter;
      const matchesTag =
        tagFilter === "all" ||
        (ref.tags || []).some(
          (t) =>
            (t || "").trim().toLowerCase() === tagFilter.trim().toLowerCase(),
        );
      return matchesSearch && matchesCategory && matchesType && matchesTag;
    });
  }, [
    references,
    searchQuery,
    categoryFilter,
    typeFilter,
    tagFilter,
  ]);

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
        subCategory: linkForm.subCategory || undefined,
        tags,
      });
      toast.success("Link reference added!");
      setLinkForm({
        linkUrl: "",
        linkTitle: "",
        category: "",
        subCategory: "",
        tags: "",
      });
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

  // ── Upload file reference(s) ──
  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !uploadForm.category) {
      toast.error("Please select at least one file and a category");
      return;
    }
    const tags = splitCommaTags(uploadForm.tags);
    const tagsOpt = tags.length > 0 ? tags : undefined;
    const notes = uploadForm.notes || undefined;
    const sub = uploadForm.subCategory || undefined;
    const cat = uploadForm.category;
    const total = uploadFiles.length;

    setIsUploading(true);
    const failed: { name: string; message: string }[] = [];
    let ok = 0;

    for (const file of uploadFiles) {
      try {
        await uploadFileReference(
          projectId,
          file,
          cat,
          notes,
          tagsOpt,
          sub,
        );
        ok++;
      } catch (error) {
        failed.push({
          name: file.name,
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    setIsUploading(false);

    const resetUploadForm = () => {
      setUploadFiles([]);
      setUploadForm({ category: "", subCategory: "", notes: "", tags: "" });
      setAddMode(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (ok === total) {
      toast.success(
        total === 1
          ? "File uploaded successfully!"
          : `${total} files uploaded successfully!`,
      );
      resetUploadForm();
      fetchReferences();
      return;
    }

    if (ok > 0) {
      toast.success(`${ok} of ${total} file(s) uploaded.`);
      const detail =
        failed.length <= 2
          ? failed.map((f) => `${f.name}: ${f.message}`).join(" · ")
          : `${failed.length} failed (e.g. ${failed[0].name})`;
      toast.error(detail);
      resetUploadForm();
      fetchReferences();
      return;
    }

    toast.error(
      failed.length === 1
        ? failed[0].message
        : `Failed to upload ${failed.length} file(s).`,
    );
  };

  // ── Upload quotation ──
  const handleUploadQuotation = async () => {
    if (!quotationFile) {
      toast.error("Please select a quotation document");
      return;
    }
    setIsUploadingQuotation(true);
    try {
      const tags = ensureQuotationTag(splitCommaTags(quotationTags));
      await uploadFileReference(
        projectId,
        quotationFile,
        "Quotation",
        quotationNotes || undefined,
        tags,
      );
      toast.success("Quotation uploaded successfully!");
      setQuotationFile(null);
      setQuotationNotes("");
      setQuotationTags("");
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

  const closeEditModal = () => {
    setEditingRef(null);
    setEditReplaceFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  // ── Update reference ──
  const handleSaveEdit = async () => {
    if (!editingRef) return;
    if (isInheritedRef(editingRef)) {
      toast.error(
        "This file is managed on the customer profile. Edit it there.",
      );
      return;
    }

    if (editingRef.referenceType === "LINK") {
      if (!editForm.linkUrl || !editForm.linkTitle || !editForm.category) {
        toast.error("Please fill in URL, link title, and category");
        return;
      }
    } else {
      if (!editForm.category) {
        toast.error("Please fill in category");
        return;
      }
    }

    let tags = splitCommaTags(editForm.tags);
    if (isQuotationCategory(editForm.category)) {
      tags = ensureQuotationTag(tags);
    }
    const categoryValue =
      editForm.category || editingRef.category || "REFERENCES";

    setIsSavingEdit(true);
    try {
      if (editReplaceFile && editingRef.referenceType !== "LINK") {
        const uploadNotes =
          editForm.description.trim() ||
          editForm.notes.trim() ||
          undefined;
        const newRef = await uploadFileReference(
          projectId,
          editReplaceFile,
          categoryValue,
          uploadNotes,
          tags.length > 0 ? tags : undefined,
          editForm.subCategory || undefined,
        );
        await updateProjectReference(projectId, newRef.id, {
          title: editForm.title.trim() || undefined,
          description: editForm.description || undefined,
          notes: editForm.notes || undefined,
          category: editForm.category || undefined,
          subCategory: editForm.subCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
        await deleteProjectReference(projectId, editingRef.id);
        toast.success("Reference updated!");
        closeEditModal();
        fetchReferences();
        return;
      }

      const titleForLink =
        editForm.title.trim() || editForm.linkTitle.trim() || undefined;

      await updateProjectReference(projectId, editingRef.id, {
        ...(editingRef.referenceType === "LINK"
          ? {
              linkUrl: editForm.linkUrl,
              linkTitle: editForm.linkTitle,
              title: titleForLink,
            }
          : {
              title: editForm.title.trim() || undefined,
            }),
        description: editForm.description || undefined,
        notes: editForm.notes || undefined,
        category: editForm.category || undefined,
        subCategory: editForm.subCategory || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      toast.success("Reference updated!");
      closeEditModal();
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
    const target = references.find((r) => r.id === deletingId);
    if (target && isInheritedRef(target)) {
      toast.error(
        "This file is linked from the customer record. Manage it from the customer profile.",
      );
      setDeletingId(null);
      return;
    }
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
  const handleDownload = async (ref: ReferenceRow) => {
    if (isInheritedRef(ref)) {
      try {
        const attachmentId = getInheritedAttachmentId(ref);
        if (!attachmentId) {
          toast.error("Attachment id not found");
          return;
        }
        const fresh = await getAttachment(attachmentId);
        const fileUrl =
          fresh.downloadUrl || fresh.url || fresh.fileUrl || fresh.storageUrl;
        if (!fileUrl) {
          toast.error("File URL not available for this attachment");
          return;
        }
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = fresh.fileName || ref.fileName || `reference-${ref.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to download",
        );
        return;
      }
    }

    if (ref.downloadUrl) {
      const a = document.createElement("a");
      a.href = ref.downloadUrl;
      a.download = ref.fileName || `reference-${ref.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

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

  // ── View file in new tab (uses authenticated download endpoint) ──
  const handleViewFile = async (ref: ReferenceRow) => {
    if (isInheritedRef(ref)) {
      try {
        const attachmentId = getInheritedAttachmentId(ref);
        if (!attachmentId) {
          toast.error("Attachment id not found");
          return;
        }
        // Required flow: always resolve a fresh signed URL per attachment id.
        const fresh = await getAttachment(attachmentId);
        const fileUrl =
          fresh.downloadUrl || fresh.url || fresh.fileUrl || fresh.storageUrl;
        if (!fileUrl) {
          toast.error("File URL not available for this attachment");
          return;
        }
        const win = window.open(fileUrl, "_blank");
        if (!win) {
          toast.error("Please allow popups to view this file.");
        }
        return;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to open file",
        );
        return;
      }
    }

    if (ref.downloadUrl) {
      window.open(ref.downloadUrl, "_blank");
      return;
    }

    try {
      const blob = await downloadProjectReference(projectId, ref.id);
      const url = window.URL.createObjectURL(blob);
      const newTab = window.open(url, "_blank");
      // Revoke after a delay to give the browser time to load the file
      if (newTab) {
        setTimeout(() => window.URL.revokeObjectURL(url), 30000);
      } else {
        window.URL.revokeObjectURL(url);
        toast.error("Please allow popups to view this file.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to open file",
      );
    }
  };

  const openEdit = (ref: ReferenceRow) => {
    if (isInheritedRef(ref)) {
      toast.error(
        "Lead-phase files are edited from the customer profile.",
      );
      return;
    }
    setEditingRef(ref);
    setEditReplaceFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setEditForm({
      title:
        ref.title ||
        ref.linkTitle ||
        ref.fileName ||
        "",
      description: ref.description || "",
      notes: ref.notes || "",
      category: ref.category || "",
      subCategory: ref.subCategory || "",
      linkUrl: ref.linkUrl || "",
      linkTitle: ref.linkTitle || ref.title || "",
      tags: ref.tags && ref.tags.length > 0 ? ref.tags.join(", ") : "",
    });
  };

  const handleOpenPreview = async (ref: ReferenceRow) => {
    setPreviewRef(ref);
    setIsLoadingPreview(true);
    if (isInheritedRef(ref)) {
      setIsLoadingPreview(false);
      return;
    }
    try {
      const fullReference = await getProjectReference(projectId, ref.id);
      setPreviewRef(fullReference as ReferenceRow);
    } catch {
      // Keep existing reference snapshot if detail fetch fails.
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ── Render ──

  if (isLoading) {
    return <SectionLoader message="Loading references..." />;
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
            {total} {total === 1 ? "reference" : "references"} for this project
            {references.some((r) => isInheritedRef(r)) && (
              <span className="text-gray-400">
                {" "}
                (includes files from the linked customer / lead)
              </span>
            )}
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
      {addMode === "quotation" &&
        createPortal(
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tags{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated, optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={quotationTags}
                      onChange={(e) => setQuotationTags(e.target.value)}
                      placeholder="e.g., v2, GST, kitchen package"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Saved as category{" "}
                      <span className="font-medium text-gray-700">Quotation</span>
                      . The tag{" "}
                      <span className="font-medium text-gray-700">quotation</span>{" "}
                      is always added so these files are easy to filter.
                    </p>
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
          document.body,
        )}

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
              {getCategoryLabel(cat)} ({count})
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

        <div className="flex flex-wrap gap-2 sm:items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 min-w-[140px] flex-1 sm:flex-initial"
            aria-label="Filter by reference type"
          >
            <option value="all">All types</option>
            {referenceTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-500 min-w-[160px] flex-1 sm:flex-initial max-w-full"
            aria-label="Filter by tag"
          >
            <option value="all">All tags</option>
            {uniqueReferenceTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

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
            {searchQuery ||
            categoryFilter !== "all" ||
            typeFilter !== "all" ||
            tagFilter !== "all"
              ? "No matching references"
              : "No references yet"}
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            {searchQuery ||
            categoryFilter !== "all" ||
            typeFilter !== "all" ||
            tagFilter !== "all"
              ? "Try changing your search or filter criteria."
              : "Add design inspirations, Pinterest links, mood board images and documents for this project."}
          </p>
          {!searchQuery &&
            categoryFilter === "all" &&
            typeFilter === "all" &&
            tagFilter === "all" && (
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
              onViewFile={() => handleViewFile(ref)}
              onPreview={() => handleOpenPreview(ref)}
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
                    onViewFile={() => handleViewFile(ref)}
                    onPreview={() => handleOpenPreview(ref)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Link Modal ── */}
      {addMode === "link" &&
        createPortal(
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
                      {REFERENCE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sub Category{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <select
                      value={linkForm.subCategory}
                      onChange={(e) =>
                        setLinkForm({
                          ...linkForm,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Select sub category</option>
                      {REFERENCE_SUBCATEGORIES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
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
          document.body,
        )}

      {/* ── Upload File Modal ── */}
      {addMode === "upload" &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 pb-4 shrink-0 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">
                        Upload File
                      </h3>
                      <p className="text-xs text-gray-500">
                        Images, PDFs, documents — multiple files at once
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddMode(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 [scrollbar-gutter:stable]">
                  {/* Drop zone + file list */}
                  <div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to add files
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG, WebP, PDF, DOC, XLSX — hold Ctrl/Cmd to pick
                        several
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const picked = Array.from(e.target.files || []);
                        if (picked.length === 0) return;
                        setUploadFiles((prev) => {
                          const next = [...prev];
                          for (const f of picked) {
                            const dup = next.some(
                              (x) =>
                                x.name === f.name &&
                                x.size === f.size &&
                                x.lastModified === f.lastModified,
                            );
                            if (!dup) next.push(f);
                          }
                          return next;
                        });
                        e.target.value = "";
                      }}
                    />
                    {uploadFiles.length > 0 && (
                      <ul className="mt-3 max-h-36 sm:max-h-44 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {uploadFiles.map((file, index) => (
                          <li
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            className="flex items-center gap-3 px-3 py-2.5 bg-white first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                              {file.type.startsWith("image/") ? (
                                <Image className="w-4 h-4 text-orange-600" />
                              ) : file.type === "application/pdf" ? (
                                <FileText className="w-4 h-4 text-red-600" />
                              ) : (
                                <File className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadFiles((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="p-1.5 hover:bg-gray-100 rounded-lg shrink-0"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {uploadFiles.length > 1 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {uploadFiles.length} files — same category, notes, and
                        tags apply to each.
                      </p>
                    )}
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
                      {REFERENCE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sub Category{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <select
                      value={uploadForm.subCategory}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    >
                      <option value="">Select sub category</option>
                      {REFERENCE_SUBCATEGORIES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
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

              <div className="p-6 pt-4 shrink-0 border-t border-gray-100 flex gap-3 bg-white">
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
                    disabled={isUploading || uploadFiles.length === 0}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploadFiles.length > 1
                      ? `Upload (${uploadFiles.length})`
                      : "Upload"}
                  </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Edit Modal ── */}
      {editingRef &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 pb-4 shrink-0 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {editingRef.referenceType === "LINK" && (
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Link2 className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    {editingRef.referenceType === "PHOTO" && (
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Image className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    {editingRef.referenceType === "PDF" && (
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                    {editingRef.referenceType === "DOCUMENT" && (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5 text-amber-700" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">
                        Edit Reference
                      </h3>
                      {editingRef.referenceType === "LINK" ? (
                        <p className="text-xs text-gray-500">
                          Link URL, titles, description, tags, and category
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 truncate">
                          {editingRef.fileName || "File reference"}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
                {editingRef.referenceType === "LINK" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={editForm.linkUrl}
                        onChange={(e) =>
                          setEditForm({ ...editForm, linkUrl: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Link title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.linkTitle}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            linkTitle: e.target.value,
                          })
                        }
                        placeholder="Short label for the link"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Display title{" "}
                        <span className="text-gray-400 font-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        placeholder="Same as link title if empty"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                  </>
                )}

                {editingRef.referenceType !== "LINK" && (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Current file
                      </p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {editingRef.fileName || "—"}
                      </p>
                      {editingRef.fileSize != null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatFileSize(editingRef.fileSize)}
                        </p>
                      )}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Replace file
                        </label>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setEditReplaceFile(f);
                          }}
                        />
                        {editReplaceFile && (
                          <p className="text-xs text-orange-700 mt-2">
                            New file: {editReplaceFile.name} — saving will
                            upload this and remove the previous file.
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        placeholder="Name shown in the list"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <MeetingLinkEntitySelect
                    value={editForm.category}
                    onChange={(id) =>
                      setEditForm({ ...editForm, category: id })
                    }
                    options={referenceCategoryEditOptions}
                    emptyLabel="Select category"
                    searchPlaceholder="Search categories…"
                    ariaLabel="Category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sub category{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <MeetingLinkEntitySelect
                    value={editForm.subCategory}
                    onChange={(id) =>
                      setEditForm({ ...editForm, subCategory: id })
                    }
                    options={subCategorySelectOptions}
                    emptyLabel="Select sub category"
                    searchPlaceholder="Search sub categories…"
                    ariaLabel="Sub category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Longer description for this reference"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-y min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Internal notes"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-y min-h-[80px]"
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
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tags: e.target.value })
                    }
                    placeholder="modern, kitchen"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  {isQuotationCategory(editForm.category) ? (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Category is{" "}
                      <span className="font-medium text-gray-700">
                        Quotation
                      </span>
                      . On save, the{" "}
                      <span className="font-medium text-gray-700">
                        quotation
                      </span>{" "}
                      tag is kept (and re-added if removed) so this stays
                      identifiable as a quotation.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="p-6 pt-4 shrink-0 border-t border-gray-100 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={closeEditModal}
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
                  Save changes
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Delete Confirm ── */}
      {deletingId &&
        createPortal(
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
          document.body,
        )}

      {/* ── Preview Modal ── */}
      {previewRef &&
        createPortal(
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
                        {getCategoryLabel(previewRef.category)}
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
                  {previewRef.linkTitle ||
                    previewRef.title ||
                    previewRef.fileName ||
                    "Untitled"}
                </h3>

                {isLoadingPreview && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading full details...
                  </div>
                )}

                {/* Image preview for PHOTO type */}
                {previewRef.referenceType === "PHOTO" &&
                  (previewRef.storageUrl || previewRef.downloadUrl) && (
                    <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={
                          previewRef.downloadUrl ||
                          previewRef.storageUrl ||
                          undefined
                        }
                        alt={
                          previewRef.linkTitle ||
                          previewRef.fileName ||
                          "Reference image"
                        }
                        className="w-full max-h-72 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    </div>
                  )}

                {getReferenceNotes(previewRef) && (
                  <p className="text-sm text-gray-600 mb-4">
                    {getReferenceNotes(previewRef)}
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
                  {(previewRef.storageUrl || previewRef.downloadUrl) &&
                    previewRef.referenceType !== "LINK" && (
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                        onClick={() => {
                          handleViewFile(previewRef);
                          setPreviewRef(null);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View File
                      </Button>
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
          document.body,
        )}
    </div>
  );
};

// ─── Reference Card (Grid View) ──────────────────────────────────────────────

interface ReferenceItemProps {
  reference: ReferenceRow;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onViewFile: () => void;
  onPreview: () => void;
}

const ReferenceCard: React.FC<ReferenceItemProps> = ({
  reference,
  onEdit,
  onDelete,
  onDownload,
  onViewFile,
  onPreview,
}) => {
  const displayTitle =
    reference.linkTitle || reference.title || reference.fileName || "Untitled";
  const isLink = reference.referenceType === "LINK";
  const noteText = getReferenceNotes(reference);
  const inherited = isInheritedRef(reference);

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group overflow-hidden">
      {/* Image thumbnail for PHOTO type, colored bar for others */}
      {reference.referenceType === "PHOTO" &&
      (reference.storageUrl || reference.downloadUrl) ? (
        <div
          className="relative h-40 bg-gray-100 cursor-pointer overflow-hidden"
          onClick={onPreview}
        >
          <img
            src={reference.downloadUrl || reference.storageUrl || undefined}
            alt={reference.linkTitle || reference.fileName || "Reference"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.parentElement as HTMLElement).classList.add(
                "flex",
                "items-center",
                "justify-center",
              );
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-gray-700" />
          </button>
        </div>
      ) : (
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
      )}

      <div className="p-4">
        {/* Type badge & category */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${TYPE_COLORS[reference.referenceType] || "bg-gray-50 text-gray-600 border-gray-200"}`}
          >
            {TYPE_ICONS[reference.referenceType]}
            {reference.referenceType}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {reference.inheritSource === "lead" && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
                Lead phase
              </span>
            )}
            {reference.inheritSource === "account" && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-700 border border-slate-200">
                Customer
              </span>
            )}
            {reference.category && (
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold ${CATEGORY_COLORS[reference.category] || "bg-gray-100 text-gray-600"}`}
              >
                {getCategoryLabel(reference.category)}
              </span>
            )}
          </div>
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
        {noteText && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            {noteText}
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
            {!isLink && (reference.storageUrl || reference.downloadUrl) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFile();
                }}
                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                title="View file"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              </button>
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
            {!inherited && (
              <>
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
              </>
            )}
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
  onViewFile,
  onPreview,
}) => {
  const displayTitle =
    reference.linkTitle || reference.title || reference.fileName || "Untitled";
  const isLink = reference.referenceType === "LINK";
  const noteText = getReferenceNotes(reference);
  const inherited = isInheritedRef(reference);

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
            {noteText && (
              <p className="text-xs text-gray-500 line-clamp-1 max-w-[300px]">
                {noteText}
              </p>
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
        <div className="flex flex-col gap-1">
          {reference.inheritSource === "lead" && (
            <span className="inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
              Lead phase
            </span>
          )}
          {reference.inheritSource === "account" && (
            <span className="inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-50 text-slate-700 border border-slate-200">
              Customer
            </span>
          )}
          {reference.category ? (
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold ${CATEGORY_COLORS[reference.category] || "bg-gray-100 text-gray-600"}`}
            >
              {getCategoryLabel(reference.category)}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
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
          {!isLink && (reference.storageUrl || reference.downloadUrl) && (
            <button
              onClick={onViewFile}
              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              title="View file"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </button>
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
          {!inherited && (
            <>
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
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
