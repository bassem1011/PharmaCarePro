import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ShortagesSection = ({ shortages }) => {
  if (!shortages || shortages.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
        <Text style={styles.sectionTitle}>Shortages</Text>
      </View>
      <View style={styles.shortagesList}>
        {shortages.map((item, index) => (
          <View
            key={`shortage-${item.name || index}`}
            style={styles.shortageItem}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>
                {item.description || "No description available"}
              </Text>
            </View>
            <View style={styles.itemStock}>
              <Text style={styles.stockValue}>{item.currentStock}</Text>
              <Text style={styles.stockLabel}>Available</Text>
              <Text style={styles.minStock}>Min: {item.minStock || 10}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
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
  shortagesList: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
  },
  shortageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#9ca3af",
  },
  itemStock: {
    alignItems: "flex-end",
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 2,
  },
  stockLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  minStock: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
});

export default ShortagesSection;
