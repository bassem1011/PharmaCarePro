import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";

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
  const [monthlyStock, setMonthlyStock] = useState({});
  const [loadingStock, setLoadingStock] = useState(true);
  const [stockError, setStockError] = useState("");
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
  const [activeDetailView, setActiveDetailView] = useState(null);

  // Find current senior pharmacist
  const currentSenior = pharmacists.find((ph) => ph.role === "senior");

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
  const isSenior =
    user && user.role === "senior" && user.assignedPharmacy === pharmacyId;

  // Handle attendance change (for senior pharmacist)
  const handleAttendanceChange = async (pharmacistId, present) => {
    try {
      const docRef = doc(db, "pharmacies", pharmacyId, "attendance", today);
      // Merge: update only the changed pharmacist's attendance
      await updateDoc(docRef, { [pharmacistId]: present });
      setAttendance((prev) => ({ ...prev, [pharmacistId]: present }));
    } catch (err) {
      alert("فشل تحديث الحضور");
    }
  };

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
    async function fetchPharmacy() {
      setLoading(true);
      setError("");
      try {
        const docRef = doc(db, "pharmacies", pharmacyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPharmacy({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("لم يتم العثور على الصيدلية");
        }
      } catch (err) {
        setError("فشل تحميل بيانات الصيدلية");
      } finally {
        setLoading(false);
      }
    }
    fetchPharmacy();
  }, [pharmacyId]);

  useEffect(() => {
    async function fetchPharmacists() {
      setLoadingPharmacists(true);
      try {
        const q = query(
          collection(db, "users"),
          where("assignedPharmacy", "==", pharmacyId)
        );
        const snapshot = await getDocs(q);
        setPharmacists(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingPharmacists(false);
      }
    }
    fetchPharmacists();
  }, [pharmacyId]);

  // Fetch global monthly stock data (Lead Pharmacist sees all data)
  useEffect(() => {
    setLoadingStock(true);
    setStockError("");

    const fetchGlobalStock = async () => {
      try {
        // Get current month key
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        // Fetch global monthly stock data
        const stockRef = doc(db, "monthlyStock", currentMonthKey);
        const stockSnap = await getDoc(stockRef);

        if (stockSnap.exists()) {
          const stockData = stockSnap.data();
          const allItems = stockData.items || [];

          console.log(
            "Global monthly stock data for month:",
            currentMonthKey,
            allItems
          );

          setMonthlyStock({
            [currentMonthKey]: allItems,
          });
        } else {
          console.log(
            "No monthly stock data found for month:",
            currentMonthKey
          );
          setMonthlyStock({
            [currentMonthKey]: [],
          });
        }
        setLoadingStock(false);
      } catch (error) {
        console.error("Error fetching monthly stock:", error);
        setStockError("فشل تحميل بيانات المخزون");
        setLoadingStock(false);
      }
    };

    fetchGlobalStock();
  }, []);

  // Calculate shortages based on monthly stock data
  useEffect(() => {
    setLoadingShortages(true);
    setShortagesError("");

    try {
      // Get current month key
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // Get current month items
      const currentItems = monthlyStock[currentMonthKey] || [];

      console.log("Shortages calculation - Current items:", currentItems);
      console.log("Current month key:", currentMonthKey);

      // Calculate shortages (items with zero or negative stock)
      const shortageItems = currentItems
        .filter((item) => {
          // Ensure proper number conversion
          const opening = Math.floor(Number(item.opening || 0));
          const totalIncoming = Math.floor(
            Object.values(item.dailyIncoming || {}).reduce(
              (acc, val) => acc + Math.floor(Number(val || 0)),
              0
            )
          );
          const totalDispensed = Math.floor(
            Object.values(item.dailyDispense || {}).reduce(
              (acc, val) => acc + Math.floor(Number(val || 0)),
              0
            )
          );
          const currentStock = opening + totalIncoming - totalDispensed;

          console.log(`Item: ${item.name}`, {
            rawOpening: item.opening,
            opening,
            totalIncoming,
            totalDispensed,
            currentStock,
            isShortage: currentStock <= 0,
            dailyIncoming: item.dailyIncoming,
            dailyDispense: item.dailyDispense,
            calculation: `${opening} + ${totalIncoming} - ${totalDispensed} = ${currentStock}`,
          });

          return currentStock <= 0;
        })
        .map((item) => {
          // Use the same calculation logic in the map function
          const opening = Math.floor(Number(item.opening || 0));
          const totalIncoming = Math.floor(
            Object.values(item.dailyIncoming || {}).reduce(
              (acc, val) => acc + Math.floor(Number(val || 0)),
              0
            )
          );
          const totalDispensed = Math.floor(
            Object.values(item.dailyDispense || {}).reduce(
              (acc, val) => acc + Math.floor(Number(val || 0)),
              0
            )
          );
          const currentStock = opening + totalIncoming - totalDispensed;

          return {
            name: item.name,
            quantity: Math.abs(currentStock),
          };
        });

      console.log("Final shortage items:", shortageItems);

      // Additional check: Look for items that might have zero stock but aren't detected
      const zeroStockItems = currentItems.filter((item) => {
        const opening = Math.floor(Number(item.opening || 0));
        const totalIncoming = Math.floor(
          Object.values(item.dailyIncoming || {}).reduce(
            (acc, val) => acc + Math.floor(Number(val || 0)),
            0
          )
        );
        const totalDispensed = Math.floor(
          Object.values(item.dailyDispense || {}).reduce(
            (acc, val) => acc + Math.floor(Number(val || 0)),
            0
          )
        );
        const currentStock = opening + totalIncoming - totalDispensed;

        return currentStock === 0;
      });

      console.log("Items with exactly zero stock:", zeroStockItems);

      setShortages(shortageItems);
      setLoadingShortages(false);
    } catch (err) {
      console.error("Error calculating shortages:", err);
      setShortagesError("فشل تحميل النواقص");
      setLoadingShortages(false);
    }
  }, [monthlyStock]);

  // Fetch today's attendance
  useEffect(() => {
    async function fetchAttendance() {
      setLoadingAttendance(true);
      setAttendanceError("");
      try {
        const docRef = doc(db, "pharmacies", pharmacyId, "attendance", today);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAttendance(docSnap.data() || {});
        } else {
          setAttendance({});
        }
      } catch (err) {
        setAttendanceError("فشل تحميل الحضور");
      } finally {
        setLoadingAttendance(false);
      }
    }
    fetchAttendance();
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
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      </div>
    );

  if (!pharmacy) return null;

  // Get current month items for display
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const currentMonthItems = monthlyStock[currentMonthKey] || [];

  return (
    <div className="min-h-screen bg-gray-900 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Message */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border-2 border-fuchsia-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-fuchsia-400 mb-2">
              أهلاً بالصيدلي الأول
            </h2>
            <p className="text-gray-300">
              مرحباً بك في لوحة تحكم الصيدليات. يمكنك مراجعة تفاصيل كل صيدلية
              والبيانات المتعلقة بها.
            </p>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 mb-3">
                {editing ? (
                  <motion.form
                    onSubmit={handleEditPharmacy}
                    className="flex gap-4 items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <input
                      type="text"
                      className="border-2 border-fuchsia-700/50 rounded-xl px-6 py-4 bg-gray-900/80 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300 text-xl backdrop-blur-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                    <motion.button
                      type="submit"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-green-500/25"
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
              onClick={() => navigate("/lead/pharmacies")}
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

        {/* Assign Senior Pharmacist Section (lead only) */}
        {user &&
          user.email &&
          pharmacists.length > 0 &&
          user.role === "lead" && (
            <motion.div
              className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                تعيين صيدلي خبير
              </h3>
              <form
                onSubmit={handleAssignSenior}
                className="flex gap-4 items-center"
              >
                <div className="relative flex-1">
                  <select
                    className="w-full border-2 border-fuchsia-700/50 rounded-xl px-6 py-4 bg-gray-900/80 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300 text-lg backdrop-blur-sm appearance-none"
                    value={selectedSenior || currentSenior?.id || ""}
                    onChange={(e) => setSelectedSenior(e.target.value)}
                    required
                  >
                    <option value="">اختر صيدلي خبير</option>
                    {pharmacists.map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        {ph.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <motion.button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-purple-500/25"
                  disabled={!selectedSenior}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  حفظ
                </motion.button>
              </form>
              {assignError && (
                <motion.div
                  className="text-red-400 mt-4 p-4 bg-red-900/20 rounded-xl border border-red-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {assignError}
                </motion.div>
              )}
              {assignSuccess && (
                <motion.div
                  className="text-green-400 mt-4 p-4 bg-green-900/20 rounded-xl border border-green-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {assignSuccess}
                </motion.div>
              )}
            </motion.div>
          )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assigned Pharmacists Section */}
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onClick={() => setActiveDetailView("pharmacists")}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                الصيادلة المعينون
              </h3>
              <div className="text-4xl">👨‍⚕️</div>
            </div>
            {loadingPharmacists ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl"
                  >
                    <Skeleton width={40} height={40} className="rounded-full" />
                    <div className="flex-1">
                      <Skeleton width="60%" height={20} className="mb-2" />
                      <Skeleton width="40%" height={16} />
                    </div>
                  </div>
                ))}
              </div>
            ) : pharmacists.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👨‍⚕️</div>
                <div className="text-gray-400 text-lg">
                  لا يوجد صيادلة معينون لهذه الصيدلية.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pharmacists.slice(0, 3).map((ph) => (
                  <motion.div
                    key={ph.id}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      ph.role === "senior"
                        ? "bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border-purple-700/50"
                        : "bg-gray-900/50 border-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">👨‍⚕️</div>
                        <div>
                          <div className="text-white font-bold text-lg">
                            {ph.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {ph.username}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          ph.role === "senior"
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {ph.role === "senior" ? "صيدلي خبير" : "صيدلي"}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {pharmacists.length > 3 && (
                  <div className="text-center py-4">
                    <div className="text-fuchsia-400 font-bold">
                      + {pharmacists.length - 3} صيدلي آخر
                    </div>
                    <div className="text-gray-400 text-sm">انقر لعرض الكل</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Monthly Stock Section */}
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => setActiveDetailView("stock")}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                تقرير الشهر الحالي
              </h3>
              <div className="text-4xl">📊</div>
            </div>
            {loadingStock ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl"
                  >
                    <Skeleton width="40%" height={20} />
                    <Skeleton width="20%" height={20} />
                  </div>
                ))}
              </div>
            ) : stockError ? (
              <div className="text-red-400 p-4 bg-red-900/20 rounded-xl border border-red-800">
                {stockError}
              </div>
            ) : currentMonthItems && currentMonthItems.length > 0 ? (
              <div className="space-y-3">
                {currentMonthItems.slice(0, 3).map((item, idx) => {
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
                  const currentStock = opening + totalIncoming - totalDispensed;

                  return (
                    <motion.div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="text-white font-medium">{item.name}</div>
                      <div className="text-fuchsia-400 font-bold">
                        {currentStock}
                      </div>
                    </motion.div>
                  );
                })}
                {currentMonthItems.length > 3 && (
                  <div className="text-center py-4">
                    <div className="text-fuchsia-400 font-bold">
                      + {currentMonthItems.length - 3} صنف آخر
                    </div>
                    <div className="text-gray-400 text-sm">انقر لعرض الكل</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-gray-400 text-lg">
                  لا يوجد بيانات لهذا الشهر.
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shortages Section */}
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={() => setActiveDetailView("shortages")}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                النواقص
              </h3>
              <div className="text-4xl">⚠️</div>
            </div>
            {loadingShortages ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl"
                  >
                    <Skeleton width="40%" height={20} />
                    <Skeleton width="20%" height={20} />
                  </div>
                ))}
              </div>
            ) : shortagesError ? (
              <div className="text-red-400 p-4 bg-red-900/20 rounded-xl border border-red-800">
                {shortagesError}
              </div>
            ) : shortages && shortages.length > 0 ? (
              <div className="space-y-3">
                {shortages.slice(0, 3).map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-red-900/20 rounded-xl border border-red-800/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-red-400 font-bold">
                      {item.quantity}
                    </div>
                  </motion.div>
                ))}
                {shortages.length > 3 && (
                  <div className="text-center py-4">
                    <div className="text-red-400 font-bold">
                      + {shortages.length - 3} نقص آخر
                    </div>
                    <div className="text-gray-400 text-sm">انقر لعرض الكل</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-gray-400 text-lg">
                  لا يوجد نواقص لهذا الشهر.
                </div>
              </div>
            )}
          </motion.div>

          {/* Attendance Section */}
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={() => setActiveDetailView("attendance")}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                الحضور اليومي ({today})
              </h3>
              <div className="text-4xl">👥</div>
            </div>
            {loadingAttendance ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl"
                  >
                    <Skeleton width="40%" height={20} />
                    <Skeleton width="20%" height={20} />
                  </div>
                ))}
              </div>
            ) : attendanceError ? (
              <div className="text-red-400 p-4 bg-red-900/20 rounded-xl border border-red-800">
                {attendanceError}
              </div>
            ) : pharmacists.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <div className="text-gray-400 text-lg">
                  لا يوجد صيادلة معينون لهذه الصيدلية.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pharmacists.slice(0, 3).map((ph) => (
                  <motion.div
                    key={ph.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50"
                  >
                    <div className="text-white font-medium">{ph.name}</div>
                    <div className="flex items-center gap-3">
                      {isSenior ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={attendance[ph.id] === true}
                            onChange={(e) =>
                              handleAttendanceChange(ph.id, e.target.checked)
                            }
                            id={`attend-${ph.id}`}
                            className="w-5 h-5 text-fuchsia-600 bg-gray-800 border-gray-600 rounded focus:ring-fuchsia-500 focus:ring-2"
                          />
                          <label
                            htmlFor={`attend-${ph.id}`}
                            className="text-gray-300"
                          >
                            {attendance[ph.id] === true ? "حاضر" : "غائب"}
                          </label>
                        </div>
                      ) : attendance[ph.id] === true ? (
                        <span className="text-green-400 font-bold flex items-center gap-2">
                          <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                          حاضر
                        </span>
                      ) : attendance[ph.id] === false ? (
                        <span className="text-red-400 font-bold flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                          غائب
                        </span>
                      ) : (
                        <span className="text-gray-500 font-bold flex items-center gap-2">
                          <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                          غير محدد
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {pharmacists.length > 3 && (
                  <div className="text-center py-4">
                    <div className="text-green-400 font-bold">
                      + {pharmacists.length - 3} صيدلي آخر
                    </div>
                    <div className="text-gray-400 text-sm">انقر لعرض الكل</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {activeDetailView && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveDetailView(null)}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl border border-fuchsia-700/50 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-fuchsia-700/50">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                {activeDetailView === "pharmacists" && "الصيادلة المعينون"}
                {activeDetailView === "stock" && "تقرير الشهر الحالي"}
                {activeDetailView === "shortages" && "النواقص"}
                {activeDetailView === "attendance" &&
                  `الحضور اليومي (${today})`}
              </h2>
              <motion.button
                className="text-gray-400 hover:text-white text-2xl"
                onClick={() => setActiveDetailView(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {activeDetailView === "pharmacists" && (
                <div className="space-y-4">
                  {pharmacists.map((ph) => (
                    <motion.div
                      key={ph.id}
                      className={`p-6 rounded-xl border transition-all duration-300 ${
                        ph.role === "senior"
                          ? "bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border-purple-700/50"
                          : "bg-gray-900/50 border-gray-700/50"
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
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
                            <div className="text-gray-500 text-sm">
                              {ph.email}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg text-lg font-bold ${
                            ph.role === "senior"
                              ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {ph.role === "senior" ? "صيدلي خبير" : "صيدلي"}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeDetailView === "stock" && (
                <div className="space-y-4">
                  {currentMonthItems.map((item, idx) => {
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
                    const currentStock =
                      opening + totalIncoming - totalDispensed;

                    return (
                      <motion.div
                        key={idx}
                        className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-white font-bold text-xl">
                            {item.name}
                          </div>
                          <div className="text-fuchsia-400 font-bold text-2xl">
                            {currentStock}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-gray-400">
                            <div>الرصيد الافتتاحي</div>
                            <div className="text-white font-bold">
                              {opening}
                            </div>
                          </div>
                          <div className="text-gray-400">
                            <div>إجمالي الوارد</div>
                            <div className="text-green-400 font-bold">
                              {totalIncoming}
                            </div>
                          </div>
                          <div className="text-gray-400">
                            <div>إجمالي المنصرف</div>
                            <div className="text-red-400 font-bold">
                              {totalDispensed}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {activeDetailView === "shortages" && (
                <div className="space-y-4">
                  {shortages.map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="p-6 bg-red-900/20 rounded-xl border border-red-800/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-white font-bold text-xl">
                          {item.name}
                        </div>
                        <div className="text-red-400 font-bold text-2xl">
                          {Math.floor(item.quantity)}
                        </div>
                      </div>
                      <div className="text-red-300 text-sm mt-2">
                        يحتاج إلى إعادة طلب عاجل
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeDetailView === "attendance" && (
                <div className="space-y-4">
                  {pharmacists.map((ph) => (
                    <motion.div
                      key={ph.id}
                      className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50"
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
                        <div className="flex items-center gap-3">
                          {isSenior ? (
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={attendance[ph.id] === true}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    ph.id,
                                    e.target.checked
                                  )
                                }
                                id={`attend-modal-${ph.id}`}
                                className="w-6 h-6 text-fuchsia-600 bg-gray-800 border-gray-600 rounded focus:ring-fuchsia-500 focus:ring-2"
                              />
                              <label
                                htmlFor={`attend-modal-${ph.id}`}
                                className="text-gray-300 text-lg"
                              >
                                {attendance[ph.id] === true ? "حاضر" : "غائب"}
                              </label>
                            </div>
                          ) : attendance[ph.id] === true ? (
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
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
