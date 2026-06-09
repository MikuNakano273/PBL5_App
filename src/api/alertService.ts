import { http } from "./http";

export type MobileAlert = {
  id: string;
  user_id: string;
  device_id: string;
  alert_type: string;
  title: string;
  message: string;
  risk_level: string;
  status: string;
  lat: number | null;
  lng: number | null;
  distance_cm: number | null;
  triggered_at: string;
  resolved_at: string | null;
};

export async function getMobileAlert(alertId: string): Promise<MobileAlert> {
  const normalizedAlertId = alertId.trim();

  if (!normalizedAlertId) {
    throw Object.assign(new Error("Alert ID is required."), {
      code: "invalid_alert_id",
      status: 400,
    });
  }

  const response = await http.get<MobileAlert>(
    `/api/mobile/v1/alerts/${encodeURIComponent(normalizedAlertId)}`,
  );

  return response.data;
}

export async function getMobileUserAlerts(
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
): Promise<MobileAlert[]> {
  const response = await http.get<MobileAlert[]>("/api/mobile/v1/me/alerts", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}
