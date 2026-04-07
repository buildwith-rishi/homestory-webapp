// Notification API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface RawNotification {
  id?: string;
  title?: string;
  message?: string;
  description?: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  dueDate?: string;
  link?: string;
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

function normalizeNotification(item: RawNotification): Notification {
  const rawType = (item.type || "").toUpperCase();
  const mappedType =
    rawType === "SUCCESS" ||
    rawType === "INFO" ||
    rawType === "WARNING" ||
    rawType === "ERROR"
      ? rawType.toLowerCase()
      : rawType.includes("DEADLINE") || rawType.includes("DUE")
        ? "warning"
        : "info";

  return {
    id: item.id || `notification-${Date.now()}`,
    title: item.title || "Notification",
    message: item.message || item.description || "",
    type: mappedType,
    read: Boolean(item.read ?? item.isRead ?? false),
    createdAt:
      item.createdAt ||
      item.dueDate ||
      // keep stable ISO fallback when backend omits timestamps
      new Date().toISOString(),
    link: item.link,
  };
}

function extractList(data: unknown): Notification[] {
  if (Array.isArray(data))
    return (data as RawNotification[]).map(normalizeNotification);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data))
      return (obj.data as RawNotification[]).map(normalizeNotification);
    if (Array.isArray(obj.notifications))
      return (obj.notifications as RawNotification[]).map(normalizeNotification);
    if (Array.isArray(obj.results))
      return (obj.results as RawNotification[]).map(normalizeNotification);
  }
  return [];
}

/** Deduplicate overlapping GET /notifications (e.g. React Strict Mode double mount). */
const notificationsInFlight = new Map<string, Promise<Notification[]>>();

async function fetchNotificationsInternal(): Promise<Notification[]> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<unknown>(response);
  return extractList(data);
}

/** GET /api/notifications – Fetch all notifications */
export async function getNotifications(): Promise<Notification[]> {
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

/** PATCH /api/notifications/:id/read – Mark a notification as read */
export async function markNotificationRead(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (response.ok) return;
  // Silently ignore if endpoint doesn't exist
}

/** PATCH /api/notifications/read-all – Mark all notifications as read */
export async function markAllNotificationsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (response.ok) return;
  // Silently ignore if endpoint doesn't exist
}
