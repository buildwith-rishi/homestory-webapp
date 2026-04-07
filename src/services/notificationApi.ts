// Notification API Service — GET /api/notifications
// Response shape per API docs: { notifications: [...], count: number }
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

/** Icon bucket for dashboard UI (maps from API `type`) */
export type NotificationIconKind = "success" | "info" | "warning" | "error";

export interface Notification {
  id: string;
  /** API enum e.g. TASK_DEADLINE, ACTIVITY_UPDATE */
  apiType: string;
  title: string;
  message: string;
  type: NotificationIconKind;
  read: boolean;
  createdAt: string;
  link?: string | null;
  dueDate?: string | null;
  performedBy?: string | null;
  projectName?: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  /** Total count reported by API (may differ from array length if capped) */
  count: number;
}

interface RawNotification {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  description?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  dueDate?: string;
  link?: string | null;
  performedBy?: string | null;
  projectName?: string | null;
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
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

function mapApiTypeToIconKind(rawType: string): NotificationIconKind {
  const t = rawType.toUpperCase();
  if (t === "ACTIVITY_UPDATE") return "info";
  if (
    t === "TASK_DEADLINE" ||
    t === "PAYMENT_DEADLINE" ||
    t === "PROJECT_DEADLINE" ||
    t.includes("DEADLINE")
  ) {
    return "warning";
  }
  if (t === "ERROR" || t === "FAILED") return "error";
  if (t === "SUCCESS") return "success";
  if (t === "WARNING") return "warning";
  return "info";
}

function normalizeNotification(item: RawNotification): Notification {
  const apiType = (item.type || "INFO").trim();
  const iconKind = mapApiTypeToIconKind(apiType);

  const messageText =
    (typeof item.message === "string" && item.message.trim()
      ? item.message
      : null) ||
    (typeof item.description === "string" ? item.description : "") ||
    "";

  const created =
    item.createdAt ||
    item.dueDate ||
    new Date().toISOString();

  return {
    id: item.id || `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    apiType,
    title: item.title || "Notification",
    message: messageText,
    type: iconKind,
    read: Boolean(item.read ?? item.isRead ?? false),
    createdAt: created,
    dueDate: item.dueDate ?? null,
    link: item.link ?? undefined,
    performedBy:
      item.performedBy === undefined || item.performedBy === null
        ? null
        : String(item.performedBy),
    projectName:
      item.projectName === undefined || item.projectName === null
        ? null
        : String(item.projectName),
  };
}

function parseNotificationsPayload(data: unknown): NotificationsResponse {
  let list: RawNotification[] = [];
  let count = 0;

  if (Array.isArray(data)) {
    list = data as RawNotification[];
    count = list.length;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.notifications)) {
      list = obj.notifications as RawNotification[];
    } else if (Array.isArray(obj.data)) {
      list = obj.data as RawNotification[];
    } else if (Array.isArray(obj.results)) {
      list = obj.results as RawNotification[];
    }
    const c = obj.count;
    if (typeof c === "number" && Number.isFinite(c)) {
      count = c;
    } else {
      count = list.length;
    }
  }

  return {
    notifications: list.map(normalizeNotification),
    count,
  };
}

/** Deduplicate overlapping GET /notifications (e.g. React Strict Mode double mount). */
const notificationsInFlight = new Map<
  string,
  Promise<NotificationsResponse>
>();

async function fetchNotificationsInternal(): Promise<NotificationsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<unknown>(response);
  return parseNotificationsPayload(data);
}

/** GET /api/notifications — list + total count */
export async function getNotifications(): Promise<NotificationsResponse> {
  const key = "list";
  let p = notificationsInFlight.get(key);
  if (!p) {
    p = fetchNotificationsInternal().finally(() => {
      notificationsInFlight.delete(key);
    });
    notificationsInFlight.set(key, p);
  }
  return p;
}

/** PATCH /api/notifications/:id/read — Mark a notification as read */
export async function markNotificationRead(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (response.ok) return;
}

/** PATCH /api/notifications/read-all — Mark all notifications as read */
export async function markAllNotificationsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (response.ok) return;
}
