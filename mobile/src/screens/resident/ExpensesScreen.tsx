import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { getBuildingExpenses } from "../../api/resident";
import {
  Card,
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
import { useCurrency } from "../../hooks/useCurrency";

export default function ExpensesScreen() {
  const currency = useCurrency();
  const { t } = useTranslation();
  const [periodOffset, setPeriodOffset] = useState(0);
  const period = dayjs().subtract(periodOffset, "month").format("YYYY-MM");
  const displayPeriod = dayjs()
    .subtract(periodOffset, "month")
    .format("MMMM YYYY");

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ["building-expenses", period],
    queryFn: () => getBuildingExpenses(period),
  });

  const total = data?.reduce((sum, item) => sum + item.total, 0) || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={t("expenses.buildingExpenses")} />

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={styles.periodArrow}
          onPress={() => setPeriodOffset((p) => p + 1)}
        >
          <Icon name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.periodCenter}>
          <Icon name="calendar-month" size={18} color={colors.primary} />
          <Text style={styles.periodText}>{displayPeriod}</Text>
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

      <View style={styles.totalCard}>
        <View style={styles.totalTop}>
          <Icon name="chart-arc" size={24} color="rgba(255,255,255,0.8)" />
          <Text style={styles.totalLabel}>{t("expenses.totalBuildingExpenses")}</Text>
        </View>
        <Text style={styles.totalAmount}>
          {total.toLocaleString()} {currency}
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("expenses.breakdown")} />
        {!data || data.length === 0 ? (
          <EmptyState
            icon="chart-bar"
            title={t("expenses.noExpenses")}
            subtitle={t("expenses.noExpensesForPeriod", { period: displayPeriod })}
          />
        ) : (
          data.map((item) => {
            const pct = total > 0 ? (item.total / total) * 100 : 0;
            const color = categoryColors[item._id] || colors.textTertiary;
            const iconName = categoryIcons[item._id] || "help-circle-outline";
            return (
              <Card key={item._id} style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <View
                    style={[
                      styles.categoryIconBg,
                      { backgroundColor: color + "15" },
                    ]}
                  >
                    <Icon name={iconName} size={20} color={color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>
                      {categoryLabels[item._id] || item._id}
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
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      {item.total.toLocaleString()} {currency}
                    </Text>
                    <Text style={[styles.categoryPct, { color }]}>
                      {pct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>

      <Text style={styles.disclaimer}>{t("expenses.disclaimer")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
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
  totalCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadow.lg,
  },
  totalTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  totalLabel: { ...typography.caption, color: "rgba(255,255,255,0.7)" },
  totalAmount: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  categoryCard: { marginBottom: spacing.sm },
  categoryRow: { flexDirection: "row", alignItems: "center" },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  categoryInfo: { flex: 1 },
  categoryName: {
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
  categoryRight: { alignItems: "flex-end", marginLeft: spacing.md },
  categoryAmount: { ...typography.bodyBold, color: colors.textPrimary },
  categoryPct: { ...typography.captionBold, marginTop: 2 },
  disclaimer: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "center",
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
});
