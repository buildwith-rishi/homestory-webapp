import { createContext, useContext, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { User, UserRole } from "../types";
import {
  hasPermission,
  hasAnyPermission,
  RoleId,
  ROLES,
  normalizeRole,
} from "../config/rbac";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  /** Check a single dot-notation permission, e.g. 'leads.read' */
  can: (permission: string) => boolean;
  /** Check if user has ANY of the listed permissions */
  canAny: (permissions: string[]) => boolean;
  /** Get the normalised RoleId for the current user */
  roleId: RoleId | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, logout, setUser } =
    useAuthStore();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [setUser]);

  // Note: do not setUser(null) on ghs:session-expired here — many dashboard
  // components assume user is non-null. SessionExpiredModal clears auth only when
  // redirecting to login. ProtectedRoute short-circuits while the modal is visible.

  // Get normalised RoleId
  const roleId: RoleId | null = user
    ? normalizeRole(user.apiRole || (user.role as string) || "BDR")
    : null;

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
      // Route to role-specific default page
      const userRoleId = normalizeRole(
        currentUser.apiRole || (currentUser.role as string) || "BDR",
      );
      const defaultRoute = ROLES[userRoleId]?.defaultRoute || "/dashboard";
      navigate(defaultRoute);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  /** Permission check: e.g. can('leads.read') */
  const can = (permission: string): boolean => {
    if (!roleId) return false;
    return hasPermission(roleId, permission);
  };

  /** Any-of permission check */
  const canAny = (permissions: string[]): boolean => {
    if (!roleId) return false;
    return hasAnyPermission(roleId, permissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        hasRole,
        can,
        canAny,
        roleId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
