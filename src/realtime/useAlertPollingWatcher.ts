import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  getMobileUserAlertsPage,
  type MobileAlert,
} from "@/src/api/alertService";
import { mobileNotificationsQueryKey } from "@/src/api/notificationService";
import { useAuth } from "@/src/auth/AuthContext";
import { getStoredItem, setStoredItem } from "@/src/auth/persistentStorage";
import { useInAppNotification } from "@/src/notifications/InAppNotificationContext";
import { showAlertLocalNotification } from "@/src/notifications/localNotificationService";
import { notificationMode } from "@/src/notifications/notificationMode";

const ALERT_POLL_INTERVAL_MS = 12_000;
const ALERT_POLL_PAGE_SIZE = 20;
const ALERT_POLL_MAX_PAGES = 50;
const LAST_SEEN_ALERT_KEY_PREFIX = "alert_polling_last_seen";

type LastSeenAlert = {
  id: string;
  triggeredAt: string;
};

export function useAlertPollingWatcher() {
  const { userId } = useAuth();
  const { enqueueAlert } = useInAppNotification();
  const queryClient = useQueryClient();
  const lastSeenAlertRef = useRef<LastSeenAlert | null>(null);

  useEffect(() => {
    if (!userId) {
      lastSeenAlertRef.current = null;
      return;
    }

    let isActive = true;
    let isPolling = false;
    let didWarnMissingPagination = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const storageKey = `${LAST_SEEN_ALERT_KEY_PREFIX}:${userId}`;

    const saveLastSeenAlert = async (alert: MobileAlert) => {
      const lastSeenAlert = {
        id: alert.id,
        triggeredAt: alert.triggered_at,
      };

      lastSeenAlertRef.current = lastSeenAlert;

      try {
        await setStoredItem(storageKey, JSON.stringify(lastSeenAlert));
      } catch (error) {
        if (__DEV__) {
          console.warn("[alert-polling] Failed to persist alert baseline.", error);
        }
      }
    };

    const invalidateAlertQueries = async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["mobile-dashboard", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["mobile-alerts", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: mobileNotificationsQueryKey,
        }),
      ]);
    };

    const pollAlerts = async () => {
      if (!isActive || isPolling) {
        return;
      }

      isPolling = true;

      try {
        const alerts = await fetchAlertsUntilKnown(
          lastSeenAlertRef.current,
          () => isActive,
          () => {
            if (!didWarnMissingPagination && __DEV__) {
              didWarnMissingPagination = true;
              console.warn(
                "[alert-polling] Alerts response has no pagination metadata; only the first page can be checked safely.",
              );
            }
          },
        );
        const latestAlert = alerts[0];

        if (!latestAlert || !isActive) {
          return;
        }

        const lastSeenAlert = lastSeenAlertRef.current;

        if (!lastSeenAlert) {
          await saveLastSeenAlert(latestAlert);
          return;
        }

        const newAlerts = findNewAlerts(alerts, lastSeenAlert);

        if (newAlerts.length === 0) {
          return;
        }

        await saveLastSeenAlert(latestAlert);

        for (const alert of [...newAlerts].reverse()) {
          enqueueAlert(alert);

          if (notificationMode === "local-polling") {
            await showAlertLocalNotification(alert);
          }
        }

        await invalidateAlertQueries();
      } catch (error) {
        if (__DEV__) {
          console.warn("[alert-polling] Failed to poll alerts.", error);
        }
      } finally {
        isPolling = false;
      }
    };

    const startPolling = () => {
      if (intervalId || !isActive) {
        return;
      }

      void pollAlerts();
      intervalId = setInterval(() => {
        void pollAlerts();
      }, ALERT_POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const initialize = async () => {
      try {
        lastSeenAlertRef.current = parseLastSeenAlert(await getStoredItem(storageKey));
      } catch (error) {
        if (__DEV__) {
          console.warn("[alert-polling] Failed to restore alert baseline.", error);
        }
      }

      if (isActive && AppState.currentState === "active") {
        startPolling();
      }
    };

    void initialize();

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      isActive = false;
      stopPolling();
      appStateSubscription.remove();
    };
  }, [enqueueAlert, queryClient, userId]);
}

async function fetchAlertsUntilKnown(
  lastSeenAlert: LastSeenAlert | null,
  isActive: () => boolean,
  warnMissingPagination: () => void,
) {
  const alertsById = new Map<string, MobileAlert>();
  const fetchedPages = new Set<number>();
  let page = 1;

  while (isActive() && page <= ALERT_POLL_MAX_PAGES) {
    if (fetchedPages.has(page)) {
      if (__DEV__) {
        console.warn(
          `[alert-polling] Stopped because pagination repeated page ${page}.`,
        );
      }
      break;
    }

    fetchedPages.add(page);
    const result = await getMobileUserAlertsPage({
      page,
      limit: ALERT_POLL_PAGE_SIZE,
    });

    for (const alert of result.alerts) {
      if (!alertsById.has(alert.id)) {
        alertsById.set(alert.id, alert);
      }
    }

    if (!result.pagination) {
      warnMissingPagination();
      break;
    }

    if (
      !lastSeenAlert ||
      result.alerts.some((alert) => alert.id === lastSeenAlert.id)
    ) {
      break;
    }

    if (!result.pagination.hasNextPage || !result.pagination.nextPage) {
      break;
    }

    page = result.pagination.nextPage;
  }

  if (page > ALERT_POLL_MAX_PAGES && __DEV__) {
    console.warn(
      `[alert-polling] Stopped after ${ALERT_POLL_MAX_PAGES} pages to avoid an unbounded pagination loop.`,
    );
  }

  return [...alertsById.values()];
}

function findNewAlerts(alerts: MobileAlert[], lastSeenAlert: LastSeenAlert) {
  const lastSeenIndex = alerts.findIndex((alert) => alert.id === lastSeenAlert.id);

  if (lastSeenIndex >= 0) {
    return dedupeAlertsById(alerts.slice(0, lastSeenIndex));
  }

  const lastSeenTimestamp = Date.parse(lastSeenAlert.triggeredAt);

  if (Number.isNaN(lastSeenTimestamp)) {
    return [];
  }

  return dedupeAlertsById(
    alerts.filter((alert) => Date.parse(alert.triggered_at) > lastSeenTimestamp),
  );
}

function dedupeAlertsById(alerts: MobileAlert[]) {
  const seenIds = new Set<string>();

  return alerts.filter((alert) => {
    if (seenIds.has(alert.id)) {
      return false;
    }

    seenIds.add(alert.id);
    return true;
  });
}

function parseLastSeenAlert(value: string | null): LastSeenAlert | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<LastSeenAlert>;

    if (typeof parsed.id !== "string" || typeof parsed.triggeredAt !== "string") {
      return null;
    }

    return {
      id: parsed.id,
      triggeredAt: parsed.triggeredAt,
    };
  } catch {
    return null;
  }
}
