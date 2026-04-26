import type { ApiConfig } from "./config";
import type { ServerAlert, ServerDashboard, ServerLocation } from "./transformers";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type LoginInput = {
  email: string;
  password: string;
  deviceName: string;
  platform: string;
};

export type DeviceRow = {
  id?: string;
  _id?: string;
  device_code?: string;
  status?: string;
  last_seen_at?: string;
};

export type CareLinkRow = {
  id?: string;
  _id?: string;
  blind_user_id: string;
  family_user_id: string;
  relation: string;
  status: string;
};

export type InstallationNotification = {
  id?: string;
  _id?: string;
  title?: string;
  message?: string;
  read_at?: string | null;
  created_at?: string;
};

export function createPbl5Api(config: ApiConfig, accessToken?: string) {
  const request = <T>(path: string, options: RequestInit = {}) =>
    requestJson<T>(config.apiUrl, path, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  return {
    health: () => requestJson<{ status: string }>(config.apiUrl, "/api/health"),

    login: (input: LoginInput) =>
      requestJson<TokenPair>(config.apiUrl, "/api/mobile/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          device_fingerprint: config.deviceFingerprint,
          device_name: input.deviceName,
          platform: input.platform,
        }),
      }),

    getDashboard: (blindUserId = config.blindUserId) =>
      request<ServerDashboard>(`/api/mobile/v1/dashboard/${blindUserId}`),

    getAlerts: (blindUserId = config.blindUserId) =>
      request<ServerAlert[]>(
        `/api/mobile/v1/blind-users/${blindUserId}/alerts?limit=50`,
      ),

    getLocations: (blindUserId = config.blindUserId) =>
      request<ServerLocation[]>(
        `/api/mobile/v1/blind-users/${blindUserId}/locations?limit=20`,
      ),

    getDevices: (blindUserId = config.blindUserId) =>
      request<DeviceRow[]>(`/api/mobile/v1/blind-users/${blindUserId}/devices`),

    getCareLinks: () => request<CareLinkRow[]>("/api/mobile/v1/care-links"),

    getInstallationNotifications: () =>
      requestJson<InstallationNotification[]>(
        config.apiUrl,
        "/api/mobile/v1/installations/me/notifications",
        {
          headers: {
            "x-device-fingerprint": config.deviceFingerprint,
          },
        },
      ),
  };
}

async function requestJson<T>(
  apiUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = await readJson(response);
  if (!response.ok) {
    const message =
      getPayloadString(payload, "message") ??
      getPayloadString(payload, "detail") ??
      `Request failed with ${response.status}`;
    throw new ApiError(response.status, message, getPayloadString(payload, "code"));
  }

  return payload as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getPayloadString(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

