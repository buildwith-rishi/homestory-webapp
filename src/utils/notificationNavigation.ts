/**
 * Map CRM notification `link` + `apiType` to in-app routes.
 * Handles `/projects`, `/tasks`, `/payments`, etc. and resolves IDs when needed.
 */
import toast from "react-hot-toast";
import { getPaymentById } from "../services/projectApi";
import { getMatrixTaskDetails } from "../services/siteEngineerApi";

function stripOrigin(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      return u.pathname + (u.search || "");
    } catch {
      return t;
    }
  }
  return t.startsWith("/") ? t : `/${t}`;
}

/**
 * Returns a path suitable for `navigate()`, or null when there is nowhere to go.
 */
export async function resolveNotificationDestination(options: {
  link: string | null | undefined;
  apiType?: string | null;
}): Promise<string | null> {
  const { link, apiType } = options;
  const raw = typeof link === "string" ? link.trim() : "";

  if (!raw) {
    const t = (apiType || "").toUpperCase();
    if (t === "ACTIVITY_UPDATE") return "/dashboard/updates";
    return null;
  }

  const path = stripOrigin(raw);
  if (!path) return null;

  if (path.startsWith("/dashboard")) {
    return path;
  }

  if (path.startsWith("/bdr")) {
    return path;
  }

  if (path.startsWith("/app")) {
    return path;
  }

  // —— Entity routes (IDs in path) ——
  const projectsM = path.match(/^\/projects\/([^/]+)\/?$/);
  if (projectsM) {
    return `/dashboard/projects/${projectsM[1]}`;
  }

  const customersM = path.match(/^\/customers\/([^/]+)\/?$/);
  if (customersM) {
    return `/dashboard/customers/${customersM[1]}`;
  }

  const leadsM = path.match(/^\/leads\/([^/]+)\/?$/);
  if (leadsM) {
    return `/dashboard/leads/${leadsM[1]}`;
  }

  const meetingsM = path.match(/^\/meetings\/([^/]+)\/?$/);
  if (meetingsM) {
    return `/dashboard/meetings/${meetingsM[1]}`;
  }

  if (path === "/users" || path.startsWith("/users/")) {
    return "/dashboard/users";
  }

  // Payment record → project payments tab
  const payM = path.match(/^\/payments\/([^/]+)\/?$/);
  if (payM) {
    const paymentId = payM[1];
    try {
      const payment = await getPaymentById(paymentId);
      const q = new URLSearchParams();
      q.set("tab", "payments");
      q.set("paymentId", payment.id);
      return `/dashboard/projects/${payment.projectId}?${q.toString()}`;
    } catch {
      toast.error("Could not open this payment. Try Projects.");
      return "/dashboard/projects";
    }
  }

  // Task: matrix (site) task has projectId; BDR tasks use /bdr/tasks
  const taskM = path.match(/^\/tasks\/([^/]+)\/?$/);
  if (taskM) {
    const taskId = taskM[1];
    const t = (apiType || "").toUpperCase();

    if (
      t === "TASK_DEADLINE" ||
      t.includes("DEADLINE") ||
      t.includes("TASK")
    ) {
      try {
        const task = await getMatrixTaskDetails(taskId);
        const q = new URLSearchParams();
        q.set("tab", "stages");
        q.set("taskId", task.id);
        return `/dashboard/projects/${task.projectId}?${q.toString()}`;
      } catch {
        // Likely a BDR CRM task
        const q = new URLSearchParams();
        q.set("focusTask", taskId);
        return `/bdr/tasks?${q.toString()}`;
      }
    }

    const q = new URLSearchParams();
    q.set("focusTask", taskId);
    return `/bdr/tasks?${q.toString()}`;
  }

  // Generic: mount under dashboard (e.g. /updates → not in our list)
  if (path.startsWith("/")) {
    const [pathname, search = ""] = path.split("?");
    const clean = pathname.replace(/\/$/, "") || "/";

    if (clean === "/updates" || clean === "/activity") {
      return "/dashboard/updates";
    }
    if (clean === "/marketing") {
      return "/dashboard/marketing";
    }
    if (clean === "/analytics") {
      return "/dashboard/analytics";
    }
    if (clean === "/kanban") {
      return "/dashboard/kanban";
    }

    return `/dashboard${clean}${search ? `?${search}` : ""}`;
  }

  return null;
}
