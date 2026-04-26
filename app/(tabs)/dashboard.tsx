import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { mapDashboardToUi, type UiAlert } from "@/src/api/transformers";
import { useAppSettings } from "@/src/state/AppSettingsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type AlertType = UiAlert["type"];
type UiDashboard = NonNullable<ReturnType<typeof mapDashboardToUi>>;

export default function DashboardScreen() {
  const { api, config, isAuthenticated, accessToken } = useAppSettings();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", config.apiUrl, config.blindUserId, accessToken],
    queryFn: () => api.getDashboard(config.blindUserId),
    enabled: isAuthenticated,
  });

  const device = data ? mapDashboardToUi(data) : null;
  const statusColor =
    device?.status === "ONLINE" ? theme.colors.success : theme.colors.danger;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>NavicAid</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {config.apiUrl} | {config.blindUserId}
          </Text>
        </View>

        <View style={[styles.pill, { borderColor: `${statusColor}66` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={styles.pillText}>{device?.status ?? "OFFLINE"}</Text>
        </View>
      </View>

      {!isAuthenticated ? (
        <EmptyState
          title="Chua dang nhap server"
          desc="Mo Settings, nhap API URL va dang nhap tai khoan mobile de tai du lieu."
        />
      ) : isLoading ? (
        <EmptyState
          title="Dang tai dashboard..."
          desc="Dang lay du lieu tu PBL5 server."
        />
      ) : isError ? (
        <EmptyState
          title="Khong tai duoc dashboard"
          desc={
            error instanceof Error
              ? error.message
              : "Kiem tra server URL va token."
          }
        />
      ) : device ? (
        <DashboardContent device={device} alerts={device.recentAlerts} />
      ) : null}
    </Screen>
  );
}

function DashboardContent({
  device,
  alerts,
}: {
  device: UiDashboard;
  alerts: UiAlert[];
}) {
  return (
    <>
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
              <Text style={styles.cardTitle}>Trang thai an toan</Text>
              <Text style={styles.cardSub}>{device.safeZone}</Text>
            </View>
          </View>

          <Pressable style={styles.smallBtn} onPress={() => {}}>
            <Text style={styles.smallBtnText}>Chi tiet</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={theme.colors.subText}
            />
          </Pressable>
        </View>
      </Card>

      <View style={styles.grid}>
        <StatCard
          icon="map-marker-distance"
          label="Khoang cach gan nhat"
          value={
            device.nearestDistanceM === null
              ? "N/A"
              : `${device.nearestDistanceM} m`
          }
          color={theme.colors.primary}
        />
        <View style={{ width: theme.spacing(1) }} />
        <StatCard
          icon="alert-circle-outline"
          label="Canh bao hom nay"
          value={`${device.alertsToday}`}
          color={theme.colors.warning}
        />
      </View>

      <SectionTitle title="Canh bao gan day" />

      {alerts.length === 0 ? (
        <EmptyState
          title="Khong co canh bao"
          desc="Chua co su kien moi tu server."
        />
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
                </View>

                <Text style={styles.alertTime}>{item.time}</Text>
              </View>
            </Card>
          )}
          ListFooterComponent={<View style={{ height: theme.spacing(2) }} />}
        />
      )}
    </>
  );
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
    gap: theme.spacing(1),
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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

