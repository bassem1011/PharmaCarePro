import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create user document in Firestore if it doesn't exist
export const createUserDocument = async (uid, userData) => {
  try {
    await setDoc(doc(db, "users", uid), {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

// Lead Pharmacist Login (Firebase Auth) - matches web version exactly
export const loginLeadPharmacist = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Get user data from Firestore - matches web version exactly

    try {
      const userData = await getUserByUid(user.uid);

      if (userData.role === "lead") {
        return {
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            ...userData,
            authType: "firebase",
          },
        };
      } else {
        throw new Error("هذا الحساب ليس لصيدلي أول");
      }
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      if (firestoreError.message.includes("permission")) {
        throw new Error("خطأ في الصلاحيات. تأكد من أن الحساب صحيح.");
      }
      throw firestoreError;
    }
  } catch (error) {
    console.error("Lead pharmacist login error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Regular/Senior Pharmacist Login (Firestore-based) - matches web version exactly
export const loginPharmacist = async (username, password) => {
  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error("اسم المستخدم غير صحيح");
    }

    const userId = snap.docs[0].id;
    const userDoc = { id: userId, ...snap.docs[0].data() };

    if (userDoc.password !== password) {
      throw new Error("كلمة المرور غير صحيحة");
    }

    if (userDoc.role !== "regular" && userDoc.role !== "senior") {
      throw new Error("الحساب غير مصرح له بالدخول هنا");
    }

    // Save to AsyncStorage (equivalent to localStorage in web)
    await AsyncStorage.setItem("pharmaUser", JSON.stringify(userDoc));

    return {
      success: true,
      user: {
        ...userDoc,
        authType: "localStorage",
      },
    };
  } catch (error) {
    console.error("Pharmacist login error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Unified login function - matches web version
export const loginUser = async (email, password, loginType = "lead") => {
  if (loginType === "lead") {
    return await loginLeadPharmacist(email, password);
  } else {
    return await loginPharmacist(email, password); // email parameter is actually username
  }
};

// Signup - Only for Lead Pharmacists (matches web version exactly)
export const registerUser = async (userData) => {
  try {
    const { email, password, name } = userData;

    // Create lead pharmacist with Firebase Auth (only role allowed in signup)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save user data to Firestore - matches web version exactly
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email,
      role: "lead", // Only lead accounts can be created via signup
      assignedPharmacy: null,
      ownerId: user.uid, // Lead users own themselves - Add this for multi-tenancy
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name,
        role: "lead",
        assignedPharmacy: null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const logoutUser = async () => {
  try {
    // Sign out from Firebase Auth
    await signOut(auth);

    // Clear AsyncStorage
    await AsyncStorage.removeItem("pharmaUser");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// getUserByUid function - matches web version exactly
export const getUserByUid = async (uid) => {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (userDoc.exists()) {
    const userData = userDoc.data();

    return userData;
  } else {
    throw new Error("User not found");
  }
};

// Check if user is logged in (supports both auth types) - fixed to match web version
export const checkAuthStatus = async () => {
  try {
    // Check Firebase Auth first
    const firebaseUser = auth.currentUser;

    if (firebaseUser) {
      try {
        const userData = await getUserByUid(firebaseUser.uid);

        return {
          user: { ...userData, authType: "firebase" },
          isAuthenticated: true,
        };
      } catch (error) {
        console.error("Error fetching user data:", error);
        // If user document doesn't exist, return null (matches web behavior)

        return { user: null, isAuthenticated: false };
      }
    }

    // Check AsyncStorage for pharmacist login

    const pharmaUser = await AsyncStorage.getItem("pharmaUser");

    if (pharmaUser) {
      try {
        const parsedUser = JSON.parse(pharmaUser);

        if (parsedUser && parsedUser.username && parsedUser.role) {
          return {
            user: { ...parsedUser, authType: "localStorage" },
            isAuthenticated: true,
          };
        } else {
          // Invalid AsyncStorage data
          await AsyncStorage.removeItem("pharmaUser");
        }
      } catch (e) {
        console.error("Error parsing AsyncStorage user:", e);
        await AsyncStorage.removeItem("pharmaUser");
      }
    }

    return { user: null, isAuthenticated: false };
  } catch (error) {
    console.error("Error checking auth status:", error);
    return { user: null, isAuthenticated: false };
  }
};

export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().role || "regular";
    }
    return "regular";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "regular";
  }
};

export const getUserAssignedPharmacy = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.assignedPharmacy) {
        // Get pharmacy details
        const pharmacyDoc = await getDoc(
          doc(db, "pharmacies", userData.assignedPharmacy)
        );
        if (pharmacyDoc.exists()) {
          return {
            id: pharmacyDoc.id,
            ...pharmacyDoc.data(),
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting assigned pharmacy:", error);
    return null;
  }
};

// Migration function to create default pharmacy and ensure data exists
export const initializeDefaultPharmacy = async (ownerId = null) => {
  try {
    // Get current user if ownerId not provided
    if (!ownerId) {
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

    return {
      success: true,
      defaultPharmacyId,
      message: "Default pharmacy initialized",
    };
  } catch (error) {
    console.error("Error initializing default pharmacy:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Test Firebase connectivity and permissions
export const testFirebaseConnection = async () => {
  try {
    // Test 1: Check if we can read from users collection
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "lead")
    );
    const usersSnap = await getDocs(usersQuery);

    // Test 2: Check if we can read from pharmacies collection
    const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));

    // Test 3: Initialize default pharmacy if needed
    const initResult = await initializeDefaultPharmacy();

    return {
      success: true,
      message: "Firebase connection successful",
      usersCount: usersSnap.size,
      pharmaciesCount: pharmaciesSnap.size,
      defaultPharmacyId: initResult.defaultPharmacyId,
    };
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
