import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { getAuth } from "firebase/auth";
import offlineService from "../services/offlineService";
import notificationService from "../services/notificationService";

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pharmacies: 0,
    pharmacists: 0,
    seniors: 0,
    present: 0,
    absent: 0,
  });

  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [shortagePercentage, setShortagePercentage] = useState(0);
  const [zeroAttendancePharmacies, setZeroAttendancePharmacies] = useState(0);
  const [highShortagePharmacies, setHighShortagePharmacies] = useState(0);

  // Initialize services
  useEffect(() => {
    notificationService.initialize();
    offlineService.loadPendingOperations();
    fetchStats();
  }, []);

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get current user for multi-tenancy
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const today = getTodayDateString();

      // Fetch pharmacies using ownerId filter (multi-tenant)
      const pharmaciesQuery = query(
        collection(db, "pharmacies"),
        where("ownerId", "==", currentUser.uid)
      );
      const pharmaciesSnap = await getDocs(pharmaciesQuery);
      const pharmacies = pharmaciesSnap.docs;

      // Fetch users using ownerId filter (multi-tenant)
      const usersQuery = query(
        collection(db, "users"),
        where("ownerId", "==", currentUser.uid)
      );
      const usersSnap = await getDocs(usersQuery);
      const users = usersSnap.docs;

      // Calculate attendance like web version (only for user's pharmacies)
      let presentCount = 0;
      let absentCount = 0;

      let zeroAttendanceCount = 0;
      let highShortageCount = 0;

      const todayMonthKey = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      })();

      for (const pharmacyDoc of pharmacies) {
        try {
          // Attendance today (single doc read)
          const todayAttDocRef = doc(
            db,
            "pharmacies",
            pharmacyDoc.id,
            "attendance",
            today
          );
          const todayAttDoc = await getDoc(todayAttDocRef);
          let hasPresent = false;
          if (todayAttDoc.exists()) {
            const att = todayAttDoc.data();
            if (att && typeof att === "object") {
              Object.values(att).forEach((val) => {
                if (val === true) {
                  presentCount++;
                  hasPresent = true;
                } else if (val === false) {
                  absentCount++;
                }
              });
            }
          }
          if (!hasPresent) {
            zeroAttendanceCount++;
          }

          // Shortages percent for this pharmacy (monthlyStock current month)
          try {
            const monthDocRef = doc(
              db,
              "pharmacies",
              pharmacyDoc.id,
              "monthlyStock",
              todayMonthKey
            );
            const monthDoc = await getDoc(monthDocRef);
            if (monthDoc.exists()) {
              const data = monthDoc.data();
              const items = Array.isArray(data?.items) ? data.items : [];
              const totalItems = items.filter((it) => it && it.name).length;
              if (totalItems > 0) {
                const lowCount = items
                  .filter((it) => it && it.name)
                  .filter((it) => {
                    const opening = parseFloat(it.opening) || 0;
                    const totalIncoming = Object.values(
                      it.dailyIncoming || {}
                    ).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                    const totalDispensed = Object.values(
                      it.dailyDispense || {}
                    ).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                    const current = Math.floor(
                      opening + totalIncoming - totalDispensed
                    );
                    return current <= 10; // low threshold
                  }).length;
                const pct = (lowCount / totalItems) * 100;
                if (pct >= 20) {
                  highShortageCount++;
                }
              }
            }
          } catch (e) {
            // ignore shortages errors per pharmacy
          }
        } catch (error) {}
      }

      // Calculate statistics
      const seniorCount = users.filter(
        (doc) => doc.data().role === "senior"
      ).length;

      // Calculate attendance percentage
      const totalAttendance = presentCount + absentCount;
      const attendancePercent =
        totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      // Shortage percentage across all pharmacies: based on highShortageCount ratio
      const shortagePercent =
        pharmacies.length > 0
          ? Math.min(
              100,
              Math.max(0, (highShortageCount / pharmacies.length) * 100)
            )
          : 0;

      setStats({
        pharmacies: pharmacies.length,
        pharmacists: users.length,
        seniors: seniorCount,
        present: presentCount,
        absent: absentCount,
      });

      setAttendancePercentage(attendancePercent);
      setShortagePercentage(shortagePercent);
      setZeroAttendancePharmacies(zeroAttendanceCount);
      setHighShortagePharmacies(highShortageCount);

      // Send attendance alert if rate is low
      if (totalAttendance > 0) {
        const attendanceRate = (presentCount / totalAttendance) * 100;
        if (attendanceRate < 80) {
          notificationService.sendAttendanceAlert(
            "Overall",
            presentCount,
            totalAttendance
          );
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default values on error
      setStats({
        pharmacies: 0,
        pharmacists: 0,
        seniors: 0,
        present: 0,
        absent: 0,
      });
      setAttendancePercentage(0);
      setShortagePercentage(0);
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchStats();
  };

  return {
    loading,
    stats,
    attendancePercentage,
    shortagePercentage,
    zeroAttendancePharmacies,
    highShortagePharmacies,
    refreshData,
  };
};
