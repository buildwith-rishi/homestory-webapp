// BDR API Service – wraps /api/bdr/* endpoints
import { fetchAPI } from "./api";
import type { AttachmentType } from "./attachmentApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BDRProfileUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  updatedAt: string;
  assignedLeads: BDRLead[];
  _count: {
    assignedLeads: number;
    activities: number;
  };
}

export interface BDRProfileResponse {
  user: BDRProfileUser;
}

export interface BDRLead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  stage?: string;
  propertyType?: string;
  location?: string;
  city?: string;
  budget?: string;
  budgetRange?: string;
  score?: number;
  priority?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lastContactedAt?: string;
  [key: string]: unknown;
}

export interface BDRLeadsResponse {
  leads: BDRLead[];
  total: number;
  limit: number;
  offset: number;
}

export interface BDRMeetingParticipant {
  id: string;
  meetingId: string;
  contactId: string | null;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  speakerLabel: string | null;
  notifiedViaEmail: boolean;
  notifiedViaWhatsApp: boolean;
  notifiedAt: string | null;
  createdAt: string;
}

export interface BDRMeeting {
  id: string;
  title: string;
  description: string | null;
  meetingType: string | null;
  discussionPoints: string | null;
  entityType: string | null;
  entityId: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioSize: number | null;
  transcriptJson: unknown | null;
  transcriptText: string | null;
  speakerMap: unknown | null;
  summary: string | null;
  actionItems: unknown | null;
  keyPoints: unknown | null;
  notificationsSentAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  participants: BDRMeetingParticipant[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    participants: number;
  };
}

export interface BDRMeetingsResponse {
  meetings: BDRMeeting[];
  total: number;
  limit: number;
  offset: number;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** GET /api/bdr/profile – fetch the current BDR user's profile */
export const getBDRProfile = (): Promise<BDRProfileResponse> =>
  fetchAPI<BDRProfileResponse>("/api/bdr/profile", { method: "GET" });

/** GET /api/bdr/leads – fetch leads assigned to this BDR */
export const getBDRLeads = (
  limit = 20,
  offset = 0,
): Promise<BDRLeadsResponse> =>
  fetchAPI<BDRLeadsResponse>(`/api/bdr/leads?limit=${limit}&offset=${offset}`, {
    method: "GET",
  });

/** GET /api/bdr/meetings – fetch meetings for this BDR */
export const getBDRMeetings = (
  limit = 10,
  offset = 0,
): Promise<BDRMeetingsResponse> =>
  fetchAPI<BDRMeetingsResponse>(
    `/api/bdr/meetings?limit=${limit}&offset=${offset}`,
    { method: "GET" },
  );

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface BDRTaskAPIItem {
  id: string;
  title: string;
  description?: string | null;
  taskType: string;
  dueDate: string;
  dueTime?: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW" | null;
  status: string; // Task status from API (e.g. TODO / IN_PROGRESS / COMPLETED)
  notes?: string | null;
  completionPhoto?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BDRTasksResponse {
  tasks: BDRTaskAPIItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateBDRTaskPayload {
  title: string;
  description?: string;
  taskType?: string;
  status?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
  dueTime?: string;
}

export interface UpdateBDRTaskPayload {
  status?: string;
  notes?: string;
  title?: string;
  description?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
  dueTime?: string;
}

/** GET /api/bdr/tasks – fetch all tasks for this BDR */
export const getBDRTasks = (
  limit = 100,
  offset = 0,
  status?: string,
): Promise<BDRTasksResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (status) {
    const normalizedStatus = status.toUpperCase();
    params.set("status", normalizedStatus);
  }
  return fetchAPI<BDRTasksResponse>(`/api/bdr/tasks?${params.toString()}`, {
    method: "GET",
  });
};

/** POST /api/bdr/tasks – create a new task */
export const createBDRTask = async (
  payload: CreateBDRTaskPayload,
): Promise<BDRTaskAPIItem> => {
  const res = await fetchAPI<{ task: BDRTaskAPIItem }>("/api/bdr/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.task;
};

/** PUT /api/bdr/tasks/:id – update a task */
export const updateBDRTask = async (
  taskId: string,
  payload: UpdateBDRTaskPayload,
): Promise<BDRTaskAPIItem> => {
  const res = await fetchAPI<{ task: BDRTaskAPIItem }>(
    `/api/bdr/tasks/${taskId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return res.task;
};

/** DELETE /api/bdr/tasks/:id – delete a task */
export const deleteBDRTask = (taskId: string): Promise<{ message?: string }> =>
  fetchAPI<{ message?: string }>(`/api/bdr/tasks/${taskId}`, {
    method: "DELETE",
  });

/**
 * GET /api/bdr/tasks?userId=:userId
 * Admin-only: fetch tasks created by a specific BDR user.
 * Uses the admin's auth token + passes the BDR's userId as a query param
 * so the backend returns that user's task records.
 */
export const getAdminBDRTasksByUserId = (
  userId: string,
  limit = 200,
  offset = 0,
): Promise<BDRTasksResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    userId,
  });
  return fetchAPI<BDRTasksResponse>(`/api/bdr/tasks?${params.toString()}`, {
    method: "GET",
  });
};

// ── Task attachments (BDR) ───────────────────────────────────────────────────

/** Matches backend enum for POST /api/bdr/tasks/:id/attachments */
export type BDRTaskAttachmentType =
  | "PHOTO"
  | "VIDEO"
  | "DOCUMENT"
  | "AUDIO"
  | "COMPLETION_PHOTO"
  | "SITE_PHOTO"
  | "APPROVAL_DOCUMENT"
  | "WARRANTY_DOCUMENT"
  | "DESIGN_DOCUMENT"
  | "HANDOVER_DOCUMENT"
  | "OTHER";

export interface BDRTaskAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl?: string | null;
  downloadUrl?: string | null;
  attachmentType: BDRTaskAttachmentType;
  notes?: string | null;
  uploadedAt: string;
  uploadedByUser?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface BDRTaskAttachmentsResponse {
  attachments: BDRTaskAttachment[];
  total: number;
  limit: number;
  offset: number;
}

export interface UploadBDRTaskAttachmentPayload {
  fileName: string;
  fileType: string;
  fileBase64: string;
  attachmentType: BDRTaskAttachmentType;
  notes?: string;
}

/**
 * Maps BDR UI / doc labels to the Prisma `AttachmentType` enum used by the
 * shared attachments service. Values like `PHOTO` are not valid in the DB —
 * images are stored as `SITE_PHOTO` (same convention as {@link attachmentApi.mimeToAttachmentType}).
 */
export function bdrTaskAttachmentTypeToPrisma(
  t: BDRTaskAttachmentType,
): AttachmentType {
  switch (t) {
    case "PHOTO":
    case "COMPLETION_PHOTO":
      return "SITE_PHOTO";
    case "SITE_PHOTO":
      return "SITE_PHOTO";
    case "VIDEO":
      return "RENDER_3D";
    case "DOCUMENT":
      return "OTHER";
    case "AUDIO":
      return "OTHER";
    case "APPROVAL_DOCUMENT":
      return "APPROVAL_DOCUMENT";
    case "WARRANTY_DOCUMENT":
      return "WARRANTY_DOCUMENT";
    case "DESIGN_DOCUMENT":
    case "HANDOVER_DOCUMENT":
      return "SIGN_OFF";
    case "OTHER":
    default:
      return "OTHER";
  }
}

/** GET /api/bdr/tasks/:id/attachments */
export const getBDRTaskAttachments = (
  taskId: string,
  limit = 50,
  offset = 0,
): Promise<BDRTaskAttachmentsResponse> => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return fetchAPI<BDRTaskAttachmentsResponse>(
    `/api/bdr/tasks/${taskId}/attachments?${params.toString()}`,
    { method: "GET" },
  );
};

/** POST /api/bdr/tasks/:id/attachments */
export const uploadBDRTaskAttachment = async (
  taskId: string,
  payload: UploadBDRTaskAttachmentPayload,
): Promise<BDRTaskAttachment> => {
  const body = {
    ...payload,
    attachmentType: bdrTaskAttachmentTypeToPrisma(payload.attachmentType),
  };
  const res = await fetchAPI<
    BDRTaskAttachment | { attachment?: BDRTaskAttachment; message?: string }
  >(`/api/bdr/tasks/${taskId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res && typeof res === "object" && "attachment" in res && res.attachment) {
    return res.attachment;
  }
  return res as BDRTaskAttachment;
};

/** DELETE /api/bdr/tasks/:id/attachments/:attachmentId */
export const deleteBDRTaskAttachment = (
  taskId: string,
  attachmentId: string,
): Promise<{ message?: string }> =>
  fetchAPI<{ message?: string }>(
    `/api/bdr/tasks/${taskId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );

// ── Lead Creation ─────────────────────────────────────────────────────────────

export interface CreateBDRLeadPayload {
  name: string;
  phone: string;
  email?: string;
  secondaryEmails?: string[];
  secondaryPhones?: string[];
  source?: string;
  status?: string;
  score?: number;
  city?: string;
  requirements?: string;
  specialRequirements?: string;
  message?: string;
  assignedToId: string;
  companyName?: string;
  serviceInterest?: string;
  propertyType?: string;
  location?: string;
  homeType?: string;
  projectType?: string;
  projectStage?: string;
  startTimeline?: string;
  budgetComfort?: string;
  projectScope?: string;
  area?: number;
  canWhatsApp?: boolean;
  referrerName?: string;
}

/** POST /api/leads – create a new lead, auto-assigned to the current BDR */
export const createBDRLead = async (
  payload: CreateBDRLeadPayload,
): Promise<BDRLead> => {
  const res = await fetchAPI<{ lead: BDRLead }>("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.lead;
};

/** PUT /api/leads/:id – update a lead from BDR flow */
export const updateBDRLead = async (
  leadId: string,
  payload: Partial<CreateBDRLeadPayload>,
): Promise<BDRLead> => {
  const res = await fetchAPI<{ lead: BDRLead }>(`/api/leads/${leadId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.lead;
};
