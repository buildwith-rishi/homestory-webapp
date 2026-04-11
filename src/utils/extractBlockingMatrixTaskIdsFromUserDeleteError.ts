/**
 * Pull matrix task UUIDs from DELETE /api/users/:id error bodies so we can
 * delete those tasks before retrying user deletion.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isTaskLikeObject(o: Record<string, unknown>): boolean {
  return (
    typeof o.title === "string" ||
    typeof o.taskTitle === "string" ||
    typeof o.dayNumber === "number" ||
    typeof o.matrixId === "string" ||
    typeof o.categoryId === "string" ||
    o.taskDate != null ||
    o.status === "PENDING" ||
    o.status === "IN_PROGRESS" ||
    o.status === "COMPLETED"
  );
}

function considerObject(o: Record<string, unknown>, out: Set<string>): void {
  const idRaw = o.id ?? o.taskId ?? o.matrixTaskId;
  if (typeof idRaw !== "string" || !UUID_RE.test(idRaw)) return;
  if (!isTaskLikeObject(o)) return;
  out.add(idRaw);
}

function walkPayload(value: unknown, out: Set<string>, depth: number): void {
  if (depth > 18 || value == null) return;
  if (typeof value !== "object") return;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === "object") {
        considerObject(item as Record<string, unknown>, out);
        walkPayload(item, out, depth + 1);
      }
    }
    return;
  }

  considerObject(value as Record<string, unknown>, out);
  for (const v of Object.values(value as Record<string, unknown>)) {
    walkPayload(v, out, depth + 1);
  }
}

/**
 * Matrix task IDs embedded in the API error JSON (tasks arrays, nested details, etc.).
 */
export function extractBlockingMatrixTaskIdsFromPayload(
  data: unknown,
): string[] {
  if (data == null) return [];
  const out = new Set<string>();
  walkPayload(data, out, 0);
  return [...out];
}
