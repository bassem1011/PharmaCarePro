// src/components/ConsumptionReport.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    console.log("Calculating report data...");
    console.log("Input data:", { items, itemsByMonth, month, year });

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
    console.log("Calculated months:", months);

    // Filter valid items
    const validItems = items.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.name &&
        typeof item.name === "string" &&
        item.name.trim() !== ""
    );

    console.log("Valid items:", validItems);

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

    console.log("Items with consumption:", itemsWithConsumption);

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

    console.log("Final report data:", result);
    return result;
  }, [items, month, year, itemsByMonth]);

  // Export to PDF
  const exportPDF = () => {
    try {
      console.log("Starting PDF generation...");
      console.log("reportData:", reportData);
      console.log("items:", items);
      console.log("itemsByMonth:", itemsByMonth);

      // Check if jsPDF is available
      if (typeof jsPDF === "undefined") {
        console.error("jsPDF is not available");
        alert("مكتبة PDF غير متاحة. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
        return;
      }

      // Check if autoTable is available
      if (typeof autoTable === "undefined") {
        console.error("autoTable is not available");
        alert("مكتبة الجداول غير متاحة. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
        return;
      }

      // Validate data before generating PDF
      if (!reportData) {
        console.error("reportData is null or undefined");
        alert("لا توجد بيانات متاحة لإنشاء التقرير");
        return;
      }

      if (!reportData.items) {
        console.error("reportData.items is null or undefined");
        alert("لا توجد بيانات متاحة لإنشاء التقرير");
        return;
      }

      if (reportData.items.length === 0) {
        console.error("reportData.items is empty");
        alert("لا توجد بيانات متاحة لإنشاء التقرير");
        return;
      }

      console.log("Data validation passed, creating PDF...");

      const doc = new jsPDF("landscape", "mm", "a4");

      // Title
      doc.setFontSize(18);
      doc.setTextColor(103, 58, 183);
      doc.text("تقرير الاستهلاك - آخر 3 أشهر", 148, 20, {
        align: "center",
      });

      // Date
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);
      doc.text(
        `تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`,
        148,
        30,
        { align: "center" }
      );

      // Table headers
      const headers = [
        "اسم الصنف",
        ...reportData.months.map((m) => m.name),
        "المتوسط",
      ];

      console.log("Headers:", headers);

      // Table data with validation
      const tableData = reportData.items
        .filter((item) => {
          const isValid = item && item.name && item.consumptions;
          if (!isValid) {
            console.warn("Filtering out invalid item:", item);
          }
          return isValid;
        })
        .map((item) => {
          const row = [
            item.name || "غير محدد",
            ...item.consumptions.map((val) => (val || 0).toString()),
            (item.average || 0).toString(),
          ];
          console.log("Table row:", row);
          return row;
        });

      console.log("Table data:", tableData);

      // Check if we have valid data
      if (tableData.length === 0) {
        console.error("No valid table data after filtering");
        alert("لا توجد بيانات صالحة لإنشاء التقرير");
        return;
      }

      console.log("Generating table with autoTable...");

      // Generate table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: [75, 85, 99],
          halign: "center",
        },
        headStyles: {
          fillColor: [103, 58, 183],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didDrawPage: function (data) {
          // Add page numbers
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
      });

      console.log("Table generated successfully, saving PDF...");

      // Save PDF with Arabic filename
      const fileName = `تقرير_الاستهلاك_${new Date()
        .toLocaleDateString("ar-SA")
        .replace(/\//g, "-")}.pdf`;
      doc.save(fileName);

      // Show success message
      if (typeof window !== "undefined" && window.toast) {
        window.toast("تم تحميل التقرير بنجاح", "success");
      } else {
        alert("تم تحميل التقرير بنجاح");
      }

      console.log("PDF generation completed successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        reportData: reportData,
        items: items,
        itemsByMonth: itemsByMonth,
      });

      // Try fallback PDF generation
      try {
        console.log("Attempting fallback PDF generation...");
        const doc = new jsPDF("landscape", "mm", "a4");

        // Simple title
        doc.setFontSize(18);
        doc.setTextColor(103, 58, 183);
        doc.text("تقرير الاستهلاك", 148, 20, { align: "center" });

        // Simple date
        doc.setFontSize(12);
        doc.setTextColor(75, 85, 99);
        doc.text(
          `تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`,
          148,
          30,
          { align: "center" }
        );

        // Simple table with available data
        const simpleHeaders = ["اسم الصنف", "البيانات المتاحة"];
        const simpleData =
          items && items.length > 0
            ? items
                .slice(0, 10)
                .map((item) => [
                  item.name || "غير محدد",
                  "بيانات الاستهلاك غير متاحة",
                ])
            : [["لا توجد بيانات", "لا توجد بيانات"]];

        autoTable(doc, {
          head: [simpleHeaders],
          body: simpleData,
          startY: 40,
          styles: {
            fontSize: 10,
            cellPadding: 3,
            textColor: [75, 85, 99],
            halign: "center",
          },
          headStyles: {
            fillColor: [103, 58, 183],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
        });

        const fileName = `تقرير_الاستهلاك_مبسط_${new Date()
          .toLocaleDateString("ar-SA")
          .replace(/\//g, "-")}.pdf`;
        doc.save(fileName);

        alert("تم إنشاء تقرير مبسط. يرجى التحقق من البيانات.");
        console.log("Fallback PDF generated successfully");
      } catch (fallbackError) {
        console.error("Fallback PDF generation also failed:", fallbackError);
        alert("حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى.");
      }
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
              onClick={exportPDF}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>تصدير PDF</span>
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
