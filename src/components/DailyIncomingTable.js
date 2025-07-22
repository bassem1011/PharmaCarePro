// ✅ src/components/DailyIncomingTable.jsx (updated with weekly totals and incoming source)
import React from "react";
import { motion } from "framer-motion";

const DailyIncomingTable = ({ items, updateItem, month, year }) => {
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

  const handleIncomingChange = (index, day, value, source = "") => {
    const item = items[index];
    const updatedIncoming = { ...item.dailyIncoming, [day]: Number(value) };
    const updatedSource = { ...item.incomingSource, [day]: source };
    updateItem(index, {
      dailyIncoming: updatedIncoming,
      incomingSource: updatedSource,
    });
  };

  const getTotal = (item) =>
    days.reduce((acc, day) => acc + (item.dailyIncoming?.[day] || 0), 0);

  return (
    <div className="relative w-full">
      <div
        className="overflow-x-auto w-full"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table
          className="border-2 border-gray-300 text-base text-right font-[Cairo] font-sans w-max rounded-xl overflow-hidden relative bg-white"
          style={{
            minWidth: `${(days.length + 3) * 120}px`,
            width: "max-content",
          }}
        >
          <thead className="bg-gradient-to-r from-green-100 to-green-200 text-gray-800 sticky top-0 z-10 shadow-md">
            <tr>
              <th className="p-4 border-b border-gray-300 min-w-[200px] font-bold sticky right-0 bg-gradient-to-r from-green-100 to-green-200 z-40 border-l-2 border-green-300 text-gray-800">
                🏷️ الصنف
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className="p-4 border-b border-gray-300 font-bold text-gray-800"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{`يوم ${d}`}</span>
                    <span className="text-xs text-gray-500">📥 + مصدر</span>
                  </div>
                </th>
              ))}
              <th className="p-4 border-b border-gray-300 bg-green-50 font-bold text-green-800">
                📥 إجمالي الوارد
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="odd:bg-white even:bg-gray-50 hover:bg-green-50 transition-colors duration-150"
              >
                <td className="p-4 border-b border-gray-200 min-w-[200px] sticky right-0 bg-white z-30 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] text-gray-800">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500 transition-all duration-200"
                  />
                </td>
                {days.map((d) => (
                  <td
                    key={d}
                    className="p-3 border-b border-gray-200 text-gray-800"
                  >
                    <div className="flex flex-col gap-2">
                      <input
                        type="number"
                        value={item.dailyIncoming?.[d] || ""}
                        onChange={(e) =>
                          handleIncomingChange(
                            idx,
                            d,
                            e.target.value,
                            item.incomingSource?.[d] || ""
                          )
                        }
                        className="w-28 text-center px-3 py-2 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-400 focus:border-green-500 transition-all duration-200 hover:border-green-400"
                      />
                      <div className="relative">
                        <select
                          value={item.incomingSource?.[d] || ""}
                          onChange={(e) =>
                            handleIncomingChange(
                              idx,
                              d,
                              item.dailyIncoming?.[d] || 0,
                              e.target.value
                            )
                          }
                          className="w-28 text-center px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-500 transition-all duration-200 hover:border-green-400"
                        >
                          <option value="">اختر المصدر</option>
                          <option value="مصنع" className="text-green-600">
                            🏭 مصنع
                          </option>
                          <option value="هيئة شراء" className="text-blue-600">
                            🏛️ هيئة شراء
                          </option>
                          <option value="مقصه" className="text-orange-600">
                            ✂️ مقصه
                          </option>
                        </select>
                        {item.incomingSource?.[d] && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
                <td className="p-4 border-b border-gray-200 bg-green-50 font-bold text-green-800">
                  {getTotal(item)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📥</div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            لا توجد بيانات للعرض
          </h3>
          <p className="text-gray-500">
            أضف بيانات في الجداول أعلاه لعرض الوارد اليومي
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default DailyIncomingTable;
