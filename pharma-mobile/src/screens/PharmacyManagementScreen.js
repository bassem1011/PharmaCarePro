import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import AnimatedButton from "../components/common/AnimatedButton";
import SkeletonLoader from "../components/common/SkeletonLoader";
import PullToRefresh from "../components/common/PullToRefresh";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { deletePharmacy as deletePharmacyService } from "../services/firestoreService";
import { db } from "../services/firebase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const PharmacyManagementScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPharmacyName, setNewPharmacyName] = useState("");
  const [addingPharmacy, setAddingPharmacy] = useState(false);
  const [deletingPharmacy, setDeletingPharmacy] = useState(null);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const modalAnim = new Animated.Value(0);

  useEffect(() => {
    if (!loading) {
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
  }, [loading]);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
      const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPharmacies(pharmaciesData);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      Alert.alert("خطأ", "فشل تحميل الصيدليات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPharmacies();
    setRefreshing(false);
  };

  const handleAddPharmacy = async () => {
    if (!newPharmacyName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الصيدلية");
      return;
    }

    try {
      setAddingPharmacy(true);
      await addDoc(collection(db, "pharmacies"), {
        name: newPharmacyName.trim(),
        createdAt: new Date().toISOString(),
      });

      setNewPharmacyName("");
      setShowAddModal(false);
      await fetchPharmacies();
      Alert.alert("نجح", "تم إضافة الصيدلية بنجاح");
    } catch (error) {
      console.error("Error adding pharmacy:", error);
      Alert.alert("خطأ", "فشل إضافة الصيدلية");
    } finally {
      setAddingPharmacy(false);
    }
  };

  const handleDeletePharmacy = async (pharmacy) => {
    Alert.alert(
      "تأكيد الحذف",
      `هل أنت متأكد من حذف الصيدلية "${pharmacy.name}"؟\n\nسيتم حذف الصيدلية وإلغاء تعيين جميع الصيادلة المرتبطين بها.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPharmacy(pharmacy.id);
              await deletePharmacyService(pharmacy.id);
              await fetchPharmacies();
              Alert.alert("نجح", "تم حذف الصيدلية بنجاح");
            } catch (error) {
              console.error("Error deleting pharmacy:", error);
              Alert.alert("خطأ", "فشل حذف الصيدلية");
            } finally {
              setDeletingPharmacy(null);
            }
          },
        },
      ]
    );
  };

  const openAddModal = () => {
    setShowAddModal(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeAddModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowAddModal(false);
      setNewPharmacyName("");
    });
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={{ height: insets.top, backgroundColor: "#111827" }} />
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="card" height={120} />
          <SkeletonLoader variant="card" height={120} />
          <SkeletonLoader variant="card" height={120} />
          <SkeletonLoader variant="card" height={120} />
        </View>
        <View style={{ height: insets.bottom, backgroundColor: "#111827" }} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={{ height: insets.top, backgroundColor: "#111827" }} />
      <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
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
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>إدارة الصيدليات</Text>
                <Text style={styles.headerSubtitle}>
                  عرض وإدارة جميع الصيدليات في النظام
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="store"
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.statValue}>{pharmacies.length}</Text>
                <Text style={styles.statLabel}>إجمالي الصيدليات</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color="#10b981"
                />
                <Text style={styles.statValue}>
                  {pharmacies.reduce(
                    (acc, pharmacy) => acc + (pharmacy.pharmacistCount || 0),
                    0
                  )}
                </Text>
                <Text style={styles.statLabel}>إجمالي الصيادلة</Text>
              </View>
            </View>

            {/* Pharmacies List */}
            {pharmacies.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="store-off"
                  size={64}
                  color="#6b7280"
                />
                <Text style={styles.emptyTitle}>لا توجد صيدليات</Text>
                <Text style={styles.emptySubtitle}>
                  ابدأ بإضافة صيدلية جديدة
                </Text>
                <AnimatedButton
                  title="+ إضافة صيدلية"
                  onPress={openAddModal}
                  variant="success"
                  size="medium"
                />
              </View>
            ) : (
              <View style={styles.pharmaciesContainer}>
                <Text style={styles.sectionTitle}>الصيدليات</Text>
                {pharmacies.map((pharmacy, index) => (
                  <Animated.View
                    key={pharmacy.id}
                    style={[
                      styles.pharmacyCard,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateY: Animated.multiply(
                              slideAnim,
                              new Animated.Value(index * 0.1)
                            ),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.pharmacyInfo}>
                      <View style={styles.pharmacyHeader}>
                        <MaterialCommunityIcons
                          name="store"
                          size={32}
                          color="#3b82f6"
                        />
                        <View style={styles.pharmacyDetails}>
                          <Text style={styles.pharmacyName}>
                            {pharmacy.name}
                          </Text>
                          <Text style={styles.pharmacyMeta}>
                            تم إنشاؤها في{" "}
                            {new Date(pharmacy.createdAt).toLocaleDateString(
                              "ar-SA"
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pharmacyStats}>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons
                            name="account-group"
                            size={16}
                            color="#6b7280"
                          />
                          <Text style={styles.statText}>
                            {pharmacy.pharmacistCount || 0} صيدلي
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons
                            name="calendar-check"
                            size={16}
                            color="#6b7280"
                          />
                          <Text style={styles.statText}>
                            {pharmacy.attendanceRate || 0}% حضور
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.pharmacyActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          navigation.navigate("PharmacyDetails", {
                            pharmacyId: pharmacy.id,
                          })
                        }
                      >
                        <MaterialCommunityIcons
                          name="eye"
                          size={20}
                          color="#3b82f6"
                        />
                        <Text style={styles.actionButtonText}>
                          عرض التفاصيل
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeletePharmacy(pharmacy)}
                        disabled={deletingPharmacy === pharmacy.id}
                      >
                        {deletingPharmacy === pharmacy.id ? (
                          <MaterialCommunityIcons
                            name="loading"
                            size={20}
                            color="#ef4444"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="delete"
                            size={20}
                            color="#ef4444"
                          />
                        )}
                        <Text
                          style={[
                            styles.actionButtonText,
                            styles.deleteButtonText,
                          ]}
                        >
                          {deletingPharmacy === pharmacy.id
                            ? "جاري الحذف..."
                            : "حذف"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </PullToRefresh>

      {/* Add Pharmacy Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="none"
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnim,
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة صيدلية جديدة</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>اسم الصيدلية</Text>
              <TextInput
                style={styles.textInput}
                value={newPharmacyName}
                onChangeText={setNewPharmacyName}
                placeholder="أدخل اسم الصيدلية"
                placeholderTextColor="#6b7280"
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeAddModal}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !newPharmacyName.trim() && styles.saveButtonDisabled,
                ]}
                onPress={handleAddPharmacy}
                disabled={!newPharmacyName.trim() || addingPharmacy}
              >
                {addingPharmacy ? (
                  <MaterialCommunityIcons
                    name="loading"
                    size={20}
                    color="#ffffff"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#ffffff"
                  />
                )}
                <Text style={styles.saveButtonText}>
                  {addingPharmacy ? "جاري الإضافة..." : "إضافة"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <View style={{ height: insets.bottom, backgroundColor: "#111827" }} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#1f2937",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#10b981",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b7280",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 8,
    marginBottom: 24,
  },
  pharmaciesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  pharmacyCard: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pharmacyInfo: {
    marginBottom: 16,
  },
  pharmacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pharmacyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  pharmacyMeta: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  pharmacyStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  pharmacyActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#374151",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
  },
  deleteButtonText: {
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalContent: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#374151",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#374151",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#10b981",
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#374151",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
});

export default PharmacyManagementScreen;
