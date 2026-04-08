/** Values accepted for customer important dates (API / UI). */
export const IMPORTANT_DATE_TYPE_OPTIONS: { value: string; label: string }[] =
  [
    { value: "BIRTHDAY", label: "Birthday" },
    { value: "ANNIVERSARY", label: "Anniversary" },
    { value: "HOUSEWARMING", label: "Housewarming" },
    { value: "PUJA", label: "Puja" },
    { value: "MOVE_IN", label: "Move-in" },
    { value: "PROJECT_COMPLETION", label: "Project completion" },
    { value: "CUSTOM", label: "Custom" },
  ];

const LABELS: Record<string, string> = Object.fromEntries(
  IMPORTANT_DATE_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);
LABELS.OTHER = "Other";

export function getImportantDateTypeLabel(
  dateType: string | undefined | null,
): string {
  if (!dateType) return "Date";
  const key = dateType.toUpperCase();
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Title for lists: CUSTOM uses `customLabel` when set; otherwise enum label. */
export function getImportantDateDisplayTitle(date: {
  dateType?: string | null;
  customLabel?: string | null;
}): string {
  const t = date.dateType?.toUpperCase();
  if (t === "CUSTOM" && date.customLabel?.trim()) {
    return date.customLabel.trim();
  }
  return getImportantDateTypeLabel(date.dateType);
}
