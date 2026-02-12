import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useAuthStore } from "../../stores/authStore";

export function EngineerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const profileStats = [
    { label: "Projects", value: "5", color: "bg-blue-500" },
    { label: "Tasks Done", value: "127", color: "bg-green-500" },
    { label: "Photos", value: "456", color: "bg-orange-500" },
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
    { icon: FileText, label: "Work History", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
    { icon: Shield, label: "Privacy Policy", action: () => {} },
    { icon: Settings, label: "Settings", action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Profile" showNotifications />

      <div className="p-4 space-y-5">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.name || "Site Engineer"}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">Site Engineer</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-gray-700">
                {user?.phone || "+91 98765 43210"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-gray-700">
                {user?.email || "engineer@goodhomestory.com"}
              </span>
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
              <span className="text-gray-700">Joined Jan 2025</span>
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
                <span className="text-white text-lg font-bold">
                  {stat.value.charAt(0)}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Settings with Toggles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              Preferences
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {settingsOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <option.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {option.label}
                  </span>
                </div>
                <button
                  onClick={() => option.onChange(!option.value)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    option.value ? "bg-orange-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      option.value ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              More Options
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {menuOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <option.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {option.label}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl shadow-sm border border-red-200 p-4 flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        {/* App Version */}
        <div className="text-center text-xs text-gray-500 py-4">
          Good Homestory CRM v1.0.0
        </div>
      </div>
    </div>
  );
}
