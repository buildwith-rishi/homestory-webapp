import { useState } from 'react';
import { Instagram, TrendingUp } from 'lucide-react';
import { ContentCalendar } from './ContentCalendar';
import { InstagramAnalytics } from './InstagramAnalytics';

type View = 'calendar' | 'analytics';

export function InstagramPage() {
  const [activeView, setActiveView] = useState<View>('calendar');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Instagram Management</h1>
                <p className="text-sm text-gray-600">@goodhomestory · 12.5K followers</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeView === 'calendar'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                activeView === 'analytics'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {activeView === 'calendar' && <ContentCalendar />}
      {activeView === 'analytics' && <InstagramAnalytics />}
    </div>
  );
}
