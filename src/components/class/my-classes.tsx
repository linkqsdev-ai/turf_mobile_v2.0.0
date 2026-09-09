import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { RecordCard } from '@/components/record-card';
import { MotionView } from '@/components/motion';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';
import { useClassStore } from '@/store/app-store';
import { CoachBrowser } from '@/components/class/coach-browser';
import {
  classStatus,
  formatClassDateRange,
  daysUntilStart,
  ClassStatus,
  normaliseScheduleList,
  formatDaysShort,
  formatSessionsShort,
} from '@/utils/class-schedule';

/**
 * my-classes.tsx
 * The Player's "Class" tab: every coaching class they have booked.
 *
 * The bookings come from the same records the Turf Book → Coaching tab
 * creates. Booking there routes to /enroll, which writes a ClassEnrollment;
 * this screen reads those back and joins each one to its live class for the
 * schedule, venue and coach, falling back to the snapshot the enrolment keeps
 * so a class the coach later deletes still shows something readable.
 */

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const STATUS_TONE: Record<ClassStatus, 'info' | 'success' | 'neutral'> = {
  upcoming: 'info',
  ongoing: 'success',
  completed: 'neutral',
  unknown: 'neutral',
};

const STATUS_LABEL: Record<ClassStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  unknown: 'Scheduled',
};

/**
 * The Class tab hosts the whole coaching journey: find a coach, book, then see
 * what you booked. "Find a coach" is the landing segment when nothing has been
 * booked yet, since an empty bookings list is a dead end.
 */
export function MyClasses() {
  const theme = useTheme();
  const router = useRouter();
  const { classes, enrollments } = useClassStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [segment, setSegment] = useState<'browse' | 'bookings'>('browse');

  /**
   * Each booking, enriched from its class. Deduplicates multiple enrollments
   * for the same class by the same student, keeping the newest booking.
   */
  const bookings = useMemo(() => {
    const seen = new Set<string>();
    const uniqueEnrollments = (enrollments || []).filter((e: any) => {
      const key = `${e.classId || e.className}_${e.studentName || ''}`.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueEnrollments
      .map((e: any) => {
        const cls = (classes || []).find((c: any) => c.id === e.classId);
        const status = classStatus(cls?.startDate, cls?.endDate);
        return {
          enrollment: e,
          cls,
          status,
          countdown: daysUntilStart(cls?.startDate),
          dateRange: formatClassDateRange(cls?.startDate, cls?.endDate),
        };
      })
      // Newest booking first — the one just made should be at the top.
      .sort(
        (a, b) =>
          new Date(b.enrollment.createdAt).getTime() -
          new Date(a.enrollment.createdAt).getTime()
      );
  }, [enrollments, classes]);

  const visible = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter(b => b.status === filter)),
    [bookings, filter]
  );

  const totalPaid = useMemo(
    () => bookings.reduce((sum, b) => sum + (Number(b.enrollment.amountPaid) || 0), 0),
    [bookings]
  );
  const activeCount = useMemo(
    () => bookings.filter(b => b.status === 'ongoing' || b.status === 'upcoming').length,
    [bookings]
  );

  // Defaults to browsing (Find Near Coach) so users immediately discover newly created classes.
  const activeSegment = segment;

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <MotionView preset="fade-down">
          <ThemedText style={[styles.title, { color: theme.text }]}>Coaching</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {activeSegment === 'browse'
              ? 'Find near coach and book a class'
              : "Classes you've booked"}
          </ThemedText>
        </MotionView>

        <MotionView preset="fade-up" delay={0.03}>
          <View style={[styles.segmentWrap, { backgroundColor: theme.surfaceLow }]}>
            {(['browse', 'bookings'] as const).map(key => {
              const active = activeSegment === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSegment(key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.segment,
                    active && { backgroundColor: theme.surfaceLowest },
                  ]}
                >
                  <Ionicons
                    name={key === 'browse' ? 'search' : 'bookmark-outline'}
                    size={14}
                    color={active ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.segmentText,
                      { color: active ? theme.text : theme.textSecondary },
                    ]}
                  >
                    {key === 'browse' ? 'Find Near Coach' : `My bookings${bookings.length ? ` (${bookings.length})` : ''}`}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </MotionView>
      </View>

      {activeSegment === 'browse' && <CoachBrowser />}

      {activeSegment === 'bookings' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <MotionView preset="fade-up" delay={0.05}>
            <View style={styles.statRow}>
              <Stat label="Booked" value={String(bookings.length)} theme={theme} />
              <Stat label="Active" value={String(activeCount)} theme={theme} />
              <Stat label="Spent" value={`₹${totalPaid}`} theme={theme} />
            </View>
          </MotionView>

          {bookings.length > 0 && (
            <MotionView preset="fade-up" delay={0.1}>
              <View style={styles.filterRow}>
                {FILTERS.map(f => {
                  const active = filter === f.key;
                  const count =
                    f.key === 'all'
                      ? bookings.length
                      : bookings.filter(b => b.status === f.key).length;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? theme.primary : 'transparent',
                          borderColor: active ? theme.primary : theme.outlineVariant + '66',
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.filterText,
                          { color: active ? '#ffffff' : theme.textSecondary },
                        ]}
                      >
                        {f.label} {count > 0 ? `· ${count}` : ''}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </MotionView>
          )}

          {visible.length === 0 ? (
            <MotionView preset="fade-up" delay={0.15}>
              <View style={[styles.empty, { borderColor: theme.outlineVariant + '55' }]}>
                <Ionicons
                  name={bookings.length === 0 ? 'school-outline' : 'filter-outline'}
                  size={40}
                  color={theme.textSecondary}
                />
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  {bookings.length === 0 ? 'No classes booked yet' : `Nothing ${filter}`}
                </ThemedText>
                <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
                  {bookings.length === 0
                    ? 'Find a coach under Turf Book → Coaching and book a class to see it here.'
                    : 'Try a different filter to see your other bookings.'}
                </ThemedText>
                {bookings.length === 0 && (
                  <Pressable
                    onPress={() => setSegment('browse')}
                    accessibilityRole="button"
                    accessibilityLabel="Browse coaching classes"
                    style={({ pressed }) => [
                      styles.emptyCta,
                      { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Ionicons name="search" size={16} color="#ffffff" />
                    <ThemedText style={styles.emptyCtaText}>Browse coaching</ThemedText>
                  </Pressable>
                )}
              </View>
            </MotionView>
          ) : (
            visible.map((b, i) => {
              const { enrollment: e, cls, status, countdown, dateRange } = b;
              const sessions = formatSessionsShort(cls?.sessionTime);
              const days = formatDaysShort(cls?.selectedDays);
              const fee = e.amountPaid > 0 ? `₹${e.amountPaid}` : 'Free';

              return (
                <RecordCard
                  key={e.id || `booking-${i}`}
                  delay={0.05 * i}
                  dimmed={false}
                  title={e.className || cls?.className || 'Coaching class'}
                  chips={[
                    { label: STATUS_LABEL[status], tone: STATUS_TONE[status] },
                    ...(cls?.sportType ? [{ label: cls.sportType, tone: 'info' as const }] : []),
                    ...(cls?.classType ? [{ label: cls.classType, tone: 'warn' as const }] : []),
                    ...(countdown !== null && countdown <= 7
                      ? [
                        {
                          label: countdown === 1 ? 'Starts tomorrow' : `In ${countdown} days`,
                          tone: 'success' as const,
                        },
                      ]
                      : []),
                  ]}
                  details={[
                    { icon: 'calendar-outline', label: 'Runs', value: dateRange, full: true },
                    { icon: 'repeat-outline', label: 'Days', value: days },
                    { icon: 'time-outline', label: 'Sessions', value: sessions },
                    { icon: 'person-outline', label: 'Student', value: e.studentName },
                    {
                      icon: 'pricetag-outline',
                      label: e.appliedCode ? `Paid (${e.appliedCode})` : 'Paid',
                      value: fee,
                    },
                    {
                      icon: 'location-outline',
                      label: 'Venue',
                      value: cls?.venue,
                      full: true,
                      actionIcon: 'navigate-circle-outline',
                      onPress: cls?.venue
                        ? () => {
                          const query = encodeURIComponent(
                            [cls.className, cls.venue].filter(Boolean).join(', ')
                          );
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
                            Alert.alert('Maps Error', 'Could not open map direction.');
                          });
                        }
                        : undefined,
                    },
                  ]}
                  statLeft={`Booked ${new Date(e.createdAt).toLocaleDateString()}`}
                  statRight={e.contactNumber}
                />
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' },
      ]}
    >
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  headerArea: { width: '100%' },
  flex: { flex: 1 },
  body: { paddingTop: 6, paddingBottom: 100 },

  // Page-level heading
  title: { fontSize: 17, fontFamily: 'Sora_500Medium', letterSpacing: -0.3 },
  subtitle: { fontSize: 10.5, fontFamily: 'Sora_400Regular', marginTop: 2, marginBottom: 12 },

  segmentWrap: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 3,
    gap: 3,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  segmentText: { fontSize: 10.5, fontFamily: 'Sora_500Medium' },

  statRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  stat: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 13.5, fontFamily: 'Sora_500Medium' },
  statLabel: { fontSize: 9.5, fontFamily: 'Sora_400Regular', marginTop: 1 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  filterChip: {
    height: 25,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { fontSize: 9.5, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.2 },

  empty: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyTitle: { fontSize: 13.5, fontFamily: 'Sora_500Medium', marginTop: 10 },
  emptyBody: {
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  emptyCtaText: { color: '#ffffff', fontSize: 11.5, fontFamily: 'Sora_500Medium' },
});
