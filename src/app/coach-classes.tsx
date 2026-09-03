import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useClassStore } from '@/store/app-store';
import { useToast } from '@/context/ToastContext';

type Filter = 'active' | 'inactive' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'all', label: 'All' },
];

export default function CoachClassesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showInfo, showError } = useToast();
  const { classes, setClassActive, isClassActive, enrollmentCountForClass } = useClassStore();

  const [filter, setFilter] = useState<Filter>('active');

  const rows = useMemo(
    () =>
      classes.map((cls: any) => {
        const enrolled = enrollmentCountForClass(cls.id);
        const capacity = parseInt(String(cls.maxStudents || ''), 10);
        return {
          cls,
          enrolled,
          capacity: isNaN(capacity) ? null : capacity,
          locked: enrolled > 0,
          active: isClassActive(cls),
        };
      }),
    [classes, enrollmentCountForClass, isClassActive]
  );

  const visible = useMemo(() => {
    if (filter === 'active') return rows.filter(r => r.active);
    if (filter === 'inactive') return rows.filter(r => !r.active);
    return rows;
  }, [rows, filter]);

  const stats = useMemo(
    () => ({
      total: rows.filter(r => r.active).length,
      students: rows.reduce((sum, r) => sum + r.enrolled, 0),
      locked: rows.filter(r => !r.active).length,
    }),
    [rows]
  );

  const handleEdit = (row: (typeof rows)[number]) => {
    if (row.locked) {
      showInfo(
        'Class locked',
        `${row.enrolled} student${row.enrolled === 1 ? ' has' : 's have'} enrolled, so this class can no longer be changed.`
      );
      return;
    }
    router.push({ pathname: '/create-class', params: { editId: row.cls.id } });
  };

  /**
   * Deactivating is a soft delete: the class disappears for players but the
   * record and its enrolments survive, so a coach can restore it and nothing a
   * student paid for is ever destroyed.
   */
  const handleDeactivate = (row: (typeof rows)[number]) => {
    Alert.alert(
      'Move to inactive?',
      row.enrolled > 0
        ? `"${row.cls.className}" will stop appearing for players. Its ${row.enrolled} enrolled student${row.enrolled === 1 ? '' : 's'} are kept, and you can make it active again any time.`
        : `"${row.cls.className}" will stop appearing for players. You can make it active again any time.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to inactive',
          style: 'destructive',
          onPress: () => {
            setClassActive(row.cls.id, false);
            showInfo('Moved to inactive', `"${row.cls.className}" is hidden from players.`);
          },
        },
      ]
    );
  };

  const handleRestore = (row: (typeof rows)[number]) => {
    setClassActive(row.cls.id, true);
    showInfo('Class reactivated', `"${row.cls.className}" is visible to players again.`);
  };

  return (
    <GradientContainer screenName="create-class" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="headlineLg" style={{ color: theme.text }}>
              My Classes
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
              Edit or remove classes that have no students yet
            </ThemedText>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Summary */}
          <Reanimated.View
            entering={FadeInDown.duration(400)}
            style={[styles.summaryCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
          >
            <View style={styles.summaryCell}>
              <ThemedText style={styles.summaryValue}>{stats.total}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Active</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <ThemedText style={styles.summaryValue}>{stats.students}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Students</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <ThemedText style={styles.summaryValue}>{stats.locked}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Inactive</ThemedText>
            </View>
          </Reanimated.View>

          <Pressable
            onPress={() => router.push('/create-class')}
            accessibilityRole="button"
            accessibilityLabel="Create a new class"
            style={[styles.createBtn, { backgroundColor: theme.primary }, Shadows.primary]}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <ThemedText style={styles.createBtnText}>Create New Class</ThemedText>
          </Pressable>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceLowest,
                      borderColor: active ? theme.primary : theme.outlineVariant + '44',
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontFamily: active ? 'Sora_700Bold' : 'Sora_600SemiBold',
                      color: active ? '#ffffff' : theme.textSecondary,
                    }}
                  >
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* List */}
          {visible.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="school-outline" size={46} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                {classes.length === 0 ? 'No classes yet' : `No ${filter} classes`}
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
                {classes.length === 0
                  ? 'Publish a class and it appears for players straight away.'
                  : 'Try a different filter to see your other classes.'}
              </ThemedText>
            </View>
          ) : (
            visible.map((row, i) => {
              const { cls, enrolled, capacity, locked, active } = row;
              const seatsLeft = capacity === null ? null : Math.max(0, capacity - enrolled);

              return (
                <Reanimated.View
                  key={cls.id}
                  entering={FadeInDown.delay(i * 60).duration(380)}
                  style={[
                    styles.classCard,
                    { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', opacity: active ? 1 : 0.65 },
                    Shadows.level2,
                  ]}
                >
                  <View style={styles.classTopRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.className, { color: theme.text }]} numberOfLines={2}>
                        {cls.className}
                      </ThemedText>
                      <ThemedText style={[styles.classMeta, { color: theme.textSecondary }]} numberOfLines={2}>
                        {[cls.sportType, cls.classType, cls.venue].filter(Boolean).join(' • ')}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.classFee, { color: theme.primary }]}>
                      {cls.feeAmount ? `₹${cls.feeAmount}` : 'Free'}
                    </ThemedText>
                  </View>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: locked ? '#fef3c7' : '#dcfce7',
                        },
                      ]}
                    >
                      <Ionicons
                        name={locked ? 'lock-closed' : 'create-outline'}
                        size={11}
                        color={locked ? '#b45309' : '#15803d'}
                      />
                      <ThemedText
                        style={[styles.statusText, { color: locked ? '#b45309' : '#15803d' }]}
                      >
                        {locked ? `${enrolled} enrolled — locked` : 'No students yet — editable'}
                      </ThemedText>
                    </View>

                    {seatsLeft !== null && (
                      <ThemedText style={[styles.seatsText, { color: theme.textSecondary }]}>
                        {seatsLeft} / {capacity} seats left
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.actionRow}>
                    {active ? (
                      <>
                        <Pressable
                          onPress={() => handleEdit(row)}
                          accessibilityRole="button"
                          accessibilityLabel={locked ? `${cls.className} is locked and cannot be edited` : `Edit ${cls.className}`}
                          accessibilityState={{ disabled: locked }}
                          style={[
                            styles.actionBtn,
                            {
                              backgroundColor: locked ? theme.surfaceLow : theme.primary,
                              borderColor: locked ? theme.outlineVariant + '44' : theme.primary,
                            },
                          ]}
                        >
                          <Ionicons name="create-outline" size={14} color={locked ? theme.textSecondary : '#ffffff'} />
                          <ThemedText style={[styles.actionText, { color: locked ? theme.textSecondary : '#ffffff' }]}>
                            Edit
                          </ThemedText>
                        </Pressable>

                        {/* Booked students for this class */}
                        <Pressable
                          onPress={() => router.push('/coach-students')}
                          accessibilityRole="button"
                          accessibilityLabel={
                            enrolled > 0
                              ? `View ${enrolled} booked student${enrolled === 1 ? '' : 's'} for ${cls.className}`
                              : `No students booked for ${cls.className} yet`
                          }
                          style={[
                            styles.iconBtn,
                            { borderColor: theme.primary + '55', backgroundColor: theme.primary + '12' },
                          ]}
                        >
                          <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                          {enrolled > 0 && (
                            <View style={[styles.iconBtnBadge, { backgroundColor: theme.primary, borderColor: theme.surfaceLowest }]}>
                              <ThemedText style={styles.iconBtnBadgeText}>
                                {enrolled > 9 ? '9+' : enrolled}
                              </ThemedText>
                            </View>
                          )}
                        </Pressable>

                        {/* Soft delete — the class survives, players stop seeing it */}
                        <Pressable
                          onPress={() => handleDeactivate(row)}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${cls.className} to inactive`}
                          style={[styles.iconBtn, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}
                        >
                          <Ionicons name="trash-outline" size={15} color="#b91c1c" />
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        onPress={() => handleRestore(row)}
                        accessibilityRole="button"
                        accessibilityLabel={`Make ${cls.className} active again`}
                        style={[styles.actionBtn, { backgroundColor: '#15803D', borderColor: '#15803D', flex: 1 }]}
                      >
                        <Ionicons name="refresh-outline" size={14} color="#ffffff" />
                        <ThemedText style={[styles.actionText, { color: '#ffffff' }]}>
                          Make active again
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                </Reanimated.View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 4 },
  scrollContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: 60,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: Spacing.xs,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#ffffff', fontSize: 20, fontFamily: 'Sora_800ExtraBold' },
  summaryLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
    marginTop: 4,
  },
  summaryDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.22)' },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  createBtnText: { color: '#ffffff', fontSize: 13.5, fontFamily: 'Sora_700Bold' },

  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: Spacing.md },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },

  classCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  classTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  className: { fontSize: 14, lineHeight: 19, fontFamily: 'Sora_700Bold' },
  classMeta: { fontSize: 11.5, lineHeight: 16, fontFamily: 'Sora_400Regular', marginTop: 4 },
  classFee: { fontSize: 13, fontFamily: 'Sora_700Bold' },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    flexShrink: 1,
  },
  statusText: { fontSize: 10.5, fontFamily: 'Sora_600SemiBold' },
  seatsText: { fontSize: 10.5, fontFamily: 'Sora_500Medium' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionText: { fontSize: 12, fontFamily: 'Sora_700Bold' },
  viewBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconBtn: {
    width: 40,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconBtnBadgeText: { color: '#ffffff', fontSize: 9, fontFamily: 'Sora_700Bold' },
  emptyState: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: Spacing.lg },
  emptyTitle: { fontSize: 15, fontFamily: 'Sora_700Bold', marginTop: 14 },
  emptyBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginTop: 6,
  },
});
