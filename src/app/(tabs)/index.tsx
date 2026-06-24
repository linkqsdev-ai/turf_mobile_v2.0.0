import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { PromoBanner, AutoScrollingHorizontalBanners } from '@/components/promo-banner';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const role: string = profile.role || 'Player';
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/network');

  return (
    <GradientContainer screenName="home" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={handleProfilePress}>
              <Image
                source={{ uri: profile.avatarUrl }}
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
            <Pressable style={styles.iconButton} onPress={handleNetworkPress}>
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          {/* Welcome Header Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeTextContainer}>
              <ThemedText type="headlineMd" style={{ color: theme.textSecondary }}>
                Hello, {profile.name.split(' ')[0]}
              </ThemedText>
              <ThemedText type="headlineLg" style={styles.welcomeHeadline}>
                {role === 'Owner' 
                  ? "Manage Your Arena" 
                  : role === 'Coach' 
                  ? "Academy Dashboard" 
                  : role === 'Organizer'
                  ? "Host Premium Leagues"
                  : "Let's become more Productive"}
              </ThemedText>
            </View>
            <Image
              source={
                role === 'Owner'
                  ? require('@/assets/images/illustrations/stadium.png')
                  : role === 'Coach'
                  ? require('@/assets/images/illustrations/football_player.png')
                  : role === 'Organizer'
                  ? require('@/assets/images/illustrations/trophy.png')
                  : { uri: 'https://lh3.googleusercontent.com/aida/AP1WRLsrliF0Cd3A1noW1I-8QmrA86jnUIhi367jWWnWwX_4cOBZvy0pEfT2NOP469vVIgcettV0_tGsG8CLAVsU4gpyVZYJY30Ms2S9po_TAFCHtuZGlN0TfD6UKPJL-W4zBAou4QiM6fwBAoQ70des2-UtAfllHZdyG7TSX_arZ0Gj7rIEGoIjW_lyUG2y-nnju08P3-ZpQxYURos2c2MwDDLdxzAOYHCf2_wzduUmBoMEaIV3RjBJMlYV2MM' }
              }
              style={[
                styles.welcomeIllustration,
                role === 'Owner' && { width: 100, height: 80, bottom: 10 },
                role === 'Coach' && { width: 90, height: 100, bottom: 5 },
                role === 'Organizer' && { width: 80, height: 80, bottom: 15 }
              ]}
              contentFit="contain"
            />
          </View>

          {role === 'Coach' ? (
            <>
              {/* 1. Coach Analytics - Dual Graphs (Green & Orange) */}
              <View style={styles.section}>
                <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                  Academy Analytics Dashboard
                </ThemedText>
                
                {/* Activity Class Graph (Green) */}
                <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest, marginBottom: Spacing.md }, Shadows.level2]}>
                  <View style={styles.graphHeader}>
                    <View>
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                        Weekly Coached Hours (Activity Load)
                      </ThemedText>
                      <ThemedText type="labelSm" style={{ color: '#10b981', marginTop: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        32.5 Hours Coached
                      </ThemedText>
                    </View>
                    <Ionicons name="stats-chart" size={18} color="#10b981" />
                  </View>
                  <View style={styles.graphBarsContainer}>
                    {[
                      { label: 'M', val: 4.5, max: 8 },
                      { label: 'T', val: 6.0, max: 8 },
                      { label: 'W', val: 3.5, max: 8 },
                      { label: 'T', val: 5.5, max: 8 },
                      { label: 'F', val: 7.0, max: 8 },
                      { label: 'S', val: 4.0, max: 8 },
                      { label: 'S', val: 2.0, max: 8 },
                    ].map((bar, idx) => {
                      const heightPercent = (bar.val / bar.max) * 100;
                      const isActive = bar.val >= 6.0;
                      return (
                        <View key={idx} style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: heightPercent, backgroundColor: isActive ? '#10b981' : '#10b98133' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>{bar.label}</ThemedText>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* High Demand Class Graph (Orange) */}
                <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                  <View style={styles.graphHeader}>
                    <View>
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                        Batch Occupancy Rate (High Demand)
                      </ThemedText>
                      <ThemedText type="labelSm" style={{ color: '#ff8c00', marginTop: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Avg. 82% Enrollment
                      </ThemedText>
                    </View>
                    <Ionicons name="trending-up" size={18} color="#ff8c00" />
                  </View>
                  <View style={styles.graphBarsContainer}>
                    {[
                      { label: 'U12', val: 90, max: 100 },
                      { label: 'U16', val: 85, max: 100 },
                      { label: 'ADU', val: 65, max: 100 },
                      { label: 'WKD', val: 95, max: 100 },
                      { label: 'GRL', val: 75, max: 100 },
                    ].map((bar, idx) => {
                      const heightPercent = (bar.val / bar.max) * 100;
                      const isActive = bar.val >= 85;
                      return (
                        <View key={idx} style={styles.graphBarCol}>
                          <View style={[styles.graphBar, { height: heightPercent, backgroundColor: isActive ? '#ff8c00' : '#ff8c0033' }]} />
                          <ThemedText type="labelSm" style={styles.graphBarLabel}>{bar.label}</ThemedText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* 2. Daily Progress Card */}
              <View style={styles.section}>
                <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                  <View style={styles.planInfo}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                      Academy Schedule
                    </ThemedText>
                    <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                      4 of 6 classes completed
                    </ThemedText>
                    <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }}>
                        View Students
                      </ThemedText>
                    </Pressable>
                  </View>
                  
                  <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                        67%
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. Academy Analytics (Bento Cells) */}
              <View style={styles.section}>
                <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                  Academy Analytics
                </ThemedText>
                <View style={styles.bentoRow}>
                  {/* Hours Coached Card */}
                  <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                    <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                      <Ionicons name="time-outline" size={20} color={theme.primary} />
                    </View>
                    <View style={styles.bentoTextWrap}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                        Weekly Hours
                      </ThemedText>
                      <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                        32.5 <ThemedText type="labelSm" style={{ fontWeight: 'normal' }}>hrs</ThemedText>
                      </ThemedText>
                    </View>
                  </View>

                  {/* Active Students Card */}
                  <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                    <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <Ionicons name="people-outline" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.bentoTextWrap}>
                      <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                        Active Trainees
                      </ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                        18 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Students</ThemedText>
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 3. Today's Academy Sessions */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="headlineSm">Today's Academy Sessions</ThemedText>
                  <Pressable>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      Full Calendar
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.scheduleList}>
                  {/* Session 1 */}
                  <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                    <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                      <Ionicons name="people" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.scheduleInfo}>
                      <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                        Under-16 Advanced Drill
                      </ThemedText>
                      <View style={styles.scheduleTimeRow}>
                        <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                        <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                          15:30 - 17:00 • Pitch A • 12 Attending
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <ThemedText style={styles.liveText}>LIVE</ThemedText>
                    </View>
                  </View>

                  {/* Session 2 */}
                  <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                    <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                      <Ionicons name="person" size={24} color={theme.secondary} />
                    </View>
                    <View style={styles.scheduleInfo}>
                      <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                        Individual Mentoring: Marcus V.
                      </ThemedText>
                      <View style={styles.scheduleTimeRow}>
                        <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                        <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                          18:00 - 19:30 • Gym Area • Focus: Power
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                  </View>
                </View>
              </View>



              {/* 5. Academy Trainee Spotlight */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="headlineSm">Academy Trainee Spotlight</ThemedText>
                  <Pressable>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      View Roster
                    </ThemedText>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredTurfsScroll}
                >
                  {[
                    {
                      id: 'student-1',
                      name: 'Marcus Vance',
                      role: 'Forward • Level 10',
                      notes: 'Excellent explosive speed',
                      rating: '4.9',
                      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
                      focus: 'TACTICAL DEPLOY'
                    },
                    {
                      id: 'student-2',
                      name: 'Elena Rostova',
                      role: 'Midfielder • Level 14',
                      notes: 'Great ball possession control',
                      rating: '4.8',
                      image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                      focus: 'BALL POSSESSION'
                    },
                    {
                      id: 'student-3',
                      name: 'Rob Miller',
                      role: 'Goalkeeper • Level 8',
                      notes: 'Needs reflex response practice',
                      rating: '4.5',
                      image: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=600&q=80',
                      focus: 'GK POSITIONING'
                    }
                  ].map((student) => (
                    <View
                      key={student.id}
                      style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                    >
                      <Image source={{ uri: student.image }} style={styles.featuredTurfImage} contentFit="cover" />
                      <View style={styles.featuredTurfContent}>
                        <View style={styles.featuredTurfHeader}>
                          <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                            {student.focus}
                          </ThemedText>
                          <View style={styles.featuredTurfRating}>
                            <Ionicons name="star" size={10} color="#5D68E8" />
                            <ThemedText type="labelSm" style={{ marginLeft: 2, fontFamily: 'HankenGrotesk_700Bold', fontSize: 10 }}>{student.rating}</ThemedText>
                          </View>
                        </View>
                        <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                          {student.name}
                        </ThemedText>
                        <View style={styles.featuredTurfLocation}>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }} numberOfLines={1}>
                            {student.role}
                          </ThemedText>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontStyle: 'italic' }} numberOfLines={1}>
                          {student.notes}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* 6. Action Cards */}
              <View style={styles.section}>
                <View style={styles.actionCardsRow}>
                  {/* Add Direct Class */}
                  <Pressable
                    style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                    onPress={() => router.push('/create-class')}
                  >
                    <View style={styles.actionCardHeader}>
                      <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <Ionicons name="calendar" size={18} color="#ffffff" />
                      </View>
                      <View style={styles.actionCardBadge}>
                        <ThemedText style={styles.actionCardBadgeText}>ACADEMY</ThemedText>
                      </View>
                    </View>
                    <View style={styles.actionCardBody}>
                      <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                        Create Class
                      </ThemedText>
                      <ThemedText type="bodySm" style={styles.actionCardDesc}>
                        Schedule direct coaching classes or student batches.
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => router.push('/create-class')}
                      style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                        Add Class
                      </ThemedText>
                    </Pressable>
                  </Pressable>

                  {/* Manage Availability */}
                  <Pressable
                    style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                  >
                    <View style={styles.actionCardHeader}>
                      <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                        <Ionicons name="time" size={16} color={theme.onSecondaryContainer} />
                      </View>
                      <View style={[styles.actionCardBadge, { backgroundColor: theme.secondaryContainer }]}>
                        <ThemedText style={[styles.actionCardBadgeText, { color: theme.onSecondaryContainer }]}>SLOTS</ThemedText>
                      </View>
                    </View>
                    <View style={styles.actionCardBody}>
                      <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                        My Availability
                      </ThemedText>
                      <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                        Update your weekly coaching hour slots for student booking.
                      </ThemedText>
                    </View>
                    <Pressable
                      style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                    >
                      <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                        Set Slots
                      </ThemedText>
                    </Pressable>
                  </Pressable>
                </View>
              </View>

              {/* 7. Grand Summer Tournament Announcement Banner */}
              <View style={styles.section}>
                <PromoBanner 
                  title="Grand Summer Tournament!"
                  subtitle="Join the Weekend League and win amazing prizes up to ₹50,000!"
                  buttonText="Register Now"
                  badgeText="ANNOUNCEMENT"
                  backgroundImage="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80"
                  buttonBackgroundColor="#ff8c00"
                  buttonTextColor="#ffffff"
                  onPress={() => router.push('/(tabs)/tournaments')}
                  variant="vertical"
                />
              </View>

              {/* 8. Offers & Gift Vouchers */}
              <View style={[styles.section, { paddingHorizontal: 0, paddingBottom: 100 }]}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 4, letterSpacing: 0.5 }}>
                  SPECIAL DEALS & VOUCHERS
                </ThemedText>
                <AutoScrollingHorizontalBanners 
                  cardWidth={270}
                  gap={12}
                  banners={[
                    {
                      title: "YAWAH Turf Special Offer",
                      subtitle: "Get flat 30% OFF on all bookings. Code: YAWAHTURF",
                      buttonText: "Book Now",
                      badgeText: "PROMO OFFER",
                      backgroundImage: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=600&q=80",
                      buttonBackgroundColor: "#a3e635",
                      buttonTextColor: "#064e3b",
                      onPress: () => router.push('/(tabs)/explore'),
                    },
                    {
                      title: "Gift a Game to Your Loved Ones",
                      subtitle: "The easiest way to nail a gift for a sports lover",
                      buttonText: "Buy Gift Card",
                      badgeText: "GIFT VOUCHER",
                      backgroundImage: "https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80",
                      buttonBackgroundColor: "#ffffff",
                      buttonTextColor: "#1e3a8a",
                      onPress: () => router.push('/booking'),
                    },
                    {
                      title: "Happy Hour Turf Booking",
                      subtitle: "Book morning slots for ₹15/hr only!",
                      buttonText: "Book Turf",
                      badgeText: "PROMO OFFER",
                      backgroundImage: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=600&q=80",
                      buttonBackgroundColor: "#ffffff",
                      buttonTextColor: "#ff8c00",
                      onPress: () => router.push('/(tabs)/explore'),
                    }
                  ]}
                />
              </View>
            </>
          ) : role === 'Owner' ? (
            <>
              {/* 1. Weekly Revenue Trend Graph (Bar Graph) - Moved to Top */}
              <View style={styles.section}>
                <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                  <View style={styles.graphHeader}>
                    <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                      Weekly Revenue Trend (₹)
                    </ThemedText>
                    <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                  </View>
                  <View style={styles.graphBarsContainer}>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                      <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                    </View>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                      <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                    </View>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                      <ThemedText type="labelSm" style={styles.graphBarLabel}>W</ThemedText>
                    </View>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 80, backgroundColor: theme.secondaryContainer }]} />
                      <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }]}>T</ThemedText>
                    </View>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 95, backgroundColor: theme.primary }]} />
                      <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                    </View>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 85, backgroundColor: theme.primary + '1a' }]} />
                      <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                    </View>
                    <View style={styles.graphBarCol}>
                      <View style={[styles.graphBar, { height: 70, backgroundColor: theme.primary + '1a' }]} />
                      <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. Calendar View Turf Booking Graph (Heatmap) */}
              <View style={styles.section}>
                <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                  <View style={styles.graphHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                        Monthly Booking Heatmap (Calendar View)
                      </ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.secondary, marginTop: 2, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10 }}>
                        82% Average Daily Occupancy
                      </ThemedText>
                    </View>
                    <Ionicons name="calendar-outline" size={18} color={theme.secondary} />
                  </View>

                  {/* Calendar Grid Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md, paddingHorizontal: 4 }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                      <ThemedText key={idx} type="labelSm" style={{ width: 30, textAlign: 'center', color: theme.textSecondary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 9 }}>
                        {day}
                      </ThemedText>
                    ))}
                  </View>

                  {/* Grid Cells */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4, marginTop: 6, paddingHorizontal: 4 }}>
                    {[
                      { date: 1, occupancy: 'high' }, { date: 2, occupancy: 'med' }, { date: 3, occupancy: 'low' }, { date: 4, occupancy: 'high' },
                      { date: 5, occupancy: 'high' }, { date: 6, occupancy: 'med' }, { date: 7, occupancy: 'low' }, { date: 8, occupancy: 'high' },
                      { date: 9, occupancy: 'med' }, { date: 10, occupancy: 'high' }, { date: 11, occupancy: 'high' }, { date: 12, occupancy: 'med' },
                      { date: 13, occupancy: 'low' }, { date: 14, occupancy: 'high' }, { date: 15, occupancy: 'high' }, { date: 16, occupancy: 'med' },
                      { date: 17, occupancy: 'high' }, { date: 18, occupancy: 'high' }, { date: 19, occupancy: 'low' }, { date: 20, occupancy: 'med' },
                      { date: 21, occupancy: 'high' }, { date: 22, occupancy: 'high' }, { date: 23, occupancy: 'med' }, { date: 24, occupancy: 'high' },
                      { date: 25, occupancy: 'high' }, { date: 26, occupancy: 'med' }, { date: 27, occupancy: 'low' }, { date: 28, occupancy: 'high' },
                    ].map((cell) => {
                      const color = cell.occupancy === 'high' 
                        ? '#ef4444' 
                        : cell.occupancy === 'med' 
                        ? '#f59e0b' 
                        : theme.surfaceLow;
                      const textColor = cell.occupancy === 'high'
                        ? '#ffffff'
                        : cell.occupancy === 'med'
                        ? '#ffffff'
                        : theme.textSecondary;
                      return (
                        <View 
                          key={cell.date} 
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: BorderRadius.md,
                            backgroundColor: color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginVertical: 2,
                          }}
                        >
                          <ThemedText type="labelSm" style={{ color: textColor, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10 }}>
                            {cell.date}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>

                  {/* Heatmap Legend */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: Spacing.md, borderTopColor: theme.outlineVariant + '33', borderTopWidth: 1, paddingTop: Spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.surfaceLow }} />
                      <ThemedText type="labelSm" style={{ fontSize: 9, color: theme.textSecondary }}>Low</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#f59e0b' }} />
                      <ThemedText type="labelSm" style={{ fontSize: 9, color: theme.textSecondary }}>Medium</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444' }} />
                      <ThemedText type="labelSm" style={{ fontSize: 9, color: theme.textSecondary }}>Peak</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 3. Today's Occupancy Progress Card */}
              <View style={styles.section}>
                <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                  <View style={styles.planInfo}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                      Today's Occupancy
                    </ThemedText>
                    <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                      8 of 12 slots booked
                    </ThemedText>
                    <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }}>
                        View Queue
                      </ThemedText>
                    </Pressable>
                  </View>
                  
                  <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                        67%
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 4. Business Analytics Bento Grid */}
              <View style={styles.section}>
                <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                  Business Analytics
                </ThemedText>
                <View style={styles.bentoRow}>
                  {/* Revenue Card */}
                  <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                    <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                      <Ionicons name="cash-outline" size={20} color={theme.primary} />
                    </View>
                    <View style={styles.bentoTextWrap}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                        Today's Revenue
                      </ThemedText>
                      <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                        ₹18,500 <ThemedText type="labelSm" style={{ fontWeight: 'normal', color: '#10b981' }}>+15%</ThemedText>
                      </ThemedText>
                    </View>
                  </View>

                  {/* Pending Payments Card */}
                  <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                    <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <Ionicons name="wallet-outline" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.bentoTextWrap}>
                      <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                        Unpaid Dues
                      </ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                        ₹2,400 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Pending</ThemedText>
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 5. Facility status: Pitches */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="headlineSm">Facility status: Pitches</ThemedText>
                  <Pressable>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      Edit Pitches
                    </ThemedText>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredTurfsScroll}
                >
                  {[
                    {
                      id: 'pitch-1',
                      name: 'Main Football Arena',
                      status: 'BOOKED',
                      statusColor: '#ff8c00',
                      time: '17:00 - 18:00',
                      image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80',
                      desc: '5G Rubber Infill Turf'
                    },
                    {
                      id: 'pitch-2',
                      name: 'Cricket Pitch Nets',
                      status: 'AVAILABLE',
                      statusColor: '#10b981',
                      time: 'Free to book',
                      image: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80',
                      desc: 'AstroTurf wicket nets'
                    },
                    {
                      id: 'pitch-3',
                      name: 'Indoor Badminton Court',
                      status: 'MAINTENANCE',
                      statusColor: '#ef4444',
                      time: 'Unavailable today',
                      image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                      desc: 'Polished teakwood court'
                    }
                  ].map((pitch) => (
                    <View
                      key={pitch.id}
                      style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                    >
                      <Image source={{ uri: pitch.image }} style={styles.featuredTurfImage} contentFit="cover" />
                      <View style={styles.featuredTurfContent}>
                        <View style={styles.featuredTurfHeader}>
                          <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                            {pitch.desc.toUpperCase()}
                          </ThemedText>
                        </View>
                        <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                          {pitch.name}
                        </ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                          <Ionicons name="time-outline" size={10} color={theme.textSecondary} />
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                            {pitch.time}
                          </ThemedText>
                        </View>
                        <View style={styles.featuredTurfFooter}>
                          <View style={{ backgroundColor: pitch.statusColor + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <ThemedText type="labelSm" style={{ color: pitch.statusColor, fontSize: 9, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                              {pitch.status}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* 6. Today's Turf Bookings Timeline */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="headlineSm">Today's Turf Bookings</ThemedText>
                  <Pressable>
                    <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      Full Schedule
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.scheduleList}>
                  <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                    <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                      <Ionicons name="football" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.scheduleInfo}>
                      <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                        Footy Club Match Booking (#B902)
                      </ThemedText>
                      <View style={styles.scheduleTimeRow}>
                        <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                        <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                          17:00 - 18:30 • Pitch A • ₹2,500 Paid
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <ThemedText style={styles.liveText}>LIVE</ThemedText>
                    </View>
                  </View>

                  <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                    <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                      <MaterialCommunityIcons name="cricket" size={24} color={theme.secondary} />
                    </View>
                    <View style={styles.scheduleInfo}>
                      <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                        Corporate Cricket Match (#B211)
                      </ThemedText>
                      <View style={styles.scheduleTimeRow}>
                        <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                        <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                          18:30 - 20:00 • Pitch B • ₹1,800 Unpaid
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.liveBadge, { backgroundColor: '#ff8c0015', borderColor: '#ff8c0033' }]}>
                      <View style={[styles.liveDot, { backgroundColor: '#ff8c00' }]} />
                      <ThemedText style={[styles.liveText, { color: '#ff8c00' }]}>PENDING</ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* 7. Action Cards */}
              <View style={styles.section}>
                <View style={styles.actionCardsRow}>
                  <Pressable
                    style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                  >
                    <View style={styles.actionCardHeader}>
                      <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                        <Ionicons name="add" size={18} color="#ffffff" />
                      </View>
                      <View style={styles.actionCardBadge}>
                        <ThemedText style={styles.actionCardBadgeText}>PEAK SLOTS</ThemedText>
                      </View>
                    </View>
                    <View style={styles.actionCardBody}>
                      <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                        Create Slot
                      </ThemedText>
                      <ThemedText type="bodySm" style={styles.actionCardDesc}>
                        Manually open peak timing slots for booking reservations.
                      </ThemedText>
                    </View>
                    <Pressable
                      style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                        Add Slot
                      </ThemedText>
                    </Pressable>
                  </Pressable>

                  <Pressable
                    style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                  >
                    <View style={styles.actionCardHeader}>
                      <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                        <Ionicons name="cash" size={16} color={theme.onSecondaryContainer} />
                      </View>
                      <View style={[styles.actionCardBadge, { backgroundColor: theme.secondaryContainer }]}>
                        <ThemedText style={[styles.actionCardBadgeText, { color: theme.onSecondaryContainer }]}>RATES</ThemedText>
                      </View>
                    </View>
                    <View style={styles.actionCardBody}>
                      <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                        Pricing / Rates
                      </ThemedText>
                      <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                        Configure peak hours and custom pricing slot configurations.
                      </ThemedText>
                    </View>
                    <Pressable
                      style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                    >
                      <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                        Set Rates
                      </ThemedText>
                    </Pressable>
                  </Pressable>
                </View>
              </View>

              {/* 8. Grand Summer Tournament Announcement Banner */}
              <View style={styles.section}>
                <PromoBanner 
                  title="Grand Summer Tournament!"
                  subtitle="Join the Weekend League and win amazing prizes up to ₹50,000!"
                  buttonText="Register Now"
                  badgeText="ANNOUNCEMENT"
                  backgroundImage="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80"
                  buttonBackgroundColor="#ff8c00"
                  buttonTextColor="#ffffff"
                  onPress={() => router.push('/(tabs)/tournaments')}
                  variant="vertical"
                />
              </View>

              {/* 9. Offers & Deals */}
              <View style={[styles.section, { paddingHorizontal: 0, paddingBottom: 100 }]}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 4, letterSpacing: 0.5 }}>
                  SPECIAL DEALS & VOUCHERS
                </ThemedText>
                <AutoScrollingHorizontalBanners 
                  cardWidth={270}
                  gap={12}
                  banners={[
                    {
                      title: "YAWAH Turf Special Offer",
                      subtitle: "Get flat 30% OFF on all bookings. Code: YAWAHTURF",
                      buttonText: "Book Now",
                      badgeText: "PROMO OFFER",
                      backgroundImage: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=600&q=80",
                      buttonBackgroundColor: "#a3e635",
                      buttonTextColor: "#064e3b",
                      onPress: () => router.push('/(tabs)/explore'),
                    },
                    {
                      title: "Gift a Game to Your Loved Ones",
                      subtitle: "The easiest way to nail a gift for a sports lover",
                      buttonText: "Buy Gift Card",
                      badgeText: "GIFT VOUCHER",
                      backgroundImage: "https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80",
                      buttonBackgroundColor: "#ffffff",
                      buttonTextColor: "#1e3a8a",
                      onPress: () => router.push('/booking'),
                    },
                    {
                      title: "Happy Hour Turf Booking",
                      subtitle: "Book morning slots for ₹15/hr only!",
                      buttonText: "Book Turf",
                      badgeText: "PROMO OFFER",
                      backgroundImage: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=600&q=80",
                      buttonBackgroundColor: "#ffffff",
                      buttonTextColor: "#ff8c00",
                      onPress: () => router.push('/(tabs)/explore'),
                    }
                  ]}
                />
              </View>
            </>
          ) : (
            <>
              {/* Top Progress/Status Card */}
              <View style={styles.section}>
            {role === 'Owner' ? (
              <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                <View style={styles.planInfo}>
                  <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                    Today's Occupancy
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                    8 of 12 slots booked
                  </ThemedText>
                  <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      View Queue
                    </ThemedText>
                  </Pressable>
                </View>
                
                <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                      67%
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : role === 'Coach' ? (
              <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                <View style={styles.planInfo}>
                  <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                    Academy Schedule
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                    4 of 6 classes completed
                  </ThemedText>
                  <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      View Students
                    </ThemedText>
                  </Pressable>
                </View>
                
                <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                      67%
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : role === 'Organizer' ? (
              <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                <View style={styles.planInfo}>
                  <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                    Active Tournaments
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                    3 of 4 leagues live
                  </ThemedText>
                  <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]} onPress={() => router.push('/(tabs)/tournaments')}>
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      Manage Leagues
                    </ThemedText>
                  </Pressable>
                </View>
                
                <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                      75%
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.dailyPlanCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                <View style={styles.planInfo}>
                  <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                    Daily Plan
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                    4 of 5 targets reached
                  </ThemedText>
                  <Pressable style={[styles.viewTasksButton, { backgroundColor: '#ffffff' }]}>
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold' }}>
                      View Tasks
                    </ThemedText>
                  </Pressable>
                </View>
                
                <View style={[styles.progressRing, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <View style={[styles.progressRingInner, { borderColor: '#ffffff' }]}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
                      80%
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Tournament Announcement Banner (Keep it banner in home) */}
          <View style={styles.section}>
            <PromoBanner 
              title="Grand Summer Tournament!"
              subtitle="Join the Weekend League and win amazing prizes up to ₹50,000!"
              buttonText="Register Now"
              badgeText="ANNOUNCEMENT"
              backgroundImage="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80"
              buttonBackgroundColor="#ff8c00"
              buttonTextColor="#ffffff"
              onPress={() => router.push('/(tabs)/tournaments')}
              variant="vertical"
            />
          </View>

          {/* Offers & Gift Vouchers */}
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 4, letterSpacing: 0.5 }}>
              SPECIAL DEALS & VOUCHERS
            </ThemedText>
            <AutoScrollingHorizontalBanners 
              cardWidth={270}
              gap={12}
              banners={[
                {
                  title: "YAWAH Turf Special Offer",
                  subtitle: "Get flat 30% OFF on all bookings. Code: YAWAHTURF",
                  buttonText: "Book Now",
                  badgeText: "PROMO OFFER",
                  backgroundImage: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=600&q=80",
                  buttonBackgroundColor: "#a3e635",
                  buttonTextColor: "#064e3b",
                  onPress: () => router.push('/(tabs)/explore'),
                },
                {
                  title: "Gift a Game to Your Loved Ones",
                  subtitle: "The easiest way to nail a gift for a sports lover",
                  buttonText: "Buy Gift Card",
                  badgeText: "GIFT VOUCHER",
                  backgroundImage: "https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80",
                  buttonBackgroundColor: "#ffffff",
                  buttonTextColor: "#1e3a8a",
                  onPress: () => router.push('/booking'),
                },
                {
                  title: "Happy Hour Turf Booking",
                  subtitle: "Book morning slots for ₹15/hr only!",
                  buttonText: "Book Turf",
                  badgeText: "PROMO OFFER",
                  backgroundImage: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=600&q=80",
                  buttonBackgroundColor: "#ffffff",
                  buttonTextColor: "#ff8c00",
                  onPress: () => router.push('/(tabs)/explore'),
                }
              ]}
            />
          </View>

          {/* Highlights / Pitch status / Trainees / Organized Scroll */}
          {role === 'Owner' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Facility status: Pitches</ThemedText>
                <Pressable>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    Edit Pitches
                  </ThemedText>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredTurfsScroll}
              >
                {[
                  {
                    id: 'pitch-1',
                    name: 'Main Football Arena',
                    status: 'BOOKED',
                    statusColor: '#ff8c00',
                    time: '17:00 - 18:00',
                    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80',
                    desc: '5G Rubber Infill Turf'
                  },
                  {
                    id: 'pitch-2',
                    name: 'Cricket Pitch Nets',
                    status: 'AVAILABLE',
                    statusColor: '#10b981',
                    time: 'Free to book',
                    image: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80',
                    desc: 'AstroTurf wicket nets'
                  },
                  {
                    id: 'pitch-3',
                    name: 'Indoor Badminton Court',
                    status: 'MAINTENANCE',
                    statusColor: '#ef4444',
                    time: 'Unavailable today',
                    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                    desc: 'Polished teakwood court'
                  }
                ].map((pitch) => (
                  <View
                    key={pitch.id}
                    style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                  >
                    <Image source={{ uri: pitch.image }} style={styles.featuredTurfImage} contentFit="cover" />
                    <View style={styles.featuredTurfContent}>
                      <View style={styles.featuredTurfHeader}>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                          {pitch.desc.toUpperCase()}
                        </ThemedText>
                      </View>
                      <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                        {pitch.name}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                        <Ionicons name="time-outline" size={10} color={theme.textSecondary} />
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                          {pitch.time}
                        </ThemedText>
                      </View>
                      <View style={styles.featuredTurfFooter}>
                        <View style={{ backgroundColor: pitch.statusColor + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <ThemedText type="labelSm" style={{ color: pitch.statusColor, fontSize: 9, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                            {pitch.status}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : role === 'Coach' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Academy Trainee Spotlight</ThemedText>
                <Pressable>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    View Roster
                  </ThemedText>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredTurfsScroll}
              >
                {[
                  {
                    id: 'student-1',
                    name: 'Marcus Vance',
                    role: 'Forward • Level 10',
                    notes: 'Excellent explosive speed',
                    rating: '4.9',
                    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
                    focus: 'TACTICAL DEPLOY'
                  },
                  {
                    id: 'student-2',
                    name: 'Elena Rostova',
                    role: 'Midfielder • Level 14',
                    notes: 'Great ball possession control',
                    rating: '4.8',
                    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                    focus: 'BALL POSSESSION'
                  },
                  {
                    id: 'student-3',
                    name: 'Rob Miller',
                    role: 'Goalkeeper • Level 8',
                    notes: 'Needs reflex response practice',
                    rating: '4.5',
                    image: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=600&q=80',
                    focus: 'GK POSITIONING'
                  }
                ].map((student) => (
                  <View
                    key={student.id}
                    style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                  >
                    <Image source={{ uri: student.image }} style={styles.featuredTurfImage} contentFit="cover" />
                    <View style={styles.featuredTurfContent}>
                      <View style={styles.featuredTurfHeader}>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                          {student.focus}
                        </ThemedText>
                        <View style={styles.featuredTurfRating}>
                          <Ionicons name="star" size={10} color="#5D68E8" />
                          <ThemedText type="labelSm" style={{ marginLeft: 2, fontFamily: 'HankenGrotesk_700Bold', fontSize: 10 }}>{student.rating}</ThemedText>
                        </View>
                      </View>
                      <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                        {student.name}
                      </ThemedText>
                      <View style={styles.featuredTurfLocation}>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }} numberOfLines={1}>
                          {student.role}
                        </ThemedText>
                      </View>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, fontStyle: 'italic' }} numberOfLines={1}>
                        {student.notes}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : role === 'Organizer' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">My Organized Leagues</ThemedText>
                <Pressable onPress={() => router.push('/(tabs)/tournaments')}>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    View All
                  </ThemedText>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredTurfsScroll}
              >
                {[
                  {
                    id: 'tourn-1',
                    name: 'Regents T10 Super League',
                    status: 'LIVE NOW',
                    statusColor: '#ff8c00',
                    teams: '16 Teams Registered',
                    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
                    sport: 'CRICKET'
                  },
                  {
                    id: 'tourn-2',
                    name: 'London Winter Futsal Cup',
                    status: 'REGISTERING',
                    statusColor: '#10b981',
                    teams: '8 Teams Registered',
                    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80',
                    sport: 'FOOTBALL'
                  },
                  {
                    id: 'tourn-3',
                    name: 'UK Tennis Singles Arena',
                    status: 'COMPLETED',
                    statusColor: '#81919c',
                    teams: '32 Players Bracket',
                    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                    sport: 'TENNIS'
                  }
                ].map((tourn) => (
                  <Pressable
                    key={tourn.id}
                    onPress={() => router.push('/(tabs)/tournaments')}
                    style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                  >
                    <Image source={{ uri: tourn.image }} style={styles.featuredTurfImage} contentFit="cover" />
                    <View style={styles.featuredTurfContent}>
                      <View style={styles.featuredTurfHeader}>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                          {tourn.sport}
                        </ThemedText>
                      </View>
                      <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                        {tourn.name}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                        <Ionicons name="people-outline" size={10} color={theme.textSecondary} />
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                          {tourn.teams}
                        </ThemedText>
                      </View>
                      <View style={styles.featuredTurfFooter}>
                        <View style={{ backgroundColor: tourn.statusColor + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <ThemedText type="labelSm" style={{ color: tourn.statusColor, fontSize: 9, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                            {tourn.status}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Highlights: Book Turf</ThemedText>
                <Pressable onPress={() => router.push('/(tabs)/explore')}>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    View All
                  </ThemedText>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredTurfsScroll}
              >
                {[
                  {
                    id: 'skyline',
                    name: 'Skyline Arena Elite',
                    location: 'Canary Wharf, East London',
                    price: '₹25',
                    rating: '4.9',
                    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80',
                    pitch: '5G Rubber Infill'
                  },
                  {
                    id: 'lords',
                    name: "Lord's View Pavillion",
                    location: "St John's Wood, London",
                    price: '₹22',
                    rating: '4.8',
                    image: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80',
                    pitch: 'Hybrid Grass Turf'
                  },
                  {
                    id: 'the-grid',
                    name: 'The Grid Multisport',
                    location: 'Stratford Central, London',
                    price: '₹18',
                    rating: '4.7',
                    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80',
                    pitch: 'Indoor Woodcourt'
                  }
                ].map((turf) => (
                  <Pressable
                    key={turf.id}
                    onPress={() => router.push({ pathname: '/details', params: { id: turf.id, name: turf.name } })}
                    style={[styles.featuredTurfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                  >
                    <Image source={{ uri: turf.image }} style={styles.featuredTurfImage} contentFit="cover" />
                    <View style={styles.featuredTurfContent}>
                      <View style={styles.featuredTurfHeader}>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                          {turf.pitch.toUpperCase()}
                        </ThemedText>
                        <View style={styles.featuredTurfRating}>
                          <Ionicons name="star" size={10} color="#5D68E8" />
                          <ThemedText type="labelSm" style={{ marginLeft: 2, fontFamily: 'HankenGrotesk_700Bold', fontSize: 10 }}>{turf.rating}</ThemedText>
                        </View>
                      </View>
                      <ThemedText type="headlineSm" style={[styles.featuredTurfTitle, { color: theme.text }]} numberOfLines={1}>
                        {turf.name}
                      </ThemedText>
                      <View style={styles.featuredTurfLocation}>
                        <Ionicons name="location-outline" size={10} color={theme.textSecondary} />
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }} numberOfLines={1}>
                          {turf.location}
                        </ThemedText>
                      </View>
                      <View style={styles.featuredTurfFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' }}>{turf.price}</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 1 }}>/hr</ThemedText>
                        </View>
                        <Pressable 
                          onPress={() => router.push({ pathname: '/details', params: { id: turf.id, name: turf.name } })}
                          style={[styles.featuredTurfBookBtn, { backgroundColor: theme.secondaryContainer }]}
                        >
                          <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold' }}>Book</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Today's Schedule timeline */}
          {role === 'Owner' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Today's Turf Bookings</ThemedText>
                <Pressable>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    View Schedule
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.scheduleList}>
                {/* Booking 1 */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                    <Ionicons name="football" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Footy Club Booking (#B204)
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        17:00 - 18:00 • Pitch A • ₹1,200 Paid
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.liveBadge, { backgroundColor: '#10b98115', borderColor: '#10b98133' }]}>
                    <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} />
                    <ThemedText style={[styles.liveText, { color: '#10b981' }]}>CONFIRMED</ThemedText>
                  </View>
                </View>

                {/* Booking 2 */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons name="cricket" size={24} color={theme.secondary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Corporate Cricket Match (#B211)
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        18:30 - 20:00 • Pitch B • ₹1,800 Unpaid
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.liveBadge, { backgroundColor: '#ff8c0015', borderColor: '#ff8c0033' }]}>
                    <View style={[styles.liveDot, { backgroundColor: '#ff8c00' }]} />
                    <ThemedText style={[styles.liveText, { color: '#ff8c00' }]}>PENDING</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          ) : role === 'Coach' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Today's Academy Sessions</ThemedText>
                <Pressable>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    Full Calendar
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.scheduleList}>
                {/* Session 1 */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                    <Ionicons name="people" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Under-16 Advanced Drill
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        15:30 - 17:00 • Pitch A • 12 Attending
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveText}>LIVE</ThemedText>
                  </View>
                </View>

                {/* Session 2 */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="person" size={24} color={theme.secondary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Individual Mentoring: Marcus V.
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        18:00 - 19:30 • Gym Area • Focus: Power
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                </View>
              </View>
            </View>
          ) : role === 'Organizer' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">Today's Organized Matches</ThemedText>
                <Pressable>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    Full Bracket
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.scheduleList}>
                {/* Match 1 */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.primaryContainer + '1a' }]}>
                    <Ionicons name="trophy" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Falcons FC vs Wolves (Quarter Final)
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        15:00 - 16:30 • Stadium A • Ref: Marcus J.
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveText}>LIVE</ThemedText>
                  </View>
                </View>

                {/* Match 2 */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="flag" size={24} color={theme.secondary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Tigers XI vs Mavericks (Group Stage)
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        18:00 - 19:30 • Stadium B • Ref: Self
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="headlineSm">{"Today's Schedule"}</ThemedText>
                <Pressable>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>
                    View Calendar
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.scheduleList}>
                {/* Live Match Card */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.secondaryContainer + '1a' }]}>
                    <Image
                      source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLtktV94nJFc0U5ggptbWUmJdSyDpzbXQmz0_Q8mx0mGuM0jwTvOYvB8NJV5PiYkP9f7ZvujLKNMFqOAPGdU64Qf9kcw9LBrrNmqyA5SjFWCFo74KLUo6y9pQIsIzQqXje9l_-qoQw07AzB9s9fy4ANoskUlqNfHpM6Ef8ELcIqwSXwbJuToojtZEvvCDg9-2XbE-mNw9LGBe8tgJp6rRCzHknvrnmculyjYWwW0eukUl3qTOYtxBH8daw' }}
                      style={styles.scheduleIllustration}
                    />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Match vs Tigers
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        14:30 - 16:00 • Stadium A
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <ThemedText style={styles.liveText}>Live</ThemedText>
                  </View>
                </View>

                {/* Practice Session Card */}
                <View style={[styles.scheduleCard, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.scheduleIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="barbell" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <ThemedText type="headlineSm" style={styles.scheduleTitle}>
                      Practice Session
                    </ThemedText>
                    <View style={styles.scheduleTimeRow}>
                      <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.scheduleTimeText}>
                        18:00 - 19:30 • Gym
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.outlineVariant} />
                </View>
              </View>
            </View>
          )}

          {/* Quick Tools & Actions */}
          {role === 'Owner' ? (
            <View style={styles.section}>
              <View style={styles.actionCardsRow}>
                {/* Add Direct Booking */}
                <Pressable
                  style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <Ionicons name="add-circle" size={18} color="#ffffff" />
                    </View>
                    <View style={styles.actionCardBadge}>
                      <ThemedText style={styles.actionCardBadgeText}>SLOTS</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                      Direct Booking
                    </ThemedText>
                    <ThemedText type="bodySm" style={styles.actionCardDesc}>
                      Manually add phone/walk-in slot bookings for customers.
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Add Slot
                    </ThemedText>
                  </Pressable>
                </Pressable>

                {/* Configure Slot Rates */}
                <Pressable
                  style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                      <FontAwesome5 name="percentage" size={14} color={theme.onSecondaryContainer} />
                    </View>
                    <View style={[styles.actionCardBadge, { backgroundColor: theme.secondaryContainer }]}>
                      <ThemedText style={[styles.actionCardBadgeText, { color: theme.onSecondaryContainer }]}>PRICING</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                      Pricing / Rates
                    </ThemedText>
                    <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                      Configure peak hours and custom pricing slot configurations.
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Set Rates
                    </ThemedText>
                  </Pressable>
                </Pressable>
              </View>
            </View>
          ) : role === 'Coach' ? (
            <View style={styles.section}>
              <View style={styles.actionCardsRow}>
                {/* Add Direct Class */}
                <Pressable
                  style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <Ionicons name="calendar" size={18} color="#ffffff" />
                    </View>
                    <View style={styles.actionCardBadge}>
                      <ThemedText style={styles.actionCardBadgeText}>ACADEMY</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                      Create Class
                    </ThemedText>
                    <ThemedText type="bodySm" style={styles.actionCardDesc}>
                      Schedule direct coaching classes or student batches.
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Add Class
                    </ThemedText>
                  </Pressable>
                </Pressable>

                {/* Manage Availability */}
                <Pressable
                  style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                      <Ionicons name="time" size={16} color={theme.onSecondaryContainer} />
                    </View>
                    <View style={[styles.actionCardBadge, { backgroundColor: theme.secondaryContainer }]}>
                      <ThemedText style={[styles.actionCardBadgeText, { color: theme.onSecondaryContainer }]}>SLOTS</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                      My Availability
                    </ThemedText>
                    <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                      Update your weekly coaching hour slots for student booking.
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Set Slots
                    </ThemedText>
                  </Pressable>
                </Pressable>
              </View>
            </View>
          ) : role === 'Organizer' ? (
            <View style={styles.section}>
              <View style={styles.actionCardsRow}>
                {/* Create Tournament */}
                <Pressable
                  onPress={() => router.push('/create-tournament')}
                  style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <Ionicons name="trophy-sharp" size={18} color="#ffffff" />
                    </View>
                    <View style={styles.actionCardBadge}>
                      <ThemedText style={styles.actionCardBadgeText}>NEW</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                      New Tournament
                    </ThemedText>
                    <ThemedText type="bodySm" style={styles.actionCardDesc}>
                      Set up a new knockout tournament or round-robin league.
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => router.push('/create-tournament')}
                    style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Setup Now
                    </ThemedText>
                  </Pressable>
                </Pressable>

                {/* Manage Referees */}
                <Pressable
                  style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                      <Ionicons name="shield-checkmark" size={16} color={theme.onSecondaryContainer} />
                    </View>
                    <View style={[styles.actionCardBadge, { backgroundColor: theme.secondaryContainer }]}>
                      <ThemedText style={[styles.actionCardBadgeText, { color: theme.onSecondaryContainer }]}>STAFF</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                      Manage Referees
                    </ThemedText>
                    <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                      Assign referees and line judges to upcoming tournament fixtures.
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Assign Refs
                    </ThemedText>
                  </Pressable>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.actionCardsRow}>
                {/* Coach Information Card */}
                <Pressable
                  onPress={() => router.push('/(tabs)/coach')}
                  style={[styles.actionCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                      <Ionicons name="school" size={18} color="#ffffff" />
                    </View>
                    <View style={styles.actionCardBadge}>
                      <ThemedText style={styles.actionCardBadgeText}>PRO COACH</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={styles.actionCardTitle}>
                      Academy Coaching
                    </ThemedText>
                    <ThemedText type="bodySm" style={styles.actionCardDesc}>
                      Book 1-on-1 sessions with certified professional trainers.
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => router.push('/(tabs)/coach')}
                    style={[styles.actionCardBtn, { backgroundColor: '#ffffff' }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Book Coach
                    </ThemedText>
                  </Pressable>
                </Pressable>

                {/* Bid Match Card */}
                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/matches', params: { tab: 'Bid Match' } })}
                  style={[styles.actionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', borderWidth: 1 }, Shadows.level2]}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIconBg, { backgroundColor: theme.secondaryContainer }]}>
                      <FontAwesome5 name="handshake" size={14} color={theme.onSecondaryContainer} />
                    </View>
                    <View style={[styles.actionCardBadge, { backgroundColor: theme.secondaryContainer }]}>
                      <ThemedText style={[styles.actionCardBadgeText, { color: theme.onSecondaryContainer }]}>CHALLENGES</ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionCardBody}>
                    <ThemedText type="headlineSm" style={[styles.actionCardTitle, { color: theme.text }]}>
                      Bid Match Challenge
                    </ThemedText>
                    <ThemedText type="bodySm" style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                      Create split-cost match challenges with local opponent teams.
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(tabs)/matches', params: { tab: 'Bid Match' } })}
                    style={[styles.actionCardBtn, { backgroundColor: theme.secondary }]}
                  >
                    <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 }}>
                      Enter Bids
                    </ThemedText>
                  </Pressable>
                </Pressable>
              </View>
            </View>
          )}

          {/* Quick Analytics Grid */}
          {role === 'Owner' ? (
            <View style={styles.section}>
              <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                Business Analytics
              </ThemedText>
              <View style={styles.bentoRow}>
                {/* Revenue Card */}
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="cash-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                      Today's Revenue
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                      ₹18,500 <ThemedText type="labelSm" style={{ fontWeight: 'normal', color: '#10b981' }}>+15%</ThemedText>
                    </ThemedText>
                  </View>
                </View>

                {/* Pending Payments Card */}
                <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Ionicons name="wallet-outline" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                      Unpaid Dues
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                      ₹2,400 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Pending</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          ) : role === 'Coach' ? (
            <View style={styles.section}>
              <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                Academy Analytics
              </ThemedText>
              <View style={styles.bentoRow}>
                {/* Hours Coached Card */}
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="time-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                      Weekly Hours
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                      32.5 <ThemedText type="labelSm" style={{ fontWeight: 'normal' }}>hrs</ThemedText>
                    </ThemedText>
                  </View>
                </View>

                {/* Active Students Card */}
                <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Ionicons name="people-outline" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                      Active Trainees
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                      18 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Students</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          ) : role === 'Organizer' ? (
            <View style={styles.section}>
              <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                Hosting Analytics
              </ThemedText>
              <View style={styles.bentoRow}>
                {/* Teams Registered */}
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="people-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                      Registered Teams
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                      24 <ThemedText type="labelSm" style={{ fontWeight: 'normal', color: '#10b981' }}>+4 New</ThemedText>
                    </ThemedText>
                  </View>
                </View>

                {/* Matches Hosted */}
                <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                      Matches Hosted
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                      142 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>Games</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText type="headlineSm" style={{ marginBottom: Spacing.md }}>
                Quick Analytics
              </ThemedText>
              <View style={styles.bentoRow}>
                {/* Top Speed Card */}
                <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="speedometer-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5 }}>
                      Top Speed
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ marginTop: 2 }}>
                      34.2 <ThemedText type="labelSm" style={{ fontWeight: 'normal' }}>km/h</ThemedText>
                    </ThemedText>
                  </View>
                </View>

                {/* Avg Power Card */}
                <View style={[styles.bentoCell, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
                  <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Ionicons name="flash" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.bentoTextWrap}>
                    <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 0.5 }}>
                      Avg. Power
                    </ThemedText>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff', marginTop: 2 }}>
                      280 <ThemedText type="labelSm" style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 'normal' }}>W</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Performance / Revenue Graph Card */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            {role === 'Owner' ? (
              <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                <View style={styles.graphHeader}>
                  <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                    Weekly Revenue Trend (₹)
                  </ThemedText>
                  <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                </View>
                <View style={styles.graphBarsContainer}>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>W</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 80, backgroundColor: theme.secondaryContainer }]} />
                    <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }]}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 95, backgroundColor: theme.primary }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 85, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 70, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                </View>
              </View>
            ) : role === 'Coach' ? (
              <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                <View style={styles.graphHeader}>
                  <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                    Weekly Trainee Attendance
                  </ThemedText>
                  <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                </View>
                <View style={styles.graphBarsContainer}>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 75, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>W</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 90, backgroundColor: theme.primary }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 80, backgroundColor: theme.secondaryContainer }]} />
                    <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }]}>S</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 55, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                </View>
              </View>
            ) : role === 'Organizer' ? (
              <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                <View style={styles.graphHeader}>
                  <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                    Weekly Tournament Attendance
                  </ThemedText>
                  <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                </View>
                <View style={styles.graphBarsContainer}>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 75, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 80, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>W</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 95, backgroundColor: theme.secondaryContainer }]} />
                    <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }]}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 85, backgroundColor: theme.primary }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.graphCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
                <View style={styles.graphHeader}>
                  <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                    Weekly Performance
                  </ThemedText>
                  <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                </View>
                <View style={styles.graphBarsContainer}>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 40, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>M</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 55, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 75, backgroundColor: theme.secondaryContainer }]} />
                    <ThemedText type="labelSm" style={[styles.graphBarLabel, { color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }]}>W</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 90, backgroundColor: theme.primary }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>T</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 35, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>F</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 50, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                  <View style={styles.graphBarCol}>
                    <View style={[styles.graphBar, { height: 60, backgroundColor: theme.primary + '1a' }]} />
                    <ThemedText type="labelSm" style={styles.graphBarLabel}>S</ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
          </>
          )}
        </ScrollView>
      </Reanimated.View>
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
    borderColor: '#5D68E8', // Gold ring around avatar
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
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
    position: 'relative',
    height: 120,
  },
  welcomeTextContainer: {
    width: '65%',
    justifyContent: 'center',
  },
  welcomeHeadline: {
    marginTop: Spacing.xs,
    fontFamily: 'HankenGrotesk_700Bold',
    lineHeight: 32,
  },
  welcomeIllustration: {
    width: 110,
    height: 110,
    position: 'absolute',
    right: Spacing.containerMargin,
    opacity: 0.95,
  },
  dailyPlanCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planInfo: {
    flex: 1,
  },
  viewTasksButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  progressRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    position: 'absolute',
    top: -8,
    left: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  scheduleList: {
    gap: Spacing.sm,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
  },
  scheduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  scheduleIllustration: {
    width: 32,
    height: 32,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  scheduleTimeText: {
    color: '#43474b',
    fontSize: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff174414',
    borderColor: '#ff174433',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff1744',
  },
  liveText: {
    color: '#ff1744',
    fontSize: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    aspectRatio: 1,
    justifyContent: 'space-between',
  },
  bentoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bentoTextWrap: {
    marginTop: Spacing.lg,
  },
  graphCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#c3c7cb33',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  graphBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: Spacing.xs,
  },
  graphBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 14,
    borderRadius: 4,
  },
  graphBarLabel: {
    marginTop: Spacing.sm,
    color: '#81919c',
    fontSize: 10,
  },
  featuredTurfsScroll: {
    paddingHorizontal: Spacing.xs,
    gap: 12,
    paddingBottom: Spacing.xs,
  },
  featuredTurfCard: {
    width: 170,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c7cb33',
  },
  featuredTurfImage: {
    width: '100%',
    height: 100,
  },
  featuredTurfContent: {
    padding: 10,
  },
  featuredTurfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  featuredTurfRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredTurfTitle: {
    fontSize: 12.5,
    fontFamily: 'HankenGrotesk_700Bold',
    marginBottom: 2,
  },
  featuredTurfLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredTurfFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  featuredTurfBookBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionCardBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  actionCardBody: {
    marginVertical: Spacing.sm,
  },
  actionCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'HankenGrotesk_700Bold',
    marginBottom: 2,
  },
  actionCardDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10.5,
    lineHeight: 14,
  },
  actionCardBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
});
