import { createDefaultPharmacyAndMigrate } from "./firestoreService";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

// Migration utility to handle the transition from global to pharmacy-specific inventory
export const runMigration = async () => {
  try {
    console.log("🚀 Starting migration to pharmacy-specific inventory...");

    // Create default pharmacy and migrate existing data
    const defaultPharmacyId = await createDefaultPharmacyAndMigrate();

    console.log("✅ Migration completed successfully!");
    console.log("📋 Default pharmacy ID:", defaultPharmacyId);

    return {
      success: true,
      defaultPharmacyId,
      message: "Migration completed successfully",
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return {
      success: false,
      error: error.message,
      message: "Migration failed",
    };
  }
};

// Check if migration is needed
export const checkMigrationStatus = async () => {
  try {
    // This will be called on app startup to ensure migration is complete
    await createDefaultPharmacyAndMigrate();
    return { needsMigration: false, message: "System is up to date" };
  } catch (error) {
    return { needsMigration: true, error: error.message };
  }
};

// Multi-tenancy migration: Add ownerId to existing data
export const migrateToMultiTenancy = async () => {
  try {
    console.log("🚀 Starting multi-tenancy migration...");

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const batch = writeBatch(db);
    let updateCount = 0;

    // 1. Update existing pharmacies to include ownerId
    const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
    pharmaciesSnap.docs.forEach((pharmacyDoc) => {
      const data = pharmacyDoc.data();
      if (!data.ownerId) {
        batch.update(doc(db, "pharmacies", pharmacyDoc.id), {
          ownerId: currentUser.uid,
          updatedAt: new Date().toISOString(),
        });
        updateCount++;
      }
    });

    // 2. Update existing users (pharmacists) to include ownerId
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.docs.forEach((userDoc) => {
      const data = userDoc.data();
      if (!data.ownerId && data.role !== "lead") {
        batch.update(doc(db, "users", userDoc.id), {
          ownerId: currentUser.uid,
          updatedAt: new Date().toISOString(),
        });
        updateCount++;
      }
    });

    // 3. Update existing custom pages to include ownerId
    const customPagesSnap = await getDocs(collection(db, "customPages"));
    customPagesSnap.docs.forEach((pageDoc) => {
      const data = pageDoc.data();
      if (!data.ownerId) {
        batch.update(doc(db, "customPages", pageDoc.id), {
          ownerId: currentUser.uid,
          updatedAt: new Date().toISOString(),
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(
        `✅ Multi-tenancy migration completed! Updated ${updateCount} documents.`
      );
    } else {
      console.log("✅ Multi-tenancy migration: No updates needed.");
    }

    return {
      success: true,
      updateCount,
      message: "Multi-tenancy migration completed successfully",
    };
  } catch (error) {
    console.error("❌ Multi-tenancy migration failed:", error);
    return {
      success: false,
      error: error.message,
      message: "Multi-tenancy migration failed",
    };
  }
};
