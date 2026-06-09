import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";
import {
  getMobileNotifications,
  markMobileNotificationRead,
  mobileNotificationsQueryKey,
  type MobileNotification,
} from "@/src/api/notificationService";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type NotificationFilter = "all" | "unread" | "read";
type NotificationTone = "danger" | "warning" | "info";

export default function NotificationsScreen() {
  const { isLoadingAuth, userId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const {
    data: notifications = [],
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: mobileNotificationsQueryKey,
    queryFn: getMobileNotifications,
    enabled: Boolean(userId),
  });

  const markReadMutation = useMutation({
    mutationFn: markMobileNotificationRead,
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<MobileNotification[]>(
        mobileNotificationsQueryKey,
        (currentNotifications = []) =>
          currentNotifications.map((notification) =>
            notification.id === updatedNotification.id
              ? updatedNotification
              : notification,
          ),
      );
    },
    onError: () => {
      Alert.alert(
        "Không thể đánh dấu đã đọc",
        "Vui lòng kiểm tra kết nối và thử lại.",
      );
    },
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length;

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (filter === "unread") {
          return !notification.read_at;
        }

        if (filter === "read") {
          return Boolean(notification.read_at);
        }

        return true;
      }),
    [filter, notifications],
  );

  const handleNotificationPress = (notification: MobileNotification) => {
    if (notification.read_at || markReadMutation.isPending) {
      return;
    }

    markReadMutation.mutate(notification.id);
  };

  if (isLoadingAuth || (userId && isLoading)) {
    return (
      <Screen>
        <EmptyState
          title="Đang tải thông báo..."
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
          desc="Vui lòng đăng nhập để xem thông báo."
        />
      </Screen>
    );
  }

  if (isError && notifications.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Không tải được thông báo"
          desc="Có lỗi khi lấy dữ liệu theo thiết bị, vui lòng thử lại."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={filteredNotifications}
        keyExtractor={(notification) => notification.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            tintColor={theme.colors.primary}
            onRefresh={refetch}
          />
        }
        ListHeaderComponent={
          <View>
            <NotificationSummary
              totalCount={notifications.length}
              unreadCount={unreadCount}
            />
            <View style={styles.filterRow}>
              <FilterChip
                label="Tất cả"
                count={notifications.length}
                active={filter === "all"}
                onPress={() => setFilter("all")}
              />
              <FilterChip
                label="Chưa đọc"
                count={unreadCount}
                active={filter === "unread"}
                onPress={() => setFilter("unread")}
              />
              <FilterChip
                label="Đã đọc"
                count={notifications.length - unreadCount}
                active={filter === "read"}
                onPress={() => setFilter("read")}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={filter === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo"}
            desc={
              filter === "read"
                ? "Chưa có thông báo nào được đánh dấu đã đọc."
                : "Thông báo mới từ thiết bị sẽ xuất hiện tại đây."
            }
          />
        }
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            isMarkingRead={
              markReadMutation.isPending &&
              markReadMutation.variables === item.id
            }
            onPress={() => handleNotificationPress(item)}
          />
        )}
      />
    </Screen>
  );
}

function NotificationSummary({
  totalCount,
  unreadCount,
}: {
  totalCount: number;
  unreadCount: number;
}) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons
          name="bell-ring-outline"
          size={24}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryEyebrow}>HỘP THƯ THIẾT BỊ</Text>
        <Text style={styles.summaryTitle}>
          {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Bạn đã xem hết thông báo"}
        </Text>
        <Text style={styles.summaryDescription}>
          {totalCount} thông báo được gửi tới thiết bị này
        </Text>
      </View>
      <View
        style={[
          styles.unreadCounter,
          unreadCount === 0 && styles.unreadCounterClear,
        ]}
      >
        <Text
          style={[
            styles.unreadCounterText,
            unreadCount === 0 && styles.unreadCounterTextClear,
          ]}
        >
          {unreadCount}
        </Text>
      </View>
    </Card>
  );
}

function NotificationCard({
  notification,
  isMarkingRead,
  onPress,
}: {
  notification: MobileNotification;
  isMarkingRead: boolean;
  onPress: () => void;
}) {
  const isUnread = !notification.read_at;
  const tone = mapRiskLevel(notification.event.risk_level);
  const color = pickToneColor(tone);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.event.title}. ${
        isUnread ? "Chưa đọc" : "Đã đọc"
      }`}
      disabled={!isUnread || isMarkingRead}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.cardPressed}
    >
      <Card
        style={{
          ...styles.notificationCard,
          ...(isUnread ? styles.unreadCard : {}),
          ...(isUnread ? { borderColor: `${color}55` } : {}),
        }}
      >
        <View style={styles.notificationRow}>
          <View
            style={[
              styles.notificationIcon,
              { backgroundColor: `${color}${isUnread ? "20" : "12"}` },
            ]}
          >
            <MaterialCommunityIcons
              name={pickToneIcon(tone)}
              size={21}
              color={color}
            />
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.notificationTitleRow}>
              <Text
                numberOfLines={2}
                style={[
                  styles.notificationTitle,
                  !isUnread && styles.readTitle,
                ]}
              >
                {notification.event.title || "Thông báo NavicAid"}
              </Text>
              {isUnread ? <View style={[styles.unreadDot, { backgroundColor: color }]} /> : null}
            </View>

            <Text numberOfLines={3} style={styles.notificationMessage}>
              {notification.event.message || "Không có nội dung chi tiết."}
            </Text>

            <View style={styles.notificationMeta}>
              <View style={[styles.riskBadge, { backgroundColor: `${color}14` }]}>
                <Text style={[styles.riskBadgeText, { color }]}>
                  {formatRiskLevel(notification.event.risk_level)}
                </Text>
              </View>
              <Text style={styles.notificationTime}>
                {formatDateTime(notification.created_at)}
              </Text>
              <Text style={[styles.readState, isUnread && { color }]}>
                {isMarkingRead ? "Đang cập nhật..." : isUnread ? "Chạm để đánh dấu đã đọc" : "Đã đọc"}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterCount, active && styles.filterCountActive]}>
        <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function mapRiskLevel(riskLevel?: string | null): NotificationTone {
  const normalizedRiskLevel = riskLevel?.toLowerCase();

  if (normalizedRiskLevel === "high" || normalizedRiskLevel === "danger") {
    return "danger";
  }

  if (normalizedRiskLevel === "warning" || normalizedRiskLevel === "caution") {
    return "warning";
  }

  return "info";
}

function pickToneColor(tone: NotificationTone) {
  if (tone === "danger") return theme.colors.danger;
  if (tone === "warning") return theme.colors.warning;
  return theme.colors.primary;
}

function pickToneIcon(tone: NotificationTone) {
  if (tone === "danger") return "alert-octagon-outline";
  if (tone === "warning") return "alert-outline";
  return "bell-outline";
}

function formatRiskLevel(riskLevel?: string | null) {
  const tone = mapRiskLevel(riskLevel);

  if (tone === "danger") return "Nguy hiểm";
  if (tone === "warning") return "Cảnh báo";
  return "Thông tin";
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

const styles = StyleSheet.create({
  listContent: {
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(3),
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    backgroundColor: "#F4F8FF",
    borderColor: "#CFE0FF",
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.primary}16`,
  },
  summaryContent: {
    flex: 1,
  },
  summaryEyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryDescription: {
    color: theme.colors.subText,
    fontSize: 11,
    marginTop: 3,
  },
  unreadCounter: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  unreadCounterClear: {
    backgroundColor: `${theme.colors.success}16`,
  },
  unreadCounterText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: "900",
  },
  unreadCounterTextClear: {
    color: theme.colors.success,
  },
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing(1),
    marginVertical: theme.spacing(2),
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  filterChipActive: {
    borderColor: `${theme.colors.primary}66`,
    backgroundColor: `${theme.colors.primary}12`,
  },
  filterChipText: {
    color: theme.colors.subText,
    fontSize: 11,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.border,
  },
  filterCountActive: {
    backgroundColor: theme.colors.primary,
  },
  filterCountText: {
    color: theme.colors.subText,
    fontSize: 10,
    fontWeight: "900",
  },
  filterCountTextActive: {
    color: theme.colors.background,
  },
  cardPressed: {
    opacity: 0.72,
  },
  notificationCard: {
    padding: theme.spacing(1.5),
  },
  unreadCard: {
    backgroundColor: "#F7FAFF",
    borderWidth: 1.5,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  readTitle: {
    color: theme.colors.subText,
    fontWeight: "800",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  notificationMessage: {
    color: theme.colors.subText,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  notificationMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
  },
  riskBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  notificationTime: {
    color: theme.colors.subText,
    fontSize: 10,
  },
  readState: {
    color: theme.colors.subText,
    fontSize: 10,
    fontWeight: "800",
  },
});
