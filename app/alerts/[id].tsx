import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";
import { getMobileAlert, type MobileAlert } from "@/src/api/alertService";
import { type NormalizedApiError } from "@/src/api/http";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AlertDetailScreen() {
  const { isLoadingAuth, userId } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const alertId = normalizeRouteParam(params.id);

  const {
    data: alert,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["mobile-alert", alertId],
    queryFn: () => getMobileAlert(alertId),
    enabled: Boolean(userId && alertId),
    retry: (failureCount, queryError) =>
      !isNotFoundError(queryError) && failureCount < 2,
  });

  if (isLoadingAuth || (userId && alertId && isLoading)) {
    return (
      <Screen>
        <EmptyState
          title="Đang tải chi tiết cảnh báo..."
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
          desc="Vui lòng đăng nhập để xem chi tiết cảnh báo."
        />
      </Screen>
    );
  }

  if (!alertId) {
    return (
      <Screen>
        <EmptyState
          title="Không tìm thấy cảnh báo"
          desc="Đường dẫn cảnh báo không hợp lệ."
        />
      </Screen>
    );
  }

  if (isError) {
    const notFound = isNotFoundError(error);

    return (
      <Screen>
        <EmptyState
          title={notFound ? "Không tìm thấy cảnh báo" : "Không tải được cảnh báo"}
          desc={
            notFound
              ? "Cảnh báo không tồn tại hoặc bạn không có quyền xem."
              : "Có lỗi khi lấy dữ liệu từ server."
          }
        />
        {!notFound && (
          <RetryButton isFetching={isFetching} onPress={() => refetch()} />
        )}
      </Screen>
    );
  }

  if (!alert) {
    return (
      <Screen>
        <EmptyState
          title="Không có dữ liệu cảnh báo"
          desc="Server không trả về nội dung cho cảnh báo này."
        />
        <RetryButton isFetching={isFetching} onPress={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AlertHeader alert={alert} />

        <Card>
          <DetailRow label="Loại cảnh báo" value={formatLabel(alert.alert_type)} />
          <Divider />
          <DetailRow label="Mức độ rủi ro" value={formatLabel(alert.risk_level)} />
          <Divider />
          <DetailRow label="Trạng thái" value={formatLabel(alert.status)} />
          <Divider />
          <DetailRow
            label="Khoảng cách"
            value={
              alert.distance_cm == null
                ? "Chưa có dữ liệu"
                : `${alert.distance_cm} cm`
            }
          />
        </Card>

        <Card>
          <DetailRow label="Vĩ độ (lat)" value={formatCoordinate(alert.lat)} />
          <Divider />
          <DetailRow label="Kinh độ (lng)" value={formatCoordinate(alert.lng)} />
          <Divider />
          <DetailRow label="Thời điểm cảnh báo" value={formatDateTime(alert.triggered_at)} />
          {alert.resolved_at && (
            <>
              <Divider />
              <DetailRow label="Thời điểm xử lý" value={formatDateTime(alert.resolved_at)} />
            </>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function AlertHeader({ alert }: { alert: MobileAlert }) {
  const color = pickRiskColor(alert.risk_level);

  return (
    <Card style={{ borderColor: `${color}55` }}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons
            name="alert-octagon-outline"
            size={26}
            color={color}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{alert.title || "Cảnh báo"}</Text>
          <Text style={styles.message}>
            {alert.message || "Không có nội dung chi tiết."}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function RetryButton({
  isFetching,
  onPress,
}: {
  isFetching: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isFetching}
      onPress={onPress}
      style={({ pressed }) => [
        styles.retryButton,
        (pressed || isFetching) && styles.retryButtonPressed,
      ]}
    >
      <MaterialCommunityIcons
        name="refresh"
        size={18}
        color={theme.colors.background}
      />
      <Text style={styles.retryButtonText}>
        {isFetching ? "Đang thử lại..." : "Thử lại"}
      </Text>
    </Pressable>
  );
}

function normalizeRouteParam(value?: string | string[]) {
  const routeValue = Array.isArray(value) ? value[0] : value;
  return routeValue?.trim() ?? "";
}

function isNotFoundError(error: unknown) {
  return (error as Partial<NormalizedApiError> | undefined)?.status === 404;
}

function formatLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function formatCoordinate(value: number | null) {
  return value == null ? "Chưa có dữ liệu" : value.toFixed(6);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function pickRiskColor(riskLevel: string) {
  const normalizedRiskLevel = riskLevel.toLowerCase();

  if (normalizedRiskLevel === "high" || normalizedRiskLevel === "danger") {
    return theme.colors.danger;
  }

  if (normalizedRiskLevel === "warning" || normalizedRiskLevel === "caution") {
    return theme.colors.warning;
  }

  return theme.colors.primary;
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  message: {
    color: theme.colors.subText,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  detailRow: {
    gap: 4,
    paddingVertical: 4,
  },
  detailLabel: {
    color: theme.colors.subText,
    fontSize: 11,
    fontWeight: "700",
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing(1),
  },
  retryButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.25),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: "800",
  },
});
