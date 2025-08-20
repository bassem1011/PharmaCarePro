import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PharmacyInfoCard = ({ pharmacy, stats }) => {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <MaterialCommunityIcons name="medical-bag" size={32} color="#3b82f6" />
        <View style={styles.infoContent}>
          <Text style={styles.pharmacyName}>{pharmacy?.name}</Text>
          <Text style={styles.pharmacyStatus}>Active</Text>
        </View>
      </View>
      <View style={styles.infoStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.shortages || 0}</Text>
          <Text style={styles.statLabel}>Shortages</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.available || 0}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.pharmacists || 0}</Text>
          <Text style={styles.statLabel}>Pharmacists</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  pharmacyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  pharmacyStatus: {
    fontSize: 14,
    color: "#10b981",
    marginTop: 4,
  },
  infoStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default PharmacyInfoCard;
