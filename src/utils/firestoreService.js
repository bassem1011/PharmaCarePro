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

  if (item.opening < 0) {
    throw new Error("الرصيد الافتتاحي لا يمكن أن يكون سالب");
  }
  if (item.unitPrice < 0) {
    throw new Error("سعر الوحدة لا يمكن أن يكون سالب");
  }
  return true;
};

// Create default pharmacy and migrate existing data
export async function createDefaultPharmacyAndMigrate() {
  try {
    // Check if default pharmacy already exists
    const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
    const existingDefault = pharmaciesSnap.docs.find(
      (doc) => doc.data().name === "Test Pharmacy"
    );

    let defaultPharmacyId;
    if (existingDefault) {
      defaultPharmacyId = existingDefault.id;
      console.log("Default pharmacy already exists:", defaultPharmacyId);
    } else {
      // Create default pharmacy
      const defaultPharmacyRef = await addDoc(collection(db, "pharmacies"), {
        name: "Test Pharmacy",
        isDefault: true,
        createdAt: new Date().toISOString(),
      });
      defaultPharmacyId = defaultPharmacyRef.id;
      console.log("Created default pharmacy:", defaultPharmacyId);
    }

    // Migrate existing global monthlyStock data to default pharmacy
    const globalMonthlyStockSnap = await getDocs(
      collection(db, "monthlyStock")
    );

    if (globalMonthlyStockSnap.size > 0) {
      console.log("Migrating global inventory data to default pharmacy...");

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
      console.log("Migration completed successfully");
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
export async function addCustomPage(data) {
  return await addDoc(collection(db, "customPages"), data);
}

// Get all custom pages
export async function getCustomPages() {
  const snapshot = await getDocs(collection(db, "customPages"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Delete a custom page by ID
export async function deleteCustomPage(id) {
  return await deleteDoc(doc(db, "customPages", id));
}

// Update a custom page by ID
export async function updateCustomPage(id, newData) {
  return await updateDoc(doc(db, "customPages", id), newData);
}

export async function listPharmacies() {
  const snapshot = await getDocs(collection(db, "pharmacies"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createPharmacy(name) {
  const docRef = await addDoc(collection(db, "pharmacies"), {
    name,
    createdAt: new Date().toISOString(),
    isDefault: false,
  });
  return { id: docRef.id, name };
}

export async function getPharmacyNameById(id) {
  const docSnap = await getDoc(doc(db, "pharmacies", id));
  if (docSnap.exists()) {
    return docSnap.data().name || id;
  }
  return id;
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
