import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getBuildingExpenses } from '../../api/resident';
import dayjs from 'dayjs';

const categoryLabels: Record<string, string> = {
  fixed: 'Fixed / Recurring',
  maintenance: 'Maintenance',
  elevator: 'Elevator',
  project: 'Projects',
  emergency: 'Emergency',
};

const categoryColors: Record<string, string> = {
  fixed: '#4361ee',
  maintenance: '#f77f00',
  elevator: '#7209b7',
  project: '#2ec4b6',
  emergency: '#e63946',
};

export default function ExpensesScreen() {
  const [period] = useState(dayjs().format('YYYY-MM'));

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['building-expenses', period],
    queryFn: () => getBuildingExpenses(period),
  });

  const total = data?.reduce((sum, item) => sum + item.total, 0) || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Building Expenses</Text>
        <Text style={styles.headerPeriod}>{dayjs(period).format('MMMM YYYY')}</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Building Expenses</Text>
        <Text style={styles.totalAmount}>{total.toLocaleString()} TRY</Text>
      </View>

      <View style={styles.breakdown}>
        <Text style={styles.sectionTitle}>Breakdown by Category</Text>
        {data?.map((item) => {
          const pct = total > 0 ? (item.total / total) * 100 : 0;
          return (
            <View key={item._id} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <View
                  style={[styles.dot, { backgroundColor: categoryColors[item._id] || '#999' }]}
                />
                <Text style={styles.categoryName}>
                  {categoryLabels[item._id] || item._id}
                </Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>{item.total.toLocaleString()} TRY</Text>
                <Text style={styles.categoryPct}>{pct.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.disclaimer}>
        These are aggregated building expenses. Individual shares may vary based on unit size.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingHorizontal: 20, paddingTop: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  headerPeriod: { fontSize: 14, color: '#6c757d', marginTop: 4 },
  totalCard: {
    margin: 20, backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 24, alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  totalAmount: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 8 },
  breakdown: { marginHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginBottom: 8,
  },
  categoryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  categoryRight: { alignItems: 'flex-end' },
  categoryAmount: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  categoryPct: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  disclaimer: {
    marginHorizontal: 20, marginBottom: 30, fontSize: 12,
    color: '#adb5bd', textAlign: 'center',
  },
});
