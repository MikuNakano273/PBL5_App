import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMobileMe,
  getUserId,
  loginMobile,
  logoutMobile,
  type MobileLoginInput,
  type MobileUser,
} from "@/src/api/authService";
import { clearTokens, getAccessToken } from "@/src/auth/tokenStorage";

type AuthContextValue = {
  user: MobileUser | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isHydrating: boolean;
  login: (input: MobileLoginInput) => Promise<MobileUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<MobileUser | null>;
  setUser: (user: MobileUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const currentUser = await getMobileMe();
      setUser(currentUser);

      return currentUser;
    } catch (error) {
      await clearTokens();
      setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateAuth() {
      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          return;
        }

        const currentUser = await getMobileMe();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        await clearTokens();

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (input: MobileLoginInput) => {
    const result = await loginMobile(input);
    setUser(result.user);

    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutMobile();
    } finally {
      setUser(null);
    }
  }, []);

  const userId = user ? (getUserId(user) ?? null) : null;
  const isAuthenticated = Boolean(user && userId);

  const value = useMemo(
    () => ({
      user,
      userId,
      isAuthenticated,
      isLoadingAuth: isHydrating,
      isHydrating,
      login,
      logout,
      refreshMe,
      setUser,
    }),
    [isAuthenticated, isHydrating, login, logout, refreshMe, user, userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
