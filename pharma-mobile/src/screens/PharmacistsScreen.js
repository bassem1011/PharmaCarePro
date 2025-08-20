import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import {
  listPharmacies,
  listUsers,
  createUser,
  deleteUser,
} from "../services/firestoreService";
import * as Clipboard from "expo-clipboard";
import NetworkStatusBar from "../components/common/NetworkStatusBar";
import SkeletonLoader from "../components/common/SkeletonLoader";
import AnimatedButton from "../components/common/AnimatedButton";
import { LinearGradient } from "expo-linear-gradient";
import Badge from "../components/common/Badge";
import * as Haptic from "../components/common/Haptics";
import { colors, radii, shadows, gradients } from "../utils/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get("window");

const PharmacistsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [pharmacists, setPharmacists] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "regular",
    pharmacyId: "",
  });
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    let cleanup = null;

    const setupListeners = async () => {
      cleanup = await loadData();
    };

    setupListeners();
    animateIn();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user for multi-tenancy
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
        const pharmaUser = await AsyncStorage.getItem("pharmaUser");
        if (pharmaUser) {
          try {
            const parsedUser = JSON.parse(pharmaUser);
            if (parsedUser && parsedUser.username && parsedUser.role) {
              // For senior pharmacists, they can only view their assigned pharmacy
              if (parsedUser.role === "senior" && parsedUser.assignedPharmacy) {
                const pharmacyDoc = await getDoc(
                  doc(db, "pharmacies", parsedUser.assignedPharmacy)
                );
                if (pharmacyDoc.exists()) {
                  const pharmacyData = {
                    id: pharmacyDoc.id,
                    ...pharmacyDoc.data(),
                  };
                  setPharmacies([pharmacyData]);

                  // Subscribe to pharmacists assigned to this pharmacy
                  const pharmacistsQuery = query(
                    collection(db, "users"),
                    where("assignedPharmacy", "==", parsedUser.assignedPharmacy)
                  );
                  const unsubPharmacists = onSnapshot(
                    pharmacistsQuery,
                    (pharmacistsSnap) => {
                      const pharmacistsData = pharmacistsSnap.docs
                        .map((doc) => ({ id: doc.id, ...doc.data() }))
                        .filter((user) => user.role !== "lead");
                      setPharmacists(pharmacistsData);
                    }
                  );

                  // Store unsubscribe function
                  return () => {
                    if (unsubPharmacists) unsubPharmacists();
                  };
                }
              }
            }
          } catch (error) {
            console.error("Error parsing pharmaUser:", error);
          }
        }
        setPharmacies([]);
        setPharmacists([]);
        setLoading(false);
        return;
      }

      // For lead pharmacists (Firebase Auth users)
      // Subscribe to pharmacies owned by current user
      const pharmaciesQuery = query(
        collection(db, "pharmacies"),
        where("ownerId", "==", currentUser.uid)
      );
      const unsubPharmacies = onSnapshot(pharmaciesQuery, (pharmaciesSnap) => {
        const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPharmacies(pharmaciesData);
      });

      // Subscribe to pharmacists owned by current user
      const pharmacistsQuery = query(
        collection(db, "users"),
        where("ownerId", "==", currentUser.uid)
      );
      const unsubPharmacists = onSnapshot(
        pharmacistsQuery,
        (pharmacistsSnap) => {
          const pharmacistsData = pharmacistsSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((user) => user.role !== "lead");
          setPharmacists(pharmacistsData);
        }
      );

      setLoading(false);

      // Return cleanup function
      return () => {
        if (unsubPharmacies) unsubPharmacies();
        if (unsubPharmacists) unsubPharmacists();
      };
    } catch (error) {
      console.error("Error setting up real-time listeners:", error);
      setLoading(false);
    }
  };

  // Generate a unique username
  const generateUsername = (name) => {
    const base = name.trim().toLowerCase().replace(/\s+/g, "_");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${base}_${rand}`;
  };

  // Generate a random password
  const generatePassword = (length = 8) => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < length; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  };

  const handleAddPharmacist = () => {
    Haptic.tap();
    setFormData({
      name: "",
      role: "regular",
      pharmacyId: "",
    });
    setGeneratedUsername("");
    setGeneratedPassword("");
    setSuccess("");
    setModalVisible(true);
  };

  const handleSavePharmacist = async () => {
    if (!formData.name.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الصيدلي");
      return;
    }

    if (!formData.pharmacyId) {
      Alert.alert("خطأ", "يرجى اختيار الصيدلية");
      return;
    }

    try {
      // Get current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("خطأ", "يجب تسجيل الدخول كمسؤول");
        return;
      }

      const username = generateUsername(formData.name);
      const password = generatePassword();

      const userRef = doc(collection(db, "users"));
      const pharmacistData = {
        id: userRef.id,
        name: formData.name.trim(),
        username,
        password,
        role: formData.role,
        assignedPharmacy: formData.pharmacyId,
        ownerId: currentUser.uid, // Add ownerId for multi-tenancy
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, pharmacistData);

      setGeneratedUsername(username);
      setGeneratedPassword(password);
      setSuccess("تم إنشاء حساب الصيدلي بنجاح");
      setModalVisible(false);

      // Clear form after a delay
      setTimeout(() => {
        setGeneratedUsername("");
        setGeneratedPassword("");
        setSuccess("");
      }, 3000);

      // Realtime listeners will update state
    } catch (error) {
      console.error("Error adding pharmacist:", error);
      Alert.alert("خطأ", "فشل في إضافة الصيدلي: " + error.message);
    }
  };

  const handleRoleChange = async (pharmacist, newRole) => {
    try {
      // Get current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("خطأ", "يجب تسجيل الدخول كمسؤول");
        return;
      }

      // Check if current user owns this pharmacist
      if (pharmacist.ownerId && pharmacist.ownerId !== currentUser.uid) {
        Alert.alert("خطأ", "لا يمكنك تعديل صيدلي لا تملكه");
        return;
      }

      // If promoting to senior, enforce only one senior per pharmacy
      if (newRole === "senior" && pharmacist.assignedPharmacy) {
        // Get users from the same pharmacy (filtered by ownerId for multi-tenancy)
        const usersQuery = query(
          collection(db, "users"),
          where("ownerId", "==", currentUser.uid),
          where("assignedPharmacy", "==", pharmacist.assignedPharmacy)
        );
        const usersSnap = await getDocs(usersQuery);
        const samePharmacyUsers = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== pharmacist.id);

        const batch = writeBatch(db);
        // Demote others to regular
        samePharmacyUsers.forEach((u) => {
          const ref = doc(db, "users", u.id);
          batch.set(ref, { role: "regular" }, { merge: true });
        });
        // Promote selected pharmacist to senior
        batch.set(
          doc(db, "users", pharmacist.id),
          { ...pharmacist, role: "senior" },
          { merge: true }
        );
        await batch.commit();
      } else {
        // Regular role update
        await setDoc(
          doc(db, "users", pharmacist.id),
          { ...pharmacist, role: newRole },
          { merge: true }
        );
      }
      // No need to call loadData - onSnapshot will update automatically
    } catch (error) {
      console.error("Error updating role:", error);
      Alert.alert("خطأ", "فشل في تحديث الدور: " + error.message);
    }
  };

  const handlePharmacyChange = async (pharmacist, newPharmacyId) => {
    try {
      // Get current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("خطأ", "يجب تسجيل الدخول كمسؤول");
        return;
      }

      // Check if current user owns this pharmacist
      if (pharmacist.ownerId && pharmacist.ownerId !== currentUser.uid) {
        Alert.alert("خطأ", "لا يمكنك تعديل صيدلي لا تملكه");
        return;
      }

      await setDoc(
        doc(db, "users", pharmacist.id),
        { ...pharmacist, assignedPharmacy: newPharmacyId },
        { merge: true }
      );
      // No need to call loadData - onSnapshot will update automatically
    } catch (error) {
      console.error("Error updating pharmacy:", error);
      Alert.alert("خطأ", "فشل في تحديث الصيدلية: " + error.message);
    }
  };

  const handleDeletePharmacist = async (pharmacist) => {
    Alert.alert(
      "حذف الصيدلي",
      `هل أنت متأكد من حذف الصيدلي "${pharmacist.name}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              // First check if the user exists and get their data
              const userDoc = await getDoc(doc(db, "users", pharmacist.id));
              if (!userDoc.exists()) {
                Alert.alert("خطأ", "الصيدلي غير موجود");
                return;
              }

              const userData = userDoc.data();

              // Check if the current user is a lead and owns this pharmacist
              const auth = getAuth();
              const currentUser = auth.currentUser;
              if (!currentUser) {
                // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
                const pharmaUser = await AsyncStorage.getItem("pharmaUser");
                if (!pharmaUser) {
                  Alert.alert("خطأ", "يجب تسجيل الدخول كمسؤول");
                  return;
                }
              } else {
                // For lead users, check ownership
                if (userData.ownerId && userData.ownerId !== currentUser.uid) {
                  Alert.alert("خطأ", "لا يمكنك حذف صيدلي لا تملكه");
                  return;
                }
              }

              Haptic.warning();
              await deleteUser(pharmacist.id);
              // No need to call loadData - real-time listeners will update automatically
              Alert.alert("نجح", "تم حذف الصيدلي بنجاح");
            } catch (error) {
              console.error("Error deleting pharmacist:", error);
              Alert.alert("خطأ", "فشل في حذف الصيدلي: " + error.message);
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("نجح", "تم نسخ النص إلى الحافظة");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      Alert.alert("خطأ", "فشل في نسخ النص");
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case "senior":
        return "كبير الصيادلة";
      case "regular":
        return "صيدلي";
      default:
        return "غير محدد";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "senior":
        return "#f59e0b";
      case "regular":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const renderPharmacistItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.pharmacistCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 20],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={gradients.card}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.pharmacistInfo}>
            <MaterialCommunityIcons
              name="account-circle"
              size={32}
              color={colors.brandStart}
              style={styles.pharmacistIcon}
            />
            <View style={styles.pharmacistDetails}>
              <Text style={styles.pharmacistName}>{item.name}</Text>
              <Text style={styles.pharmacistUsername}>{item.username}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyToClipboard(item.username)}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={18}
                color={colors.blue}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyToClipboard(item.password)}
            >
              <MaterialCommunityIcons
                name="key"
                size={18}
                color={colors.amber}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeletePharmacist(item)}
            >
              <MaterialCommunityIcons
                name="delete"
                size={18}
                color={colors.red}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>الدور:</Text>
            <TouchableOpacity
              onPress={() => {
                const newRole = item.role === "senior" ? "regular" : "senior";
                handleRoleChange(item, newRole);
              }}
            >
              <Badge
                label={getRoleText(item.role)}
                variant={item.role === "senior" ? "warning" : "success"}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>الصيدلية:</Text>
            <TouchableOpacity
              style={styles.pharmacySelector}
              onPress={() => {
                Alert.alert("تغيير الصيدلية", "اختر الصيدلية الجديدة:", [
                  { text: "إلغاء", style: "cancel" },
                  ...pharmacies.map((pharmacy) => ({
                    text: pharmacy.name,
                    onPress: () => handlePharmacyChange(item, pharmacy.id),
                  })),
                  {
                    text: "إلغاء التعيين",
                    style: "destructive",
                    onPress: () => handlePharmacyChange(item, ""),
                  },
                ]);
              }}
            >
              <Text style={styles.pharmacySelectorText}>
                {pharmacies.find((p) => p.id === item.assignedPharmacy)?.name ||
                  "غير معين"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderAddButton = () => (
    <Animated.View
      style={[
        styles.addButtonContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddPharmacist}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#10b981", "#059669", "#047857"]}
          style={styles.addButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons
            name="account-plus"
            size={24}
            color="#ffffff"
          />
          <Text style={styles.addButtonText}>إضافة صيدلي</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <NetworkStatusBar />
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
      <NetworkStatusBar />

      {/* Header */}
      <LinearGradient colors={gradients.header} style={styles.header}>
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
          <Text style={styles.headerTitle}>إدارة الصيادلة</Text>
          <Text style={styles.headerSubtitle}>
            إضافة وإدارة الصيادلة وتعيينهم للصيدليات
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الصيادلة</Text>
          <Text style={styles.sectionCount}>{pharmacists.length} صيدلي</Text>
        </View>

        {pharmacists.length > 0 ? (
          <FlatList
            data={pharmacists}
            renderItem={renderPharmacistItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={64}
              color="#6b7280"
            />
            <Text style={styles.emptyTitle}>لا يوجد صيادلة</Text>
            <Text style={styles.emptySubtitle}>
              ابدأ بإضافة صيدلي جديد لإدارة الصيدليات
            </Text>
          </View>
        )}

        {renderAddButton()}
      </View>

      {/* Add Pharmacist Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalContent}>
              <LinearGradient
                colors={["#1f2937", "#374151"]}
                style={styles.modalGradient}
              >
                <Text style={styles.modalTitle}>إضافة صيدلي جديد</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>اسم الصيدلي *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="أدخل اسم الصيدلي"
                    placeholderTextColor="#6b7280"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>الدور *</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.role === "regular" && styles.roleOptionActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, role: "regular" })
                      }
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.role === "regular" &&
                            styles.roleOptionTextActive,
                        ]}
                      >
                        صيدلي
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.role === "senior" && styles.roleOptionActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, role: "senior" })
                      }
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.role === "senior" &&
                            styles.roleOptionTextActive,
                        ]}
                      >
                        كبير الصيادلة
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>الصيدلية *</Text>
                  <ScrollView
                    style={styles.pharmacySelectorContainer}
                    contentContainerStyle={styles.pharmacySelectorContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {pharmacies.map((pharmacy) => (
                      <TouchableOpacity
                        key={pharmacy.id}
                        style={[
                          styles.pharmacyOption,
                          formData.pharmacyId === pharmacy.id &&
                            styles.pharmacyOptionActive,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            pharmacyId: pharmacy.id,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.pharmacyOptionText,
                            formData.pharmacyId === pharmacy.id &&
                              styles.pharmacyOptionTextActive,
                          ]}
                        >
                          {pharmacy.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSavePharmacist}
                  >
                    <LinearGradient
                      colors={["#10b981", "#059669"]}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.modalSaveText}>حفظ</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      {success && (
        <Modal
          visible={!!success}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSuccess("")}
        >
          <View style={styles.successOverlay}>
            <View style={styles.successContent}>
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.successGradient}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={48}
                  color="#ffffff"
                  style={styles.successIcon}
                />
                <Text style={styles.successTitle}>{success}</Text>
                <View style={styles.credentialsContainer}>
                  <View style={styles.credentialItem}>
                    <Text style={styles.credentialLabel}>اسم المستخدم:</Text>
                    <TouchableOpacity
                      style={styles.credentialValue}
                      onPress={() => copyToClipboard(generatedUsername)}
                    >
                      <Text style={styles.credentialText}>
                        {generatedUsername}
                      </Text>
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={16}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.credentialItem}>
                    <Text style={styles.credentialLabel}>كلمة المرور:</Text>
                    <TouchableOpacity
                      style={styles.credentialValue}
                      onPress={() => copyToClipboard(generatedPassword)}
                    >
                      <Text style={styles.credentialText}>
                        {generatedPassword}
                      </Text>
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={16}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={() => setSuccess("")}
                >
                  <Text style={styles.successButtonText}>حسناً</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f3f4f6",
  },
  sectionCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  listContainer: {
    paddingBottom: 720, // Doubled the padding
  },
  separator: {
    height: 12,
  },
  pharmacistCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pharmacistInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pharmacistIcon: {
    marginRight: 12,
  },
  pharmacistDetails: {
    flex: 1,
  },
  pharmacistName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  pharmacistUsername: {
    fontSize: 14,
    color: "#9ca3af",
    fontFamily: "monospace",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#374151",
  },
  deleteButton: {
    backgroundColor: "#7f1d1d",
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    flex: 1,
    width: "100%",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
  },
  modalGradient: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d1d5db",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  roleSelector: {
    flexDirection: "row",
    gap: 12,
  },
  roleOption: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  roleOptionActive: {
    borderColor: "#10b981",
    backgroundColor: "#065f46",
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  roleOptionTextActive: {
    color: "#ffffff",
  },
  pharmacySelectorContainer: {
    backgroundColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4b5563",
    minWidth: 120,
    maxHeight: 200,
  },
  pharmacySelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pharmacySelectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    marginRight: 8,
    textAlign: "center",
  },
  pharmacyOption: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  pharmacyOptionActive: {
    borderColor: "#10b981",
    backgroundColor: "#065f46",
  },
  pharmacyOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    textAlign: "center",
  },
  pharmacyOptionTextActive: {
    color: "#ffffff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#6b7280",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successContent: {
    width: width - 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  successGradient: {
    padding: 32,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  credentialsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  credentialItem: {
    marginBottom: 16,
  },
  credentialLabel: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 8,
  },
  credentialValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  credentialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "monospace",
  },
  successButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default PharmacistsScreen;
