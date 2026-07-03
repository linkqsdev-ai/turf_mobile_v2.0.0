import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { CoinTossModal } from '@/components/coin-toss-modal';
import { PromoBanner, AutoScrollingHorizontalBanners } from '@/components/promo-banner';

// Mock Data for Dates
const DATES = [
  { id: '12', day: 'MON', date: '12' },
  { id: '13', day: 'TUE', date: '13' }, // Active initially
  { id: '14', day: 'WED', date: '14' },
  { id: '15', day: 'THU', date: '15' },
  { id: '16', day: 'FRI', date: '16' },
  { id: '17', day: 'SAT', date: '17' },
];

import { SPORTS_LIST } from '@/constants/sports';
import { useWalletStore, useTurfStore } from '@/store/app-store';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { walletBalance } = useWalletStore();
  const { ownedTurfs } = useTurfStore();
  
  const [selectedDate, setSelectedDate] = useState('13');
  const [selectedSport, setSelectedSport] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ 'skyline': false, 'the-grid': false, 'lords': false, 'wembley': false });
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  // Action feedback toasts
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMsg(null));
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTurfSelect = (id: string, name: string) => {
    router.push({
      pathname: '/details',
      params: { id, name },
    });
  };

  return (
    <GradientContainer screenName="explore" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={typeof profile.avatarUrl === 'string' && !/^\d+$/.test(profile.avatarUrl) ? { uri: profile.avatarUrl } : (typeof profile.avatarUrl === 'number' ? profile.avatarUrl : parseInt(profile.avatarUrl, 10))}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
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
            <Pressable 
              style={[styles.iconButton, { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, backgroundColor: theme.primary + '10', borderRadius: 16, height: 32 }]} 
              onPress={() => triggerToast(`Wallet Balance: ₹${walletBalance.toFixed(2)}`)}
            >
              <Image source={require('@/assets/images/illustrations/wallet_blue.png')} style={{ width: 16, height: 16 }} contentFit="contain" />
              <ThemedText style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: theme.primary }}>
                ₹{walletBalance.toFixed(0)}
              </ThemedText>
            </Pressable>
            {/* Temporarily Hidden Network Activity Icon */}
            {/* <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable> */}
            <Pressable style={styles.iconButton} onPress={() => triggerToast('No new notifications')}>
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

      {/* Sticky top Date Selection and Categories Filter Container */}
      <View style={{ backgroundColor: theme.background, borderBottomWidth: 1, borderColor: theme.outlineVariant + '15', paddingBottom: 4 }}>
        
        {/* Compact Calendar Picker Row */}
        <View style={[styles.section, { marginTop: 4, marginBottom: 4 }]}>
          <View style={[styles.sectionHeader, { marginBottom: 2 }]}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              FEBRUARY 2024
            </ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.calendarContainer, { paddingVertical: 4 }]}
          >
            {DATES.map((item) => {
              const isActive = item.date === selectedDate;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedDate(item.date)}
                  style={[
                    styles.calendarDay,
                    isActive
                      ? { backgroundColor: theme.secondaryContainer, borderColor: theme.secondaryContainer }
                      : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                  ]}
                >
                  <ThemedText
                    type="labelSm"
                    style={{
                      color: isActive ? theme.onSecondaryContainer : theme.textSecondary,
                      opacity: isActive ? 0.8 : 1,
                      fontSize: 8.5,
                    }}
                  >
                    {item.day}
                  </ThemedText>
                  <ThemedText
                    type="headlineSm"
                    style={{
                      color: theme.text,
                      fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
                      marginTop: 2,
                      fontSize: 11,
                    }}
                  >
                    {item.date}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Search & Filter Category Row */}
        <View style={[styles.section, { marginTop: 4, marginBottom: 4 }]}>
          <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
            <Ionicons name="search" size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search venues or sports..."
              placeholderTextColor={theme.textSecondary + 'aa'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filtersContainer, { paddingVertical: 4 }]}
            style={{ marginTop: 4 }}
          >
            {[{ name: 'All', icon: 'apps', color: theme.textSecondary }, ...SPORTS_LIST].map((sport) => {
              const isActive = sport.name === selectedSport;
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => setSelectedSport(sport.name)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={12}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <ThemedText
                    type="labelMd"
                    style={{ 
                      color: isActive ? '#ffffff' : theme.textSecondary,
                      fontFamily: 'HankenGrotesk_600SemiBold',
                      fontSize: 10,
                      letterSpacing: 0.2,
                    }}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Booking Hero Banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.containerMargin, paddingTop: Spacing.sm, marginBottom: Spacing.xs }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="headlineLg" style={{ color: theme.text }}>Book a Turf</ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                Find and book the perfect sports turf near you.
              </ThemedText>
            </View>
            <Image
              source={require('@/assets/images/illustrations/booking_hero.png')}
              style={{ width: 100, height: 100 }}
              contentFit="contain"
            />
          </View>

          {/* Offers & Gift Vouchers (Horizontal Card, Auto Scroll, Reduced Width & Gap) */}
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 4, letterSpacing: 0.5 }}>
              SPECIAL DEALS & VOUCHERS
            </ThemedText>
            <AutoScrollingHorizontalBanners 
              cardWidth={270}
              gap={12}
              banners={[
                {
                  title: "Gift a Game to Your Loved Ones",
                  subtitle: "The easiest way to nail a gift for a sports lover",
                  buttonText: "Buy Gift Card",
                  badgeText: "GIFT VOUCHER",
                  backgroundImage: require("@/assets/images/sports/sport_all.png"),
                  buttonBackgroundColor: "#ffffff",
                  buttonTextColor: "#1e3a8a",
                  onPress: () => router.push('/booking'),
                },
                {
                  title: "Summer Turf Festival Offer",
                  subtitle: "Play under the stars. Special discounts after 9PM.",
                  buttonText: "Explore Offers",
                  badgeText: "SPECIAL OFFER",
                  backgroundImage: require("@/assets/images/sports/sport_booking.png"),
                  buttonBackgroundColor: "#a3e635",
                  buttonTextColor: "#064e3b",
                  onPress: () => router.push('/(tabs)/explore'),
                },
                {
                  title: "YAWAH Turf Special Offer",
                  subtitle: "Get flat 30% OFF on all bookings. Code: YAWAHTURF",
                  buttonText: "Book Now",
                  badgeText: "SPECIAL OFFER",
                  backgroundImage: require("@/assets/images/sports/sport_booking.png"),
                  buttonBackgroundColor: "#5D68E8",
                  buttonTextColor: "#ffffff",
                  onPress: () => router.push('/(tabs)/explore'),
                }
              ]}
            />
          </View>
          {/* Turf List */}
          <View style={[styles.section, { gap: 22, paddingBottom: 100 }]}>
            {(() => {
              const STATIC_TURFS = [
                {
                  id: 'skyline',
                  name: 'Skyline Arena Elite',
                  location: 'Canary Wharf, East London',
                  rating: '4.9',
                  price: 25,
                  image: require('@/assets/images/sports/skyline_turf.png'),
                  sports: ['soccer', 'cricket'],
                  amenities: ['shower', 'car', 'wifi'],
                  statusText: '🟢 8 slots left today',
                  favCount: 124,
                  isAi: true,
                },
                {
                  id: 'the-grid',
                  name: 'The Grid Multisport',
                  location: 'Stratford Central',
                  rating: '4.7',
                  price: 18,
                  image: require('@/assets/images/sports/grid_court.png'),
                  sports: ['soccer', 'cricket'],
                  amenities: ['shower', 'coffee', 'hanger'],
                  statusText: '🟢 12 slots left today',
                  favCount: 89,
                  isAi: false,
                },
                {
                  id: 'lords',
                  name: "Lord's View Pavillion",
                  location: "St John's Wood",
                  rating: '4.8',
                  price: 22,
                  image: require('@/assets/images/sports/lords_nets.png'),
                  sports: ['cricket', 'tennis'],
                  amenities: ['car', 'hanger', 'coffee'],
                  statusText: '🟢 4 slots left today',
                  favCount: 210,
                  isAi: false,
                },
                {
                  id: 'wembley',
                  name: 'Wembley Turf Hub',
                  location: 'Wembley Park, London',
                  rating: '4.6',
                  price: 30,
                  image: require('@/assets/images/sports/wembley_stadium_turf.png'),
                  sports: ['soccer'],
                  amenities: ['shower', 'car', 'coffee'],
                  statusText: '🔴 Filling Fast - 2 slots left',
                  favCount: 342,
                  isAi: false,
                }
              ];

              const customTurfs = (ownedTurfs || []).map((t: any) => ({
                id: t.id,
                name: t.name,
                location: t.location,
                rating: '4.5',
                price: t.basePrice || 20,
                image: require('@/assets/images/sports/sport_booking.png'),
                sports: ['soccer', 'cricket'],
                amenities: ['shower', 'car'],
                statusText: '🟢 Slots Available',
                favCount: 10,
                isAi: false,
              }));

              const allTurfs = [...customTurfs, ...STATIC_TURFS];

              return allTurfs.map((turf) => {
                const isFav = !!favorites[turf.id];
                return (
                  <Pressable
                    key={turf.id}
                    onPress={() => handleTurfSelect(turf.id, turf.name)}
                    style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                  >
                    <View style={styles.imageContainer}>
                      {turf.isAi && (
                        <View style={[styles.aiBadge, { backgroundColor: theme.primary }]}>
                          <Ionicons name="sparkles" size={8} color="#ffffff" />
                          <ThemedText style={[styles.aiBadgeText, { color: '#ffffff' }]}>AI</ThemedText>
                        </View>
                      )}
                      <Image
                        source={turf.image}
                        style={styles.turfImage}
                        contentFit="cover"
                      />
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <ThemedText type="headlineSm" style={[styles.turfTitle, { color: theme.text, marginBottom: 2 }]} numberOfLines={1}>
                            {turf.name}
                          </ThemedText>
                          <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                            <ThemedText type="bodyMd" style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                              {turf.location}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={10} color={theme.secondaryContainer} />
                            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 2, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold' }}>{turf.rating}</ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                            {turf.sports.map((sp: string) => (
                              <MaterialCommunityIcons key={sp} name={sp as any} size={12} color={theme.secondary} />
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Extra Details (Icons Only for Amenities) */}
                      <View style={{ marginVertical: 3, gap: 4 }}>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                          {turf.amenities.map((am: string) => (
                            <MaterialCommunityIcons key={am} name={am as any} size={14} color={theme.primary} />
                          ))}
                        </View>
                        <ThemedText style={{ color: turf.statusText.includes('🔴') ? '#d97706' : '#0f9f58', fontSize: 9.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                          {turf.statusText}
                        </ThemedText>
                      </View>

                      <View style={styles.cardActions}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' }}>₹{turf.price}</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>/hr</ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Pressable 
                            onPress={() => handleTurfSelect(turf.id, turf.name)}
                            style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                          >
                            <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontSize: 11, fontFamily: 'HankenGrotesk_700Bold' }}>Book Now</ThemedText>
                          </Pressable>
                          <Pressable 
                            onPress={() => toggleFavorite(turf.id)}
                            style={styles.favButton}
                          >
                            <MaterialCommunityIcons 
                              name={isFav ? 'cards-heart' : 'cards-heart-outline'} 
                              size={16} 
                              color={isFav ? theme.error : theme.textSecondary} 
                            />
                            <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>{turf.favCount}</ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              });
            })()}
          </View>
        </ScrollView>
      </Reanimated.View>
      </SafeAreaView>
      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>{toastMsg}</ThemedText>
        </Animated.View>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  calendarContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  calendarDay: {
    width: 48,
    height: 58,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 38,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    paddingVertical: 0,
    ...({ outlineStyle: 'none' } as any),
  },
  filtersContainer: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
  },
  bannerContainer: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  bannerIllustration: {
    position: 'absolute',
    right: -20,
    top: 0,
    width: '45%',
    height: '100%',
    opacity: 0.25,
  },
  bannerContent: {
    zIndex: 2,
    width: '70%',
  },
  bannerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  bannerBadge: {
    backgroundColor: '#5D68E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.default,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'HankenGrotesk_700Bold',
    marginBottom: Spacing.base,
    lineHeight: 22,
  },
  bannerSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#5D68E8',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  turfCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    height: 154,
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 120,
    height: 154,
    position: 'relative',
  },
  turfImage: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadgeText: {
    fontSize: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turfTitle: {
    color: '#111c2c',
    fontSize: 14,
    fontFamily: 'HankenGrotesk_700Bold',
    lineHeight: 18,
    marginVertical: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#43474b',
    fontSize: 11,
    marginLeft: 2,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButton: {
    height: 28,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  favButton: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
    zIndex: 999,
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
});
