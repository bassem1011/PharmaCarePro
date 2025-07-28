// ✅ src/components/DailyIncomingTable.jsx (updated with weekly totals and incoming source)
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../App";
import { Calendar } from "lucide-react";
import MonthYearModal from "./ui/MonthYearModal";

const DailyIncomingTable = ({
  items,
  updateItem,
  month,
  year,
  handleMonthYearChange,
}) => {
  const toast = useToast();
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);

  // Memoized calculations to avoid repeated computations
  const memoizedCalculations = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return {
        totalItems: 0,
        totalIncoming: 0,
        totalDays: 0,
        dailyAverage: 0,
      };
    }

    const calculations = items.reduce(
      (acc, item) => {
        const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const daysWithData = Object.keys(item.dailyIncoming || {}).length;

        return {
          totalItems: acc.totalItems + 1,
          totalIncoming: acc.totalIncoming + totalIncoming,
          totalDays: Math.max(acc.totalDays, daysWithData),
        };
      },
      { totalItems: 0, totalIncoming: 0, totalDays: 0 }
    );

    return {
      ...calculations,
      totalIncoming: Math.floor(calculations.totalIncoming),
      dailyAverage:
        calculations.totalDays > 0
          ? Math.floor(calculations.totalIncoming / calculations.totalDays)
          : 0,
    };
  }, [items]);

  const getDaysInMonth = (m, y) => {
    const date = new Date(y, m, 1);
    const days = [];
    while (date.getMonth() === m) {
      days.push(date.getDate());
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth(month, year);

  const handleIncomingChange = (index, day, value, source = "") => {
    if (!items || !items[index]) return;
    const item = items[index];
    const updatedIncoming = { ...item.dailyIncoming, [day]: Number(value) };
    const updatedSource = { ...item.incomingSource, [day]: source };
    updateItem(index, {
      dailyIncoming: updatedIncoming,
      incomingSource: updatedSource,
    });
    toast("تم تحديث الوارد اليومي!", "success");
  };

  const getTotal = (item) => {
    if (!item || !item.dailyIncoming) return 0;
    const total = Object.values(item.dailyIncoming).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    return Math.floor(Number(total));
  };

  const getAverage = (item) => {
    if (!item || !item.dailyIncoming) return 0;
    const total = getTotal(item);
    const daysCount = Object.keys(item.dailyIncoming || {}).length;
    return daysCount > 0 ? Math.floor(total / daysCount) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📥</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">الوارد اليومي</h2>
              <p className="text-green-100 mt-1">
                تسجيل الأصناف الواردة يومياً مع مصادرها
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowMonthYearModal(true);
              }}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg flex items-center gap-2 border border-white/30"
            >
              <Calendar className="w-5 h-5" />
              <span>تغيير الشهر/السنة</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Separated from table */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">إجمالي الأصناف</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalItems}
              </p>
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
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">إجمالي الوارد</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalIncoming}
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
          className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm">عدد الأيام</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalDays}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">متوسط يومي</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.dailyAverage}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table Container - Static width with internal scrolling */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              جدول الوارد اليومي
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {new Date(year, month).toLocaleString("ar-EG", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Static width container with internal scroll */}
        <div
          className="w-full"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 px-4">
            <span>↔️ اسحب للجانب لرؤية جميع الأعمدة</span>
          </div>
          <div
            className="overflow-x-auto border-2 border-green-300 rounded-xl bg-white shadow-lg mx-4 mb-4"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "#888 #f1f1f1",
              height: "500px",
              overflowX: "auto",
              overflowY: "auto",
            }}
          >
            <table
              className="w-full text-right font-[Cairo]"
              style={{
                minWidth: `${Math.max((days.length + 3) * 150, 1200)}px`,
                width: "max-content",
                tableLayout: "fixed",
              }}
            >
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold text-green-800 border-b border-green-200 sticky right-0 bg-gradient-to-r from-green-50 to-emerald-50 z-20">
                    🏷️ الصنف
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className="p-4 font-bold text-green-800 border-b border-green-200"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{`يوم ${d}`}</span>
                        <span className="text-xs text-green-600">
                          📥 + مصدر
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-green-800 border-b border-green-200 bg-green-100">
                    📥 إجمالي الوارد
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items?.map((item, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-green-50 transition-colors duration-200`}
                    >
                      <td className="p-4 font-bold text-gray-800 border-b border-gray-200 sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(idx, { name: e.target.value })
                          }
                          className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500 transition-all duration-200"
                          placeholder="اسم الصنف"
                        />
                      </td>
                      {days.map((day) => (
                        <td key={day} className="p-4 border-b border-gray-200">
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={item.dailyIncoming?.[day] || ""}
                              onChange={(e) => {
                                const newValue =
                                  e.target.value === ""
                                    ? 0
                                    : Math.floor(Number(e.target.value));
                                handleIncomingChange(idx, day, newValue);
                              }}
                              className="w-16 h-8 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-green-50"
                              placeholder="0"
                              min="0"
                              step="1"
                            />
                            <select
                              value={item.incomingSource?.[day] || ""}
                              onChange={(e) =>
                                handleIncomingChange(
                                  idx,
                                  day,
                                  item.dailyIncoming?.[day] || 0,
                                  e.target.value
                                )
                              }
                              className="w-full border-2 border-gray-300 px-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500 transition-all duration-200"
                            >
                              <option value="">اختر المصدر</option>
                              <option value="مصنع">مصنع</option>
                              <option value="شركه">شركه</option>
                              <option value="مقصه">مقصه</option>
                            </select>
                          </div>
                        </td>
                      ))}
                      <td className="p-4 border-b border-gray-200 font-bold text-gray-800">
                        {getTotal(item)}
                      </td>
                    </motion.tr>
                  ))}
                  {(!items || items.length === 0) && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50"
                    >
                      <td
                        colSpan={days.length + 2}
                        className="p-8 text-center text-gray-500 text-lg"
                      >
                        لا توجد أصناف مضافة بعد. اضغط على "إضافة صنف" في المنصرف
                        اليومي لبدء التسجيل.
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Month/Year Modal */}
      <MonthYearModal
        open={showMonthYearModal}
        onClose={() => setShowMonthYearModal(false)}
        month={month}
        setMonth={handleMonthYearChange}
        year={year}
        setYear={handleMonthYearChange}
        handleMonthYearChange={handleMonthYearChange}
      />
    </div>
  );
};

export default DailyIncomingTable;
