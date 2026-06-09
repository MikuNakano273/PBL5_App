import axios from "axios";

import { getDeviceFingerprint } from "@/src/auth/deviceFingerprint";

import { API_BASE_URL, normalizeApiError } from "./http";

const INSTALLATION_API_PATH = "/api/mobile/v1/installations/me";

export const mobileNotificationsQueryKey = ["mobile-notifications"] as const;

export type MobileNotificationEvent = {
  id: string;
  user_id: string;
  alert_id?: string | null;
  title: string;
  message?: string | null;
  risk_level?: string | null;
  created_at: string;
};

export type MobileNotification = {
  id: string;
  installation_id: string;
  notification_event_id: string;
  read_at?: string | null;
  created_at: string;
  event: MobileNotificationEvent;
};

async function getInstallationHeaders() {
  const deviceFingerprint = await getDeviceFingerprint();

  return {
    "Content-Type": "application/json",
    "X-Device-Fingerprint": deviceFingerprint,
  };
}

export async function getMobileNotifications(): Promise<MobileNotification[]> {
  try {
    const response = await axios.get<MobileNotification[]>(
      `${API_BASE_URL}${INSTALLATION_API_PATH}/notifications`,
      {
        headers: await getInstallationHeaders(),
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function markMobileNotificationRead(
  notificationId: string,
): Promise<MobileNotification> {
  const normalizedNotificationId = notificationId.trim();

  if (!normalizedNotificationId) {
    throw Object.assign(new Error("Notification ID is required."), {
      code: "invalid_notification_id",
    });
  }

  try {
    const response = await axios.post<MobileNotification>(
      `${API_BASE_URL}${INSTALLATION_API_PATH}/notifications/${encodeURIComponent(normalizedNotificationId)}/read`,
      undefined,
      {
        headers: await getInstallationHeaders(),
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
