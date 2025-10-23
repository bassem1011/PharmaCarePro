import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import offlineService from "../services/offlineService";

export const useAttendanceData = () => {
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [pharmacists, setPharmacists] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  useEffect(() => {
    if (selectedPharmacy) {
      fetchPharmacists();
      fetchAttendance();
    }
  }, [selectedPharmacy]);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      // Use direct Firestore like web version
      const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
      const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPharmacies(pharmaciesData || []);

      if (pharmaciesData && pharmaciesData.length > 0) {
        setSelectedPharmacy(pharmaciesData[0]);
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacists = async () => {
    if (!selectedPharmacy) return;

    try {
      // Use direct Firestore like web version
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const pharmacyPharmacists =
        usersData.filter(
          (user) => user.assignedPharmacy === selectedPharmacy.id
        ) || [];
      setPharmacists(pharmacyPharmacists);
    } catch (error) {
      console.error("Error fetching pharmacists:", error);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedPharmacy) return;

    try {
      setLoadingAttendance(true);
      const today = new Date().toISOString().slice(0, 10);

      // Use subcollection like web version
      const attendanceRef = doc(
        db,
        "pharmacies",
        selectedPharmacy.id,
        "attendance",
        today
      );
      const attendanceSnap = await getDoc(attendanceRef);

      if (attendanceSnap.exists()) {
        setAttendanceData(attendanceSnap.data());
      } else {
        setAttendanceData({});
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendanceData({});
    } finally {
      setLoadingAttendance(false);
    }
  };

  const markAttendance = async (pharmacistId, status) => {
    if (!selectedPharmacy) return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const attendanceRef = doc(
        db,
        "pharmacies",
        selectedPharmacy.id,
        "attendance",
        today
      );

      // Get current attendance data
      const attendanceSnap = await getDoc(attendanceRef);
      const currentData = attendanceSnap.exists() ? attendanceSnap.data() : {};

      // Update attendance for the specific pharmacist
      const updatedData = {
        ...currentData,
        [pharmacistId]: status === "present" ? true : false,
        lastUpdated: new Date().toISOString(),
      };

      await setDoc(attendanceRef, updatedData);
      setAttendanceData(updatedData);

      return true;
    } catch (error) {
      console.error("Error marking attendance:", error);
      return false;
    }
  };

  const getAttendanceStats = () => {
    const totalPharmacists = pharmacists.length;
    const presentCount = Object.values(attendanceData).filter(
      (status) => status === true
    ).length;
    const absentCount = Object.values(attendanceData).filter(
      (status) => status === false
    ).length;

    return {
      total: totalPharmacists,
      present: presentCount,
      absent: absentCount,
      pending: totalPharmacists - presentCount - absentCount,
    };
  };

  const refreshData = async () => {
    await fetchPharmacies();
    if (selectedPharmacy) {
      await fetchPharmacists();
      await fetchAttendance();
    }
  };

  return {
    loading,
    pharmacies,
    selectedPharmacy,
    pharmacists,
    attendanceData,
    loadingAttendance,
    setSelectedPharmacy,
    markAttendance,
    getAttendanceStats,
    refreshData,
  };
};
