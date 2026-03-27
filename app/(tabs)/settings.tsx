import Card from "@/components/Card";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [enableRealtime, setEnableRealtime] = useState(true);
  const [vibration, setVibration] = useState(true);

  return (
    <Screen>
      <SectionTitle title="Cấu hình thiết bị" />

      <Card style={{ gap: theme.spacing(1) }}>
        <SettingRow
          icon="bell-outline"
          title="Bật cảnh báo"
          desc="Hiển thị cảnh báo khi gặp nguy hiểm"
          right={
            <Switch
              value={enableAlerts}
              onValueChange={setEnableAlerts}
              trackColor={{
                false: "#2A3550",
                true: `${theme.colors.primary}66`,
              }}
              thumbColor={theme.colors.text}
            />
          }
        />
        <Divider />
        <SettingRow
          icon="access-point"
          title="Thông báo real-time"
          desc="Nhận cập nhật tức thì"
          right={
            <Switch
              value={enableRealtime}
              onValueChange={setEnableRealtime}
              trackColor={{
                false: "#2A3550",
                true: `${theme.colors.primary}66`,
              }}
              thumbColor={theme.colors.text}
            />
          }
        />
        <Divider />
        <SettingRow
          icon="vibrate"
          title="Rung khi cảnh báo"
          desc="Tăng độ nhận biết"
          right={
            <Switch
              value={vibration}
              onValueChange={setVibration}
              trackColor={{
                false: "#2A3550",
                true: `${theme.colors.primary}66`,
              }}
              thumbColor={theme.colors.text}
            />
          }
        />
      </Card>

      <SectionTitle title="Hệ thống" />

      <Card style={{ gap: theme.spacing(1) }}>
        <PressableRow
          icon="information-outline"
          title="Thông tin ứng dụng"
          desc="Phiên bản, điều khoản"
        />
        <Divider />
        <PressableRow
          icon="logout"
          title="Đăng xuất"
          desc="Thoát tài khoản hiện tại"
          danger
        />
      </Card>
    </Screen>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  right,
}: {
  icon: any;
  title: string;
  desc?: string;
  right: React.ReactNode;
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

      {right}
    </View>
  );
}

function PressableRow({
  icon,
  title,
  desc,
  danger,
}: {
  icon: any;
  title: string;
  desc?: string;
  danger?: boolean;
}) {
  const color = danger ? theme.colors.danger : theme.colors.primary;
  return (
    <Pressable style={styles.row} onPress={() => {}}>
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

  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 52 },
});
