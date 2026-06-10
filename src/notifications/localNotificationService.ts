import * as Notifications from "expo-notifications";

import { type MobileAlert } from "@/src/api/alertService";

export type LocalNotificationAlert = Pick<
  MobileAlert,
  "id" | "title" | "message" | "risk_level"
>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function showAlertLocalNotification(
  alert: LocalNotificationAlert,
): Promise<string | null> {
  try {
    const existingPermissions = await Notifications.getPermissionsAsync();
    const permissionStatus =
      existingPermissions.status === "granted"
        ? existingPermissions.status
        : (await Notifications.requestPermissionsAsync()).status;

    if (permissionStatus !== "granted") {
      return null;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.title,
        subtitle: alert.risk_level,
        body: alert.message,
        data: {
          type: "alert.created",
          alert_id: alert.id,
        },
      },
      trigger: null,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn("[local-notifications] Failed to show alert notification.", error);
    }

    return null;
  }
}
