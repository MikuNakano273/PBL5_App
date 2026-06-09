import { http } from "./http";

export type SafetyStatus = "safe" | "warning" | "caution" | "danger" | "high" | string;

export type DashboardAlert = {
  id: string;
  title?: string;
  message?: string;
  risk_level?: string;
  triggered_at?: string;
};

export type DashboardLocation = {
  type?: string;
  coordinates?: [number, number];
} | null;

export type MobileDashboard = {
  user_id: string;
  is_safe?: boolean;
  current_safety_status?: SafetyStatus | null;
  nearest_distance_cm?: number | null;
  today_alert_count?: number | null;
  device_count?: number | null;
  device_last_seen_at?: string | null;
  last_seen_at?: string | null;
  last_location?: DashboardLocation;
  recent_alerts?: DashboardAlert[];
};

export type MobileDevice = {
  id: string;
  device_code?: string;
  serial_number?: string;
  owner_user_id?: string;
  name?: string;
  firmware_version?: string;
  status?: string;
  last_seen_at?: string | null;
  last_battery?: number | null;
};

export async function getMobileDashboard(): Promise<MobileDashboard> {
  const response = await http.get<MobileDashboard>("/api/mobile/v1/dashboard/me");

  return response.data;
}

export async function getMobileUserDevices(): Promise<MobileDevice[]> {
  const response = await http.get<MobileDevice[]>("/api/mobile/v1/me/devices");

  return response.data;
}
