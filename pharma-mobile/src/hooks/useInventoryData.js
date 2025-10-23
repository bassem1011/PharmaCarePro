import { useState, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { validateItem } from "../services/firestoreService";
import { db } from "../services/firebase";

const getMonthKey = (year, month) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

export function useInventoryData(pharmacyId = null) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [itemsByMonth, setItemsByMonth] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyConsumption, setMonthlyConsumption] = useState({});

  // Load inventory data for the specified pharmacy
  useEffect(() => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const monthlyStockRef = collection(
      db,
      "pharmacies",
      pharmacyId,
      "monthlyStock"
    );
    const unsubscribe = onSnapshot(
      monthlyStockRef,
      (monthlyStockSnap) => {
        const itemsData = {};

        monthlyStockSnap.docs.forEach((docu) => {
          const data = docu.data();
          if (data && data.items) {
            itemsData[docu.id] = data.items;
          }
        });
        setItemsByMonth(itemsData);

        // Calculate monthly consumption
        const consumption = {};
        Object.entries(itemsData).forEach(([monthKey, items]) => {
          items.forEach((item) => {
            if (!item?.name) return;
            const total = Object.values(item.dailyDispense || {}).reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );
            if (!consumption[item.name]) {
              consumption[item.name] = { total: 0, average: 0, months: {} };
            }
            consumption[item.name].total += Math.floor(total);
            consumption[item.name].months[monthKey] = Math.floor(total);
          });
        });
        Object.keys(consumption).forEach((itemName) => {
          const item = consumption[itemName];
          const numMonths = Object.keys(item.months).length;
          item.average =
            numMonths > 0 ? Math.floor(item.total / numMonths) : 10;
        });
        setMonthlyConsumption(consumption);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading inventory data:", err);
        setError("فشل في تحميل بيانات المخزون");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pharmacyId]);

  const currentMonthKey = getMonthKey(year, month);
  const items = itemsByMonth[currentMonthKey] || [];

  const saveItemsForCurrentMonth = async (updatedItems) => {
    try {
      // Validate items similar to web
      updatedItems.forEach((it) => validateItem(it));
      await setDoc(
        doc(db, "pharmacies", pharmacyId, "monthlyStock", currentMonthKey),
        { items: updatedItems, lastUpdated: new Date().toISOString() }
      );
    } catch (err) {
      console.error("Error saving items:", err);
      setError("فشل حفظ بيانات المخزون");
    }
  };

  const addItem = () => {
    const newItem = {
      name: "",
      opening: 0,
      unitPrice: 0,
      dailyDispense: {},
      dailyIncoming: {},
      incomingSource: {},
      selected: false,
    };

    setItemsByMonth((prev) => {
      const updated = {
        ...prev,
        [currentMonthKey]: [...(prev[currentMonthKey] || []), newItem],
      };

      // Save immediately when adding new item (like web version)
      setTimeout(() => {
        saveItemsForCurrentMonth(updated[currentMonthKey]).catch((err) => {
          console.error("Add item save error:", err);
          setError("فشل حفظ الصنف الجديد");
        });
      }, 100);

      return updated;
    });
  };

  const updateItem = (index, updates) => {
    setItemsByMonth((prev) => {
      const currentItems = prev[currentMonthKey] || [];
      const updated = currentItems.map((it, i) =>
        i === index ? { ...it, ...updates } : it
      );

      const newState = { ...prev, [currentMonthKey]: updated };

      // Save with debounce (like web version)
      setTimeout(() => {
        saveItemsForCurrentMonth(updated).catch((err) => {
          console.error("Update item save error:", err);
          setError("فشل حفظ تحديث الصنف");
        });
      }, 500);

      return newState;
    });
  };

  const deleteItem = (index) => {
    setItemsByMonth((prev) => {
      const currentItems = prev[currentMonthKey] || [];
      const updated = currentItems.filter((_, i) => i !== index);

      const newState = { ...prev, [currentMonthKey]: updated };

      // Save immediately for delete operations
      setTimeout(() => {
        saveItemsForCurrentMonth(updated).catch((err) => {
          console.error("Delete item save error:", err);
          setError("فشل حذف الصنف");
        });
      }, 100);

      return newState;
    });
  };

  const calculateRemainingStock = (item) => {
    if (!item) return 0;

    const opening = Math.floor(Number(item.opening || 0));
    const totalIncoming = Math.floor(
      Object.values(item.dailyIncoming || {}).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      )
    );
    const totalDispensed = Math.floor(
      Object.values(item.dailyDispense || {}).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      )
    );

    return opening + totalIncoming - totalDispensed;
  };

  const calculateShortages = () => {
    const shortages = [];

    items.forEach((item) => {
      if (!item.name) return;

      const currentStock = calculateRemainingStock(item);
      const consumption = monthlyConsumption[item.name];
      const averageConsumption = consumption ? consumption.average : 10;

      if (currentStock <= averageConsumption) {
        shortages.push({
          name: item.name,
          currentStock,
          averageConsumption,
          shortage: Math.max(0, averageConsumption - currentStock),
          unitPrice: item.unitPrice || 0,
        });
      }
    });

    return shortages.sort((a, b) => b.shortage - a.shortage);
  };

  return {
    items,
    itemsByMonth,
    monthlyConsumption,
    loading,
    error,
    calculateRemainingStock,
    calculateShortages,
    month,
    setMonth,
    year,
    setYear,
    addItem,
    updateItem,
    deleteItem,
  };
}
