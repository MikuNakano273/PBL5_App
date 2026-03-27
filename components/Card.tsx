import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "@/constants/theme";

export default function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
});
