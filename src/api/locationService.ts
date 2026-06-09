import { http } from "./http";

export type GeoJsonPoint = {
  type?: string;
  coordinates?: [number, number];
};

export type MobileLocation = {
  id?: string;
  device_id?: string;
  user_id?: string;
  lat?: number | null;
  lng?: number | null;
  location?: GeoJsonPoint | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  recorded_at?: string | null;
};

export async function getMobileUserLocations(
  { limit = 1 }: { limit?: number } = {},
): Promise<MobileLocation[]> {
  const response = await http.get<MobileLocation[]>("/api/mobile/v1/me/locations", {
    params: {
      limit,
    },
  });

  return response.data;
}
