import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import dayjs from "dayjs";
import { createExpense } from "../../api/admin";
import { useCurrency } from "../../hooks/useCurrency";
import { colors, spacing, radius, typography, shadow } from "../../theme";

const categories = [
  {
    key: "fixed",
    label: "Fixed / Recurring",
    icon: "calendar-check",
    color: colors.fixed,
  },
  {
    key: "maintenance",
    label: "Maintenance",
    icon: "wrench",
    color: colors.maintenance,
  },
  {
    key: "elevator",
    label: "Elevator",
    icon: "elevator-passenger",
    color: colors.elevator,
  },
  { key: "project", label: "Project", icon: "hammer", color: colors.project },
  {
    key: "emergency",
    label: "Emergency",
    icon: "alert-circle",
    color: colors.emergency,
  },
];

export default function CreateExpenseScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const currency = useCurrency();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("fixed");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createExpense({
        title: title.trim(),
        description: description.trim(),
        category,
        amount: parseFloat(amount),
        isRecurring,
        date: dayjs().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-monthly-report"] });
      Alert.alert("Success", "Expense created and distributed to all units.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert("Error", "Failed to create expense"),
  });

  const handleSubmit = () => {
    if (!title.trim()) return Alert.alert("Error", "Title is required");
    if (!amount || parseFloat(amount) <= 0)
      return Alert.alert("Error", "Enter a valid amount");

    Alert.alert(
      "Create Expense",
      `${title}\n${parseFloat(amount).toLocaleString()} ${currency} (${category})\n\nThis will be distributed to all occupied units.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Create", onPress: () => mutation.mutate() },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Monthly Cleaning Service"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Additional details..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                category === cat.key && {
                  backgroundColor: cat.color + "20",
                  borderColor: cat.color,
                },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Icon
                name={cat.icon}
                size={16}
                color={category === cat.key ? cat.color : colors.textTertiary}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  category === cat.key && { color: cat.color },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Amount ({currency})</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setIsRecurring(!isRecurring)}
        activeOpacity={0.7}
      >
        <Icon
          name={isRecurring ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={isRecurring ? colors.primary : colors.textTertiary}
        />
        <Text style={styles.toggleLabel}>Recurring expense (monthly)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, mutation.isPending && styles.disabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>Create Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl * 2 },
  field: { marginBottom: spacing.xl },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    ...typography.body,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipText: { ...typography.captionBold, color: colors.textSecondary },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  toggleLabel: { ...typography.body, color: colors.textPrimary },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    ...shadow.md,
  },
  disabled: { opacity: 0.6 },
  submitText: { ...typography.bodyBold, color: colors.white },
});
