import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { Badge } from '../ui';

export const DashboardHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-ash/20 z-30 transition-all">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={20} />
            <input
              type="text"
              placeholder="Search projects, clients, leads..."
              className="w-full h-10 pl-10 pr-4 bg-ash/5 border border-ash/20 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-ash/10 rounded text-xs text-ash">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-ash/5 rounded-lg transition-colors">
            <Bell size={20} className="text-secondary" />
            <Badge className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-xs flex items-center justify-center">
              3
            </Badge>
          </button>

          <button className="flex items-center gap-2 p-2 hover:bg-ash/5 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
