import { notifySessionExpired } from "../auth/sessionExpired";

const FETCH_NO_STORE_MARKER = "__ghs_fetch_no_store_installed__";

type GlobalWithFetchMarker = typeof globalThis & {
  [FETCH_NO_STORE_MARKER]?: boolean;
};

const AUTH_PATH_RE = /\/api\/auth\//;

/**
 * Wraps window.fetch so that:
 *  1. Every request uses `cache: "no-store"` (avoids stale data).
 *  2. Any 401 on a non-auth API endpoint fires `notifySessionExpired()` as a
 *     last-resort safety-net.  Service-layer handlers already call it, but if
 *     a code-path ever skips the handler the user will still see the popup.
 *
 * The 401 interception does NOT prevent the response from reaching the caller;
 * `notifySessionExpired` dedupes internally so multiple parallel 401s only
 * trigger the modal once.
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

    if (response.status === 401) {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (!AUTH_PATH_RE.test(url)) {
        notifySessionExpired();
      }
    }

    return response;
  };

  globalWithMarker[FETCH_NO_STORE_MARKER] = true;
}
