import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getNotifications, markNotificationRead } from "../../api/resident";
import { EmptyState, ScreenHeader } from "../../components/ui";
import { colors, spacing, radius, typography, shadow } from "../../theme";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { AppNotification } from "../../types";

dayjs.extend(relativeTime);

const typeConfig: Record<string, { icon: string; color: string }> = {
  payment_reminder: { icon: "bell-ring-outline", color: colors.warning },
  payment_confirmed: { icon: "check-decagram-outline", color: colors.success },
  new_expense: { icon: "file-document-outline", color: colors.primary },
  announcement: { icon: "bullhorn-outline", color: colors.project },
  project_update: { icon: "hammer-wrench", color: colors.elevator },
  overdue: { icon: "alert-circle-outline", color: colors.danger },
};

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const config = typeConfig[item.type] || {
    icon: "bell-outline",
    color: colors.textSecondary,
  };
  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBg, { backgroundColor: config.color + "15" }]}>
        <Icon name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleBold]}>
          {item.title}
        </Text>
        <Text style={styles.itemBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.itemTime}>{dayjs(item.createdAt).fromNow()}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data, isRefetching, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await getNotifications();
      return res.data ?? res;
    },
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" />
      <FlatList
        data={data || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onPress={() => {
              if (!item.isRead) markRead.mutate(item._id);
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="bell-check-outline"
            title="All clear!"
            subtitle="No notifications right now"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  itemUnread: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  itemContent: { flex: 1 },
  itemTitle: { ...typography.body, color: colors.textPrimary },
  itemTitleBold: { fontWeight: "700" },
  itemBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  itemTime: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
});
