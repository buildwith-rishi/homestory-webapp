// Password API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

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
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch {
    return {} as T;
  }
}

/**
 * POST /api/users/:id/reset-password
 * Resets the password for the given user ID.
 * Requires a valid Bearer token (admin or self).
 */
export async function resetPassword(
  userId: string,
  newPassword: string
): Promise<{ message?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/reset-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  return handleResponse<{ message?: string }>(response);
}
