import React, { useEffect, useState } from "react";
import {
  X,
  Activity,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  CreditCard,
  Upload,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, Button } from "../../ui";
import { WidgetProps } from "./index";
import { getActivities } from "../../../services/activitiesApi";
import type { Activity as ActivityItem, ActivityType } from "../../../types";

const ACTIVITY_TYPE_META: Record<
  ActivityType,
  { title: string; IconComp: React.ElementType; color: string }
> = {
  NOTE: { title: "Note Added", IconComp: FileText, color: "bg-gray-500" },
  CALL: { title: "Call Logged", IconComp: Phone, color: "bg-blue-500" },
  MEETING: {
    title: "Meeting Logged",
    IconComp: Calendar,
    color: "bg-purple-500",
  },
  EMAIL: { title: "Email Sent", IconComp: Mail, color: "bg-teal-500" },
  WHATSAPP: {
    title: "WhatsApp Message",
    IconComp: MessageCircle,
    color: "bg-green-500",
  },
  SITE_VISIT: { title: "Site Visit", IconComp: MapPin, color: "bg-orange-500" },
  STAGE_CHANGE: {
    title: "Stage Changed",
    IconComp: RefreshCw,
    color: "bg-indigo-500",
  },
  STATUS_CHANGE: {
    title: "Status Updated",
    IconComp: RefreshCw,
    color: "bg-yellow-500",
  },
  PAYMENT: {
    title: "Payment Activity",
    IconComp: CreditCard,
    color: "bg-emerald-500",
  },
  DOCUMENT_UPLOAD: {
    title: "Document Uploaded",
    IconComp: Upload,
    color: "bg-gray-400",
  },
  TASK_COMPLETED: {
    title: "Task Completed",
    IconComp: CheckCircle,
    color: "bg-emerald-500",
  },
};

const getActivityMeta = (type: ActivityType) =>
  ACTIVITY_TYPE_META[type] ?? {
    title: type.replace(/_/g, " "),
    IconComp: AlertCircle,
    color: "bg-gray-400",
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

const ActivityWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await getActivities();
        const sorted = [...(Array.isArray(data) ? data : [])]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5);
        setActivities(sorted);
      } catch (err) {
        console.error("Failed to load activities for widget", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <Card className="h-full animate-scale-in group relative !p-0">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-600" />
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

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5 py-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="w-6 h-6 text-gray-300 mb-1" />
            <p className="text-xs text-gray-400">No recent activity</p>
          </div>
        )}

        {/* Activity List */}
        {!loading && activities.length > 0 && (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {activities.map((activity, index) => {
              const { title, IconComp, color } = getActivityMeta(activity.type);
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
                      <IconComp className="w-4 h-4 text-white" />
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
                          {title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatRelativeTime(new Date(activity.createdAt))}
                      </span>
                    </div>
                    {activity.createdBy && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {activity.createdBy}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

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
