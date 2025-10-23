import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  getUserAssignedPharmacy,
  checkAuthStatus,
  getUserByUid,
} from "../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [assignedPharmacy, setAssignedPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authCheckTrigger, setAuthCheckTrigger] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let asyncStorageInterval;
    let appStateSubscription;

    const checkAuthentication = async () => {
      try {
        const { user: authUser, isAuthenticated } = await checkAuthStatus();

        if (isAuthenticated && authUser) {
          setUser(authUser);
          setUserRole(authUser.role);

          // Get assigned pharmacy for regular/senior pharmacists
          if (authUser.role === "regular" || authUser.role === "senior") {
            try {
              const pharmacy = await getUserAssignedPharmacy(
                authUser.uid || authUser.id
              );
              setAssignedPharmacy(pharmacy);
            } catch (error) {
              console.error("Error getting assigned pharmacy:", error);
              setAssignedPharmacy(null);
            }
          } else {
            setAssignedPharmacy(null);
          }
        } else {
          setUser(null);
          setUserRole(null);
          setAssignedPharmacy(null);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUser(null);
        setUserRole(null);
        setAssignedPharmacy(null);
      } finally {
        setLoading(false);
      }
    };

    // Check authentication status immediately
    checkAuthentication();

    // Set up periodic check for AsyncStorage changes (for senior/regular pharmacists)
    asyncStorageInterval = setInterval(async () => {
      // Skip interval check if we're in the middle of logging out
      if (isLoggingOut) {
        return;
      }

      try {
        const storedUser = await AsyncStorage.getItem("pharmaUser");
        const currentStoredUser = storedUser ? JSON.parse(storedUser) : null;

        // If current user is from AsyncStorage and stored user changed, update
        if (user && user.authType === "localStorage") {
          if (!currentStoredUser || currentStoredUser.id !== user.id) {
            checkAuthentication();
          }
        } else if (!user && currentStoredUser && !isLoggingOut) {
          // If no current user but there's a stored user, check auth (but not during logout)
          checkAuthentication();
        }
      } catch (error) {
        console.error("Error checking AsyncStorage changes:", error);
      }
    }, 1000); // Check every second

    // Listen for app state changes
    appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          checkAuthentication();
        }
      }
    );

    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user logged in - check if it's a lead pharmacist
        try {
          const userData = await getUserByUid(firebaseUser.uid);

          if (userData && userData.role === "lead") {
            setUser({ ...userData, authType: "firebase" });
            setUserRole(userData.role);
            setAssignedPharmacy(null);
          } else {
            setUser(null);
            setUserRole(null);
            setAssignedPharmacy(null);
          }
        } catch (error) {
          console.error("Error handling Firebase auth change:", error);
          // If user document doesn't exist, set user to null (matches web behavior)
          setUser(null);
          setUserRole(null);
          setAssignedPharmacy(null);
        }
      } else {
        // Firebase user logged out - check AsyncStorage for pharmacist login
        try {
          const storedUser = await AsyncStorage.getItem("pharmaUser");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser({ ...parsedUser, authType: "localStorage" });
            setUserRole(parsedUser.role);

            // Get assigned pharmacy for regular/senior pharmacists
            if (parsedUser.role === "regular" || parsedUser.role === "senior") {
              try {
                const pharmacy = await getUserAssignedPharmacy(parsedUser.id);
                setAssignedPharmacy(pharmacy);
              } catch (error) {
                console.error("Error getting assigned pharmacy:", error);
                setAssignedPharmacy(parsedUser.assignedPharmacy || null);
              }
            } else {
              setAssignedPharmacy(null);
            }
          } else {
            setUser(null);
            setUserRole(null);
            setAssignedPharmacy(null);
          }
        } catch (error) {
          console.error("Error checking stored user:", error);
          setUser(null);
          setUserRole(null);
          setAssignedPharmacy(null);
        }
      }
    });

    return () => {
      unsubscribe();
      if (asyncStorageInterval) clearInterval(asyncStorageInterval);
      if (appStateSubscription) appStateSubscription.remove();
    };
  }, [authCheckTrigger, user, isLoggingOut]); // Add dependencies

  const refreshUserData = async () => {
    try {
      const { user: authUser, isAuthenticated } = await checkAuthStatus();
      if (isAuthenticated && authUser) {
        setUser(authUser);
        setUserRole(authUser.role);
        if (authUser.role === "regular" || authUser.role === "senior") {
          const pharmacy = await getUserAssignedPharmacy(
            authUser.uid || authUser.id
          );
          setAssignedPharmacy(pharmacy);
        } else {
          setAssignedPharmacy(null);
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const triggerAuthCheck = () => {
    setAuthCheckTrigger((prev) => prev + 1);
  };

  const logout = async () => {
    try {
      // Set logout flag to prevent interval interference
      setIsLoggingOut(true);

      // Clear state immediately first
      setUser(null);
      setUserRole(null);
      setAssignedPharmacy(null);

      // Clear AsyncStorage for regular/senior pharmacists
      await AsyncStorage.removeItem("pharmaUser");

      // Sign out from Firebase for lead pharmacists
      if (auth.currentUser) {
        await auth.signOut();
      }

      // Reset logout flag after a short delay
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, clear the state
      setUser(null);
      setUserRole(null);
      setAssignedPharmacy(null);

      // Reset logout flag
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  return {
    user,
    userRole,
    assignedPharmacy,
    loading,
    refreshUserData,
    triggerAuthCheck,
    logout,
  };
};
