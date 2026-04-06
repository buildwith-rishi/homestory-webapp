import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Logo } from "../../components/shared";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  XCircle,
  KeyRound,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import { resetPassword } from "../../services/passwordApi";
import Spinner from "../../components/ui/Spinner";

// ── Role credential definitions ────────────────────────────────────────────
const ROLE_CREDENTIALS = [
  {
    role: "Super Admin",
    email: "admin@example.com",
    password: "admin123",
    badge: "bg-red-100 text-red-700",
    description: "Full system access",
  },
  {
    role: "Admin",
    email: "om@gmail.com",
    password: "Password@2026#",
    badge: "bg-purple-100 text-purple-700",
    description: "User & CRM management",
  },
  {
    role: "Lead Designer",
    email: "sid@gmail.com",
    password: "Password@2026#",
    badge: "bg-violet-100 text-violet-700",
    description: "Design dept. head",
  },
  {
    role: "Project Manager",
    email: "spm@gmail.com",
    password: "Password@2026#",
    badge: "bg-blue-100 text-blue-700",
    description: "Project lifecycle",
  },
  {
    role: "Lead Project Manager",
    email: "spm@gmail.com",
    password: "Password@2026#",
    badge: "bg-slate-100 text-slate-700",
    description: "Senior project oversight",
  },
  {
    role: "Designer",
    email: "sv@gmail.com",
    password: "Password@2026#",
    badge: "bg-pink-100 text-pink-700",
    description: "Design execution",
  },
  {
    role: "BDR",
    email: "se@gmail.com",
    password: "Password@2026#",
    badge: "bg-orange-100 text-orange-700",
    description: "Business Development Representative",
  },
  {
    role: "HR",
    email: "hr@gmail.com",
    password: "Password@2026#",
    badge: "bg-cyan-100 text-cyan-700",
    description: "Human resources",
  },
  {
    role: "Accounts / Finance",
    email: "sef@gmail.com",
    password: "Password@2026#",
    badge: "bg-green-100 text-green-700",
    description: "Finance & payments",
  },
  {
    role: "Site Engineer",
    email: "ramesh@gmail.com",
    password: "ramesh@123",
    badge: "bg-teal-100 text-teal-700",
    description: "Field execution",
  },
] as const;

// ── Forgot-Password Modal ───────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [userId, setUserId] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rules = [
    { label: "At least 8 characters", ok: newPwd.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(newPwd) },
    { label: "One number", ok: /[0-9]/.test(newPwd) },
    { label: "One special character", ok: /[^a-zA-Z0-9]/.test(newPwd) },
  ];
  const strong = rules.every((r) => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!strong) {
      setError("Password does not meet the requirements.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }
    if (!userId.trim()) {
      setError("Please enter your User ID.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(userId.trim(), newPwd);
      setStep("success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Password reset failed. Please contact your administrator.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Reset Password
              </h2>
              <p className="text-xs text-gray-500">
                Enter your User ID and a new password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === "success" ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Password Updated!
              </h3>
              <p className="text-sm text-gray-500">
                Your password has been reset successfully. You can now log in
                with your new password.
              </p>
              <button
                onClick={onClose}
                className="mt-2 w-full h-11 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your User ID"
                  className="w-full h-11 px-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Your User ID is provided by your administrator.
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => {
                      setNewPwd(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter new password"
                    className="w-full h-11 pl-4 pr-11 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPwd.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {rules.map((r) => (
                      <div
                        key={r.label}
                        className={`flex items-center gap-1 text-xs ${r.ok ? "text-green-600" : "text-gray-400"}`}
                      >
                        {r.ok ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <XCircle size={12} className="text-gray-300" />
                        )}
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => {
                      setConfirmPwd(e.target.value);
                      setError("");
                    }}
                    placeholder="Re-enter new password"
                    className={`w-full h-11 pl-4 pr-11 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${confirmPwd && confirmPwd !== newPwd ? "border-red-400" : "border-gray-300"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !userId || !newPwd || !confirmPwd}
                className={`w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  loading || !userId || !newPwd || !confirmPwd
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md"
                }`}
              >
                {loading ? (
                  <>
                    <Spinner size="xs" color="white" />
                    Resetting…
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Successful login will redirect via AuthContext
    } catch (err) {
      // Display specific error message from API
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to login. Please check your credentials and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
      {/* Left Side - Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <Logo size={200} />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Log in</h1>
            <p className="text-gray-600">
              Welcome Back! Please Enter Your Details.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email or Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EX. user@example.com"
                  className="w-full h-12 pl-11 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-12 pl-11 pr-12 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Remember for 30 days
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-lg font-semibold flex items-center justify-center transition-all ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md"
              }`}
            >
              {loading ? <Spinner size="sm" color="white" /> : "Sign in"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Role Credentials Reference */}
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCredentials((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  Role Credentials Reference
                </span>
              </div>
              {showCredentials ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showCredentials && (
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {ROLE_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                      setShowCredentials(false);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left group"
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cred.badge}`}
                    >
                      {cred.role}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {cred.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        {cred.description}
                      </p>
                    </div>
                    <span className="text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Use →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            © Good Homestory 2026
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full h-full max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop"
              alt="Modern interior design"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-orange-300 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </div>
  );
}
