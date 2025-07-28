import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";

const PharmacyShortages = ({
  items,
  monthlyConsumption,
  month,
  year,
  handleMonthYearChange,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Helper function to get total incoming from daily data
  const getTotalIncomingFromDaily = useCallback((item) => {
    if (!item.dailyIncoming) return 0;
    return Math.floor(
      Object.values(item.dailyIncoming).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      )
    );
  }, []);

  // Helper function to get total dispensed from daily data
  const getTotalDispensedFromDaily = useCallback((item) => {
    if (!item.dailyDispense) return 0;
    return Math.floor(
      Object.values(item.dailyDispense).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      )
    );
  }, []);

  // Move getCurrentStock above useMemo
  const getCurrentStock = useCallback(
    (item) => {
      if (!item) return 0;
      const opening = Math.floor(Number(item.opening || 0));
      const totalIncoming = Math.floor(getTotalIncomingFromDaily(item));
      const totalDispensed = Math.floor(getTotalDispensedFromDaily(item));
      return Math.floor(opening + totalIncoming - totalDispensed);
    },
    [getTotalIncomingFromDaily, getTotalDispensedFromDaily]
  );

  // Move getMonthlyAverage above useMemo
  const getMonthlyAverage = useCallback(
    (name) => {
      if (!monthlyConsumption || !name) return 10;

      // Check if the item exists in monthlyConsumption
      if (monthlyConsumption[name]) {
        const average = Math.floor(monthlyConsumption[name].average || 10);
        return average;
      }

      // If not found, try to find by partial match or return default
      const matchingKey = Object.keys(monthlyConsumption || {}).find(
        (key) =>
          key.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(key.toLowerCase())
      );

      if (matchingKey) {
        const average = Math.floor(
          monthlyConsumption[matchingKey].average || 10
        );
        return average;
      }

      return 10;
    },
    [monthlyConsumption]
  );

  // Memoized calculations to avoid repeated computations
  const memoizedCalculations = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return {
        shortages: [],
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        totalCount: 0,
      };
    }

    const shortages = items
      .map((item) => {
        if (!item.name) return null;
        const currentStock = getCurrentStock(item);
        const monthlyAvg = getMonthlyAverage(item.name);
        const percentage =
          monthlyAvg > 0 ? Math.floor((currentStock / monthlyAvg) * 100) : 0;

        let level = "كافي";
        if (percentage <= 25) level = "حرج";
        else if (percentage <= 50) level = "عالي";
        else if (percentage <= 75) level = "متوسط";
        return {
          ...item,
          currentStock: Math.floor(currentStock),
          monthlyAvg: Math.floor(monthlyAvg),
          percentage: Math.floor(percentage),
          level,
        };
      })
      .filter(Boolean);

    const criticalCount = shortages.filter(
      (item) => item.level === "حرج"
    ).length;
    const highCount = shortages.filter((item) => item.level === "عالي").length;
    const mediumCount = shortages.filter(
      (item) => item.level === "متوسط"
    ).length;
    const totalCount = shortages.length;

    return {
      shortages,
      criticalCount,
      highCount,
      mediumCount,
      totalCount,
    };
  }, [items, getCurrentStock, getMonthlyAverage, month, year]);

  const shortages = memoizedCalculations.shortages;
  const criticalCount = memoizedCalculations.criticalCount;
  const highCount = memoizedCalculations.highCount;
  const mediumCount = memoizedCalculations.mediumCount;
  const totalCount = memoizedCalculations.totalCount;

  const getShortageLevel = (currentStock, monthlyAvg) => {
    if (currentStock <= 0) return "critical";
    if (currentStock < monthlyAvg * 0.5) return "high";
    if (currentStock < monthlyAvg) return "medium";
    return "low";
  };

  const getShortageColor = (level) => {
    switch (level) {
      case "critical":
        return "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-600";
      case "high":
        return "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-600";
      case "medium":
        return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-600";
      default:
        return "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600";
    }
  };

  const getShortageIcon = (level) => {
    switch (level) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      default:
        return "📊";
    }
  };

  if (totalCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl border-2 border-green-200 p-8"
      >
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-800">نواقص الصيدليه</h2>
        </div>
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🎉
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-green-700 font-bold mb-4"
          >
            لا توجد نواقص حالياً
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg text-green-600"
          >
            جميع الأصناف متوفرة بكميات كافية
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">نواقص الصيدليه</h2>
              <p className="text-red-100 mt-1">
                الأصناف التي تحتاج إلى إعادة طلب
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
            <span className="text-2xl font-bold">{totalCount}</span>
            <span className="text-red-100 ml-2">صنف</span>
          </div>
        </div>
      </div>

      {/* Information Section - Shortage Levels Explanation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-xl border-2 border-blue-200">
        <motion.button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center justify-between w-full mb-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-blue-800">
              دليل مستويات النقص
            </h3>
          </div>
          <motion.div
            animate={{ rotate: showInfo ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-blue-600 text-2xl"
          >
            ▼
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Critical Level */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🚨</span>
                    <span className="font-bold">نقص حرج</span>
                  </div>
                  <p className="text-red-100 text-sm leading-relaxed">
                    المخزون صفر أو سالب. <strong>إعادة طلب فورية مطلوبة</strong>{" "}
                    لتجنب نفاد المخزون تماماً.
                  </p>
                </div>

                {/* High Level */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚠️</span>
                    <span className="font-bold">نقص عالي</span>
                  </div>
                  <p className="text-orange-100 text-sm leading-relaxed">
                    المخزون أقل من 50% من المتوسط الشهري.{" "}
                    <strong>إعادة طلب عاجلة</strong> لتجنب النقص الحرج.
                  </p>
                </div>

                {/* Medium Level */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚡</span>
                    <span className="font-bold">نقص متوسط</span>
                  </div>
                  <p className="text-yellow-100 text-sm leading-relaxed">
                    المخزون أقل من المتوسط الشهري. <strong>مراقبة دورية</strong>{" "}
                    وإعادة طلب قريباً.
                  </p>
                </div>

                {/* Low Level */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <span className="font-bold">مخزون كافي</span>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    المخزون كافي أو أعلى من المتوسط الشهري.{" "}
                    <strong>لا حاجة لإعادة طلب</strong> حالياً.
                  </p>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="mt-6 p-4 bg-white rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💡</span>
                  <h4 className="font-bold text-blue-800">تعليمات مهمة:</h4>
                </div>
                <div className="space-y-2 text-blue-700 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      <strong>النقص الحرج:</strong> يتطلب إعادة طلب فورية خلال
                      24-48 ساعة
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      <strong>النقص العالي:</strong> يتطلب إعادة طلب خلال 3-5
                      أيام
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      <strong>النقص المتوسط:</strong> يتطلب إعادة طلب خلال أسبوع
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>
                      <strong>المخزون الكافي:</strong> لا يحتاج إعادة طلب حالياً
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">نقص حرج</p>
              <p className="text-3xl font-bold">{criticalCount}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">🚨</span>
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
              <p className="text-orange-100 text-sm">نقص عالي</p>
              <p className="text-3xl font-bold">{highCount}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">نقص متوسط</p>
              <p className="text-3xl font-bold">{mediumCount}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">⚡</span>
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
              <p className="text-blue-100 text-sm">إجمالي النواقص</p>
              <p className="text-3xl font-bold">{totalCount}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Shortages List */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-[Cairo]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-800 border-b border-gray-200 sticky right-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10">
                  🏷️ الصنف
                </th>
                <th className="p-4 font-bold text-gray-800 border-b border-gray-200">
                  📦 المخزون الحالي
                </th>
                <th className="p-4 font-bold text-gray-800 border-b border-gray-200">
                  📊 المتوسط الشهري
                </th>
                <th className="p-4 font-bold text-gray-800 border-b border-gray-200">
                  ⚠️ مستوى النقص
                </th>
                <th className="p-4 font-bold text-gray-800 border-b border-gray-200">
                  💡 النسبة المئوية
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {shortages.map((item, idx) => {
                  const currentStock = item.currentStock;
                  const monthlyAvg = item.monthlyAvg;
                  const shortageLevel = getShortageLevel(
                    currentStock,
                    monthlyAvg
                  );
                  const percentage = item.percentage;

                  return (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-red-50 transition-colors duration-200`}
                    >
                      <td className="p-4 font-bold text-gray-800 border-b border-gray-200 sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.1)]">
                        {item.name}
                      </td>
                      <td className="p-4 text-gray-700 border-b border-gray-200">
                        <span className="text-lg font-mono font-bold">
                          {Math.floor(currentStock)}
                        </span>
                      </td>
                      <td className="p-4 text-center border-b border-gray-200">
                        <span className="text-lg font-mono">
                          {Math.floor(monthlyAvg)}
                        </span>
                      </td>
                      <td className="p-4 border-b border-gray-200">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getShortageColor(
                            shortageLevel
                          )}`}
                        >
                          {getShortageIcon(shortageLevel)}{" "}
                          {shortageLevel === "critical"
                            ? "حرج"
                            : shortageLevel === "high"
                            ? "عالي"
                            : shortageLevel === "medium"
                            ? "متوسط"
                            : "منخفض"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                percentage < 25
                                  ? "bg-red-500"
                                  : percentage < 50
                                  ? "bg-orange-500"
                                  : percentage < 75
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono font-bold">
                            {Math.floor(percentage)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default PharmacyShortages;
