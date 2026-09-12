import React, { useState, useEffect } from 'react';
import { STATIC_TURFS } from '@/constants/turfs';
import { openProfileDrawer } from '@/components/profile-drawer';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { CoinTossModal } from '@/components/coin-toss-modal';
import { PromoBanner, AutoScrollingHorizontalBanners, BANNER_DESIGNS_10 } from '@/components/promo-banner';
import { TicketVoucherCarousel } from '@/components/ticket-voucher-card';
import { turfApi } from '@/services/turf-api';
import { MotionIllustration } from '@/components/motion-illustration';
import { PressCard, PulseDot, SectionHeading } from '@/components/home/dashboard-widgets';

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
import { useWalletStore, useTurfStore, useOfferStore, useBookings } from '@/store/app-store';
import { getOffersForTurf, formatDiscount } from '@/store/offer-store';
import { cleanLocation } from '@/utils/location';
import { computeTurfSlotMetrics } from '@/utils/turf-slot-sync';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { walletBalance } = useWalletStore();
  const { ownedTurfs } = useTurfStore();
  const { offers } = useOfferStore();
  const { bookings } = useBookings();

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
    setVisibleTurfsCount(4);
    await fetchTurfs();
    setRefreshing(false);
  }, [fetchTurfs]);

  // Infinite Scroll Pagination State
  const [visibleTurfsCount, setVisibleTurfsCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const rolling14Days = React.useMemo(() => generateRolling14Days(), []);
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [selectedDate, setSelectedDate] = useState(rolling14Days[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setVisibleTurfsCount(4);
  }, [selectedSport, selectedDate, searchQuery]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 220;
    if (isCloseToBottom && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleTurfsCount((prev) => prev + 4);
        setIsLoadingMore(false);
      }, 300);
    }
  };
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

  // ── Venue feed ────────────────────────────────────────────────────────────
  // Computed up front (it used to live inside the list's render IIFE) so the
  // hero can show live venue and open-slot counts.
  const selectedDateObj = rolling14Days.find(d => d.id === selectedDate)?.rawDate || new Date();

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
    const metrics = computeTurfSlotMetrics(t, selectedDateObj, bookings || []);
    const todayAvailableCount = metrics.totalAvailable;

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
      availableSlots: todayAvailableCount,
      amenitiesIcons: resolveAmenityIcons(t.amenities),
      createdAt: t.createdAt || new Date().toISOString(),
      cashbackEnabled: t.cashbackEnabled,
      cashbackAmount: t.cashbackAmount,
      cashbackType: t.cashbackType,
      cashbackName: t.cashbackName,
      cashbackCode: t.cashbackCode,
    };
  });

  const userFormattedTurfs = (ownedTurfs || []).map((t, idx) => {
    const metrics = computeTurfSlotMetrics(t, selectedDateObj, bookings || []);
    const todayAvailableCount = metrics.totalAvailable;

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
      availableSlots: todayAvailableCount,
      amenitiesIcons: resolveAmenityIcons(t.amenities),
      createdAt: (t as any).createdAt || new Date().toISOString(),
      cashbackEnabled: t.cashbackEnabled,
      cashbackAmount: t.cashbackAmount,
      cashbackType: t.cashbackType,
      cashbackName: t.cashbackName,
      cashbackCode: t.cashbackCode,
    };
  });

  // Shipped venues live in constants/turfs so the tournament venue
  // picker offers the same grounds; availability is added here.
  const STATIC_TURFS_WITH_SLOTS = STATIC_TURFS.map(t => ({
    ...t,
    availableSlots: computeTurfSlotMetrics({ id: t.id, name: t.name }, selectedDateObj, bookings || []).totalAvailable,
  }));

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const ALL_TURFS: any[] = [];
  [...userFormattedTurfs, ...backendFormattedTurfs, ...STATIC_TURFS_WITH_SLOTS].forEach(t => {
    const nameKey = (t?.name || '').trim().toLowerCase();
    if (t && t.id && !seenIds.has(t.id) && (!nameKey || !seenNames.has(nameKey))) {
      seenIds.add(t.id);
      if (nameKey) seenNames.add(nameKey);
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

  // Home-dashboard palette — the same accents the player dashboard tints with.
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';

  const openSlots = filteredTurfs.reduce((sum, t) => sum + (Number(t.availableSlots) || 0), 0);
  const selectedDay = rolling14Days.find(d => d.id === selectedDate);
  const dayLabel = !selectedDay || selectedDay.isToday
    ? 'Today'
    : `${selectedDay.day.charAt(0)}${selectedDay.day.slice(1).toLowerCase()} ${selectedDay.date}`;

  const renderTurfCard = (turf: any) => {
    const isFav = !!favorites[turf.id];
    const turfOffers = getOffersForTurf(turf.name, offers);
    const activeOffer = turfOffers.find(o => o.appliesTo?.toLowerCase() === turf.name.toLowerCase()) || turfOffers[0];
    const hasCashback = Boolean(turf.cashbackEnabled && turf.cashbackAmount && turf.cashbackAmount > 0);

    return (
      <PressCard
        key={turf.id}
        onPress={() => handleTurfSelect(turf.id, turf.name, activeOffer?.code)}
        accessibilityLabel={`${turf.name}, ₹${turf.price} per hour`}
        scaleTo={0.985}
        style={[
          styles.turfCard,
          { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
          Shadows.level1,
        ]}
      >
        <View style={styles.imageContainer}>
          <Image source={turf.image} style={styles.turfImage} contentFit="cover" transition={200} />
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.5)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {!!turf.badge && (
            <View style={styles.cardBadge}>
              <ThemedText style={styles.cardBadgeText} numberOfLines={1}>{turf.badge}</ThemedText>
            </View>
          )}
          <View style={styles.imageRating}>
            <Ionicons name="star" size={9} color="#FBBF24" />
            <ThemedText style={styles.imageRatingText}>{turf.rating}</ThemedText>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View>
            <ThemedText style={[styles.turfTitle, { color: theme.text }]} numberOfLines={1}>
              {turf.name}
            </ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={10.5} color={theme.textSecondary} />
              <ThemedText style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                {turf.location}
              </ThemedText>
            </View>
          </View>

          <View style={styles.tagRow}>
            <View style={[styles.statusPill, { backgroundColor: success + '1A' }]}>
              <Ionicons name="flash" size={9} color={success} />
              <ThemedText style={[styles.statusText, { color: '#047857' }]}>{turf.availableSlots} slots left</ThemedText>
            </View>
            {hasCashback && (
              <View style={[styles.statusPill, { backgroundColor: accent + '1F' }]}>
                <Ionicons name="wallet-outline" size={9} color="#B45309" />
                <ThemedText style={[styles.statusText, { color: '#B45309' }]}>
                  {turf.cashbackType === 'percent' ? `+${turf.cashbackAmount}% Cashback` : `+₹${turf.cashbackAmount} Cashback`}
                </ThemedText>
              </View>
            )}
            <View style={styles.amenityRow}>
              {(turf.amenitiesIcons || ['flashlight-outline']).slice(0, 3).map((iconName: any, idx: number) => (
                <Ionicons key={idx} name={iconName as any} size={11} color={theme.textSecondary} />
              ))}
            </View>
          </View>

          {/* Clean small offer line (no badge, no decorative icons) */}
          {!!activeOffer && (
            <ThemedText style={styles.offerText} numberOfLines={1}>
              {formatDiscount(activeOffer)} · Use code <ThemedText style={styles.offerCode}>{activeOffer.code}</ThemedText>
            </ThemedText>
          )}

          <View style={styles.cardActions}>
            <View style={styles.priceRow}>
              <ThemedText style={[styles.priceText, { color: theme.text }]}>₹{turf.price}</ThemedText>
              <ThemedText style={[styles.priceUnit, { color: theme.textSecondary }]}>/hr</ThemedText>
            </View>
            <View style={styles.actionGroup}>
              <Pressable
                onPress={() => toggleFavorite(turf.id)}
                hitSlop={4}
                style={[styles.favButton, { backgroundColor: isFav ? theme.error + '14' : theme.surfaceLow }]}
              >
                <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={12} color={isFav ? theme.error : theme.textSecondary} />
                <ThemedText style={[styles.favCount, { color: theme.textSecondary }]}>{turf.favCount}</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleTurfSelect(turf.id, turf.name, activeOffer?.code)}
                style={({ pressed }) => [styles.bookButton, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </PressCard>
    );
  };

  const firstChunk = filteredTurfs.slice(0, Math.min(4, visibleTurfsCount));
  const remainingChunk = visibleTurfsCount > 4 ? filteredTurfs.slice(4, visibleTurfsCount) : [];

  return (
    <GradientContainer screenName="explore" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={openProfileDrawer}>
              <Image
                source={getAvatarSource(profile.avatarUrl)}
                style={[styles.headerAvatar, { borderColor: theme.primary }]}
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

        {/* Sticky date selection and category filters */}
        <View style={[styles.stickyBar, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '26' }]}>
          <View style={styles.monthRow}>
            <View style={styles.monthLeft}>
              <View style={[styles.monthRule, { backgroundColor: theme.primary }]} />
              <ThemedText style={[styles.monthLabel, { color: theme.textSecondary }]}>
                {rolling14Days[0].rawDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText style={[styles.monthHint, { color: theme.primary }]}>{dayLabel}</ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContainer}
          >
            {rolling14Days.map((item) => {
              const isActive = item.id === selectedDate;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedDate(item.id)}
                  style={({ pressed }) => [
                    styles.calendarDay,
                    isActive
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' },
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <ThemedText style={[styles.calendarDow, { color: isActive ? 'rgba(255,255,255,0.85)' : theme.textSecondary }]}>
                    {item.day}
                  </ThemedText>
                  <ThemedText style={[styles.calendarDate, { color: isActive ? '#ffffff' : theme.text }]}>
                    {item.date}
                  </ThemedText>
                  <View
                    style={[
                      styles.todayDot,
                      { backgroundColor: item.isToday ? (isActive ? '#ffffff' : theme.primary) : 'transparent' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.searchRow}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}>
              <Ionicons name="search" size={14} color={theme.textSecondary} />
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search venues or sports..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {[{ name: 'All', icon: 'apps', color: theme.primary }, ...SPORTS_LIST].map((sport) => {
              const isActive = sport.name === selectedSport;
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => setSelectedSport(sport.name)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    isActive
                      ? { backgroundColor: theme.primary, borderColor: theme.primary }
                      : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' },
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={12}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                  />
                  <ThemedText style={[styles.filterChipText, { color: isActive ? '#ffffff' : theme.text }]}>
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* ── Hero band with motion illustration ── */}
            <View style={[styles.section, { marginTop: 10 }]}>
              <View style={[styles.heroCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <LinearGradient
                  colors={[theme.primary + '26', success + '10', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroBody}>
                  <View style={styles.heroText}>
                    <View style={[styles.heroBadge, { backgroundColor: success + '1F' }]}>
                      <PulseDot color={success} size={7} />
                      <ThemedText style={[styles.heroBadgeText, { color: '#047857' }]}>
                        {openSlots} SLOTS OPEN · {dayLabel.toUpperCase()}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.heroTitle, { color: theme.text }]}>Book a Turf</ThemedText>
                    <ThemedText style={[styles.heroSub, { color: theme.textSecondary }]}>
                      Find and book the perfect sports turf near you.
                    </ThemedText>
                    <View style={styles.heroMetaRow}>
                      <View style={[styles.metaPill, { backgroundColor: theme.primary + '14' }]}>
                        <Ionicons name="business-outline" size={11} color={theme.primary} />
                        <ThemedText style={[styles.metaPillText, { color: theme.primary }]}>
                          {filteredTurfs.length} venue{filteredTurfs.length === 1 ? '' : 's'}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => router.push('/wallet')}
                        style={[styles.metaPill, { backgroundColor: accent + '1F' }]}
                      >
                        <Ionicons name="wallet-outline" size={11} color="#B45309" />
                        <ThemedText style={[styles.metaPillText, { color: '#B45309' }]}>
                          ₹{Math.round(Number(walletBalance) || 0)}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                  <MotionIllustration
                    scenario="booking"
                    size={92}
                    glow={[theme.primary + '33', theme.primary + '00']}
                    accents={[
                      { name: 'calendar', color: theme.primary },
                      { name: 'flash', color: accent },
                      { name: 'star', color: info },
                    ]}
                    accessibilityLabel="Turf booking illustration"
                  />
                </View>
              </View>
            </View>

            {/* Ticket vouchers */}
            <View style={styles.voucherWrap}>
              <TicketVoucherCarousel title="EXCLUSIVE DEALS & VOUCHERS" />
            </View>

            {/* Offers & gift vouchers */}
            <View style={styles.sectionBleed}>
              <View style={styles.sectionInset}>
                <SectionHeading title="Featured highlights" tint={accent} />
              </View>
              <AutoScrollingHorizontalBanners
                cardWidth={265}
                gap={10}
                banners={[
                  BANNER_DESIGNS_10.EXPLORE_YOUR_WORLD(() => router.push('/booking')),
                  BANNER_DESIGNS_10.SALE_50_OFF_TURF(() => router.push('/booking')),
                  BANNER_DESIGNS_10.STUDENT_YOUTH_PASS(() => router.push('/booking')),
                  BANNER_DESIGNS_10.MIDNIGHT_MADNESS_SLOTS(() => router.push('/booking')),
                  BANNER_DESIGNS_10.GIFT_GAME_VOUCHER(() => router.push('/wallet')),
                ]}
              />
            </View>

            {/* Turf list */}
            <View style={[styles.section, styles.venueSection]}>
              <SectionHeading
                title={selectedSport === 'All' ? 'All venues' : `${selectedSport} venues`}
                tint={theme.primary}
              />

              {filteredTurfs.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '14' }]}>
                    <Ionicons name="search-outline" size={20} color={theme.primary} />
                  </View>
                  <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                    No {selectedSport} Turfs Found
                  </ThemedText>
                  <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
                    There are currently no {selectedSport} venues listed. Switch filter to All Sports or add a new pitch!
                  </ThemedText>
                  <Pressable
                    onPress={() => setSelectedSport('All')}
                    style={({ pressed }) => [styles.emptyBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <ThemedText style={styles.emptyBtnText}>Show All Sports</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {firstChunk.map(renderTurfCard)}

                  {/* Tournament offer zone — rendered strictly after 4 cards */}
                  {visibleTurfsCount >= 4 && (
                    <View style={styles.offerZone}>
                      <View style={styles.sectionInset}>
                        <SectionHeading title="Tournament offer zone" tint={accent} />
                      </View>
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
                  )}

                  {remainingChunk.map(renderTurfCard)}

                  {/* ── Auto-load more indicator / end of turfs list ── */}
                  {filteredTurfs.length > visibleTurfsCount ? (
                    <View style={[styles.loadMore, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <ThemedText style={[styles.loadMoreText, { color: theme.textSecondary }]}>
                        {isLoadingMore ? 'Loading more venues...' : `Scroll to auto-load (${filteredTurfs.length - visibleTurfsCount} remaining)`}
                      </ThemedText>
                    </View>
                  ) : filteredTurfs.length > 4 ? (
                    <ThemedText style={[styles.listEnd, { color: theme.textSecondary }]}>
                      ✓ All {filteredTurfs.length} venues loaded
                    </ThemedText>
                  ) : null}
                </View>
              )}
            </View>
          </ScrollView>
        </Reanimated.View>
      </SafeAreaView>
      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }, Shadows.level2]}>
          <ThemedText style={styles.toastText}>{toastMsg}</ThemedText>
        </Animated.View>
      )}
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </GradientContainer>
  );
}

const GUTTER = Spacing.containerMargin;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // top app bar — mirrors the player home dashboard header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5 },
  headerTextGroup: { flexDirection: 'column', justifyContent: 'center' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconButton: { padding: 4 },
  profileIconButton: { padding: 2 },

  // sticky date + filters
  stickyBar: { borderBottomWidth: 1, paddingTop: 8, paddingBottom: 8, gap: 7 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
  },
  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  monthRule: { width: 3.5, height: 12, borderRadius: 2 },
  monthLabel: { fontFamily: 'Sora_500Medium', fontSize: 9.5, letterSpacing: 0.9 },
  monthHint: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  calendarContainer: { gap: 6, paddingHorizontal: GUTTER, paddingVertical: 1 },
  calendarDay: {
    width: 42,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDow: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.5 },
  calendarDate: { fontFamily: 'Sora_500Medium', fontSize: 14, marginTop: 1 },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  searchRow: { paddingHorizontal: GUTTER },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 36,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    paddingVertical: 0,
    ...({ outlineStyle: 'none' } as any),
    includeFontPadding: false,
  },
  filtersContainer: { gap: 6, paddingHorizontal: GUTTER, paddingVertical: 1 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  scrollContent: { paddingBottom: 40 },
  section: { marginTop: Spacing.lg, paddingHorizontal: GUTTER },
  sectionBleed: { marginTop: Spacing.lg },
  sectionInset: { paddingHorizontal: GUTTER },
  voucherWrap: { marginTop: 6 },

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 7,
  },
  heroBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  heroTitle: { fontFamily: 'Sora_500Medium', fontSize: 15.5 },
  heroSub: { fontFamily: 'Sora_400Regular', fontSize: 11, marginTop: 2, lineHeight: 15 },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  metaPillText: { fontFamily: 'Sora_500Medium', fontSize: 10 },

  // venue list
  venueSection: { paddingBottom: 100 },
  cardList: { gap: 10 },
  turfCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 124,
  },
  imageContainer: { width: 104, backgroundColor: '#1e293b', overflow: 'hidden' },
  turfImage: { width: '100%', height: '100%' },
  cardBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.3,
  },
  imageRating: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  imageRatingText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 9.5 },
  cardInfo: { flex: 1, paddingHorizontal: 10, paddingVertical: 9, justifyContent: 'space-between', gap: 5 },
  turfTitle: { fontFamily: 'Sora_500Medium', fontSize: 13.5, lineHeight: 17 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  locationText: { fontFamily: 'Sora_400Regular', fontSize: 10, flex: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 },
  offerText: { fontFamily: 'Sora_400Regular', fontSize: 9.5, color: '#059669' },
  offerCode: { fontFamily: 'Sora_500Medium', fontSize: 9.5, color: '#047857' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceText: { fontFamily: 'Sora_500Medium', fontSize: 15 },
  priceUnit: { fontFamily: 'Sora_400Regular', fontSize: 10, marginLeft: 2 },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  favButton: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  favCount: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  bookButton: {
    height: 28,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 11 },

  offerZone: { marginVertical: 6, marginHorizontal: -GUTTER },

  // empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    gap: 3,
  },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontFamily: 'Sora_500Medium', fontSize: 13, textAlign: 'center' },
  emptyBody: { fontFamily: 'Sora_400Regular', fontSize: 11, textAlign: 'center', lineHeight: 15 },
  emptyBtn: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999 },
  emptyBtnText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 11 },

  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  loadMoreText: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  listEnd: { fontFamily: 'Sora_400Regular', fontSize: 10, textAlign: 'center', paddingVertical: 8, opacity: 0.7 },

  toastContainer: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 999,
  },
  toastText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 11 },
});
