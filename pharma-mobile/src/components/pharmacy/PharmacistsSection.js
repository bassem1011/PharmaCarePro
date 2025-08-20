import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PharmacistsSection = ({ pharmacists, onPharmacistPress }) => {
  if (!pharmacists || pharmacists.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="account-group"
            size={24}
            color="#8b5cf6"
          />
          <Text style={styles.sectionTitle}>Pharmacists</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-off"
            size={48}
            color="#6b7280"
          />
          <Text style={styles.emptyText}>No pharmacists assigned</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="account-group"
          size={24}
          color="#8b5cf6"
        />
        <Text style={styles.sectionTitle}>
          Pharmacists ({pharmacists.length})
        </Text>
      </View>
      <View style={styles.pharmacistsList}>
        {pharmacists.map((pharmacist, index) => (
          <TouchableOpacity
            key={pharmacist.id}
            style={styles.pharmacistItem}
            onPress={() => onPharmacistPress?.(pharmacist)}
          >
            <View style={styles.pharmacistAvatar}>
              <MaterialCommunityIcons
                name="account-circle"
                size={40}
                color="#8b5cf6"
              />
            </View>
            <View style={styles.pharmacistInfo}>
              <Text style={styles.pharmacistName}>
                {pharmacist.name || pharmacist.email}
              </Text>
              <Text style={styles.pharmacistRole}>
                {getRoleDisplayName(pharmacist.role)}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
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

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 12,
  },
  pharmacistsList: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
  },
  pharmacistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  pharmacistAvatar: {
    marginRight: 16,
  },
  pharmacistInfo: {
    flex: 1,
  },
  pharmacistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  pharmacistRole: {
    fontSize: 14,
    color: "#9ca3af",
  },
  emptyState: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
});

export default PharmacistsSection;
