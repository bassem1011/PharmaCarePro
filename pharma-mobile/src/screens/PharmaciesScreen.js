import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import {
  deletePharmacy as deletePharmacyService,
  createPharmacy,
} from "../services/firestoreService";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetworkStatusBar from "../components/common/NetworkStatusBar";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptic from "../components/common/Haptics";
import { colors, shadows, gradients } from "../utils/theme";

const { width } = Dimensions.get("window");

const PharmaciesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPharmacyName, setNewPharmacyName] = useState("");
  const [deletingPharmacy, setDeletingPharmacy] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const animateIn = useCallback(() => {
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
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    let cleanup = null;

    const setupListeners = async () => {
      cleanup = await loadPharmacies();
    };

    setupListeners();
    animateIn();

    return () => {
      if (cleanup) cleanup();
    };
  }, [animateIn]);

  const loadPharmacies = async () => {
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
              // For senior pharmacists, they can only see their assigned pharmacy
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
                }
              }
            }
          } catch (error) {
            console.error("Error parsing pharmaUser:", error);
          }
        }
        setPharmacies([]);
        setLoading(false);
        return;
      }

      // For lead pharmacists (Firebase Auth users)
      // Subscribe to pharmacies owned by current user
      const pharmaciesQuery = query(
        collection(db, "pharmacies"),
        where("ownerId", "==", currentUser.uid)
      );
      const unsub = onSnapshot(
        pharmaciesQuery,
        (pharmaciesSnap) => {
          const pharmaciesData = pharmaciesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPharmacies(pharmaciesData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching pharmacies:", error);
          Alert.alert("خطأ", "فشل في تحميل الصيدليات");
          setLoading(false);
        }
      );

      // Return cleanup function
      return unsub;
    } catch (error) {
      console.error("Error setting up real-time listeners:", error);
      Alert.alert("خطأ", "فشل في تحميل الصيدليات");
      setLoading(false);
    }
  };

  const handleAddPharmacy = () => {
    Haptic.tap();
    setNewPharmacyName("");
    setModalVisible(true);
  };

  const handleSavePharmacy = async () => {
    if (!newPharmacyName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الصيدلية");
      return;
    }

    try {
      await createPharmacy(newPharmacyName.trim());
      setModalVisible(false);
      // realtime listener updates state automatically
      Alert.alert("نجح", "تم إضافة الصيدلية بنجاح");
    } catch (error) {
      console.error("Error adding pharmacy:", error);
      Alert.alert("خطأ", "فشل في إضافة الصيدلية");
    }
  };

  const handleDeletePharmacy = (pharmacy) => {
    Alert.alert(
      "حذف الصيدلية",
      `هل أنت متأكد من حذف الصيدلية "${pharmacy.name}"؟\n\nسيتم حذف الصيدلية وإلغاء تعيين جميع الصيادلة المرتبطين بها.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              // First check if the pharmacy exists and get its data
              const pharmacyDoc = await getDoc(
                doc(db, "pharmacies", pharmacy.id)
              );
              if (!pharmacyDoc.exists()) {
                Alert.alert("خطأ", "الصيدلية غير موجودة");
                return;
              }

              const pharmacyData = pharmacyDoc.data();

              // Check if the current user is a lead and owns this pharmacy
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
                if (
                  pharmacyData.ownerId &&
                  pharmacyData.ownerId !== currentUser.uid
                ) {
                  Alert.alert("خطأ", "لا يمكنك حذف صيدلية لا تملكها");
                  return;
                }
              }

              setDeletingPharmacy(pharmacy.id);
              Haptic.warning();
              await deletePharmacyService(pharmacy.id);
              // realtime listener updates state automatically and user assignments cleared
              Alert.alert("نجح", "تم حذف الصيدلية بنجاح");
            } catch (error) {
              console.error("Error deleting pharmacy:", error);
              Alert.alert("خطأ", "فشل في حذف الصيدلية: " + error.message);
            } finally {
              setDeletingPharmacy(null);
            }
          },
        },
      ]
    );
  };

  const renderPharmacyItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.pharmacyCard,
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
      <View style={styles.cardPlain}>
        {/* Subtle gradient strip (RTL: on the right edge) */}
        <LinearGradient
          colors={
            item.hasShortages ? ["#ef4444", "#b91c1c"] : gradients.primary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardStrip}
          pointerEvents="none"
        />
        <View style={styles.cardTopRow}>
          <Text style={styles.pharmacyName}>{item.name}</Text>
          {!!item.assignedCount && (
            <View style={styles.badge}>
              <MaterialCommunityIcons
                name="account-group"
                size={14}
                color="#fff"
              />
              <Text style={styles.badgeText}>{item.assignedCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionPill, styles.viewPill]}
            onPress={() =>
              navigation.navigate("PharmacyDetails", { pharmacyId: item.id })
            }
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="eye" size={18} color="#ffffff" />
            <Text style={styles.actionPillText}>عرض التفاصيل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionPill, styles.deletePill]}
            onPress={() => handleDeletePharmacy(item)}
            disabled={deletingPharmacy === item.id}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons
              name="trash-can"
              size={18}
              color="#ffffff"
            />
            <Text style={styles.actionPillText}>
              {deletingPharmacy === item.id ? "جاري الحذف" : "حذف"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
        onPress={handleAddPharmacy}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradients.primary}
          style={styles.addButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>إضافة صيدلية</Text>
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
          <Text style={styles.headerTitle}>إدارة الصيدليات</Text>
          <Text style={styles.headerSubtitle}>
            عرض وإدارة جميع الصيدليات في النظام
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الصيدليات</Text>
          <Text style={styles.sectionCount}>{pharmacies.length} صيدلية</Text>
        </View>

        {pharmacies.length > 0 ? (
          <FlatList
            data={pharmacies}
            renderItem={renderPharmacyItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="pharmacy-off"
              size={64}
              color="#6b7280"
            />
            <Text style={styles.emptyTitle}>لا توجد صيدليات</Text>
            <Text style={styles.emptySubtitle}>
              ابدأ بإضافة صيدلية جديدة لإدارة المخزون والصيادلة
            </Text>
          </View>
        )}

        {renderAddButton()}
      </View>

      {/* Add Pharmacy Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={gradients.card}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>إضافة صيدلية جديدة</Text>
              <TextInput
                style={styles.modalInput}
                value={newPharmacyName}
                onChangeText={setNewPharmacyName}
                placeholder="اسم الصيدلية"
                placeholderTextColor="#6b7280"
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSavePharmacy}
                >
                  <LinearGradient
                    colors={[colors.green, "#059669"]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.modalSaveText}>حفظ</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  pharmacyCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardPlain: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#374151",
    padding: 16,
    overflow: "hidden",
  },
  cardStrip: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    opacity: 0.9,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardGradient: {
    padding: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  viewPill: {
    backgroundColor: colors.brandStart,
  },
  deletePill: {
    backgroundColor: colors.red,
  },
  actionPillText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#374151",
    position: "absolute",
    left: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  pharmacyInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  // Removed icon container
  pharmacyDetails: {
    flex: 1,
    alignItems: "center",
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  // Removed created date meta
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    ...shadows.medium,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewChip: {
    backgroundColor: colors.brandStart,
  },
  deleteChip: {
    backgroundColor: colors.red,
  },
  chipText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
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
    shadowColor: "#8b5cf6",
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
  modalContent: {
    width: width - 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#4b5563",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
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
});

export default PharmaciesScreen;
