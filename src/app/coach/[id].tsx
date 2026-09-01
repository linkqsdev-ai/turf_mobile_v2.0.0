import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CoachDetail() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const name      = (params.name as string)      || 'Coach';
  const specialty = (params.specialty as string) || 'Sports Coach';
  const experience= (params.experience as string)|| '5+ yrs experience';
  const trainees  = (params.trainees as string)  || '10';
  const rating    = (params.rating as string)    || '4.5';
  const reviews   = (params.reviews as string)   || '50';
  const rate      = (params.rate as string)      || '₹500/hr';
  const location  = (params.location as string)  || 'India';
  const avatar    = (params.avatar as string)    || '';
  const badge     = (params.badge as string)     || '';

  const [activeTab, setActiveTab] = React.useState<'class' | 'profile'>('class');

  const ratingNum = parseFloat(rating);

  const navigateToBooking = () => router.push({
    pathname: '/book-coach',
    params: {
      id: params.id as string,
      coachName: name,
      coachRate: rate,
      coachAvatar: avatar,
    },
  });

  const navigateToEditClass = () => router.push({
    pathname: '/create-class',
    params: { editId: params.id as string }
  });

  return (
    <GradientContainer screenName="coach" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/coach')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={{ fontFamily: 'Sora_700Bold' }}>Coach Profile</ThemedText>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
            {/* Background accent circle */}
            <View style={styles.heroDecorCircle} />

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Image source={typeof avatar === 'string' && !/^\d+$/.test(avatar) ? { uri: avatar } : (typeof avatar === 'number' ? avatar : parseInt(avatar as string, 10))} style={styles.avatar} contentFit="cover" />
            </View>

            <ThemedText type="headlineMd" style={{ color: '#ffffff', fontFamily: 'Sora_800ExtraBold' }}>
              {name}
            </ThemedText>

            {/* Specialty */}
            <ThemedText type="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 5, fontFamily: 'Sora_600SemiBold' }}>
              {specialty}
            </ThemedText>

            {/* Rating stars */}
            <View style={styles.heroRatingRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <Ionicons
                  key={i}
                  name={i <= Math.floor(ratingNum) ? 'star' : i - 0.5 <= ratingNum ? 'star-half' : 'star-outline'}
                  size={16}
                  color="#fbbf24"
                />
              ))}
              <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', marginLeft: 6 }}>
                {rating}
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: 'rgba(255,255,255,0.75)', marginLeft: 4 }}>
                ({reviews} reviews)
              </ThemedText>
            </View>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
            <View style={styles.statItem}>
              <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>
                {trainees}
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 5 }}>Trainees</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.outlineVariant + '44' }]} />
            <View style={styles.statItem}>
              <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>
                {reviews}
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 5 }}>Reviews</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.outlineVariant + '44' }]} />
            <View style={styles.statItem}>
              <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>
                {rating}⭐
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 5 }}>Rating</ThemedText>
            </View>
          </View>

          {/* Coach Role Owner Banner */}
          {badge === 'OWNER' && (
            <View style={{ backgroundColor: theme.primary + '15', borderColor: theme.primary + '44', borderWidth: 1, padding: 12, borderRadius: BorderRadius.lg, marginTop: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="shield-checkmark" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 12 }}>
                  YOUR PUBLISHED COACH CLASS
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 16 }}>
                You are viewing your own class listing. Tap 'Manage Class' below to edit class info, slots, or fees.
              </ThemedText>
            </View>
          )}

          {/* Segmented Section Switcher Tab */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceLow, padding: 4, borderRadius: BorderRadius.full, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            <Pressable
              onPress={() => setActiveTab('class')}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: activeTab === 'class' ? theme.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Ionicons name="school-outline" size={15} color={activeTab === 'class' ? '#ffffff' : theme.textSecondary} />
              <ThemedText style={{ color: activeTab === 'class' ? '#ffffff' : theme.textSecondary, fontFamily: 'Sora_700Bold', fontSize: 12 }}>
                Class Details
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('profile')}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: activeTab === 'profile' ? theme.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Ionicons name="person-outline" size={15} color={activeTab === 'profile' ? '#ffffff' : theme.textSecondary} />
              <ThemedText style={{ color: activeTab === 'profile' ? '#ffffff' : theme.textSecondary, fontFamily: 'Sora_700Bold', fontSize: 12 }}>
                Coach Credentials
              </ThemedText>
            </Pressable>
          </View>

          {/* TAB 1: CLASS DETAILS VIEW */}
          {activeTab === 'class' ? (
            <>
              {/* Class Overview & Capacity */}
              <View style={[styles.infoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  CLASS OVERVIEW & CAPACITY
                </ThemedText>

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.primary + '18' }]}>
                    <Ionicons name="ribbon-outline" size={16} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Class Type & Target</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_600SemiBold' }}>Regular Coaching • All Age Groups</ThemedText>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
                  <View style={[styles.infoIcon, { backgroundColor: '#10b98118' }]}>
                    <Ionicons name="people-outline" size={16} color="#10b981" />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Batch Capacity</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                      20 Students Max <ThemedText style={{ color: '#10b981', fontSize: 11, fontFamily: 'Sora_700Bold' }}>(5 Seats Left)</ThemedText>
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.secondary + '18' }]}>
                    <Ionicons name="location-outline" size={16} color={theme.secondary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Venue & Turf Location</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_600SemiBold' }}>{location}</ThemedText>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
                  <View style={[styles.infoIcon, { backgroundColor: '#f59e0b18' }]}>
                    <Ionicons name="ribbon-outline" size={16} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Coach Accreditation & Certificate</ThemedText>
                    <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                      🏅 BWF Level 2 Certified • UEFA B License
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Schedule & Timing */}
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  SCHEDULE & SESSION TIMINGS
                </ThemedText>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="calendar" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                    Weekly Batches: Mon, Wed, Fri
                  </ThemedText>
                </View>

                <View style={{ backgroundColor: theme.surfaceLow, padding: 10, borderRadius: BorderRadius.md, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>☀️ Morning Slot:</ThemedText>
                    <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_700Bold', color: theme.text }}>7.00 AM - 9.00 AM</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>🌙 Evening Slot:</ThemedText>
                    <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_700Bold', color: theme.text }}>7.00 PM - 9.00 PM</ThemedText>
                  </View>
                </View>
              </View>

              {/* Inclusions */}
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginBottom: 20 }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  CLASS INCLUSIONS & AMENITIES
                </ThemedText>
                {[
                  'Professional Gear & Balls Provided',
                  'Water & Hydration Station Access',
                  'Locker Room & Shower Facilities',
                  '1-on-1 Performance Progress Reports',
                ].map((inc, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: i > 0 ? 8 : 0 }}>
                    <Ionicons name="checkmark-circle" size={15} color="#10b981" style={{ marginRight: 8 }} />
                    <ThemedText style={{ fontSize: 12, color: theme.text, fontFamily: 'Sora_500Medium' }}>
                      {inc}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          ) : (
            /* TAB 2: COACH CREDENTIALS & PROFILE VIEW */
            <>
              {/* Certifications & Accreditation Card */}
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  CERTIFICATIONS & ACCREDITATIONS
                </ThemedText>
                {[
                  { title: 'Level 2 Certified Professional Coach', org: 'National Sports Academy', year: '2024' },
                  { title: 'Advanced Youth Athletic Development', org: 'ISCA International', year: '2023' },
                  { title: 'First Aid & CPR Certified', org: 'Red Cross Sports Safety', year: '2025' },
                ].map((cert, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: idx > 0 ? 10 : 0 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#10b98118', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: theme.text }}>
                        {cert.title}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>
                        {cert.org} • {cert.year}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              {/* Bio */}
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  ABOUT COACH
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.text, lineHeight: 22 }}>
                  {`${name} is a highly experienced sports coach specializing in ${specialty}. With ${experience} of hands-on coaching, they have mentored ${trainees} active trainees across multiple disciplines, earning a stellar ${rating}-star reputation from ${reviews} verified reviews.\n\nKnown for their personalized training approach, ${name} focuses on technical mastery, mental toughness, and physical conditioning — ensuring every athlete reaches their peak performance.`}
                </ThemedText>
              </View>

              {/* Trainee Testimonial Review Card */}
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  VERIFIED TRAINEE REVIEWS
                </ThemedText>
                <View style={{ backgroundColor: theme.surfaceLow, padding: 12, borderRadius: BorderRadius.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <ThemedText style={{ fontFamily: 'Sora_700Bold', fontSize: 12, color: theme.text }}>
                      Rahul S. (Senior Trainee)
                    </ThemedText>
                    <ThemedText style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'Sora_700Bold' }}>
                      ⭐⭐⭐⭐⭐ 5.0
                    </ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic', lineHeight: 16 }}>
                    "{name}'s training drills completely elevated my game within 3 weeks. Highly disciplined and structured session plans!"
                  </ThemedText>
                </View>
              </View>

              {/* Achievements */}
              <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', marginBottom: 20 }, Shadows.level1]}>
                <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
                  ACHIEVEMENTS
                </ThemedText>
                {[
                  { icon: 'trophy', color: '#f59e0b', text: 'Certified National Level Coach' },
                  { icon: 'medal', color: '#6366f1', text: 'Best Youth Trainer Award 2023' },
                  { icon: 'ribbon', color: '#10b981', text: '95% Trainee Improvement Rate' },
                  { icon: 'star', color: '#f97316', text: 'Featured on Sports India Magazine' },
                ].map((ach, i) => (
                  <View key={i} style={[styles.achRow, i > 0 && { marginTop: Spacing.sm }]}>
                    <View style={[styles.achIcon, { backgroundColor: ach.color + '18' }]}>
                      <Ionicons name={ach.icon as any} size={16} color={ach.color} />
                    </View>
                    <ThemedText type="bodyMd" style={{ color: theme.text, marginLeft: Spacing.md, flex: 1 }}>
                      {ach.text}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}

        </ScrollView>

        {/* Sticky Action Footer */}
        <View style={[styles.stickyFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
          <View style={styles.footerRate}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Session Rate</ThemedText>
            <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'Sora_800ExtraBold' }}>{rate}</ThemedText>
          </View>
          {badge === 'OWNER' ? (
            <Pressable 
              style={[styles.bookBtn, { backgroundColor: theme.primary }]} 
              onPress={navigateToEditClass}
            >
              <Ionicons name="create-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 15 }}>
                Edit Coach Class
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable style={[styles.bookBtn, { backgroundColor: theme.primary }]} onPress={navigateToBooking}>
              <Ionicons name="flash" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 15 }}>
                Book & Pay Now
              </ThemedText>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  backBtn: { padding: 4 },
  shareBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: Spacing.containerMargin, paddingBottom: 120 },
  heroCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecorCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffffff',
    opacity: 0.07,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: Spacing.sm,
    alignSelf: 'stretch',
  },
  infoCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
  },
  achRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerRate: {
    flex: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});

