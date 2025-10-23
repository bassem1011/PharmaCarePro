import React, { useState, useEffect } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/MainNavigator";
import LoadingScreen from "./src/screens/LoadingScreen";
import EnhancedSplashScreen from "./src/components/common/EnhancedSplashScreen";
import { I18nManager, Text, TextInput } from "react-native";
import { colors } from "./src/utils/theme";
import { useAuth } from "./src/hooks/useAuth";
import {
  useFonts,
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from "@expo-google-fonts/cairo";

// Force RTL layout for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function App() {
  const { loading, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  // Apply Cairo as global default font when loaded
  useEffect(() => {
    if (!fontsLoaded) return;
    if (Text?.defaultProps == null) Text.defaultProps = {};
    if (Text.defaultProps.style == null) Text.defaultProps.style = {};
    Text.defaultProps.style.fontFamily = "Cairo_400Regular";
    Text.defaultProps.style.textAlign = "right";
    Text.defaultProps.style.writingDirection = "rtl";

    if (TextInput?.defaultProps == null) TextInput.defaultProps = {};
    if (TextInput.defaultProps.style == null) TextInput.defaultProps.style = {};
    TextInput.defaultProps.style.fontFamily = "Cairo_400Regular";
    TextInput.defaultProps.style.textAlign = "right";
    TextInput.defaultProps.style.writingDirection = "rtl";
  }, [fontsLoaded]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: colors.bg,
              card: colors.surface,
              primary: colors.brandStart,
              text: colors.textPrimary,
              border: "#374151",
              notification: colors.brandEnd,
            },
          }}
        >
          <EnhancedSplashScreen
            onFinish={handleSplashFinish}
            isLoggedIn={!!user}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.bg,
            card: colors.surface,
            primary: colors.brandStart,
            text: colors.textPrimary,
            border: "#374151",
            notification: colors.brandEnd,
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
