import Card from "@/components/Card";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      Alert.alert(
        "Đã đăng xuất trên thiết bị",
        "Không thể xác nhận thu hồi phiên trên server. Vui lòng kiểm tra kết nối mạng.",
      );
    } finally {
      queryClient.clear();
      router.replace("/login");
    }
  };

  return (
    <Screen>
      <SectionTitle title="Cấu hình thiết bị" />

      <Card style={{ gap: theme.spacing(1) }}>
        <InfoRow
          icon="bell-outline"
          title="Bật cảnh báo"
          desc="Hiển thị cảnh báo khi gặp nguy hiểm"
          comingSoon
        />
        <Divider />
        <InfoRow
          icon="bell-badge-outline"
          title="Thông báo đẩy"
          desc="Ứng dụng nhận cảnh báo qua thông báo đẩy và tự cập nhật dữ liệu khi mở app."
        />
        <Divider />
        <InfoRow
          icon="vibrate"
          title="Rung khi cảnh báo"
          desc="Tăng độ nhận biết"
          comingSoon
        />
      </Card>

      <SectionTitle title="Hệ thống" />

      <Card style={{ gap: theme.spacing(1) }}>
        <PressableRow
          icon="account-circle-outline"
          title="Thông tin tài khoản"
          desc="Xem hồ sơ và quyền nhận cảnh báo"
          onPress={() => router.push("../account")}
        />
        <Divider />
        <InfoRow
          icon="information-outline"
          title="Thông tin ứng dụng"
          desc="Phiên bản, điều khoản"
        />
        <Divider />
        <PressableRow
          icon="logout"
          title="Đăng xuất"
          desc={isLoggingOut ? "Đang đăng xuất..." : "Thoát tài khoản hiện tại"}
          danger
          onPress={handleLogout}
          disabled={isLoggingOut}
        />
      </Card>
    </Screen>
  );
}

function InfoRow({
  icon,
  title,
  desc,
  comingSoon,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  desc?: string;
  comingSoon?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${theme.colors.primary}18` },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={theme.colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!desc && <Text style={styles.desc}>{desc}</Text>}
      </View>

      {comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Sắp hỗ trợ</Text>
        </View>
      )}
    </View>
  );
}

function PressableRow({
  icon,
  title,
  desc,
  danger,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  desc?: string;
  danger?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const color = danger ? theme.colors.danger : theme.colors.primary;
  return (
    <Pressable
      style={[styles.row, disabled && styles.disabledRow]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, danger && { color: theme.colors.danger }]}>
          {title}
        </Text>
        {!!desc && <Text style={styles.desc}>{desc}</Text>}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={theme.colors.subText}
      />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  desc: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: `${theme.colors.subText}14`,
  },
  comingSoonText: {
    color: theme.colors.subText,
    fontSize: 10,
    fontWeight: "800",
  },
  disabledRow: {
    opacity: 0.6,
  },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 52 },
});
