import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Loader2,
  Calendar,
  FileText,
  ChevronDown,
  Check,
  Search,
  User,
  Users,
} from "lucide-react";
import type { MatrixCategory, AdminUser } from "../../../types";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

interface NewTaskModalProps {
  matrixId: string;
  dayNumber: number;
  startDate: string;
  categories: MatrixCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper to normalize startDate to ISO string
const normalizeStartDate = (startDate: string): string => {
  const dateOnly = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  return new Date(dateOnly + "T00:00:00").toISOString();
};

// Helper to convert ISO/date string to YYYY-MM-DD for <input type="date">
const toDateInputValue = (dateStr: string): string => {
  return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
};

// Helper to compute task date from day number
const getTaskDate = (startDate: string, dayNum: number): string => {
  const dateOnly = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  const date = new Date(dateOnly + "T00:00:00");
  date.setDate(date.getDate() + (dayNum - 1));
  return date.toISOString();
};

// Helper to format date for display
const formatDateForDisplay = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Format role enum → readable label
const formatRole = (role: string): string =>
  role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  matrixId,
  dayNumber,
  startDate,
  categories,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState<string>(() =>
    toDateInputValue(startDate),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);

  // categoryAssignees: { [categoryId]: userId }
  const [categoryAssignees, setCategoryAssignees] = useState<
    Record<string, string>
  >({});

  // categoryRoles: { [categoryId]: roleName } — selected role per category
  const [categoryRoles, setCategoryRoles] = useState<Record<string, string>>(
    {},
  );

  // which category's member picker is open
  const [openAssigneeFor, setOpenAssigneeFor] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const taskDate = getTaskDate(selectedStartDate, dayNumber);
  const normalizedStartDate = normalizeStartDate(selectedStartDate);

  useEffect(() => {
    adminAPI
      .getAllUsers()
      .then((res: unknown) => {
        if (
          res &&
          typeof res === "object" &&
          "users" in res &&
          Array.isArray((res as { users: AdminUser[] }).users)
        ) {
          setUsers((res as { users: AdminUser[] }).users);
        } else if (Array.isArray(res)) {
          setUsers(res as AdminUser[]);
        }
      })
      .catch(() => {});
  }, []);

  // Close member picker on outside click
  useEffect(() => {
    if (!openAssigneeFor) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenAssigneeFor(null);
        setAssigneeSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openAssigneeFor]);

  // Unique roles derived from the fetched users list
  const uniqueRoles = useMemo(
    () => [...new Set(users.map((u) => u.role))].sort(),
    [users],
  );

  const toggleCategory = (categoryId: string) => {
    setCategoryAssignees((prev) => {
      const next = { ...prev };
      if (categoryId in next) {
        delete next[categoryId];
        if (openAssigneeFor === categoryId) {
          setOpenAssigneeFor(null);
          setAssigneeSearch("");
        }
      } else {
        next[categoryId] = "";
      }
      return next;
    });
    // Clear role selection when deselecting a category
    setCategoryRoles((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const selectRole = (categoryId: string, role: string) => {
    setCategoryRoles((prev) => ({ ...prev, [categoryId]: role }));
    // Clear assigned user when role changes
    setCategoryAssignees((prev) => ({ ...prev, [categoryId]: "" }));
    setOpenAssigneeFor(null);
    setAssigneeSearch("");
  };

  const selectAssignee = (categoryId: string, userId: string) => {
    setCategoryAssignees((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === userId ? "" : userId,
    }));
    setOpenAssigneeFor(null);
    setAssigneeSearch("");
  };

  // Users filtered by the role selected for the currently-open category
  const filteredUsers = useMemo(() => {
    const role = openAssigneeFor ? categoryRoles[openAssigneeFor] : null;
    const byRole = role ? users.filter((u) => u.role === role) : users;
    if (!assigneeSearch.trim()) return byRole;
    const q = assigneeSearch.toLowerCase();
    return byRole.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, openAssigneeFor, categoryRoles, assigneeSearch]);

  const getUserInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    const selectedCategories = Object.keys(categoryAssignees);
    if (selectedCategories.length === 0) {
      setError("Please select at least one work category");
      return;
    }
    setSaving(true);
    try {
      const taskPromises = selectedCategories.map(async (categoryId) => {
        const assignedUserId = categoryAssignees[categoryId];
        const payload: Record<string, unknown> = {
          dayNumber,
          categoryId,
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: normalizedStartDate,
          taskDate,
        };
        if (assignedUserId) {
          payload.assignedToUserId = assignedUserId;
          payload.assignedToMemberId = assignedUserId;
        }
        const response = await fetch(
          `${API_BASE_URL}/api/matrices/${matrixId}/tasks`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          let msg = `Failed to create task: ${response.status}`;
          try {
            const d = await response.json();
            msg = d.message || d.error || msg;
          } catch (parseErr) {
            void parseErr;
          }
          throw new Error(msg);
        }
        return response.json();
      });
      await Promise.all(taskPromises);
      toast.success(
        `Successfully created ${selectedCategories.length} task(s)`,
      );
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create task";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOpenAssigneeFor(null);
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Day {dayNumber} • {formatDateForDisplay(taskDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-5"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="Enter task title..."
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description{" "}
              <span className="text-xs font-normal text-gray-400">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-colors"
              placeholder="Add task description..."
              rows={3}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={toDateInputValue(taskDate)}
              readOnly
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 cursor-default transition-colors"
            />
          </div>

          {/* Work Categories & Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Work Categories & Assignees{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Select a category, choose a role, then assign a team member
            </p>

            <div className="space-y-2">
              {categories.map((category) => {
                const isSelected = category.id in categoryAssignees;
                const selectedRole = categoryRoles[category.id] || "";
                const assignedUserId = categoryAssignees[category.id] || "";
                const assignedUser = users.find((u) => u.id === assignedUserId);
                const isMemberPickerOpen = openAssigneeFor === category.id;

                // Count of members for the selected role
                const membersInRole = selectedRole
                  ? users.filter((u) => u.role === selectedRole)
                  : [];

                return (
                  <div key={category.id}>
                    {/* ── Category row ── */}
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all select-none ${
                        isSelected
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            className="w-3 h-3 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${isSelected ? "text-orange-900" : "text-gray-700"}`}
                        >
                          {category.name}
                        </p>
                      </div>

                      {/* Assigned member chip */}
                      {isSelected && assignedUser && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-orange-200 rounded-full flex-shrink-0">
                          <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">
                              {getUserInitials(assignedUser.name)}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-orange-700 max-w-[80px] truncate">
                            {assignedUser.name.split(" ")[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── Expanded section: role selector + member picker ── */}
                    {isSelected && (
                      <div
                        className="mt-1.5 ml-8 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Step 1 — Role dropdown */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Role
                            </span>
                          </div>
                          <div className="relative flex-1">
                            <select
                              value={selectedRole}
                              onChange={(e) =>
                                selectRole(category.id, e.target.value)
                              }
                              className={`w-full appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors ${
                                selectedRole
                                  ? "border-orange-300 bg-orange-50 text-orange-800 font-medium"
                                  : "border-gray-200 bg-white text-gray-500"
                              }`}
                            >
                              <option value="">
                                {users.length === 0
                                  ? "Loading roles..."
                                  : "Select a role..."}
                              </option>
                              {uniqueRoles.map((role) => {
                                const count = users.filter(
                                  (u) => u.role === role,
                                ).length;
                                return (
                                  <option key={role} value={role}>
                                    {formatRole(role)} ({count})
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Step 2 — Member picker (only after role is selected) */}
                        {selectedRole && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Assignee
                              </span>
                            </div>
                            <div
                              className="relative flex-1"
                              ref={isMemberPickerOpen ? dropdownRef : undefined}
                            >
                              {/* Trigger button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenAssigneeFor(
                                    isMemberPickerOpen ? null : category.id,
                                  );
                                  setAssigneeSearch("");
                                }}
                                className={`w-full flex items-center justify-between pl-3 pr-2.5 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                                  assignedUser
                                    ? "border-orange-300 bg-orange-50"
                                    : "border-gray-200 bg-white hover:border-orange-300"
                                }`}
                              >
                                {assignedUser ? (
                                  <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                      <span className="text-[8px] font-bold text-white">
                                        {getUserInitials(assignedUser.name)}
                                      </span>
                                    </div>
                                    <span className="font-medium text-orange-800 truncate">
                                      {assignedUser.name}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Select member
                                    {membersInRole.length > 0 &&
                                      ` (${membersInRole.length} available)`}
                                    …
                                  </span>
                                )}
                                <ChevronDown
                                  className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${isMemberPickerOpen ? "rotate-180" : ""}`}
                                />
                              </button>

                              {/* Member picker dropdown */}
                              {isMemberPickerOpen && (
                                <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                  {/* Search */}
                                  <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                      <input
                                        type="text"
                                        value={assigneeSearch}
                                        onChange={(e) =>
                                          setAssigneeSearch(e.target.value)
                                        }
                                        placeholder={`Search ${formatRole(selectedRole)}s…`}
                                        autoFocus
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"
                                      />
                                    </div>
                                  </div>

                                  {/* "No assignee" option */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      selectAssignee(category.id, "")
                                    }
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                                      !assignedUserId ? "bg-orange-50" : ""
                                    }`}
                                  >
                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                      <User className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                    <span className="text-sm text-gray-500 italic">
                                      No assignee
                                    </span>
                                    {!assignedUserId && (
                                      <Check className="w-3.5 h-3.5 text-orange-500 ml-auto" />
                                    )}
                                  </button>

                                  {/* Filtered member list */}
                                  <div className="max-h-44 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                      <p className="px-4 py-3 text-sm text-gray-400 text-center">
                                        No{" "}
                                        {formatRole(selectedRole).toLowerCase()}
                                        s found
                                      </p>
                                    ) : (
                                      filteredUsers.map((u) => (
                                        <button
                                          key={u.id}
                                          type="button"
                                          onClick={() =>
                                            selectAssignee(category.id, u.id)
                                          }
                                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-orange-50/60 transition-colors ${
                                            assignedUserId === u.id
                                              ? "bg-orange-50"
                                              : ""
                                          }`}
                                        >
                                          <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                              assignedUserId === u.id
                                                ? "bg-orange-500 text-white"
                                                : "bg-gray-200 text-gray-600"
                                            }`}
                                          >
                                            {getUserInitials(u.name)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                              {u.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                              {u.email}
                                            </p>
                                          </div>
                                          {assignedUserId === u.id && (
                                            <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                          )}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                {Object.keys(categoryAssignees).length > 1
                  ? `Create ${Object.keys(categoryAssignees).length} Tasks`
                  : "Create Task"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
