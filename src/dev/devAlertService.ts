import { http, type NormalizedApiError } from "@/src/api/http";
import type { MobileAlert } from "@/src/api/alertService";

export type DevTestAlertResult = {
  alert: MobileAlert;
  source: "server" | "local";
};

export const shouldShowDevTools =
  __DEV__ ||
  process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS?.trim().toLowerCase() === "true";

export async function createDevTestAlert(): Promise<DevTestAlertResult> {
  try {
    const response = await http.post<MobileAlert>("/api/mobile/v1/dev/test-alert");

    return {
      alert: response.data,
      source: "server",
    };
  } catch (error) {
    const status = (error as Partial<NormalizedApiError>).status;

    if (status !== 404 && status !== 405) {
      throw error;
    }

    return {
      alert: createLocalTestAlert(),
      source: "local",
    };
  }
}

function createLocalTestAlert(): MobileAlert {
  const now = new Date().toISOString();

  return {
    id: `local-dev-alert-${Date.now()}`,
    user_id: "local-dev-user",
    device_id: "local-dev-device",
    alert_type: "OBSTACLE",
    title: "Cảnh báo vật cản thử",
    message: "Phát hiện vật cản thử nghiệm ở khoảng cách gần.",
    risk_level: "high",
    status: "open",
    lat: null,
    lng: null,
    distance_cm: 50,
    triggered_at: now,
    resolved_at: null,
  };
}
