import InAppNotificationBanner from "@/components/InAppNotificationBanner";
import { theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/src/auth/AuthContext";
import { InAppNotificationProvider } from "@/src/notifications/InAppNotificationContext";
import {
  isExpoGo,
  notificationMode,
} from "@/src/notifications/notificationMode";
import { useNotificationResponseHandler } from "@/src/notifications/useNotificationResponseHandler";
import { usePushNotificationSetup } from "@/src/notifications/usePushNotificationSetup";
import { useAlertPollingWatcher } from "@/src/realtime/useAlertPollingWatcher";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InAppNotificationProvider>
            <AuthNavigationGuard />
            {!isExpoGo && notificationMode !== "off" && (
              <NotificationResponseHandler />
            )}
            {notificationMode === "local-polling" && <AlertPollingWatcher />}
            {notificationMode === "push" && <PushNotificationSetup />}
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="account"
                options={{
                  title: "Thông tin tài khoản",
                  headerBackVisible: false,
                  headerLeft: () => <BackButton />,
                }}
              />
              <Stack.Screen
                name="account/edit"
                options={{
                  title: "Chỉnh sửa hồ sơ",
                  headerBackVisible: false,
                  headerLeft: () => <BackButton />,
                }}
              />
              <Stack.Screen
                name="account/change-password"
                options={{
                  title: "Đổi mật khẩu",
                  headerBackVisible: false,
                  headerLeft: () => <BackButton />,
                }}
              />
              <Stack.Screen
                name="alerts/[id]"
                options={{
                  title: "Chi tiết cảnh báo",
                  headerBackVisible: false,
                  headerLeft: () => <BackButton />,
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
            <InAppNotificationBanner />
          </InAppNotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function NotificationResponseHandler() {
  useNotificationResponseHandler();

  return null;
}

function AlertPollingWatcher() {
  useAlertPollingWatcher();

  return null;
}

function PushNotificationSetup() {
  usePushNotificationSetup();

  return null;
}

function AuthNavigationGuard() {
  const pathname = usePathname();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    const isAuthRoute = pathname === "/" || pathname === "/login";

    if (isAuthenticated && isAuthRoute) {
      router.replace("/(tabs)/dashboard");
      return;
    }

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoadingAuth, pathname]);

  return null;
}

function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      hitSlop={8}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
      onPress={() => router.back()}
    >
      <MaterialCommunityIcons
        name="chevron-left"
        size={24}
        color={theme.colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonPressed: {
    opacity: 0.72,
  },
});
