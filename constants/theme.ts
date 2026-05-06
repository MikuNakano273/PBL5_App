const lightColors = {
  text: "#14213D",
  background: "#FFFFFF",
  tint: "#2F6BFF",

  card: "#F8FAFC",
  subText: "#64748B",
  primary: "#2F6BFF",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  border: "#D9E2EC",
} as const;

export const Colors = {
  light: lightColors,
  dark: lightColors,
} as const;

export const theme = {
  colors: lightColors,
  radius: { md: 14, lg: 18, pill: 999 },
  spacing: (n: number) => n * 8,
  shadow: {
    card: {
      shadowColor: "#0F172A",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  },
} as const;
