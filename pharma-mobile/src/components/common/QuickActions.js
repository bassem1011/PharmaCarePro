import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii, shadows } from "../../utils/theme";

const QuickAction = ({ icon, label, color = colors.brandStart, onPress }) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

export default function QuickActions({ actions = [] }) {
  return (
    <View style={styles.container}>
      {actions.map((a, idx) => (
        <QuickAction key={idx} {...a} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 16,
    ...shadows.soft,
  },
  action: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
