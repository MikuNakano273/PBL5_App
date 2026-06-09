import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import {
  getMobileDashboard,
  getMobileUserDevices,
  type DashboardAlert,
  type MobileDashboard,
  type MobileDevice,
} from "@/src/api/dashboardService";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type AlertType = "danger" | "warning" | "info";
type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
};

export default function DashboardScreen() {
  const { isLoadingAuth, userId } = useAuth();

  const {
    data: dashboard,
    isError: isDashboardError,
    isLoading: isLoadingDashboard,
  } = useQuery({
    queryKey: ["mobile-dashboard", userId],
    queryFn: getMobileDashboard,
    enabled: Boolean(userId),
    refetchInterval: 30000,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["mobile-devices", userId],
    queryFn: getMobileUserDevices,
    enabled: Boolean(userId),
  });

  const summary = useMemo(
    () => mapDashboardSummary(dashboard, devices),
    [dashboard, devices],
  );

  const alerts: AlertItem[] = useMemo(
    () => (dashboard?.recent_alerts ?? []).map(mapDashboardAlertToUi),
    [dashboard?.recent_alerts],
  );

  const statusColor = pickSafetyColor(summary.alertType);

  if (isLoadingAuth || (userId && isLoadingDashboard)) {
    return (
      <Screen>
        <EmptyState
          title="Đang tải dashboard..."
          desc="Vui lòng chờ trong giây lát."
        />
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <EmptyState
          title="Chưa có phiên đăng nhập"
          desc="Vui lòng đăng nhập để xem dashboard."
        />
      </Screen>
    );
  }

  if (isDashboardError) {
    return (
      <Screen>
        <EmptyState
          title="Không tải được dashboard"
          desc="Có lỗi khi lấy dữ liệu từ server, vui lòng thử lại."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>NavicAid</Text>
          <Text style={styles.subtitle}>Cập nhật: {summary.lastUpdated}</Text>
        </View>

        <View style={[styles.pill, { borderColor: `${statusColor}66` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={styles.pillText}>{summary.deviceStatus}</Text>
        </View>
      </View>

      {/* Top status card */}
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${theme.colors.primary}22` },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View>
              <Text style={styles.cardTitle}>Trạng thái an toàn</Text>
              <Text style={styles.cardSub}>{summary.safetyText}</Text>
            </View>
          </View>

        </View>
      </Card>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatCard
          icon="map-marker-distance"
          label="Khoảng cách gần nhất"
          value={summary.nearestDistanceText}
          color={theme.colors.primary}
        />
        <View style={{ width: theme.spacing(1) }} />
        <StatCard
          icon="alert-circle-outline"
          label="Cảnh báo hôm nay"
          value={`${summary.todayAlertCount}`}
          color={theme.colors.warning}
        />
      </View>

      <SectionTitle title="Cảnh báo gần đây" />

      {alerts.length === 0 ? (
        <EmptyState title="Không có cảnh báo" desc="Mọi thứ đang an toàn." />
      ) : (
        <FlatList
          data={alerts}
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
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Xem chi tiết ${item.title}`}
                    onPress={() =>
                      router.push({
                        pathname: "/alerts/[id]",
                        params: { id: item.id },
                      })
                    }
                    style={styles.smallBtn}
                  >
                    <Text style={styles.smallBtnText}>Chi tiết</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={theme.colors.subText}
                    />
                  </Pressable>
                </View>

                <Text style={styles.alertTime}>{item.time}</Text>
              </View>
            </Card>
          )}
          ListFooterComponent={<View style={{ height: theme.spacing(2) }} />}
        />
      )}
    </Screen>
  );
}

function mapDashboardSummary(
  dashboard: MobileDashboard | undefined,
  devices: MobileDevice[],
) {
  const primaryDevice = devices[0];
  const safety = mapSafetyStatus(
    dashboard?.current_safety_status,
    dashboard?.is_safe,
  );
  const lastSeenAt =
    dashboard?.device_last_seen_at ??
    primaryDevice?.last_seen_at ??
    dashboard?.last_seen_at ??
    null;

  return {
    alertType: safety.alertType,
    deviceStatus: mapDeviceStatus(primaryDevice?.status, dashboard?.device_count),
    lastUpdated: formatDateTime(lastSeenAt),
    nearestDistanceText: formatDistance(dashboard?.nearest_distance_cm),
    safetyText: safety.text,
    todayAlertCount: dashboard?.today_alert_count ?? 0,
  };
}

function mapSafetyStatus(status?: string | null, isSafe?: boolean) {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === "safe" || (!normalizedStatus && isSafe === true)) {
    return { text: "An toàn", alertType: "info" as AlertType };
  }

  if (normalizedStatus === "warning" || normalizedStatus === "caution") {
    return { text: "Cần chú ý", alertType: "warning" as AlertType };
  }

  if (
    normalizedStatus === "danger" ||
    normalizedStatus === "high" ||
    (!normalizedStatus && isSafe === false)
  ) {
    return { text: "Nguy hiểm", alertType: "danger" as AlertType };
  }

  return { text: "Chưa có dữ liệu", alertType: "info" as AlertType };
}

function mapDeviceStatus(status?: string, deviceCount?: number | null) {
  if (!status && !deviceCount) {
    return "CHƯA CÓ THIẾT BỊ";
  }

  if (status?.toLowerCase() === "online") {
    return "ONLINE";
  }

  if (status?.toLowerCase() === "offline") {
    return "OFFLINE";
  }

  return status?.toUpperCase() ?? `${deviceCount} THIẾT BỊ`;
}

function formatDistance(distanceCm?: number | null) {
  if (distanceCm == null) {
    return "Chưa có dữ liệu";
  }

  return `${(distanceCm / 100).toFixed(1)} m`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

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

function mapDashboardAlertToUi(alert: DashboardAlert): AlertItem {
  return {
    id: alert.id,
    type: mapRiskLevel(alert.risk_level),
    title: alert.title || "Cảnh báo",
    detail: alert.message || "Không có nội dung cảnh báo.",
    time: formatDateTime(alert.triggered_at),
  };
}

function mapRiskLevel(riskLevel?: string): AlertType {
  const normalizedRiskLevel = riskLevel?.toLowerCase();

  if (normalizedRiskLevel === "high" || normalizedRiskLevel === "danger") {
    return "danger";
  }

  if (normalizedRiskLevel === "warning" || normalizedRiskLevel === "caution") {
    return "warning";
  }

  return "info";
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card style={{ flex: 1, padding: theme.spacing(2) }}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${color}22`, marginBottom: theme.spacing(1) },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  );
}

function pickColor(t: AlertType) {
  if (t === "danger") return theme.colors.danger;
  if (t === "warning") return theme.colors.warning;
  return theme.colors.primary;
}
function pickSafetyColor(t: AlertType) {
  if (t === "danger") return theme.colors.danger;
  if (t === "warning") return theme.colors.warning;
  return theme.colors.success;
}
function pickIcon(t: AlertType) {
  if (t === "danger") return "alert-octagon-outline";
  if (t === "warning") return "alert-outline";
  return "information-outline";
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  appTitle: { color: theme.colors.text, fontSize: 22, fontWeight: "900" },
  subtitle: { color: theme.colors.subText, fontSize: 12, marginTop: 4 },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 99 },
  pillText: { color: theme.colors.text, fontSize: 12, fontWeight: "800" },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  cardSub: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },

  smallBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  smallBtnText: {
    color: theme.colors.subText,
    fontSize: 12,
    fontWeight: "800",
  },

  grid: { flexDirection: "row", marginBottom: theme.spacing(2) },
  statLabel: { color: theme.colors.subText, fontSize: 12 },
  statValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  alertDetail: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },
  alertTime: { color: theme.colors.subText, fontSize: 12 },
});
