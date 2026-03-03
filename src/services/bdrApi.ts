// BDR API Service – wraps /api/bdr/* endpoints
import { fetchAPI } from "./api";

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
  status: string; // "todo" | "inprogress" | "completed" (lowercase from API)
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
  if (status) params.set("status", status);
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
