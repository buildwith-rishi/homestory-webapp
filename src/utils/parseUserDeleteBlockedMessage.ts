/**
 * Parses backend messages when user delete is blocked due to active task
 * assignments (plain-text API errors shown in native alerts previously).
 */

export type ParsedTaskBlock = {
  raw: string;
  title?: string;
  project?: string;
  stage?: string;
  status?: string;
  date?: string;
};

export type ParsedDeleteUserBlocked = {
  summary: string;
  tasks: ParsedTaskBlock[];
  instruction: string;
};

const DAY_TASK_LINE =
  /^Day Task:\s*"([^"]+)"\s+in\s+([^(]+?)\s*\(\s*(.+)\)\s*$/i;

function parseTaskLine(raw: string): ParsedTaskBlock {
  const m = raw.match(DAY_TASK_LINE);
  if (!m) return { raw };

  const project = m[2].trim();
  const inner = m[3].trim();
  const dateMatch = inner.match(/,\s*date:\s*(.+)$/i);
  const date = dateMatch ? dateMatch[1].trim() : undefined;
  const cut = dateMatch?.index;
  const beforeDate =
    dateMatch != null && cut !== undefined
      ? inner.slice(0, cut).trim()
      : inner;

  const lastComma = beforeDate.lastIndexOf(",");
  const stage =
    lastComma > 0 ? beforeDate.slice(0, lastComma).trim() : beforeDate;
  const status =
    lastComma > 0 ? beforeDate.slice(lastComma + 1).trim() : undefined;

  return {
    raw,
    title: m[1].trim(),
    project,
    stage: stage || undefined,
    status,
    date,
  };
}

export function parseUserDeleteBlockedMessage(
  message: string,
): ParsedDeleteUserBlocked {
  const trimmed = message.trim();
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const instrIdx = lines.findIndex((l) => /^please\s+reassign/i.test(l));

  const bodyLines = instrIdx >= 0 ? lines.slice(0, instrIdx) : [...lines];

  const assignIdx = bodyLines.findIndex((l) =>
    /assigned to\s+\d+\s+task/i.test(l),
  );

  let summary: string;
  let taskLineStrings: string[];

  if (assignIdx >= 0) {
    summary = bodyLines.slice(0, assignIdx + 1).join(" ");
    taskLineStrings = bodyLines.slice(assignIdx + 1);
  } else if (bodyLines.length > 0) {
    summary = bodyLines[0];
    taskLineStrings = bodyLines.slice(1);
  } else {
    summary = trimmed || "This user cannot be deleted right now.";
    taskLineStrings = [];
  }

  const tasks = taskLineStrings.map(parseTaskLine);

  const hasAssignmentHint =
    assignIdx >= 0 || /assigned to\s+\d+\s+task/i.test(trimmed);

  let instruction: string;
  if (instrIdx >= 0) {
    instruction = lines.slice(instrIdx).join(" ");
  } else if (hasAssignmentHint && tasks.length > 0) {
    instruction =
      "Please reassign or complete these tasks before deleting the user.";
  } else {
    instruction = "";
  }

  return { summary, tasks, instruction };
}
