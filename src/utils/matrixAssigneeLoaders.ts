/**
 * Shared loaders for matrix task modals: CRM users + team vendors (works for designer / non-admin).
 */
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

function teamMemberToAssignableUser(member: TeamMember): AdminUser | null {
  const id = String(member.userId || member.id || "").trim();
  const name = String(member.name || "").trim();
  if (!id || !name) return null;
  const roleRaw = String(member.role || "DESIGNER")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return {
    id,
    name,
    email: String(member.email || "").trim(),
    role: roleRaw as AdminUser["role"],
    isBanned: member.isBanned === true,
    isActive: member.isActive !== false,
  } as AdminUser;
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
      if (res.ok) return normalizeTeamMembers(await res.json());
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

  const teamAsUsers = teamMembers
    .filter(
      (m) =>
        m.isBanned !== true && m.isDeactivated !== true && m.isActive !== false,
    )
    .map(teamMemberToAssignableUser)
    .filter((u): u is AdminUser => u !== null);

  const byId = new Map<string, AdminUser>();
  for (const u of crmUsers) {
    if (u.id) byId.set(u.id, u);
  }
  for (const u of teamAsUsers) {
    if (!byId.has(u.id)) byId.set(u.id, u);
  }
  const mergedUsers = Array.from(byId.values());
  const users =
    mergedUsers.length > 0
      ? mergedUsers
      : crmUsers.length > 0
        ? crmUsers
        : teamAsUsers;

  /** Team rows eligible for vendor assignment (not limited to names containing "VENDOR"). */
  const assignableForVendor = (() => {
    const strict = teamMembers.filter(
      (member) =>
        member.isBanned !== true &&
        member.isDeactivated !== true &&
        member.isActive !== false,
    );
    if (strict.length > 0) return strict;
    // Some APIs mark everyone inactive incorrectly; still show non-banned members.
    return teamMembers.filter(
      (m) =>
        m.isBanned !== true &&
        m.isDeactivated !== true &&
        Boolean(m.id) &&
        Boolean(m.name),
    );
  })();

  const vendorKeyword = (m: TeamMember) => {
    const type = String(m.memberType || "").toUpperCase();
    const role = String(m.role || "").toUpperCase();
    const department = String(m.department || "").toUpperCase();
    return (
      type.includes("VENDOR") ||
      role.includes("VENDOR") ||
      department.includes("VENDOR")
    );
  };

  const vendors = assignableForVendor
    .filter((member) => Boolean(member.id) && Boolean(member.name))
    .sort((a, b) => {
      const pri = Number(vendorKeyword(b)) - Number(vendorKeyword(a));
      if (pri !== 0) return pri;
      return a.name.localeCompare(b.name);
    });

  return { users, vendors };
}
