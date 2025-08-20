import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { getAuth } from "firebase/auth";
import { Calendar, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";

function getTodayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function AttendancePage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedPharmacy, setSelectedPharmacy] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    unknown: 0,
    attendanceRate: 0,
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [buttonFeedback, setButtonFeedback] = useState({
    present: false,
    absent: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
                // For senior pharmacists, fetch their assigned pharmacy and pharmacists
                if (
                  parsedUser.role === "senior" &&
                  parsedUser.assignedPharmacy
                ) {
                  // Fetch the assigned pharmacy
                  const pharmacyDoc = await getDoc(
                    doc(db, "pharmacies", parsedUser.assignedPharmacy)
                  );
                  if (pharmacyDoc.exists()) {
                    const pharmacyData = {
                      id: pharmacyDoc.id,
                      ...pharmacyDoc.data(),
                    };
                    setPharmacies([pharmacyData]);

                    // Fetch pharmacists assigned to this pharmacy
                    const pharmacistsQuery = query(
                      collection(db, "users"),
                      where(
                        "assignedPharmacy",
                        "==",
                        parsedUser.assignedPharmacy
                      )
                    );
                    const pharmacistsSnap = await getDocs(pharmacistsQuery);
                    const pharmacistsData = pharmacistsSnap.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    }));
                    setPharmacists(pharmacistsData);

                    // Fetch attendance data for the assigned pharmacy
                    const attendanceRef = doc(
                      db,
                      "pharmacies",
                      parsedUser.assignedPharmacy,
                      "attendance",
                      selectedDate
                    );
                    const attendanceSnap = await getDoc(attendanceRef);
                    const attendanceMap = {};
                    attendanceMap[parsedUser.assignedPharmacy] =
                      attendanceSnap.exists() ? attendanceSnap.data() : {};
                    setAttendanceData(attendanceMap);
                  }
                } else {
                  console.error(
                    "Senior pharmacist not assigned to any pharmacy"
                  );
                  setPharmacies([]);
                  setPharmacists([]);
                  setAttendanceData({});
                }
              } else {
                console.error("Invalid user data in localStorage");
                setPharmacies([]);
                setPharmacists([]);
                setAttendanceData({});
              }
            } catch (error) {
              console.error("Error parsing user data:", error);
              setPharmacies([]);
              setPharmacists([]);
              setAttendanceData({});
            }
          } else {
            console.error("No authenticated user found");
            setPharmacies([]);
            setPharmacists([]);
            setAttendanceData({});
          }
          setLoading(false);
          return;
        }

        // For lead pharmacists (Firebase Auth users)
        // Fetch only pharmacies owned by current user
        const pharmaciesQuery = query(
          collection(db, "pharmacies"),
          where("ownerId", "==", currentUser.uid)
        );
        const pharmaciesSnap = await getDocs(pharmaciesQuery);
        const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPharmacies(pharmaciesData);

        // Fetch only pharmacists owned by current user
        const pharmacistsQuery = query(
          collection(db, "users"),
          where("ownerId", "==", currentUser.uid)
        );
        const pharmacistsSnap = await getDocs(pharmacistsQuery);
        const pharmacistsData = pharmacistsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPharmacists(pharmacistsData);

        // Fetch attendance data for all pharmacies
        const attendancePromises = pharmaciesData.map(async (pharmacy) => {
          const attendanceRef = doc(
            db,
            "pharmacies",
            pharmacy.id,
            "attendance",
            selectedDate
          );
          const attendanceSnap = await getDoc(attendanceRef);
          return {
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name,
            data: attendanceSnap.exists() ? attendanceSnap.data() : {},
          };
        });

        const attendanceResults = await Promise.all(attendancePromises);
        const attendanceMap = {};
        attendanceResults.forEach((result) => {
          attendanceMap[result.pharmacyId] = result.data;
        });
        setAttendanceData(attendanceMap);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setLoading(false);
      }
    };

    let unsubscribePharmacies = null;
    let unsubscribePharmacists = null;
    let unsubscribeAttendance = null;

    const setupRealTimeListeners = async () => {
      setLoading(true);
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
                // For senior pharmacists, fetch their assigned pharmacy and pharmacists
                if (
                  parsedUser.role === "senior" &&
                  parsedUser.assignedPharmacy
                ) {
                  // Subscribe to the assigned pharmacy
                  const pharmacyDoc = await getDoc(
                    doc(db, "pharmacies", parsedUser.assignedPharmacy)
                  );
                  if (pharmacyDoc.exists()) {
                    const pharmacyData = {
                      id: pharmacyDoc.id,
                      ...pharmacyDoc.data(),
                    };
                    setPharmacies([pharmacyData]);

                    // Subscribe to pharmacists assigned to this pharmacy
                    const pharmacistsQuery = query(
                      collection(db, "users"),
                      where(
                        "assignedPharmacy",
                        "==",
                        parsedUser.assignedPharmacy
                      )
                    );
                    unsubscribePharmacists = onSnapshot(
                      pharmacistsQuery,
                      (pharmacistsSnap) => {
                        const pharmacistsData = pharmacistsSnap.docs.map(
                          (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                          })
                        );
                        setPharmacists(pharmacistsData);
                      }
                    );

                    // Subscribe to attendance data for the assigned pharmacy
                    const attendanceRef = doc(
                      db,
                      "pharmacies",
                      parsedUser.assignedPharmacy,
                      "attendance",
                      selectedDate
                    );
                    unsubscribeAttendance = onSnapshot(
                      attendanceRef,
                      (attendanceSnap) => {
                        const attendanceMap = {};
                        attendanceMap[parsedUser.assignedPharmacy] =
                          attendanceSnap.exists() ? attendanceSnap.data() : {};
                        setAttendanceData(attendanceMap);
                      }
                    );
                  }
                } else {
                  console.error(
                    "Senior pharmacist not assigned to any pharmacy"
                  );
                  setPharmacies([]);
                  setPharmacists([]);
                  setAttendanceData({});
                }
              } else {
                console.error("Invalid user data in localStorage");
                setPharmacies([]);
                setPharmacists([]);
                setAttendanceData({});
              }
            } catch (error) {
              console.error("Error parsing user data:", error);
              setPharmacies([]);
              setPharmacists([]);
              setAttendanceData({});
            }
          } else {
            console.error("No authenticated user found");
            setPharmacies([]);
            setPharmacists([]);
            setAttendanceData({});
          }
          setLoading(false);
          return;
        }

        // For lead pharmacists (Firebase Auth users)
        // Subscribe to pharmacies owned by current user
        const pharmaciesQuery = query(
          collection(db, "pharmacies"),
          where("ownerId", "==", currentUser.uid)
        );
        unsubscribePharmacies = onSnapshot(
          pharmaciesQuery,
          (pharmaciesSnap) => {
            const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPharmacies(pharmaciesData);
          }
        );

        // Subscribe to pharmacists owned by current user
        const pharmacistsQuery = query(
          collection(db, "users"),
          where("ownerId", "==", currentUser.uid)
        );
        unsubscribePharmacists = onSnapshot(
          pharmacistsQuery,
          (pharmacistsSnap) => {
            const pharmacistsData = pharmacistsSnap.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }))
              .filter((ph) => ph.role !== "lead");
            setPharmacists(pharmacistsData);
          }
        );

        // Fetch pharmacies once to set up attendance listeners for each
        const pharmaciesSnapshotForAttendance = await getDocs(pharmaciesQuery);
        const pharmaciesDataForAttendance =
          pharmaciesSnapshotForAttendance.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        // Set up attendance listeners for each pharmacy
        const attendanceListeners = pharmaciesDataForAttendance.map(
          (pharmacy) => {
            const attendanceRef = doc(
              db,
              "pharmacies",
              pharmacy.id,
              "attendance",
              selectedDate
            );
            return onSnapshot(attendanceRef, (attendanceSnap) => {
              setAttendanceData((prev) => ({
                ...prev,
                [pharmacy.id]: attendanceSnap.exists()
                  ? attendanceSnap.data()
                  : {},
              }));
            });
          }
        );
        // Store these listeners to unsubscribe later
        unsubscribeAttendance = () =>
          attendanceListeners.forEach((unsub) => unsub());

        setLoading(false);
      } catch (error) {
        console.error("Error setting up real-time listeners:", error);
        setLoading(false);
      }
    };

    setupRealTimeListeners();

    return () => {
      if (unsubscribePharmacies) unsubscribePharmacies();
      if (unsubscribePharmacists) unsubscribePharmacists();
      if (unsubscribeAttendance) unsubscribeAttendance();
    };
  }, [selectedDate]);

  // Calculate statistics
  useEffect(() => {
    const filteredPharmacists =
      selectedPharmacy === "all"
        ? pharmacists
        : pharmacists.filter((p) => p.assignedPharmacy === selectedPharmacy);

    let total = 0;
    let present = 0;
    let absent = 0;
    let unknown = 0;

    filteredPharmacists.forEach((pharmacist) => {
      total++;
      const pharmacyAttendance =
        attendanceData[pharmacist.assignedPharmacy] || {};
      const status = pharmacyAttendance[pharmacist.id];

      if (status === true) present++;
      else if (status === false) absent++;
      else unknown++;
    });

    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    setStats({
      total,
      present,
      absent,
      unknown,
      attendanceRate,
    });
  }, [pharmacists, attendanceData, selectedPharmacy]);

  // Auto-select pharmacy for senior pharmacists with single pharmacy
  useEffect(() => {
    if (pharmacies.length === 1) {
      setSelectedPharmacy(pharmacies[0].id);
    }
  }, [pharmacies]);

  const handleAttendanceChange = async (pharmacistId, pharmacyId, present) => {
    try {
      const docRef = doc(
        db,
        "pharmacies",
        pharmacyId,
        "attendance",
        selectedDate
      );
      await setDoc(docRef, { [pharmacistId]: present }, { merge: true });

      // Update local state
      setAttendanceData((prev) => ({
        ...prev,
        [pharmacyId]: {
          ...prev[pharmacyId],
          [pharmacistId]: present,
        },
      }));
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  // Bulk mark all present
  const handleMarkAllPresent = async () => {
    setBulkLoading(true);
    setButtonFeedback((prev) => ({ ...prev, present: true }));

    try {
      const filteredPharmacists =
        selectedPharmacy === "all"
          ? pharmacists
          : pharmacists.filter((p) => p.assignedPharmacy === selectedPharmacy);

      // Update Firestore
      const updatePromises = filteredPharmacists.map(async (pharmacist) => {
        const docRef = doc(
          db,
          "pharmacies",
          pharmacist.assignedPharmacy,
          "attendance",
          selectedDate
        );
        await setDoc(docRef, { [pharmacist.id]: true }, { merge: true });
      });

      await Promise.all(updatePromises);

      // Update local state immediately
      const newAttendanceData = { ...attendanceData };
      filteredPharmacists.forEach((pharmacist) => {
        if (!newAttendanceData[pharmacist.assignedPharmacy]) {
          newAttendanceData[pharmacist.assignedPharmacy] = {};
        }
        newAttendanceData[pharmacist.assignedPharmacy][pharmacist.id] = true;
      });

      setAttendanceData(newAttendanceData);

      // Show success feedback
      setTimeout(() => {
        setButtonFeedback((prev) => ({ ...prev, present: false }));
      }, 2000);

      setBulkLoading(false);
    } catch (error) {
      console.error("Error marking all present:", error);
      setBulkLoading(false);
      setButtonFeedback((prev) => ({ ...prev, present: false }));
    }
  };

  // Bulk mark all absent
  const handleMarkAllAbsent = async () => {
    setBulkLoading(true);
    setButtonFeedback((prev) => ({ ...prev, absent: true }));

    try {
      const filteredPharmacists =
        selectedPharmacy === "all"
          ? pharmacists
          : pharmacists.filter((p) => p.assignedPharmacy === selectedPharmacy);

      // Update Firestore
      const updatePromises = filteredPharmacists.map(async (pharmacist) => {
        const docRef = doc(
          db,
          "pharmacies",
          pharmacist.assignedPharmacy,
          "attendance",
          selectedDate
        );
        await setDoc(docRef, { [pharmacist.id]: false }, { merge: true });
      });

      await Promise.all(updatePromises);

      // Update local state immediately
      const newAttendanceData = { ...attendanceData };
      filteredPharmacists.forEach((pharmacist) => {
        if (!newAttendanceData[pharmacist.assignedPharmacy]) {
          newAttendanceData[pharmacist.assignedPharmacy] = {};
        }
        newAttendanceData[pharmacist.assignedPharmacy][pharmacist.id] = false;
      });

      setAttendanceData(newAttendanceData);

      // Show success feedback
      setTimeout(() => {
        setButtonFeedback((prev) => ({ ...prev, absent: false }));
      }, 2000);

      setBulkLoading(false);
    } catch (error) {
      console.error("Error marking all absent:", error);
      setBulkLoading(false);
      setButtonFeedback((prev) => ({ ...prev, absent: false }));
    }
  };

  const getStatusColor = (status) => {
    if (status === true) return "text-green-400";
    if (status === false) return "text-red-400";
    return "text-gray-400";
  };

  const getStatusIcon = (status) => {
    if (status === true)
      return <CheckCircle size={20} className="text-green-400" />;
    if (status === false) return <XCircle size={20} className="text-red-400" />;
    return <Clock size={20} className="text-gray-400" />;
  };

  const getStatusText = (status) => {
    if (status === true) return "حاضر";
    if (status === false) return "غائب";
    return "غير محدد";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Spinner size={56} className="mb-4" />
            <div className="text-white text-lg">
              جاري تحميل بيانات الحضور...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPharmacists =
    selectedPharmacy === "all"
      ? pharmacists
      : pharmacists.filter((p) => p.assignedPharmacy === selectedPharmacy);

  return (
    <div className="min-h-screen bg-gray-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 mb-3">
                نظام مراقبة الحضور
              </h1>
              <p className="text-gray-300 text-lg">
                مراقبة وإدارة الحضور اليومي للصيادلة في جميع الصيدليات
              </p>
            </div>
            <div className="text-6xl">👥</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-6 border border-fuchsia-700/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-3">
              <Calendar className="text-fuchsia-400" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-900/80 border-2 border-fuchsia-700/50 rounded-xl px-4 py-2 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="text-fuchsia-400" size={20} />
              {pharmacies.length > 1 ? (
                <select
                  value={selectedPharmacy}
                  onChange={(e) => setSelectedPharmacy(e.target.value)}
                  className="bg-gray-900/80 border-2 border-fuchsia-700/50 rounded-xl px-4 py-2 text-white focus:ring-4 focus:ring-fuchsia-600/30 focus:border-fuchsia-500 transition-all duration-300"
                >
                  <option value="all">جميع الصيدليات</option>
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </select>
              ) : pharmacies.length === 1 ? (
                <div className="bg-gray-900/80 border-2 border-fuchsia-700/50 rounded-xl px-4 py-2 text-white">
                  {pharmacies[0].name}
                </div>
              ) : (
                <div className="bg-gray-900/80 border-2 border-gray-700/50 rounded-xl px-4 py-2 text-gray-400">
                  لا توجد صيدليات
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards with Real-time Updates */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-6 border border-fuchsia-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.02, y: -2 }}
            key={`total-${stats.total}`}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.div
                  className="text-3xl font-bold text-fuchsia-400 mb-2"
                  key={stats.total}
                  initial={{ scale: 1.2, color: "#8b5cf6" }}
                  animate={{ scale: 1, color: "#a855f7" }}
                  transition={{ duration: 0.5 }}
                >
                  {stats.total}
                </motion.div>
                <div className="text-gray-300">إجمالي الصيادلة</div>
              </div>
              <div className="text-4xl">👨‍⚕️</div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-6 border border-green-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.02, y: -2 }}
            key={`present-${stats.present}`}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.div
                  className="text-3xl font-bold text-green-400 mb-2"
                  key={stats.present}
                  initial={{ scale: 1.2, color: "#22c55e" }}
                  animate={{ scale: 1, color: "#4ade80" }}
                  transition={{ duration: 0.5 }}
                >
                  {stats.present}
                </motion.div>
                <div className="text-gray-300">الحضور</div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-6 border border-red-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.02, y: -2 }}
            key={`absent-${stats.absent}`}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.div
                  className="text-3xl font-bold text-red-400 mb-2"
                  key={stats.absent}
                  initial={{ scale: 1.2, color: "#ef4444" }}
                  animate={{ scale: 1, color: "#f87171" }}
                  transition={{ duration: 0.5 }}
                >
                  {stats.absent}
                </motion.div>
                <div className="text-gray-300">الغياب</div>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-6 border border-blue-700/50 backdrop-blur-sm"
            whileHover={{ scale: 1.02, y: -2 }}
            key={`rate-${stats.attendanceRate}`}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.div
                  className="text-3xl font-bold text-blue-400 mb-2"
                  key={stats.attendanceRate}
                  initial={{ scale: 1.2, color: "#3b82f6" }}
                  animate={{ scale: 1, color: "#60a5fa" }}
                  transition={{ duration: 0.5 }}
                >
                  {stats.attendanceRate}%
                </motion.div>
                <div className="text-gray-300">نسبة الحضور</div>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Attendance List */}
        <motion.div
          className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
              تفاصيل الحضور -{" "}
              {new Date(selectedDate).toLocaleDateString("en-US")}
            </h2>
            <div className="text-4xl">📋</div>
          </div>

          {filteredPharmacists.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-gray-400 text-lg">
                لا يوجد صيادلة في الصيدلية المحددة
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPharmacists.map((pharmacist, index) => {
                const pharmacyAttendance =
                  attendanceData[pharmacist.assignedPharmacy] || {};
                const status = pharmacyAttendance[pharmacist.id];
                const pharmacy = pharmacies.find(
                  (p) => p.id === pharmacist.assignedPharmacy
                );

                return (
                  <motion.div
                    key={pharmacist.id}
                    className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-fuchsia-700/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">👨‍⚕️</div>
                        <div>
                          <div className="text-white font-bold text-lg">
                            {pharmacist.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {pharmacist.username}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          pharmacist.role === "senior"
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {pharmacist.role === "senior" ? "صيدلي خبير" : "صيدلي"}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-gray-400 text-sm mb-1">
                        الصيدلية:
                      </div>
                      <div className="text-white font-medium">
                        {pharmacy?.name || "غير محدد"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className={`font-bold ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          className={`px-3 py-1 rounded-lg text-sm font-bold transition-all duration-300 ${
                            status === true
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white"
                          }`}
                          onClick={() =>
                            handleAttendanceChange(
                              pharmacist.id,
                              pharmacist.assignedPharmacy,
                              true
                            )
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          حاضر
                        </motion.button>
                        <motion.button
                          className={`px-3 py-1 rounded-lg text-sm font-bold transition-all duration-300 ${
                            status === false
                              ? "bg-red-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white"
                          }`}
                          onClick={() =>
                            handleAttendanceChange(
                              pharmacist.id,
                              pharmacist.assignedPharmacy,
                              false
                            )
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          غائب
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick Actions - Updated with Feedback */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-bold shadow-2xl flex items-center gap-2 ${
              buttonFeedback.present
                ? "bg-gradient-to-r from-green-700 to-emerald-700 text-white"
                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-green-500/25"
            }`}
            onClick={handleMarkAllPresent}
            disabled={bulkLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {bulkLoading ? (
              <Spinner size={20} />
            ) : buttonFeedback.present ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                ✅
              </motion.div>
            ) : (
              <CheckCircle size={20} />
            )}
            <span>
              {buttonFeedback.present ? "تم التحديد!" : "تحديد الكل حاضر"}
            </span>
          </motion.button>

          <motion.button
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-bold shadow-2xl flex items-center gap-2 ${
              buttonFeedback.absent
                ? "bg-gradient-to-r from-red-700 to-pink-700 text-white"
                : "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 hover:shadow-red-500/25"
            }`}
            onClick={handleMarkAllAbsent}
            disabled={bulkLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {bulkLoading ? (
              <Spinner size={20} />
            ) : buttonFeedback.absent ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                ✅
              </motion.div>
            ) : (
              <XCircle size={20} />
            )}
            <span>
              {buttonFeedback.absent ? "تم التحديد!" : "تحديد الكل غائب"}
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
