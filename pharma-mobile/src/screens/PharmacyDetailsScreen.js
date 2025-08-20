import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../hooks/useAuth";
import { useInventoryData } from "../hooks/useInventoryData";
// import NetworkStatusBar from "../components/common/NetworkStatusBar";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { colors, spacing, radii, shadows } from "../utils/theme";

const PharmacyDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { pharmacy, pharmacyId: pharmacyIdParam } = route.params || {};
  const pharmacyId = pharmacy?.id || pharmacyIdParam;

  // Guard against missing pharmacyId
  useEffect(() => {
    if (!pharmacyId) {
      Alert.alert("خطأ", "لا توجد صيدلية محددة.", [
        {
          text: "حسناً",
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  }, [pharmacyId, navigation]);

  const [pharmacyData, setPharmacyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pharmacists, setPharmacists] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);

  // Use the inventory data hook
  const {
    items,
    loading: inventoryLoading,
    calculateRemainingStock,
    calculateShortages,
  } = useInventoryData(pharmacyId);

  const toggleItemExpanded = (index) => {
    setExpandedItems((prev) => {
      const newExpanded = [...prev];
      newExpanded[index] = !newExpanded[index];
      return newExpanded;
    });
  };

  // Update expandedItems when items count changes
  useEffect(() => {
    setExpandedItems((prev) => {
      if (prev.length !== items.length) {
        return Array(items.length).fill(false);
      }
      return prev;
    });
  }, [items.length]);

  useEffect(() => {
    if (!pharmacyId) return;
    let unsubscribeUsers = null;
    let unsubscribePharmacy = null;
    let unsubscribeAttendance = null;

    const today = getTodayDateString();
    try {
      // Pharmacy doc realtime
      unsubscribePharmacy = onSnapshot(
        doc(db, "pharmacies", pharmacyId),
        (docSnap) => {
          if (docSnap.exists()) {
            setPharmacyData({ id: docSnap.id, ...docSnap.data() });
            setEditName(docSnap.data().name);
          }
        }
      );

      // Users realtime
      unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnap) => {
        const pharmacyPharmacists = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((ph) => ph.assignedPharmacy === pharmacyId);
        setPharmacists(pharmacyPharmacists);
      });

      // Attendance realtime (today only)
      unsubscribeAttendance = onSnapshot(
        doc(db, "pharmacies", pharmacyId, "attendance", today),
        (docSnap) => {
          setAttendance(docSnap.exists() ? docSnap.data() : {});
        }
      );

      setLoading(false);
    } catch (error) {
      console.error("Error subscribing to pharmacy details:", error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribePharmacy) unsubscribePharmacy();
      if (unsubscribeAttendance) unsubscribeAttendance();
    };
  }, [pharmacyId]);

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Legacy loader retained for reference; subscriptions handle live data

  const handleEditPharmacy = async () => {
    if (!editName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الصيدلية");
      return;
    }

    try {
      await setDoc(
        doc(db, "pharmacies", pharmacyId),
        { ...pharmacyData, name: editName.trim() },
        { merge: true }
      );
      setPharmacyData((prev) => ({ ...prev, name: editName.trim() }));
      setEditing(false);
      Alert.alert("نجح", "تم تحديث اسم الصيدلية بنجاح");
    } catch (error) {
      console.error("Error updating pharmacy:", error);
      Alert.alert("خطأ", "فشل في تحديث اسم الصيدلية");
    }
  };

  const handleDeletePharmacy = async () => {
    Alert.alert(
      "حذف الصيدلية",
      "هل أنت متأكد أنك تريد حذف هذه الصيدلية؟ سيتم حذف جميع البيانات المتعلقة بها.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              // Delete all subcollections
              const subcollections = [
                "monthlyStock",
                "shortages",
                "attendance",
              ];
              for (const sub of subcollections) {
                const colRef = collection(db, "pharmacies", pharmacyId, sub);
                const snap = await getDocs(colRef);
                const batch = writeBatch(db);
                snap.forEach((docu) => batch.delete(docu.ref));
                await batch.commit();
              }
              // Delete pharmacy document
              await deleteDoc(doc(db, "pharmacies", pharmacyId));
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting pharmacy:", error);
              Alert.alert("خطأ", "فشل في حذف الصيدلية");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={activeTab === tabKey ? "#ffffff" : "#6b7280"}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabKey && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderOverview = () => {
    const shortages = calculateShortages();
    const totalIncoming = items.reduce((sum, item) => {
      const itemTotal = Object.values(item.dailyIncoming || {}).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      );
      return sum + itemTotal;
    }, 0);
    const totalDispensed = items.reduce((sum, item) => {
      const itemTotal = Object.values(item.dailyDispense || {}).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      );
      return sum + itemTotal;
    }, 0);
    const presentToday = Object.values(attendance).filter(
      (val) => val === true
    ).length;
    const attendanceRate =
      pharmacists.length > 0
        ? Math.round((presentToday / pharmacists.length) * 100)
        : 0;
    const shortageRate =
      items.length > 0
        ? Math.round((shortages.length / items.length) * 100)
        : 0;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabTitle}>نظرة عامة على الصيدلية</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCardLight}>
            <Text style={styles.statValueLight}>{pharmacists.length}</Text>
            <Text style={styles.statLabelLight}>عدد الصيادلة</Text>
          </View>
          <View style={styles.statCardLight}>
            <Text style={[styles.statValueLight, { color: "#d97706" }]}>
              {shortages.length}
            </Text>
            <Text style={styles.statLabelLight}>النواقص</Text>
            <View style={styles.progressTrackLight}>
              <View
                style={[
                  styles.progressFillLight,
                  { width: `${shortageRate}%`, backgroundColor: "#d97706" },
                ]}
              />
            </View>
          </View>
          <View style={styles.statCardLight}>
            <Text style={[styles.statValueLight, { color: "#16a34a" }]}>
              {presentToday}
            </Text>
            <Text style={styles.statLabelLight}>الحضور اليوم</Text>
            <View style={styles.progressTrackLight}>
              <View
                style={[
                  styles.progressFillLight,
                  { width: `${attendanceRate}%`, backgroundColor: "#16a34a" },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>معلومات الصيدلية</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>اسم الصيدلية:</Text>
            <Text style={styles.infoValue}>{pharmacyData?.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>تاريخ الإنشاء:</Text>
            <Text style={styles.infoValue}>
              {pharmacyData?.createdAt
                ? new Date(pharmacyData.createdAt).toLocaleDateString("ar-EG")
                : "غير محدد"}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>إحصائيات المخزون</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>إجمالي الأصناف:</Text>
            <Text style={styles.infoValue}>{items.length}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>إجمالي الوارد:</Text>
            <Text style={styles.infoValue}>{totalIncoming}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>إجمالي المنصرف:</Text>
            <Text style={styles.infoValue}>{totalDispensed}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderInventory = () => {
    if (inventoryLoading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonLoader />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabTitle}>مخزون الصيدلية</Text>
        {items.length > 0 ? (
          <View style={styles.listContainer}>
            {items.map((item, index) => {
              const opening = Math.floor(Number(item.opening || 0));
              const totalIncoming = Math.floor(
                Object.values(item.dailyIncoming || {}).reduce(
                  (acc, val) => acc + Number(val || 0),
                  0
                )
              );
              const totalDispensed = Math.floor(
                Object.values(item.dailyDispense || {}).reduce(
                  (acc, val) => acc + Number(val || 0),
                  0
                )
              );
              const currentStock = calculateRemainingStock(item);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.inventoryCard}
                  onPress={() => toggleItemExpanded(index)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(31, 41, 55, 0.8)", "rgba(17, 24, 39, 0.9)"]}
                    style={styles.inventoryCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Item Header - Always Visible */}
                    <View style={styles.inventoryHeader}>
                      <View style={styles.inventoryIconContainer}>
                        <MaterialCommunityIcons
                          name="package-variant"
                          size={24}
                          color={colors.brandStart}
                        />
                      </View>
                      <View style={styles.inventoryBasicInfo}>
                        <Text style={styles.inventoryName}>
                          {item.name || "صنف بدون اسم"}
                        </Text>
                        <Text style={styles.inventoryStock}>
                          المخزون الحالي: {currentStock}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={
                          expandedItems[index] ? "chevron-up" : "chevron-down"
                        }
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>

                    {/* Expanded Details - Only Visible When Expanded */}
                    {expandedItems[index] && (
                      <>
                        {/* Stock Grid */}
                        <View style={styles.stockGrid}>
                          <View style={styles.stockItem}>
                            <View style={styles.stockIconContainer}>
                              <MaterialCommunityIcons
                                name="archive"
                                size={20}
                                color="#fbbf24"
                              />
                            </View>
                            <Text style={styles.stockLabel}>
                              الرصيد الافتتاحي
                            </Text>
                            <Text style={styles.stockValue}>{opening}</Text>
                          </View>

                          <View style={styles.stockItem}>
                            <View style={styles.stockIconContainer}>
                              <MaterialCommunityIcons
                                name="arrow-down"
                                size={20}
                                color="#10b981"
                              />
                            </View>
                            <Text style={styles.stockLabel}>إجمالي الوارد</Text>
                            <Text
                              style={[styles.stockValue, styles.incomingValue]}
                            >
                              {totalIncoming}
                            </Text>
                          </View>

                          <View style={styles.stockItem}>
                            <View style={styles.stockIconContainer}>
                              <MaterialCommunityIcons
                                name="arrow-up"
                                size={20}
                                color="#ef4444"
                              />
                            </View>
                            <Text style={styles.stockLabel}>
                              إجمالي المنصرف
                            </Text>
                            <Text
                              style={[styles.stockValue, styles.dispensedValue]}
                            >
                              {totalDispensed}
                            </Text>
                          </View>
                        </View>

                        {/* Stock Status Indicator */}
                        <View style={styles.stockStatusContainer}>
                          <View
                            style={[
                              styles.stockStatusIndicator,
                              {
                                backgroundColor:
                                  currentStock > 0 ? "#10b981" : "#ef4444",
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.stockStatusText,
                              {
                                color: currentStock > 0 ? "#10b981" : "#ef4444",
                              },
                            ]}
                          >
                            {currentStock > 0 ? "متوفر" : "ناقص"}
                          </Text>
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>لا توجد أصناف في المخزون</Text>
            <Text style={styles.emptySubtitle}>
              ابدأ بإضافة الأصناف لتتبع المخزون
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderShortages = () => {
    const shortages = calculateShortages();

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabTitle}>النواقص والاحتياجات</Text>
        {shortages.length > 0 ? (
          <View style={styles.listContainer}>
            {shortages.map((item, index) => (
              <View key={index} style={styles.shortageCard}>
                <Text style={styles.shortageName}>{item.name}</Text>
                <View style={styles.shortageDetails}>
                  <View style={styles.shortageItem}>
                    <Text style={styles.shortageLabel}>المخزون الحالي:</Text>
                    <Text style={styles.shortageValue}>
                      {item.currentStock}
                    </Text>
                  </View>
                  <View style={styles.shortageItem}>
                    <Text style={styles.shortageLabel}>متوسط الاستهلاك:</Text>
                    <Text style={styles.shortageValue}>
                      {item.averageConsumption}
                    </Text>
                  </View>
                  <View style={styles.shortageItem}>
                    <Text style={styles.shortageLabel}>الكمية المطلوبة:</Text>
                    <Text style={[styles.shortageValue, { color: "#ef4444" }]}>
                      {item.shortage}
                    </Text>
                  </View>
                  <View style={styles.shortageItem}>
                    <Text style={styles.shortageLabel}>القيمة المطلوبة:</Text>
                    <Text style={[styles.shortageValue, { color: "#ef4444" }]}>
                      {item.shortage * item.unitPrice} ج.م
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>لا توجد نواقص في المخزون</Text>
        )}
      </ScrollView>
    );
  };

  const renderPharmacists = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>الصيادلة المعينون</Text>
      {pharmacists.length > 0 ? (
        <View style={styles.listContainer}>
          {pharmacists.map((item) => (
            <View key={item.id} style={styles.pharmacistCard}>
              <View style={styles.pharmacistHeader}>
                <Text style={styles.pharmacistName}>{item.name}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        item.role === "senior" ? "#f59e0b" : "#10b981",
                    },
                  ]}
                >
                  <Text style={styles.roleText}>
                    {item.role === "senior" ? "كبير الصيادلة" : "صيدلي"}
                  </Text>
                </View>
              </View>
              <Text style={styles.usernameText}>{item.username}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          لا يوجد صيادلة معينون لهذه الصيدلية
        </Text>
      )}
    </ScrollView>
  );

  const renderAttendance = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>
        حضور الصيادلة -{" "}
        {new Date(getTodayDateString()).toLocaleDateString("ar-EG")}
      </Text>
      {pharmacists.length > 0 ? (
        <View style={styles.listContainer}>
          {pharmacists.map((item) => {
            const status = attendance[item.id];
            return (
              <View key={item.id} style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceName}>{item.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          status === true
                            ? "#10b981"
                            : status === false
                            ? "#ef4444"
                            : "#6b7280",
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {status === true
                        ? "حاضر"
                        : status === false
                        ? "غائب"
                        : "غير محدد"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.usernameText}>{item.username}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          لا يوجد صيادلة معينون لهذه الصيدلية
        </Text>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <SkeletonLoader />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: Math.max(16, insets.bottom) },
      ]}
    >
      {/** NetworkStatusBar removed here to avoid potential nested updates */}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-right"
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="اسم الصيدلية"
                placeholderTextColor="#6b7280"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditPharmacy}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.headerTitle}>{pharmacyData?.name}</Text>
          )}
        </View>
        {user?.role === "lead" && !editing && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePharmacy}
              disabled={deleting}
            >
              <MaterialCommunityIcons
                name={deleting ? "loading" : "delete"}
                size={20}
                color="#ef4444"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton("overview", "نظرة عامة", "view-dashboard")}
        {renderTabButton("inventory", "المخزون", "package-variant")}
        {renderTabButton("shortages", "النواقص", "alert-circle")}
        {renderTabButton("pharmacists", "الصيادلة", "account-group")}
        {renderTabButton("attendance", "الحضور", "calendar-check")}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "inventory" && renderInventory()}
        {activeTab === "shortages" && renderShortages()}
        {activeTab === "pharmacists" && renderPharmacists()}
        {activeTab === "attendance" && renderAttendance()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  saveButton: {
    backgroundColor: "#10b981",
    padding: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#6b7280",
    padding: 8,
    borderRadius: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#1e3a8a",
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#7f1d1d",
    padding: 8,
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  activeTabButton: {
    backgroundColor: "#3b82f6",
  },
  tabButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  activeTabButtonText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statCardLight: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValueLight: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  statLabelLight: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  progressTrackLight: {
    marginTop: 10,
    height: 6,
    width: "100%",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFillLight: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 999,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  infoSection: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  inventoryCard: {
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  inventoryCardGradient: {
    padding: spacing.lg,
  },
  inventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  inventoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  inventoryBasicInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  inventoryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  inventoryStock: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  stockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stockItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "rgba(31, 41, 55, 0.6)",
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  stockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  stockLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  incomingValue: {
    color: "#10b981",
  },
  dispensedValue: {
    color: "#ef4444",
  },
  currentStockValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  stockStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 41, 55, 0.6)",
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  stockStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  stockStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  shortageCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  shortageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  shortageDetails: {
    gap: 8,
  },
  shortageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shortageLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  shortageValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  pharmacistCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pharmacistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pharmacistName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  usernameText: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  attendanceCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  attendanceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default PharmacyDetailsScreen;
