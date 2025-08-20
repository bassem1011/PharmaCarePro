import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const AttendanceHeader = ({
  selectedPharmacy,
  totalPharmacists,
  presentCount,
  absentCount,
}) => {
  const attendanceRate =
    totalPharmacists > 0
      ? Math.round((presentCount / totalPharmacists) * 100)
      : 0;

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Attendance Management</Text>
        <Text style={styles.headerSubtitle}>
          {selectedPharmacy?.name || "Select Pharmacy"}
        </Text>
      </View>
      <View style={styles.attendanceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{attendanceRate}%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {presentCount}/{totalPharmacists}
          </Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#9ca3af",
  },
  attendanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
});

export default AttendanceHeader;
