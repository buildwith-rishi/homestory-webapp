const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

export type AttachmentEntityType =
  | "LEAD"
  | "CONTACT"
  | "ACCOUNT"
  | "PROPERTY"
  | "PROJECT"
  | "QUOTE"
  | "SERVICE_REQUEST"
  | "MEETING";

export type AttachmentType =
  | "FLOOR_PLAN"
  | "SITE_PHOTO"
  | "RENDER_3D"
  | "BOQ"
  | "QUOTE_PDF"
  | "CONTRACT"
  | "APPROVAL_DOCUMENT"
  | "SIGN_OFF"
  | "WARRANTY_DOCUMENT"
  | "INVOICE_PDF"
  | "ID_PROOF"
  | "QUICK_ACTION"
  | "OTHER";

export interface Attachment {
  id: string;
  entityType: AttachmentEntityType;
  entityId: string;
  attachmentType: AttachmentType;
  fileName: string;
  fileType: string;
  fileSize?: number;
  storageUrl?: string;
  downloadUrl?: string;
  fileUrl?: string; // legacy alias
  url?: string; // some endpoints return this
  notes?: string | null;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadedByUser?: { id: string; name: string };
}

export interface UploadAttachmentPayload {
  entityType: AttachmentEntityType;
  entityId: string;
  attachmentType?: AttachmentType;
  fileName: string;
  fileType: string;
  fileBase64: string;
  notes?: string;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }
  return response.json();
}

/** POST /api/attachments — Upload a file as base64 */
export async function uploadAttachment(
  payload: UploadAttachmentPayload,
): Promise<Attachment> {
  const response = await fetch(`${API_BASE_URL}/api/attachments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<Record<string, unknown>>(response);
  // API returns { attachment: {...}, message: "..." }
  return (data.attachment ?? data) as Attachment;
}

/** GET /api/attachments/:id — Fetch single attachment */
export async function getAttachment(id: string): Promise<Attachment> {
  const response = await fetch(`${API_BASE_URL}/api/attachments/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<any>(response);

  // Support multiple backend response shapes:
  // 1) { attachment: {...}, downloadUrl?: string, fileUrl?: string, url?: string }
  // 2) { data: { attachment: {...}, ... } }
  // 3) plain attachment object
  const root = (data?.data ?? data) as Record<string, unknown>;
  const wrappedAttachment =
    (root.attachment as Record<string, unknown> | undefined) ??
    (root as Record<string, unknown>);

  const normalized: Attachment = wrappedAttachment as unknown as Attachment;

  const rootDownloadUrl =
    (root.downloadUrl as string | undefined) || (root.signedUrl as string | undefined);
  const rootFileUrl =
    (root.fileUrl as string | undefined) ||
    (root.storageUrl as string | undefined) ||
    (root.url as string | undefined);

  if (!normalized.downloadUrl && rootDownloadUrl) {
    normalized.downloadUrl = rootDownloadUrl;
  }

  if (!normalized.fileUrl && rootFileUrl) {
    normalized.fileUrl = rootFileUrl;
  }

  if (!normalized.url && rootFileUrl) {
    normalized.url = rootFileUrl;
  }

  return normalized;
}

/** PUT /api/attachments/:id — Update attachment metadata */
export async function updateAttachment(
  id: string,
  payload: { attachmentType?: AttachmentType; notes?: string },
): Promise<Attachment> {
  const response = await fetch(`${API_BASE_URL}/api/attachments/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<Record<string, unknown>>(response);
  return (data.attachment ?? data) as Attachment;
}

/** DELETE /api/attachments/:id — Delete an attachment */
export async function deleteAttachment(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/attachments/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

/** GET /api/attachments?entityType=LEAD&entityId=...&limit=50 — List attachments */
export async function listAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
  limit = 50,
): Promise<Attachment[]> {
  const params = new URLSearchParams({
    entityType,
    entityId,
    limit: String(limit),
  });
  const response = await fetch(
    `${API_BASE_URL}/api/attachments?${params.toString()}`,
    { headers: getAuthHeaders() },
  );
  const data = await handleResponse<unknown>(response);
  let attachments: Attachment[] = [];

  if (Array.isArray(data)) {
    attachments = data as Attachment[];
  } else {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      attachments = obj.data as Attachment[];
    } else if (Array.isArray(obj.attachments)) {
      attachments = obj.attachments as Attachment[];
    }
  }

  // Enforce strict client-side isolation by entity id/type in case backend
  // responds with extra rows from other entities.
  const requestedEntityType = entityType.toUpperCase();
  return attachments.filter((attachment) => {
    const sameEntityId = String(attachment.entityId || "") === entityId;
    if (!sameEntityId) return false;

    const attachmentEntityType = String(attachment.entityType || "").toUpperCase();
    return !attachmentEntityType || attachmentEntityType === requestedEntityType;
  });
}

export interface CreateAttachmentPayload {
  entityType: AttachmentEntityType;
  entityId: string;
  attachmentType?: AttachmentType;
  fileName: string;
  fileType: string;
  storageUrl: string;
  fileSize?: number;
}

/** POST /api/attachments/create — Create an attachment record with an existing URL (e.g. a link) */
export async function createAttachmentWithUrl(
  payload: CreateAttachmentPayload,
): Promise<Attachment> {
  const response = await fetch(`${API_BASE_URL}/api/attachments/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<Record<string, unknown>>(response);
  const attachment = (data.attachment ?? data) as Attachment;
  // Normalise whichever URL field the server returns so callers always have fileUrl
  if (!attachment.fileUrl) {
    attachment.fileUrl =
      attachment.storageUrl ||
      attachment.downloadUrl ||
      (attachment as unknown as Record<string, string>).url ||
      payload.storageUrl;
  }
  return attachment;
}

/** Helper: convert a File object to a base64 string */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Map a MIME type to the closest AttachmentType enum value */
export function mimeToAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith("image/")) return "SITE_PHOTO";
  if (mimeType === "application/pdf") return "QUOTE_PDF";
  if (mimeType.startsWith("video/")) return "RENDER_3D";
  return "OTHER";
}
