import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import offlineService from "../../services/offlineService";

const NetworkStatusBar = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);

      if (!online) {
        showStatusBar();
      } else {
        hideStatusBar();
      }
    });

    // Check pending operations periodically
    const checkPendingOperations = () => {
      const count = offlineService.getPendingOperationsCount();
      setPendingCount(count);

      if (count > 0) {
        showStatusBar();
      }
    };

    checkPendingOperations();
    const interval = setInterval(checkPendingOperations, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const showStatusBar = useCallback(() => {
    setShowBar((prev) => {
      if (prev) return prev;
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return true;
    });
  }, [slideAnim]);

  const hideStatusBar = useCallback(() => {
    if (isOnline && pendingCount === 0) {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBar(false);
      });
    }
  }, [isOnline, pendingCount, slideAnim]);

  if (!showBar) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={isOnline ? "wifi" : "wifi-off"}
          size={20}
          color={isOnline ? "#10b981" : "#ef4444"}
        />
        <Text style={styles.text}>
          {!isOnline
            ? "أنت غير متصل بالإنترنت"
            : pendingCount > 0
            ? `${pendingCount} عملية معلقة`
            : "متصل بالإنترنت"}
        </Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{pendingCount}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  pendingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default NetworkStatusBar;
