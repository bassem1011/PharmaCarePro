import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CustomLogo = ({ size = 80, color = "#ffffff" }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.pillContainer, { backgroundColor: "#8b5cf6" }]}>
        <MaterialCommunityIcons name="pill" size={size * 0.6} color={color} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  pillContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CustomLogo;
