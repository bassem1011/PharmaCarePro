import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PharmacySelector = ({
  pharmacies,
  selectedPharmacy,
  onSelectPharmacy,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="pharmacy" size={24} color="#3b82f6" />
        <Text style={styles.title}>Select Pharmacy</Text>
      </View>
      <View style={styles.pharmaciesList}>
        {pharmacies.map((pharmacy) => (
          <TouchableOpacity
            key={pharmacy.id}
            style={[
              styles.pharmacyItem,
              selectedPharmacy?.id === pharmacy.id && styles.selectedPharmacy,
            ]}
            onPress={() => onSelectPharmacy(pharmacy)}
          >
            <View style={styles.pharmacyInfo}>
              <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
              <Text style={styles.pharmacyLocation}>
                {pharmacy.location || "Location not specified"}
              </Text>
            </View>
            {selectedPharmacy?.id === pharmacy.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#10b981"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 12,
  },
  pharmaciesList: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
  },
  pharmacyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#374151",
  },
  selectedPharmacy: {
    backgroundColor: "#1e40af",
    borderColor: "#3b82f6",
    borderWidth: 1,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  pharmacyLocation: {
    fontSize: 14,
    color: "#9ca3af",
  },
});

export default PharmacySelector;
