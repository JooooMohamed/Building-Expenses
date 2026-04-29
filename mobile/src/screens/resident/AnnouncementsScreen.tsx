import React from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { getAnnouncements } from "../../api/resident";
import { Card, EmptyState, ScreenHeader } from "../../components/ui";
import { colors, spacing, radius, typography } from "../../theme";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Announcement } from "../../types";

dayjs.extend(relativeTime);

const priorityConfig: Record<string, { color: string; icon: string }> = {
  urgent: { color: colors.danger, icon: "alert-circle" },
  normal: { color: colors.primary, icon: "information" },
  low: { color: colors.textSecondary, icon: "information-outline" },
};

function AnnouncementItem({ item }: { item: Announcement }) {
  const config = priorityConfig[item.priority] || priorityConfig.normal;
  return (
    <Card style={styles.item}>
      <View style={styles.itemHeader}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: config.color + "15" },
          ]}
        >
          <Icon name={config.icon} size={14} color={config.color} />
          <Text style={[styles.priorityText, { color: config.color }]}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </Text>
        </View>
        <Text style={styles.itemTime}>{dayjs(item.createdAt).fromNow()}</Text>
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemBody}>{item.body}</Text>
    </Card>
  );
}

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: getAnnouncements,
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title={t("announcements.title")} subtitle={t("announcements.buildingUpdates")} />
      <FlatList
        data={data || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AnnouncementItem item={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="bullhorn-outline"
              title={t("announcements.noAnnouncements")}
              subtitle={t("announcements.buildingUpdates")}
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
  item: { marginBottom: spacing.md },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: 4,
  },
  priorityText: { ...typography.smallBold },
  itemTime: { ...typography.small, color: colors.textTertiary },
  itemTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  itemBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
