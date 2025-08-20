import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";
import { motion } from "framer-motion";

export default function PharmacistsPage() {
  const [pharmacists, setPharmacists] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    pharmacyId: "",
    role: "regular",
  });
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const auth = getAuth();
  const [user] = useAuthState(auth);

  // Fetch all pharmacists
  const fetchPharmacists = async () => {
    setLoading(true);
    try {
      // Get current user's UID for filtering
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Filter users by ownerId (multi-tenancy) - only show pharmacists created by this lead
      const usersQuery = query(
        collection(db, "users"),
        where("ownerId", "==", currentUser.uid)
      );
      const usersSnap = await getDocs(usersQuery);
      setPharmacists(
        usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Filter pharmacies by ownerId (multi-tenancy)
      const pharmaciesQuery = query(
        collection(db, "pharmacies"),
        where("ownerId", "==", currentUser.uid)
      );
      const pharmaciesSnap = await getDocs(pharmaciesQuery);
      setPharmacies(
        pharmaciesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (err) {
      setError("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Realtime subscriptions with owner filtering
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    // Filter users by ownerId
    const usersQuery = query(
      collection(db, "users"),
      where("ownerId", "==", currentUser.uid)
    );
    const unsubUsers = onSnapshot(usersQuery, (usersSnap) => {
      setPharmacists(
        usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    // Filter pharmacies by ownerId
    const pharmaciesQuery = query(
      collection(db, "pharmacies"),
      where("ownerId", "==", currentUser.uid)
    );
    const unsubPharmacies = onSnapshot(pharmaciesQuery, (pharmSnap) => {
      setPharmacies(
        pharmSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubPharmacies();
    };
  }, [auth.currentUser]);

  // Generate a unique username
  function generateUsername(name) {
    const base = name.trim().toLowerCase().replace(/\s+/g, "_");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${base}_${rand}`;
  }

  // Generate a random password
  function generatePassword(length = 8) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < length; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }

  // Handle form submit
  const handleAddPharmacist = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGeneratedUsername("");
    setGeneratedPassword("");
    try {
      // Get current user's UID for ownerId
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("User not authenticated");
        return;
      }

      // Generate username and password
      const username = generateUsername(form.name);
      const password = generatePassword();

      // Save to Firestore (no Firebase Auth) with ownerId
      const userDoc = doc(collection(db, "users"));
      await setDoc(userDoc, {
        id: userDoc.id,
        username,
        password, // In production, hash this!
        name: form.name,
        role: form.role,
        assignedPharmacy: form.pharmacyId,
        ownerId: currentUser.uid, // Add ownerId for multi-tenancy
        createdAt: new Date().toISOString(),
      });
      setSuccess("تم إنشاء الصيدلي بنجاح!");
      setGeneratedUsername(username);
      setGeneratedPassword(password);
      setForm({ name: "", pharmacyId: "", role: "regular" });
      setShowForm(false);
      fetchPharmacists();
    } catch (err) {
      setError("فشل إنشاء الصيدلي. حاول مرة أخرى.");
    }
  };

  const handleRoleChange = async (pharmacist, newRole) => {
    try {
      if (newRole === "senior" && pharmacist.assignedPharmacy) {
        const usersSnap = await getDocs(collection(db, "users"));
        const samePharmacyUsers = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (u) =>
              u.assignedPharmacy === pharmacist.assignedPharmacy &&
              u.id !== pharmacist.id
          );
        const batch = writeBatch(db);
        samePharmacyUsers.forEach((u) =>
          batch.set(
            doc(db, "users", u.id),
            { role: "regular" },
            { merge: true }
          )
        );
        batch.set(
          doc(db, "users", pharmacist.id),
          { ...pharmacist, role: "senior" },
          { merge: true }
        );
        await batch.commit();
      } else {
        await setDoc(
          doc(db, "users", pharmacist.id),
          { ...pharmacist, role: newRole },
          { merge: true }
        );
      }
      fetchPharmacists();
    } catch (err) {
      setError("فشل تحديث الدور");
    }
  };

  const handlePharmacyChange = async (pharmacist, newPharmacyId) => {
    try {
      await setDoc(
        doc(db, "users", pharmacist.id),
        { ...pharmacist, assignedPharmacy: newPharmacyId },
        { merge: true }
      );
      fetchPharmacists();
    } catch (err) {
      setError("فشل تحديث الصيدلية");
    }
  };

  const handleRemovePharmacist = async (pharmacistId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الصيدلي؟")) {
      try {
        // Debug: Log current user info
        const currentUser = auth.currentUser;
        console.log("Current user:", currentUser);
        console.log("Current user UID:", currentUser?.uid);

        if (!currentUser) {
          setError("يجب تسجيل الدخول كمسؤول");
          return;
        }

        // Debug: Get current user's role
        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
        console.log(
          "Current user document:",
          currentUserDoc.exists() ? currentUserDoc.data() : "Not found"
        );

        if (!currentUserDoc.exists()) {
          setError("بيانات المستخدم غير موجودة");
          return;
        }

        const currentUserData = currentUserDoc.data();
        console.log("Current user role:", currentUserData.role);
        console.log("Current user data:", currentUserData);

        // First check if the user exists and get their data
        const userDoc = await getDoc(doc(db, "users", pharmacistId));
        if (!userDoc.exists()) {
          setError("الصيدلي غير موجود");
          return;
        }

        const userData = userDoc.data();
        console.log("Pharmacist data:", userData);
        console.log("Pharmacist ownerId:", userData.ownerId);
        console.log("Current user UID:", currentUser.uid);
        console.log("Ownership check:", userData.ownerId === currentUser.uid);

        // Check if the current user is a lead and owns this pharmacist
        if (currentUserData.role !== "lead") {
          setError("يجب أن تكون مسؤول لحذف الصيادلة");
          return;
        }

        // For lead users, check ownership
        if (userData.ownerId && userData.ownerId !== currentUser.uid) {
          setError("لا يمكنك حذف صيدلي لا تملكه");
          return;
        }

        // Delete the user document
        await deleteDoc(doc(db, "users", pharmacistId));
        // No need to call fetchPharmacists - onSnapshot will update automatically
      } catch (err) {
        console.error("Error deleting pharmacist:", err);
        setError("فشل حذف الصيدلي: " + err.message);
      }
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
          إدارة الصيادلة
        </h1>
        <p className="text-gray-300 text-lg">
          عرض وإدارة جميع الصيادلة في النظام
        </p>
      </motion.div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-fuchsia-400">الصيادلة</h2>
        <motion.button
          className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105"
          onClick={() => setShowForm((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          + إضافة صيدلي
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 mb-8 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
            إضافة صيدلي جديد
          </h3>
          <form onSubmit={handleAddPharmacist} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <input
                  type="text"
                  className="w-full border-2 border-fuchsia-700/50 rounded-xl px-6 py-4 bg-gray-900/80 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300 text-lg backdrop-blur-sm"
                  placeholder="اسم الصيدلي"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <div className="relative">
                <select
                  className="w-full border-2 border-fuchsia-700/50 rounded-xl px-6 py-4 bg-gray-900/80 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300 text-lg backdrop-blur-sm appearance-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="regular">صيدلي</option>
                  <option value="senior">صيدلي خبير</option>
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <div className="relative">
                <select
                  className="w-full border-2 border-fuchsia-700/50 rounded-xl px-6 py-4 bg-gray-900/80 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300 text-lg backdrop-blur-sm appearance-none"
                  value={form.pharmacyId}
                  onChange={(e) =>
                    setForm({ ...form, pharmacyId: e.target.value })
                  }
                >
                  <option value="">اختر الصيدلية</option>
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
            <div className="flex gap-4">
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
                  setForm({ name: "", pharmacyId: "", role: "regular" });
                  setError("");
                  setSuccess("");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                إلغاء
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {success && (
        <motion.div
          className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-2xl p-6 text-green-400 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-lg font-bold mb-3">{success}</div>
          {generatedUsername && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-300">اسم المستخدم:</span>
                <span className="font-mono bg-green-900/50 px-3 py-1 rounded-lg text-green-200">
                  {generatedUsername}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-300">كلمة المرور:</span>
                <span className="font-mono bg-green-900/50 px-3 py-1 rounded-lg text-green-200">
                  {generatedPassword}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div
          className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-red-400 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl p-6 border border-fuchsia-700/50"
            >
              <Skeleton width="100%" height={28} className="mb-3" />
              <Skeleton width="70%" height={20} className="mb-3" />
              <Skeleton width="50%" height={16} />
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
          {pharmacists.map((pharmacist, index) => (
            <motion.div
              key={pharmacist.id}
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2">
                      {pharmacist.name}
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      {pharmacist.username}
                    </div>
                  </div>
                  <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                    👨‍⚕️
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                    <span className="text-sm text-gray-300 font-medium">
                      الدور:
                    </span>
                    <select
                      className="text-sm border border-fuchsia-700/50 rounded-lg px-3 py-2 bg-gray-800/80 text-white focus:ring-2 focus:ring-fuchsia-600/50 focus:border-fuchsia-500 transition-all duration-300"
                      value={pharmacist.role}
                      onChange={(e) =>
                        handleRoleChange(pharmacist, e.target.value)
                      }
                    >
                      <option value="regular">صيدلي</option>
                      <option value="senior">صيدلي خبير</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                    <span className="text-sm text-gray-300 font-medium">
                      الصيدلية:
                    </span>
                    <select
                      className="text-sm border border-fuchsia-700/50 rounded-lg px-3 py-2 bg-gray-800/80 text-white focus:ring-2 focus:ring-fuchsia-600/50 focus:border-fuchsia-500 transition-all duration-300"
                      value={pharmacist.assignedPharmacy || ""}
                      onChange={(e) =>
                        handlePharmacyChange(pharmacist, e.target.value)
                      }
                    >
                      <option value="">غير معين</option>
                      {pharmacies.map((pharmacy) => (
                        <option key={pharmacy.id} value={pharmacy.id}>
                          {pharmacy.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 rounded-xl border border-fuchsia-700/50">
                    <span className="text-sm text-gray-300 font-medium">
                      كلمة المرور:
                    </span>
                    <span className="text-sm text-fuchsia-300 font-mono bg-gray-800/80 px-3 py-2 rounded-lg border border-fuchsia-600/50">
                      {pharmacist.password}
                    </span>
                  </div>

                  <motion.button
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-red-500/25 transform hover:scale-105"
                    onClick={() => handleRemovePharmacist(pharmacist.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    حذف
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && pharmacists.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-8xl mb-6 transform hover:scale-110 transition-transform duration-300">
            👨‍⚕️
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">لا يوجد صيادلة</h3>
          <p className="text-gray-400 text-lg mb-8">ابدأ بإضافة صيدلي جديد</p>
          <motion.button
            className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105"
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + إضافة صيدلي
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
