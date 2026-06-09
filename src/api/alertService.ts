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
  lat: number;
  lng: number;
  distance_cm: number | null;
  triggered_at: string;
  resolved_at: string | null;
};

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
