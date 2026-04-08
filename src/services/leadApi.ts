// Lead API Service
// Base URL should match your API documentation
import { onUnauthorizedResponse } from "../auth/sessionExpired";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Lead API Base URL:", API_BASE_URL);

export interface Lead {
  id?: string;
  leadNumber?: string;
  name?: string;
  email?: string;
  secondaryEmails?: string[];
  phone?: string;
  secondaryPhones?: string[];
  source: string;
  status?: string;
  stage?: string;
  propertyType?: string;
  location?: string;
  city?: string;
  locality?: string;
  budget?: string;
  budgetRange?: string;
  score?: number;
  lastContact?: string;
  priority?: "high" | "medium" | "low";
  notes?: string;
  followUp?: string;
  followUpDate?: string;
  lastContactedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  // Property Details
  bhkConfig?: string;
  carpetArea?: number;

  // Timeline
  timeline?: string;
  expectedStartDate?: string;
  moveinDate?: string;

  // Design Preferences
  designStyle?: string[];
  colorPreferences?: string[];
  inspirationImages?: string[];

  // Scope of Work
  scopeOfWork?: string[];
  servicesInterested?: string[];

  // Lead Quality
  qualification?: string;
  competitorInfo?: string;

  // Follow-up Tracking
  meetingScheduled?: boolean;
  siteVisitDone?: boolean;
  quotationSent?: boolean;

  // Nested data from GET /api/leads/:id
  contacts?: LeadContact[];
  stageHistory?: LeadStageHistory[];
  convertedToAccount?: ConvertedToAccount | null;
  activities?: LeadActivity[];

  // Additional fields from API
  householdOrCompany?: string;
  companyName?: string | null;
  sourceDetails?: Record<string, string> | null;
  serviceInterest?: string | null;
  area?: number | null;
  message?: string | null;
  requirements?: string | null;
  projectType?: string | null;
  propertyProjectType?: string | null;
  homeType?: string | null;
  projectStage?: string | null;
  startTimeline?: string | null;
  budgetComfort?: string | null;
  projectScope?: string | null;
  floorPlanUrl?: string | null;
  wantsExperienceCenterVisit?: boolean;
  canWhatsApp?: boolean;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  referrerName?: string | null;
  referrerPhone?: string | null;
  referrerProjectNumber?: string | null;
  agentAgencyName?: string | null;
  agentAgencyDetails?: string | null;
  metadata?: Record<string, unknown> | null;
  references?: any[];

  // New fields form API update
  projectCategory?: string | null;
  pipelineType?: string | null;
  scopeType?: string | null;
  propertySubtype?: string | null;
  propertyBHK?: string | null;
  budgetTier?: string | null;
  propertySizeSqft?: number | null;
  constructionStatus?: string | null;
  tentativeHandoverDate?: string | null;
  propertyAddress?: string | null;
  propertyCity?: string | null;
  propertyState?: string | null;
  propertyPincode?: string | null;
  propertyBuilding?: string | null;
  propertyUnit?: string | null;
  propertyLandmarks?: string | null;
  siteContactName?: string | null;
  siteContactPhone?: string | null;
  specialRequirements?: string | null;
  designPackage?: string | null;
  otp?: string | null;
  otpExpiresAt?: string | null;
  isPhoneVerified?: boolean;
  verificationAttempts?: number;
  lastOtpRequestAt?: string | null;
  referredByAccountId?: string | null;
}

export interface LeadContact {
  id: string;
  leadId?: string;
  accountId?: string | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  role?: string;
  isPrimary?: boolean;
  preferredChannel?: string;
  dateOfBirth?: string | null;
  anniversaryDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadStageHistory {
  id: string;
  leadId: string;
  fromStage: string;
  toStage: string;
  changedByUserId?: string;
  reason?: string;
  changedAt: string;
  changedByUser?: {
    id: string;
    name: string;
  };
}

export interface ConvertedToAccount {
  id: string;
  name: string;
  type?: string;
}

export interface LeadActivity {
  id: string;
  entityType?: string;
  entityId?: string;
  activityType: string;
  occurredAt?: string;
  performedByUserId?: string;
  performedByContactId?: string | null;
  title: string;
  notes?: string | null;
  payloadJson?: any;
  createdAt: string;
  performedByUser?: {
    id: string;
    name: string;
  };
  // Legacy fields for backward compat
  leadId?: string;
  type?: string;
  description?: string;
  createdBy?: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  type: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

const mapActivityToLeadNote = (activity: LeadActivity): LeadNote => ({
  id: activity.id,
  leadId: activity.entityId || activity.leadId || "",
  content: activity.notes || activity.title || "",
  type: activity.activityType || activity.type || "GENERAL",
  createdAt: activity.occurredAt || activity.createdAt,
  createdBy: activity.performedByUserId || activity.createdBy,
  createdByName: activity.performedByUser?.name || activity.createdBy,
});

export interface LeadSource {
  value: string;
  label: string;
  count?: number;
}

export interface LeadStatus {
  value: string;
  label: string;
  description?: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string; // For testing purposes only
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  lead?: Lead;
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    onUnauthorizedResponse(response);
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Keep PUT /api/leads/:id payload aligned with backend contract.
const buildLeadUpdatePayload = (updates: Partial<Lead>): Partial<Lead> => {
  const payload: Partial<Lead> = {};

  // Basic Info (current frontend)
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.secondaryEmails !== undefined)
    payload.secondaryEmails = updates.secondaryEmails;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.secondaryPhones !== undefined)
    payload.secondaryPhones = updates.secondaryPhones;
  if (updates.companyName !== undefined) payload.companyName = updates.companyName;
  if (updates.source !== undefined) payload.source = updates.source;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.stage !== undefined) payload.stage = updates.stage;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.score !== undefined) payload.score = updates.score;
  if (updates.assignedToId !== undefined) payload.assignedToId = updates.assignedToId;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  // Property & Project (current frontend)
  if (updates.propertyType !== undefined) payload.propertyType = updates.propertyType;
  if (updates.projectType !== undefined) payload.projectType = updates.projectType;
  if (updates.propertyProjectType !== undefined)
    payload.propertyProjectType = updates.propertyProjectType;
  if (updates.homeType !== undefined) payload.homeType = updates.homeType;
  if (updates.bhkConfig !== undefined) payload.bhkConfig = updates.bhkConfig;
  if (updates.carpetArea !== undefined) payload.carpetArea = updates.carpetArea;
  if (updates.area !== undefined) payload.area = updates.area;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.locality !== undefined) payload.locality = updates.locality;
  if (updates.projectStage !== undefined) payload.projectStage = updates.projectStage;
  if (updates.timeline !== undefined) payload.timeline = updates.timeline;
  if (updates.startTimeline !== undefined) payload.startTimeline = updates.startTimeline;
  if (updates.expectedStartDate !== undefined)
    payload.expectedStartDate = updates.expectedStartDate;
  if (updates.moveinDate !== undefined) payload.moveinDate = updates.moveinDate;
  if (updates.budget !== undefined) payload.budget = updates.budget;
  if (updates.budgetRange !== undefined) payload.budgetRange = updates.budgetRange;
  if (updates.budgetComfort !== undefined) payload.budgetComfort = updates.budgetComfort;
  if (updates.budgetTier !== undefined) payload.budgetTier = updates.budgetTier;
  if (updates.projectScope !== undefined) payload.projectScope = updates.projectScope;
  if (updates.scopeOfWork !== undefined) payload.scopeOfWork = updates.scopeOfWork;
  if (updates.servicesInterested !== undefined)
    payload.servicesInterested = updates.servicesInterested;
  if (updates.serviceInterest !== undefined)
    payload.serviceInterest = updates.serviceInterest;
  if (updates.designStyle !== undefined) payload.designStyle = updates.designStyle;
  if (updates.colorPreferences !== undefined)
    payload.colorPreferences = updates.colorPreferences;
  if (updates.referrerName !== undefined) payload.referrerName = updates.referrerName;
  if (updates.referrerPhone !== undefined) payload.referrerPhone = updates.referrerPhone;
  if (updates.referrerProjectNumber !== undefined)
    payload.referrerProjectNumber = updates.referrerProjectNumber;
  if (updates.agentAgencyName !== undefined)
    payload.agentAgencyName = updates.agentAgencyName;
  if (updates.agentAgencyDetails !== undefined)
    payload.agentAgencyDetails = updates.agentAgencyDetails;
  if (updates.householdOrCompany !== undefined)
    payload.householdOrCompany = updates.householdOrCompany;
  if (updates.wantsExperienceCenterVisit !== undefined)
    payload.wantsExperienceCenterVisit = updates.wantsExperienceCenterVisit;
  if (updates.canWhatsApp !== undefined) payload.canWhatsApp = updates.canWhatsApp;
  if (updates.isPhoneVerified !== undefined)
    payload.isPhoneVerified = updates.isPhoneVerified;
  if (updates.verificationAttempts !== undefined)
    payload.verificationAttempts = updates.verificationAttempts;

  // Notes and uploads (current frontend)
  if (updates.message !== undefined) payload.message = updates.message;
  if (updates.requirements !== undefined) payload.requirements = updates.requirements;
  if (updates.specialRequirements !== undefined)
    payload.specialRequirements = updates.specialRequirements;
  if (updates.floorPlanUrl !== undefined) payload.floorPlanUrl = updates.floorPlanUrl;

  return payload;
};

/**
 * Send OTP to a phone number
 * POST /api/leads/otp/send
 */
export async function sendOTP(phone: string): Promise<OTPResponse> {
  const response = await fetch(`${API_BASE_URL}/api/leads/otp/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  return handleResponse<OTPResponse>(response);
}

/**
 * Verify OTP
 * POST /api/leads/otp/verify
 */
export async function verifyOTP(
  phone: string,
  otp: string,
): Promise<VerifyOTPResponse> {
  const response = await fetch(`${API_BASE_URL}/api/leads/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, otp }),
  });

  return handleResponse<VerifyOTPResponse>(response);
}

/**
 * Get all lead sources
 * GET /api/leads/sources
 */
export async function getLeadSources(): Promise<LeadSource[]> {
  const response = await fetch(`${API_BASE_URL}/api/leads/sources`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ sources: LeadSource[] }>(response);
  return data.sources;
}

/**
 * Get all lead statuses
 * GET /api/leads/statuses
 */
export async function getLeadStatuses(): Promise<LeadStatus[]> {
  const response = await fetch(`${API_BASE_URL}/api/leads/statuses`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ statuses: LeadStatus[] }>(response);
  return data.statuses || [];
}

/** Normalizes varying GET /api/leads JSON shapes to a single contract. */
export function normalizeListLeadsResponse(raw: unknown): {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
} {
  const r = raw as Record<string, unknown>;
  const data =
    r.data && typeof r.data === "object"
      ? (r.data as Record<string, unknown>)
      : undefined;
  const meta =
    r.meta && typeof r.meta === "object"
      ? (r.meta as Record<string, unknown>)
      : undefined;
  const pagination =
    r.pagination && typeof r.pagination === "object"
      ? (r.pagination as Record<string, unknown>)
      : undefined;

  const leadsRaw = r.leads ?? data?.leads ?? r.results ?? data?.results;
  const leads = Array.isArray(leadsRaw) ? (leadsRaw as Lead[]) : [];

  const totalRaw =
    r.total ??
    data?.total ??
    meta?.total ??
    pagination?.total ??
    r.count ??
    data?.count;
  const total =
    typeof totalRaw === "number" && !Number.isNaN(totalRaw)
      ? totalRaw
      : leads.length;

  const pageRaw = r.page ?? data?.page ?? meta?.page ?? pagination?.page;
  const page =
    typeof pageRaw === "number" && !Number.isNaN(pageRaw) ? pageRaw : 1;

  const limitRaw = r.limit ?? data?.limit ?? meta?.limit ?? pagination?.limit;
  const limit =
    typeof limitRaw === "number" && !Number.isNaN(limitRaw)
      ? limitRaw
      : leads.length;

  return { leads, total, page, limit };
}

/**
 * List all leads with optional filters
 * GET /api/leads
 */
export async function listLeads(params?: {
  status?: string;
  source?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ leads: Lead[]; total: number; page: number; limit: number }> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.status) queryParams.append("status", params.status);
    if (params.source) queryParams.append("source", params.source);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
  }

  const url = `${API_BASE_URL}/api/leads${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const raw = await handleResponse<unknown>(response);
  return normalizeListLeadsResponse(raw);
}

const LIST_LEADS_MAX_PAGES = 500;
const LIST_LEADS_DEFAULT_PAGE_SIZE = 200;

/**
 * Fetch every lead page until a short page is returned (or an empty page).
 * Does not trust `total` alone when a full page is returned, so counts stay
 * correct if the API reports an incorrect total.
 */
export async function listAllLeads(
  params?: {
    status?: string;
    source?: string;
    search?: string;
  },
  options?: { pageSize?: number; signal?: AbortSignal },
): Promise<Lead[]> {
  const pageSize = options?.pageSize ?? LIST_LEADS_DEFAULT_PAGE_SIZE;
  const all: Lead[] = [];
  let page = 1;

  while (page <= LIST_LEADS_MAX_PAGES) {
    if (options?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const res = await listLeads({ ...params, page, limit: pageSize });
    const batch = res.leads ?? [];
    all.push(...batch);
    if (batch.length === 0) break;
    if (batch.length < pageSize) break;
    page++;
  }

  return all;
}

/**
 * Create a new lead
 * POST /api/leads
 */
export async function createLead(lead: Omit<Lead, "id">): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/api/leads`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(lead),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await handleResponse<any>(response);
  return (data?.lead || data?.data || data) as Lead;
}

/**
 * Get a lead by ID
 * GET /api/leads/:id
 */
export async function getLeadById(id: string): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await handleResponse<any>(response);

  // Handle different API response structures:
  // - { lead: { name: "...", contacts: [...], stageHistory: [...], activities: [...], ... } }
  // - { data: { name: "...", ... } }
  // - { name: "...", ... } (flat)
  const lead: Lead = data.lead || data.data || data;

  console.log("getLeadById raw API response:", data);
  console.log("Extracted lead object:", lead);
  console.log("Lead contacts:", lead.contacts?.length || 0);
  console.log("Lead stageHistory:", lead.stageHistory?.length || 0);
  console.log("Lead activities:", lead.activities?.length || 0);
  console.log("Lead convertedToAccount:", lead.convertedToAccount);

  // Sanitize undefined string values that may come from the API
  // Convert string "undefined" or "null" to actual undefined
  return {
    ...lead,
    name:
      !lead.name || lead.name === "undefined" || lead.name === "null"
        ? undefined
        : lead.name,
    email:
      !lead.email || lead.email === "undefined" || lead.email === "null"
        ? undefined
        : lead.email,
    phone:
      !lead.phone || lead.phone === "undefined" || lead.phone === "null"
        ? undefined
        : lead.phone,
  };
}

/**
 * Update a lead
 * PUT /api/leads/:id
 */
export async function updateLead(
  id: string,
  updates: Partial<Lead>,
): Promise<Lead> {
  const payload = buildLeadUpdatePayload(updates);
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await handleResponse<any>(response);
  return (data?.lead || data?.data || data) as Lead;
}

/**
 * Delete a lead
 * DELETE /api/leads/:id
 */
export async function deleteLead(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Get lead activities
 * GET /api/leads/:id/activities
 */
export async function getLeadActivities(id: string): Promise<LeadActivity[]> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}/activities`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<
    { activities?: LeadActivity[] } | LeadActivity[]
  >(response);

  // Handle both response formats: { activities: [...] } or [...]
  if (Array.isArray(data)) {
    return data;
  }
  return data.activities || [];
}

/**
 * Add activity to a lead
 * POST /api/leads/:id/activities
 */
export async function addLeadActivity(
  id: string,
  activity: {
    type: string;
    description: string;
  },
): Promise<LeadActivity> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}/activities`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(activity),
  });

  return handleResponse<LeadActivity>(response);
}

/**
 * Add note to a lead
 * POST /api/leads/:id/notes
 */
export async function addLeadNote(
  id: string,
  note: {
    content: string;
    type?: string;
  },
): Promise<LeadNote> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      content: note.content,
      type: note.type || "GENERAL",
    }),
  });

  const data = await handleResponse<
    LeadNote | { note?: LeadNote; activity?: LeadActivity; message?: string }
  >(response);

  // Supported response formats:
  // 1) LeadNote object
  // 2) { note: LeadNote }
  // 3) { activity: LeadActivity, message: string }
  if ((data as LeadNote).content !== undefined) {
    return data as LeadNote;
  }

  const wrapped = data as { note?: LeadNote; activity?: LeadActivity };
  if (wrapped.note) {
    return wrapped.note;
  }
  if (wrapped.activity) {
    return mapActivityToLeadNote(wrapped.activity);
  }

  // Final fallback to keep UI resilient if API shape changes unexpectedly.
  return {
    id: `note-${Date.now()}`,
    leadId: id,
    content: note.content,
    type: note.type || "GENERAL",
    createdAt: new Date().toISOString(),
  };
}

/** When GET /api/leads/:id/notes returns 404, avoid repeating that request every load. */
let leadNotesListGetUnavailable = false;

const getLeadNotesFromActivities = async (
  id: string,
): Promise<LeadNote[]> => {
  const activities = await getLeadActivities(id);
  return activities
    .filter((a) => (a.activityType || a.type) === "NOTE_ADDED")
    .map(mapActivityToLeadNote)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
};

/** Deduplicate concurrent getLeadNotes for the same lead (e.g. React Strict Mode). */
const leadNotesInFlight = new Map<string, Promise<LeadNote[]>>();

async function fetchLeadNotesInternal(id: string): Promise<LeadNote[]> {
  if (leadNotesListGetUnavailable) {
    return getLeadNotesFromActivities(id);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}/notes`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<
      | { notes?: LeadNote[]; activities?: LeadActivity[] }
      | LeadNote[]
      | LeadActivity[]
    >(response);

    leadNotesListGetUnavailable = false;

    // Handle: [LeadNote]
    if (Array.isArray(data)) {
      if (data.length === 0) return [];
      const first = data[0] as LeadNote | LeadActivity;
      if ((first as LeadNote).content !== undefined) {
        return data as LeadNote[];
      }
      return (data as LeadActivity[])
        .filter((a) => (a.activityType || a.type) === "NOTE_ADDED")
        .map(mapActivityToLeadNote);
    }

    // Handle: { notes: [...] }
    if (Array.isArray(data.notes)) {
      return data.notes;
    }

    // Handle: { activities: [...] }
    if (Array.isArray(data.activities)) {
      return data.activities
        .filter((a) => (a.activityType || a.type) === "NOTE_ADDED")
        .map(mapActivityToLeadNote);
    }

    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    // Current backend may not expose GET /notes yet (404).
    // Fallback to activities endpoint and derive notes from NOTE_ADDED events.
    if (/404|not found/i.test(message)) {
      leadNotesListGetUnavailable = true;
      return getLeadNotesFromActivities(id);
    }

    throw error;
  }
}

/**
 * Get all notes for a lead
 * GET /api/leads/:id/notes
 */
export async function getLeadNotes(id: string): Promise<LeadNote[]> {
  let p = leadNotesInFlight.get(id);
  if (!p) {
    p = fetchLeadNotesInternal(id).finally(() => {
      leadNotesInFlight.delete(id);
    });
    leadNotesInFlight.set(id, p);
  }
  return p;
}

/**
 * Upload a floor plan file
 * POST /api/leads/upload-floor-plan
 * Returns { url: string }
 */
// Helper to generate UUID if crypto.randomUUID is not available
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Upload Floor Plan
 * Converts file to base64 and sends to attachments API
 */
export async function uploadFloorPlan(
  file: File,
  existingLeadId?: string,
): Promise<{ url: string }> {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No authentication token found");

  // Convert file to Base64
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = reader.result.split(",")[1];
        resolve(base64Content);
      } else {
        reject(new Error("Failed to read file as base64 string"));
      }
    };
    reader.onerror = (error) => reject(error);
  });

  const payload = {
    entityType: "LEAD",
    entityId: existingLeadId || generateUUID(),
    attachmentType: "FLOOR_PLAN",
    fileName: file.name,
    fileType: file.type || "application/pdf",
    fileBase64: fileBase64,
    notes: "Lead Floor Plan Upload",
  };

  const response = await fetch(`${API_BASE_URL}/api/attachments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    onUnauthorizedResponse(response);
    const errorText = await response.text();
    console.error("Upload failed details:", errorText);
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log("Upload response:", data);

  // Extract URL from various possible response structures
  const url =
    data.downloadUrl ||
    data.url ||
    data.fileUrl ||
    data.attachment?.downloadUrl ||
    data.attachment?.url ||
    data.data?.url ||
    "";

  return { url };
}

// ==========================================
// Lead Assignment API Types & Functions
// ==========================================

export interface BulkAssignRequest {
  leadIds: string[];
  assigneeUserId: string;
  notes?: string;
}

export interface AssignLeadRequest {
  assigneeUserId: string;
  notes?: string;
}

export interface AddAssigneesRequest {
  userIds: string[];
  notes?: string;
}

export interface LeadAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedAt: string;
  notes?: string;
}

export interface BulkAssignResponse {
  success: boolean;
  message: string;
  assignedCount: number;
}

export interface AssignLeadResponse {
  success: boolean;
  message: string;
  lead?: Lead;
}

export interface UnassignedLeadsResponse {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
}

export interface LeadAssigneesResponse {
  assignees: LeadAssignee[];
}

/**
 * Bulk assign leads to a user
 * POST /api/leads/bulk-assign
 */
export async function bulkAssignLeads(
  request: BulkAssignRequest,
): Promise<BulkAssignResponse> {
  const response = await fetch(`${API_BASE_URL}/api/leads/bulk-assign`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  return handleResponse<BulkAssignResponse>(response);
}

/**
 * Assign a single lead to a user
 * POST /api/leads/:leadId/assign
 */
export async function assignLead(
  leadId: string,
  request: AssignLeadRequest,
): Promise<AssignLeadResponse> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/assign`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  return handleResponse<AssignLeadResponse>(response);
}

/**
 * Get unassigned leads with pagination
 * GET /api/leads/unassigned
 */
export async function getUnassignedLeads(params?: {
  limit?: number;
  offset?: number;
}): Promise<UnassignedLeadsResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
  }

  const url = `${API_BASE_URL}/api/leads/unassigned${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<UnassignedLeadsResponse>(response);
}

/**
 * Get assignees for a specific lead
 * GET /api/leads/:leadId/assignees
 */
export async function getLeadAssignees(
  leadId: string,
): Promise<LeadAssigneesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/leads/${leadId}/assignees`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<LeadAssigneesResponse>(response);
}

/**
 * Add assignees (co-assign) to a lead
 * POST /api/leads/:leadId/assignees
 */
export async function addLeadAssignees(
  leadId: string,
  request: AddAssigneesRequest,
): Promise<AssignLeadResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/leads/${leadId}/assignees`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    },
  );

  return handleResponse<AssignLeadResponse>(response);
}

/**
 * Remove an assignee from a lead
 * DELETE /api/leads/:leadId/assignees/:userId
 */
export async function removeLeadAssignee(
  leadId: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/leads/${leadId}/assignees/${userId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<{ success: boolean; message: string }>(response);
}

// Export all functions as a default object for easier imports
const LeadAPI = {
  sendOTP,
  verifyOTP,
  getLeadSources,
  getLeadStatuses,
  listLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  uploadFloorPlan,
  getLeadActivities,
  addLeadActivity,
  addLeadNote,
  getLeadNotes,
  bulkAssignLeads,
  assignLead,
  getUnassignedLeads,
  getLeadAssignees,
  addLeadAssignees,
  removeLeadAssignee,
};

export default LeadAPI;
