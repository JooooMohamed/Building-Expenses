import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import dayjs from "dayjs";
import { getExpenses } from "../../api/admin";
import {
  Card,
  StatusBadge,
  ScreenHeader,
  EmptyState,
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
import type { Expense } from "../../types";
import { useCurrency } from "../../hooks/useCurrency";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "fixed", label: "Fixed" },
  { key: "maintenance", label: "Maintenance" },
  { key: "elevator", label: "Elevator" },
  { key: "project", label: "Project" },
  { key: "emergency", label: "Emergency" },
];

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "cancelled", label: "Cancelled" },
];

function ExpenseItem({ expense }: { expense: Expense }) {
  const catColor = categoryColors[expense.category] || colors.textTertiary;
  const catIcon = categoryIcons[expense.category] || "help-circle-outline";
  const catLabel = categoryLabels[expense.category] || expense.category;

  return (
    <Card style={styles.expenseCard}>
      <View style={styles.expenseRow}>
        <View
          style={[styles.expenseIconBg, { backgroundColor: catColor + "15" }]}
        >
          <Icon name={catIcon} size={20} color={catColor} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{expense.title}</Text>
          <View style={styles.expenseMeta}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: catColor + "15" },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                {catLabel}
              </Text>
            </View>
            {expense.isRecurring && (
              <View style={styles.recurringBadge}>
                <Icon name="refresh" size={12} color={colors.info} />
                <Text style={styles.recurringText}>Recurring</Text>
              </View>
            )}
          </View>
          <Text style={styles.expenseDate}>
            {dayjs(expense.date).format("MMM D, YYYY")}
          </Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>
            {expense.amount.toLocaleString()} {expense.currency}
          </Text>
          <StatusBadge
            status={expense.status}
            config={{
              active: {
                color: colors.success,
                bg: colors.successLight,
                label: "Active",
              },
              cancelled: {
                color: colors.textSecondary,
                bg: colors.surfaceSecondary,
                label: "Cancelled",
              },
            }}
          />
        </View>
      </View>
    </Card>
  );
}

export default function AdminExpensesScreen() {
  const currency = useCurrency();
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"active" | "cancelled">(
    "active",
  );

  const expensesQuery = useQuery({
    queryKey: ["admin-expenses"],
    queryFn: () => getExpenses(),
  });

  const expenses = expensesQuery.data || [];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCategory =
        selectedCategory === "all" || e.category === selectedCategory;
      const matchesStatus = e.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [expenses, selectedCategory, selectedStatus]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenHeader
        title="Expenses"
        subtitle={`${filteredExpenses.length} expenses - ${totalAmount.toLocaleString()} ${currency} total`}
      />

      {/* Status Toggle */}
      <View style={styles.statusToggleContainer}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.statusTab,
              selectedStatus === tab.key && styles.statusTabActive,
            ]}
            onPress={() => setSelectedStatus(tab.key as "active" | "cancelled")}
          >
            <Text
              style={[
                styles.statusTabText,
                selectedStatus === tab.key && styles.statusTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          const chipColor =
            cat.key === "all"
              ? colors.primary
              : categoryColors[cat.key] || colors.primary;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                isActive && { backgroundColor: chipColor },
                !isActive && { backgroundColor: colors.surface },
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && { color: colors.white },
                  !isActive && { color: colors.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Expense List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={expensesQuery.isRefetching}
            onRefresh={() => expensesQuery.refetch()}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No expenses found"
            subtitle={
              selectedCategory === "all"
                ? `No ${selectedStatus} expenses`
                : `No ${selectedStatus} ${selectedCategory} expenses`
            }
          />
        ) : (
          filteredExpenses.map((expense) => (
            <ExpenseItem key={expense._id} expense={expense} />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("CreateExpense")}
      >
        <Icon name="plus" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusToggleContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 3,
  },
  statusTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  statusTabActive: {
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  statusTabText: {
    ...typography.captionBold,
    color: colors.textTertiary,
  },
  statusTabTextActive: {
    color: colors.textPrimary,
  },
  categoryScroll: {
    marginTop: spacing.md,
    maxHeight: 44,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  categoryChipText: {
    ...typography.captionBold,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  expenseCard: {
    marginBottom: spacing.sm,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  expenseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryBadgeText: {
    ...typography.smallBold,
  },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  recurringText: {
    ...typography.smallBold,
    color: colors.info,
  },
  expenseDate: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 4,
  },
  expenseRight: {
    alignItems: "flex-end",
    marginLeft: spacing.sm,
  },
  expenseAmount: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fab: {
    position: "absolute",
    bottom: spacing.xxl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.lg,
  },
});
