import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  FolderKanban,
  HardHat,
  MessageSquare,
  Users,
  Phone,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Logo from '../shared/Logo';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Mic, label: 'Meetings', path: '/dashboard/meetings' },
  { icon: FolderKanban, label: 'Projects', path: '/dashboard/projects' },
  { icon: HardHat, label: 'Site Engineers', path: '/dashboard/engineers' },
  { icon: MessageSquare, label: 'Customer Updates', path: '/dashboard/updates' },
  { icon: Users, label: 'Leads & CRM', path: '/dashboard/leads' },
  { icon: Phone, label: 'Voice Agent', path: '/dashboard/voice-agent' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-secondary transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } z-40`}
    >
      <div className="flex flex-col h-full">
        <div className="p-6">
          {collapsed ? (
            <div className="w-10 h-10 bg-primary rounded-lg" />
          ) : (
            <Logo colorScheme="mono-white" size={120} />
          )}
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center h-12 px-3 rounded-lg transition-all group relative ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-white hover:bg-white/8'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={24}
                    strokeWidth={1.5}
                    className={isActive ? 'text-primary' : 'text-white'}
                  />
                  {!collapsed && (
                    <span className="ml-3 font-body text-sm">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-16 bg-secondary px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                      <span className="font-body text-sm text-white">{item.label}</span>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onToggle}
          className="flex items-center justify-center h-12 mx-3 mb-6 rounded-lg bg-white/8 hover:bg-white/12 text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};
