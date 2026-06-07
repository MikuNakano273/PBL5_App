import { useAuth } from "@/src/auth/AuthContext";
import { Redirect, type Href } from "expo-router";

export default function Index() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return null;
  }

  return (
    <Redirect
      href={(isAuthenticated ? "/(tabs)/dashboard" : "/login") as Href}
    />
  );
}
