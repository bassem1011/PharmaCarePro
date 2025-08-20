import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { registerUser } from "../../services/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radii, shadows } from "../../utils/theme";
// import AnimatedButton from "../../components/common/AnimatedButton";

const SignUpScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("خطأ", "يرجى إدخال الاسم الكامل");
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني");
      return;
    }

    if (!formData.password) {
      Alert.alert("خطأ", "يرجى إدخال كلمة المرور");
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("خطأ", "كلمة المرور غير متطابقة");
      return;
    }

    try {
      setLoading(true);

      // Use the registerUser function from authService (matches web version)
      const result = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result.success) {
        Alert.alert("نجح", "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.", [
          {
            text: "حسناً",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      } else {
        Alert.alert("خطأ", result.error || "حدث خطأ أثناء إنشاء الحساب");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "البريد الإلكتروني مستخدم بالفعل";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "البريد الإلكتروني غير صحيح";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "كلمة المرور ضعيفة جداً";
      }

      Alert.alert("خطأ", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={gradients.brand} style={styles.gradient}>
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Logo and Title */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.emojiHero}>💊</Text>
              </View>
              <Text style={styles.appTitle}>فارماكير برو</Text>
              <Text style={styles.appSubtitle}>نظام إدارة الصيدليات</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>إنشاء حساب جديد</Text>
              <Text style={styles.formSubtitle}>
                أدخل بياناتك لإنشاء حساب جديد
              </Text>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الاسم الكامل</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="account"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="أدخل اسمك الكامل"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="email"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="أدخل بريدك الإلكتروني"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    placeholder="أدخل كلمة المرور"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-check"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      setFormData({ ...formData, confirmPassword: text })
                    }
                    placeholder="أعد إدخال كلمة المرور"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Up Button */}
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signUpGradient}
              >
                <TouchableOpacity
                  style={[
                    styles.signUpButton,
                    loading && styles.signUpButtonDisabled,
                  ]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <Text style={styles.signUpButtonText}>
                    {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
                <TouchableOpacity onPress={handleGoToLogin}>
                  <Text style={styles.loginLink}>تسجيل الدخول</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    ...shadows.glowBrand,
  },
  emojiHero: { fontSize: 44, color: "#fff" },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
    textAlign: "right",
  },
  eyeButton: {
    padding: 4,
  },
  signUpGradient: {
    borderRadius: radii.lg,
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: radii.lg,
    backgroundColor: "transparent",
    shadowColor: colors.brandStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginRight: 8,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textDecorationLine: "underline",
  },
});

export default SignUpScreen;
