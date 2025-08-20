import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomLogo from "./CustomLogo";
import { colors, gradients, radii, shadows } from "../../utils/theme";

const { width, height } = Dimensions.get("window");

const EnhancedSplashScreen = ({ onFinish, isLoggedIn }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonSlideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const startAnimations = async () => {
      // Initial fade in
      await new Promise((resolve) => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Logo entrance animation
      await new Promise((resolve) => {
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Text slide in
      await new Promise((resolve) => {
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start(resolve);
      });

      // Show content after animations
      setShowContent(true);

      // Button slide in
      await new Promise((resolve) => {
        Animated.spring(buttonSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start(resolve);
      });
    };

    startAnimations();

    // Gentle floating loops to mirror landing page particles
    const loopFloating = (anim, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

    loopFloating(floatAnim1, 0);
    loopFloating(floatAnim2, 300);
    loopFloating(floatAnim3, 600);
  }, []);

  const handleGetStarted = () => {
    // Always call onFinish to close splash screen
    // The App.js will handle navigation based on login status
    onFinish && onFinish();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={gradients.brand}
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
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <Text style={styles.emojiHero}>💊</Text>
            </View>
          </Animated.View>

          {/* App Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            <Text style={styles.appName}>فارماكير برو</Text>
            <Text style={styles.appSubtitle}>نظام إدارة الصيدليات المتقدم</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View
            style={[
              styles.descriptionContainer,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            <Text style={styles.description}>
              نظام إدارة صيدليات احترافي متطور يوفر جميع الأدوات اللازمة لإدارة
              المخزون والتقارير والمبيعات
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View
            style={[
              styles.featuresContainer,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.featureText}>تقارير متقدمة</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="sync"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.featureText}>مزامنة فورية</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="shield-check"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.featureText}>أمان متقدم</Text>
            </View>
          </Animated.View>

          {/* Get Started Button */}
          {showContent && (
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  transform: [{ translateY: buttonSlideAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.getStartedGradient}
              >
                <TouchableOpacity
                  style={styles.getStartedButton}
                  onPress={handleGetStarted}
                >
                  <Text style={styles.getStartedText}>
                    {isLoggedIn ? "الذهاب للوحة التحكم" : "ابدأ مجاناً الآن"}
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={20}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>v2.0.0 Professional</Text>
            <Text style={styles.copyrightText}>
              © 2024 فارماكير برو. جميع الحقوق محفوظة.
            </Text>
          </View>
        </View>

        {/* Floating Elements */}
        <Animated.View
          style={[
            styles.floatingElement,
            styles.floating1,
            {
              transform: [
                {
                  translateY: floatAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 6],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="pill"
            size={24}
            color="rgba(255,255,255,0.3)"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.floating2,
            {
              transform: [
                {
                  translateY: floatAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-5, 5],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="medical-bag"
            size={20}
            color="rgba(255,255,255,0.25)"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.floating3,
            {
              transform: [
                {
                  translateY: floatAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-7, 7],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="heart-pulse"
            size={18}
            color="rgba(255,255,255,0.2)"
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
    flex: 1,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    ...shadows.glowBrand,
  },
  emojiHero: { fontSize: 64, color: "#fff" },
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
  descriptionContainer: {
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minWidth: 80,
  },
  featureText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  getStartedGradient: {
    borderRadius: radii.lg,
  },
  getStartedButton: {
    backgroundColor: "transparent",
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.brandStart,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  versionContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
    fontWeight: "500",
  },
  copyrightText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  floatingElement: {
    position: "absolute",
    opacity: 0.7,
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

export default EnhancedSplashScreen;
