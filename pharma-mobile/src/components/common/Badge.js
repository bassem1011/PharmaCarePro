import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii } from "../../utils/theme";

const VARIANT_TO_COLOR = {
  success: colors.green,
  warning: colors.amber,
  danger: colors.red,
  info: colors.blue,
  primary: colors.brandStart,
  neutral: colors.textMuted,
};

export default function Badge({ label, variant = "neutral" }) {
  const color = VARIANT_TO_COLOR[variant] || colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});

