import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii } from "../utils/theme";
import { useAuth } from "../hooks/useAuth";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import LoadingScreen from "../screens/LoadingScreen";
import LeadDashboardScreen from "../screens/LeadDashboardScreen";
import PharmaciesScreen from "../screens/PharmaciesScreen";
import PharmacyDetailsScreen from "../screens/PharmacyDetailsScreen";
import PharmacistsScreen from "../screens/PharmacistsScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ReportsScreen from "../screens/ReportsScreen";
import CustomPagesScreen from "../screens/CustomPagesScreen";
import DispenseScreen from "../screens/DispenseScreen";
import IncomingScreen from "../screens/IncomingScreen";
import StockScreen from "../screens/StockScreen";
import ShortagesScreen from "../screens/ShortagesScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Removed under-icon indicator to avoid overlapping labels

// Lead Pharmacist Tabs
const LeadTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "LeadDashboard") {
            iconName = focused ? "view-dashboard" : "view-dashboard-outline";
          } else if (route.name === "Pharmacies") {
            iconName = focused ? "store" : "store-outline";
          } else if (route.name === "Pharmacists") {
            iconName = focused ? "account-group" : "account-group-outline";
          } else if (route.name === "Attendance") {
            iconName = focused ? "calendar-check" : "calendar-check-outline";
          }

          return (
            <>
              <MaterialCommunityIcons
                name={iconName}
                size={size}
                color={focused ? colors.brandStart : color}
              />
              {/* No extra indicator */}
            </>
          );
        },
        tabBarActiveTintColor: colors.brandStart,
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: ({ insets }) => ({
          backgroundColor: colors.surface,
          borderTopColor: "#374151",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 12 + (insets?.bottom || 0),
          paddingTop: 8,
          paddingHorizontal: 16,
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 8 + (insets?.bottom || 0),
          borderRadius: radii.lg,
        }),
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="LeadDashboard"
        component={LeadDashboardScreen}
        options={{
          tabBarLabel: "الرئيسية",
        }}
      />
      <Tab.Screen
        name="Pharmacies"
        component={PharmaciesScreen}
        options={{
          tabBarLabel: "الصيدليات",
        }}
      />
      <Tab.Screen
        name="Pharmacists"
        component={PharmacistsScreen}
        options={{
          tabBarLabel: "الصيادلة",
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: "الحضور",
        }}
      />
    </Tab.Navigator>
  );
};

// Pharmacist Tabs
const PharmacistTabs = () => {
  const { user } = useAuth();
  const isSenior = user?.role === "senior";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "PharmacistDashboard") {
            iconName = focused ? "view-dashboard" : "view-dashboard-outline";
          } else if (route.name === "Attendance") {
            iconName = focused ? "calendar-check" : "calendar-check-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "account" : "account-outline";
          }

          return (
            <>
              <MaterialCommunityIcons
                name={iconName}
                size={size}
                color={focused ? colors.brandStart : color}
              />
              {/* No extra indicator */}
            </>
          );
        },
        tabBarActiveTintColor: colors.brandStart,
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: ({ insets }) => ({
          backgroundColor: colors.surface,
          borderTopColor: "#374151",
          borderTopWidth: 1,
          height: 92,
          paddingBottom: 16 + (insets?.bottom || 0),
          paddingTop: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 8 + (insets?.bottom || 0),
          borderRadius: radii.lg,
        }),
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="PharmacistDashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "الرئيسية",
        }}
      />
      {isSenior && (
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{
            tabBarLabel: "الحضور",
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        // Main app screens
        <>
          {user.role === "lead" ? (
            <>
              <Stack.Screen name="LeadTabs" component={LeadTabs} />
              <Stack.Screen name="Reports" component={ReportsScreen} />
              <Stack.Screen
                name="PharmacyDetails"
                component={PharmacyDetailsScreen}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="PharmacistTabs" component={PharmacistTabs} />
              <Stack.Screen name="Dispense" component={DispenseScreen} />
              <Stack.Screen name="Incoming" component={IncomingScreen} />
              <Stack.Screen name="Stock" component={StockScreen} />
              <Stack.Screen name="Shortages" component={ShortagesScreen} />
              <Stack.Screen name="Reports" component={ReportsScreen} />
              <Stack.Screen name="CustomPages" component={CustomPagesScreen} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
