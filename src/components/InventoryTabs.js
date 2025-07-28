import React, { useState, useEffect } from "react";
import DailyDispenseTable from "./DailyDispenseTable";
import DailyIncomingTable from "./DailyIncomingTable";
import StockStatusTable from "./StockStatusTable";
import ConsumptionReport from "./ConsumptionReport";
import CustomPageManager from "./CustomPageManager";
import PharmacyShortages from "./PharmacyShortages";
import { motion } from "framer-motion";
import {
  subscribeToMonthlyStock,
  saveWithRetry,
} from "../utils/firestoreService";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";

const getMonthKey = (year, month) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

const TABS = [
  { key: "dashboard", label: "الرئيسية", color: "cyan" },
  { key: "dispense", label: "المنصرف اليومي", color: "blue" },
  { key: "incoming", label: "الوارد اليومي", color: "green" },
  { key: "stock", label: "المخزون الحالي", color: "yellow" },
  { key: "shortages", label: "نواقص الصيدليه", color: "red" },
  { key: "report", label: "تقرير الاستهلاك", color: "purple" },
  { key: "custom", label: "صفحات مخصصة", color: "pink" },
];

const CARD_GRADIENTS = {
  dispense: "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600",
  incoming: "bg-gradient-to-br from-green-500 via-green-400 to-green-600",
  stock: "bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500",
  shortages: "bg-gradient-to-br from-red-500 via-red-400 to-red-600",
  report: "bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700",
  custom: "bg-gradient-to-br from-pink-500 via-pink-400 to-pink-600",
};

const getTabDescription = (tabKey) => {
  const descriptions = {
    dispense: "تتبع المنصرف اليومي",
    incoming: "تتبع الوارد اليومي",
    stock: "عرض المخزون الحالي",
    shortages: "مراقبة النواقص والاحتياجات",
    report: "تقرير الاستهلاك الشهري",
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

// Shared inventory data hook
export function useInventoryData() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [itemsByMonth, setItemsByMonth] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [monthlyConsumption, setMonthlyConsumption] = useState({});

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMonthlyStock((byMonth) => {
      setItemsByMonth(byMonth);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (Object.keys(itemsByMonth).length === 0) return;

    // Save immediately when items are added/modified
    const saveData = async () => {
      try {
        const savePromises = Object.entries(itemsByMonth).map(
          ([monthKey, items]) => {
            if (items && items.length > 0) {
              // Don't filter out items - let them persist even if empty
              // The validation will handle this in saveWithRetry
              return saveWithRetry(monthKey, items);
            }
            return Promise.resolve();
          }
        );

        await Promise.all(savePromises);
        // Data saved successfully to Firebase
      } catch (err) {
        setError("فشل حفظ البيانات على الخادم");
        console.error("Save error:", err);
      }
    };

    // Save immediately for new items, debounce for updates
    const handler = setTimeout(saveData, 500);
    return () => clearTimeout(handler);
  }, [itemsByMonth]);

  const currentMonthKey = getMonthKey(year, month);
  const items = itemsByMonth[currentMonthKey] || [];

  // Calculate monthly consumption for shortages tracking
  const calculateMonthlyConsumption = () => {
    const getTotalDispensedFromDaily = (item) => {
      if (!item || !item.dailyDispense) return 0;
      const total = Object.values(item.dailyDispense).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
      );
      return Math.floor(Number(total));
    };

    const consumption = {};
    const monthKeys = Object.keys(itemsByMonth).sort();

    monthKeys.forEach((monthKey) => {
      const items = itemsByMonth[monthKey] || [];

      items.forEach((item) => {
        if (!item.name) return;

        if (!consumption[item.name]) {
          consumption[item.name] = {
            name: item.name,
            months: {},
            total: 0,
            average: 0,
          };
        }

        const totalDispensed = getTotalDispensedFromDaily(item);
        consumption[item.name].months[monthKey] = totalDispensed;
        consumption[item.name].total += totalDispensed;
      });
    });

    // Calculate averages
    Object.values(consumption).forEach((item) => {
      const monthCount = Object.keys(item.months).length;
      if (monthCount > 0) {
        const total = item.total;
        const average = total / monthCount;

        // Enhanced average calculation
        if (average > 0) {
          item.average = Math.floor(average);
        } else if (total > 0) {
          item.average = Math.floor(total);
        } else {
          item.average = 10; // Default fallback
        }
      } else {
        item.average = 10; // Default fallback
      }
    });

    setMonthlyConsumption(consumption);
  };

  // Use useEffect to calculate monthly consumption when itemsByMonth changes
  useEffect(() => {
    calculateMonthlyConsumption();
  }, [itemsByMonth]);

  // Helper function to calculate remaining stock for an item
  const calculateRemainingStock = (item) => {
    if (!item) return 0;

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

    return Math.floor(opening + totalIncoming - totalDispensed);
  };

  // Function to carry over remaining stock to next month
  const carryOverStockToNextMonth = (currentMonthKey, nextMonthKey) => {
    const currentItems = itemsByMonth[currentMonthKey] || [];
    const nextMonthItems = itemsByMonth[nextMonthKey] || [];

    // Create a map of existing items in next month by name
    const nextMonthItemsMap = {};
    nextMonthItems.forEach((item, index) => {
      if (item.name) {
        nextMonthItemsMap[item.name] = { item, index };
      }
    });

    // Calculate remaining stock for each current month item
    const updatedNextMonthItems = [...nextMonthItems];

    currentItems.forEach((currentItem) => {
      if (!currentItem.name) return;

      const remainingStock = calculateRemainingStock(currentItem);

      if (nextMonthItemsMap[currentItem.name]) {
        // Item exists in next month, update its opening stock
        const { index } = nextMonthItemsMap[currentItem.name];
        updatedNextMonthItems[index] = {
          ...updatedNextMonthItems[index],
          opening: remainingStock,
        };
      } else {
        // Item doesn't exist in next month, create it with remaining stock as opening
        const newItem = {
          name: currentItem.name,
          opening: remainingStock,
          unitPrice: currentItem.unitPrice || 0,
          dailyDispense: {},
          dailyIncoming: {},
          incomingSource: {},
          selected: false,
        };
        updatedNextMonthItems.push(newItem);
      }
    });

    // Update the next month's items
    setItemsByMonth((prev) => ({
      ...prev,
      [nextMonthKey]: updatedNextMonthItems,
    }));
  };

  // Enhanced month/year change with automatic carryover
  const handleMonthYearChange = (newMonth, newYear) => {
    const newMonthKey = getMonthKey(newYear, newMonth);
    const currentMonthKey = getMonthKey(year, month);

    // Only carry over if moving to a future month
    if (newMonthKey > currentMonthKey) {
      carryOverStockToNextMonth(currentMonthKey, newMonthKey);
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  // Ensure month key exists
  useEffect(() => {
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
    const newItem = {
      name: "",
      opening: 0,
      unitPrice: 0,
      dailyDispense: {},
      dailyIncoming: {},
      incomingSource: {},
      selected: false,
    };

    setItemsByMonth((prev) => {
      const updated = {
        ...prev,
        [currentMonthKey]: [...(prev[currentMonthKey] || []), newItem],
      };

      // Save immediately when adding new item
      setTimeout(() => {
        saveWithRetry(currentMonthKey, updated[currentMonthKey]).catch(
          (err) => {
            setError("فشل حفظ الصنف الجديد");
            console.error("Add item save error:", err);
          }
        );
      }, 100);

      return updated;
    });
  };

  return {
    month,
    setMonth,
    year,
    setYear,
    itemsByMonth,
    setItemsByMonth,
    currentMonthKey,
    items,
    updateItem,
    deleteItem,
    addItem,
    handleMonthYearChange,
    loading,
    error,
    modalOpen,
    setModalOpen,
    monthlyConsumption,
  };
}

export default function InventoryTabs() {
  const { month, setMonth, year, setYear, modalOpen, setModalOpen, items } =
    useInventoryData();
  // Mini data summaries
  const dispensedCount = items.filter(
    (i) => Object.keys(i.dailyDispense || {}).length > 0
  ).length;
  const incomingCount = items.filter(
    (i) => Object.keys(i.dailyIncoming || {}).length > 0
  ).length;
  const stockCount = items.length;
  const shortagesCount = items.filter(
    (i) =>
      i.opening +
        Object.values(i.dailyIncoming || {}).reduce((a, b) => a + (b || 0), 0) -
        Object.values(i.dailyDispense || {}).reduce(
          (a, b) => a + (b || 0),
          0
        ) <=
      0
  ).length;
  return (
    <div className="bg-gray-900 min-h-screen p-6 rounded-2xl shadow-2xl">
      <div className="flex justify-end mb-6">
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-700 transition-all duration-200"
          onClick={() => setModalOpen(true)}
        >
          تغيير الشهر/السنة
        </button>
        <MonthYearModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
        />
      </div>
      {/* Main dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">المنصرف اليومى</div>
          <div className="text-lg">عدد الأصناف: {dispensedCount}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">الوارد اليومى</div>
          <div className="text-lg">عدد الأصناف: {incomingCount}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg p-6 text-gray-900 flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">المخزون الحالي</div>
          <div className="text-lg">عدد الأصناف: {stockCount}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">نواقص الصيدلية</div>
          <div className="text-lg">عدد النواقص: {shortagesCount}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">تقرير الاستهلاك</div>
          <div className="text-lg">عدد الأصناف: {stockCount}</div>
        </div>
      </div>
      <DailyDispenseSection />
      <DailyIncomingSection />
      <StockStatusSection />
      <PharmacyShortagesSection />
      <ConsumptionReportSection />
      <CustomPagesSection />
    </div>
  );
}

export function DailyDispenseSection(props) {
  const {
    month,
    year,
    items,
    updateItem,
    addItem,
    deleteItem,
    loading,
    error,
    modalOpen,
    setModalOpen,
    handleMonthYearChange,
  } = useInventoryData();
  if (loading)
    return (
      <div className="p-8 flex flex-col items-center justify-center text-lg text-white">
        <Spinner size={56} className="mb-4" />
        <Skeleton width={200} height={24} className="mb-2" />
        <Skeleton width={300} height={18} />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-lg text-red-400 font-bold">
        {error}
      </div>
    );
  return (
    <div className="bg-gray-900 min-h-screen p-6 rounded-2xl shadow-2xl">
      <DailyDispenseTable
        items={items}
        updateItem={updateItem}
        addItem={addItem}
        deleteItem={deleteItem}
        month={month}
        year={year}
        handleMonthYearChange={handleMonthYearChange}
      />
    </div>
  );
}

export function DailyIncomingSection(props) {
  const {
    month,
    year,
    items,
    updateItem,
    loading,
    error,
    handleMonthYearChange,
  } = useInventoryData();
  if (loading)
    return (
      <div className="p-8 flex flex-col items-center justify-center text-lg text-white">
        <Spinner size={56} className="mb-4" />
        <Skeleton width={200} height={24} className="mb-2" />
        <Skeleton width={300} height={18} />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-lg text-red-400 font-bold">
        {error}
      </div>
    );
  return (
    <div className="bg-gray-900 min-h-screen p-6 rounded-2xl shadow-2xl">
      <DailyIncomingTable
        items={items}
        updateItem={updateItem}
        month={month}
        year={year}
        handleMonthYearChange={handleMonthYearChange}
      />
    </div>
  );
}

export function StockStatusSection(props) {
  const {
    items,
    updateItem,
    month,
    year,
    handleMonthYearChange,
    loading,
    error,
  } = useInventoryData();

  if (loading)
    return (
      <div className="p-8 flex flex-col items-center justify-center text-lg text-white">
        <Spinner size={56} className="mb-4" />
        <Skeleton width={200} height={24} className="mb-2" />
        <Skeleton width={300} height={18} />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-lg text-red-400 font-bold">
        {error}
      </div>
    );
  return (
    <div className="bg-gray-900 min-h-screen p-6 rounded-2xl shadow-2xl">
      <StockStatusTable
        items={items}
        updateItem={updateItem}
        month={month}
        year={year}
        handleMonthYearChange={handleMonthYearChange}
      />
    </div>
  );
}

export function PharmacyShortagesSection(props) {
  const { items, monthlyConsumption, loading, error } = useInventoryData();

  if (loading)
    return (
      <div className="p-8 flex flex-col items-center justify-center text-lg text-white">
        <Spinner size={56} className="mb-4" />
        <Skeleton width={200} height={24} className="mb-2" />
        <Skeleton width={300} height={18} />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-lg text-red-400 font-bold">
        {error}
      </div>
    );
  return (
    <div className="bg-gray-900 min-h-screen p-6 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-black text-fuchsia-400 mb-6">
        نواقص الصيدلية
      </h2>
      <PharmacyShortages
        items={items}
        monthlyConsumption={monthlyConsumption}
      />
    </div>
  );
}

export function ConsumptionReportSection(props) {
  const { items, monthlyConsumption, month, year, handleMonthYearChange } =
    useInventoryData();
  return (
    <div className="space-y-6">
      <ConsumptionReport
        items={items}
        monthlyConsumption={monthlyConsumption}
        month={month}
        year={year}
        handleMonthYearChange={handleMonthYearChange}
      />
    </div>
  );
}

export function CustomPagesSection(props) {
  const {
    itemsByMonth,
    setItemsByMonth,
    month,
    year,
    setMonth,
    setYear,
    handleMonthYearChange,
  } = useInventoryData();
  const monthKey = getMonthKey(year, month);
  return (
    <div className="space-y-6">
      <CustomPageManager
        itemsByMonth={itemsByMonth}
        setItemsByMonth={setItemsByMonth}
        monthKey={monthKey}
        month={month}
        year={year}
        setMonth={setMonth}
        setYear={setYear}
        handleMonthYearChange={handleMonthYearChange}
      />
    </div>
  );
}
