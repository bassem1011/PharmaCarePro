import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";

// Data validation function (same as web version)
export const validateItem = (item) => {
  if (item.name && item.name.trim() === "") {
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
    return true;
  }

  if (item.opening < 0) {
    throw new Error("الرصيد الافتتاحي لا يمكن أن يكون سالب");
  }
  if (item.unitPrice < 0) {
    throw new Error("سعر الوحدة لا يمكن أن يكون سالب");
  }
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
    console.error("Error creating default pharmacy:", error);
    throw error;
  }
}

// Save with retry mechanism
export const saveWithRetry = async (
  pharmacyId,
  monthKey,
  items,
  retries = 3
) => {
  for (let i = 0; i < retries; i++) {
    try {
      await saveMonthlyStock(pharmacyId, monthKey, items);
      return;
    } catch (error) {
      console.error(`Save attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Save monthly stock data
export async function saveMonthlyStock(pharmacyId, monthKey, items) {
  try {
    await setDoc(doc(db, "pharmacies", pharmacyId, "monthlyStock", monthKey), {
      items,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving monthly stock:", error);
    throw error;
  }
}

// Load pharmacy-specific monthly stock
export async function loadPharmacyMonthlyStock(pharmacyId) {
  try {
    const monthlyStockSnap = await getDocs(
      collection(db, "pharmacies", pharmacyId, "monthlyStock")
    );
    const byMonth = {};
    monthlyStockSnap.forEach((doc) => {
      byMonth[doc.id] = doc.data().items || [];
    });
    return byMonth;
  } catch (error) {
    console.error("Error loading pharmacy monthly stock:", error);
    return {};
  }
}

// Subscribe to pharmacy-specific monthly stock changes
export function subscribeToPharmacyMonthlyStock(pharmacyId, callback) {
  const colRef = collection(db, "pharmacies", pharmacyId, "monthlyStock");
  return onSnapshot(colRef, (snapshot) => {
    const byMonth = {};
    snapshot.forEach((doc) => {
      byMonth[doc.id] = doc.data().items || [];
    });
    callback(byMonth);
  });
}

// Load all monthly stock (for backward compatibility)
export async function loadAllMonthlyStock() {
  try {
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
            // For regular/senior pharmacists, they can only see their assigned pharmacy
            if (parsedUser.assignedPharmacy) {
              return await loadPharmacyMonthlyStock(
                parsedUser.assignedPharmacy
              );
            }
            return {}; // No pharmacy assigned
          }
        } catch (error) {
          console.error("Error parsing pharmaUser:", error);
          return {};
        }
      } else {
        return {}; // No user logged in
      }
    }

    // For lead pharmacists, get their default pharmacy
    const q = query(
      collection(db, "pharmacies"),
      where("ownerId", "==", currentUser.uid)
    );
    const pharmaciesSnap = await getDocs(q);
    const defaultPharmacy = pharmaciesSnap.docs.find(
      (doc) => doc.data().isDefault
    );

    if (defaultPharmacy) {
      return await loadPharmacyMonthlyStock(defaultPharmacy.id);
    }
    return {};
  } catch (error) {
    console.error("Error loading all monthly stock:", error);
    return {};
  }
}

// Subscribe to monthly stock changes (for backward compatibility)
export function subscribeToMonthlyStock(callback) {
  return subscribeToPharmacyMonthlyStock("default", callback);
}

// Custom pages management
export async function updateCustomPage(id, newData) {
  return await updateDoc(doc(db, "customPages", id), newData);
}

// Custom pages with multi-tenancy support
export async function addCustomPage(data, ownerId = null) {
  try {
    // Get current user if ownerId not provided
    if (!ownerId) {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
        const pharmaUser = await AsyncStorage.getItem("pharmaUser");
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
    });
  } catch (error) {
    console.error("Error adding custom page:", error);
    throw error;
  }
}

export async function getCustomPages(ownerId = null) {
  try {
    // Get current user if ownerId not provided
    if (!ownerId) {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
        const pharmaUser = await AsyncStorage.getItem("pharmaUser");
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
  } catch (error) {
    console.error("Error getting custom pages:", error);
    return [];
  }
}

export async function deleteCustomPage(id) {
  return await deleteDoc(doc(db, "customPages", id));
}

// Pharmacy management
export async function listPharmacies(ownerId = null) {
  try {
    // Get current user if ownerId not provided
    if (!ownerId) {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Check if user is logged in via AsyncStorage (regular/senior pharmacist)
        const pharmaUser = await AsyncStorage.getItem("pharmaUser");
        if (pharmaUser) {
          try {
            const parsedUser = JSON.parse(pharmaUser);
            if (parsedUser && parsedUser.username && parsedUser.role) {
              // For regular/senior pharmacists, they can only see their assigned pharmacy
              if (parsedUser.assignedPharmacy) {
                const pharmacyDoc = await getDoc(
                  doc(db, "pharmacies", parsedUser.assignedPharmacy)
                );
                if (pharmacyDoc.exists()) {
                  return [{ id: pharmacyDoc.id, ...pharmacyDoc.data() }];
                }
              }
              return []; // No pharmacy assigned
            }
          } catch (error) {
            console.error("Error parsing pharmaUser:", error);
            return [];
          }
        } else {
          return []; // No user logged in
        }
      } else {
        ownerId = currentUser.uid;
      }
    }

    // Filter pharmacies by ownerId (multi-tenancy)
    const q = query(
      collection(db, "pharmacies"),
      where("ownerId", "==", ownerId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error listing pharmacies:", error);
    return [];
  }
}

export async function createPharmacy(name, ownerId = null) {
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

    return await addDoc(collection(db, "pharmacies"), {
      name,
      ownerId, // Add owner ID for multi-tenancy
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    throw error;
  }
}

export async function getPharmacyNameById(id) {
  try {
    const docSnap = await getDoc(doc(db, "pharmacies", id));
    if (docSnap.exists()) {
      return docSnap.data().name;
    }
    return "Unknown Pharmacy";
  } catch (error) {
    console.error("Error getting pharmacy name:", error);
    return "Unknown Pharmacy";
  }
}

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
    return { success: true };
  } catch (error) {
    console.error("Error deleting pharmacy:", error);
    throw error;
  }
}

// User management
export async function listUsers(ownerId = null) {
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

    // Filter users by ownerId (multi-tenancy)
    const q = query(collection(db, "users"), where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error listing users:", error);
    return [];
  }
}

export async function createUser(userData, ownerId = null) {
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

    return await addDoc(collection(db, "users"), {
      ...userData,
      ownerId, // Add owner ID for multi-tenancy
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(userId, userData) {
  return await updateDoc(doc(db, "users", userId), userData);
}

export async function deleteUser(userId) {
  return await deleteDoc(doc(db, "users", userId));
}

// Attendance management
export async function getAttendanceData(pharmacyId, date) {
  try {
    const docSnap = await getDoc(
      doc(db, "pharmacies", pharmacyId, "attendance", date)
    );
    return docSnap.exists() ? docSnap.data() : {};
  } catch (error) {
    console.error("Error getting attendance data:", error);
    return {};
  }
}

export async function updateAttendance(pharmacyId, date, attendanceData) {
  try {
    await setDoc(
      doc(db, "pharmacies", pharmacyId, "attendance", date),
      attendanceData
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw error;
  }
}

// Subscribe to attendance changes
export function subscribeToAttendance(pharmacyId, date, callback) {
  return onSnapshot(
    doc(db, "pharmacies", pharmacyId, "attendance", date),
    (doc) => {
      callback(doc.exists() ? doc.data() : {});
    }
  );
}
