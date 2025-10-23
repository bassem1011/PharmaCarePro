import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const useDashboardAnimations = (loading) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(chartAnim, {
          toValue: 1,
          duration: 1200,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim, chartAnim]);

  return {
    fadeAnim,
    slideAnim,
    chartAnim,
  };
};
