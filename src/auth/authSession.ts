import { clearTokens } from "./tokenStorage";

type AuthExpiredListener = () => void;

const authExpiredListeners = new Set<AuthExpiredListener>();

export async function clearAuthSession(): Promise<void> {
  await clearTokens();
}

export async function expireAuthSession(): Promise<void> {
  try {
    await clearAuthSession();
  } finally {
    authExpiredListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        if (__DEV__) {
          console.warn("[auth] auth-expired listener failed.", error);
        }
      }
    });
  }
}

export function subscribeToAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);

  return () => {
    authExpiredListeners.delete(listener);
  };
}
