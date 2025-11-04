import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  // updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";
import Spinner from "./ui/Spinner";

import { useInventoryData } from "./InventoryTabs";
import PharmacySettings from "./PharmacySettings";

function getTodayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function PharmacyDetailsPage() {
  const { pharmacyId } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pharmacists, setPharmacists] = useState([]);
  const [loadingPharmacists, setLoadingPharmacists] = useState(true);
  const [shortages, setShortages] = useState([]);
  const [loadingShortages, setLoadingShortages] = useState(true);
  const [shortagesError, setShortagesError] = useState("");
  const [attendance, setAttendance] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");
  const today = getTodayDateString();
  const auth = getAuth();
  const [user] = useAuthState(auth);
  const [assigningSenior, setAssigningSenior] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeDetailView, setActiveDetailView] = useState("overview");

  // Use pharmacy-specific inventory data with error handling
  const {
    items,
    monthlyConsumption,
    loading: inventoryLoading,
    error: inventoryError,
    pharmacySettings,
  } = useInventoryData(pharmacyId);

  // Enhanced navigation handler
  const handleGoBack = () => {
    try {
      navigate("/lead/pharmacies");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation
      window.location.href = "/lead/pharmacies";
    }
  };

  // Find current senior pharmacist
  // const currentSenior = pharmacists.find((ph) => ph.role === "senior");

  // Fetch pharmacists assigned to this pharmacy
  useEffect(() => {
    if (!pharmacyId) return;

    setLoadingPharmacists(true);

    try {
      const unsub = onSnapshot(
        collection(db, "users"),
        (usersSnap) => {
          const pharmacyPharmacists = usersSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((ph) => ph.assignedPharmacy === pharmacyId);
          setPharmacists(pharmacyPharmacists);
          setLoadingPharmacists(false);
        },
        (error) => {
          console.error("Error loading pharmacists:", error);
          setLoadingPharmacists(false);
        }
      );
      return () => unsub();
    } catch (error) {
      console.error("Error setting up pharmacists listener:", error);
      setLoadingPharmacists(false);
    }
  }, [pharmacyId]);

  // Assign senior pharmacist handler
  const handleAssignSenior = async (e) => {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");
    try {
      // Set all to regular, except selected to senior
      await Promise.all(
        pharmacists.map((ph) => {
          const newRole = ph.id === selectedSenior ? "senior" : "regular";
          if (ph.role !== newRole) {
            return setDoc(
              doc(db, "users", ph.id),
              { ...ph, role: newRole },
              { merge: true }
            );
          }
          return Promise.resolve();
        })
      );
      setAssignSuccess("تم تعيين كبير الصيادلة بنجاح");
      setAssigningSenior(false);
      setSelectedSenior("");
      // Refresh pharmacists list
      const usersSnap = await getDocs(collection(db, "users"));
      setPharmacists(
        usersSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((ph) => ph.assignedPharmacy === pharmacyId)
      );
    } catch (err) {
      setAssignError("فشل تعيين كبير الصيادلة");
    }
  };

  // Determine if current user is the senior pharmacist for this pharmacy
  // const isSenior =
  //   user && user.role === "senior" && user.assignedPharmacy === pharmacyId;

  // Handle attendance change (for senior pharmacist)
  // const handleAttendanceChange = async (pharmacistId, present) => {
  //     try {
  //       const docRef = doc(db, "pharmacies", pharmacyId, "attendance", today);
  //       // Merge: update only the changed pharmacist's attendance
  //       await updateDoc(docRef, { [pharmacistId]: present });
  //       setAttendance((prev) => ({ ...prev, [pharmacistId]: present }));
  //     } catch (err) {
  //       alert("فشل تحديث الحضور");
  //     }
  //   };

  // Edit pharmacy name handler
  const handleEditPharmacy = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    try {
      await setDoc(
        doc(db, "pharmacies", pharmacyId),
        { ...pharmacy, name: editName },
        { merge: true }
      );
      setEditSuccess("تم تحديث اسم الصيدلية بنجاح");
      setEditing(false);
      setPharmacy((prev) => ({ ...prev, name: editName }));
    } catch (err) {
      setEditError("فشل تحديث اسم الصيدلية");
    }
  };

  // Delete pharmacy handler
  const handleDeletePharmacy = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      // Delete all subcollections (monthlyStock, shortages, attendance)
      const subcollections = ["monthlyStock", "shortages", "attendance"];
      for (const sub of subcollections) {
        const colRef = collection(db, "pharmacies", pharmacyId, sub);
        const snap = await getDocs(colRef);
        const batch = writeBatch(db);
        snap.forEach((docu) => batch.delete(docu.ref));
        await batch.commit();
      }
      // Delete pharmacy document
      await deleteDoc(doc(db, "pharmacies", pharmacyId));
      navigate("/lead/pharmacies");
    } catch (err) {
      setDeleteError("فشل حذف الصيدلية");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "pharmacies", pharmacyId),
      (docSnap) => {
        if (docSnap.exists()) {
          setPharmacy({ id: docSnap.id, ...docSnap.data() });
          setError("");
        } else {
          setPharmacy(null);
          setError("لم يتم العثور على الصيدلية");
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [pharmacyId]);

  // Calculate shortages based on pharmacy-specific data
  useEffect(() => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      setShortages([]);
      setLoadingShortages(false);
      return;
    }

    setLoadingShortages(true);
    try {
      const shortagesList = items
        .filter((item) => {
          if (!item || !item.name) return false;

          const opening = Math.floor(Number(item.opening || 0));
          const totalIncoming = Math.floor(
            Object.values(item.dailyIncoming || {}).reduce(
              (acc, val) => acc + Number(val || 0),
              0
            )
          );
          const totalDispensed = Math.floor(
            Object.values(item.dailyDispense || {}).reduce((acc, val) => {
              if (typeof val === "object" && val.patient !== undefined) {
                // New structure: { patient: 5, scissors: 3 }
                const patientNum = Number(val.patient);
                const scissorsNum = Number(val.scissors);
                return (
                  acc +
                  (isNaN(patientNum) ? 0 : patientNum) +
                  (isNaN(scissorsNum) ? 0 : scissorsNum)
                );
              } else if (
                typeof val === "object" &&
                val.quantity !== undefined
              ) {
                // Old structure: { quantity: 5, category: "patient" }
                const num = Number(val.quantity);
                return acc + (isNaN(num) ? 0 : num);
              } else {
                // Simple structure: 5
                const num = Number(val);
                return acc + (isNaN(num) ? 0 : num);
              }
            }, 0)
          );
          const currentStock = opening + totalIncoming - totalDispensed;

          // Get average consumption from monthlyConsumption
          const consumption =
            monthlyConsumption && monthlyConsumption[item.name];
          const averageConsumption = consumption ? consumption.average : 10;

          return currentStock <= averageConsumption;
        })
        .map((item) => {
          const opening = Math.floor(Number(item.opening || 0));
          const totalIncoming = Math.floor(
            Object.values(item.dailyIncoming || {}).reduce(
              (acc, val) => acc + Number(val || 0),
              0
            )
          );
          const totalDispensed = Math.floor(
            Object.values(item.dailyDispense || {}).reduce((acc, val) => {
              if (typeof val === "object" && val.patient !== undefined) {
                // New structure: { patient: 5, scissors: 3 }
                const patientNum = Number(val.patient);
                const scissorsNum = Number(val.scissors);
                return (
                  acc +
                  (isNaN(patientNum) ? 0 : patientNum) +
                  (isNaN(scissorsNum) ? 0 : scissorsNum)
                );
              } else if (
                typeof val === "object" &&
                val.quantity !== undefined
              ) {
                // Old structure: { quantity: 5, category: "patient" }
                const num = Number(val.quantity);
                return acc + (isNaN(num) ? 0 : num);
              } else {
                // Simple structure: 5
                const num = Number(val);
                return acc + (isNaN(num) ? 0 : num);
              }
            }, 0)
          );
          const currentStock = opening + totalIncoming - totalDispensed;

          const consumption =
            monthlyConsumption && monthlyConsumption[item.name];
          const averageConsumption = consumption ? consumption.average : 10;

          return {
            name: item.name,
            currentStock,
            averageConsumption,
            shortage: Math.max(0, averageConsumption - currentStock),
            unitPrice: item.unitPrice || 0,
          };
        })
        .sort((a, b) => b.shortage - a.shortage);

      setShortages(shortagesList);
    } catch (err) {
      console.error("Error calculating shortages:", err);
      setShortagesError("فشل حساب النواقص");
    } finally {
      setLoadingShortages(false);
    }
  }, [items, monthlyConsumption]);

  // Fetch today's attendance
  useEffect(() => {
    if (!pharmacyId) return;

    setLoadingAttendance(true);
    setAttendanceError("");

    try {
      const unsub = onSnapshot(
        doc(db, "pharmacies", pharmacyId, "attendance", today),
        (docSnap) => {
          setAttendance(docSnap.exists() ? docSnap.data() : {});
          setLoadingAttendance(false);
        },
        (error) => {
          console.error("Error loading attendance:", error);
          setAttendanceError("فشل تحميل بيانات الحضور");
          setLoadingAttendance(false);
        }
      );
      return () => unsub();
    } catch (error) {
      console.error("Error setting up attendance listener:", error);
      setAttendanceError("فشل تحميل بيانات الحضور");
      setLoadingAttendance(false);
    }
  }, [pharmacyId, today]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size={56} className="mb-4" />
          <div className="text-white text-lg">
            جاري تحميل بيانات الصيدلية...
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <motion.button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-300 font-bold"
            onClick={handleGoBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← العودة للصيدليات
          </motion.button>
        </div>
      </div>
    );

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">🏥</div>
          <div className="text-red-400 text-lg mb-4">
            لم يتم العثور على الصيدلية
          </div>
          <motion.button
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-300 font-bold"
            onClick={handleGoBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← العودة للصيدليات
          </motion.button>
        </div>
      </div>
    );
  }

  // Handle inventory loading errors
  if (inventoryError) {
    console.error("Inventory loading error:", inventoryError);
  }

  // Show loading state while inventory is loading
  if (inventoryLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size={56} className="mb-4" />
          <div className="text-white text-lg">جاري تحميل بيانات المخزون...</div>
        </div>
      </div>
    );
  }

  // Calculate statistics for this pharmacy
  const totalItems = items && Array.isArray(items) ? items.length : 0;
  const totalDispensed =
    items && Array.isArray(items)
      ? items.reduce((sum, item) => {
          const itemTotal = Object.values(item.dailyDispense || {}).reduce(
            (acc, val) => {
              // Use simple calculation for pharmacies without the feature
              if (!pharmacySettings?.enableDispenseCategories) {
                const num = Number(val);
                return acc + (isNaN(num) ? 0 : num);
              }

              // Use advanced calculation for pharmacies with the feature
              if (typeof val === "object" && val.patient !== undefined) {
                // New structure: { patient: 5, scissors: 3 }
                const patientNum = Number(val.patient);
                const scissorsNum = Number(val.scissors);
                return (
                  acc +
                  (isNaN(patientNum) ? 0 : patientNum) +
                  (isNaN(scissorsNum) ? 0 : scissorsNum)
                );
              } else if (
                typeof val === "object" &&
                val.quantity !== undefined
              ) {
                // Old structure: { quantity: 5, category: "patient" }
                const num = Number(val.quantity);
                return acc + (isNaN(num) ? 0 : num);
              } else {
                // Simple structure: 5
                const num = Number(val);
                return acc + (isNaN(num) ? 0 : num);
              }
            },
            0
          );
          return sum + itemTotal;
        }, 0)
      : 0;
  const totalIncoming =
    items && Array.isArray(items)
      ? items.reduce((sum, item) => {
          const itemTotal = Object.values(item.dailyIncoming || {}).reduce(
            (acc, val) => acc + Number(val || 0),
            0
          );
          return sum + itemTotal;
        }, 0)
      : 0;
  const totalShortages =
    shortages && Array.isArray(shortages) ? shortages.length : 0;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div
          className="bg-gradient-to-r from-purple-900 via-fuchsia-900 to-pink-900 rounded-3xl p-8 mb-8 shadow-2xl"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-4">
                {editing ? (
                  <motion.form
                    onSubmit={handleEditPharmacy}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/20 text-white border-2 border-white/30 rounded-xl px-6 py-4 text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-white/50 focus:border-white/50 transition-all duration-300 backdrop-blur-sm"
                      placeholder="اسم الصيدلية"
                      required
                    />
                    <motion.button
                      type="submit"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold shadow-2xl"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      حفظ
                    </motion.button>
                    <motion.button
                      type="button"
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-bold shadow-2xl"
                      onClick={() => setEditing(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      إلغاء
                    </motion.button>
                  </motion.form>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-6xl">🏥</span>
                    <span>{pharmacy.name}</span>
                    {user && user.role === "lead" && (
                      <div className="flex gap-2">
                        <motion.button
                          className="text-fuchsia-400 hover:text-white text-sm bg-gray-800/50 px-3 py-1 rounded-lg transition-all duration-300"
                          onClick={() => {
                            setEditing(true);
                            setEditName(pharmacy.name);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          تعديل
                        </motion.button>
                        <motion.button
                          className="text-blue-400 hover:text-white text-sm bg-gray-800/50 px-3 py-1 rounded-lg transition-all duration-300"
                          onClick={() => setShowSettings(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          إعدادات
                        </motion.button>
                        <motion.button
                          className="text-red-400 hover:text-red-300 text-sm bg-gray-800/50 px-3 py-1 rounded-lg transition-all duration-300"
                          onClick={() => {
                            if (
                              window.confirm(
                                "هل أنت متأكد أنك تريد حذف هذه الصيدلية؟ سيتم حذف جميع البيانات المتعلقة بها."
                              )
                            ) {
                              handleDeletePharmacy();
                            }
                          }}
                          disabled={deleting}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {deleting ? "جاري الحذف..." : "حذف"}
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </h1>
              <p className="text-gray-300 text-lg">
                تفاصيل شاملة للصيدلية وإدارتها
              </p>
            </div>
            <motion.button
              className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-purple-500/25"
              onClick={handleGoBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← العودة للصيدليات
            </motion.button>
          </div>
        </motion.div>

        {/* Error/Success Messages */}
        {editError && (
          <motion.div
            className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-red-400 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {editError}
          </motion.div>
        )}
        {editSuccess && (
          <motion.div
            className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-2xl p-6 text-green-400 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {editSuccess}
          </motion.div>
        )}
        {deleteError && (
          <motion.div
            className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-red-400 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {deleteError}
          </motion.div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي الأصناف</p>
                <p className="text-3xl font-bold">{totalItems}</p>
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
            className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي الوارد</p>
                <p className="text-3xl font-bold">{totalIncoming}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <span className="text-2xl">📥</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">إجمالي المنصرف</p>
                <p className="text-3xl font-bold">{totalDispensed}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <span className="text-2xl">📤</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">النواقص</p>
                <p className="text-3xl font-bold">{totalShortages}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          className="bg-gray-800/50 rounded-3xl p-8 shadow-2xl backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { key: "overview", label: "نظرة عامة", icon: "📊" },
              { key: "inventory", label: "المخزون", icon: "📦" },
              { key: "shortages", label: "النواقص", icon: "⚠️" },
              { key: "pharmacists", label: "الصيادلة", icon: "👨‍⚕️" },
              { key: "attendance", label: "الحضور", icon: "📅" },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveDetailView(tab.key)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeDetailView === tab.key
                    ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg"
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Content Based on Active Tab */}
          <motion.div
            key={activeDetailView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeDetailView === "overview" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  نظرة عامة على الصيدلية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-white mb-4">
                      معلومات الصيدلية
                    </h4>
                    <div className="space-y-3 text-gray-300">
                      <div className="flex justify-between">
                        <span>اسم الصيدلية:</span>
                        <span className="font-bold text-white">
                          {pharmacy.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ الإنشاء:</span>
                        <span className="font-bold text-white">
                          {pharmacy.createdAt
                            ? new Date(pharmacy.createdAt).toLocaleDateString(
                                "ar-EG"
                              )
                            : "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>عدد الصيادلة:</span>
                        <span className="font-bold text-white">
                          {pharmacists.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-white mb-4">
                      إحصائيات المخزون
                    </h4>
                    <div className="space-y-3 text-gray-300">
                      <div className="flex justify-between">
                        <span>إجمالي الأصناف:</span>
                        <span className="font-bold text-white">
                          {totalItems}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>إجمالي الوارد:</span>
                        <span className="font-bold text-white">
                          {totalIncoming}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>إجمالي المنصرف:</span>
                        <span className="font-bold text-white">
                          {totalDispensed}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>النواقص:</span>
                        <span className="font-bold text-red-400">
                          {totalShortages}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDetailView === "inventory" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  مخزون الصيدلية
                </h3>
                {inventoryLoading ? (
                  <div className="text-center py-8">
                    <Spinner size={48} className="mb-4" />
                    <p className="text-gray-400">جاري تحميل المخزون...</p>
                  </div>
                ) : inventoryError ? (
                  <div className="text-center py-8">
                    <p className="text-red-400">{inventoryError}</p>
                  </div>
                ) : items && items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, index) => {
                      const opening = Math.floor(Number(item.opening || 0));
                      const totalIncoming = Math.floor(
                        Object.values(item.dailyIncoming || {}).reduce(
                          (acc, val) => acc + Number(val || 0),
                          0
                        )
                      );
                      const totalDispensed = Math.floor(
                        Object.values(item.dailyDispense || {}).reduce(
                          (acc, val) => {
                            // Use simple calculation for pharmacies without the feature
                            if (!pharmacySettings?.enableDispenseCategories) {
                              const num = Number(val);
                              return acc + (isNaN(num) ? 0 : num);
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
                                acc +
                                (isNaN(patientNum) ? 0 : patientNum) +
                                (isNaN(scissorsNum) ? 0 : scissorsNum)
                              );
                            } else if (
                              typeof val === "object" &&
                              val.quantity !== undefined
                            ) {
                              // Old structure: { quantity: 5, category: "patient" }
                              const num = Number(val.quantity);
                              return acc + (isNaN(num) ? 0 : num);
                            } else {
                              // Simple structure: 5
                              const num = Number(val);
                              return acc + (isNaN(num) ? 0 : num);
                            }
                          },
                          0
                        )
                      );
                      const currentStock =
                        opening + totalIncoming - totalDispensed;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50"
                        >
                          <h5 className="font-bold text-white mb-2">
                            {item.name || "صنف بدون اسم"}
                          </h5>
                          <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between">
                              <span>الرصيد الافتتاحي:</span>
                              <span className="font-bold">{opening}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>إجمالي الوارد:</span>
                              <span className="font-bold text-green-400">
                                {totalIncoming}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>إجمالي المنصرف:</span>
                              <span className="font-bold text-red-400">
                                {totalDispensed}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>المخزون الحالي:</span>
                              <span
                                className={`font-bold ${
                                  currentStock > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {currentStock}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">لا توجد أصناف في المخزون</p>
                  </div>
                )}
              </div>
            )}

            {activeDetailView === "shortages" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  النواقص والاحتياجات
                </h3>
                {loadingShortages ? (
                  <div className="text-center py-8">
                    <Spinner size={48} className="mb-4" />
                    <p className="text-gray-400">جاري حساب النواقص...</p>
                  </div>
                ) : shortagesError ? (
                  <div className="text-center py-8">
                    <p className="text-red-400">{shortagesError}</p>
                  </div>
                ) : shortages && shortages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shortages.map((shortage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-red-900/30 border border-red-500/50 rounded-xl p-4"
                      >
                        <h5 className="font-bold text-red-400 mb-2">
                          {shortage.name}
                        </h5>
                        <div className="space-y-2 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span>المخزون الحالي:</span>
                            <span className="font-bold text-red-400">
                              {shortage.currentStock}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>متوسط الاستهلاك:</span>
                            <span className="font-bold text-yellow-400">
                              {shortage.averageConsumption}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>الكمية المطلوبة:</span>
                            <span className="font-bold text-red-400">
                              {shortage.shortage}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>القيمة المطلوبة:</span>
                            <span className="font-bold text-red-400">
                              {Number(
                                (
                                  shortage.shortage * shortage.unitPrice
                                ).toFixed(2)
                              )}{" "}
                              ج.م
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-green-400">لا توجد نواقص في المخزون</p>
                  </div>
                )}
              </div>
            )}

            {activeDetailView === "pharmacists" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">
                    الصيادلة المعينون
                  </h3>
                  {user && user.role === "lead" && (
                    <motion.button
                      className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-fuchsia-700 hover:to-purple-700 transition-all duration-300 font-bold"
                      onClick={() => setAssigningSenior(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      تعيين كبير الصيادلة
                    </motion.button>
                  )}
                </div>

                {assigningSenior && (
                  <motion.div
                    className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h4 className="text-xl font-bold text-white mb-4">
                      تعيين كبير الصيادلة
                    </h4>
                    <form onSubmit={handleAssignSenior} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                          اختر كبير الصيادلة
                        </label>
                        <select
                          value={selectedSenior}
                          onChange={(e) => setSelectedSenior(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                          required
                        >
                          <option value="">اختر صيدلي</option>
                          {pharmacists.map((ph) => (
                            <option key={ph.id} value={ph.id}>
                              {ph.name} (
                              {ph.role === "senior" ? "كبير" : "عادي"})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-4">
                        <motion.button
                          type="submit"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          تعيين
                        </motion.button>
                        <motion.button
                          type="button"
                          className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-bold"
                          onClick={() => {
                            setAssigningSenior(false);
                            setSelectedSenior("");
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          إلغاء
                        </motion.button>
                      </div>
                    </form>
                    {assignError && (
                      <p className="text-red-400 mt-2">{assignError}</p>
                    )}
                    {assignSuccess && (
                      <p className="text-green-400 mt-2">{assignSuccess}</p>
                    )}
                  </motion.div>
                )}

                {loadingPharmacists ? (
                  <div className="text-center py-8">
                    <Spinner size={48} className="mb-4" />
                    <p className="text-gray-400">جاري تحميل الصيادلة...</p>
                  </div>
                ) : pharmacists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pharmacists.map((pharmacist, index) => (
                      <motion.div
                        key={pharmacist.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">👨‍⚕️</div>
                            <div>
                              <h5 className="font-bold text-white text-lg">
                                {pharmacist.name}
                              </h5>
                              <p className="text-gray-400 text-sm">
                                {pharmacist.username}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              pharmacist.role === "senior"
                                ? "bg-yellow-600/30 text-yellow-400 border border-yellow-500/50"
                                : "bg-blue-600/30 text-blue-400 border border-blue-500/50"
                            }`}
                          >
                            {pharmacist.role === "senior"
                              ? "كبير الصيادلة"
                              : "صيدلي"}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span>البريد الإلكتروني:</span>
                            <span className="font-bold text-white">
                              {pharmacist.email || "غير محدد"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>اسم المستخدم:</span>
                            <span className="font-bold text-white">
                              {pharmacist.username}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      لا يوجد صيادلة معينون لهذه الصيدلية
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailView === "attendance" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-4">
                  حضور الصيادلة - {new Date(today).toLocaleDateString("ar-EG")}
                </h3>
                {loadingAttendance ? (
                  <div className="text-center py-8">
                    <Spinner size={48} className="mb-4" />
                    <p className="text-gray-400">جاري تحميل الحضور...</p>
                  </div>
                ) : attendanceError ? (
                  <div className="text-center py-8">
                    <p className="text-red-400">{attendanceError}</p>
                  </div>
                ) : pharmacists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pharmacists.map((ph) => (
                      <motion.div
                        key={ph.id}
                        className="p-6 bg-gray-700/50 rounded-xl border border-gray-600/50"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">👨‍⚕️</div>
                            <div>
                              <div className="text-white font-bold text-xl">
                                {ph.name}
                              </div>
                              <div className="text-gray-400 text-lg">
                                {ph.username}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {attendance[ph.id] === true ? (
                              <span className="text-green-400 font-bold flex items-center gap-2 text-lg">
                                <span className="w-4 h-4 bg-green-400 rounded-full"></span>
                                حاضر
                              </span>
                            ) : attendance[ph.id] === false ? (
                              <span className="text-red-400 font-bold flex items-center gap-2 text-lg">
                                <span className="w-4 h-4 bg-red-400 rounded-full"></span>
                                غائب
                              </span>
                            ) : (
                              <span className="text-gray-500 font-bold flex items-center gap-2 text-lg">
                                <span className="w-4 h-4 bg-gray-500 rounded-full"></span>
                                غير محدد
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      لا يوجد صيادلة معينون لهذه الصيدلية
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Pharmacy Settings Modal */}
      {showSettings && (
        <PharmacySettings
          pharmacyId={pharmacyId}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
