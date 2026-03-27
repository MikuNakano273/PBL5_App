import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "@/components/Screen";
import Card from "@/components/Card";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function MapScreen() {
  // mock data (sau này thay bằng GPS/API)
  const state = useMemo(
    () => ({
      location: { lat: 16.0544, lng: 108.2022 },
      insideSafeZone: true,
      nearestObstacleM: 1.2,
      lastUpdate: "1 phút trước",
    }),
    [],
  );

  const zoneColor = state.insideSafeZone
    ? theme.colors.success
    : theme.colors.danger;

  return (
    <Screen>
      {/* Top summary card */}
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.title}>Vị trí người dùng</Text>
            <Text style={styles.sub}>Cập nhật: {state.lastUpdate}</Text>
          </View>

          <View style={[styles.pill, { borderColor: `${zoneColor}66` }]}>
            <View style={[styles.dot, { backgroundColor: zoneColor }]} />
            <Text style={styles.pillText}>
              {state.insideSafeZone
                ? "Trong vùng an toàn"
                : "Ngoài vùng an toàn"}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaItem
            icon="latitude"
            label="Lat"
            value={String(state.location.lat)}
          />
          <MetaItem
            icon="longitude"
            label="Lng"
            value={String(state.location.lng)}
          />
        </View>
      </Card>

      {/* Map placeholder (sau này thay bằng react-native-maps) */}
      <View style={styles.mapPlaceholder}>
        <MaterialCommunityIcons
          name="map-outline"
          size={38}
          color={theme.colors.subText}
        />
        <Text style={styles.mapText}>Map preview</Text>
        <Text style={styles.mapSub}>
          Tích hợp react-native-maps ở bước tiếp theo
        </Text>
      </View>

      <SectionTitle title="Thông tin nguy cơ gần nhất" />

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${theme.colors.warning}22` },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={20}
                color={theme.colors.warning}
              />
            </View>
            <View>
              <Text style={styles.itemTitle}>Vật cản gần nhất</Text>
              <Text style={styles.itemSub}>Khoảng cách ước tính</Text>
            </View>
          </View>

          <Text style={styles.bigValue}>{state.nearestObstacleM} m</Text>
        </View>
      </Card>
    </Screen>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={theme.colors.subText}
      />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: "800" },
  sub: { color: theme.colors.subText, fontSize: 12, marginTop: 4 },

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
  pillText: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },

  metaRow: {
    flexDirection: "row",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  metaItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
    gap: 4,
  },
  metaLabel: { color: theme.colors.subText, fontSize: 11 },
  metaValue: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },

  mapPlaceholder: {
    flex: 1,
    minHeight: 260,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: theme.spacing(1),
  },
  mapText: { color: theme.colors.text, fontWeight: "800" },
  mapSub: { color: theme.colors.subText, fontSize: 12 },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "800" },
  itemSub: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },
  bigValue: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },
});
