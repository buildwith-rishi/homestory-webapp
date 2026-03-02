import React, { useState, useEffect, useRef } from "react";
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
  // Handle ISO strings like "2026-02-11T00:00:00.000Z" and plain "2026-02-11"
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
  const [categoryAssignees, setCategoryAssignees] = useState<
    Record<string, string>
  >({});
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

  // Close dropdown on outside click
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
  };

  const selectAssignee = (categoryId: string, userId: string) => {
    setCategoryAssignees((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === userId ? "" : userId,
    }));
    setOpenAssigneeFor(null);
    setAssigneeSearch("");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(assigneeSearch.toLowerCase()),
  );

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
              value={selectedStartDate}
              onChange={(e) => setSelectedStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              required
            />
          </div>

          {/* Work Categories & Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Work Categories & Assignees{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Select categories and optionally assign a team member to each
            </p>

            <div className="space-y-2">
              {categories.map((category) => {
                const isSelected = category.id in categoryAssignees;
                const assignedUserId = categoryAssignees[category.id] || "";
                const assignedUser = users.find((u) => u.id === assignedUserId);
                const isOpen = openAssigneeFor === category.id;

                return (
                  <div key={category.id}>
                    {/* Category row */}
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all select-none ${
                        isSelected
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {/* Custom checkbox */}
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
                      {/* Assignee chip — shown when category is selected and user assigned */}
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
                      {/* Assign button — shown when selected but no assignee yet */}
                      {isSelected && !assignedUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAssigneeFor(isOpen ? null : category.id);
                            setAssigneeSearch("");
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-orange-300 hover:text-orange-600 transition-colors flex-shrink-0"
                        >
                          <User className="w-3 h-3" />
                          Assign
                        </button>
                      )}
                      {/* Change assignee button — shown when assigned */}
                      {isSelected && assignedUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAssigneeFor(isOpen ? null : category.id);
                            setAssigneeSearch("");
                          }}
                          className="p-1 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0"
                          title="Change assignee"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Inline assignee picker — expands below the category row */}
                    {isSelected && isOpen && (
                      <div
                        ref={dropdownRef}
                        className="mt-1 ml-8 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                      >
                        {/* Search */}
                        <div className="p-2.5 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              value={assigneeSearch}
                              onChange={(e) =>
                                setAssigneeSearch(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Search team members..."
                              autoFocus
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"
                            />
                          </div>
                        </div>

                        {/* "No assignee" option */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAssignee(category.id, "");
                          }}
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

                        {/* User list */}
                        <div className="max-h-44 overflow-y-auto">
                          {filteredUsers.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 text-center">
                              No users found
                            </p>
                          ) : (
                            filteredUsers.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAssignee(category.id, u.id);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-orange-50/60 transition-colors ${
                                  assignedUserId === u.id ? "bg-orange-50" : ""
                                }`}
                              >
                                {/* Avatar */}
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
                );
              })}
            </div>
          </div>

          {/* Task Date Info */}
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Start Date:{" "}
                <strong>{formatDateForDisplay(normalizedStartDate)}</strong>
                {" · "}Task scheduled for <strong>Day {dayNumber}</strong> on{" "}
                <strong>{formatDateForDisplay(taskDate)}</strong>
              </span>
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
