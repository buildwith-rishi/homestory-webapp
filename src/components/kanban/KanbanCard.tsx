import React from "react";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import {
  GripVertical,
  Check,
  Pencil,
  Trash2,
  Calendar,
  User,
} from "lucide-react";

export interface KanbanCardTask {
  id: string;
  content: string;
  completed?: boolean;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  metadata?: Record<string, unknown>;
}

export interface KanbanCardProps {
  task: KanbanCardTask;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  theme?: "light" | "dark";
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (task: KanbanCardTask) => void;
  renderContent?: (task: KanbanCardTask) => React.ReactNode;
}

/**
 * Get priority border color class
 */
const getPriorityBorderColor = (
  priority?: "high" | "medium" | "low",
): string => {
  switch (priority) {
    case "high":
      return "border-l-orange-500";
    case "medium":
      return "border-l-amber-400";
    case "low":
      return "border-l-green-500";
    default:
      return "border-l-transparent";
  }
};

/**
 * Get priority badge styling
 */
const getPriorityBadge = (
  priority: "high" | "medium" | "low" | undefined,
  isLight: boolean,
): { bg: string; text: string; label: string } | null => {
  if (!priority) return null;

  const styles = {
    high: {
      bg: isLight ? "bg-orange-100" : "bg-orange-500/20",
      text: isLight ? "text-orange-700" : "text-orange-400",
      label: "High",
    },
    medium: {
      bg: isLight ? "bg-amber-100" : "bg-amber-500/20",
      text: isLight ? "text-amber-700" : "text-amber-400",
      label: "Medium",
    },
    low: {
      bg: isLight ? "bg-green-100" : "bg-green-500/20",
      text: isLight ? "text-green-700" : "text-green-400",
      label: "Low",
    },
  };

  return styles[priority];
};

/**
 * Check if a date is overdue
 */
const isOverdue = (dateString: string): boolean => {
  const endDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate < today;
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return "Today";
  }
  if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Get initials from a name
 */
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Polished Kanban Card Component
 *
 * A reusable, draggable card component for Kanban boards with:
 * - Priority-based left border accent
 * - Hover effects with lifted shadow
 * - Drag state animations (rotate, scale, shadow)
 * - Completion state styling
 * - Assignee and due date badges
 * - Description preview (truncated)
 */
export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  provided,
  snapshot,
  theme = "dark",
  onToggleComplete,
  onEdit,
  onDelete,
  onClick,
  renderContent,
}) => {
  const isLight = theme === "light";
  const isDragging = snapshot.isDragging;
  const isCompleted = task.completed;

  // Priority styling
  const priorityBorderClass = getPriorityBorderColor(task.priority);
  const priorityBadge = getPriorityBadge(task.priority, isLight);

  // Due date styling
  const endDateOverdue =
    task.endDate && !isCompleted && isOverdue(task.endDate);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`
        group relative rounded-lg overflow-hidden
        transition-all duration-300 ease-out
        border-l-4 ${priorityBorderClass}
        backdrop-blur-sm
        ${
          isDragging
            ? `rotate-1 scale-[1.02] shadow-2xl ring-2 ring-orange-500/50 z-50`
            : `shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-grab active:cursor-grabbing`
        }
        ${
          isLight
            ? "bg-white/95 border border-gray-100 hover:border-gray-300"
            : "bg-gray-900/80 border border-gray-700/40 hover:border-gray-500/80"
        }
      `}
      style={provided.draggableProps.style}
    >
      {/* Gradient accent for completion state */}
      {isCompleted && (
        <div
          className={`
            absolute inset-0 pointer-events-none
            ${
              isLight
                ? "bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-transparent"
                : "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent"
            }
          `}
          aria-hidden="true"
        />
      )}

      {/* Subtle top border gradient for completed tasks */}
      {isCompleted && (
        <div
          className={`
            absolute top-0 left-0 right-0 h-0.5
            bg-gradient-to-r from-green-400 via-emerald-400 to-green-400
            ${isLight ? "opacity-40" : "opacity-30"}
          `}
          aria-hidden="true"
        />
      )}
      {/* Drag Handle Area */}
      <div {...provided.dragHandleProps} className="relative">
        {/* Grip indicator on left edge */}
        <div
          className={`
            absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            ${isDragging ? "opacity-100" : ""}
            ${isLight ? "text-gray-400" : "text-gray-500"}
          `}
        >
          <GripVertical size={14} strokeWidth={2} className="opacity-50" />
        </div>

        {/* Card Content */}
        <div className="p-3 pl-5">
          <div className="flex items-start gap-2.5">
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete?.(task.id);
              }}
              className={`
                flex-shrink-0 mt-0.5 w-5 h-5 rounded-sm border-2
                flex items-center justify-center
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
                active:scale-90
                ${
                  isCompleted
                    ? "bg-orange-500 border-orange-500"
                    : isLight
                      ? "border-gray-300 hover:border-orange-500 hover:bg-orange-50"
                      : "border-gray-600 hover:border-orange-500 hover:bg-orange-500/10"
                }
              `}
              title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
              aria-label={
                isCompleted ? "Mark as incomplete" : "Mark as complete"
              }
            >
              {isCompleted && (
                <Check size={10} strokeWidth={3} className="text-white" />
              )}
            </button>

            {/* Main Content Area */}
            <div
              className={`flex-1 min-w-0 ${onClick ? "cursor-pointer" : ""}`}
              onClick={() => onClick?.(task)}
              role={onClick ? "button" : undefined}
              tabIndex={onClick ? 0 : undefined}
              onKeyDown={
                onClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClick(task);
                      }
                    }
                  : undefined
              }
            >
              {renderContent ? (
                <div className={isCompleted ? "opacity-70" : ""}>
                  {renderContent(task)}
                </div>
              ) : (
                <>
                  {/* Task Title */}
                  <p
                    className={`
                      text-sm leading-snug font-medium
                      ${isCompleted ? "line-through" : ""}
                      ${isLight ? "text-gray-800" : "text-gray-100"}
                    `}
                  >
                    {task.content}
                  </p>

                  {/* Description Preview */}
                  {task.description && (
                    <p
                      className={`
                        mt-1 text-xs leading-relaxed line-clamp-2
                        ${isLight ? "text-gray-500" : "text-gray-400"}
                        ${isCompleted ? "line-through" : ""}
                      `}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Metadata Row: Priority + Assignee + Dates */}
                  {(task.priority ||
                    task.assignedTo ||
                    task.startDate ||
                    task.endDate) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {/* Priority Badge */}
                      {priorityBadge && (
                        <span
                          className={`
                            inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide
                            ${priorityBadge.bg} ${priorityBadge.text}
                          `}
                        >
                          {priorityBadge.label}
                        </span>
                      )}

                      {/* Assignee Badge */}
                      {task.assignedTo && (
                        <span
                          className={`
                            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                            ${
                              isLight
                                ? "bg-purple-100 text-purple-700"
                                : "bg-purple-500/20 text-purple-400"
                            }
                          `}
                          title={task.assignedTo}
                        >
                          <User size={9} strokeWidth={2.5} />
                          <span className="max-w-[60px] truncate">
                            {task.assignedTo.length > 10
                              ? getInitials(task.assignedTo)
                              : task.assignedTo}
                          </span>
                        </span>
                      )}

                      {/* Start Date Badge */}
                      {task.startDate && (
                        <span
                          className={`
                            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                            ${
                              isLight
                                ? "bg-green-100 text-green-700"
                                : "bg-green-500/20 text-green-400"
                            }
                          `}
                          title={`Start: ${new Date(task.startDate).toLocaleDateString()}`}
                        >
                          <Calendar size={9} strokeWidth={2.5} />
                          {formatDate(task.startDate)}
                        </span>
                      )}

                      {/* End Date Badge */}
                      {task.endDate && (
                        <span
                          className={`
                            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                            ${
                              endDateOverdue
                                ? isLight
                                  ? "bg-red-100 text-red-700"
                                  : "bg-red-500/20 text-red-400"
                                : isLight
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-gray-700/50 text-gray-400"
                            }
                          `}
                          title={`End: ${new Date(task.endDate).toLocaleDateString()}`}
                        >
                          <Calendar size={9} strokeWidth={2.5} />
                          {formatDate(task.endDate)}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div
              className={`
                flex items-center gap-0.5 flex-shrink-0
                opacity-0 group-hover:opacity-100 
                transition-all duration-300 ease-out
                ${isDragging ? "opacity-0" : ""}
              `}
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task.id);
                  }}
                  className={`
                    p-1.5 rounded-md transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    active:scale-90 transform
                    ${
                      isLight
                        ? "hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                        : "hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"
                    }
                  `}
                  title="Edit task"
                  aria-label="Edit task"
                >
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className={`
                    p-1.5 rounded-md transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                    active:scale-90 transform
                    ${
                      isLight
                        ? "hover:bg-red-50 text-gray-400 hover:text-red-600"
                        : "hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                    }
                  `}
                  title="Delete task"
                  aria-label="Delete task"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
