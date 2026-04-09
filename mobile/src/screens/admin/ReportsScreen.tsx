import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getMonthlyReport, getCollectionStatus } from "../../api/admin";
import {
  Card,
  StatusBadge,
  SectionHeader,
  EmptyState,
  ScreenHeader,
} from "../../components/ui";
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  categoryColors,
  categoryLabels,
  categoryIcons,
} from "../../theme";
import dayjs from "dayjs";
import type { MonthlyReport, CollectionStatus } from "../../types";
import { useCurrency } from "../../hooks/useCurrency";

const methodConfig: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  cash: { icon: "cash", label: "Cash", color: colors.success },
  online: {
    icon: "credit-card-outline",
    label: "Online",
    color: colors.primary,
  },
  bank_transfer: {
    icon: "bank-outline",
    label: "Bank Transfer",
    color: colors.elevator,
  },
};

export default function ReportsScreen() {
  const currency = useCurrency();
  const [periodOffset, setPeriodOffset] = useState(0);
  const month = dayjs().subtract(periodOffset, "month").format("YYYY-MM");
  const displayMonth = dayjs()
    .subtract(periodOffset, "month")
    .format("MMMM YYYY");

  const {
    data: report,
    isLoading: loadingReport,
    isRefetching: refetchingReport,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["admin-report", month],
    queryFn: () => getMonthlyReport(month),
  });

  const {
    data: collection,
    isLoading: loadingCollection,
    isRefetching: refetchingCollection,
    refetch: refetchCollection,
  } = useQuery({
    queryKey: ["admin-collection", month],
    queryFn: () => getCollectionStatus(month),
  });

  const isRefreshing = refetchingReport || refetchingCollection;
  const isLoading = loadingReport || loadingCollection;

  function handleRefresh() {
    refetchReport();
    refetchCollection();
  }

  // Expense categories (excluding 'total' from the map)
  const expenseCategories = report
    ? Object.entries(report.expenses)
        .filter(([key]) => key !== "total")
        .sort(([, a], [, b]) => b - a)
    : [];

  // Payment methods
  const paymentMethods = report
    ? Object.entries(report.collections.byMethod).sort(([, a], [, b]) => b - a)
    : [];

  const collectionRate = report?.collections.collectionRate ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Reports" subtitle="Monthly financial overview" />

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={styles.periodArrow}
            onPress={() => setPeriodOffset((p) => p + 1)}
          >
            <Icon name="chevron-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.periodCenter}>
            <Icon name="calendar-month" size={18} color={colors.primary} />
            <Text style={styles.periodText}>{displayMonth}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.periodArrow,
              periodOffset === 0 && styles.periodArrowDisabled,
            ]}
            onPress={() => periodOffset > 0 && setPeriodOffset((p) => p - 1)}
            disabled={periodOffset === 0}
          >
            <Icon
              name="chevron-right"
              size={24}
              color={
                periodOffset === 0 ? colors.textTertiary : colors.textPrimary
              }
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading report...</Text>
          </View>
        ) : !report ? (
          <View style={styles.section}>
            <EmptyState
              icon="chart-bar"
              title="No report data"
              subtitle={`No data available for ${displayMonth}`}
            />
          </View>
        ) : (
          <>
            {/* Monthly Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Icon
                  name="chart-arc"
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.summaryLabel}>Monthly Summary</Text>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Total Expenses</Text>
                  <Text style={styles.summaryItemValue}>
                    {(report.expenses.total || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Collected</Text>
                  <Text style={styles.summaryItemValue}>
                    {(report.collections.collected || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Collection Rate</Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      {
                        color:
                          collectionRate >= 80
                            ? "#a7f3d0"
                            : collectionRate >= 50
                              ? "#fde68a"
                              : "#fca5a5",
                      },
                    ]}
                  >
                    {collectionRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Outstanding</Text>
                  <Text style={styles.summaryItemValue}>
                    {(report.outstanding.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Collection Rate Progress Bar */}
              <View style={styles.rateBarBg}>
                <View
                  style={[
                    styles.rateBarFill,
                    { width: `${Math.min(collectionRate, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.rateBarLabel}>
                {report.collections.collected.toLocaleString()} of{" "}
                {report.collections.expected.toLocaleString()} {currency}{" "}
                collected
              </Text>
            </View>

            {/* Expense Breakdown */}
            <View style={styles.section}>
              <SectionHeader title="Expense Breakdown" />
              {expenseCategories.length === 0 ? (
                <EmptyState
                  icon="chart-bar"
                  title="No expenses"
                  subtitle="No expenses recorded this month"
                />
              ) : (
                expenseCategories.map(([category, amount]) => {
                  const total = report.expenses.total || 1;
                  const pct = (amount / total) * 100;
                  const color = categoryColors[category] || colors.textTertiary;
                  const iconName =
                    categoryIcons[category] || "help-circle-outline";
                  return (
                    <Card key={category} style={styles.breakdownCard}>
                      <View style={styles.breakdownRow}>
                        <View
                          style={[
                            styles.breakdownIconBg,
                            { backgroundColor: color + "15" },
                          ]}
                        >
                          <Icon name={iconName} size={20} color={color} />
                        </View>
                        <View style={styles.breakdownInfo}>
                          <Text style={styles.breakdownName}>
                            {categoryLabels[category] || category}
                          </Text>
                          <View style={styles.progressBg}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: color,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <View style={styles.breakdownRight}>
                          <Text style={styles.breakdownAmount}>
                            {amount.toLocaleString()} {currency}
                          </Text>
                          <Text style={[styles.breakdownPct, { color }]}>
                            {pct.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })
              )}
            </View>

            {/* Payment Methods */}
            <View style={styles.section}>
              <SectionHeader title="Payment Methods" />
              {paymentMethods.length === 0 ? (
                <EmptyState
                  icon="credit-card-off-outline"
                  title="No payments"
                  subtitle="No payments recorded this month"
                />
              ) : (
                <Card style={styles.methodsCard}>
                  {paymentMethods.map(([method, amount], index) => {
                    const config = methodConfig[method] || {
                      icon: "help-circle-outline",
                      label: method,
                      color: colors.textTertiary,
                    };
                    const totalCollected = report.collections.collected || 1;
                    const pct = (amount / totalCollected) * 100;
                    return (
                      <View key={method}>
                        {index > 0 && <View style={styles.methodDivider} />}
                        <View style={styles.methodRow}>
                          <View
                            style={[
                              styles.methodIconBg,
                              { backgroundColor: config.color + "15" },
                            ]}
                          >
                            <Icon
                              name={config.icon}
                              size={20}
                              color={config.color}
                            />
                          </View>
                          <View style={styles.methodInfo}>
                            <Text style={styles.methodLabel}>
                              {config.label}
                            </Text>
                            <View style={styles.progressBg}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${Math.min(pct, 100)}%`,
                                    backgroundColor: config.color,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <View style={styles.methodRight}>
                            <Text style={styles.methodAmount}>
                              {amount.toLocaleString()} {currency}
                            </Text>
                            <Text
                              style={[
                                styles.methodPct,
                                { color: config.color },
                              ]}
                            >
                              {pct.toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              )}
            </View>

            {/* Collection Status */}
            {collection && (
              <View style={styles.section}>
                <SectionHeader title="Collection Status" />

                {/* Summary counts */}
                <View style={styles.statusSummary}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: colors.successLight },
                    ]}
                  >
                    <Icon
                      name="check-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text
                      style={[styles.statusPillText, { color: colors.success }]}
                    >
                      {collection.summary.paid} Paid
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: colors.warningLight },
                    ]}
                  >
                    <Icon
                      name="circle-half-full"
                      size={16}
                      color={colors.warning}
                    />
                    <Text
                      style={[styles.statusPillText, { color: colors.warning }]}
                    >
                      {collection.summary.partial} Partial
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: colors.dangerLight },
                    ]}
                  >
                    <Icon name="close-circle" size={16} color={colors.danger} />
                    <Text
                      style={[styles.statusPillText, { color: colors.danger }]}
                    >
                      {collection.summary.unpaid} Unpaid
                    </Text>
                  </View>
                </View>

                {/* Resident list */}
                {collection.residents.length === 0 ? (
                  <EmptyState
                    icon="account-group-outline"
                    title="No residents"
                    subtitle="No collection data for this period"
                  />
                ) : (
                  collection.residents.map((resident) => (
                    <Card key={resident.residentId} style={styles.residentCard}>
                      <View style={styles.residentRow}>
                        <View style={styles.residentAvatar}>
                          <Text style={styles.residentAvatarText}>
                            {resident.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </Text>
                        </View>
                        <View style={styles.residentInfo}>
                          <Text style={styles.residentName}>
                            {resident.name}
                          </Text>
                          <Text style={styles.residentUnit}>
                            Unit {resident.unit}
                            {" \u2022 "}
                            {resident.totalPaid.toLocaleString()} /{" "}
                            {resident.totalDue.toLocaleString()} {currency}
                          </Text>
                        </View>
                        <StatusBadge status={resident.status} />
                      </View>
                    </Card>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl * 2 },

  // ── Period ────────────────────────────────────
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadow.sm,
  },
  periodArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  periodArrowDisabled: { opacity: 0.4 },
  periodCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  periodText: { ...typography.bodyBold, color: colors.textPrimary },

  // ── Loading ───────────────────────────────────
  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl * 2,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // ── Summary Card ──────────────────────────────
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadow.lg,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryLabel: { ...typography.caption, color: "rgba(255,255,255,0.7)" },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    width: "47%",
    marginBottom: spacing.sm,
  },
  summaryItemLabel: { ...typography.small, color: "rgba(255,255,255,0.6)" },
  summaryItemValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  rateBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  rateBarFill: {
    height: 6,
    backgroundColor: "#34d399",
    borderRadius: 3,
  },
  rateBarLabel: {
    ...typography.small,
    color: "rgba(255,255,255,0.6)",
    marginTop: spacing.sm,
    textAlign: "center",
  },

  // ── Section ───────────────────────────────────
  section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },

  // ── Breakdown ─────────────────────────────────
  breakdownCard: { marginBottom: spacing.sm },
  breakdownRow: { flexDirection: "row", alignItems: "center" },
  breakdownIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  breakdownInfo: { flex: 1 },
  breakdownName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  progressBg: {
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  breakdownRight: { alignItems: "flex-end", marginLeft: spacing.md },
  breakdownAmount: { ...typography.bodyBold, color: colors.textPrimary },
  breakdownPct: { ...typography.captionBold, marginTop: 2 },

  // ── Methods ───────────────────────────────────
  methodsCard: {},
  methodRow: { flexDirection: "row", alignItems: "center" },
  methodDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  methodIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  methodInfo: { flex: 1 },
  methodLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  methodRight: { alignItems: "flex-end", marginLeft: spacing.md },
  methodAmount: { ...typography.bodyBold, color: colors.textPrimary },
  methodPct: { ...typography.captionBold, marginTop: 2 },

  // ── Collection Status ─────────────────────────
  statusSummary: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  statusPillText: { ...typography.captionBold },

  // ── Resident cards ────────────────────────────
  residentCard: { marginBottom: spacing.sm },
  residentRow: { flexDirection: "row", alignItems: "center" },
  residentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  residentAvatarText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  residentInfo: { flex: 1 },
  residentName: { ...typography.bodyBold, color: colors.textPrimary },
  residentUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
