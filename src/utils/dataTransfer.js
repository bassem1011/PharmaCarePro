// src/utils/dataTransfer.js

export const transferToNextMonth = (itemsByMonth, currentMonthKey) => {
  const [year, month] = currentMonthKey.split("-").map(Number);
  const currentItems = itemsByMonth[currentMonthKey] || [];

  // حساب الشهر التالي
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthKey = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

  const newItems = currentItems.map((item) => {
    const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
      (acc, val) => acc + val,
      0
    );
    const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
      (acc, val) => acc + val,
      0
    );
    const remaining = item.opening + totalIncoming - totalDispensed;

    return {
      ...item,
      dailyDispense: {}, // تفريغ المنصرف
      dailyIncoming: {}, // تفريغ الوارد
      opening: remaining, // تعيين المتبقي كرصيد افتتاحي
      selected: false, // إعادة التحديد
    };
  });

  return {
    ...itemsByMonth,
    [nextMonthKey]: newItems,
  };
};
