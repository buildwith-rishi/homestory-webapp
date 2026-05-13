// Activities API Service
// Handles all activity-related API operations

import type {
  Activity,
  ActivityType,
  CreateActivityRequest,
  LogActivityRequest,
  EntityType,
} from "../types";
import { onUnauthorizedResponse } from "../auth/sessionExpired";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Activities API Base URL:", API_BASE_URL);

// ==========================================
// Response normalization (API / deployment drift)
// ==========================================

function firstNonEmptyString(...vals: unknown[]): string {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = typeof v === "string" ? v : String(v);
    const t = s.trim();
    if (t) return t;
  }
  return "";
}

function unwrapActivityRow(row: unknown): Record<string, unknown> {
  if (!row || typeof row !== "object") return {};
  const r = row as Record<string, unknown>;
  if (r.activity && typeof r.activity === "object" && !Array.isArray(r.activity)) {
    return r.activity as Record<string, unknown>;
  }
  return r;
}

/** Extract an array of activity-like objects from common API envelope shapes */
export function unwrapActivityListPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .filter((x) => x && typeof x === "object")
      .map((x) => unwrapActivityRow(x));
  }
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const keys = [
      "activities",
      "data",
      "items",
      "results",
      "records",
      "content",
      "rows",
    ];
    for (const k of keys) {
      const arr = o[k];
      if (Array.isArray(arr)) {
        return arr
          .filter((x) => x && typeof x === "object")
          .map((x) => unwrapActivityRow(x));
      }
    }
    const nested = o.data;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const inner =
        (nested as Record<string, unknown>).items ??
        (nested as Record<string, unknown>).activities ??
        (nested as Record<string, unknown>).rows ??
        (nested as Record<string, unknown>).data;
      if (Array.isArray(inner)) {
        return inner
          .filter((x) => x && typeof x === "object")
          .map((x) => unwrapActivityRow(x));
      }
    }
  }
  return [];
}

function unwrapSingleActivityPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const o = payload as Record<string, unknown>;
  if (o.activity && typeof o.activity === "object" && !Array.isArray(o.activity)) {
    return unwrapActivityRow(o.activity);
  }
  if (o.data !== undefined && o.data !== null && typeof o.data === "object" && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    if (d.activity && typeof d.activity === "object") {
      return unwrapActivityRow(d.activity);
    }
    return unwrapActivityRow(d);
  }
  return unwrapActivityRow(payload);
}

function synthesizeDescriptionFromMetadata(
  type: string,
  metadata: Record<string, unknown> | undefined,
): string {
  if (!metadata) return "";

  const fileName = firstNonEmptyString(
    metadata.fileName,
    metadata.filename,
    metadata.file_name,
    (metadata.attachment as Record<string, unknown> | undefined)?.fileName,
    (metadata.attachment as Record<string, unknown> | undefined)?.file_name,
  );
  if (fileName && (type === "DOCUMENT_UPLOAD" || type.includes("DOCUMENT"))) {
    return `Document: ${fileName}`;
  }

  const sc = metadata.statusChange;
  if (sc && typeof sc === "object" && !Array.isArray(sc)) {
    const from = firstNonEmptyString((sc as Record<string, unknown>).from);
    const to = firstNonEmptyString((sc as Record<string, unknown>).to);
    if (from && to) return `Status changed from ${from.replace(/_/g, " ")} to ${to.replace(/_/g, " ")}`;
    if (to) return `Status updated to ${to.replace(/_/g, " ")}`;
  }

  const title = firstNonEmptyString(metadata.title, metadata.subject);
  if (title) return title;

  const action = firstNonEmptyString(metadata.action);
  if (action) return `Activity: ${action.replace(/_/g, " ")}`;

  const reason = firstNonEmptyString(metadata.reason);
  if (reason) return `Note: ${reason}`;

  return "";
}

/**
 * Map a raw activity JSON object (camelCase, snake_case, or alternate keys)
 * into the frontend Activity shape so timeline UI always has text to show.
 */
export function normalizeActivityFromApi(raw: Record<string, unknown>): Activity {
  const metadata =
    raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
      ? (raw.metadata as Record<string, unknown>)
      : undefined;

  const typeRaw = firstNonEmptyString(
    raw.type,
    raw.activityType,
    raw.activity_type,
    "NOTE",
  );
  const normalizedType = String(typeRaw).toUpperCase().replace(/-/g, "_") as ActivityType;

  let description = firstNonEmptyString(
    raw.description,
    raw.message,
    raw.note,
    raw.body,
    raw.summary,
    raw.title,
    raw.content,
    raw.text,
    raw.activityDescription,
    raw.activity_description,
    raw.details,
    raw.comment,
    raw.comments,
  );

  if (!description && metadata) {
    description = synthesizeDescriptionFromMetadata(normalizedType, metadata);
  }

  if (!description) {
    description = "No description was returned for this activity.";
  }

  const id =
    firstNonEmptyString(raw.id, raw.uuid, raw.activityId, raw.activity_id) ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `activity-${crypto.randomUUID()}`
      : `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const createdAt = firstNonEmptyString(
    raw.createdAt,
    raw.created_at,
    raw.createdOn,
    raw.created_on,
    raw.timestamp,
    new Date().toISOString(),
  );

  const updatedAt = firstNonEmptyString(
    raw.updatedAt,
    raw.updated_at,
    createdAt,
  );

  const entityType = (firstNonEmptyString(
    raw.entityType,
    raw.entity_type,
    "PROJECT",
  ) || "PROJECT") as EntityType;

  const entityId = firstNonEmptyString(raw.entityId, raw.entity_id, "");

  const dmRaw = raw.durationMinutes ?? raw.duration_minutes ?? raw.duration;
  let durationMinutes: number | undefined;
  if (typeof dmRaw === "number" && Number.isFinite(dmRaw) && dmRaw > 0) {
    durationMinutes = dmRaw;
  } else if (dmRaw !== undefined && dmRaw !== null && dmRaw !== "") {
    const n = parseInt(String(dmRaw), 10);
    if (Number.isFinite(n) && n > 0) durationMinutes = n;
  }

  const createdBy = firstNonEmptyString(
    raw.createdBy,
    raw.created_by,
    raw.author,
    raw.userName,
    raw.username,
    raw.user_name,
  );

  return {
    id,
    entityType,
    entityId,
    type: normalizedType,
    description,
    durationMinutes,
    metadata: metadata as Record<string, any> | undefined,
    createdBy: createdBy || undefined,
    createdAt,
    updatedAt,
  };
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
  const payload = await handleResponse<unknown>(response);
  return unwrapActivityListPayload(payload).map(normalizeActivityFromApi);
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  return normalizeActivityFromApi(unwrapSingleActivityPayload(payload));
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
  const payload = await handleResponse<unknown>(response);
  const rows = unwrapActivityListPayload(payload);
  return rows.map((row) => {
    const n = normalizeActivityFromApi(row);
    return {
      ...n,
      entityType: (n.entityType || entityType) as EntityType,
      entityId: n.entityId || entityId,
    };
  });
}
