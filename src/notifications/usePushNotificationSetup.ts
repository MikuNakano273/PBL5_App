import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { registerMobilePushToken } from "@/src/api/notificationService";
import { useAuth } from "@/src/auth/AuthContext";

const ANDROID_NOTIFICATION_CHANNEL_ID = "default";

export function usePushNotificationSetup() {
  const { userId } = useAuth();

  useEffect(() => {
    const platform = Platform.OS;

    if (!userId || (platform !== "android" && platform !== "ios")) {
      return;
    }

    let isActive = true;

    const registerPushToken = async () => {
      try {
        if (platform === "android") {
          await Notifications.setNotificationChannelAsync(
            ANDROID_NOTIFICATION_CHANNEL_ID,
            {
              name: "Thông báo NavicAid",
              importance: Notifications.AndroidImportance.HIGH,
            },
          );
        }

        const existingPermissions = await Notifications.getPermissionsAsync();
        const permissionStatus =
          existingPermissions.status === "granted"
            ? existingPermissions.status
            : (await Notifications.requestPermissionsAsync()).status;

        if (permissionStatus !== "granted" || !isActive) {
          return;
        }

        const token = await Notifications.getDevicePushTokenAsync();

        if (!isActive) {
          return;
        }

        await registerMobilePushToken({
          push_token:
            typeof token.data === "string"
              ? token.data
              : JSON.stringify(token.data),
          provider: platform === "android" ? "fcm" : "apns",
          platform,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn("[push-notifications] Failed to register push token.", error);
        }
      }
    };

    void registerPushToken();

    return () => {
      isActive = false;
    };
  }, [userId]);
}
