import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { useAppSettings } from "@/src/state/AppSettingsContext";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

type UserItem = {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline";
};

export default function UsersScreen() {
  const { api, config, isAuthenticated, accessToken } = useAppSettings();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["care-links", config.apiUrl, accessToken],
    queryFn: () => api.getCareLinks(),
    enabled: isAuthenticated,
  });

  const users: UserItem[] =
    data?.map((link) => ({
      id: link.id ?? link._id ?? `${link.blind_user_id}-${link.family_user_id}`,
      name: link.family_user_id,
      role: `${link.relation} -> ${link.blind_user_id}`,
      status: link.status === "active" ? "online" : "offline",
    })) ?? [];

  return (
    <Screen>
      <SectionTitle title="Quan ly nguoi dung" />

      {!isAuthenticated ? (
        <EmptyState
          title="Chua dang nhap server"
          desc="Mo Settings va dang nhap de tai danh sach lien ket."
        />
      ) : isLoading ? (
        <EmptyState
          title="Dang tai lien ket..."
          desc="Dang lay care links tu PBL5 server."
        />
      ) : isError ? (
        <EmptyState
          title="Khong tai duoc lien ket"
          desc={
            error instanceof Error
              ? error.message
              : "Kiem tra server URL va token."
          }
        />
      ) : users.length === 0 ? (
        <EmptyState
          title="Chua co nguoi dung"
          desc="Server chua tra ve care link nao cho tai khoan nay."
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ gap: theme.spacing(1) }}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Avatar name={item.name} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                </View>
                <StatusPill status={item.status} />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || "U"}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: "online" | "offline" }) {
  const ok = status === "online";
  return (
    <View
      style={[
        styles.pill,
        {
          borderColor: ok
            ? `${theme.colors.success}66`
            : `${theme.colors.subText}44`,
          backgroundColor: ok ? `${theme.colors.success}12` : theme.colors.card,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: ok ? theme.colors.success : theme.colors.subText },
        ]}
      />
      <Text style={styles.pillText}>{ok ? "ACTIVE" : "INACTIVE"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}22`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}55`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: theme.colors.text, fontWeight: "900" },

  name: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  role: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 99 },
  pillText: { color: theme.colors.text, fontSize: 11, fontWeight: "800" },
});

