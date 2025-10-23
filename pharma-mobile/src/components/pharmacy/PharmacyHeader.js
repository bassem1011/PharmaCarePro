import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PharmacyHeader = ({ pharmacy, onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{pharmacy?.name}</Text>
        <Text style={styles.headerSubtitle}>Pharmacy Details</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color="#3b82f6"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
    borderRadius: 20,
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
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#374151",
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#374151",
    marginLeft: 8,
  },
});

export default PharmacyHeader;
