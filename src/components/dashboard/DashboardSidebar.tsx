import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users2,
  FileText,
  Handshake,
  Users,
  FolderKanban,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Users as TeamIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  ChevronDown,
  Check,
  Layers,
} from "lucide-react";
import Logo from "../shared/Logo";
import BrandPattern from "../shared/BrandPattern";
import { useAuth } from "../../contexts/AuthContext";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { UserRole } from "../../types";

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  adminOnly?: boolean;
}

const navigationSections: NavSection[] = [
  {
    title: "Main Menu",
    items: [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
      { icon: Users2, label: "Leads", path: "/dashboard/leads" },
      { icon: FileText, label: "Follow-Ups", path: "/dashboard/updates" },
      { icon: Handshake, label: "Meetings", path: "/dashboard/meetings" },
      { icon: Users, label: "Customers", path: "/dashboard/customers" },
      { icon: FolderKanban, label: "Projects", path: "/dashboard/projects" },
    ],
  },
  {
    title: "Business Tools",
    items: [
      {
        icon: MessageSquare,
        label: "Communication",
        path: "/dashboard/voice-agent",
      },
      { icon: TrendingUp, label: "Marketing", path: "/dashboard/marketing" },
      { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: TeamIcon, label: "Team", path: "/dashboard/engineers" },
      {
        icon: Shield,
        label: "User Management",
        path: "/dashboard/users",
        adminOnly: true,
      },
      { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ],
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed,
  onToggle,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProjectId, setSelectedProjectId, projects, selectedProject } =
    useProjectFilter();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Determine if the current page should show the project filter
  const projectFilterPages = [
    "/dashboard/leads",
    "/dashboard/projects",
    "/dashboard/customers",
    "/dashboard/updates",
    "/dashboard/meetings",
  ];
  const shouldShowProjectFilter = projectFilterPages.some((page) =>
    location.pathname.startsWith(page),
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      } z-50 flex flex-col shadow-sm`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center px-4 py-5 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center w-full">
            <Logo colorScheme="default" size={200} />
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <Logo variant="mark" colorScheme="default" size={48} />
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-gray-600" />
        ) : (
          <ChevronLeft size={14} className="text-gray-600" />
        )}
      </button>

      {/* Navigation Sections - Scrollable */}
      <nav
        className="flex-1 overflow-y-scroll overflow-x-hidden py-6 px-3 sidebar-scroll"
        style={{
          minHeight: 0,
        }}
      >
        {/* Project Filter Dropdown - Shows on relevant pages */}
        {shouldShowProjectFilter && !collapsed && (
          <div className="mb-6 px-1">
            <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Filter by Project
            </h3>
            <div className="relative">
              <button
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg hover:shadow-sm transition-all"
              >
                <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {selectedProject ? selectedProject.name : "All Projects"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${
                    isProjectDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProjectDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto force-scrollbar">
                  {/* All Projects Option */}
                  <button
                    onClick={() => {
                      setSelectedProjectId(null);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${
                      !selectedProjectId ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Layers className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-semibold text-gray-900">
                        All Projects
                      </p>
                      <p className="text-[10px] text-gray-500">View all data</p>
                    </div>
                    {!selectedProjectId && (
                      <Check className="w-4 h-4 text-orange-600" />
                    )}
                  </button>

                  <div className="h-px bg-gray-200" />

                  {/* Individual Projects */}
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${
                        selectedProjectId === project.id ? "bg-orange-50" : ""
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-blue-600">
                          {project.client
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {project.client}
                        </p>
                      </div>
                      {selectedProjectId === project.id && (
                        <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact indicator when sidebar is collapsed */}
        {shouldShowProjectFilter && collapsed && selectedProjectId && (
          <div className="mb-4 px-3">
            <div className="w-full h-1 bg-orange-500 rounded-full" />
          </div>
        )}

        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? "mt-8" : ""}>
            {!collapsed && (
              <h3 className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className="h-px bg-gray-200 mx-3 mb-3" />
            )}
            <div className="space-y-1">
              {section.items
                .filter(
                  (item) => !item.adminOnly || user?.role === UserRole.ADMIN,
                )
                .map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    className={({ isActive }) =>
                      `flex items-center h-11 px-3 rounded-lg transition-all group relative ${
                        collapsed ? "justify-center" : ""
                      } ${
                        isActive
                          ? "bg-primary/5 text-primary font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={20}
                          strokeWidth={2}
                          className={
                            isActive ? "text-primary" : "text-gray-600"
                          }
                        />
                        {!collapsed && (
                          <span className="ml-3 text-sm">{item.label}</span>
                        )}
                        {collapsed && (
                          <div className="absolute left-full ml-2 bg-gray-900 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap text-sm z-50 shadow-lg">
                            {item.label}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Section - Compact & Professional */}
      {!collapsed && user && (
        <div className="relative border-t border-gray-200 bg-white z-10">
          <div className="p-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-xs">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user.name || "Rajesh Kumar"}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {user.email || "admin@goodhomestory.com"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 h-8 px-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
          {/* Subtle Brand Pattern at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none -z-10">
            <div className="relative w-full h-full opacity-20">
              <BrandPattern color="orange" opacity={0.1} scale={1} />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
