import axios, {
  AxiosError,
  AxiosHeaders,
  isAxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";

import { expireAuthSession } from "@/src/auth/authSession";
import { getAccessToken, getRefreshToken, saveTokens } from "@/src/auth/tokenStorage";

if (Platform.OS !== "web") {
  axios.defaults.adapter = "fetch";
}

export const DEFAULT_DEV_API_BASE_URL = "http://localhost:8000";
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
export const API_BASE_URL =
  configuredApiBaseUrl?.trim() || DEFAULT_DEV_API_BASE_URL;

if (!configuredApiBaseUrl) {
  console.warn(
    `Missing EXPO_PUBLIC_API_BASE_URL. Falling back to ${DEFAULT_DEV_API_BASE_URL}.`,
  );
}

if (__DEV__) {
  console.info(`[api] Using base URL: ${API_BASE_URL}`);
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  detail?: unknown;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type NormalizedApiError = Error & {
  code: string;
  details?: unknown;
  status?: number;
};

export type ApiConnectionResult = {
  baseUrl: string;
  platform: string;
  status: number;
};

export type NetworkDiagnosticResult = {
  api: string;
  cloudflare: string;
  google: string;
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<TokenResponse> | null = null;

const createApiError = ({
  code,
  message,
  details,
  status,
}: {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}): NormalizedApiError =>
  Object.assign(new Error(message), {
    code,
    details,
    status,
  });

const normalizeFastApi422Message = (detail: unknown) => {
  if (!Array.isArray(detail)) {
    return "Validation error.";
  }

  return detail
    .map((issue) => {
      if (typeof issue !== "object" || issue === null) {
        return null;
      }

      const message = "msg" in issue ? String(issue.msg) : null;
      const location = "loc" in issue && Array.isArray(issue.loc) ? issue.loc.join(".") : null;

      if (!message) {
        return null;
      }

      return location ? `${location}: ${message}` : message;
    })
    .filter(Boolean)
    .join("\n");
};

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!isAxiosError(error)) {
    return createApiError({
      code: "unknown_error",
      message: error instanceof Error ? error.message : "Unexpected error.",
    });
  }

  const status = error.response?.status;
  const data = error.response?.data as ApiErrorEnvelope | undefined;

  if (data?.error) {
    return createApiError({
      code: data.error.code ?? "api_error",
      message: data.error.message ?? "API request failed.",
      details: data.error.details,
      status,
    });
  }

  if (status === 422 && data && "detail" in data) {
    return createApiError({
      code: "validation_error",
      message: normalizeFastApi422Message(data.detail) || "Validation error.",
      details: data.detail,
      status,
    });
  }

  if (!status) {
    const details = {
      axiosCode: error.code,
      adapter: Platform.OS === "web" ? "default" : "fetch",
      baseUrl: error.config?.baseURL ?? API_BASE_URL,
      method: error.config?.method,
      platform: Platform.OS,
      url: error.config?.url,
    };

    if (__DEV__) {
      console.warn("[api] Network request failed.", details, error.message);
    }

    return createApiError({
      code: "network_error",
      message: `Không thể kết nối tới API ${API_BASE_URL}.`,
      details,
    });
  }

  return createApiError({
    code: `http_${status}`,
    message: error.message || "API request failed.",
    details: data,
    status,
  });
}

export async function checkApiConnection(): Promise<ApiConnectionResult> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 10000,
    });

    return {
      baseUrl: API_BASE_URL,
      platform: Platform.OS,
      status: response.status,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function diagnoseNetworkConnection(): Promise<NetworkDiagnosticResult> {
  const [api, cloudflare, google] = await Promise.all([
    probeUrl(`${API_BASE_URL}/api/health`),
    probeUrl("https://1.1.1.1/cdn-cgi/trace"),
    probeUrl("https://www.google.com/generate_204"),
  ]);

  return {
    api,
    cloudflare,
    google,
  };
}

async function probeUrl(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    return `HTTP ${response.status}`;
  } catch (error) {
    return error instanceof Error ? error.message : "Network request failed";
  } finally {
    clearTimeout(timeoutId);
  }
}

const withBearerToken = (config: InternalAxiosRequestConfig, accessToken: string) => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return {
    ...config,
    headers,
  };
};

const refreshTokens = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw createApiError({
          code: "missing_refresh_token",
          message: "Missing refresh token.",
          status: 401,
        });
      }

      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/api/mobile/v1/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      await saveTokens({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      });

      return response.data;
    })()
      .catch(async (error) => {
        await expireAuthSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

http.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return config;
  }

  return withBearerToken(config, accessToken);
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(normalizeApiError(error));
    }

    try {
      originalRequest._retry = true;
      const tokens = await refreshTokens();
      const retryConfig: AxiosRequestConfig = withBearerToken(
        originalRequest,
        tokens.access_token,
      );

      return http(retryConfig);
    } catch (refreshError) {
      return Promise.reject(normalizeApiError(refreshError));
    }
  },
);
