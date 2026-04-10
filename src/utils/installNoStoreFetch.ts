import { onUnauthorizedResponse } from "../auth/sessionExpired";

const FETCH_NO_STORE_MARKER = "__ghs_fetch_no_store_installed__";

type GlobalWithFetchMarker = typeof globalThis & {
  [FETCH_NO_STORE_MARKER]?: boolean;
};

function getFetchInputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * Only skip the global session-expired popup for endpoints where 401 is
 * expected (wrong password, bad refresh body). Do NOT skip /api/auth/me,
 * /api/auth/validate, etc. — those 401s mean the session is dead.
 */
function isSkippableAuthFailureUrl(urlString: string): boolean {
  try {
    const u = urlString.includes("://")
      ? new URL(urlString)
      : new URL(urlString, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const base = path.split("/").filter(Boolean);
    // .../api/auth/<segment>
    const i = base.indexOf("api");
    if (i < 0 || base[i + 1] !== "auth") return false;
    const segment = (base[i + 2] || "").toLowerCase();
    return (
      segment === "login" ||
      segment === "refresh" ||
      segment === "register" ||
      segment === "admin-setup"
    );
  } catch {
    return /\/api\/auth\/(login|refresh|register|admin-setup)(\/|\?|#|$)/i.test(
      urlString,
    );
  }
}

/**
 * Wraps window.fetch so that:
 *  1. Every request uses `cache: "no-store"` (avoids stale data).
 *  2. Auth/session failures fire session-expired UI. Service layers also call
 *     `onUnauthorizedResponse`, but this is the safety net for any fetch path.
 *
 * 401 / 419 / 440 are handled synchronously (before awaiting JSON) so the
 * modal cannot be blocked by a slow or stuck response body.
 */
export function installNoStoreFetch(): void {
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }

  const globalWithMarker = globalThis as GlobalWithFetchMarker;
  if (globalWithMarker[FETCH_NO_STORE_MARKER]) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const mergedInit: RequestInit = {
      ...(init ?? {}),
      cache: "no-store",
    };

    const response = await originalFetch(input, mergedInit);

    if (response.status >= 400) {
      const url = getFetchInputUrl(input);

      if (!isSkippableAuthFailureUrl(url)) {
        const st = response.status;

        if (st === 401 || st === 419 || st === 440) {
          onUnauthorizedResponse(response, undefined);
        } else {
          let data: unknown;
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            try {
              data = await response.clone().json();
            } catch {
              data = undefined;
            }
          }
          onUnauthorizedResponse(response, data);
        }
      }
    }

    return response;
  };

  globalWithMarker[FETCH_NO_STORE_MARKER] = true;
}
