import React, { useState } from "react";
import { signIn, getUserByUid } from "../utils/authService";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Loader } from "lucide-react";

export default function LoginPage({ goToSignUp }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("email"); // "email" or "username"
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (loginType === "email" && email) {
        // Lead login (email/password via Firebase Auth)
        const user = await signIn(email, password);
        const userData = await getUserByUid(user.uid);
        if (userData.role === "lead") {
          navigate("/lead/pharmacies");
        } else if (userData.role === "regular") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      } else if (loginType === "username" && username) {
        // Pharmacist login (username/password via Firestore)
        try {
          const q = query(
            collection(db, "users"),
            where("username", "==", username)
          );
          const snap = await getDocs(q);

          if (snap.empty) throw new Error("اسم المستخدم غير صحيح");

          const userDoc = snap.docs[0].data();

          if (userDoc.password !== password)
            throw new Error("كلمة المرور غير صحيحة");

          // Save user data to localStorage (simulate login)
          localStorage.setItem("pharmaUser", JSON.stringify(userDoc));

          if (userDoc.role === "senior" || userDoc.role === "regular") {
            navigate("/dashboard");
          } else {
            setError("الحساب غير مصرح له بالدخول هنا");
          }
        } catch (error) {
          console.error("Error during pharmacist login:", error);
          throw error;
        }
      } else {
        setError("يرجى إدخال البيانات المطلوبة");
      }
    } catch (err) {
      setError(err.message || "فشل تسجيل الدخول. تحقق من البيانات.");
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
            className="absolute w-1 h-1 bg-fuchsia-500/20 rounded-full"
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

      {/* Navbar/Branding */}
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
              مرحباً بعودتك! سجّل الدخول لإدارة صيدلياتك بأمان.
            </p>
          </motion.div>
        </div>

        {/* Right: Login Form */}
        <div className="flex flex-1 flex-col justify-center items-center p-8">
          <motion.div
            className="w-full max-w-md bg-gray-950/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-800/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-black mb-6 text-white text-center">
              تسجيل الدخول
            </h2>

            {/* Login Type Tabs */}
            <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
              <motion.button
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                  loginType === "email"
                    ? "bg-fuchsia-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setLoginType("email")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                مسؤول
              </motion.button>
              <motion.button
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                  loginType === "username"
                    ? "bg-fuchsia-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setLoginType("username")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                صيدلي
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {loginType === "email" ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-white font-bold mb-2 text-sm">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                        placeholder="أدخل بريدك الإلكتروني"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearError();
                        }}
                        autoComplete="username"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="username"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-white font-bold mb-2 text-sm">
                      اسم المستخدم
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                        placeholder="أدخل اسم المستخدم"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          clearError();
                        }}
                        autoComplete="username"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-white font-bold mb-2 text-sm">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 text-lg bg-gray-900 text-white font-bold placeholder-gray-400 transition-all duration-300"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    autoComplete="current-password"
                    required
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
                    جاري تسجيل الدخول...
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
                دخول
              </motion.button>
            </form>

            <div className="flex justify-center items-center mt-6">
              <motion.button
                className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-bold transition-colors duration-300"
                type="button"
                onClick={goToSignUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                إنشاء حساب مسؤول جديد
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
