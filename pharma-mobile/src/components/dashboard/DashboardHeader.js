import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";

const DashboardHeader = ({ onLogout, showLogout = true }) => {
  const { user, userRole, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case "lead":
        return "صيدلي أول";
      case "senior":
        return "صيدلي خبير";
      case "regular":
        return "صيدلي";
      default:
        return "صيدلي";
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.roleText}>{getRoleText(userRole)}</Text>
        <Text style={styles.subtitleText}>إدارة عمليات الصيدلية بكفاءة</Text>
      </View>
      {showLogout ? (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
          <Text style={styles.logoutText}>تسجيل خروج</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  roleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8b5cf6",
    marginBottom: 4,
    textAlign: "right",
  },
  subtitleText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#dc2626",
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DashboardHeader;
