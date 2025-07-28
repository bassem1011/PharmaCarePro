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

// Retry mechanism for failed saves
export const saveWithRetry = async (monthKey, items, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Validate all items before saving
      items.forEach(validateItem);
      await saveMonthlyStock(monthKey, items);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Save or update a month's stock (overwrites if exists)
export async function saveMonthlyStock(monthKey, items) {
  try {
    await setDoc(doc(db, "monthlyStock", monthKey), { items });
  } catch (error) {
    console.error("Error saving monthly stock:", error);
    throw error;
  }
}

// Get all months' stock
export async function loadAllMonthlyStock() {
  try {
    const snapshot = await getDocs(collection(db, "monthlyStock"));
    const byMonth = {};
    snapshot.forEach((docSnap) => {
      byMonth[docSnap.id] = docSnap.data().items || [];
    });
    return byMonth;
  } catch (error) {
    console.error("Error loading monthly stock:", error);
    throw error;
  }
}

// Real-time listener for all months' stock
export function subscribeToMonthlyStock(callback) {
  const colRef = collection(db, "monthlyStock");
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const byMonth = {};
    snapshot.forEach((docSnap) => {
      byMonth[docSnap.id] = docSnap.data().items || [];
    });
    callback(byMonth);
  });
  return unsubscribe;
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
  const docRef = await addDoc(collection(db, "pharmacies"), { name });
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

    // 3. Delete all subcollections if they exist (monthlyStock, shortages, attendance)
    // Note: Firestore doesn't automatically delete subcollections, so we need to handle this
    // For now, we'll just delete the main document and update user assignments

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting pharmacy:", error);
    throw error;
  }
}
