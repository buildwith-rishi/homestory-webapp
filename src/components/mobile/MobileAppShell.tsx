import { ReactNode, useState } from 'react';
import { Home, CheckSquare, Camera, AlertCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Tab {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
}

const tabs: Tab[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/app' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/app/tasks' },
  { id: 'upload', label: 'Upload', icon: Camera, path: '/app/upload' },
  { id: 'issues', label: 'Issues', icon: AlertCircle, path: '/app/issues' },
  { id: 'profile', label: 'Profile', icon: User, path: '/app/profile' },
];

interface MobileAppShellProps {
  children: ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  const activeTab = tabs.find((tab) => location.pathname === tab.path)?.id || 'home';

  const handleTabClick = (tab: Tab) => {
    navigate(tab.path);
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 animate-pulse z-50"></div>
        )}
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPrimary = tab.id === 'upload';

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center min-w-[44px] py-2 px-3 transition-colors ${
                isPrimary ? 'relative' : ''
              }`}
            >
              {isPrimary ? (
                <div className="w-12 h-12 -mt-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon
                    className={`w-6 h-6 mb-0.5 transition-colors ${
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 w-1 h-1 bg-orange-500 rounded-full"></div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
