import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  generateCharges,
  getBillingPeriods,
  getPeriodCharges,
} from "../../api/admin";
import { Card, SectionHeader, EmptyState } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";
import type { BillingPeriod, ResidentCharge } from "../../types";

export default function BillingScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const currentMonth = dayjs().format("YYYY-MM");
  const nextMonth = dayjs().add(1, "month").format("YYYY-MM");

  // Existing billing periods
  const periodsQuery = useQuery({
    queryKey: ["admin-billing-periods"],
    queryFn: getBillingPeriods,
  });

  // Charges for selected period
  const chargesQuery = useQuery({
    queryKey: ["admin-period-charges", selectedPeriod],
    queryFn: () => getPeriodCharges(selectedPeriod!),
    enabled: !!selectedPeriod,
  });

  const generateMutation = useMutation({
    mutationFn: (period: string) => generateCharges(period),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-billing-periods"] });
      queryClient.invalidateQueries({ queryKey: ["admin-period-charges"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overdue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-monthly-report"] });
      Alert.alert(
        "Billing Generated",
        `${data.chargesGenerated} charges created.\nTotal: ${data.totalCharged?.toLocaleString() ?? 0}`,
      );
    },
    onError: (err: any) => {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to generate billing.",
      );
    },
  });

  const periods = periodsQuery.data || [];
  const existingPeriodKeys = new Set(periods.map((p) => p.period));

  function handleGenerate(period: string) {
    const label = dayjs(period, "YYYY-MM").format("MMMM YYYY");
    Alert.alert(
      "Generate Monthly Billing",
      `This will create charges for all occupied units for ${label}.\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: () => generateMutation.mutate(period),
        },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Generate Billing Section */}
      <View style={styles.section}>
        <SectionHeader title={t("billing.generateMonthlyBilling")} />
        <Text style={styles.subtitle}>
          {t("billing.createChargesSubtitle")}
        </Text>

        <View style={styles.monthButtons}>
          {[currentMonth, nextMonth].map((month) => {
            const exists = existingPeriodKeys.has(month);
            const label = dayjs(month, "YYYY-MM").format("MMMM YYYY");
            return (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  exists && styles.monthButtonDisabled,
                ]}
                onPress={() => !exists && handleGenerate(month)}
                disabled={exists || generateMutation.isPending}
                activeOpacity={0.7}
              >
                <View style={styles.monthButtonContent}>
                  <Icon
                    name={exists ? "check-circle" : "calendar-plus"}
                    size={24}
                    color={exists ? colors.success : colors.primary}
                  />
                  <View style={styles.monthButtonText}>
                    <Text style={styles.monthLabel}>{label}</Text>
                    <Text style={styles.monthStatus}>
                      {exists ? t("billing.alreadyGenerated") : t("billing.readyToGenerate")}
                    </Text>
                  </View>
                </View>
                {!exists && (
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={colors.textTertiary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {generateMutation.isPending && (
          <View style={styles.generatingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.generatingText}>{t("billing.generating")}</Text>
          </View>
        )}
      </View>

      {/* Past Billing Periods */}
      <View style={styles.section}>
        <SectionHeader title={t("billing.billingHistory")} />
        {periodsQuery.isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ paddingVertical: spacing.xl }}
          />
        ) : periods.length === 0 ? (
          <EmptyState
            icon="calendar-blank-outline"
            title={t("billing.noPeriods")}
            subtitle={t("billing.generateFirst")}
          />
        ) : (
          periods.map((bp) => (
            <TouchableOpacity
              key={bp._id}
              style={[
                styles.periodCard,
                selectedPeriod === bp.period && styles.periodCardSelected,
              ]}
              onPress={() =>
                setSelectedPeriod(
                  selectedPeriod === bp.period ? null : bp.period,
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.periodRow}>
                <View>
                  <Text style={styles.periodLabel}>
                    {dayjs(bp.period, "YYYY-MM").format("MMMM YYYY")}
                  </Text>
                  <Text style={styles.periodMeta}>
                    Due: {dayjs(bp.dueDate).format("MMM D")} | Charged:{" "}
                    {bp.totalCharged.toLocaleString()}
                  </Text>
                </View>
                <Icon
                  name={
                    selectedPeriod === bp.period ? "chevron-up" : "chevron-down"
                  }
                  size={20}
                  color={colors.textSecondary}
                />
              </View>

              {/* Expanded: show summary */}
              {selectedPeriod === bp.period && chargesQuery.data && (
                <View style={styles.chargeSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t("billing.totalCount")}</Text>
                    <Text style={styles.summaryValue}>
                      {chargesQuery.data.summary.total}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t("billing.paid")}</Text>
                    <Text
                      style={[styles.summaryValue, { color: colors.success }]}
                    >
                      {chargesQuery.data.summary.paid}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t("billing.partial")}</Text>
                    <Text
                      style={[styles.summaryValue, { color: colors.warning }]}
                    >
                      {chargesQuery.data.summary.partial}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t("billing.overdue")}</Text>
                    <Text
                      style={[styles.summaryValue, { color: colors.danger }]}
                    >
                      {chargesQuery.data.summary.unpaid}
                    </Text>
                  </View>
                </View>
              )}
              {selectedPeriod === bp.period && chargesQuery.isLoading && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ paddingVertical: spacing.md }}
                />
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl * 2 },
  section: { marginBottom: spacing.xxl },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  monthButtons: { gap: spacing.sm },
  monthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  monthButtonDisabled: { opacity: 0.6 },
  monthButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  monthButtonText: {},
  monthLabel: { ...typography.bodyBold, color: colors.textPrimary },
  monthStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  generatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  generatingText: { ...typography.caption, color: colors.textSecondary },
  periodCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodCardSelected: { borderColor: colors.primary },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodLabel: { ...typography.bodyBold, color: colors.textPrimary },
  periodMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chargeSummary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
  summaryValue: { ...typography.captionBold, color: colors.textPrimary },
});
