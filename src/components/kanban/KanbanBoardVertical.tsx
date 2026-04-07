import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Bold,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Italic,
  Layers,
  List,
  ListOrdered,
  Plus,
  Trash2,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_TEAM = [
  "Unassigned",
  "Admin User",
  "Account Manager",
  "Design Lead",
  "Project Manager",
  "Site Supervisor",
  "Operations Team",
];

export interface AddCardSelectOption {
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface AddCardPrimarySelectConfig {
  label: string;
  placeholder: string;
  options: AddCardSelectOption[];
  required?: boolean;
  emptyStateText?: string;
}

export interface KanbanTask {
  id: string;
  content: string;
  completed?: boolean;
  assignedTo?: string;
  dueDate?: string;
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

interface KanbanBoardVerticalProps {
  initialData: KanbanData;
  onDataChange?: (data: KanbanData) => void;
  onTaskClick?: (task: KanbanTask) => void;
  renderTaskCard?: (task: KanbanTask, onToggle: () => void) => React.ReactNode;
  addCardPrimarySelect?: AddCardPrimarySelectConfig;
  addCardAssigneeOptions?: string[];
  addCardAssigneeLabel?: string;
  addCardDueDateLabel?: string;
}

const DATE_FILTERS = ["all", "today", "week", "month"] as const;
type DateFilter = (typeof DATE_FILTERS)[number] | "custom";

export const KanbanBoardVertical: React.FC<KanbanBoardVerticalProps> = ({
  initialData,
  onDataChange,
  onTaskClick,
  renderTaskCard,
  addCardPrimarySelect,
  addCardAssigneeOptions,
  addCardAssigneeLabel = "Assign to:",
  addCardDueDateLabel = "Due date:",
}) => {
  const [data, setData] = useState<KanbanData>(initialData);
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(
    null,
  );
  const [newCardContent, setNewCardContent] = useState("");
  const [selectedPrimaryOption, setSelectedPrimaryOption] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("Unassigned");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newColumnInputRef = useRef<HTMLInputElement>(null);

  const assigneeOptions = useMemo(() => {
    if (addCardAssigneeOptions && addCardAssigneeOptions.length > 0) {
      return addCardAssigneeOptions;
    }
    return DEFAULT_TEAM;
  }, [addCardAssigneeOptions]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (isAddingColumn && newColumnInputRef.current) {
      newColumnInputRef.current.focus();
    }
  }, [isAddingColumn]);

  const scale = zoomLevel / 100;

  const boardScaleStyles = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      transition: "transform 150ms ease",
    }),
    [scale],
  );

  const scaledViewportStyles = useMemo<React.CSSProperties>(
    () => ({
      width: `${Math.max(scale, 1) * 100}%`,
      height: `${Math.max(scale, 1) * 100}%`,
    }),
    [scale],
  );

  const filterTasksByDate = (task: KanbanTask): boolean => {
    if (dateFilter === "all") return true;
    if (!task.dueDate) return false;

    const taskDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case "today": {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return taskDate >= today && taskDate <= end;
      }
      case "week": {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return taskDate >= today && taskDate <= weekEnd;
      }
      case "month": {
        const monthEnd = new Date(today);
        monthEnd.setMonth(today.getMonth() + 1);
        return taskDate >= today && taskDate <= monthEnd;
      }
      case "custom": {
        const start = customDateStart ? new Date(customDateStart) : new Date(0);
        const end = customDateEnd
          ? new Date(customDateEnd)
          : new Date(9999, 11, 31);
        return taskDate >= start && taskDate <= end;
      }
      default:
        return true;
    }
  };

  const getFilteredTasks = (taskIds: string[]) =>
    taskIds
      .map((taskId) => data.tasks[taskId])
      .filter((task): task is KanbanTask => Boolean(task))
      .filter(filterTasksByDate);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };
      const newData = {
        ...data,
        columns: { ...data.columns, [newColumn.id]: newColumn },
      };
      setData(newData);
      onDataChange?.(newData);
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    };
    setData(newData);
    onDataChange?.(newData);
  };

  const toggleTaskComplete = (taskId: string) => {
    const task = data.tasks[taskId];
    if (!task) return;

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: { ...task, completed: !task.completed },
      },
    };
    setData(newData);
    onDataChange?.(newData);
  };

  const beginAddCard = (columnId: string) => {
    setAddingCardToColumn(columnId);
  setNewCardContent("");
  setSelectedPrimaryOption("");
    setSelectedAssignee("Unassigned");
    setSelectedDueDate("");
  };

  const resetCardComposer = () => {
  setAddingCardToColumn(null);
  setNewCardContent("");
  setSelectedPrimaryOption("");
    setSelectedAssignee("Unassigned");
    setSelectedDueDate("");
  };

  const handleSaveCard = (columnId: string) => {
    const column = data.columns[columnId];
    if (!column) return;

    let label = newCardContent.trim();
    let metadata: KanbanTask["metadata"] | undefined;
    let id = `task-${Date.now()}`;

    if (addCardPrimarySelect) {
      const option = addCardPrimarySelect.options.find(
        (opt) => opt.value === selectedPrimaryOption,
      );
      if (!option) {
        toast.error(
          `Please select a ${addCardPrimarySelect.label.toLowerCase()}`,
        );
        return;
      }
      id = option.value;
      label = option.label;
      metadata = option.metadata;
    } else if (!label) {
      return;
    }

    const newTask: KanbanTask = {
      id,
      content: label,
      completed: false,
      metadata,
      assignedTo:
        selectedAssignee && selectedAssignee !== "Unassigned"
          ? selectedAssignee
          : undefined,
      dueDate: selectedDueDate || undefined,
    };

    const newColumn = {
      ...column,
      taskIds: [...column.taskIds, id],
    };

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [id]: newTask,
      },
      columns: {
        ...data.columns,
        [columnId]: newColumn,
      },
    };

    setData(newData);
    onDataChange?.(newData);
    resetCardComposer();
  };

  const handleDeleteCard = (taskId: string, columnId: string) => {
    const column = data.columns[columnId];
    if (!column) return;

    const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);
    const { [taskId]: _, ...restTasks } = data.tasks;

    const newData = {
      ...data,
      tasks: restTasks,
      columns: {
        ...data.columns,
        [columnId]: { ...column, taskIds: filteredTaskIds },
      },
    };

    setData(newData);
    onDataChange?.(newData);
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = data.columns[columnId];
    if (!column) return;

    const cleanedTasks = { ...data.tasks };
    column.taskIds.forEach((taskId) => delete cleanedTasks[taskId]);

    const { [columnId]: _removedColumn, ...restColumns } = data.columns;

    const newData = {
      ...data,
      tasks: cleanedTasks,
      columns: restColumns,
      columnOrder: data.columnOrder.filter((id) => id !== columnId),
    };

    setData(newData);
    onDataChange?.(newData);
  };

  const handleToggleCollapse = (columnId: string) => {
    setCollapsedColumns((prev) => {
      const copy = new Set(prev);
      if (copy.has(columnId)) {
        copy.delete(columnId);
      } else {
        copy.add(columnId);
      }
      return copy;
    });
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const newId = `column-${Date.now()}`;
    const newColumn: KanbanColumn = {
      id: newId,
      title: newColumnName.trim(),
      taskIds: [],
    };

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newId]: newColumn,
      },
      columnOrder: [...data.columnOrder, newId],
    };

    setData(newData);
    onDataChange?.(newData);
    setNewColumnName("");
    setIsAddingColumn(false);
  };

  const applyFormatting = (
    format: "bold" | "italic" | "bullet" | "numbered",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = newCardContent.substring(start, end);

    const formatted = (() => {
      switch (format) {
        case "bold":
          return `**${selected}**`;
        case "italic":
          return `*${selected}*`;
        case "bullet":
          return `• ${selected}`;
        case "numbered":
          return `1. ${selected}`;
        default:
          return selected;
      }
    })();

    const next =
      newCardContent.substring(0, start) +
      formatted +
      newCardContent.substring(end);
    setNewCardContent(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  };

  const parseFormattedText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^• /gm, "&bull; ")
      .replace(/^(\d+\. )/gm, "<span>$1</span>");

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDateFilter((prev) => !prev)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition-all duration-150 ease-out active:scale-95 ${showDateFilter || dateFilter !== "all" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200 bg-white/90 text-gray-700 hover:border-orange-300"}`}
          >
            <CalendarDays className="h-4 w-4" />
            Date Filter
            {dateFilter !== "all" && (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                {dateFilter === "custom" ? "Custom" : dateFilter}
              </span>
            )}
          </button>
          {showDateFilter && (
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm p-1 text-xs shadow-sm">
              {DATE_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`rounded px-2 py-1 font-medium capitalize transition-all duration-150 ease-out active:scale-95 ${
                    dateFilter === filter
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
              <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => {
                    setCustomDateStart(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="rounded border border-gray-300 px-2 py-1 focus:border-orange-500 focus:outline-none"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => {
                    setCustomDateEnd(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="rounded border border-gray-300 px-2 py-1 focus:border-orange-500 focus:outline-none"
                />
                {(customDateStart || customDateEnd) && (
                  <button
                    onClick={() => {
                      setCustomDateStart("");
                      setCustomDateEnd("");
                      setDateFilter("all");
                    }}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 transition-all duration-150 ease-out active:scale-90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-gray-100/90 backdrop-blur-sm p-1">
          <button
            onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
            className="rounded p-2 text-gray-600 transition-all duration-150 ease-out hover:bg-white active:scale-90 disabled:opacity-40"
            disabled={zoomLevel <= 60}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[54px] text-center text-sm font-semibold text-gray-700">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
            className="rounded p-2 text-gray-600 transition-all duration-150 ease-out hover:bg-white active:scale-90 disabled:opacity-40"
            disabled={zoomLevel >= 150}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-gray-300" />
          <button
            onClick={() => setZoomLevel(100)}
            className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition-all duration-150 ease-out hover:bg-white active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="flex-1 overflow-x-auto overflow-y-auto px-3 py-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#fb923c #f3f4f6" }}
        >
          <div className="relative h-full min-h-[420px]">
            <div
              aria-hidden="true"
              className="pointer-events-none"
              style={scaledViewportStyles}
            />
            <div className="absolute top-0 left-0" style={boardScaleStyles}>
              <div className="flex gap-2 min-h-full">
                {data.columnOrder.map((columnId) => {
                  const column = data.columns[columnId];
                  const allTasks = column.taskIds
                    .map((taskId) => data.tasks[taskId])
                    .filter((task): task is KanbanTask => Boolean(task));
                  const tasks = getFilteredTasks(column.taskIds);
                  const isCollapsed = collapsedColumns.has(columnId);

                  return (
                    <div
                      key={column.id}
                      className={`flex-shrink-0 rounded-xl border bg-white/95 backdrop-blur-sm shadow-sm transition-all ${
                        isCollapsed ? "w-12" : "w-72"
                      }`}
                      style={{
                        minHeight: "220px",
                        maxHeight: "calc(100vh - 200px)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm px-3 py-2.5">
                        <div className="flex flex-1 items-center gap-2">
                          <button
                            onClick={() => handleToggleCollapse(column.id)}
                            className="rounded p-1 text-gray-500 transition-all duration-150 ease-out hover:bg-gray-200 active:scale-90"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          {!isCollapsed && (
                            <>
                              <h3 className="truncate text-sm font-semibold text-gray-800">
                                {column.title}
                              </h3>
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                {dateFilter === "all"
                                  ? tasks.length
                                  : `${tasks.length}/${allTasks.length}`}
                              </span>
                            </>
                          )}
                          {isCollapsed && (
                            <span className="writing-mode-vertical origin-center -rotate-180 text-xs font-semibold text-gray-600">
                              {column.title}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                          className="rounded p-1 text-gray-400 transition-all duration-150 ease-out hover:bg-red-50 hover:text-red-500 active:scale-90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {!isCollapsed && (
                        <Droppable droppableId={column.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 space-y-2 overflow-y-auto px-2 pb-2 pt-2 ${
                                snapshot.isDraggingOver ? "bg-orange-50/60" : ""
                              }`}
                              style={{ scrollbarWidth: "thin" }}
                            >
                              {tasks.map((task, idx) => (
                                <Draggable key={task.id} draggableId={task.id} index={idx}>
                                  {(dragProps, dragSnapshot) => (
                                    <div
                                      ref={dragProps.innerRef}
                                      {...dragProps.draggableProps}
                                      {...dragProps.dragHandleProps}
                                      className={`group rounded-lg border bg-white/95 backdrop-blur-sm p-2.5 text-sm shadow-sm transition-all duration-300 ease-out ${
                                        dragSnapshot.isDragging
                                          ? "scale-[1.02] border-orange-300 shadow-lg rotate-1"
                                          : "border-gray-200 hover:shadow-md hover:-translate-y-0.5"
                                      }`}
                                    >
                                      {renderTaskCard ? (
                                        renderTaskCard(task, () => toggleTaskComplete(task.id))
                                      ) : (
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-start gap-2.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTaskComplete(task.id);
                                              }}
                                              className={`h-4 w-4 rounded border-2 transition-all duration-150 ease-out active:scale-90 ${
                                                task.completed
                                                  ? "border-orange-500 bg-orange-500"
                                                  : "border-gray-300 hover:border-orange-400"
                                              }`}
                                            >
                                              {task.completed && (
                                                <Check className="h-3 w-3 text-white" />
                                              )}
                                            </button>
                                            <div
                                              onClick={() => onTaskClick?.(task)}
                                              className={`flex-1 cursor-pointer text-sm leading-relaxed ${
                                                task.completed
                                                  ? "text-gray-400 line-through"
                                                  : "text-gray-800"
                                              }`}
                                              dangerouslySetInnerHTML={{
                                                __html: parseFormattedText(task.content),
                                              }}
                                            />
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCard(task.id, column.id);
                                              }}
                                              className="rounded p-1 text-gray-400 opacity-0 transition-all duration-150 ease-out hover:bg-red-50 hover:text-red-500 active:scale-90 group-hover:opacity-100"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                          {(task.assignedTo || task.dueDate) && (
                                            <div className="flex flex-wrap items-center gap-2 pl-6">
                                              {task.assignedTo && (
                                                <span className="flex items-center gap-1 rounded-md border border-purple-100 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                  <User className="h-3 w-3" />
                                                  {task.assignedTo}
                                                </span>
                                              )}
                                              {task.dueDate && (
                                                <span className="flex items-center gap-1 rounded-md border border-orange-100 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                                                  <Calendar className="h-3 w-3" />
                                                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                  })}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}

                      {!isCollapsed && (
                        <div className="border-t border-gray-100 px-1.5 pb-1.5 pt-1.5">
                          {addingCardToColumn === column.id ? (
                            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/95 backdrop-blur-sm p-2">
                              {addCardPrimarySelect ? (
                                <div className="space-y-1.5">
                                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                                    {addCardPrimarySelect.label}
                                  </label>
                                  <select
                                    value={selectedPrimaryOption}
                                    onChange={(e) => setSelectedPrimaryOption(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  >
                                    <option value="">
                                      {addCardPrimarySelect.placeholder}
                                    </option>
                                    {addCardPrimarySelect.options.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1">
                                    <button
                                      onClick={() => applyFormatting("bold")}
                                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-all duration-150 ease-out active:scale-90"
                                      type="button"
                                    >
                                      <Bold className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => applyFormatting("italic")}
                                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-all duration-150 ease-out active:scale-90"
                                      type="button"
                                    >
                                      <Italic className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="h-4 w-px bg-gray-300" />
                                    <button
                                      onClick={() => applyFormatting("bullet")}
                                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-all duration-150 ease-out active:scale-90"
                                      type="button"
                                    >
                                      <List className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => applyFormatting("numbered")}
                                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition-all duration-150 ease-out active:scale-90"
                                      type="button"
                                    >
                                      <ListOrdered className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    ref={textareaRef}
                                    value={newCardContent}
                                    onChange={(e) => setNewCardContent(e.target.value)}
                                    placeholder="Enter card details..."
                                    className="h-24 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && e.ctrlKey) {
                                        handleSaveCard(column.id);
                                      } else if (e.key === "Escape") {
                                        resetCardComposer();
                                      }
                                    }}
                                  />
                                </>
                              )}

                              <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                  <User className="h-3.5 w-3.5 text-purple-600" />
                                  {addCardAssigneeLabel}
                                </label>
                                <select
                                  value={selectedAssignee}
                                  onChange={(e) => setSelectedAssignee(e.target.value)}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                >
                                  {assigneeOptions.map((member) => (
                                    <option key={member} value={member}>
                                      {member}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                  <Calendar className="h-3.5 w-3.5 text-orange-600" />
                                  {addCardDueDateLabel}
                                </label>
                                <input
                                  type="date"
                                  value={selectedDueDate}
                                  onChange={(e) => setSelectedDueDate(e.target.value)}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSaveCard(column.id)}
                                  className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                                >
                                  Add Card
                                </button>
                                <button
                                  onClick={resetCardComposer}
                                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => beginAddCard(column.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 transition-all duration-150 ease-out hover:border-orange-300 hover:bg-orange-50 active:scale-95"
                            >
                              <Plus className="h-4 w-4" />
                              Add a card
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex-shrink-0">
                  {isAddingColumn ? (
                    <div className="w-72 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-sm p-3 shadow-sm">
                      <input
                        ref={newColumnInputRef}
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddColumn();
                          if (e.key === "Escape") {
                            setIsAddingColumn(false);
                            setNewColumnName("");
                          }
                        }}
                        placeholder="Column name"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={handleAddColumn}
                        className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-orange-600 active:scale-95"
                        >
                          Add Column
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingColumn(false);
                            setNewColumnName("");
                          }}
                        className="rounded-lg p-2 text-gray-500 transition-all duration-150 ease-out hover:bg-gray-100 active:scale-90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingColumn(true)}
                      className="flex h-14 w-72 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white/60 backdrop-blur-sm text-sm font-semibold text-gray-500 transition-all duration-300 ease-out hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4" />
                      Add another list
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoardVertical;
