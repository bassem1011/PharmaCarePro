import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start the splash screen animation sequence
    const animationSequence = async () => {
      // Initial fade in
      await new Promise((resolve) => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Logo scale animation
      await new Promise((resolve) => {
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Text fade in
      await new Promise((resolve) => {
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress bar animation
      await new Promise((resolve) => {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }).start(resolve);
      });

      // Final scale animation
      await new Promise((resolve) => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Fade out and finish
      await new Promise((resolve) => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Call onFinish callback
      onFinish && onFinish();
    };

    animationSequence();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.patternContainer}>
          {[...Array(20)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.patternDot,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  opacity: 0.1 + Math.random() * 0.2,
                },
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <View style={styles.logoBackground}>
              <MaterialCommunityIcons
                name="pharmacy"
                size={60}
                color="#ffffff"
              />
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[styles.titleContainer, { opacity: textFadeAnim }]}
          >
            <Text style={styles.appName}>PharmaCare</Text>
            <Text style={styles.appSubtitle}>نظام إدارة الصيدليات</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[styles.taglineContainer, { opacity: textFadeAnim }]}
          >
            <Text style={styles.tagline}>Professional Pharmacy Management</Text>
            <Text style={styles.taglineArabic}>إدارة صيدليات احترافية</Text>
          </Animated.View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>

          {/* Version Info */}
          <Animated.View
            style={[styles.versionContainer, { opacity: textFadeAnim }]}
          >
            <Text style={styles.versionText}>v2.0.0</Text>
            <Text style={styles.copyrightText}>
              © 2024 PharmaCare. All rights reserved.
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Floating Elements */}
        <Animated.View style={[styles.floatingElement, styles.floating1]}>
          <MaterialCommunityIcons
            name="pill"
            size={24}
            color="rgba(255,255,255,0.3)"
          />
        </Animated.View>
        <Animated.View style={[styles.floatingElement, styles.floating2]}>
          <MaterialCommunityIcons
            name="medical-bag"
            size={20}
            color="rgba(255,255,255,0.2)"
          />
        </Animated.View>
        <Animated.View style={[styles.floatingElement, styles.floating3]}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={18}
            color="rgba(255,255,255,0.25)"
          />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  patternContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  patternDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  taglineContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "400",
  },
  taglineArabic: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontWeight: "400",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  progressBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  floatingElement: {
    position: "absolute",
    opacity: 0.6,
  },
  floating1: {
    top: "20%",
    right: "15%",
  },
  floating2: {
    top: "60%",
    left: "10%",
  },
  floating3: {
    bottom: "30%",
    right: "20%",
  },
});

export default SplashScreen;
