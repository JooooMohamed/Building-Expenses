import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getResidents, getUnits } from '../../api/admin';
import {
  Card,
  StatusBadge,
  ScreenHeader,
  EmptyState,
} from '../../components/ui';
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from '../../theme';
import type { User, Unit } from '../../types';

function getInitials(firstName: string, lastName: string): string {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

function ResidentCard({
  resident,
  unit,
  onPress,
}: {
  resident: User;
  unit: Unit | undefined;
  onPress: () => void;
}) {
  const initials = getInitials(resident.firstName, resident.lastName);
  const isOccupied = unit?.isOccupied ?? false;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.residentCard}>
        <View style={styles.residentRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.residentInfo}>
            <Text style={styles.residentName}>
              {resident.firstName} {resident.lastName}
            </Text>
            <Text style={styles.residentEmail}>{resident.email}</Text>
            {unit && (
              <View style={styles.unitRow}>
                <Icon
                  name="door"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text style={styles.unitText}>
                  Unit {unit.unitNumber} - Floor {unit.floor}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.residentRight}>
            {unit ? (
              <StatusBadge
                status={isOccupied ? 'paid' : 'unpaid'}
                config={{
                  paid: {
                    color: colors.success,
                    bg: colors.successLight,
                    label: 'Active',
                  },
                  unpaid: {
                    color: colors.textSecondary,
                    bg: colors.surfaceSecondary,
                    label: 'Inactive',
                  },
                }}
              />
            ) : (
              <StatusBadge
                status="unassigned"
                config={{
                  unassigned: {
                    color: colors.warning,
                    bg: colors.warningLight,
                    label: 'No Unit',
                  },
                }}
              />
            )}
            <Icon
              name="chevron-right"
              size={20}
              color={colors.textTertiary}
              style={styles.chevron}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ResidentsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const residentsQuery = useQuery({
    queryKey: ['admin-residents'],
    queryFn: getResidents,
  });

  const unitsQuery = useQuery({
    queryKey: ['admin-units'],
    queryFn: getUnits,
  });

  const residents = residentsQuery.data || [];
  const units = unitsQuery.data || [];

  // Build a map of residentId -> unit for quick lookup
  const unitByResidentId = useMemo(() => {
    const map: Record<string, Unit> = {};
    for (const unit of units) {
      if (unit.residentId) {
        map[unit.residentId._id] = unit;
      }
    }
    return map;
  }, [units]);

  // Filter residents by search term
  const filteredResidents = useMemo(() => {
    if (!search.trim()) return residents;
    const term = search.toLowerCase().trim();
    return residents.filter((r) => {
      const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    });
  }, [residents, search]);

  const isRefetching = residentsQuery.isRefetching || unitsQuery.isRefetching;

  const handleRefresh = () => {
    residentsQuery.refetch();
    unitsQuery.refetch();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <ScreenHeader
          title="Residents"
          subtitle={`${residents.length} total residents`}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddResident')}
        >
          <Icon name="account-plus-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon
            name="magnify"
            size={20}
            color={colors.textTertiary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search residents..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon
                name="close-circle"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredResidents.length === 0 ? (
          <EmptyState
            icon="account-search-outline"
            title={search ? 'No results' : 'No residents yet'}
            subtitle={
              search
                ? `No residents matching "${search}"`
                : 'Add your first resident to get started'
            }
          />
        ) : (
          filteredResidents.map((resident) => (
            <ResidentCard
              key={resident.id}
              resident={resident}
              unit={unitByResidentId[resident.id]}
              onPress={() =>
                navigation.navigate('ResidentDetail', { residentId: resident.id })
              }
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddResident')}
      >
        <Icon name="plus" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: spacing.xl,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    ...shadow.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl * 2,
  },
  residentCard: {
    marginBottom: spacing.sm,
  },
  residentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  residentInfo: {
    flex: 1,
  },
  residentName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  residentEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  unitText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  residentRight: {
    alignItems: 'flex-end',
  },
  chevron: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
