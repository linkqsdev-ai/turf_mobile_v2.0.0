import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SPORT_ICON_MAP: Record<string, { icon: string; lib: 'ionicons' | 'mci'; color: string; label: string }> = {
  football:   { icon: 'football',   lib: 'ionicons', color: '#2e7d32', label: 'Football'   },
  cricket:    { icon: 'cricket',    lib: 'mci',      color: '#bf360c', label: 'Cricket'    },
  basketball: { icon: 'basketball', lib: 'ionicons', color: '#e65100', label: 'Basketball' },
  tennis:     { icon: 'tennisball', lib: 'ionicons', color: '#6a1b9a', label: 'Tennis'     },
  badminton:  { icon: 'badminton',  lib: 'mci',      color: '#1565c0', label: 'Badminton'  },
  fitness:    { icon: 'barbell',    lib: 'ionicons', color: '#c62828', label: 'Fitness'    },
  swimming:   { icon: 'water',      lib: 'ionicons', color: '#0277bd', label: 'Swimming'   },
};

function SportChip({ sport }: { sport: string }) {
  const def = SPORT_ICON_MAP[sport];
  if (!def) return null;
  const Icon = def.lib === 'mci'
    ? <MaterialCommunityIcons name={def.icon as any} size={13} color={def.color} />
    : <Ionicons name={def.icon as any} size={13} color={def.color} />;
  return (
    <View style={[styles.sportChip, { backgroundColor: def.color + '18', borderColor: def.color + '44' }]}>
      {Icon}
      <ThemedText type="labelSm" style={{ color: def.color, fontSize: 11, marginLeft: 5, fontFamily: 'HankenGrotesk_600SemiBold' }}>
        {def.label}
      </ThemedText>
    </View>
  );
}

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
  const match     = (params.match as string)     || '';
  const sportsRaw = (params.sports as string)    || 'fitness';
  const avatar    = (params.avatar as string)    || '';
  const badge     = (params.badge as string)     || '';

  const sports = sportsRaw.split(',').filter(Boolean);
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

  return (
    <GradientContainer screenName="coach" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Coach Profile</ThemedText>
          <Pressable style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
            {/* Background accent circle */}
            <View style={styles.heroDecorCircle} />

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
              <View style={[styles.onlineDot, { borderColor: theme.primaryContainer }]} />
            </View>

            {/* Name + Badge */}
            <View style={styles.heroNameRow}>
              <ThemedText type="headlineMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                {name}
              </ThemedText>
              {badge ? (
                <View style={styles.heroBadge}>
                  <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {badge}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {/* Specialty */}
            <ThemedText type="bodySm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
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
              <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', marginLeft: 6 }}>
                {rating}
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: 'rgba(255,255,255,0.65)', marginLeft: 4 }}>
                ({reviews} reviews)
              </ThemedText>
            </View>

            {/* AI Match badge */}
            {match ? (
              <View style={styles.matchBadge}>
                <Ionicons name="flash" size={12} color="#fbbf24" />
                <ThemedText type="labelSm" style={{ color: '#fbbf24', fontFamily: 'PlusJakartaSans_700Bold', marginLeft: 4, fontSize: 11 }}>
                  {match}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: theme.surfaceLowest }, Shadows.level1]}>
            <View style={styles.statItem}>
              <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                {trainees}
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2 }}>Trainees</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.outlineVariant + '44' }]} />
            <View style={styles.statItem}>
              <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                {reviews}
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2 }}>Reviews</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.outlineVariant + '44' }]} />
            <View style={styles.statItem}>
              <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                {rating}⭐
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2 }}>Rating</ThemedText>
            </View>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
              DETAILS
            </ThemedText>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="person-outline" size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Experience</ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_600SemiBold' }}>{experience}</ThemedText>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.secondary + '18' }]}>
                <Ionicons name="location-outline" size={16} color={theme.secondary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Location</ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_600SemiBold' }}>{location}</ThemedText>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
              <View style={[styles.infoIcon, { backgroundColor: '#2e7d3218' }]}>
                <Ionicons name="cash-outline" size={16} color="#2e7d32" />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Session Rate</ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>{rate}</ThemedText>
              </View>
            </View>
          </View>

          {/* Sports */}
          <View style={[styles.sectionCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.md }}>
              SPORTS OFFERED
            </ThemedText>
            <View style={styles.sportsRow}>
              {sports.map(sport => <SportChip key={sport} sport={sport} />)}
            </View>
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

        </ScrollView>

        {/* Sticky Book Button */}
        <View style={[styles.stickyFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
          <View style={styles.footerRate}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Session Rate</ThemedText>
            <ThemedText type="headlineSm" style={{ color: theme.primary, fontFamily: 'HankenGrotesk_800ExtraBold' }}>{rate}</ThemedText>
          </View>
          <Pressable style={[styles.bookBtn, { backgroundColor: theme.primary }]} onPress={navigateToBooking}>
            <Ionicons name="calendar-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>
              Book a Session
            </ThemedText>
          </Pressable>
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
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    borderWidth: 3,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
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
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
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

