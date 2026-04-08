import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  Search,
  Shield,
  CalendarDays,
  Image as ImageIcon,
  ExternalLink,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
} from "date-fns";
import { Card, Badge, Modal } from "../../components/ui";
import { adminAPI } from "../../services/api";
import {
  getMatrixTasksForUser,
  getTaskAttachments,
} from "../../services/projectApi";
import { getAttachment } from "../../services/attachmentApi";
import type { AdminUser, MatrixTask, TaskAttachment } from "../../types";
import {
  getRoleBadgeClasses,
  getRoleDisplayName,
  type RoleId,
} from "../../config/rbac";
import toast from "react-hot-toast";

type UserRow = AdminUser & {
  credentialName?: string;
  roleTitle?: string;
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

const extractRoleTitle = (
  user: Record<string, unknown>,
): string | undefined => {
  const roleTitleObject =
    user.roleTitle && typeof user.roleTitle === "object"
      ? (user.roleTitle as Record<string, unknown>)
      : undefined;
  return (
    toValidDisplayText(user.roleTitle) ||
    toValidDisplayText(user.userRoleTitle) ||
    toValidDisplayText(user.user_role_title) ||
    toValidDisplayText(roleTitleObject?.roleTitle) ||
    toValidDisplayText(user.title) ||
    (user.id
      ? localStorage.getItem(`ghs_role_title_${String(user.id)}`) || undefined
      : undefined)
  );
};

function normalizeUsersList(response: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(response))
    return response as Array<Record<string, unknown>>;
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.users))
      return obj.users as Array<Record<string, unknown>>;
    if (obj.data && typeof obj.data === "object") {
      const d = obj.data as Record<string, unknown>;
      if (Array.isArray(d.users))
        return d.users as Array<Record<string, unknown>>;
      if (Array.isArray(obj.data))
        return obj.data as Array<Record<string, unknown>>;
    }
  }
  return [];
}

type MatrixTaskWithAtt = MatrixTask & { attachments?: TaskAttachment[] };

const statusLabel = (s: string) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Normalize API task date to YYYY-MM-DD for calendar / compare */
function toDateKey(iso?: string | null): string | null {
  if (!iso) return null;
  const s = String(iso);
  const part = s.includes("T") ? s.split("T")[0]! : s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : null;
}

/** Load every matrix task for a user (paginated) for calendar + date filter */
async function fetchAllMatrixTasksForUserId(
  userId: string,
): Promise<MatrixTask[]> {
  const limit = 100;
  let offset = 0;
  const byId = new Map<string, MatrixTask>();
  let total: number | undefined;
  while (true) {
    const { tasks, total: t } = await getMatrixTasksForUser(userId, {
      limit,
      offset,
    });
    if (typeof t === "number") total = t;
    for (const task of tasks) {
      if (task.id && !byId.has(task.id)) byId.set(task.id, task);
    }
    if (tasks.length < limit) break;
    if (total !== undefined && byId.size >= total) break;
    offset += limit;
    if (offset > 50000) break;
  }
  return [...byId.values()];
}

export const ViewTasksPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [taskUser, setTaskUser] = useState<UserRow | null>(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [rawTasks, setRawTasks] = useState<MatrixTask[]>([]);
  const [tasks, setTasks] = useState<MatrixTaskWithAtt[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [listLimit, setListLimit] = useState(50);
  const pageSize = 50;
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const resolvedAttachmentIdsRef = useRef<Set<string>>(new Set());

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await adminAPI.getAllUsers();
      const usersList = normalizeUsersList(response);
      const normalized: UserRow[] = usersList.map((user) => {
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
          id: String(user.id || ""),
          name: String(user.name || ""),
          email: String(user.email || ""),
          role: String(roleFromApi).toUpperCase() as AdminUser["role"],
          roleTitle: roleTitleFromApi,
        } as UserRow;
      });
      const active = normalized.filter(
        (u) => u.isActive !== false && !u.isBanned,
      );
      setUsers(active.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.role) set.add(u.role);
    });
    return [...set].sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.roleTitle || "").toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
    return list;
  }, [users, searchQuery, roleFilter]);

  const designationLabel = (user: UserRow) => {
    const direct = String(user.roleTitle || "").trim();
    if (direct && direct !== "undefined" && direct !== "null") return direct;
    if (user.role) return getRoleDisplayName(user.role as RoleId);
    return "—";
  };

  const tasksForCalendar = useMemo(() => {
    let list = rawTasks;
    if (taskStatusFilter) {
      const u = taskStatusFilter.toUpperCase();
      list = list.filter((t) => String(t.status).toUpperCase() === u);
    }
    return list;
  }, [rawTasks, taskStatusFilter]);

  const datesWithTasks = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasksForCalendar) {
      const k = toDateKey(t.taskDate);
      if (k) s.add(k);
    }
    return s;
  }, [tasksForCalendar]);

  const filteredTasks = useMemo(() => {
    let list = tasksForCalendar;
    if (selectedCalendarDate) {
      list = list.filter(
        (t) => toDateKey(t.taskDate) === selectedCalendarDate,
      );
    }
    return list;
  }, [tasksForCalendar, selectedCalendarDate]);

  const visibleTasks = useMemo(
    () => filteredTasks.slice(0, listLimit),
    [filteredTasks, listLimit],
  );

  const loadAllTasksForUser = async (user: UserRow) => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const merged = await fetchAllMatrixTasksForUserId(user.id);
      setRawTasks(merged);
    } catch (e) {
      setTasksError(e instanceof Error ? e.message : "Failed to load tasks");
      setRawTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const openTasks = (user: UserRow) => {
    setTaskUser(user);
    setTasksOpen(true);
    setTaskStatusFilter("");
    setSelectedCalendarDate(null);
    setCalendarMonth(new Date());
    setListLimit(pageSize);
    setRawTasks([]);
    resolvedAttachmentIdsRef.current = new Set();
    setResolvedUrls({});
    void loadAllTasksForUser(user);
  };

  const closeTasks = () => {
    setTasksOpen(false);
    setTaskUser(null);
    setRawTasks([]);
    setTasks([]);
    setTasksError(null);
    setSelectedCalendarDate(null);
    setResolvedUrls({});
    resolvedAttachmentIdsRef.current = new Set();
  };

  useEffect(() => {
    if (!tasksOpen || visibleTasks.length === 0) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const withAtt: MatrixTaskWithAtt[] = await Promise.all(
        visibleTasks.map(async (t) => {
          const ext = t as MatrixTaskWithAtt;
          if (ext.attachments && ext.attachments.length > 0) return ext;
          try {
            const atts = await getTaskAttachments(t.id);
            return { ...t, attachments: Array.isArray(atts) ? atts : [] };
          } catch {
            return { ...t, attachments: [] };
          }
        }),
      );
      if (!cancelled) setTasks(withAtt);
    })();
    return () => {
      cancelled = true;
    };
  }, [tasksOpen, visibleTasks]);

  useEffect(() => {
    if (!tasksOpen || tasks.length === 0) return;
    const flat = tasks.flatMap((t) => t.attachments || []);
    const pending = flat.filter(
      (a) => a.id && !resolvedAttachmentIdsRef.current.has(a.id),
    );
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const att of pending) {
        resolvedAttachmentIdsRef.current.add(att.id);
        try {
          const detail = await getAttachment(att.id);
          const url =
            detail.downloadUrl ||
            detail.storageUrl ||
            detail.url ||
            detail.fileUrl ||
            att.fileUrl;
          if (url) next[att.id] = url;
        } catch {
          if (att.fileUrl?.startsWith("http")) next[att.id] = att.fileUrl;
        }
      }
      if (!cancelled && Object.keys(next).length > 0) {
        setResolvedUrls((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tasksOpen, tasks]);

  const canLoadMore = listLimit < filteredTasks.length;

  const isHydratingAttachments =
    !tasksLoading &&
    visibleTasks.length > 0 &&
    tasks.length === 0 &&
    !tasksError;

  const calendarWeekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthGridCells = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const leading = start.getDay();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    days.forEach((d) => cells.push(d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth]);

  const refreshTasksForDateFromServer = useCallback(
    async (dateStr: string) => {
      if (!taskUser) return;
      try {
        const { tasks: dayTasks } = await getMatrixTasksForUser(taskUser.id, {
          date: dateStr,
          limit: 200,
          offset: 0,
        });
        if (!dayTasks.length) return;
        setRawTasks((prev) => {
          const m = new Map(prev.map((t) => [t.id, t]));
          for (const t of dayTasks) m.set(t.id, t);
          return [...m.values()];
        });
      } catch {
        /* API may not support date filter; client list still applies */
      }
    },
    [taskUser],
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
          <ClipboardList className="w-7 h-7 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">View Tasks</h1>
          <p className="text-gray-600 mt-1 text-sm max-w-2xl">
            Select a team member to see matrix tasks assigned to them across all
            projects. Completed tasks may include photo attachments (e.g. from
            site engineers or BDRs).
          </p>
        </div>
      </div>

      <Card className="p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search by name, email, or designation…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white min-w-[160px]"
          >
            <option value="all">All roles</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {getRoleDisplayName(r as RoleId)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden border border-gray-100">
        {loadingUsers ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-500">Loading users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No users match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Access level
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Designation
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        className={`${getRoleBadgeClasses(user.role)} px-2.5 py-0.5`}
                      >
                        {getRoleDisplayName(user.role as RoleId)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {designationLabel(user)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openTasks(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        View Tasks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={tasksOpen}
        onClose={closeTasks}
        showCloseButton={false}
        size="auto"
      >
        <div className="w-[96vw] max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Tasks for {taskUser?.name || "User"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{taskUser?.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Designation: {taskUser ? designationLabel(taskUser) : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={closeTasks}
              className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          <div className="px-5 py-3 border-b border-gray-50 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                value={taskStatusFilter}
                onChange={(e) => {
                  setTaskStatusFilter(e.target.value);
                  setListLimit(pageSize);
                }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            {selectedCalendarDate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCalendarDate(null);
                  setListLimit(pageSize);
                }}
                className="text-xs font-medium text-orange-600 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50"
              >
                Clear date filter
              </button>
            )}
          </div>

          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Calendar — days with a dot have at least one task (respects status
              filter). Click a day to show only tasks on that date.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm w-full max-w-[320px]">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((m) => subMonths(m, 1))
                    }
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">
                    {format(calendarMonth, "MMMM yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((m) => addMonths(m, 1))
                    }
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-gray-400 mb-1">
                  {calendarWeekdays.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {monthGridCells.map((day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={`pad-${idx}`}
                          className="aspect-square min-h-[2rem]"
                        />
                      );
                    }
                    const key = format(day, "yyyy-MM-dd");
                    const inMonth = isSameMonth(day, calendarMonth);
                    const hasTask = datesWithTasks.has(key);
                    const isSel = selectedCalendarDate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (selectedCalendarDate === key) {
                            setSelectedCalendarDate(null);
                            setListLimit(pageSize);
                          } else {
                            setSelectedCalendarDate(key);
                            setListLimit(pageSize);
                            void refreshTasksForDateFromServer(key);
                          }
                        }}
                        className={[
                          "aspect-square min-h-[2rem] rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-colors",
                          inMonth ? "text-gray-900" : "text-gray-300",
                          isSel
                            ? "bg-orange-500 text-white"
                            : "hover:bg-orange-50 text-gray-800",
                        ].join(" ")}
                      >
                        <span>{format(day, "d")}</span>
                        {hasTask && (
                          <span
                            className={
                              isSel
                                ? "w-1 h-1 rounded-full bg-white"
                                : "w-1 h-1 rounded-full bg-orange-500"
                            }
                            aria-hidden
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedCalendarDate && (
                <p className="text-sm text-gray-600 pt-1">
                  Showing tasks for{" "}
                  <span className="font-semibold text-gray-900">
                    {format(
                      new Date(selectedCalendarDate + "T12:00:00"),
                      "EEE, d MMM yyyy",
                    )}
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    ({filteredTasks.length} total
                    {taskStatusFilter ? ", status filtered" : ""})
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
            {tasksLoading ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-sm text-gray-500">Loading tasks…</p>
              </div>
            ) : tasksError ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {tasksError}
              </div>
            ) : isHydratingAttachments ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-sm text-gray-500">Loading details…</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">
                No matrix tasks found for this user with the current filters.
              </p>
            ) : (
              tasks.map((task) => {
                const projectLabel =
                  (task as { project?: { projectName?: string } }).project
                    ?.projectName ||
                  (task as { matrix?: { project?: { projectName?: string } } })
                    .matrix?.project?.projectName ||
                  "—";
                const atts = task.attachments || [];
                return (
                  <div
                    key={task.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Project: {projectLabel} · Day {task.dayNumber}
                          {task.taskDate && (
                            <>
                              {" "}
                              ·{" "}
                              {new Date(task.taskDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </>
                          )}
                        </p>
                      </div>
                      <Badge
                        className={
                          String(task.status).toUpperCase() === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : String(task.status).toUpperCase() ===
                                "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {statusLabel(String(task.status))}
                      </Badge>
                    </div>
                    {task.completionNotes && (
                      <p className="text-sm text-gray-600 mt-2 border-l-2 border-orange-200 pl-2">
                        {task.completionNotes}
                      </p>
                    )}
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Attachments
                      </p>
                      {atts.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No files uploaded.
                        </p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {atts.map((att) => {
                            const openUrl =
                              resolvedUrls[att.id] ||
                              (att as { downloadUrl?: string }).downloadUrl ||
                              att.fileUrl;
                            const isImage = String(
                              att.fileType || "",
                            ).startsWith("image/");
                            return (
                              <div
                                key={att.id}
                                className="rounded-lg border border-gray-100 bg-gray-50 p-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-gray-800 truncate">
                                    {att.fileName}
                                  </span>
                                  {openUrl && (
                                    <a
                                      href={openUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-orange-600 flex items-center gap-1 shrink-0"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Open
                                    </a>
                                  )}
                                </div>
                                {isImage && openUrl && (
                                  <a
                                    href={openUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 block"
                                  >
                                    <img
                                      src={openUrl}
                                      alt=""
                                      className="w-full h-32 object-cover rounded-md border border-gray-200"
                                    />
                                  </a>
                                )}
                                {!isImage && (
                                  <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                                    <ImageIcon className="w-3 h-3" />
                                    {att.attachmentType || att.fileType}
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
              })
            )}

            {!tasksLoading &&
              !tasksError &&
              canLoadMore &&
              taskUser && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setListLimit((n) => n + pageSize)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Load more ({tasks.length} of {filteredTasks.length})
                  </button>
                </div>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
