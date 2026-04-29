import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { createAnnouncement } from "../../api/admin";
import { Card, ScreenHeader } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";
import dayjs from "dayjs";

type Priority = "low" | "normal" | "urgent";

const PRIORITY_DEFS: Array<{
  value: Priority;
  icon: string;
  color: string;
}> = [
  { value: "low", icon: "information-outline", color: colors.textSecondary },
  { value: "normal", icon: "information", color: colors.primary },
  { value: "urgent", icon: "alert-circle", color: colors.danger },
];

export default function AnnouncementComposerScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const priorityOptions = PRIORITY_DEFS.map((p) => ({
    ...p,
    label: t(`announcements.priorities.${p.value}` as any),
  }));

  // ── Form state ────────────────────────────────
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [success, setSuccess] = useState(false);

  // ── Mutation ──────────────────────────────────
  const mutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create announcement.",
      );
    },
  });

  // ── Validation ────────────────────────────────
  const titleTrimmed = title.trim();
  const bodyTrimmed = body.trim();
  const isValid = titleTrimmed.length > 0 && bodyTrimmed.length > 0;

  function handleSubmit() {
    if (!titleTrimmed) {
      Alert.alert(t("common.error"), t("announcements.titleLabel") + " required");
      return;
    }
    if (!bodyTrimmed) {
      Alert.alert(t("common.error"), t("announcements.bodyLabel") + " required");
      return;
    }

    Alert.alert(
      t("announcements.publishAnnouncement"),
      `"${titleTrimmed}"`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("announcements.publish"),
          onPress: () => {
            mutation.mutate({
              title: titleTrimmed,
              body: bodyTrimmed,
              priority,
            });
          },
        },
      ],
    );
  }

  function handleReset() {
    setTitle("");
    setBody("");
    setPriority("normal");
    setSuccess(false);
  }

  const currentPriorityConfig = priorityOptions.find(
    (p) => p.value === priority,
  )!;

  // ── Success view ──────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.successContent}
        >
          <View style={styles.successIconBg}>
            <Icon name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>{t("announcements.published")}</Text>
          <Text style={styles.successSubtitle}>
            {t("announcements.sentToAll")}
          </Text>

          <Card style={styles.successCard}>
            <View style={styles.successPreviewHeader}>
              <View
                style={[
                  styles.previewPriorityBadge,
                  { backgroundColor: currentPriorityConfig.color + "15" },
                ]}
              >
                <Icon
                  name={currentPriorityConfig.icon}
                  size={14}
                  color={currentPriorityConfig.color}
                />
                <Text
                  style={[
                    styles.previewPriorityText,
                    { color: currentPriorityConfig.color },
                  ]}
                >
                  {currentPriorityConfig.label}
                </Text>
              </View>
            </View>
            <Text style={styles.previewTitle}>{titleTrimmed}</Text>
            <Text style={styles.previewBody} numberOfLines={4}>
              {bodyTrimmed}
            </Text>
          </Card>

          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={20} color={colors.white} />
              <Text style={styles.submitText}>{t("announcements.createAnother")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>{t("announcements.goBack")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Form view ─────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title={t("announcements.newAnnouncement")}
          subtitle={t("announcements.notifyAll")}
        />

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("announcements.titleLabel")} *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("announcements.titleInputPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("announcements.bodyLabel")} *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder={t("announcements.bodyInputPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{body.length}/2000</Text>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("announcements.priorityLabel")}</Text>
          <View style={styles.priorityRow}>
            {priorityOptions.map((option) => {
              const isActive = priority === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.priorityButton,
                    isActive && {
                      backgroundColor: option.color + "15",
                      borderColor: option.color,
                    },
                  ]}
                  onPress={() => setPriority(option.value)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={option.icon}
                    size={18}
                    color={isActive ? option.color : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.priorityButtonText,
                      isActive && {
                        color: option.color,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("announcements.preview")}</Text>
          <Card style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View
                style={[
                  styles.previewPriorityBadge,
                  { backgroundColor: currentPriorityConfig.color + "15" },
                ]}
              >
                <Icon
                  name={currentPriorityConfig.icon}
                  size={14}
                  color={currentPriorityConfig.color}
                />
                <Text
                  style={[
                    styles.previewPriorityText,
                    { color: currentPriorityConfig.color },
                  ]}
                >
                  {currentPriorityConfig.label}
                </Text>
              </View>
              <Text style={styles.previewTime}>{t("announcements.justNow")}</Text>
            </View>
            <Text
              style={[
                styles.previewTitle,
                !titleTrimmed && styles.previewPlaceholder,
              ]}
            >
              {titleTrimmed || t("announcements.previewTitlePlaceholder")}
            </Text>
            <Text
              style={[
                styles.previewBody,
                !bodyTrimmed && styles.previewPlaceholder,
              ]}
              numberOfLines={5}
            >
              {bodyTrimmed || t("announcements.previewBodyPlaceholder")}
            </Text>
          </Card>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValid || mutation.isPending) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || mutation.isPending}
          activeOpacity={0.8}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="send" size={18} color={colors.white} />
          )}
          <Text style={styles.submitText}>
            {mutation.isPending ? t("announcements.publishing") : t("announcements.publishAnnouncement")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  textArea: {
    minHeight: 140,
    paddingTop: spacing.md,
  },
  charCount: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "right",
    marginTop: spacing.xs,
  },

  // ── Priority ──────────────────────────────────
  priorityRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  priorityButtonText: {
    ...typography.captionBold,
    color: colors.textTertiary,
  },

  // ── Preview ───────────────────────────────────
  previewCard: { borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  previewPriorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: 4,
  },
  previewPriorityText: { ...typography.smallBold },
  previewTime: { ...typography.small, color: colors.textTertiary },
  previewTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  previewBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  previewPlaceholder: { color: colors.textTertiary, fontStyle: "italic" },

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
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { ...typography.bodyBold, color: colors.white },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
    width: "100%",
  },
  secondaryButtonText: { ...typography.bodyBold, color: colors.primary },

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
  successCard: { width: "100%", marginBottom: spacing.xxl },
  successPreviewHeader: { marginBottom: spacing.sm },
  successActions: { width: "100%" },
});
