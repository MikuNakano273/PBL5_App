import { createPbl5Api } from "@/src/api/client";
import { type ApiConfig, createApiConfig } from "@/src/api/config";
import { Platform } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Session = {
  accessToken?: string;
  refreshToken?: string;
};

type AppSettingsContextValue = {
  config: ApiConfig;
  accessToken?: string;
  refreshToken?: string;
  isAuthenticated: boolean;
  api: ReturnType<typeof createPbl5Api>;
  setBlindUserId: (blindUserId: string) => void;
  setDeviceFingerprint: (deviceFingerprint: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState(() => createApiConfig());
  const [session, setSession] = useState<Session>({});

  const api = useMemo(
    () => createPbl5Api(config, session.accessToken),
    [config, session.accessToken],
  );

  const updateConfig = useCallback((patch: Partial<ApiConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokenPair = await createPbl5Api(config).login({
        email,
        password,
        deviceName: "NavicAid",
        platform: Platform.OS,
      });

      setSession({
        accessToken: tokenPair.access_token,
        refreshToken: tokenPair.refresh_token,
      });
    },
    [config],
  );

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      config,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: Boolean(session.accessToken),
      api,
      setBlindUserId: (blindUserId) => updateConfig({ blindUserId }),
      setDeviceFingerprint: (deviceFingerprint) =>
        updateConfig({ deviceFingerprint }),
      login,
      logout: () => setSession({}),
    }),
    [api, config, login, session.accessToken, session.refreshToken, updateConfig],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const value = useContext(AppSettingsContext);
  if (!value) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return value;
}
