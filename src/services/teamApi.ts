// Team API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  memberType: string;
  isActive?: boolean;
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

/** GET /api/team/:id – Fetch team member by ID */
export async function getTeamMemberById(id: string): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TeamMember>(response);
}

/** POST /api/team – Create a new team member */
export async function createTeamMember(
  payload: CreateTeamMemberPayload
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
  payload: UpdateTeamMemberPayload
): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TeamMember>(response);
}

/** DELETE /api/team/:id – Delete (soft-delete) a team member.
 *  Falls back to a PUT with isActive:false if the server returns
 *  a Prisma "record not found" error (meaning it was already inactive). */
export async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = await response.json();
    } catch {
      // ignore parse errors
    }
    const errText = String(errorBody.error ?? errorBody.message ?? '');
    // If Prisma can't find record to soft-delete, fall back to PATCH/PUT
    if (
      errText.toLowerCase().includes('no record was found') ||
      errText.toLowerCase().includes('record to update not found')
    ) {
      const fallback = await fetch(`${API_BASE_URL}/api/team/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: false }),
      });
      await handleResponse<unknown>(fallback);
      return;
    }
    const message = errText || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  // Response may be 204 No Content — only parse JSON if body exists
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try { await response.json(); } catch { /* ignore */ }
  }
}
