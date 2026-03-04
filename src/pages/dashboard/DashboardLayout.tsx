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

const SESSION_KEY = "ghs_deadline_toasts_shown";

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<DeadlineNotification[]>(
    [],
  );

  useEffect(() => {
    // Show deadline toasts only once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const urgentProjects: DeadlineNotification[] = [
      {
        id: "notif-1",
        projectName: "Penthouse Makeover - Gupta Family",
        deadline: "Mar 4, 2026",
        daysLeft: 2,
        status: "critical",
        progress: 92,
      },
      {
        id: "notif-2",
        projectName: "Modern 3BHK - Sharma Family",
        deadline: "Mar 7, 2026",
        daysLeft: 5,
        status: "urgent",
        progress: 65,
      },
    ];

    // Mark as shown immediately so fast re-renders don't double-fire
    sessionStorage.setItem(SESSION_KEY, "1");

    // Small delay so the page content loads first
    const t = setTimeout(() => {
      setNotifications(urgentProjects);
    }, 1200);

    return () => clearTimeout(t);
  }, []);

  const handleCloseNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <ProjectFilterProvider>
      <div
        className="min-h-screen bg-gray-50 overflow-x-hidden"
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
          className={`transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "ml-20" : "ml-64 xl:ml-72"
          }`}
        >
          <main className="pt-20 px-3 sm:px-4 lg:px-6 pb-6 min-h-screen w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </ProjectFilterProvider>
  );
};
