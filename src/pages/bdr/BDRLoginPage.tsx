import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Spinner from "../../components/ui/Spinner";

export function BDRLoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in as BDR (or admin), skip login and go to /bdr
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/bdr" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext handleLogin will navigate to the role's defaultRoute (/bdr)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top brand bar */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 pt-14 pb-16 text-white text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/10 rounded-full" />

        {/* Logo / Brand */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-black text-orange-500">GH</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Good Homestory
          </h1>
          <p className="text-orange-100 text-sm mt-1 font-medium">
            BDR Portal — Business Development
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col -mt-6 relative z-10">
        <div className="bg-white rounded-t-3xl shadow-xl flex-1 px-6 pt-8 pb-10 max-w-sm mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Sign in to access your BDR dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 pl-11 pr-12 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                <p className="text-sm text-red-700 leading-snug">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm mt-2 ${
                loading || !email || !password
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-orange-200 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              This portal is for authorised BDR team members only.
              <br />
              Contact your admin if you need access.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">© Good Homestory 2026</p>
      </div>
    </div>
  );
}
