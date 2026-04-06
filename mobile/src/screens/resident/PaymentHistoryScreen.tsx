import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMyPayments } from '../../api/resident';
import dayjs from 'dayjs';
import type { Payment } from '../../types';

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  online: 'Online',
  bank_transfer: 'Bank Transfer',
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  completed: { color: '#2d6a4f', bg: '#d8f3dc' },
  pending: { color: '#e9c46a', bg: '#fff3cd' },
  failed: { color: '#e63946', bg: '#fce4ec' },
  refunded: { color: '#6c757d', bg: '#e9ecef' },
};

function PaymentItem({ payment }: { payment: Payment }) {
  const config = statusConfig[payment.status] || statusConfig.pending;
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemAmount}>
          {payment.amount.toLocaleString()} {payment.currency}
        </Text>
        <Text style={styles.itemMeta}>
          {methodLabels[payment.method] || payment.method} {' \u2022 '}
          {dayjs(payment.paymentDate).format('MMM D, YYYY')}
        </Text>
        {payment.notes ? <Text style={styles.itemNotes}>{payment.notes}</Text> : null}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusText, { color: config.color }]}>
          {payment.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

export default function PaymentHistoryScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-payments'],
    queryFn: getMyPayments,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PaymentItem payment={item} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>No payments recorded yet</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 16 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginBottom: 8,
  },
  itemLeft: { flex: 1 },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  itemMeta: { fontSize: 13, color: '#6c757d', marginTop: 4 },
  itemNotes: { fontSize: 12, color: '#adb5bd', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
});
