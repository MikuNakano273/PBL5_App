import { theme } from "@/constants/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
};

const DEFAULT_EDGES: Edge[] = ["right", "bottom", "left"];

export default function Screen({
  children,
  edges = DEFAULT_EDGES,
  style,
}: Props) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing(2),
  },
});
