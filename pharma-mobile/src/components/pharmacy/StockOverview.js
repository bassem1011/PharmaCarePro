import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const StockCard = ({ title, value, color, icon }) => (
  <View style={[styles.stockCard, { borderLeftColor: color }]}>
    <View style={[styles.stockIcon, { backgroundColor: color + "20" }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={styles.stockContent}>
      <Text style={[styles.stockValue, { color: "#ffffff" }]}>{value}</Text>
      <Text style={[styles.stockLabel, { color: "#9ca3af" }]}>{title}</Text>
    </View>
  </View>
);

const StockOverview = ({ stats }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="cube" size={24} color="#10b981" />
        <Text style={styles.sectionTitle}>Stock Overview</Text>
      </View>
      <View style={styles.stockGrid}>
        <StockCard
          title="Total Items"
          value={stats?.totalItems || 0}
          color="#3b82f6"
          icon="package-variant"
        />
        <StockCard
          title="Available"
          value={stats?.available || 0}
          color="#10b981"
          icon="check-circle"
        />
        <StockCard
          title="Shortages"
          value={stats?.shortages || 0}
          color="#ef4444"
          icon="alert-circle"
        />
        <StockCard
          title="Low Stock"
          value={stats?.lowStock || 0}
          color="#f59e0b"
          icon="alert"
        />
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
  stockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  stockCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: "48%",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stockContent: {
    alignItems: "center",
  },
  stockValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default StockOverview;
