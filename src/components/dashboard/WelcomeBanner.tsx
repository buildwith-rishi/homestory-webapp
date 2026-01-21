import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export const WelcomeBanner: React.FC = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        {getGreeting()}, {user?.name || "Admin"}
      </h1>
      <p className="text-gray-600">
        Here's what's happening with your projects today.
      </p>
    </div>
  );
};
