import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { useClassStore, useTurfStore, useBookings } from '@/store/app-store';
import { turfApi } from '@/services/turf-api';
import { cleanLocation } from '@/utils/location';
import { computeTurfSlotMetrics } from '@/utils/turf-slot-sync';

// Mock Players Data
const PLAYERS = [
  { id: '1', name: 'Marcus J.', role: 'Midfielder • Lv. 10', image: require('@/assets/images/illustrations/athletes.png') },
  { id: '2', name: 'Elena S.', role: 'Forward • Lv. 14', image: require('@/assets/images/illustrations/tennis_player.png') },
  { id: '3', name: 'David W.', role: 'GK • Lv. 11', image: require('@/assets/images/illustrations/basketball_player.png') },
  { id: '4', name: 'Sarah K.', role: 'Defense • Lv. 12', image: require('@/assets/images/illustrations/athletes.png') },
];

// Coach data with rich details
const COACHES = [
  {
    id: 'apex',
    name: 'Coach Apex',
    specialty: 'Football Conditioning',
    experience: '10 yrs experience',
    trainees: 18,
    rating: 4.9,
    reviews: 124,
    rate: '₹800/hr',
    location: 'Bangalore, India',
    match: '98% Match',
    matchStyle: 'primary',
    sports: ['football', 'fitness'],
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    badge: null,
    defaultAction: 'Book Coach',
  },
  {
    id: 'vanguard',
    name: 'Coach Vanguard',
    specialty: 'Cricket & Batting',
    experience: '8 yrs experience',
    trainees: 12,
    rating: 4.7,
    reviews: 89,
    rate: '₹1200/hr',
    location: 'Chennai, India',
    match: '92% Match',
    matchStyle: 'accent',
    sports: ['cricket'],
    avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
    badge: 'TOP RATED',
    defaultAction: 'Book Coach',
  },
  {
    id: 'velocity',
    name: 'Coach Velocity',
    specialty: 'Badminton & Agility',
    experience: '5 yrs experience',
    trainees: 24,
    rating: 4.8,
    reviews: 67,
    rate: '₹600/hr',
    location: 'Mumbai, India',
    match: '85% Match',
    matchStyle: 'accent',
    sports: ['badminton', 'fitness'],
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    badge: null,
    defaultAction: 'Book Coach',
  },
  {
    id: 'solaris',
    name: 'Coach Solaris',
    specialty: 'Athletics & Swimming',
    experience: '7 yrs experience',
    trainees: 30,
    rating: 4.6,
    reviews: 45,
    rate: '₹950/hr',
    location: 'Pune, India',
    match: '80% Match',
    matchStyle: 'primary',
    sports: ['fitness', 'swimming'],
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    badge: 'NEW',
    defaultAction: 'Book Coach',
  },
  {
    id: 'titan',
    name: 'Coach Titan',
    specialty: 'Basketball & Defense',
    experience: '12 yrs experience',
    trainees: 22,
    rating: 4.8,
    reviews: 198,
    rate: '₹950/hr',
    location: 'Delhi, India',
    match: '84% Match',
    matchStyle: 'primary',
    sports: ['basketball', 'football'],
    avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
    badge: null,
    defaultAction: 'Book Coach',
  },
  {
    id: 'zen',
    name: 'Coach Zen',
    specialty: 'Yoga & Recovery',
    experience: '9 yrs experience',
    trainees: 30,
    rating: 4.9,
    reviews: 142,
    rate: '₹700/hr',
    location: 'Pune, India',
    match: '80% Match',
    matchStyle: 'primary',
    sports: ['fitness', 'swimming'],
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    badge: 'NEW',
    defaultAction: 'Book Coach',
  },
];

export default function CoachTab() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { classes, deleteClass, enrollmentCountForClass } = useClassStore();

  // Deleting is destructive and irreversible, so it always confirms. The store
  // re-checks enrolments itself, which is what actually guarantees a class with
  // students can't be removed even if this screen's state were stale.
  const handleDeleteClass = React.useCallback((cls: any) => {
    Alert.alert(
      'Delete this class?',
      `"${cls.className}" will be removed and will stop appearing for players.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const removed = deleteClass(cls.id);
            if (!removed) {
              Alert.alert(
                'Cannot delete',
                'A student has enrolled in this class since it loaded, so it can no longer be deleted.'
              );
            }
          },
        },
      ]
    );
  }, [deleteClass]);
  const { ownedTurfs } = useTurfStore();
  const { bookings } = useBookings();
  const [backendTurfs, setBackendTurfs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [coachFilter, setCoachFilter] = useState<'Me' | 'All' | 'Others'>('Me');

  const fetchTurfs = React.useCallback(async () => {
    try {
      const data = await turfApi.listTurfs();
      if (Array.isArray(data)) {
        setBackendTurfs(data);
      }
    } catch (err) {
      console.log('Failed to fetch backend turfs in coach:', err);
    }
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTurfs();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchTurfs]);

  useFocusEffect(
    React.useCallback(() => {
      fetchTurfs();
    }, [fetchTurfs])
  );

  // Map our self-created classes to coach cards layout
  const myCreatedCoaches = useMemo(() => {
    return classes.map((cls: any, idx: number) => ({
      id: cls.id || `created-${idx}`,
      name: profile.name || 'My Coaching',
      specialty: cls.className,
      experience: `${cls.classType} • ${cls.ageGroup || 'All Ages'}`,
      trainees: 0,
      rating: 5.0,
      reviews: 0,
      rate: cls.feeAmount ? `₹${cls.feeAmount}/${cls.feeType === 'Per Session' ? 'sess' : 'mo'}` : 'Free',
      location: cls.venue,
      match: 'Your Class',
      matchStyle: 'featured',
      sports: [cls.sportType.toLowerCase()],
      avatar: profile.avatarUrl || 'avatar_12',
      badge: 'OWNER',
      defaultAction: 'Active Class',
    }));
  }, [classes, profile.name, profile.avatarUrl]);

  // Filter items based on coachFilter selection
  const visibleCoaches = useMemo(() => {
    if (coachFilter === 'Me') {
      return myCreatedCoaches;
    } else if (coachFilter === 'Others') {
      return COACHES;
    } else {
      return [...myCreatedCoaches, ...COACHES];
    }
  }, [coachFilter, myCreatedCoaches]);

  const [coachActionStates, setCoachActionStates] = useState<Record<string, string>>(
    Object.fromEntries(COACHES.map(c => [c.id, c.defaultAction]))
  );

  const [inviteStates, setInviteStates] = useState<Record<string, boolean>>({});

  const handleCoachActionClick = (id: string, originalText: string) => {
    setCoachActionStates(prev => ({ ...prev, [id]: 'Request Sent ✓' }));
    setTimeout(() => {
      setCoachActionStates(prev => ({ ...prev, [id]: originalText }));
    }, 2000);
  };

  const handleInviteClick = (id: string) => {
    setInviteStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setInviteStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const avatarSource = useMemo(() => getAvatarSource(profile.avatarUrl), [profile.avatarUrl]);

  if (profile.role === 'Owner' || profile.role === 'Super Admin') {
    return (
      <GradientContainer screenName="coach-owner" style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Top App Bar */}
          <View style={[styles.header, { backgroundColor: 'transparent' }]}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
                <Image
                  source={avatarSource}
                  style={styles.headerAvatar}
                />
              </Pressable>
              <View style={styles.headerTextGroup}>
                <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_500Medium', lineHeight: 18 }}>
                  {profile.name}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                    {getShortLocation(profile.location)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              {/* Temporarily Hidden Network Activity Icon */}
              {/* <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
                <Ionicons name="pulse" size={20} color={theme.secondary} />
              </Pressable> */}
              <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
                <Image
                  source={require('@/assets/images/coin_toss_icon.png')}
                  style={{ width: 26, height: 26 }}
                  contentFit="contain"
                />
              </Pressable>
            </View>
          </View>

          <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
              }
            >

              {/* Bento Stats Row */}
              <View style={styles.section}>
                <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                  My Arena Overview
                </ThemedText>
                <View style={{ gap: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <View style={[styles.rankingCard, { flex: 1, padding: Spacing.md, backgroundColor: theme.primaryContainer }]}>
                      <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, fontSize: 9 }}>TOTAL TURFS</ThemedText>
                      <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.xs }}>{2 + (ownedTurfs?.length || 0)} Managed</ThemedText>
                    </View>
                    <View style={[styles.rankingCard, { flex: 1, padding: Spacing.md, backgroundColor: theme.secondaryContainer }]}>
                      <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontSize: 9 }}>PEAK OCCUPANCY</ThemedText>
                      <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.xs }}>82% Booked</ThemedText>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <View style={[styles.rankingCard, { flex: 1, padding: Spacing.md, backgroundColor: '#10b981' }]}>
                      <ThemedText type="labelSm" style={{ color: '#d1fae5', fontSize: 9 }}>TODAY'S REVENUE</ThemedText>
                      <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.xs }}>₹18,500</ThemedText>
                    </View>
                    <View style={[styles.rankingCard, { flex: 1, padding: Spacing.md, backgroundColor: '#8b5cf6' }]}>
                      <ThemedText type="labelSm" style={{ color: '#ede9fe', fontSize: 9 }}>ACTIVE BOOKINGS</ThemedText>
                      <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.xs }}>34 Slots</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* My Active Published Coaching Batches */}
              {classes && classes.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <ThemedText type="headlineSm">My Published Coaching Batches ({classes.length})</ThemedText>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                        Active classes live on the platform
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Pressable
                        onPress={() => router.push('/coach-classes')}
                        accessibilityRole="button"
                        accessibilityLabel="Manage all classes"
                      >
                        <ThemedText type="labelMd" style={{ color: theme.primary }}>
                          MANAGE CLASSES →
                        </ThemedText>
                      </Pressable>
                      <Pressable onPress={() => router.push('/coach-students')}>
                        <ThemedText type="labelMd" style={{ color: theme.secondary }}>
                          STUDENTS DIRECTORY →
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 8 }}>
                    {classes.map((cls: any, i: number) => {
                      // A class with even one enrolment is frozen: someone has
                      // paid to attend, so its details and existence are no
                      // longer the coach's alone to change.
                      const enrolled = enrollmentCountForClass(cls.id);
                      const locked = enrolled > 0;

                      return (
                        <Pressable
                          key={cls.id || i}
                          onPress={() =>
                            locked
                              ? router.push('/coach-students')
                              : router.push({ pathname: '/create-class', params: { editId: cls.id } })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={
                            locked
                              ? `${cls.className}, ${enrolled} enrolled, locked for editing. Opens students directory.`
                              : `Edit ${cls.className}`
                          }
                          style={({ pressed }) => [
                            styles.teamCard,
                            {
                              width: 240,
                              backgroundColor: theme.surfaceLowest,
                              borderColor: locked ? theme.outlineVariant + '55' : theme.primary + '30',
                              borderWidth: 1,
                              padding: 12,
                              borderRadius: BorderRadius.lg,
                              opacity: pressed ? 0.9 : 1,
                              transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                            Shadows.level2
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <View style={{ backgroundColor: locked ? theme.outlineVariant + '25' : theme.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <ThemedText style={{ color: locked ? theme.textSecondary : theme.primary, fontSize: 9.5, fontFamily: 'Sora_500Medium' }}>
                                {locked ? `🔒 ${enrolled} enrolled` : '✏️ Tap to Edit'}
                              </ThemedText>
                            </View>
                            <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                              {cls.feeAmount ? `₹${cls.feeAmount}` : 'Free'}
                            </ThemedText>
                          </View>
                          <ThemedText type="headlineSm" style={{ fontSize: 14, color: theme.text }} numberOfLines={1}>
                            {cls.className}
                          </ThemedText>
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                            {cls.sportType} • {cls.classType}
                          </ThemedText>
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }} numberOfLines={1}>
                            📍 {cls.venue || 'Main Pitch'}
                          </ThemedText>

                          {locked ? (
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, marginTop: 8, lineHeight: 13 }}>
                              Locked — students have already booked. Tap to view them.
                            </ThemedText>
                          ) : (
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteClass(cls);
                              }}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${cls.className}`}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' }}
                            >
                              <Ionicons name="trash-outline" size={12} color="#b91c1c" />
                              <ThemedText style={{ color: '#b91c1c', fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                                Delete class
                              </ThemedText>
                            </Pressable>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* My Managed Turfs */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View>
                    <ThemedText type="headlineSm">My Pitches & Courts</ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                      Manage pricing, slots, and availability
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.teamGrid, { marginTop: Spacing.sm }]}>
                  {(() => {
                    const now = new Date();

                    const computeOccupancy = (turf: any) => {
                      const metrics = computeTurfSlotMetrics(turf, now, bookings || []);
                      return {
                        todayBooked: metrics.totalBooked,
                        todayTotal: metrics.totalConfigured,
                        todayAvailable: metrics.totalAvailable,
                        occupancyPct: metrics.occupancyPct,
                        slotsText: metrics.slotsText,
                      };
                    };

                    const backendTurfsFormatted = (backendTurfs || []).map((t: any) => {
                      const occ = computeOccupancy(t);
                      return {
                        id: t.id,
                        name: t.name,
                        location: cleanLocation(t.address || 'Local Arena'),
                        sport: t.sportType || 'Football',
                        pitch: t.surfaceType || 'Artificial Turf',
                        slotsText: occ.slotsText,
                        todayBooked: occ.todayBooked,
                        todayTotal: occ.todayTotal,
                        todayAvailable: occ.todayAvailable,
                        occupancyPct: occ.occupancyPct,
                        rate: `₹${t.pricePerSlot || 1000}/hr`,
                        image: t.thumbnailImage || t.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
                        createdAt: t.createdAt || new Date().toISOString(),
                        rawTurf: t,
                      };
                    });

                    const userTurfsFormatted = (ownedTurfs || []).map(t => {
                      const occ = computeOccupancy(t);
                      return {
                        id: t.id,
                        name: t.name,
                        location: cleanLocation(t.address || 'Local Arena'),
                        sport: t.sportType || 'Football',
                        pitch: t.surfaceType || 'Artificial Turf',
                        slotsText: occ.slotsText,
                        todayBooked: occ.todayBooked,
                        todayTotal: occ.todayTotal,
                        todayAvailable: occ.todayAvailable,
                        occupancyPct: occ.occupancyPct,
                        rate: `₹${t.pricePerSlot || 1000}/hr`,
                        image: t.thumbnailImage || t.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
                        createdAt: (t as any).createdAt || new Date().toISOString(),
                        rawTurf: t,
                      };
                    });

                    const STATIC_MANAGED_TURFS = [
                      {
                        id: 'skyline',
                        name: 'Skyline Arena Elite',
                        location: 'Canary Wharf, East London',
                        sport: 'Football',
                        pitch: '5G Rubber Infill Turf',
                        ...computeOccupancy({ id: 'skyline', name: 'Skyline Arena Elite' }),
                        rate: '₹25/hr',
                        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
                        createdAt: '2025-01-01T00:00:00.000Z',
                        rawTurf: { id: 'skyline', name: 'Skyline Arena Elite' },
                      },
                      {
                        id: 'the-grid',
                        name: 'The Grid Multisport',
                        location: 'Stratford Central, London',
                        sport: 'Multi-Sport',
                        pitch: 'Indoor Woodcourt',
                        ...computeOccupancy({ id: 'the-grid', name: 'The Grid Multisport' }),
                        rate: '₹18/hr',
                        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
                        createdAt: '2025-01-02T00:00:00.000Z',
                        rawTurf: { id: 'the-grid', name: 'The Grid Multisport' },
                      }
                    ];

                    const seenManagedIds = new Set<string>();
                    const ALL_MANAGED: any[] = [];
                    // Place newly added user & backend turfs first, followed by static
                    [...backendTurfsFormatted, ...userTurfsFormatted, ...STATIC_MANAGED_TURFS].forEach(t => {
                      if (t && t.id && !seenManagedIds.has(t.id)) {
                        seenManagedIds.add(t.id);
                        ALL_MANAGED.push(t);
                      }
                    });

                    // Sort newest turfs to the very top
                    ALL_MANAGED.sort((a, b) => {
                      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.id?.startsWith('turf-') ? parseInt(a.id.replace('turf-', '')) || 0 : 0);
                      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.id?.startsWith('turf-') ? parseInt(b.id.replace('turf-', '')) || 0 : 0);
                      return bTime - aTime;
                    });

                    return ALL_MANAGED.map((turf) => (
                      <View
                        key={turf.id}
                        style={[
                          styles.teamCard,
                          {
                            backgroundColor: theme.surfaceLowest,
                            borderColor: theme.outlineVariant + '35',
                            borderWidth: 1,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.xl,
                            gap: Spacing.xs
                          },
                          Shadows.level2
                        ]}
                      >
                        {/* Top Main Row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {/* Turf Thumbnail */}
                          <Image
                            source={typeof turf.image === 'string' ? { uri: turf.image } : turf.image}
                            style={{ width: 78, height: 78, borderRadius: 10 }}
                            contentFit="cover"
                          />

                          {/* Info Block */}
                          <View style={{ flex: 1, justifyContent: 'space-between' }}>
                            <View>
                              <ThemedText type="headlineSm" style={{ fontSize: 13.5, fontFamily: 'Sora_500Medium' }} numberOfLines={1}>
                                {turf.name}
                              </ThemedText>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                <Ionicons name="location-outline" size={10.5} color={theme.textSecondary} />
                                <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_400Regular' }} numberOfLines={1}>
                                  {turf.location}
                                </ThemedText>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, fontFamily: 'Sora_400Regular' }}>
                                  {turf.pitch}
                                </ThemedText>
                              </View>
                            </View>

                            {/* Rate */}
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                              <ThemedText style={{ fontSize: 13.5, color: theme.primary, fontFamily: 'Sora_500Medium' }}>
                                {turf.rate}
                              </ThemedText>
                              <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginLeft: 2, fontFamily: 'Sora_400Regular' }}>
                                (Standard Rate)
                              </ThemedText>
                            </View>
                          </View>
                        </View>

                        {/* Upcoming 7 Days Slots & Availability Strip */}
                        <View style={{ backgroundColor: theme.surfaceLow, borderRadius: 10, padding: 7, marginTop: 4, gap: 5 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="calendar-outline" size={11.5} color={theme.primary} />
                              <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                                Upcoming 7 Days Slots
                              </ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <View style={{ width: 5.5, height: 5.5, borderRadius: 3, backgroundColor: '#10b981' }} />
                                <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_400Regular', color: theme.textSecondary }}>
                                  Available
                                </ThemedText>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <View style={{ width: 5.5, height: 5.5, borderRadius: 3, backgroundColor: '#8b5cf6' }} />
                                <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_400Regular', color: theme.textSecondary }}>
                                  Booked
                                </ThemedText>
                              </View>
                            </View>
                          </View>

                          {/* 7 Day Non-Scrolling Fixed Grid */}
                          <View style={{ flexDirection: 'row', gap: 4, marginTop: 1 }}>
                            {Array.from({ length: 7 }, (_, i) => {
                              const d = new Date();
                              d.setDate(d.getDate() + i);
                              const metrics = computeTurfSlotMetrics((turf as any).rawTurf || turf, d, bookings || []);
                              const isToday = i === 0;
                              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                              const dateNum = d.getDate();

                              return (
                                <View
                                  key={i}
                                  style={{
                                    flex: 1,
                                    backgroundColor: isToday ? theme.primary + '0c' : theme.surfaceLowest,
                                    borderRadius: 6,
                                    paddingVertical: 5,
                                    paddingHorizontal: 1,
                                    borderWidth: 1,
                                    borderColor: isToday ? theme.primary + '60' : theme.outlineVariant + '22',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  {/* Day & Date Header */}
                                  <View style={{ alignItems: 'center' }}>
                                    <ThemedText style={{ fontSize: 7.5, fontFamily: isToday ? 'Sora_600SemiBold' : 'Sora_500Medium', color: isToday ? theme.primary : theme.textSecondary }}>
                                      {isToday ? 'TODAY' : dayName.toUpperCase()}
                                    </ThemedText>
                                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_600SemiBold', color: theme.text, marginTop: 0.5 }}>
                                      {dateNum}
                                    </ThemedText>
                                  </View>

                                  {/* Mini 2-part colored progress bar */}
                                  <View style={{ width: '84%', height: 2.5, borderRadius: 1.5, backgroundColor: theme.outlineVariant + '28', overflow: 'hidden', flexDirection: 'row', marginVertical: 3 }}>
                                    {metrics.totalBooked > 0 && (
                                      <View
                                        style={{
                                          height: '100%',
                                          width: `${Math.min(100, Math.round((metrics.totalBooked / metrics.totalConfigured) * 100))}%`,
                                          backgroundColor: '#8b5cf6',
                                        }}
                                      />
                                    )}
                                    {metrics.totalAvailable > 0 && (
                                      <View
                                        style={{
                                          height: '100%',
                                          flex: 1,
                                          backgroundColor: '#10b981',
                                        }}
                                      />
                                    )}
                                  </View>

                                  {/* Available & Booked slot counts */}
                                  <View style={{ alignItems: 'center', gap: 0.5 }}>
                                    <ThemedText style={{ fontSize: 8, color: '#059669', fontFamily: 'Sora_600SemiBold' }}>
                                      {metrics.totalAvailable} <ThemedText style={{ fontSize: 6.5, color: '#059669', fontFamily: 'Sora_400Regular' }}>avail</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={{ fontSize: 7.5, color: metrics.totalBooked > 0 ? '#7c3aed' : theme.textSecondary + '77', fontFamily: 'Sora_500Medium' }}>
                                      {metrics.totalBooked} <ThemedText style={{ fontSize: 6.5, color: theme.textSecondary + '77', fontFamily: 'Sora_400Regular' }}>bkd</ThemedText>
                                    </ThemedText>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>

                        {/* Action Buttons Row */}
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <Pressable
                            style={[{ flex: 1, backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40', borderWidth: 1, paddingVertical: 6, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }]}
                            onPress={() => router.push({ pathname: '/details', params: { id: turf.id, name: turf.name } })}
                          >
                            <Ionicons name="eye-outline" size={12} color={theme.text} />
                            <ThemedText type="labelSm" style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 10.5 }}>View Arena</ThemedText>
                          </Pressable>

                          <Pressable
                            style={[{ flex: 1, backgroundColor: theme.primary, paddingVertical: 6, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }, Shadows.level1]}
                            onPress={() => router.push({ pathname: '/create-turf', params: { editId: turf.id } })}
                          >
                            <Ionicons name="settings-outline" size={12} color="#ffffff" />
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 10.5 }}>Manage Pitch</ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    ));
                  })()}
                </View>
              </View>

            </ScrollView>
          </Reanimated.View>

          {/* FAB for New Slot */}
          <Pressable
            style={({ pressed }) => [
              styles.fabTop,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => router.push('/create-turf')}
          >
            <LinearGradient
              colors={['#10b981', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <MaterialCommunityIcons name="stadium-outline" size={24} color="#fff" />
            </LinearGradient>
          </Pressable>

          <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
        </SafeAreaView>
      </GradientContainer>
    );
  }

  return (
    <GradientContainer screenName="coach" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={avatarSource}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_500Medium', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {getShortLocation(profile.location)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push({ pathname: '/create-class', params: { showDrafts: 'true' } })}
              hitSlop={8}
            >
              <Ionicons name="document-text-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <Image
                source={require('@/assets/images/coin_toss_icon.png')}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* User Analytics / Personal Ranking Bento Grid */}
            <View style={styles.section}>
              <View style={styles.rankingGrid}>

                {/* Global Ranking Card */}
                <View style={[styles.rankingCard, { backgroundColor: theme.primaryContainer }]}>
                  <View style={styles.rankingCardDecor} />
                  <View style={{ zIndex: 2 }}>
                    <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Global Ranking
                    </ThemedText>
                    <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.half }}>
                      Elite Division • #428
                    </ThemedText>

                    <View style={styles.statsRow}>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Win Rate</ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium' }}>78.4%</ThemedText>
                      </View>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Avg Score</ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium' }}>24.5</ThemedText>
                      </View>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Matches</ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium' }}>112</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Coach Matcher Info Card */}
                <View style={[styles.matcherCard, { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.matcherAvatarContainer}>
                    <View style={[styles.matcherAvatarRing, { borderColor: theme.secondaryContainer }]}>
                      <Ionicons name="star" size={24} color={theme.primary} />
                    </View>
                  </View>
                  <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: Spacing.sm }}>
                    Coach Matcher Active
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.half }}>
                    Analyzing 48 coaches in your local metro area.
                  </ThemedText>
                </View>

              </View>
            </View>

            {/* Registered Students Directory Banner / Navigation Link */}
            <View style={[styles.section, { marginBottom: Spacing.sm }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.studentDirectoryCard,
                  {
                    backgroundColor: theme.surfaceLowest,
                    borderColor: theme.primary + '30',
                  },
                  Shadows.level2,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
                ]}
                onPress={() => router.push('/coach-students')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    <View style={[styles.studentCardIconWrap, { backgroundColor: theme.primaryContainer + '20' }]}>
                      <Ionicons name="people" size={20} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                          Registered Students List
                        </ThemedText>
                      </View>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 10, lineHeight: 14, marginTop: 2 }} numberOfLines={1}>
                        View enrolled students, attendance %, dues & batch details
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.studentCardBtn, { backgroundColor: theme.primary }]}>
                    <ThemedText style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Sora_500Medium' }}>
                      View Students →
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Top Coaches for You */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <ThemedText type="headlineSm">Top Coaches for You</ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                    Recommended based on your Elite ranking
                  </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Pressable onPress={() => router.push('/coach-students')}>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, letterSpacing: 0.5 }}>
                      STUDENTS LIST
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Segmented Filter Bar */}
              <View style={styles.filterTabsRow}>
                {['Me', 'All', 'Others'].map((tab) => {
                  const isActive = coachFilter === tab;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setCoachFilter(tab as any)}
                      style={[
                        styles.filterTabChip,
                        { backgroundColor: isActive ? theme.primary : theme.surfaceLow },
                        isActive && { borderColor: theme.primary }
                      ]}
                    >
                      <ThemedText style={[styles.filterTabText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                        {tab === 'Me' ? 'Me (Created)' : tab === 'All' ? 'All Coaches' : 'Others'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Coach Cards */}
              <View style={styles.teamGrid}>
                {visibleCoaches.length === 0 ? (
                  <View style={{ paddingVertical: 30, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Ionicons name="school-outline" size={44} color={theme.textSecondary + '77'} style={{ marginBottom: 10 }} />
                    <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', textAlign: 'center', fontSize: 13, lineHeight: 18 }}>
                      {"No self-created classes yet.\nTap the school icon button at the top right to create one!"}
                    </ThemedText>
                    <Pressable
                      style={{ marginTop: 14, backgroundColor: theme.primaryContainer + '20', borderWidth: 1, borderColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full }}
                      onPress={() => router.push('/coach-students')}
                    >
                      <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_500Medium', fontSize: 12 }}>
                        🎓 View Registered Academy Students →
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  visibleCoaches.map((coach: any, index: number) => {
                    const isFeatured = coach.matchStyle === 'featured';
                    const actionState = coachActionStates[coach.id] || coach.defaultAction;
                    const isRequestSent = actionState === 'Request Sent ✓';

                    const navigateToProfile = () => {
                      router.push({
                        pathname: '/coach/[id]',
                        params: {
                          id: coach.id,
                          name: coach.name,
                          specialty: coach.specialty,
                          experience: coach.experience,
                          trainees: String(coach.trainees),
                          rating: String(coach.rating),
                          reviews: String(coach.reviews),
                          rate: coach.rate,
                          location: coach.location,
                          match: coach.match,
                          sports: coach.sports.join(','),
                          avatar: typeof coach.avatar === 'string' && !/^\d+$/.test(coach.avatar) ? coach.avatar : (typeof coach.avatar === 'number' ? String(coach.avatar) : String(coach.avatar)),
                          badge: coach.badge ?? '',
                        },
                      });
                    };

                    const navigateToBooking = () => {
                      if (coach.badge === 'OWNER') {
                        Alert.alert('Manage Class', 'This is your own published coaching class.');
                        return;
                      }
                      router.push({
                        pathname: '/book-coach',
                        params: {
                          id: coach.id,
                          coachName: coach.name,
                          coachRate: coach.rate,
                          coachAvatar: typeof coach.avatar === 'number' ? String(coach.avatar) : coach.avatar
                        }
                      });
                    };

                    return (
                      <React.Fragment key={coach.id}>
                        {/* Summer Class Ad after 2nd and 4th coach */}
                        {index === 2 && coachFilter !== 'Me' && (
                          <Reanimated.View entering={FadeInDown.delay(index * 80 - 20).duration(500).damping(14)}>
                            <Pressable
                              style={styles.summerAdCard}
                              onPress={() => router.push({
                                pathname: '/enroll',
                                params: {
                                  title: '⚽ Football Summer Camp 2024',
                                  price: '4999',
                                  dates: 'Jun 15 – Aug 10',
                                  location: 'Bangalore, India',
                                  image: 'https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=600&q=80',
                                  themeColor: '#fbbf24',
                                  badgeText: 'SUMMER CLASS',
                                  badgeIcon: 'sunny'
                                }
                              })}
                            >
                              {/* Background gradient overlay */}
                              <View style={styles.summerAdBg}>
                                <Image
                                  source={{ uri: 'https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=600&q=80' }}
                                  style={styles.summerAdBgImage}
                                  contentFit="cover"
                                />
                                <View style={styles.summerAdOverlay} />
                              </View>
                              <View style={styles.summerAdContent}>
                                <View style={[styles.summerAdBadgeRow, { justifyContent: 'flex-end' }]}>
                                  <ThemedText type="labelSm" style={{ color: '#ffffff99', fontSize: 10 }}>Limited Seats</ThemedText>
                                </View>
                                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', marginTop: 6, fontSize: 18 }}>
                                  {'⚽ Football Summer Camp 2024'}
                                </ThemedText>
                                <ThemedText type="bodySm" style={{ color: '#ffffffcc', marginTop: 4, lineHeight: 18 }}>
                                  8-week intensive training with elite coaches. Ages 12–18.
                                </ThemedText>
                                <View style={styles.summerAdMeta}>
                                  <View style={styles.summerAdMetaItem}>
                                    <Ionicons name="calendar-outline" size={12} color="#ffffffaa" />
                                    <ThemedText type="labelSm" style={{ color: '#ffffffcc', marginLeft: 4, fontSize: 11 }}>Jun 15 – Aug 10</ThemedText>
                                  </View>
                                  <View style={styles.summerAdMetaItem}>
                                    <Ionicons name="location-outline" size={12} color="#ffffffaa" />
                                    <ThemedText type="labelSm" style={{ color: '#ffffffcc', marginLeft: 4, fontSize: 11 }}>Bangalore, India</ThemedText>
                                  </View>
                                </View>
                                <View style={styles.summerAdFooter}>
                                  <View>
                                    <ThemedText type="labelSm" style={{ color: '#ffffffaa', fontSize: 10 }}>Early Bird Price</ThemedText>
                                    <ThemedText type="headlineSm" style={{ color: '#fbbf24', fontFamily: 'Sora_500Medium' }}>₹4,999</ThemedText>
                                  </View>
                                  <View style={styles.summerAdBtn}>
                                    <ThemedText type="labelMd" style={{ color: '#1a1a2e', fontFamily: 'Sora_500Medium', fontSize: 12 }}>Enroll Now</ThemedText>
                                    <Ionicons name="arrow-forward" size={14} color="#1a1a2e" style={{ marginLeft: 4 }} />
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          </Reanimated.View>
                        )}

                        {index === 4 && coachFilter !== 'Me' && (
                          <Reanimated.View entering={FadeInDown.delay(index * 80 - 20).duration(500).damping(14)}>
                            <Pressable
                              style={styles.summerAdCard}
                              onPress={() => router.push({
                                pathname: '/enroll',
                                params: {
                                  title: '🎾 Tennis Masterclass Series',
                                  price: '2499',
                                  dates: 'Jul 1 – Aug 31',
                                  location: 'Mumbai, India',
                                  image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=600&q=80',
                                  themeColor: '#a78bfa',
                                  badgeText: 'MASTERCLASS',
                                  badgeIcon: 'tennisball'
                                }
                              })}
                            >
                              <View style={styles.summerAdBg}>
                                <Image
                                  source={{ uri: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=600&q=80' }}
                                  style={styles.summerAdBgImage}
                                  contentFit="cover"
                                />
                                <View style={[styles.summerAdOverlay, { backgroundColor: '#0f172aee' }]} />
                              </View>
                              <View style={styles.summerAdContent}>
                                <View style={[styles.summerAdBadgeRow, { justifyContent: 'flex-end' }]}>
                                  <ThemedText type="labelSm" style={{ color: '#ffffff99', fontSize: 10 }}>8 Spots Left</ThemedText>
                                </View>
                                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', marginTop: 6, fontSize: 18 }}>
                                  {'🎾 Tennis Masterclass Series'}
                                </ThemedText>
                                <ThemedText type="bodySm" style={{ color: '#ffffffcc', marginTop: 4, lineHeight: 18 }}>
                                  Pro-level techniques with certified international coaches. All levels.
                                </ThemedText>
                                <View style={styles.summerAdMeta}>
                                  <View style={styles.summerAdMetaItem}>
                                    <Ionicons name="calendar-outline" size={12} color="#ffffffaa" />
                                    <ThemedText type="labelSm" style={{ color: '#ffffffcc', marginLeft: 4, fontSize: 11 }}>Jul 1 – Aug 31</ThemedText>
                                  </View>
                                  <View style={styles.summerAdMetaItem}>
                                    <Ionicons name="location-outline" size={12} color="#ffffffaa" />
                                    <ThemedText type="labelSm" style={{ color: '#ffffffcc', marginLeft: 4, fontSize: 11 }}>Mumbai, India</ThemedText>
                                  </View>
                                </View>
                                <View style={styles.summerAdFooter}>
                                  <View>
                                    <ThemedText type="labelSm" style={{ color: '#ffffffaa', fontSize: 10 }}>Per Session</ThemedText>
                                    <ThemedText type="headlineSm" style={{ color: '#a78bfa', fontFamily: 'Sora_500Medium' }}>₹2,499</ThemedText>
                                  </View>
                                  <View style={[styles.summerAdBtn, { backgroundColor: '#7c3aed' }]}>
                                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 12 }}>Register</ThemedText>
                                    <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          </Reanimated.View>
                        )}

                        <Reanimated.View
                          entering={FadeInDown.delay(index * 80).duration(500).damping(14)}
                        >
                          <View
                            style={[
                              styles.teamCard,
                              isFeatured
                                ? { backgroundColor: theme.secondaryContainer, borderColor: theme.secondary }
                                : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                            ]}
                          >
                            {/* Card Header Row: Avatar (tappable) */}
                            <View style={styles.teamCardHeader}>
                              {/* Coach Avatar — tapping goes to profile */}
                              <Pressable style={styles.coachAvatarWrapper} onPress={navigateToProfile}>
                                <Image
                                  source={typeof coach.avatar === 'string' && !/^\d+$/.test(coach.avatar) ? { uri: coach.avatar } : (typeof coach.avatar === 'number' ? coach.avatar : parseInt(coach.avatar, 10))}
                                  style={styles.coachAvatar}
                                  contentFit="cover"
                                />
                              </Pressable>
                            </View>

                            {/* Coach Name + Specialty — tapping name also goes to profile */}
                            <Pressable onPress={navigateToProfile} style={{ marginTop: Spacing.md }}>
                              <View style={styles.coachNameRow}>
                                <ThemedText
                                  type="headlineSm"
                                  style={[
                                    { fontSize: 15, fontFamily: 'Sora_500Medium', letterSpacing: -0.1 },
                                    isFeatured ? { color: theme.onSecondaryContainer } : { color: theme.text }
                                  ]}
                                >
                                  {coach.name}
                                </ThemedText>
                              </View>

                              {/* Specialty */}
                              <ThemedText
                                type="bodySm"
                                style={{ color: isFeatured ? theme.onSecondaryContainer + 'cc' : theme.secondary, marginTop: 2, fontSize: 11.5, fontFamily: 'Sora_500Medium' }}
                              >
                                {coach.specialty}
                              </ThemedText>

                              {/* Rating Row */}
                              <View style={styles.ratingRow}>
                                <Ionicons name="star" size={13} color="#f59e0b" />
                                <ThemedText type="labelMd" style={{ color: isFeatured ? theme.onSecondaryContainer : theme.text, fontFamily: 'Sora_500Medium', marginLeft: 3, fontSize: 11 }}>
                                  {coach.rating}
                                </ThemedText>
                                <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + '88' : theme.textSecondary, marginLeft: 3, fontSize: 10.5, fontFamily: 'Sora_400Regular' }}>
                                  ({coach.reviews} reviews)
                                </ThemedText>
                              </View>

                              {/* Details Row: experience, location */}
                              <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                  <Ionicons name="person-outline" size={12} color={isFeatured ? theme.onSecondaryContainer + 'aa' : theme.textSecondary} />
                                  <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + 'bb' : theme.textSecondary, marginLeft: 3, fontSize: 10.5, fontFamily: 'Sora_400Regular' }}>
                                    {coach.experience}
                                  </ThemedText>
                                </View>
                                <View style={styles.detailItem}>
                                  <Ionicons name="location-outline" size={12} color={isFeatured ? theme.onSecondaryContainer + 'aa' : theme.textSecondary} />
                                  <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + 'bb' : theme.textSecondary, marginLeft: 3, fontSize: 10.5, fontFamily: 'Sora_400Regular' }}>
                                    {coach.location}
                                  </ThemedText>
                                </View>
                              </View>

                              {/* Certifications */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                <Ionicons name="ribbon-outline" size={12} color={isFeatured ? '#ffffff' : '#10b981'} style={{ marginRight: 4 }} />
                                <ThemedText style={{ color: isFeatured ? '#ffffff' : '#10b981', fontSize: 10, fontFamily: 'Sora_500Medium' }} numberOfLines={1}>
                                  {coach.certification || 'BWF Level 2 · UEFA Licensed'}
                                </ThemedText>
                              </View>

                              {/* Rate */}
                              <View style={styles.rateRow}>
                                <Ionicons name="cash-outline" size={13} color={isFeatured ? theme.onSecondaryContainer + 'aa' : theme.primary} />
                                <ThemedText type="labelMd" style={{ color: isFeatured ? theme.onSecondaryContainer : theme.primary, fontFamily: 'Sora_500Medium', fontSize: 14, marginLeft: 4 }}>
                                  {coach.rate}
                                </ThemedText>
                              </View>

                            </Pressable>

                            {/* Action Buttons */}
                            <View style={styles.teamCardActions}>
                              <Pressable
                                onPress={navigateToBooking}
                                style={[
                                  styles.joinBtn,
                                  coach.id === 'volt' ? { width: '100%' } : {},
                                  { backgroundColor: theme.primary },
                                ]}
                              >
                                <Ionicons name="calendar-outline" size={14} color="#ffffff" style={{ marginRight: 5 }} />
                                <ThemedText
                                  type="labelMd"
                                  style={{ color: '#ffffff' }}
                                >
                                  {actionState}
                                </ThemedText>
                              </Pressable>
                              {coach.id !== 'volt' && coach.badge !== 'OWNER' && (
                                <Pressable
                                  onPress={navigateToProfile}
                                  style={[styles.optionsBtn, { borderColor: isFeatured ? theme.secondary + '66' : theme.outlineVariant }]}
                                >
                                  <Ionicons name="person" size={16} color={isFeatured ? theme.onSecondaryContainer : theme.secondary} />
                                </Pressable>
                              )}
                            </View>
                          </View>
                        </Reanimated.View>
                      </React.Fragment>
                    );
                  })
                )}
              </View>
            </View>

            {/* Nearby Players */}
            <View style={[styles.section, { paddingBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Nearby Players</ThemedText>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersScroll}>
                {PLAYERS.map(player => (
                  <Pressable
                    key={player.id}
                    onPress={() => router.push({ pathname: '/player-profile', params: { id: player.id } })}
                    style={[styles.playerCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                  >
                    <Image source={player.image} style={styles.playerAvatar} contentFit="cover" />
                    <ThemedText type="labelMd" style={{ marginTop: Spacing.sm, fontFamily: 'Sora_500Medium', color: theme.text }}>
                      {player.name}
                    </ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>
                      {player.role}
                    </ThemedText>
                    <Pressable
                      onPress={() => handleInviteClick(player.id)}
                      style={[
                        styles.inviteBtn,
                        { borderColor: theme.secondary },
                        inviteStates[player.id] && { backgroundColor: theme.secondaryContainer, borderColor: theme.secondaryContainer }
                      ]}
                    >
                      <ThemedText type="labelSm" style={{ color: inviteStates[player.id] ? theme.onSecondaryContainer : theme.secondary, fontFamily: 'Sora_500Medium' }}>
                        {inviteStates[player.id] ? 'Invited!' : 'Invite'}
                      </ThemedText>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

          </ScrollView>
        </Reanimated.View>

        {/* FAB for New Class – Coach & Super Admin only */}
        {((profile.role as string) === 'Coach' || (profile.role as string) === 'Super Admin') && (
          <Pressable
            style={({ pressed }) => [
              styles.fabTop,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => router.push('/create-class')}
          >
            <LinearGradient
              colors={['#10b981', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Ionicons name="school" size={26} color="#ffffff" />
            </LinearGradient>
          </Pressable>
        )}
      </SafeAreaView>
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  filterTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#5D68E8',
  },
  headerTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: 4,
  },
  profileIconButton: {
    padding: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  rankingGrid: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  rankingCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  rankingCardDecor: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#5D68E8',
    opacity: 0.15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.md,
  },
  matcherCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  matcherAvatarContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matcherAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamGrid: {
    gap: Spacing.md,
  },
  teamCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachAvatarWrapper: {
    position: 'relative',
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: '#5D68E8',
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  teamCardActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  joinBtn: {
    flexDirection: 'row',
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  playerCard: {
    width: 130,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  inviteBtn: {
    width: '100%',
    height: 28,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  // ── Summer Class Ad styles ──
  summerAdCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
  },
  summerAdBg: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  summerAdBgImage: {
    width: '100%',
    height: '100%',
  },
  summerAdOverlay: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0d1f3cee',
  },
  summerAdContent: {
    padding: Spacing.lg,
    zIndex: 2,
  },
  summerAdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summerAdMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: Spacing.md,
  },
  summerAdMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summerAdFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#ffffff22',
  },
  summerAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  createPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginRight: 4,
  },
  createPillText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  // Registered Students Directory Card styles
  studentDirectoryCard: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  studentCardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentCardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 88,
    right: Spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 999,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

