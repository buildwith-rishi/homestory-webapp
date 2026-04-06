import { ReactNode } from "react";
import { Home, CheckSquare, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface Tab {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
}

const tabs: Tab[] = [
  { id: "home", label: "Home", icon: Home, path: "/app" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, path: "/app/tasks" },
  { id: "profile", label: "Profile", icon: User, path: "/app/profile" },
];

interface MobileAppShellProps {
  children: ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab =
    tabs.find((tab) => location.pathname === tab.path)?.id || "home";

  const handleTabClick = (tab: Tab) => {
    navigate(tab.path);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center min-w-[60px] py-1.5 transition-all ${isActive ? "scale-105" : ""}`}
            >
              <div className={`relative ${isActive ? "mb-0.5" : ""}`}>
                <Icon
                  className={`w-6 h-6 transition-all ${
                    isActive ? "text-orange-500" : "text-gray-400"
                  }`}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors mt-0.5 ${
                  isActive ? "text-orange-600" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
