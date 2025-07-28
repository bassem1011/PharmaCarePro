import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MonthYearModal = ({
  open,
  onClose,
  month,
  setMonth,
  year,
  setYear,
  handleMonthYearChange,
}) => {
  const [localMonth, setLocalMonth] = useState(month);
  const [localYear, setLocalYear] = useState(year);
  const [error, setError] = useState("");

  // Update local state when props change
  useEffect(() => {
    setLocalMonth(month);
    setLocalYear(year);
  }, [month, year]);

  const handleSave = () => {
    if (handleMonthYearChange && typeof handleMonthYearChange === "function") {
      handleMonthYearChange(localMonth, localYear);
    } else {
      setMonth(localMonth);
      setYear(localYear);
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalMonth(month);
    setLocalYear(year);
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
        onClick={handleCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-4 border-fuchsia-400 dark:border-fuchsia-600"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">
              تغيير الشهر والسنة
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              اختر الشهر والسنة لعرض البيانات
            </p>
          </div>

          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                الشهر
              </label>
              <select
                value={localMonth}
                onChange={(e) => setLocalMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 transition-all duration-200"
              >
                {[
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
                ].map((monthName, index) => (
                  <option key={index} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                السنة
              </label>
              <select
                value={localYear}
                onChange={(e) => setLocalYear(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500 transition-all duration-200"
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
          </div>

          <div className="flex gap-3 mt-6">
            <motion.button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-400 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              إلغاء
            </motion.button>
            <motion.button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl font-bold hover:from-fuchsia-700 hover:to-purple-700 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              حفظ
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MonthYearModal;
