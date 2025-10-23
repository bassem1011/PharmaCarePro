import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const AnimatedButton = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  children,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    switch (variant) {
      case "primary":
        baseStyle.push(styles.primary);
        break;
      case "secondary":
        baseStyle.push(styles.secondary);
        break;
      case "danger":
        baseStyle.push(styles.danger);
        break;
      default:
        baseStyle.push(styles.primary);
    }

    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];

    switch (variant) {
      case "primary":
        baseStyle.push(styles.primaryText);
        break;
      case "secondary":
        baseStyle.push(styles.secondaryText);
        break;
      case "danger":
        baseStyle.push(styles.dangerText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }

    if (disabled) {
      baseStyle.push(styles.disabledText);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "secondary" ? "#007bff" : "#ffffff"}
        />
      ) : children ? (
        children
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  primary: {
    backgroundColor: "#3b82f6",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  danger: {
    backgroundColor: "#ef4444",
  },
  disabled: {
    backgroundColor: "#e5e7eb",
    borderColor: "#e5e7eb",
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  text: {
    fontWeight: "600",
  },
  primaryText: {
    color: "#ffffff",
  },
  secondaryText: {
    color: "#3b82f6",
  },
  dangerText: {
    color: "#ffffff",
  },
  disabledText: {
    color: "#9ca3af",
  },
});

export default AnimatedButton;
