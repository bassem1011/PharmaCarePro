// src/components/ConsumptionReport.jsx
import React from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ConsumptionReport = ({ allMonthsItems }) => {
  const getLastThreeMonthsKeys = () => {
    const keys = Object.keys(allMonthsItems);
    return keys.sort().slice(-3); // آخر ٣ شهور
  };

  const calculateAverages = () => {
    const keys = getLastThreeMonthsKeys();
    const itemMap = {};

    keys.forEach((monthKey) => {
      const monthItems = allMonthsItems[monthKey] || [];
      monthItems.forEach((item) => {
        if (!itemMap[item.name])
          itemMap[item.name] = {
            totalDispensed: 0,
            totalIncoming: 0,
            incomingBySource: {
              مصنع: 0,
              "هيئة شراء": 0,
              مقصه: 0,
            },
            count: 0,
          };
        const dispensed = Object.values(item.dailyDispense || {}).reduce(
          (a, b) => a + b,
          0
        );
        const incoming = Object.values(item.dailyIncoming || {}).reduce(
          (a, b) => a + b,
          0
        );

        // Calculate incoming by source
        Object.entries(item.dailyIncoming || {}).forEach(([day, amount]) => {
          const source = item.incomingSource?.[day] || "";
          if (
            source &&
            itemMap[item.name].incomingBySource[source] !== undefined
          ) {
            itemMap[item.name].incomingBySource[source] += amount;
          }
        });

        itemMap[item.name].totalDispensed += dispensed;
        itemMap[item.name].totalIncoming += incoming;
        itemMap[item.name].count += 1;
      });
    });

    return Object.entries(itemMap).map(([name, data]) => ({
      name,
      avgDispensed: Math.round(data.totalDispensed / data.count),
      avgIncoming: Math.round(data.totalIncoming / data.count),
      incomingBySource: data.incomingBySource,
      totalDispensed: data.totalDispensed,
      totalIncoming: data.totalIncoming,
    }));
  };

  const results = calculateAverages();

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "الصنف",
      "متوسط المنصرف (٣ شهور)",
      "متوسط الوارد (٣ شهور)",
      "إجمالي المنصرف (٣ شهور)",
      "إجمالي الوارد (٣ شهور)",
    ];
    const averages = calculateAverages();
    const tableRows = averages.map((row) => [
      row.name,
      row.avgDispensed,
      row.avgIncoming,
      row.totalDispensed,
      row.totalIncoming,
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows });
    doc.save(`3months_stock.pdf`);
  };

  return (
    <div className="mt-10 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-purple-200 dark:border-purple-700 font-[Cairo]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold mb-4 text-purple-700 dark:text-purple-300 tracking-wide leading-relaxed">
          📊 تقرير الاستهلاك
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          متوسط الاستهلاك والوارد (آخر ٣ شهور)
        </p>
      </div>

      <button
        onClick={exportPDF}
        className="mb-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
      >
        تصدير PDF
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full"
      >
        <div
          className="overflow-x-auto"
          dir="rtl"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="min-w-[600px] w-max table-auto border-2 border-gray-300 dark:border-gray-600 text-base text-right rounded-xl overflow-hidden relative">
            <thead className="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
              <tr>
                <th className="border-b border-gray-300 dark:border-gray-600 p-4 font-bold text-gray-800 dark:text-gray-200 sticky right-0 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 z-40 border-l-2 border-purple-300 dark:border-purple-600">
                  الصنف
                </th>
                <th className="border-b border-gray-300 dark:border-gray-600 p-4 font-bold text-gray-800 dark:text-gray-200">
                  متوسط المنصرف
                </th>
                <th className="border-b border-gray-300 dark:border-gray-600 p-4 font-bold text-gray-800 dark:text-gray-200">
                  متوسط الوارد
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="even:bg-gray-100 dark:even:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <td className="border-b border-gray-200 dark:border-gray-600 p-4 font-medium text-gray-800 dark:text-gray-200 sticky right-0 bg-white dark:bg-gray-800 z-30 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_rgba(0,0,0,0.3)]">
                    {row.name}
                  </td>
                  <td className="border-b border-gray-200 dark:border-gray-600 p-4 text-red-600 dark:text-red-400 font-bold">
                    {row.avgDispensed}
                  </td>
                  <td className="border-b border-gray-200 dark:border-gray-600 p-4 text-green-600 dark:text-green-400 font-bold">
                    {row.avgIncoming}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {results.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
            لا توجد بيانات للعرض
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            أضف بيانات في الجداول أعلاه لعرض التقرير
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ConsumptionReport;
