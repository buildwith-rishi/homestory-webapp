import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types";
import type { RoleId } from "../../config/rbac";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Legacy: restrict by UserRole enum values */
  allowedRoles?: UserRole[];
  /** New: restrict by RoleId strings (e.g. 'SUPER_ADMIN', 'BDR') */
  allowedRoleIds?: RoleId[];
  /** New: restrict by permission string (e.g. 'leads.read') */
  requiredPermission?: string;
  /** Where to redirect if access denied (defaults to /dashboard) */
  fallback?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowedRoleIds,
  requiredPermission,
  fallback = "/dashboard",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, roleId, can } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check RoleId-based access (new RBAC)
  if (allowedRoleIds && roleId) {
    if (!allowedRoleIds.includes(roleId)) {
      return <Navigate to={fallback} replace />;
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    if (!can(requiredPermission)) {
      return <Navigate to={fallback} replace />;
    }
  }

  // Legacy role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
