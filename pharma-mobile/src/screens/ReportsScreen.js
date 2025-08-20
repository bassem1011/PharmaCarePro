import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useInventoryData } from "../hooks/useInventoryData";
import { useAuth } from "../hooks/useAuth";
import { useRoute } from "@react-navigation/native";
import AnimatedButton from "../components/common/AnimatedButton";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { PDFService } from "../services/pdfService";
import { colors, radii, shadows, spacing } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MonthYearPicker from "../components/common/MonthYearPicker";

const ReportsScreen = () => {
  const { user, assignedPharmacy } = useAuth();
  const route = useRoute();
  const insets = useSafeAreaInsets();
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

  // Get Arabic month names
  const getArabicMonthName = (monthIndex) => {
    const arabicMonths = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return arabicMonths[monthIndex] || "";
  };

  // Calculate consumption report data matching web version
  const reportData = useMemo(() => {
    if (!inventory.items || !Array.isArray(inventory.items)) {
      return {
        months: [],
        items: [],
        summary: {
          totalItems: 0,
          averageConsumption: 0,
          currentMonthTotal: 0,
        },
      };
    }

    // Get last 3 months (current, previous, previous-previous)
    const getLastThreeMonths = () => {
      const months = [];
      const selectedDate = new Date(inventory.year, inventory.month, 1);

      for (let i = 2; i >= 0; i--) {
        const date = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() - i,
          1
        );
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        months.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          key: monthKey,
          name: getArabicMonthName(date.getMonth()),
          isCurrent: i === 0,
        });
      }
      return months;
    };

    const months = getLastThreeMonths();

    // Filter valid items
    const validItems = inventory.items.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.name &&
        typeof item.name === "string" &&
        item.name.trim() !== ""
    );

    // Calculate consumption for each item from daily dispensed data
    const itemsWithConsumption = validItems.map((item) => {
      const consumptions = months.map((month) => {
        // Get monthly consumption from inventory.monthlyConsumption if available
        if (
          inventory.monthlyConsumption &&
          inventory.monthlyConsumption[item.name]
        ) {
          const monthData =
            inventory.monthlyConsumption[item.name].months[month.key];
          return monthData || 0;
        }

        // Fallback: calculate from daily dispensed data for current month
        if (month.isCurrent) {
          return Object.values(item.dailyDispense || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          );
        }

        return 0;
      });

      const totalConsumption = consumptions.reduce((sum, val) => sum + val, 0);
      const average =
        consumptions.length > 0
          ? Math.floor(totalConsumption / consumptions.length)
          : 0;

      return {
        name: item.name,
        consumptions: consumptions.map((val) => Math.floor(val)),
        average,
        totalConsumption: Math.floor(totalConsumption),
      };
    });

    const totalItems = itemsWithConsumption.length;
    const averageConsumption =
      totalItems > 0
        ? Math.floor(
            itemsWithConsumption.reduce((sum, item) => sum + item.average, 0) /
              totalItems
          )
        : 0;
    const currentMonthTotal = itemsWithConsumption.reduce(
      (sum, item) => sum + item.consumptions[2],
      0
    ); // Current month is at index 2

    return {
      months,
      items: itemsWithConsumption,
      summary: {
        totalItems,
        averageConsumption,
        currentMonthTotal: Math.floor(currentMonthTotal),
      },
    };
  }, [
    inventory.items,
    inventory.month,
    inventory.year,
    inventory.monthlyConsumption,
  ]);

  // Export to PDF matching web format
  const exportPDF = async () => {
    try {
      const currentMonthName = getArabicMonthName(inventory.month);
      const reportTitle = `تقرير استهلاك عن شهر ${currentMonthName} ${inventory.year}`;
      const pharmacyTitle = `صيدلية ${pharmacyName}`;

      // Create PDF content
      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 18px; font-weight: bold; color: #673ab7; margin-bottom: 10px; }
              .subtitle { font-size: 14px; color: #666; }
              .date { font-size: 12px; color: #999; margin-top: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #673ab7; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .summary { margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${reportTitle}</div>
              <div class="subtitle">${pharmacyTitle}</div>
              <div class="date">تاريخ التقرير: ${new Date().toLocaleDateString(
                "ar-EG"
              )}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>اسم الصنف</th>
                  ${reportData.months
                    .map((m) => `<th>${m.name} ${m.year}</th>`)
                    .join("")}
                  <th>المتوسط</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    ${item.consumptions
                      .map((val) => `<td>${val}</td>`)
                      .join("")}
                    <td><strong>${item.average}</strong></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="summary">
              <p><strong>ملخص التقرير:</strong></p>
              <p>إجمالي الأصناف: ${reportData.summary.totalItems}</p>
              <p>متوسط الاستهلاك: ${reportData.summary.averageConsumption}</p>
              <p>إجمالي الشهر الحالي: ${
                reportData.summary.currentMonthTotal
              }</p>
            </div>
          </body>
        </html>
      `;

      await PDFService.generateAndSharePDF(
        html,
        `تقرير_استهلاك_${currentMonthName}_${inventory.year}`
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
          <Text style={styles.loadingText}>جاري تحميل بيانات التقرير...</Text>
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
            colors={["#8b5cf6", "#7c3aed"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.headerIcon}>📊</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>تقرير الاستهلاك</Text>
                  <Text style={styles.headerSubtitle}>
                    آخر 3 أشهر من البيانات
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
              colors={["#3b82f6", "#1d4ed8"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>إجمالي الأصناف</Text>
                  <Text style={styles.statValue}>
                    {reportData.summary.totalItems}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📦</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>متوسط الاستهلاك</Text>
                  <Text style={styles.statValue}>
                    {reportData.summary.averageConsumption}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📈</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>الشهر الحالي</Text>
                  <Text style={styles.statValue}>
                    {reportData.summary.currentMonthTotal}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📅</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Report Information */}
          <View style={styles.reportInfoSection}>
            <Text style={styles.reportTitle}>
              تقرير استهلاك عن شهر {getArabicMonthName(inventory.month)}{" "}
              {inventory.year}
            </Text>
            <Text style={styles.pharmacyTitle}>صيدلية {pharmacyName}</Text>
          </View>

          {/* Consumption Table */}
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>تفاصيل الاستهلاك</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, styles.nameColumn]}>
                    اسم الصنف
                  </Text>
                  {reportData.months.map((month, index) => (
                    <Text key={index} style={styles.headerCell}>
                      {month.name} {month.year}
                    </Text>
                  ))}
                  <Text style={styles.headerCell}>المتوسط</Text>
                </View>

                {/* Table Body */}
                {reportData.items.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                  >
                    <View style={[styles.cell, styles.nameColumn]}>
                      <Text style={styles.cellText}>{item.name}</Text>
                    </View>
                    {item.consumptions.map((consumption, monthIndex) => (
                      <View key={monthIndex} style={styles.cell}>
                        <Text style={[styles.cellText, styles.consumptionText]}>
                          {consumption}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.cell}>
                      <Text style={[styles.cellText, styles.averageText]}>
                        {item.average}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Table Footer */}
                <View style={styles.tableFooter}>
                  <View style={[styles.cell, styles.nameColumn]}>
                    <Text style={styles.footerText}>الإجمالي</Text>
                  </View>
                  {reportData.months.map((month, index) => {
                    const monthTotal = reportData.items.reduce(
                      (sum, item) => sum + (item.consumptions[index] || 0),
                      0
                    );
                    return (
                      <View key={index} style={styles.cell}>
                        <Text style={styles.footerText}>{monthTotal}</Text>
                      </View>
                    );
                  })}
                  <View style={styles.cell}>
                    <Text style={styles.footerText}>
                      {reportData.summary.averageConsumption}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Export Button */}
          <View style={styles.exportSection}>
            <AnimatedButton
              title="تحميل PDF"
              onPress={exportPDF}
              variant="primary"
              size="medium"
            />
          </View>
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
  pharmacyTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
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
  tableContainer: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.brandStart,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerCell: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    width: 100,
  },
  nameColumn: {
    width: 150,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  evenRow: {
    backgroundColor: "rgba(55, 65, 81, 0.3)",
  },
  cell: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  cellText: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: "center",
  },
  consumptionText: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
  averageText: {
    color: "#10b981",
    fontWeight: "bold",
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  footerText: {
    color: "#8b5cf6",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  exportSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
});

export default ReportsScreen;
