/**
 * RBAC (Role-Based Access Control) Configuration
 * Maps API roles to their permissions and defines navigation/UI access
 */

// ─── Role IDs (match the backend /api/roles response) ─────────────────────
export type RoleId =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "BDR"
  | "PROJECT_MANAGER"
  | "ACCOUNTS"
  | "SITE_ENGINEER"
  | "DESIGNER"
  | "DESIGN_HEAD";

// ─── Role metadata ────────────────────────────────────────────────────────
export interface RoleMeta {
  id: RoleId;
  name: string;
  description: string;
  accessLevel: "Full" | "High" | "Medium" | "Low";
  color: string; // Tailwind bg + text pair for badges
  bgColor: string;
  defaultRoute: string; // Where to redirect after login
}

export const ROLES: Record<RoleId, RoleMeta> = {
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    description:
      "Full access to all modules including user/role management, system configuration, CRM, project lifecycle, AI voice agent configuration, reports and analytics.",
    accessLevel: "Full",
    color: "text-red-700",
    bgColor: "bg-red-100",
    defaultRoute: "/dashboard",
  },
  ADMIN: {
    id: "ADMIN",
    name: "Admin",
    description:
      "User management, dashboard and reports access, full CRM read/write, project management, and meeting scheduling.",
    accessLevel: "High",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    defaultRoute: "/dashboard",
  },
  BDR: {
    id: "BDR",
    name: "Business Development Rep",
    description:
      "Lead management and qualification, full CRM pipeline access, follow-up and communication logs, meeting scheduling.",
    accessLevel: "Medium",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    defaultRoute: "/dashboard",
  },
  PROJECT_MANAGER: {
    id: "PROJECT_MANAGER",
    name: "Project Manager",
    description:
      "Project creation and lifecycle control, task assignment and monitoring, timeline and milestone tracking.",
    accessLevel: "High",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    defaultRoute: "/dashboard",
  },
  ACCOUNTS: {
    id: "ACCOUNTS",
    name: "Accounts / Finance",
    description:
      "Payment tracking and management, financial report access, invoice and receipt attachments.",
    accessLevel: "Medium",
    color: "text-green-700",
    bgColor: "bg-green-100",
    defaultRoute: "/dashboard",
  },
  SITE_ENGINEER: {
    id: "SITE_ENGINEER",
    name: "Site Engineer",
    description:
      "Site execution module access, image uploads, quality and compliance submissions, issue and defect reporting.",
    accessLevel: "Medium",
    color: "text-teal-700",
    bgColor: "bg-teal-100",
    defaultRoute: "/app", // Mobile-first experience
  },
  DESIGNER: {
    id: "DESIGNER",
    name: "Designer",
    description:
      "Design module access, mood board and reference management, 3D design uploads, design stage tracking, and client-facing design deliverables.",
    accessLevel: "Medium",
    color: "text-pink-700",
    bgColor: "bg-pink-100",
    defaultRoute: "/dashboard",
  },
  DESIGN_HEAD: {
    id: "DESIGN_HEAD",
    name: "Design Head",
    description:
      "Full design department oversight, designer management, design pipeline and deliverable approvals, reporting, and cross-team coordination.",
    accessLevel: "High",
    color: "text-violet-700",
    bgColor: "bg-violet-100",
    defaultRoute: "/dashboard",
  },
};

// ─── Permission strings ───────────────────────────────────────────────────
// We use dot-notation strings that match the backend.  The wildcard `*`
// means "all actions" under that module.  `module.*` ⊃ `module.read`, etc.

export const ROLE_PERMISSIONS: Record<RoleId, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "users.*",
    "dashboard.*",
    "reports.*",
    "leads.read",
    "leads.create",
    "leads.update",
    "accounts.read",
    "accounts.create",
    "accounts.update",
    "contacts.read",
    "contacts.create",
    "contacts.update",
    "deals.read",
    "deals.create",
    "deals.update",
    "payments.read",
    "payments.update",
    "activity.read",
    "activity.create",
    "meetings.*",
    "projects.*",
    "tasks.*",
    "products.*",
    "attachments.*",
    "roles.read",
  ],
  BDR: [
    "leads.*",
    "accounts.*",
    "contacts.*",
    "deals.read",
    "deals.create",
    "projects.read",
    "projects.create",
    "activity.*",
    "attachments.*",
    "meetings.*",
    "tasks.*",
    "ai.transcripts.read",
    "communications.*",
    "followups.*",
    "dashboard.view",
  ],
  PROJECT_MANAGER: [
    "users.read",
    "leads.*",
    "accounts.*",
    "contacts.*",
    "deals.*",
    "payments.*",
    "activity.*",
    "attachments.*",
    "meetings.*",
    "projects.*",
    "tasks.*",
    "products.*",
    "reports.view",
    "reports.export",
    "dashboard.view",
  ],
  ACCOUNTS: [
    "payments.*",
    "deals.read",
    "deals.update",
    "projects.read",
    "projects.update",
    "leads.read",
    "accounts.read",
    "contacts.read",
    "activity.read",
    "activity.create",
    "attachments.read",
    "attachments.create",
    "reports.view",
    "reports.export",
    "dashboard.view",
    "meetings.read",
  ],
  SITE_ENGINEER: [
    "leads.read",
    "accounts.read",
    "contacts.read",
    "deals.read",
    "deals.update",
    "projects.read",
    "projects.update",
    "activity.read",
    "activity.create",
    "attachments.read",
    "attachments.create",
    "meetings.read",
    "meetings.create",
    "site.*",
    "tasks.read",
    "tasks.update",
    "tasks.create",
    "images.upload",
    "issues.report",
    "quality.submit",
    "defects.report",
  ],
  DESIGNER: [
    "leads.read",
    "accounts.read",
    "contacts.read",
    "projects.read",
    "projects.update",
    "activity.read",
    "activity.create",
    "attachments.*",
    "meetings.read",
    "meetings.create",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "design.*",
    "references.*",
    "dashboard.view",
  ],
  DESIGN_HEAD: [
    "users.read",
    "leads.read",
    "accounts.read",
    "contacts.read",
    "projects.*",
    "activity.*",
    "attachments.*",
    "meetings.*",
    "tasks.*",
    "design.*",
    "references.*",
    "reports.view",
    "reports.export",
    "dashboard.view",
  ],
};

// ─── Permission checker ───────────────────────────────────────────────────

/**
 * Check whether a role has a specific permission.
 *
 * @example hasPermission('ADMIN', 'leads.read')   => true
 * @example hasPermission('ACCOUNTS', 'leads.create') => false
 */
export function hasPermission(role: RoleId, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;

  // Wildcard – full access
  if (perms.includes("*")) return true;

  // Exact match
  if (perms.includes(permission)) return true;

  // Wildcard module match:  `leads.*` should match `leads.read`
  const parts = permission.split(".");
  if (parts.length >= 2) {
    const moduleWildcard = `${parts[0]}.*`;
    if (perms.includes(moduleWildcard)) return true;
  }

  return false;
}

/**
 * Check if role has ANY of the given permissions
 */
export function hasAnyPermission(role: RoleId, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if role has ALL of the given permissions
 */
export function hasAllPermissions(
  role: RoleId,
  permissions: string[],
): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

// ─── Sidebar / Navigation visibility config ───────────────────────────────

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string; // Lucide icon name – resolved in the component
  /** The permission needed to see this nav item. If empty → visible to all. */
  requiredPermission?: string;
  /** Alternative: list of roles that have access */
  allowedRoles?: RoleId[];
  /** Show badge; e.g. 'NEW' */
  badge?: string;
  section: "main" | "business" | "account";
}

export const NAV_ITEMS: NavItemConfig[] = [
  // ── Main Menu ──────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: "Home",
    section: "main",
    requiredPermission: "dashboard.view",
  },
  {
    id: "leads",
    label: "Leads",
    path: "/dashboard/leads",
    icon: "Users2",
    section: "main",
    requiredPermission: "leads.read",
  },
  {
    id: "followups",
    label: "Follow-Ups",
    path: "/dashboard/updates",
    icon: "FileText",
    section: "main",
    requiredPermission: "followups.*",
  },
  {
    id: "meetings",
    label: "Meetings",
    path: "/dashboard/meetings",
    icon: "Handshake",
    section: "main",
    requiredPermission: "meetings.read",
  },
  {
    id: "customers",
    label: "Customers",
    path: "/dashboard/customers",
    icon: "Users",
    section: "main",
    requiredPermission: "contacts.read",
  },
  {
    id: "projects",
    label: "Projects",
    path: "/dashboard/projects",
    icon: "FolderKanban",
    section: "main",
    requiredPermission: "projects.read",
  },
  {
    id: "kanban",
    label: "Kanban",
    path: "/dashboard/kanban",
    icon: "Layers",
    section: "main",
    requiredPermission: "projects.read",
  },
  // ── Business Tools ─────────────────────────────────────────
  {
    id: "marketing",
    label: "Marketing",
    path: "/dashboard/marketing",
    icon: "TrendingUp",
    section: "business",
    allowedRoles: ["SUPER_ADMIN", "ADMIN", "BDR"],
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/dashboard/analytics",
    icon: "BarChart3",
    section: "business",
    requiredPermission: "reports.view",
  },
  {
    id: "email-editor",
    label: "Email Editor",
    path: "/dashboard/email-editor",
    icon: "Mail",
    section: "business",
    allowedRoles: ["SUPER_ADMIN", "ADMIN", "BDR"],
  },
  // ── Account ────────────────────────────────────────────────
  {
    id: "team",
    label: "Team",
    path: "/dashboard/engineers",
    icon: "Users",
    section: "account",
    requiredPermission: "users.read",
  },
  {
    id: "users",
    label: "User Management",
    path: "/dashboard/users",
    icon: "Shield",
    section: "account",
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    id: "settings",
    label: "Settings",
    path: "/dashboard/settings",
    icon: "Settings",
    section: "account",
  },
];

/**
 * Given a role, return the nav items visible to that role.
 */
export function getVisibleNavItems(role: RoleId): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => {
    // If no permission or role restriction → always visible
    if (!item.requiredPermission && !item.allowedRoles) return true;

    // Check allowed roles first (more restrictive)
    if (item.allowedRoles) {
      return item.allowedRoles.includes(role);
    }

    // Check permission
    if (item.requiredPermission) {
      return hasPermission(role, item.requiredPermission);
    }

    return true;
  });
}

// Section titles
export const NAV_SECTIONS: Record<string, string> = {
  main: "Main Menu",
  business: "Business Tools",
  account: "Account",
};

// ─── Helper: normalise role string from API ───────────────────────────────
/**
 * The backend may return roles as `ADMIN`, `admin`, `PROJECT_MANAGER`, etc.
 * This normalises to our canonical RoleId.
 */
export function normalizeRole(raw: string): RoleId {
  const upper = raw.toUpperCase().trim();

  // Direct matches
  if (upper in ROLES) return upper as RoleId;

  // Alias mapping for legacy values
  const aliases: Record<string, RoleId> = {
    MANAGER: "PROJECT_MANAGER",
    PM: "PROJECT_MANAGER",
    ENGINEER: "SITE_ENGINEER",
    FINANCE: "ACCOUNTS",
    ACCOUNTANT: "ACCOUNTS",
    SALES: "BDR",
    SALES_EXECUTIVE: "BDR",
    BDR: "BDR",
    FOUNDER_ARCHITECT: "SUPER_ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
    CUSTOMER: "BDR", // customers shouldn't log into CRM, default to lowest CRM role
    DESIGNER: "DESIGNER", // now a first-class role
    DESIGN_HEAD: "DESIGN_HEAD", // now a first-class role
  };

  return aliases[upper] || "BDR"; // Default to BDR (lowest CRM access)
}

/**
 * Get the display-friendly role name
 */
export function getRoleDisplayName(role: RoleId): string {
  return ROLES[role]?.name || role;
}

/**
 * Get role badge styling (Tailwind classes)
 */
export function getRoleBadgeClasses(role: RoleId | string): string {
  const meta = ROLES[role as RoleId];
  if (meta) return `${meta.bgColor} ${meta.color}`;
  return "bg-gray-100 text-gray-700";
}
