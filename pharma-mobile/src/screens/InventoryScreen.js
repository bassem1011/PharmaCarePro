import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii, shadows } from "../utils/theme";
import { useInventoryData } from "../hooks/useInventoryData";
import { useAuth } from "../hooks/useAuth";
import AnimatedButton from "../components/common/AnimatedButton";
import SkeletonLoader from "../components/common/SkeletonLoader";
import PullToRefresh from "../components/common/PullToRefresh";

const InventoryScreen = () => {
  const { user, userRole, assignedPharmacy } = useAuth();
  const [activeTab, setActiveTab] = useState("dispense");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    opening: "0",
    unitPrice: "0",
  });

  const inventory = useInventoryData(assignedPharmacy?.id);

  const TABS = [
    {
      key: "dispense",
      label: "المنصرف اليومي",
      icon: "package-variant-closed",
      color: "#3b82f6",
    },
    {
      key: "incoming",
      label: "الوارد اليومي",
      icon: "package-variant",
      color: "#10b981",
    },
    {
      key: "stock",
      label: "المخزون الحالي",
      icon: "cube-outline",
      color: "#f59e0b",
    },
    {
      key: "shortages",
      label: "النواقص",
      icon: "alert-circle-outline",
      color: "#ef4444",
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh inventory data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      Alert.alert("خطأ", "اسم الصنف مطلوب");
      return;
    }

    const item = {
      name: newItem.name.trim(),
      opening: parseFloat(newItem.opening) || 0,
      unitPrice: parseFloat(newItem.unitPrice) || 0,
      dailyDispense: {},
      dailyIncoming: {},
      incomingSource: {},
      selected: false,
    };

    inventory.addItem(item);
    setNewItem({ name: "", opening: "0", unitPrice: "0" });
    setShowAddItemModal(false);
  };

  // Direct add item function like web version
  const handleAddItemDirectly = () => {
    const newItem = {
      name: "",
      opening: 0,
      unitPrice: 0,
      dailyDispense: {},
      dailyIncoming: {},
      incomingSource: {},
      selected: false,
    };

    inventory.addItem(newItem);
  };

  const handleDeleteItem = (index) => {
    setDeleteItemIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteItemIndex !== null) {
      inventory.deleteItem(deleteItemIndex);
      setDeleteItemIndex(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setDeleteItemIndex(null);
    setShowDeleteModal(false);
  };

  const updateItemField = (index, field, value) => {
    inventory.updateItem(index, { [field]: value });
  };

  const updateDailyDispense = (index, day, value) => {
    const currentItem = inventory.items[index];
    const dailyDispense = { ...currentItem.dailyDispense };
    dailyDispense[day] = parseFloat(value) || 0;
    updateItemField(index, "dailyDispense", dailyDispense);
  };

  const updateDailyIncoming = (index, day, value) => {
    const currentItem = inventory.items[index];
    const dailyIncoming = { ...currentItem.dailyIncoming };
    dailyIncoming[day] = parseFloat(value) || 0;
    updateItemField(index, "dailyIncoming", dailyIncoming);
  };

  const getCurrentStock = (item) => {
    const opening = parseFloat(item.opening) || 0;
    const totalIncoming = Object.values(item.dailyIncoming || {}).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    const totalDispensed = Object.values(item.dailyDispense || {}).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    return opening + totalIncoming - totalDispensed;
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "dispense":
        return <DailyDispenseTab />;
      case "incoming":
        return <DailyIncomingTab />;
      case "stock":
        return <StockStatusTab />;
      case "shortages":
        return <ShortagesTab />;
      default:
        return <DailyDispenseTab />;
    }
  };

  const DailyDispenseTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>المنصرف اليومي</Text>
      </View>

      {inventory.loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {inventory.items.map((item, index) => (
            <View key={index} style={[styles.itemCard, styles.dispenseCard]}>
              <View style={styles.itemHeader}>
                <TextInput
                  style={[styles.itemNameInput, styles.dispenseNameInput]}
                  value={item.name || ""}
                  onChangeText={(text) => updateItemField(index, "name", text)}
                  placeholder="اسم الصنف"
                  placeholderTextColor="#6b7280"
                />
                <TouchableOpacity
                  onPress={() => handleDeleteItem(index)}
                  style={styles.deleteButton}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color="#ef4444"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الرصيد الافتتاحي</Text>
                  <TextInput
                    style={[styles.numberInput, styles.dispenseNumberInput]}
                    value={String(item.opening || 0)}
                    onChangeText={(text) =>
                      updateItemField(index, "opening", text)
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>سعر الوحدة</Text>
                  <TextInput
                    style={[styles.numberInput, styles.dispenseNumberInput]}
                    value={String(item.unitPrice || 0)}
                    onChangeText={(text) =>
                      updateItemField(index, "unitPrice", text)
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.dailyInputs}>
                <Text style={[styles.dailyTitle, styles.dispenseDailyTitle]}>
                  المنصرف اليومي
                </Text>
                <View style={styles.dailyGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <View key={day} style={styles.dailyInput}>
                      <Text style={styles.dayLabel}>{day}</Text>
                      <TextInput
                        style={[
                          styles.dailyValueInput,
                          styles.dispenseDailyInput,
                        ]}
                        value={String(
                          item.dailyDispense?.[String(day).padStart(2, "0")] ||
                            0
                        )}
                        onChangeText={(text) =>
                          updateDailyDispense(
                            index,
                            String(day).padStart(2, "0"),
                            text
                          )
                        }
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}

          {/* Add Item Button at Bottom */}
          <View style={styles.addItemContainer}>
            <AnimatedButton
              title="➕ إضافة صنف"
              onPress={handleAddItemDirectly}
              variant="primary"
              size="large"
            />
          </View>
        </ScrollView>
      )}
    </View>
  );

  const DailyIncomingTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>الوارد اليومي</Text>
      </View>

      {inventory.loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {inventory.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>
                  {item.name || "صنف بدون اسم"}
                </Text>
              </View>

              <View style={styles.dailyInputs}>
                <Text style={styles.dailyTitle}>الوارد اليومي</Text>
                <View style={styles.dailyGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <View key={day} style={styles.dailyInput}>
                      <Text style={styles.dayLabel}>{day}</Text>
                      <TextInput
                        style={styles.dailyValueInput}
                        value={String(
                          item.dailyIncoming?.[String(day).padStart(2, "0")] ||
                            0
                        )}
                        onChangeText={(text) =>
                          updateDailyIncoming(
                            index,
                            String(day).padStart(2, "0"),
                            text
                          )
                        }
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const StockStatusTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>المخزون الحالي</Text>
      </View>

      {inventory.loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {inventory.items.map((item, index) => {
            const currentStock = getCurrentStock(item);
            const totalIncoming = Object.values(
              item.dailyIncoming || {}
            ).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            const totalDispensed = Object.values(
              item.dailyDispense || {}
            ).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

            return (
              <View key={index} style={styles.stockCard}>
                <View style={styles.stockHeader}>
                  <Text style={styles.stockItemName}>
                    {item.name || "صنف بدون اسم"}
                  </Text>
                  <View
                    style={[
                      styles.stockStatus,
                      currentStock <= 0 && styles.stockStatusLow,
                    ]}
                  >
                    <Text style={styles.stockStatusText}>
                      {currentStock <= 0 ? "نفذ" : "متوفر"}
                    </Text>
                  </View>
                </View>

                <View style={styles.stockDetails}>
                  <View style={styles.stockRow}>
                    <Text style={styles.stockLabel}>الرصيد الافتتاحي:</Text>
                    <Text style={styles.stockValue}>{item.opening || 0}</Text>
                  </View>
                  <View style={styles.stockRow}>
                    <Text style={[styles.stockLabel, styles.stockLabelBold]}>
                      المخزون الحالي:
                    </Text>
                    <Text style={[styles.stockValue, styles.stockValueBold]}>
                      {currentStock}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const ShortagesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>النواقص والاحتياجات</Text>
      </View>

      {inventory.loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {inventory.items
            .filter((item) => {
              if (!item.name) return false;
              const currentStock = getCurrentStock(item);
              const averageConsumption = get3MonthMean(item.name);
              return currentStock <= averageConsumption;
            })
            .map((item, index) => {
              const currentStock = getCurrentStock(item);
              const averageConsumption = get3MonthMean(item.name);
              const shortage = Math.max(0, averageConsumption - currentStock);

              return (
                <View key={index} style={styles.shortageCard}>
                  <View style={styles.shortageHeader}>
                    <Text style={styles.shortageItemName}>{item.name}</Text>
                    <View style={styles.shortagePriority}>
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={20}
                        color="#ef4444"
                      />
                    </View>
                  </View>

                  <View style={styles.shortageDetails}>
                    <View style={styles.shortageRow}>
                      <Text style={styles.shortageLabel}>المخزون الحالي:</Text>
                      <Text style={styles.shortageValue}>{currentStock}</Text>
                    </View>
                    <View style={styles.shortageRow}>
                      <Text style={styles.shortageLabel}>متوسط الاستهلاك:</Text>
                      <Text style={styles.shortageValue}>
                        {averageConsumption}
                      </Text>
                    </View>
                    <View style={styles.shortageRow}>
                      <Text style={styles.shortageLabel}>الاحتياج:</Text>
                      <Text
                        style={[styles.shortageValue, styles.shortageValueBold]}
                      >
                        {shortage}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>إدارة المخزون</Text>
          <Text style={styles.headerSubtitle}>
            {assignedPharmacy?.name || "صيدلية غير معينة"}
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.key ? "#ffffff" : tab.color}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === tab.key && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Add Item Modal */}
        <Modal
          visible={showAddItemModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddItemModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>إضافة صنف جديد</Text>
                <TouchableOpacity
                  onPress={() => setShowAddItemModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>اسم الصنف</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newItem.name}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, name: text })
                    }
                    placeholder="أدخل اسم الصنف"
                    placeholderTextColor="#6b7280"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الرصيد الافتتاحي</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newItem.opening}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, opening: text })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>سعر الوحدة</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newItem.unitPrice}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, unitPrice: text })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowAddItemModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleAddItem}
                >
                  <Text style={styles.modalSaveButtonText}>إضافة</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          animationType="fade"
          transparent={true}
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.deleteModalContent]}>
              <View style={styles.deleteModalHeader}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={48}
                  color="#ef4444"
                />
                <Text style={styles.deleteModalTitle}>تأكيد الحذف</Text>
                <Text style={styles.deleteModalMessage}>
                  هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء.
                </Text>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton,
                    styles.deleteModalCancelButton,
                  ]}
                  onPress={cancelDelete}
                >
                  <Text style={styles.modalCancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    styles.deleteModalConfirmButton,
                  ]}
                  onPress={confirmDelete}
                >
                  <Text style={styles.modalSaveButtonText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </PullToRefresh>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2b3446",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  tabContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#2b3446",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: radii.md,
  },
  tabButtonActive: {
    backgroundColor: colors.brandStart,
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: "#ffffff",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.soft,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: "#2b3446",
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  deleteButton: {
    padding: 8,
  },
  itemDetails: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#2b3446",
    backgroundColor: "#0f172a",
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dailyInputs: {
    marginTop: 12,
  },
  dailyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  dailyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dailyInput: {
    width: "6.25%",
    alignItems: "center",
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  dailyValueInput: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "#2b3446",
    backgroundColor: "#0f172a",
    borderRadius: 4,
    textAlign: "center",
    fontSize: 10,
    color: colors.textPrimary,
  },
  stockCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.soft,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stockItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stockStatus: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockStatusLow: {
    backgroundColor: colors.red,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  stockDetails: {
    gap: 8,
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stockLabelBold: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  stockValueBold: {
    fontWeight: "bold",
  },
  shortageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.red,
    ...shadows.soft,
  },
  shortageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  shortageItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  shortagePriority: {
    padding: 4,
  },
  shortageDetails: {
    gap: 8,
  },
  shortageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shortageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  shortageValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  shortageValueBold: {
    fontWeight: "bold",
    color: colors.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2b3446",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#2b3446",
    backgroundColor: "#0f172a",
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2b3446",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2b3446",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.brandStart,
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  // Red-themed styles for dispense tab (matching web version)
  dispenseCard: {
    backgroundColor: "#fef2f2", // Light red background (bg-red-50 equivalent)
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444", // Red accent
  },
  dispenseNameInput: {
    borderBottomColor: "#f87171", // Light red border
    backgroundColor: "#fef2f2",
  },
  dispenseNumberInput: {
    borderColor: "#f87171", // Light red border
    backgroundColor: "#fef2f2",
    borderWidth: 2,
  },
  dispenseDailyTitle: {
    color: "#dc2626", // Red text
    fontWeight: "bold",
  },
  dispenseDailyInput: {
    backgroundColor: "#fef2f2", // Light red background
    borderColor: "#f87171", // Light red border
    borderWidth: 1.5,
  },
  // Add Item Container at bottom
  addItemContainer: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  // Delete Modal Styles
  deleteModalContent: {
    width: "85%",
  },
  deleteModalHeader: {
    alignItems: "center",
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  deleteModalCancelButton: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  deleteModalConfirmButton: {
    backgroundColor: "#ef4444",
  },
});

export default InventoryScreen;
