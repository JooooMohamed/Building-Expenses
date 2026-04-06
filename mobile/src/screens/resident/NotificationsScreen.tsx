import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead } from '../../api/resident';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { AppNotification } from '../../types';

dayjs.extend(relativeTime);

const typeIcons: Record<string, string> = {
  payment_reminder: '🔔',
  payment_confirmed: '✅',
  new_expense: '📄',
  announcement: '📢',
  project_update: '🏗',
  overdue: '⚠️',
};

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{typeIcons[item.type] || '📌'}</Text>
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
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <View style={styles.container}>
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 16 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginBottom: 8,
  },
  itemUnread: { backgroundColor: '#eef2ff' },
  icon: { fontSize: 22, marginRight: 12, marginTop: 2 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, color: '#1a1a2e' },
  itemTitleBold: { fontWeight: '700' },
  itemBody: { fontSize: 13, color: '#6c757d', marginTop: 4 },
  itemTime: { fontSize: 11, color: '#adb5bd', marginTop: 6 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#4361ee', marginTop: 6,
  },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
});
