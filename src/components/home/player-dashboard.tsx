import { useMemo } from 'react';
import { StyleSheet, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { getSportIllustration } from '@/constants/sports';
import { VOUCHERS } from '@/constants/vouchers';
import { AutoScrollingHorizontalBanners, type PromoBannerProps } from '@/components/promo-banner';
import { MotionIllustration } from '@/components/motion-illustration';
import {
  StatTile,
  IllustratedTile,
  VoucherTicket,
  SectionHeading,
  FormPill,
  PressCard,
  PulseDot,
} from '@/components/home/dashboard-widgets';
import {
  useBookings,
  useMatchStore,
  useWalletStore,
  useBidStore,
} from '@/store/app-store';

/** Announcement banners — tournament news surfaced at the top of the feed. */
const announcementBanners = (go: (path: any) => void): PromoBannerProps[] => [
  {
    title: 'Grand Summer Tournament!',
    subtitle: 'Register your team, compete in the League and win ₹50,000 + kit gifts!',
    buttonText: 'Register Team',
    isGradient: true,
    gradientColors: ['rgba(0, 200, 120, 0.75)', 'rgba(0, 120, 90, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#00734d',
    backgroundImage: require('@/assets/images/illustrations/summer_tournament_banner_bg.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
  {
    title: 'Weekend Champions League!',
    subtitle: '20% discount on team registrations this weekend. Limited slots!',
    buttonText: 'Join Tournament',
    isGradient: true,
    gradientColors: ['rgba(255, 122, 26, 0.78)', 'rgba(200, 80, 10, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#c8500a',
    backgroundImage: require('@/assets/images/illustrations/tournament_hero.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
  {
    title: 'Night Knockout Super Cup!',
    subtitle: 'Under-the-lights series with trophy and cash prize rewards.',
    buttonText: 'Compete Now',
    isGradient: true,
    gradientColors: ['rgba(59, 158, 255, 0.75)', 'rgba(20, 80, 160, 0.95)'] as [string, string],
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255, 255, 255, 0.95)',
    buttonBackgroundColor: '#ffffff',
    buttonTextColor: '#1450a0',
    backgroundImage: require('@/assets/images/illustrations/tournament_cover.png'),
    onPress: () => go('/(tabs)/tournaments'),
  },
];

/** Illustrated destination tiles — artwork carries the meaning, not the label. */
const QUICK_TILES: {
  title: string;
  subtitle: string;
  art: any;
  tint: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  href: any;
  badge?: string;
}[] = [
  {
    title: 'Book a turf',
    subtitle: 'Nearby pitches, live slots',
    art: require('@/assets/images/illustrations/turf_booking_premium.png'),
    tint: '#00C878',
    icon: 'stadium-variant',
    href: '/(tabs)/explore',
  },
  {
    title: 'Quick match',
    subtitle: 'Spin up a game now',
    art: require('@/assets/images/illustrations/quick_matches_premium.png'),
    tint: '#FFB020',
    icon: 'lightning-bolt',
    href: { pathname: '/(tabs)/matches', params: { tab: 'Quick Match' } },
    badge: 'Fast',
  },
  {
    title: 'Find a coach',
    subtitle: 'Certified local trainers',
    art: require('@/assets/images/illustrations/coaching_class_premium.png'),
    tint: '#3B9EFF',
    icon: 'whistle',
    href: '/(tabs)/coach',
  },
  {
    title: 'Tournaments',
    subtitle: 'Leagues and knockouts',
    art: require('@/assets/images/illustrations/tournament_bracket_premium.png'),
    tint: '#A66BFF',
    icon: 'trophy-variant',
    href: '/(tabs)/tournaments',
  },
];

export function PlayerDashboard({
  refreshing,
  onRefresh,
  onOpenNotifications,
  onOpenCoinToss,
}: {
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpenNotifications?: () => void;
  onOpenCoinToss?: () => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { profile } = useUserProfile();
  const { bookings } = useBookings();
  const { matches, teams } = useMatchStore();
  const { walletBalance } = useWalletStore();
  const { bids } = useBidStore();

  const go = (path: any) => router.push(path);

  // ── Derived widget data ─────────────────────────────────────────────────
  const upcoming = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'pending')
      .filter((b) => {
        const d = new Date(b.date).getTime();
        return Number.isNaN(d) ? true : d >= now - 86400000;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  const nextSession = upcoming[0];

  const completed = useMemo(
    () => matches.filter((m) => m.status === 'completed'),
    [matches],
  );

  const wins = useMemo(
    () =>
      completed.filter((m) =>
        m.homeScore === m.awayScore ? false : m.homeScore > m.awayScore,
      ).length,
    [completed],
  );

  const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

  const activeBids = bids.length;
  const favouriteTeam = useMemo(() => teams.find((x) => x.isFavourite), [teams]);

  /** Last five results — a compact form guide strip. */
  const form = useMemo(() => {
    return completed
      .slice(-5)
      .map((m) =>
        m.homeScore === m.awayScore ? 'D' : m.homeScore > m.awayScore ? 'W' : 'L',
      );
  }, [completed]);

  const heroSport = favouriteTeam?.sport;
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient floodlight wash sitting behind the whole hero band */}
      <LinearGradient
        colors={[theme.primary + '26', theme.primary + '0A', 'transparent']}
        style={styles.ambient}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            ) : undefined
          }
        >
          {/* ── Top App Bar — same structure as the other tab screens:
                 avatar + name / location on the left, notification + coin
                 toss on the right. ─────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.profileIconButton} onPress={() => go('/profile')}>
                <Image
                  source={getAvatarSource(profile.avatarUrl)}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              </Pressable>
              <View style={styles.headerTextGroup}>
                <ThemedText
                  type="bodyMd"
                  style={{ color: theme.text, fontFamily: 'Sora_700Bold', lineHeight: 18 }}
                >
                  {profile.name}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                  <ThemedText
                    type="labelSm"
                    style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}
                  >
                    {getShortLocation(profile.location)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.iconButton}
                onPress={onOpenNotifications}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={onOpenCoinToss}
                accessibilityLabel="Coin toss"
              >
                <Image
                  source={require('@/assets/images/coin_toss_icon.png')}
                  style={{ width: 26, height: 26 }}
                  contentFit="contain"
                />
              </Pressable>
            </View>
          </View>

          {/* ── Hero band with motion illustration ─────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(110).duration(460)} style={styles.section}>
            <View
              style={[
                styles.heroCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <LinearGradient
                colors={[theme.primary + '26', info + '10', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroBody}>
                <View style={styles.heroText}>
                  <View style={[styles.heroBadge, { backgroundColor: theme.primary + '22' }]}>
                    <ThemedText style={[styles.heroBadgeText, { color: theme.primary }]}>
                      {completed.length > 0 ? `${winRate}% WIN RATE` : 'NEW SEASON'}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.heroTitle, { color: theme.text }]}>
                    {nextSession ? 'You are on the sheet' : 'Ready to play?'}
                  </ThemedText>
                  <ThemedText style={[styles.heroSub, { color: theme.textSecondary }]}>
                    {nextSession
                      ? `${upcoming.length} session${upcoming.length > 1 ? 's' : ''} coming up`
                      : 'Book a pitch and get a game going.'}
                  </ThemedText>
                </View>
                <MotionIllustration
                  scenario="home"
                  size={104}
                  glow={[theme.primary + '33', theme.primary + '00']}
                  accents={[
                    { name: 'trending-up', color: theme.primary },
                    { name: 'flame', color: accent },
                    { name: 'star', color: info },
                  ]}
                  accessibilityLabel="Player dashboard illustration"
                />
              </View>
            </View>
          </Reanimated.View>

          {/* ── Stat ribbon ────────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(170).duration(460)} style={styles.statRow}>
            <StatTile label="Played" value={completed.length} icon="tennisball-outline" tint={theme.primary} />
            <StatTile label="Win %" value={winRate} suffix="%" icon="trending-up-outline" tint={success} />
            <StatTile label="Wallet" value={walletBalance} prefix="₹" icon="wallet-outline" tint={accent} />
            <StatTile label="Upcoming" value={upcoming.length} icon="calendar-outline" tint={info} />
          </Reanimated.View>

          {/* ── Next session ───────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(220).duration(460)} style={styles.section}>
            <SectionHeading
              title="Next session"
              action={{ label: 'All bookings', onPress: () => go('/(tabs)/explore') }}
            />
            {nextSession ? (
              <PressCard
                onPress={() => go('/(tabs)/explore')}
                accessibilityLabel={`Next session at ${nextSession.venueName}`}
                style={[
                  styles.sessionCard,
                  { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                  Shadows.level2,
                ]}
              >
                <Image
                  source={getSportIllustration(heroSport)}
                  style={styles.sessionArt}
                  contentFit="contain"
                />
                <LinearGradient
                  colors={[theme.primary + '2A', 'transparent']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.sessionBody}>
                  <View style={styles.sessionTopRow}>
                    <View style={[styles.statusPill, { backgroundColor: theme.primary + '22' }]}>
                      <PulseDot color={theme.primary} size={7} />
                      <ThemedText style={[styles.statusText, { color: theme.primary }]}>
                        {nextSession.status}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.refText, { color: theme.textSecondary }]}>
                      {nextSession.bookingRef}
                    </ThemedText>
                  </View>
                  <View style={{ width: '74%' }}>
                    <ThemedText style={[styles.venueName, { color: theme.text }]} numberOfLines={1}>
                      {nextSession.venueName}
                    </ThemedText>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                        <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                          {nextSession.dayLabel}
                        </ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                        <ThemedText
                          style={[styles.metaText, { color: theme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {nextSession.slots.join(', ')}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </PressCard>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                ]}
              >
                <MotionIllustration
                  scenario="booking"
                  size={86}
                  glow={[theme.primary + '2E', theme.primary + '00']}
                  accessibilityLabel="No bookings yet"
                />
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  No upcoming sessions
                </ThemedText>
                <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
                  Book a turf and it will show up right here.
                </ThemedText>
                <Pressable
                  onPress={() => go('/(tabs)/explore')}
                  style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={styles.emptyBtnText}>Find a turf</ThemedText>
                </Pressable>
              </View>
            )}
          </Reanimated.View>

          {/* ── Announcements ──────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(270).duration(460)} style={styles.sectionBleed}>
            <View style={styles.sectionInset}>
              <SectionHeading title="Tournament announcements" tint={accent} />
            </View>
            <AutoScrollingHorizontalBanners
              cardWidth={310}
              gap={14}
              banners={announcementBanners(go)}
            />
          </Reanimated.View>

          {/* ── Bid match ──────────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(320).duration(460)} style={styles.section}>
            <SectionHeading title="Bid match" tint={accent} />
            <View
              style={[
                styles.bidCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <LinearGradient
                colors={[accent + '2E', accent + '08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Image
                source={require('@/assets/images/illustrations/bid_matches_premium.png')}
                style={styles.bidArt}
                contentFit="contain"
              />
              <View style={styles.bidBody}>
                <View style={{ width: '62%' }}>
                  <View style={styles.bidTitleRow}>
                    <ThemedText style={[styles.bidTitle, { color: theme.text }]}>
                      Challenge a team
                    </ThemedText>
                    {activeBids > 0 ? <PulseDot color={accent} size={8} /> : null}
                  </View>
                  <ThemedText style={[styles.bidSub, { color: theme.textSecondary }]}>
                    Split the pitch cost, stake your coins and settle it on the field.
                  </ThemedText>
                  {activeBids > 0 ? (
                    <View style={[styles.livePill, { backgroundColor: accent + '26' }]}>
                      <ThemedText style={[styles.livePillText, { color: accent }]}>
                        {activeBids} live bid{activeBids > 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <View style={styles.bidActions}>
                  <PressCard
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/matches', params: { tab: 'Bid Match' } })
                    }
                    style={[styles.bidBtn, { backgroundColor: accent }]}
                  >
                    <ThemedText style={styles.bidBtnText}>
                      {activeBids > 0 ? 'View bids' : 'Enter bids'}
                    </ThemedText>
                  </PressCard>
                  <PressCard
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/matches', params: { tab: 'Quick Match' } })
                    }
                    style={[styles.bidBtnGhost, { borderColor: theme.outlineVariant }]}
                  >
                    <ThemedText style={[styles.bidBtnGhostText, { color: theme.text }]}>
                      Quick match
                    </ThemedText>
                  </PressCard>
                </View>
              </View>
            </View>
          </Reanimated.View>

          {/* ── Offers & vouchers ──────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(370).duration(460)} style={styles.sectionBleed}>
            <View style={styles.sectionInset}>
              <SectionHeading
                title="Offers & vouchers"
                action={{ label: 'Wallet', onPress: () => go('/wallet') }}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voucherStrip}
            >
              {VOUCHERS.slice(0, 6).map((v, i) => (
                <VoucherTicket
                  key={v.id}
                  value={v.discountLabel}
                  suffix={v.discountSuffix}
                  title={v.title}
                  brand={v.brand}
                  code={v.code}
                  tint={[theme.primary, accent, info][i % 3]}
                  onPress={() =>
                    router.push({ pathname: '/voucher-redeem', params: { id: v.id } })
                  }
                />
              ))}
            </ScrollView>
          </Reanimated.View>

          {/* ── Jump back in ───────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(420).duration(460)} style={styles.section}>
            <SectionHeading title="Jump back in" tint={info} />
            <View style={styles.tileGrid}>
              {QUICK_TILES.map((tile) => (
                <IllustratedTile
                  key={tile.title}
                  style={styles.gridTile}
                  title={tile.title}
                  subtitle={tile.subtitle}
                  art={tile.art}
                  tint={tile.tint}
                  icon={tile.icon}
                  badge={tile.badge}
                  onPress={() => go(tile.href)}
                />
              ))}
            </View>
          </Reanimated.View>

          {/* ── Form guide ─────────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.delay(470).duration(460)} style={styles.section}>
            <SectionHeading
              title="Your form"
              action={{ label: 'Matches', onPress: () => go('/(tabs)/matches') }}
            />
            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <LinearGradient
                colors={[theme.primary + '1A', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.formBody}>
                <View style={styles.formTopRow}>
                  <View style={[styles.crest, { backgroundColor: theme.primary + '26' }]}>
                    <MaterialCommunityIcons
                      name="shield-star-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.formTitle, { color: theme.text }]} numberOfLines={1}>
                      {favouriteTeam ? favouriteTeam.name : 'Season summary'}
                    </ThemedText>
                    <ThemedText style={[styles.formSub, { color: theme.textSecondary }]}>
                      {completed.length > 0
                        ? `${wins} won of ${completed.length} played`
                        : 'Play a match to start tracking'}
                    </ThemedText>
                  </View>
                  <View style={styles.formPills}>
                    {form.length > 0 ? (
                      form.map((r, i) => <FormPill key={i} result={r} />)
                    ) : (
                      <ThemedText style={[styles.formSub, { color: theme.textSecondary }]}>
                        No results
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.progressBlock}>
                  <View style={styles.progressLabelRow}>
                    <ThemedText style={[styles.formSub, { color: theme.textSecondary }]}>
                      Win rate
                    </ThemedText>
                    <ThemedText style={[styles.progressValue, { color: theme.text }]}>
                      {winRate}%
                    </ThemedText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.surfaceHigh }]}>
                    <Reanimated.View
                      entering={FadeIn.delay(560).duration(700)}
                      style={[
                        styles.progressFill,
                        { width: `${winRate}%`, backgroundColor: theme.primary },
                      ]}
                    />
                  </View>
                </View>

                {favouriteTeam ? (
                  <View style={[styles.recordRow, { borderTopColor: theme.outlineVariant + '33' }]}>
                    {(
                      [
                        { label: 'Won', value: favouriteTeam.wins, tone: success },
                        { label: 'Lost', value: favouriteTeam.losses, tone: '#ef4444' },
                        { label: 'Drawn', value: favouriteTeam.draws, tone: theme.textSecondary },
                      ] as const
                    ).map((s) => (
                      <View key={s.label} style={styles.recordCell}>
                        <ThemedText style={[styles.recordValue, { color: s.tone }]}>
                          {s.value}
                        </ThemedText>
                        <ThemedText style={[styles.recordLabel, { color: theme.textSecondary }]}>
                          {s.label}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          </Reanimated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const GUTTER = Spacing.containerMargin;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', width: '100%' },
  flex: { flex: 1, overflow: 'hidden', width: '100%' },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },
  scrollContent: { paddingBottom: 130, width: '100%', maxWidth: '100%' },

  section: { paddingHorizontal: GUTTER, marginTop: Spacing.lg, width: '100%', maxWidth: '100%' },
  sectionBleed: { marginTop: Spacing.lg, width: '100%', maxWidth: '100%', overflow: 'hidden' },
  sectionInset: { paddingHorizontal: GUTTER, width: '100%' },

  // top app bar — mirrors styles.header/headerLeft/… on the other tab screens
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
    width: '100%',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#5D68E8',
  },
  headerTextGroup: { flexDirection: 'column', justifyContent: 'center' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconButton: { padding: 4 },
  profileIconButton: { padding: 2 },

  // hero
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  heroText: { flex: 1, paddingRight: 8 },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 7,
  },
  heroBadgeText: { fontFamily: 'Sora_700Bold', fontSize: 8.5, letterSpacing: 0.8 },
  heroTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 17 },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 11.5, marginTop: 3, lineHeight: 16 },

  // stats
  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: GUTTER, marginTop: 12 },

  // next session
  sessionCard: { height: 128, borderRadius: BorderRadius.premium, borderWidth: 1, overflow: 'hidden' },
  sessionArt: {
    position: 'absolute',
    right: -18,
    bottom: -14,
    width: 126,
    height: 126,
    opacity: 0.16,
  },
  sessionBody: { flex: 1, justifyContent: 'space-between', padding: Spacing.md },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  refText: { fontFamily: 'Sora_400Regular', fontSize: 10 },
  venueName: { fontFamily: 'Sora_500Medium', fontSize: 15 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { fontFamily: 'Sora_400Regular', fontSize: 10.5 },

  // empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    gap: 4,
  },
  emptyTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 14, marginTop: 4 },
  emptyBody: { fontFamily: 'Sora_400Regular', fontSize: 11.5, textAlign: 'center' },
  emptyBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  emptyBtnText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 12 },

  // bid match
  bidCard: { borderRadius: BorderRadius.premium, borderWidth: 1, overflow: 'hidden' },
  bidArt: { position: 'absolute', right: -20, top: -8, width: 134, height: 134, opacity: 0.9 },
  bidBody: { padding: Spacing.md },
  bidTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bidTitle: { fontFamily: 'Sora_500Medium', fontSize: 15 },
  bidSub: { fontFamily: 'Sora_400Regular', fontSize: 11, marginTop: 3, lineHeight: 15 },
  livePill: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  livePillText: { fontFamily: 'Sora_600SemiBold', fontSize: 9.5 },
  bidActions: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  bidBtn: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidBtnText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  bidBtnGhost: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidBtnGhostText: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },

  // tiles
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridTile: { width: '47.8%' },
  voucherStrip: { gap: 10, paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 2 },

  // form guide
  formCard: { borderRadius: BorderRadius.premium, borderWidth: 1, overflow: 'hidden' },
  formBody: { padding: Spacing.md, gap: 13 },
  formTopRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  crest: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  formTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  formSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  formPills: { flexDirection: 'row', gap: 5 },
  progressBlock: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressValue: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },
  progressTrack: { height: 7, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  recordRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 11 },
  recordCell: { flex: 1, alignItems: 'center' },
  recordValue: { fontFamily: 'Sora_600SemiBold', fontSize: 15 },
  recordLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
