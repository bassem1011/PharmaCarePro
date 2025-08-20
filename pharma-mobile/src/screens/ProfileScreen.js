import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetworkStatusBar from "../components/common/NetworkStatusBar";

const ProfileScreen = () => {
  const { user, userRole, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "lead":
        return "Lead Pharmacist";
      case "senior":
        return "Senior Pharmacist";
      case "regular":
        return "Pharmacist";
      default:
        return "User";
    }
  };

  const profileSections = [
    {
      title: "Account",
      items: [
        {
          icon: "account-circle",
          title: "Profile Information",
          subtitle: "View and edit your profile",
          action: () =>
            Alert.alert(
              "Coming Soon",
              "Profile editing will be available soon"
            ),
          color: "#3b82f6",
        },
        {
          icon: "shield-key",
          title: "Change Password",
          subtitle: "Update your password",
          action: () =>
            Alert.alert(
              "Coming Soon",
              "Password change will be available soon"
            ),
          color: "#10b981",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "bell",
          title: "Notifications",
          subtitle: "Manage notification settings",
          type: "switch",
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
          color: "#8b5cf6",
        },
        {
          icon: "theme-light-dark",
          title: "Dark Mode",
          subtitle: "Toggle dark/light theme",
          type: "switch",
          value: darkModeEnabled,
          onValueChange: setDarkModeEnabled,
          color: "#f59e0b",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help-circle",
          title: "Help & Support",
          subtitle: "Get help and contact support",
          action: () =>
            Alert.alert("Support", "Contact support at support@pharma.com"),
          color: "#ef4444",
        },
        {
          icon: "information",
          title: "About",
          subtitle: "App version and information",
          action: () => Alert.alert("About", "Pharma Management App v1.0.0"),
          color: "#6b7280",
        },
      ],
    },
  ];

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <NetworkStatusBar />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons
                name="account-circle"
                size={80}
                color="#3b82f6"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.name || user?.email || "User"}
              </Text>
              <Text style={styles.userRole}>
                {getRoleDisplayName(userRole)}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Profile Sections */}
          {profileSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.menuItem}
                    onPress={item.action}
                    disabled={item.type === "switch"}
                  >
                    <View style={styles.menuItemLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: item.color + "20" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={24}
                          color={item.color}
                        />
                      </View>
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemSubtitle}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                    {item.type === "switch" ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: "#374151", true: item.color }}
                        thumbColor="#ffffff"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color="#6b7280"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: "#3b82f6",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#9ca3af",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  logoutButton: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
});

export default ProfileScreen;
