// Activities API Service
// Handles all activity-related API operations

import type {
  Activity,
  CreateActivityRequest,
  LogActivityRequest,
  EntityType,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Activities API Base URL:", API_BASE_URL);

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
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// ==========================================
// Activity API Functions
// ==========================================

/**
 * Get all activities
 * @returns Promise resolving to array of activities
 */
export async function getActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<Activity[]>(response);
}

/**
 * Create a new activity
 * @param data - Activity creation data
 * @returns Promise resolving to the created activity
 */
export async function createActivity(
  data: CreateActivityRequest,
): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

/**
 * Get all available activity types
 * @returns Promise resolving to array of activity type strings
 */
export async function getActivityTypes(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities/types`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<string[]>(response);
}

/**
 * Get all available entity types
 * @returns Promise resolving to array of entity type strings
 */
export async function getEntityTypes(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities/entity-types`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<string[]>(response);
}

/**
 * Log a meeting activity
 * @param data - Meeting activity data
 * @returns Promise resolving to the created activity
 */
export async function logMeeting(data: LogActivityRequest): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities/log/meeting`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

/**
 * Log a call activity
 * @param data - Call activity data
 * @returns Promise resolving to the created activity
 */
export async function logCall(data: LogActivityRequest): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities/log/call`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

/**
 * Log a note activity
 * @param data - Note activity data
 * @returns Promise resolving to the created activity
 */
export async function logNote(data: LogActivityRequest): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities/log/note`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

/**
 * Log a WhatsApp activity
 * @param data - WhatsApp activity data
 * @returns Promise resolving to the created activity
 */
export async function logWhatsApp(data: LogActivityRequest): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities/log/whatsapp`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

/**
 * Log an email activity
 * @param data - Email activity data
 * @returns Promise resolving to the created activity
 */
export async function logEmail(data: LogActivityRequest): Promise<Activity> {
  const response = await fetch(`${API_BASE_URL}/api/activities/log/email`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Activity>(response);
}

/**
 * Log a site visit activity
 * @param data - Site visit activity data
 * @returns Promise resolving to the created activity
 */
export async function logSiteVisit(
  data: LogActivityRequest,
): Promise<Activity> {
  const response = await fetch(
    `${API_BASE_URL}/api/activities/log/site-visit`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    },
  );
  return handleResponse<Activity>(response);
}

/**
 * Get activities by entity (lead, project, or customer)
 * @param entityType - Type of entity (LEAD, PROJECT, or CUSTOMER)
 * @param entityId - ID of the entity
 * @returns Promise resolving to array of activities for the entity
 */
export async function getActivitiesByEntity(
  entityType: EntityType,
  entityId: string,
): Promise<Activity[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/activities/${entityType}/${entityId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );
  return handleResponse<Activity[]>(response);
}
