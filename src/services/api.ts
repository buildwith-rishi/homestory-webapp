// API Configuration
// Always use backend base URL from environment so API calls never hit localhost.
import { normalizeRole } from "../config/rbac";
import { notifySessionExpired } from "../auth/sessionExpired";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

// API Response Types
interface LoginResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string; // Any role string from backend – normalised via rbac.ts
    phone?: string;
    avatar?: string;
    permissions?: string[];
    /** Backend may send any of these for job title */
    designation?: string;
    job_title?: string;
    jobTitle?: string;
    title?: string;
    role_title?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  // Legacy support
  success?: boolean;
  token?: string;
  message?: string;
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

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

  return fallback;
}

// API Error Class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Base fetch wrapper with error handling and auto token refresh
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // If unauthorized and we have a refresh token, try to refresh
      if (
        response.status === 401 &&
        endpoint !== "/api/auth/refresh" &&
        endpoint !== "/api/auth/login"
      ) {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          try {
            // Try to refresh the token
            const refreshResponse = await fetch(
              `${API_BASE_URL}/api/auth/refresh`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
              },
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const newToken = refreshData.accessToken || refreshData.token;

              if (newToken) {
                localStorage.setItem("auth_token", newToken);

                if (refreshData.refreshToken) {
                  localStorage.setItem(
                    "refresh_token",
                    refreshData.refreshToken,
                  );
                }

                // Retry original request with new token
                const retryConfig = {
                  ...config,
                  headers: {
                    ...config.headers,
                    Authorization: `Bearer ${newToken}`,
                  },
                };

                const retryResponse = await fetch(
                  `${API_BASE_URL}${endpoint}`,
                  retryConfig,
                );
                const retryData = await retryResponse.json();

                if (!retryResponse.ok) {
                  if (retryResponse.status === 401) {
                    notifySessionExpired();
                  }
                  throw new ApiError(
                    retryResponse.status,
                    getApiErrorMessage(retryData, "Request failed"),
                    retryData,
                  );
                }

                return retryData;
              }
            }
          } catch {
            // Refresh failed, clear tokens and throw error
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            notifySessionExpired();
            throw new ApiError(401, "Session expired. Please login again.");
          }
        }
      }

      if (
        response.status === 401 &&
        endpoint !== "/api/auth/refresh" &&
        endpoint !== "/api/auth/login"
      ) {
        notifySessionExpired();
      }

      throw new ApiError(
        response.status,
        getApiErrorMessage(data, "An error occurred"),
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "Network error occurred",
    );
  }
}

// Auth API
export const authAPI = {
  // Admin Setup - Create first admin user
  adminSetup: async (
    name: string,
    email: string,
    password: string,
    adminSecret: string,
  ): Promise<LoginResponse> => {
    const response = await fetchAPI<LoginResponse>("/api/auth/admin-setup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, adminSecret }),
    });

    // Store token if provided (support both formats)
    const token = response.accessToken || response.token;
    if (token) {
      localStorage.setItem("auth_token", token);
    }

    // Store refresh token if provided
    if (response.refreshToken) {
      localStorage.setItem("refresh_token", response.refreshToken);
    }

    return response;
  },

  // Regular login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetchAPI<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Store token if provided (support both formats)
    const token = response.accessToken || response.token;
    if (token) {
      localStorage.setItem("auth_token", token);
    }

    // Store refresh token if provided
    if (response.refreshToken) {
      localStorage.setItem("refresh_token", response.refreshToken);
    }

    return response;
  },

  // Refresh access token using refresh token
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetchAPI<LoginResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    // Store new tokens
    const token = response.accessToken || response.token;
    if (token) {
      localStorage.setItem("auth_token", token);
    }

    if (response.refreshToken) {
      localStorage.setItem("refresh_token", response.refreshToken);
    }

    return response;
  },

  // Logout - call backend and clear local storage
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      // Call backend logout endpoint
      if (refreshToken) {
        await fetchAPI("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      // Continue with local cleanup even if backend call fails
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },

  // Check if token is valid
  validateToken: async (): Promise<boolean> => {
    try {
      await fetchAPI("/api/auth/validate", {
        method: "GET",
      });
      return true;
    } catch {
      return false;
    }
  },

  // Get current user profile
  getProfile: async () => {
    return fetchAPI("/api/auth/me", {
      method: "GET",
    });
  },
};

// Projects API (for future use)
export const projectsAPI = {
  getAll: async () => {
    return fetchAPI("/api/projects", { method: "GET" });
  },

  getById: async (id: string) => {
    return fetchAPI(`/api/projects/${id}`, { method: "GET" });
  },

  create: async (data: Record<string, unknown>) => {
    return fetchAPI("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Record<string, unknown>) => {
    return fetchAPI(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },
};

// Leads API (for future use)
export const leadsAPI = {
  getAll: async () => {
    return fetchAPI("/api/leads", { method: "GET" });
  },

  create: async (data: Record<string, unknown>) => {
    return fetchAPI("/api/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Admin API - User Management
const adminRequestInFlight = new Map<string, Promise<unknown>>();

/** After first probe, skip the failing route so we do not GET admin (404) then GET users every time. */
let adminUsersListRoute: "admin" | "legacy" | null = null;

async function withAdminInFlightDedup<T>(
  requestKey: string,
  requestFactory: () => Promise<T>,
): Promise<T> {
  const existing = adminRequestInFlight.get(requestKey) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const requestPromise = requestFactory();
  adminRequestInFlight.set(requestKey, requestPromise as Promise<unknown>);

  try {
    return await requestPromise;
  } finally {
    if (adminRequestInFlight.get(requestKey) === requestPromise) {
      adminRequestInFlight.delete(requestKey);
    }
  }
}

export const adminAPI = {
  // Get all users
  getAllUsers: async () => {
    return withAdminInFlightDedup("admin:getAllUsers:limit=1000", async () => {
      if (adminUsersListRoute === "legacy") {
        return fetchAPI("/api/users?limit=1000", { method: "GET" });
      }
      if (adminUsersListRoute === "admin") {
        return fetchAPI("/api/admin/users?limit=1000", { method: "GET" });
      }
      try {
        const data = await fetchAPI("/api/admin/users?limit=1000", {
          method: "GET",
        });
        adminUsersListRoute = "admin";
        return data;
      } catch (error) {
        // Backward compatibility fallback for environments still on legacy route.
        if (
          error instanceof ApiError &&
          (error.status === 401 ||
            error.status === 403 ||
            error.status === 404 ||
            error.status === 405)
        ) {
          adminUsersListRoute = "legacy";
          return fetchAPI("/api/users?limit=1000", { method: "GET" });
        }
        throw error;
      }
    });
  },

  // Get only BDR users (filtered server-side with role param, falls back to client filter)
  getBDRUsers: async (): Promise<{ id: string; name: string; email: string; role: string; isActive: boolean; isBanned: boolean }[]> => {
    const globalWithCache = globalThis as typeof globalThis & {
      __ghs_bdr_users_cache__?: {
        data: { id: string; name: string; email: string; role: string; isActive: boolean; isBanned: boolean }[];
        expiresAt: number;
      };
      __ghs_bdr_users_in_flight__?: Promise<{ id: string; name: string; email: string; role: string; isActive: boolean; isBanned: boolean }[]>;
    };

    const now = Date.now();
    const cached = globalWithCache.__ghs_bdr_users_cache__;
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    if (globalWithCache.__ghs_bdr_users_in_flight__) {
      return globalWithCache.__ghs_bdr_users_in_flight__;
    }

    const request = (async () => {
      type UsersResponse = { users?: unknown[]; data?: unknown; [key: string]: unknown } | unknown[];

      const parseUsersFromResponse = (payload: UsersResponse): Record<string, unknown>[] => {
        if (Array.isArray(payload)) {
          return payload as Record<string, unknown>[];
        }

        if (payload && typeof payload === "object") {
          if (Array.isArray(payload.users)) {
            return payload.users as Record<string, unknown>[];
          }

          const data = payload.data;
          if (Array.isArray(data)) {
            return data as Record<string, unknown>[];
          }

          if (data && typeof data === "object") {
            const nested = data as { users?: unknown[]; data?: unknown };
            if (Array.isArray(nested.users)) {
              return nested.users as Record<string, unknown>[];
            }
            if (Array.isArray(nested.data)) {
              return nested.data as Record<string, unknown>[];
            }
          }
        }

        return [];
      };

      const normalizeUsers = (rawUsers: Record<string, unknown>[]) => {
        const seen = new Set<string>();

        return rawUsers
          .filter((u) => u && u.id)
          .map((u) => {
            const credential = u.credential as
              | { roleKey?: string; name?: string }
              | undefined;

            const rawRole =
              (u.role as string | undefined) ||
              (u.roleTitle as string | undefined) ||
              (u.userRoleTitle as string | undefined) ||
              (u.role_title as string | undefined) ||
              (u.user_role_title as string | undefined) ||
              credential?.roleKey ||
              credential?.name ||
              "";

            const normalizedRole = normalizeRole(rawRole || "BDR");
            const id = String(u.id);
            const name = String(
              (u.name as string | undefined) ||
                (u.fullName as string | undefined) ||
                (u.full_name as string | undefined) ||
                (u.email as string | undefined) ||
                "",
            ).trim();
            const email = String(
              (u.email as string | undefined) ||
                (u.userEmail as string | undefined) ||
                "",
            ).trim();

            return {
              id,
              name,
              email,
              role: normalizedRole,
              isActive: u.isActive !== false,
              isBanned: u.isBanned === true,
            };
          })
          // Leads assignment supports BDR and Sales users.
          .filter((u) => (u.role === "BDR" || u.role === "SALES") && !u.isBanned && u.isActive)
          .filter((u) => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
          });
      };

      let rawUsers: Record<string, unknown>[] = [];

      try {
        // Keep server-side filtering when supported for lower payloads.
        const roleFilteredResponse = await fetchAPI<UsersResponse>(
          "/api/users?limit=1000&role=BDR",
          { method: "GET" },
        );
        rawUsers = parseUsersFromResponse(roleFilteredResponse);
      } catch (error) {
        console.warn("Role-filtered BDR user fetch failed, falling back:", error);
      }

      if (rawUsers.length === 0) {
        const allUsersResponse = await fetchAPI<UsersResponse>(
          "/api/users?limit=1000",
          { method: "GET" },
        );
        rawUsers = parseUsersFromResponse(allUsersResponse);
      }

      const normalized = normalizeUsers(rawUsers);

      globalWithCache.__ghs_bdr_users_cache__ = {
        data: normalized,
        expiresAt: Date.now() + (normalized.length > 0 ? 60 * 1000 : 10 * 1000),
      };

      return normalized;
    })();

    globalWithCache.__ghs_bdr_users_in_flight__ = request;
    try {
      return await request;
    } finally {
      if (globalWithCache.__ghs_bdr_users_in_flight__ === request) {
        delete globalWithCache.__ghs_bdr_users_in_flight__;
      }
    }
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    return fetchAPI(`/api/users/${userId}`, { method: "GET" });
  },

  // Create a new user
  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    roleTitle: string;
    phone?: string;
  }) => {
    return fetchAPI("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Update user
  updateUser: async (
    userId: string,
    userData: {
      name?: string;
      email?: string;
      phone?: string;
      roleTitle?: string;
      departmentId?: string;
      credentialId?: string;
    },
  ) => {
    return fetchAPI(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  // Ban a user
  banUser: async (userId: string, reason: string) => {
    return fetchAPI(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Unban a user
  unbanUser: async (userId: string) => {
    return fetchAPI(`/api/admin/users/${userId}/unban`, {
      method: "POST",
    });
  },

  // Delete a user (soft delete)
  deleteUser: async (userId: string) => {
    return fetchAPI(`/api/users/${userId}`, {
      method: "DELETE",
    });
  },

  // Reset a user's password (admin only)
  // POST /api/users/:id/reset-password
  resetPassword: async (userId: string, newPassword: string) => {
    return fetchAPI(`/api/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },

  // Get all roles from backend
  getRoles: async () => {
    return fetchAPI("/api/roles", { method: "GET" });
  },

  // Get all role titles for user creation and display
  getRoleTitles: async () => {
    return withAdminInFlightDedup("admin:getRoleTitles", () =>
      fetchAPI("/api/users/role-titles", { method: "GET" }),
    );
  },

  // Get all departments for update-user form
  getDepartments: async () => {
    return withAdminInFlightDedup("admin:getDepartments", () =>
      fetchAPI("/api/departments", { method: "GET" }),
    );
  },

  // Get all credentials for update-user form
  getCredentials: async () => {
    return withAdminInFlightDedup("admin:getCredentials", () =>
      fetchAPI("/api/credentials", { method: "GET" }),
    );
  },
};

export default {
  auth: authAPI,
  projects: projectsAPI,
  leads: leadsAPI,
  admin: adminAPI,
};
