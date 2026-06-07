import Card from "@/components/Card";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import { type NormalizedApiError } from "@/src/api/http";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DEMO_EMAIL = "user@example.com";
const DEMO_PASSWORD = "password123";

const getLoginErrorMessage = (error: unknown) => {
  const apiError = error as Partial<NormalizedApiError>;

  if (apiError.status === 401 || apiError.code === "invalid_credentials") {
    return apiError.message || "Email hoặc mật khẩu không đúng.";
  }

  if (apiError.status === 422 || apiError.code === "validation_error") {
    return apiError.message || "Thông tin đăng nhập chưa hợp lệ.";
  }

  return apiError.message || "Không thể đăng nhập. Vui lòng thử lại.";
};

export default function LoginScreen() {
  const { isAuthenticated, isLoadingAuth, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      router.replace("/(tabs)/dashboard" as Href);
    }
  }, [isAuthenticated, isLoadingAuth]);

  const handleFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setSubmitting(true);
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace("/(tabs)/dashboard" as Href);
    } catch (error) {
      Alert.alert("Đăng nhập thất bại", getLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.eyebrow}>NAVICAID ACCESS</Text>
            <Text style={styles.title}>Đăng nhập tài khoản</Text>
            <Text style={styles.subtitle}>
              Đăng nhập bằng tài khoản người dùng NavicAid để theo dõi thiết bị,
              vị trí và cảnh báo an toàn.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.demoBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoTitle}>Dữ liệu test nhanh</Text>
                <Text style={styles.demoText}>
                  {DEMO_EMAIL} / {DEMO_PASSWORD}
                </Text>
              </View>
              <Pressable style={styles.demoButton} onPress={handleFillDemo}>
                <Text style={styles.demoButtonText}>Điền mẫu</Text>
              </Pressable>
            </View>

            <FieldLabel icon="email-outline" label="Email" />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="user@example.com"
              placeholderTextColor={theme.colors.subText}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <FieldLabel icon="lock-outline" label="Mật khẩu" />
            <View style={styles.passwordWrap}>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Nhập mật khẩu"
                placeholderTextColor={theme.colors.subText}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword((value) => !value)}>
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.subText}
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </Pressable>

            <View style={styles.deviceNotice}>
              <MaterialCommunityIcons
                name="walk"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.deviceNoticeText}>
                Tài khoản người dùng NavicAid được liên kết với thiết bị để đồng
                bộ cảnh báo và trạng thái an toàn.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FieldLabel({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
}) {
  return (
    <View style={styles.labelRow}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.primary} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F3F8FF",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: theme.spacing(2),
    paddingVertical: theme.spacing(2),
  },
  hero: {
    gap: 10,
  },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.primary}18`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.subText,
    fontSize: 14,
    lineHeight: 21,
  },
  formCard: {
    gap: theme.spacing(1.5),
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#CFE0FF",
  },
  demoTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  demoText: {
    color: theme.colors.subText,
    fontSize: 12,
    marginTop: 2,
  },
  demoButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  demoButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: -4,
  },
  labelText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: "#FFFFFF",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  deviceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#DDEAFF",
  },
  deviceNoticeText: {
    flex: 1,
    color: theme.colors.subText,
    fontSize: 13,
    lineHeight: 19,
  },
});
