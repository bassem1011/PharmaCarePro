import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radii, shadows } from "../utils/theme";
import { useAuth } from "../hooks/useAuth";
import { useInventoryData } from "../hooks/useInventoryData";
import MonthYearPicker from "../components/common/MonthYearPicker";

export default function IncomingScreen() {
  const insets = useSafeAreaInsets();
  const { assignedPharmacy } = useAuth();
  const {
    items,
    updateItem,
    addItem,
    month,
    year,
    setMonth,
    setYear,
    loading,
  } = useInventoryData(assignedPharmacy?.id);

  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const daysInMonth = useMemo(
    () => new Date(year, month + 1, 0).getDate(),
    [month, year]
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // Professional statistics calculations matching web version
  const memoizedCalculations = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return {
        totalItems: 0,
        totalIncoming: 0,
        totalDispensed: 0,
        totalOpeningAndIncoming: 0,
        remainingStock: 0,
        factoryTotal: 0,
        authorityTotal: 0,
        scissorsTotal: 0,
      };
    }

    const calculations = items.reduce(
      (acc, item) => {
        const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const opening = Math.floor(Number(item.opening || 0));
        const totalOpeningAndIncoming = opening + totalIncoming;
        const remainingStock = totalOpeningAndIncoming - totalDispensed;

        // Calculate incoming by source
        let factoryTotal = 0,
          authorityTotal = 0,
          scissorsTotal = 0;
        Object.keys(item.dailyIncoming || {}).forEach((day) => {
          const amount = Number(item.dailyIncoming[day]) || 0;
          const source = (item.incomingSource || {})[day];
          if (source === "مصنع") factoryTotal += amount;
          else if (source === "شركه") authorityTotal += amount;
          else if (source === "مقصه") scissorsTotal += amount;
        });

        return {
          totalItems: acc.totalItems + 1,
          totalIncoming: acc.totalIncoming + totalIncoming,
          totalDispensed: acc.totalDispensed + totalDispensed,
          totalOpeningAndIncoming:
            acc.totalOpeningAndIncoming + totalOpeningAndIncoming,
          remainingStock: acc.remainingStock + remainingStock,
          factoryTotal: acc.factoryTotal + factoryTotal,
          authorityTotal: acc.authorityTotal + authorityTotal,
          scissorsTotal: acc.scissorsTotal + scissorsTotal,
        };
      },
      {
        totalItems: 0,
        totalIncoming: 0,
        totalDispensed: 0,
        totalOpeningAndIncoming: 0,
        remainingStock: 0,
        factoryTotal: 0,
        authorityTotal: 0,
        scissorsTotal: 0,
      }
    );

    return {
      ...calculations,
      totalIncoming: Math.floor(calculations.totalIncoming),
      totalDispensed: Math.floor(calculations.totalDispensed),
      totalOpeningAndIncoming: Math.floor(calculations.totalOpeningAndIncoming),
      remainingStock: Math.floor(calculations.remainingStock),
      factoryTotal: Math.floor(calculations.factoryTotal),
      authorityTotal: Math.floor(calculations.authorityTotal),
      scissorsTotal: Math.floor(calculations.scissorsTotal),
    };
  }, [items]);

  const sourceTypes = ["مصنع", "شركه", "مقصه"];

  const cycleSource = (item, idx, day) => {
    const current = (item.incomingSource || {})[day] || null;
    const next =
      current == null
        ? sourceTypes[0]
        : sourceTypes[(sourceTypes.indexOf(current) + 1) % sourceTypes.length];
    updateItem(idx, {
      incomingSource: {
        ...(item.incomingSource || {}),
        [day]: next,
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandStart} />
          <Text style={styles.loadingText}>جاري تحميل بيانات الوارد...</Text>
        </View>
      </View>
    );
  }

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
            colors={["#10b981", "#059669"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.headerIcon}>📥</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>الوارد اليومي</Text>
                  <Text style={styles.headerSubtitle}>تتبع الوارد اليومي</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => setShowMonthYearPicker(true)}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={18}
                  color="#ffffff"
                />
                <Text style={styles.monthButtonText}>تغيير الشهر/السنة</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Professional Statistics Cards matching web */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={["#3b82f6", "#1d4ed8"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>إجمالي الأصناف</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.totalItems}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📋</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>إجمالي الوارد</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.totalIncoming}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📥</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>من المصنع</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.factoryTotal}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>🏭</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>من الشركة</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.authorityTotal}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>🏢</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Professional Table Section */}
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>تفاصيل الوارد اليومي</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableWrap}
            >
              <View
                style={[
                  styles.table,
                  { width: 140 + days.length * 68 + 5 * 100 },
                ]}
              >
                <View style={styles.headerRow}>
                  <View style={[styles.nameCell, styles.headerCell]}>
                    <Text style={styles.headerText}>الصنف</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() =>
                        addItem({ name: "", opening: 0, unitPrice: 0 })
                      }
                    >
                      <Text style={styles.addButtonText}>+ إضافة صنف</Text>
                    </TouchableOpacity>
                  </View>
                  {days.map((d) => (
                    <View
                      key={`h-${year}-${month}-${d}`}
                      style={[styles.dayCell, styles.headerCell]}
                    >
                      <Text style={styles.headerText}>{d}</Text>
                    </View>
                  ))}
                  <View style={[styles.sumCell, styles.headerCell]}>
                    <Text style={styles.headerText}>الافتتاحي</Text>
                  </View>
                  <View style={[styles.sumCell, styles.headerCell]}>
                    <Text style={styles.headerText}>الوارد</Text>
                  </View>
                  <View style={[styles.sumCell, styles.headerCell]}>
                    <Text style={styles.headerText}>المنصرف</Text>
                  </View>
                  <View style={[styles.sumCell, styles.headerCell]}>
                    <Text style={styles.headerText}>المتبقي</Text>
                  </View>
                  <View style={[styles.sumCell, styles.headerCell]}>
                    <Text style={styles.headerText}>المصدر</Text>
                  </View>
                </View>

                {items
                  .map((item, idx) => {
                    if (!item) return null;
                    const totalIncoming = Object.values(
                      item.dailyIncoming || {}
                    ).reduce((sum, v) => sum + (Number(v) || 0), 0);
                    const opening = Number(item.opening || 0);
                    const totalDispensed = Object.values(
                      item.dailyDispense || {}
                    ).reduce((sum, v) => sum + (Number(v) || 0), 0);
                    const remaining = opening + totalIncoming - totalDispensed;

                    return (
                      <View
                        key={`r-${idx}-${item.name}`}
                        style={styles.dataRow}
                      >
                        <View
                          style={[
                            styles.nameCell,
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <TextInput
                              style={styles.nameInput}
                              defaultValue={item.name || ""}
                              placeholder="اسم الصنف"
                              onEndEditing={(e) => {
                                const newName = (
                                  e.nativeEvent.text || ""
                                ).trim();
                                if (newName !== item.name) {
                                  updateItem(idx, { name: newName });
                                }
                              }}
                              placeholderTextColor="#9ca3af"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={() => updateItem(idx, { name: "" })}
                            style={{ padding: 6 }}
                          >
                            <Text
                              style={{ color: "#ef4444", fontWeight: "700" }}
                            >
                              حذف
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {days.map((d) => (
                          <View key={`${idx}-${d}`} style={styles.dayCell}>
                            <TextInput
                              style={styles.input}
                              defaultValue={String(
                                (item.dailyIncoming || {})[d] || ""
                              )}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor="#9ca3af"
                              onEndEditing={(e) => {
                                const val = Number(e.nativeEvent.text) || 0;
                                const currentVal =
                                  (item.dailyIncoming || {})[d] || 0;
                                if (val !== currentVal) {
                                  updateItem(idx, {
                                    dailyIncoming: {
                                      ...(item.dailyIncoming || {}),
                                      [d]: val,
                                    },
                                  });
                                }
                              }}
                            />
                            <TouchableOpacity
                              style={styles.sourcePill}
                              onPress={() => cycleSource(item, idx, d)}
                            >
                              <Text style={styles.sourceText}>
                                {(item.incomingSource || {})[d] || "—"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}

                        <View style={styles.sumCell}>
                          <Text style={styles.totalText}>{opening}</Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text style={[styles.totalText, styles.incomingText]}>
                            {totalIncoming}
                          </Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text
                            style={[styles.totalText, styles.dispensedText]}
                          >
                            {totalDispensed}
                          </Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text
                            style={[styles.totalText, styles.remainingText]}
                          >
                            {remaining}
                          </Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text style={styles.totalText}>—</Text>
                        </View>
                      </View>
                    );
                  })
                  .filter(Boolean)}
              </View>
            </ScrollView>
          </View>
        </Animated.View>

        <MonthYearPicker
          visible={showMonthYearPicker}
          month={month}
          year={year}
          onConfirm={(selectedMonth, selectedYear) => {
            setMonth(selectedMonth);
            setYear(selectedYear);
            setShowMonthYearPicker(false);
          }}
          onCancel={() => setShowMonthYearPicker(false)}
        />
      </ScrollView>
    </View>
  );
}

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
  monthButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  monthButtonText: {
    color: "#ffffff",
    fontSize: 12,
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
  tableSection: {
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
  tableWrap: { marginTop: 8 },
  table: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.brandStart,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#2b3446",
  },
  footerRow: {
    flexDirection: "row",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 2,
    borderTopColor: "#10b981",
  },
  nameCell: {
    width: 140,
    padding: 10,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#374151",
  },
  dayCell: {
    width: 68,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#374151",
  },
  sumCell: {
    width: 100,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#374151",
  },
  headerCell: {
    backgroundColor: "transparent",
    paddingVertical: spacing.md,
  },
  headerText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  nameInput: {
    backgroundColor: "#111827",
    color: colors.textPrimary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#374151",
    textAlign: "right",
    fontSize: 12,
  },
  input: {
    backgroundColor: "#111827",
    color: colors.textPrimary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#374151",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 4,
  },
  sourcePill: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 45,
    alignItems: "center",
  },
  sourceText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  totalText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  incomingText: {
    color: "#10b981",
  },
  dispensedText: {
    color: "#ef4444",
  },
  remainingText: {
    color: "#3b82f6",
  },
  footerText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#10b981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
});
