import React, { useState, useEffect } from "react";
import DailyDispenseTable from "./DailyDispenseTable";
import DailyIncomingTable from "./DailyIncomingTable";
import StockStatusTable from "./StockStatusTable";
import DataTransferButton from "./DataTransferButton";
import ConsumptionReport from "./ConsumptionReport";
import ConsumptionChart from "./ConsumptionChart";
import CustomPageManager from "./CustomPageManager";
import PharmacyShortages from "./PharmacyShortages";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import {
  saveMonthlyStock,
  loadAllMonthlyStock,
} from "../utils/firestoreService";

const getMonthKey = (year, month) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

const TABS = [
  { key: "dashboard", label: "الرئيسية", color: "cyan" },
  { key: "dispense", label: "المنصرف اليومي", color: "blue" },
  { key: "incoming", label: "الوارد اليومي", color: "green" },
  { key: "stock", label: "المخزون الحالي", color: "yellow" },
  { key: "shortages", label: "نواقص الصيدليه", color: "red" },
  { key: "transfer", label: "ترحيل البيانات", color: "orange" },
  { key: "report", label: "تقرير الاستهلاك", color: "purple" },
  { key: "chart", label: "رسم بياني للاستهلاك", color: "indigo" },
  { key: "custom", label: "صفحات مخصصة", color: "pink" },
];

const CARD_GRADIENTS = {
  dispense: "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600",
  incoming: "bg-gradient-to-br from-green-500 via-green-400 to-green-600",
  stock: "bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500",
  shortages: "bg-gradient-to-br from-red-500 via-red-400 to-red-600",
  transfer: "bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600",
  report: "bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700",
  chart: "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700",
  custom: "bg-gradient-to-br from-pink-500 via-pink-400 to-pink-600",
};

const getTabDescription = (tabKey) => {
  const descriptions = {
    dispense: "تتبع المنصرف اليومي",
    incoming: "تتبع الوارد اليومي",
    stock: "عرض المخزون الحالي",
    shortages: "مراقبة النواقص والاحتياجات",
    transfer: "ترحيل البيانات بين الشهور",
    report: "تقرير الاستهلاك الشهري",
    chart: "رسم بياني للاستهلاك",
    custom: "إنشاء صفحات مخصصة",
  };
  return descriptions[tabKey] || "";
};

const DashboardGrid = ({ tabs, setActiveTab }) => (
  <div className="flex flex-1 items-center justify-center min-h-screen font-[Cairo]">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
      {tabs
        .filter((tab) => tab.key !== "dashboard")
        .map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-center justify-center px-6 py-8 rounded-2xl shadow-xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 text-white min-h-[180px] ${
              CARD_GRADIENTS[tab.key] || "bg-gray-700"
            }`}
            style={{
              fontFamily: "Cairo, Tajawal, Noto Sans Arabic, sans-serif",
            }}
          >
            <span className="mb-4 text-3xl">🔹</span>
            <span className="text-xl sm:text-2xl font-extrabold mb-2 tracking-wide leading-tight text-white drop-shadow-lg text-center break-words">
              {tab.label}
            </span>
            <span className="text-sm sm:text-base font-normal text-white/90 text-center tracking-wide opacity-80">
              {getTabDescription(tab.key)}
            </span>
          </motion.button>
        ))}
    </div>
  </div>
);

const MonthYearModal = ({ open, onClose, month, setMonth, year, setYear }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-right border-t-4 border-blue-400 font-[Cairo]"
        dir="rtl"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-2xl font-extrabold text-blue-700 tracking-wide leading-relaxed">
            تحديد الشهر والسنة
          </h3>
        </div>
        <div className="mb-6 flex flex-col gap-4">
          <label className="font-semibold text-gray-800">الشهر</label>
          <select
            className="border-2 border-gray-300 px-3 py-2 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{`شهر ${i + 1}`}</option>
            ))}
          </select>
          <label className="font-semibold mt-2 text-gray-800">السنة</label>
          <select
            className="border-2 border-gray-300 px-3 py-2 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={2022 + i}>
                {2022 + i}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 justify-end mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 transition-all duration-200 flex items-center gap-2"
          >
            <span>❌</span>
            <span>إلغاء</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-bold transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <span>✅</span>
            <span>تأكيد</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const InventoryTabs = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const [itemsByMonth, setItemsByMonth] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? saved === "true" : false;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all months' data on mount
  useEffect(() => {
    setLoading(true);
    loadAllMonthlyStock()
      .then((byMonth) => {
        setItemsByMonth(byMonth);
        setLoading(false);
      })
      .catch((err) => {
        setError("فشل تحميل البيانات من الخادم");
        setLoading(false);
        console.error(err);
      });
  }, []);

  // Save to Firestore when itemsByMonth changes
  useEffect(() => {
    if (Object.keys(itemsByMonth).length === 0) return;
    const handler = setTimeout(() => {
      Object.entries(itemsByMonth).forEach(([monthKey, items]) => {
        saveMonthlyStock(monthKey, items).catch((err) => {
          setError("فشل حفظ البيانات على الخادم");
          console.error(err);
        });
      });
    }, 1000);
    return () => clearTimeout(handler);
  }, [itemsByMonth]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const currentMonthKey = getMonthKey(year, month);
  const items = itemsByMonth[currentMonthKey] || [];

  // Calculate monthly consumption for shortages tracking
  const calculateMonthlyConsumption = () => {
    const consumption = {};
    const allMonthKeys = Object.keys(itemsByMonth);

    allMonthKeys.forEach((monthKey) => {
      const monthItems = itemsByMonth[monthKey] || [];
      monthItems.forEach((item) => {
        if (!consumption[item.name]) {
          consumption[item.name] = [];
        }

        const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
          (sum, value) => sum + (value || 0),
          0
        );

        if (totalDispensed > 0) {
          consumption[item.name].push(totalDispensed);
        }
      });
    });

    // Calculate average monthly consumption for each item
    const averages = {};
    Object.entries(consumption).forEach(([itemName, values]) => {
      if (values.length > 0) {
        averages[itemName] = Math.round(
          values.reduce((sum, val) => sum + val, 0) / values.length
        );
      }
    });

    return averages;
  };

  const monthlyConsumption = calculateMonthlyConsumption();

  // Ensure month key exists
  React.useEffect(() => {
    if (!itemsByMonth[currentMonthKey]) {
      setItemsByMonth((prev) => ({ ...prev, [currentMonthKey]: [] }));
    }
    // eslint-disable-next-line
  }, [currentMonthKey]);

  const updateItem = (index, updatedFields) => {
    setItemsByMonth((prev) => {
      const updated = [...(prev[currentMonthKey] || [])];
      updated[index] = { ...updated[index], ...updatedFields };
      return { ...prev, [currentMonthKey]: updated };
    });
  };

  const deleteItem = (index) => {
    setItemsByMonth((prev) => {
      const updated = [...(prev[currentMonthKey] || [])];
      updated.splice(index, 1);
      return { ...prev, [currentMonthKey]: updated };
    });
  };

  const addItem = () => {
    setItemsByMonth((prev) => ({
      ...prev,
      [currentMonthKey]: [
        ...(prev[currentMonthKey] || []),
        {
          name: "",
          opening: 0,
          unitPrice: 0,
          dailyDispense: {},
          dailyIncoming: {},
          incomingSource: {},
          selected: false,
        },
      ],
    }));
  };

  if (loading)
    return (
      <div className="p-8 text-center text-lg">جاري تحميل البيانات...</div>
    );
  if (error)
    return <div className="p-8 text-center text-lg text-red-600">{error}</div>;

  return (
    <div dir="rtl" className="flex flex-row min-h-screen bg-gray-50 font-sans">
      <Sidebar
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileDrawer={mobileDrawer}
        setMobileDrawer={setMobileDrawer}
      />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300">
        <main className="flex-1 flex flex-col min-h-screen min-w-0 p-4 bg-gray-50">
          {activeTab === "dispense" ||
          activeTab === "incoming" ||
          activeTab === "stock" ? (
            <div className="w-full pt-8 pr-4 flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">
                  {activeTab === "dispense"
                    ? "جدول المنصرف اليومي"
                    : activeTab === "incoming"
                    ? "جدول الوارد اليومي"
                    : "المخزون الحالي"}
                </h2>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg font-bold"
                  onClick={() => setModalOpen(true)}
                >
                  <span className="text-xl">📅</span>
                  <span>تغيير الشهر/السنة</span>
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.button>
              </div>
              <MonthYearModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                month={month}
                setMonth={setMonth}
                year={year}
                setYear={setYear}
              />
              {activeTab === "dispense" || activeTab === "incoming" ? (
                <div
                  className="overflow-x-auto w-full pb-10 pt-0"
                  dir="rtl"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div style={{ minWidth: "4000px", width: "max-content" }}>
                    {activeTab === "dispense" ? (
                      <DailyDispenseTable
                        items={items}
                        updateItem={updateItem}
                        addItem={addItem}
                        deleteItem={deleteItem}
                        month={month}
                        year={year}
                      />
                    ) : (
                      <DailyIncomingTable
                        items={items}
                        updateItem={updateItem}
                        month={month}
                        year={year}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full pb-10 pt-0">
                  <StockStatusTable
                    items={items}
                    updateItem={updateItem}
                    month={month}
                    year={year}
                  />
                </div>
              )}
            </div>
          ) : activeTab === "dashboard" ? (
            <DashboardGrid tabs={TABS} setActiveTab={setActiveTab} />
          ) : (
            <div className="w-full pb-10 pt-4">
              {activeTab === "shortages" ? (
                <PharmacyShortages
                  items={items}
                  monthlyConsumption={monthlyConsumption}
                />
              ) : activeTab === "transfer" ? (
                <DataTransferButton
                  itemsByMonth={itemsByMonth}
                  setItemsByMonth={setItemsByMonth}
                  currentMonthKey={currentMonthKey}
                />
              ) : activeTab === "report" ? (
                <ConsumptionReport allMonthsItems={itemsByMonth} />
              ) : activeTab === "chart" ? (
                <ConsumptionChart allMonthsItems={itemsByMonth} />
              ) : activeTab === "custom" ? (
                <CustomPageManager
                  itemsByMonth={itemsByMonth}
                  setItemsByMonth={setItemsByMonth}
                  monthKey={currentMonthKey}
                />
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InventoryTabs;
