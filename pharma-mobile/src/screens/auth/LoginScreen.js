import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  loginLeadPharmacist,
  loginPharmacist,
  initializeDefaultPharmacy,
} from "../../services/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radii, shadows } from "../../utils/theme";
import AnimatedButton from "../../components/common/AnimatedButton";
import { useAuth } from "../../hooks/useAuth";

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { refreshUserData, triggerAuthCheck } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState("email"); // "email" or "username"

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      let result;
      if (loginType === "email") {
        // Lead login (email/password via Firebase Auth)
        if (!formData.email || !formData.password) {
          setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
          setLoading(false);
          return;
        }

        result = await loginLeadPharmacist(formData.email, formData.password);

        // Initialize default pharmacy after successful authentication
        if (result.success) {
          const initResult = await initializeDefaultPharmacy();
        }
      } else {
        // Pharmacist login (username/password via Firestore)
        if (!formData.username || !formData.password) {
          setError("يرجى إدخال اسم المستخدم وكلمة المرور");
          setLoading(false);
          return;
        }

        result = await loginPharmacist(formData.username, formData.password);
      }

      if (result.success) {
        // Clear form data on successful login
        setFormData({
          email: "",
          username: "",
          password: "",
        });

        // Trigger authentication check to update the global state
        // This is especially important for regular/senior pharmacists who use AsyncStorage
        triggerAuthCheck();

        // Let the global auth hook update `user` and MainNavigator will switch stacks automatically
        // No need to call refreshUserData or navigate manually
      } else {
        setError(result.error || "فشل تسجيل الدخول. تحقق من البيانات.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("خطأ في تسجيل الدخول. تحقق من اتصال الإنترنت.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError("");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={gradients.brand} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.emojiHero}>💊</Text>
            </View>
            <Text style={styles.title}>فارماكير برو</Text>
            <Text style={styles.subtitle}>نظام إدارة الصيدليات المتقدم</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>تسجيل الدخول</Text>

              {/* Login Type Selector */}
              <View style={styles.loginTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.loginTypeButton,
                    loginType === "email" && styles.loginTypeButtonActive,
                  ]}
                  onPress={() => setLoginType("email")}
                >
                  <MaterialCommunityIcons
                    name="account-supervisor"
                    size={24}
                    color={
                      loginType === "email" ? "#ffffff" : colors.brandStart
                    }
                  />
                  <Text
                    style={[
                      styles.loginTypeText,
                      loginType === "email" && styles.loginTypeTextActive,
                    ]}
                  >
                    مسؤول
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.loginTypeButton,
                    loginType === "username" && styles.loginTypeButtonActive,
                  ]}
                  onPress={() => setLoginType("username")}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color={
                      loginType === "username" ? "#ffffff" : colors.brandStart
                    }
                  />
                  <Text
                    style={[
                      styles.loginTypeText,
                      loginType === "username" && styles.loginTypeTextActive,
                    ]}
                  >
                    صيدلي
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={20}
                    color="#ef4444"
                  />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={clearError}>
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color="#ef4444"
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Login Form Fields */}
              {loginType === "email" ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>البريد الإلكتروني</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="email"
                      size={20}
                      color="#8b5cf6"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => handleInputChange("email", text)}
                      placeholder="أدخل بريدك الإلكتروني"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>اسم المستخدم</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color="#8b5cf6"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.username}
                      onChangeText={(text) =>
                        handleInputChange("username", text)
                      }
                      placeholder="أدخل اسم المستخدم"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>كلمة المرور</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color="#8b5cf6"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange("password", text)}
                    placeholder="أدخل كلمة المرور"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButtonGradient}
              >
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <MaterialCommunityIcons
                        name="loading"
                        size={20}
                        color="#ffffff"
                        style={styles.spinning}
                      />
                      <Text style={styles.loginButtonText}>
                        جاري تسجيل الدخول...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>دخول</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>

              {/* Sign Up Button (secondary) */}
              <AnimatedButton
                title="إنشاء حساب مسؤول جديد"
                variant="secondary"
                size="large"
                onPress={() => navigation.navigate("SignUp")}
                style={{
                  borderRadius: radii.lg,
                  borderColor: colors.brandStart,
                  borderWidth: 1,
                  marginTop: 4,
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    ...shadows.glowBrand,
  },
  emojiHero: { fontSize: 64, color: "#fff" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  loginTypeContainer: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: radii.lg,
    padding: 4,
  },
  loginTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
  },
  loginTypeButtonActive: {
    backgroundColor: colors.brandStart,
  },
  loginTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brandStart,
    marginRight: 8,
  },
  loginTypeTextActive: {
    color: "#ffffff",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.3)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    color: "#ef4444",
    fontSize: 14,
    marginRight: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
    paddingVertical: 16,
    textAlign: "right",
  },
  passwordToggle: {
    padding: 4,
  },
  loginButtonGradient: {
    borderRadius: radii.lg,
  },
  loginButton: {
    backgroundColor: "transparent",
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: colors.brandStart,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: "#6b7280",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b5cf6",
  },
});

export default LoginScreen;
