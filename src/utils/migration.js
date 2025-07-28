import { createDefaultPharmacyAndMigrate } from "./firestoreService";

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
