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
  loginMobile,
  logoutMobile,
  type MobileLoginInput,
  type MobileUser,
} from "@/src/api/authService";
import { clearTokens, getAccessToken } from "@/src/auth/tokenStorage";

type AuthContextValue = {
  user: MobileUser | null;
  isHydrating: boolean;
  login: (input: MobileLoginInput) => Promise<MobileUser>;
  logout: () => Promise<void>;
  setUser: (user: MobileUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

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
    await logoutMobile();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isHydrating,
      login,
      logout,
      setUser,
    }),
    [isHydrating, login, logout, user],
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
