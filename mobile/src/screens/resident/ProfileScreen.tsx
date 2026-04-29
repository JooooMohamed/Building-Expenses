import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/auth";
import { changePassword } from "../../api/auth";
import client from "../../api/client";
import { Card, ScreenHeader } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const { t } = useTranslation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("common.error"), t("common.submit") + " required");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t("common.error"), t("auth.newPasswordPlaceholder"));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t("common.error"), t("profile.confirmPassword") + " mismatch");
      return;
    }
    setIsChanging(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert(t("profile.updatePassword"));
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      Alert.alert(t("common.error"));
    } finally {
      setIsChanging(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert(t("common.error"), t("profile.firstName") + " required");
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await client.patch("/me/profile", {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
      });
      setUser({ ...user!, firstName: data.firstName, lastName: data.lastName, phone: data.phone });
      Alert.alert(t("profile.saveChanges"));
      setShowEditProfile(false);
    } catch {
      Alert.alert(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("auth.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("auth.logout"), style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={t("profile.title")} />

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Icon
            name={user?.role === "admin" ? "shield-account" : "account"}
            size={14}
            color={colors.primary}
          />
          <Text style={styles.roleText}>
            {user?.role === "admin" ? t("profile.administrator") : t("profile.resident")}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowEditProfile(!showEditProfile)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBg, { backgroundColor: colors.infoLight }]}>
            <Icon name="account-edit-outline" size={20} color={colors.info} />
          </View>
          <Text style={styles.menuLabel}>{t("profile.editProfile")}</Text>
          <Icon
            name={showEditProfile ? "chevron-up" : "chevron-down"}
            size={22}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        {showEditProfile && (
          <Card style={styles.passwordForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("profile.firstName")}</Text>
              <TextInput
                style={styles.input}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder={t("profile.firstName")}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("profile.lastName")}</Text>
              <TextInput
                style={styles.input}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder={t("profile.lastName")}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("profile.phone")}</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder={t("profile.phone")}
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{t("profile.saveChanges")}</Text>
              )}
            </TouchableOpacity>
          </Card>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowChangePassword(!showChangePassword)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuIconBg,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Icon name="lock-reset" size={20} color={colors.primary} />
          </View>
          <Text style={styles.menuLabel}>{t("profile.changePassword")}</Text>
          <Icon
            name={showChangePassword ? "chevron-up" : "chevron-down"}
            size={22}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        {showChangePassword && (
          <Card style={styles.passwordForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("profile.currentPassword")}</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder={t("profile.currentPassword")}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("profile.newPassword")}</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder={t("profile.newPassword")}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("profile.confirmPassword")}</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder={t("profile.confirmPassword")}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isChanging && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={isChanging}
              activeOpacity={0.8}
            >
              {isChanging ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{t("profile.updatePassword")}</Text>
              )}
            </TouchableOpacity>
          </Card>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View
            style={[styles.menuIconBg, { backgroundColor: colors.dangerLight }]}
          >
            <Icon name="logout" size={20} color={colors.danger} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.danger }]}>
            {t("auth.logout")}
          </Text>
          <Icon name="chevron-right" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: "700" },
  userName: { ...typography.h3, color: colors.textPrimary },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  roleText: { ...typography.captionBold, color: colors.primary },
  section: { paddingHorizontal: spacing.xl },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuLabel: { flex: 1, ...typography.bodyBold, color: colors.textPrimary },
  passwordForm: { marginBottom: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  saveButtonText: { color: colors.white, ...typography.bodyBold },
});
