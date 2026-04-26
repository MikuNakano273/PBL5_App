import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { mapAlertToUi, type UiAlert } from "@/src/api/transformers";
import { useAppSettings } from "@/src/state/AppSettingsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type AlertType = UiAlert["type"];

export default function AlertsScreen() {
  const [filter, setFilter] = useState<"all" | AlertType>("all");
  const { api, config, isAuthenticated, accessToken } = useAppSettings();

  const { data: alertsResponse, isLoading, isError, error } = useQuery({
    queryKey: ["alerts", config.apiUrl, config.blindUserId, accessToken],
    queryFn: () => api.getAlerts(config.blindUserId),
    enabled: isAuthenticated,
  });

  const alerts: UiAlert[] = useMemo(
    () => (alertsResponse ?? []).map(mapAlertToUi),
    [alertsResponse],
  );

  const filteredAlerts =
    filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  return (
    <Screen>
      <SectionTitle
        title="Canh bao"
        right={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip
              text="All"
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <Chip
              text="Danger"
              active={filter === "danger"}
              onPress={() => setFilter("danger")}
            />
            <Chip
              text="Warn"
              active={filter === "warning"}
              onPress={() => setFilter("warning")}
            />
          </View>
        }
      />

      {!isAuthenticated ? (
        <EmptyState
          title="Chua dang nhap server"
          desc="Mo Settings va dang nhap de tai danh sach canh bao."
        />
      ) : isLoading ? (
        <EmptyState
          title="Dang tai canh bao..."
          desc="Dang lay du lieu tu PBL5 server."
        />
      ) : isError ? (
        <EmptyState
          title="Khong tai duoc canh bao"
          desc={
            error instanceof Error
              ? error.message
              : "Kiem tra server URL va token."
          }
        />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="Khong co canh bao"
          desc="Khong co su kien phu hop bo loc."
        />
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ gap: theme.spacing(1) }}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.alertRow}>
                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: `${pickColor(item.type)}22` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={pickIcon(item.type)}
                    size={20}
                    color={pickColor(item.type)}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertDetail}>{item.detail}</Text>
                </View>

                <Text style={styles.alertTime}>{item.time}</Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active
            ? `${theme.colors.primary}22`
            : theme.colors.card,
          borderColor: active
            ? `${theme.colors.primary}66`
            : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? theme.colors.text : theme.colors.subText },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function pickColor(t: AlertType) {
  if (t === "danger") return theme.colors.danger;
  if (t === "warning") return theme.colors.warning;
  return theme.colors.primary;
}

function pickIcon(t: AlertType) {
  if (t === "danger") return "alert-octagon-outline";
  if (t === "warning") return "alert-outline";
  return "information-outline";
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "700" },

  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "800" },
  alertDetail: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },
  alertTime: { color: theme.colors.subText, fontSize: 12 },
});

