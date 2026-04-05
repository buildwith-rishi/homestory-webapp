import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Ban,
  CheckCircle,
  Search,
  AlertTriangle,
  Unlock,
  X,
  Edit2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, Badge, Modal } from "../../components/ui";
import { adminAPI } from "../../services/api";
import { AdminUser, CreateUserRequest } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import {
  getRoleBadgeClasses,
  getRoleDisplayName,
  type RoleId,
} from "../../config/rbac";

interface ApiRoleTitle {
  id: string;
  roleTitle: string;
  departmentId?: string;
  credentialId?: string;
  department?: {
    id: string;
    name: string;
    description?: string;
  };
  credential?: {
    id: string;
    name: string;
    description?: string;
    roleKey?: string;
  };
}

interface ApiDepartment {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface ApiCredential {
  id: string;
  name: string;
  description?: string;
  roleKey?: string;
  isActive?: boolean;
}

interface ApiRoleDefinition {
  id: string;
  name: string;
  description?: string;
  accessLevel?: string;
  permissions: string[];
}

const normalizeRolesResponse = (response: unknown): ApiRoleDefinition[] => {
  let rawRoles: Array<Record<string, unknown>> = [];

  if (Array.isArray(response)) {
    rawRoles = response as Array<Record<string, unknown>>;
  } else if (response && typeof response === "object") {
    const responseObj = response as Record<string, unknown>;
    if (Array.isArray(responseObj.roles)) {
      rawRoles = responseObj.roles as Array<Record<string, unknown>>;
    } else if (
      responseObj.data &&
      typeof responseObj.data === "object" &&
      Array.isArray((responseObj.data as Record<string, unknown>).roles)
    ) {
      rawRoles = (responseObj.data as Record<string, unknown>)
        .roles as Array<Record<string, unknown>>;
    }
  }

  return rawRoles
    .map((role) => {
      const permissions = Array.isArray(role.permissions)
        ? role.permissions
            .map((permission) => String(permission).trim())
            .filter(Boolean)
        : [];

      return {
        id: String(role.id || "").trim().toUpperCase(),
        name: String(role.name || role.id || "Unknown Role").trim(),
        description: String(role.description || "").trim(),
        accessLevel: String(role.accessLevel || "").trim(),
        permissions,
      } as ApiRoleDefinition;
    })
    .filter((role) => role.id && role.name)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const formatPermissionLabel = (permission: string): string => {
  if (permission === "*") return "Full system access";

  const [module = "", action = ""] = permission.split(".");
  const moduleLabel = module
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const actionLabel =
    action === "*"
      ? "All"
      : action.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return action ? `${moduleLabel} - ${actionLabel}` : moduleLabel;
};

const getPermissionGroupLabel = (permission: string): string => {
  if (permission === "*") return "SYSTEM";
  const module = permission.split(".")[0] || "GENERAL";
  return module.replace(/_/g, " ").toUpperCase();
};

const getAccessLevelPillClasses = (accessLevel?: string): string => {
  const normalized = String(accessLevel || "").toLowerCase();
  if (normalized === "full") return "bg-red-50 text-red-700";
  if (normalized === "high") return "bg-orange-50 text-orange-700";
  if (normalized === "medium") return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-700";
};

const toValidDisplayText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (
    !normalized ||
    normalized === "undefined" ||
    normalized === "null" ||
    normalized === "[object Object]"
  ) {
    return undefined;
  }
  return normalized;
};

const extractRoleTitle = (user: Record<string, unknown>): string | undefined => {
  const roleTitleObject =
    user.roleTitle && typeof user.roleTitle === "object"
      ? (user.roleTitle as Record<string, unknown>)
      : undefined;

  const userRoleTitleObject =
    user.userRoleTitle && typeof user.userRoleTitle === "object"
      ? (user.userRoleTitle as Record<string, unknown>)
      : undefined;

  return (
    toValidDisplayText(user.roleTitle) ||
    toValidDisplayText(user.userRoleTitle) ||
    toValidDisplayText(user.user_role_title) ||
    toValidDisplayText(user.role_title) ||
    toValidDisplayText((user.roleTitleData as Record<string, unknown> | undefined)?.roleTitle) ||
    toValidDisplayText((user.roleTitleData as Record<string, unknown> | undefined)?.title) ||
    toValidDisplayText((user.roleTitleData as Record<string, unknown> | undefined)?.name) ||
    toValidDisplayText(roleTitleObject?.roleTitle) ||
    toValidDisplayText(roleTitleObject?.title) ||
    toValidDisplayText(roleTitleObject?.name) ||
    toValidDisplayText(userRoleTitleObject?.roleTitle) ||
    toValidDisplayText(userRoleTitleObject?.title) ||
    toValidDisplayText(userRoleTitleObject?.name) ||
    toValidDisplayText(user.title) ||
    // Frontend cache fallback if backend drops it entirely
    (user.id ? localStorage.getItem(`ghs_role_title_${user.id}`) : undefined)
  );
};

export const UserManagement: React.FC = () => {
  const { roleId } = useAuth();
  type UserListItem = AdminUser & {
    credentialName?: string;
  };

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleTitles, setRoleTitles] = useState<ApiRoleTitle[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">(
    "all",
  );
  const [activeView, setActiveView] = useState<"users" | "roles">("users");
  const [roles, setRoles] = useState<ApiRoleDefinition[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [expandedRoleIds, setExpandedRoleIds] = useState<string[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [phoneErrorUser, setPhoneErrorUser] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    roleTitle: "",
    phone: "",
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    roleTitle: string;
    departmentId: string;
    credentialId: string;
    phone: string;
  }>({
    name: "",
    email: "",
    roleTitle: "",
    departmentId: "",
    credentialId: "",
    phone: "",
  });
  const [banReason, setBanReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user has admin role
  const isAdmin =
    roleId === "SUPER_ADMIN" ||
    roleId === "ADMIN" ||
    roleId === "LEAD_PROJECT_MANAGER" ||
    roleId === "HR";

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching users from API...");

      const response = await adminAPI.getAllUsers();
      console.log("📦 API Response:", response);

      // Handle different response formats
      let usersList: Array<Record<string, unknown>> = [];
      if (response && typeof response === "object") {
        // Check if response has users array
        if ("users" in response && Array.isArray(response.users)) {
          usersList = response.users as Array<Record<string, unknown>>;
          console.log("✅ Found users in response.users:", usersList.length);
        }
        // Check if response itself is an array
        else if (Array.isArray(response)) {
          usersList = response as Array<Record<string, unknown>>;
          console.log("✅ Response is array:", usersList.length);
        }
        // Check if response has data property with users
        else if (
          "data" in response &&
          response.data &&
          typeof response.data === "object"
        ) {
          const data = response.data as Record<string, unknown>;
          if (Array.isArray(data)) {
            usersList = data as Array<Record<string, unknown>>;
            console.log(
              "✅ Found users in response.data (array):",
              usersList.length,
            );
          } else if ("users" in data && Array.isArray(data.users)) {
            usersList = data.users as Array<Record<string, unknown>>;
            console.log(
              "✅ Found users in response.data.users:",
              usersList.length,
            );
          }
        }
      }

      // Normalize role and roleTitle from varying backend response shapes.
      const normalizedUsers = usersList.map((user) => {
        const credentialFromApi = user.credential as
          | { id?: string; roleKey?: string; name?: string }
          | undefined;

        const roleFromApi =
          user.role ||
          credentialFromApi?.roleKey ||
          credentialFromApi?.name ||
          "BDR";

        const roleTitleFromApi = extractRoleTitle(user);

        return {
          ...user,
          role: String(roleFromApi).toUpperCase() as AdminUser["role"],
          roleTitle: roleTitleFromApi,
          departmentId:
            (user.departmentId as string | undefined) ||
            (user.department_id as string | undefined) ||
            ((user.department as { id?: string } | undefined)?.id as
              | string
              | undefined),
          credentialId:
            (user.credentialId as string | undefined) ||
            (user.credential_id as string | undefined) ||
            (user.userCredentialId as string | undefined) ||
            credentialFromApi?.id ||
            localStorage.getItem(`ghs_credential_id_${user.id}`),
          credentialName:
            (user.credentialName as string | undefined) ||
            (user.credentialTitle as string | undefined) ||
            (user.credential_name as string | undefined) ||
            credentialFromApi?.name,
        } as UserListItem;
      });

      // Deactivated users should not be visible in User Management UI.
      const activeUsersOnly = normalizedUsers.filter(
        (user) => user.isActive !== false,
      );

      setUsers(activeUsersOnly);
      console.log(
        `✅ Successfully loaded ${activeUsersOnly.length} active users (from ${usersList.length} total)`,
      );
    } catch (error) {
      console.error("❌ Failed to load users:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load users";

      // Show error to user
      alert(
        `Failed to load users: ${errorMessage}\n\nPlease check:\n1. You are logged in as Admin\n2. Backend server is running\n3. API endpoint /api/users is accessible`,
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRoleTitles = async () => {
    try {
      const response = (await adminAPI.getRoleTitles()) as unknown;
      let titles: ApiRoleTitle[] = [];

      if (Array.isArray(response)) {
        titles = response;
      } else if (
        response &&
        typeof response === "object" &&
        "roleTitles" in response &&
        Array.isArray((response as { roleTitles: unknown[] }).roleTitles)
      ) {
        titles = (response as { roleTitles: ApiRoleTitle[] }).roleTitles;
      } else if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown[] }).data)
      ) {
        titles = (response as { data: ApiRoleTitle[] }).data;
      }

      setRoleTitles(titles);
      if (titles.length > 0) {
        setCreateForm((prev) => ({
          ...prev,
          roleTitle: prev.roleTitle || titles[0].roleTitle,
        }));
      }
    } catch (err) {
      console.error("Failed to load role titles:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = (await adminAPI.getDepartments()) as unknown;
      let departmentList: ApiDepartment[] = [];

      if (Array.isArray(response)) {
        departmentList = response;
      } else if (
        response &&
        typeof response === "object" &&
        "departments" in response &&
        Array.isArray((response as { departments: unknown[] }).departments)
      ) {
        departmentList = (response as { departments: ApiDepartment[] })
          .departments;
      } else if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown[] }).data)
      ) {
        departmentList = (response as { data: ApiDepartment[] }).data;
      }

      setDepartments(departmentList.filter((department) => department.isActive !== false));
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = (await adminAPI.getCredentials()) as unknown;
      let credentialList: ApiCredential[] = [];

      if (Array.isArray(response)) {
        credentialList = response;
      } else if (
        response &&
        typeof response === "object" &&
        "credentials" in response &&
        Array.isArray((response as { credentials: unknown[] }).credentials)
      ) {
        credentialList = (response as { credentials: ApiCredential[] })
          .credentials;
      } else if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown[] }).data)
      ) {
        credentialList = (response as { data: ApiCredential[] }).data;
      }

      setCredentials(credentialList.filter((credential) => credential.isActive !== false));
    } catch (err) {
      console.error("Failed to load credentials:", err);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await adminAPI.getRoles();
      const normalizedRoles = normalizeRolesResponse(response);
      setRoles(normalizedRoles);
    } catch (error) {
      console.error("Failed to load roles:", error);
      alert("Failed to load role permissions. Please try again.");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadRoleTitles();
      loadDepartments();
      loadCredentials();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || activeView !== "roles" || loadingRoles || roles.length > 0) {
      return;
    }
    loadRoles();
  }, [isAdmin, activeView, loadingRoles, roles.length]);

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const getUserRoleLabel = (user: UserListItem) => {
    // Return role_title if available directly on priority
    const directRoleTitle = String(user.roleTitle || "").trim();
    if (directRoleTitle && directRoleTitle !== "undefined" && directRoleTitle !== "null" && directRoleTitle !== "[object Object]") {
      return directRoleTitle;
    }

    if (user.credentialId) {
      const titleByCredential = roleTitles.find(
        (item) => item.credentialId === user.credentialId,
      );
      const matchedRoleTitle = String(titleByCredential?.roleTitle || "").trim();
      if (matchedRoleTitle && matchedRoleTitle !== "undefined" && matchedRoleTitle !== "null") {
        return matchedRoleTitle;
      }
    }

    if (user.role) {
      return getRoleDisplayName(user.role as RoleId);
    }

    return "N/A";
  };

  const getUserCredentialLabel = (user: UserListItem) => {
    // 1. Role explicit check
    if (user.role) {
      const displayName = getRoleDisplayName(user.role as RoleId);
      if (displayName && displayName !== "Unknown Role") {
        return displayName;
      }
    }

    // 2. Direct credential name from the API user object
    const directCredentialName = String(user.credentialName || "").trim();
    if (directCredentialName && directCredentialName !== "undefined" && directCredentialName !== "null") {
      return directCredentialName;
    }

    // 3. Fallback based on Role Title mapping
    const roleTitleConfig = roleTitles.find((item) => {
      const normalizedUserRoleTitle = String(user.roleTitle || "").trim();
      if (normalizedUserRoleTitle && item.roleTitle === normalizedUserRoleTitle) {
        return true;
      }

      if (user.credentialId && item.credentialId === user.credentialId) {
        return true;
      }

      return false;
    });

    const roleTitleCredentialName = String(
      roleTitleConfig?.credential?.name || "",
    ).trim();
    if (roleTitleCredentialName && roleTitleCredentialName !== "undefined" && roleTitleCredentialName !== "null") {
      return roleTitleCredentialName;
    }

    const credentialId = user.credentialId || roleTitleConfig?.credentialId;
    if (credentialId) {
      const credentialName = String(
        credentials.find((item) => item.id === credentialId)?.name || "",
      ).trim();
      if (credentialName && credentialName !== "undefined" && credentialName !== "null") {
        return credentialName;
      }
    }

    return "N/A";
  };

  const roleFilterOptions = useMemo(() => {
    const roleMap = new Map<string, string>();

    users.forEach((user) => {
      const roleKey = String(user.role || "").trim().toUpperCase();
      if (!roleKey) return;

      if (!roleMap.has(roleKey)) {
        roleMap.set(roleKey, getRoleDisplayName(roleKey as RoleId));
      }
    });

    return Array.from(roleMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({
        value,
        label,
      }));
  }, [users]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate phone number
    if (createForm.phone && createForm.phone.trim() !== "") {
      const normalizedNew = createForm.phone.replace(/\s+/g, "").trim();
      const duplicate = users.find(
        (u) =>
          u.phone &&
          u.phone.replace(/\s+/g, "").trim() === normalizedNew,
      );
      if (duplicate) {
        setPhoneErrorUser(duplicate.name);
        return;
      }
    }

    try {
      setActionLoading(true);

      // Debug logging
      console.log("Creating user with data:", {
        ...createForm,
        password: "***",
      });
      console.log("Auth token exists:", !!localStorage.getItem("auth_token"));
      console.log(
        "User role:",
        JSON.parse(localStorage.getItem("user") || "{}").role,
      );

      const createResponse = await adminAPI.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        roleTitle: createForm.roleTitle,
        phone: createForm.phone?.trim() || undefined,
      });

      const newUserCreated = (createResponse as any)?.user || (createResponse as any)?.data?.user || (createResponse as any);

      setShowCreateModal(false);
      setShowCreatePassword(false);
      
      if (newUserCreated && newUserCreated.id) {
        // Cache the specific role and credential so it survives API re-fetches
        // since the GET /api/users endpoint currently drops them.
        if (createForm.roleTitle) {
          localStorage.setItem(`ghs_role_title_${newUserCreated.id}`, createForm.roleTitle);
        }
        if (newUserCreated.credentialId) {
          localStorage.setItem(`ghs_credential_id_${newUserCreated.id}`, newUserCreated.credentialId);
        }

        // Optimistically update the UI with exact API response. This guarantees 'roleTitle'
        // rendering before GET /api/users caches or syncs the DB.
        const normalizedCreatedRoleTitle = extractRoleTitle(
          newUserCreated as Record<string, unknown>,
        );
        setUsers((prev) => [
          {
            ...newUserCreated,
            role: String(newUserCreated.role || "BDR").toUpperCase(),
            roleTitle: normalizedCreatedRoleTitle || createForm.roleTitle,
            credentialId: newUserCreated.credentialId,
          } as UserListItem,
          ...prev.filter((u) => u.id !== newUserCreated.id),
        ]);
        alert("User created successfully!");
      } else {
        await loadUsers();
        alert("User created successfully!");
      }
      
      setCreateForm({
        name: "",
        email: "",
        password: "",
        roleTitle: roleTitles[0]?.roleTitle || "",
        phone: "",
      });

    } catch (error) {
      console.error("Failed to create user:", error);

      // Enhanced error message
      let errorMessage = "Failed to create user";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check for 401 specifically
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        errorMessage =
          "❌ Authentication Error (401)\n\n" +
          "Your session may have expired or you don't have admin permissions.\n\n" +
          "Solutions:\n" +
          "1. Refresh the page and try again\n" +
          "2. Log out and log back in\n" +
          "3. Contact backend team to verify:\n" +
          "   - Token is valid\n" +
          "   - User has ADMIN role\n" +
          "   - /api/admin/users endpoint allows your token";
      }

      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;

    try {
      setActionLoading(true);
      await adminAPI.banUser(selectedUser.id, banReason);
      setShowBanModal(false);
      setBanReason("");
      setSelectedUser(null);
      await loadUsers();
      alert("User banned successfully!");
    } catch (error) {
      console.error("Failed to ban user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to ban user";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminAPI.unbanUser(selectedUser.id);
      setShowUnbanModal(false);
      setSelectedUser(null);
      await loadUsers();
      alert("User unbanned successfully!");
    } catch (error) {
      console.error("Failed to unban user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to unban user";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminAPI.updateUser(selectedUser.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone?.trim() || undefined,
        roleTitle: editForm.roleTitle,
        departmentId: editForm.departmentId,
        credentialId: editForm.credentialId,
      });

      // Cache changes locally to survive API fetches that lack these fields
      if (editForm.roleTitle) {
        localStorage.setItem(`ghs_role_title_${selectedUser.id}`, editForm.roleTitle);
      }
      if (editForm.credentialId) {
        localStorage.setItem(`ghs_credential_id_${selectedUser.id}`, editForm.credentialId);
      }

      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers();
      alert("User updated successfully!");
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminAPI.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      await loadUsers();
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword.trim()) return;

    try {
      setActionLoading(true);
      await adminAPI.resetPassword(selectedUser.id, newPassword);
      setShowResetPasswordModal(false);
      setNewPassword("");
      setSelectedUser(null);
      alert(`Password reset successfully for ${selectedUser.name}!`);
    } catch (error) {
      console.error("Failed to reset password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const isVisibleUser = user.isActive !== false;

    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const normalizedUserRole = String(user.role || "").trim().toUpperCase();
    const matchesRole = roleFilter === "all" || normalizedUserRole === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isBanned && user.isActive !== false) ||
      (statusFilter === "banned" && user.isBanned && user.isActive !== false);

    return isVisibleUser && matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    return getRoleBadgeClasses(role as RoleId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {activeView === "roles" ? "Role Management" : "User Management"}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeView === "roles"
              ? "Manage user roles and their permissions"
              : "Manage system users and permissions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeView === "users" ? (
            <>
              <button
                onClick={() => setActiveView("roles")}
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Role Management
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveView("users")}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
            >
              Back to Users
            </button>
          )}
        </div>
      </div>

      {activeView === "users" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {users.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {users.filter((u) => u.isActive !== false && !u.isBanned).length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Banned Users</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {users.filter((u) => u.isActive !== false && u.isBanned).length}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <Ban className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Admins</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {users.filter((u) => u.role === "ADMIN").length}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-5 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 text-sm transition-all"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 bg-white text-gray-900 text-sm transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.75rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.25em 1.25em",
                }}
              >
                <option value="all">All Roles</option>
                {roleFilterOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "banned")
                }
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 bg-white text-gray-900 text-sm transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.75rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.25em 1.25em",
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto"></div>
            <p className="text-gray-500 mt-4 text-sm">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Credentials
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`${getRoleBadgeColor(user.role)} px-3 py-1`}
                      >
                        {getUserRoleLabel(user)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-slate-100 text-slate-700 px-3 py-1">
                        {getUserCredentialLabel(user)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isBanned ? (
                        <Badge className="bg-red-100 text-red-700 px-3 py-1">
                          <Ban className="w-3 h-3 mr-1" />
                          Banned
                        </Badge>
                      ) : user.isActive === false ? (
                        <Badge className="bg-gray-100 text-gray-700 px-3 py-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 px-3 py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const fallbackRoleTitle =
                              user.roleTitle || roleTitles[0]?.roleTitle || "";
                            const roleTitleConfig = roleTitles.find(
                              (roleTitle) => roleTitle.roleTitle === fallbackRoleTitle,
                            );

                            setSelectedUser(user);
                            setEditForm({
                              name: user.name,
                              email: user.email,
                              roleTitle: fallbackRoleTitle,
                              departmentId:
                                user.departmentId ||
                                roleTitleConfig?.departmentId ||
                                departments[0]?.id ||
                                "",
                              credentialId:
                                user.credentialId ||
                                roleTitleConfig?.credentialId ||
                                credentials[0]?.id ||
                                "",
                              phone: user.phone || "",
                            });
                            setShowEditModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                          Edit
                        </button>
                        {user.isBanned ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUnbanModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1.5" />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1.5" />
                            Ban
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPassword("");
                            setShowResetPasswordModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                          Reset Pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </Card>
        </>
      )}

      {activeView === "roles" && (
        <Card className="p-5 border border-gray-100 space-y-5">
          {loadingRoles ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto" />
              <p className="text-gray-500 mt-4 text-sm">Loading roles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-600 font-medium">No roles found</p>
              <p className="text-gray-400 text-sm mt-1">The roles API did not return any role definitions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => {
                const isExpanded = expandedRoleIds.includes(role.id);
                const uniquePermissions = Array.from(new Set(role.permissions));

                return (
                  <div key={role.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-gray-900">{role.name}</h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getAccessLevelPillClasses(role.accessLevel)}`}
                          >
                            {role.accessLevel || "N/A"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1.5 leading-5">
                          {role.description || "Role permissions as configured in the backend."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRoleExpand(role.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" />
                        View Access Level
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-3">Assigned Permissions</h4>
                        <div className="space-y-2">
                          {uniquePermissions.length === 0 ? (
                            <p className="text-sm text-gray-500">No permissions configured for this role.</p>
                          ) : (
                            uniquePermissions.map((permission) => (
                              <div
                                key={`${role.id}-${permission}`}
                                className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-800 truncate">
                                    {formatPermissionLabel(permission)}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                  {getPermissionGroupLabel(permission)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowCreatePassword(false);
        }}
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New User
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Add a new team member to the system
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowCreatePassword(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreateUser} className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={createForm.phone || ""}
              onChange={(e) => {
                setPhoneErrorUser(null);
                setCreateForm({ ...createForm, phone: e.target.value });
              }}
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCreatePassword ? "text" : "password"}
                required
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCreatePassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showCreatePassword ? "Hide password" : "Show password"}
              >
                {showCreatePassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={createForm.roleTitle}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  roleTitle: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white text-gray-900 transition-all text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em",
              }}
            >
              {roleTitles.map((role) => (
                <option key={role.id} value={role.roleTitle}>
                  {role.roleTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Role Description */}
          {createForm.roleTitle &&
            roleTitles
              .filter((r) => r.roleTitle === createForm.roleTitle)
              .map((role) => (
                <div
                  key={role.id}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <p className="text-xs font-medium text-blue-700 mb-1">
                    {role.roleTitle}
                    {role.credential?.name ? ` - ${role.credential.name}` : ""}
                  </p>
                  <p className="text-xs text-blue-600">
                    {role.credential?.description || "Role permissions as configured by admin."}
                  </p>
                  {role.department?.name && (
                    <p className="text-xs text-blue-500 mt-1">
                      Department: {role.department.name}
                    </p>
                  )}
                </div>
              ))}

          {/* Modal Footer */}
          <div className="flex gap-3 pt-3 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowCreatePassword(false);
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50"
              disabled={actionLoading}
            >
              {actionLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ban User Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ban User</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Restrict user access to the system
              </p>
            </div>
            <button
              onClick={() => setShowBanModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Ban {selectedUser?.name}?
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                This user will be unable to access the system
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ban Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Violation of terms of service..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 text-gray-900 placeholder-gray-400 transition-all text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={() => setShowBanModal(false)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleBanUser}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all shadow-sm disabled:opacity-50"
            disabled={actionLoading || !banReason.trim()}
          >
            {actionLoading ? "Banning..." : "Ban User"}
          </button>
        </div>
      </Modal>

      {/* Unban User Modal */}
      <Modal
        isOpen={showUnbanModal}
        onClose={() => setShowUnbanModal(false)}
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Unban User
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Restore user access to the system
              </p>
            </div>
            <button
              onClick={() => setShowUnbanModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="p-2 bg-green-100 rounded-lg">
              <Unlock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Unban {selectedUser?.name}?
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                This user will regain access to the system
              </p>
            </div>
          </div>

          {selectedUser?.banReason && (
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Ban Reason
              </p>
              <p className="text-sm text-gray-700">{selectedUser.banReason}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={() => setShowUnbanModal(false)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleUnbanUser}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all shadow-sm disabled:opacity-50"
            disabled={actionLoading}
          >
            {actionLoading ? "Unbanning..." : "Unban User"}
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Update user information
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleEditUser} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Full Name"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              placeholder="email@example.com"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              placeholder="9876543210"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={editForm.roleTitle}
              onChange={(e) => {
                const nextRoleTitle = e.target.value;
                const roleTitleConfig = roleTitles.find(
                  (role) => role.roleTitle === nextRoleTitle,
                );

                setEditForm({
                  ...editForm,
                  roleTitle: nextRoleTitle,
                  departmentId:
                    roleTitleConfig?.departmentId || editForm.departmentId,
                  credentialId:
                    roleTitleConfig?.credentialId || editForm.credentialId,
                });
              }}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white text-gray-900 transition-all text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em",
              }}
            >
              {roleTitles.map((role) => (
                <option key={role.id} value={role.roleTitle}>
                  {role.roleTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={editForm.departmentId}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  departmentId: e.target.value,
                })
              }
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white text-gray-900 transition-all text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em",
              }}
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Credential <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={editForm.credentialId}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  credentialId: e.target.value,
                })
              }
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white text-gray-900 transition-all text-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.25em 1.25em",
              }}
            >
              {credentials.map((credential) => (
                <option key={credential.id} value={credential.id}>
                  {credential.name}
                </option>
              ))}
            </select>
          </div>

          

          {/* Modal Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50"
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delete User
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Permanently remove this user
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Delete {selectedUser?.name}?
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                This action cannot be undone. The user will be permanently
                removed.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUser}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all shadow-sm disabled:opacity-50"
            disabled={actionLoading}
          >
            {actionLoading ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        showCloseButton={false}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Reset Password
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Set a new password for {selectedUser?.name}
              </p>
            </div>
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <KeyRound className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {selectedUser?.name}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {selectedUser?.email}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use a strong password with letters, numbers, and symbols.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={() => setShowResetPasswordModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-all shadow-sm disabled:opacity-50"
              disabled={actionLoading || newPassword.length < 8}
            >
              {actionLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Phone Number Already Exists Modal */}
      <Modal
        isOpen={phoneErrorUser !== null}
        onClose={() => setPhoneErrorUser(null)}
        showCloseButton={false}
        size="sm"
      >
        <div className="px-6 py-5">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>

            {/* Text */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Phone Number Already Exists
              </h3>
              <p className="text-sm text-gray-500 mt-1.5">
                This phone number is already registered to{" "}
                <span className="font-medium text-gray-800">
                  &quot;{phoneErrorUser}&quot;
                </span>
                . Please use a different phone number.
              </p>
            </div>

            {/* Phone display */}
            <div className="w-full px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-medium">
              {createForm.phone}
            </div>

            {/* Button */}
            <button
              onClick={() => setPhoneErrorUser(null)}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
