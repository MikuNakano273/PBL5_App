import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/constants/theme";

export default function SectionTitle({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
});
