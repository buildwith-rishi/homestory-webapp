/**
 * Global session expiry: access token invalid / refresh failed.
 * Dedupes so parallel 401s only trigger one modal.
 */

import { useSessionExpiredStore } from "./sessionExpiredStore";

let sessionExpiredEmitted = false;

export function resetSessionExpiredGuard(): void {
  sessionExpiredEmitted = false;
  useSessionExpiredStore.getState().hide();
}

export function notifySessionExpired(): void {
  if (typeof window === "undefined") return;
  if (sessionExpiredEmitted) return;
  sessionExpiredEmitted = true;

  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  } catch {
    /* ignore */
  }

  useSessionExpiredStore.getState().show();
  window.dispatchEvent(new CustomEvent("ghs:session-expired"));
}

/** Call from shared HTTP helpers when a response is 401 Unauthorized */
export function onUnauthorizedResponse(response: Response): void {
  if (response.status === 401) {
    notifySessionExpired();
  }
}
