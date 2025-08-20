import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radii, shadows } from "../../utils/theme";

const { width } = Dimensions.get("window");

const QuickActionButton = ({ icon, label, onPress, color, description }) => {
  const getGradientColors = (baseColor) => {
    switch (baseColor) {
      case "#3b82f6": // Blue
        return ["#3b82f6", "#1d4ed8", "#1e40af"];
      case "#10b981": // Green
        return ["#10b981", "#059669", "#047857"];
      case "#8b5cf6": // Purple
        return ["#8b5cf6", "#7c3aed", "#6d28d9"];
      case "#f59e0b": // Amber
        return ["#f59e0b", "#d97706", "#b45309"];
      default:
        return [baseColor, baseColor, baseColor];
    }
  };

  return (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors(color)}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={28} color="#ffffff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.quickActionLabel}>{label}</Text>
          {description && (
            <Text style={styles.quickActionDescription}>{description}</Text>
          )}
        </View>
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color="rgba(255, 255, 255, 0.7)"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  quickActionButton: {
    width: "100%",
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  gradientContainer: {
    padding: spacing.lg,
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: spacing.xs,
    textAlign: "right",
  },
  quickActionDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
    lineHeight: 20,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default QuickActionButton;
