import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// Add a daily dispensed record
export async function addDailyDispensed(data) {
  return await addDoc(collection(db, "dailyDispensed"), data);
}

// Get all daily dispensed records
export async function getDailyDispensed() {
  const snapshot = await getDocs(collection(db, "dailyDispensed"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Add a daily incoming record
export async function addDailyIncoming(data) {
  return await addDoc(collection(db, "dailyIncoming"), data);
}

// Get all daily incoming records
export async function getDailyIncoming() {
  const snapshot = await getDocs(collection(db, "dailyIncoming"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

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
 