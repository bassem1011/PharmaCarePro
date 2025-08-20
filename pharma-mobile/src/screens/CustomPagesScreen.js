import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { useInventoryData } from "../hooks/useInventoryData";
import {
  addCustomPage,
  getCustomPages,
  deleteCustomPage,
  updateCustomPage,
} from "../services/firestoreService";
import { colors, spacing, radii, shadows } from "../utils/theme";
import AnimatedButton from "../components/common/AnimatedButton";
import SkeletonLoader from "../components/common/SkeletonLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase";

const { width } = Dimensions.get("window");

const CustomPagesScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, userRole, assignedPharmacy } = useAuth();
  const inventory = useInventoryData(assignedPharmacy?.id);

  // State Management
  const [customPages, setCustomPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  // Form States
  const [newPageName, setNewPageName] = useState("");
  const [editPageName, setEditPageName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedPages, setExpandedPages] = useState(new Set());
  const [editingItems, setEditingItems] = useState(new Map()); // Track editing state for items
  const [pendingChanges, setPendingChanges] = useState(new Map()); // Track pending changes

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Memoized calculations for statistics
  const statistics = useMemo(() => {
    if (!customPages || !Array.isArray(customPages)) {
      return {
        totalPages: 0,
        totalItems: 0,
        activePages: 0,
        availableItems: inventory.items?.length || 0,
      };
    }

    const totalPages = customPages.length;
    const totalItems = customPages.reduce(
      (sum, page) => sum + (page.items?.length || 0),
      0
    );
    const activePages = customPages.filter(
      (page) => page.items && page.items.length > 0
    ).length;

    return {
      totalPages,
      totalItems,
      activePages,
      availableItems: inventory.items?.length || 0,
    };
  }, [customPages, inventory.items]);

  // Initialize animations
  useEffect(() => {
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
  }, []);

  // Load custom pages with real-time sync
  const loadCustomPages = async () => {
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
              // For senior pharmacists, they can only see custom pages for their assigned pharmacy
              if (parsedUser.role === "senior" && parsedUser.assignedPharmacy) {
                // Get the pharmacy owner ID
                const pharmacyDoc = await getDoc(
                  doc(db, "pharmacies", parsedUser.assignedPharmacy)
                );
                if (pharmacyDoc.exists()) {
                  const ownerId = pharmacyDoc.data().ownerId;

                  // Subscribe to custom pages owned by the pharmacy owner
                  const customPagesQuery = query(
                    collection(db, "customPages"),
                    where("ownerId", "==", ownerId)
                  );
                  const unsub = onSnapshot(
                    customPagesQuery,
                    (pagesSnap) => {
                      const pagesData = pagesSnap.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                      }));
                      setCustomPages(pagesData);
                      setError("");
                      setLoading(false);
                    },
                    (error) => {
                      console.error("Error fetching custom pages:", error);
                      setError("فشل في تحميل الصفحات المخصصة");
                      setLoading(false);
                    }
                  );

                  return unsub;
                }
              }
            }
          } catch (error) {
            console.error("Error parsing pharmaUser:", error);
          }
        }
        setCustomPages([]);
        setError("فشل في تحميل الصفحات المخصصة");
        setLoading(false);
        return;
      }

      // For lead pharmacists (Firebase Auth users)
      // Subscribe to custom pages owned by current user
      const customPagesQuery = query(
        collection(db, "customPages"),
        where("ownerId", "==", currentUser.uid)
      );
      const unsub = onSnapshot(
        customPagesQuery,
        (pagesSnap) => {
          const pagesData = pagesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCustomPages(pagesData);
          setError("");
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching custom pages:", error);
          setError("فشل في تحميل الصفحات المخصصة");
          setLoading(false);
        }
      );

      return unsub;
    } catch (error) {
      console.error("Error setting up real-time listeners:", error);
      setError("فشل في تحميل الصفحات المخصصة");
      setLoading(false);
    }
  };

  useEffect(() => {
    let cleanup = null;

    const setupListeners = async () => {
      cleanup = await loadCustomPages();
    };

    setupListeners();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomPages();
    setRefreshing(false);
  };

  // Create new custom page
  const createCustomPage = async () => {
    if (!newPageName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الصفحة");
      return;
    }

    if (customPages.some((p) => p.name === newPageName.trim())) {
      Alert.alert("خطأ", "اسم الصفحة موجود بالفعل!");
      return;
    }

    try {
      setIsCreating(true);
      await addCustomPage({
        name: newPageName.trim(),
        items: [],
        createdAt: new Date().toISOString(),
        monthKey: `${inventory.year}-${String(inventory.month + 1).padStart(
          2,
          "0"
        )}`,
        month: inventory.month,
        year: inventory.year,
      });

      await loadCustomPages();
      setNewPageName("");
      setShowCreateModal(false);
      Alert.alert("نجح", "تم إنشاء الصفحة بنجاح!");
    } catch (err) {
      console.error("Error creating page:", err);
      Alert.alert("خطأ", "فشل في إنشاء الصفحة");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete custom page
  const deleteCustomPageHandler = (page) => {
    Alert.alert("تأكيد الحذف", `هل أنت متأكد من حذف الصفحة "${page.name}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCustomPage(page.id);
            await loadCustomPages();
            Alert.alert("نجح", "تم حذف الصفحة بنجاح!");
          } catch (err) {
            console.error("Error deleting page:", err);
            Alert.alert("خطأ", "فشل في حذف الصفحة");
          }
        },
      },
    ]);
  };

  // Edit page name
  const editPageNameHandler = async () => {
    if (!editPageName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الصفحة");
      return;
    }

    try {
      await updateCustomPage(selectedPage.id, { name: editPageName.trim() });
      await loadCustomPages();
      setShowEditModal(false);
      setSelectedPage(null);
      setEditPageName("");
      Alert.alert("نجح", "تم تحديث اسم الصفحة!");
    } catch (err) {
      console.error("Error updating page name:", err);
      Alert.alert("خطأ", "فشل في تحديث اسم الصفحة");
    }
  };

  // Sync page with inventory
  const syncPageWithInventory = async (page) => {
    try {
      const updatedItems = page.items.map((pageItem) => {
        const mainItem = inventory.items.find(
          (item) => item.name === pageItem.name
        );
        if (mainItem) {
          return {
            ...pageItem,
            dailyDispense: mainItem.dailyDispense || {},
            dailyIncoming: mainItem.dailyIncoming || {},
            opening: mainItem.opening || 0,
            unitPrice: mainItem.unitPrice || 0,
          };
        }
        return pageItem;
      });

      await updateCustomPage(page.id, {
        items: updatedItems,
        lastSynced: new Date().toISOString(),
      });

      await loadCustomPages();
      Alert.alert("نجح", "تم مزامنة الصفحة مع المخزون الرئيسي!");
    } catch (err) {
      console.error("Error syncing page:", err);
      Alert.alert("خطأ", "فشل في مزامنة الصفحة");
    }
  };

  // Toggle page expansion
  const togglePageExpansion = (pageId) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  // Filter inventory items for add items modal
  const filteredInventoryItems =
    inventory.items?.filter((item) => {
      const matchesSearch = item.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterType === "all" ||
        (filterType === "dispensed" &&
          Object.keys(item.dailyDispense || {}).length > 0) ||
        (filterType === "incoming" &&
          Object.keys(item.dailyIncoming || {}).length > 0) ||
        (filterType === "stock" &&
          (item.opening > 0 ||
            Object.keys(item.dailyIncoming || {}).length > 0));

      return matchesSearch && matchesFilter;
    }) || [];

  // Calculate remaining stock for an item
  const calculateRemainingStock = (item) => {
    if (!item) return 0;

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

    return opening + totalIncoming - totalDispensed;
  };

  // Add items to page
  const addItemsToPage = async (itemsToAdd) => {
    if (!selectedPage || !itemsToAdd || itemsToAdd.length === 0) {
      Alert.alert("خطأ", "لم يتم اختيار أي صنف");
      return;
    }

    try {
      const existingItems = selectedPage.items || [];
      const existingNames = new Set(existingItems.map((item) => item.name));

      const newItems = [
        ...existingItems,
        ...itemsToAdd.filter((item) => !existingNames.has(item.name)),
      ];

      await updateCustomPage(selectedPage.id, {
        items: newItems,
        lastUpdated: new Date().toISOString(),
      });

      await loadCustomPages();
      setShowAddItemsModal(false);
      setSelectedPage(null);
      Alert.alert("نجح", `تم إضافة ${itemsToAdd.length} صنف إلى الصفحة بنجاح!`);
    } catch (err) {
      console.error("Error adding items to page:", err);
      Alert.alert("خطأ", "فشل في إضافة الأصناف");
    }
  };

  // Start editing an item
  const startEditingItem = (pageId, itemIndex) => {
    const key = `${pageId}-${itemIndex}`;
    setEditingItems((prev) => new Map(prev.set(key, true)));
  };

  // Stop editing an item
  const stopEditingItem = (pageId, itemIndex) => {
    const key = `${pageId}-${itemIndex}`;
    setEditingItems((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  };

  // Update pending changes locally (no Firebase update yet)
  const updatePendingChange = (pageId, itemIndex, field, value) => {
    const key = `${pageId}-${itemIndex}`;
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existingChanges = newMap.get(key) || {};
      newMap.set(key, { ...existingChanges, [field]: value });
      return newMap;
    });
  };

  // Confirm changes and update in both custom page and main inventory
  const confirmItemChanges = async (page, itemIndex) => {
    try {
      const key = `${page.id}-${itemIndex}`;
      const changes = pendingChanges.get(key);

      if (!changes || Object.keys(changes).length === 0) {
        stopEditingItem(page.id, itemIndex);
        return;
      }

      const pageItem = page.items[itemIndex];

      // Update in custom page
      const updatedPageItems = page.items.map((item, idx) =>
        idx === itemIndex ? { ...item, ...changes } : item
      );

      await updateCustomPage(page.id, {
        items: updatedPageItems,
        lastUpdated: new Date().toISOString(),
      });

      // Update in main inventory
      const mainItemIndex = inventory.items.findIndex(
        (item) => item.name === pageItem.name
      );
      if (mainItemIndex !== -1) {
        for (const [field, value] of Object.entries(changes)) {
          await inventory.updateItem(mainItemIndex, { [field]: value });
        }
      }

      await loadCustomPages();
      stopEditingItem(page.id, itemIndex);
      Alert.alert("نجح", "تم تحديث الصنف في الصفحة والمخزون الرئيسي!");
    } catch (err) {
      console.error("Error updating item:", err);
      Alert.alert("خطأ", "فشل في تحديث الصنف");
    }
  };

  // Remove item from custom page
  const removeItemFromPage = async (page, itemIndex) => {
    Alert.alert("تأكيد الحذف", "هل أنت متأكد من حذف هذا الصنف من الصفحة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedItems = page.items.filter(
              (_, idx) => idx !== itemIndex
            );

            await updateCustomPage(page.id, {
              items: updatedItems,
              lastUpdated: new Date().toISOString(),
            });

            await loadCustomPages();
            Alert.alert("نجح", "تم حذف الصنف من الصفحة!");
          } catch (err) {
            console.error("Error removing item:", err);
            Alert.alert("خطأ", "فشل في حذف الصنف");
          }
        },
      },
    ]);
  };

  // Render statistics cards
  const renderStatistics = () => (
    <View style={styles.statisticsContainer}>
      <LinearGradient
        colors={["#3b82f6", "#1d4ed8"]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name="file-multiple" size={24} color="#fff" />
        <Text style={styles.statNumber}>{statistics.totalPages}</Text>
        <Text style={styles.statLabel}>إجمالي الصفحات</Text>
      </LinearGradient>

      <LinearGradient
        colors={["#10b981", "#059669"]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name="package-variant" size={24} color="#fff" />
        <Text style={styles.statNumber}>{statistics.availableItems}</Text>
        <Text style={styles.statLabel}>الأصناف المتاحة</Text>
      </LinearGradient>

      <LinearGradient
        colors={["#8b5cf6", "#7c3aed"]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
        <Text style={styles.statNumber}>{statistics.totalItems}</Text>
        <Text style={styles.statLabel}>إجمالي الأصناف في الصفحات</Text>
      </LinearGradient>

      <LinearGradient
        colors={["#f59e0b", "#d97706"]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name="send" size={24} color="#fff" />
        <Text style={styles.statNumber}>{statistics.activePages}</Text>
        <Text style={styles.statLabel}>الصفحات النشطة</Text>
      </LinearGradient>
    </View>
  );

  // Render custom page item
  const renderCustomPageItem = (page, index) => {
    const isExpanded = expandedPages.has(page.id);

    return (
      <Animated.View
        key={page.id}
        style={[
          styles.pageCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Page Header */}
        <LinearGradient
          colors={[colors.surface, colors.surfaceElevated]}
          style={styles.pageHeader}
        >
          <View style={styles.pageHeaderContent}>
            <View style={styles.pageHeaderLeft}>
              <MaterialCommunityIcons
                name="file-document"
                size={20}
                color={colors.brandStart}
              />
              <Text style={styles.pageName}>{page.name}</Text>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>
                  {page.items?.length || 0} صنف
                </Text>
              </View>
              {page.lastSynced && (
                <View style={styles.syncedBadge}>
                  <Text style={styles.syncedText}>محدث</Text>
                </View>
              )}
            </View>

            <View style={styles.pageHeaderRight}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedPage(page);
                  setEditPageName(page.name);
                  setShowEditModal(true);
                }}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={16}
                  color={colors.brandStart}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteCustomPageHandler(page)}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={16}
                  color={colors.red}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {page.items && page.items.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.brandStart },
                ]}
                onPress={() => togglePageExpansion(page.id)}
              >
                <MaterialCommunityIcons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>
                  {isExpanded
                    ? "إخفاء الأصناف"
                    : `عرض الأصناف (${page.items.length})`}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.green }]}
              onPress={() => {
                setSelectedPage(page);
                setShowAddItemsModal(true);
              }}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>إضافة أصناف</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.blue }]}
              onPress={() => syncPageWithInventory(page)}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>مزامنة</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Page Items - Expandable */}
        {isExpanded && page.items && page.items.length > 0 && (
          <View style={styles.pageItemsContainer}>
            {page.items.map((item, itemIdx) =>
              renderPageItem(page, item, itemIdx)
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  // Render individual page item
  const renderPageItem = (page, item, itemIdx) => {
    const remainingStock = calculateRemainingStock(item);
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

    return (
      <View key={itemIdx} style={styles.pageItemCard}>
        <View style={styles.pageItemHeader}>
          <Text style={styles.pageItemName}>{item.name}</Text>
          <Text style={styles.pageItemNumber}>#{itemIdx + 1}</Text>
        </View>

        {/* Item Statistics */}
        <View style={styles.pageItemStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>الافتتاحي:</Text>
            <Text style={styles.statValue}>
              {Math.floor(item.opening || 0)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>إجمالي الوارد:</Text>
            <Text style={styles.statValue}>{totalIncoming}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>إجمالي المنصرف:</Text>
            <Text style={styles.statValue}>{totalDispensed}</Text>
          </View>
          <View style={[styles.statRow, styles.totalRow]}>
            <Text style={[styles.statLabel, styles.totalLabel]}>
              الرصيد المتبقي:
            </Text>
            <Text style={[styles.statValue, styles.totalValue]}>
              {remainingStock}
            </Text>
          </View>
        </View>

        {/* Daily Dispense Grid */}
        <View style={styles.dailyDispenseContainer}>
          <View style={styles.dailyDispenseHeader}>
            <Text style={styles.dailyDispenseTitle}>المنصرف اليومي:</Text>
            {!editingItems.get(`${page.id}-${itemIdx}`) ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEditingItem(page.id, itemIdx)}
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                <Text style={styles.editButtonText}>تعديل</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => confirmItemChanges(page, itemIdx)}
                >
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  <Text style={styles.confirmButtonText}>تأكيد</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => stopEditingItem(page.id, itemIdx)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.dailyDispenseGrid}>
            {Array.from({ length: 31 }, (_, day) => {
              const dayNumber = day + 1;
              const key = `${page.id}-${itemIdx}`;
              const pendingItem = pendingChanges.get(key);
              const currentDispense =
                pendingItem?.dailyDispense || item.dailyDispense || {};
              const dispenseValue = currentDispense[dayNumber] || 0;
              const isEditing = editingItems.get(key);

              return (
                <View key={dayNumber} style={styles.dayContainer}>
                  <Text style={styles.dayLabel}>يوم {dayNumber}</Text>
                  <TextInput
                    style={[
                      styles.dayInput,
                      isEditing && styles.dayInputEditing,
                      !isEditing && styles.dayInputReadonly,
                    ]}
                    value={dispenseValue.toString()}
                    onChangeText={(text) => {
                      if (isEditing) {
                        const newValue =
                          text === "" ? 0 : Math.floor(Number(text));
                        updatePendingChange(page.id, itemIdx, "dailyDispense", {
                          ...currentDispense,
                          [dayNumber]: newValue >= 0 ? newValue : 0,
                        });
                      }
                    }}
                    editable={isEditing}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Remove Item Button */}
        <TouchableOpacity
          style={styles.removeItemButton}
          onPress={() => removeItemFromPage(page, itemIdx)}
        >
          <MaterialCommunityIcons name="delete" size={16} color="#fff" />
          <Text style={styles.removeItemText}>حذف الصنف من الصفحة</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SkeletonLoader count={5} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandStart, colors.brandEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="file-multiple" size={32} color="#fff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>إدارة الصفحات المخصصة</Text>
            <Text style={styles.headerSubtitle}>
              إنشاء وإدارة صفحات مخصصة للأصناف مع عرض تفصيلي للبيانات وتعديل
              المنصرف اليومي
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        {renderStatistics()}

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons
              name="information"
              size={24}
              color={colors.blue}
            />
            <Text style={styles.infoTitle}>كيفية استخدام الصفحات المخصصة</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              • إنشاء صفحة: قم بإنشاء صفحة مخصصة لتجميع الأصناف المفضلة
            </Text>
            <Text style={styles.infoText}>
              • إضافة أصناف: اختر الأصناف من المخزون الرئيسي وأضفها للصفحة
            </Text>
            <Text style={styles.infoText}>
              • تعديل المنصرف: يمكنك تعديل قيم المنصرف اليومي لجميع أيام الشهر
            </Text>
            <Text style={styles.infoText}>
              • حذف الأصناف: يمكنك حذف الأصناف من الصفحة المخصصة
            </Text>
            <Text style={styles.infoText}>
              • المزامنة: استخدم زر "مزامنة" لتحديث البيانات من المخزون الرئيسي
            </Text>
          </View>
        </View>

        {/* Create New Page Button */}
        <AnimatedButton
          title="إنشاء صفحة جديدة"
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
          icon="plus"
        />

        {/* Custom Pages List */}
        {customPages.length > 0 ? (
          <View style={styles.pagesContainer}>
            <Text style={styles.pagesTitle}>الصفحات المخصصة</Text>
            {customPages.map((page, index) =>
              renderCustomPageItem(page, index)
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="folder-outline"
              size={64}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>لا توجد صفحات مخصصة</Text>
            <Text style={styles.emptyText}>
              قم بإنشاء صفحة مخصصة لتجميع الأصناف المفضلة مع عرض تفصيلي للبيانات
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Page Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>إنشاء صفحة جديدة</Text>

            <TextInput
              style={styles.modalInput}
              value={newPageName}
              onChangeText={setNewPageName}
              placeholder="اسم الصفحة الجديدة"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewPageName("");
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={createCustomPage}
                disabled={isCreating || !newPageName.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>إنشاء</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Page Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>تعديل اسم الصفحة</Text>

            <TextInput
              style={styles.modalInput}
              value={editPageName}
              onChangeText={setEditPageName}
              placeholder="اسم الصفحة"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedPage(null);
                  setEditPageName("");
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={editPageNameHandler}
              >
                <Text style={styles.confirmButtonText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Items Modal */}
      <Modal visible={showAddItemsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.addItemsModal]}>
            <View style={styles.addItemsHeader}>
              <Text style={styles.modalTitle}>
                إضافة أصناف إلى: {selectedPage?.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddItemsModal(false);
                  setSelectedPage(null);
                  setSearchTerm("");
                  setFilterType("all");
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="البحث في الأصناف..."
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.filterContainer}>
                {["all", "dispensed", "incoming", "stock"].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      filterType === filter && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterType(filter)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filterType === filter && styles.filterButtonTextActive,
                      ]}
                    >
                      {filter === "all" && "الكل"}
                      {filter === "dispensed" && "المنصرف"}
                      {filter === "incoming" && "الوارد"}
                      {filter === "stock" && "المخزون"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Items List */}
            <ScrollView style={styles.itemsList}>
              {filteredInventoryItems.map((item, index) => {
                const isInPage = selectedPage?.items?.some(
                  (pageItem) => pageItem.name === item.name
                );
                const remainingStock = calculateRemainingStock(item);

                return (
                  <View
                    key={index}
                    style={[
                      styles.inventoryItem,
                      isInPage && styles.inventoryItemInPage,
                    ]}
                  >
                    <View style={styles.inventoryItemHeader}>
                      <Text style={styles.inventoryItemName}>{item.name}</Text>
                      {isInPage && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={colors.green}
                        />
                      )}
                    </View>

                    <View style={styles.inventoryItemStats}>
                      <Text style={styles.inventoryItemStat}>
                        الافتتاحي: {Math.floor(item.opening || 0)}
                      </Text>
                      <Text style={styles.inventoryItemStat}>
                        الرصيد المتبقي: {remainingStock}
                      </Text>
                    </View>

                    {!isInPage && (
                      <TouchableOpacity
                        style={styles.addItemButton}
                        onPress={() => addItemsToPage([item])}
                      >
                        <Text style={styles.addItemButtonText}>
                          إضافة للصفحة
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setShowAddItemsModal(false);
                setSelectedPage(null);
                setSearchTerm("");
                setFilterType("all");
              }}
            >
              <Text style={styles.closeModalButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "right",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e5e7eb",
    marginTop: spacing.xs,
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statisticsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: (width - spacing.lg * 3) / 2,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    ...shadows.medium,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: "#e5e7eb",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  infoContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.blue + "40",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  infoContent: {
    gap: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "right",
  },
  createButton: {
    marginBottom: spacing.xl,
  },
  pagesContainer: {
    gap: spacing.lg,
  },
  pagesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "right",
    marginBottom: spacing.md,
  },
  pageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  pageHeader: {
    padding: spacing.lg,
  },
  pageHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  pageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  itemCountBadge: {
    backgroundColor: colors.brandStart + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.brandStart,
  },
  syncedBadge: {
    backgroundColor: colors.green + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  syncedText: {
    fontSize: 12,
    color: colors.green,
  },
  pageHeaderRight: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  pageItemsContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  pageItemCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  pageItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pageItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  pageItemNumber: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pageItemStats: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.textMuted + "40",
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  totalValue: {
    fontWeight: "bold",
    color: colors.blue,
  },
  dailyDispenseContainer: {
    marginBottom: spacing.md,
  },
  dailyDispenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  dailyDispenseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "right",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandStart,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.red,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  dailyDispenseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  dayContainer: {
    alignItems: "center",
    width: (width - spacing.lg * 4) / 5,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  dayInput: {
    width: "100%",
    height: 32,
    borderWidth: 1,
    borderColor: colors.textMuted + "40",
    borderRadius: radii.sm,
    textAlign: "center",
    fontSize: 12,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  dayInputEditing: {
    backgroundColor: colors.brandStart + "20",
    borderColor: colors.brandStart,
    borderWidth: 2,
  },
  dayInputReadonly: {
    backgroundColor: colors.textMuted + "10",
    color: colors.textSecondary,
  },
  removeItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.red,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  removeItemText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl * 2,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  addItemsModal: {
    maxWidth: "90%",
    maxHeight: "80%",
  },
  addItemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.textMuted + "40",
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "right",
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.textMuted + "20",
  },
  confirmButton: {
    backgroundColor: colors.brandStart,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    marginBottom: spacing.lg,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.textMuted + "40",
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "right",
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.textMuted + "20",
  },
  filterButtonActive: {
    backgroundColor: colors.brandStart,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemsList: {
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  inventoryItem: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.textMuted + "20",
  },
  inventoryItemInPage: {
    backgroundColor: colors.green + "10",
    borderColor: colors.green + "40",
  },
  inventoryItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  inventoryItemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  inventoryItemStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  inventoryItemStat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addItemButton: {
    backgroundColor: colors.brandStart,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: "center",
  },
  addItemButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  closeModalButton: {
    backgroundColor: colors.textMuted + "20",
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
});

export default CustomPagesScreen;
