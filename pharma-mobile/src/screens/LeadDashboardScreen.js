import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AnimatedButton from "../components/common/AnimatedButton";
import SkeletonLoader from "../components/common/SkeletonLoader";
import PullToRefresh from "../components/common/PullToRefresh";
import NetworkStatusBar from "../components/common/NetworkStatusBar";
import { useAuth } from "../hooks/useAuth";

// Dashboard Components
import { DashboardHeader, QuickActions } from "../components/dashboard";

// Custom Hooks
import { useDashboardData } from "../hooks/useDashboardData";
import { useDashboardAnimations } from "../hooks/useDashboardAnimations";
import { colors, spacing, radii, shadows, gradients } from "../utils/theme";
import StatsGrid from "../components/dashboard/StatsGrid";

// const { width } = Dimensions.get("window");

const LeadDashboardScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  // Custom hooks for data and animations
  const {
    loading,
    stats,
    attendancePercentage,
    shortagePercentage,
    refreshData,
  } = useDashboardData();

  const { fadeAnim } = useDashboardAnimations(loading);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
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
            // Root navigator will render auth screens based on user state
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const safeNavigate = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (error) {
      console.error(`Navigation error to ${screenName}:`, error);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <NetworkStatusBar />
        <View style={styles.loadingContainer}>
          <SkeletonLoader />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <NetworkStatusBar />
      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <View style={styles.container}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Header (no logout button here; moved to bottom) */}
            <DashboardHeader onLogout={handleLogout} showLogout={false} />

            {/* Hero Section */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={gradients.brand}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroIconContainer}>
                    <MaterialCommunityIcons
                      name="shield-crown"
                      size={32}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={styles.heroTitle}>مرحباً بك في لوحة التحكم</Text>
                  <Text style={styles.heroSubtitle}>
                    إدارة شاملة لجميع الصيدليات والصيادلة
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Unified Stats Grid */}
            <StatsGrid
              stats={stats}
              animatedValue={fadeAnim}
              deltas={{
                الصيدليات: { subtitle: "اليوم", value: 0 },
                الصيادلة: { subtitle: "اليوم", value: 0 },
                "الصيادلة الخبراء": { subtitle: "اليوم", value: 0 },
                "الحاضرون اليوم": {
                  subtitle: "معدل الحضور",
                  value: `${Math.round(attendancePercentage)}%`,
                  progress: attendancePercentage,
                  progressColor: colors.green,
                },
              }}
            />

            {/* Progress Indicators */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>مؤشرات الأداء</Text>
              <View style={styles.progressCards}>
                <View style={styles.progressCard}>
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    style={styles.progressGradient}
                  >
                    <View style={styles.progressContent}>
                      <View style={styles.progressIconContainer}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={24}
                          color="#ffffff"
                        />
                      </View>
                      <View style={styles.progressTextContainer}>
                        <Text style={styles.progressPercentage}>
                          {Math.round(attendancePercentage)}%
                        </Text>
                        <Text style={styles.progressLabel}>معدل الحضور</Text>
                        <Text style={styles.progressSubtext}>
                          {stats.present} حاضر • {stats.absent} غائب
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.progressCard}>
                  <LinearGradient
                    colors={["#ef4444", "#dc2626"]}
                    style={styles.progressGradient}
                  >
                    <View style={styles.progressContent}>
                      <View style={styles.progressIconContainer}>
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={24}
                          color="#ffffff"
                        />
                      </View>
                      <View style={styles.progressTextContainer}>
                        <Text style={styles.progressPercentage}>
                          {Math.round(shortagePercentage)}%
                        </Text>
                        <Text style={styles.progressLabel}>نسبة النواقص</Text>
                        <Text style={styles.progressSubtext}>
                          تحتاج مراجعة فورية
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Unified Quick Actions only */}
            <QuickActions onNavigate={safeNavigate} />

            {/* Today's Summary */}
            <View style={styles.todaySection}>
              <Text style={styles.sectionTitle}>ملخص اليوم</Text>
              <View style={styles.todayCard}>
                <LinearGradient
                  colors={gradients.card}
                  style={styles.todayGradient}
                >
                  <View style={styles.todayHeader}>
                    <MaterialCommunityIcons
                      name="calendar-today"
                      size={24}
                      color={colors.brandStart}
                    />
                    <Text style={styles.todayTitle}>نشاط اليوم</Text>
                  </View>
                  <View style={styles.todayStats}>
                    <View style={styles.todayStat}>
                      <Text style={styles.todayStatNumber}>
                        {stats.present}
                      </Text>
                      <Text style={styles.todayStatLabel}>حاضر</Text>
                    </View>
                    <View style={styles.todayStat}>
                      <Text style={styles.todayStatNumber}>{stats.absent}</Text>
                      <Text style={styles.todayStatLabel}>غائب</Text>
                    </View>
                    <View style={styles.todayStat}>
                      <Text style={styles.todayStatNumber}>
                        {stats.pharmacies}
                      </Text>
                      <Text style={styles.todayStatLabel}>صيدلية نشطة</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </ScrollView>
          {/* Bottom Logout Button */}
          <View
            style={[
              styles.bottomBar,
              {
                paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md),
              },
            ]}
          >
            <AnimatedButton
              title="تسجيل الخروج"
              onPress={handleLogout}
              color="#ef4444"
              icon="logout"
            />
          </View>
        </View>
      </PullToRefresh>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    marginBottom: spacing.xxl,
  },
  heroGradient: {
    borderRadius: radii.lg,
    padding: spacing.xxl,
    ...shadows.glowBrand,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },

  // Section Titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "right",
  },
  issueMeta: {
    color: colors.textSecondary,
    textAlign: "right",
    marginBottom: spacing.sm,
  },

  // Stats Section
  statsSection: {
    marginBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  statGradient: {
    padding: spacing.lg,
    alignItems: "center",
    minHeight: 100,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: spacing.xs,
    textAlign: "center",
  },

  // Progress Section
  progressSection: {
    marginBottom: spacing.xxl,
  },
  progressCards: {
    gap: spacing.lg,
  },
  progressCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  progressGradient: {
    padding: spacing.lg,
  },
  progressContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  progressLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: spacing.xs,
  },
  progressSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: spacing.xs,
  },

  // Action Buttons Section
  actionButtonsSection: {
    marginBottom: spacing.xxl,
  },
  actionButtonsContainer: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: 0,
  },

  // Today Section
  todaySection: {
    marginBottom: spacing.xxl,
  },
  todayCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  todayGradient: {
    padding: spacing.lg,
  },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  todayStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  todayStat: {
    alignItems: "center",
  },
  todayStatNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  todayStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
});

export default LeadDashboardScreen;
