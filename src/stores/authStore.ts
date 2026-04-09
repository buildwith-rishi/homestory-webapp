import { create } from "zustand";
import { User, UserRole } from "../types";
import { authAPI, ApiError } from "../services/api";
import { normalizeRole, ROLE_PERMISSIONS, RoleId } from "../config/rbac";
import { resetSessionExpiredGuard } from "../auth/sessionExpired";
import {
  buildSessionUserPatchesFromApiPayload,
  unwrapUserFromMeResponse,
} from "../utils/userProfileFields";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  setUser: (user: User | null) => void;
  clearError: () => void;
  /** Merge designation / access level from GET /api/auth/me (same fields as User Management). */
  refreshCurrentUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // Call actual API
      const response = await authAPI.login(email, password);

      if (response.user) {
        const raw = response.user as unknown as Record<string, unknown>;
        const apiRole =
          (typeof raw.role === "string" && raw.role.trim()) || "BDR";
        const normalizedRoleId: RoleId = normalizeRole(apiRole);
        const userRole = normalizedRoleId as unknown as UserRole;
        const permissions = ROLE_PERMISSIONS[normalizedRoleId] || [];

        const patches = buildSessionUserPatchesFromApiPayload(raw);

        const user: User = {
          id: String(raw.id ?? response.user.id),
          email: String(raw.email ?? response.user.email),
          name: String(raw.name ?? response.user.name),
          role: userRole,
          apiRole,
          phone: response.user.phone || "",
          avatar:
            response.user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(String(response.user.name))}&background=DC5800&color=fff`,
          createdAt: new Date().toISOString(),
          permissions,
          ...patches,
        };

        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(user));

        resetSessionExpiredGuard();

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Enrich from /api/auth/me when login body omits nested roleTitle / credential (matches User Management).
        void get().refreshCurrentUserProfile();
      } else {
        throw new Error("Login failed - no user data received");
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "An unexpected error occurred";

      set({
        isLoading: false,
        error: errorMessage,
        user: null,
        isAuthenticated: false,
      });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      // Call backend logout API (this also clears localStorage)
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear state
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateProfile: (updates: Partial<User>) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  clearError: () => {
    set({ error: null });
  },

  refreshCurrentUserProfile: async () => {
    const { user } = get();
    if (!user?.id) return;
    if (!localStorage.getItem("auth_token")) return;
    try {
      const data = await authAPI.getProfile();
      const payload = unwrapUserFromMeResponse(data);
      if (!payload) return;

      const idFromApi = String(payload.id ?? "");
      if (idFromApi && idFromApi !== user.id) return;

      const patches = buildSessionUserPatchesFromApiPayload(payload);
      if (Object.keys(patches).length === 0) return;

      const merged: User = { ...user, ...patches };
      localStorage.setItem("user", JSON.stringify(merged));
      set({ user: merged });
    } catch {
      /* keep session user from login / localStorage */
    }
  },
}));
