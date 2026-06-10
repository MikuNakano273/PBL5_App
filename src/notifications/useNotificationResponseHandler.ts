import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuth } from "@/src/auth/AuthContext";

type AlertNotificationIntent = {
  type: "alert.created";
  alertId: string;
};

export function useNotificationResponseHandler() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const pendingNotificationIntentRef = useRef<AlertNotificationIntent | null>(null);

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const intent = parseNotificationIntent(
        response.notification.request.content.data,
      );

      if (!intent) {
        return;
      }

      if (isLoadingAuth || !isAuthenticated) {
        pendingNotificationIntentRef.current = intent;
        return;
      }

      openNotificationIntent(intent);
    };

    const lastResponse = Notifications.getLastNotificationResponse();

    if (lastResponse) {
      handleResponse(lastResponse);
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleResponse(response);
        Notifications.clearLastNotificationResponse();
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isLoadingAuth]);

  useEffect(() => {
    if (isLoadingAuth || !isAuthenticated) {
      return;
    }

    const pendingIntent = pendingNotificationIntentRef.current;

    if (!pendingIntent) {
      return;
    }

    pendingNotificationIntentRef.current = null;
    openNotificationIntent(pendingIntent);
  }, [isAuthenticated, isLoadingAuth]);
}

function parseNotificationIntent(
  data: Notifications.NotificationContent["data"],
): AlertNotificationIntent | null {
  const alertId = typeof data.alert_id === "string" ? data.alert_id.trim() : "";

  if (data.type !== "alert.created" || !alertId) {
    return null;
  }

  return {
    type: "alert.created",
    alertId,
  };
}

function openNotificationIntent(intent: AlertNotificationIntent) {
  router.push({
    pathname: "/alerts/[id]",
    params: { id: intent.alertId },
  });
}
