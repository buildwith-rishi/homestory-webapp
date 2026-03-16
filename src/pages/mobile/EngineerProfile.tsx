import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  LogOut,
  Bell,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { MobileHeader } from "../../components/mobile/MobileHeader";
import { useAuthStore } from "../../stores/authStore";
import {
  getSiteEngineerProfile,
  type SiteEngineerProfile,
} from "../../services/siteEngineerApi";
import { LogoutConfirmModal } from "../../components/ui";

export function EngineerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Site engineer profile from API
  const [seProfile, setSeProfile] = useState<SiteEngineerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadProfile = () => {
    setProfileLoading(true);
    getSiteEngineerProfile()
      .then(setSeProfile)
      .catch((err) => console.warn("SE profile fetch failed:", err))
      .finally(() => setProfileLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Prefer SE profile data, fall back to auth store
  const displayName = seProfile?.name || user?.name || "Site Engineer";
  const displayEmail = seProfile?.email || user?.email || null;
  const displayPhone = seProfile?.phone || user?.phone || null;
  const displayLocation = seProfile?.location || null;
  const joinedAt = seProfile?.joinedAt
    ? new Date(seProfile.joinedAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : null;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      <MobileHeader title="Profile" showNotifications />

      <div className="p-4 space-y-5">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {displayName}
                </h2>
                {profileLoading && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
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
            {displayPhone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">{displayPhone}</span>
              </div>
            )}
            {displayEmail && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-gray-700">{displayEmail}</span>
              </div>
            )}
            {displayLocation && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">{displayLocation}</span>
              </div>
            )}
            {joinedAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Joined {joinedAt}</span>
              </div>
            )}
          </div>
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

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        loading={isLoggingOut}
      />
    </div>
  );
}
