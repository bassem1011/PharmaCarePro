// src/components/DailyDispenseTable.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
const ConfirmDeleteModal = ({ onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
    onClick={onCancel}
  >
    <div
      className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-4 border-red-400 dark:border-red-600 font-[Cairo]"
      onClick={(e) => e.stopPropagation()}
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
    </div>
  </div>
);

const DailyDispenseTable = ({
  items,
  updateItem,
  addItem,
  deleteItem,
  month,
  year,
}) => {
  const [deleteIndex, setDeleteIndex] = useState(null);
  const confirmDelete = (index) => setDeleteIndex(index);
  const cancelDelete = () => setDeleteIndex(null);
  const handleConfirmDelete = () => {
    deleteItem(deleteIndex);
    setDeleteIndex(null);
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
  const handleValueChange = (index, day, value) => {
    const item = items[index];
    const updatedDispense = { ...item.dailyDispense, [day]: Number(value) };
    updateItem(index, { dailyDispense: updatedDispense });
  };
  const getTotal = (item) =>
    days.reduce((acc, d) => acc + (item.dailyDispense?.[d] || 0), 0);
  const getTotalIncoming = (item) =>
    days.reduce((acc, d) => acc + (item.dailyIncoming?.[d] || 0), 0);

  // Add page number to each item if not present
  React.useEffect(() => {
    items.forEach((item, idx) => {
      if (item.pageNumber === undefined) {
        updateItem(idx, { ...item, pageNumber: "" });
      }
    });
    // eslint-disable-next-line
  }, [items]);

  return (
    <div className="relative w-full">
      {deleteIndex !== null && (
        <ConfirmDeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}
      <div
        className="overflow-x-auto w-full"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table
          className="border-2 border-gray-300 text-base text-right font-[Cairo] font-sans w-max rounded-xl overflow-hidden relative bg-white"
          style={{
            minWidth: `${(days.length + 10) * 120}px`,
            width: "max-content",
          }}
        >
          <thead className="bg-gradient-to-r from-blue-100 to-blue-200 text-gray-800 sticky top-0 z-10 shadow-md">
            <tr>
              <th className="p-4 border-b border-gray-300 font-bold text-lg text-gray-800">
                ✔️
              </th>
              <th
                className="p-4 border-b border-gray-300 min-w-[80px] font-bold text-lg text-gray-800"
                title="رقم الصفحة"
              >
                #️⃣ رقم الصفحة
              </th>
              <th
                className="p-4 border-b border-gray-300 min-w-[200px] font-bold text-lg sticky right-0 bg-gradient-to-r from-blue-100 to-blue-200 z-40 border-l-2 border-blue-300 text-gray-800"
                title="اسم الصنف"
              >
                🏷️ الصنف
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className="p-4 border-b border-gray-300 font-bold text-lg text-gray-800"
                  title={`اليوم ${d}`}
                >{`يوم ${d}`}</th>
              ))}
              <th
                className="p-4 border-b border-gray-300 bg-green-50 font-bold text-lg text-gray-800"
                title="الافتتاحي + الوارد"
              >
                📥 الافتتاحي + الوارد
              </th>
              <th
                className="p-4 border-b border-gray-300 bg-red-50 font-bold text-lg text-gray-800"
                title="المنصرف"
              >
                📤 المنصرف
              </th>
              <th
                className="p-4 border-b border-gray-300 bg-yellow-50 font-bold text-lg text-gray-800"
                title="المتبقي"
              >
                🟡 المتبقي
              </th>
              <th className="p-4 border-b border-gray-300 font-bold text-lg text-gray-800">
                🗑️ حذف
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const totalDispensed = getTotal(item);
              const totalIncoming = getTotalIncoming(item);
              const overallStock = item.opening + totalIncoming;
              const remaining = overallStock - totalDispensed;

              return (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="p-4 border-b border-gray-200 text-center bg-white text-gray-800">
                    <input
                      type="checkbox"
                      checked={item.selected || false}
                      onChange={(e) =>
                        updateItem(idx, { selected: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 focus:border-blue-500 text-gray-800"
                    />
                  </td>
                  <td className="p-4 border-b border-gray-200 min-w-[80px] bg-white text-gray-800">
                    <input
                      type="text"
                      value={item.pageNumber || ""}
                      onChange={(e) =>
                        updateItem(idx, { pageNumber: e.target.value })
                      }
                      className="w-full border-2 border-gray-300 px-3 py-2 rounded-lg text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-gray-800"
                    />
                  </td>
                  <td className="p-4 border-b border-gray-200 min-w-[200px] sticky right-0 bg-white z-30 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] text-gray-800">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(idx, { name: e.target.value })
                      }
                      className="w-full border-2 border-gray-300 px-3 py-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-gray-800"
                    />
                  </td>
                  {days.map((d) => (
                    <td
                      key={d}
                      className="p-3 border-b border-gray-200 bg-white text-gray-800"
                    >
                      <input
                        type="number"
                        value={item.dailyDispense?.[d] || ""}
                        onChange={(e) =>
                          handleValueChange(idx, d, e.target.value)
                        }
                        className="w-28 text-center px-3 py-2 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-gray-800"
                      />
                    </td>
                  ))}
                  <td className="p-4 border-b border-gray-200 bg-green-50 font-bold text-green-800 text-gray-800">
                    {overallStock}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-red-50 font-bold text-red-700 text-gray-800">
                    {totalDispensed}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-yellow-50 font-bold text-yellow-800 text-gray-800">
                    {remaining}
                  </td>
                  <td className="p-4 border-b border-gray-200 bg-white text-gray-800">
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => confirmDelete(idx)}
                      className="text-red-600 hover:text-red-800 font-bold p-2 rounded-lg hover:bg-red-100 transition-all duration-200 text-gray-800"
                      title="حذف هذا الصنف"
                    >
                      🗑️
                    </motion.button>
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
          <div className="text-6xl mb-4">📤</div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            لا توجد بيانات للعرض
          </h3>
          <p className="text-gray-500">
            أضف بيانات في الجداول أعلاه لعرض المنصرف اليومي
          </p>
        </motion.div>
      )}

      <motion.button
        whileHover={{
          scale: 1.05,
          boxShadow: "0 8px 32px rgba(34, 197, 94, 0.3)",
        }}
        whileTap={{ scale: 0.95 }}
        onClick={addItem}
        className="mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg font-bold flex items-center gap-3"
      >
        <span className="text-xl">➕</span>
        <span>إضافة صنف جديد</span>
        <motion.div
          className="w-2 h-2 bg-white rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    </div>
  );
};
export default DailyDispenseTable;
