import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, spacing, radius, shadow } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  return (
    <View style={[styles.card, variant === "elevated" && shadow.md, style]}>
      {children}
    </View>
  );
}

interface StatusBadgeProps {
  status: string;
  config?: Record<string, { color: string; bg: string; label: string }>;
}

export function StatusBadge({ status, config }: StatusBadgeProps) {
  const defaultConfig: Record<
    string,
    { color: string; bg: string; label: string }
  > = {
    paid: { color: colors.success, bg: colors.successLight, label: "Paid" },
    partial: {
      color: colors.warning,
      bg: colors.warningLight,
      label: "Partial",
    },
    unpaid: { color: colors.danger, bg: colors.dangerLight, label: "Unpaid" },
    completed: {
      color: colors.success,
      bg: colors.successLight,
      label: "Completed",
    },
    pending: {
      color: colors.warning,
      bg: colors.warningLight,
      label: "Pending",
    },
    failed: { color: colors.danger, bg: colors.dangerLight, label: "Failed" },
    refunded: {
      color: colors.textSecondary,
      bg: colors.surfaceSecondary,
      label: "Refunded",
    },
  };
  const c = (config || defaultConfig)[status] || {
    color: colors.textSecondary,
    bg: colors.surfaceSecondary,
    label: status,
  };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function SectionHeader({ title, rightElement }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightElement}
    </View>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const Icon =
    require("react-native-vector-icons/MaterialCommunityIcons").default;
  return (
    <View style={styles.emptyState}>
      <Icon name={icon} size={48} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.smallBold,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  screenHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
