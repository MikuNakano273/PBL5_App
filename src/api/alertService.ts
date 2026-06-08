import { http } from "./http";

export type MobileAlert = {
  id?: string;
  alert_type: string;
  risk_level: string;
  status: string;
  message?: string;
  triggered_at: string;
  distance_cm?: number | null;
  resolved_at?: string | null;
};

export async function getMobileUserAlerts(
  userId: string,
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
): Promise<MobileAlert[]> {
  const response = await http.get<MobileAlert[]>(
    `/api/mobile/v1/users/${encodeURIComponent(userId)}/alerts`,
    {
      params: {
        page,
        limit,
      },
    },
  );

  return response.data;
}
