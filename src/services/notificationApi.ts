// Notification API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
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

function extractList(data: unknown): Notification[] {
  if (Array.isArray(data)) return data as Notification[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Notification[];
    if (Array.isArray(obj.notifications)) return obj.notifications as Notification[];
    if (Array.isArray(obj.results)) return obj.results as Notification[];
  }
  return [];
}

/** GET /api/notifications – Fetch all notifications */
export async function getNotifications(): Promise<Notification[]> {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<unknown>(response);
  return extractList(data);
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
