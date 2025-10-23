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
import * as Clipboard from "expo-clipboard";
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
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window");

const PharmacistManagementScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pharmacists, setPharmacists] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPharmacist, setEditingPharmacist] = useState(null);
  const [deletingPharmacist, setDeletingPharmacist] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    pharmacyId: "",
    role: "regular",
  });

  // Generated credentials
  const [generatedCredentials, setGeneratedCredentials] = useState({
    username: "",
    password: "",
  });

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

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pharmacists
      const pharmacistsSnap = await getDocs(collection(db, "users"));
      const pharmacistsData = pharmacistsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPharmacists(pharmacistsData);

      // Fetch pharmacies
      const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
      const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPharmacies(pharmaciesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("خطأ", "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Generate unique username
  const generateUsername = (name) => {
    const base = name.trim().toLowerCase().replace(/\s+/g, "_");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${base}_${rand}`;
  };

  // Generate random password
  const generatePassword = (length = 8) => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < length; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  };

  const handleAddPharmacist = async () => {
    if (!form.name.trim() || !form.pharmacyId) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const username = generateUsername(form.name);
      const password = generatePassword();

      const userRef = await addDoc(collection(db, "users"), {
        username,
        password,
        name: form.name.trim(),
        role: form.role,
        assignedPharmacy: form.pharmacyId,
        createdAt: new Date().toISOString(),
      });
      // Save id into the document for parity with web mobile usage
      await updateDoc(doc(db, "users", userRef.id), { id: userRef.id });

      setGeneratedCredentials({ username, password });
      setForm({ name: "", pharmacyId: "", role: "regular" });
      setShowAddModal(false);
      await fetchData();

      Alert.alert("نجح", "تم إنشاء الصيدلي بنجاح!", [
        {
          text: "عرض البيانات",
          onPress: () => {
            Alert.alert(
              "بيانات تسجيل الدخول",
              `اسم المستخدم: ${username}\nكلمة المرور: ${password}`,
              [{ text: "حفظ" }]
            );
          },
        },
        { text: "إغلاق" },
      ]);
    } catch (error) {
      console.error("Error adding pharmacist:", error);
      Alert.alert("خطأ", "فشل إنشاء الصيدلي");
    }
  };

  const handleUpdatePharmacist = async (pharmacist, field, value) => {
    try {
      await updateDoc(doc(db, "users", pharmacist.id), {
        [field]: value,
      });
      await fetchData();
    } catch (error) {
      console.error("Error updating pharmacist:", error);
      Alert.alert("خطأ", "فشل تحديث البيانات");
    }
  };

  const handleDeletePharmacist = async (pharmacist) => {
    Alert.alert(
      "تأكيد الحذف",
      `هل أنت متأكد من حذف الصيدلي "${pharmacist.name}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPharmacist(pharmacist.id);
              await deleteDoc(doc(db, "users", pharmacist.id));
              await fetchData();
              Alert.alert("نجح", "تم حذف الصيدلي بنجاح");
            } catch (error) {
              console.error("Error deleting pharmacist:", error);
              Alert.alert("خطأ", "فشل حذف الصيدلي");
            } finally {
              setDeletingPharmacist(null);
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
      setForm({ name: "", pharmacyId: "", role: "regular" });
      setGeneratedCredentials({ username: "", password: "" });
    });
  };

  const getPharmacyName = (pharmacyId) => {
    const pharmacy = pharmacies.find((p) => p.id === pharmacyId);
    return pharmacy ? pharmacy.name : "غير محدد";
  };

  const getRoleText = (role) => {
    return role === "senior" ? "صيدلي خبير" : "صيدلي";
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setString(text);
      Alert.alert("تم النسخ", `${label} تم نسخه إلى الحافظة`);
    } catch (error) {
      Alert.alert("خطأ", "فشل نسخ البيانات");
    }
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
                <Text style={styles.headerTitle}>إدارة الصيادلة</Text>
                <Text style={styles.headerSubtitle}>
                  عرض وإدارة جميع الصيادلة في النظام
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
                  name="account-group"
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.statValue}>{pharmacists.length}</Text>
                <Text style={styles.statLabel}>إجمالي الصيادلة</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="account-star"
                  size={24}
                  color="#f59e0b"
                />
                <Text style={styles.statValue}>
                  {pharmacists.filter((p) => p.role === "senior").length}
                </Text>
                <Text style={styles.statLabel}>كبار الصيادلة</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="store"
                  size={24}
                  color="#10b981"
                />
                <Text style={styles.statValue}>
                  {
                    new Set(
                      pharmacists.map((p) => p.assignedPharmacy).filter(Boolean)
                    ).size
                  }
                </Text>
                <Text style={styles.statLabel}>الصيدليات النشطة</Text>
              </View>
            </View>

            {/* Pharmacists List */}
            {pharmacists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="account-off"
                  size={64}
                  color="#6b7280"
                />
                <Text style={styles.emptyTitle}>لا يوجد صيادلة</Text>
                <Text style={styles.emptySubtitle}>ابدأ بإضافة صيدلي جديد</Text>
                <AnimatedButton
                  title="+ إضافة صيدلي"
                  onPress={openAddModal}
                  variant="success"
                  size="medium"
                />
              </View>
            ) : (
              <View style={styles.pharmacistsContainer}>
                <Text style={styles.sectionTitle}>الصيادلة</Text>
                {pharmacists.map((pharmacist, index) => (
                  <Animated.View
                    key={pharmacist.id}
                    style={[
                      styles.pharmacistCard,
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
                    <View style={styles.pharmacistInfo}>
                      <View style={styles.pharmacistHeader}>
                        <MaterialCommunityIcons
                          name="account"
                          size={32}
                          color="#3b82f6"
                        />
                        <View style={styles.pharmacistDetails}>
                          <Text style={styles.pharmacistName}>
                            {pharmacist.name || "غير محدد"}
                          </Text>
                          <Text style={styles.pharmacistUsername}>
                            {pharmacist.username || "غير محدد"}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor:
                                pharmacist.role === "senior"
                                  ? "#f59e0b"
                                  : "#6b7280",
                            },
                          ]}
                        >
                          <Text style={styles.roleBadgeText}>
                            {getRoleText(pharmacist.role)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pharmacistStats}>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons
                            name="store"
                            size={16}
                            color="#6b7280"
                          />
                          <Text style={styles.statText}>
                            {getPharmacyName(pharmacist.assignedPharmacy)}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons
                            name="calendar"
                            size={16}
                            color="#6b7280"
                          />
                          <Text style={styles.statText}>
                            {pharmacist.createdAt
                              ? new Date(
                                  pharmacist.createdAt
                                ).toLocaleDateString("ar-SA")
                              : "غير محدد"}
                          </Text>
                        </View>
                      </View>

                      {/* Credentials Section */}
                      <View style={styles.credentialsSection}>
                        <Text style={styles.credentialsTitle}>
                          بيانات تسجيل الدخول
                        </Text>
                        <View style={styles.credentialsContainer}>
                          <View style={styles.credentialItem}>
                            <View style={styles.credentialInfo}>
                              <Text style={styles.credentialLabel}>
                                اسم المستخدم:
                              </Text>
                              <Text style={styles.credentialValue}>
                                {pharmacist.username || "غير محدد"}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.copyButton}
                              onPress={() =>
                                copyToClipboard(
                                  pharmacist.username,
                                  "اسم المستخدم"
                                )
                              }
                            >
                              <MaterialCommunityIcons
                                name="content-copy"
                                size={16}
                                color="#3b82f6"
                              />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.credentialItem}>
                            <View style={styles.credentialInfo}>
                              <Text style={styles.credentialLabel}>
                                كلمة المرور:
                              </Text>
                              <Text style={styles.credentialValue}>
                                {pharmacist.password || "غير محدد"}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.copyButton}
                              onPress={() =>
                                copyToClipboard(
                                  pharmacist.password,
                                  "كلمة المرور"
                                )
                              }
                            >
                              <MaterialCommunityIcons
                                name="content-copy"
                                size={16}
                                color="#3b82f6"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.pharmacistActions}>
                      <View style={styles.actionRow}>
                        <View style={styles.pickerContainer}>
                          <Text style={styles.pickerLabel}>الدور:</Text>
                          <Picker
                            selectedValue={pharmacist.role}
                            onValueChange={(value) =>
                              handleUpdatePharmacist(pharmacist, "role", value)
                            }
                            style={styles.picker}
                          >
                            <Picker.Item label="صيدلي" value="regular" />
                            <Picker.Item label="صيدلي خبير" value="senior" />
                          </Picker>
                        </View>

                        <View style={styles.pickerContainer}>
                          <Text style={styles.pickerLabel}>الصيدلية:</Text>
                          <Picker
                            selectedValue={pharmacist.assignedPharmacy || ""}
                            onValueChange={(value) =>
                              handleUpdatePharmacist(
                                pharmacist,
                                "assignedPharmacy",
                                value
                              )
                            }
                            style={styles.picker}
                          >
                            <Picker.Item label="غير معين" value="" />
                            {pharmacies.map((pharmacy) => (
                              <Picker.Item
                                key={pharmacy.id}
                                label={pharmacy.name}
                                value={pharmacy.id}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePharmacist(pharmacist)}
                        disabled={deletingPharmacist === pharmacist.id}
                      >
                        {deletingPharmacist === pharmacist.id ? (
                          <MaterialCommunityIcons
                            name="loading"
                            size={20}
                            color="#ffffff"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="delete"
                            size={20}
                            color="#ffffff"
                          />
                        )}
                        <Text style={styles.deleteButtonText}>
                          {deletingPharmacist === pharmacist.id
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

      {/* Add Pharmacist Modal */}
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
              <Text style={styles.modalTitle}>إضافة صيدلي جديد</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>اسم الصيدلي</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder="أدخل اسم الصيدلي"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الدور</Text>
                <Picker
                  selectedValue={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value })}
                  style={styles.modalPicker}
                >
                  <Picker.Item label="صيدلي" value="regular" />
                  <Picker.Item label="صيدلي خبير" value="senior" />
                </Picker>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الصيدلية</Text>
                <Picker
                  selectedValue={form.pharmacyId}
                  onValueChange={(value) =>
                    setForm({ ...form, pharmacyId: value })
                  }
                  style={styles.modalPicker}
                >
                  <Picker.Item label="اختر الصيدلية" value="" />
                  {pharmacies.map((pharmacy) => (
                    <Picker.Item
                      key={pharmacy.id}
                      label={pharmacy.name}
                      value={pharmacy.id}
                    />
                  ))}
                </Picker>
              </View>
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
                  (!form.name.trim() || !form.pharmacyId) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleAddPharmacist}
                disabled={!form.name.trim() || !form.pharmacyId}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#ffffff"
                />
                <Text style={styles.saveButtonText}>إضافة</Text>
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
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
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
    fontSize: 20,
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
  pharmacistsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  pharmacistCard: {
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
  pharmacistInfo: {
    marginBottom: 16,
  },
  pharmacistHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pharmacistDetails: {
    marginLeft: 12,
    flex: 1,
  },
  pharmacistName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  pharmacistUsername: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  pharmacistStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
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
  credentialsSection: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  credentialsContainer: {
    gap: 8,
  },
  credentialItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  credentialInfo: {
    flex: 1,
  },
  credentialLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  credentialValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    fontFamily: "monospace",
  },
  copyButton: {
    padding: 8,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    marginLeft: 8,
  },
  pharmacistActions: {
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 4,
  },
  picker: {
    backgroundColor: "#374151",
    borderRadius: 8,
    color: "#ffffff",
  },
  modalPicker: {
    backgroundColor: "#374151",
    borderRadius: 8,
    color: "#ffffff",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "500",
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
  inputGroup: {
    marginBottom: 16,
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

export default PharmacistManagementScreen;
