export type AlertType = "danger" | "warning" | "info";

export type ServerDashboard = {
  blind_user_id: string;
  is_safe: boolean;
  current_safety_status?: string | null;
  nearest_distance_cm?: number | null;
  today_alert_count: number;
  device_count: number;
  device_last_seen_at?: string | null;
  last_seen_at?: string | null;
  last_location?: Record<string, unknown> | null;
  recent_alerts: ServerAlert[];
};

export type ServerAlert = {
  id?: string;
  _id?: string;
  title?: string;
  message?: string;
  type?: string;
  risk_level?: string;
  triggered_at?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  read?: boolean;
};

export type ServerLocation = {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  timestamp?: string;
  updated_at?: string;
};

export type UiDashboard = {
  status: "ONLINE" | "OFFLINE";
  lastSync: string;
  nearestDistanceM: number | null;
  alertsToday: number;
  safeZone: string;
  deviceCount: number;
  recentAlerts: UiAlert[];
};

export type UiAlert = {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
};

export type UiLocation = {
  lat: number;
  lng: number;
  updatedAt: string;
};

export function mapDashboardToUi(dashboard: ServerDashboard): UiDashboard {
  return {
    status: dashboard.device_count > 0 ? "ONLINE" : "OFFLINE",
    lastSync: dashboard.device_last_seen_at ?? dashboard.last_seen_at ?? "Chua co du lieu",
    nearestDistanceM:
      typeof dashboard.nearest_distance_cm === "number"
        ? Math.round((dashboard.nearest_distance_cm / 100) * 100) / 100
        : null,
    alertsToday: dashboard.today_alert_count,
    safeZone: dashboard.is_safe ? "Trong vung an toan" : "Ngoai vung an toan",
    deviceCount: dashboard.device_count,
    recentAlerts: dashboard.recent_alerts.map(mapAlertToUi),
  };
}

export function mapAlertToUi(alert: ServerAlert): UiAlert {
  const riskOrType = (alert.risk_level ?? alert.type ?? "").toLowerCase();

  return {
    id: alert.id ?? alert._id ?? `${alert.title ?? "alert"}-${alert.created_at ?? ""}`,
    type: mapRiskToAlertType(riskOrType),
    title: alert.title ?? "Canh bao",
    detail: alert.message ?? (alert.read ? "Da doc" : "Chua doc"),
    time: alert.triggered_at ?? alert.created_at ?? alert.createdAt ?? "",
  };
}

export function mapLatestLocationToUi(
  locations: ServerLocation[],
): UiLocation | null {
  const latest = locations.at(-1);
  if (!latest) return null;

  const lat = latest.lat ?? latest.latitude;
  const lng = latest.lng ?? latest.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return {
    lat,
    lng,
    updatedAt: latest.updated_at ?? latest.created_at ?? latest.timestamp ?? "",
  };
}

function mapRiskToAlertType(value: string): AlertType {
  if (["high", "critical", "danger", "obstacle"].includes(value)) {
    return "danger";
  }
  if (["medium", "warning", "safe_zone", "battery"].includes(value)) {
    return "warning";
  }
  return "info";
}

