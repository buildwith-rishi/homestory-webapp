import React, { useEffect, useState } from "react";
import { X, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface ProjectDeadlineNotification {
  id: string;
  projectName: string;
  deadline: string;
  daysLeft: number;
  status: "critical" | "urgent" | "warning" | "milestone";
  milestone?: string;
  progress: number;
}

interface ProjectDeadlineToastProps {
  notifications: ProjectDeadlineNotification[];
  onClose: (id: string) => void;
}

export const ProjectDeadlineToast: React.FC<ProjectDeadlineToastProps> = ({
  notifications,
  onClose,
}) => {
  const [visible, setVisible] = useState<string[]>([]);

  const handleClose = React.useCallback(
    (id: string) => {
      setVisible((prev) => prev.filter((visibleId) => visibleId !== id));
      setTimeout(() => {
        onClose(id);
      }, 300);
    },
    [onClose],
  );

  useEffect(() => {
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        setVisible((prev) => [...prev, notification.id]);

        setTimeout(() => {
          handleClose(notification.id);
        }, 5000);
      }, index * 200);
    });
  }, [notifications, handleClose]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "critical":
        return {
          bg: "bg-white",
          border: "border-red-200",
          iconBg: "bg-red-50",
          iconColor: "text-red-600",
          textColor: "text-red-600",
          Icon: AlertCircle,
        };
      case "urgent":
        return {
          bg: "bg-white",
          border: "border-orange-200",
          iconBg: "bg-orange-50",
          iconColor: "text-orange-600",
          textColor: "text-orange-600",
          Icon: Clock,
        };
      case "warning":
        return {
          bg: "bg-white",
          border: "border-yellow-200",
          iconBg: "bg-yellow-50",
          iconColor: "text-yellow-600",
          textColor: "text-yellow-600",
          Icon: Clock,
        };
      case "milestone":
        return {
          bg: "bg-white",
          border: "border-green-200",
          iconBg: "bg-green-50",
          iconColor: "text-green-600",
          textColor: "text-green-600",
          Icon: CheckCircle2,
        };
      default:
        return {
          bg: "bg-white",
          border: "border-gray-200",
          iconBg: "bg-gray-50",
          iconColor: "text-gray-600",
          textColor: "text-gray-600",
          Icon: Clock,
        };
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[60] space-y-2 w-80">
      {notifications.map((notification) => {
        const config = getStatusConfig(notification.status);
        const isVisible = visible.includes(notification.id);
        const Icon = config.Icon;

        return (
          <div
            key={notification.id}
            className={`${config.bg} ${config.border} border shadow-lg rounded-lg transition-all duration-300 transform ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-[120%] opacity-0"
            }`}
          >
            <div className="p-3 flex items-start gap-3">
              {/* Icon */}
              <div
                className={`${config.iconBg} ${config.iconColor} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">
                  {notification.projectName}
                </p>
                <p className={`text-xs ${config.textColor} font-medium`}>
                  {notification.status === "milestone" && notification.milestone
                    ? `${notification.milestone} completed`
                    : notification.daysLeft === 0
                      ? "Due today"
                      : notification.daysLeft === 1
                        ? "Due tomorrow"
                        : `${notification.daysLeft} days remaining`}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => handleClose(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
