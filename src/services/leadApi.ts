// Lead API Service
// Base URL should match your API documentation
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.goodhomestory.com";

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
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
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface LeadSource {
  id: string;
  name: string;
  count: number;
}

export interface LeadStatus {
  id: string;
  name: string;
  color: string;
  count: number;
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

  return handleResponse<LeadSource[]>(response);
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

  return handleResponse<LeadStatus[]>(response);
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

  return handleResponse<Lead>(response);
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

  return handleResponse<LeadActivity[]>(response);
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
};

export default LeadAPI;
