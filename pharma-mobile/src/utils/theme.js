// Centralized theme tokens for colors, spacing, radii, and shadows

export const colors = {
  // Brand
  brandStart: "#8b5cf6",
  brandMid: "#a855f7",
  brandEnd: "#c084fc",
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",

  // Surfaces (Dark theme)
  bg: "#111827",
  surface: "#1f2937",
  surfaceElevated: "#232e41",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  glowBrand: {
    shadowColor: colors.brandStart,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
};

export const gradients = {
  brand: [colors.brandStart, colors.brandMid, colors.brandEnd],
  header: ["#1f2937", "#111827"],
  card: ["#1f2937", "#374151"],
  success: ["#10b981", "#059669"],
  primary: ["#8b5cf6", "#a855f7", "#c084fc"],
};

export default { colors, spacing, radii, shadows, gradients };
// Recommended font families for Arabic (loaded via Expo Google Fonts)
export const fonts = {
  regular: "Cairo_400Regular",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
};
