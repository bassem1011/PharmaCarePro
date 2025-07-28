import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInventoryData } from "./InventoryTabs";
import DailyDispenseTable from "./DailyDispenseTable";
import DailyIncomingTable from "./DailyIncomingTable";
import StockStatusTable from "./StockStatusTable";
import ConsumptionReport from "./ConsumptionReport";
import CustomPageManager from "./CustomPageManager";
import PharmacyShortages from "./PharmacyShortages";
import AttendancePage from "./AttendancePage";
import { getPharmacyNameById } from "../utils/firestoreService";
import Spinner from "./ui/Spinner";
import {
  Home,
  Package,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  User,
  Users,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
} from "lucide-react";

const TABS = [
  {
    key: "dashboard",
    label: "الرئيسية",
    icon: Home,
    description: "نظرة عامة على الصيدلية",
  },
  {
    key: "dispense",
    label: "المنصرف اليومي",
    icon: Package,
    description: "تتبع المنصرف اليومي",
  },
  {
    key: "incoming",
    label: "الوارد اليومي",
    icon: TrendingUp,
    description: "تتبع الوارد اليومي",
  },
  {
    key: "stock",
    label: "المخزون الحالي",
    icon: BarChart3,
    description: "عرض المخزون الحالي",
  },
  {
    key: "shortages",
    label: "نواقص الصيدلية",
    icon: AlertTriangle,
    description: "مراقبة النواقص والاحتياجات",
  },
  {
    key: "report",
    label: "تقرير الاستهلاك",
    icon: BarChart3,
    description: "تقرير الاستهلاك الشهري",
  },
  {
    key: "custom",
    label: "صفحات مخصصة",
    icon: Settings,
    description: "إنشاء صفحات مخصصة",
  },
  {
    key: "attendance",
    label: "الحضور",
    icon: Users,
    description: "إدارة حضور الصيادلة",
    seniorOnly: true,
  },
  {
    key: "profile",
    label: "الملف الشخصي",
    icon: User,
    description: "إدارة الملف الشخصي",
  },
];

// Global Month/Year Selector Component
const GlobalMonthYearSelector = ({ month, year, onMonthYearChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(month);
  const [tempYear, setTempYear] = useState(year);

  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const handleSave = () => {
    onMonthYearChange(tempMonth, tempYear);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setTempMonth(month);
    setTempYear(year);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Global Month/Year Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl p-4 mb-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-white" size={24} />
            <div>
              <h2 className="text-white font-bold text-lg">
                الشهر والسنة الحالية
              </h2>
              <p className="text-purple-100 text-sm">
                {monthNames[month]} {year}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center gap-2"
          >
            <Settings size={16} />
            تغيير الشهر
          </motion.button>
        </div>
      </motion.div>

      {/* Month/Year Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-right border-t-4 border-purple-400 font-[Cairo]"
              dir="rtl"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-2xl font-extrabold text-purple-700 tracking-wide leading-relaxed">
                  تحديد الشهر والسنة
                </h3>
                <p className="text-gray-600 mt-2">اختر الشهر والسنة المطلوبة</p>
              </div>

              <div className="space-y-6">
                {/* Month Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    الشهر:
                  </label>
                  <select
                    value={tempMonth}
                    onChange={(e) => setTempMonth(Number(e.target.value))}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg font-bold focus:border-purple-500 focus:outline-none transition-all duration-300"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    السنة:
                  </label>
                  <select
                    value={tempYear}
                    onChange={(e) => setTempYear(Number(e.target.value))}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg font-bold focus:border-purple-500 focus:outline-none transition-all duration-300"
                  >
                    {Array.from(
                      { length: 10 },
                      (_, i) => new Date().getFullYear() - 2 + i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-bold transition-all duration-300"
                  >
                    إلغاء
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-300"
                  >
                    حفظ التغييرات
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function PharmacistDashboard() {
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [pharmacyName, setPharmacyName] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const inventory = useInventoryData();

  useEffect(() => {
    const stored = localStorage.getItem("pharmaUser");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      // Fetch pharmacy display name if assignedPharmacy is present
      if (parsed.assignedPharmacy) {
        getPharmacyNameById(parsed.assignedPharmacy).then(setPharmacyName);
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-900 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <Spinner size={60} />
          <p className="text-white text-lg mt-4">
            جاري تحميل بيانات المستخدم...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen bg-gray-900 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            خطأ في تحميل البيانات
          </h2>
          <p className="text-gray-300 mb-6">
            لم يتم العثور على بيانات المستخدم
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // Determine visible tabs based on role
  const visibleTabs = TABS.filter((tab) => {
    // Show shortages for all roles
    if (tab.key === "shortages") return true;
    // Show attendance only for senior pharmacists
    if (tab.key === "attendance") return user.role === "senior";
    // Show all other tabs
    return true;
  });

  // Welcome header
  const displayName = user.name || "-";

  // Calculate 3-month mean for shortages
  function get3MonthMean(itemName) {
    // Get the current month key and calculate the 3 months we want
    const currentMonthKey = `${inventory.year}-${String(
      inventory.month + 1
    ).padStart(2, "0")}`;

    // Calculate the 3 months: current, previous, and previous-previous
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date(inventory.year, inventory.month - i, 1);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      months.push(monthKey);
    }

    const dispensedTotals = months.map((monthKey, index) => {
      const monthItems = inventory.itemsByMonth[monthKey] || [];
      const found = monthItems.find((i) => i.name === itemName);
      const total = found
        ? Object.values(found.dailyDispense || {}).reduce(
            (a, b) => a + Number(b || 0),
            0
          )
        : 0;
      return total;
    });

    // Filter out months with zero data
    const monthsWithData = dispensedTotals.filter((total) => total > 0);

    if (monthsWithData.length === 0) {
      return 0;
    }

    // Calculate mean only from months with actual data
    const mean = Math.round(
      monthsWithData.reduce((a, b) => a + b, 0) / monthsWithData.length
    );
    return mean;
  }

  // Patch monthlyConsumption for shortages to use 3-month mean
  const patchedMonthlyConsumption = {};

  (inventory.items || []).forEach((item) => {
    const mean = get3MonthMean(item.name);
    patchedMonthlyConsumption[item.name] = {
      average: mean,
      name: item.name,
      total: mean,
      months: {},
    };
  });

  // Calculate dashboard statistics
  const dashboardStats = {
    totalItems: inventory.items.length,
    totalDispensed: inventory.items.reduce(
      (sum, item) =>
        sum +
        Object.values(item.dailyDispense || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        ),
      0
    ),
    totalIncoming: inventory.items.reduce(
      (sum, item) =>
        sum +
        Object.values(item.dailyIncoming || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        ),
      0
    ),
    lowStockItems: inventory.items.filter((item) => {
      const opening = Number(item.opening || 0);
      const incoming = Object.values(item.dailyIncoming || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      );
      const dispensed = Object.values(item.dailyDispense || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      );
      return opening + incoming - dispensed <= 10;
    }).length,
  };

  const handleLogout = () => {
    localStorage.removeItem("pharmaUser");
    window.location.href = "/login";
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-6 border border-fuchsia-700/50"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">👨‍⚕️</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              مرحباً د/{displayName}
            </h1>
            <p className="text-gray-300">
              {pharmacyName && pharmacyName.includes("صيدليه")
                ? pharmacyName
                : `صيدلية ${pharmacyName || "-"}`}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          آخر تحديث: {new Date().toLocaleDateString("en-US")} -{" "}
          {new Date().toLocaleTimeString("en-US")}
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي العناصر</p>
              <p className="text-3xl font-black">{dashboardStats.totalItems}</p>
            </div>
            <Package size={32} className="text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">إجمالي المنصرف</p>
              <p className="text-3xl font-black">
                {dashboardStats.totalDispensed}
              </p>
            </div>
            <TrendingUp size={32} className="text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">إجمالي الوارد</p>
              <p className="text-3xl font-black">
                {dashboardStats.totalIncoming}
              </p>
            </div>
            <BarChart3 size={32} className="text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">عناصر منخفضة</p>
              <p className="text-3xl font-black">
                {dashboardStats.lowStockItems}
              </p>
            </div>
            <AlertTriangle size={32} className="text-red-200" />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-6 border border-fuchsia-700/50"
      >
        <h3 className="text-xl font-bold text-white mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTab("dispense")}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300"
          >
            <Package size={24} />
            <span className="font-bold">إضافة منصرف</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTab("incoming")}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
          >
            <TrendingUp size={24} />
            <span className="font-bold">إضافة وارد</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTab("stock")}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-300"
          >
            <BarChart3 size={24} />
            <span className="font-bold">عرض المخزون</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex" dir="rtl">
      {/* Enhanced Sidebar */}
      <motion.aside
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className={`bg-gray-950 text-white flex flex-col border-l-2 border-fuchsia-700 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${
          mobileMenuOpen ? "fixed inset-y-0 right-0 z-50" : "hidden md:flex"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-white font-bold text-xl">💊</span>
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-xl font-black"
                >
                  فارماكير برو
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleTabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02, x: -5 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                selectedTab === tab.key
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => {
                setSelectedTab(tab.key);
                setMobileMenuOpen(false);
              }}
            >
              <tab.icon size={20} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 text-right"
                  >
                    {tab.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:from-red-700 hover:to-pink-700 transition-all duration-300"
          >
            <LogOut size={20} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  تسجيل الخروج
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </button>
            <div className="text-white">
              <h2 className="font-bold text-lg">
                {visibleTabs.find((tab) => tab.key === selectedTab)?.label ||
                  "الرئيسية"}
              </h2>
              <p className="text-gray-400 text-sm">
                {visibleTabs.find((tab) => tab.key === selectedTab)
                  ?.description || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{new Date().toLocaleTimeString("en-US")}</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedTab === "dashboard" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <DashboardOverview />
                </>
              )}
              {selectedTab === "dispense" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <DailyDispenseTable
                      items={inventory.items.map((item) => ({
                        ...item,
                        name: item.name || "",
                      }))}
                      updateItem={inventory.updateItem}
                      addItem={inventory.addItem}
                      deleteItem={inventory.deleteItem}
                      month={inventory.month}
                      year={inventory.year}
                      handleMonthYearChange={inventory.handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {selectedTab === "incoming" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <DailyIncomingTable
                      items={inventory.items.map((item) => ({
                        ...item,
                        name: item.name || "",
                      }))}
                      updateItem={inventory.updateItem}
                      month={inventory.month}
                      year={inventory.year}
                      handleMonthYearChange={inventory.handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {selectedTab === "stock" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <StockStatusTable
                      items={inventory.items.map((item) => ({
                        ...item,
                        name: item.name || "",
                      }))}
                      updateItem={inventory.updateItem}
                      month={inventory.month}
                      year={inventory.year}
                      handleMonthYearChange={inventory.handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {selectedTab === "shortages" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <PharmacyShortages
                      items={inventory.items}
                      monthlyConsumption={patchedMonthlyConsumption}
                      month={inventory.month}
                      year={inventory.year}
                      handleMonthYearChange={inventory.handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {selectedTab === "report" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <ConsumptionReport
                      items={inventory.items}
                      monthlyConsumption={patchedMonthlyConsumption}
                      month={inventory.month}
                      year={inventory.year}
                      handleMonthYearChange={inventory.handleMonthYearChange}
                      itemsByMonth={inventory.itemsByMonth}
                    />
                  </div>
                </>
              )}
              {selectedTab === "custom" && (
                <>
                  <GlobalMonthYearSelector
                    month={inventory.month}
                    year={inventory.year}
                    onMonthYearChange={inventory.handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <CustomPageManager
                      itemsByMonth={inventory.itemsByMonth}
                      setItemsByMonth={inventory.setItemsByMonth}
                      monthKey={inventory.currentMonthKey}
                      month={inventory.month}
                      year={inventory.year}
                      setMonth={inventory.setMonth}
                      setYear={inventory.setYear}
                    />
                  </div>
                </>
              )}
              {selectedTab === "attendance" && user.role === "senior" && (
                <div className="overflow-x-auto">
                  <AttendancePage />
                </div>
              )}
              {selectedTab === "profile" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={40} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">
                        الملف الشخصي
                      </h2>
                      <p className="text-gray-400">
                        معلومات المستخدم والصلاحيات
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">الاسم:</span>
                        <span className="text-white font-bold">
                          {user.name || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">الدور:</span>
                        <span className="text-white font-bold">
                          {user.role === "senior" ? "صيدلي خبير" : "صيدلي"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">
                          اسم المستخدم:
                        </span>
                        <span className="text-white font-bold">
                          {user.username || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">
                          الصيدلية:
                        </span>
                        <span className="text-white font-bold">
                          {pharmacyName || user.assignedPharmacy || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">
                          كلمة المرور:
                        </span>
                        <span className="text-white font-bold">
                          {user.password || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
