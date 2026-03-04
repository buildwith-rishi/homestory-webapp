// Site Engineer API Service
// Handles all site-engineer-specific API operations

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SiteEngineerTask {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description?: string;
  taskType?: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  completedAt?: string;
  completionNotes?: string;
  assignedTo?: string;
  assignedToUserId?: string; // raw server field — used for admin filtering
  assignedToMemberId?: string; // raw server field — used for admin filtering
  photos?: SiteEngineerPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface SiteEngineerPhoto {
  id: string;
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface SiteEngineerProject {
  id: string;
  name: string;
  location?: string;
  status: string;
  stage?: string;
  progress?: number;
  clientName?: string;
  startDate?: string;
  endDate?: string;
}

export interface SiteEngineerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  location?: string;
  joinedAt?: string;
  stats?: {
    totalProjects: number;
    tasksDone: number;
    totalPhotos: number;
  };
}

export interface UpdateTaskStatusRequest {
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  completionNotes?: string;
}

export interface UploadPhotoResponse {
  success: boolean;
  photo?: SiteEngineerPhoto;
  message?: string;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

const getAuthToken = (): string | null => localStorage.getItem("auth_token");

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Response handler ──────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const msg =
      (data as { message?: string; error?: string })?.message ||
      (data as { message?: string; error?: string })?.error ||
      `API Error ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  return data as T;
}

// ── 1. Get assigned tasks ─────────────────────────────────────────────────────
// GET /api/site-engineer/tasks

/** Raw shape returned by the server — fields differ from our SiteEngineerTask type */
type RawSETask = Record<string, unknown> & {
  id: string;
  title: string;
  // server uses taskDate / startDate instead of dueDate
  taskDate?: string;
  startDate?: string;
  dueDate?: string;
  // server may return PENDING instead of TODO
  status?: string;
  // assignment fields (used for admin filtering)
  assignedToUserId?: string;
  assignedToMemberId?: string;
  // project info lives inside nested matrix object
  matrix?: {
    projectId?: string;
    project?: { id?: string; projectName?: string };
    projectStage?: { stageName?: string };
  };
  // projectId may also appear at top level
  projectId?: string;
  category?: { name?: string; color?: string };
};

/** Normalise a raw server task into the SiteEngineerTask shape used by the UI */
function normaliseTask(raw: RawSETask): SiteEngineerTask {
  // Resolve projectId from top-level or nested matrix
  const projectId =
    (raw.projectId as string | undefined) ?? raw.matrix?.projectId ?? "";

  // Resolve project name from nested matrix.project
  const projectName =
    (raw as { projectName?: string }).projectName ??
    raw.matrix?.project?.projectName ??
    undefined;

  // Map taskDate / startDate → dueDate
  const dueDate = raw.dueDate ?? raw.taskDate ?? raw.startDate ?? undefined;
  // Extract only the date part (YYYY-MM-DD) from ISO strings
  const dueDateStr = dueDate
    ? dueDate.includes("T")
      ? dueDate.split("T")[0]
      : dueDate
    : undefined;

  // Normalise status: PENDING → TODO
  const rawStatus = (raw.status as string | undefined)?.toUpperCase() ?? "TODO";
  const status: SiteEngineerTask["status"] =
    rawStatus === "PENDING"
      ? "TODO"
      : rawStatus === "IN_PROGRESS" || rawStatus === "INPROGRESS"
        ? "IN_PROGRESS"
        : rawStatus === "COMPLETED"
          ? "COMPLETED"
          : "TODO";

  return {
    ...(raw as unknown as SiteEngineerTask),
    id: raw.id,
    title: raw.title,
    projectId,
    projectName,
    dueDate: dueDateStr,
    status,
    completed: status === "COMPLETED",
    // Preserve assignment fields for admin-side filtering
    assignedToUserId: raw.assignedToUserId,
    assignedToMemberId: raw.assignedToMemberId,
  };
}

export async function getSiteEngineerTasks(): Promise<SiteEngineerTask[]> {
  const response = await fetch(`${API_BASE_URL}/api/site-engineer/tasks`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<
    RawSETask[] | { tasks: RawSETask[]; total?: number } | { data: RawSETask[] }
  >(response);

  // Extract raw array from varying envelope shapes, then normalise each task
  let rawList: RawSETask[];
  if (Array.isArray(data)) rawList = data;
  else if ("tasks" in data && Array.isArray(data.tasks)) rawList = data.tasks;
  else if ("data" in data && Array.isArray(data.data)) rawList = data.data;
  else rawList = [];

  return rawList.map(normaliseTask);
}
/**
 * Admin-only: fetch SE matrix tasks for a specific team member.
 *
 * Dual strategy for maximum robustness:
 *   1. Try  GET /api/site-engineer/tasks?userId=<userId>  (BDR-style admin override).
 *      Filter the results to tasks actually assigned to this user/member.
 *   2. If strategy-1 returns nothing, fall back to GET /api/site-engineer/tasks
 *      (no filter) and filter client-side by assignedToUserId / assignedToMemberId.
 *      This covers backends that return ALL tasks to an admin token.
 *
 * @param userId   – the User-table id (member.userId).  May be undefined.
 * @param memberId – the TeamMember-table id (member.id). Used as fallback.
 */
export async function getAdminSETasksByUserId(
  userId: string | undefined,
  memberId?: string,
): Promise<SiteEngineerTask[]> {
  /** Parse any envelope shape → raw list */
  const parseEnvelope = (data: unknown): RawSETask[] => {
    if (Array.isArray(data)) return data as RawSETask[];
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.tasks)) return d.tasks as RawSETask[];
      if (Array.isArray(d.data)) return d.data as RawSETask[];
    }
    return [];
  };

  /** Returns true if this raw task belongs to the requested member */
  const belongsToMember = (t: RawSETask): boolean => {
    if (userId && t.assignedToUserId === userId) return true;
    if (memberId && t.assignedToMemberId === memberId) return true;
    return false;
  };

  const seen = new Map<string, SiteEngineerTask>();

  // ── Strategy 1: ?userId=X (admin BDR-style override) ──────────────────────
  if (userId) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/site-engineer/tasks?userId=${encodeURIComponent(userId)}`,
        { method: "GET", headers: getAuthHeaders() },
      );
      if (res.ok) {
        const raw = parseEnvelope(await res.json().catch(() => []));
        raw
          .filter(belongsToMember)
          .map(normaliseTask)
          .forEach((t) => seen.set(t.id, t));
      }
    } catch {
      /* ignore — fall through to strategy 2 */
    }
  }

  // ── Strategy 2: no filter (admin sees all), filter client-side ─────────────
  // Only run if strategy 1 found nothing (avoids a redundant call when it works).
  if (seen.size === 0) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/site-engineer/tasks`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const raw = parseEnvelope(await res.json().catch(() => []));
        // Filter to tasks that belong to this specific member
        raw
          .filter(belongsToMember)
          .map(normaliseTask)
          .forEach((t) => seen.set(t.id, t));
      }
    } catch {
      /* ignore */
    }
  }

  return Array.from(seen.values());
}
// ── 2. Update task status ─────────────────────────────────────────────────────
// PUT /api/site-engineer/tasks/:taskId/status

export async function updateSiteEngineerTaskStatus(
  taskId: string,
  payload: UpdateTaskStatusRequest,
): Promise<SiteEngineerTask> {
  const response = await fetch(
    `${API_BASE_URL}/api/site-engineer/tasks/${taskId}/status`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await handleResponse<
    SiteEngineerTask | { task: SiteEngineerTask } | { data: SiteEngineerTask }
  >(response);

  if ("task" in data && data.task) return data.task;
  if ("data" in data && (data as { data: SiteEngineerTask }).data)
    return (data as { data: SiteEngineerTask }).data;
  return data as SiteEngineerTask;
}

// ── 3. Upload task photo ──────────────────────────────────────────────────────
// POST /api/site-engineer/tasks/:taskId/upload  (multipart/form-data)

export async function uploadSiteEngineerTaskPhoto(
  taskId: string,
  file: File,
  description?: string,
): Promise<UploadPhotoResponse> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("photo", file);
  if (description) formData.append("description", description);

  const response = await fetch(
    `${API_BASE_URL}/api/site-engineer/tasks/${taskId}/upload`,
    {
      method: "POST",
      headers: {
        // Do NOT set Content-Type for multipart – browser sets it with boundary
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    },
  );

  return handleResponse<UploadPhotoResponse>(response);
}

// ── 4. Get active projects ────────────────────────────────────────────────────
// GET /api/site-engineer/projects

export async function getSiteEngineerProjects(): Promise<
  SiteEngineerProject[]
> {
  const response = await fetch(`${API_BASE_URL}/api/site-engineer/projects`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<
    | SiteEngineerProject[]
    | { projects: SiteEngineerProject[]; total?: number }
    | { data: SiteEngineerProject[] }
  >(response);

  if (Array.isArray(data)) return data;
  if ("projects" in data && Array.isArray(data.projects)) return data.projects;
  if ("data" in data && Array.isArray(data.data)) return data.data;
  return [];
}

// ── 5. Get profile ────────────────────────────────────────────────────────────
// GET /api/site-engineer/profile

export async function getSiteEngineerProfile(): Promise<SiteEngineerProfile> {
  const response = await fetch(`${API_BASE_URL}/api/site-engineer/profile`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<
    | SiteEngineerProfile
    | { profile: SiteEngineerProfile }
    | { data: SiteEngineerProfile }
  >(response);

  if ("profile" in data && data.profile) return data.profile;
  if ("data" in data && (data as { data: SiteEngineerProfile }).data)
    return (data as { data: SiteEngineerProfile }).data;
  return data as SiteEngineerProfile;
}
// ── 6. Get issues ─────────────────────────────────────────────────────────────────────────────
// GET /api/site-engineer/issues

export interface SiteEngineerIssue {
  id: string;
  projectName?: string;
  projectId?: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  location?: string;
}

export async function getSiteEngineerIssues(): Promise<SiteEngineerIssue[]> {
  const response = await fetch(`${API_BASE_URL}/api/site-engineer/issues`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<
    | SiteEngineerIssue[]
    | { issues: SiteEngineerIssue[] }
    | { data: SiteEngineerIssue[] }
  >(response);

  if (Array.isArray(data)) return data;
  if ("issues" in data && Array.isArray(data.issues)) return data.issues;
  if ("data" in data && Array.isArray(data.data)) return data.data;
  return [];
}
