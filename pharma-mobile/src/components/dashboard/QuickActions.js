import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QuickActionButton from "./QuickActionButton";
import { colors, spacing, radii, shadows } from "../../utils/theme";

const QuickActions = ({ onNavigate }) => {
  const quickActions = [
    {
      icon: "store",
      label: "إدارة الصيدليات",
      description: "عرض وإدارة جميع الصيدليات في النظام",
      color: "#3b82f6",
      screen: "Pharmacies",
    },
    {
      icon: "account-group",
      label: "إدارة الصيادلة",
      description: "إدارة الصيادلة وتوزيعهم على الصيدليات",
      color: "#10b981",
      screen: "Pharmacists",
    },
    {
      icon: "calendar-check",
      label: "مراقبة الحضور",
      description: "تتبع حضور الصيادلة وإدارة الجداول",
      color: "#8b5cf6",
      screen: "Attendance",
    },
    // Removed Inventory and CustomPages to match web parity
  ];

  const handleActionPress = (screen) => {
    // Only navigate to screens that exist
    if (
      screen === "Pharmacies" ||
      screen === "Pharmacists" ||
      screen === "Attendance"
    ) {
      onNavigate?.(screen);
    } else {
      // For screens that don't exist yet, show a placeholder
    }
  };

  return (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <QuickActionButton
            key={index}
            icon={action.icon}
            label={action.label}
            description={action.description}
            color={action.color}
            onPress={() => handleActionPress(action.screen)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quickActionsContainer: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "right",
  },
  quickActionsGrid: {
    gap: spacing.md,
  },
});

export default QuickActions;
