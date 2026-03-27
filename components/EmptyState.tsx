import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/constants/theme";

export default function EmptyState({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {!!desc && <Text style={styles.desc}>{desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  title: { color: theme.colors.text, fontWeight: "700", fontSize: 14 },
  desc: {
    color: theme.colors.subText,
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },
});
