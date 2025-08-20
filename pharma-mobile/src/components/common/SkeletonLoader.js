import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

const SkeletonLoader = ({ variant = "card", height = 60, width = "100%" }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getVariantStyle = () => {
    switch (variant) {
      case "card":
        return styles.card;
      case "list-item":
        return styles.listItem;
      default:
        return styles.card;
    }
  };

  return (
    <Animated.View
      style={[styles.skeleton, getVariantStyle(), { height, width, opacity }]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default SkeletonLoader;
