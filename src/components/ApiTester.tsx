import { useState } from "react";
import { authAPI } from "../services/api";

/**
 * API Tester Component
 *
 * This component helps test the API integration during development.
 * Add it to your app temporarily to test API endpoints.
 *
 * Usage:
 * import { ApiTester } from './components/ApiTester';
 * // Add <ApiTester /> to your component tree
 */
export function ApiTester() {
  const [testEmail, setTestEmail] = useState("admin@example.com");
  const [testPassword, setTestPassword] = useState("admin123");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResponse("Testing login...");

    try {
      const result = await authAPI.login(testEmail, testPassword);
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      if (error instanceof Error) {
        setResponse(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testToken = async () => {
    setLoading(true);
    setResponse("Validating token...");

    try {
      const isValid = await authAPI.validateToken();
      setResponse(`Token is ${isValid ? "valid" : "invalid"}`);
    } catch (error) {
      if (error instanceof Error) {
        setResponse(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkStoredData = () => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");

    setResponse(
      JSON.stringify(
        {
          token: token ? `${token.substring(0, 20)}...` : "No token",
          user: user ? JSON.parse(user) : "No user",
        },
        null,
        2,
      ),
    );
  };

  const clearStorage = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setResponse("Storage cleared");
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-orange-500 rounded-lg shadow-xl p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">API Tester</h3>
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
          DEV ONLY
        </span>
      </div>

      <div className="space-y-3">
        {/* Login Test */}
        <div className="space-y-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-orange-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300"
          >
            Test Login
          </button>
        </div>

        {/* Other Tests */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testToken}
            disabled={loading}
            className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
          >
            Test Token
          </button>
          <button
            onClick={checkStoredData}
            className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
          >
            Check Storage
          </button>
          <button
            onClick={clearStorage}
            className="col-span-2 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
          >
            Clear Storage
          </button>
        </div>

        {/* Response Display */}
        {response && (
          <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-auto">
            <pre>{response}</pre>
          </div>
        )}

        {/* API Info */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <strong>API URL:</strong>{" "}
          {import.meta.env.VITE_API_BASE_URL || "Not set"}
        </div>
      </div>
    </div>
  );
}
