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
import { useTranslation } from "react-i18next";
import { createResident } from "../../api/admin";
import { colors, spacing, radius, typography, shadow } from "../../theme";

export default function AddResidentScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createResident({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-residents"] });
      Alert.alert(t("addResident.success"), undefined, [
        { text: t("common.done"), onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t("common.error");
      Alert.alert(t("common.error"), Array.isArray(msg) ? msg.join("\n") : msg);
    },
  });

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) return Alert.alert(t("common.error"), t("addResident.firstName") + " required");
    if (!email.trim()) return Alert.alert(t("common.error"), t("addResident.email") + " required");
    if (!password || password.length < 8) return Alert.alert(t("common.error"), t("auth.newPasswordPlaceholder"));

    mutation.mutate();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.field}>
        <Text style={styles.label}>{t("addResident.firstName")}</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t("addResident.firstName")}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("addResident.lastName")}</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder={t("addResident.lastName")}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("addResident.email")}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("addResident.phone")}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+20 100 000 0000"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("addResident.temporaryPassword")}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t("auth.newPasswordPlaceholder")}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, mutation.isPending && styles.disabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>{t("addResident.create")}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl * 2 },
  field: { marginBottom: spacing.xl },
  label: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.sm },
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.md,
    ...shadow.md,
  },
  disabled: { opacity: 0.6 },
  submitText: { ...typography.bodyBold, color: colors.white },
});
