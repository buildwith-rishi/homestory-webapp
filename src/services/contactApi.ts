// Contact API Service
// Handles all contact-related API operations

import { onUnauthorizedResponse } from "../auth/sessionExpired";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

// Contact role types
export type ContactRole =
  | "HOMEOWNER"
  | "SPOUSE"
  | "FAMILY_MEMBER"
  | "TENANT"
  | "ARCHITECT"
  | "PROJECT_MANAGER"
  | "CONTRACTOR"
  | "OTHER";

// Preferred communication channel types
export type PreferredChannel =
  | "WHATSAPP"
  | "PHONE"
  | "EMAIL"
  | "SMS"
  | "IN_PERSON";

// Contact interface
export interface Contact {
  id: string;
  leadId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: ContactRole;
  isPrimary: boolean;
  preferredChannel?: PreferredChannel;
  dateOfBirth?: string;
  anniversaryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Request payload for creating/updating contacts
export interface ContactRequest {
  leadId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: ContactRole;
  isPrimary?: boolean;
  preferredChannel?: PreferredChannel;
  dateOfBirth?: string;
  anniversaryDate?: string;
}

// Response types
export interface ContactsListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactRoleOption {
  value: ContactRole;
  label: string;
}

export interface ChannelOption {
  value: PreferredChannel;
  label: string;
}

export interface UpcomingDate {
  contactId: string;
  contact: Contact;
  date: string;
  daysUntil: number;
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
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * List all contacts with optional filters
 * GET /api/contacts
 */
export async function listContacts(params?: {
  leadId?: string;
  role?: ContactRole;
  isPrimary?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ContactsListResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.leadId) queryParams.append("leadId", params.leadId);
    if (params.role) queryParams.append("role", params.role);
    if (params.isPrimary !== undefined)
      queryParams.append("isPrimary", params.isPrimary.toString());
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
  }

  const url = `${API_BASE_URL}/api/contacts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<ContactsListResponse>(response);
}

/**
 * Create a new contact
 * POST /api/contacts
 */
export async function createContact(
  contact: ContactRequest
): Promise<Contact> {
  const response = await fetch(`${API_BASE_URL}/api/contacts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(contact),
  });

  return handleResponse<Contact>(response);
}

/**
 * Get a contact by ID
 * GET /api/contacts/:id
 */
export async function getContactById(id: string): Promise<Contact> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<Contact>(response);
}

/**
 * Update a contact
 * PUT /api/contacts/:id
 */
export async function updateContact(
  id: string,
  updates: Partial<ContactRequest>
): Promise<Contact> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  return handleResponse<Contact>(response);
}

/**
 * Delete a contact
 * DELETE /api/contacts/:id
 */
export async function deleteContact(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Get available contact roles
 * GET /api/contacts/roles
 */
export async function getContactRoles(): Promise<ContactRoleOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/roles`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ roles: ContactRoleOption[] }>(response);
  return data.roles;
}

/**
 * Get preferred communication channels
 * GET /api/contacts/channels
 */
export async function getPreferredChannels(): Promise<ChannelOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/channels`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ channels: ChannelOption[] }>(response);
  return data.channels;
}

/**
 * Get upcoming birthdays
 * GET /api/contacts/birthdays
 */
export async function getUpcomingBirthdays(params?: {
  days?: number;
  limit?: number;
}): Promise<UpcomingDate[]> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.days) queryParams.append("days", params.days.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
  }

  const url = `${API_BASE_URL}/api/contacts/birthdays${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ birthdays: UpcomingDate[] }>(response);
  return data.birthdays;
}

/**
 * Get upcoming anniversaries
 * GET /api/contacts/anniversaries
 */
export async function getUpcomingAnniversaries(params?: {
  days?: number;
  limit?: number;
}): Promise<UpcomingDate[]> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.days) queryParams.append("days", params.days.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
  }

  const url = `${API_BASE_URL}/api/contacts/anniversaries${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ anniversaries: UpcomingDate[] }>(
    response
  );
  return data.anniversaries;
}

// Fallback role options when API is unavailable
export const DEFAULT_CONTACT_ROLES: ContactRoleOption[] = [
  { value: "HOMEOWNER", label: "Homeowner" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "FAMILY_MEMBER", label: "Family Member" },
  { value: "TENANT", label: "Tenant" },
  { value: "ARCHITECT", label: "Architect" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "OTHER", label: "Other" },
];

// Fallback channel options when API is unavailable
export const DEFAULT_PREFERRED_CHANNELS: ChannelOption[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PHONE", label: "Phone Call" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "IN_PERSON", label: "In Person" },
];

// Export all functions as a default object for easier imports
const ContactAPI = {
  listContacts,
  createContact,
  getContactById,
  updateContact,
  deleteContact,
  getContactRoles,
  getPreferredChannels,
  getUpcomingBirthdays,
  getUpcomingAnniversaries,
  DEFAULT_CONTACT_ROLES,
  DEFAULT_PREFERRED_CHANNELS,
};

export default ContactAPI;
