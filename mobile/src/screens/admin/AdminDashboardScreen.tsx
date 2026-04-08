import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/auth';
import {
  getBuilding,
  getResidents,
  getMonthlyReport,
  getOverdueCharges,
} from '../../api/admin';
import {
  Card,
  StatusBadge,
  SectionHeader,
  EmptyState,
} from '../../components/ui';
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  statusConfig,
} from '../../theme';
import type { Building, User, MonthlyReport, ResidentCharge } from '../../types';

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + '12' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OverdueItem({ charge }: { charge: ResidentCharge }) {
  const remaining = charge.amount - charge.paidAmount;
  return (
    <Card style={styles.overdueItem}>
      <View style={styles.overdueRow}>
        <View style={styles.overdueAvatar}>
          <Icon name="account-outline" size={20} color={colors.danger} />
        </View>
        <View style={styles.overdueInfo}>
          <Text style={styles.overdueName}>
            {charge.residentId.firstName} {charge.residentId.lastName}
          </Text>
          <Text style={styles.overdueUnit}>
            Unit {charge.unitId.unitNumber} - Due{' '}
            {dayjs(charge.dueDate).format('MMM D')}
          </Text>
        </View>
        <View style={styles.overdueRight}>
          <Text style={styles.overdueAmount}>
            {remaining.toLocaleString()} TRY
          </Text>
          <StatusBadge status={charge.status} />
        </View>
      </View>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const currentMonth = dayjs().format('YYYY-MM');

  const buildingQuery = useQuery({
    queryKey: ['admin-building'],
    queryFn: getBuilding,
  });

  const residentsQuery = useQuery({
    queryKey: ['admin-residents'],
    queryFn: getResidents,
  });

  const reportQuery = useQuery({
    queryKey: ['admin-monthly-report', currentMonth],
    queryFn: () => getMonthlyReport(currentMonth),
  });

  const overdueQuery = useQuery({
    queryKey: ['admin-overdue'],
    queryFn: getOverdueCharges,
  });

  const isRefetching =
    buildingQuery.isRefetching ||
    residentsQuery.isRefetching ||
    reportQuery.isRefetching ||
    overdueQuery.isRefetching;

  const isLoading =
    buildingQuery.isLoading ||
    residentsQuery.isLoading ||
    reportQuery.isLoading;

  const handleRefresh = () => {
    buildingQuery.refetch();
    residentsQuery.refetch();
    reportQuery.refetch();
    overdueQuery.refetch();
  };

  const building = buildingQuery.data;
  const residents = residentsQuery.data || [];
  const report = reportQuery.data;
  const overdueCharges = overdueQuery.data || [];

  const totalResidents = residents.length;
  const occupiedUnits = residents.filter((r) => r.unitIds && r.unitIds.length > 0).length;
  const totalCollected = report?.collections?.collected || 0;
  const outstanding = report?.outstanding?.total || 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const quickActions = [
    {
      icon: 'plus-circle-outline',
      label: 'Add Expense',
      color: colors.primary,
      screen: 'CreateExpense',
    },
    {
      icon: 'cash-plus',
      label: 'Record\nPayment',
      color: colors.success,
      screen: 'CashPayment',
    },
    {
      icon: 'bullhorn-outline',
      label: 'Send\nAnnouncement',
      color: colors.warning,
      screen: 'ComposeAnnouncement',
    },
    {
      icon: 'chart-line',
      label: 'View\nReports',
      color: colors.elevator,
      screen: 'Reports',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingLabel}>{greeting}</Text>
            <Text style={styles.greetingName}>
              {user?.firstName || 'Admin'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon
              name="account-circle-outline"
              size={28}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Building Info Card */}
        {building && (
          <Card style={styles.buildingCard} variant="elevated">
            <View style={styles.buildingRow}>
              <View style={styles.buildingIconBg}>
                <Icon name="office-building" size={24} color={colors.primary} />
              </View>
              <View style={styles.buildingInfo}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={styles.buildingAddress}>
                  {building.address.street}, {building.address.city}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="account-group-outline"
            label="Residents"
            value={isLoading ? '...' : String(totalResidents)}
            color={colors.primary}
          />
          <StatCard
            icon="home-city-outline"
            label="Occupied"
            value={isLoading ? '...' : String(occupiedUnits)}
            color={colors.success}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="cash-check"
            label="Collected"
            value={
              isLoading
                ? '...'
                : `${totalCollected.toLocaleString()}`
            }
            color={colors.success}
          />
          <StatCard
            icon="cash-clock"
            label="Outstanding"
            value={
              isLoading
                ? '...'
                : `${outstanding.toLocaleString()}`
            }
            color={colors.danger}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View
                  style={[
                    styles.actionIconBg,
                    { backgroundColor: action.color + '12' },
                  ]}
                >
                  <Icon name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overdue Charges */}
        <View style={styles.section}>
          <SectionHeader
            title="Overdue Charges"
            rightElement={
              overdueCharges.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {overdueCharges.length}
                  </Text>
                </View>
              ) : undefined
            }
          />
          {overdueQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : overdueCharges.length === 0 ? (
            <EmptyState
              icon="check-circle-outline"
              title="No overdue charges"
              subtitle="All residents are up to date"
            />
          ) : (
            overdueCharges.slice(0, 5).map((charge) => (
              <OverdueItem key={charge._id} charge={charge} />
            ))
          )}
        </View>

        {/* Month Summary */}
        {report && (
          <View style={styles.section}>
            <SectionHeader title={`${dayjs().format('MMMM')} Summary`} />
            <Card style={styles.summaryCard} variant="elevated">
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Total Expenses</Text>
                  <Text style={styles.summaryItemValue}>
                    {(report.expenses?.total || 0).toLocaleString()} TRY
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Collection Rate</Text>
                  <Text
                    style={[
                      styles.summaryItemValue,
                      {
                        color:
                          (report.collections?.collectionRate || 0) >= 80
                            ? colors.success
                            : (report.collections?.collectionRate || 0) >= 50
                            ? colors.warning
                            : colors.danger,
                      },
                    ]}
                  >
                    {(report.collections?.collectionRate || 0).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greetingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  greetingName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buildingIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  buildingAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.sm,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadow.sm,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.captionBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  countBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    ...typography.smallBold,
    color: colors.white,
  },
  overdueItem: {
    marginBottom: spacing.sm,
  },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  overdueInfo: {
    flex: 1,
  },
  overdueName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  overdueUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overdueRight: {
    alignItems: 'flex-end',
  },
  overdueAmount: {
    ...typography.bodyBold,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  summaryCard: {
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryItemValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
