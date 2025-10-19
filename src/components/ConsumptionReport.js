// src/components/ConsumptionReport.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Calendar, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

const ConsumptionReport = ({
  items,
  monthlyConsumption,
  month,
  year,
  handleMonthYearChange,
  itemsByMonth,
}) => {
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);

  // Calculate consumption from daily dispensed data
  const reportData = useMemo(() => {
    

    if (!items || !Array.isArray(items) || !itemsByMonth) {
      console.warn("Missing required data for report calculation");
      return {
        months: [],
        items: [],
        summary: {
          totalItems: 0,
          averageConsumption: 0,
          currentMonthTotal: 0,
        },
      };
    }

    // Get last 3 months (current, previous, previous-previous)
    const getLastThreeMonths = () => {
      const months = [];
      // month is 0-based (0-11), so we need to add 1 for the Date constructor
      const selectedDate = new Date(year, month, 1); // month is already 0-based, no need to subtract 1

      for (let i = 2; i >= 0; i--) {
        const date = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() - i,
          1
        );
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        months.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          key: monthKey,
          name: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          isCurrent: i === 0,
        });
      }
      return months;
    };

    const months = getLastThreeMonths();

    // Filter valid items
    const validItems = items.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.name &&
        typeof item.name === "string" &&
        item.name.trim() !== ""
    );

    

    // Calculate consumption for each item from daily dispensed data
    const itemsWithConsumption = validItems.map((item) => {
      try {
        const consumptions = months.map((month) => {
          // Get the month key for this specific month
          const monthKey = month.key;

          // Get items for this specific month from itemsByMonth
          const monthItems = itemsByMonth[monthKey] || [];

          // Find the item in this month's data
          const monthItem = monthItems.find(
            (mItem) => mItem.name === item.name
          );

          // Calculate total dispensed for this specific month
          if (monthItem && monthItem.dailyDispense) {
            const monthDispensed = Object.values(
              monthItem.dailyDispense
            ).reduce((sum, val) => {
              return sum + Math.floor(Number(val || 0));
            }, 0);
            return monthDispensed;
          }
          return 0; // Return 0 if no data for this month
        });

        // Calculate average across all 3 months
        const totalConsumption = consumptions.reduce(
          (sum, val) => sum + val,
          0
        );

        // Calculate average only for months with actual data (non-zero)
        const monthsWithData = consumptions.filter((val) => val > 0);
        const average =
          monthsWithData.length > 0
            ? Math.floor(totalConsumption / monthsWithData.length)
            : 0;

        return {
          name: item.name,
          consumptions,
          total: totalConsumption,
          average,
        };
      } catch (error) {
        console.error(
          "Error calculating consumption for item:",
          item.name,
          error
        );
        // Return fallback data for this item
        return {
          name: item.name,
          consumptions: [0, 0, 0],
          total: 0,
          average: 0,
        };
      }
    });

    

    // Calculate summary statistics
    const totalItems = itemsWithConsumption.length;
    const averageConsumption =
      totalItems > 0
        ? Math.floor(
            itemsWithConsumption.reduce((sum, item) => sum + item.average, 0) /
              totalItems
          )
        : 0;
    const currentMonthTotal = itemsWithConsumption.reduce(
      (sum, item) => sum + item.consumptions[2],
      0
    ); // Current month is at index 2

    const result = {
      months,
      items: itemsWithConsumption,
      summary: {
        totalItems,
        averageConsumption,
        currentMonthTotal,
      },
    };

    return result;
  }, [items, month, year, itemsByMonth]);

  // Export to Excel
  const exportExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = reportData.items.map(item => {
        return {
          "اسم الصنف": item.name || "",
          [reportData.months[0].name]: Math.floor(item.consumptions[0] || 0),
          [reportData.months[1].name]: Math.floor(item.consumptions[1] || 0),
          [reportData.months[2].name]: Math.floor(item.consumptions[2] || 0),
          "المتوسط": Math.floor(item.average || 0)
        };
      });

      // Create worksheet with RTL support
      const ws = XLSX.utils.json_to_sheet(excelData, { origin: 'A3' });
      
      // Add title and date
      const title = `تقرير متوسط الاستهلاك - آخر 3 أشهر (${reportData.months[2].name})`;
      const dateStr = `تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`;
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
      XLSX.utils.sheet_add_aoa(ws, [[dateStr]], { origin: 'A2' });
      
      // Add summary statistics
      const summaryStartRow = excelData.length + 5;
      XLSX.utils.sheet_add_aoa(ws, [["ملخص الإحصائيات"]], { origin: `A${summaryStartRow}` });
      XLSX.utils.sheet_add_aoa(ws, [["إجمالي الأصناف", reportData.summary.totalItems]], { origin: `A${summaryStartRow + 1}` });
      XLSX.utils.sheet_add_aoa(ws, [["متوسط الاستهلاك", reportData.summary.averageConsumption]], { origin: `A${summaryStartRow + 2}` });
      XLSX.utils.sheet_add_aoa(ws, [["إجمالي الشهر الحالي", reportData.summary.currentMonthTotal]], { origin: `A${summaryStartRow + 3}` });
      
      // Apply styles using cell references
      // Style for title
      ws['A1'] = { v: title, t: 's', s: { font: { bold: true, color: { rgb: "4F3FB6" }, sz: 16 } } };
      ws['A2'] = { v: dateStr, t: 's', s: { font: { color: { rgb: "666666" }, sz: 12 } } };
      
      // Style for headers (row 3)
      const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "6D4CB3" } }, alignment: { horizontal: 'center' } };
      const headerRow = XLSX.utils.decode_range(ws['!ref']).s.r + 2; // Get the header row (0-indexed)
      const range = XLSX.utils.decode_range(ws['!ref']);
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: headerRow, c: C });
        if (!ws[headerCell]) continue;
        ws[headerCell].s = headerStyle;
      }
      
      // Style for summary section
      ws[`A${summaryStartRow}`] = { 
        v: "ملخص الإحصائيات", 
        t: 's', 
        s: { font: { bold: true, color: { rgb: "4F3FB6" }, sz: 14 }, 
        fill: { fgColor: { rgb: "EFEFEF" } } }
      };
      
      // Style for summary rows
      for (let i = 1; i <= 3; i++) {
        const labelCell = `A${summaryStartRow + i}`;
        const valueCell = `B${summaryStartRow + i}`;
        
        if (ws[labelCell]) {
          ws[labelCell].s = { font: { bold: true }, fill: { fgColor: { rgb: "F5F5F5" } } };
        }
        
        if (ws[valueCell]) {
          ws[valueCell].s = { font: { bold: true, color: { rgb: "4F3FB6" } }, alignment: { horizontal: 'center' } };
        }
      }
      
      // Set column widths for better appearance
      ws['!cols'] = [
        { wch: 30 }, // اسم الصنف
        { wch: 18 }, // الشهر الأول
        { wch: 18 }, // الشهر الثاني
        { wch: 18 }, // الشهر الثالث
        { wch: 18 }, // المتوسط
      ];
      
      // Set RTL direction for the worksheet
      ws['!rightToLeft'] = true;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, "تقرير الاستهلاك");
      
      // Generate Excel file
      const fileName = `تقرير_متوسط_الاستهلاك_${reportData.months[2].name.replace(" ", "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("حدث خطأ أثناء إنشاء ملف Excel");
    }
  };

  // Month/Year Modal
  const MonthYearModal = () => (
    <AnimatePresence>
      {showMonthYearModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMonthYearModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              تغيير الشهر/السنة
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الشهر
                </label>
                <select
                  value={month}
                  onChange={(e) =>
                    handleMonthYearChange(Number(e.target.value), year)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2025, m - 1).toLocaleDateString("en-US", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  السنة
                </label>
                <select
                  value={year}
                  onChange={(e) =>
                    handleMonthYearChange(month, Number(e.target.value))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-500"
                >
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - 5 + i
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowMonthYearModal(false)}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => setShowMonthYearModal(false)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold hover:from-fuchsia-600 hover:to-purple-700 transition-all"
              >
                تم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">تقرير الاستهلاك</h2>
              <p className="text-purple-100 mt-1">
                تحليل الاستهلاك خلال آخر 3 أشهر
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMonthYearModal(true)}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
            >
              <Calendar className="w-5 h-5" />
              <span>تغيير الفترة</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportExcel}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>تحميل Excel</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي الأصناف</p>
              <p className="text-3xl font-bold">
                {reportData.summary.totalItems}
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
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">متوسط الاستهلاك</p>
              <p className="text-3xl font-bold">
                {reportData.summary.averageConsumption}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">الشهر الحالي</p>
              <p className="text-3xl font-bold">
                {reportData.summary.currentMonthTotal}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Consumption Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-800 border-b border-gray-200">
                  اسم الصنف
                </th>
                {reportData.months.map((month, index) => (
                  <th
                    key={month.key}
                    className={`p-4 font-bold text-gray-800 border-b border-gray-200 text-center ${
                      month.isCurrent ? "bg-blue-50 text-blue-800" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{month.name}</span>
                      <span className="text-xs text-gray-500">
                        {month.isCurrent ? "🔄 الحالي" : "📊 سابق"}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-4 font-bold text-green-800 border-b border-gray-200 text-center bg-green-50">
                  المتوسط
                </th>
              </tr>
            </thead>
            <tbody>
              {reportData.items.map((item, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="p-4 font-bold text-gray-800 border-b border-gray-200">
                    {item.name}
                  </td>
                  {item.consumptions.map((value, index) => (
                    <td
                      key={index}
                      className={`p-4 text-gray-700 border-b border-gray-200 text-center ${
                        reportData.months[index].isCurrent
                          ? "bg-blue-50 font-semibold"
                          : ""
                      }`}
                    >
                      <span className="text-lg font-mono">{value}</span>
                    </td>
                  ))}
                  <td className="p-4 font-bold text-green-700 border-b border-gray-200 text-center bg-green-50">
                    <span className="text-lg font-mono">{item.average}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {reportData.items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            لا توجد بيانات متاحة
          </h3>
          <p className="text-gray-600">
            لم يتم العثور على بيانات الاستهلاك للفترة المحددة.
          </p>
        </motion.div>
      )}

      <MonthYearModal />
    </div>
  );
};

export default ConsumptionReport;
