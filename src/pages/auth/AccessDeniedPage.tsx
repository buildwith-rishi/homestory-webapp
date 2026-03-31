import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES, getRoleDisplayName } from "../../config/rbac";

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const { roleId, user } = useAuth();
  const roleName = roleId ? getRoleDisplayName(roleId) : "your role";
  const roleMeta = roleId ? ROLES[roleId] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header stripe */}
          <div className="h-2 bg-gradient-to-r from-red-400 to-orange-500" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
              <ShieldX className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              You don&apos;t have permission to view this page.
              <br />
              Contact your administrator if you believe this is a mistake.
            </p>

            {/* Role badge */}
            {roleMeta && (
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${roleMeta.bgColor} ${roleMeta.color}`}
              >
                <Lock className="w-3.5 h-3.5" />
                Logged in as&nbsp;<strong>{roleName}</strong>
              </div>
            )}

            {/* What you can access */}
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Access Level
              </p>
              <p className="text-sm text-gray-700">
                {roleMeta?.description ||
                  "Contact your administrator for details about your access level."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <button
                onClick={() => navigate(roleMeta?.defaultRoute ?? "/dashboard")}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Logged in as &nbsp;
          <span className="font-medium text-gray-600">{user?.email}</span>
        </p>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
