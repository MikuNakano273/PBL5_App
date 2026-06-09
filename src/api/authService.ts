import axios from "axios";
import { Platform } from "react-native";

import { getDeviceFingerprint } from "@/src/auth/deviceFingerprint";
import { clearTokens, getRefreshToken, saveTokens } from "@/src/auth/tokenStorage";

import { API_BASE_URL, http, normalizeApiError } from "./http";

export type MobileUser = {
  id: string;
  _id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  status: string;
};

export type MobileLoginPayload = {
  email: string;
  password: string;
  device_fingerprint: string;
  device_name: string;
  platform: string;
};

export type MobileLoginInput = {
  email: string;
  password: string;
  device_name?: string;
  platform?: string;
};

export type UpdateMobileMeInput = {
  full_name: string;
  phone: string;
};

export type ChangeMobilePasswordInput = {
  current_password: string;
  new_password: string;
};

type ChangeMobilePasswordResponse = {
  status: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type MobileLoginResult = {
  user: MobileUser;
  tokens: TokenResponse;
  device_fingerprint: string;
};

export function getUserId(user: MobileUser) {
  return user.id;
}

export async function loginMobile({
  email,
  password,
  device_name = "NavicAid app",
  platform = Platform.OS,
}: MobileLoginInput): Promise<MobileLoginResult> {
  const deviceFingerprint = await getDeviceFingerprint();
  const payload: MobileLoginPayload = {
    email,
    password,
    device_fingerprint: deviceFingerprint,
    device_name,
    platform,
  };

  let tokens: TokenResponse;

  try {
    const response = await axios.post<TokenResponse>(
      `${API_BASE_URL}/api/mobile/v1/auth/login`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );
    tokens = response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }

  await saveTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  const user = await getMobileMe();

  return {
    user,
    tokens,
    device_fingerprint: deviceFingerprint,
  };
}

export async function refreshMobileToken(refreshToken?: string | null): Promise<TokenResponse> {
  const tokenToRefresh = refreshToken ?? (await getRefreshToken());

  if (!tokenToRefresh) {
    throw Object.assign(new Error("Missing refresh token."), {
      code: "missing_refresh_token",
      status: 401,
    });
  }

  try {
    const response = await axios.post<TokenResponse>(
      `${API_BASE_URL}/api/mobile/v1/auth/refresh`,
      {
        refresh_token: tokenToRefresh,
      },
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
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function logoutMobile(): Promise<void> {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      await axios.post(
        `${API_BASE_URL}/api/mobile/v1/auth/logout`,
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );
    }
  } catch (error) {
    throw normalizeApiError(error);
  } finally {
    await clearTokens();
  }
}

export async function getMobileMe(): Promise<MobileUser> {
  const response = await http.get<MobileUser>("/api/mobile/v1/me");

  return response.data;
}

export async function updateMobileMe(
  input: UpdateMobileMeInput,
): Promise<MobileUser> {
  const response = await http.patch<MobileUser>("/api/mobile/v1/me", input);

  return response.data;
}

export async function changeMobilePassword(
  input: ChangeMobilePasswordInput,
): Promise<void> {
  await http.post<ChangeMobilePasswordResponse>(
    "/api/mobile/v1/me/change-password",
    input,
  );
}
