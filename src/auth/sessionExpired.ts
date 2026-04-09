/**
 * Global session expiry: access token invalid / refresh failed.
 * Dedupes so parallel 401s only trigger one modal.
 */

import { useSessionExpiredStore } from "./sessionExpiredStore";

let sessionExpiredEmitted = false;

const SESSION_TIMEOUT_STATUSES = new Set([401, 419, 440]);
const SESSION_TIMEOUT_MESSAGE_RE =
  /(session\s*expired|session\s*timeout|token\s*expired|jwt\s*expired|invalid\s*token|unauthorized|not\s*authenticated)/i;

export function resetSessionExpiredGuard(): void {
  sessionExpiredEmitted = false;
  useSessionExpiredStore.getState().hide();
}

export function notifySessionExpired(): void {
  if (typeof window === "undefined") return;
  if (sessionExpiredEmitted) return;
  sessionExpiredEmitted = true;

  // Show the overlay FIRST so ProtectedRoute can short-circuit before RBAC runs
  // (otherwise requiredPermission + can() with null roleId sends users to /access-denied).
  try {
    useSessionExpiredStore.getState().show();
  } catch {
    /* ignore */
  }

  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new CustomEvent("ghs:session-expired"));
}

function extractErrorLikeMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const payload = data as Record<string, unknown>;
  const candidates = [
    payload.message,
    payload.error,
    payload.details,
    payload.reason,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

export function isSessionTimeoutStatus(status: number): boolean {
  return SESSION_TIMEOUT_STATUSES.has(status);
}

export function isSessionTimeoutMessage(message: string): boolean {
  if (!message.trim()) return false;
  return SESSION_TIMEOUT_MESSAGE_RE.test(message);
}

export function shouldTreatAsSessionExpired(
  response: Response,
  data?: unknown,
): boolean {
  if (isSessionTimeoutStatus(response.status)) {
    return true;
  }

  const authHeader = response.headers.get("www-authenticate") || "";
  if (isSessionTimeoutMessage(authHeader)) {
    return true;
  }

  const payloadMessage = extractErrorLikeMessage(data);
  return isSessionTimeoutMessage(payloadMessage);
}

/** Call from shared HTTP helpers for timeout-like auth failures */
export function onUnauthorizedResponse(response: Response, data?: unknown): void {
  if (shouldTreatAsSessionExpired(response, data)) {
    notifySessionExpired();
  }
}
