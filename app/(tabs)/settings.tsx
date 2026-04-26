import Card from "@/components/Card";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { useAppSettings } from "@/src/state/AppSettingsContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const {
    api,
    isAuthenticated,
    login,
    logout,
  } = useAppSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [enableRealtime, setEnableRealtime] = useState(true);
  const [vibration, setVibration] = useState(true);

  const healthMutation = useMutation({
    mutationFn: () => api.health(),
  });

  const loginMutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async () => {
      setPassword("");
      await queryClient.invalidateQueries();
    },
  });

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionTitle title="Dang nhap mobile" />

        <Card style={{ gap: theme.spacing(1.5) }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Mat khau"
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.buttonRow}>
            <ActionButton
              icon="login"
              text={loginMutation.isPending ? "Dang nhap..." : "Dang nhap"}
              onPress={() => loginMutation.mutate()}
              disabled={!email.trim() || password.length < 8 || loginMutation.isPending}
            />
            <ActionButton
              icon="heart-pulse"
              text={healthMutation.isPending ? "Dang kiem tra..." : "Health"}
              onPress={() => healthMutation.mutate()}
            />
            <ActionButton
              icon="logout"
              text="Dang xuat"
              onPress={handleLogout}
              danger
              disabled={!isAuthenticated}
            />
          </View>

          <StatusText
            ok={isAuthenticated}
            text={
              loginMutation.isError
                ? loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : "Dang nhap that bai"
                : healthMutation.isError
                  ? healthMutation.error instanceof Error
                    ? healthMutation.error.message
                    : "Server health failed"
                : isAuthenticated
                  ? "Da dang nhap, cac man hinh co the tai du lieu server."
                  : healthMutation.data?.status === "ok"
                    ? "Server san sang. Hay dang nhap tai khoan mobile."
                  : "Chua dang nhap"
            }
          />
        </Card>

        <SectionTitle title="Cau hinh thiet bi" />

        <Card style={{ gap: theme.spacing(1) }}>
          <SettingRow
            icon="bell-outline"
            title="Bat canh bao"
            desc="Hien thi canh bao khi gap nguy hiem"
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
            title="Thong bao real-time"
            desc="Nhan cap nhat tuc thi khi server co du lieu"
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
            title="Rung khi canh bao"
            desc="Tang do nhan biet"
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
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.subText}
        style={styles.input}
      />
    </View>
  );
}

function ActionButton({
  icon,
  text,
  onPress,
  danger,
  disabled,
}: {
  icon: any;
  text: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const color = danger ? theme.colors.danger : theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        {
          borderColor: `${color}66`,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[styles.actionText, { color }]}>{text}</Text>
    </Pressable>
  );
}

function StatusText({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={styles.statusRow}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: ok ? theme.colors.success : theme.colors.warning },
        ]}
      />
      <Text style={styles.statusText}>{text}</Text>
    </View>
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

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing(3),
  },
  field: {
    gap: 6,
  },
  label: {
    color: theme.colors.subText,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#0F172A",
    color: theme.colors.text,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  },
  actionButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 99 },
  statusText: {
    flex: 1,
    color: theme.colors.subText,
    fontSize: 12,
  },
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
