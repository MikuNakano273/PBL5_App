import * as Notifications from "expo-notifications";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type MobileAlert } from "@/src/api/alertService";
import { useAuth } from "@/src/auth/AuthContext";

const AUTO_DISMISS_MS = 5_000;

export type InAppNotification = {
  key: string;
  alertId?: string;
  eventId?: string;
  title: string;
  message?: string;
  riskLevel?: string;
};

type EnqueueInAppNotificationInput = Omit<InAppNotification, "key">;

type InAppNotificationContextValue = {
  currentNotification: InAppNotification | null;
  dismissCurrentNotification: () => void;
  enqueueAlert: (alert: Pick<MobileAlert, "id" | "title" | "message" | "risk_level">) => void;
  enqueueNotification: (notification: EnqueueInAppNotificationInput) => void;
};

const InAppNotificationContext =
  createContext<InAppNotificationContextValue | null>(null);

export function InAppNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [queue, setQueue] = useState<InAppNotification[]>([]);
  const seenKeysRef = useRef(new Set<string>());
  const currentNotification = queue[0] ?? null;

  const dismissCurrentNotification = useCallback(() => {
    setQueue((currentQueue) => currentQueue.slice(1));
  }, []);

  const enqueueNotification = useCallback(
    (notification: EnqueueInAppNotificationInput) => {
      if (!isAuthenticated) {
        return;
      }

      const normalizedAlertId = notification.alertId?.trim();
      const normalizedEventId = notification.eventId?.trim();
      const key = normalizedAlertId
        ? `alert:${normalizedAlertId}`
        : normalizedEventId
          ? `event:${normalizedEventId}`
          : "";

      if (!key || seenKeysRef.current.has(key)) {
        return;
      }

      seenKeysRef.current.add(key);
      setQueue((currentQueue) => [
        ...currentQueue,
        {
          ...notification,
          alertId: normalizedAlertId,
          eventId: normalizedEventId,
          key,
        },
      ]);
    },
    [isAuthenticated],
  );

  const enqueueAlert = useCallback(
    (alert: Pick<MobileAlert, "id" | "title" | "message" | "risk_level">) => {
      enqueueNotification({
        alertId: alert.id,
        title: alert.title,
        message: alert.message,
        riskLevel: alert.risk_level,
      });
    },
    [enqueueNotification],
  );

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    seenKeysRef.current.clear();
    setQueue([]);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!currentNotification || isDangerNotification(currentNotification)) {
      return;
    }

    const timeoutId = setTimeout(dismissCurrentNotification, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentNotification, dismissCurrentNotification]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const content = notification.request.content;
        const alertId = getStringValue(content.data.alert_id);
        const eventId =
          getStringValue(content.data.notification_event_id) ||
          getStringValue(content.data.event_id) ||
          notification.request.identifier;

        enqueueNotification({
          alertId,
          eventId,
          title: content.title?.trim() || "Thông báo NavicAid",
          message: content.body?.trim(),
          riskLevel:
            getStringValue(content.data.risk_level) ||
            content.subtitle?.trim(),
        });
      },
    );

    return () => {
      subscription.remove();
    };
  }, [enqueueNotification, isAuthenticated]);

  const value = useMemo(
    () => ({
      currentNotification,
      dismissCurrentNotification,
      enqueueAlert,
      enqueueNotification,
    }),
    [
      currentNotification,
      dismissCurrentNotification,
      enqueueAlert,
      enqueueNotification,
    ],
  );

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
    </InAppNotificationContext.Provider>
  );
}

export function useInAppNotification() {
  const context = useContext(InAppNotificationContext);

  if (!context) {
    throw new Error(
      "useInAppNotification must be used inside InAppNotificationProvider.",
    );
  }

  return context;
}

export function isDangerNotification(
  notification: Pick<InAppNotification, "riskLevel">,
) {
  const riskLevel = notification.riskLevel?.trim().toLowerCase();
  return riskLevel === "danger" || riskLevel === "high";
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}
