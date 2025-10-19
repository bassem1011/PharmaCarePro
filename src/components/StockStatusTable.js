// ✅ src/components/StockStatusTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../App";
import { Calendar, FileSpreadsheet } from "lucide-react";
import MonthYearModal from "./ui/MonthYearModal";
import * as XLSX from 'xlsx';

const StockStatusTable = ({
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
        totalDispensed: 0,
        currentStock: 0,
      };
    }

    const calculations = items.reduce(
      (acc, item) => {
        const totalIncoming = Math.floor(
          Object.values(item.dailyIncoming || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          )
        );
        const totalDispensed = Math.floor(
          Object.values(item.dailyDispense || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          )
        );
        const currentStock =
          Math.floor(Number(item.opening || 0)) +
          totalIncoming -
          totalDispensed;

        return {
          totalItems: acc.totalItems + 1,
          totalIncoming: acc.totalIncoming + totalIncoming,
          totalDispensed: acc.totalDispensed + totalDispensed,
          currentStock: acc.currentStock + currentStock,
        };
      },
      { totalItems: 0, totalIncoming: 0, totalDispensed: 0, currentStock: 0 }
    );

    return {
      ...calculations,
      totalIncoming: Math.floor(calculations.totalIncoming),
      totalDispensed: Math.floor(calculations.totalDispensed),
      currentStock: Math.floor(calculations.currentStock),
    };
  }, [items]);

  const getTotal = (item) => {
    if (!item) return 0;
    const total = Object.values(item.dailyDispense || {}).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    return Math.floor(Number(total));
  };

  const getTotalIncoming = (item) => {
    if (!item) return 0;
    const total = Object.values(item.dailyIncoming || {}).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    return Math.floor(Number(total));
  };

  const getCurrentStock = (item) => {
    if (!item) return 0;
    const opening = Math.floor(Number(item.opening || 0));
    const totalIncoming = getTotalIncoming(item);
    const totalDispensed = getTotal(item);
    return Math.floor(opening + totalIncoming - totalDispensed);
  };

  // Helper function to aggregate daily incoming data by source
  const aggregateIncomingBySource = (item) => {
    if (!item.dailyIncoming || !item.incomingSource) {
      return { factory: 0, authority: 0, scissors: 0 };
    }

    const aggregated = { factory: 0, authority: 0, scissors: 0 };

    Object.keys(item.dailyIncoming).forEach((day) => {
      const amount = Number(item.dailyIncoming[day]) || 0;
      const source = item.incomingSource[day];

      if (source === "مصنع") {
        aggregated.factory += amount;
      } else if (source === "شركه") {
        aggregated.authority += amount;
      } else if (source === "مقصه") {
        aggregated.scissors += amount;
      }
    });

    return aggregated;
  };

  // Helper function to get total incoming from daily data
  const getTotalIncomingFromDaily = (item) => {
    if (!item.dailyIncoming) return 0;
    return Object.values(item.dailyIncoming).reduce(
      (acc, val) => acc + Number(val || 0),
      0
    );
  };

  // Helper function to get total dispensed from daily data
  const getTotalDispensedFromDaily = (item) => {
    if (!item.dailyDispense) return 0;
    return Object.values(item.dailyDispense).reduce(
      (acc, val) => acc + Number(val || 0),
      0
    );
  };

  const exportExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = items.map(item => {
        const opening = Number(item.opening || 0);
        const aggregatedIncoming = aggregateIncomingBySource(item);
        const totalIncoming = getTotalIncomingFromDaily(item);
        const totalDispensed = getTotalDispensedFromDaily(item);
        const currentStock = opening + totalIncoming - totalDispensed;
        const unitPrice = Number(item.unitPrice || 0);
        const remainingValue = currentStock * unitPrice;

        return {
          "اسم الصنف": item.name || "",
          "الرصيد الافتتاحي": Math.floor(opening),
          "الوارد من المصنع": Math.floor(aggregatedIncoming.factory),
          "الوارد من الشركة": Math.floor(aggregatedIncoming.authority),
          "الوارد من المقص": Math.floor(aggregatedIncoming.scissors),
          "إجمالي الوارد": Math.floor(totalIncoming),
          "إجمالي الوارد والافتتاحي": Math.floor(opening + totalIncoming),
          "إجمالي المنصرف": Math.floor(totalDispensed),
          "الرصيد الحالي": Math.floor(currentStock),
          "سعر الوحدة": Math.floor(unitPrice),
          "القيمة المتبقية": Math.floor(remainingValue),
        };
      });

      // Create worksheet with RTL support
      const ws = XLSX.utils.json_to_sheet(excelData, { origin: 'A3' });
      
      // Add title and date
      const monthNames = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ];
      const title = `تقرير حالة المخزون - ${monthNames[month]} ${year}`;
      const dateStr = `تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`;
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
      XLSX.utils.sheet_add_aoa(ws, [[dateStr]], { origin: 'A2' });
      
      // Calculate total values for summary
      const totalItems = excelData.length;
      const totalRemainingValue = excelData.reduce((sum, item) => 
        sum + (Number(item["القيمة المتبقية"]) || 0), 0);
      const totalCurrentStock = excelData.reduce((sum, item) => 
        sum + (Number(item["الرصيد الحالي"]) || 0), 0);
      
      // Add summary statistics
      const summaryStartRow = excelData.length + 5;
      XLSX.utils.sheet_add_aoa(ws, [["ملخص الإحصائيات"]], { origin: `A${summaryStartRow}` });
      XLSX.utils.sheet_add_aoa(ws, [["إجمالي الأصناف", totalItems]], { origin: `A${summaryStartRow + 1}` });
      XLSX.utils.sheet_add_aoa(ws, [["إجمالي الرصيد الحالي", totalCurrentStock]], { origin: `A${summaryStartRow + 2}` });
      XLSX.utils.sheet_add_aoa(ws, [["إجمالي القيمة المتبقية", totalRemainingValue]], { origin: `A${summaryStartRow + 3}` });
      
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
      
      // Style for data cells - add zebra striping
      for (let R = headerRow + 1; R <= range.e.r; ++R) {
        const rowStyle = R % 2 ? { fill: { fgColor: { rgb: "F9F9F9" } } } : {};
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cell]) continue;
          
          // Special formatting for numeric columns
          if (C > 0) { // Skip the first column (item name)
            ws[cell].s = { 
              ...rowStyle,
              alignment: { horizontal: 'center' },
              font: { color: { rgb: "333333" } },
              numFmt: '#,##0' // Add thousand separators
            };
          } else {
            ws[cell].s = { ...rowStyle, font: { bold: true } };
          }
        }
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
          ws[valueCell].s = { 
            font: { bold: true, color: { rgb: "4F3FB6" } }, 
            alignment: { horizontal: 'center' },
            numFmt: '#,##0' // Add thousand separators
          };
        }
      }
      
      // Set column widths for better appearance
      ws['!cols'] = [
        { wch: 30 }, // اسم الصنف
        { wch: 18 }, // الرصيد الافتتاحي
        { wch: 18 }, // الوارد من المصنع
        { wch: 18 }, // الوارد من الشركة
        { wch: 18 }, // الوارد من المقص
        { wch: 18 }, // إجمالي الوارد
        { wch: 22 }, // إجمالي الوارد والافتتاحي
        { wch: 18 }, // إجمالي المنصرف
        { wch: 18 }, // الرصيد الحالي
        { wch: 18 }, // سعر الوحدة
        { wch: 18 }, // القيمة المتبقية
      ];
      
      // Set RTL direction for the worksheet
      ws['!rightToLeft'] = true;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, "تقرير المخزون");
      
      // Generate Excel file
      const fileName = `تقرير_حالة_المخزون_${monthNames[month]}_${year}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast("تم تحميل ملف الإكسل بنجاح", "success");
    } catch (error) {
      console.error("Excel export error:", error);
      toast("فشل في تحميل ملف الإكسل", "error");
    }
  };



  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">حالة المخزون</h2>
              <p className="text-purple-100 mt-1">
                عرض حالة المخزون والأرصدة الحالية
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

      {/* Statistics Cards - Separated from table */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">إجمالي الأصناف</p>
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
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">إجمالي الوارد</p>
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
          className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">إجمالي المنصرف</p>
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
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">المخزون الحالي</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.currentStock}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">💊</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table Container - Static width with internal scrolling */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              جدول حالة المخزون
            </h3>
            <div className="text-sm text-gray-600">
              {new Date(year, month).toLocaleString("ar-EG", {
                month: "long",
                year: "numeric",
              })}
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
            className="overflow-x-auto border-2 border-purple-300 rounded-xl bg-white shadow-lg mx-4 mb-4"
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
                minWidth: "2000px",
                width: "max-content",
                tableLayout: "fixed",
              }}
            >
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200 sticky right-0 bg-gradient-to-r from-purple-50 to-indigo-50 z-20">
                    🏷️ الصنف
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    💰 الرصيد الافتتاحي
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    📥 وارد من مصنع
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    🏢 هيئة شراء
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    ✂️ مقصه
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    📥 إجمالي الوارد
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    💰 إجمالي الوارد والافتتاحي
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    📤 إجمالي المنصرف
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    💰 الرصيد الحالي
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    💵 سعر الوحدة
                  </th>
                  <th className="p-4 font-bold text-purple-800 border-b border-purple-200">
                    💰 القيمة المتبقية
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items.map((item, idx) => {
                    const opening = Number(item.opening || 0);
                    const aggregatedIncoming = aggregateIncomingBySource(item);
                    const totalIncoming = getTotalIncomingFromDaily(item);
                    const totalDispensed = getTotalDispensedFromDaily(item);
                    const currentStock =
                      opening + totalIncoming - totalDispensed;
                    const unitPrice = Number(item.unitPrice || 0);
                    const remainingValue = currentStock * unitPrice;

                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-purple-50 transition-colors duration-200`}
                      >
                        <td className="p-4 font-bold text-gray-800 border-b border-gray-200 sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(idx, { name: e.target.value })
                            }
                            className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
                            placeholder="اسم الصنف"
                          />
                        </td>
                        <td className="p-4 border-b border-gray-200">
                          <input
                            type="number"
                            value={item.opening || ""}
                            onChange={(e) => {
                              const newValue =
                                e.target.value === ""
                                  ? 0
                                  : Math.floor(Number(e.target.value));
                              updateItem(idx, { opening: newValue });
                            }}
                            className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
                            placeholder="0"
                            min="0"
                            step="1"
                          />
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-green-50">
                          <div className="text-center font-bold text-green-800 text-lg">
                            {Math.floor(aggregatedIncoming.factory)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-blue-50">
                          <div className="text-center font-bold text-blue-800 text-lg">
                            {Math.floor(aggregatedIncoming.authority)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-orange-50">
                          <div className="text-center font-bold text-orange-800 text-lg">
                            {Math.floor(aggregatedIncoming.scissors)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-green-100 font-bold text-green-800 text-lg">
                          <div className="text-center">
                            {Math.floor(totalIncoming)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-purple-100 font-bold text-purple-800 text-lg">
                          <div className="text-center">
                            {Math.floor(opening + totalIncoming)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-red-100 font-bold text-red-800 text-lg">
                          <div className="text-center">
                            {Math.floor(totalDispensed)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-purple-100 font-bold text-purple-800 text-lg">
                          <div className="text-center">
                            {Math.floor(currentStock)}
                          </div>
                        </td>
                        <td className="p-4 border-b border-gray-200">
                          <input
                            type="number"
                            value={item.unitPrice || ""}
                            onChange={(e) => {
                              const newValue =
                                e.target.value === ""
                                  ? 0
                                  : Math.floor(Number(e.target.value));
                              updateItem(idx, { unitPrice: newValue });
                            }}
                            className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all duration-200"
                            placeholder="0"
                            min="0"
                            step="1"
                          />
                        </td>
                        <td className="p-4 border-b border-gray-200 bg-yellow-100 font-bold text-yellow-800 text-lg">
                          <div className="text-center">
                            {Math.floor(remainingValue)}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {(!items || items.length === 0) && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50"
                    >
                      <td
                        colSpan={11}
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

export default StockStatusTable;
