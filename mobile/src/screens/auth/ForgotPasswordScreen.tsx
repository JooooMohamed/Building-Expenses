import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { colors, spacing, radius, typography, shadow } from "../../theme";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Reset password flow (token-based)
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.emailPlaceholder"));
      return;
    }

    setIsLoading(true);
    try {
      await client.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim() || !newPassword.trim()) {
      Alert.alert(t("common.error"), t("common.submit") + " required");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t("common.error"), t("auth.newPasswordPlaceholder"));
      return;
    }

    setIsLoading(true);
    try {
      await client.post("/auth/reset-password", {
        token: token.trim(),
        newPassword,
      });
      Alert.alert(t("auth.resetPassword"), undefined, [
        { text: t("common.done"), onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert(t("common.error"), t("auth.resetToken") + " invalid");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent && !showReset) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="email-check-outline" size={64} color={colors.success} />
          </View>
          <Text style={styles.title}>{t("auth.checkEmail")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.checkEmailSubtitle", { email })}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowReset(true)}
          >
            <Text style={styles.primaryButtonText}>{t("auth.haveToken")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setSent(false);
              setEmail("");
            }}
          >
            <Text style={styles.linkText}>{t("auth.tryDifferentEmail")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>{t("auth.backToLogin")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showReset) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="lock-reset" size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>{t("auth.resetPasswordTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.resetPasswordSubtitle2")}
            </Text>

            <View style={styles.inputContainer}>
              <Icon
                name="key-outline"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.resetToken")}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon
                name="lock-outline"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.newPasswordPlaceholder")}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? t("auth.resetting") : t("auth.resetPassword")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowReset(false)}
            >
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="lock-question" size={64} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t("auth.forgotTitle")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.forgotSubtitle")}
          </Text>

          <View style={styles.inputContainer}>
            <Icon
              name="email-outline"
              size={20}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t("auth.emailAddressPlaceholder")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleSendReset}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? t("auth.sending") : t("auth.sendInstructions")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>{t("auth.backToLogin")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.xxxl,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    width: "100%",
    ...shadow.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  linkButton: {
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
  },
});
