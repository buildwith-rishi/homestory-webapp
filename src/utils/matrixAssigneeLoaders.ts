/**
 * Shared loaders for matrix task modals: CRM users + team vendors (works for designer / non-admin).
 */
import { onUnauthorizedResponse } from "../auth/sessionExpired";
import { adminAPI, fetchAPI } from "../services/api";
import { getAllTeamMembers, type TeamMember } from "../services/teamApi";
import type { AdminUser } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export function normalizeAssignableUsers(response: unknown): AdminUser[] {
  let usersList: Array<Record<string, unknown>> = [];

  if (Array.isArray(response)) {
    usersList = response as Array<Record<string, unknown>>;
  } else if (response && typeof response === "object") {
    if ("users" in response && Array.isArray(response.users)) {
      usersList = response.users as Array<Record<string, unknown>>;
    } else if (
      "data" in response &&
      response.data &&
      typeof response.data === "object" &&
      "users" in response.data &&
      Array.isArray(
        (response.data as { users: Array<Record<string, unknown>> }).users,
      )
    ) {
      usersList = (response.data as { users: Array<Record<string, unknown>> })
        .users;
    } else if ("data" in response && Array.isArray(response.data)) {
      usersList = response.data as Array<Record<string, unknown>>;
    }
  }

  const normalized = usersList
    .map((user) => {
      const roleFromApi =
        user.role ||
        (user.credential as { roleKey?: string; name?: string } | undefined)
          ?.roleKey ||
        (user.credential as { roleKey?: string; name?: string } | undefined)
          ?.name ||
        "";

      const role = String(roleFromApi).trim().toUpperCase();

      return {
        ...user,
        id: String(user.id || ""),
        name: String(user.name || ""),
        email: String(user.email || ""),
        role: role as AdminUser["role"],
      } as AdminUser;
    })
    .filter(
      (u) =>
        Boolean(u.id) &&
        Boolean(u.name) &&
        Boolean(u.role) &&
        u.isActive !== false &&
        !u.isBanned,
    );

  const seen = new Set<string>();
  return normalized.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

export function normalizeTeamMembers(response: unknown): TeamMember[] {
  let membersList: Array<Record<string, unknown>> = [];

  if (Array.isArray(response)) {
    membersList = response as Array<Record<string, unknown>>;
  } else if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
      membersList = obj.data as Array<Record<string, unknown>>;
    } else if (Array.isArray(obj.team)) {
      membersList = obj.team as Array<Record<string, unknown>>;
    } else if (Array.isArray(obj.members)) {
      membersList = obj.members as Array<Record<string, unknown>>;
    } else if (Array.isArray(obj.results)) {
      membersList = obj.results as Array<Record<string, unknown>>;
    } else if (
      obj.data &&
      typeof obj.data === "object" &&
      Array.isArray((obj.data as Record<string, unknown>).members)
    ) {
      membersList = (obj.data as { members: Array<Record<string, unknown>> })
        .members;
    } else if (
      obj.data &&
      typeof obj.data === "object" &&
      Array.isArray((obj.data as Record<string, unknown>).team)
    ) {
      membersList = (obj.data as { team: Array<Record<string, unknown>> }).team;
    }
  }

  const seen = new Set<string>();
  return membersList
    .map((member) => {
      const id = String(member.id || "").trim();
      const name = String(member.name || "").trim();
      const email = String(member.email || "").trim();
      const role = String(member.role || "").trim();
      const memberType = String(member.memberType || "").trim();

      return {
        ...member,
        id,
        name,
        email,
        role,
        memberType,
      } as TeamMember;
    })
    .filter((m) => {
      if (!m.id || !m.name) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
}

/**
 * Team / vendor rows from GET /api/team often omit the literal word "VENDOR".
 * Treat explicit non-CRM members, common subcontractor types, and legacy
 * "VENDOR" substrings as assignable vendors.
 */
function isVendorTeamMember(member: TeamMember): boolean {
  if (member.isCrmUser === false) return true;

  const memberType = String(member.memberType || "")
    .trim()
    .toUpperCase();
  const role = String(member.role || "")
    .trim()
    .toUpperCase();
  const department = String(member.department || "")
    .trim()
    .toUpperCase();

  const haystack = `${memberType} ${role} ${department}`;
  const vendorHints = [
    "VENDOR",
    "SUBCONTRACTOR",
    "SUB_CONTRACTOR",
    "CONTRACTOR",
    "EXTERNAL",
    "PARTNER",
    "SUPPLIER",
    "FREELANCER",
    "AGENCY",
    "OUTSOURCE",
  ];
  if (vendorHints.some((h) => haystack.includes(h))) return true;

  return (
    memberType.includes("VENDOR") ||
    role.includes("VENDOR") ||
    department.includes("VENDOR")
  );
}

function isActiveTeamMember(member: TeamMember): boolean {
  return (
    member.isBanned !== true &&
    member.isDeactivated !== true &&
    member.isActive !== false &&
    Boolean(String(member.id || "").trim()) &&
    Boolean(String(member.name || "").trim())
  );
}

async function fetchCrmUsersList(): Promise<AdminUser[]> {
  try {
    const usersRes = await adminAPI.getAllUsers();
    return normalizeAssignableUsers(usersRes);
  } catch {
    try {
      const data = await fetchAPI<unknown>("/api/users?limit=1000", {
        method: "GET",
      });
      return normalizeAssignableUsers(data);
    } catch {
      return [];
    }
  }
}

async function loadTeamMembersWithFallback(): Promise<TeamMember[]> {
  try {
    return await getAllTeamMembers();
  } catch {
    try {
      const res = await fetch(`${API_BASE_URL}/api/team`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        onUnauthorizedResponse(res);
        return [];
      }
      return normalizeTeamMembers(await res.json());
    } catch {
      /* ignore */
    }
    return [];
  }
}

export async function loadMatrixAssigneeData(): Promise<{
  users: AdminUser[];
  vendors: TeamMember[];
}> {
  const [crmUsers, teamMembers] = await Promise.all([
    fetchCrmUsersList(),
    loadTeamMembersWithFallback(),
  ]);

  // STRICT SEGREGATION:
  // - Role dropdown users must come only from CRM User Management users API.
  // - Vendor dropdown must come only from team members marked as vendor.
  const users = crmUsers;

  const activeMembers = teamMembers.filter(isActiveTeamMember);

  let vendors = activeMembers
    .filter((member) => isVendorTeamMember(member))
    .sort((a, b) => a.name.localeCompare(b.name));

  // If the API never tags rows as "vendor" but team members exist, still show
  // them so the Vendor dropdown is usable (matrix tasks use member ids).
  if (vendors.length === 0 && activeMembers.length > 0) {
    vendors = [...activeMembers].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  return { users, vendors };
}
