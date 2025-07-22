// src/components/DataTransferButton.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transferToNextMonth } from "../utils/dataTransfer";

const DataTransferButton = ({
  itemsByMonth,
  setItemsByMonth,
  currentMonthKey,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    setIsTransferring(true);
    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const updated = transferToNextMonth(itemsByMonth, currentMonthKey);
    setItemsByMonth(updated);
    setShowModal(false);
    setIsTransferring(false);
  };

  return (
    <div className="mt-10 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-orange-200 dark:border-orange-700 font-[Cairo]">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 mb-2 tracking-wide leading-relaxed">
          🔄 ترحيل البيانات
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          نقل البيانات المتبقية إلى الشهر التالي
        </p>
      </div>

      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 12px 40px rgba(251, 146, 60, 0.3)",
        }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-400 font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg"
        disabled={isLoading}
      >
        <motion.span
          className="text-2xl"
          animate={{ rotate: isLoading ? 360 : 0 }}
          transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
        >
          🔄
        </motion.span>
        <span className="text-xl">ترحيل البيانات للشهر التالي</span>
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            onClick={() => !isTransferring && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-600"
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
                  تأكيد الترحيل
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  هل أنت متأكد أنك تريد ترحيل البيانات إلى الشهر التالي؟ سيتم
                  اعتبار الرصيد المتبقي كرصيد افتتاحي.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isTransferring}
                  className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-400 transition-all duration-200 flex items-center gap-2"
                >
                  <span>❌</span>
                  <span>إلغاء</span>
                </motion.button>

                <motion.button
                  onClick={handleTransfer}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isTransferring}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  {isTransferring ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span>جاري الترحيل...</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>نعم، ترحيل</span>
                    </>
                  )}
                </motion.button>
              </div>

              {isTransferring && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">
                      جاري ترحيل البيانات...
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataTransferButton;
