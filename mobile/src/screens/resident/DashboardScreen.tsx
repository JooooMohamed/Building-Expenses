import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../api/resident';
import { useAuthStore } from '../../store/auth';
import type { ExpenseShare } from '../../types';

const categoryColors: Record<string, string> = {
  fixed: '#4361ee',
  maintenance: '#f77f00',
  elevator: '#7209b7',
  project: '#2ec4b6',
  emergency: '#e63946',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { paid: '#2d6a4f', partial: '#e9c46a', unpaid: '#e63946' };
  const bg: Record<string, string> = { paid: '#d8f3dc', partial: '#fff3cd', unpaid: '#fce4ec' };
  return (
    <View style={[styles.badge, { backgroundColor: bg[status] || '#eee' }]}>
      <Text style={[styles.badgeText, { color: colors[status] || '#333' }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

function DueItem({ share }: { share: ExpenseShare }) {
  const category = share.expenseId?.category || 'fixed';
  return (
    <View style={styles.dueItem}>
      <View style={[styles.categoryDot, { backgroundColor: categoryColors[category] || '#999' }]} />
      <View style={styles.dueInfo}>
        <Text style={styles.dueTitle}>{share.expenseId?.title || 'Expense'}</Text>
        <Text style={styles.duePeriod}>{share.period}</Text>
      </View>
      <View style={styles.dueRight}>
        <Text style={styles.dueAmount}>{share.amount.toLocaleString()} TRY</Text>
        <StatusBadge status={share.status} />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  const summary = data?.summary;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Welcome back, {user?.firstName || 'Resident'}
        </Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Remaining Balance</Text>
        <Text style={styles.balanceAmount}>
          {isLoading ? '...' : `${(summary?.remainingBalance || 0).toLocaleString()} TRY`}
        </Text>

        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <Text style={styles.statLabel}>Total Due</Text>
            <Text style={styles.statValue}>{(summary?.totalDue || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceStat}>
            <Text style={styles.statLabel}>Total Paid</Text>
            <Text style={[styles.statValue, { color: '#2d6a4f' }]}>
              {(summary?.totalPaid || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>{'💳'}</Text>
          <Text style={styles.actionLabel}>Pay Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>{'📋'}</Text>
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>{'🏢'}</Text>
          <Text style={styles.actionLabel}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>{'📢'}</Text>
          <Text style={styles.actionLabel}>News</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Dues</Text>
        {data?.recentDues?.length === 0 && (
          <Text style={styles.emptyText}>No dues found</Text>
        )}
        {data?.recentDues?.map((share) => (
          <DueItem key={share._id} share={share} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  greeting: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greetingText: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  balanceCard: { margin: 20, backgroundColor: '#4361ee', borderRadius: 20, padding: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '700', marginBottom: 20 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceStat: { flex: 1, alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  actionButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#495057' },
  section: { margin: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  emptyText: { color: '#6c757d', textAlign: 'center', paddingVertical: 20 },
  dueItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginBottom: 8,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  dueInfo: { flex: 1 },
  dueTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  duePeriod: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  dueRight: { alignItems: 'flex-end' },
  dueAmount: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
