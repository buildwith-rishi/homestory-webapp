// Lead API Service
// Base URL should match your API documentation
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Lead API Base URL:", API_BASE_URL);

export interface Lead {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
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
}

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
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

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
  });

  return handleResponse(response);
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

  return handleResponse<Lead>(response);
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
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  return handleResponse<Lead>(response);
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

  return handleResponse<LeadNote>(response);
}

/**
 * Get all notes for a lead
 * GET /api/leads/:id/notes
 */
export async function getLeadNotes(id: string): Promise<LeadNote[]> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${id}/notes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ notes?: LeadNote[] } | LeadNote[]>(
    response,
  );

  // Handle both response formats: { notes: [...] } or [...]
  if (Array.isArray(data)) {
    return data;
  }
  return data.notes || [];
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
