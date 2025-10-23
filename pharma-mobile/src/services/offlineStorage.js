import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const STORAGE_KEYS = {
  INVENTORY_DATA: "inventory_data",
  USER_DATA: "user_data",
  PHARMACY_DATA: "pharmacy_data",
  PENDING_CHANGES: "pending_changes",
  LAST_SYNC: "last_sync",
  OFFLINE_MODE: "offline_mode",
};

// Offline storage service
export class OfflineStorage {
  // Save inventory data locally
  static async saveInventoryData(pharmacyId, data) {
    try {
      const key = `${STORAGE_KEYS.INVENTORY_DATA}_${pharmacyId}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("❌ Error saving inventory data offline:", error);
    }
  }

  // Load inventory data from local storage
  static async loadInventoryData(pharmacyId) {
    try {
      const key = `${STORAGE_KEYS.INVENTORY_DATA}_${pharmacyId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ Error loading inventory data from offline:", error);
      return null;
    }
  }

  // Save user data locally
  static async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
    } catch (error) {
      console.error("❌ Error saving user data offline:", error);
    }
  }

  // Load user data from local storage
  static async loadUserData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ Error loading user data from offline:", error);
      return null;
    }
  }

  // Save pharmacy data locally
  static async savePharmacyData(pharmacyData) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PHARMACY_DATA,
        JSON.stringify(pharmacyData)
      );
    } catch (error) {
      console.error("❌ Error saving pharmacy data offline:", error);
    }
  }

  // Load pharmacy data from local storage
  static async loadPharmacyData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PHARMACY_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ Error loading pharmacy data from offline:", error);
      return null;
    }
  }

  // Save pending changes for sync when online
  static async savePendingChanges(changes) {
    try {
      const existingChanges = await this.getPendingChanges();
      const updatedChanges = [...existingChanges, ...changes];
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_CHANGES,
        JSON.stringify(updatedChanges)
      );
    } catch (error) {
      console.error("❌ Error saving pending changes:", error);
    }
  }

  // Get pending changes
  static async getPendingChanges() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHANGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("❌ Error getting pending changes:", error);
      return [];
    }
  }

  // Clear pending changes after successful sync
  static async clearPendingChanges() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_CHANGES);
    } catch (error) {
      console.error("❌ Error clearing pending changes:", error);
    }
  }

  // Save last sync timestamp
  static async saveLastSync(timestamp) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error("❌ Error saving last sync:", error);
    }
  }

  // Get last sync timestamp
  static async getLastSync() {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error("❌ Error getting last sync:", error);
      return null;
    }
  }

  // Set offline mode status
  static async setOfflineMode(isOffline) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_MODE,
        JSON.stringify(isOffline)
      );
    } catch (error) {
      console.error("❌ Error setting offline mode:", error);
    }
  }

  // Get offline mode status
  static async getOfflineMode() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error("❌ Error getting offline mode:", error);
      return false;
    }
  }

  // Clear all offline data
  static async clearAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(
        (key) =>
          key.startsWith("inventory_data") ||
          key.startsWith("user_data") ||
          key.startsWith("pharmacy_data") ||
          key.startsWith("pending_changes") ||
          key.startsWith("last_sync") ||
          key.startsWith("offline_mode")
      );
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error("❌ Error clearing offline data:", error);
    }
  }

  // Get storage usage info
  static async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(
        (key) =>
          key.startsWith("inventory_data") ||
          key.startsWith("user_data") ||
          key.startsWith("pharmacy_data") ||
          key.startsWith("pending_changes") ||
          key.startsWith("last_sync") ||
          key.startsWith("offline_mode")
      );

      let totalSize = 0;
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        keysCount: appKeys.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error("❌ Error getting storage info:", error);
      return { keysCount: 0, totalSize: 0, totalSizeMB: "0.00" };
    }
  }
}

// Network status checker
export class NetworkStatus {
  static isOnline = true;
  static listeners = [];

  static setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    this.notifyListeners();
  }

  static getOnlineStatus() {
    return this.isOnline;
  }

  static addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  static notifyListeners() {
    this.listeners.forEach((callback) => callback(this.isOnline));
  }
}

// Sync service for pending changes
export class SyncService {
  static async syncPendingChanges() {
    try {
      const pendingChanges = await OfflineStorage.getPendingChanges();
      if (pendingChanges.length === 0) {
        return;
      }

      // Here you would implement the actual sync logic
      // For now, we'll just clear the pending changes
      await OfflineStorage.clearPendingChanges();
      await OfflineStorage.saveLastSync(Date.now());
    } catch (error) {
      console.error("❌ Error syncing pending changes:", error);
      throw error;
    }
  }

  static async performFullSync(pharmacyId) {
    try {
      // Sync pending changes first
      await this.syncPendingChanges();

      // Update last sync timestamp
      await OfflineStorage.saveLastSync(Date.now());
    } catch (error) {
      console.error("❌ Error during full sync:", error);
      throw error;
    }
  }
}
