const FETCH_NO_STORE_MARKER = "__ghs_fetch_no_store_installed__";

type GlobalWithFetchMarker = typeof globalThis & {
  [FETCH_NO_STORE_MARKER]?: boolean;
};

/**
 * Ensures every browser fetch uses no-store so stale API/data responses are not reused.
 * Session expiry (401) is handled in fetchAPI and service-layer handleResponse helpers
 * so refresh-token retries are not interrupted.
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

    return response;
  };

  globalWithMarker[FETCH_NO_STORE_MARKER] = true;
}
