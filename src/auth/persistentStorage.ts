import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryStorage = new Map<string, string>();

const canUseLocalStorage = () =>
  typeof globalThis !== "undefined" && "localStorage" in globalThis;

export async function getStoredItem(key: string): Promise<string | null> {
  if (Platform.OS !== "web") {
    return SecureStore.getItemAsync(key);
  }

  if (canUseLocalStorage()) {
    return globalThis.localStorage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  if (canUseLocalStorage()) {
    globalThis.localStorage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

export async function deleteStoredItem(key: string): Promise<void> {
  if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  if (canUseLocalStorage()) {
    globalThis.localStorage.removeItem(key);
    return;
  }

  memoryStorage.delete(key);
}
