import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.pendingOperations = [];
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      if (wasOffline && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  async getCachedData(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  }

  async setCachedData(key, data, expiryHours = 24) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: expiryHours * 60 * 60 * 1000,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error setting cached data:", error);
    }
  }

  async isCacheValid(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return false;

      const { timestamp, expiry } = JSON.parse(cached);
      return Date.now() - timestamp < expiry;
    } catch (error) {
      return false;
    }
  }

  async fetchWithCache(collectionName, options = {}) {
    const cacheKey = `cache_${collectionName}`;

    // Check if we have valid cached data
    if (await this.isCacheValid(cacheKey)) {
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // If online, fetch fresh data
    if (this.isOnline) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Cache the fresh data
        await this.setCachedData(cacheKey, data, options.cacheHours || 1);
        return data;
      } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        // Return cached data if available, even if expired
        const cachedData = await this.getCachedData(cacheKey);
        return cachedData || [];
      }
    } else {
      // Offline: return cached data if available
      const cachedData = await this.getCachedData(cacheKey);
      return cachedData || [];
    }
  }

  async addPendingOperation(operation) {
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    });
    await this.savePendingOperations();
  }

  async savePendingOperations() {
    try {
      await AsyncStorage.setItem(
        "pendingOperations",
        JSON.stringify(this.pendingOperations)
      );
    } catch (error) {
      console.error("Error saving pending operations:", error);
    }
  }

  async loadPendingOperations() {
    try {
      const operations = await AsyncStorage.getItem("pendingOperations");
      this.pendingOperations = operations ? JSON.parse(operations) : [];
    } catch (error) {
      console.error("Error loading pending operations:", error);
      this.pendingOperations = [];
    }
  }

  async syncPendingOperations() {
    if (this.pendingOperations.length === 0) return;

    const successfulOperations = [];
    const failedOperations = [];

    for (const operation of this.pendingOperations) {
      try {
        switch (operation.type) {
          case "create":
            await setDoc(
              doc(collection(db, operation.collection)),
              operation.data
            );
            break;
          case "update":
            await updateDoc(
              doc(db, operation.collection, operation.id),
              operation.data
            );
            break;
          case "delete":
            await deleteDoc(doc(db, operation.collection, operation.id));
            break;
        }
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error("Error syncing operation:", error);
        failedOperations.push(operation);
      }
    }

    // Remove successful operations
    this.pendingOperations = failedOperations;
    await this.savePendingOperations();
  }

  async createDocument(collectionName, data) {
    if (this.isOnline) {
      try {
        const docRef = await setDoc(doc(collection(db, collectionName)), data);
        return docRef;
      } catch (error) {
        console.error("Error creating document:", error);
        throw error;
      }
    } else {
      // Add to pending operations
      await this.addPendingOperation({
        type: "create",
        collection: collectionName,
        data,
      });
      return { id: "pending_" + Date.now() };
    }
  }

  async updateDocument(collectionName, id, data) {
    if (this.isOnline) {
      try {
        await updateDoc(doc(db, collectionName, id), data);
      } catch (error) {
        console.error("Error updating document:", error);
        throw error;
      }
    } else {
      // Add to pending operations
      await this.addPendingOperation({
        type: "update",
        collection: collectionName,
        id,
        data,
      });
    }
  }

  async deleteDocument(collectionName, id) {
    if (this.isOnline) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
      }
    } else {
      // Add to pending operations
      await this.addPendingOperation({
        type: "delete",
        collection: collectionName,
        id,
      });
    }
  }

  getNetworkStatus() {
    return this.isOnline;
  }

  getPendingOperationsCount() {
    return this.pendingOperations.length;
  }
}

export default new OfflineService();
