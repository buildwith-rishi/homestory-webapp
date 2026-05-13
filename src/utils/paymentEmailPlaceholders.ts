import type { Project } from "../types";

/** Tokens inserted from the payment email modals; replaced at send time. */
export const PAYMENT_CUSTOM_MESSAGE_VARIABLE_OPTIONS = [
  { value: "{{firstName}}", label: "First name" },
  { value: "{{lastName}}", label: "Last name" },
  { value: "{{projectName}}", label: "Project name" },
  { value: "{{designValue}}", label: "Design value" },
  { value: "{{executionValue}}", label: "Execution value" },
] as const;

function formatInrDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const n =
    typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function splitFirstLast(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const full = displayName.trim();
  if (!full) return { firstName: "", lastName: "" };
  const i = full.indexOf(" ");
  if (i === -1) return { firstName: full, lastName: "" };
  return {
    firstName: full.slice(0, i).trim(),
    lastName: full.slice(i + 1).trim(),
  };
}

/**
 * Replace `{{firstName}}`, `{{lastName}}`, etc. using the recipient display name
 * (To Name field) and the current project. Unknown tokens are left unchanged.
 */
export function replacePaymentCustomMessageVariables(
  message: string,
  project: Project | null | undefined,
  toName: string,
): string {
  const { firstName, lastName } = splitFirstLast(toName);
  const projectName =
    project?.projectName?.trim() ||
    String(project?.name ?? "").trim() ||
    "";
  const designValue = formatInrDisplay(project?.designValue);
  const executionValue = formatInrDisplay(project?.executionValue);

  return message
    .replace(/\{\{firstName\}\}/gi, firstName)
    .replace(/\{\{lastName\}\}/gi, lastName)
    .replace(/\{\{projectName\}\}/gi, projectName)
    .replace(/\{\{designValue\}\}/gi, designValue)
    .replace(/\{\{executionValue\}\}/gi, executionValue);
}
