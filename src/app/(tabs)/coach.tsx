import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';

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
    rate: '₹650/hr',
    location: 'Chennai, India',
    match: '92% Match',
    matchStyle: 'primary',
    sports: ['cricket', 'tennis'],
    avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
    badge: null,
    defaultAction: 'Book Coach',
  },
  {
    id: 'volt',
    name: 'Coach Volt',
    specialty: 'Athletic Performance',
    experience: '14 bookings • 1 open slot',
    trainees: 14,
    rating: 5.0,
    reviews: 67,
    rate: '₹1,200/hr',
    location: 'Mumbai, India',
    match: 'Pro Recommended',
    matchStyle: 'featured',
    sports: ['football', 'basketball', 'fitness'],
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
    badge: 'PRO',
    defaultAction: 'Request Booking',
  },
  {
    id: 'nova',
    name: 'Coach Nova',
    specialty: 'Tennis & Agility',
    experience: '6 yrs experience',
    trainees: 9,
    rating: 4.6,
    reviews: 53,
    rate: '₹550/hr',
    location: 'Hyderabad, India',
    match: '87% Match',
    matchStyle: 'primary',
    sports: ['tennis', 'badminton'],
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    badge: null,
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

// Sport icon mapping
const SPORT_ICONS: Record<string, { icon: string; lib: 'ionicons' | 'fa5' | 'mci'; color: string; label: string }> = {
  football:   { icon: 'football',          lib: 'ionicons', color: '#2e7d32', label: 'Football'   },
  cricket:    { icon: 'cricket',            lib: 'mci',      color: '#bf360c', label: 'Cricket'    },
  basketball: { icon: 'basketball',         lib: 'ionicons', color: '#e65100', label: 'Basketball' },
  tennis:     { icon: 'tennisball',         lib: 'ionicons', color: '#6a1b9a', label: 'Tennis'     },
  badminton:  { icon: 'badminton',          lib: 'mci',      color: '#1565c0', label: 'Badminton'  },
  fitness:    { icon: 'barbell',            lib: 'ionicons', color: '#c62828', label: 'Fitness'    },
  swimming:   { icon: 'water',              lib: 'ionicons', color: '#0277bd', label: 'Swimming'   },
};

function SportIcon({ sport, size = 13, color }: { sport: string; size?: number; color?: string }) {
  const def = SPORT_ICONS[sport];
  if (!def) return null;
  const iconColor = color || def.color;
  if (def.lib === 'ionicons') {
    return <Ionicons name={def.icon as any} size={size} color={iconColor} />;
  }
  if (def.lib === 'fa5') {
    return <FontAwesome5 name={def.icon as any} size={size} color={iconColor} />;
  }
  return <MaterialCommunityIcons name={def.icon as any} size={size} color={iconColor} />;
}

export default function CoachTab() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [coinTossVisible, setCoinTossVisible] = useState(false);

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

  const displayAvatar = profile.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI';

  if (profile.role === 'Owner') {
    return (
      <GradientContainer screenName="coach-owner" style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Top App Bar */}
          <View style={[styles.header, { backgroundColor: 'transparent' }]}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
                <Image
                  source={{ uri: displayAvatar }}
                  style={styles.headerAvatar}
                />
              </Pressable>
              <View style={styles.headerTextGroup}>
                <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                  {profile.name} (Owner)
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="business" size={12} color={theme.secondary} />
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                    Facility Admin
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
                <Ionicons name="pulse" size={20} color={theme.secondary} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
                <FontAwesome5 name="coins" size={16} color={theme.secondary} />
              </Pressable>
            </View>
          </View>

          <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Bento Stats Row */}
              <View style={styles.section}>
                <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                  My Arena Overview
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={[styles.rankingCard, { flex: 1, padding: Spacing.md, backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, fontSize: 9 }}>TOTAL TURFS</ThemedText>
                    <ThemedText type="headlineMd" style={{ color: '#ffffff', marginTop: Spacing.xs }}>2 Managed</ThemedText>
                  </View>
                  <View style={[styles.rankingCard, { flex: 1, padding: Spacing.md, backgroundColor: theme.secondaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontSize: 9 }}>PEAK OCCUPANCY</ThemedText>
                    <ThemedText type="headlineMd" style={{ color: theme.text, marginTop: Spacing.xs }}>82% Booked</ThemedText>
                  </View>
                </View>
              </View>

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
                  {[
                    {
                      id: 'skyline',
                      name: 'Skyline Arena Elite',
                      location: 'Canary Wharf, East London',
                      pitch: '5G Rubber Infill Turf',
                      slots: '8/12 active slots today',
                      rate: '₹25/hr',
                      image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80',
                    },
                    {
                      id: 'the-grid',
                      name: 'The Grid Multisport',
                      location: 'Stratford Central, London',
                      pitch: 'Indoor Woodcourt',
                      slots: '4/12 active slots today',
                      rate: '₹18/hr',
                      image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                    }
                  ].map((turf) => (
                    <View key={turf.id} style={[styles.teamCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1, flexDirection: 'row', padding: Spacing.md, gap: Spacing.md }, Shadows.level2]}>
                      <Image source={{ uri: turf.image }} style={{ width: 80, height: 80, borderRadius: BorderRadius.lg }} contentFit="cover" />
                      <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View>
                          <ThemedText type="headlineSm" style={{ fontSize: 14 }}>{turf.name}</ThemedText>
                          <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{turf.pitch}</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.secondary, fontSize: 10, marginTop: 4 }}>{turf.slots}</ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
                          <ThemedText type="headlineSm" style={{ fontSize: 14, color: theme.text }}>{turf.rate}</ThemedText>
                          <Pressable 
                            style={[styles.skillBadge, { backgroundColor: theme.secondaryContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }]}
                            onPress={() => router.push('/create-turf')}
                          >
                            <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontFamily: 'HankenGrotesk_700Bold', fontSize: 10 }}>Update Details</ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

            </ScrollView>
          </Reanimated.View>

          {/* FAB for New Slot */}
          <Pressable
            style={[styles.fabTop, { backgroundColor: 'rgb(16, 185, 129)', shadowColor: 'rgb(16, 185, 129)' }]}
            onPress={() => router.push('/create-turf')}
          >
            <MaterialCommunityIcons name="stadium-outline" size={24} color="#fff" />
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
                source={{ uri: displayAvatar }}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {profile.location}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                    
                    <View style={styles.badgeWrapper}>
                      <View style={[styles.skillBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold' }}>
                          Top 5% Skill Level
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Win Rate</ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>78.4%</ThemedText>
                      </View>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Avg Score</ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>24.5</ThemedText>
                      </View>
                      <View>
                        <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer }}>Matches</ThemedText>
                        <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>112</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* AI Matcher Info Card */}
                <View style={[styles.matcherCard, { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.matcherAvatarContainer}>
                    <View style={[styles.matcherAvatarRing, { borderColor: theme.secondaryContainer }]}>
                      <Ionicons name="star" size={24} color={theme.primary} />
                    </View>
                    <View style={[styles.levelBadge, { backgroundColor: theme.secondary }]}>
                      <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>
                        LVL 12
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: Spacing.sm }}>
                    AI Matcher Active
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.half }}>
                    Analyzing 48 coaches in your local metro area.
                  </ThemedText>
                </View>

              </View>
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
                  <Pressable>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, letterSpacing: 0.5 }}>
                      SEE ALL
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Coach Cards with Summer Class Ads interspersed */}
              <View style={styles.teamGrid}>
                {COACHES.map((coach, index) => {
                  const isFeatured = coach.matchStyle === 'featured';
                  const actionState = coachActionStates[coach.id];
                  const isRequestSent = actionState === 'Request Sent ✓';

                  const navigateToProfile = () => router.push({
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
                      avatar: coach.avatar,
                      badge: coach.badge ?? '',
                    },
                  });

                  const navigateToBooking = () => {
                    router.push({
                      pathname: '/book-coach',
                      params: {
                        id: coach.id,
                        coachName: coach.name,
                        coachRate: coach.rate,
                        coachAvatar: coach.avatar
                      }
                    });
                  };

                  return (
                    <React.Fragment key={coach.id}>
                      {/* Summer Class Ad after 2nd and 4th coach */}
                      {index === 2 && (
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
                              <View style={styles.summerAdBadgeRow}>
                                <View style={styles.summerAdBadge}>
                                  <Ionicons name="sunny" size={11} color="#fbbf24" />
                                  <ThemedText type="labelSm" style={{ color: '#fbbf24', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', marginLeft: 4, letterSpacing: 0.8 }}>SUMMER CLASS</ThemedText>
                                </View>
                                <ThemedText type="labelSm" style={{ color: '#ffffff99', fontSize: 10 }}>Limited Seats</ThemedText>
                              </View>
                              <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 6, fontSize: 18 }}>
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
                                  <ThemedText type="headlineSm" style={{ color: '#fbbf24', fontFamily: 'HankenGrotesk_800ExtraBold' }}>₹4,999</ThemedText>
                                </View>
                                <View style={styles.summerAdBtn}>
                                  <ThemedText type="labelMd" style={{ color: '#1a1a2e', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>Enroll Now</ThemedText>
                                  <Ionicons name="arrow-forward" size={14} color="#1a1a2e" style={{ marginLeft: 4 }} />
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        </Reanimated.View>
                      )}

                      {index === 4 && (
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
                              <View style={styles.summerAdBadgeRow}>
                                <View style={[styles.summerAdBadge, { backgroundColor: '#7c3aed33', borderColor: '#7c3aed66' }]}>
                                  <Ionicons name="tennisball" size={11} color="#a78bfa" />
                                  <ThemedText type="labelSm" style={{ color: '#a78bfa', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', marginLeft: 4, letterSpacing: 0.8 }}>SUMMER CLASS</ThemedText>
                                </View>
                                <ThemedText type="labelSm" style={{ color: '#ffffff99', fontSize: 10 }}>8 Spots Left</ThemedText>
                              </View>
                              <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 6, fontSize: 18 }}>
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
                                  <ThemedText type="headlineSm" style={{ color: '#a78bfa', fontFamily: 'HankenGrotesk_800ExtraBold' }}>₹2,499</ThemedText>
                                </View>
                                <View style={[styles.summerAdBtn, { backgroundColor: '#7c3aed' }]}>
                                  <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>Register</ThemedText>
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
                          {/* Card Header Row: Avatar (tappable) + Match Badge */}
                          <View style={styles.teamCardHeader}>
                            {/* Coach Avatar — tapping goes to profile */}
                            <Pressable style={styles.coachAvatarWrapper} onPress={navigateToProfile}>
                              <Image
                                source={{ uri: coach.avatar }}
                                style={styles.coachAvatar}
                                contentFit="cover"
                              />
                              {/* Online dot */}
                              <View style={[styles.onlineDot, { backgroundColor: '#4caf50', borderColor: isFeatured ? theme.secondaryContainer : theme.surfaceLowest }]} />
                            </Pressable>

                            {/* Match badge */}
                            <View style={[
                              styles.matchPercentage,
                              isFeatured
                                ? { backgroundColor: theme.primary }
                                : { backgroundColor: theme.secondaryContainer + '33' },
                            ]}>
                              {isFeatured && (
                                <Ionicons name="flash" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                              )}
                              <ThemedText
                                type="labelSm"
                                style={{
                                  color: isFeatured ? '#ffffff' : theme.secondary,
                                  fontFamily: 'PlusJakartaSans_700Bold',
                                }}
                              >
                                {coach.match}
                              </ThemedText>
                            </View>
                          </View>

                          {/* Coach Name + Specialty — tapping name also goes to profile */}
                          <Pressable onPress={navigateToProfile} style={{ marginTop: Spacing.md }}>
                            <View style={styles.coachNameRow}>
                              <ThemedText
                                type="headlineSm"
                                style={isFeatured ? { color: theme.onSecondaryContainer } : {}}
                              >
                                {coach.name}
                              </ThemedText>
                              {coach.badge && (
                                <View style={[styles.proBadge, { backgroundColor: theme.primary }]}>
                                  <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold' }}>
                                    {coach.badge}
                                  </ThemedText>
                                </View>
                              )}
                            </View>

                            {/* Specialty */}
                            <ThemedText
                              type="bodySm"
                              style={{ color: isFeatured ? theme.onSecondaryContainer + 'cc' : theme.secondary, marginTop: 2, fontFamily: 'HankenGrotesk_600SemiBold' }}
                            >
                              {coach.specialty}
                            </ThemedText>

                            {/* Rating Row */}
                            <View style={styles.ratingRow}>
                              <Ionicons name="star" size={13} color="#f59e0b" />
                              <ThemedText type="labelMd" style={{ color: isFeatured ? theme.onSecondaryContainer : theme.text, fontFamily: 'HankenGrotesk_700Bold', marginLeft: 3 }}>
                                {coach.rating}
                              </ThemedText>
                              <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + '88' : theme.textSecondary, marginLeft: 3 }}>
                                ({coach.reviews} reviews)
                              </ThemedText>
                            </View>

                            {/* Details Row: experience, location */}
                            <View style={styles.detailsRow}>
                              <View style={styles.detailItem}>
                                <Ionicons name="person-outline" size={12} color={isFeatured ? theme.onSecondaryContainer + 'aa' : theme.textSecondary} />
                                <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + 'bb' : theme.textSecondary, marginLeft: 3, fontSize: 11 }}>
                                  {coach.experience}
                                </ThemedText>
                              </View>
                              <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={12} color={isFeatured ? theme.onSecondaryContainer + 'aa' : theme.textSecondary} />
                                <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + 'bb' : theme.textSecondary, marginLeft: 3, fontSize: 11 }}>
                                  {coach.location}
                                </ThemedText>
                              </View>
                            </View>

                            {/* Rate + Trainees */}
                            <View style={styles.rateRow}>
                              <Ionicons name="cash-outline" size={13} color={isFeatured ? theme.onSecondaryContainer + 'aa' : theme.primary} />
                              <ThemedText type="labelMd" style={{ color: isFeatured ? theme.onSecondaryContainer : theme.primary, fontFamily: 'HankenGrotesk_700Bold', marginLeft: 4 }}>
                                {coach.rate}
                              </ThemedText>
                              <ThemedText type="labelSm" style={{ color: isFeatured ? theme.onSecondaryContainer + '88' : theme.textSecondary, marginLeft: 4 }}>
                                • {coach.trainees} trainees
                              </ThemedText>
                            </View>

                            {/* Sport Icons Row */}
                            <View style={styles.sportsRow}>
                              {coach.sports.map(sport => {
                                const def = SPORT_ICONS[sport];
                                if (!def) return null;
                                const chipBg = isFeatured ? 'rgba(255, 255, 255, 0.15)' : def.color + '18';
                                const chipBorder = isFeatured ? 'rgba(255, 255, 255, 0.3)' : def.color + '44';
                                const chipTextColor = isFeatured ? '#ffffff' : def.color;
                                return (
                                  <View
                                    key={sport}
                                    style={[styles.sportChip, { backgroundColor: chipBg, borderColor: chipBorder }]}
                                  >
                                    <SportIcon sport={sport} size={12} color={chipTextColor} />
                                    <ThemedText type="labelSm" style={{ color: chipTextColor, fontSize: 10, marginLeft: 4, fontFamily: 'HankenGrotesk_600SemiBold' }}>
                                      {def.label}
                                    </ThemedText>
                                  </View>
                                );
                              })}
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
                                {coach.defaultAction}
                              </ThemedText>
                            </Pressable>
                            {coach.id !== 'volt' && (
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
                })}
              </View>
            </View>

            {/* Nearby Players */}
            <View style={[styles.section, { paddingBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Nearby Players</ThemedText>
                <View style={[styles.nearbyBadge, { backgroundColor: theme.surfaceHigh }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Within 5 miles</ThemedText>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersScroll}>
                {PLAYERS.map(player => (
                  <Pressable
                    key={player.id}
                    onPress={() => router.push({ pathname: '/player-profile', params: { id: player.id } })}
                    style={[styles.playerCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                  >
                    <Image source={player.image} style={styles.playerAvatar} contentFit="cover" />
                    <ThemedText type="labelMd" style={{ marginTop: Spacing.sm, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>
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
                      <ThemedText type="labelSm" style={{ color: inviteStates[player.id] ? theme.onSecondaryContainer : theme.secondary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {inviteStates[player.id] ? 'Invited!' : 'Invite'}
                      </ThemedText>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

          </ScrollView>
        </Reanimated.View>

        {/* FAB for New Class */}
        {profile.role === 'Coach' && (
          <Pressable
            style={[styles.fabTop, { backgroundColor: 'rgb(16, 185, 129)', shadowColor: 'rgb(16, 185, 129)' }]}
            onPress={() => router.push('/create-class')}
          >
            <Ionicons name="school-outline" size={24} color="#fff" />
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
  badgeWrapper: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
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
  levelBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  matchPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
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
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.md,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
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
  nearbyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
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
  summerAdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf2422',
    borderWidth: 1,
    borderColor: '#fbbf2466',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  fabTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
});

