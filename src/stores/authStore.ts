import { create } from "zustand";
import { User, UserRole } from "../types";
import { authAPI, ApiError } from "../services/api";
import { normalizeRole, ROLE_PERMISSIONS, RoleId } from "../config/rbac";

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
}

export const useAuthStore = create<AuthState>((set) => ({
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
        // Normalise the API role to our canonical RoleId
        const apiRole = response.user.role || "BDR";
        const normalizedRoleId: RoleId = normalizeRole(apiRole);

        // Map to UserRole enum value
        const userRole = normalizedRoleId as unknown as UserRole;

        // Get permissions for the role
        const permissions = ROLE_PERMISSIONS[normalizedRoleId] || [];

        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: userRole,
          apiRole: apiRole,
          phone: response.user.phone || "",
          avatar:
            response.user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name)}&background=DC5800&color=fff`,
          createdAt: new Date().toISOString(),
          permissions: permissions,
        };

        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(user));

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
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
}));
