import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Bell,
  Moon,
  Sun,
  Target,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useAuthStore } from "../../stores/authStore";
import { getBDRProfile, BDRProfileUser } from "../../services/bdrApi";
import { Spinner } from "../../components/ui";

export function BDRProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [apiProfile, setApiProfile] = useState<BDRProfileUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    getBDRProfile()
      .then((res) => setApiProfile(res.user))
      .catch(() => setApiProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const displayName = apiProfile?.name || user?.name || "BDR";
  const displayEmail =
    apiProfile?.email || user?.email || "bdr@goodhomestory.com";
  const displayPhone = apiProfile?.phone || user?.phone || null;
  const joinedDate = apiProfile?.createdAt
    ? new Date(apiProfile.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "Jan 2025";

  const profileStats = [
    {
      label: "Leads",
      value: profileLoading
        ? "..."
        : String(apiProfile?._count?.assignedLeads ?? 0),
      color: "bg-blue-500",
    },
    {
      label: "Activities",
      value: profileLoading
        ? "..."
        : String(apiProfile?._count?.activities ?? 0),
      color: "bg-green-500",
    },
    {
      label: "Status",
      value: apiProfile?.isActive ? "Active" : "Inactive",
      color: "bg-orange-500",
    },
  ];

  const settingsOptions = [
    {
      icon: Bell,
      label: "Notifications",
      isToggle: true,
      value: notificationsEnabled,
      onChange: setNotificationsEnabled,
    },
    {
      icon: isDarkMode ? Moon : Sun,
      label: "Dark Mode",
      isToggle: true,
      value: isDarkMode,
      onChange: setIsDarkMode,
    },
  ];

  const menuOptions = [
    { icon: Target, label: "My Leads", action: () => navigate("/bdr/leads") },
    {
      icon: FileText,
      label: "My Meetings",
      action: () => navigate("/bdr/meetings"),
    },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
    { icon: Shield, label: "Privacy Policy", action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Profile" showNotifications />

      <div className="p-4 space-y-5">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {profileLoading ? (
                <Spinner size="sm" color="white" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Business Development Representative
              </p>
              <div className="flex items-center gap-1 mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${apiProfile?.isActive !== false ? "bg-green-500" : "bg-red-400"}`}
                />
                <span
                  className={`text-xs font-medium ${apiProfile?.isActive !== false ? "text-green-600" : "text-red-500"}`}
                >
                  {apiProfile?.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            {displayPhone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">{displayPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-gray-700">{displayEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Bangalore, Karnataka</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-gray-700">Joined {joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {profileStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"
            >
              <div
                className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-2`}
              >
                <span className="text-white text-sm font-bold">
                  {stat.value === "..." ? "~" : stat.value.charAt(0)}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              Preferences
            </h3>
          </div>
          {settingsOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {option.label}
                  </span>
                </div>
                <button
                  onClick={() => option.onChange(!option.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    option.value ? "bg-orange-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      option.value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              More
            </h3>
          </div>
          {menuOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={index}
                onClick={option.action}
                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {option.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 font-semibold active:scale-95 transition-all hover:bg-red-100"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <div className="text-center pb-2">
          <p className="text-xs text-gray-400">GHS BDR App v1.0</p>
        </div>
      </div>
    </div>
  );
}
