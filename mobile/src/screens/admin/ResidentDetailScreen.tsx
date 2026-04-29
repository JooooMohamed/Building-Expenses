import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { getResident, getUnits, deactivateResident } from "../../api/admin";
import { Card, StatusBadge, SectionHeader } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";
import type { Unit } from "../../types";

export default function ResidentDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { residentId } = route.params;

  const residentQuery = useQuery({
    queryKey: ["admin-resident", residentId],
    queryFn: () => getResident(residentId),
  });

  const unitsQuery = useQuery({
    queryKey: ["admin-units"],
    queryFn: getUnits,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateResident(residentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-residents"] });
      Alert.alert(t("residentDetail.deactivate"), undefined, [
        { text: t("common.done"), onPress: () => navigation.goBack() },
      ]);
    },
  });

  const resident = residentQuery.data;
  const units = unitsQuery.data || [];
  const residentUnit = units.find(
    (u: Unit) => u.residentId && u.residentId._id === residentId,
  );

  const handleDeactivate = () => {
    Alert.alert(
      t("residentDetail.deactivate"),
      `${resident?.firstName} ${resident?.lastName}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("residentDetail.deactivate"), style: "destructive", onPress: () => deactivateMutation.mutate() },
      ],
    );
  };

  if (!resident) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const initials = `${(resident.firstName || "")[0]}${(resident.lastName || "")[0]}`.toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={residentQuery.isRefetching}
          onRefresh={() => residentQuery.refetch()}
        />
      }
    >
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{resident.firstName} {resident.lastName}</Text>
        <Text style={styles.email}>{resident.email}</Text>
      </View>

      {/* Info cards */}
      <View style={styles.section}>
        <SectionHeader title={t("residentDetail.contact")} />
        <Card>
          <InfoRow icon="email-outline" label={t("addResident.email")} value={resident.email} />
          <InfoRow icon="phone-outline" label={t("addResident.phone")} value={resident.phone || "N/A"} />
        </Card>
      </View>

      {residentUnit && (
        <View style={styles.section}>
          <SectionHeader title={t("residentDetail.unit")} />
          <Card>
            <InfoRow icon="door" label={t("residentDetail.unit")} value={residentUnit.unitNumber} />
            <InfoRow icon="stairs" label={t("residentDetail.floor")} value={String(residentUnit.floor)} />
            <InfoRow icon="ruler-square" label={t("residentDetail.area")} value={residentUnit.area ? `${residentUnit.area} m²` : "N/A"} />
            <InfoRow icon="scale-balance" label={t("residentDetail.shareCoefficient")} value={String(residentUnit.shareCoefficient)} />
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title={t("residentDetail.account")} />
        <Card>
          <InfoRow icon="calendar-clock" label={t("residentDetail.paymentFreq")} value={resident.paymentFrequency || "monthly"} />
          <InfoRow icon="shield-account" label={t("residentDetail.role")} value={resident.role} />
        </Card>
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={handleDeactivate}>
        <Icon name="account-off-outline" size={20} color={colors.danger} />
        <Text style={styles.dangerText}>{t("residentDetail.deactivate")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={colors.textTertiary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl * 2 },
  loadingText: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: 100 },
  header: { alignItems: "center", paddingVertical: spacing.xxl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: "700" },
  name: { ...typography.h2, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { ...typography.caption, color: colors.textSecondary, flex: 1, marginLeft: spacing.sm },
  infoValue: { ...typography.bodyBold, color: colors.textPrimary },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  dangerText: { ...typography.bodyBold, color: colors.danger },
});
