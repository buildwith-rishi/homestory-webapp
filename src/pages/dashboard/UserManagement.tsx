import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Card, Badge, Modal } from "../../components/ui";
import { adminAPI } from "../../services/api";
import { AdminUser, CreateUserRequest, UserRole } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

export const UserManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">(
    "all",
  );

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    phone: "",
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    role: AdminUser["role"];
    phone: string;
  }>({
    name: "",
    role: "CUSTOMER",
    phone: "",
  });
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user has admin role
  const isAdmin = hasRole(UserRole.ADMIN);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching users from API...");

      const response = await adminAPI.getAllUsers();
      console.log("📦 API Response:", response);

      // Handle different response formats
      let usersList: AdminUser[] = [];
      if (response && typeof response === "object") {
        // Check if response has users array
        if ("users" in response && Array.isArray(response.users)) {
          usersList = response.users;
          console.log("✅ Found users in response.users:", usersList.length);
        }
        // Check if response itself is an array
        else if (Array.isArray(response)) {
          usersList = response;
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
            usersList = data;
            console.log(
              "✅ Found users in response.data (array):",
              usersList.length,
            );
          } else if ("users" in data && Array.isArray(data.users)) {
            usersList = data.users as AdminUser[];
            console.log(
              "✅ Found users in response.data.users:",
              usersList.length,
            );
          }
        }
      }

      setUsers(usersList);
      console.log(`✅ Successfully loaded ${usersList.length} users`);
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

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
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

      await adminAPI.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "CUSTOMER",
        phone: "",
      });
      await loadUsers();
      // Success notification
      alert("User created successfully!");
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
        role: editForm.role,
        phone: editForm.phone || undefined,
      });
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

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isBanned) ||
      (statusFilter === "banned" && user.isBanned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      ADMIN: "bg-purple-100 text-purple-700",
      FOUNDER_ARCHITECT: "bg-indigo-100 text-indigo-700",
      PROJECT_MANAGER: "bg-blue-100 text-blue-700",
      DESIGNER: "bg-pink-100 text-pink-700",
      SITE_ENGINEER: "bg-green-100 text-green-700",
      SALES_EXECUTIVE: "bg-orange-100 text-orange-700",
      CUSTOMER: "bg-gray-100 text-gray-700",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-700";
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

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
                {users.filter((u) => !u.isBanned).length}
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
                {users.filter((u) => u.isBanned).length}
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
            <option value="ADMIN">Admin</option>
            <option value="FOUNDER_ARCHITECT">Founder Architect</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="DESIGNER">Designer</option>
            <option value="SITE_ENGINEER">Site Engineer</option>
            <option value="SALES_EXECUTIVE">Sales Executive</option>
            <option value="CUSTOMER">Customer</option>
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
                        {user.role.replace("_", " ")}
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
                            setSelectedUser(user);
                            setEditForm({
                              name: user.name,
                              role: user.role,
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
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
              onClick={() => setShowCreateModal(false)}
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
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              placeholder="Minimum 6 characters"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  role: e.target.value as AdminUser["role"],
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
              <option value="CUSTOMER">Customer</option>
              <option value="DESIGNER">Designer</option>
              <option value="SITE_ENGINEER">Site Engineer</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="SALES_EXECUTIVE">Sales Executive</option>
              <option value="FOUNDER_ARCHITECT">Founder Architect</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={createForm.phone}
              onChange={(e) =>
                setCreateForm({ ...createForm, phone: e.target.value })
              }
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 pt-3 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
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
              Role <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={editForm.role}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  role: e.target.value as AdminUser["role"],
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
              <option value="CUSTOMER">Customer</option>
              <option value="DESIGNER">Designer</option>
              <option value="SITE_ENGINEER">Site Engineer</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="SALES_EXECUTIVE">Sales Executive</option>
              <option value="FOUNDER_ARCHITECT">Founder Architect</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all text-sm"
            />
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
    </div>
  );
};
