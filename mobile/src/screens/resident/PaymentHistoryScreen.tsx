import React from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getMyPayments } from "../../api/resident";
import {
  Card,
  StatusBadge,
  EmptyState,
  ScreenHeader,
} from "../../components/ui";
import { colors, spacing, radius, typography } from "../../theme";
import dayjs from "dayjs";
import type { Payment } from "../../types";

const methodConfig: Record<string, { icon: string; label: string }> = {
  cash: { icon: "cash", label: "Cash" },
  online: { icon: "credit-card-outline", label: "Online" },
  bank_transfer: { icon: "bank-outline", label: "Bank Transfer" },
};

function PaymentItem({ payment }: { payment: Payment }) {
  const method = methodConfig[payment.method] || methodConfig.cash;
  return (
    <Card style={styles.item}>
      <View style={styles.itemRow}>
        <View style={styles.methodIconBg}>
          <Icon name={method.icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemAmount}>
            {payment.amount.toLocaleString()} {payment.currency}
          </Text>
          <Text style={styles.itemMeta}>
            {method.label} {" \u2022 "}{" "}
            {dayjs(payment.paymentDate).format("MMM D, YYYY")}
          </Text>
          {payment.notes ? (
            <Text style={styles.itemNotes}>{payment.notes}</Text>
          ) : null}
        </View>
        <StatusBadge status={payment.status} />
      </View>
    </Card>
  );
}

export default function PaymentHistoryScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-payments"],
    queryFn: getMyPayments,
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Payment History" subtitle="Your payment records" />
      <FlatList
        data={data || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PaymentItem payment={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="credit-card-off-outline"
              title="No payments yet"
              subtitle="Your payment history will appear here"
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  item: { marginBottom: spacing.sm },
  itemRow: { flexDirection: "row", alignItems: "center" },
  methodIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  itemInfo: { flex: 1 },
  itemAmount: { ...typography.bodyBold, color: colors.textPrimary },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemNotes: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
});
