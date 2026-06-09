import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";
import {
  changeMobilePassword,
  type ChangeMobilePasswordInput,
} from "@/src/api/authService";
import { type NormalizedApiError } from "@/src/api/http";
import { useAuth } from "@/src/auth/AuthContext";
import { clearTokens } from "@/src/auth/tokenStorage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
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

type PasswordField = "currentPassword" | "newPassword" | "confirmNewPassword";

type FormErrors = Partial<Record<PasswordField | "server", string>>;

export default function ChangePasswordScreen() {
  const { isLoadingAuth, setUser, userId } = useAuth();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [visibleFields, setVisibleFields] = useState<PasswordField[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const payload: ChangeMobilePasswordInput = {
      current_password: currentPassword,
      new_password: newPassword,
    };
    const validationErrors = validatePasswords(
      payload,
      confirmNewPassword,
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      await changeMobilePassword(payload);
      await clearTokens();
      setUser(null);
      queryClient.clear();
      router.replace("/login");
      Alert.alert(
        "Đổi mật khẩu thành công",
        "Đổi mật khẩu thành công, vui lòng đăng nhập lại.",
      );
    } catch (error) {
      setErrors({
        server: getChangePasswordErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (
    field: PasswordField,
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      server: undefined,
    }));
  };

  const toggleVisibility = (field: PasswordField) => {
    setVisibleFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  };

  if (isLoadingAuth) {
    return (
      <Screen>
        <EmptyState
          title="Đang kiểm tra phiên đăng nhập..."
          desc="Vui lòng chờ trong giây lát."
        />
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <EmptyState
          title="Chưa có phiên đăng nhập"
          desc="Vui lòng đăng nhập để đổi mật khẩu."
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.noticeCard}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Bảo vệ tài khoản</Text>
              <Text style={styles.noticeText}>
                Sau khi đổi mật khẩu, bạn sẽ được đăng xuất và cần đăng nhập lại.
              </Text>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <PasswordInput
              error={errors.currentPassword}
              isVisible={visibleFields.includes("currentPassword")}
              label="Mật khẩu hiện tại"
              onChangeText={(value) =>
                updateField("currentPassword", setCurrentPassword, value)
              }
              onToggleVisibility={() => toggleVisibility("currentPassword")}
              value={currentPassword}
            />
            <PasswordInput
              error={errors.newPassword}
              isVisible={visibleFields.includes("newPassword")}
              label="Mật khẩu mới"
              onChangeText={(value) =>
                updateField("newPassword", setNewPassword, value)
              }
              onToggleVisibility={() => toggleVisibility("newPassword")}
              value={newPassword}
            />
            <PasswordInput
              error={errors.confirmNewPassword}
              isVisible={visibleFields.includes("confirmNewPassword")}
              label="Xác nhận mật khẩu mới"
              onChangeText={(value) =>
                updateField(
                  "confirmNewPassword",
                  setConfirmNewPassword,
                  value,
                )
              }
              onToggleVisibility={() =>
                toggleVisibility("confirmNewPassword")
              }
              value={confirmNewPassword}
            />

            {errors.server && (
              <View style={styles.serverError}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.danger}
                />
                <Text style={styles.serverErrorText}>{errors.server}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || isSubmitting) && styles.submitButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons
                name="lock-reset"
                size={19}
                color={theme.colors.background}
              />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PasswordInput({
  error,
  isVisible,
  label,
  onChangeText,
  onToggleVisibility,
  value,
}: {
  error?: string;
  isVisible: boolean;
  label: string;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError]}>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={onChangeText}
          placeholder={`Nhập ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.subText}
          secureTextEntry={!isVisible}
          style={styles.input}
          value={value}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          hitSlop={8}
          onPress={onToggleVisibility}
        >
          <MaterialCommunityIcons
            name={isVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme.colors.subText}
          />
        </Pressable>
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function validatePasswords(
  input: ChangeMobilePasswordInput,
  confirmNewPassword: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!input.current_password) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (input.new_password.length < 8) {
    errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự.";
  }

  if (!confirmNewPassword) {
    errors.confirmNewPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (confirmNewPassword !== input.new_password) {
    errors.confirmNewPassword = "Mật khẩu xác nhận không khớp.";
  }

  return errors;
}

function getChangePasswordErrorMessage(error: unknown) {
  const apiError = error as Partial<NormalizedApiError>;

  if (apiError.status === 400) {
    return apiError.message || "Mật khẩu hiện tại không đúng.";
  }

  if (apiError.status === 401) {
    return apiError.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (apiError.status === 422 || apiError.code === "validation_error") {
    return apiError.message || "Mật khẩu mới chưa đáp ứng yêu cầu.";
  }

  return apiError.message || "Không thể đổi mật khẩu. Vui lòng thử lại.";
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: "#F3F8FF",
  },
  content: {
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    backgroundColor: "#F4F8FF",
    borderColor: "#CFE0FF",
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  noticeText: {
    color: theme.colors.subText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  formCard: {
    gap: theme.spacing(2),
  },
  field: {
    gap: 7,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  inputWrap: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  fieldError: {
    color: theme.colors.danger,
    fontSize: 11,
  },
  serverError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.danger}10`,
    borderWidth: 1,
    borderColor: `${theme.colors.danger}35`,
  },
  serverErrorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: "900",
  },
});
