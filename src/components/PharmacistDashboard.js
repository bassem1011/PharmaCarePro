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
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Calendar className="w-5 h-5" />
        <span>
          {monthNames[month]} {year}
        </span>
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-right"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-2xl font-extrabold text-gray-800">
                  تغيير الشهر والسنة
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الشهر
                  </label>
                  <select
                    value={tempMonth}
                    onChange={(e) => setTempMonth(Number(e.target.value))}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    السنة
                  </label>
                  <input
                    type="number"
                    value={tempYear}
                    onChange={(e) => setTempYear(Number(e.target.value))}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  إلغاء
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  حفظ
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pharmacyName, setPharmacyName] = useState("");
  const [loadingPharmacyName, setLoadingPharmacyName] = useState(true);

  // Get user data from localStorage (for regular pharmacists)
  const userData = JSON.parse(localStorage.getItem("pharmaUser") || "{}");
  const assignedPharmacyId = userData.assignedPharmacy;

  // Use pharmacy-specific inventory data
  const {
    month,
    year,
    items,
    itemsByMonth,
    updateItem,
    addItem,
    deleteItem,
    handleMonthYearChange,
    loading,
    error,
    monthlyConsumption,
  } = useInventoryData(assignedPharmacyId);

  // Get pharmacy name for display
  useEffect(() => {
    const fetchPharmacyName = async () => {
      if (assignedPharmacyId) {
        try {
          const name = await getPharmacyNameById(assignedPharmacyId);
          setPharmacyName(name);
        } catch (error) {
          console.error("Error fetching pharmacy name:", error);
          setPharmacyName("صيدلية غير معروفة");
        } finally {
          setLoadingPharmacyName(false);
        }
      } else {
        setPharmacyName("صيدلية غير معينة");
        setLoadingPharmacyName(false);
      }
    };

    fetchPharmacyName();
  }, [assignedPharmacyId]);

  // Calculate 3-month mean for shortages
  function get3MonthMean(itemName) {
    if (!monthlyConsumption || !monthlyConsumption[itemName]) {
      return 10; // Default fallback
    }

    const item = monthlyConsumption[itemName];
    const monthKeys = Object.keys(item.months).sort();

    if (monthKeys.length === 0) {
      return 10; // Default fallback
    }

    // Get the last 3 months with data
    const recentMonths = monthKeys.slice(-3);
    const recentValues = recentMonths
      .map((monthKey) => item.months[monthKey])
      .filter((value) => value > 0); // Only include months with actual data

    if (recentValues.length === 0) {
      return 10; // Default fallback
    }

    // Calculate average of recent months with data
    const sum = recentValues.reduce((acc, val) => acc + val, 0);
    return Math.floor(sum / recentValues.length);
  }

  const handleLogout = () => {
    localStorage.removeItem("pharmaUser");
    window.location.href = "/login";
  };

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">🏥</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                {loadingPharmacyName ? "جاري التحميل..." : pharmacyName}
              </h2>
              <p className="text-purple-100 mt-1">
                لوحة تحكم الصيدلي - {userData.name || "مستخدم"}
              </p>
            </div>
          </div>
          <GlobalMonthYearSelector
            month={month}
            year={year}
            onMonthYearChange={handleMonthYearChange}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي الأصناف</p>
              <p className="text-3xl font-bold">{items ? items.length : 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">إجمالي الوارد</p>
              <p className="text-3xl font-bold">
                {items
                  ? items.reduce((sum, item) => {
                      const itemTotal = Object.values(
                        item.dailyIncoming || {}
                      ).reduce((acc, val) => acc + Number(val || 0), 0);
                      return sum + itemTotal;
                    }, 0)
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📥</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">إجمالي المنصرف</p>
              <p className="text-3xl font-bold">
                {items
                  ? items.reduce((sum, item) => {
                      const itemTotal = Object.values(
                        item.dailyDispense || {}
                      ).reduce((acc, val) => acc + Number(val || 0), 0);
                      return sum + itemTotal;
                    }, 0)
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📤</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">النواقص</p>
              <p className="text-3xl font-bold">
                {items
                  ? items.filter((item) => {
                      if (!item.name) return false;
                      const opening = Math.floor(Number(item.opening || 0));
                      const totalIncoming = Math.floor(
                        Object.values(item.dailyIncoming || {}).reduce(
                          (acc, val) => acc + Number(val || 0),
                          0
                        )
                      );
                      const totalDispensed = Math.floor(
                        Object.values(item.dailyDispense || {}).reduce(
                          (acc, val) => acc + Number(val || 0),
                          0
                        )
                      );
                      const currentStock =
                        opening + totalIncoming - totalDispensed;
                      const averageConsumption = get3MonthMean(item.name);
                      return currentStock <= averageConsumption;
                    }).length
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TABS.filter(
          (tab) => tab.key !== "dashboard" && tab.key !== "profile"
        ).map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-right border border-gray-200"
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <tab.icon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {tab.label}
                </h3>
                <p className="text-gray-600 text-sm">{tab.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex" dir="rtl">
      {/* Enhanced Sidebar */}
      <motion.aside
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className={`bg-gray-950 text-white flex flex-col border-l-2 border-fuchsia-700 transition-all duration-300 ${
          sidebarOpen ? "fixed inset-y-0 right-0 z-50" : "hidden md:flex"
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
              {!sidebarOpen && (
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
          {TABS.map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02, x: -5 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
            >
              <tab.icon size={20} />
              <AnimatePresence>
                {!sidebarOpen && (
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
              {!sidebarOpen && (
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </button>
            <div className="text-white">
              <h2 className="font-bold text-lg">
                {TABS.find((tab) => tab.key === activeTab)?.label || "الرئيسية"}
              </h2>
              <p className="text-gray-400 text-sm">
                {TABS.find((tab) => tab.key === activeTab)?.description || ""}
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
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "dashboard" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <DashboardOverview />
                </>
              )}
              {activeTab === "dispense" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <DailyDispenseTable
                      items={items.map((item) => ({
                        ...item,
                        name: item.name || "",
                      }))}
                      updateItem={updateItem}
                      addItem={addItem}
                      deleteItem={deleteItem}
                      month={month}
                      year={year}
                      handleMonthYearChange={handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {activeTab === "incoming" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <DailyIncomingTable
                      items={items.map((item) => ({
                        ...item,
                        name: item.name || "",
                      }))}
                      updateItem={updateItem}
                      month={month}
                      year={year}
                      handleMonthYearChange={handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {activeTab === "stock" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <StockStatusTable
                      items={items.map((item) => ({
                        ...item,
                        name: item.name || "",
                      }))}
                      updateItem={updateItem}
                      month={month}
                      year={year}
                      handleMonthYearChange={handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {activeTab === "shortages" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <PharmacyShortages
                      items={items}
                      monthlyConsumption={monthlyConsumption}
                      month={month}
                      year={year}
                      handleMonthYearChange={handleMonthYearChange}
                    />
                  </div>
                </>
              )}
              {activeTab === "report" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <ConsumptionReport
                      items={items}
                      monthlyConsumption={monthlyConsumption}
                      month={month}
                      year={year}
                      handleMonthYearChange={handleMonthYearChange}
                      itemsByMonth={itemsByMonth}
                    />
                  </div>
                </>
              )}
              {activeTab === "custom" && (
                <>
                  <GlobalMonthYearSelector
                    month={month}
                    year={year}
                    onMonthYearChange={handleMonthYearChange}
                  />
                  <div className="overflow-x-auto">
                    <CustomPageManager
                      itemsByMonth={itemsByMonth}
                      setItemsByMonth={() => {}} // No direct setter exposed here
                      monthKey={`${year}-${String(month + 1).padStart(2, "0")}`} // This will need to be managed by the parent
                      month={month}
                      year={year}
                      setMonth={() => {}} // No direct setter exposed here
                      setYear={() => {}} // No direct setter exposed here
                    />
                  </div>
                </>
              )}
              {activeTab === "attendance" && userData.role === "senior" && (
                <div className="overflow-x-auto">
                  <AttendancePage />
                </div>
              )}
              {activeTab === "profile" && (
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
                          {userData.name || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">الدور:</span>
                        <span className="text-white font-bold">
                          {userData.role === "senior" ? "صيدلي خبير" : "صيدلي"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">
                          اسم المستخدم:
                        </span>
                        <span className="text-white font-bold">
                          {userData.username || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">
                          الصيدلية:
                        </span>
                        <span className="text-white font-bold">
                          {pharmacyName || userData.assignedPharmacy || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <span className="text-gray-300 font-bold">
                          كلمة المرور:
                        </span>
                        <span className="text-white font-bold">
                          {userData.password || "-"}
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
