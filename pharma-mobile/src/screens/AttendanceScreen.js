import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, radii, shadows } from "../utils/theme";
import AnimatedButton from "../components/common/AnimatedButton";

function getTodayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const AttendanceScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, assignedPharmacy } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedPharmacy, setSelectedPharmacy] = useState("all");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [buttonFeedback, setButtonFeedback] = useState({
    present: false,
    absent: false,
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Force scope for senior pharmacists to their assigned pharmacy
  useEffect(() => {
    if (user?.role === "senior" && assignedPharmacy?.id) {
      setSelectedPharmacy(assignedPharmacy.id);
    }
  }, [user?.role, assignedPharmacy?.id]);

  // Auto-select pharmacy for senior pharmacists with single pharmacy
  useEffect(() => {
    if (pharmacies.length === 1) {
      setSelectedPharmacy(pharmacies[0].id);
    }
  }, [pharmacies]);

  // Load data
  useEffect(() => {
    let unsubscribePharmacies = null;
    let unsubscribePharmacists = null;
    let unsubscribeAttendance = null;

    const setupRealTimeListeners = async () => {
      try {
        setLoading(true);

        // Get current user for multi-tenancy
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
          const pharmaUser = await AsyncStorage.getItem("pharmaUser");
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
                console.error("Invalid user data in AsyncStorage");
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

        // Subscribe to attendance data for all pharmacies
        const pharmaciesSnap = await getDocs(pharmaciesQuery);
        const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Set up attendance listeners for each pharmacy
        const attendanceListeners = pharmaciesData.map((pharmacy) => {
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
        });

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user for multi-tenancy
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
        const pharmaUser = await AsyncStorage.getItem("pharmaUser");
        if (pharmaUser) {
          try {
            const parsedUser = JSON.parse(pharmaUser);
            if (parsedUser && parsedUser.username && parsedUser.role) {
              // For senior pharmacists, fetch their assigned pharmacy and pharmacists
              if (parsedUser.role === "senior" && parsedUser.assignedPharmacy) {
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
                    where("assignedPharmacy", "==", parsedUser.assignedPharmacy)
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
                console.error("Senior pharmacist not assigned to any pharmacy");
                setPharmacies([]);
                setPharmacists([]);
                setAttendanceData({});
              }
            } else {
              console.error("Invalid user data in AsyncStorage");
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
      const pharmacistsData = pharmacistsSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((ph) => ph.role !== "lead");
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

  // Calculate statistics
  const stats = useMemo(() => {
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

    return {
      total,
      present,
      absent,
      unknown,
      attendanceRate,
    };
  }, [pharmacists, attendanceData, selectedPharmacy]);

  // Handle attendance change
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
      Alert.alert("خطأ", "فشل في تحديث الحضور");
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
      Alert.alert("خطأ", "فشل في تحديث الحضور");
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
      Alert.alert("خطأ", "فشل في تحديث الحضور");
    }
  };

  // Get status styling
  const getStatusIcon = (status) => {
    if (status === true)
      return (
        <MaterialCommunityIcons name="check-circle" size={20} color="#4ade80" />
      );
    if (status === false)
      return (
        <MaterialCommunityIcons name="close-circle" size={20} color="#f87171" />
      );
    return <MaterialCommunityIcons name="clock" size={20} color="#9ca3af" />;
  };

  const getStatusText = (status) => {
    if (status === true) return "حاضر";
    if (status === false) return "غائب";
    return "غير محدد";
  };

  const getStatusColor = (status) => {
    if (status === true) return "#4ade80";
    if (status === false) return "#f87171";
    return "#9ca3af";
  };

  // Get past 7 days for date picker
  const getPastWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandStart} />
          <Text style={styles.loadingText}>جاري تحميل بيانات الحضور...</Text>
        </View>
      </View>
    );
  }

  const filteredPharmacists =
    selectedPharmacy === "all"
      ? pharmacists
      : pharmacists.filter((p) => p.assignedPharmacy === selectedPharmacy);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(480, insets.bottom + 240), // Doubled the padding
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Professional Header matching web */}
          <LinearGradient
            colors={["#8b5cf6", "#7c3aed"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.headerIcon}>👥</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>نظام مراقبة الحضور</Text>
                  <Text style={styles.headerSubtitle}>
                    مراقبة وإدارة الحضور اليومي للصيادلة
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Filters Section */}
          <View style={styles.filtersSection}>
            <View style={styles.filterRow}>
              <View style={styles.filterItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={colors.brandStart}
                />
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Text style={styles.dateText}>
                    {new Date(selectedDate).toLocaleDateString("ar-EG", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <MaterialCommunityIcons
                    name="calendar-edit"
                    size={16}
                    color={colors.brandStart}
                  />
                </TouchableOpacity>
              </View>

              {user?.role === "lead" && (
                <View style={styles.filterItem}>
                  <MaterialCommunityIcons
                    name="store"
                    size={20}
                    color={colors.brandStart}
                  />
                  <View style={styles.pharmacySelector}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <TouchableOpacity
                        style={[
                          styles.pharmacyChip,
                          selectedPharmacy === "all" &&
                            styles.pharmacyChipActive,
                        ]}
                        onPress={() => setSelectedPharmacy("all")}
                      >
                        <Text
                          style={[
                            styles.pharmacyChipText,
                            selectedPharmacy === "all" &&
                              styles.pharmacyChipTextActive,
                          ]}
                        >
                          جميع الصيدليات
                        </Text>
                      </TouchableOpacity>
                      {pharmacies.map((pharmacy) => (
                        <TouchableOpacity
                          key={pharmacy.id}
                          style={[
                            styles.pharmacyChip,
                            selectedPharmacy === pharmacy.id &&
                              styles.pharmacyChipActive,
                          ]}
                          onPress={() => setSelectedPharmacy(pharmacy.id)}
                        >
                          <Text
                            style={[
                              styles.pharmacyChipText,
                              selectedPharmacy === pharmacy.id &&
                                styles.pharmacyChipTextActive,
                            ]}
                          >
                            {pharmacy.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Statistics Cards */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>إجمالي الصيادلة</Text>
                  <Text style={styles.statValue}>{stats.total}</Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>👨‍⚕️</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>الحضور</Text>
                  <Text style={styles.statValue}>{stats.present}</Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>✅</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>الغياب</Text>
                  <Text style={styles.statValue}>{stats.absent}</Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>❌</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#3b82f6", "#1d4ed8"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>نسبة الحضور</Text>
                  <Text style={styles.statValue}>{stats.attendanceRate}%</Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📊</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Attendance List */}
          <View style={styles.attendanceSection}>
            <Text style={styles.sectionTitle}>
              تفاصيل الحضور -{" "}
              {new Date(selectedDate).toLocaleDateString("ar-EG")}
            </Text>

            {filteredPharmacists.length === 0 ? (
              <View style={styles.noDataContainer}>
                <View style={styles.noDataIconWrapper}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={64}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.noDataTitle}>لا يوجد صيادلة</Text>
                <Text style={styles.noDataText}>
                  لا يوجد صيادلة في الصيدلية المحددة
                </Text>
              </View>
            ) : (
              <View style={styles.pharmacistsList}>
                {filteredPharmacists.map((pharmacist, index) => {
                  const pharmacyAttendance =
                    attendanceData[pharmacist.assignedPharmacy] || {};
                  const status = pharmacyAttendance[pharmacist.id];
                  const pharmacy = pharmacies.find(
                    (p) => p.id === pharmacist.assignedPharmacy
                  );

                  return (
                    <View key={pharmacist.id} style={styles.pharmacistCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.pharmacistInfo}>
                          <View style={styles.avatarWrapper}>
                            <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
                          </View>
                          <View style={styles.pharmacistDetails}>
                            <Text style={styles.pharmacistName}>
                              {pharmacist.name}
                            </Text>
                            <Text style={styles.pharmacistUsername}>
                              {pharmacist.username}
                            </Text>
                            <Text style={styles.pharmacyName}>
                              {pharmacy?.name || "غير محدد"}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.roleBadge,
                            pharmacist.role === "senior" && styles.seniorBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleText,
                              pharmacist.role === "senior" && styles.seniorText,
                            ]}
                          >
                            {pharmacist.role === "senior"
                              ? "صيدلي خبير"
                              : "صيدلي"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.attendanceControls}>
                        <View style={styles.statusInfo}>
                          {getStatusIcon(status)}
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(status) },
                            ]}
                          >
                            {getStatusText(status)}
                          </Text>
                        </View>

                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              status === true && styles.presentButton,
                            ]}
                            onPress={() =>
                              handleAttendanceChange(
                                pharmacist.id,
                                pharmacist.assignedPharmacy,
                                true
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                status === true && styles.activeButtonText,
                              ]}
                            >
                              حاضر
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              status === false && styles.absentButton,
                            ]}
                            onPress={() =>
                              handleAttendanceChange(
                                pharmacist.id,
                                pharmacist.assignedPharmacy,
                                false
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                status === false && styles.activeButtonText,
                              ]}
                            >
                              غائب
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <AnimatedButton
              title={buttonFeedback.present ? "تم التحديد!" : "تحديد الكل حاضر"}
              onPress={handleMarkAllPresent}
              variant="primary"
              size="medium"
              disabled={bulkLoading}
              style={[
                styles.bulkButton,
                buttonFeedback.present && styles.successButton,
              ]}
            />
            <AnimatedButton
              title={buttonFeedback.absent ? "تم التحديد!" : "تحديد الكل غائب"}
              onPress={handleMarkAllAbsent}
              variant="secondary"
              size="medium"
              disabled={bulkLoading}
              style={[
                styles.bulkButton,
                buttonFeedback.absent && styles.errorButton,
              ]}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>اختر التاريخ</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setDatePickerVisible(false)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.datesList}>
                {getPastWeekDates().map((date, index) => {
                  const dateString = date.toISOString().slice(0, 10);
                  const isSelected = dateString === selectedDate;
                  const isToday = dateString === getTodayDateString();

                  return (
                    <TouchableOpacity
                      key={dateString}
                      style={[
                        styles.dateOption,
                        isSelected && styles.selectedDateOption,
                      ]}
                      onPress={() => {
                        setSelectedDate(dateString);
                        setDatePickerVisible(false);
                      }}
                    >
                      <View style={styles.dateOptionContent}>
                        <Text
                          style={[
                            styles.dateOptionText,
                            isSelected && styles.selectedDateOptionText,
                          ]}
                        >
                          {date.toLocaleDateString("ar-EG", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Text>
                        {isToday && (
                          <View style={styles.todayBadge}>
                            <Text style={styles.todayText}>اليوم</Text>
                          </View>
                        )}
                        {isSelected && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color="#ffffff"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  headerGradient: {
    margin: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.large,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  filtersSection: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  filterRow: {
    gap: spacing.md,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateInput: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  pharmacySelector: {
    flex: 1,
  },
  pharmacyChip: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  pharmacyChipActive: {
    backgroundColor: colors.brandStart,
    borderColor: colors.brandStart,
  },
  pharmacyChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  pharmacyChipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  statIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  statEmoji: {
    fontSize: 20,
  },
  attendanceSection: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: spacing.lg,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  noDataIconWrapper: {
    marginBottom: spacing.lg,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  pharmacistsList: {
    gap: spacing.md,
  },
  pharmacistCard: {
    backgroundColor: "rgba(55, 65, 81, 0.5)",
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pharmacistInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  pharmacistDetails: {
    flex: 1,
  },
  pharmacistName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  pharmacistUsername: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  pharmacyName: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: "#374151",
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  seniorBadge: {
    backgroundColor: colors.brandStart,
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  seniorText: {
    color: "#ffffff",
  },
  attendanceControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: "#374151",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  presentButton: {
    backgroundColor: "#10b981",
  },
  absentButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  activeButtonText: {
    color: "#ffffff",
  },
  quickActionsSection: {
    flexDirection: "row",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  bulkButton: {
    flex: 1,
  },
  successButton: {
    backgroundColor: "#10b981",
  },
  errorButton: {
    backgroundColor: "#ef4444",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "70%",
  },
  modalGradient: {
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  datesList: {
    maxHeight: 300,
    padding: spacing.md,
  },
  dateOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  selectedDateOption: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "#ffffff",
  },
  dateOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateOptionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  selectedDateOptionText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  todayBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  todayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default AttendanceScreen;
