// ============================================================================
// KANBAN ACTIVITY LOG
// Stores activity logs when cards are added/moved in the Leads Kanban board.
// Uses localStorage for persistence across sessions.
// ============================================================================

export interface KanbanActivityEntry {
  id: string;
  action: "card_added" | "card_moved" | "card_deleted";
  cardTitle: string;
  columnName: string;
  fromColumn?: string;
  timestamp: string;
  assignedTo?: string;
  priority?: "high" | "medium" | "low";
}

const STORAGE_KEY = "ghs_kanban_leads_activity_log";
const MAX_ENTRIES = 50;

/**
 * Get all activity log entries
 */
export function getActivityLog(): KanbanActivityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KanbanActivityEntry[];
  } catch {
    return [];
  }
}

/**
 * Add a new activity log entry
 */
export function addActivityEntry(
  entry: Omit<KanbanActivityEntry, "id" | "timestamp">,
): void {
  const log = getActivityLog();
  const newEntry: KanbanActivityEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  log.unshift(newEntry);
  // Keep only the latest entries
  const trimmed = log.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Clear all activity log entries
 */
export function clearActivityLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
