import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { ProjectDeadlineToast } from "../../components/dashboard/ProjectDeadlineToast";
import { ProjectFilterProvider } from "../../contexts/ProjectFilterContext";

interface DeadlineNotification {
  id: string;
  projectName: string;
  deadline: string;
  daysLeft: number;
  status: "critical" | "urgent" | "warning" | "milestone";
  milestone?: string;
  progress: number;
}

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<DeadlineNotification[]>(
    [],
  );
  const [hasShownInitialNotifications, setHasShownInitialNotifications] =
    useState(false);

  useEffect(() => {
    // Show notifications only once when dashboard loads
    if (!hasShownInitialNotifications) {
      const urgentProjects: DeadlineNotification[] = [
        {
          id: "notif-1",
          projectName: "Penthouse Makeover - Gupta Family",
          deadline: "Jan 22, 2026",
          daysLeft: 2,
          status: "critical",
          progress: 92,
        },
        {
          id: "notif-2",
          projectName: "Modern 3BHK - Sharma Family",
          deadline: "Jan 25, 2026",
          daysLeft: 5,
          status: "urgent",
          progress: 65,
        },
      ];

      // Show notifications after a short delay
      setTimeout(() => {
        setNotifications(urgentProjects);
        setHasShownInitialNotifications(true);
      }, 1000);
    }
  }, [hasShownInitialNotifications]);

  const handleCloseNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <ProjectFilterProvider>
      <div
        className="min-h-screen bg-gray-50 overflow-y-auto"
        style={{ scrollbarWidth: "auto", scrollbarColor: "#c1c1c1 #f1f1f1" }}
      >
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <DashboardHeader sidebarCollapsed={sidebarCollapsed} />

        {/* Project Deadline Notifications */}
        <ProjectDeadlineToast
          notifications={notifications}
          onClose={handleCloseNotification}
        />

        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "ml-20" : "ml-72"
          }`}
        >
          <main className="pt-20 px-6 pb-8 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProjectFilterProvider>
  );
};
