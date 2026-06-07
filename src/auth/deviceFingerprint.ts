import Constants from "expo-constants";
import { Platform } from "react-native";

import { getStoredItem, setStoredItem } from "./persistentStorage";

const DEVICE_FINGERPRINT_KEY = "device_fingerprint";

const createRandomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export async function getDeviceFingerprint(): Promise<string> {
  const existingFingerprint = await getStoredItem(DEVICE_FINGERPRINT_KEY);

  if (existingFingerprint) {
    return existingFingerprint;
  }

  const installationId = createRandomId();
  const appSlug = Constants.expoConfig?.slug ?? "navicaid";
  const fingerprint = `${appSlug}-${Platform.OS}-${installationId}`;

  await setStoredItem(DEVICE_FINGERPRINT_KEY, fingerprint);

  return fingerprint;
}
