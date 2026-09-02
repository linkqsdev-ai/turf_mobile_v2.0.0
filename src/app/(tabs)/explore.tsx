import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { CoinTossModal } from '@/components/coin-toss-modal';
import { PromoBanner, AutoScrollingHorizontalBanners, BANNER_DESIGNS_10 } from '@/components/promo-banner';
import { turfApi } from '@/services/turf-api';

// Dynamic 14-day rolling generator starting from Today
const generateRolling14Days = () => {
  const dates = [];
  const today = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayStr = dayNames[d.getDay()];
    const dateNum = d.getDate().toString().padStart(2, '0');
    const fullDateStr = d.toISOString().split('T')[0];

    dates.push({
      id: fullDateStr,
      day: dayStr,
      date: dateNum,
      fullDate: fullDateStr,
      isToday: i === 0,
      rawDate: d,
    });
  }
  return dates;
};

import { SPORTS_LIST } from '@/constants/sports';
import { useWalletStore, useTurfStore, useOfferStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount } from '@/store/offer-store';
import { cleanLocation } from '@/utils/location';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { walletBalance } = useWalletStore();
  const { ownedTurfs } = useTurfStore();
  const { offers } = useOfferStore();

  const [backendTurfs, setBackendTurfs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTurfs = React.useCallback(async () => {
    try {
      const data = await turfApi.listTurfs();
      if (Array.isArray(data)) {
        setBackendTurfs(data);
      }
    } catch (err) {
      console.log('Failed to fetch backend turfs:', err);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTurfs();
    }, [fetchTurfs])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTurfs();
    setRefreshing(false);
  }, [fetchTurfs]);

  const rolling14Days = React.useMemo(() => generateRolling14Days(), []);
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [selectedDate, setSelectedDate] = useState(rolling14Days[0].id);
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

  const handleTurfSelect = (id: string, name: string, offerCode?: string) => {
    router.push({
      pathname: '/details',
      params: { id, name, ...(offerCode ? { coupon: offerCode } : {}) },
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
                source={getAvatarSource(profile.avatarUrl)}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'Sora_500Medium', lineHeight: 18 }}>
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
              style={[styles.iconButton, { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, backgroundColor: theme.primary + '10', borderRadius: 8, height: 32 }]}
              onPress={() => router.push('/wallet')}
            >
              <Ionicons name="wallet-outline" size={16} color={theme.primary} />
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.primary }}>
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
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_500Medium' }}>
                {rolling14Days[0].rawDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.calendarContainer, { paddingVertical: 4 }]}
            >
              {rolling14Days.map((item) => {
                const isActive = item.id === selectedDate;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedDate(item.id)}
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
                        color: isActive ? '#ffffff' : theme.textSecondary,
                        fontFamily: 'Sora_500Medium',
                        fontSize: 9,
                        letterSpacing: 0.3,
                      }}
                    >
                      {item.day}
                    </ThemedText>
                    <ThemedText
                      type="headlineSm"
                      style={{
                        color: isActive ? '#ffffff' : theme.text,
                        fontFamily: 'Sora_500Medium',
                        marginTop: 2,
                        fontSize: 14,
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
                placeholderTextColor="#94a3b8"
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
              {[{ name: 'All', icon: 'apps', color: theme.primary }, ...SPORTS_LIST].map((sport) => {
                const isActive = sport.name === selectedSport;
                return (
                  <Pressable
                    key={sport.name}
                    onPress={() => setSelectedSport(sport.name)}
                    style={[
                      styles.filterChip,
                      { backgroundColor: theme.surfaceLow, borderColor: isActive ? theme.primary : theme.outlineVariant + '44' },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                  >
                    <MaterialIcons
                      name={sport.icon as any}
                      size={13}
                      color={isActive ? '#ffffff' : theme.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <ThemedText
                      type="labelMd"
                      style={{
                        color: isActive ? '#ffffff' : theme.text,
                        fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_600SemiBold',
                        fontSize: 10.5,
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
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

            {/* Offers & Gift Vouchers */}
            <View style={[styles.section, { paddingHorizontal: 0 }]}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 8, letterSpacing: 0.5 }}>
                SPECIAL DEALS & VOUCHERS
              </ThemedText>
              <AutoScrollingHorizontalBanners
                cardWidth={310}
                gap={14}
                banners={[
                  BANNER_DESIGNS_10.EXPLORE_YOUR_WORLD(() => router.push('/booking')),
                  BANNER_DESIGNS_10.SALE_50_OFF_TURF(() => router.push('/booking')),
                  BANNER_DESIGNS_10.STUDENT_YOUTH_PASS(() => router.push('/booking')),
                  BANNER_DESIGNS_10.MIDNIGHT_MADNESS_SLOTS(() => router.push('/booking')),
                  BANNER_DESIGNS_10.GIFT_GAME_VOUCHER(() => router.push('/wallet')),
                ]}
              />
            </View>

            {/* Turf List */}
            <View style={[styles.section, { gap: 14, paddingBottom: 110 }]}>
              {(() => {
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const currentToday = daysOfWeek[new Date().getDay()];

                const resolveAmenityIcons = (amenitiesObj?: Record<string, boolean>) => {
                  if (!amenitiesObj) return ['flashlight-outline', 'car-outline', 'wifi-outline'];
                  const map: Record<string, string> = {
                    floodlights: 'flashlight-outline',
                    parking: 'car-outline',
                    lockers: 'lock-closed-outline',
                    showers: 'water-outline',
                    bibs: 'shirt-outline',
                    wifi: 'wifi-outline',
                    firstaid: 'medical-outline',
                    canteen: 'cafe-outline',
                  };
                  const active = Object.keys(amenitiesObj).filter(k => amenitiesObj[k] === true).map(k => map[k.toLowerCase()]).filter(Boolean);
                  return active.length > 0 ? active : ['flashlight-outline'];
                };

                const SPORT_TURF_IMAGES: Record<string, string[]> = {
                  cricket: [
                    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80',
                  ],
                  football: [
                    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
                  ],
                  badminton: [
                    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
                  ],
                  basketball: [
                    'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=600&q=80',
                  ],
                  tennis: [
                    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
                  ],
                  volleyball: [
                    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
                  ],
                };

                const BADGE_POOL = ['🆕 JUST ADDED', '💸 BEST VALUE', '🔥 POPULAR', '🏆 PREMIUM', '⭐ 5.0 RATED', '⚡ INSTANT BOOK'];

                const backendFormattedTurfs = (backendTurfs || []).map((t: any, idx: number) => {
                  const todayAvailableCount = t.slots && t.slots.length > 0
                    ? t.slots.filter((s: any) => s.day === currentToday && s.status === 'available').length
                    : 10;

                  const sType = (t.sportType || 'Cricket').toLowerCase();
                  const pool = SPORT_TURF_IMAGES[sType] || SPORT_TURF_IMAGES.cricket;
                  const fallbackImgUrl = pool[idx % pool.length];
                  const turfBadge = BADGE_POOL[idx % BADGE_POOL.length];

                  let resolvedImage: any = { uri: fallbackImgUrl };
                  if (t.thumbnailImage && typeof t.thumbnailImage === 'string' && (t.thumbnailImage.startsWith('http') || t.thumbnailImage.startsWith('file:'))) {
                    resolvedImage = { uri: t.thumbnailImage };
                  } else if (t.images && Array.isArray(t.images) && t.images[0]) {
                    resolvedImage = { uri: t.images[0] };
                  }

                  return {
                    id: t.id,
                    name: t.name,
                    location: cleanLocation(t.address || 'Trichy Zone IV, Tiruchirappalli'),
                    rating: t.rating || 5.0,
                    favCount: (idx + 1) * 3,
                    image: resolvedImage,
                    badge: turfBadge,
                    sport: t.sportType || 'Cricket',
                    surfaceType: t.surfaceType || (sType.includes('cricket') ? 'Astro Turf Pitch' : sType.includes('badminton') ? 'Indoor Woodcourt' : '5G Rubber Infill'),
                    price: t.pricePerSlot || 1000,
                    availableSlots: todayAvailableCount > 0 ? todayAvailableCount : 10,
                    amenitiesIcons: resolveAmenityIcons(t.amenities),
                    createdAt: t.createdAt || new Date().toISOString(),
                  };
                });

                const userFormattedTurfs = (ownedTurfs || []).map((t, idx) => {
                  const todayAvailableCount = t.slots && t.slots.length > 0
                    ? t.slots.filter(s => s.day === currentToday && s.status === 'available').length
                    : 10;

                  const sType = (t.sportType || 'Cricket').toLowerCase();
                  const pool = SPORT_TURF_IMAGES[sType] || SPORT_TURF_IMAGES.cricket;
                  const fallbackImgUrl = pool[idx % pool.length];
                  const turfBadge = BADGE_POOL[idx % BADGE_POOL.length];

                  let resolvedImage: any = { uri: fallbackImgUrl };
                  if (t.thumbnailImage && typeof t.thumbnailImage === 'string' && (t.thumbnailImage.startsWith('http') || t.thumbnailImage.startsWith('file:'))) {
                    resolvedImage = { uri: t.thumbnailImage };
                  } else if ((t as any).images && Array.isArray((t as any).images) && (t as any).images[0]) {
                    resolvedImage = { uri: (t as any).images[0] };
                  }

                  return {
                    id: t.id,
                    name: t.name,
                    location: cleanLocation(t.address || 'Trichy Zone IV, Tiruchirappalli'),
                    rating: t.rating || 5.0,
                    favCount: (idx + 1) * 3,
                    image: resolvedImage,
                    badge: turfBadge,
                    sport: t.sportType || 'Cricket',
                    surfaceType: t.surfaceType || (sType.includes('cricket') ? 'Astro Turf Pitch' : sType.includes('badminton') ? 'Indoor Woodcourt' : '5G Rubber Infill'),
                    price: t.pricePerSlot || 1000,
                    availableSlots: todayAvailableCount > 0 ? todayAvailableCount : 10,
                    amenitiesIcons: resolveAmenityIcons(t.amenities),
                    createdAt: (t as any).createdAt || new Date().toISOString(),
                  };
                });

                const STATIC_TURFS = [
                  {
                    id: 'skyline',
                    name: 'Skyline Arena Elite',
                    location: 'Canary Wharf, East London',
                    rating: 4.9,
                    favCount: 124,
                    image: { uri: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80' },
                    badge: '💸 BEST VALUE',
                    sport: 'Football',
                    surfaceType: '5G Rubber Infill',
                    price: 2500,
                    availableSlots: 8,
                    amenitiesIcons: ['flashlight-outline', 'car-outline', 'wifi-outline'],
                    createdAt: '2025-01-01T00:00:00.000Z',
                  },
                  {
                    id: 'the-grid',
                    name: 'The Grid Sports Complex',
                    location: 'Stratford, London',
                    rating: 4.7,
                    favCount: 89,
                    image: { uri: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80' },
                    badge: '🔥 POPULAR',
                    sport: 'Cricket',
                    surfaceType: 'Astro Turf Pitch',
                    price: 2000,
                    availableSlots: 4,
                    amenitiesIcons: ['flashlight-outline', 'shirt-outline', 'water-outline'],
                    createdAt: '2025-01-02T00:00:00.000Z',
                  },
                  {
                    id: 'lords',
                    name: 'Lord’s Indoor Nets',
                    location: 'St John’s Wood, London',
                    rating: 4.95,
                    favCount: 312,
                    image: { uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80' },
                    badge: '🏆 PREMIUM',
                    sport: 'Cricket',
                    surfaceType: 'Indoor Woodcourt',
                    price: 3500,
                    availableSlots: 2,
                    amenitiesIcons: ['flashlight-outline', 'lock-closed-outline', 'car-outline'],
                    createdAt: '2025-01-03T00:00:00.000Z',
                  },
                  {
                    id: 'wembley',
                    name: 'Wembley Powerleague',
                    location: 'Wembley, London',
                    rating: 4.8,
                    favCount: 205,
                    image: { uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80' },
                    badge: '⭐ 5.0 RATED',
                    sport: 'Football',
                    surfaceType: 'Synthetic Grass',
                    price: 3000,
                    availableSlots: 6,
                    amenitiesIcons: ['flashlight-outline', 'car-outline', 'wifi-outline'],
                    createdAt: '2025-01-04T00:00:00.000Z',
                  },
                ];

                const seenIds = new Set<string>();
                const ALL_TURFS: any[] = [];
                [...backendFormattedTurfs, ...userFormattedTurfs, ...STATIC_TURFS].forEach(t => {
                  if (t && t.id && !seenIds.has(t.id)) {
                    seenIds.add(t.id);
                    ALL_TURFS.push(t);
                  }
                });

                // Sort newest/most recently added turfs to the top
                ALL_TURFS.sort((a, b) => {
                  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.id?.startsWith('turf-') ? parseInt(a.id.replace('turf-', '')) || 0 : 0);
                  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.id?.startsWith('turf-') ? parseInt(b.id.replace('turf-', '')) || 0 : 0);
                  return bTime - aTime;
                });

                const filteredTurfs = ALL_TURFS.filter(t => {
                  const matchesSport = selectedSport === 'All' || t.sport.toLowerCase() === selectedSport.toLowerCase();
                  const matchesQuery = searchQuery.trim() === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.location.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesSport && matchesQuery;
                });

                const renderTurfCard = (turf: any) => {
                  const isFav = !!favorites[turf.id];
                  const turfOffers = getOffersForTurf(turf.name, offers);
                  const activeOffer = turfOffers.find(o => o.appliesTo?.toLowerCase() === turf.name.toLowerCase()) || turfOffers[0];

                  return (
                    <Pressable
                      key={turf.id}
                      onPress={() => handleTurfSelect(turf.id, turf.name, activeOffer?.code)}
                      style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                    >
                      <View style={styles.imageContainer}>
                        <Image
                          source={turf.image}
                          style={styles.turfImage}
                          contentFit="cover"
                          transition={200}
                        />
                        {!!turf.badge && (
                          <View style={styles.cardBadge}>
                            <ThemedText style={styles.cardBadgeText}>{turf.badge}</ThemedText>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardInfo}>
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <ThemedText type="headlineSm" style={[styles.turfTitle, { color: theme.text }]} numberOfLines={1}>
                              {turf.name}
                            </ThemedText>
                            <View style={styles.locationRow}>
                              <Ionicons name="location-outline" size={11} color={theme.textSecondary} style={{ marginRight: 2 }} />
                              <ThemedText type="bodyMd" style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                                {turf.location}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={11} color="#f59e0b" />
                            <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 2, fontSize: 10.5, fontFamily: 'Sora_500Medium' }}>
                              {turf.rating}
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.midInfoRow}>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            {(turf.amenitiesIcons || ['flashlight-outline']).slice(0, 3).map((iconName: any, idx: number) => (
                              <Ionicons key={idx} name={iconName as any} size={12} color={theme.primary} />
                            ))}
                          </View>
                          <View style={styles.slotsPill}>
                            <ThemedText style={styles.slotsPillText}>
                              ⚡ {turf.availableSlots} slots left
                            </ThemedText>
                          </View>
                        </View>

                        {/* Clean Small Offer Text (no badge, no decorative icons) */}
                        {!!activeOffer && (
                          <ThemedText style={{ fontSize: 9, color: '#059669', fontFamily: 'Sora_500Medium', marginTop: 1, marginBottom: 1 }} numberOfLines={1}>
                            {formatDiscount(activeOffer)} · Use code <ThemedText style={{ fontFamily: 'Sora_500Medium', color: '#047857' }}>{activeOffer.code}</ThemedText>
                          </ThemedText>
                        )}

                        <View style={styles.cardActions}>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <ThemedText type="headlineSm" style={{ color: theme.primary, fontSize: 15.5, fontFamily: 'Sora_500Medium' }}>
                              ₹{turf.price}
                            </ThemedText>
                            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>
                              /hr
                            </ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Pressable
                              onPress={() => handleTurfSelect(turf.id, turf.name, activeOffer?.code)}
                              style={[styles.actionButton, { backgroundColor: theme.primary }]}
                            >
                              <ThemedText type="labelMd" style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                                Book Now
                              </ThemedText>
                            </Pressable>
                            <Pressable
                              onPress={() => toggleFavorite(turf.id)}
                              style={[styles.favButton, { backgroundColor: theme.surfaceLow }]}
                            >
                              <Ionicons
                                name={isFav ? 'heart' : 'heart-outline'}
                                size={15}
                                color={isFav ? theme.error : theme.textSecondary}
                              />
                              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 3, fontSize: 10 }}>
                                {turf.favCount}
                              </ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                };

                if (filteredTurfs.length === 0) {
                  return (
                    <View style={{ padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceLowest, borderRadius: BorderRadius.xl, marginVertical: Spacing.md, borderColor: theme.outlineVariant + '33', borderWidth: 1 }}>
                      <Ionicons name="search-outline" size={44} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
                      <ThemedText type="headlineSm" style={{ color: theme.text, textAlign: 'center', fontFamily: 'Sora_500Medium' }}>
                        No {selectedSport} Turfs Found
                      </ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 12, lineHeight: 18 }}>
                        There are currently no {selectedSport} venues listed. Switch filter to All Sports or add a new pitch!
                      </ThemedText>
                      <Pressable
                        onPress={() => setSelectedSport('All')}
                        style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.lg, marginTop: 14 }}
                      >
                        <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_500Medium' }}>Show All Sports</ThemedText>
                      </Pressable>
                    </View>
                  );
                }

                const firstChunk = filteredTurfs.slice(0, 4);
                const remainingChunk = filteredTurfs.slice(4);

                return (
                  <>
                    {firstChunk.map(renderTurfCard)}

                    {/* Tournament Offer Zone — Rendered strictly after 4 cards */}
                    <View style={{ marginVertical: 6, paddingHorizontal: 0, marginLeft: -Spacing.containerMargin, marginRight: -Spacing.containerMargin }}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.containerMargin, marginBottom: 8, letterSpacing: 0.5 }}>
                        TOURNAMENT OFFER ZONE
                      </ThemedText>
                      <AutoScrollingHorizontalBanners
                        cardWidth={305}
                        gap={16}
                        banners={[
                          {
                            title: "Grand Summer Tournament!",
                            subtitle: "Compete in the League & win ₹50,000 + kit gifts!",
                            buttonText: "Register Team",
                            isGradient: true,
                            gradientColors: ['rgba(99, 102, 241, 0.7)', 'rgba(168, 85, 247, 0.9)'],
                            titleColor: '#ffffff',
                            subtitleColor: 'rgba(255, 255, 255, 0.92)',
                            buttonBackgroundColor: '#ffffff',
                            buttonTextColor: '#4f46e5',
                            backgroundImage: require("@/assets/images/illustrations/summer_tournament_banner_bg.png"),
                            onPress: () => router.push('/(tabs)/tournaments'),
                          },
                          {
                            title: "Weekend Champions League",
                            subtitle: "20% OFF Team Registration fees this weekend!",
                            buttonText: "Join Tournament",
                            isGradient: true,
                            gradientColors: ['rgba(245, 158, 11, 0.75)', 'rgba(217, 119, 6, 0.95)'],
                            titleColor: '#ffffff',
                            subtitleColor: 'rgba(255, 255, 255, 0.92)',
                            buttonBackgroundColor: '#ffffff',
                            buttonTextColor: '#d97706',
                            backgroundImage: require("@/assets/images/illustrations/tournament_hero.png"),
                            onPress: () => router.push('/(tabs)/tournaments'),
                          }
                        ]}
                      />
                    </View>

                    {remainingChunk.map(renderTurfCard)}
                  </>
                );
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
    fontFamily: 'Sora_400Regular',
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
    borderRadius: 6,
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
    fontFamily: 'Sora_500Medium',
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
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 148,
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 125,
    height: '100%',
    position: 'relative',
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  turfImage: {
    width: '100%',
    height: '100%',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.3,
  },
  cardOfferBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  cardOfferBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.2,
  },
  cardOfferStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  cardOfferStripText: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    color: '#047857',
    flex: 1,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turfTitle: {
    color: '#111c2c',
    fontSize: 15,
    fontFamily: 'Sora_500Medium',
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    color: '#43474b',
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  midInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  slotsPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotsPillText: {
    color: '#059669',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
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
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 0.2,
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
