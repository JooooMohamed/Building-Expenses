import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import {
  getResidents,
  getResidentUnpaidCharges,
  recordCashPayment,
} from "../../api/admin";
import { useCurrency } from "../../hooks/useCurrency";
import { Card, ScreenHeader, EmptyState } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";
import dayjs from "dayjs";
import type { User, ResidentCharge } from "../../types";

export default function CashPaymentScreen() {
  const queryClient = useQueryClient();
  const currency = useCurrency();
  const { t } = useTranslation();

  // ── Form state ────────────────────────────────
  const [selectedResident, setSelectedResident] = useState<User | null>(null);
  const [residentPickerOpen, setResidentPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState("");
  const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(
    new Set(),
  );
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────
  const { data: residents = [], isLoading: loadingResidents } = useQuery({
    queryKey: ["admin-residents"],
    queryFn: getResidents,
  });

  // Fetch unpaid charges for the selected resident (ALL unpaid, not just overdue)
  const { data: residentCharges = [], isLoading: loadingCharges } = useQuery({
    queryKey: ["admin-resident-unpaid", selectedResident?.id],
    queryFn: () => getResidentUnpaidCharges(selectedResident!.id),
    enabled: !!selectedResident,
  });

  // Filtered resident list for search
  const filteredResidents = useMemo(() => {
    if (!searchQuery.trim()) return residents;
    const q = searchQuery.toLowerCase();
    return residents.filter(
      (r) =>
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    );
  }, [residents, searchQuery]);

  // Auto-calculate total from selected shares
  const selectedTotal = useMemo(() => {
    return residentCharges
      .filter((c) => selectedShareIds.has(c._id))
      .reduce((sum, c) => sum + (c.amount - c.paidAmount), 0);
  }, [residentCharges, selectedShareIds]);

  // ── Mutation ──────────────────────────────────
  const mutation = useMutation({
    mutationFn: recordCashPayment,
    onSuccess: (data: any) => {
      setReceiptNumber(data.receiptNumber || data._id || "N/A");
      queryClient.invalidateQueries({ queryKey: ["admin-resident-unpaid"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overdue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-monthly-report"] });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to record payment.",
      );
    },
  });

  // ── Helpers ───────────────────────────────────
  function toggleShare(id: string) {
    setSelectedShareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllShares() {
    if (selectedShareIds.size === residentCharges.length) {
      setSelectedShareIds(new Set());
    } else {
      setSelectedShareIds(new Set(residentCharges.map((c) => c._id)));
    }
  }

  function handleSelectResident(resident: User) {
    setSelectedResident(resident);
    setSelectedShareIds(new Set());
    setAmount("");
    setResidentPickerOpen(false);
    setSearchQuery("");
  }

  function handleAutoFillAmount() {
    if (selectedTotal > 0) {
      setAmount(selectedTotal.toFixed(2));
    }
  }

  function validate(): string | null {
    if (!selectedResident) return t("cashPayment.errorNoResident");
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
      return t("cashPayment.errorInvalidAmount");
    if (!paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate))
      return t("cashPayment.errorInvalidAmount");
    return null;
  }

  function handleSubmit() {
    const error = validate();
    if (error) {
      Alert.alert("Validation", error);
      return;
    }

    const residentName = `${selectedResident!.firstName} ${selectedResident!.lastName}`;
    const parsedAmount = parseFloat(amount);

    const chargeCount =
      selectedShareIds.size > 0
        ? `${selectedShareIds.size} charge(s) selected.`
        : "Payment will auto-allocate to oldest unpaid charges.";

    Alert.alert(
      "Confirm Cash Payment",
      `Record ${parsedAmount.toLocaleString()} ${currency} from ${residentName}?\n\n${chargeCount}\nDate: ${paymentDate}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // Get unitId from first charge or first available
            const firstCharge = residentCharges[0];
            mutation.mutate({
              residentId: selectedResident!.id,
              unitId: firstCharge?.unitId?._id || "",
              amount: parsedAmount,
              paymentDate,
              // Send empty array — backend will auto-FIFO allocate to expense shares
              expenseShareIds: [],
              notes: notes.trim() || undefined,
            });
          },
        },
      ],
    );
  }

  function resetForm() {
    setSelectedResident(null);
    setSelectedShareIds(new Set());
    setAmount("");
    setPaymentDate(dayjs().format("YYYY-MM-DD"));
    setNotes("");
    setReceiptNumber(null);
  }

  // ── Success view ──────────────────────────────
  if (receiptNumber) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.successContent}
        >
          <View style={styles.successIconBg}>
            <Icon name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>{t("cashPayment.paymentRecorded")}</Text>
          <Text style={styles.successSubtitle}>
            {t("cashPayment.success")}
          </Text>

          <Card style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{t("cashPayment.receiptNumber")}</Text>
              <Text style={styles.receiptValue}>{receiptNumber}</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{t("cashPayment.resident")}</Text>
              <Text style={styles.receiptValue}>
                {selectedResident?.firstName} {selectedResident?.lastName}
              </Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{t("cashPayment.amount")}</Text>
              <Text style={styles.receiptValue}>
                {parseFloat(amount).toLocaleString()} {currency}
              </Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{t("cashPayment.date")}</Text>
              <Text style={styles.receiptValue}>
                {dayjs(paymentDate).format("MMM D, YYYY")}
              </Text>
            </View>
          </Card>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={resetForm}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={20} color={colors.white} />
            <Text style={styles.submitText}>{t("cashPayment.recordAnother")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main form ─────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-residents"] });
              if (selectedResident) {
                queryClient.invalidateQueries({
                  queryKey: ["admin-resident-unpaid", selectedResident.id],
                });
              }
            }}
          />
        }
      >
        <ScreenHeader
          title={t("cashPayment.title")}
          subtitle={t("cashPayment.subtitle")}
        />

        {/* Resident Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("cashPayment.selectResident")} *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setResidentPickerOpen(true)}
            activeOpacity={0.7}
          >
            {selectedResident ? (
              <View style={styles.pickerSelected}>
                <View style={styles.residentAvatar}>
                  <Text style={styles.residentAvatarText}>
                    {selectedResident.firstName[0]}
                    {selectedResident.lastName[0]}
                  </Text>
                </View>
                <View style={styles.pickerSelectedInfo}>
                  <Text style={styles.pickerSelectedName}>
                    {selectedResident.firstName} {selectedResident.lastName}
                  </Text>
                  <Text style={styles.pickerSelectedEmail}>
                    {selectedResident.email}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.pickerPlaceholder}>
                <Icon
                  name="account-search-outline"
                  size={20}
                  color={colors.textTertiary}
                />
                <Text style={styles.pickerPlaceholderText}>
                  {t("cashPayment.selectResident")}
                </Text>
              </View>
            )}
            <Icon name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Unpaid Charges Checklist */}
        {selectedResident && (
          <View style={styles.section}>
            <View style={styles.chargesHeader}>
              <Text style={styles.label}>{t("cashPayment.unpaidCharges")}</Text>
              {residentCharges.length > 0 && (
                <TouchableOpacity onPress={selectAllShares}>
                  <Text style={styles.selectAllText}>
                    {selectedShareIds.size === residentCharges.length
                      ? t("cashPayment.deselectAll")
                      : t("cashPayment.selectAll")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingCharges ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>{t("common.loading")}</Text>
              </View>
            ) : residentCharges.length === 0 ? (
              <Card style={styles.emptyCharges}>
                <View style={styles.emptyChargesRow}>
                  <Icon
                    name="check-circle-outline"
                    size={24}
                    color={colors.success}
                  />
                  <Text style={styles.emptyChargesText}>
                    {t("cashPayment.noUnpaidCharges")}
                  </Text>
                </View>
              </Card>
            ) : (
              residentCharges.map((charge) => {
                const remaining = charge.amount - charge.paidAmount;
                const isSelected = selectedShareIds.has(charge._id);
                return (
                  <TouchableOpacity
                    key={charge._id}
                    style={[
                      styles.chargeItem,
                      isSelected && styles.chargeItemSelected,
                    ]}
                    onPress={() => toggleShare(charge._id)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={
                        isSelected
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={22}
                      color={isSelected ? colors.primary : colors.textTertiary}
                    />
                    <View style={styles.chargeInfo}>
                      <Text style={styles.chargeDescription}>
                        {charge.description || charge.chargeType}
                      </Text>
                      <Text style={styles.chargeMeta}>
                        {charge.period}
                        {" \u2022 "}
                        Unit {charge.unitId.unitNumber}
                        {" \u2022 "}
                        Due {dayjs(charge.dueDate).format("MMM D")}
                      </Text>
                    </View>
                    <View style={styles.chargeAmountCol}>
                      <Text style={styles.chargeAmount}>
                        {remaining.toLocaleString()} {currency}
                      </Text>
                      {charge.paidAmount > 0 && (
                        <Text style={styles.chargePaidNote}>
                          of {charge.amount.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {selectedShareIds.size > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryText}>
                  {t("cashPayment.chargesSelected", { count: selectedShareIds.size })}
                </Text>
                <TouchableOpacity onPress={handleAutoFillAmount}>
                  <Text style={styles.autoFillText}>
                    {t("cashPayment.autoFill", { amount: selectedTotal.toLocaleString(), currency })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("cashPayment.amount")} ({currency}) *</Text>
          <View style={styles.inputRow}>
            <View style={styles.currencyTag}>
              <Text style={styles.currencyText}>{currency}</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder={t("cashPayment.amountPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("cashPayment.paymentDate")} *</Text>
          <View style={styles.inputWrapper}>
            <Icon
              name="calendar"
              size={18}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder={t("cashPayment.datePlaceholder")}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("cashPayment.notes")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t("cashPayment.notesPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            mutation.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          activeOpacity={0.8}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="cash-check" size={20} color={colors.white} />
          )}
          <Text style={styles.submitText}>
            {mutation.isPending ? t("cashPayment.recording") : t("cashPayment.recordPayment")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Resident Picker Modal */}
      <Modal
        visible={residentPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setResidentPickerOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("cashPayment.selectResident")}</Text>
            <TouchableOpacity
              onPress={() => {
                setResidentPickerOpen(false);
                setSearchQuery("");
              }}
            >
              <Icon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Icon
              name="magnify"
              size={20}
              color={colors.textTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("cashPayment.searchResident")}
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
          </View>

          {loadingResidents ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredResidents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.residentItem}
                  onPress={() => handleSelectResident(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.residentAvatar}>
                    <Text style={styles.residentAvatarText}>
                      {item.firstName[0]}
                      {item.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.residentInfo}>
                    <Text style={styles.residentName}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={styles.residentEmail}>{item.email}</Text>
                  </View>
                  {selectedResident?.id === item.id && (
                    <Icon
                      name="check-circle"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.residentList}
              ListEmptyComponent={
                <EmptyState
                  icon="account-off-outline"
                  title={t("cashPayment.noResidentsFound")}
                  subtitle={t("cashPayment.tryDifferentSearch")}
                />
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl * 2 },
  successContent: {
    paddingBottom: spacing.xxxl * 2,
    alignItems: "center",
    paddingTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },

  // ── Form ──────────────────────────────────────
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: { marginLeft: spacing.md },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    paddingTop: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyTag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  currencyText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // ── Picker ────────────────────────────────────
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pickerPlaceholder: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pickerPlaceholderText: { ...typography.body, color: colors.textTertiary },
  pickerSelected: { flex: 1, flexDirection: "row", alignItems: "center" },
  pickerSelectedInfo: { flex: 1, marginLeft: spacing.md },
  pickerSelectedName: { ...typography.bodyBold, color: colors.textPrimary },
  pickerSelectedEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ── Charges ───────────────────────────────────
  chargesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  selectAllText: { ...typography.captionBold, color: colors.primary },
  chargeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  chargeItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chargeInfo: { flex: 1 },
  chargeDescription: { ...typography.bodyBold, color: colors.textPrimary },
  chargeMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chargeAmountCol: { alignItems: "flex-end" },
  chargeAmount: { ...typography.bodyBold, color: colors.textPrimary },
  chargePaidNote: { ...typography.small, color: colors.textTertiary },
  emptyCharges: { marginBottom: spacing.sm },
  emptyChargesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  emptyChargesText: { ...typography.body, color: colors.textSecondary },
  selectedSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedSummaryText: { ...typography.captionBold, color: colors.primary },
  autoFillText: {
    ...typography.captionBold,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: { ...typography.caption, color: colors.textSecondary },

  // ── Submit ────────────────────────────────────
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    gap: spacing.sm,
    ...shadow.md,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { ...typography.bodyBold, color: colors.white },

  // ── Success ───────────────────────────────────
  successIconBg: { marginBottom: spacing.lg },
  successTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xxl,
  },
  receiptCard: { width: "100%", marginBottom: spacing.xxl },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  receiptLabel: { ...typography.caption, color: colors.textSecondary },
  receiptValue: { ...typography.bodyBold, color: colors.textPrimary },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // ── Modal ─────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginLeft: spacing.md },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  residentList: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  residentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  residentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  residentAvatarText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  residentInfo: { flex: 1, marginLeft: spacing.md },
  residentName: { ...typography.bodyBold, color: colors.textPrimary },
  residentEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
