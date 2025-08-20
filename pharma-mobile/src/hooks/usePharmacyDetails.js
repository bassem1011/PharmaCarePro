import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import offlineService from "../services/offlineService";

export const usePharmacyDetails = (pharmacyId) => {
  const [loading, setLoading] = useState(true);
  const [pharmacy, setPharmacy] = useState(null);
  const [pharmacists, setPharmacists] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    shortages: 0,
    available: 0,
    lowStock: 0,
    pharmacists: 0,
  });

  useEffect(() => {
    if (pharmacyId) {
      fetchPharmacyDetails();
    }
  }, [pharmacyId]);

  const fetchPharmacyDetails = async () => {
    try {
      setLoading(true);

      // Fetch pharmacy details using direct Firestore
      const pharmacyRef = doc(db, "pharmacies", pharmacyId);
      const pharmacySnap = await getDoc(pharmacyRef);

      if (pharmacySnap.exists()) {
        setPharmacy({
          id: pharmacySnap.id,
          ...pharmacySnap.data(),
        });
      }

      // Fetch pharmacists assigned to this pharmacy using direct Firestore
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const pharmacyPharmacists = usersData.filter(
        (user) => user.assignedPharmacy === pharmacyId
      );
      setPharmacists(pharmacyPharmacists);

      // Fetch inventory items using direct Firestore
      const inventorySnap = await getDocs(
        collection(db, "pharmacies", pharmacyId, "monthlyStock")
      );
      const inventoryData = inventorySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(inventoryData);

      // Calculate shortages and stats
      calculateStats(inventoryData, pharmacyPharmacists);
    } catch (error) {
      console.error("Error fetching pharmacy details:", error);
      // Set default values on error
      setPharmacists([]);
      setItems([]);
      setShortages([]);
      setStats({
        totalItems: 0,
        shortages: 0,
        available: 0,
        lowStock: 0,
        pharmacists: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (inventoryItems, pharmacistsList) => {
    const totalItems = inventoryItems.length;
    const shortages = inventoryItems.filter((item) => {
      const currentStock = calculateCurrentStock(item);
      return currentStock <= 0;
    });

    const available = inventoryItems.filter((item) => {
      const currentStock = calculateCurrentStock(item);
      return currentStock > 0;
    });

    const lowStock = inventoryItems.filter((item) => {
      const currentStock = calculateCurrentStock(item);
      const minStock = item.minStock || 10;
      return currentStock > 0 && currentStock <= minStock;
    });

    setShortages(shortages);
    setStats({
      totalItems,
      shortages: shortages.length,
      available: available.length,
      lowStock: lowStock.length,
      pharmacists: pharmacistsList.length,
    });
  };

  const calculateCurrentStock = (item) => {
    if (!item) return 0;

    const opening = Math.floor(Number(item.opening || 0));

    // Safe reduce for dailyIncoming
    const dailyIncoming = item.dailyIncoming || {};
    const totalIncoming = Math.floor(
      Object.values(dailyIncoming).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      )
    );

    // Safe reduce for dailyDispense
    const dailyDispense = item.dailyDispense || {};
    const totalDispensed = Math.floor(
      Object.values(dailyDispense).reduce(
        (acc, val) => acc + Number(val || 0),
        0
      )
    );

    return opening + totalIncoming - totalDispensed;
  };

  const refreshData = async () => {
    await fetchPharmacyDetails();
  };

  return {
    loading,
    pharmacy,
    pharmacists,
    shortages,
    items,
    stats,
    refreshData,
  };
};
