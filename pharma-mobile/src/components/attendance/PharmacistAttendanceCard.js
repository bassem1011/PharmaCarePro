import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PharmacistAttendanceCard = ({
  pharmacist,
  attendanceStatus,
  onMarkAttendance,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "#10b981";
      case "absent":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return "check-circle";
      case "absent":
        return "close-circle";
      default:
        return "help-circle";
    }
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

  return (
    <View style={styles.card}>
      <View style={styles.pharmacistInfo}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name="account-circle"
            size={40}
            color="#8b5cf6"
          />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{pharmacist.name || pharmacist.email}</Text>
          <Text style={styles.role}>{getRoleDisplayName(pharmacist.role)}</Text>
        </View>
      </View>

      <View style={styles.attendanceSection}>
        {attendanceStatus ? (
          <View style={styles.statusDisplay}>
            <MaterialCommunityIcons
              name={getStatusIcon(attendanceStatus)}
              size={24}
              color={getStatusColor(attendanceStatus)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(attendanceStatus) },
              ]}
            >
              {attendanceStatus === "present" ? "Present" : "Absent"}
            </Text>
          </View>
        ) : (
          <View style={styles.attendanceButtons}>
            <TouchableOpacity
              style={[styles.attendanceButton, styles.presentButton]}
              onPress={() => onMarkAttendance(pharmacist.id, "present")}
            >
              <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attendanceButton, styles.absentButton]}
              onPress={() => onMarkAttendance(pharmacist.id, "absent")}
            >
              <MaterialCommunityIcons name="close" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Absent</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pharmacistInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: "#9ca3af",
  },
  attendanceSection: {
    alignItems: "center",
  },
  statusDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  attendanceButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  attendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  presentButton: {
    backgroundColor: "#10b981",
  },
  absentButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default PharmacistAttendanceCard;
