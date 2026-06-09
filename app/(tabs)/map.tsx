import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import {
  getMobileDashboard,
  type DashboardLocation,
  type MobileDashboard,
} from "@/src/api/dashboardService";
import {
  getMobileUserLocations,
  type MobileLocation,
} from "@/src/api/locationService";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const MAP_REFETCH_INTERVAL_MS = 10000;

export default function MapScreen() {
  const { isLoadingAuth, userId } = useAuth();

  const {
    data: locations = [],
    isError: isLocationsError,
    isLoading: isLoadingLocations,
  } = useQuery({
    queryKey: ["mobile-locations", userId, 1],
    queryFn: () => getMobileUserLocations(userId as string, { limit: 1 }),
    enabled: Boolean(userId),
    refetchInterval: MAP_REFETCH_INTERVAL_MS,
  });

  const {
    data: dashboard,
    isError: isDashboardError,
    isLoading: isLoadingDashboard,
  } = useQuery({
    queryKey: ["mobile-dashboard", userId],
    queryFn: () => getMobileDashboard(userId as string),
    enabled: Boolean(userId),
    refetchInterval: MAP_REFETCH_INTERVAL_MS,
  });

  const state = useMemo(
    () => mapScreenState(locations, dashboard),
    [dashboard, locations],
  );

  const statusColor = pickStatusColor(dashboard);
  const isLoadingData = isLoadingLocations || isLoadingDashboard;
  const hasRecoverableLocationFallback =
    isLocationsError && Boolean(extractDashboardCoordinate(dashboard?.last_location));
  const isError = (isLocationsError && !hasRecoverableLocationFallback) || isDashboardError;

  if (isLoadingAuth || (userId && isLoadingData)) {
    return (
      <Screen>
        <EmptyState
          title="Đang tải vị trí..."
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
          desc="Vui lòng đăng nhập để xem vị trí."
        />
      </Screen>
    );
  }

  if (isError && !state.coordinate) {
    return (
      <Screen>
        <EmptyState
          title="Không tải được vị trí"
          desc="Có lỗi khi lấy dữ liệu từ server, vui lòng thử lại."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ marginBottom: theme.spacing(2) }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.title}>Vị trí người dùng</Text>
            <Text style={styles.sub}>Cập nhật: {state.lastUpdate}</Text>
          </View>

          <View style={[styles.pill, { borderColor: `${statusColor}55` }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={styles.pillText}>{state.safetyText}</Text>
          </View>
        </View>

        {state.coordinate ? (
          <View style={styles.metaRow}>
            <MetaItem
              icon="latitude"
              label="Lat"
              value={state.coordinate.latitude.toFixed(4)}
            />
            <MetaItem
              icon="longitude"
              label="Lng"
              value={state.coordinate.longitude.toFixed(4)}
            />
          </View>
        ) : null}
      </Card>

      {!state.coordinate ? (
        <EmptyState
          title="Chưa có dữ liệu vị trí"
          desc="Thiết bị chưa gửi tọa độ hợp lệ về server."
        />
      ) : Platform.OS === "web" ? (
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
            region={{
              ...state.coordinate,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsCompass
            showsScale
          >
            <Marker
              coordinate={state.coordinate}
              title="Người dùng"
              description={`Cập nhật ${state.lastUpdate}`}
            />
          </MapView>

          <View style={styles.mapLegend}>
            <View style={styles.legendRow}>
              <View
                style={[styles.legendDot, { backgroundColor: theme.colors.primary }]}
              />
              <Text style={styles.legendText}>Vị trí hiện tại</Text>
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
              <Text style={styles.itemTitle}>Nguy cơ gần nhất</Text>
              <Text style={styles.itemSub}>Khoảng cách ước tính</Text>
            </View>
          </View>

          <Text style={styles.bigValue}>{state.nearestDistanceText}</Text>
        </View>
      </Card>
    </Screen>
  );
}

function mapScreenState(
  locations: MobileLocation[],
  dashboard: MobileDashboard | undefined,
) {
  const latestLocation = locations[0];
  const coordinate =
    extractLocationCoordinate(latestLocation) ??
    extractDashboardCoordinate(dashboard?.last_location);
  const lastUpdated =
    latestLocation?.recorded_at ?? dashboard?.last_seen_at ?? dashboard?.device_last_seen_at;

  return {
    coordinate,
    lastUpdate: formatDateTime(lastUpdated),
    nearestDistanceText: formatDistance(dashboard?.nearest_distance_cm),
    safetyText: mapSafetyText(dashboard),
  };
}

function extractLocationCoordinate(
  location: MobileLocation | undefined,
): MapCoordinate | null {
  if (!location) {
    return null;
  }

  const coordinate = createCoordinate(location.lat, location.lng);

  return coordinate ?? extractGeoJsonCoordinate(location.location);
}

function extractDashboardCoordinate(
  location: DashboardLocation | undefined,
): MapCoordinate | null {
  return extractGeoJsonCoordinate(location ?? null);
}

function extractGeoJsonCoordinate(
  location: { coordinates?: [number, number] } | null | undefined,
): MapCoordinate | null {
  const [longitude, latitude] = location?.coordinates ?? [];

  return createCoordinate(latitude, longitude);
}

function createCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): MapCoordinate | null {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
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

function formatDistance(distanceCm?: number | null) {
  if (distanceCm == null) {
    return "Chưa có dữ liệu";
  }

  return `${(distanceCm / 100).toFixed(1)} m`;
}

function mapSafetyText(dashboard: MobileDashboard | undefined) {
  const status = dashboard?.current_safety_status?.toLowerCase();

  if (status === "safe" || (!status && dashboard?.is_safe === true)) {
    return "An toàn";
  }

  if (status === "warning" || status === "caution") {
    return "Cần chú ý";
  }

  if (status === "danger" || status === "high" || (!status && dashboard?.is_safe === false)) {
    return "Nguy hiểm";
  }

  return "Chưa có dữ liệu";
}

function pickStatusColor(dashboard: MobileDashboard | undefined) {
  const status = dashboard?.current_safety_status?.toLowerCase();

  if (status === "danger" || status === "high" || (!status && dashboard?.is_safe === false)) {
    return theme.colors.danger;
  }

  if (status === "warning" || status === "caution") {
    return theme.colors.warning;
  }

  return theme.colors.success;
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
