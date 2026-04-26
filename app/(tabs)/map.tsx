import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import {
  mapDashboardToUi,
  mapLatestLocationToUi,
} from "@/src/api/transformers";
import { useAppSettings } from "@/src/state/AppSettingsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MapScreen() {
  const { api, config, isAuthenticated, accessToken } = useAppSettings();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["map", config.apiUrl, config.blindUserId, accessToken],
    queryFn: async () => {
      const [locations, dashboard, devices] = await Promise.all([
        api.getLocations(config.blindUserId),
        api.getDashboard(config.blindUserId),
        api.getDevices(config.blindUserId),
      ]);

      return {
        location: mapLatestLocationToUi(locations),
        dashboard: mapDashboardToUi(dashboard),
        deviceCount: devices.length,
      };
    },
    enabled: isAuthenticated,
  });

  const insideSafeZone = data?.dashboard.safeZone === "Trong vung an toan";
  const zoneColor = insideSafeZone
    ? theme.colors.success
    : theme.colors.danger;

  return (
    <Screen>
      {!isAuthenticated ? (
        <EmptyState
          title="Chua dang nhap server"
          desc="Mo Settings va dang nhap de tai vi tri."
        />
      ) : isLoading ? (
        <EmptyState
          title="Dang tai vi tri..."
          desc="Dang lay GPS va thiet bi tu PBL5 server."
        />
      ) : isError ? (
        <EmptyState
          title="Khong tai duoc ban do"
          desc={
            error instanceof Error
              ? error.message
              : "Kiem tra server URL va token."
          }
        />
      ) : (
        <>
          <Card style={{ marginBottom: theme.spacing(2) }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Vi tri nguoi dung</Text>
                <Text style={styles.sub}>
                  Cap nhat: {data?.location?.updatedAt || "Chua co du lieu"}
                </Text>
              </View>

              <View style={[styles.pill, { borderColor: `${zoneColor}66` }]}>
                <View style={[styles.dot, { backgroundColor: zoneColor }]} />
                <Text style={styles.pillText}>
                  {insideSafeZone
                    ? "Trong vung an toan"
                    : "Ngoai vung an toan"}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <MetaItem
                icon="latitude"
                label="Lat"
                value={String(data?.location?.lat ?? "N/A")}
              />
              <MetaItem
                icon="longitude"
                label="Lng"
                value={String(data?.location?.lng ?? "N/A")}
              />
            </View>
          </Card>

          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons
              name="map-outline"
              size={38}
              color={theme.colors.subText}
            />
            <Text style={styles.mapText}>Map preview</Text>
            <Text style={styles.mapSub}>
              {data?.location
                ? `${data.location.lat}, ${data.location.lng}`
                : "Server chua co diem GPS"}
            </Text>
          </View>

          <SectionTitle title="Thong tin nguy co gan nhat" />

          <Card>
            <View style={styles.rowBetween}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
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
                  <Text style={styles.itemTitle}>Vat can gan nhat</Text>
                  <Text style={styles.itemSub}>
                    Thiet bi lien ket: {data?.deviceCount ?? 0}
                  </Text>
                </View>
              </View>

              <Text style={styles.bigValue}>
                {data?.dashboard.nearestDistanceM ?? "N/A"} m
              </Text>
            </View>
          </Card>
        </>
      )}
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
    gap: theme.spacing(1),
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

