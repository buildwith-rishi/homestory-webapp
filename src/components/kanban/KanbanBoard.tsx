import React, { useState, useCallback, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";

// Import new components
import { KanbanColumn, type KanbanColumnData } from "./KanbanColumn";
import { type KanbanCardTask } from "./KanbanCard";
import { type NewCardData, type AddCardFormSelectConfig } from "./AddCardForm";
import { KanbanToolbar } from "./KanbanToolbar";

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanTask {
  id: string;
  content: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  completed?: boolean;
  assignedTo?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export interface KanbanColumnType {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
}

export interface KanbanData {
  columns: Record<string, KanbanColumnType>;
  tasks: Record<string, KanbanTask>;
  columnOrder: string[];
}

// Configuration for primary dropdown (Lead/Project selection)
export interface SelectConfig {
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export interface KanbanBoardProps {
  initialData: KanbanData;
  onDataChange?: (data: KanbanData) => void;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  /** Called when a task is dragged between columns (cross-column move) */
  onTaskColumnChange?: (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
  ) => void;
  renderTaskCard?: (task: KanbanCardTask) => React.ReactNode;
  theme?: "dark" | "light";
  /** Visual zoom (scale) for the board. Default: 0.9 */
  defaultZoom?: number;
  /** Enable compact mode for denser layout */
  compactMode?: boolean;
  /** Primary dropdown config for add card (e.g., Lead or Project selection) */
  selectConfig?: SelectConfig;
  /** Custom assignee options for add card dropdown */
  assignees?: Array<{ id: string; name: string }>;
  /** Custom render function for the add card form in column footer */
  renderAddCardForm?: (
    columnId: string,
    onAddCard: (columnId: string, data: any) => void,
    theme: "light" | "dark",
  ) => React.ReactNode;
}

// Zoom constants
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.15;
const ZOOM_STEP = 0.05;

// ============================================================================
// KANBAN BOARD COMPONENT
// ============================================================================

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialData,
  onDataChange,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskColumnChange,
  renderTaskCard,
  theme = "dark",
  defaultZoom = 0.9,
  compactMode = true,
  selectConfig,
  assignees,
  renderAddCardForm,
}) => {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [data, setData] = useState<KanbanData>(initialData);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set(),
  );
  const [zoom, setZoom] = useState(() => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, defaultZoom));
    return Number(clamped.toFixed(2));
  });

  // Sync data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // -------------------------------------------------------------------------
  // Derived Values
  // -------------------------------------------------------------------------
  const isLight = theme === "light";
  const allCollapsed = collapsedColumns.size === data.columnOrder.length;
  const noneCollapsed = collapsedColumns.size === 0;

  // Convert selectConfig to AddCardFormSelectConfig format
  const addCardSelectConfig: AddCardFormSelectConfig | undefined =
    useMemo(() => {
      if (!selectConfig) return undefined;
      return {
        label: selectConfig.label,
        placeholder: selectConfig.placeholder,
        options: selectConfig.options,
        required: selectConfig.required,
      };
    }, [selectConfig]);

  // -------------------------------------------------------------------------
  // Data Update Helper
  // -------------------------------------------------------------------------
  const updateData = useCallback(
    (newData: KanbanData) => {
      setData(newData);
      onDataChange?.(newData);
    },
    [onDataChange],
  );

  // -------------------------------------------------------------------------
  // Zoom Controls
  // -------------------------------------------------------------------------
  const handleZoomIn = useCallback(() => {
    setZoom((z) =>
      Number(Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)).toFixed(2)),
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) =>
      Number(Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)).toFixed(2)),
    );
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
  }, []);

  // -------------------------------------------------------------------------
  // Column Collapse Controls
  // -------------------------------------------------------------------------
  const toggleColumnCollapse = useCallback((columnId: string) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }, []);

  const collapseAllColumns = useCallback(() => {
    setCollapsedColumns(new Set(data.columnOrder));
  }, [data.columnOrder]);

  const expandAllColumns = useCallback(() => {
    setCollapsedColumns(new Set());
  }, []);

  // -------------------------------------------------------------------------
  // Drag and Drop Handler
  // -------------------------------------------------------------------------
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId, type } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Reordering columns
      if (type === "column") {
        const newColumnOrder = Array.from(data.columnOrder);
        newColumnOrder.splice(source.index, 1);
        newColumnOrder.splice(destination.index, 0, draggableId);

        updateData({
          ...data,
          columnOrder: newColumnOrder,
        });
        return;
      }

      // Moving tasks
      const startColumn = data.columns[source.droppableId];
      const finishColumn = data.columns[destination.droppableId];

      // Moving within the same column
      if (startColumn === finishColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, draggableId);

        const newColumn = {
          ...startColumn,
          taskIds: newTaskIds,
        };

        updateData({
          ...data,
          columns: {
            ...data.columns,
            [newColumn.id]: newColumn,
          },
        });
        return;
      }

      // Moving between columns
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStartColumn = {
        ...startColumn,
        taskIds: startTaskIds,
      };

      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinishColumn = {
        ...finishColumn,
        taskIds: finishTaskIds,
      };

      updateData({
        ...data,
        columns: {
          ...data.columns,
          [newStartColumn.id]: newStartColumn,
          [newFinishColumn.id]: newFinishColumn,
        },
      });

      // Notify parent about the cross-column move
      onTaskColumnChange?.(
        draggableId,
        source.droppableId,
        destination.droppableId,
      );
    },
    [data, updateData, onTaskColumnChange],
  );

  // -------------------------------------------------------------------------
  // Task Operations
  // -------------------------------------------------------------------------
  const handleAddCard = useCallback(
    (columnId: string, cardData: NewCardData) => {
      const newTaskId = `task-${Date.now()}`;

      // Build the task content from title and/or description
      let content = cardData.title;
      if (cardData.description && cardData.title) {
        content = `${cardData.title}`;
      } else if (cardData.description && !cardData.title) {
        content = cardData.description;
      }

      const newTask: KanbanTask = {
        id: newTaskId,
        content: content,
        description: cardData.description || undefined,
        priority: cardData.priority,
        assignedTo: cardData.assignedTo,
        startDate: cardData.startDate,
        endDate: cardData.endDate,
        metadata: cardData.selectedId
          ? { selectedId: cardData.selectedId }
          : undefined,
      };

      const column = data.columns[columnId];
      const newTaskIds = [...column.taskIds, newTaskId];

      updateData({
        ...data,
        tasks: {
          ...data.tasks,
          [newTaskId]: newTask,
        },
        columns: {
          ...data.columns,
          [columnId]: {
            ...column,
            taskIds: newTaskIds,
          },
        },
      });
    },
    [data, updateData],
  );

  const handleDeleteCard = useCallback(
    (taskId: string) => {
      // Find which column contains this task
      let columnId: string | null = null;
      for (const [colId, column] of Object.entries(data.columns)) {
        if (column.taskIds.includes(taskId)) {
          columnId = colId;
          break;
        }
      }
      if (!columnId) return;

      const column = data.columns[columnId];
      const newTaskIds = column.taskIds.filter((id) => id !== taskId);

      const newTasks = { ...data.tasks };
      delete newTasks[taskId];

      updateData({
        ...data,
        tasks: newTasks,
        columns: {
          ...data.columns,
          [columnId]: {
            ...column,
            taskIds: newTaskIds,
          },
        },
      });

      onTaskDelete?.(taskId);
    },
    [data, updateData, onTaskDelete],
  );

  const handleToggleTaskComplete = useCallback(
    (taskId: string) => {
      const task = data.tasks[taskId];
      if (!task) return;

      updateData({
        ...data,
        tasks: {
          ...data.tasks,
          [taskId]: {
            ...task,
            completed: !task.completed,
          },
        },
      });
    },
    [data, updateData],
  );

  const handleTaskEdit = useCallback(
    (taskId: string) => {
      onTaskEdit?.(taskId);
    },
    [onTaskEdit],
  );

  const handleTaskClick = useCallback(
    (task: KanbanCardTask) => {
      // Convert KanbanCardTask to KanbanTask for the callback
      const kanbanTask = data.tasks[task.id];
      if (kanbanTask) {
        onTaskClick?.(kanbanTask);
      }
    },
    [data.tasks, onTaskClick],
  );

  // -------------------------------------------------------------------------
  // Column Operations
  // -------------------------------------------------------------------------
  const handleRenameColumn = useCallback(
    (columnId: string, newTitle: string) => {
      updateData({
        ...data,
        columns: {
          ...data.columns,
          [columnId]: {
            ...data.columns[columnId],
            title: newTitle,
          },
        },
      });
    },
    [data, updateData],
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      const column = data.columns[columnId];
      const newTasks = { ...data.tasks };

      // Delete all tasks in this column
      column.taskIds.forEach((taskId) => {
        delete newTasks[taskId];
      });

      const newColumns = { ...data.columns };
      delete newColumns[columnId];

      updateData({
        ...data,
        tasks: newTasks,
        columns: newColumns,
        columnOrder: data.columnOrder.filter((id) => id !== columnId),
      });
    },
    [data, updateData],
  );

  const handleAddColumn = useCallback(() => {
    const newColumnId = `col-${Date.now()}`;
    const newColumn: KanbanColumnType = {
      id: newColumnId,
      title: "New Column",
      taskIds: [],
    };

    updateData({
      ...data,
      columns: {
        ...data.columns,
        [newColumnId]: newColumn,
      },
      columnOrder: [...data.columnOrder, newColumnId],
    });
  }, [data, updateData]);

  // -------------------------------------------------------------------------
  // Theme Classes - Refined gradients and shadows
  // -------------------------------------------------------------------------
  const themeClasses = isLight
    ? "bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30"
    : "bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900";

  const boardShadow = isLight ? "shadow-inner" : "shadow-2xl shadow-black/20";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      className={`h-full w-full overflow-hidden ${themeClasses} ${boardShadow} relative`}
    >
      {/* Subtle texture overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "30px 30px",
        }}
        aria-hidden="true"
      />

      {/* Toolbar */}
      <KanbanToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onExpandAll={expandAllColumns}
        onCollapseAll={collapseAllColumns}
        hasCollapsedColumns={!noneCollapsed}
        hasExpandedColumns={!allCollapsed}
        theme={theme}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
      />

      {/* Board Content */}
      <div className="h-[calc(100%-2.75rem)] relative">
        <div
          className="h-full w-full origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            width: `${100 / zoom}%`,
          }}
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="all-columns"
              direction="horizontal"
              type="column"
            >
              {(provided) => (
                <div
                  className={`
                    flex gap-3 h-full px-4 py-4 
                    overflow-x-auto overflow-y-hidden
                    ${isLight ? "scrollbar-light" : "scrollbar-dark"}
                  `}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: isLight
                      ? "#D1D5DB #F9FAFB"
                      : "#374151 #111827",
                  }}
                >
                  {data.columnOrder.map((columnId, index) => {
                    const column = data.columns[columnId];
                    if (!column) return null;

                    // Map tasks for this column (convert KanbanTask to KanbanCardTask)
                    const tasks: KanbanCardTask[] = column.taskIds
                      .map((taskId) => data.tasks[taskId])
                      .filter((task): task is KanbanTask => task !== undefined)
                      .map((task) => ({
                        id: task.id,
                        content: task.content,
                        description: task.description,
                        priority: task.priority,
                        completed: task.completed,
                        assignedTo: task.assignedTo,
                        startDate: task.startDate,
                        endDate: task.endDate,
                        metadata: task.metadata,
                      }));

                    const columnData: KanbanColumnData = {
                      id: column.id,
                      title: column.title,
                      taskIds: column.taskIds,
                      color: column.color,
                    };

                    return (
                      <KanbanColumn
                        key={column.id}
                        column={columnData}
                        tasks={tasks}
                        index={index}
                        theme={theme}
                        isCollapsed={collapsedColumns.has(columnId)}
                        onToggleCollapse={toggleColumnCollapse}
                        onRenameColumn={handleRenameColumn}
                        onDeleteColumn={handleDeleteColumn}
                        onTaskToggleComplete={handleToggleTaskComplete}
                        onTaskEdit={handleTaskEdit}
                        onTaskDelete={handleDeleteCard}
                        onAddCard={handleAddCard}
                        onTaskClick={handleTaskClick}
                        selectConfig={addCardSelectConfig}
                        assignees={assignees}
                        renderTaskContent={renderTaskCard}
                        compactMode={compactMode}
                        renderAddCardForm={renderAddCardForm}
                      />
                    );
                  })}
                  {provided.placeholder}

                  {/* Add Column Button - Refined styling with glass-morphism */}
                  <button
                    onClick={handleAddColumn}
                    className={`
                      group flex-shrink-0 ${compactMode ? "w-[260px]" : "w-[280px]"} h-fit 
                      px-5 py-4 rounded-xl border-2 border-dashed backdrop-blur-sm
                      transition-all duration-300 ease-out
                      flex items-center justify-center gap-2.5
                      focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                      active:scale-[0.98]
                      ${
                        isLight
                          ? "border-gray-300 hover:border-orange-400 bg-white/60 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100/50 text-gray-500 hover:text-orange-600 shadow-sm hover:shadow-md"
                          : "border-gray-700 hover:border-orange-500/70 bg-gray-800/60 hover:bg-gradient-to-br hover:from-orange-900/20 hover:to-orange-800/10 text-gray-500 hover:text-orange-400 shadow-lg hover:shadow-xl"
                      }
                    `}
                    aria-label="Add new column"
                  >
                    <Plus
                      size={18}
                      className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110"
                    />
                    <span className="text-sm font-semibold tracking-wide">
                      Add Column
                    </span>
                  </button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};
