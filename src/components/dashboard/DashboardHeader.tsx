import React from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardHeaderProps {
  sidebarCollapsed?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  sidebarCollapsed = false,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Get breadcrumb from current path
  const getBreadcrumb = () => {
    const path = location.pathname.split("/").filter(Boolean);
    const lastSegment = path[path.length - 1] || "dashboard";

    // Capitalize and format the path segment
    const formatSegment = (segment: string) => {
      return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    return formatSegment(lastSegment);
  };

  const notificationCount = 3; // This should come from your state/store

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300 shadow-sm ${
        sidebarCollapsed ? "left-20" : "left-72"
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Main Menu</span>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-900 font-semibold">{getBreadcrumb()}</span>
        </div>

        {/* Right: Search, Notifications, and User Profile */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || "Sophia Labston"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || "codence@gmail.com"}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-gray-100">
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
