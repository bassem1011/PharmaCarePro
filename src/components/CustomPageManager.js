// src/components/CustomPageManager.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addCustomPage,
  deleteCustomPage,
  updateCustomPage,
} from "../utils/firestoreService";
import { useToast } from "../App";
import {
  Plus,
  Edit,
  Trash2,
  Send,
  FileText,
  Calendar,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { getAuth } from "firebase/auth";
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../utils/firebase";

const CustomPageManager = ({
  itemsByMonth,
  setItemsByMonth,
  monthKey,
  month,
  year,
  setMonth,
  setYear,
  handleMonthYearChange,
  pharmacyId,
  pharmacySettings,
}) => {
  const toast = useToast();
  const [customPages, setCustomPages] = useState([]);
  const [newPageName, setNewPageName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  // const [isSending, setIsSending] = useState("");
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingPageName, setEditingPageName] = useState("");
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    month || new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    year || new Date().getFullYear()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, dispensed, incoming, stock
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [selectedPageForItems, setSelectedPageForItems] = useState(null);
  const [expandedPages, setExpandedPages] = useState(new Set()); // Track which pages are expanded

  // Memoized calculations to avoid repeated computations
  const memoizedCalculations = useMemo(() => {
    if (!customPages || !Array.isArray(customPages)) {
      return {
        totalPages: 0,
        selectedItems: 0,
        totalItems: 0,
        activePages: 0,
      };
    }

    const totalPages = customPages.length;
    const totalItems = customPages.reduce(
      (sum, page) => sum + (page.items?.length || 0),
      0
    );
    const activePages = customPages.filter(
      (page) => page.items && page.items.length > 0
    ).length;

    return {
      totalPages,
      selectedItems: 0, // This will be calculated dynamically based on selection
      totalItems,
      activePages,
    };
  }, [customPages]);

  useEffect(() => {
    let cleanup = null;

    const setupRealTimeListeners = async () => {
      try {
        // Get current user for multi-tenancy
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          // Check if user is logged in via localStorage (regular/senior pharmacist)
          const pharmaUser = localStorage.getItem("pharmaUser");
          if (pharmaUser) {
            try {
              const parsedUser = JSON.parse(pharmaUser);
              if (parsedUser && parsedUser.username && parsedUser.role) {
                // For senior pharmacists, they can only see custom pages for their assigned pharmacy
                if (
                  parsedUser.role === "senior" &&
                  parsedUser.assignedPharmacy
                ) {
                  // Get the pharmacy owner ID
                  const pharmacyDoc = await getDoc(
                    doc(db, "pharmacies", parsedUser.assignedPharmacy)
                  );
                  if (pharmacyDoc.exists()) {
                    const ownerId = pharmacyDoc.data().ownerId;

                    // Subscribe to custom pages owned by the pharmacy owner
                    // Include both pharmacy-specific pages and legacy pages without pharmacyId
                    const customPagesQuery = query(
                      collection(db, "customPages"),
                      where("ownerId", "==", ownerId)
                    );
                    cleanup = onSnapshot(customPagesQuery, (pagesSnap) => {
                      const pagesData = pagesSnap.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                      }));
                      // Filter pages to show only those for current pharmacy or legacy pages

                      const filteredPages = pagesData.filter((page) => {
                        const isLegacy = !page.pharmacyId;
                        const isCurrentPharmacy =
                          page.pharmacyId === pharmacyId;
                        const shouldShow = isLegacy || isCurrentPharmacy;

                        return shouldShow;
                      });
                      setCustomPages(filteredPages);
                    });
                  }
                }
              }
            } catch (error) {
              console.error("Error parsing pharmaUser:", error);
            }
          }
          return;
        }

        // For lead pharmacists (Firebase Auth users)
        // Subscribe to custom pages owned by current user
        // Include both pharmacy-specific pages and legacy pages without pharmacyId
        const customPagesQuery = query(
          collection(db, "customPages"),
          where("ownerId", "==", currentUser.uid)
        );
        cleanup = onSnapshot(customPagesQuery, (pagesSnap) => {
          const pagesData = pagesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Filter pages to show only those for current pharmacy or legacy pages

          const filteredPages = pagesData.filter((page) => {
            const isLegacy = !page.pharmacyId;
            const isCurrentPharmacy = page.pharmacyId === pharmacyId;
            const shouldShow = isLegacy || isCurrentPharmacy;

            return shouldShow;
          });
          setCustomPages(filteredPages);
        });
      } catch (error) {
        console.error("Error setting up real-time listeners:", error);
      }
    };

    setupRealTimeListeners();

    return () => {
      if (cleanup) cleanup();
    };
  }, [pharmacyId]);

  // Get current month's items
  const currentItems = itemsByMonth[monthKey] || [];

  // Filter items based on search and filter
  const filteredItems = currentItems.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      (filterType === "dispensed" &&
        Object.keys(item.dailyDispense || {}).length > 0) ||
      (filterType === "incoming" &&
        Object.keys(item.dailyIncoming || {}).length > 0) ||
      (filterType === "stock" &&
        // Show all items with stock data, including zero stock items
        (item.opening >= 0 ||
          Object.keys(item.dailyIncoming || {}).length > 0));

    return matchesSearch && matchesFilter;
  });

  const createCustomPage = async () => {
    if (!newPageName.trim()) return;
    if (customPages.some((p) => p.name === newPageName.trim())) {
      toast("اسم الصفحة موجود بالفعل!", "error");
      return;
    }
    setIsCreating(true);
    await addCustomPage({
      name: newPageName.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      monthKey: monthKey,
      month: month,
      year: year,
      pharmacyId: pharmacyId, // Associate with current pharmacy
    });
    setNewPageName("");
    setIsCreating(false);
    toast("تم إنشاء الصفحة بنجاح!", "success");
  };

  // Enhanced function to add items to a custom page
  const addItemsToPage = async (page, itemsToAdd) => {
    if (!itemsToAdd || itemsToAdd.length === 0) {
      toast("لم يتم اختيار أي صنف.", "error");
      return;
    }

    // setIsSending(page.name);

    // Get existing items in the page
    const existingItems = page.items || [];
    const existingNames = new Set(existingItems.map((item) => item.name));

    // Add new items (avoid duplicates by name)
    const newItems = [
      ...existingItems,
      ...itemsToAdd.filter((item) => !existingNames.has(item.name)),
    ];

    await updateCustomPage(page.id, {
      items: newItems,
      lastUpdated: new Date().toISOString(),
    });
    // Optimistically update local state; real-time snapshot will reconcile
    setCustomPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, items: newItems } : p))
    );
    // Keep modal page in sync to avoid flicker
    setSelectedPageForItems((prev) =>
      prev && prev.id === page.id ? { ...prev, items: newItems } : prev
    );
    // setIsSending("");
    toast(`تم إضافة ${itemsToAdd.length} صنف إلى الصفحة بنجاح!`, "success");
  };

  // Sync custom page items with main inventory
  const syncPageWithInventory = async (page) => {
    const updatedItems = page.items.map((pageItem) => {
      const mainItem = currentItems.find((item) => item.name === pageItem.name);
      if (mainItem) {
        return {
          ...pageItem,
          dailyDispense: mainItem.dailyDispense || {},
          dailyIncoming: mainItem.dailyIncoming || {},
          opening: mainItem.opening || 0,
          unitPrice: mainItem.unitPrice || 0,
        };
      }
      return pageItem;
    });

    await updateCustomPage(page.id, {
      items: updatedItems,
      lastSynced: new Date().toISOString(),
    });
    // Optimistically update local state; real-time snapshot will reconcile
    setCustomPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, items: updatedItems } : p))
    );
    toast("تم مزامنة الصفحة مع المخزون الرئيسي!", "success");
  };

  // Update item in both custom page and main inventory
  const updateItemInBoth = async (page, itemIndex, field, value) => {
    const pageItem = page.items[itemIndex];

    // Update in custom page
    const updatedPageItems = page.items.map((item, idx) =>
      idx === itemIndex ? { ...item, [field]: value } : item
    );

    await updateCustomPage(page.id, {
      items: updatedPageItems,
      lastUpdated: new Date().toISOString(),
    });

    // Update in main inventory
    const mainItemIndex = currentItems.findIndex(
      (item) => item.name === pageItem.name
    );
    if (mainItemIndex !== -1) {
      const updatedMainItems = [...currentItems];
      updatedMainItems[mainItemIndex] = {
        ...updatedMainItems[mainItemIndex],
        [field]: value,
      };
      setItemsByMonth({ ...itemsByMonth, [monthKey]: updatedMainItems });
    }

    // Optimistically update local state; real-time snapshot will reconcile
    setCustomPages((prev) =>
      prev.map((p) =>
        p.id === page.id ? { ...p, items: updatedPageItems } : p
      )
    );
    toast("تم تحديث الصنف في الصفحة والمخزون الرئيسي!", "success");
  };

  // Locally update daily dispense for smoother typing; commit on blur
  const handleDispenseChange = (pageId, itemIndex, dayNumber, newValue) => {
    setCustomPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p;
        const nextItems = p.items.map((it, idx) => {
          if (idx !== itemIndex) return it;
          return {
            ...it,
            dailyDispense: {
              ...(it.dailyDispense || {}),
              [dayNumber]: newValue,
            },
          };
        });
        return { ...p, items: nextItems };
      })
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isCreating) {
      createCustomPage();
    }
  };

  const removeCustomPage = async (id) => {
    await deleteCustomPage(id);
    toast("تم حذف الصفحة بنجاح!", "success");
  };

  const startEditPageName = (id, currentName) => {
    setEditingPageId(id);
    setEditingPageName(currentName);
  };

  const saveEditPageName = async (id) => {
    await updateCustomPage(id, { name: editingPageName });
    setEditingPageId(null);
    setEditingPageName("");
    toast("تم تحديث اسم الصفحة!", "success");
  };

  // Helper: get selected items for the current month
  // const getSelectedItems = () => {
  //   return customPages.flatMap((page) => page.items || []);
  // };

  // Toggle page expansion
  const togglePageExpansion = (pageId) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  // Check if page is expanded
  const isPageExpanded = (pageId) => expandedPages.has(pageId);

  const MonthYearModal = () => (
    <AnimatePresence>
      {showMonthYearModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowMonthYearModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-950 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-fuchsia-700/50"
            dir="rtl"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                تحديد الشهر والسنة
              </h3>
              <p className="text-gray-400">اختر الشهر والسنة لعرض البيانات</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2">الشهر</label>
                <select
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2024, i).toLocaleString("ar-EG", {
                        month: "long",
                      })}{" "}
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-bold mb-2">السنة</label>
                <select
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={2020 + i}>
                      {2020 + i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMonthYearModal(false)}
                className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all duration-200"
              >
                إلغاء
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (handleMonthYearChange) {
                    handleMonthYearChange(selectedMonth, selectedYear);
                  } else {
                    setMonth(selectedMonth);
                    setYear(selectedYear);
                  }
                  setShowMonthYearModal(false);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold transition-all duration-200"
              >
                تأكيد
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Add Items Modal
  const AddItemsModal = () => (
    <AnimatePresence>
      {showAddItemsModal && selectedPageForItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowAddItemsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                إضافة أصناف إلى: {selectedPageForItems.name}
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddItemsModal(false)}
                className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث في الأصناف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500"
              >
                <option value="all">جميع الأصناف</option>
                <option value="dispensed">المنصرف فقط</option>
                <option value="incoming">الوارد فقط</option>
                <option value="stock">المخزون فقط</option>
              </select>
            </div>

            {/* Items List */}
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item, index) => {
                  const isInPage = selectedPageForItems.items.some(
                    (pageItem) => pageItem.name === item.name
                  );
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        isInPage
                          ? "bg-green-50 border-green-300"
                          : "bg-gray-50 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                        {isInPage && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>الافتتاحي: {Math.floor(item.opening || 0)}</div>
                        <div>
                          إجمالي الوارد:{" "}
                          {Math.floor(
                            Object.values(item.dailyIncoming || {}).reduce(
                              (sum, val) => sum + (Number(val) || 0),
                              0
                            )
                          )}
                        </div>
                        <div>
                          إجمالي المنصرف:{" "}
                          {Math.floor(
                            Object.values(item.dailyDispense || {}).reduce(
                              (sum, val) => {
                                // Use simple calculation for pharmacies without the feature
                                if (
                                  !pharmacySettings?.enableDispenseCategories
                                ) {
                                  const num = Number(val);
                                  return sum + (isNaN(num) ? 0 : num);
                                }

                                // Use advanced calculation for pharmacies with the feature
                                if (
                                  typeof val === "object" &&
                                  val.patient !== undefined
                                ) {
                                  // New structure: { patient: 5, scissors: 3 }
                                  const patientNum = Number(val.patient);
                                  const scissorsNum = Number(val.scissors);
                                  return (
                                    sum +
                                    (isNaN(patientNum) ? 0 : patientNum) +
                                    (isNaN(scissorsNum) ? 0 : scissorsNum)
                                  );
                                } else if (
                                  typeof val === "object" &&
                                  val.quantity !== undefined
                                ) {
                                  // Old structure: { quantity: 5, category: "patient" }
                                  const num = Number(val.quantity);
                                  return sum + (isNaN(num) ? 0 : num);
                                } else {
                                  // Simple structure: 5
                                  const num = Number(val);
                                  return sum + (isNaN(num) ? 0 : num);
                                }
                              },
                              0
                            )
                          )}
                        </div>
                        <div className="font-semibold text-blue-600">
                          الرصيد المتبقي:{" "}
                          {(() => {
                            const opening = Math.floor(
                              Number(item.opening || 0)
                            );
                            const totalIncoming = Math.floor(
                              Object.values(item.dailyIncoming || {}).reduce(
                                (sum, val) => sum + (Number(val) || 0),
                                0
                              )
                            );
                            const totalDispensed = Math.floor(
                              Object.values(item.dailyDispense || {}).reduce(
                                (sum, val) => {
                                  // Use simple calculation for pharmacies without the feature
                                  if (
                                    !pharmacySettings?.enableDispenseCategories
                                  ) {
                                    const num = Number(val);
                                    return sum + (isNaN(num) ? 0 : num);
                                  }

                                  // Use advanced calculation for pharmacies with the feature
                                  if (
                                    typeof val === "object" &&
                                    val.patient !== undefined
                                  ) {
                                    // New structure: { patient: 5, scissors: 3 }
                                    const patientNum = Number(val.patient);
                                    const scissorsNum = Number(val.scissors);
                                    return (
                                      sum +
                                      (isNaN(patientNum) ? 0 : patientNum) +
                                      (isNaN(scissorsNum) ? 0 : scissorsNum)
                                    );
                                  } else if (
                                    typeof val === "object" &&
                                    val.quantity !== undefined
                                  ) {
                                    // Old structure: { quantity: 5, category: "patient" }
                                    const num = Number(val.quantity);
                                    return sum + (isNaN(num) ? 0 : num);
                                  } else {
                                    // Simple structure: 5
                                    const num = Number(val);
                                    return sum + (isNaN(num) ? 0 : num);
                                  }
                                },
                                0
                              )
                            );
                            return opening + totalIncoming - totalDispensed;
                          })()}
                        </div>
                        <div>
                          المنصرف:{" "}
                          {Object.keys(item.dailyDispense || {}).length} يوم
                        </div>
                        <div>
                          الوارد: {Object.keys(item.dailyIncoming || {}).length}{" "}
                          يوم
                        </div>
                      </div>
                      {!isInPage && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            addItemsToPage(selectedPageForItems, [item])
                          }
                          className="mt-3 w-full px-3 py-2 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-600 transition-colors"
                        >
                          إضافة للصفحة
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddItemsModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                إغلاق
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">إدارة الصفحات المخصصة</h2>
              <p className="text-indigo-100 mt-1">
                إنشاء وإدارة صفحات مخصصة للأصناف مع عرض تفصيلي للبيانات وتعديل
                المنصرف اليومي
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMonthYearModal(true)}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all duration-300 shadow-lg flex items-center gap-2 border border-white/30"
            >
              <Calendar className="w-5 h-5" />
              <span>تغيير الشهر/السنة</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">إجمالي الصفحات</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalPages}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
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
              <p className="text-green-100 text-sm">الأصناف المتاحة</p>
              <p className="text-3xl font-bold">{currentItems.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle className="w-6 h-6" />
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
              <p className="text-purple-100 text-sm">
                إجمالي الأصناف في الصفحات
              </p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.totalItems}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">الصفحات النشطة</p>
              <p className="text-3xl font-bold">
                {memoizedCalculations.activePages}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Send className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-blue-800 mb-2">
              كيفية استخدام الصفحات المخصصة
            </h4>
            <div className="text-blue-700 space-y-1 text-sm">
              <p>
                • <strong>إنشاء صفحة:</strong> قم بإنشاء صفحة مخصصة لتجميع
                الأصناف المفضلة
              </p>
              <p>
                • <strong>إضافة أصناف:</strong> اختر الأصناف من المخزون الرئيسي
                وأضفها للصفحة
              </p>
              <p>
                • <strong>تعديل المنصرف:</strong> يمكنك تعديل قيم المنصرف اليومي
                لجميع أيام الشهر (أرقام صحيحة فقط)
              </p>
              <p>
                • <strong>حذف الأصناف:</strong> يمكنك حذف الأصناف من الصفحة
                المخصصة
              </p>
              <p>
                • <strong>المزامنة:</strong> استخدم زر "مزامنة" لتحديث البيانات
                من المخزون الرئيسي
              </p>
              <p>
                • <strong>البيانات المعروضة:</strong> الافتتاحي، إجمالي الوارد،
                إجمالي المنصرف، الرصيد المتبقي
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create New Page Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">إنشاء صفحة جديدة</h3>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اسم الصفحة الجديدة"
            className="flex-1 border-2 border-gray-300 px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createCustomPage}
            disabled={isCreating || !newPageName.trim()}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span>{isCreating ? "جاري الإنشاء..." : "إنشاء صفحة"}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Custom Pages List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          الصفحات المخصصة
        </h3>
        <AnimatePresence>
          {customPages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              {/* Page Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    {editingPageId === page.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingPageName}
                          onChange={(e) => setEditingPageName(e.target.value)}
                          className="border-2 border-indigo-300 px-3 py-1 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => saveEditPageName(page.id)}
                          className="p-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-gray-800">
                          {page.name}
                        </h4>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startEditPageName(page.id, page.name)}
                          className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                      {page.items?.length || 0} صنف
                    </span>
                    {page.lastSynced && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        محدث
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle Items Button */}
                    {page.items && page.items.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => togglePageExpansion(page.id)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
                      >
                        {isPageExpanded(page.id) ? (
                          <>
                            <X className="w-4 h-4" />
                            <span>إخفاء الأصناف</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" />
                            <span>عرض الأصناف ({page.items.length})</span>
                          </>
                        )}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedPageForItems(page);
                        setShowAddItemsModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة أصناف</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => syncPageWithInventory(page)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>مزامنة</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => removeCustomPage(page.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Page Items - Collapsible */}
              <AnimatePresence>
                {page.items &&
                  page.items.length > 0 &&
                  isPageExpanded(page.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {page.items.map((item, itemIdx) => (
                            <motion.div
                              key={itemIdx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: itemIdx * 0.05 }}
                              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-bold text-gray-800">
                                  {item.name}
                                </h5>
                                <span className="text-sm text-gray-500">
                                  #{itemIdx + 1}
                                </span>
                              </div>

                              {/* Item Details */}
                              <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    الافتتاحي:
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {Math.floor(item.opening || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    إجمالي الوارد:
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {Math.floor(
                                      Object.values(
                                        item.dailyIncoming || {}
                                      ).reduce(
                                        (sum, val) => sum + (Number(val) || 0),
                                        0
                                      )
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    إجمالي المنصرف:
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {Math.floor(
                                      Object.values(
                                        item.dailyDispense || {}
                                      ).reduce((sum, val) => {
                                        // Use simple calculation for pharmacies without the feature
                                        if (
                                          !pharmacySettings?.enableDispenseCategories
                                        ) {
                                          const num = Number(val);
                                          return sum + (isNaN(num) ? 0 : num);
                                        }

                                        // Use advanced calculation for pharmacies with the feature
                                        if (
                                          typeof val === "object" &&
                                          val.patient !== undefined
                                        ) {
                                          // New structure: { patient: 5, scissors: 3 }
                                          const patientNum = Number(
                                            val.patient
                                          );
                                          const scissorsNum = Number(
                                            val.scissors
                                          );
                                          return (
                                            sum +
                                            (isNaN(patientNum)
                                              ? 0
                                              : patientNum) +
                                            (isNaN(scissorsNum)
                                              ? 0
                                              : scissorsNum)
                                          );
                                        } else if (
                                          typeof val === "object" &&
                                          val.quantity !== undefined
                                        ) {
                                          // Old structure: { quantity: 5, category: "patient" }
                                          const num = Number(val.quantity);
                                          return sum + (isNaN(num) ? 0 : num);
                                        } else {
                                          // Simple structure: 5
                                          const num = Number(val);
                                          return sum + (isNaN(num) ? 0 : num);
                                        }
                                      }, 0)
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm border-t pt-2">
                                  <span className="text-gray-600 font-bold">
                                    الرصيد المتبقي:
                                  </span>
                                  <span className="font-bold text-blue-600">
                                    {(() => {
                                      const opening = Math.floor(
                                        Number(item.opening || 0)
                                      );
                                      const totalIncoming = Math.floor(
                                        Object.values(
                                          item.dailyIncoming || {}
                                        ).reduce(
                                          (sum, val) =>
                                            sum + (Number(val) || 0),
                                          0
                                        )
                                      );
                                      const totalDispensed = Math.floor(
                                        Object.values(
                                          item.dailyDispense || {}
                                        ).reduce((sum, val) => {
                                          // Use simple calculation for pharmacies without the feature
                                          if (
                                            !pharmacySettings?.enableDispenseCategories
                                          ) {
                                            const num = Number(val);
                                            return sum + (isNaN(num) ? 0 : num);
                                          }

                                          // Use advanced calculation for pharmacies with the feature
                                          if (
                                            typeof val === "object" &&
                                            val.patient !== undefined
                                          ) {
                                            // New structure: { patient: 5, scissors: 3 }
                                            const patientNum = Number(
                                              val.patient
                                            );
                                            const scissorsNum = Number(
                                              val.scissors
                                            );
                                            return (
                                              sum +
                                              (isNaN(patientNum)
                                                ? 0
                                                : patientNum) +
                                              (isNaN(scissorsNum)
                                                ? 0
                                                : scissorsNum)
                                            );
                                          } else if (
                                            typeof val === "object" &&
                                            val.quantity !== undefined
                                          ) {
                                            // Old structure: { quantity: 5, category: "patient" }
                                            const num = Number(val.quantity);
                                            return sum + (isNaN(num) ? 0 : num);
                                          } else {
                                            // Simple structure: 5
                                            const num = Number(val);
                                            return sum + (isNaN(num) ? 0 : num);
                                          }
                                        }, 0)
                                      );
                                      return (
                                        opening + totalIncoming - totalDispensed
                                      );
                                    })()}
                                  </span>
                                </div>
                              </div>

                              {/* Daily Dispense */}
                              <div className="space-y-2">
                                <h6 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  المنصرف اليومي (قابل للتعديل):
                                </h6>
                                <div className="grid grid-cols-5 gap-2">
                                  {Array.from({ length: 31 }, (_, day) => {
                                    const dayNumber = day + 1;
                                    const dispenseValue =
                                      item.dailyDispense?.[dayNumber] || 0;
                                    return (
                                      <div
                                        key={dayNumber}
                                        className="flex flex-col items-center"
                                      >
                                        <span className="text-xs text-gray-500 mb-1">
                                          يوم {dayNumber}
                                        </span>
                                        <input
                                          type="number"
                                          value={dispenseValue}
                                          onChange={(e) => {
                                            const newValue =
                                              e.target.value === ""
                                                ? 0
                                                : Math.floor(
                                                    Number(e.target.value)
                                                  );
                                            handleDispenseChange(
                                              page.id,
                                              itemIdx,
                                              dayNumber,
                                              newValue
                                            );
                                          }}
                                          onBlur={() => {
                                            const latestPage = customPages.find(
                                              (p) => p.id === page.id
                                            );
                                            if (!latestPage) return;
                                            const latestItem =
                                              latestPage.items[itemIdx];
                                            const latestDispense =
                                              latestItem?.dailyDispense || {};
                                            updateItemInBoth(
                                              latestPage,
                                              itemIdx,
                                              "dailyDispense",
                                              latestDispense
                                            );
                                          }}
                                          className="w-16 h-8 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-blue-50"
                                          placeholder="0"
                                          min="0"
                                          step="1"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Delete Item Button */}
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const updatedItems = page.items.filter(
                                      (_, idx) => idx !== itemIdx
                                    );
                                    updateCustomPage(page.id, {
                                      items: updatedItems,
                                      lastUpdated: new Date().toISOString(),
                                    });
                                    setCustomPages((prev) =>
                                      prev.map((p) =>
                                        p.id === page.id
                                          ? { ...p, items: updatedItems }
                                          : p
                                      )
                                    );
                                    toast("تم حذف الصنف من الصفحة!", "success");
                                  }}
                                  className="w-full px-3 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  حذف الصنف من الصفحة
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {customPages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-950 rounded-2xl border border-gray-700"
        >
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-bold text-white mb-2">
            لا توجد صفحات مخصصة
          </h3>
          <p className="text-gray-400">
            قم بإنشاء صفحة مخصصة لتجميع الأصناف المفضلة مع عرض تفصيلي للبيانات
          </p>
        </motion.div>
      )}

      <MonthYearModal />
      <AddItemsModal />
    </div>
  );
};

export default CustomPageManager;
