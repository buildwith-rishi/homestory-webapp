import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { ProjectFilterProvider } from "../../contexts/ProjectFilterContext";

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isKanbanRoute = location.pathname.startsWith("/dashboard/kanban");
  const isProjectDetailsRoute =
    location.pathname.startsWith("/dashboard/projects/") &&
    location.pathname.split("/").filter(Boolean).length >= 3;

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

        <div
          className={`transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "ml-20" : "ml-64 xl:ml-72"
          }`}
        >
          <main
            className={`min-h-screen w-full ${
              isKanbanRoute
                ? "pt-16 px-0 pb-0"
                : isProjectDetailsRoute
                  ? "pt-[72px] px-2 sm:px-3 lg:px-4 pb-5"
                  : "pt-20 px-3 sm:px-4 lg:px-6 pb-6"
            }`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </ProjectFilterProvider>
  );
};
