import Card from "@/components/Card";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

const DEFAULT_REGION = {
  latitude: 16.0544,
  longitude: 108.2022,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function MapScreen() {
  const state = useMemo(
    () => ({
      location: { lat: 16.0544, lng: 108.2022 },
      safeZoneRadiusM: 120,
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
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.title}>Vị trí người dùng</Text>
            <Text style={styles.sub}>Cập nhật: {state.lastUpdate}</Text>
          </View>

          <View style={[styles.pill, { borderColor: `${zoneColor}55` }]}>
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
            value={state.location.lat.toFixed(4)}
          />
          <MetaItem
            icon="longitude"
            label="Lng"
            value={state.location.lng.toFixed(4)}
          />
        </View>
      </Card>

      {Platform.OS === "web" ? (
        <View style={styles.mapFallback}>
          <MaterialCommunityIcons
            name="map-search-outline"
            size={36}
            color={theme.colors.subText}
          />
          <Text style={styles.mapFallbackTitle}>Map hiện hỗ trợ tốt trên app mobile</Text>
          <Text style={styles.mapFallbackSub}>
            Hãy mở trên Android hoặc iOS để xem bản đồ tương tác.
          </Text>
        </View>
      ) : (
        <View style={styles.mapCard}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={DEFAULT_REGION}
            showsCompass
            showsScale
          >
            <Circle
              center={{
                latitude: state.location.lat,
                longitude: state.location.lng,
              }}
              radius={state.safeZoneRadiusM}
              fillColor={`${zoneColor}20`}
              strokeColor={`${zoneColor}88`}
              strokeWidth={2}
            />
            <Marker
              coordinate={{
                latitude: state.location.lat,
                longitude: state.location.lng,
              }}
              title="Người dùng"
              description={`Cập nhật ${state.lastUpdate}`}
            />
            <Marker
              coordinate={{
                latitude: state.location.lat + 0.0018,
                longitude: state.location.lng + 0.0016,
              }}
              pinColor={theme.colors.warning}
              title="Vật cản gần nhất"
              description={`Khoảng cách ${state.nearestObstacleM} m`}
            />
          </MapView>

          <View style={styles.mapLegend}>
            <View style={styles.legendRow}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.colors.primary }]}
              />
              <Text style={styles.legendText}>Vị trí hiện tại</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: zoneColor }]} />
              <Text style={styles.legendText}>
                Vùng an toàn {state.safeZoneRadiusM}m
              </Text>
            </View>
          </View>
        </View>
      )}

      <SectionTitle title="Thông tin nguy cơ gần nhất" />

      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${theme.colors.warning}18` },
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
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },
  metaLabel: { color: theme.colors.subText, fontSize: 11 },
  metaValue: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },

  mapCard: {
    minHeight: 300,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    marginBottom: theme.spacing(1),
  },
  mapLegend: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 99 },
  legendText: { color: theme.colors.text, fontSize: 12, fontWeight: "600" },

  mapFallback: {
    minHeight: 260,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
  mapFallbackTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  mapFallbackSub: {
    color: theme.colors.subText,
    fontSize: 12,
    textAlign: "center",
  },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
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
