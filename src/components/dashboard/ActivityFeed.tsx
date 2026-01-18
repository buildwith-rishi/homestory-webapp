import React from "react";
import {
  User,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import Card from "../ui/Card";
import { formatRelativeTime } from "../../utils/helpers";

interface Activity {
  id: string;
  type: "lead" | "project" | "meeting" | "task" | "alert";
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

const activities: Activity[] = [
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
  {
    id: "6",
    type: "lead",
    title: "Lead Converted",
    description: "Rajesh Verma - Villa project confirmed",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    user: "Amit Shah",
  },
];

const getActivityIcon = (type: Activity["type"]) => {
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

export const ActivityFeed: React.FC = () => {
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

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const { Icon, color } = getActivityIcon(activity.type);
          const isLast = index === activities.length - 1;

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
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {activity.description}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {activity.user}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 pt-4 border-t border-gray-200 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors">
        View All Activity
      </button>
    </Card>
  );
};
