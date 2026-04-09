/**
 * Extract designation / role title and credential role key from varying API
 * user shapes — kept in sync with User Management list normalization.
 */
import type { User, UserRole } from "../types";
import { normalizeRole, ROLE_PERMISSIONS, type RoleId } from "../config/rbac";

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

/** Same logic as UserManagement `extractRoleTitle` (designation column). */
export function extractRoleTitle(user: Record<string, unknown>): string | undefined {
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
    toValidDisplayText(
      (user.roleTitleData as Record<string, unknown> | undefined)?.roleTitle,
    ) ||
    toValidDisplayText(
      (user.roleTitleData as Record<string, unknown> | undefined)?.title,
    ) ||
    toValidDisplayText(
      (user.roleTitleData as Record<string, unknown> | undefined)?.name,
    ) ||
    toValidDisplayText(roleTitleObject?.roleTitle) ||
    toValidDisplayText(roleTitleObject?.title) ||
    toValidDisplayText(roleTitleObject?.name) ||
    toValidDisplayText(userRoleTitleObject?.roleTitle) ||
    toValidDisplayText(userRoleTitleObject?.title) ||
    toValidDisplayText(userRoleTitleObject?.name) ||
    toValidDisplayText(user.title) ||
    toValidDisplayText(user.designation) ||
    toValidDisplayText(user.jobTitle) ||
    toValidDisplayText(user.job_title) ||
    (user.id
      ? toValidDisplayText(localStorage.getItem(`ghs_role_title_${user.id}`))
      : undefined)
  );
}

export function extractCredentialRoleKeyFromUserPayload(
  user: Record<string, unknown>,
): string | undefined {
  const credentialFromApi = user.credential as
    | { id?: string; roleKey?: string; name?: string }
    | undefined;

  const key =
    toValidDisplayText(user.credentialRoleKey) ||
    toValidDisplayText(user.credential_role_key) ||
    toValidDisplayText(user.roleKey) ||
    toValidDisplayText(credentialFromApi?.roleKey);

  return key ? key.toUpperCase() : undefined;
}

export function extractApiRoleFromUserPayload(
  user: Record<string, unknown>,
): string | undefined {
  const credentialFromApi = user.credential as
    | { roleKey?: string; name?: string }
    | undefined;
  const r = user.role || credentialFromApi?.roleKey || credentialFromApi?.name;
  if (typeof r === "string" && r.trim()) return r.trim();
  return undefined;
}

/** Unwrap GET /api/auth/me (and similar) response bodies. */
export function unwrapUserFromMeResponse(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.user && typeof o.user === "object") {
    return o.user as Record<string, unknown>;
  }
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    const inner = o.data as Record<string, unknown>;
    if (inner.user && typeof inner.user === "object") {
      return inner.user as Record<string, unknown>;
    }
    return inner;
  }
  return o;
}

/**
 * Partial fields to merge onto session `User` from a raw API user object
 * (login user, /api/auth/me, or /api/users list item).
 */
export function buildSessionUserPatchesFromApiPayload(
  raw: Record<string, unknown>,
): Partial<User> {
  const patches: Partial<User> = {};

  const title = extractRoleTitle(raw);
  if (title) {
    patches.roleTitle = title;
    patches.designation = title;
  }

  const credKey = extractCredentialRoleKeyFromUserPayload(raw);
  if (credKey) {
    patches.credentialRoleKey = credKey;
  }

  const apiRoleRaw = extractApiRoleFromUserPayload(raw);
  if (apiRoleRaw) {
    patches.apiRole = apiRoleRaw;
    const normalizedRoleId: RoleId = normalizeRole(apiRoleRaw);
    patches.role = normalizedRoleId as unknown as UserRole;
    patches.permissions = ROLE_PERMISSIONS[normalizedRoleId] || [];
  }

  const name = toValidDisplayText(raw.name);
  if (name) patches.name = name;

  const email = toValidDisplayText(raw.email);
  if (email) patches.email = email;

  const phone = toValidDisplayText(raw.phone);
  if (phone) patches.phone = phone;

  const avatar = toValidDisplayText(raw.avatar);
  if (avatar) patches.avatar = avatar;

  return patches;
}
