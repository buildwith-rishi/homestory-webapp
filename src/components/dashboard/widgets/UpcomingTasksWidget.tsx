import React, { useEffect, useCallback } from "react";
import {
  X,
  ListTodo,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../../ui";
import { WidgetProps } from "./index";
import { useProjectStore } from "../../../stores/projectStore";

const UpcomingTasksWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const navigate = useNavigate();
  const {
    upcomingTasks,
    projects,
    tasksLoading,
    tasksError,
    fetchUpcomingTasks,
    clearError,
  } = useProjectStore();

  useEffect(() => {
    fetchUpcomingTasks();
  }, [fetchUpcomingTasks]);

  // Handle retry
  const handleRetry = useCallback(() => {
    clearError();
    fetchUpcomingTasks();
  }, [clearError, fetchUpcomingTasks]);

  // Get the first 5 upcoming incomplete tasks
  const displayTasks = (upcomingTasks || [])
    .filter((t) => !t.completed)
    .slice(0, 5);

  // Format due date relative
  const formatDueDate = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days`;
    return new Date(dueDate).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 bg-red-50";
      case "HIGH":
        return "text-orange-600 bg-orange-50";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50";
      case "LOW":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Get due date urgency
  const getDueDateUrgency = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "text-red-600";
    if (diffDays === 0) return "text-orange-600";
    if (diffDays <= 2) return "text-amber-600";
    return "text-gray-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="h-full !p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Upcoming Tasks
              </h3>
              <p className="text-xs text-gray-500">Next 7 days</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : tasksError ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                Failed to load tasks
              </p>
              <p className="text-xs text-gray-500 mt-1 mb-3 max-w-[200px] mx-auto">
                {tasksError}
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                All caught up!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                No upcoming tasks in the next 7 days
              </p>
            </div>
          ) : (
            displayTasks.map((task, index) => {
              const project = (projects || []).find(
                (p) => p.id === task.projectId,
              );
              const dueDateUrgency = getDueDateUrgency(task.dueDate);
              const isOverdue =
                new Date(task.dueDate) <
                new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() =>
                    navigate(`/dashboard/projects/${task.projectId}`)
                  }
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOverdue ? "bg-red-100" : "bg-blue-100"
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <ListTodo className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {project?.name || "Unknown Project"}
                      </span>
                      {task.priority && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-right flex-shrink-0">
                    <Clock className={`w-3 h-3 ${dueDateUrgency}`} />
                    <span className={`text-xs font-medium ${dueDateUrgency}`}>
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {displayTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => navigate("/dashboard/projects")}
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default UpcomingTasksWidget;
