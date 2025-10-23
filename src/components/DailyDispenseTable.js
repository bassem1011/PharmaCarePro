// src/components/DailyDispenseTable.jsx
import React, { useState, useEffect, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../App";
import { Calendar } from "lucide-react";
import MonthYearModal from "./ui/MonthYearModal";
import { getPharmacySettings } from "../utils/firestoreService";

const ConfirmDeleteModal = ({ onConfirm, onCancel }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-4 border-red-400 dark:border-red-600 font-[Cairo]"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center mb-6">
          <motion.div
            className="text-4xl mb-4"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ⚠️
          </motion.div>
          <h3 className="text-2xl font-extrabold text-red-700 dark:text-red-400 mb-2 tracking-wide leading-relaxed">
            تأكيد الحذف
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
            هل أنت متأكد أنك تريد حذف هذا الصنف؟ سيتم حذف البيانات الخاصة به فقط
            في هذا الشهر.
          </p>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-2"
          >
            <span>❌</span>
            <span>إلغاء</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <span>🗑️</span>
            <span>نعم، احذف</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const DailyDispenseTable = ({
  items,
  updateItem,
  addItem,
  deleteItem,
  month,
  year,
  handleMonthYearChange,
  pharmacyId,
}) => {
  const toast = useToast();
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [pharmacySettings, setPharmacySettings] = useState(null);
  const confirmDelete = (index) => setDeleteIndex(index);
  const cancelDelete = () => setDeleteIndex(null);
  const handleConfirmDelete = () => {
    deleteItem(deleteIndex);
    setDeleteIndex(null);
    toast("تم حذف الصنف بنجاح!", "success");
  };
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
  const handleValueChange = (index, day, value, category = "patient") => {
    if (!items || !items[index]) return;
    const item = items[index];

    // Create new dispense structure based on settings
    let updatedDispense = { ...item.dailyDispense };

    if (pharmacySettings?.enableDispenseCategories) {
      // Store separate values for patient and scissors
      if (!updatedDispense[day]) {
        updatedDispense[day] = { patient: 0, scissors: 0 };
      }
      updatedDispense[day][category] = Number(value);
    } else {
      // Keep simple structure for backward compatibility
      updatedDispense[day] = Number(value);
    }

    updateItem(index, { dailyDispense: updatedDispense });
    toast("تم تحديث المنصرف اليومي!", "success");
  };

  const getTotal = (item) => {
    if (!item || !item.dailyDispense) return 0;
    const total = Object.values(item.dailyDispense).reduce((sum, val) => {
      if (typeof val === "object" && val.patient !== undefined) {
        // New structure: { patient: 5, scissors: 3 }
        const patientNum = Number(val.patient);
        const scissorsNum = Number(val.scissors);
        return (
          sum +
          (isNaN(patientNum) ? 0 : patientNum) +
          (isNaN(scissorsNum) ? 0 : scissorsNum)
        );
      } else if (typeof val === "object" && val.quantity !== undefined) {
        // Old structure: { quantity: 5, category: "patient" }
        const num = Number(val.quantity);
        return sum + (isNaN(num) ? 0 : num);
      } else {
        // Simple structure: 5
        const num = Number(val);
        return sum + (isNaN(num) ? 0 : num);
      }
    }, 0);
    const result = isNaN(total) ? 0 : Math.floor(Number(total));
    return result;
  };

  const getTotalIncoming = (item) => {
    if (!item || !item.dailyIncoming) return 0;
    const total = Object.values(item.dailyIncoming).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    return Math.floor(Number(total));
  };

  // New calculation functions for the additional columns
  const getTotalOpeningAndIncoming = (item) => {
    if (!item) return 0;
    const opening = Math.floor(Number(item.opening) || 0);
    const totalIncoming = getTotalIncoming(item);
    return Math.floor(Number(opening + totalIncoming));
  };

  const getRemainingStock = (item) => {
    if (!item) return 0;
    const totalOpeningAndIncoming = getTotalOpeningAndIncoming(item);
    const totalDispensed = getTotal(item);
    return Math.floor(Number(totalOpeningAndIncoming - totalDispensed));
  };

  // Load pharmacy settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!pharmacyId) {
        return;
      }

      try {
        const settings = await getPharmacySettings(pharmacyId);
        console.log(
          "Loaded pharmacy settings for pharmacy",
          pharmacyId,
          ":",
          settings
        );
        console.log(
          "enableDispenseCategories:",
          settings?.enableDispenseCategories
        );
        setPharmacySettings(settings);
      } catch (error) {
        console.error("Error loading pharmacy settings:", error);
        toast("فشل تحميل إعدادات الصيدلية", "error");
      }
    };

    loadSettings();
  }, [pharmacyId, toast]);

  // Memoized calculations to avoid repeated computations
  const memoizedCalculations = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return {
        totalItems: 0,
        totalDispensed: 0,
        totalDays: 0,
        dailyAverage: 0,
        totalOpeningAndIncoming: 0,
        remainingStock: 0,
      };
    }

    const calculations = items.reduce(
      (acc, item) => {
        const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const opening = Math.floor(Number(item.opening || 0));
        const totalOpeningAndIncoming = opening + totalIncoming;
        const remainingStock = totalOpeningAndIncoming - totalDispensed;
        const daysWithData = Object.keys(item.dailyDispense || {}).length;

        return {
          totalItems: acc.totalItems + 1,
          totalDispensed: acc.totalDispensed + totalDispensed,
          totalDays: Math.max(acc.totalDays, daysWithData),
          totalOpeningAndIncoming:
            acc.totalOpeningAndIncoming + totalOpeningAndIncoming,
          remainingStock: acc.remainingStock + remainingStock,
        };
      },
      {
        totalItems: 0,
        totalDispensed: 0,
        totalDays: 0,
        totalOpeningAndIncoming: 0,
        remainingStock: 0,
      }
    );

    return {
      ...calculations,
      totalDispensed: Math.floor(calculations.totalDispensed),
      totalOpeningAndIncoming: Math.floor(calculations.totalOpeningAndIncoming),
      remainingStock: Math.floor(calculations.remainingStock),
      dailyAverage:
        calculations.totalDays > 0
          ? Math.floor(calculations.totalDispensed / calculations.totalDays)
          : 0,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📤</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">المنصرف اليومي</h2>
              <p className="text-red-100 mt-1">تسجيل الأصناف المنصرفة يومياً</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMonthYearModal(true)}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg flex items-center gap-2 border border-white/30"
            >
              <Calendar className="w-5 h-5" />
              <span>تغيير الشهر/السنة</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addItem}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">➕</span>
              <span>إضافة صنف</span>
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
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">إجمالي الأصناف</p>
              <p className="text-3xl font-bold">{items?.length || 0}</p>
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
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">إجمالي المنصرف</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalDispensed}
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
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">إجمالي الافتتاحي والوارد</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalOpeningAndIncoming}
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
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">الرصيد المتبقي</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.remainingStock}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table Container - Static width with internal scrolling */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              جدول المنصرف اليومي
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {new Date(year, month).toLocaleString("ar-EG", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                <span className="text-lg">➕</span>
                <span>إضافة صنف</span>
              </motion.button>
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
            className="overflow-x-auto border-2 border-red-300 rounded-xl bg-white shadow-lg mx-4 mb-4"
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
                minWidth: `${Math.max((days.length + 7) * 150, 1200)}px`,
                width: "max-content",
                tableLayout: "fixed",
              }}
            >
              <thead className="bg-gradient-to-r from-red-50 to-pink-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold text-red-800 border-b border-red-200 sticky right-0 bg-gradient-to-r from-red-50 to-pink-50 z-20">
                    🏷️ الصنف
                  </th>
                  <th className="p-4 font-bold text-red-800 border-b border-red-200">
                    📄 رقم الصفحة
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className="p-4 font-bold text-red-800 border-b border-red-200"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{`يوم ${d}`}</span>
                        <span className="text-xs text-red-600">📤 منصرف</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-red-800 border-b border-red-200 bg-red-100">
                    📤 إجمالي المنصرف
                  </th>
                  <th className="p-4 font-bold text-green-800 border-b border-green-200 bg-green-100">
                    📥 إجمالي الافتتاحي والوارد
                  </th>
                  <th className="p-4 font-bold text-blue-800 border-b border-blue-200 bg-blue-100">
                    💰 الرصيد المتبقي
                  </th>
                  <th className="p-4 font-bold text-gray-800 border-b border-gray-200">
                    🗑️ حذف
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items?.map((item, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-red-50 transition-colors duration-200`}
                    >
                      <td className="p-4 font-bold text-gray-800 border-b border-gray-200 sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, { name: e.target.value })
                          }
                          className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 transition-all duration-200"
                          placeholder="اسم الصنف"
                        />
                      </td>
                      <td className="p-4 border-b border-gray-200">
                        <input
                          type="number"
                          value={item.pageNumber || ""}
                          onChange={(e) => {
                            const newValue =
                              e.target.value === ""
                                ? ""
                                : Math.floor(Number(e.target.value));
                            updateItem(index, { pageNumber: newValue });
                          }}
                          className="w-20 border-2 border-gray-300 px-2 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 transition-all duration-200"
                          placeholder="رقم"
                          min="1"
                          step="1"
                        />
                      </td>
                      {days.map((day) => {
                        const dayData = item.dailyDispense?.[day];

                        // Handle different data structures
                        let patientValue = 0;
                        let scissorsValue = 0;

                        if (pharmacySettings?.enableDispenseCategories) {
                          if (
                            typeof dayData === "object" &&
                            dayData.patient !== undefined
                          ) {
                            // New structure: { patient: 5, scissors: 3 }
                            patientValue = Number(dayData.patient) || 0;
                            scissorsValue = Number(dayData.scissors) || 0;
                          } else if (
                            typeof dayData === "object" &&
                            dayData.quantity !== undefined
                          ) {
                            // Old structure: { quantity: 5, category: "patient" }
                            if (dayData.category === "patient") {
                              patientValue = Number(dayData.quantity) || 0;
                            } else {
                              scissorsValue = Number(dayData.quantity) || 0;
                            }
                          } else {
                            // Simple number, default to patient
                            patientValue = Number(dayData) || 0;
                          }
                        } else {
                          // Simple structure for backward compatibility
                          patientValue = Number(dayData) || 0;
                        }

                        return (
                          <td
                            key={day}
                            className="p-4 border-b border-gray-200"
                          >
                            {pharmacySettings?.enableDispenseCategories ? (
                              <div className="space-y-2">
                                {/* Patient Dispense Input */}
                                <div className="flex flex-col items-center">
                                  <label className="text-xs text-gray-600 mb-1">
                                    {pharmacySettings?.dispenseCategories
                                      ?.patient || "مريض"}
                                  </label>
                                  <input
                                    type="number"
                                    value={patientValue || ""}
                                    onChange={(e) => {
                                      const newValue =
                                        e.target.value === ""
                                          ? 0
                                          : Math.floor(Number(e.target.value));
                                      handleValueChange(
                                        index,
                                        day,
                                        newValue,
                                        "patient"
                                      );
                                    }}
                                    className="w-16 h-8 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-blue-50"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                  />
                                </div>

                                {/* Scissors Dispense Input */}
                                <div className="flex flex-col items-center">
                                  <label className="text-xs text-gray-600 mb-1">
                                    {pharmacySettings?.dispenseCategories
                                      ?.scissors || "مقص"}
                                  </label>
                                  <input
                                    type="number"
                                    value={scissorsValue || ""}
                                    onChange={(e) => {
                                      const newValue =
                                        e.target.value === ""
                                          ? 0
                                          : Math.floor(Number(e.target.value));
                                      handleValueChange(
                                        index,
                                        day,
                                        newValue,
                                        "scissors"
                                      );
                                    }}
                                    className="w-16 h-8 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-green-50"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                  />
                                </div>
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={patientValue || ""}
                                onChange={(e) => {
                                  const newValue =
                                    e.target.value === ""
                                      ? 0
                                      : Math.floor(Number(e.target.value));
                                  handleValueChange(index, day, newValue);
                                }}
                                className="w-16 h-8 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-red-50"
                                placeholder="0"
                                min="0"
                                step="1"
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="p-4 border-b border-gray-200 font-bold text-gray-800">
                        {getTotal(item)}
                      </td>
                      <td className="p-4 border-b border-gray-200 font-bold text-gray-800">
                        {getTotalOpeningAndIncoming(item)}
                      </td>
                      <td className="p-4 border-b border-gray-200 font-bold text-blue-600">
                        {getRemainingStock(item)}
                      </td>
                      <td className="p-4 border-b border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => confirmDelete(index)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          🗑️
                        </motion.button>
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
                        colSpan={days.length + 6}
                        className="p-8 text-center text-gray-500 text-lg"
                      >
                        لا توجد أصناف مضافة بعد. اضغط على "إضافة صنف" لبدء
                        التسجيل.
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

      {/* Delete Confirmation Modal */}
      {deleteIndex !== null && (
        <ConfirmDeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};

export default DailyDispenseTable;
