export const colors = {
  // Primary
  primary: "#4361ee",
  primaryLight: "#eef2ff",
  primaryDark: "#3451d1",

  // Neutrals
  background: "#f5f6fa",
  surface: "#ffffff",
  surfaceSecondary: "#f0f1f5",
  textPrimary: "#1a1a2e",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  border: "#e5e7eb",

  // Status
  success: "#10b981",
  successLight: "#d1fae5",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  info: "#3b82f6",
  infoLight: "#dbeafe",

  // Category
  fixed: "#4361ee",
  maintenance: "#f97316",
  elevator: "#8b5cf6",
  project: "#06b6d4",
  emergency: "#ef4444",

  // Misc
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0,0,0,0.5)",
  cardShadow: "rgba(0,0,0,0.06)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyBold: { fontSize: 15, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  captionBold: { fontSize: 13, fontWeight: "600" as const },
  small: { fontSize: 11, fontWeight: "400" as const },
  smallBold: { fontSize: 11, fontWeight: "700" as const },
};

export const shadow = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const categoryColors: Record<string, string> = {
  fixed: colors.fixed,
  maintenance: colors.maintenance,
  elevator: colors.elevator,
  project: colors.project,
  emergency: colors.emergency,
};

export const categoryLabels: Record<string, string> = {
  fixed: "Fixed / Recurring",
  maintenance: "Maintenance",
  elevator: "Elevator",
  project: "Projects",
  emergency: "Emergency",
};

export const categoryIcons: Record<string, string> = {
  fixed: "calendar-check",
  maintenance: "wrench",
  elevator: "elevator-passenger",
  project: "hammer",
  emergency: "alert-circle",
};

export const statusConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  paid: { color: colors.success, bg: colors.successLight, label: "Paid" },
  partial: { color: colors.warning, bg: colors.warningLight, label: "Partial" },
  unpaid: { color: colors.danger, bg: colors.dangerLight, label: "Unpaid" },
  completed: {
    color: colors.success,
    bg: colors.successLight,
    label: "Completed",
  },
  pending: { color: colors.warning, bg: colors.warningLight, label: "Pending" },
  failed: { color: colors.danger, bg: colors.dangerLight, label: "Failed" },
  refunded: {
    color: colors.textSecondary,
    bg: colors.surfaceSecondary,
    label: "Refunded",
  },
};
