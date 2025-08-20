import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radii, shadows } from "../utils/theme";
import QuickActions from "../components/common/QuickActions";
import StatCard from "../components/dashboard/StatCard";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { useInventoryData } from "../hooks/useInventoryData";
import AnimatedButton from "../components/common/AnimatedButton";
import SkeletonLoader from "../components/common/SkeletonLoader";
import PullToRefresh from "../components/common/PullToRefresh";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DashboardScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    user,
    userRole,
    assignedPharmacy,
    loading: authLoading,
    logout,
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const inventory = useInventoryData(assignedPharmacy?.id);

  useEffect(() => {
    if (!authLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [authLoading, fadeAnim, slideAnim]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh inventory data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تسجيل الخروج",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // Do not manually reset. The root navigator switches to auth stack based on user state
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  // Safe navigation function
  const safeNavigate = (screenName) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screenName);
    } else {
    }
  };

  const get3MonthMean = (itemName) => {
    if (
      !inventory.monthlyConsumption ||
      !inventory.monthlyConsumption[itemName]
    ) {
      return 10; // Default fallback
    }

    const item = inventory.monthlyConsumption[itemName];
    const monthKeys = Object.keys(item.months).sort();
    const recentMonths = monthKeys.slice(-3);
    const recentValues = recentMonths
      .map((monthKey) => item.months[monthKey])
      .filter((value) => value > 0);

    if (recentValues.length === 0) {
      return 10;
    }

    const sum = recentValues.reduce((acc, val) => acc + val, 0);
    return Math.floor(sum / recentValues.length);
  };

  const getCurrentStock = (itemName) => {
    if (!inventory.itemsByMonth) return 0;

    const monthKey = `${inventory.year}-${String(inventory.month + 1).padStart(
      2,
      "0"
    )}`;
    const monthData = inventory.itemsByMonth[monthKey];

    if (monthData) {
      const item = monthData.find((item) => item.name === itemName);
      if (item) {
        const opening = parseFloat(item.opening) || 0;
        const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0
        );
        const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0
        );
        return Math.floor(opening + totalIncoming - totalDispensed);
      }
    }
    return 0;
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonLoader variant="card" height={120} />
        <SkeletonLoader variant="card" height={120} />
        <SkeletonLoader variant="card" height={120} />
        <SkeletonLoader variant="card" height={120} />
      </View>
    );
  }

  const topItems = inventory.items
    .filter((item) => item && item.name)
    .sort((a, b) => get3MonthMean(b.name) - get3MonthMean(a.name))
    .slice(0, 5);

  return (
    <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={gradients.brand}
              style={styles.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroLeft}>
                <Text style={styles.heroWelcome}>مرحباً</Text>
                <Text style={styles.heroName}>
                  د/{user?.name || user?.email || "مستخدم"}
                </Text>
                <Text style={styles.heroSub}>
                  {userRole === "lead"
                    ? "مدير الصيدليات"
                    : userRole === "senior"
                    ? "صيدلي أول"
                    : "صيدلي"}
                  {assignedPharmacy ? ` • ${assignedPharmacy.name}` : ""}
                </Text>
              </View>
              {/* Logout moved to bottom bar */}
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <StatCard
                icon="cube-outline"
                label="إجمالي الأصناف"
                value={
                  inventory.items.filter((item) => item && item.name).length
                }
                color="#06b6d4"
                delta={"+اليوم"}
                subtitle="عدد الأصناف المسجلة"
              />
              <StatCard
                icon="trending-down-outline"
                label="المنصرف هذا الشهر"
                value={inventory.items
                  .filter((item) => item && item.name)
                  .reduce((total, item) => {
                    const monthKey = `${inventory.year}-${String(
                      inventory.month + 1
                    ).padStart(2, "0")}`;
                    const monthData = inventory.itemsByMonth[monthKey];
                    if (monthData) {
                      const monthItem = monthData.find(
                        (mi) => mi.name === item.name
                      );
                      if (monthItem && monthItem.dailyDispense) {
                        return (
                          total +
                          Object.values(monthItem.dailyDispense).reduce(
                            (sum, val) => sum + (val || 0),
                            0
                          )
                        );
                      }
                    }
                    return total;
                  }, 0)}
                color="#10b981"
                delta={"هذا الشهر"}
                subtitle="إجمالي المنصرف"
                progress={Math.min(100, 100)}
                progressColor="#10b981"
              />
              <StatCard
                icon="alert-circle-outline"
                label="الأصناف منخفضة"
                value={
                  inventory.items
                    .filter((item) => item && item.name)
                    .filter((item) => getCurrentStock(item.name) < 10).length
                }
                color="#f43f5e"
                delta={"<= 10"}
                subtitle="مخزون منخفض"
                progress={
                  inventory.items.filter((item) => item && item.name).length > 0
                    ? (inventory.items
                        .filter((item) => item && item.name)
                        .filter((item) => getCurrentStock(item.name) < 10)
                        .length /
                        inventory.items.filter((item) => item && item.name)
                          .length) *
                      100
                    : 0
                }
                progressColor="#f43f5e"
              />
              <StatCard
                icon="calendar-outline"
                label="الشهر الحالي"
                value={`${inventory.month + 1}/${inventory.year}`}
                color="#8b5cf6"
                subtitle="الفترة المختارة"
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
            <QuickActions
              actions={[
                {
                  icon: "cube-outline",
                  label: "المخزون",
                  color: colors.blue,
                  onPress: () => safeNavigate("Stock"),
                },
                {
                  icon: "chart-line",
                  label: "التقارير",
                  color: colors.green,
                  onPress: () => safeNavigate("Reports"),
                },
                ...(userRole === "lead"
                  ? [
                      {
                        icon: "store-outline",
                        label: "إدارة الصيدليات",
                        color: colors.brandStart,
                        onPress: () => safeNavigate("Pharmacies"),
                      },
                    ]
                  : []),
                {
                  icon: "arrow-up-bold",
                  label: "المنصرف",
                  color: colors.red,
                  onPress: () => safeNavigate("Dispense"),
                },
                {
                  icon: "arrow-down-bold",
                  label: "الوارد",
                  color: colors.green,
                  onPress: () => safeNavigate("Incoming"),
                },
                {
                  icon: "alert",
                  label: "النواقص",
                  color: colors.amber,
                  onPress: () => safeNavigate("Shortages"),
                },
                {
                  icon: "file-multiple",
                  label: "الصفحات المخصصة",
                  color: colors.brandStart,
                  onPress: () => safeNavigate("CustomPages"),
                },
                ...(userRole === "senior"
                  ? [
                      {
                        icon: "calendar-check",
                        label: "الحضور",
                        color: colors.amber,
                        onPress: () => safeNavigate("Attendance"),
                      },
                    ]
                  : []),
              ]}
            />

            {/* Top Items */}
            <View style={styles.topItemsContainer}>
              <Text style={styles.sectionTitle}>أعلى الأصناف استهلاكاً</Text>
              {topItems.map((item, index) => (
                <View key={item.name} style={styles.topItemCard}>
                  <View style={styles.topItemInfo}>
                    <Text style={styles.topItemName}>{item.name}</Text>
                    <Text style={styles.topItemStats}>
                      المتوسط: {get3MonthMean(item.name)} | المخزون:{" "}
                      {getCurrentStock(item.name)}
                    </Text>
                  </View>
                  <View style={styles.topItemRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
            {/* Bottom Logout Button */}
            <View
              style={[
                styles.bottomBar,
                { paddingBottom: Math.max(24, insets.bottom + 12) },
              ]}
            >
              <AnimatedButton
                title="تسجيل الخروج"
                onPress={handleLogout}
                color="#ef4444"
                icon="logout"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </PullToRefresh>
  );
};

// Local StatCard and QuickActionButton removed in favor of shared components

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  content: {
    padding: 16,
  },
  hero: {
    borderRadius: radii.xl,
    padding: 18,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.medium,
  },
  heroLeft: { flex: 1, alignItems: "center" },
  heroWelcome: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.95,
    textAlign: "center",
  },
  heroName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
  heroSub: {
    color: "#f3f4f6",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  heroLogout: {
    display: "none",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    justifyContent: "space-between",
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "right",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "48%",
    marginBottom: 12,
  },
  quickActionContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  quickActionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: colors.brandStart,
  },
  bottomBar: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  topItemsContainer: {
    marginBottom: 24,
  },
  topItemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  topItemStats: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default DashboardScreen;
