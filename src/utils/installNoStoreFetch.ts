const FETCH_NO_STORE_MARKER = "__ghs_fetch_no_store_installed__";

type GlobalWithFetchMarker = typeof globalThis & {
  [FETCH_NO_STORE_MARKER]?: boolean;
};

/**
 * Ensures every browser fetch uses no-store so stale API/data responses are not reused.
 * Also globally captures 401 Unauthorized errors from our backend API to notify the UI
 * that the session has expired.
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

    // If an API request responds with 401 Unauthorised, emit an event
    // Ignore refresh token or login endpoints to prevent infinite redirect loops on failed log-ins.
    const urlString = input.toString();
    const isAuthEndpoint = urlString.includes("/api/auth/");
    if (
      response.status === 401 &&
      urlString.includes("/api/") &&
      !isAuthEndpoint
    ) {
      window.dispatchEvent(new CustomEvent("sessionExpired"));
    }

    return response;
  };

  globalWithMarker[FETCH_NO_STORE_MARKER] = true;
}
