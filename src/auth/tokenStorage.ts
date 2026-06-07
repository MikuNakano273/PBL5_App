import { deleteStoredItem, getStoredItem, setStoredItem } from "./persistentStorage";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    setStoredItem(ACCESS_TOKEN_KEY, tokens.access_token),
    setStoredItem(REFRESH_TOKEN_KEY, tokens.refresh_token),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return getStoredItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getStoredItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteStoredItem(ACCESS_TOKEN_KEY),
    deleteStoredItem(REFRESH_TOKEN_KEY),
  ]);
}
