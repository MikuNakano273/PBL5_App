export const PBL5_SERVER_URL = "http://192.168.0.11:8000";
const DEFAULT_BLIND_USER_ID = "blind-1";
const DEFAULT_DEVICE_FINGERPRINT = "navicaid-dev-phone";

export type ApiConfig = {
  apiUrl: string;
  blindUserId: string;
  deviceFingerprint: string;
};

type ApiConfigInput = {
  apiUrl?: string;
  blindUserId?: string;
  deviceFingerprint?: string;
};

export function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function createApiConfig(input: ApiConfigInput = {}): ApiConfig {
  const env = process.env as Record<string, string | undefined>;

  return {
    apiUrl: PBL5_SERVER_URL,
    blindUserId:
      input.blindUserId ??
      env.EXPO_PUBLIC_BLIND_USER_ID ??
      DEFAULT_BLIND_USER_ID,
    deviceFingerprint:
      input.deviceFingerprint ??
      env.EXPO_PUBLIC_DEVICE_FINGERPRINT ??
      DEFAULT_DEVICE_FINGERPRINT,
  };
}
