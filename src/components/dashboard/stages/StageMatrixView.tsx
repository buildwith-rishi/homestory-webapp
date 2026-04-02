import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  Plus,
  Trash2,
  LayoutGrid,
  Settings,
  Layers,
  Tag,
  Pencil,
} from "lucide-react";
import { Button, Card } from "../../ui";
import { CreateMatrixModal } from "./CreateMatrixModal";
import { EditMatrixModal } from "./EditMatrixModal";
import { AddDayModal } from "./AddDayModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { DayTasksPanel } from "./DayTasksPanel";
import { TaskDetailModal } from "./TaskDetailModal";
import { CategoryTasksView } from "./CategoryTasksView";
import type {
  TaskMatrix,
  MatrixTask,
  MatrixDayWiseItem,
  MatrixStats,
  ProjectStageData,
  UpdateTaskStatusRequest,
} from "../../../types";
import {
  getMatrixByStage,
  getMatrixStats,
  deleteMatrix,
  updateMatrixTaskStatus,
  markMatrixHoliday,
  updateMatrixDayTitle,
} from "../../../services/projectApi";
import toast from "react-hot-toast";

interface StageMatrixViewProps {
  projectId: string;
  projectName?: string;
  stage: ProjectStageData;
  onBack: () => void;
}

const parseDate = (d: string) => {
  // Handle ISO strings like "2026-02-11T00:00:00.000Z" and plain "2026-02-11"
  const dateOnly = d.includes("T") ? d.split("T")[0] : d;
  return new Date(dateOnly + "T00:00:00");
};

const formatDate = (d: string) => {
  const date = parseDate(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatDayLabelDate = (d: string) => {
  const date = parseDate(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const getFallbackDateForDay = (startDate: string, dayNumber: number) => {
  const d = parseDate(startDate);
  if (isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const toUtcStartOfDayIso = (rawDate: string): string | null => {
  if (!rawDate) return null;
  const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

const getIsoDateForDay = (
  dayDate: string,
  matrixStartDate: string,
  dayNumber: number,
): string | null => {
  const direct = toUtcStartOfDayIso(dayDate);
  if (direct) return direct;

  const fallbackStart = parseDate(matrixStartDate);
  if (isNaN(fallbackStart.getTime())) return null;
  fallbackStart.setDate(fallbackStart.getDate() + dayNumber - 1);
  return new Date(
    Date.UTC(
      fallbackStart.getFullYear(),
      fallbackStart.getMonth(),
      fallbackStart.getDate(),
    ),
  ).toISOString();
};

const isHolidayDay = (day: MatrixDayWiseItem): boolean => {
  return Boolean(
    day.isHoliday || day.dayType === "HOLIDAY" || day.dayStatus === "HOLIDAY",
  );
};

const getHolidayDayNumbersFromMatrix = (matrix: TaskMatrix): Set<number> => {
  const holidayDayNumbers = new Set<number>();

  // Some APIs return holiday flags in matrixDayWise.
  (matrix.matrixDayWise || []).forEach((day) => {
    if (isHolidayDay(day)) holidayDayNumbers.add(day.dayNumber);
  });

  // Primary source: backend holidays array with explicit dayNumber/date.
  const holidays =
    ((matrix as TaskMatrix & {
      holidays?: Array<{ dayNumber?: number; date?: string }>;
    }).holidays || []) as Array<{ dayNumber?: number; date?: string }>;

  holidays.forEach((holiday) => {
    if (typeof holiday.dayNumber === "number" && holiday.dayNumber > 0) {
      holidayDayNumbers.add(holiday.dayNumber);
      return;
    }

    if (!holiday.date) return;
    const holidayDateOnly = holiday.date.includes("T")
      ? holiday.date.split("T")[0]
      : holiday.date;

    const mappedDay = (matrix.matrixDayWise || []).find((entry) => {
      const entryDateOnly = entry.date.includes("T")
        ? entry.date.split("T")[0]
        : entry.date;
      return entryDateOnly === holidayDateOnly;
    });

    if (mappedDay) {
      holidayDayNumbers.add(mappedDay.dayNumber);
    }
  });

  return holidayDayNumbers;
};

const toDateInputValue = (isoDate: string): string => {
  const parsed = toUtcStartOfDayIso(isoDate);
  return parsed ? parsed.split("T")[0] : "";
};

export const StageMatrixView: React.FC<StageMatrixViewProps> = ({
  projectId,
  projectName = "",
  stage,
  onBack,
}) => {
  const [matrix, setMatrix] = useState<TaskMatrix | null>(null);
  const [stats, setStats] = useState<MatrixStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskData, setSelectedTaskData] = useState<MatrixTask | null>(
    null,
  );
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [matrixViewMode, setMatrixViewMode] = useState<"days" | "categories">(
    "days",
  );
  const [markingHolidayDay, setMarkingHolidayDay] = useState<number | null>(
    null,
  );
  const [holidayDayNumbers, setHolidayDayNumbers] = useState<Set<number>>(
    new Set(),
  );
  const [holidayDraft, setHolidayDraft] = useState<{
    dayEntry: MatrixDayWiseItem;
    date: string;
    includeSundays: boolean;
    reason: string;
  } | null>(null);
  const holidayCount = matrix ? getHolidayDayNumbersFromMatrix(matrix).size : 0;

  const [editingDayNumber, setEditingDayNumber] = useState<number | null>(null);

  const handleUpdateDayTitle = async (dayNumber: number, title: string) => {
    if (!matrix) return;
    try {
      await updateMatrixDayTitle(matrix.id, dayNumber, title);
      toast.success(`Day ${dayNumber} title updated`);
      fetchMatrix(true); // Refresh immediately to see changes
    } catch (err) {
      console.error("Failed to update day title:", err);
      toast.error("Failed to update day title");
    }
  };

  const handleAddDaySuccess = () => {
    setShowAddDayModal(false);
    fetchMatrix(true);
  };

  const fetchMatrix = useCallback(async (refreshInBackground = false) => {
    if (!refreshInBackground) setLoading(true);
    setError(null);
    try {
      // Try with stageCode first (backend expects stageCode, not UUID)
      let data: TaskMatrix | null = null;

      if (stage.stageCode) {
        console.log("[StageMatrixView] trying stageCode:", stage.stageCode);
        data = await getMatrixByStage(projectId, stage.stageCode);
      }

      // Fallback: try stage.id (UUID) if stageCode didn't work
      if (!data && stage.id && stage.id !== stage.stageCode) {
        console.log("[StageMatrixView] falling back to stage.id:", stage.id);
        data = await getMatrixByStage(projectId, stage.id);
      }

      // null means no matrix exists yet (404) — show create prompt
      if (!data) {
        setMatrix(null);
        setLoading(false);
        return;
      }

      setMatrix(data);

      // Keep a local holiday map so the checkbox remains checked immediately
      // even if backend holiday flags are delayed in matrixDayWise responses.
      const backendHolidayDays = getHolidayDayNumbersFromMatrix(data);
      if (backendHolidayDays.size > 0) {
        setHolidayDayNumbers((prev) => {
          const next = new Set(prev);
          backendHolidayDays.forEach((d) => next.add(d));
          return next;
        });
      }

      // Fetch stats if matrix exists
      if (data?.id) {
        try {
          const statsData = await getMatrixStats(data.id);
          setStats(statsData);
        } catch {
          // Stats fetch failure is non-critical
        }
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to load matrix";
      const errLower = errMsg.toLowerCase();
      // If 404, matrix doesn't exist yet — not an error, show create prompt
      if (
        errLower.includes("404") ||
        errLower.includes("not found") ||
        errLower.includes("no matrix") ||
        errLower.includes("not_found")
      ) {
        setMatrix(null);
        setError(null);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, stage.id, stage.stageCode]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const handleDeleteMatrix = async () => {
    if (!matrix) return;
    if (
      !confirm(
        "Delete this entire day plan? All tasks and attachments will be removed. This cannot be undone.",
      )
    )
      return;

    try {
      await deleteMatrix(matrix.id);
      toast.success("Day plan deleted");
      setMatrix(null);
      setStats(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete matrix",
      );
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: string,
    completionNotes?: string,
  ) => {
    setUpdatingTaskId(taskId);
    try {
      const data: UpdateTaskStatusRequest = {
        status: newStatus,
        ...(completionNotes ? { completionNotes } : {}),
      };
      await updateMatrixTaskStatus(taskId, data);
      toast.success("Task status updated");
      await fetchMatrix(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchMatrix();
  };

  const openHolidayModal = (dayEntry: MatrixDayWiseItem) => {
    if (!matrix) return;

    const isoDate = getIsoDateForDay(
      dayEntry.date,
      matrix.startDate,
      dayEntry.dayNumber,
    );

    if (!isoDate) {
      toast.error("Unable to determine date for this day");
      return;
    }

    setHolidayDraft({
      dayEntry,
      date: toDateInputValue(isoDate),
      includeSundays: false,
      reason: "Public Holiday",
    });
  };

  const handleMarkHolidaySubmit = async () => {
    if (!matrix || !holidayDraft) return;

    const isoDate = toUtcStartOfDayIso(holidayDraft.date);
    if (!isoDate) {
      toast.error("Please provide a valid holiday date");
      return;
    }

    setMarkingHolidayDay(holidayDraft.dayEntry.dayNumber);
    try {
      await markMatrixHoliday(matrix.id, {
        date: isoDate,
        dayNumber: holidayDraft.dayEntry.dayNumber,
        includeSundays: holidayDraft.includeSundays,
        reason: holidayDraft.reason.trim() || "Public Holiday",
      });
      setHolidayDayNumbers((prev) => {
        const next = new Set(prev);
        next.add(holidayDraft.dayEntry.dayNumber);
        return next;
      });
      toast.success(
        `Day ${holidayDraft.dayEntry.dayNumber} marked as holiday`,
      );
      setHolidayDraft(null);
      await fetchMatrix(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark holiday",
      );
    } finally {
      setMarkingHolidayDay(null);
    }
  };

  // Group tasks by day as a fallback when matrixDayWise is not present
  const tasksByDay: Record<number, MatrixTask[]> = {};
  if (matrix?.dayTasks) {
    for (const task of matrix.dayTasks) {
      if (!tasksByDay[task.dayNumber]) tasksByDay[task.dayNumber] = [];
      tasksByDay[task.dayNumber].push(task);
    }
  }

  const totalDays = matrix?.totalDays || 0;
  const matrixDayWise = [...(matrix?.matrixDayWise || [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
  const dayEntries: MatrixDayWiseItem[] =
    matrixDayWise.length > 0
      ? matrixDayWise
      : Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNumber) => ({
          dayNumber,
          date: (() => {
            const start = parseDate(matrix?.startDate || "");
            if (isNaN(start.getTime())) return "";
            start.setDate(start.getDate() + dayNumber - 1);
            return new Date(
              Date.UTC(
                start.getFullYear(),
                start.getMonth(),
                start.getDate(),
              ),
            ).toISOString();
          })(),
          tasks: tasksByDay[dayNumber] || [],
        }));
  const holidayDaysFromMatrix = matrix
    ? getHolidayDayNumbersFromMatrix(matrix)
    : new Set<number>();
  const effectiveHolidayDayNumbers = new Set<number>([
    ...holidayDayNumbers,
    ...holidayDaysFromMatrix,
  ]);
  const visibleDays: MatrixDayWiseItem[] = dayEntries.filter(
    (day) => !effectiveHolidayDayNumbers.has(day.dayNumber),
  );
  const visibleDayCount = visibleDays.length;

  const categories = matrix?.categories || [];

  // ─── Loading ───
  if (loading) {
    return (
      <div className="space-y-4">
        <MatrixHeader
          stage={stage}
          onBack={onBack}
          holidayCount={holidayCount}
        />
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
          <p className="text-sm font-medium">Loading day plan...</p>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="space-y-4">
        <MatrixHeader
          stage={stage}
          onBack={onBack}
          holidayCount={holidayCount}
        />
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchMatrix()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ─── No matrix — show create prompt ───
  if (!matrix) {
    return (
      <div className="space-y-4">
        <MatrixHeader
          stage={stage}
          onBack={onBack}
          holidayCount={holidayCount}
        />
        <Card className="p-8 bg-white/80 border-gray-200/50">
          <div className="flex flex-col items-center justify-center text-center">
            <LayoutGrid className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No Day Plan Yet
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              Create a day-wise task plan for this stage. You&apos;ll define
              work categories and the number of working days, then add tasks to
              each day.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Day Plan
            </Button>
          </div>
        </Card>

        {showCreateModal && (
          <CreateMatrixModal
            projectId={projectId}
            stageId={stage.id}
            stageCode={stage.stageCode}
            stageTemplateId={stage.stageTemplateId || null}
            stageName={stage.stageName}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  // ─── Matrix exists — render grid ───
  return (
    <div className="space-y-4">
      {/* Header */}
      <MatrixHeader
        stage={stage}
        onBack={onBack}
        holidayCount={effectiveHolidayDayNumbers.size}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchMatrix()}
            disabled={loading}
            className="text-gray-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDayModal(true)}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add </span>Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategoryModal(true)}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <Tag className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add </span>Category
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteMatrix}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Delete Plan</span>
          </Button>
        </div>
      </MatrixHeader>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <Card className="p-3 bg-white/80 border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">Completion</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.completionPercentage}%
            </p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </Card>
          <Card className="p-3 bg-white/80 border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">Total Tasks</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.totalTasks}
            </p>
          </Card>
          <Card className="p-3 bg-white/80 border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">Completed</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">
              {stats.completedTasks}
            </p>
          </Card>
          <Card className="p-3 bg-white/80 border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">In Progress</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">
              {stats.inProgressTasks}
            </p>
          </Card>
          <Card className="p-3 bg-white/80 border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">Pending</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">
              {stats.pendingTasks}
            </p>
          </Card>
        </div>
      )}

      {/* Info Bar + View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 text-sm">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Starts: {formatDate(matrix.startDate)}
          </span>
          <span>
            {visibleDayCount} working day{visibleDayCount !== 1 ? "s" : ""}
          </span>
          <span>
            {categories.length} categor
            {categories.length !== 1 ? "ies" : "y"}
          </span>
          <span>{matrix.includeSundays ? "Sundays included" : "Sundays excluded"}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMatrixViewMode("days")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                matrixViewMode === "days"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Days
            </button>
            <button
              onClick={() => setMatrixViewMode("categories")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                matrixViewMode === "categories"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Categories
            </button>
          </div>

        </div>
      </div>

      {/* Category Legend (day view only) */}
      {matrixViewMode === "days" && (
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs font-medium text-gray-700">
                {cat.name}
              </span>
            </div>
          ))}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-purple-300 text-xs font-medium text-purple-500 hover:bg-purple-50 hover:border-purple-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Category
          </button>
        </div>
      )}

      {/* Category View */}
      {matrixViewMode === "categories" && (
        <CategoryTasksView
          categories={categories}
          stats={stats}
          matrixId={matrix?.id || ""}
          onTaskClick={(taskId, task) => {
            setSelectedTaskId(taskId);
            setSelectedTaskData(task || null);
          }}
          onStatusChange={handleStatusChange}
          updatingTaskId={updatingTaskId}
        />
      )}

      {/* Day-wise Grid */}
      {matrixViewMode === "days" && (
        <div className="space-y-3">
          {visibleDays.map((dayEntry, visibleIndex) => {
            const dayNum = dayEntry.dayNumber;
            const displayDayNumber = visibleIndex + 1;
            const dayTasks =
              matrixDayWise.length > 0
                ? dayEntry.tasks || []
                : tasksByDay[dayNum] || [];
            const completedCount = dayTasks.filter(
              (t) => t.status === "COMPLETED",
            ).length;
            const isSelected = selectedDay === dayNum;
            const holidayBusy = markingHolidayDay === dayNum;

            return (
              <Card
                key={dayNum}
                className={`bg-white/80 border-gray-200/50 shadow-sm overflow-hidden transition-all ${
                  isSelected ? "ring-2 ring-orange-400/60" : ""
                }`}
              >
                {/* Day Header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                  onClick={() => setSelectedDay(isSelected ? null : dayNum)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                      {displayDayNumber}
                    </div>
                    <div className="text-left w-full relative">
                      <div className="flex items-center justify-between w-full h-5">
                        {editingDayNumber === dayNum ? (
                          <input
                            type="text"
                            autoFocus
                            defaultValue={dayEntry.title || ""}
                            onBlur={(e) => {
                              setEditingDayNumber(null);
                              if (e.target.value !== (dayEntry.title || "")) {
                                handleUpdateDayTitle(dayNum, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setEditingDayNumber(null);
                                if (e.currentTarget.value !== (dayEntry.title || "")) {
                                  handleUpdateDayTitle(dayNum, e.currentTarget.value);
                                }
                              } else if (e.key === "Escape") {
                                setEditingDayNumber(null);
                              }
                            }}
                            className="text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-orange-500 max-w-[120px]"
                            placeholder={`Day ${displayDayNumber}`}
                          />
                        ) : (
                          <p
                            className="text-sm font-semibold text-gray-900 flex-1 truncate cursor-pointer hover:text-orange-600 transition-colors group-hover:underline decoration-dashed decoration-gray-300 underline-offset-[3px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDayNumber(dayNum);
                            }}
                            title={dayEntry.title || `Day ${displayDayNumber}`}
                          >
                            {dayEntry.title || `Day ${displayDayNumber}`}
                          </p>
                        )}
                        
                        {!editingDayNumber && (
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingDayNumber(dayNum);
                             }}
                             className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-orange-600 transition-colors ml-2"
                             title="Edit day title"
                           >
                             <Pencil className="w-3 h-3" />
                           </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {dayEntry.date
                          ? formatDayLabelDate(dayEntry.date)
                          : getFallbackDateForDay(matrix.startDate, dayNum)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={false}
                        disabled={holidayBusy}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            toast("Holiday unmark is not supported yet");
                            return;
                          }
                          openHolidayModal(dayEntry);
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      />
                      <span>{holidayBusy ? "Saving..." : "Holiday"}</span>
                    </label>

                    {dayTasks.length > 0 ? (
                      <>
                        <span className="text-xs text-gray-400">
                          {completedCount}/{dayTasks.length} done
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-300 italic">
                        No tasks
                      </span>
                    )}
                  </div>
                </button>

                {/* Day Tasks (expandable) — uses DayTasksPanel */}
                {isSelected && matrix && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <DayTasksPanel
                      matrixId={matrix.id}
                      projectId={projectId}
                      projectName={projectName}
                      dayNumber={dayNum}
                      startDate={matrix.startDate}
                      categories={categories}
                      initialTasks={dayTasks}
                      onTaskClick={(taskId, task) => {
                        setSelectedTaskId(taskId);
                        setSelectedTaskData(task || null);
                      }}
                      onStatusChange={handleStatusChange}
                      updatingTaskId={updatingTaskId}
                      onDayDateUpdated={() => fetchMatrix(true)}
                    />
                  </div>
                )}
              </Card>
            );
          })}

          {/* Add Next Day card */}
          {matrixViewMode === "days" && (
            <Card
              className="bg-white/60 border-dashed border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer"
              onClick={() => setShowAddDayModal(true)}
            >
              <button className="w-full flex items-center justify-center gap-2 px-4 py-4">
                <Plus className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-gray-500">
                  Add Day {totalDays + 1}
                </span>
              </button>
            </Card>
          )}
        </div>
      )}

      {/* Edit Matrix Modal */}
      {showEditModal && matrix && (
        <EditMatrixModal
          matrixId={matrix.id}
          currentTotalDays={matrix.totalDays}
          currentStartDate={matrix.startDate}
          currentIncludeSundays={matrix.includeSundays ?? false}
          stageName={stage.stageName}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchMatrix(true);
          }}
        />
      )}

      {holidayDraft && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setHolidayDraft(null)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Mark Day {holidayDraft.dayEntry.dayNumber} as Holiday
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Fill holiday details before submitting.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={holidayDraft.date}
                  onChange={(e) =>
                    setHolidayDraft((prev) =>
                      prev ? { ...prev, date: e.target.value } : prev,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={holidayDraft.reason}
                  onChange={(e) =>
                    setHolidayDraft((prev) =>
                      prev ? { ...prev, reason: e.target.value } : prev,
                    )
                  }
                  placeholder="Public Holiday"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={holidayDraft.includeSundays}
                  onChange={(e) =>
                    setHolidayDraft((prev) =>
                      prev
                        ? { ...prev, includeSundays: e.target.checked }
                        : prev,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                Include Sundays
              </label>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHolidayDraft(null)}
                disabled={markingHolidayDay === holidayDraft.dayEntry.dayNumber}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleMarkHolidaySubmit}
                disabled={markingHolidayDay === holidayDraft.dayEntry.dayNumber}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {markingHolidayDay === holidayDraft.dayEntry.dayNumber ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Mark Holiday"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Day Modal */}
      {showAddDayModal && matrix && (
        <AddDayModal
          matrixId={matrix.id}
          currentTotalDays={matrix.totalDays}
          startDate={matrix.startDate}
          stageName={stage.stageName}
          onClose={() => setShowAddDayModal(false)}
          onSuccess={handleAddDaySuccess}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateMatrixModal
          projectId={projectId}
          stageId={stage.id}
          stageCode={stage.stageCode}
          stageTemplateId={stage.stageTemplateId || null}
          stageName={stage.stageName}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && matrix && (
        <AddCategoryModal
          matrixId={matrix.id}
          currentCategoryCount={categories.length}
          onClose={() => setShowAddCategoryModal(false)}
          onSuccess={() => {
            setShowAddCategoryModal(false);
            fetchMatrix(true);
          }}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          matrixId={matrix?.id || ""}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          }))}
          fallbackTask={selectedTaskData}
          onClose={() => {
            setSelectedTaskId(null);
            setSelectedTaskData(null);
          }}
          onStatusChanged={() => {
            fetchMatrix(true);
          }}
        />
      )}
    </div>
  );
};

/* ── Matrix Header ── */
const MatrixHeader: React.FC<{
  stage: ProjectStageData;
  onBack: () => void;
  holidayCount?: number;
  children?: React.ReactNode;
}> = ({ stage, onBack, holidayCount = 0, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
        <BarChart3 className="w-4.5 h-4.5 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">Day Plan</h2>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {holidayCount} Holiday{holidayCount !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {stage.stageName} &middot; {stage.stageCode}
        </p>
      </div>
    </div>
    {children}
  </div>
);
