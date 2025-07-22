// src/components/CustomPageManager.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addCustomPage,
  getCustomPages,
  deleteCustomPage,
  updateCustomPage,
} from "../utils/firestoreService";

const CustomPageManager = ({ itemsByMonth, setItemsByMonth, monthKey }) => {
  const [customPages, setCustomPages] = useState([]);
  const [newPageName, setNewPageName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState("");
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingPageName, setEditingPageName] = useState("");

  useEffect(() => {
    getCustomPages().then(setCustomPages);
  }, []);

  const createCustomPage = async () => {
    if (!newPageName.trim()) return;
    if (customPages.some((p) => p.name === newPageName.trim())) return;
    setIsCreating(true);
    await addCustomPage({ name: newPageName.trim(), items: [] });
    setCustomPages(await getCustomPages());
    setNewPageName("");
    setIsCreating(false);
  };

  const sendToPage = async (pageName) => {
    const selectedItems = itemsByMonth[monthKey]?.filter(
      (item) => item.selected
    );
    if (!selectedItems || selectedItems.length === 0) {
      alert("لم يتم اختيار أي صنف.");
      return;
    }

    setIsSending(pageName);
    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setCustomPages((prev) =>
      prev.map((p) =>
        p.name === pageName
          ? {
              ...p,
              items: [
                ...p.items,
                ...selectedItems.map((item) => ({ ...item, selected: false })),
              ],
            }
          : p
      )
    );

    const updatedMonth = itemsByMonth[monthKey].map((item) => ({
      ...item,
      selected: false,
    }));
    setItemsByMonth({ ...itemsByMonth, [monthKey]: updatedMonth });
    setIsSending("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isCreating) {
      createCustomPage();
    }
  };

  const removeCustomPage = async (id) => {
    await deleteCustomPage(id);
    setCustomPages(await getCustomPages());
  };

  // Start editing a page name
  const startEditPageName = (id, currentName) => {
    setEditingPageId(id);
    setEditingPageName(currentName);
  };

  // Save edited page name
  const saveEditPageName = async (id) => {
    await updateCustomPage(id, { name: editingPageName });
    setCustomPages(await getCustomPages());
    setEditingPageId(null);
    setEditingPageName("");
  };

  // Update items in a custom page
  const updatePageItems = async (id, newItems) => {
    await updateCustomPage(id, { items: newItems });
    setCustomPages(await getCustomPages());
  };

  // Helper: get selected items for the current month
  const getSelectedItems = () => {
    return (itemsByMonth[monthKey] || []).filter((item) => item.selected);
  };

  // Add selected items to a custom page (no duplicates by name)
  const addSelectedToPage = async (page) => {
    const selected = getSelectedItems();
    if (!selected.length) return;
    // Avoid duplicates by name
    const existingNames = new Set((page.items || []).map((i) => i.name));
    const newItems = [
      ...(page.items || []),
      ...selected.filter((item) => !existingNames.has(item.name)),
    ];
    await updateCustomPage(page.id, { items: newItems });
    setCustomPages(await getCustomPages());
  };

  // Handle editing a daily value in a custom page's table
  const handleCustomPageValueChange = async (page, itemIdx, day, value) => {
    // Update in custom page
    const updatedItems = page.items.map((item, idx) =>
      idx === itemIdx
        ? {
            ...item,
            dailyDispense: { ...item.dailyDispense, [day]: Number(value) },
          }
        : item
    );
    await updateCustomPage(page.id, { items: updatedItems });
    setCustomPages(await getCustomPages());

    // Update in main itemsByMonth
    const mainItems = (itemsByMonth[monthKey] || []).map((item) =>
      item.name === page.items[itemIdx].name
        ? {
            ...item,
            dailyDispense: { ...item.dailyDispense, [day]: Number(value) },
          }
        : item
    );
    setItemsByMonth({ ...itemsByMonth, [monthKey]: mainItems });
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl mt-8 border-t-4 border-blue-200 dark:border-blue-700 font-[Cairo]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-300 tracking-wide leading-relaxed">
          📁 إنشاء صفحات مخصصة
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          إنشاء صفحات خاصة لتجميع الأصناف المحددة
        </p>
      </div>

      <div className="flex gap-4 mb-8 justify-center">
        <motion.input
          type="text"
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          onKeyPress={handleKeyPress}
          whileFocus={{ scale: 1.02 }}
          className="border-2 border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl w-80 text-lg focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500"
          placeholder="اسم الصفحة الجديدة"
          disabled={isCreating}
        />
        <motion.button
          onClick={createCustomPage}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          disabled={isCreating || !newPageName.trim()}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 font-bold flex items-center gap-3 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>جاري الإنشاء...</span>
            </>
          ) : (
            <>
              <span className="text-xl">➕</span>
              <span>إضافة صفحة</span>
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {customPages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {customPages.map((page) => (
              <div
                key={page.id}
                className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-6 py-4 shadow-md mt-2"
              >
                <div className="flex items-center gap-4">
                  {editingPageId === page.id ? (
                    <>
                      <input
                        type="text"
                        value={editingPageName}
                        onChange={(e) => setEditingPageName(e.target.value)}
                        className="border-2 border-blue-400 px-3 py-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                      />
                      <button
                        onClick={() => saveEditPageName(page.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold ml-2 hover:bg-blue-600"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => {
                          setEditingPageId(null);
                          setEditingPageName("");
                        }}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-400"
                      >
                        إلغاء
                      </button>
                      </>
                    ) : (
                      <>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-200">
                        {page.name}
                      </span>
                      <button
                        onClick={() => startEditPageName(page.id, page.name)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded-lg font-bold ml-2 hover:bg-yellow-500"
                      >
                        إعادة تسمية
                      </button>
                      <button
                        onClick={() => removeCustomPage(page.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-600"
                      >
                        حذف
                      </button>
                      </>
                    )}
                  <button
                    onClick={() => addSelectedToPage(page)}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-green-600"
                  >
                    إضافة الأصناف المحددة
                  </button>
                </div>
                {/* Table for this custom page's items */}
                {page.items && page.items.length > 0 && (
                  <div className="overflow-x-auto mt-4">
                    <table className="border-2 border-gray-300 dark:border-gray-600 text-base text-right font-[Cairo] font-sans w-max rounded-xl overflow-hidden relative">
                      <thead className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-gray-800 dark:text-gray-200 sticky top-0 z-10 shadow-md">
                        <tr>
                          <th className="p-4 border-b border-gray-300 dark:border-gray-600 font-bold text-lg">
                            🏷️ الصنف
                          </th>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (d) => (
                              <th
                                key={d}
                                className="p-4 border-b border-gray-300 dark:border-gray-600 font-bold text-lg"
                              >{`يوم ${d}`}</th>
                            )
                          )}
                          <th className="p-4 border-b border-gray-300 dark:border-gray-600 bg-green-50 dark:bg-green-900/20 font-bold text-lg">
                            📥 الافتتاحي + الوارد
                          </th>
                          <th className="p-4 border-b border-gray-300 dark:border-gray-600 bg-red-50 dark:bg-red-900/20 font-bold text-lg">
                            📤 المنصرف
                            </th>
                          <th className="p-4 border-b border-gray-300 dark:border-gray-600 bg-yellow-50 dark:bg-yellow-900/20 font-bold text-lg">
                            🟡 المتبقي
                            </th>
                          <th className="p-4 border-b border-gray-300 dark:border-gray-600 font-bold text-lg">
                            🗑️ حذف
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                        {page.items.map((item, idx) => {
                          // Calculate totals for this item
                          const days = Array.from(
                            { length: 31 },
                            (_, d) => d + 1
                          );
                          const totalDispensed = days.reduce(
                            (acc, d) => acc + (item.dailyDispense?.[d] || 0),
                            0
                          );
                          const totalIncoming = days.reduce(
                            (acc, d) => acc + (item.dailyIncoming?.[d] || 0),
                            0
                          );
                          const overallStock =
                            (item.opening || 0) + totalIncoming;
                          const remaining = overallStock - totalDispensed;
                          return (
                            <tr key={item.name}>
                              <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                                {item.name}
                              </td>
                              {days.map((day) => (
                                <td
                                  key={day}
                                  className="p-2 border-b border-gray-200 dark:border-gray-600"
                                >
                                  <input
                                    type="number"
                                    value={item.dailyDispense?.[day] || ""}
                                    onChange={(e) =>
                                      handleCustomPageValueChange(
                                        page,
                                        idx,
                                        day,
                                        e.target.value
                                      )
                                    }
                                    className="w-16 text-center px-2 py-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500"
                                  />
                                </td>
                              ))}
                              <td className="p-4 border-b border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                                {overallStock}
                              </td>
                              <td className="p-4 border-b border-gray-200 dark:border-gray-600 bg-red-50 dark:bg-red-900/20">
                                {totalDispensed}
                              </td>
                              <td className="p-4 border-b border-gray-200 dark:border-gray-600 bg-yellow-50 dark:bg-yellow-900/20">
                                {remaining}
                              </td>
                              <td className="p-4 border-b border-gray-200 dark:border-gray-600 text-center">
                                <button
                                  onClick={async () => {
                                    // Remove item from custom page
                                    const newItems = page.items.filter(
                                      (_, i) => i !== idx
                                    );
                                    await updateCustomPage(page.id, {
                                      items: newItems,
                                    });
                                    setCustomPages(await getCustomPages());
                                  }}
                                  className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-600"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {customPages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
            لا توجد صفحات مخصصة
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            ابدأ بإنشاء صفحة مخصصة جديدة
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CustomPageManager;
