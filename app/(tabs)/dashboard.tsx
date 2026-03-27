import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import Screen from "@/components/Screen";
import Card from "@/components/Card";
import SectionTitle from "@/components/SectionTitle";
import EmptyState from "@/components/EmptyState";
import { theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type AlertType = "danger" | "warning" | "info";
type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
};

export default function DashboardScreen() {
  // Mock data (sau này bạn thay bằng API/state)
  const device = useMemo(
    () => ({
      status: "ONLINE" as "ONLINE" | "OFFLINE",
      lastSync: "2 phút trước",
      nearestDistanceM: 6.3,
      alertsToday: 2,
      safeZone: "Trong vùng an toàn",
    }),
    [],
  );

  const alerts: AlertItem[] = useMemo(
    () => [
      {
        id: "a1",
        type: "danger",
        title: "Vật cản nguy hiểm",
        detail: "0.8m phía trước",
        time: "09:21",
      },
      {
        id: "a2",
        type: "warning",
        title: "Ra khỏi vùng an toàn",
        detail: "Vượt 30m",
        time: "08:50",
      },
      {
        id: "a3",
        type: "info",
        title: "Thiết bị kết nối lại",
        detail: "Tín hiệu ổn định",
        time: "08:10",
      },
    ],
    [],
  );

  const statusColor =
    device.status === "ONLINE" ? theme.colors.success : theme.colors.danger;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>NavicAid</Text>
          <Text style={styles.subtitle}>Cập nhật: {device.lastSync}</Text>
        </View>

        <View style={[styles.pill, { borderColor: `${statusColor}66` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={styles.pillText}>{device.status}</Text>
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
              <Text style={styles.cardSub}>{device.safeZone}</Text>
            </View>
          </View>

          <Pressable style={styles.smallBtn} onPress={() => {}}>
            <Text style={styles.smallBtnText}>Chi tiết</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={theme.colors.subText}
            />
          </Pressable>
        </View>
      </Card>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatCard
          icon="map-marker-distance"
          label="Khoảng cách gần nhất"
          value={`${device.nearestDistanceM} m`}
          color={theme.colors.primary}
        />
        <View style={{ width: theme.spacing(1) }} />
        <StatCard
          icon="alert-circle-outline"
          label="Cảnh báo hôm nay"
          value={`${device.alertsToday}`}
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
