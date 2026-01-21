import React from "react";
import {
  X,
  Activity,
  User,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, Button } from "../../ui";
import { WidgetProps } from "./index";

interface ActivityItem {
  id: string;
  type: "lead" | "project" | "meeting" | "task" | "alert";
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

const ActivityWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "lead",
      title: "New Lead Assigned",
      description: "Priya Sharma - Luxury Apartment in Bandra",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: "Rahul Kumar",
    },
    {
      id: "2",
      type: "project",
      title: "Project Updated",
      description: "Mehra Residence moved to Design Phase",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      user: "Anjali Patel",
    },
    {
      id: "3",
      type: "meeting",
      title: "Meeting Completed",
      description: "Site visit with Kapoor family",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: "Vikram Singh",
    },
    {
      id: "4",
      type: "task",
      title: "Task Completed",
      description: "Final design approval received",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      user: "Neha Gupta",
    },
    {
      id: "5",
      type: "alert",
      title: "Payment Pending",
      description: "Invoice #2847 overdue by 3 days",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  ];

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "lead":
        return { Icon: User, color: "bg-blue-500" };
      case "project":
        return { Icon: FileText, color: "bg-orange-500" };
      case "meeting":
        return { Icon: Calendar, color: "bg-purple-500" };
      case "task":
        return { Icon: CheckCircle, color: "bg-emerald-500" };
      case "alert":
        return { Icon: AlertCircle, color: "bg-red-500" };
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className="h-full animate-scale-in group relative">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Recent Activity
              </h3>
              <p className="text-xs text-gray-500">Latest team updates</p>
            </div>
          </div>
          <Clock className="w-4 h-4 text-gray-400" />
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-56 overflow-y-auto">
          {activities.map((activity, index) => {
            const { Icon, color } = getActivityIcon(activity.type);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex gap-3"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  {activity.user && (
                    <p className="text-xs text-gray-400 mt-1">
                      by {activity.user}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            View All Activity <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ActivityWidget;
