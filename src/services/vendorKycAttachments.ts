import {
  uploadAttachment,
  getAttachment,
  fileToBase64,
  deleteAttachment,
  type Attachment,
  type AttachmentEntityType,
  type AttachmentType,
} from "./attachmentApi";

export type VendorKycSlot = "aadhaar" | "pan" | "gst" | "msme";

export const VENDOR_KYC_NOTE_PREFIX = "vendor-kyc:";

/** POST /api/attachments only accepts these entityType values (server-validated). */
const ATTACHMENT_ENTITY_TYPES: readonly AttachmentEntityType[] = [
  "LEAD",
  "CONTACT",
  "ACCOUNT",
  "PROPERTY",
  "PROJECT",
  "QUOTE",
  "SERVICE_REQUEST",
  "MEETING",
] as const;

/**
 * Entity type for vendor KYC uploads.
 * Default `CONTACT` matches the CRM attachment API; override with
 * `VITE_VENDOR_KYC_ATTACHMENT_ENTITY_TYPE` (e.g. ACCOUNT) if uploads fail validation.
 */
export function vendorKycAttachmentEntityType(): AttachmentEntityType {
  const raw = (
    import.meta.env.VITE_VENDOR_KYC_ATTACHMENT_ENTITY_TYPE as string | undefined
  )
    ?.trim()
    ?.toUpperCase();
  if (raw && ATTACHMENT_ENTITY_TYPES.includes(raw as AttachmentEntityType)) {
    return raw as AttachmentEntityType;
  }
  return "CONTACT";
}

/**
 * Which id to send as `entityId` for vendor KYC.
 * - `teamMember` (default): team member row UUID
 * - `user`: linked User id when `linkedUserId` is present (falls back to team member id)
 */
export function resolveVendorKycAttachmentEntityId(
  teamMemberId: string,
  linkedUserId?: string | null,
): string {
  const strategy = (
    import.meta.env.VITE_VENDOR_KYC_ATTACHMENT_ENTITY_ID as string | undefined
  )
    ?.trim()
    ?.toLowerCase();
  if (strategy === "user" && linkedUserId?.trim()) {
    return linkedUserId.trim();
  }
  return teamMemberId.trim();
}

export function vendorKycNoteForSlot(slot: VendorKycSlot): string {
  return `${VENDOR_KYC_NOTE_PREFIX}${slot}`;
}

/** True when the stored value is a bare attachment id, not http(s) or a data URL. */
export function isVendorKycAttachmentId(
  value: string | null | undefined,
): boolean {
  if (!value?.trim()) return false;
  const v = value.trim();
  if (v.startsWith("data:") || /^https?:\/\//i.test(v)) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function slotToAttachmentType(slot: VendorKycSlot, mime: string): AttachmentType {
  if (slot === "aadhaar" || slot === "pan") return "ID_PROOF";
  if (mime === "application/pdf") return "APPROVAL_DOCUMENT";
  if (mime.startsWith("image/")) return "SITE_PHOTO";
  return "OTHER";
}

export type UploadVendorKycOptions = {
  /** When entity id strategy is `user`, pass member.userId */
  linkedUserId?: string | null;
};

/** POST /api/attachments — vendor KYC; uses server-allowed entityType + resolved entityId. */
export async function uploadVendorKycAttachment(
  teamMemberId: string,
  file: File,
  slot: VendorKycSlot,
  options?: UploadVendorKycOptions,
): Promise<Attachment> {
  const fileBase64 = await fileToBase64(file);
  const entityType = vendorKycAttachmentEntityType();
  const entityId = resolveVendorKycAttachmentEntityId(
    teamMemberId,
    options?.linkedUserId,
  );
  return uploadAttachment({
    entityType,
    entityId,
    attachmentType: slotToAttachmentType(slot, file.type || ""),
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileBase64,
    notes: `${vendorKycNoteForSlot(slot)} teamMemberId=${teamMemberId}`,
    tags: ["vendor-kyc", slot, `team:${teamMemberId}`],
  });
}

/** GET /api/attachments/:id when stored value is an attachment id; otherwise return as-is. */
export async function resolveVendorKycStoredHref(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored?.trim()) return null;
  const s = stored.trim();
  if (s.startsWith("data:") || /^https?:\/\//i.test(s)) return s;
  if (!isVendorKycAttachmentId(s)) return null;
  try {
    const att = await getAttachment(s);
    return (
      att.downloadUrl ||
      att.fileUrl ||
      att.url ||
      att.storageUrl ||
      null
    );
  } catch {
    return null;
  }
}

export async function deleteVendorKycAttachmentIfPresent(
  stored: string | null | undefined,
): Promise<void> {
  if (!isVendorKycAttachmentId(stored)) return;
  try {
    await deleteAttachment(stored!.trim());
  } catch {
    // already removed or forbidden
  }
}
