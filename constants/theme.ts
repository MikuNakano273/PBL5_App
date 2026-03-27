export const Colors = {
  light: {
    text: "#EAF0FF",
    background: "#0B1220",
    tint: "#5B8CFF",

    card: "#121B2E",
    subText: "#A8B3CF",
    primary: "#5B8CFF",
    success: "#23C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    border: "rgba(255,255,255,0.08)",
  },
  dark: {
    text: "#EAF0FF",
    background: "#0B1220",
    tint: "#5B8CFF",

    card: "#121B2E",
    subText: "#A8B3CF",
    primary: "#5B8CFF",
    success: "#23C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    border: "rgba(255,255,255,0.08)",
  },
} as const;

// (Tuỳ chọn) nếu bạn vẫn muốn giữ theme cũ kiểu theme.colors.xxx
export const theme = {
  colors: Colors.dark, // app bạn đang dùng nền tối, để default dark
  radius: { md: 14, lg: 18, pill: 999 },
  spacing: (n: number) => n * 8,
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  },
} as const;
