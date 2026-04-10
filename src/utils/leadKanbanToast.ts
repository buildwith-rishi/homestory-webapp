import toast from "react-hot-toast";

/** Backend message when moving a converted lead that has active customer projects */
export const LEAD_ACTIVE_PROJECTS_STATUS_ERROR =
  "Cannot change status: this lead has a customer with active projects";

export function getLeadKanbanStatusErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function isLeadActiveProjectsStatusConflict(message: string): boolean {
  if (!message) return false;
  return (
    message === LEAD_ACTIVE_PROJECTS_STATUS_ERROR ||
    message.includes("customer with active projects")
  );
}

/**
 * Toast for failed lead status drag on the Kanban: warning styling for the
 * “active projects” business rule; otherwise a destructive error toast.
 */
/** Toast for non–active-projects failures (active-projects uses the Kanban modal). */
export function toastLeadKanbanStatusFailure(error: unknown): void {
  const message = getLeadKanbanStatusErrorMessage(error);
  if (isLeadActiveProjectsStatusConflict(message)) return;
  toast.error(
    message.trim() ? message : "Failed to update status. Reverting...",
  );
}
