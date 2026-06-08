import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import {
  getMobileUserAlerts,
  type MobileAlert,
} from "@/src/api/alertService";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type AlertType = "danger" | "warning" | "info";
type AlertFilter = "all" | AlertType | "open" | "resolved";
type AlertItem = {
  id: string;
  type: AlertType;
  status: string;
  title: string;
  detail: string;
  time: string;
};

export default function AlertsScreen() {
  const { isLoadingAuth, userId } = useAuth();
  const [filter, setFilter] = useState<AlertFilter>("all");

  const { data: alerts = [], isLoading, isError } = useQuery({
    queryKey: ["mobile-alerts", userId, 1, 20],
    queryFn: () => getMobileUserAlerts(userId as string, { page: 1, limit: 20 }),
    enabled: Boolean(userId),
  });

  const alertItems: AlertItem[] = useMemo(
    () => alerts.map(mapApiAlertToUi),
    [alerts],
  );

  const filteredAlerts =
    filter === "all"
      ? alertItems
      : alertItems.filter(
          (alert) => alert.type === filter || normalizeStatus(alert.status) === filter,
        );

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
            <Chip
              text="Open"
              active={filter === "open"}
              onPress={() => setFilter("open")}
            />
            <Chip
              text="Resolved"
              active={filter === "resolved"}
              onPress={() => setFilter("resolved")}
            />
          </View>
        }
      />

      {isLoadingAuth ? (
        <EmptyState
          title="Đang kiểm tra phiên đăng nhập..."
          desc="Vui lòng chờ một chút."
        />
      ) : !userId ? (
        <EmptyState
          title="Chưa có phiên đăng nhập"
          desc="Vui lòng đăng nhập để xem cảnh báo."
        />
      ) : isLoading ? (
        <EmptyState title="Đang tải cảnh báo..." desc="Vui lòng chờ một chút." />
      ) : isError ? (
        <EmptyState
          title="Không tải được cảnh báo"
          desc="Có lỗi khi lấy dữ liệu, vui lòng thử lại."
        />
      ) : null}

      {!isLoadingAuth && userId && !isLoading && !isError && filteredAlerts.length === 0 ? (
        <EmptyState
          title="Không có cảnh báo"
          desc="Hiện không có sự kiện phù hợp bộ lọc."
        />
      ) : !isLoadingAuth && userId && !isLoading && !isError ? (
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

function mapApiAlertToUi(alert: MobileAlert, index: number): AlertItem {
  return {
    id: alert.id ?? `${alert.triggered_at}-${index}`,
    title: alert.message || "Không có nội dung cảnh báo.",
    type: mapRiskLevel(alert.risk_level),
    status: alert.status,
    detail: formatAlertDetail(alert),
    time: formatDateTime(alert.triggered_at),
  };
}

function formatAlertDetail(alert: MobileAlert) {
  const parts = [
    formatAlertType(alert.alert_type),
    formatStatus(alert.status),
    alert.distance_cm == null ? null : `Khoảng cách ${alert.distance_cm} cm`,
  ];

  return parts.filter(Boolean).join(" - ");
}

function formatAlertType(alertType: string) {
  return alertType
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function formatStatus(status: string) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "open") {
    return "Đang mở";
  }

  if (normalizedStatus === "resolved") {
    return "Đã xử lý";
  }

  return status;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function mapRiskLevel(riskLevel: string): AlertType {
  const normalizedRiskLevel = riskLevel.toLowerCase();

  if (normalizedRiskLevel === "high" || normalizedRiskLevel === "danger") {
    return "danger";
  }

  if (normalizedRiskLevel === "warning" || normalizedRiskLevel === "caution") {
    return "warning";
  }

  return "info";
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
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
