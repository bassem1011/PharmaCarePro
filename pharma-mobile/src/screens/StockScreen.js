import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, radii, shadows } from "../utils/theme";
import { useInventoryData } from "../hooks/useInventoryData";
import { useAuth } from "../hooks/useAuth";
import MonthYearPicker from "../components/common/MonthYearPicker";
import AnimatedButton from "../components/common/AnimatedButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PDFService } from "../services/pdfService";

const StockScreen = () => {
  const insets = useSafeAreaInsets();
  const { assignedPharmacy } = useAuth();
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({});
  const inventory = useInventoryData(assignedPharmacy?.id);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Professional statistics calculations matching web version
  const memoizedCalculations = useMemo(() => {
    if (!inventory.items || !Array.isArray(inventory.items)) {
      return {
        totalItems: 0,
        totalIncoming: 0,
        totalDispensed: 0,
        currentStock: 0,
        totalValue: 0,
      };
    }

    const calculations = inventory.items.reduce(
      (acc, item) => {
        const totalIncoming = Math.floor(
          Object.values(item.dailyIncoming || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          )
        );
        const totalDispensed = Math.floor(
          Object.values(item.dailyDispense || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          )
        );
        const opening = Math.floor(Number(item.opening || 0));
        const currentStock = opening + totalIncoming - totalDispensed;
        const unitPrice = Number(item.unitPrice || 0);
        const itemValue = currentStock * unitPrice;

        return {
          totalItems: acc.totalItems + 1,
          totalIncoming: acc.totalIncoming + totalIncoming,
          totalDispensed: acc.totalDispensed + totalDispensed,
          currentStock: acc.currentStock + currentStock,
          totalValue: acc.totalValue + itemValue,
        };
      },
      {
        totalItems: 0,
        totalIncoming: 0,
        totalDispensed: 0,
        currentStock: 0,
        totalValue: 0,
      }
    );

    return {
      ...calculations,
      totalIncoming: Math.floor(calculations.totalIncoming),
      totalDispensed: Math.floor(calculations.totalDispensed),
      currentStock: Math.floor(calculations.currentStock),
      totalValue: Math.floor(calculations.totalValue),
    };
  }, [inventory.items]);

  // Helper functions matching web version
  const aggregateIncomingBySource = (item) => {
    if (!item.dailyIncoming || !item.incomingSource) {
      return { factory: 0, authority: 0, scissors: 0 };
    }

    const aggregated = { factory: 0, authority: 0, scissors: 0 };

    Object.keys(item.dailyIncoming).forEach((day) => {
      const amount = Number(item.dailyIncoming[day]) || 0;
      const source = item.incomingSource[day];

      if (source === "مصنع") {
        aggregated.factory += amount;
      } else if (source === "شركه") {
        aggregated.authority += amount;
      } else if (source === "مقصه") {
        aggregated.scissors += amount;
      }
    });

    return aggregated;
  };

  const getTotalIncomingFromDaily = (item) => {
    if (!item.dailyIncoming) return 0;
    return Object.values(item.dailyIncoming).reduce(
      (acc, val) => acc + Number(val || 0),
      0
    );
  };

  const getTotalDispensedFromDaily = (item) => {
    if (!item.dailyDispense) return 0;
    return Object.values(item.dailyDispense).reduce(
      (acc, val) => acc + Number(val || 0),
      0
    );
  };

  const handleEditOpening = (item, index) => {
    setEditingItem(`opening-${index}`);
    setEditValues({
      opening: item.opening || 0,
    });
  };

  const handleEditPrice = (item, index) => {
    setEditingItem(`price-${index}`);
    setEditValues({
      unitPrice: item.unitPrice || 0,
    });
  };

  const handleSaveEdit = async () => {
    try {
      // Extract the actual index from the editingItem ID
      const actualIndex = parseInt(editingItem.split("-")[1]);

      await inventory.updateItem(actualIndex, editValues);
      setEditingItem(null);
      setEditValues({});
    } catch (error) {
      console.error("Error saving edit:", error);
      Alert.alert("خطأ", "فشل في حفظ التعديلات: " + error.message);
    }
  };

  const exportPDF = async () => {
    try {
      const currentMonthName = getArabicMonthName(inventory.month);
      const pharmacyName = assignedPharmacy?.name || "الصيدلية";

      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 18px; font-weight: bold; color: #7c3aed; margin-bottom: 10px; }
              .subtitle { font-size: 14px; color: #666; }
              .date { font-size: 12px; color: #999; margin-top: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #7c3aed; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .low-stock { background-color: #fee2e2; }
              .summary { margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">تقرير حالة المخزون لشهر ${currentMonthName} ${
        inventory.year
      }</div>
              <div class="subtitle">صيدلية ${pharmacyName}</div>
              <div class="date">تاريخ التقرير: ${new Date().toLocaleDateString(
                "ar-EG"
              )}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>اسم الصنف</th>
                  <th>الافتتاحي</th>
                  <th>وارد من مصنع</th>
                  <th>وارد من شركة</th>
                  <th>وارد من مقص</th>
                  <th>إجمالي الوارد</th>
                  <th>إجمالي المنصرف</th>
                  <th>المخزون الحالي</th>
                  <th>سعر الوحدة</th>
                  <th>القيمة المتبقية</th>
                </tr>
              </thead>
              <tbody>
                ${inventory.items
                  .filter((item) => item && item.name)
                  .map((item) => {
                    const opening = Number(item.opening || 0);
                    const aggregatedIncoming = aggregateIncomingBySource(item);
                    const totalIncoming = getTotalIncomingFromDaily(item);
                    const totalDispensed = getTotalDispensedFromDaily(item);
                    const currentStock =
                      opening + totalIncoming - totalDispensed;
                    const unitPrice = Number(item.unitPrice || 0);
                    const remainingValue = currentStock * unitPrice;
                    const isLowStock = currentStock < 10;

                    return `
                      <tr ${isLowStock ? 'class="low-stock"' : ""}>
                        <td>${item.name}</td>
                        <td>${Math.floor(opening)}</td>
                        <td>${Math.floor(aggregatedIncoming.factory)}</td>
                        <td>${Math.floor(aggregatedIncoming.authority)}</td>
                        <td>${Math.floor(aggregatedIncoming.scissors)}</td>
                        <td>${Math.floor(totalIncoming)}</td>
                        <td>${Math.floor(totalDispensed)}</td>
                        <td><strong>${Math.floor(currentStock)}</strong></td>
                        <td>${Math.floor(unitPrice)}</td>
                        <td><strong>${Math.floor(remainingValue)}</strong></td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
            
            <div class="summary">
              <p><strong>ملخص المخزون:</strong></p>
              <p>إجمالي الأصناف: ${memoizedCalculations.totalItems}</p>
              <p>إجمالي الوارد: ${memoizedCalculations.totalIncoming}</p>
              <p>إجمالي المنصرف: ${memoizedCalculations.totalDispensed}</p>
              <p>المخزون الحالي: ${memoizedCalculations.currentStock}</p>
              <p>القيمة الإجمالية: ${memoizedCalculations.totalValue} جنيه</p>
            </div>
          </body>
        </html>
      `;

      await PDFService.generateAndSharePDF(
        html,
        `تقرير_المخزون_${currentMonthName}_${inventory.year}`
      );
    } catch (error) {
      Alert.alert("خطأ", "فشل في تحميل التقرير");
    }
  };

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

  if (inventory.loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandStart} />
          <Text style={styles.loadingText}>جاري تحميل بيانات المخزون...</Text>
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
            colors={["#7c3aed", "#4f46e5"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.headerIcon}>📊</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>حالة المخزون</Text>
                  <Text style={styles.headerSubtitle}>
                    عرض حالة المخزون والأرصدة الحالية
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
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
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={exportPDF}
                >
                  <MaterialCommunityIcons
                    name="download"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.exportButtonText}>تحميل PDF</Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={styles.statEmoji}>📦</Text>
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
              colors={["#ef4444", "#dc2626"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>إجمالي المنصرف</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.totalDispensed}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📤</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>المخزون الحالي</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.currentStock}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📋</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Professional Table Section with editing capabilities */}
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>تفاصيل المخزون</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, styles.nameColumn]}>
                    اسم الصنف
                  </Text>
                  <Text style={styles.headerCell}>الافتتاحي</Text>
                  <Text style={styles.headerCell}>مصنع</Text>
                  <Text style={styles.headerCell}>شركة</Text>
                  <Text style={styles.headerCell}>مقص</Text>
                  <Text style={styles.headerCell}>إجمالي الوارد</Text>
                  <Text style={styles.headerCell}>المنصرف</Text>
                  <Text style={styles.headerCell}>الحالي</Text>
                  <Text style={styles.headerCell}>السعر</Text>
                  <Text style={styles.headerCell}>القيمة</Text>
                </View>

                {/* Table Body */}
                {inventory.items
                  .filter((item) => item && item.name)
                  .map((item, index) => {
                    const opening = Number(item.opening || 0);
                    const aggregatedIncoming = aggregateIncomingBySource(item);
                    const totalIncoming = getTotalIncomingFromDaily(item);
                    const totalDispensed = getTotalDispensedFromDaily(item);
                    const currentStock =
                      opening + totalIncoming - totalDispensed;
                    const unitPrice = Number(item.unitPrice || 0);
                    const remainingValue = currentStock * unitPrice;
                    const isLowStock = currentStock < 10;

                    return (
                      <View
                        key={index}
                        style={[
                          styles.tableRow,
                          isLowStock && styles.lowStockRow,
                          index % 2 === 0 && styles.evenRow,
                        ]}
                      >
                        <View style={[styles.cell, styles.nameColumn]}>
                          <Text style={styles.cellText}>{item.name}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.cell}
                          onPress={() => handleEditOpening(item, index)}
                        >
                          {editingItem === `opening-${index}` ? (
                            <View style={styles.editContainer}>
                              <TextInput
                                style={styles.editInput}
                                defaultValue={String(editValues.opening || 0)}
                                keyboardType="numeric"
                                autoFocus
                                onEndEditing={(e) => {
                                  const newValue =
                                    Number(e.nativeEvent.text) || 0;
                                  setEditValues({
                                    ...editValues,
                                    opening: newValue,
                                  });
                                }}
                              />
                              <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveEdit}
                              >
                                <MaterialCommunityIcons
                                  name="check"
                                  size={12}
                                  color="#ffffff"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.editableCell}>
                              <Text style={styles.cellText}>
                                {Math.floor(opening)}
                              </Text>
                              <MaterialCommunityIcons
                                name="pencil"
                                size={12}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                        </TouchableOpacity>

                        <View style={styles.cell}>
                          <Text style={styles.cellText}>
                            {Math.floor(aggregatedIncoming.factory)}
                          </Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={styles.cellText}>
                            {Math.floor(aggregatedIncoming.authority)}
                          </Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={styles.cellText}>
                            {Math.floor(aggregatedIncoming.scissors)}
                          </Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={[styles.cellText, styles.totalText]}>
                            {Math.floor(totalIncoming)}
                          </Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={[styles.cellText, styles.dispensedText]}>
                            {Math.floor(totalDispensed)}
                          </Text>
                        </View>
                        <View style={styles.cell}>
                          <Text
                            style={[
                              styles.cellText,
                              styles.stockText,
                              isLowStock && styles.lowStockText,
                            ]}
                          >
                            {Math.floor(currentStock)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.cell}
                          onPress={() => handleEditPrice(item, index)}
                        >
                          {editingItem === `price-${index}` ? (
                            <View style={styles.editContainer}>
                              <TextInput
                                style={styles.editInput}
                                defaultValue={String(editValues.unitPrice || 0)}
                                keyboardType="numeric"
                                autoFocus
                                onEndEditing={(e) => {
                                  const newValue =
                                    Number(e.nativeEvent.text) || 0;
                                  setEditValues({
                                    ...editValues,
                                    unitPrice: newValue,
                                  });
                                }}
                              />
                              <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveEdit}
                              >
                                <MaterialCommunityIcons
                                  name="check"
                                  size={12}
                                  color="#ffffff"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.editableCell}>
                              <Text style={styles.cellText}>
                                {Math.floor(unitPrice)}
                              </Text>
                              <MaterialCommunityIcons
                                name="pencil"
                                size={12}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                        </TouchableOpacity>

                        <View style={styles.cell}>
                          <Text style={[styles.cellText, styles.valueText]}>
                            {Math.floor(remainingValue)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
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
  headerActions: {
    gap: spacing.sm,
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
  exportButton: {
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  exportButtonText: {
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
  tableContainer: {
    minWidth: 800, // Ensure horizontal scroll for all columns
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
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    width: 80,
  },
  nameColumn: {
    width: 120,
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
  lowStockRow: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  cell: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  editableCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cellText: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: "center",
  },
  totalText: {
    color: "#10b981",
    fontWeight: "600",
  },
  dispensedText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  stockText: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  lowStockText: {
    color: "#ef4444",
  },
  valueText: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editInput: {
    backgroundColor: colors.bg,
    color: colors.textPrimary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.brandStart,
    width: 50,
  },
  saveButton: {
    backgroundColor: colors.brandStart,
    borderRadius: 4,
    padding: 4,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brandStart,
  },
  footerText: {
    color: colors.brandStart,
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

export default StockScreen;
