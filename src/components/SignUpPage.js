import React, { useState } from "react";
import { signUp, getUserByUid } from "../utils/authService";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader,
  Shield,
} from "lucide-react";

const SignUpPage = ({ onSignUp, goToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  // Default to lead pharmacist for first sign up; can be customized later
  // const role = "lead";

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthMap = {
      0: { label: "ضعيف جداً", color: "text-red-400" },
      1: { label: "ضعيف", color: "text-red-400" },
      2: { label: "متوسط", color: "text-yellow-400" },
      3: { label: "جيد", color: "text-blue-400" },
      4: { label: "قوي", color: "text-green-400" },
      5: { label: "قوي جداً", color: "text-green-400" },
    };

    return { score, ...strengthMap[score] };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!acceptedTerms) {
      setError("يجب الموافقة على الشروط والأحكام");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError("كلمة المرور ضعيفة جداً");
      setLoading(false);
      return;
    }

    try {
      const user = await signUp(email, password, name, "lead");
      const userData = await getUserByUid(user.uid);
      if (userData.role === "lead") {
        navigate("/lead/pharmacies");
      } else if (userData.role === "regular") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("فشل إنشاء الحساب. تحقق من البيانات.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError("");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col relative overflow-hidden"
      dir="rtl"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.1, 0.8, 0.1],
            }}
            transition={{
              duration: 10 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between relative z-10">
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-xl flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-white font-bold text-xl">💊</span>
          </motion.div>
          <span className="text-2xl font-black text-white">فارماكير برو</span>
        </motion.div>
      </nav>

      <div className="flex flex-1 flex-col md:flex-row relative z-10">
        {/* Left: Welcome/Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-purple-900/50 to-fuchsia-900/50 backdrop-blur-sm text-white p-12 relative">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30"></div>

          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="mb-8"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-7xl">💊</span>
            </motion.div>
            <h1 className="text-4xl font-black mb-4 drop-shadow-lg">
              فارماكير برو
            </h1>
            <p className="text-lg opacity-90 max-w-md text-center font-bold">
              ابدأ بإدارة صيدلياتك من خلال بوابة آمنة وحديثة.
            </p>
          </motion.div>
        </div>

        {/* Right: Sign Up Form */}
        <div className="flex flex-1 flex-col justify-center items-center p-8">
          <motion.div
            className="w-full max-w-md bg-gray-950/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-800/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-black mb-6 text-white text-center">
              إنشاء حساب جديد
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white font-bold mb-2 text-sm">
                  الاسم
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError();
                  }}
                  required
                  autoFocus
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label className="block text-white font-bold mb-2 text-sm">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  required
                  placeholder="البريد الإلكتروني"
                />
              </div>
              <div>
                <label className="block text-white font-bold mb-2 text-sm">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    required
                    placeholder="كلمة المرور"
                  />
                  <motion.button
                    type="button"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={16} className="text-gray-400" />
                      <span
                        className={`text-sm font-bold ${passwordStrength.color}`}
                      >
                        قوة كلمة المرور: {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 1
                            ? "bg-red-500"
                            : passwordStrength.score <= 2
                            ? "bg-yellow-500"
                            : passwordStrength.score <= 3
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <label className="block text-white font-bold mb-2 text-sm">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError();
                    }}
                    required
                    placeholder="تأكيد كلمة المرور"
                  />
                  <motion.button
                    type="button"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </motion.button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2"
                  >
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-green-400 text-sm font-bold">
                          كلمات المرور متطابقة
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-red-400" />
                        <span className="text-red-400 text-sm font-bold">
                          كلمات المرور غير متطابقة
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-fuchsia-600 bg-gray-900 border-gray-700 rounded focus:ring-fuchsia-500 focus:ring-2"
                />
                <label htmlFor="terms" className="text-gray-300 text-sm">
                  أوافق على{" "}
                  <span className="text-fuchsia-400 hover:underline cursor-pointer">
                    الشروط والأحكام
                  </span>{" "}
                  و{" "}
                  <span className="text-fuchsia-400 hover:underline cursor-pointer">
                    سياسة الخصوصية
                  </span>
                </label>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-red-400 text-center font-bold bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                  >
                    <AlertCircle size={20} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading State */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 text-white font-bold py-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader size={20} />
                    </motion.div>
                    جاري إنشاء الحساب...
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-extrabold rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-fuchsia-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "جاري التسجيل..." : "إنشاء حساب"}
              </motion.button>
            </form>
            <div className="flex justify-center items-center mt-6">
              <motion.button
                className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-bold transition-colors duration-300"
                type="button"
                onClick={goToLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                لديك حساب بالفعل؟ تسجيل الدخول
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
