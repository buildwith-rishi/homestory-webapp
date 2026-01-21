// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// API Response Types
interface LoginResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    role:
      | "ADMIN"
      | "ENGINEER"
      | "MANAGER"
      | "CUSTOMER"
      | "admin"
      | "engineer"
      | "manager"
      | "customer";
    phone?: string;
    avatar?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  // Legacy support
  success?: boolean;
  token?: string;
  message?: string;
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
async function fetchAPI<T>(
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
                  throw new ApiError(
                    retryResponse.status,
                    retryData.message || "Request failed",
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
            throw new ApiError(401, "Session expired. Please login again.");
          }
        }
      }

      throw new ApiError(
        response.status,
        data.message || "An error occurred",
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

export default {
  auth: authAPI,
  projects: projectsAPI,
  leads: leadsAPI,
};
