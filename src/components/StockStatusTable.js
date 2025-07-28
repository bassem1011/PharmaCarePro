// ✅ src/components/StockStatusTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../App";
import { Calendar, Download } from "lucide-react";
import MonthYearModal from "./ui/MonthYearModal";

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

  const exportPDF = () => {
    try {
      // Create PDF with basic font support
      const doc = new jsPDF("landscape", "mm", "a4");

      // Use basic font without external loading
      doc.setFont("helvetica");
      doc.setFontSize(8);

      const tableColumn = [
        "اسم الصنف",
        "الرصيد الافتتاحي",
        "الوارد من المصنع",
        "الوارد من الشركة",
        "الوارد من المقص",
        "إجمالي الوارد",
        "إجمالي الوارد والافتتاحي",
        "إجمالي المنصرف",
        "الرصيد الحالي",
        "سعر الوحدة",
        "القيمة المتبقية",
      ];

      const tableRows = items.map((item) => {
        const opening = Number(item.opening || 0);
        const aggregatedIncoming = aggregateIncomingBySource(item);
        const totalIncoming = getTotalIncomingFromDaily(item);
        const totalDispensed = getTotalDispensedFromDaily(item);
        const currentStock = opening + totalIncoming - totalDispensed;
        const unitPrice = Number(item.unitPrice || 0);
        const remainingValue = currentStock * unitPrice;

        return [
          item.name || "",
          Math.floor(opening),
          Math.floor(aggregatedIncoming.factory),
          Math.floor(aggregatedIncoming.authority),
          Math.floor(aggregatedIncoming.scissors),
          Math.floor(totalIncoming),
          Math.floor(opening + totalIncoming),
          Math.floor(totalDispensed),
          Math.floor(currentStock),
          Math.floor(unitPrice),
          Math.floor(remainingValue),
        ];
      });

      // Add title in Arabic
      doc.setFontSize(16);
      doc.setTextColor(103, 58, 183);
      doc.text("تقرير حالة المخزون", 148, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);
      const monthNames = [
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
      ];
      doc.text(`الشهر: ${monthNames[month]} ${year}`, 148, 25, {
        align: "center",
      });
      doc.text(`التاريخ: ${new Date().toLocaleDateString("en-US")}`, 148, 35, {
        align: "center",
      });

      // Create table with Arabic headers
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: "right",
          font: "helvetica",
          textColor: [55, 65, 81],
        },
        headStyles: {
          fillColor: [103, 58, 183],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: "bold" }, // اسم الصنف
          1: { cellWidth: 15 }, // الرصيد الافتتاحي
          2: { cellWidth: 15 }, // الوارد من المصنع
          3: { cellWidth: 15 }, // الوارد من الشركة
          4: { cellWidth: 15 }, // الوارد من المقص
          5: { cellWidth: 15 }, // إجمالي الوارد
          6: { cellWidth: 18 }, // إجمالي الوارد والافتتاحي
          7: { cellWidth: 15 }, // إجمالي المنصرف
          8: { cellWidth: 15 }, // الرصيد الحالي
          9: { cellWidth: 15 }, // سعر الوحدة
          10: { cellWidth: 15 }, // القيمة المتبقية
        },
        margin: { top: 45, right: 5, bottom: 15, left: 5 },
        didDrawPage: function (data) {
          // Add page numbers in Arabic
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.text(
              `صفحة ${i} من ${pageCount}`,
              doc.internal.pageSize.width - 15,
              doc.internal.pageSize.height - 8,
              { align: "center" }
            );
          }
        },
        didParseCell: function (data) {
          // Add better cell styling
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Save the PDF with Arabic filename
      const fileName = `تقرير_حالة_المخزون_${monthNames[month]}_${year}.pdf`;
      doc.save(fileName);
      toast("تم تحميل التقرير بنجاح", "success");
    } catch (error) {
      console.error("PDF export error:", error);
      toast("فشل في تحميل التقرير", "error");
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
              onClick={exportPDF}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>تحميل PDF</span>
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
