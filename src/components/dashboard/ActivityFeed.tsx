import React, { useEffect, useState } from "react";
import {
  User,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  CreditCard,
  Upload,
  RefreshCw,
} from "lucide-react";
import Card from "../ui/Card";
import { formatRelativeTime } from "../../utils/helpers";
import { getActivities } from "../../services/activitiesApi";
import type { Activity, ActivityType } from "../../types";

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

const ENTITY_LABEL: Record<string, string> = {
  LEAD: "Lead",
  PROJECT: "Project",
  CUSTOMER: "Customer",
};

const getActivityMeta = (type: ActivityType) =>
  ACTIVITY_TYPE_META[type] ?? {
    title: type.replace(/_/g, " "),
    IconComp: AlertCircle,
    color: "bg-gray-400",
  };

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await getActivities();
        // Sort by createdAt descending and take latest 10
        const sorted = [...(Array.isArray(data) ? data : [])]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 10);
        setActivities(sorted);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch activities", err);
        setError("Failed to load activity feed");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
    // Refresh every 60 seconds
    const interval = setInterval(fetchActivities, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Latest updates from your team
          </p>
        </div>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No recent activity found</p>
        </div>
      )}

      {/* Activity list */}
      {!loading && !error && activities.length > 0 && (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const { title, IconComp, color } = getActivityMeta(activity.type);
            const isLast = index === activities.length - 1;
            const entityLabel =
              ENTITY_LABEL[activity.entityType] ?? activity.entityType;
            const timestamp = new Date(activity.createdAt);
            const displayDescription =
              activity.description || `${entityLabel} updated`;

            return (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-8 h-8 ${color} rounded-full flex items-center justify-center`}
                  >
                    <IconComp className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                          {displayDescription}
                        </p>
                        {activity.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {activity.createdBy}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatRelativeTime(timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="w-full mt-4 pt-4 border-t border-gray-200 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors">
        View All Activity
      </button>
    </Card>
  );
};
