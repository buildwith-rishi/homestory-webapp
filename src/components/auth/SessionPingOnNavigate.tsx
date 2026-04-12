import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useSessionExpiredStore } from "../../auth/sessionExpiredStore";

function isAuthenticatedAppPath(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/signup") return false;
  if (pathname === "/bdr/login") return false;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/app")) return true;
  if (pathname === "/instagram") return true;
  if (pathname === "/bdr" || pathname.startsWith("/bdr/")) return true;
  return false;
}

/**
 * Runs a lightweight GET /api/auth/me on each in-app navigation so an expired
 * access token triggers the global session-expired flow without a full reload.
 * Sidebar tab switches are client-side only and may not refetch data.
 */
export function SessionPingOnNavigate(): null {
  const location = useLocation();
  const sessionExpiredVisible = useSessionExpiredStore((s) => s.visible);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (sessionExpiredVisible) return;

    const pathname = location.pathname;
    if (!isAuthenticatedAppPath(pathname)) {
      prevPathRef.current = pathname;
      return;
    }

    try {
      if (!localStorage.getItem("auth_token")) return;
    } catch {
      return;
    }

    const prev = prevPathRef.current;
    if (prev === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prev === pathname) return;
    prevPathRef.current = pathname;

    void authAPI.getProfile().catch(() => {
      /* fetchAPI + installNoStoreFetch call notifySessionExpired on 401 */
    });
  }, [location.pathname, sessionExpiredVisible]);

  return null;
}
