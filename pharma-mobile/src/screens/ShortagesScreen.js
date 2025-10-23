import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radii, shadows } from "../utils/theme";
import { useAuth } from "../hooks/useAuth";
import { useInventoryData } from "../hooks/useInventoryData";
import MonthYearPicker from "../components/common/MonthYearPicker";
import AnimatedButton from "../components/common/AnimatedButton";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { PDFService } from "../services/pdfService";

export default function ShortagesScreen() {
  const insets = useSafeAreaInsets();
  const { assignedPharmacy } = useAuth();
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const inventory = useInventoryData(assignedPharmacy?.id);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get pharmacy name
  const pharmacyName = assignedPharmacy?.name || "الصيدلية";

  // Calculate shortages data with comprehensive analysis
  const shortageData = useMemo(() => {
    if (!inventory.items || !Array.isArray(inventory.items)) {
      return {
        items: [],
        summary: {
          totalShortages: 0,
          criticalShortages: 0,
          warningShortages: 0,
          totalValue: 0,
        },
      };
    }

    const validItems = inventory.items.filter(
      (item) => item && item.name && item.name.trim() !== ""
    );

    const itemsWithShortageAnalysis = validItems
      .map((item) => {
        // Calculate current stock
        const opening = Number(item.opening || 0);
        const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const currentStock = Math.floor(
          opening + totalIncoming - totalDispensed
        );

        // Calculate average consumption (from dispensed data)
        const dailyDispensedValues = Object.values(item.dailyDispense || {});
        const avgConsumption =
          dailyDispensedValues.length > 0
            ? Math.floor(
                dailyDispensedValues.reduce(
                  (sum, val) => sum + (Number(val) || 0),
                  0
                ) / dailyDispensedValues.length
              )
            : 0;

        // Define shortage thresholds
        const minimumStock = Math.max(10, avgConsumption * 5); // Minimum 10 or 5 days of consumption
        const reorderPoint = Math.max(20, avgConsumption * 10); // Reorder at 20 or 10 days consumption

        // Determine shortage status
        let status = "normal";
        let priority = "low";
        let suggestedOrder = 0;

        if (currentStock <= 0) {
          status = "critical";
          priority = "urgent";
          suggestedOrder = reorderPoint;
        } else if (currentStock <= minimumStock) {
          status = "critical";
          priority = "high";
          suggestedOrder = reorderPoint - currentStock;
        } else if (currentStock <= reorderPoint) {
          status = "warning";
          priority = "medium";
          suggestedOrder = reorderPoint - currentStock;
        }

        const unitPrice = Number(item.unitPrice || 0);
        const estimatedValue = suggestedOrder * unitPrice;

        return {
          name: item.name,
          currentStock,
          avgConsumption,
          minimumStock,
          reorderPoint,
          status,
          priority,
          suggestedOrder,
          unitPrice,
          estimatedValue,
          daysLeft:
            avgConsumption > 0
              ? Math.floor(currentStock / avgConsumption)
              : 999,
        };
      })
      .filter((item) => item.status !== "normal") // Only show items with shortages
      .sort((a, b) => {
        // Sort by priority: urgent > high > medium, then by days left
        const priorityOrder = { urgent: 0, high: 1, medium: 2 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.daysLeft - b.daysLeft;
      });

    const summary = {
      totalShortages: itemsWithShortageAnalysis.length,
      criticalShortages: itemsWithShortageAnalysis.filter(
        (item) => item.status === "critical"
      ).length,
      warningShortages: itemsWithShortageAnalysis.filter(
        (item) => item.status === "warning"
      ).length,
      totalValue: Math.floor(
        itemsWithShortageAnalysis.reduce(
          (sum, item) => sum + item.estimatedValue,
          0
        )
      ),
    };

    return {
      items: itemsWithShortageAnalysis,
      summary,
    };
  }, [inventory.items]);

  // Export shortage report as PDF
  const exportPDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 18px; font-weight: bold; color: #ef4444; margin-bottom: 10px; }
              .subtitle { font-size: 14px; color: #666; }
              .date { font-size: 12px; color: #999; margin-top: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #ef4444; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .critical { background-color: #fee2e2; }
              .warning { background-color: #fef3c7; }
              .summary { margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">تقرير النواقص والأصناف المطلوب طلبها</div>
              <div class="subtitle">صيدلية ${pharmacyName}</div>
              <div class="date">تاريخ التقرير: ${new Date().toLocaleDateString(
                "ar-EG"
              )}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>اسم الصنف</th>
                  <th>المخزون الحالي</th>
                  <th>متوسط الاستهلاك</th>
                  <th>الأيام المتبقية</th>
                  <th>الكمية المطلوبة</th>
                  <th>القيمة المقدرة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${shortageData.items
                  .map(
                    (item) => `
                  <tr class="${item.status}">
                    <td>${item.name}</td>
                    <td>${item.currentStock}</td>
                    <td>${item.avgConsumption}</td>
                    <td>${
                      item.daysLeft === 999 ? "غير محدد" : item.daysLeft
                    }</td>
                    <td>${item.suggestedOrder}</td>
                    <td>${item.estimatedValue.toFixed(2)}</td>
                    <td>${item.status === "critical" ? "حرج" : "تحذير"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="summary">
              <p><strong>ملخص النواقص:</strong></p>
              <p>إجمالي الأصناف الناقصة: ${
                shortageData.summary.totalShortages
              }</p>
              <p>الأصناف الحرجة: ${shortageData.summary.criticalShortages}</p>
              <p>أصناف التحذير: ${shortageData.summary.warningShortages}</p>
              <p>القيمة الإجمالية للطلب: ${shortageData.summary.totalValue.toFixed(
                2
              )} جنيه</p>
            </div>
          </body>
        </html>
      `;

      await PDFService.generateAndSharePDF(
        html,
        `تقرير_النواقص_${new Date().getTime()}`
      );
    } catch (error) {
      Alert.alert("خطأ", "فشل في تحميل التقرير");
    }
  };

  if (inventory.loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandStart} />
          <Text style={styles.loadingText}>جاري تحميل بيانات النواقص...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(60, insets.bottom + 16),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Professional Header matching web */}
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.headerIcon}>⚠️</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>تقرير النواقص</Text>
                  <Text style={styles.headerSubtitle}>
                    الأصناف المطلوب طلبها
                  </Text>
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

          {/* Summary Statistics Cards */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>إجمالي النواقص</Text>
                  <Text style={styles.statValue}>
                    {shortageData.summary.totalShortages}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📋</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#dc2626", "#b91c1c"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>حالات حرجة</Text>
                  <Text style={styles.statValue}>
                    {shortageData.summary.criticalShortages}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>🚨</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>تحذيرات</Text>
                  <Text style={styles.statValue}>
                    {shortageData.summary.warningShortages}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>⚡</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Pharmacy Information */}
          <View style={styles.reportInfoSection}>
            <Text style={styles.reportTitle}>صيدلية {pharmacyName}</Text>
            <Text style={styles.pharmacySubtitle}>
              قيمة الطلب المقدرة: {shortageData.summary.totalValue} جنيه
            </Text>
          </View>

          {/* Shortages List or No Data */}
          {shortageData.items.length === 0 ? (
            <View style={styles.noShortagesContainer}>
              <View style={styles.successIconWrapper}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color="#10b981"
                />
              </View>
              <Text style={styles.noShortagesTitle}>ممتاز! 🎉</Text>
              <Text style={styles.noShortagesText}>
                لا توجد نواقص في المخزون حالياً
              </Text>
              <Text style={styles.noShortagesSubtext}>
                جميع الأصناف متوفرة بكميات كافية
              </Text>
            </View>
          ) : (
            <View style={styles.shortagesSection}>
              <Text style={styles.sectionTitle}>قائمة النواقص</Text>

              {shortageData.items.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.shortageCard,
                    item.status === "critical" && styles.criticalCard,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          item.status === "critical"
                            ? styles.criticalBadge
                            : styles.warningBadge,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            item.status === "critical"
                              ? "alert-circle"
                              : "alert"
                          }
                          size={16}
                          color="#ffffff"
                        />
                        <Text style={styles.priorityText}>
                          {item.status === "critical" ? "حرج" : "تحذير"}
                        </Text>
                      </View>
                    </View>

                    {item.daysLeft < 999 && (
                      <Text
                        style={[
                          styles.daysLeft,
                          item.daysLeft <= 3 && styles.urgentDays,
                        ]}
                      >
                        {item.daysLeft <= 0
                          ? "نفد المخزون"
                          : `يكفي لـ ${item.daysLeft} أيام`}
                      </Text>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.metricRow}>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>المخزون الحالي</Text>
                        <Text
                          style={[
                            styles.metricValue,
                            item.currentStock <= 0 && styles.zeroStock,
                          ]}
                        >
                          {item.currentStock}
                        </Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>متوسط الاستهلاك</Text>
                        <Text style={styles.metricValue}>
                          {item.avgConsumption}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderSection}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderLabel}>الكمية المطلوبة:</Text>
                        <Text style={styles.orderValue}>
                          {item.suggestedOrder}
                        </Text>
                      </View>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderLabel}>القيمة المقدرة:</Text>
                        <Text style={styles.orderValue}>
                          {Math.floor(item.estimatedValue)} ج
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Export Button */}
          {shortageData.items.length > 0 && (
            <View style={styles.exportSection}>
              <AnimatedButton
                title="تحميل PDF"
                onPress={exportPDF}
                variant="primary"
                size="medium"
              />
            </View>
          )}
        </Animated.View>

        <MonthYearPicker
          visible={showMonthYearPicker}
          month={inventory.month}
          year={inventory.year}
          onConfirm={(month, year) => {
            inventory.setMonth(month);
            inventory.setYear(year);
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
    minWidth: "30%",
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
  reportInfoSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.medium,
  },
  reportTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  pharmacySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  noShortagesContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.medium,
  },
  successIconWrapper: {
    marginBottom: spacing.lg,
  },
  noShortagesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  noShortagesText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  noShortagesSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
  },
  shortagesSection: {
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: spacing.lg,
  },
  shortageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    ...shadows.medium,
  },
  criticalCard: {
    borderLeftColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  criticalBadge: {
    backgroundColor: "#ef4444",
  },
  warningBadge: {
    backgroundColor: "#f59e0b",
  },
  priorityText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  daysLeft: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  urgentDays: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  cardBody: {
    gap: spacing.md,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  zeroStock: {
    color: "#ef4444",
  },
  orderSection: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  orderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  orderValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8b5cf6",
  },
  exportSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
});
