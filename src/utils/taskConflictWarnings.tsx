import React from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import type { TaskConflictItem, TaskConflictUserWarning } from "../types";

const MAX_CONFLICT_ROWS = 8;

function parseConflictItem(raw: unknown): TaskConflictItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const taskIdRaw = o.taskId;
  const taskId =
    typeof taskIdRaw === "string"
      ? taskIdRaw
      : typeof taskIdRaw === "number"
        ? String(taskIdRaw)
        : null;
  if (!taskId) return null;

  const taskTitle =
    typeof o.taskTitle === "string"
      ? o.taskTitle
      : typeof o.title === "string"
        ? o.title
        : "Task";

  const item: TaskConflictItem = { taskId, taskTitle };
  if (typeof o.project === "string") item.project = o.project;
  if (typeof o.projectName === "string") item.projectName = o.projectName;
  if (typeof o.stageName === "string") item.stageName = o.stageName;
  if (typeof o.matrixId === "string") item.matrixId = o.matrixId;
  if (typeof o.dayNumber === "number") item.dayNumber = o.dayNumber;
  if (typeof o.taskDate === "string") item.taskDate = o.taskDate;
  if (typeof o.dueDate === "string") item.dueDate = o.dueDate;
  if (typeof o.taskType === "string") item.taskType = o.taskType;
  return item;
}

function parseUserWarning(raw: unknown): TaskConflictUserWarning | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.userId !== "string" || !Array.isArray(o.conflicts)) return null;
  const conflicts = o.conflicts
    .map(parseConflictItem)
    .filter((c): c is TaskConflictItem => c !== null);
  if (conflicts.length === 0) return null;
  const userName =
    typeof o.userName === "string"
      ? o.userName
      : typeof o.name === "string"
        ? o.name
        : "Team member";
  return { userId: o.userId, userName, conflicts };
}

export function normalizeConflictWarnings(
  raw: unknown,
): TaskConflictUserWarning[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out = raw
    .map(parseUserWarning)
    .filter((w): w is TaskConflictUserWarning => w !== null);
  return out.length > 0 ? out : undefined;
}

/**
 * Collect schedule/assignment warnings from API bodies. Supports both
 * `assignmentWarnings` (matrix tasks) and `conflictWarnings` (legacy/other).
 */
export function extractWarningsFromMutationJson(
  json: unknown,
): TaskConflictUserWarning[] | undefined {
  if (!json || typeof json !== "object" || json === null) return undefined;
  const o = json as Record<string, unknown>;
  const batches: Array<TaskConflictUserWarning[] | undefined | null> = [
    normalizeConflictWarnings(o.assignmentWarnings),
    normalizeConflictWarnings(o.conflictWarnings),
  ];
  const inner = o.task;
  if (inner && typeof inner === "object") {
    const t = inner as Record<string, unknown>;
    batches.push(
      normalizeConflictWarnings(t.assignmentWarnings),
      normalizeConflictWarnings(t.conflictWarnings),
    );
  }
  return mergeConflictWarnings(batches);
}

/** Parse warnings from a matrix/task API JSON body. */
export function extractConflictWarningsFromResponse(
  json: unknown,
): TaskConflictUserWarning[] | undefined {
  return extractWarningsFromMutationJson(json);
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

function formatConflictDate(c: TaskConflictItem): string {
  const dateRaw = c.taskDate ?? c.dueDate;
  if (!dateRaw) return "";
  try {
    return new Date(dateRaw).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function projectLabel(c: TaskConflictItem): string {
  return c.projectName ?? c.project ?? "Another project";
}

type FlatRow = { userName: string; userId: string; conflict: TaskConflictItem };

/** First `cap` conflicts in API order; remaining count as overflow. */
function takeConflictRows(
  warnings: TaskConflictUserWarning[],
  cap: number,
): { rows: FlatRow[]; overflow: number } {
  const rows: FlatRow[] = [];
  for (const w of warnings) {
    for (const c of w.conflicts) {
      if (rows.length >= cap) break;
      rows.push({ userName: w.userName, userId: w.userId, conflict: c });
    }
    if (rows.length >= cap) break;
  }
  let total = 0;
  for (const w of warnings) total += w.conflicts.length;
  return { rows, overflow: Math.max(0, total - rows.length) };
}

function AssignmentWarningToastBody({
  warnings,
}: {
  warnings: TaskConflictUserWarning[];
}): React.ReactElement {
  const { rows, overflow } = takeConflictRows(warnings, MAX_CONFLICT_ROWS);
  const multiUser = new Set(warnings.map((w) => w.userId)).size > 1;
  const singleName = !multiUser ? warnings[0]?.userName : null;

  return (
    <div className="flex max-w-[22rem] gap-3 sm:max-w-md">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
        aria-hidden
      >
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[0.8125rem] font-semibold leading-tight text-amber-950">
          Assignment overlap
        </p>
        <p className="mt-1 text-xs leading-snug text-amber-900/75">
          {multiUser
            ? "Saved. These assignees already have other work the same day."
            : "Saved. This assignee already has other work scheduled the same day."}
        </p>

        {singleName && (
          <p className="mt-3 text-xs text-gray-700">
            <span className="font-semibold text-gray-900">{singleName}</span>
            <span className="text-gray-600"> — also on:</span>
          </p>
        )}

        <ul className={`space-y-2 ${singleName ? "mt-2" : "mt-3"}`}>
          {rows.map(({ userName, userId, conflict: c }) => {
            const dateStr = formatConflictDate(c);
            const project = projectLabel(c);
            return (
              <li
                key={`${userId}-${c.taskId}`}
                className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2.5"
              >
                {multiUser && (
                  <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-amber-800/70">
                    {userName}
                  </p>
                )}
                <p className="text-sm font-semibold text-gray-900">
                  {c.taskTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  <span className="font-medium text-gray-700">{project}</span>
                  {c.stageName ? (
                    <>
                      <span className="text-gray-400"> · </span>
                      <span>{c.stageName}</span>
                    </>
                  ) : null}
                  {dateStr ? (
                    <>
                      <span className="text-gray-400"> · </span>
                      <span className="tabular-nums text-gray-500">
                        {dateStr}
                      </span>
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>

        {overflow > 0 && (
          <p className="mt-2 text-xs font-medium text-amber-800/80">
            +{overflow} more overlap{overflow === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Non-blocking toast when assignees have other tasks on the same due date.
 */
export function notifyTaskConflictWarnings(
  warnings?: TaskConflictUserWarning[] | null,
): void {
  if (!warnings?.length) return;

  let total = 0;
  for (const w of warnings) total += w.conflicts.length;
  if (total === 0) return;

  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto rounded-2xl border border-amber-200/90 bg-white p-4 shadow-lg shadow-amber-950/10 ring-1 ring-amber-100/80 transition duration-200 ${
          t.visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <AssignmentWarningToastBody warnings={warnings} />
      </div>
    ),
    {
      duration: 2000,
      id: "task-conflict-warnings",
    },
  );
}
