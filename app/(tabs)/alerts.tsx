import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { theme } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type AlertType = "danger" | "warning" | "info";
type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
};

export default function AlertsScreen() {
  const [filter, setFilter] = useState<"all" | AlertType>("all");

  const alerts: AlertItem[] = useMemo(
    () => [
      {
        id: "a1",
        type: "danger",
        title: "Vật cản nguy hiểm",
        detail: "0.8m phía trước",
        time: "09:21",
      },
      {
        id: "a2",
        type: "warning",
        title: "Ra khỏi vùng an toàn",
        detail: "Vượt 30m",
        time: "08:50",
      },
      {
        id: "a3",
        type: "info",
        title: "Thiết bị kết nối lại",
        detail: "Tín hiệu ổn định",
        time: "08:10",
      },
    ],
    [],
  );

  const data =
    filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  return (
    <Screen>
      <SectionTitle
        title="Cảnh báo"
        right={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip
              text="All"
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <Chip
              text="Danger"
              active={filter === "danger"}
              onPress={() => setFilter("danger")}
            />
            <Chip
              text="Warn"
              active={filter === "warning"}
              onPress={() => setFilter("warning")}
            />
          </View>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          title="Không có cảnh báo"
          desc="Hiện không có sự kiện phù hợp bộ lọc."
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ gap: theme.spacing(1) }}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.alertRow}>
                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: `${pickColor(item.type)}22` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={pickIcon(item.type)}
                    size={20}
                    color={pickColor(item.type)}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertDetail}>{item.detail}</Text>
                </View>

                <Text style={styles.alertTime}>{item.time}</Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active
            ? `${theme.colors.primary}22`
            : theme.colors.card,
          borderColor: active
            ? `${theme.colors.primary}66`
            : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? theme.colors.text : theme.colors.subText },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function pickColor(t: AlertType) {
  if (t === "danger") return theme.colors.danger;
  if (t === "warning") return theme.colors.warning;
  return theme.colors.primary;
}
function pickIcon(t: AlertType) {
  if (t === "danger") return "alert-octagon-outline";
  if (t === "warning") return "alert-outline";
  return "information-outline";
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "700" },

  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "800" },
  alertDetail: { color: theme.colors.subText, fontSize: 12, marginTop: 2 },
  alertTime: { color: theme.colors.subText, fontSize: 12 },
});
