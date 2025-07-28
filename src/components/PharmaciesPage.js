import React, { useEffect, useState } from "react";
import {
  listPharmacies,
  createPharmacy,
  deletePharmacy,
} from "../utils/firestoreService";
import { useNavigate } from "react-router-dom";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [deletingPharmacy, setDeletingPharmacy] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const navigate = useNavigate();

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const data = await listPharmacies();
      setPharmacies(data);
    } catch (err) {
      setError("فشل تحميل الصيدليات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleAddPharmacy = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    try {
      await createPharmacy(newName.trim());
      setNewName("");
      setShowForm(false);
      fetchPharmacies();
    } catch (err) {
      setError("فشل إضافة الصيدلية");
    }
  };

  const handleDeletePharmacy = async (pharmacyId, pharmacyName) => {
    const confirmed = window.confirm(
      `هل أنت متأكد أنك تريد حذف الصيدلية "${pharmacyName}"؟\n\nسيتم حذف الصيدلية وإلغاء تعيين جميع الصيادلة المرتبطين بها.`
    );

    if (!confirmed) return;

    setDeletingPharmacy(pharmacyId);
    setDeleteError("");

    try {
      await deletePharmacy(pharmacyId);
      await fetchPharmacies(); // Refresh the list
    } catch (err) {
      setDeleteError("فشل حذف الصيدلية");
    } finally {
      setDeletingPharmacy(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 mb-3">
          إدارة الصيدليات
        </h1>
        <p className="text-gray-300 text-lg">
          عرض وإدارة جميع الصيدليات في النظام
        </p>
      </motion.div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-fuchsia-400">الصيدليات</h2>
        <motion.button
          className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105"
          onClick={() => setShowForm((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          + إضافة صيدلية
        </motion.button>
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-red-400 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {error}
          </motion.div>
        )}

        {deleteError && (
          <motion.div
            className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-red-400 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {deleteError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Pharmacy Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 mb-8 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
              إضافة صيدلية جديدة
            </h3>
            <form onSubmit={handleAddPharmacy} className="flex gap-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full border-2 border-fuchsia-700/50 rounded-xl px-6 py-4 bg-gray-900/80 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300 text-lg backdrop-blur-sm"
                  placeholder="اسم الصيدلية"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <motion.button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                حفظ
              </motion.button>
              <motion.button
                type="button"
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-bold text-lg shadow-2xl transform hover:scale-105"
                onClick={() => {
                  setShowForm(false);
                  setNewName("");
                  setError("");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                إلغاء
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pharmacies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl p-6 border border-fuchsia-700/50"
            >
              <Skeleton width="100%" height={28} className="mb-3" />
              <Skeleton width="60%" height={18} />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {pharmacies.map((pharmacy, index) => (
            <motion.div
              key={pharmacy.id}
              className="group relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 hover:border-fuchsia-500/80 transition-all duration-500 backdrop-blur-sm overflow-hidden"
              variants={cardVariants}
              whileHover="hover"
              custom={index}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/5 via-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-purple-600/20 to-pink-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2">
                      {pharmacy.name}
                    </div>
                  </div>
                  <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                    🏥
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white py-3 rounded-xl hover:from-fuchsia-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-fuchsia-500/25 transform hover:scale-105"
                    onClick={() => navigate(`/lead/pharmacies/${pharmacy.id}`)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    عرض التفاصيل
                  </motion.button>

                  <motion.button
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-red-500/25 transform hover:scale-105 flex items-center justify-center gap-2"
                    onClick={() =>
                      handleDeletePharmacy(pharmacy.id, pharmacy.name)
                    }
                    disabled={deletingPharmacy === pharmacy.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {deletingPharmacy === pharmacy.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الحذف...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        حذف الصيدلية
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && pharmacies.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-8xl mb-6 transform hover:scale-110 transition-transform duration-300">
            🏥
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            لا توجد صيدليات
          </h3>
          <p className="text-gray-400 text-lg mb-8">ابدأ بإضافة صيدلية جديدة</p>
          <motion.button
            className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105"
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + إضافة صيدلية
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
