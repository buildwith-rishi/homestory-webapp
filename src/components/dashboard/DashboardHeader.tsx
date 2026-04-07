import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  X,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useProjectStore } from "../../stores/projectStore";
import { useMeetingStore } from "../../stores/meetingStore";
import { useCustomerStore } from "../../stores/customerStore";
import { useLeadStore } from "../../stores/leadStore";
import { useTeamMemberStore } from "../../stores/teamMemberStore";
import Spinner from "../ui/Spinner";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "../../services/notificationApi";
import { resolveNotificationDestination } from "../../utils/notificationNavigation";
import toast from "react-hot-toast";

interface DashboardHeaderProps {
  sidebarCollapsed?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  sidebarCollapsed = false,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [apiTotalCount, setApiTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProjectStore();
  const { currentMeeting } = useMeetingStore();
  const { currentCustomer } = useCustomerStore();
  const { currentLead } = useLeadStore();
  const { currentTeamMember } = useTeamMemberStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: list, count } = await getNotifications();
      setNotifications(list);
      setApiTotalCount(count);
    } catch {
      // Silently ignore – bell just won't show count if API unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and refresh every 2 hours
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setDropdownOpen((prev) => !prev);
    if (!dropdownOpen) fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    await markNotificationRead(id);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await handleMarkRead(n.id);
    }
    try {
      const path = await resolveNotificationDestination({
        link: n.link,
        apiType: n.apiType,
      });
      if (path) {
        setDropdownOpen(false);
        navigate(path);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not open this notification",
      );
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "warning":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "error":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Get breadcrumb from current path
  const getBreadcrumb = () => {
    const path = location.pathname.split("/").filter(Boolean);
    const lastSegment = path[path.length - 1] || "dashboard";

    // If we're on a project details page, show the project name instead of UUID
    const isProjectDetailsPage =
      path.length >= 3 &&
      path[1] === "projects" &&
      path[2] &&
      path[2].includes("-");
    if (isProjectDetailsPage && currentProject) {
      return (
        currentProject.projectName || currentProject.name || "Project Details"
      );
    }

    // If we're on a meeting details page, show the meeting title instead of UUID
    const isMeetingDetailsPage =
      path.length >= 3 &&
      path[1] === "meetings" &&
      path[2] &&
      path[2].length > 20; // UUIDs are long
    if (isMeetingDetailsPage && currentMeeting) {
      return currentMeeting.title || "Meeting Details";
    }

    // If we're on a customer details page, show the customer name instead of UUID
    const isCustomerDetailsPage =
      path.length >= 3 &&
      path[1] === "customers" &&
      path[2] &&
      path[2].length > 20; // UUIDs are long
    if (isCustomerDetailsPage && currentCustomer) {
      return currentCustomer.name || "Customer Details";
    }
    if (isCustomerDetailsPage) {
      return "Customer Details";
    }

    // If we're on a lead details page, show the lead name instead of UUID
    const isLeadDetailsPage =
      path.length >= 3 && path[1] === "leads" && path[2] && path[2].length > 20; // UUIDs are long
    if (isLeadDetailsPage && currentLead) {
      return currentLead.name || "Lead Details";
    }
    if (isLeadDetailsPage) {
      return "Lead Details";
    }

    // If we're on an engineer/team member details page, show the member name
    const isEngineerDetailsPage =
      path.length >= 3 &&
      path[1] === "engineers" &&
      path[2] &&
      path[2].length > 10;
    if (isEngineerDetailsPage && currentTeamMember) {
      return currentTeamMember.name || "Team Member";
    }
    if (isEngineerDetailsPage) {
      return "Team Member";
    }

    // Capitalize and format the path segment
    const formatSegment = (segment: string) => {
      if (segment === "engineers") {
        return "Vendors";
      }

      return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    return formatSegment(lastSegment);
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300 ease-in-out shadow-sm ${
        sidebarCollapsed ? "left-20" : "left-64 xl:left-72"
      }`}
    >
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 overflow-visible">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm min-w-0 flex-1">
          <span className="text-gray-500 font-medium hidden sm:inline whitespace-nowrap">
            Main Menu
          </span>
          <ChevronRight
            size={16}
            className="text-gray-400 flex-shrink-0 hidden sm:inline"
          />
          <span className="text-gray-900 font-semibold truncate">
            {getBreadcrumb()}
          </span>
        </div>

        {/* Right: Bell + User Profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Bell Icon + Notification Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full leading-none border-2 border-white shadow-sm"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-[min(24rem,calc(100vw-1rem))] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications
                    </h3>
                    {apiTotalCount > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {apiTotalCount} total
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {loading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner size="sm" color="brand" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                      <Bell size={28} className="opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={`${n.id}-${idx}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void handleNotificationClick(n);
                          }
                        }}
                        onClick={() => void handleNotificationClick(n)}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-gray-50 ${
                          !n.read ? "bg-orange-50/40" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                          >
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-3">
                              {n.message}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-gray-400">
                            <span>{formatTime(n.createdAt)}</span>
                            {n.apiType && (
                              <span className="text-gray-300">·</span>
                            )}
                            {n.apiType && (
                              <span className="uppercase tracking-wide text-gray-400">
                                {n.apiType.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          {(n.performedBy || n.projectName) && (
                            <p className="text-[11px] text-gray-400 mt-1">
                              {n.performedBy && (
                                <span>By {n.performedBy}</span>
                              )}
                              {n.performedBy && n.projectName && " · "}
                              {n.projectName && (
                                <span className="truncate">{n.projectName}</span>
                              )}
                            </p>
                          )}
                          {n.link && (
                            <p className="text-[11px] text-orange-600 mt-1 font-medium">
                              Open linked page
                            </p>
                          )}
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 flex-shrink-0 bg-orange-500 rounded-full" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200">
            <div className="text-right hidden md:block min-w-0 max-w-[10rem]">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "Sophia Labston"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || "codence@gmail.com"}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-gray-100 flex-shrink-0">
              <span className="text-primary font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "S"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
