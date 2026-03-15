import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  CheckCircle2,
  Clock,
  Circle,
  Ban,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Settings,
  Layers,
  Tag,
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
  MatrixCategory,
  MatrixStats,
  ProjectStageData,
  UpdateTaskStatusRequest,
} from "../../../types";
import {
  getMatrixByStage,
  getMatrixStats,
  deleteMatrix,
  updateMatrixTaskStatus,
} from "../../../services/projectApi";
import toast from "react-hot-toast";

interface StageMatrixViewProps {
  projectId: string;
  projectName?: string;
  stage: ProjectStageData;
  onBack: () => void;
}

const taskStatusConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; label: string }
> = {
  PENDING: {
    icon: <Circle className="w-3.5 h-3.5" />,
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Pending",
  },
  IN_PROGRESS: {
    icon: <Clock className="w-3.5 h-3.5" />,
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "In Progress",
  },
  COMPLETED: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Completed",
  },
  CANCELLED: {
    icon: <Ban className="w-3.5 h-3.5" />,
    bg: "bg-red-50",
    text: "text-red-500",
    label: "Cancelled",
  },
  OVERDUE: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Overdue",
  },
};

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

const getDateForDay = (startDate: string, dayNumber: number) => {
  const d = parseDate(startDate);
  if (isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const getDisplayDateForDay = (
  startDate: string,
  dayNumber: number,
  dayTasks: MatrixTask[],
) => {
  const firstTaskWithDate = dayTasks.find((t) => !!t.taskDate)?.taskDate;
  if (firstTaskWithDate) {
    const d = parseDate(firstTaskWithDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    }
  }
  return getDateForDay(startDate, dayNumber);
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

  const handleAddDaySuccess = () => {
    setShowAddDayModal(false);
    fetchMatrix();
  };

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
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
      await fetchMatrix();
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

  // Group tasks by day
  const tasksByDay: Record<number, MatrixTask[]> = {};
  if (matrix?.dayTasks) {
    for (const task of matrix.dayTasks) {
      if (!tasksByDay[task.dayNumber]) tasksByDay[task.dayNumber] = [];
      tasksByDay[task.dayNumber].push(task);
    }
  }

  const totalDays = matrix?.totalDays || 0;
  const visibleDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  const categories = matrix?.categories || [];

  // ─── Loading ───
  if (loading) {
    return (
      <div className="space-y-4">
        <MatrixHeader stage={stage} onBack={onBack} />
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
        <MatrixHeader stage={stage} onBack={onBack} />
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMatrix}>
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
        <MatrixHeader stage={stage} onBack={onBack} />
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
      <MatrixHeader stage={stage} onBack={onBack}>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatrix}
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
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </span>
          <span>
            {categories.length} categor
            {categories.length !== 1 ? "ies" : "y"}
          </span>
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
          {visibleDays.map((dayNum) => {
            const dayTasks = tasksByDay[dayNum] || [];
            const completedCount = dayTasks.filter(
              (t) => t.status === "COMPLETED",
            ).length;
            const isSelected = selectedDay === dayNum;

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
                      {dayNum}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        Day {dayNum}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {matrix.startDate &&
                          getDisplayDateForDay(
                            matrix.startDate,
                            dayNum,
                            dayTasks,
                          )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                      onTaskClick={(taskId, task) => {
                        setSelectedTaskId(taskId);
                        setSelectedTaskData(task || null);
                      }}
                      onStatusChange={handleStatusChange}
                      updatingTaskId={updatingTaskId}
                      onDayDateUpdated={fetchMatrix}
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
          stageName={stage.stageName}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchMatrix();
          }}
        />
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
            fetchMatrix();
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
            fetchMatrix();
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
  children?: React.ReactNode;
}> = ({ stage, onBack, children }) => (
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
        <h2 className="text-lg font-bold text-gray-900">Day Plan</h2>
        <p className="text-xs text-gray-500">
          {stage.stageName} &middot; {stage.stageCode}
        </p>
      </div>
    </div>
    {children}
  </div>
);
