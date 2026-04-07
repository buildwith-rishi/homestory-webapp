import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users2,
  FileText,
  Handshake,
  Users,
  FolderKanban,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Layers,
  Mail,
} from "lucide-react";
import Logo from "../shared/Logo";
import BrandPattern from "../shared/BrandPattern";
import { useAuth } from "../../contexts/AuthContext";
import { LogoutConfirmModal } from "../ui";
import {
  getVisibleNavItems,
  NAV_SECTIONS,
  ROLES,
  getRoleAccessLevel,
  ACCESS_LEVEL_BADGE_CLASSES,
} from "../../config/rbac";

// Map icon string names from config → Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Users2,
  FileText,
  Handshake,
  Users,
  FolderKanban,
  TrendingUp,
  BarChart3,
  Settings,
  Shield,
  Layers,
  Mail,
};

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed,
  onToggle,
}) => {
  const { logout, user, roleId } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Compute visible nav items based on the user's role
  const visibleItems = useMemo(() => {
    if (!roleId) return [];
    return getVisibleNavItems(roleId);
  }, [roleId]);

  // Group items by section
  const sections = useMemo(() => {
    const grouped: Record<string, typeof visibleItems> = {};
    for (const item of visibleItems) {
      if (!grouped[item.section]) grouped[item.section] = [];
      grouped[item.section].push(item);
    }
    return grouped;
  }, [visibleItems]);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const accessLevel = roleId ? getRoleAccessLevel(roleId) : null;
  const designationLabel =
    user?.designation?.trim() ||
    (roleId ? ROLES[roleId].name : user?.role?.replace(/_/g, " ") || "—");

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64 xl:w-72"
      } z-50 flex flex-col shadow-sm`}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center justify-center border-b border-gray-200 transition-all duration-300 ${
          collapsed ? "px-2 py-4" : "px-4 py-4"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center w-full justify-start">
            <Logo colorScheme="default" size={160} />
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <Logo variant="mark" colorScheme="default" size={40} />
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 shadow-sm z-10"
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
        {(["main", "business", "account"] as const).map(
          (sectionKey, sectionIndex) => {
            const items = sections[sectionKey];
            if (!items || items.length === 0) return null;

            return (
              <div key={sectionKey} className={sectionIndex > 0 ? "mt-8" : ""}>
                {!collapsed && (
                  <h3 className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {NAV_SECTIONS[sectionKey]}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const IconComponent = ICON_MAP[item.icon] || Home;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/dashboard"}
                        className={({ isActive }) =>
                          `flex items-center h-11 px-3 rounded-lg transition-all duration-200 group relative ${
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
                            <IconComponent
                              size={20}
                              strokeWidth={2}
                              className={`transition-colors duration-200 ${
                                isActive ? "text-primary" : "text-gray-600"
                              }`}
                            />
                            {!collapsed && (
                              <span className="ml-3 text-sm transition-opacity duration-200 truncate min-w-0 flex-1">
                                {item.label}
                              </span>
                            )}
                            {collapsed && (
                              <div className="absolute left-full ml-2 bg-gray-900 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap text-sm z-50 shadow-lg">
                                {item.label}
                              </div>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          },
        )}
      </nav>

      {/* User Profile — slim footer strip */}
      {!collapsed && user && (
        <div className="relative border-t border-gray-200 bg-white z-10 transition-all duration-300">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-xs">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] text-gray-500 truncate leading-tight">
                  {user.email || ""}
                </p>
              </div>
            </div>
            {/* One slim row: role name + access pill (tooltip carries full title if truncated) */}
            <div
              className="mb-1.5 flex items-center gap-1.5 rounded-md border border-gray-200/90 bg-gray-50/90 px-1.5 py-1"
              aria-label={`Role: ${designationLabel}. Access: ${accessLevel ?? "—"}`}
            >
              <Shield
                className="h-3 w-3 shrink-0 text-primary/75"
                strokeWidth={2}
                aria-hidden
              />
              <p
                className="min-w-0 flex-1 text-[11px] font-semibold leading-tight text-gray-900 truncate"
                title={designationLabel}
              >
                {designationLabel}
              </p>
              {accessLevel ? (
                <span
                  className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold leading-none ${ACCESS_LEVEL_BADGE_CLASSES[accessLevel]}`}
                >
                  {accessLevel}
                </span>
              ) : (
                <span className="shrink-0 text-[9px] text-gray-400">—</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 h-7 px-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-medium transition-colors duration-200"
            >
              <LogOut size={12} />
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

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        loading={isLoggingOut}
      />
    </aside>
  );
};
