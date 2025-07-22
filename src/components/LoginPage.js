import React, { useState } from "react";
import { signIn } from "../utils/authService";
import { useNavigate } from "react-router-dom";

const LoginPage = ({ onLogin, goToSignUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      if (onLogin) onLogin();
    } catch (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">💊</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            PharmaCare Pro
          </span>
        </div>
      </nav>
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left: Welcome/Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-purple-700 to-fuchsia-600 text-white p-12">
          <div className="mb-8">
            <span className="text-7xl">💊</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 drop-shadow-lg">
            PharmaCare Pro
          </h1>
          <p className="text-lg opacity-90 max-w-md text-center">
            Manage your pharmacy’s stock, reports, and more. Secure, modern, and
            easy to use.
          </p>
        </div>
        {/* Right: Login Form */}
        <div className="flex flex-1 flex-col justify-center items-center p-8">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
              Sign In
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-900 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-gray-900 font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-red-600 text-center font-semibold">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-bold rounded-lg text-lg transition-all duration-200 shadow-md"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="flex justify-between items-center mt-6">
              <button
                className="text-fuchsia-600 hover:underline text-sm font-semibold"
                type="button"
                onClick={goToSignUp}
              >
                Don’t have an account? Sign up
              </button>
              <button
                className="text-gray-500 hover:underline text-sm"
                type="button"
                // onClick={handleForgotPassword} // Implement if needed
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
