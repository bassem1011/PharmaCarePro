import React, { useState, createContext, useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getUserByUid } from "./utils/authService";
import LeadDashboard from "./components/LeadDashboard";
import PharmaciesPage from "./components/PharmaciesPage";
import PharmacyDetailsPage from "./components/PharmacyDetailsPage";
import PharmacistsPage from "./components/PharmacistsPage";
import LeadDashboardHome from "./components/LeadDashboardHome";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import LandingPage from "./components/LandingPage";
import PharmacistDashboard from "./components/PharmacistDashboard";
import AttendancePage from "./components/AttendancePage";
import { SidebarProvider } from "./components/SidebarContext";
import Toast from "./components/ui/Toast";

// ProtectedRoute: Only allow access if authenticated
function ProtectedRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setAuthChecked(true);
      } else {
        // Check localStorage for pharmacist login
        const pharmaUser = localStorage.getItem("pharmaUser");
        let parsedUser = null;
        try {
          parsedUser = pharmaUser ? JSON.parse(pharmaUser) : null;
          if (!parsedUser || !parsedUser.username || !parsedUser.role) {
            localStorage.removeItem("pharmaUser");
            parsedUser = null;
          }
        } catch (e) {
          localStorage.removeItem("pharmaUser");
          parsedUser = null;
        }
        if (parsedUser) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, []);

  if (!authChecked) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// AuthenticatedLandingPage: Show when user is logged in
function AuthenticatedLandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 seconds timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Lead pharmacist (Firebase Auth)
          try {
            const userData = await getUserByUid(firebaseUser.uid);
            setUser({ ...userData, authType: "firebase" });
          } catch (error) {
            console.error("Error fetching user data:", error);
            // If user data fetch fails, still set basic user info
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "User",
              role: "lead",
              authType: "firebase",
            });
          }
        } else {
          // Regular pharmacist (localStorage)
          const pharmaUser = localStorage.getItem("pharmaUser");
          if (pharmaUser) {
            try {
              const parsedUser = JSON.parse(pharmaUser);
              if (parsedUser && parsedUser.username && parsedUser.role) {
                setUser({
                  ...parsedUser,
                  name: parsedUser.name || parsedUser.username,
                  authType: "localStorage",
                });
              } else {
                // Invalid localStorage data
                localStorage.removeItem("pharmaUser");
                setUser(null);
              }
            } catch (e) {
              console.error("Error parsing localStorage user:", e);
              localStorage.removeItem("pharmaUser");
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error in authentication check:", error);
        setError(error.message);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (user?.authType === "firebase") {
        const auth = getAuth();
        await signOut(auth);
      } else {
        localStorage.removeItem("pharmaUser");
      }
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Force logout by clearing localStorage and redirecting
      localStorage.removeItem("pharmaUser");
      navigate("/login");
    }
  };

  const goToDashboard = () => {
    if (user?.role === "lead") {
      navigate("/lead/pharmacies");
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">حدث خطأ</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Force reload
              window.location.reload();
            }}
            className="px-6 py-3 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900" dir="rtl">
      {/* Header */}
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">💊</span>
            </div>
            <span className="text-2xl font-black text-white">فارماكير برو</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              مرحباً،{" "}
              <span className="font-bold text-fuchsia-400">د/{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 mb-6">
            مرحباً بك في فارماكير برو
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            نظام إدارة الصيدليات المتقدم -{" "}
            {user.role === "lead"
              ? "لوحة تحكم الصيدلي الأول"
              : user.role === "senior"
              ? "لوحة تحكم الصيدلي الخبير"
              : "لوحة تحكم الصيدلي"}
          </p>
        </div>

        {/* User Info Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">
                  {user.role === "lead" ? "👨‍⚕️" : "💊"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                د/{user.name}
              </h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-full text-sm font-bold">
                  {user.role === "lead"
                    ? "صيدلي أول"
                    : user.role === "senior"
                    ? "صيدلي خبير"
                    : "صيدلي"}
                </span>
                {user.assignedPharmacy && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                    {user.assignedPharmacy}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <button
                onClick={goToDashboard}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white py-4 rounded-xl hover:from-fuchsia-700 hover:to-purple-700 font-bold transition-all duration-300 shadow-lg hover:shadow-fuchsia-500/25 flex items-center justify-center gap-3"
              >
                <span className="text-xl">🚀</span>
                <span>الذهاب إلى لوحة التحكم</span>
              </button>

              {user.role === "lead" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <button
                    onClick={() => navigate("/lead/pharmacies")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">🏥</span>
                    <span className="font-bold">إدارة الصيدليات</span>
                  </button>
                  <button
                    onClick={() => navigate("/lead/pharmacists")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">👨‍⚕️</span>
                    <span className="font-bold">إدارة الصيادلة</span>
                  </button>
                  <button
                    onClick={() => navigate("/lead/attendance")}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">📊</span>
                    <span className="font-bold">مراقبة الحضور</span>
                  </button>
                </div>
              )}

              {user.role !== "lead" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">📊</span>
                    <span className="font-bold">إدارة المخزون والوارد</span>
                  </button>
                  {user.role === "senior" && (
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl">👥</span>
                      <span className="font-bold">إدارة الحضور والصلاحيات</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-6 border border-fuchsia-700/50">
              <h3 className="text-xl font-bold text-white mb-4">
                معلومات الحساب
              </h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>اسم المستخدم:</span>
                  <span className="text-white font-bold">
                    {user.username || user.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الدور:</span>
                  <span className="text-white font-bold">
                    {user.role === "lead"
                      ? "صيدلي أول"
                      : user.role === "senior"
                      ? "صيدلي خبير"
                      : "صيدلي"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الصيدلية:</span>
                  <span className="text-white font-bold">
                    {user.assignedPharmacy || "صيدلية المستلزمات"}
                  </span>
                </div>
                {user.password && (
                  <div className="flex justify-between">
                    <span>كلمة المرور:</span>
                    <span className="text-white font-mono bg-gray-800 px-2 py-1 rounded text-sm">
                      {user.password}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-6 border border-fuchsia-700/50">
              <h3 className="text-xl font-bold text-white mb-4">
                الصلاحيات المتاحة
              </h3>
              <div className="space-y-3 text-gray-300">
                {user.role === "lead" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>إدارة الصيدليات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>إدارة الصيادلة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>مراقبة الحضور</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>عرض التقارير</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>إدارة المخزون</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>تتبع المنصرف والوارد</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>إدارة النواقص</span>
                    </div>
                    {user.role === "senior" && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>إدارة الحضور</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>إنشاء صفحات مخصصة</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PublicRoute: Only allow access if NOT authenticated
function PublicRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setAuthChecked(true);
      } else {
        // Check localStorage for pharmacist login
        const pharmaUser = localStorage.getItem("pharmaUser");
        let parsedUser = null;
        try {
          parsedUser = pharmaUser ? JSON.parse(pharmaUser) : null;
          if (!parsedUser || !parsedUser.username || !parsedUser.role) {
            localStorage.removeItem("pharmaUser");
            parsedUser = null;
          }
        } catch (e) {
          localStorage.removeItem("pharmaUser");
          parsedUser = null;
        }
        if (parsedUser) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, []);

  if (!authChecked) return null;
  return !isAuthenticated ? children : <AuthenticatedLandingPage />;
}

function LandingPageWithNav() {
  const navigate = useNavigate();
  return (
    <LandingPage
      goToLogin={() => navigate("/login")}
      goToSignUp={() => navigate("/signup")}
    />
  );
}

function LoginPageWithNav() {
  const navigate = useNavigate();
  return <LoginPage goToSignUp={() => navigate("/signup")} />;
}

function SignUpPageWithNav() {
  const navigate = useNavigate();
  return <SignUpPage goToLogin={() => navigate("/login")} />;
}

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: "", type: "info" });
  const showToast = (message, type = "info") => setToast({ message, type });
  const clearToast = () => setToast({ message: "", type: "info" });
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />
    </ToastContext.Provider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPageWithNav />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUpPageWithNav />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPageWithNav />
                </PublicRoute>
              }
            />
            <Route
              path="/lead/*"
              element={
                <ProtectedRoute>
                  <LeadDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/lead/home" replace />} />
              <Route path="home" element={<LeadDashboardHome />} />
              <Route path="pharmacies" element={<PharmaciesPage />} />
              <Route
                path="pharmacies/:pharmacyId"
                element={<PharmacyDetailsPage />}
              />
              <Route path="pharmacists" element={<PharmacistsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PharmacistDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </SidebarProvider>
    </ToastProvider>
  );
}
