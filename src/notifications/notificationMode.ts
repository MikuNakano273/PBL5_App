export type NotificationMode = "local-polling" | "push" | "off";

const configuredMode = process.env.EXPO_PUBLIC_NOTIFICATION_MODE?.trim();

export const notificationMode: NotificationMode = isNotificationMode(configuredMode)
  ? configuredMode
  : __DEV__
    ? "local-polling"
    : "push";

if (configuredMode && !isNotificationMode(configuredMode)) {
  console.warn(
    `Invalid EXPO_PUBLIC_NOTIFICATION_MODE "${configuredMode}". Falling back to "${notificationMode}".`,
  );
}

function isNotificationMode(value: string | undefined): value is NotificationMode {
  return value === "local-polling" || value === "push" || value === "off";
}
