import React, { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import Button from "../ui/Button";

export interface KanbanTask {
  id: string;
  content: string;
  completed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
}

export interface KanbanData {
  columns: Record<string, KanbanColumn>;
  tasks: Record<string, KanbanTask>;
  columnOrder: string[];
}

interface KanbanBoardProps {
  initialData: KanbanData;
  onDataChange?: (data: KanbanData) => void;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskEdit?: (task: KanbanTask) => void;
  onTaskDelete?: (taskId: string) => void;
  renderTaskCard?: (task: KanbanTask) => React.ReactNode;
  theme?: "dark" | "light";
  /**
   * Visual zoom (scale) for the board.
   * - default: 0.9 (slightly zoomed-out to fit more columns)
   */
  defaultZoom?: number;
  /**
   * Enable compact mode for denser layout
   */
  compactMode?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialData,
  onDataChange,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  renderTaskCard,
  theme = "dark",
  defaultZoom = 0.9,
  compactMode = true,
}) => {
  const [data, setData] = useState<KanbanData>(initialData);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(
    null,
  );
  const [newCardContent, setNewCardContent] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set(),
  );
  const [openMenuColumn, setOpenMenuColumn] = useState<string | null>(null);

  const MIN_ZOOM = 0.7;
  const MAX_ZOOM = 1.15;
  const ZOOM_STEP = 0.05;

  const [zoom, setZoom] = useState(() => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, defaultZoom));
    return Number(clamped.toFixed(2));
  });

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

  const updateData = (newData: KanbanData) => {
    setData(newData);
    onDataChange?.(newData);
  };

  const onDragEnd = (result: DropResult) => {
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
  };

  const handleAddCard = (columnId: string) => {
    if (!newCardContent.trim()) return;

    const newTaskId = `task-${Date.now()}`;
    const newTask: KanbanTask = {
      id: newTaskId,
      content: newCardContent.trim(),
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

    setNewCardContent("");
    setAddingCardToColumn(null);
  };

  const handleDeleteCard = (taskId: string, columnId: string) => {
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
  };

  const handleToggleTaskComplete = (taskId: string) => {
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
  };

  const handleUpdateColumnTitle = (columnId: string) => {
    if (!newColumnTitle.trim()) {
      setEditingColumn(null);
      return;
    }

    updateData({
      ...data,
      columns: {
        ...data.columns,
        [columnId]: {
          ...data.columns[columnId],
          title: newColumnTitle.trim(),
        },
      },
    });

    setEditingColumn(null);
    setNewColumnTitle("");
  };

  const handleAddColumn = () => {
    const newColumnId = `col-${Date.now()}`;
    const newColumn: KanbanColumn = {
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
  };

  const handleDeleteColumn = (columnId: string) => {
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
  };

  const themeClasses =
    theme === "dark"
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "bg-gray-100/50";

  const isLight = theme === "light";
  const allCollapsed = collapsedColumns.size === data.columnOrder.length;
  const noneCollapsed = collapsedColumns.size === 0;

  return (
    <div className={`h-full w-full overflow-hidden ${themeClasses}`}>
      {/* Professional Toolbar */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between border-b ${
          isLight
            ? "bg-white/80 border-gray-200"
            : "bg-gray-900/50 border-gray-700/50"
        }`}
      >
        {/* Left: Zoom controls */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${
            isLight
              ? "bg-gray-100 text-gray-700"
              : "bg-gray-800/60 text-gray-300"
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
            Zoom
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) =>
                Number(
                  Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)).toFixed(2),
                ),
              )
            }
            disabled={zoom <= MIN_ZOOM}
            className={`h-6 w-6 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
              isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"
            }`}
          >
            −
          </button>
          <span className="min-w-[40px] text-center text-xs font-semibold tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) =>
                Number(
                  Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)).toFixed(2),
                ),
              )
            }
            disabled={zoom >= MAX_ZOOM}
            className={`h-6 w-6 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
              isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"
            }`}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(Number(defaultZoom.toFixed(2)))}
            className={`h-6 rounded px-1.5 text-[10px] font-semibold transition-colors ${
              isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"
            }`}
          >
            Reset
          </button>
        </div>

        {/* Right: Collapse controls */}
        <div
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 ${
            isLight
              ? "bg-gray-100 text-gray-700"
              : "bg-gray-800/60 text-gray-300"
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mr-1">
            Columns
          </span>
          <button
            type="button"
            onClick={expandAllColumns}
            disabled={noneCollapsed}
            className={`h-6 rounded px-2 text-[10px] font-semibold transition-colors disabled:opacity-30 ${
              isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"
            }`}
            title="Expand all columns"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAllColumns}
            disabled={allCollapsed}
            className={`h-6 rounded px-2 text-[10px] font-semibold transition-colors disabled:opacity-30 ${
              isLight ? "hover:bg-gray-200" : "hover:bg-gray-700"
            }`}
            title="Collapse all columns"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="h-[calc(100%-2.75rem)]">
        <div
          className="h-full w-full origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            transition: "transform 120ms ease-out",
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
                  className="flex gap-2.5 h-full px-3 py-3 overflow-x-auto overflow-y-hidden"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: isLight
                      ? "#D1D5DB #F3F4F6"
                      : "#4B5563 #1F2937",
                  }}
                >
                  {data.columnOrder.map((columnId, index) => {
                    const column = data.columns[columnId];
                    const tasks = column.taskIds.map(
                      (taskId) => data.tasks[taskId],
                    );
                    const isCollapsed = collapsedColumns.has(columnId);

                    return (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex flex-col flex-shrink-0 transition-all duration-200 ${
                              isCollapsed
                                ? "w-10"
                                : compactMode
                                  ? "w-[260px]"
                                  : "w-[280px]"
                            } ${
                              snapshot.isDragging
                                ? "rotate-1 shadow-2xl scale-[1.02]"
                                : isLight
                                  ? "shadow-sm"
                                  : "shadow-lg"
                            } ${
                              isLight
                                ? "bg-white border border-gray-200 rounded-xl"
                                : "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl"
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                              maxHeight: "calc(100vh - 10rem)",
                            }}
                          >
                            {/* Column Header */}
                            <div
                              className={`flex items-center gap-1.5 ${
                                compactMode ? "px-2.5 py-2" : "px-3 py-2.5"
                              } ${
                                isLight
                                  ? "border-b border-gray-100"
                                  : "border-b border-gray-700/30"
                              } ${isCollapsed ? "flex-col py-3" : ""}`}
                              {...provided.dragHandleProps}
                            >
                              {/* Collapse toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleColumnCollapse(column.id);
                                }}
                                className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                                  isLight
                                    ? "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                    : "hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                                }`}
                                title={
                                  isCollapsed
                                    ? "Expand column"
                                    : "Collapse column"
                                }
                              >
                                {isCollapsed ? (
                                  <ChevronRight size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>

                              {isCollapsed ? (
                                /* Collapsed state - vertical title */
                                <div className="flex flex-col items-center gap-1 flex-1 min-h-0">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        column.color ||
                                        (isLight ? "#6B7280" : "#9CA3AF"),
                                    }}
                                  />
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider writing-mode-vertical ${
                                      isLight
                                        ? "text-gray-600"
                                        : "text-gray-400"
                                    }`}
                                    style={{
                                      writingMode: "vertical-lr",
                                      textOrientation: "mixed",
                                      transform: "rotate(180deg)",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {column.title}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold ${
                                      isLight
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {tasks.length}
                                  </span>
                                </div>
                              ) : (
                                /* Expanded state */
                                <>
                                  {editingColumn === column.id ? (
                                    <input
                                      type="text"
                                      value={newColumnTitle}
                                      onChange={(e) =>
                                        setNewColumnTitle(e.target.value)
                                      }
                                      onBlur={() =>
                                        handleUpdateColumnTitle(column.id)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          handleUpdateColumnTitle(column.id);
                                        if (e.key === "Escape") {
                                          setEditingColumn(null);
                                          setNewColumnTitle("");
                                        }
                                      }}
                                      className={`flex-1 px-1.5 py-0.5 text-xs font-semibold rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                                        isLight
                                          ? "bg-gray-100 text-gray-900"
                                          : "bg-gray-700 text-white"
                                      }`}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{
                                          backgroundColor:
                                            column.color ||
                                            (isLight ? "#6B7280" : "#9CA3AF"),
                                        }}
                                      />
                                      <span
                                        className={`text-xs font-bold uppercase tracking-wide truncate ${
                                          isLight
                                            ? "text-gray-700"
                                            : "text-gray-200"
                                        }`}
                                      >
                                        {column.title}
                                      </span>
                                      <span
                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                          isLight
                                            ? "bg-gray-100 text-gray-500"
                                            : "bg-gray-700/50 text-gray-400"
                                        }`}
                                      >
                                        {tasks.length}
                                      </span>
                                    </div>
                                  )}

                                  {/* Column menu */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuColumn(
                                          openMenuColumn === column.id
                                            ? null
                                            : column.id,
                                        );
                                      }}
                                      className={`p-1 rounded transition-colors ${
                                        isLight
                                          ? "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                          : "hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                                      }`}
                                    >
                                      <MoreHorizontal size={14} />
                                    </button>

                                    {openMenuColumn === column.id && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-10"
                                          onClick={() =>
                                            setOpenMenuColumn(null)
                                          }
                                        />
                                        <div
                                          className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-xl z-20 py-1 ${
                                            isLight
                                              ? "bg-white border border-gray-200"
                                              : "bg-gray-800 border border-gray-700"
                                          }`}
                                        >
                                          <button
                                            onClick={() => {
                                              setEditingColumn(column.id);
                                              setNewColumnTitle(column.title);
                                              setOpenMenuColumn(null);
                                            }}
                                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                                              isLight
                                                ? "hover:bg-gray-50 text-gray-700"
                                                : "hover:bg-gray-700 text-gray-300"
                                            }`}
                                          >
                                            <Pencil size={12} />
                                            Rename
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleDeleteColumn(column.id);
                                              setOpenMenuColumn(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 text-red-500 hover:bg-red-500/10"
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

                            {/* Cards List - Hidden when collapsed */}
                            {!isCollapsed && (
                              <Droppable droppableId={column.id} type="task">
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto ${
                                      compactMode
                                        ? "p-1.5 space-y-1.5"
                                        : "p-2 space-y-2"
                                    } min-h-[60px] transition-colors duration-200 ${
                                      snapshot.isDraggingOver
                                        ? isLight
                                          ? "bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg"
                                          : "bg-orange-900/20 border-2 border-dashed border-orange-500/50 rounded-lg"
                                        : ""
                                    }`}
                                    style={{
                                      scrollbarWidth: "thin",
                                      scrollbarColor: isLight
                                        ? "#E5E7EB transparent"
                                        : "#4B5563 transparent",
                                    }}
                                  >
                                    {tasks.length === 0 &&
                                      !snapshot.isDraggingOver && (
                                        <div
                                          className={`flex items-center justify-center h-24 text-center ${
                                            isLight
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          <p className="text-xs">
                                            Drop cards here or click
                                            <br />
                                            "Add a card" below
                                          </p>
                                        </div>
                                      )}
                                    {tasks.map((task, idx) => (
                                      <Draggable
                                        key={task.id}
                                        draggableId={task.id}
                                        index={idx}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`group relative ${
                                              compactMode
                                                ? "rounded-lg"
                                                : "rounded-xl"
                                            } overflow-hidden transition-all duration-200 ${
                                              snapshot.isDragging
                                                ? "shadow-2xl rotate-2 scale-105 ring-2 ring-orange-500/50 z-50"
                                                : isLight
                                                  ? "shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
                                                  : "shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing"
                                            } ${
                                              isLight
                                                ? "bg-white border border-gray-100 hover:border-gray-200"
                                                : "bg-gray-900/60 border border-gray-700/30 hover:border-gray-600/50"
                                            }`}
                                            style={
                                              provided.draggableProps.style
                                            }
                                          >
                                            {/* Drag handle indicator - Full card is draggable */}
                                            <div
                                              {...provided.dragHandleProps}
                                              className="relative"
                                            >
                                              {/* Grip indicator on left edge */}
                                              <div
                                                className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                                                  snapshot.isDragging
                                                    ? "opacity-100"
                                                    : ""
                                                } ${
                                                  isLight
                                                    ? "bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200"
                                                    : "bg-gradient-to-b from-gray-600 via-gray-500 to-gray-600"
                                                }`}
                                              >
                                                <div
                                                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                                                    isLight
                                                      ? "text-gray-400"
                                                      : "text-gray-600"
                                                  }`}
                                                >
                                                  <GripVertical
                                                    size={10}
                                                    strokeWidth={2.5}
                                                  />
                                                </div>
                                              </div>

                                              <div
                                                className={
                                                  compactMode
                                                    ? "p-2 pl-3"
                                                    : "p-2.5 pl-3.5"
                                                }
                                              >
                                                {renderTaskCard ? (
                                                  <div className="flex items-start gap-2">
                                                    {/* Checkbox for task completion */}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleTaskComplete(
                                                          task.id,
                                                        );
                                                      }}
                                                      className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 transition-all ${
                                                        task.completed
                                                          ? "bg-green-500 border-green-500"
                                                          : isLight
                                                            ? "border-gray-300 hover:border-green-500"
                                                            : "border-gray-600 hover:border-green-500"
                                                      }`}
                                                      title={
                                                        task.completed
                                                          ? "Mark as incomplete"
                                                          : "Mark as complete"
                                                      }
                                                    >
                                                      {task.completed && (
                                                        <svg
                                                          className="w-full h-full text-white"
                                                          fill="none"
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth="3"
                                                          viewBox="0 0 24 24"
                                                          stroke="currentColor"
                                                        >
                                                          <path d="M5 13l4 4L19 7" />
                                                        </svg>
                                                      )}
                                                    </button>
                                                    <div
                                                      className={`flex-1 ${task.completed ? "opacity-50" : ""}`}
                                                      onClick={() =>
                                                        onTaskClick?.(task)
                                                      }
                                                    >
                                                      {renderTaskCard(task)}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-start gap-2">
                                                    {/* Checkbox for task completion */}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleTaskComplete(
                                                          task.id,
                                                        );
                                                      }}
                                                      className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 transition-all ${
                                                        task.completed
                                                          ? "bg-green-500 border-green-500"
                                                          : isLight
                                                            ? "border-gray-300 hover:border-green-500"
                                                            : "border-gray-600 hover:border-green-500"
                                                      }`}
                                                      title={
                                                        task.completed
                                                          ? "Mark as incomplete"
                                                          : "Mark as complete"
                                                      }
                                                    >
                                                      {task.completed && (
                                                        <svg
                                                          className="w-full h-full text-white"
                                                          fill="none"
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth="3"
                                                          viewBox="0 0 24 24"
                                                          stroke="currentColor"
                                                        >
                                                          <path d="M5 13l4 4L19 7" />
                                                        </svg>
                                                      )}
                                                    </button>
                                                    <div
                                                      className="flex-1"
                                                      onClick={() =>
                                                        onTaskClick?.(task)
                                                      }
                                                    >
                                                      <div className="flex items-start justify-between gap-2">
                                                        <p
                                                          className={`text-xs leading-snug flex-1 ${
                                                            task.completed
                                                              ? "line-through opacity-60"
                                                              : ""
                                                          } ${
                                                            isLight
                                                              ? "text-gray-800"
                                                              : "text-gray-200"
                                                          }`}
                                                        >
                                                          {task.content}
                                                        </p>
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              onTaskEdit?.(
                                                                task,
                                                              );
                                                            }}
                                                            className={`p-1 rounded transition-colors ${
                                                              isLight
                                                                ? "hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                                                                : "hover:bg-gray-800 text-gray-500 hover:text-blue-400"
                                                            }`}
                                                          >
                                                            <Pencil size={11} />
                                                          </button>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleDeleteCard(
                                                                task.id,
                                                                column.id,
                                                              );
                                                            }}
                                                            className={`p-1 rounded transition-colors ${
                                                              isLight
                                                                ? "hover:bg-gray-100 text-gray-400 hover:text-red-600"
                                                                : "hover:bg-gray-800 text-gray-500 hover:text-red-400"
                                                            }`}
                                                          >
                                                            <Trash2 size={11} />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}

                            {/* Add Card Section - Hidden when collapsed */}
                            {!isCollapsed && (
                              <div
                                className={`border-t ${
                                  isLight
                                    ? "border-gray-100"
                                    : "border-gray-700/30"
                                } ${compactMode ? "p-1.5" : "p-2"}`}
                              >
                                {addingCardToColumn === column.id ? (
                                  <div
                                    className={`${compactMode ? "rounded-lg" : "rounded-xl"} ${
                                      isLight
                                        ? "bg-white border border-gray-200 shadow-sm"
                                        : "bg-gray-900/60 border border-gray-700/30"
                                    }`}
                                  >
                                    <div
                                      className={`flex items-start gap-2 ${compactMode ? "p-2 pl-3" : "p-2.5 pl-3.5"}`}
                                    >
                                      {/* Placeholder checkbox for visual consistency */}
                                      <div
                                        className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 ${
                                          isLight
                                            ? "border-gray-300"
                                            : "border-gray-600"
                                        }`}
                                      />

                                      <div className="flex-1 space-y-1.5">
                                        <textarea
                                          value={newCardContent}
                                          onChange={(e) =>
                                            setNewCardContent(e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" &&
                                              !e.shiftKey
                                            ) {
                                              e.preventDefault();
                                              handleAddCard(column.id);
                                            }
                                            if (e.key === "Escape") {
                                              setAddingCardToColumn(null);
                                              setNewCardContent("");
                                            }
                                          }}
                                          placeholder="Enter task description..."
                                          className={`w-full px-0 py-0 text-xs leading-snug resize-none focus:outline-none bg-transparent ${
                                            isLight
                                              ? "text-gray-900 placeholder:text-gray-400"
                                              : "text-gray-200 placeholder:text-gray-500"
                                          }`}
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex items-center gap-1.5 pt-1">
                                          <Button
                                            onClick={() =>
                                              handleAddCard(column.id)
                                            }
                                            size="sm"
                                            className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] px-2 py-1 h-auto font-medium"
                                          >
                                            Add Card
                                          </Button>
                                          <Button
                                            onClick={() => {
                                              setAddingCardToColumn(null);
                                              setNewCardContent("");
                                            }}
                                            variant="secondary"
                                            size="sm"
                                            className="text-[10px] px-2 py-1 h-auto"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setAddingCardToColumn(column.id)
                                    }
                                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                      isLight
                                        ? "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                        : "text-gray-500 hover:bg-gray-700/30 hover:text-gray-300"
                                    }`}
                                  >
                                    <Plus size={14} />
                                    Add a card
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {/* Add Column Button */}
                  <button
                    onClick={handleAddColumn}
                    className={`flex-shrink-0 ${compactMode ? "w-[260px]" : "w-[280px]"} h-fit px-3 py-2.5 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isLight
                        ? "border-gray-200 hover:border-gray-300 hover:bg-white text-gray-500 hover:text-gray-700"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/30 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Plus size={16} />
                    <span className="text-xs font-medium">Add Column</span>
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
