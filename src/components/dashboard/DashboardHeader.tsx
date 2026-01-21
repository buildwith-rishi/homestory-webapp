import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronRight,
  FolderKanban,
  ChevronDown,
  Check,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";

interface DashboardHeaderProps {
  sidebarCollapsed?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  sidebarCollapsed = false,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const { selectedProjectId, setSelectedProjectId, projects, selectedProject } =
    useProjectFilter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <span className="text-gray-500 font-medium">Main Menu</span>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-900 font-semibold">{getBreadcrumb()}</span>
        </div>

        {/* Center: Project Filter Dropdown */}
        <div className="flex-shrink-0" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all w-[280px]"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs text-gray-500 font-medium">Viewing</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {selectedProject ? selectedProject.name : "All Projects"}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto force-scrollbar">
                {/* All Projects Option */}
                <button
                  onClick={() => {
                    setSelectedProjectId(null);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    !selectedProjectId ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      All Projects
                    </p>
                    <p className="text-xs text-gray-500">
                      View all ongoing projects
                    </p>
                  </div>
                  {!selectedProjectId && (
                    <Check className="w-5 h-5 text-orange-600" />
                  )}
                </button>

                <div className="h-px bg-gray-200 my-1" />

                {/* Individual Projects */}
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      selectedProjectId === project.id ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {project.client
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {project.client} • {project.status}
                      </p>
                    </div>
                    {selectedProjectId === project.id && (
                      <Check className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Search, Notifications, and User Profile */}
        <div className="flex items-center gap-4 flex-shrink-0">
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
