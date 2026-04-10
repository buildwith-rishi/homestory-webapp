import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import { Button } from "../ui";
import { useAuthStore } from "../../stores/authStore";
import {
  resetSessionExpiredGuard,
  takeRefreshTokenForSessionExpiredLogout,
} from "../../auth/sessionExpired";
import { useSessionExpiredStore } from "../../auth/sessionExpiredStore";

const AUTO_REDIRECT_SECONDS = 20;

/** Above all app UI (z-[10000] modals, drawers, etc.) */
const OVERLAY_Z = 2147483000;

function loginPathForLocation(pathname: string): string {
  if (pathname.startsWith("/bdr") && !pathname.startsWith("/bdr/login")) {
    return "/bdr/login";
  }
  return "/login";
}

/**
 * SessionExpiredModal — always portaled to `document.body` with a fixed z-index.
 * Does not use the shared Modal/Framer wrapper so nothing can block the overlay.
 */
export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const visible = useSessionExpiredStore((s) => s.visible);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const finishedRef = useRef(false);

  const completeLogoutAndRedirect = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsLoggingOut(true);

    const target = loginPathForLocation(location.pathname);

    try {
      const rt = takeRefreshTokenForSessionExpiredLogout();
      if (rt) {
        try {
          localStorage.setItem("refresh_token", rt);
        } catch {
          /* ignore */
        }
      }
      await useAuthStore.getState().logout();
    } catch {
      useAuthStore.getState().setUser(null);
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      } catch {
        /* ignore */
      }
    } finally {
      navigate(target, { replace: true });
      resetSessionExpiredGuard();
      setIsLoggingOut(false);
    }
  }, [navigate, location.pathname]);

  // Belt-and-suspenders: notifySessionExpired dispatches this after show(); ensure UI syncs.
  useEffect(() => {
    const sync = () => {
      useSessionExpiredStore.getState().show();
    };
    window.addEventListener("ghs:session-expired", sync);
    return () => window.removeEventListener("ghs:session-expired", sync);
  }, []);

  useEffect(() => {
    if (!visible) {
      finishedRef.current = false;
      setSecondsLeft(AUTO_REDIRECT_SECONDS);
      setIsLoggingOut(false);
      return;
    }

    finishedRef.current = false;
    setSecondsLeft(AUTO_REDIRECT_SECONDS);

    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void completeLogoutAndRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [visible, completeLogoutAndRedirect]);

  if (!visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-desc"
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: OVERLAY_Z,
        backgroundColor: "rgba(17, 24, 39, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={() => {
        if (!isLoggingOut) void completeLogoutAndRedirect();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              id="session-expired-title"
              className="text-lg font-bold text-gray-900"
            >
              Session expired
            </h2>
            <p
              id="session-expired-desc"
              className="text-sm text-gray-600 mt-2 leading-relaxed"
            >
              Your access token is no longer valid. Sign in again to continue.
              Use Log out below to end this session on the server (recommended).
            </p>
            {secondsLeft > 0 && !isLoggingOut && (
              <p className="text-xs text-gray-400 mt-3" aria-live="polite">
                You will be redirected to login in {secondsLeft}&nbsp;second
                {secondsLeft !== 1 ? "s" : ""}…
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center justify-center gap-2"
            disabled={isLoggingOut}
            onClick={() => void completeLogoutAndRedirect()}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging out…
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Log out
              </>
            )}
          </Button>
          <p className="text-xs text-center text-gray-400">
            Clears your session and opens the sign-in page.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};
