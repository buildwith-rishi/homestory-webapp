import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Pause,
  Play,
  Camera,
  FileText,
  AlertCircle,
  Paintbrush,
  Wrench,
  Hammer,
  Zap,
  LayoutGrid,
  Briefcase,
  Plus,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "../../ui";
import {
  ProjectStageWithDays,
  DayPlan,
  DayTask,
  DayTaskStatus,
  DayPlanStatus,
  Worker,
  WorkerCategory,
  UpdateDayTaskRequest,
  CompleteDaySummary,
} from "../../../types";

// Helper functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return "Not set";
  return timeString;
};

const formatCurrency = (value: number): string => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

const getWorkerCategoryIcon = (category: WorkerCategory) => {
  const icons: Record<WorkerCategory, React.ReactNode> = {
    [WorkerCategory.PAINTER]: <Paintbrush className="w-4 h-4" />,
    [WorkerCategory.CARPENTER]: <Hammer className="w-4 h-4" />,
    [WorkerCategory.PLUMBER]: <Wrench className="w-4 h-4" />,
    [WorkerCategory.ELECTRICIAN]: <Zap className="w-4 h-4" />,
    [WorkerCategory.MASON]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.TILER]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.FABRICATOR]: <Briefcase className="w-4 h-4" />,
    [WorkerCategory.HVAC_TECHNICIAN]: <Wrench className="w-4 h-4" />,
    [WorkerCategory.FLOORING_SPECIALIST]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.GLASS_WORKER]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.CIVIL_WORKER]: <Hammer className="w-4 h-4" />,
    [WorkerCategory.SUPERVISOR]: <Users className="w-4 h-4" />,
    [WorkerCategory.HELPER]: <Users className="w-4 h-4" />,
    [WorkerCategory.OTHER]: <Briefcase className="w-4 h-4" />,
  };
  return icons[category];
};

const getWorkerCategoryColor = (category: WorkerCategory) => {
  const colors: Record<WorkerCategory, { bg: string; text: string }> = {
    [WorkerCategory.PAINTER]: { bg: "bg-pink-100", text: "text-pink-700" },
    [WorkerCategory.CARPENTER]: { bg: "bg-amber-100", text: "text-amber-700" },
    [WorkerCategory.PLUMBER]: { bg: "bg-blue-100", text: "text-blue-700" },
    [WorkerCategory.ELECTRICIAN]: { bg: "bg-yellow-100", text: "text-yellow-700" },
    [WorkerCategory.MASON]: { bg: "bg-stone-100", text: "text-stone-700" },
    [WorkerCategory.TILER]: { bg: "bg-cyan-100", text: "text-cyan-700" },
    [WorkerCategory.FABRICATOR]: { bg: "bg-purple-100", text: "text-purple-700" },
    [WorkerCategory.HVAC_TECHNICIAN]: { bg: "bg-teal-100", text: "text-teal-700" },
    [WorkerCategory.FLOORING_SPECIALIST]: { bg: "bg-emerald-100", text: "text-emerald-700" },
    [WorkerCategory.GLASS_WORKER]: { bg: "bg-sky-100", text: "text-sky-700" },
    [WorkerCategory.CIVIL_WORKER]: { bg: "bg-orange-100", text: "text-orange-700" },
    [WorkerCategory.SUPERVISOR]: { bg: "bg-indigo-100", text: "text-indigo-700" },
    [WorkerCategory.HELPER]: { bg: "bg-gray-100", text: "text-gray-700" },
    [WorkerCategory.OTHER]: { bg: "bg-gray-100", text: "text-gray-700" },
  };
  return colors[category];
};

const getTaskStatusColor = (status: DayTaskStatus) => {
  const colors: Record<DayTaskStatus, { bg: string; text: string; border: string }> = {
    [DayTaskStatus.COMPLETED]: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    [DayTaskStatus.IN_PROGRESS]: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    [DayTaskStatus.NOT_STARTED]: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
    [DayTaskStatus.PAUSED]: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    [DayTaskStatus.BLOCKED]: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    [DayTaskStatus.CANCELLED]: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
  };
  return colors[status];
};

interface DayPlanModalProps {
  dayPlan: DayPlan;
  stage: ProjectStageWithDays;
  workers: Worker[];
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: UpdateDayTaskRequest) => void;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCompleteDay: (summary: CompleteDaySummary) => void;
}

export const DayPlanModal: React.FC<DayPlanModalProps> = ({
  dayPlan,
  stage,
  workers: _workers,
  onClose,
  onUpdateTask,
  onPauseTask,
  onResumeTask,
  onCompleteDay,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [completionSummary, setCompletionSummary] = useState("");
  const [showCompleteDayForm, setShowCompleteDayForm] = useState(false);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const isToday = dayPlan.status === DayPlanStatus.IN_PROGRESS;
  const isCompleted = dayPlan.status === DayPlanStatus.COMPLETED;
  const completedTasks = dayPlan.tasks.filter((t) => t.status === DayTaskStatus.COMPLETED);
  const inProgressTasks = dayPlan.tasks.filter((t) => t.status === DayTaskStatus.IN_PROGRESS);
  const pendingTasks = dayPlan.tasks.filter(
    (t) => t.status === DayTaskStatus.NOT_STARTED || t.status === DayTaskStatus.PAUSED
  );

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleTaskStatusChange = (task: DayTask, newStatus: DayTaskStatus) => {
    onUpdateTask(task.id, { status: newStatus });
  };

  const handlePauseTask = (task: DayTask) => {
    if (task.isPaused) {
      onResumeTask(task.id);
    } else {
      onPauseTask(task.id);
    }
  };

  const handleCompleteTask = (task: DayTask) => {
    const notes = taskNotes[task.id] || "";
    onUpdateTask(task.id, {
      status: DayTaskStatus.COMPLETED,
      completionNotes: notes,
    });
  };

  const handleCompleteDay = () => {
    onCompleteDay({
      dayPlanId: dayPlan.id,
      completionSummary,
      completedTasks: completedTasks.map((t) => t.id),
      pendingTasks: pendingTasks.map((t) => t.id),
      endTime: new Date().toLocaleTimeString(),
    });
    setShowCompleteDayForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Simplified Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isToday
                    ? "bg-orange-500 text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {dayPlan.dayNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    Day {dayPlan.dayNumber} - {stage.phaseName}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? "bg-green-100 text-green-700"
                        : isToday
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {dayPlan.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(dayPlan.date)}
                  </span>
                  {dayPlan.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(dayPlan.startTime)} - {formatTime(dayPlan.endTime)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-3 rounded-xl bg-white border border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{dayPlan.tasks.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-xs text-orange-600 font-medium mb-1">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{inProgressTasks.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Workers</p>
              <p className="text-2xl font-bold text-blue-600">{dayPlan.totalWorkers}</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Day Progress</span>
              <span className="text-sm font-bold text-orange-600">
                {dayPlan.tasks.length > 0
                  ? Math.round((completedTasks.length / dayPlan.tasks.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{
                  width: `${dayPlan.tasks.length > 0
                    ? (completedTasks.length / dayPlan.tasks.length) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Completed Tasks Summary (only show for completed days) */}
          {isCompleted && dayPlan.completionSummary && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
              <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                Day Completion Summary
              </h3>
              <p className="text-green-700">{dayPlan.completionSummary}</p>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Tasks for the Day
            </h3>

            {dayPlan.tasks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No tasks assigned for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayPlan.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isExpanded={expandedTasks.includes(task.id)}
                    onToggleExpand={() => toggleTaskExpand(task.id)}
                    onStatusChange={(status) => handleTaskStatusChange(task, status)}
                    onPause={() => handlePauseTask(task)}
                    onComplete={() => handleCompleteTask(task)}
                    notes={taskNotes[task.id] || ""}
                    onNotesChange={(notes) =>
                      setTaskNotes((prev) => ({ ...prev, [task.id]: notes }))
                    }
                    isEditable={isToday && !isCompleted}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Workers Summary */}
          <div className="mt-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-500" />
              Workers Assigned
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dayPlan.tasks
                .flatMap((t) => t.assignedWorkers)
                .filter((worker, index, self) => 
                  index === self.findIndex((w) => w.id === worker.id)
                )
                .map((worker) => (
                  <div
                    key={worker.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold">
                        {worker.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{worker.name}</p>
                        <div className="flex items-center gap-1">
                          {getWorkerCategoryIcon(worker.category)}
                          <span className="text-xs text-gray-500 capitalize">
                            {worker.category.toLowerCase().replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Site Notes */}
          {dayPlan.siteNotes && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5" />
                Site Notes
              </h3>
              <p className="text-amber-700">{dayPlan.siteNotes}</p>
            </div>
          )}

          {/* Day Photos */}
          {dayPlan.photos && dayPlan.photos.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-gray-500" />
                Day Progress Photos
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {dayPlan.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-xl bg-gray-100 border border-gray-200 overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt={`Day ${dayPlan.dayNumber} progress ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Day Form */}
          {showCompleteDayForm && isToday && !isCompleted && (
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Complete Day Summary</h3>
              <textarea
                value={completionSummary}
                onChange={(e) => setCompletionSummary(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Summarize what was accomplished today..."
              />
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowCompleteDayForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCompleteDay}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Day Complete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Simplified Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            {isToday && !isCompleted && (
              <>
                <Button variant="secondary">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
                {!showCompleteDayForm && (
                  <Button onClick={() => setShowCompleteDayForm(true)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Day
                  </Button>
                )}
              </>
            )}
            {!isToday && !isCompleted && (
              <Button variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: DayTask;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: DayTaskStatus) => void;
  onPause: () => void;
  onComplete: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  isEditable: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onPause,
  onComplete,
  notes,
  onNotesChange,
  isEditable,
}) => {
  const statusColors = getTaskStatusColor(task.status);
  const categoryColors = getWorkerCategoryColor(task.category);
  const isCompleted = task.status === DayTaskStatus.COMPLETED;
  const isInProgress = task.status === DayTaskStatus.IN_PROGRESS;
  const isPaused = task.status === DayTaskStatus.PAUSED;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        isCompleted
          ? "border-green-200 bg-green-50/30"
          : isInProgress
          ? "border-orange-200 bg-orange-50/30"
          : isPaused
          ? "border-yellow-200 bg-yellow-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Task Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isCompleted
                ? "bg-green-500 text-white"
                : isInProgress
                ? "bg-orange-500 text-white"
                : isPaused
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isPaused ? (
              <Pause className="w-5 h-5" />
            ) : (
              getWorkerCategoryIcon(task.category)
            )}
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold ${isCompleted ? "text-green-800" : "text-gray-900"} truncate`}>
                {task.title}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${categoryColors.bg} ${categoryColors.text}`}>
                {getWorkerCategoryIcon(task.category)}
                {task.category.replace("_", " ")}
              </span>
              <span>Est: {task.estimatedHours}h</span>
              {task.actualHours && <span>Actual: {task.actualHours}h</span>}
            </div>
          </div>

          {/* Workers Avatars */}
          <div className="flex -space-x-2">
            {task.assignedWorkers.slice(0, 3).map((worker) => (
              <div
                key={worker.id}
                className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                title={worker.name}
              >
                {worker.name.split(" ").map((n) => n[0]).join("")}
              </div>
            ))}
            {task.assignedWorkers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
                +{task.assignedWorkers.length - 3}
              </div>
            )}
          </div>

          {/* Actions */}
          {isEditable && !isCompleted && (
            <div className="flex items-center gap-1">
              {(isInProgress || isPaused) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPause();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isPaused
                      ? "hover:bg-green-100 text-green-600"
                      : "hover:bg-yellow-100 text-yellow-600"
                  }`}
                  title={isPaused ? "Resume Task" : "Pause Task"}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}

          {/* Expand Icon */}
          <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white/50">
          {/* Description */}
          {task.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Assigned Workers */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Assigned Workers</p>
            <div className="flex flex-wrap gap-2">
              {task.assignedWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
                    {worker.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium">{worker.name}</span>
                  <span className="text-xs text-gray-500">
                    ({formatCurrency(worker.dailyRate)}/day)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Notes */}
          {task.completionNotes && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-1">Completion Notes</p>
              <p className="text-sm text-green-800">{task.completionNotes}</p>
            </div>
          )}

          {/* Task Photos */}
          {task.photos && task.photos.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Task Photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {task.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={photo}
                      alt={`Task progress ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions for editable tasks */}
          {isEditable && !isCompleted && (
            <div className="space-y-3">
              {/* Notes Input */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Add Completion Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add notes about the task completion..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {task.status === DayTaskStatus.NOT_STARTED && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onStatusChange(DayTaskStatus.IN_PROGRESS)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start Task
                  </Button>
                )}
                {(isInProgress || isPaused) && (
                  <Button size="sm" onClick={onComplete}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Mark Complete
                  </Button>
                )}
                <Button size="sm" variant="secondary">
                  <Camera className="w-4 h-4 mr-1" />
                  Add Photo
                </Button>
              </div>
            </div>
          )}

          {/* Pause info */}
          {task.pauseReason && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Pause Reason</p>
              <p className="text-sm text-yellow-800">{task.pauseReason}</p>
              {task.pausedAt && (
                <p className="text-xs text-yellow-600 mt-1">
                  Paused at: {formatDate(task.pausedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DayPlanModal;
