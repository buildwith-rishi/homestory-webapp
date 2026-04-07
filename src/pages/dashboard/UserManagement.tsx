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
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { Card, Badge, Modal } from "../../components/ui";
import { adminAPI } from "../../services/api";
import { AdminUser, CreateUserRequest } from "../../types";
import {
  getAdminSETasksByUserId,
  getMatrixTaskDetails,
  type SiteEngineerTask,
  type DetailedMatrixTaskAttachment,
} from "../../services/siteEngineerApi";
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

interface UserTaskWithAttachments extends SiteEngineerTask {
  attachments?: DetailedMatrixTaskAttachment[];
}

const formatLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
    (user.id ? localStorage.getItem(`ghs_role_title_${user.id}`) || undefined : undefined)
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
  const [showTaskCalendarModal, setShowTaskCalendarModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [calendarUser, setCalendarUser] = useState<UserListItem | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() =>
    formatLocalDateKey(new Date()),
  );
  const [userTasksLoading, setUserTasksLoading] = useState(false);
  const [userTasksError, setUserTasksError] = useState<string | null>(null);
  const [userTasks, setUserTasks] = useState<UserTaskWithAttachments[]>([]);
  const [taskDetailsLoadingIds, setTaskDetailsLoadingIds] = useState<string[]>([]);
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

  const toDateKey = (value?: string): string | null => {
    if (!value) return null;
    const normalized = value.includes("T") ? value.split("T")[0] : value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return normalized;
  };

  const buildMonthGrid = (month: Date): (Date | null)[] => {
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const firstDay = new Date(year, monthIdx, 1);
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const leadPadding = firstDay.getDay();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < leadPadding; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, monthIdx, day));
    }
    return cells;
  };

  const openUserTaskCalendar = async (user: UserListItem) => {
    setCalendarUser(user);
    setShowTaskCalendarModal(true);
    setUserTasks([]);
    setUserTasksError(null);
    setUserTasksLoading(true);

    const todayKey = formatLocalDateKey(new Date());
    setCalendarMonth(new Date());
    setSelectedCalendarDate(todayKey);

    try {
      const memberId = String(
        (user as unknown as { memberId?: string; teamMemberId?: string; assignedToMemberId?: string })
          .memberId ||
          (user as unknown as { memberId?: string; teamMemberId?: string; assignedToMemberId?: string })
            .teamMemberId ||
          (user as unknown as { memberId?: string; teamMemberId?: string; assignedToMemberId?: string })
            .assignedToMemberId ||
          "",
      ).trim();

      const tasks = await getAdminSETasksByUserId(user.id, memberId || undefined);
      const normalized = tasks
        .map((task) => ({
          ...task,
          dueDate: toDateKey(task.dueDate) || toDateKey(task.createdAt) || undefined,
        }))
        .sort((a, b) => {
          const aDate = a.dueDate || "";
          const bDate = b.dueDate || "";
          if (aDate !== bDate) return aDate.localeCompare(bDate);
          return (a.title || "").localeCompare(b.title || "");
        });

      setUserTasks(normalized);

      const nextSelectedDate =
        normalized.find((task) => task.dueDate === todayKey)?.dueDate ||
        normalized[0]?.dueDate ||
        todayKey;

      setSelectedCalendarDate(nextSelectedDate);
      const nextDate = new Date(`${nextSelectedDate}T00:00:00`);
      if (!Number.isNaN(nextDate.getTime())) {
        setCalendarMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      }
    } catch (error) {
      setUserTasksError(
        error instanceof Error ? error.message : "Failed to load user tasks",
      );
    } finally {
      setUserTasksLoading(false);
    }
  };

  const closeUserTaskCalendar = () => {
    setShowTaskCalendarModal(false);
    setCalendarUser(null);
    setUserTasks([]);
    setUserTasksError(null);
    setTaskDetailsLoadingIds([]);
  };

  const ensureTaskAttachmentsLoaded = async (taskId: string) => {
    const task = userTasks.find((item) => item.id === taskId);
    if (!task || task.attachments) return;
    if (taskDetailsLoadingIds.includes(taskId)) return;

    setTaskDetailsLoadingIds((prev) => [...prev, taskId]);
    try {
      const details = await getMatrixTaskDetails(taskId);
      const attachments = Array.isArray(details.attachments)
        ? details.attachments
        : [];

      setUserTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                attachments,
              }
            : item,
        ),
      );
    } catch (error) {
      console.warn("Failed to load task attachments:", error);
    } finally {
      setTaskDetailsLoadingIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const tasksByDate = useMemo(() => {
    return userTasks.reduce<Record<string, UserTaskWithAttachments[]>>((acc, task) => {
      const key = toDateKey(task.dueDate) || toDateKey(task.createdAt);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [userTasks]);

  const selectedDateTasks = useMemo(
    () => tasksByDate[selectedCalendarDate] || [],
    [tasksByDate, selectedCalendarDate],
  );

  const allTasksSorted = useMemo(
    () =>
      [...userTasks].sort((a, b) => {
        const aDate = toDateKey(a.dueDate) || toDateKey(a.createdAt) || "";
        const bDate = toDateKey(b.dueDate) || toDateKey(b.createdAt) || "";
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return (a.title || "").localeCompare(b.title || "");
      }),
    [userTasks],
  );

  useEffect(() => {
    if (!showTaskCalendarModal || selectedDateTasks.length === 0) return;
    selectedDateTasks.forEach((task) => {
      void ensureTaskAttachmentsLoaded(task.id);
    });
  }, [selectedDateTasks, showTaskCalendarModal]);

  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth]);

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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 text-sm transition-all" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
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
                    Access Level
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Designation
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
                            void openUserTaskCalendar(user);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                        >
                          <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                          View Tasks
                        </button>
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

      {/* User Tasks Calendar Modal */}
      <Modal
        isOpen={showTaskCalendarModal}
        onClose={closeUserTaskCalendar}
        showCloseButton={false}
        size="auto"
      >
        <div className="w-[98vw] max-w-[92rem] h-[88vh] bg-white flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">User Task Calendar</h2>
              <p className="text-sm text-gray-500 mt-1">
                {calendarUser ? `${calendarUser.name} • ${calendarUser.email}` : "Task history"}
              </p>
            </div>
            <button
              type="button"
              onClick={closeUserTaskCalendar}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-5 gap-0">
            <div className="xl:col-span-3 p-6 min-h-0 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {calendarMonth.toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-xs font-semibold text-gray-500 text-center py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-24 md:h-28 rounded-xl bg-gray-50/50" />;
                  }

                  const key = formatLocalDateKey(cell);
                  const dayTasks = tasksByDate[key] || [];
                  const isSelected = key === selectedCalendarDate;
                  const isToday = key === formatLocalDateKey(new Date());

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedCalendarDate(key)}
                      className={`h-24 md:h-28 rounded-xl border p-2 text-left transition-all ${
                        isSelected
                          ? "border-orange-400 bg-orange-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            isToday ? "text-orange-600" : "text-gray-800"
                          }`}
                        >
                          {cell.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className="text-[10px] rounded bg-gray-100 px-1.5 py-0.5 text-gray-700 truncate"
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <p className="text-[10px] text-gray-500">+{dayTasks.length - 2} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-2 p-6 bg-gray-50/50 min-h-0 overflow-y-auto border-t border-gray-100 xl:border-t-0 xl:border-l xl:border-gray-100">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800">Selected Date</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {userTasksLoading ? (
                <div className="p-6 bg-white rounded-xl border border-gray-100 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mx-auto" />
                  <p className="text-sm text-gray-500 mt-3">Loading tasks...</p>
                </div>
              ) : userTasksError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {userTasksError}
                </div>
              ) : selectedDateTasks.length === 0 ? (
                <div className="p-6 bg-white rounded-xl border border-gray-100 text-center">
                  <p className="text-sm font-medium text-gray-700">No tasks on this date</p>
                  <p className="text-xs text-gray-500 mt-1">Select another date to inspect task activity.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => {
                    const isDetailLoading = taskDetailsLoadingIds.includes(task.id);
                    const attachments = task.attachments || [];

                    return (
                      <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900">{task.title}</h5>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {task.projectName || "Project task"}
                            </p>
                          </div>
                          <Badge
                            className={`px-2 py-0.5 ${
                              task.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : task.status === "IN_PROGRESS"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-xs text-gray-600 mt-2">{task.description}</p>
                        )}

                        <div className="mt-3">
                          <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            Uploaded Files
                          </p>
                          {isDetailLoading ? (
                            <p className="text-xs text-gray-500">Loading attachments...</p>
                          ) : attachments.length === 0 ? (
                            <p className="text-xs text-gray-500">No files uploaded for this task.</p>
                          ) : (
                            <div className="space-y-2">
                              {attachments.map((attachment) => {
                                const fileType = String(attachment.fileType || "");
                                const isImage = fileType.startsWith("image/");
                                const openUrl =
                                  (attachment as unknown as { downloadUrl?: string }).downloadUrl ||
                                  attachment.fileUrl;

                                return (
                                  <div
                                    key={attachment.id}
                                    className="rounded-lg border border-gray-200 bg-gray-50 p-2.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">
                                          {attachment.fileName}
                                        </p>
                                        <p className="text-[11px] text-gray-500 truncate">
                                          {attachment.description || fileType || "Attachment"}
                                        </p>
                                      </div>
                                      <a
                                        href={openUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-800"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Open
                                      </a>
                                    </div>

                                    {isImage && (
                                      <a
                                        href={openUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 block"
                                      >
                                        <img
                                          src={openUrl}
                                          alt={attachment.fileName}
                                          className="w-full h-36 object-cover rounded-md border border-gray-200"
                                          loading="lazy"
                                        />
                                      </a>
                                    )}

                                    {!isImage && (
                                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>Preview unavailable. Click Open.</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!userTasksLoading && !userTasksError && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">All Assigned Tasks</h4>
                    <span className="text-xs text-gray-500">{allTasksSorted.length} total</span>
                  </div>

                  {allTasksSorted.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-gray-100 text-xs text-gray-500">
                      No tasks assigned for this user.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allTasksSorted.map((task) => {
                        const taskDate = toDateKey(task.dueDate) || toDateKey(task.createdAt) || "-";
                        const isActiveDate = taskDate === selectedCalendarDate;

                        return (
                          <button
                            type="button"
                            key={`all-${task.id}`}
                            onClick={() => {
                              if (taskDate !== "-") {
                                setSelectedCalendarDate(taskDate);
                                const dt = new Date(`${taskDate}T00:00:00`);
                                if (!Number.isNaN(dt.getTime())) {
                                  setCalendarMonth(new Date(dt.getFullYear(), dt.getMonth(), 1));
                                }
                              }
                            }}
                            className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${
                              isActiveDate
                                ? "border-orange-300 bg-orange-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-gray-800 truncate">{task.title}</p>
                              <span className="text-[11px] text-gray-500 whitespace-nowrap">{taskDate}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              {task.projectName || "Project task"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
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
              Access Level <span className="text-red-500">*</span>
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
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
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
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Access Level <span className="text-red-500">*</span>
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
              Designation <span className="text-red-500">*</span>
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
