import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { getDashboard } from "../../api/resident";
import { useAuthStore } from "../../store/auth";
import {
  Card,
  StatusBadge,
  SectionHeader,
  EmptyState,
} from "../../components/ui";
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  categoryColors,
} from "../../theme";
import type { ExpenseShare } from "../../types";
import { useCurrency } from "../../hooks/useCurrency";

function DueItem({ share }: { share: ExpenseShare }) {
  const currency = useCurrency();
  const category = share.expenseId?.category || "fixed";
  return (
    <Card style={styles.dueItem}>
      <View style={styles.dueRow}>
        <View
          style={[
            styles.categoryIcon,
            {
              backgroundColor:
                (categoryColors[category] || colors.textTertiary) + "15",
            },
          ]}
        >
          <View
            style={[
              styles.categoryDot,
              {
                backgroundColor:
                  categoryColors[category] || colors.textTertiary,
              },
            ]}
          />
        </View>
        <View style={styles.dueInfo}>
          <Text style={styles.dueTitle}>
            {share.expenseId?.title || "Expense"}
          </Text>
          <Text style={styles.duePeriod}>{share.period}</Text>
        </View>
        <View style={styles.dueRight}>
          <Text style={styles.dueAmount}>
            {share.amount.toLocaleString()} {currency}
          </Text>
          <StatusBadge status={share.status} />
        </View>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const currency = useCurrency();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const summary = data?.summary;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("dashboard.goodMorning") : hour < 18 ? t("dashboard.goodAfternoon") : t("dashboard.goodEvening");

  const quickActions = [
    {
      icon: "credit-card-outline",
      label: t("residentDashboard.payNow"),
      color: colors.primary,
      screen: "Payments",
    },
    {
      icon: "history",
      label: t("residentDashboard.history"),
      color: colors.elevator,
      screen: "Payments",
    },
    {
      icon: "chart-bar",
      label: t("residentDashboard.expenses"),
      color: colors.maintenance,
      screen: "Expenses",
    },
    {
      icon: "bullhorn-outline",
      label: t("residentDashboard.news"),
      color: colors.project,
      screen: "Announcements",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingLabel}>{greeting}</Text>
          <Text style={styles.greetingName}>
            {user?.firstName || "Resident"} 👋
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon
            name="account-circle-outline"
            size={28}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <Icon name="wallet-outline" size={24} color="rgba(255,255,255,0.8)" />
          <Text style={styles.balanceLabel}>{t("residentDashboard.remainingBalance")}</Text>
        </View>
        <Text style={styles.balanceAmount}>
          {isLoading
            ? "..."
            : `${(summary?.remainingBalance || 0).toLocaleString()} ${currency}`}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <Icon
              name="arrow-up-circle-outline"
              size={18}
              color="rgba(255,255,255,0.7)"
            />
            <View style={styles.statText}>
              <Text style={styles.statLabel}>{t("residentDashboard.totalDue")}</Text>
              <Text style={styles.statValue}>
                {(summary?.totalDue || 0).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStat}>
            <Icon
              name="check-circle-outline"
              size={18}
              color="rgba(255,255,255,0.7)"
            />
            <View style={styles.statText}>
              <Text style={styles.statLabel}>{t("residentDashboard.totalPaid")}</Text>
              <Text style={styles.statValue}>
                {(summary?.totalPaid || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(action.screen)}
          >
            <View
              style={[
                styles.actionIconBg,
                { backgroundColor: action.color + "12" },
              ]}
            >
              <Icon name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("dashboard.recentDues")} />
        {data?.recentDues?.length === 0 ? (
          <EmptyState
            icon="check-circle-outline"
            title={t("dashboard.allCaughtUp")}
            subtitle={t("dashboard.noOutstandingDues")}
          />
        ) : (
          data?.recentDues?.map((share) => (
            <DueItem key={share._id} share={share} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greetingLabel: { ...typography.caption, color: colors.textSecondary },
  greetingName: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadow.lg,
  },
  balanceTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  balanceLabel: { ...typography.caption, color: "rgba(255,255,255,0.8)" },
  balanceAmount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "700",
    marginBottom: spacing.xl,
  },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statText: {},
  statLabel: { ...typography.small, color: "rgba(255,255,255,0.7)" },
  statValue: { color: colors.white, ...typography.bodyBold, marginTop: 1 },
  balanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: spacing.md,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    ...shadow.sm,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  actionLabel: { ...typography.captionBold, color: colors.textPrimary },
  section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  dueItem: { marginBottom: spacing.sm },
  dueRow: { flexDirection: "row", alignItems: "center" },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  dueInfo: { flex: 1 },
  dueTitle: { ...typography.bodyBold, color: colors.textPrimary },
  duePeriod: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dueRight: { alignItems: "flex-end" },
  dueAmount: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
});
