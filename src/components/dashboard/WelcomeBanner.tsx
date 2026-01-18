import React from "react";
import { Clock, Calendar, CheckSquare } from "lucide-react";
import { getGreeting } from "../../utils/helpers";
import { useAuthStore } from "../../stores/authStore";

export const WelcomeBanner: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const greeting = getGreeting();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Mock data - in production, fetch from API
  const todayStats = {
    meetings: 3,
    tasks: 8,
    pending: 5,
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6 border border-orange-100 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Greeting */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {greeting}, {user?.name || "Admin"}! 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formattedDate}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Calendar className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Meetings Today</p>
                <p className="text-lg font-bold text-gray-900">
                  {todayStats.meetings}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Tasks Pending</p>
                <p className="text-lg font-bold text-gray-900">
                  {todayStats.pending}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors">
            New Lead
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors">
            Schedule Meeting
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors">
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
