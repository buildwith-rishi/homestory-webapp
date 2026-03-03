import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types";
import type { RoleId } from "../../config/rbac";
import PageLoader from "../ui/PageLoader";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Legacy: restrict by UserRole enum values */
  allowedRoles?: UserRole[];
  /** New: restrict by RoleId strings (e.g. 'SUPER_ADMIN', 'BDR') */
  allowedRoleIds?: RoleId[];
  /** New: restrict by permission string (e.g. 'leads.read') */
  requiredPermission?: string;
  /**
   * Where to redirect if access denied.
   * Defaults to /access-denied (shows rich Access Denied page).
   * Pass "/dashboard" to silently redirect to dashboard instead.
   */
  fallback?: string;
  /** Where to redirect if not authenticated (defaults to /login) */
  loginRedirect?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowedRoleIds,
  requiredPermission,
  fallback = "/access-denied",
  loginRedirect = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, roleId, can } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginRedirect}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Check RoleId-based access (new RBAC)
  if (allowedRoleIds && roleId) {
    if (!allowedRoleIds.includes(roleId)) {
      return (
        <Navigate to={fallback} replace state={{ from: location.pathname }} />
      );
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    if (!can(requiredPermission)) {
      return (
        <Navigate to={fallback} replace state={{ from: location.pathname }} />
      );
    }
  }

  // Legacy role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate to={fallback} replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
