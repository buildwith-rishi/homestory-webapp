import { ArrowLeft, Bell } from 'lucide-react';
import { Logo } from '../shared';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  onNotificationClick?: () => void;
}

export function MobileHeader({
  title,
  showBack = false,
  showNotifications = false,
  onBack,
  onNotificationClick,
}: MobileHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="w-12">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        ) : (
          <Logo className="w-8 h-8" />
        )}
      </div>

      <div className="flex-1 text-center">
        {title && (
          <h1 className="text-base font-semibold text-gray-900 truncate px-2">
            {title}
          </h1>
        )}
      </div>

      <div className="w-12 flex justify-end">
        {showNotifications && (
          <button
            onClick={onNotificationClick}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
          </button>
        )}
      </div>
    </header>
  );
}
