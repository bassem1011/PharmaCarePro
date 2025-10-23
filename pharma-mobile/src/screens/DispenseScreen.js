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
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radii, shadows } from "../utils/theme";
import { useAuth } from "../hooks/useAuth";
import { useInventoryData } from "../hooks/useInventoryData";
import MonthYearPicker from "../components/common/MonthYearPicker";

// Confirmation Dialog Component
const ConfirmDeleteModal = ({ visible, onConfirm, onCancel, itemName }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.modalTitle}>تأكيد الحذف</Text>
          <Text style={styles.modalMessage}>
            هل أنت متأكد أنك تريد حذف الصنف "{itemName}"؟ سيتم حذف جميع البيانات
            المرتبطة به.
          </Text>
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>❌ إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>🗑️ نعم، احذف</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function DispenseScreen() {
  const insets = useSafeAreaInsets();
  const { assignedPharmacy } = useAuth();
  const {
    items,
    updateItem,
    addItem,
    deleteItem,
    month,
    year,
    setMonth,
    setYear,
    loading,
  } = useInventoryData(assignedPharmacy?.id);

  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [itemToDelete, setItemToDelete] = useState("");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Handlers for delete confirmation
  const confirmDelete = (index, itemName) => {
    setDeleteIndex(index);
    setItemToDelete(itemName || "هذا الصنف");
  };

  const handleDeleteConfirm = () => {
    if (deleteIndex !== null) {
      deleteItem(deleteIndex);
      setDeleteIndex(null);
      setItemToDelete("");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteIndex(null);
    setItemToDelete("");
  };

  // Handler for month/year picker
  const handleMonthYearConfirm = (selectedMonth, selectedYear) => {
    setMonth(selectedMonth);
    setYear(selectedYear);
    setShowMonthYearPicker(false);
  };

  const handleMonthYearCancel = () => {
    setShowMonthYearPicker(false);
  };

  // Handler for add item button
  const handleAddItem = () => {
    addItem(); // Call without parameters, like the web version
  };

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
        totalDispensed: 0,
        totalDays: 0,
        dailyAverage: 0,
        totalOpeningAndIncoming: 0,
        remainingStock: 0,
      };
    }

    const calculations = items.reduce(
      (acc, item) => {
        const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const opening = Math.floor(Number(item.opening || 0));
        const totalOpeningAndIncoming = opening + totalIncoming;
        const remainingStock = totalOpeningAndIncoming - totalDispensed;
        const daysWithData = Object.keys(item.dailyDispense || {}).length;

        return {
          totalItems: acc.totalItems + 1,
          totalDispensed: acc.totalDispensed + totalDispensed,
          totalDays: Math.max(acc.totalDays, daysWithData),
          totalOpeningAndIncoming:
            acc.totalOpeningAndIncoming + totalOpeningAndIncoming,
          remainingStock: acc.remainingStock + remainingStock,
        };
      },
      {
        totalItems: 0,
        totalDispensed: 0,
        totalDays: 0,
        totalOpeningAndIncoming: 0,
        remainingStock: 0,
      }
    );

    return {
      ...calculations,
      totalDispensed: Math.floor(calculations.totalDispensed),
      totalOpeningAndIncoming: Math.floor(calculations.totalOpeningAndIncoming),
      remainingStock: Math.floor(calculations.remainingStock),
      dailyAverage:
        calculations.totalDays > 0
          ? Math.floor(calculations.totalDispensed / calculations.totalDays)
          : 0,
    };
  }, [items]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandStart} />
          <Text style={styles.loadingText}>جاري تحميل بيانات المنصرف...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(360, insets.bottom + 180), // Tripled the padding
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Enhanced Header matching web version */}
          <LinearGradient
            colors={["#dc2626", "#be185d"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.headerIcon}>📤</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>المنصرف اليومي</Text>
                  <Text style={styles.headerSubtitle}>
                    تسجيل الأصناف المنصرفة يومياً
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
                  style={styles.addItemHeaderButton}
                  onPress={handleAddItem}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.addItemHeaderButtonText}>إضافة صنف</Text>
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
                  <Text style={styles.statEmoji}>📋</Text>
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
              colors={["#10b981", "#059669"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>الوارد والافتتاحي</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.totalOpeningAndIncoming}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📥</Text>
                </View>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={styles.statCard}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statLabel}>المخزون المتبقي</Text>
                  <Text style={styles.statValue}>
                    {memoizedCalculations.remainingStock}
                  </Text>
                </View>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>📊</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Professional Table Section */}
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>تفاصيل المنصرف اليومي</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableWrap}
            >
              <View
                style={[
                  styles.table,
                  { width: 140 + days.length * 68 + 4 * 100 + 80 }, // +80 for action column
                ]}
              >
                <View style={styles.headerRow}>
                  <View
                    style={[
                      styles.nameCell,
                      styles.headerCell,
                      styles.stickyColumn,
                    ]}
                  >
                    <Text style={styles.headerText}>🏷️ الصنف</Text>
                  </View>
                  {days.map((d) => (
                    <View
                      key={`h-${year}-${month}-${d}`}
                      style={[styles.dayCell, styles.headerCell]}
                    >
                      <View style={styles.dayHeaderContent}>
                        <Text style={styles.dayNumber}>{`يوم ${d}`}</Text>
                        <Text style={styles.daySubtext}>📤 منصرف</Text>
                      </View>
                    </View>
                  ))}
                  <View
                    style={[
                      styles.sumCell,
                      styles.headerCell,
                      styles.totalDispenseHeader,
                    ]}
                  >
                    <Text style={styles.headerText}>📤 إجمالي المنصرف</Text>
                  </View>
                  <View
                    style={[
                      styles.sumCell,
                      styles.headerCell,
                      styles.totalOpeningHeader,
                    ]}
                  >
                    <Text style={styles.headerText}>
                      📥 إجمالي الافتتاحي والوارد
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sumCell,
                      styles.headerCell,
                      styles.remainingHeader,
                    ]}
                  >
                    <Text style={styles.headerText}>💰 الرصيد المتبقي</Text>
                  </View>
                  <View style={[styles.actionCell, styles.headerCell]}>
                    <Text style={styles.headerText}>🗑️ حذف</Text>
                  </View>
                </View>
                {items
                  .map((item, idx) => {
                    // Skip items that are null/undefined, but allow items with empty names to show
                    if (!item) return null;
                    const totalDisp = Object.values(
                      item.dailyDispense || {}
                    ).reduce((sum, v) => sum + (Number(v) || 0), 0);
                    const opening = Number(item.opening || 0);
                    const totalInc = Object.values(
                      item.dailyIncoming || {}
                    ).reduce((sum, v) => sum + (Number(v) || 0), 0);
                    const remaining = opening + totalInc - totalDisp;
                    return (
                      <View
                        key={`r-${idx}-${item.name || "empty"}`}
                        style={[
                          styles.dataRow,
                          idx % 2 === 0 ? styles.evenRow : styles.oddRow,
                        ]}
                      >
                        <View
                          style={[
                            styles.nameCell,
                            styles.stickyColumn,
                            {
                              backgroundColor:
                                idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                            },
                          ]}
                        >
                          <TextInput
                            style={styles.nameInput}
                            defaultValue={item.name || ""}
                            placeholder="اسم الصنف"
                            placeholderTextColor="#9ca3af"
                            textAlign="right"
                            onEndEditing={(e) => {
                              const newName = (e.nativeEvent.text || "").trim();
                              if (newName !== item.name) {
                                updateItem(idx, { name: newName });
                              }
                            }}
                          />
                        </View>
                        {days.map((d) => {
                          const currentVal =
                            (item.dailyDispense || {})[d] || "";
                          return (
                            <View key={`c-${idx}-${d}`} style={styles.dayCell}>
                              <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                defaultValue={String(currentVal || "")}
                                onEndEditing={(e) => {
                                  const valNum =
                                    Number(e.nativeEvent.text) || 0;
                                  const currentDispenseVal =
                                    (item.dailyDispense || {})[d] || 0;
                                  if (valNum !== currentDispenseVal) {
                                    updateItem(idx, {
                                      dailyDispense: {
                                        ...(item.dailyDispense || {}),
                                        [d]: valNum,
                                      },
                                    });
                                  }
                                }}
                              />
                            </View>
                          );
                        })}
                        <View style={styles.sumCell}>
                          <Text style={styles.totalText}>{opening}</Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text style={styles.totalText}>{totalInc}</Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text style={styles.totalText}>{totalDisp}</Text>
                        </View>
                        <View style={styles.sumCell}>
                          <Text style={styles.totalText}>{remaining}</Text>
                        </View>
                        <View style={styles.actionCell}>
                          <TouchableOpacity
                            onPress={() => confirmDelete(idx, item.name)}
                            style={styles.deleteButton}
                          >
                            <MaterialCommunityIcons
                              name="delete"
                              size={16}
                              color="#ffffff"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                  .filter(Boolean)}

                {/* Add Item Button at Bottom */}
                <View style={styles.bottomAddRow}>
                  <TouchableOpacity
                    style={styles.bottomAddButton}
                    onPress={handleAddItem}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color="#ffffff"
                    />
                    <Text style={styles.bottomAddButtonText}>
                      إضافة صنف جديد
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Animated.View>

        {/* Month Year Picker Modal */}
        <MonthYearPicker
          visible={showMonthYearPicker}
          month={month}
          year={year}
          onConfirm={handleMonthYearConfirm}
          onCancel={handleMonthYearCancel}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          visible={deleteIndex !== null}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          itemName={itemToDelete}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addItemHeaderButton: {
    backgroundColor: "rgba(34,197,94,0.9)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  addItemHeaderButtonText: {
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
    backgroundColor: "#ffffff",
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.large,
    borderWidth: 1,
    borderColor: "#e5e7eb", // gray-200
  },
  sectionTitle: {
    color: "#1f2937", // gray-800
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "right",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: "right",
  },
  tableWrap: { marginTop: 8 },
  table: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fca5a5", // red-300
    overflow: "hidden",
    ...shadows.large,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#fca5a5", // red-300
  },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb", // gray-200
  },
  evenRow: {
    backgroundColor: "#ffffff",
  },
  oddRow: {
    backgroundColor: "#f9fafb", // gray-50
  },
  nameCell: {
    width: 140,
    padding: 16,
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb", // gray-200
  },
  dayCell: {
    width: 68,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb", // gray-200
  },
  totalCell: {
    width: 80,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sumCell: {
    width: 100,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb", // gray-200
  },
  headerCell: {
    backgroundColor: "#fef2f2", // red-50
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerText: {
    color: "#991b1b", // red-800
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  stickyColumn: {
    backgroundColor: "#fef2f2", // red-50 for header, will be overridden for data rows
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  dayHeaderContent: {
    alignItems: "center",
    gap: 4,
  },
  dayNumber: {
    color: "#991b1b", // red-800
    fontWeight: "700",
    fontSize: 16,
  },
  daySubtext: {
    color: "#dc2626", // red-600
    fontSize: 10,
    fontWeight: "500",
  },
  totalDispenseHeader: {
    backgroundColor: "#fecaca", // red-100
  },
  totalOpeningHeader: {
    backgroundColor: "#dcfce7", // green-100
  },
  remainingHeader: {
    backgroundColor: "#dbeafe", // blue-100
  },
  actionCell: {
    width: 80,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb", // gray-200
  },
  itemName: { color: colors.textPrimary, textAlign: "right" },
  nameInput: {
    backgroundColor: "#ffffff",
    color: "#1f2937", // gray-800
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#d1d5db", // gray-300
    textAlign: "right",
    width: "100%",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fef2f2", // red-50
    color: "#1f2937", // gray-800
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#d1d5db", // gray-300
    textAlign: "center",
    width: "100%",
    fontSize: 14,
  },
  totalText: {
    color: "#1f2937", // gray-800
    fontWeight: "700",
    fontSize: 16,
  },
  inlineAddRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2b3446",
  },
  addButton: {
    backgroundColor: colors.brandStart,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  deleteButton: {
    backgroundColor: "#ef4444", // red-500
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    ...shadows.medium,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomAddRow: {
    padding: spacing.md,
    borderTopWidth: 2,
    borderTopColor: "#374151",
    backgroundColor: "#1f2937",
  },
  bottomAddButton: {
    backgroundColor: "#22c55e",
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.medium,
  },
  bottomAddButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    maxWidth: "90%",
    width: "100%",
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  confirmButton: {
    backgroundColor: "#ef4444",
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
