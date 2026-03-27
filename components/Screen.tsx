import { theme } from "@/constants/theme";
import React from "react";
import { SafeAreaView, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Screen({ children, style }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
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
