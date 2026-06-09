import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { getMobileMe, type MobileUser } from "@/src/api/authService";
import {
  getMobileUserDevices,
  type MobileDevice,
} from "@/src/api/dashboardService";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AccountScreen() {
  const { isLoadingAuth, user: authenticatedUser, userId } = useAuth();

  const {
    data: user,
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: ["mobile-me", userId],
    queryFn: getMobileMe,
    enabled: Boolean(userId),
    placeholderData: authenticatedUser ?? undefined,
  });

  const {
    data: devices = [],
    isError: isDevicesError,
    isLoading: isLoadingDevices,
  } = useQuery({
    queryKey: ["mobile-devices", userId],
    queryFn: getMobileUserDevices,
    enabled: Boolean(userId),
  });

  if (isLoadingAuth || (userId && isLoadingUser)) {
    return (
      <Screen>
        <EmptyState
          title="Đang tải tài khoản..."
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
          desc="Vui lòng đăng nhập để xem thông tin tài khoản."
        />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <EmptyState
          title="Không tải được tài khoản"
          desc="Có lỗi khi lấy thông tin từ server, vui lòng thử lại."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AccountHero user={user} />

        <SectionTitle
          title="Thông tin tài khoản"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chỉnh sửa hồ sơ"
              onPress={() => router.push("/account/edit")}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </Pressable>
          }
        />
        <Card style={styles.sectionCard}>
          <InfoRow
            icon="email-outline"
            label="Email"
            value={displayValue(user.email)}
          />
          <Divider />
          <InfoRow
            icon="phone-outline"
            label="Số điện thoại"
            value={displayValue(user.phone)}
          />
          <Divider />
          <InfoRow
            icon="account-key-outline"
            label="Vai trò"
            value={displayValue(user.role)}
          />
          <Divider />
          <InfoRow
            icon="account-check-outline"
            label="Trạng thái"
            value={displayValue(user.status)}
            valueColor={getStatusColor(user.status)}
          />
        </Card>

        <SectionTitle title="Bảo mật" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đổi mật khẩu"
          onPress={() => router.push("/account/change-password")}
          style={({ pressed }) => pressed && styles.securityCardPressed}
        >
          <Card style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Đổi mật khẩu</Text>
              <Text style={styles.securityDesc}>
                Cập nhật mật khẩu và đăng nhập lại trên thiết bị
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.colors.subText}
            />
          </Card>
        </Pressable>

        <SectionTitle title="Thiết bị liên kết" />
        {isLoadingDevices ? (
          <EmptyState
            title="Đang tải thiết bị..."
            desc="Vui lòng chờ trong giây lát."
          />
        ) : isDevicesError && devices.length === 0 ? (
          <EmptyState
            title="Không tải được thiết bị"
            desc="Có lỗi khi lấy danh sách thiết bị từ server."
          />
        ) : devices.length === 0 ? (
          <EmptyState
            title="Chưa có thiết bị liên kết"
            desc="Tài khoản này hiện chưa được liên kết với thiết bị nào."
          />
        ) : (
          devices.map((device) => <DeviceCard key={device.id} device={device} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function AccountHero({ user }: { user: MobileUser }) {
  return (
    <Card style={styles.heroCard}>
      <View style={styles.badge}>
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={14}
          color={theme.colors.primary}
        />
        <Text style={styles.badgeText}>Tài khoản NavicAid</Text>
      </View>

      <Text style={styles.name}>{displayValue(user.full_name)}</Text>
      <Text style={styles.email}>{displayValue(user.email)}</Text>

      <View style={styles.metricRow}>
        <MetricBlock
          icon="account-key-outline"
          label="Vai trò"
          value={displayValue(user.role)}
        />
        <MetricBlock
          icon="account-check-outline"
          label="Trạng thái"
          value={displayValue(user.status)}
          accent={getStatusColor(user.status)}
        />
      </View>
    </Card>
  );
}

function DeviceCard({ device }: { device: MobileDevice }) {
  return (
    <Card style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIcon}>
          <MaterialCommunityIcons
            name="access-point"
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.deviceTitleWrap}>
          <Text style={styles.deviceName}>{displayValue(device.name)}</Text>
          <Text style={styles.deviceCode}>
            {displayValue(device.device_code)}
          </Text>
        </View>
      </View>

      <Divider />
      <InfoRow
        icon="access-point-network"
        label="Trạng thái"
        value={displayValue(device.status)}
        valueColor={getStatusColor(device.status)}
      />
      <Divider />
      <InfoRow
        icon="battery-medium"
        label="Pin gần nhất"
        value={formatBattery(device.last_battery)}
      />
      <Divider />
      <InfoRow
        icon="clock-outline"
        label="Lần cuối kết nối"
        value={formatDateTime(device.last_seen_at)}
      />
    </Card>
  );
}

function MetricBlock({
  icon,
  label,
  value,
  accent = theme.colors.primary,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.metricBlock}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}16` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function displayValue(value?: string | null) {
  return value?.trim() || "Chưa có dữ liệu";
}

function formatBattery(battery?: number | null) {
  return battery == null ? "Chưa có dữ liệu" : `${battery}%`;
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
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusColor(status?: string | null) {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === "active" || normalizedStatus === "online") {
    return theme.colors.success;
  }

  if (normalizedStatus === "inactive" || normalizedStatus === "offline") {
    return theme.colors.danger;
  }

  return theme.colors.text;
}

const styles = StyleSheet.create({
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
    backgroundColor: `${theme.colors.primary}10`,
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  securityCardPressed: {
    opacity: 0.72,
  },
  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.primary}14`,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  securityDesc: {
    color: theme.colors.subText,
    fontSize: 11,
    marginTop: 3,
  },
  content: {
    paddingBottom: theme.spacing(3),
  },
  heroCard: {
    gap: theme.spacing(2),
    backgroundColor: "#F4F8FF",
    borderColor: "#CFE0FF",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: `${theme.colors.primary}14`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}28`,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  email: {
    color: theme.colors.subText,
    fontSize: 13,
    marginTop: -theme.spacing(1.5),
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: "#D8E5FF",
    borderRadius: theme.radius.lg,
    padding: theme.spacing(1.5),
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricLabel: {
    color: theme.colors.subText,
    fontSize: 11,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  sectionCard: {
    gap: theme.spacing(1),
  },
  deviceCard: {
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.primary}14`,
  },
  deviceTitleWrap: {
    flex: 1,
  },
  deviceName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  deviceCode: {
    color: theme.colors.subText,
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.subText,
    fontSize: 12,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 52,
  },
});
