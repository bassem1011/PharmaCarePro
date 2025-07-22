// ✅ src/components/StockStatusTable.jsx
import React from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const StockStatusTable = ({ items, updateItem, month, year }) => {
  const getTotal = (obj = {}) =>
    Object.values(obj).reduce((acc, val) => acc + Number(val || 0), 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "الصنف",
      "الرصيد الافتتاحي",
      "وارد من مصنع",
      "هيئة شراء",
      "مقصه",
      "إجمالي الوارد",
      "إجمالي المنصرف",
      "الرصيد الحالي",
      "سعر الوحدة",
      "القيمة المتبقية",
    ];
    const tableRows = items.map((item) => [
      item.name,
      item.opening,
      item.dailyIncoming?.factory || 0,
      item.dailyIncoming?.authority || 0,
      item.dailyIncoming?.maqsa || 0,
      Object.values(item.dailyIncoming || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      ),
      Object.values(item.dailyDispense || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      ),
      (item.opening || 0) +
        Object.values(item.dailyIncoming || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        ) -
        Object.values(item.dailyDispense || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        ),
      item.unitPrice,
      ((item.opening || 0) +
        Object.values(item.dailyIncoming || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        ) -
        Object.values(item.dailyDispense || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        )) *
        (item.unitPrice || 0),
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows });
    doc.save(`monthly_stock_${month + 1}_${year}.pdf`);
  };

  return (
    <div className="relative w-full">
      <button
        onClick={exportPDF}
        className="mb-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
      >
        تصدير PDF
      </button>
      <div
        className="overflow-x-auto"
        dir="rtl"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Remove the table title <h2> here */}
        {/* Use month and year props for future filtering if needed */}
        <table className="min-w-[1600px] w-max table-auto border-2 border-gray-300 text-base text-right font-[Cairo] rounded-xl overflow-hidden relative bg-white">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0 z-10 shadow-md text-gray-800">
            <tr>
              <th
                className="p-4 border-b border-gray-300 min-w-[200px] font-bold text-gray-800 sticky right-0 bg-gradient-to-r from-blue-100 to-blue-200 z-40 border-l-2 border-blue-300"
                title="اسم الصنف"
              >
                🏷️ الصنف
              </th>
              <th
                className="p-4 border-b border-gray-300 font-bold text-gray-800"
                title="الرصيد الافتتاحي"
              >
                🔢 الرصيد الافتتاحي
              </th>
              <th
                className="p-4 border-b border-gray-300 bg-green-100"
                title="وارد من مصنع"
              >
                🏭 مصنع
              </th>
              <th
                className="p-4 border-b border-gray-300 bg-blue-100"
                title="وارد من هيئة شراء"
              >
                🏛️ هيئة شراء
              </th>
              <th
                className="p-4 border-b border-gray-300 bg-orange-100"
                title="وارد من مقصه"
              >
                ✂️ مقصه
              </th>
              <th
                className="p-4 border-b border-gray-300"
                title="إجمالي الوارد"
              >
                📥 إجمالي الوارد
              </th>
              <th
                className="p-4 border-b border-gray-300"
                title="إجمالي المنصرف"
              >
                📤 إجمالي المنصرف
              </th>
              <th
                className="p-4 border-b border-gray-300"
                title="الرصيد الحالي"
              >
                🟢 الرصيد الحالي
              </th>
              <th className="p-4 border-b border-gray-300" title="سعر الوحدة">
                💵 سعر الوحدة
              </th>
              <th
                className="p-4 border-b border-gray-300"
                title="القيمة المتبقية"
              >
                💰 القيمة المتبقية
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const totalIncoming = getTotal(item.dailyIncoming);
              const totalDispensed = getTotal(item.dailyDispense);

              // Calculate incoming by source
              const incomingBySource = {
                مصنع: 0,
                "هيئة شراء": 0,
                مقصه: 0,
              };

              Object.entries(item.dailyIncoming || {}).forEach(
                ([day, amount]) => {
                  const source = item.incomingSource?.[day] || "";
                  if (source && incomingBySource[source] !== undefined) {
                    incomingBySource[source] += amount;
                  }
                }
              );

              const currentStock =
                item.opening + totalIncoming - totalDispensed;
              const remainingValue = currentStock * item.unitPrice;

              return (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="p-4 border-b border-gray-200 bg-white sticky right-0 z-30 shadow-[-4px_0_8px_rgba(0,0,0,0.1)]">
                    {item.name}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-white">
                    <input
                      type="number"
                      value={item.opening}
                      onChange={(e) =>
                        updateItem(idx, { opening: Number(e.target.value) })
                      }
                      className="w-24 text-center px-3 py-2 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                    />
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-green-50 text-green-700 font-semibold">
                    {incomingBySource.مصنع}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-blue-50 text-blue-700 font-semibold">
                    {incomingBySource["هيئة شراء"]}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-orange-50 text-orange-700 font-semibold">
                    {incomingBySource.مقصه}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-white font-bold">
                    {totalIncoming}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-white">
                    {totalDispensed}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-yellow-50 text-yellow-800 font-bold">
                    {currentStock}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-white">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(idx, { unitPrice: Number(e.target.value) })
                      }
                      className="w-24 text-center px-3 py-2 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                    />
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-green-50 text-green-800 font-bold">
                    {remainingValue.toFixed(2)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            لا توجد بيانات للعرض
          </h3>
          <p className="text-gray-500">
            أضف بيانات في الجداول أعلاه لعرض المخزون الحالي
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StockStatusTable;
