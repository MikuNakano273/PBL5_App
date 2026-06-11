import { theme } from "@/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import {
  isDangerNotification,
  useInAppNotification,
} from "@/src/notifications/InAppNotificationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InAppNotificationBanner() {
  const { isAuthenticated } = useAuth();
  const { currentNotification, dismissCurrentNotification } =
    useInAppNotification();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated || !currentNotification) {
    return null;
  }

  const isDanger = isDangerNotification(currentNotification);
  const color = isDanger ? theme.colors.danger : theme.colors.primary;

  const handleViewDetail = () => {
    if (!currentNotification.alertId) {
      return;
    }

    const alertId = currentNotification.alertId;
    dismissCurrentNotification();
    router.push({
      pathname: "/alerts/[id]",
      params: { id: alertId },
    });
  };

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View
        accessibilityLiveRegion="assertive"
        style={[
          styles.banner,
          {
            borderColor: `${color}55`,
            marginTop: insets.top + theme.spacing(1),
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons
            name={isDanger ? "alert-octagon-outline" : "bell-ring-outline"}
            size={24}
            color={color}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color }]}>
            {isDanger ? "CẢNH BÁO NGUY HIỂM" : "THÔNG BÁO MỚI"}
          </Text>
          <Text numberOfLines={2} style={styles.title}>
            {currentNotification.title}
          </Text>
          {currentNotification.message ? (
            <Text numberOfLines={2} style={styles.message}>
              {currentNotification.message}
            </Text>
          ) : null}
          {currentNotification.alertId ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleViewDetail}
              style={({ pressed }) => [
                styles.detailButton,
                { backgroundColor: color },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.detailButtonText}>Xem chi tiết</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Đóng thông báo"
          accessibilityRole="button"
          hitSlop={10}
          onPress={dismissCurrentNotification}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={theme.colors.subText}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    alignItems: "center",
    paddingHorizontal: theme.spacing(1.5),
  },
  banner: {
    width: "100%",
    maxWidth: 640,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    backgroundColor: theme.colors.background,
    ...theme.shadow.card,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  message: {
    color: theme.colors.subText,
    fontSize: 13,
    lineHeight: 18,
  },
  detailButton: {
    alignSelf: "flex-start",
    marginTop: theme.spacing(0.75),
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.9),
    borderRadius: theme.radius.pill,
  },
  detailButtonText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: "800",
  },
  closeButton: {
    padding: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});
