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
    <div className="py-6 px-1">
      <h1 className="text-3xl font-bold text-gray-900 mb-1.5">
        {getGreeting()},{" "}
        <span className="text-orange-600">{user?.name || "Admin User"}</span>
      </h1>
      <p className="text-gray-500">
        Here's what's happening with your projects today.
      </p>
    </div>
  );
};
