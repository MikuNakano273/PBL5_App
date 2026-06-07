import { Platform } from "react-native";

import { http } from "./http";
import { getDeviceFingerprint } from "@/src/auth/deviceFingerprint";
import { clearTokens, getRefreshToken, saveTokens } from "@/src/auth/tokenStorage";

export type LoginRequest = {
  email: string;
  password: string;
  device_name?: string;
  platform?: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export async function loginMobile({
  email,
  password,
  device_name = "NavicAid app",
  platform = Platform.OS,
}: LoginRequest): Promise<TokenResponse> {
  const deviceFingerprint = await getDeviceFingerprint();
  const response = await http.post<TokenResponse>("/api/mobile/v1/auth/login", {
    email,
    password,
    device_fingerprint: deviceFingerprint,
    device_name,
    platform,
  });

  await saveTokens({
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
  });

  return response.data;
}

export async function logoutMobile(): Promise<void> {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      await http.post("/api/mobile/v1/auth/logout", {
        refresh_token: refreshToken,
      });
    }
  } finally {
    await clearTokens();
  }
}
