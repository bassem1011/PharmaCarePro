import React from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, shadows, spacing } from "../../utils/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ProgressBar = ({ progress = 0, barColor = colors.blue }) => {
  const width = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${width}%`, backgroundColor: barColor },
        ]}
      />
    </View>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color = colors.blue,
  animatedValue,
  subtitle,
  delta, // number or string
  deltaPositive, // boolean to force color
  progress, // 0..100
  progressColor,
}) => {
  const showDelta = delta !== undefined && delta !== null && delta !== "";
  const deltaNumber = typeof delta === "number" ? delta : null;
  const isPositive =
    deltaPositive ?? (deltaNumber !== null ? deltaNumber >= 0 : true);
  const deltaColor = isPositive ? colors.green : colors.red;

  // Get gradient colors based on the main color
  const getGradientColors = (mainColor) => {
    switch (mainColor) {
      case colors.blue:
        return ["#06b6d4", "#0891b2"]; // Vibrant cyan
      case colors.green:
        return ["#10b981", "#059669"]; // Emerald
      case colors.red:
        return ["#f43f5e", "#e11d48"]; // Rose
      case colors.yellow:
        return ["#f59e0b", "#d97706"]; // Amber
      case colors.purple:
        return ["#8b5cf6", "#7c3aed"]; // Violet
      case colors.brandStart:
        return ["#8b5cf6", "#7c3aed"]; // Brand purple
      case "#06b6d4": // Cyan
        return ["#06b6d4", "#0891b2"];
      case "#f59e0b": // Amber
        return ["#f59e0b", "#d97706"];
      case "#10b981": // Emerald
        return ["#10b981", "#059669"];
      case "#f43f5e": // Rose
        return ["#f43f5e", "#e11d48"];
      case "#8b5cf6": // Violet
        return ["#8b5cf6", "#7c3aed"];
      case "#3b82f6": // Blue
        return ["#3b82f6", "#1d4ed8"];
      default:
        return ["#6366f1", "#4f46e5"]; // Indigo default
    }
  };

  const gradientColors = getGradientColors(color);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        animatedValue && {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCard}
      >
        {/* Decorative background pattern */}
        <View style={styles.backgroundPattern}>
          <MaterialCommunityIcons
            name={icon}
            size={80}
            color="rgba(255,255,255,0.1)"
            style={styles.backgroundIcon}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconBackground}>
                <MaterialCommunityIcons name={icon} size={24} color="#ffffff" />
              </View>
            </View>
            {showDelta && (
              <View style={styles.deltaPill}>
                <MaterialCommunityIcons
                  name={isPositive ? "trending-up" : "trending-down"}
                  size={16}
                  color="#ffffff"
                />
                <Text style={styles.deltaText}>
                  {typeof delta === "number"
                    ? `${isPositive ? "+" : ""}${delta}`
                    : String(delta)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statContent}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            {subtitle ? (
              <Text style={styles.statSubtitle}>{subtitle}</Text>
            ) : null}
          </View>

          {progress !== undefined && progress !== null ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(0, Math.min(100, progress))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          ) : null}
        </View>

        {/* Shine effect overlay */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.3)",
            "transparent",
            "rgba(255,255,255,0.1)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shineOverlay}
        />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%",
    marginBottom: spacing.md,
    minHeight: 120,
    maxWidth: "48%",
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "48%",
  },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  backgroundPattern: {
    position: "absolute",
    top: -20,
    right: -20,
    opacity: 0.1,
  },
  backgroundIcon: {
    transform: [{ rotate: "15deg" }],
  },
  cardContent: {
    position: "relative",
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconWrapper: {
    position: "relative",
  },
  iconBackground: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    gap: spacing.xs,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  statContent: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: spacing.xs,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  statSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    minWidth: 35,
    textAlign: "right",
  },
  shineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.xl,
  },
  // Keep old progress styles for backward compatibility
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
});

export default StatCard;
