import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getRoleDisplayName, getRoleBadgeClasses } from "../../config/rbac";

export const WelcomeBanner: React.FC = () => {
  const { user, roleId } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleMessage = () => {
    if (!roleId) return "Here's what's happening with your projects today.";
    switch (roleId) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return "Here's your full system overview and team performance.";
      case "BDR":
        return "Here's your lead pipeline and follow-up summary.";
      case "PROJECT_MANAGER":
        return "Here's your project progress and team tasks overview.";
      case "ACCOUNTS":
        return "Here's your financial overview and payment tracking.";
      case "SITE_ENGINEER":
        return "Here's your site tasks and updates for today.";
      default:
        return "Here's what's happening with your projects today.";
    }
  };

  return (
    <div className="py-6 px-1">
      <div className="flex items-center gap-3 mb-1.5">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()},{" "}
          <span className="text-orange-600">{user?.name || "User"}</span>
        </h1>
        {roleId && (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeClasses(roleId)}`}
          >
            {getRoleDisplayName(roleId)}
          </span>
        )}
      </div>
      <p className="text-gray-500">{getRoleMessage()}</p>
    </div>
  );
};
