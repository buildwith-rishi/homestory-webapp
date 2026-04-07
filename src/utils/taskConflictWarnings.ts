import toast from "react-hot-toast";
import type { TaskConflictUserWarning } from "../types";

function isConflictUserWarning(
  value: unknown,
): value is TaskConflictUserWarning {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.userId !== "string" || typeof o.userName !== "string")
    return false;
  if (!Array.isArray(o.conflicts)) return false;
  return o.conflicts.every(
    (c) =>
      c &&
      typeof c === "object" &&
      typeof (c as Record<string, unknown>).taskId === "string",
  );
}

export function normalizeConflictWarnings(
  raw: unknown,
): TaskConflictUserWarning[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out = raw.filter(isConflictUserWarning);
  return out.length > 0 ? out : undefined;
}

/** Parse conflictWarnings from a matrix/task API JSON body. */
export function extractConflictWarningsFromResponse(
  json: unknown,
): TaskConflictUserWarning[] | undefined {
  if (!json || typeof json !== "object") return undefined;
  return normalizeConflictWarnings(
    (json as Record<string, unknown>).conflictWarnings,
  );
}

/**
 * Merge multiple warning batches (e.g. parallel matrix task creates) and dedupe
 * conflicts per user by overlapping task id.
 */
export function mergeConflictWarnings(
  batches: Array<TaskConflictUserWarning[] | undefined | null>,
): TaskConflictUserWarning[] | undefined {
  const byUser = new Map<string, TaskConflictUserWarning>();

  for (const batch of batches) {
    if (!batch?.length) continue;
    for (const w of batch) {
      const existing = byUser.get(w.userId);
      if (!existing) {
        byUser.set(w.userId, {
          userId: w.userId,
          userName: w.userName,
          conflicts: [...w.conflicts],
        });
        continue;
      }
      const seen = new Set(existing.conflicts.map((c) => c.taskId));
      for (const c of w.conflicts) {
        if (!seen.has(c.taskId)) {
          existing.conflicts.push(c);
          seen.add(c.taskId);
        }
      }
    }
  }

  const merged = Array.from(byUser.values());
  return merged.length > 0 ? merged : undefined;
}

function formatConflictLine(w: TaskConflictUserWarning, c: { taskTitle: string; project: string; dueDate: string }): string {
  let due = "";
  try {
    if (c.dueDate) {
      due = new Date(c.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    due = "";
  }
  const bits = [`"${c.taskTitle}"`, c.project];
  if (due) bits.push(due);
  return `${w.userName}: ${bits.join(" · ")}`;
}

/**
 * Non-blocking toast when assignees have other tasks on the same due date.
 */
export function notifyTaskConflictWarnings(
  warnings?: TaskConflictUserWarning[] | null,
): void {
  if (!warnings?.length) return;

  const lines: string[] = [];
  for (const w of warnings) {
    for (const c of w.conflicts) {
      lines.push(formatConflictLine(w, c));
    }
  }
  if (lines.length === 0) return;

  const maxLines = 6;
  const shown = lines.slice(0, maxLines);
  const rest = lines.length - shown.length;
  const body =
    shown.join("\n") + (rest > 0 ? `\n…+${rest} more overlap(s)` : "");

  toast(
    `Schedule overlap (saved)\n\n${body}`,
    {
      duration: 9000,
      id: "task-conflict-warnings",
      icon: "⚠️",
      style: {
        maxWidth: "24rem",
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        color: "#78350f",
        fontSize: "0.8125rem",
        whiteSpace: "pre-wrap",
      },
    },
  );
}
