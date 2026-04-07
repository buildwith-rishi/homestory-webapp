// Team API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

export interface TeamMember {
  id: string;
  userId?: string; // references the User table — used for assignedToUserId in tasks
  isCrmUser?: boolean;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  memberType: string;
  isActive?: boolean;
  isBanned?: boolean;
  isDeactivated?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  memberType: string;
  isActive?: boolean;
}

export interface UpdateTeamMemberPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  memberType?: string;
  isActive?: boolean;
}

/** A single day-plan task as returned by GET /api/team/:id */
export interface DayTask {
  id: string;
  title: string;
  status: string; // "TODO" | "PENDING" | "IN_PROGRESS" | "COMPLETED"
  taskDate?: string;
  dayNumber?: number;
  categoryName?: string;
  project?: {
    id: string;
    projectName: string;
    projectNumber?: string;
  };
}

export interface TeamMemberMetrics {
  totalTasksAssigned: number;
  completedTasks: number;
  totalDayTasks: number;
  completedDayTasks: number;
  projectsAsDesigner: number;
  projectsAsPM: number;
  assignedLeads: number;
  convertedLeads: number;
  newLeads: number;
}

/** Full profile response from GET /api/team/:id */
export interface TeamMemberProfile {
  memberInfo: TeamMember;
  tasks: unknown[];
  dayTasks: DayTask[];
  projects: unknown[];
  leads: unknown[];
  attachments: unknown[];
  metrics: TeamMemberMetrics;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

function extractList(data: unknown): TeamMember[] {
  if (Array.isArray(data)) return data as TeamMember[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as TeamMember[];
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.members)) return inner.members as TeamMember[];
      if (Array.isArray(inner.team)) return inner.team as TeamMember[];
    }
    if (Array.isArray(obj.team)) return obj.team as TeamMember[];
    if (Array.isArray(obj.members)) return obj.members as TeamMember[];
    if (Array.isArray(obj.results)) return obj.results as TeamMember[];
  }
  return [];
}

/** GET /api/team – Fetch all team members */
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch(`${API_BASE_URL}/api/team`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<unknown>(response);
  return extractList(data);
}

/** Extract a single TeamMember from a potentially-wrapped API response */
function extractMember(data: unknown): TeamMember {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // The team detail endpoint returns { memberInfo: {...}, dayTasks: [...], ... }
    if (obj.memberInfo && typeof obj.memberInfo === "object")
      return obj.memberInfo as TeamMember;
    // Other common wrapper shapes
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data))
      return obj.data as TeamMember;
    if (obj.member && typeof obj.member === "object")
      return obj.member as TeamMember;
    if (obj.teamMember && typeof obj.teamMember === "object")
      return obj.teamMember as TeamMember;
  }
  return data as TeamMember;
}

/** GET /api/team/:id – Fetch the full team member profile (memberInfo + tasks + metrics) */
export async function getTeamMemberProfile(
  id: string,
): Promise<TeamMemberProfile> {
  const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<Record<string, unknown>>(response);
  // Normalise: if the server returns the raw member object instead of the profile shape,
  // wrap it so callers always get a consistent TeamMemberProfile.
  if (!data.memberInfo) {
    return {
      memberInfo: data as unknown as TeamMember,
      tasks: [],
      dayTasks: [],
      projects: [],
      leads: [],
      attachments: [],
      metrics: {
        totalTasksAssigned: 0,
        completedTasks: 0,
        totalDayTasks: 0,
        completedDayTasks: 0,
        projectsAsDesigner: 0,
        projectsAsPM: 0,
        assignedLeads: 0,
        convertedLeads: 0,
        newLeads: 0,
      },
    };
  }
  return data as unknown as TeamMemberProfile;
}

/** GET /api/team/:id – Fetch a single team member by their UUID (member fields only) */
export async function getTeamMemberById(id: string): Promise<TeamMember> {
  const profile = await getTeamMemberProfile(id);
  return profile.memberInfo;
}

/** POST /api/team – Create a new team member */
export async function createTeamMember(
  payload: CreateTeamMemberPayload,
): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/api/team`, {
    method: "POST",
    headers: getAuthHeaders(),
    // Always send isActive: true so the record can be soft-deleted later
    body: JSON.stringify({ isActive: true, ...payload }),
  });
  return handleResponse<TeamMember>(response);
}

/** PUT /api/team/:id – Update a team member (supports isActive and all fields) */
export async function updateTeamMember(
  id: string,
  payload: UpdateTeamMemberPayload,
): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<unknown>(response);
  return extractMember(data);
}

/** DELETE /api/team/:id – Delete (soft-delete) a team member.
 *  If the server returns a Prisma "record not found" error the record is
 *  already gone — treat that as a successful delete so the UI can clean up. */
export async function deleteTeamMember(id: string): Promise<void> {
  const isNotFoundError = (text: string) =>
    text.toLowerCase().includes("no record was found") ||
    text.toLowerCase().includes("record to update not found") ||
    text.toLowerCase().includes("record not found") ||
    text.toLowerCase().includes("required but not found");

  const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  // 204 No Content or 200 — success
  if (response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        await response.json();
      } catch {
        /* ignore */
      }
    }
    return;
  }

  let errorBody: Record<string, unknown> = {};
  try {
    errorBody = await response.json();
  } catch {
    /* ignore */
  }
  const errText = String(errorBody.error ?? errorBody.message ?? "");

  // Record doesn't exist → already deleted, resolve silently
  if (isNotFoundError(errText) || response.status === 404) {
    return;
  }

  // Other server error
  throw new Error(errText || `HTTP error! status: ${response.status}`);
}
