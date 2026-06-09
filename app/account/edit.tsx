import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";
import {
  updateMobileMe,
  type MobileUser,
  type UpdateMobileMeInput,
} from "@/src/api/authService";
import { type NormalizedApiError } from "@/src/api/http";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const PHONE_PATTERN = /^[0-9+().\s-]{7,20}$/;

type FormErrors = {
  fullName?: string;
  phone?: string;
  server?: string;
};

export default function EditAccountScreen() {
  const { isLoadingAuth, setUser, user, userId } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.full_name ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const handleSubmit = async () => {
    const payload: UpdateMobileMeInput = {
      full_name: fullName.trim(),
      phone: phone.trim(),
    };
    const validationErrors = validateProfile(payload);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const updatedUser = await updateMobileMe(payload);
      setUser(updatedUser);
      queryClient.setQueryData<MobileUser>(
        ["mobile-me", updatedUser.id],
        updatedUser,
      );
      router.back();
    } catch (error) {
      setErrors({
        server: getUpdateErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <Screen>
        <EmptyState
          title="Đang tải hồ sơ..."
          desc="Vui lòng chờ trong giây lát."
        />
      </Screen>
    );
  }

  if (!userId || !user) {
    return (
      <Screen>
        <EmptyState
          title="Không có dữ liệu tài khoản"
          desc="Vui lòng đăng nhập lại để chỉnh sửa hồ sơ."
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
              name="account-edit-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Thông tin hồ sơ</Text>
              <Text style={styles.noticeText}>
                Bạn có thể cập nhật họ tên và số điện thoại của tài khoản.
              </Text>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <FormField
              error={errors.fullName}
              icon="account-outline"
              label="Họ và tên"
            >
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                editable={!isSubmitting}
                maxLength={120}
                onChangeText={(value) => {
                  setFullName(value);
                  setErrors((current) => ({
                    ...current,
                    fullName: undefined,
                    server: undefined,
                  }));
                }}
                placeholder="Nhập họ và tên"
                placeholderTextColor={theme.colors.subText}
                style={[styles.input, errors.fullName && styles.inputError]}
                value={fullName}
              />
            </FormField>

            <FormField
              error={errors.phone}
              icon="phone-outline"
              label="Số điện thoại (không bắt buộc)"
            >
              <TextInput
                autoComplete="tel"
                editable={!isSubmitting}
                keyboardType="phone-pad"
                maxLength={20}
                onChangeText={(value) => {
                  setPhone(value);
                  setErrors((current) => ({
                    ...current,
                    phone: undefined,
                    server: undefined,
                  }));
                }}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={theme.colors.subText}
                style={[styles.input, errors.phone && styles.inputError]}
                value={phone}
              />
            </FormField>

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
                name="content-save-outline"
                size={18}
                color={theme.colors.background}
              />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FormField({
  children,
  error,
  icon,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={theme.colors.primary}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function validateProfile(input: UpdateMobileMeInput): FormErrors {
  const errors: FormErrors = {};

  if (!input.full_name) {
    errors.fullName = "Vui lòng nhập họ và tên.";
  }

  if (input.phone && !PHONE_PATTERN.test(input.phone)) {
    errors.phone = "Số điện thoại chưa đúng định dạng.";
  }

  return errors;
}

function getUpdateErrorMessage(error: unknown) {
  const apiError = error as Partial<NormalizedApiError>;

  if (apiError.status === 422 || apiError.code === "validation_error") {
    return apiError.message || "Thông tin hồ sơ chưa hợp lệ.";
  }

  if (apiError.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  return apiError.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
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
