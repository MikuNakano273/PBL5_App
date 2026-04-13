import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { mockApi } from "@/src/mock/mockApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type AlertType = "danger" | "warning" | "info";
type ApiAlertItem = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  read: boolean;
};
type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
};

export default function AlertsScreen() {
  const [filter, setFilter] = useState<"all" | AlertType>("all");

  const { data: alertsResponse, isLoading, isError } = useQuery({
    queryKey: ["alerts", "U1"],
    queryFn: () => mockApi.getAlerts("U1"),
  });

  const alerts: AlertItem[] = useMemo(
    () => (alertsResponse?.items ?? []).map(mapApiAlertToUi),
    [alertsResponse],
  );

  const filteredAlerts =
    filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  return (
    <Screen>
      <SectionTitle
        title="Cảnh báo"
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

      {isLoading ? (
        <EmptyState title="Đang tải cảnh báo..." desc="Vui lòng chờ một chút." />
      ) : isError ? (
        <EmptyState
          title="Không tải được cảnh báo"
          desc="Có lỗi khi lấy dữ liệu, vui lòng thử lại."
        />
      ) : null}

      {!isLoading && !isError && filteredAlerts.length === 0 ? (
        <EmptyState
          title="Không có cảnh báo"
          desc="Hiện không có sự kiện phù hợp bộ lọc."
        />
      ) : !isLoading && !isError ? (
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
      ) : null}
    </Screen>
  );
}

function mapApiAlertToUi(alert: ApiAlertItem): AlertItem {
  return {
    id: alert.id,
    title: alert.title,
    type: mapApiType(alert.type),
    detail: alert.read ? "Đã đọc" : "Chưa đọc",
    time: alert.createdAt,
  };
}

function mapApiType(type: string): AlertType {
  if (type === "OBSTACLE") return "danger";
  if (type === "SAFE_ZONE") return "warning";
  return "info";
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
