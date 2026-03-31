import React, { useState, useRef, useEffect, useCallback } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { KanbanCard, type KanbanCardTask } from "./KanbanCard";
import {
  type AddCardFormSelectConfig,
  type NewCardData,
} from "./AddCardForm";

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanColumnData {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
}

export interface KanbanColumnProps {
  /** Column data containing id, title, taskIds, and optional color */
  column: KanbanColumnData;
  /** Array of tasks to render in this column */
  tasks: KanbanCardTask[];
  /** Column index for draggable ordering */
  index: number;
  /** Theme mode */
  theme?: "light" | "dark";
  /** Whether the column is collapsed */
  isCollapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: (columnId: string) => void;
  /** Callback to rename the column */
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  /** Callback to delete the column */
  onDeleteColumn?: (columnId: string) => void;
  /** Callback when a task completion is toggled */
  onTaskToggleComplete?: (taskId: string) => void;
  /** Callback when a task edit is requested */
  onTaskEdit?: (taskId: string) => void;
  /** Callback when a task delete is requested */
  onTaskDelete?: (taskId: string) => void;
  /** Callback when a new card is added */
  onAddCard?: (columnId: string, data: NewCardData) => void;
  /** Callback when a task is clicked */
  onTaskClick?: (task: KanbanCardTask) => void;
  /** Configuration for the select dropdown in add card form */
  selectConfig?: AddCardFormSelectConfig;
  /** List of assignees for the add card form */
  assignees?: Array<{ id: string; name: string }>;
  /** Custom render function for task content */
  renderTaskContent?: (task: KanbanCardTask) => React.ReactNode;
  /** Enable compact mode for denser layout */
  compactMode?: boolean;
  /** Custom render function for the add card form in the footer */
  renderAddCardForm?: (
    columnId: string,
    onAddCard: (columnId: string, data: any) => void,
    theme: "light" | "dark",
  ) => React.ReactNode;
}

// ============================================================================
// KANBAN COLUMN COMPONENT
// ============================================================================

/**
 * KanbanColumn - A refined, draggable column component for Kanban boards
 *
 * Features:
 * - Draggable for column reordering
 * - Droppable area for cards
 * - Collapsible with smooth animation
 * - Header with color indicator, count badge, and menu
 * - Inline title editing
 * - Integrated AddCardForm in footer
 */
export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  index,
  theme = "dark",
  isCollapsed = false,
  onToggleCollapse,
  onRenameColumn,
  onDeleteColumn,
  onTaskToggleComplete,
  onTaskEdit,
  onTaskDelete,
  onTaskClick,
  renderTaskContent,
  compactMode = true,
}) => {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Derived Values
  // -------------------------------------------------------------------------
  const isLight = theme === "light";
  const columnWidth = compactMode ? "w-[260px]" : "w-[280px]";
  const collapsedWidth = "w-12";

  // -------------------------------------------------------------------------
  // Focus title input when editing starts
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  // -------------------------------------------------------------------------
  // Close menu when clicking outside
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleCollapse?.(column.id);
    },
    [column.id, onToggleCollapse],
  );

  const handleStartEdit = useCallback(() => {
    setEditTitle(column.title);
    setIsEditing(true);
    setIsMenuOpen(false);
  }, [column.title]);

  const handleSaveTitle = useCallback(() => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== column.title) {
      onRenameColumn?.(column.id, trimmedTitle);
    }
    setIsEditing(false);
  }, [editTitle, column.id, column.title, onRenameColumn]);

  const handleCancelEdit = useCallback(() => {
    setEditTitle(column.title);
    setIsEditing(false);
  }, [column.title]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveTitle();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveTitle, handleCancelEdit],
  );

  const handleDeleteColumn = useCallback(() => {
    setIsMenuOpen(false);
    onDeleteColumn?.(column.id);
  }, [column.id, onDeleteColumn]);

  // -------------------------------------------------------------------------
  // Theme Classes
  // -------------------------------------------------------------------------
  const columnBgClass = isLight
    ? "bg-white/95 backdrop-blur-sm border border-gray-200"
    : "bg-gray-800/85 backdrop-blur-sm border border-gray-700/50";

  const headerBorderClass = isLight
    ? "border-b border-gray-100"
    : "border-b border-gray-700/30";

  const iconButtonClass = isLight
    ? "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
    : "hover:bg-gray-700 text-gray-500 hover:text-gray-300";

  const menuBgClass = isLight
    ? "bg-white border border-gray-200"
    : "bg-gray-800 border border-gray-700";

  const menuItemClass = isLight
    ? "hover:bg-gray-50 text-gray-700"
    : "hover:bg-gray-700 text-gray-300";

  const countBadgeClass = isLight
    ? "bg-gray-100 text-gray-500"
    : "bg-gray-700/50 text-gray-400";

  const titleClass = isLight ? "text-gray-700" : "text-gray-200";

  const emptyStateClass = isLight ? "text-gray-400" : "text-gray-600";

  const inputClass = isLight
    ? "bg-gray-100 text-gray-900"
    : "bg-gray-700 text-white";

  const droppingBgClass = isLight
    ? "bg-orange-50 border-2 border-dashed border-orange-300"
    : "bg-orange-900/20 border-2 border-dashed border-orange-500/50";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            flex flex-col flex-shrink-0 rounded-xl
            transition-all duration-300 ease-out
            ${isCollapsed ? collapsedWidth : columnWidth}
            ${columnBgClass}
            ${
              snapshot.isDragging
                ? "rotate-1 shadow-2xl scale-[1.02] ring-2 ring-orange-500/30"
                : isLight
                  ? "shadow-sm hover:shadow-md"
                  : "shadow-lg hover:shadow-xl"
            }
          `}
          style={{
            ...provided.draggableProps.style,
            maxHeight: "calc(100vh - 10rem)",
          }}
        >
          {/* ============================================================= */}
          {/* COLUMN HEADER */}
          {/* ============================================================= */}
          <div
            className={`
              flex items-center gap-1.5
              ${compactMode ? "px-2.5 py-2" : "px-3 py-2.5"}
              ${headerBorderClass}
              ${isCollapsed ? "flex-col py-3" : ""}
            `}
            {...provided.dragHandleProps}
          >
            {/* Collapse Toggle Button */}
            <button
              onClick={handleToggleCollapse}
              className={`flex-shrink-0 p-1 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-500 active:scale-90 ${iconButtonClass}`}
              title={isCollapsed ? "Expand column" : "Collapse column"}
              aria-label={isCollapsed ? "Expand column" : "Collapse column"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {isCollapsed ? (
              /* ---------------------------------------------------------- */
              /* COLLAPSED STATE - Vertical Title */
              /* ---------------------------------------------------------- */
              <div
                className="flex flex-col items-center gap-1 flex-1 min-h-0 cursor-pointer"
                onClick={handleToggleCollapse}
              >
                {/* Color Dot */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      column.color || (isLight ? "#6B7280" : "#9CA3AF"),
                  }}
                />
                {/* Vertical Title */}
                <span
                  className={`
                    text-[10px] font-bold uppercase tracking-wider
                    ${isLight ? "text-gray-600" : "text-gray-400"}
                  `}
                  style={{
                    writingMode: "vertical-lr",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.title}
                </span>
                {/* Task Count */}
                <span
                  className={`
                    text-[10px] font-semibold
                    ${isLight ? "text-gray-400" : "text-gray-500"}
                  `}
                >
                  {tasks.length}
                </span>
              </div>
            ) : (
              /* ---------------------------------------------------------- */
              /* EXPANDED STATE - Normal Header */
              /* ---------------------------------------------------------- */
              <>
                {isEditing ? (
                  /* Title Input */
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={handleTitleKeyDown}
                    className={`
                      flex-1 px-1.5 py-0.5 text-xs font-semibold rounded
                      focus:outline-none focus:ring-1 focus:ring-orange-500
                      ${inputClass}
                    `}
                  />
                ) : (
                  /* Title Display */
                  <div
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                    onDoubleClick={handleStartEdit}
                  >
                    {/* Color Dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          column.color || (isLight ? "#6B7280" : "#9CA3AF"),
                      }}
                    />
                    {/* Title Text */}
                    <span
                      className={`
                        text-xs font-bold uppercase tracking-wide truncate cursor-default
                        ${titleClass}
                      `}
                      title={column.title}
                    >
                      {column.title}
                    </span>
                    {/* Task Count Badge */}
                    <span
                      className={`
                        text-[10px] font-medium px-1.5 py-0.5 rounded-full
                        ${countBadgeClass}
                      `}
                    >
                      {tasks.length}
                    </span>
                  </div>
                )}

                {/* Column Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className={`p-1.5 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-500 active:scale-90 ${iconButtonClass}`}
                    title="Column options"
                    aria-label="Column options"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      {/* Menu */}
                      <div
                        className={`
                          absolute right-0 top-full mt-1 w-40 rounded-lg shadow-xl z-20 py-1
                          ${menuBgClass}
                        `}
                      >
                        <button
                          onClick={handleStartEdit}
                          className={`
                            w-full px-3 py-2 text-left text-xs flex items-center gap-2
                            transition-colors duration-150
                            focus:outline-none focus:bg-orange-50 focus:text-orange-600
                            ${menuItemClass}
                          `}
                        >
                          <Pencil size={12} />
                          Rename
                        </button>
                        <button
                          onClick={handleDeleteColumn}
                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors duration-150 focus:outline-none focus:bg-red-100"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ============================================================= */}
          {/* CARDS DROPPABLE AREA - Hidden when collapsed */}
          {/* ============================================================= */}
          {!isCollapsed && (
            <Droppable droppableId={column.id} type="task">
              {(droppableProvided, droppableSnapshot) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  className={`
                    flex-1 overflow-y-auto
                    ${compactMode ? "p-1.5 space-y-1.5" : "p-2 space-y-2"}
                    min-h-[60px] transition-colors duration-200 rounded-lg
                    ${droppableSnapshot.isDraggingOver ? droppingBgClass : ""}
                  `}
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: isLight
                      ? "#E5E7EB transparent"
                      : "#4B5563 transparent",
                  }}
                >
                  {/* Empty State */}
                  {tasks.length === 0 && !droppableSnapshot.isDraggingOver && (
                    <div
                      className={`
                        flex items-center justify-center h-24 text-center
                        ${emptyStateClass}
                      `}
                    >
                      <p className="text-xs">Drop cards here</p>
                    </div>
                  )}

                  {/* Task Cards */}
                  {tasks.map((task, taskIndex) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={taskIndex}
                    >
                      {(taskProvided, taskSnapshot) => (
                        <KanbanCard
                          task={task}
                          provided={taskProvided}
                          snapshot={taskSnapshot}
                          theme={theme}
                          onToggleComplete={onTaskToggleComplete}
                          onEdit={onTaskEdit}
                          onDelete={onTaskDelete}
                          onClick={onTaskClick}
                          renderContent={renderTaskContent}
                        />
                      )}
                    </Draggable>
                  ))}

                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default KanbanColumn;
