import React, { useEffect, useState, useRef, useCallback } from "react";
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

const AUTO_DISMISS_MS = 5000;

const STATUS_CONFIG = {
  critical: {
    accent: "bg-red-500",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    subColor: "text-red-600",
    progressColor: "bg-red-500",
    Icon: AlertCircle,
    label: "Deadline Critical",
  },
  urgent: {
    accent: "bg-orange-500",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    subColor: "text-orange-600",
    progressColor: "bg-orange-500",
    Icon: Clock,
    label: "Deadline Urgent",
  },
  warning: {
    accent: "bg-yellow-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-500",
    subColor: "text-yellow-600",
    progressColor: "bg-yellow-500",
    Icon: Clock,
    label: "Upcoming Deadline",
  },
  milestone: {
    accent: "bg-green-500",
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    subColor: "text-green-600",
    progressColor: "bg-green-500",
    Icon: CheckCircle2,
    label: "Milestone Reached",
  },
};

interface ToastItemProps {
  notification: ProjectDeadlineNotification;
  entryDelay: number;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  notification,
  entryDelay,
  onClose,
}) => {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = STATUS_CONFIG[notification.status] ?? STATUS_CONFIG.warning;
  const Icon = config.Icon;

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => onClose(notification.id), 380);
  }, [leaving, notification.id, onClose]);

  useEffect(() => {
    // Staggered entry animation
    const enterTimer = setTimeout(() => setEntered(true), entryDelay + 20);

    // Start progress bar + auto-dismiss after entry completes
    const startTimer = setTimeout(() => {
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
        setProgress(pct);
        if (pct <= 0 && intervalRef.current) clearInterval(intervalRef.current);
      }, 40);

      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    }, entryDelay + 400);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subText =
    notification.status === "milestone" && notification.milestone
      ? `${notification.milestone} completed`
      : notification.daysLeft === 0
        ? "Due today!"
        : notification.daysLeft === 1
          ? "Due tomorrow"
          : `${notification.daysLeft} days remaining`;

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-xl w-[320px] transition-all ease-out ${
        entered && !leaving
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-[115%] opacity-0 scale-95"
      }`}
      style={{
        transitionDuration: leaving ? "380ms" : "420ms",
        boxShadow: "0 4px 28px rgba(0,0,0,0.13), 0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* Colored left accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${config.accent}`}
      />

      <div className="pl-4 pr-3 pt-3 pb-3 flex items-start gap-3">
        {/* Icon */}
        <div
          className={`${config.iconBg} ${config.iconColor} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5 leading-none">
            {config.label}
          </p>
          <p className="font-semibold text-gray-900 text-[13px] leading-snug">
            {notification.projectName}
          </p>
          <p className={`text-[12px] font-medium mt-0.5 ${config.subColor}`}>
            {subText}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0 -mt-0.5 -mr-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100">
        <div
          className={`h-full ${config.progressColor} rounded-sm`}
          style={{ width: `${progress}%`, transition: "width 40ms linear" }}
        />
      </div>
    </div>
  );
};

export const ProjectDeadlineToast: React.FC<ProjectDeadlineToastProps> = ({
  notifications,
  onClose,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-[60] flex flex-col gap-2.5 items-end pointer-events-none">
      {notifications.map((notification, index) => (
        <div key={notification.id} className="pointer-events-auto">
          <ToastItem
            notification={notification}
            entryDelay={index * 200}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};
