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
import { createAnnouncement } from "../../api/admin";
import { Card, ScreenHeader } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";
import dayjs from "dayjs";

type Priority = "low" | "normal" | "urgent";

const priorityOptions: Array<{
  value: Priority;
  label: string;
  icon: string;
  color: string;
}> = [
  {
    value: "low",
    label: "Low",
    icon: "information-outline",
    color: colors.textSecondary,
  },
  {
    value: "normal",
    label: "Normal",
    icon: "information",
    color: colors.primary,
  },
  {
    value: "urgent",
    label: "Urgent",
    icon: "alert-circle",
    color: colors.danger,
  },
];

export default function AnnouncementComposerScreen() {
  const navigation = useNavigation<any>();

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
      Alert.alert("Validation", "Please enter a title.");
      return;
    }
    if (!bodyTrimmed) {
      Alert.alert("Validation", "Please enter a body.");
      return;
    }

    Alert.alert(
      "Publish Announcement",
      `Send this ${priority} announcement to all residents?\n\n"${titleTrimmed}"`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
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
          <Text style={styles.successTitle}>Announcement Published</Text>
          <Text style={styles.successSubtitle}>
            Your announcement has been sent to all residents.
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
              <Text style={styles.submitText}>Create Another</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Go Back</Text>
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
          title="New Announcement"
          subtitle="Notify all building residents"
        />

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Water maintenance scheduled"
            placeholderTextColor={colors.textTertiary}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={styles.label}>Body *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Write the details of your announcement..."
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
          <Text style={styles.label}>Priority</Text>
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
          <Text style={styles.label}>Preview</Text>
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
              <Text style={styles.previewTime}>Just now</Text>
            </View>
            <Text
              style={[
                styles.previewTitle,
                !titleTrimmed && styles.previewPlaceholder,
              ]}
            >
              {titleTrimmed || "Announcement title"}
            </Text>
            <Text
              style={[
                styles.previewBody,
                !bodyTrimmed && styles.previewPlaceholder,
              ]}
              numberOfLines={5}
            >
              {bodyTrimmed || "Announcement body will appear here..."}
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
            {mutation.isPending ? "Publishing..." : "Publish Announcement"}
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
