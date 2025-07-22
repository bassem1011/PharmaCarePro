import React from "react";
import { motion } from "framer-motion";

const PharmacyShortages = ({ items, monthlyConsumption }) => {
  // Calculate shortages based on current stock vs monthly consumption
  const getShortages = () => {
    return items.filter((item) => {
      const currentStock =
        item.opening + (item.incoming || 0) - (item.dispensed || 0);
      const monthlyAvg = monthlyConsumption[item.name] || 0;

      // Item is considered short if:
      // 1. Current stock is zero
      // 2. Current stock is less than monthly average consumption
      return currentStock <= 0 || currentStock < monthlyAvg;
    });
  };

  const shortages = getShortages();

  const getCurrentStock = (item) => {
    return item.opening + (item.incoming || 0) - (item.dispensed || 0);
  };

  const getMonthlyAverage = (itemName) => {
    return monthlyConsumption[itemName] || 0;
  };

  const getShortageLevel = (currentStock, monthlyAvg) => {
    if (currentStock <= 0) return "critical";
    if (currentStock < monthlyAvg * 0.5) return "high";
    if (currentStock < monthlyAvg) return "medium";
    return "low";
  };

  const getShortageColor = (level) => {
    switch (level) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200";
      case "high":
        return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-800 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200";
      default:
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200";
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

  if (shortages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-green-200 dark:border-green-700 p-6"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="text-3xl">✅</span>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">
            نواقص الصيدليه
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-lg text-green-600 dark:text-green-400 font-semibold">
            لا توجد نواقص حالياً
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            جميع الأصناف متوفرة بكميات كافية
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-red-200 dark:border-red-700 p-6"
    >
      <div className="flex items-center justify-center space-x-3 mb-6">
        <span className="text-3xl">🚨</span>
        <h2 className="text-2xl font-bold text-red-800 dark:text-red-300">
          نواقص الصيدليه
        </h2>
        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-bold">
          {shortages.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-base text-right font-[Cairo] rounded-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900 dark:to-red-800">
            <tr>
              <th className="p-4 border-b border-red-300 dark:border-red-600 font-bold text-lg text-red-800 dark:text-red-200">
                🏷️ الصنف
              </th>
              <th className="p-4 border-b border-red-300 dark:border-red-600 font-bold text-lg text-red-800 dark:text-red-200">
                📦 المخزون الحالي
              </th>
              <th className="p-4 border-b border-red-300 dark:border-red-600 font-bold text-lg text-red-800 dark:text-red-200">
                📊 متوسط الاستهلاك الشهري
              </th>
              <th className="p-4 border-b border-red-300 dark:border-red-600 font-bold text-lg text-red-800 dark:text-red-200">
                ⚠️ مستوى النقص
              </th>
              <th className="p-4 border-b border-red-300 dark:border-red-600 font-bold text-lg text-red-800 dark:text-red-200">
                💰 القيمة المطلوبة
              </th>
            </tr>
          </thead>
          <tbody>
            {shortages.map((item, idx) => {
              const currentStock = getCurrentStock(item);
              const monthlyAvg = getMonthlyAverage(item.name);
              const shortageLevel = getShortageLevel(currentStock, monthlyAvg);
              const requiredAmount = Math.max(0, monthlyAvg - currentStock);
              const estimatedValue = requiredAmount * (item.unitPrice || 0);

              return (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="p-4 border-b border-gray-200 dark:border-gray-600 font-semibold">
                    {item.name}
                  </td>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <span
                      className={`font-bold ${
                        currentStock <= 0
                          ? "text-red-600 dark:text-red-400"
                          : currentStock < monthlyAvg
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {currentStock.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {monthlyAvg.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getShortageColor(
                        shortageLevel
                      )}`}
                    >
                      {getShortageIcon(shortageLevel)}{" "}
                      {shortageLevel === "critical"
                        ? "نقص حرج"
                        : shortageLevel === "high"
                        ? "نقص عالي"
                        : shortageLevel === "medium"
                        ? "نقص متوسط"
                        : "نقص منخفض"}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="space-y-1">
                      <div className="font-semibold text-purple-600 dark:text-purple-400">
                        {requiredAmount.toLocaleString()} وحدة
                      </div>
                      {item.unitPrice && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ≈ {estimatedValue.toLocaleString()} ج.م
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">💡</span>
          <h3 className="font-bold text-red-800 dark:text-red-300">ملاحظات:</h3>
        </div>
        <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
          <li>
            • <strong>نقص حرج:</strong> المخزون صفر أو أقل من المتوسط الشهري
          </li>
          <li>
            • <strong>نقص عالي:</strong> المخزون أقل من 50% من المتوسط الشهري
          </li>
          <li>
            • <strong>نقص متوسط:</strong> المخزون أقل من المتوسط الشهري
          </li>
          <li>
            • <strong>القيمة المطلوبة:</strong> تقدير للكمية المطلوبة لتغطية
            الاستهلاك الشهري
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default PharmacyShortages;
