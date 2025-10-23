import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";

// Data validation function
export const validateItem = (item) => {
  // Allow empty names for new items (they will be filled later)
  if (item.name && item.name.trim() === "") {
    // Only validate if the item has some data (not a completely new item)
    const hasData =
      item.opening > 0 ||
      Object.keys(item.dailyDispense || {}).some(
        (key) => item.dailyDispense[key] > 0
      ) ||
      Object.keys(item.dailyIncoming || {}).some(
        (key) => item.dailyIncoming[key] > 0
      );

    if (hasData) {
      throw new Error("اسم الصنف مطلوب");
    }
    // If no data, allow empty name for new items
    return true;
  }

  // Allow zero or positive opening stock (zero is valid)
  if (item.opening < 0) {
    throw new Error("الرصيد الافتتاحي لا يمكن أن يكون سالب");
  }
  if (item.unitPrice < 0) {
    throw new Error("سعر الوحدة لا يمكن أن يكون سالب");
  }

  // Allow items with zero stock to persist - they should not be filtered out
  return true;
};

// Create default pharmacy and migrate existing data
export async function createDefaultPharmacyAndMigrate(ownerId = null) {
  try {
    // Get current user if ownerId not provided
    if (!ownerId) {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      ownerId = currentUser.uid;
    }

    // Check if default pharmacy already exists for this owner
    const q = query(
      collection(db, "pharmacies"),
      where("ownerId", "==", ownerId)
    );
    const pharmaciesSnap = await getDocs(q);
    const existingDefault = pharmaciesSnap.docs.find(
      (doc) => doc.data().name === "Test Pharmacy"
    );

    let defaultPharmacyId;
    if (existingDefault) {
      defaultPharmacyId = existingDefault.id;
    } else {
      // Create default pharmacy for this owner
      const defaultPharmacyRef = await addDoc(collection(db, "pharmacies"), {
        name: "Test Pharmacy",
        ownerId, // Add owner ID for multi-tenancy
        isDefault: true,
        createdAt: new Date().toISOString(),
      });
      defaultPharmacyId = defaultPharmacyRef.id;
    }

    // Migrate existing global monthlyStock data to default pharmacy (only for this owner)
    const globalMonthlyStockSnap = await getDocs(
      collection(db, "monthlyStock")
    );

    if (globalMonthlyStockSnap.size > 0) {
      const batch = writeBatch(db);

      globalMonthlyStockSnap.forEach((docSnap) => {
        const monthKey = docSnap.id;
        const data = docSnap.data();

        // Move to pharmacy-specific location
        const pharmacyMonthlyStockRef = doc(
          db,
          "pharmacies",
          defaultPharmacyId,
          "monthlyStock",
          monthKey
        );
        batch.set(pharmacyMonthlyStockRef, data);

        // Delete from global location
        batch.delete(docSnap.ref);
      });

      await batch.commit();
    }

    return defaultPharmacyId;
  } catch (error) {
    console.error("Error creating default pharmacy and migrating data:", error);
    throw error;
  }
}

// Retry mechanism for failed saves
export const saveWithRetry = async (
  pharmacyId,
  monthKey,
  items,
  retries = 3
) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Validate all items before saving
      items.forEach(validateItem);
      await saveMonthlyStock(pharmacyId, monthKey, items);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Save or update a month's stock for specific pharmacy (overwrites if exists)
export async function saveMonthlyStock(pharmacyId, monthKey, items) {
  try {
    await setDoc(doc(db, "pharmacies", pharmacyId, "monthlyStock", monthKey), {
      items,
    });
  } catch (error) {
    console.error("Error saving monthly stock:", error);
    throw error;
  }
}

// Get all months' stock for specific pharmacy
export async function loadPharmacyMonthlyStock(pharmacyId) {
  try {
    const snapshot = await getDocs(
      collection(db, "pharmacies", pharmacyId, "monthlyStock")
    );
    const byMonth = {};
    snapshot.forEach((docSnap) => {
      byMonth[docSnap.id] = docSnap.data().items || [];
    });
    return byMonth;
  } catch (error) {
    console.error("Error loading pharmacy monthly stock:", error);
    throw error;
  }
}

// Real-time listener for pharmacy's monthly stock
export function subscribeToPharmacyMonthlyStock(pharmacyId, callback) {
  const colRef = collection(db, "pharmacies", pharmacyId, "monthlyStock");
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const byMonth = {};
    snapshot.forEach((docSnap) => {
      byMonth[docSnap.id] = docSnap.data().items || [];
    });
    callback(byMonth);
  });
  return unsubscribe;
}

// Legacy function for backward compatibility (redirects to default pharmacy)
export async function loadAllMonthlyStock() {
  try {
    // Get default pharmacy
    const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
    const defaultPharmacy = pharmaciesSnap.docs.find(
      (doc) => doc.data().name === "Test Pharmacy"
    );

    if (defaultPharmacy) {
      return await loadPharmacyMonthlyStock(defaultPharmacy.id);
    }

    return {};
  } catch (error) {
    console.error("Error loading all monthly stock:", error);
    throw error;
  }
}

// Legacy function for backward compatibility (redirects to default pharmacy)
export function subscribeToMonthlyStock(callback) {
  return subscribeToPharmacyMonthlyStock("default", callback);
}

// Add a custom page
export async function addCustomPage(data, ownerId = null) {
  // Get current user if ownerId not provided
  if (!ownerId) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // Check if user is logged in via localStorage (regular/senior pharmacist)
      const pharmaUser = localStorage.getItem("pharmaUser");
      if (pharmaUser) {
        try {
          const parsedUser = JSON.parse(pharmaUser);
          if (parsedUser && parsedUser.username && parsedUser.role) {
            // For regular/senior pharmacists, try to get their assigned pharmacy's owner
            if (parsedUser.assignedPharmacy) {
              try {
                const pharmacyDocRef = doc(
                  db,
                  "pharmacies",
                  parsedUser.assignedPharmacy
                );
                const pharmacySnap = await getDoc(pharmacyDocRef);
                if (pharmacySnap.exists()) {
                  ownerId = pharmacySnap.data().ownerId;
                } else {
                  // If pharmacy doesn't exist, use a fallback approach
                  console.warn("Pharmacy not found, using fallback owner ID");
                  ownerId = `pharmacy_${parsedUser.assignedPharmacy}`;
                }
              } catch (error) {
                console.warn(
                  "Error getting pharmacy owner ID, using fallback:",
                  error
                );
                ownerId = `pharmacy_${parsedUser.assignedPharmacy}`;
              }
            } else {
              // If no assigned pharmacy, use username as owner ID
              ownerId = `user_${parsedUser.username}`;
            }
          } else {
            throw new Error("User not authenticated");
          }
        } catch (error) {
          console.error(
            "Error getting pharmacy owner ID for addCustomPage:",
            error
          );
          throw new Error("Unable to determine pharmacy owner");
        }
      } else {
        throw new Error("User not authenticated");
      }
    } else {
      ownerId = currentUser.uid;
    }
  }

  return await addDoc(collection(db, "customPages"), {
    ...data,
    ownerId, // Add owner ID for multi-tenancy
    pharmacyId: data.pharmacyId || null, // Add pharmacy ID for pharmacy-specific pages
  });
}

// Get all custom pages
export async function getCustomPages(ownerId = null) {
  // Get current user if ownerId not provided
  if (!ownerId) {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // Check if user is logged in via localStorage (regular/senior pharmacist)
      const pharmaUser = localStorage.getItem("pharmaUser");
      if (pharmaUser) {
        try {
          const parsedUser = JSON.parse(pharmaUser);
          if (parsedUser && parsedUser.username && parsedUser.role) {
            // For regular/senior pharmacists, try to get their assigned pharmacy's owner
            if (parsedUser.assignedPharmacy) {
              try {
                const pharmacyDocRef = doc(
                  db,
                  "pharmacies",
                  parsedUser.assignedPharmacy
                );
                const pharmacySnap = await getDoc(pharmacyDocRef);
                if (pharmacySnap.exists()) {
                  ownerId = pharmacySnap.data().ownerId;
                } else {
                  // If pharmacy doesn't exist, use fallback approach
                  ownerId = `pharmacy_${parsedUser.assignedPharmacy}`;
                }
              } catch (error) {
                console.warn(
                  "Error getting pharmacy owner ID, using fallback:",
                  error
                );
                ownerId = `pharmacy_${parsedUser.assignedPharmacy}`;
              }
            } else {
              // If no assigned pharmacy, use username as owner ID
              ownerId = `user_${parsedUser.username}`;
            }
          } else {
            throw new Error("User not authenticated");
          }
        } catch (error) {
          console.error("Error getting pharmacy owner ID:", error);
          // For now, return empty array instead of throwing error
          return [];
        }
      } else {
        // For unauthenticated users, return empty array
        return [];
      }
    } else {
      ownerId = currentUser.uid;
    }
  }

  // If we have an ownerId, filter by it
  if (ownerId) {
    const q = query(
      collection(db, "customPages"),
      where("ownerId", "==", ownerId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } else {
    // If no ownerId, return empty array
    return [];
  }
}

// Delete a custom page by ID
export async function deleteCustomPage(id) {
  return await deleteDoc(doc(db, "customPages", id));
}

// Update a custom page by ID
export async function updateCustomPage(id, newData) {
  return await updateDoc(doc(db, "customPages", id), newData);
}

export async function listPharmacies(ownerId = null) {
  // Get current user if ownerId not provided
  if (!ownerId) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    ownerId = currentUser.uid;
  }

  const q = query(
    collection(db, "pharmacies"),
    where("ownerId", "==", ownerId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createPharmacy(name, ownerId = null) {
  // Get current user if ownerId not provided
  if (!ownerId) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    ownerId = currentUser.uid;
  }

  const docRef = await addDoc(collection(db, "pharmacies"), {
    name,
    ownerId, // Add owner ID for multi-tenancy
    createdAt: new Date().toISOString(),
    isDefault: false,
    // Pharmacy configuration settings
    settings: {
      enableDispenseCategories: false, // Enable patient vs scissors dispense separation
      enableCostCalculationToggle: false, // Enable cost calculation toggle for dispensed items
      dispenseCategories: {
        patient: "منصرف للمريض",
        scissors: "منصرف للمقص",
      },
    },
  });
  return { id: docRef.id, name, ownerId };
}

export async function getPharmacyNameById(id) {
  const docSnap = await getDoc(doc(db, "pharmacies", id));
  if (docSnap.exists()) {
    return docSnap.data().name || id;
  }
  return id;
}

// Update pharmacy settings
export async function updatePharmacySettings(pharmacyId, settings) {
  try {
    await updateDoc(doc(db, "pharmacies", pharmacyId), {
      settings: settings,
    });
    return true;
  } catch (error) {
    console.error("Error updating pharmacy settings:", error);
    throw error;
  }
}

// Get pharmacy settings
export async function getPharmacySettings(pharmacyId) {
  try {
    const docSnap = await getDoc(doc(db, "pharmacies", pharmacyId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (
        data.settings || {
          enableDispenseCategories: false,
          enableCostCalculationToggle: false,
          dispenseCategories: {
            patient: "منصرف للمريض",
            scissors: "منصرف للمقص",
          },
        }
      );
    }
    return null;
  } catch (error) {
    console.error("Error getting pharmacy settings:", error);
    throw error;
  }
}

// Delete a pharmacy and all related data
export async function deletePharmacy(pharmacyId) {
  const batch = writeBatch(db);

  try {
    // 1. Delete the pharmacy document
    batch.delete(doc(db, "pharmacies", pharmacyId));

    // 2. Update all users assigned to this pharmacy (remove assignment)
    const usersQuery = query(
      collection(db, "users"),
      where("assignedPharmacy", "==", pharmacyId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.forEach((userDoc) => {
      batch.update(doc(db, "users", userDoc.id), { assignedPharmacy: null });
    });

    // 3. Delete all subcollections (monthlyStock, attendance)
    const monthlyStockSnap = await getDocs(
      collection(db, "pharmacies", pharmacyId, "monthlyStock")
    );
    monthlyStockSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    const attendanceSnap = await getDocs(
      collection(db, "pharmacies", pharmacyId, "attendance")
    );
    attendanceSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting pharmacy:", error);
    throw error;
  }
}
