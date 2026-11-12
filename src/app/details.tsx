import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  Linking,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTurfStore, useOfferStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount } from '@/store/offer-store';
import { turfApi } from '@/services/turf-api';
import { cleanLocation } from '@/utils/location';
import { SectionHeading, VoucherTicket } from '@/components/home/dashboard-widgets';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

// Mock Data lookup for the venues
const VENUE_DETAILS: Record<string, {
  name: string;
  location: string;
  price: string;
  rating: string;
  reviews: string;
  pitch: string;
  hours: string;
  capacity: string;
  image: any;
  about: string;
  amenities: { icon: string; title: string }[];
  sportIcon: string;
  sportLibrary: 'Ionicons' | 'MaterialCommunityIcons';
}> = {
  'skyline': {
    name: 'Skyline Arena Elite',
    location: 'Canary Wharf, East London',
    price: '₹25/hr',
    rating: '4.9',
    reviews: '184 REVIEWS',
    pitch: '5G Rubber Infill',
    hours: '07:00 - 23:00',
    capacity: '14 Players (7v7)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9H8hZV1gCxBOC9fWHjQyhn5ukWJhiNGuP6cNDATeIj2gP6JceuAOrhkqeTXWFS75Y0nw0QANCmhRdo0NYvbdmh4Xrs2itBjykGtZr0Y91KEzjUMyOoM-B-owetUT1u8vwmIZlGJkcKdkgVfU0TIGzuVVlTN3lhwfdg5OWwHMCKOyPJGWWdIKySwofsCUjnq9pJi4WH0BMDAi73A53u0OeKj_Ufmh6V4PVwghrjz5aX16NlvQZLOkQRC51252maP-4ZXwNw3MwVfU',
    about: "London's premier rooftop football venue. Features a state-of-the-art 5G shock-pad rubber infill surface, high-density professional floodlighting, and spectacular views of the Canary Wharf financial district. Perfect for competitive leagues or friendly evening kickabouts.",
    amenities: [
      { icon: 'flashlight-outline', title: 'Floodlights' },
      { icon: 'shirt-outline', title: 'Bibs & Balls' },
      { icon: 'lock-closed-outline', title: 'Secure Lockers' },
      { icon: 'water-outline', title: 'Showers' },
    ],
    sportIcon: 'soccer',
    sportLibrary: 'MaterialCommunityIcons',
  },
  'the-grid': {
    name: 'The Grid Multisport',
    location: 'Stratford Central, London',
    price: '₹18/hr',
    rating: '4.7',
    reviews: '96 REVIEWS',
    pitch: 'Indoor Woodcourt',
    hours: '08:00 - 22:00',
    capacity: '10 Players (5v5)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g',
    about: "High-performance indoor multi-sport hub. Perfect for futsal, basketball, or volleyball. Features sprung timber subflooring, acoustic dampening panels, and championship-grade overhead LED lighting. Fully climate-controlled for year-controlled sports.",
    amenities: [
      { icon: 'thermometer-outline', title: 'Climate Control' },
      { icon: 'lock-closed-outline', title: 'Secure Lockers' },
      { icon: 'basketball-outline', title: 'Gear Rental' },
      { icon: 'cafe-outline', title: 'Refreshments' },
    ],
    sportIcon: 'basketball',
    sportLibrary: 'MaterialCommunityIcons',
  },
  'lords': {
    name: "Lord's View Pavillion",
    location: "St John's Wood, London",
    price: '₹22/hr',
    rating: '4.8',
    reviews: '124 REVIEWS',
    pitch: 'Hybrid Grass Turf',
    hours: '06:00 - 23:00',
    capacity: '22 Players (11v11)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI',
    about: "Experience elite-level cricket at Lord's View Pavillion. Situated in the heart of St John's Wood, our facility provides a professional-grade hybrid surface that replicates international standard bounce and seam. Perfect for competitive matches or focused training sessions under high-intensity floodlights.",
    amenities: [
      { icon: 'flashlight-outline', title: 'Floodlights' },
      { icon: 'briefcase-outline', title: 'Equipment Hire' },
      { icon: 'lock-closed-outline', title: 'Secure Lockers' },
      { icon: 'water-outline', title: 'Showers' },
    ],
    sportIcon: 'cricket',
    sportLibrary: 'MaterialCommunityIcons',
  },
  'wembley': {
    name: 'Wembley Turf Hub',
    location: 'Wembley Park, London',
    price: '₹30/hr',
    rating: '4.6',
    reviews: '84 REVIEWS',
    pitch: '4G Hybrid Turf',
    hours: '08:00 - 24:00',
    capacity: '16 Players (8v8)',
    image: require('@/assets/images/sports/sport_football.png'),
    about: "State-of-the-art hybrid turf pitch located in the shadow of the iconic Wembley Stadium. Features professional-grade artificial grass, advanced shock-absorbent base, and premium LED lighting. Perfect for 8v8 matches, corporate events, and regular league play.",
    amenities: [
      { icon: 'flashlight-outline', title: 'Floodlights' },
      { icon: 'car-outline', title: 'Parking' },
      { icon: 'lock-closed-outline', title: 'Secure Lockers' },
      { icon: 'water-outline', title: 'Showers' },
    ],
    sportIcon: 'soccer',
    sportLibrary: 'MaterialCommunityIcons',
  },
};

export default function TurfDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; coupon?: string }>();
  const { ownedTurfs } = useTurfStore();
  const { offers } = useOfferStore();
  const [remoteTurf, setRemoteTurf] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchTurf = React.useCallback(async () => {
    if (params.id) {
      try {
        const t = await turfApi.getTurfDetails(params.id);
        if (t) setRemoteTurf(t);
      } catch {}
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchTurf();
  }, [fetchTurf]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTurf();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchTurf]);

  const userTurf = remoteTurf || (ownedTurfs || []).find(t => 
    (params.id && t.id === params.id) ||
    (params.name && t.name?.trim().toLowerCase() === params.name.trim().toLowerCase()) ||
    (params.id && t.name?.trim().toLowerCase() === params.id.trim().toLowerCase())
  );

  const AMENITY_MAP: Record<string, { icon: string; title: string }> = {
    floodlights: { icon: 'flashlight-outline', title: 'Floodlights' },
    parking: { icon: 'car-outline', title: 'Free Parking' },
    lockers: { icon: 'lock-closed-outline', title: 'Secure Lockers' },
    showers: { icon: 'water-outline', title: 'Showers & Changing' },
    bibs: { icon: 'shirt-outline', title: 'Bibs & Balls' },
    wifi: { icon: 'wifi-outline', title: 'Free Wi-Fi' },
    firstaid: { icon: 'medical-outline', title: 'First Aid Kit' },
    canteen: { icon: 'cafe-outline', title: 'Refreshments Bar' },
  };

  const resolveUserAmenities = (amenitiesObj?: Record<string, boolean>) => {
    if (!amenitiesObj) {
      return [{ icon: 'flashlight-outline', title: 'Floodlights' }];
    }
    const selectedKeys = Object.keys(amenitiesObj).filter(k => amenitiesObj[k] === true);
    if (selectedKeys.length === 0) {
      return [{ icon: 'checkmark-circle-outline', title: 'Standard Pitch Setup' }];
    }
    return selectedKeys.map(key => AMENITY_MAP[key.toLowerCase()] || { icon: 'checkmark-circle-outline', title: key.charAt(0).toUpperCase() + key.slice(1) });
  };

  const rawLocation = userTurf?.address || (params.id && VENUE_DETAILS[params.id]?.location) || 'Tiruchirappalli, Tamil Nadu';
  const displayLocation = cleanLocation(rawLocation);

  const details = userTurf ? {
    name: userTurf.name,
    location: displayLocation,
    price: `₹${userTurf.pricePerSlot}/slot`,
    rating: `${userTurf.rating || 5.0}`,
    reviews: 'NEW TURF',
    pitch: userTurf.surfaceType || userTurf.sportType || 'Artificial Turf',
    hours: '6 AM – 11 PM',
    capacity: '14 Players',
    image: userTurf.thumbnailImage || (userTurf.images && userTurf.images[0]) || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600',
    about: userTurf.description || `${userTurf.name} is a premier ${userTurf.sportType || 'sports'} arena situated in ${displayLocation}.`,
    amenities: resolveUserAmenities(userTurf.amenities),
    sportIcon: 'soccer',
    sportLibrary: 'MaterialCommunityIcons' as const,
  } : (params.id && VENUE_DETAILS[params.id] ? {
    ...VENUE_DETAILS[params.id],
    location: cleanLocation(VENUE_DETAILS[params.id].location),
  } : {
    ...VENUE_DETAILS['skyline'],
    location: cleanLocation(VENUE_DETAILS['skyline'].location),
  });

  const galleryImages = React.useMemo(() => {
    const list: string[] = [];
    const addImg = (img: any) => {
      if (!img) return;
      const uri = typeof img === 'string' ? img : img?.uri;
      if (typeof uri === 'string' && uri.trim().startsWith('http') && !list.includes(uri.trim())) {
        list.push(uri.trim());
      } else if (typeof uri === 'string' && uri.trim() && !list.includes(uri.trim())) {
        list.push(uri.trim());
      }
    };

    if (userTurf) {
      if (userTurf.thumbnailImage) addImg(userTurf.thumbnailImage);
      if (Array.isArray(userTurf.images)) {
        userTurf.images.forEach(addImg);
      }
    }

    if (params.id && VENUE_DETAILS[params.id]) {
      const v = VENUE_DETAILS[params.id];
      if (v.image) addImg(v.image);
      if (Array.isArray((v as any).images)) {
        (v as any).images.forEach(addImg);
      }
    }

    if (list.length === 0 && details.image) {
      addImg(details.image);
    }

    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600');
    }

    return list;
  }, [userTurf, params.id, details.image]);

  const formatSessionDate = (d: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const availableSessionDates = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      list.push(formatSessionDate(d));
    }
    return list;
  }, []);

  const { width: windowWidth } = useWindowDimensions();
  const bannerScrollRef = useRef<ScrollView>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [heroCardWidth, setHeroCardWidth] = React.useState(0);
  const bannerWidth = heroCardWidth > 0 ? heroCardWidth : Math.max(windowWidth - GUTTER * 2, 280);

  const [reviewsVisible, setReviewsVisible] = React.useState(false);
  const [sessionPickerVisible, setSessionPickerVisible] = React.useState(false);
  const [selectedSessionDate, setSelectedSessionDate] = React.useState<string>(() => {
    return formatSessionDate(new Date());
  });

  const turfOffers = React.useMemo(() => getOffersForTurf(details.name, offers), [details.name, offers]);
  const activeOffer = turfOffers[0];

  const handleBookNow = (couponCode?: string) => {
    const chosenCoupon = couponCode || params.coupon || activeOffer?.code || '';
    router.push({
      pathname: '/booking',
      params: {
        id: params.id || 'skyline',
        name: details.name,
        price: details.price,
        date: selectedSessionDate,
        ...(chosenCoupon ? { coupon: chosenCoupon } : {}),
      },
    });
  };

  // Home-dashboard palette — the same accents the player dashboard tints with.
  const accent = '#F59E0B';
  const info = '#3B82F6';
  const success = '#10B981';
  const pink = '#EC4899';

  const cardSurface = {
    backgroundColor: theme.surfaceLowest,
    borderColor: theme.outlineVariant + '33',
  };

  const openDirections = () => {
    const query = encodeURIComponent(details.name + ', ' + details.location);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert('Maps Error', 'Could not open Google Maps.');
    });
  };

  const infoTiles: { key: string; label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
    { key: 'price', label: 'Price', value: details.price, icon: 'wallet-outline', tint: theme.primary },
    { key: 'pitch', label: 'Surface', value: details.pitch, icon: 'grid-outline', tint: success },
    { key: 'hours', label: 'Hours', value: details.hours.replace(/\s+/g, ''), icon: 'time-outline', tint: accent },
    { key: 'capacity', label: 'Capacity', value: `${details.capacity.split(' ')[0]} Plrs`, icon: 'people-outline', tint: info },
  ];

  return (
    <GradientContainer screenName="details" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation top app bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            hitSlop={6}
            style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={[styles.headerEyebrow, { color: theme.textSecondary }]}>TURF DETAILS</ThemedText>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {details.name}
            </ThemedText>
          </View>
          <Pressable
            hitSlop={6}
            style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
          >
            <Ionicons name="share-outline" size={17} color={theme.text} />
          </Pressable>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* Hero image — interactive slider */}
            <View style={styles.heroContainer}>
              <View
                style={[styles.heroCard, cardSurface, Shadows.level2]}
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  if (width > 0 && width !== heroCardWidth) setHeroCardWidth(width);
                }}
              >
                {galleryImages.length > 1 ? (
                  <ScrollView
                    ref={bannerScrollRef}
                    horizontal
                    pagingEnabled
                    nestedScrollEnabled={true}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={(e) => {
                      const w = bannerWidth || 1;
                      const offsetX = e.nativeEvent.contentOffset.x;
                      const page = Math.round(offsetX / w);
                      if (page !== activeImageIndex && page >= 0 && page < galleryImages.length) {
                        setActiveImageIndex(page);
                      }
                    }}
                    style={{ width: '100%', height: '100%' }}
                    contentContainerStyle={{ flexGrow: 1 }}
                  >
                    {galleryImages.map((img, idx) => (
                      <View key={idx} style={{ width: bannerWidth, height: '100%', overflow: 'hidden' }}>
                        <Image
                          source={typeof img === 'string' ? { uri: img } : img}
                          style={styles.heroImage}
                          contentFit="cover"
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Image
                    source={typeof galleryImages[0] === 'string' ? { uri: galleryImages[0] } : galleryImages[0] || details.image}
                    style={styles.heroImage}
                    contentFit="cover"
                  />
                )}

                <LinearGradient
                  colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(0,0,0,0.5)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                {/* Rating chip — opens the reviews sheet */}
                <Pressable onPress={() => setReviewsVisible(true)} style={styles.ratingChip}>
                  <Ionicons name="star" size={11} color="#FBBF24" />
                  <ThemedText style={styles.ratingChipText}>{details.rating}</ThemedText>
                  <ThemedText style={styles.ratingChipSub}>· {details.reviews.split(' ')[0]}</ThemedText>
                </Pressable>

                {/* Arrow navigation buttons when multiple images exist */}
                {galleryImages.length > 1 && (
                  <>
                    {activeImageIndex > 0 && (
                      <Pressable
                        onPress={() => {
                          const prev = Math.max(0, activeImageIndex - 1);
                          bannerScrollRef.current?.scrollTo({ x: prev * bannerWidth, animated: true });
                          setActiveImageIndex(prev);
                        }}
                        style={[styles.sliderNavBtn, styles.sliderNavLeft]}
                        hitSlop={8}
                        accessibilityLabel="Previous banner image"
                      >
                        <Ionicons name="chevron-back" size={16} color="#ffffff" />
                      </Pressable>
                    )}
                    {activeImageIndex < galleryImages.length - 1 && (
                      <Pressable
                        onPress={() => {
                          const next = Math.min(galleryImages.length - 1, activeImageIndex + 1);
                          bannerScrollRef.current?.scrollTo({ x: next * bannerWidth, animated: true });
                          setActiveImageIndex(next);
                        }}
                        style={[styles.sliderNavBtn, styles.sliderNavRight]}
                        hitSlop={8}
                        accessibilityLabel="Next banner image"
                      >
                        <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                      </Pressable>
                    )}
                  </>
                )}

                {/* Pagination dots & counter when multiple images exist */}
                {galleryImages.length > 1 && (
                  <>
                    <View style={styles.sliderDotsRow}>
                      {galleryImages.map((_, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            bannerScrollRef.current?.scrollTo({ x: idx * bannerWidth, animated: true });
                            setActiveImageIndex(idx);
                          }}
                          hitSlop={6}
                        >
                          <View
                            style={[styles.sliderDot, idx === activeImageIndex && styles.sliderDotActive]}
                          />
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.sliderCounterBadge}>
                      <ThemedText style={styles.sliderCounterText}>
                        {activeImageIndex + 1}/{galleryImages.length}
                      </ThemedText>
                    </View>
                  </>
                )}

                {/* Fav button top right */}
                <Pressable style={[styles.favFab, Shadows.level2]}>
                  <Ionicons name="heart" size={18} color="#ff4757" />
                </Pressable>
              </View>
            </View>

            {/* Title & metadata */}
            <View style={styles.contentSection}>
              <View style={[styles.statusPill, { backgroundColor: theme.primary + '1A' }]}>
                <Ionicons name="shield-checkmark" size={10} color={theme.primary} />
                <ThemedText style={[styles.statusText, { color: theme.primary }]}>{details.reviews}</ThemedText>
              </View>
              <ThemedText style={[styles.title, { color: theme.text }]}>{details.name}</ThemedText>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.locationText, { color: theme.textSecondary }]}>
                  {details.location}
                </ThemedText>
              </View>
            </View>

            {/* Quick facts */}
            <View style={styles.tileGrid}>
              {infoTiles.map((tile) => (
                <View key={tile.key} style={[styles.infoTile, cardSurface, Shadows.level1]}>
                  <View style={[styles.tileRing, { backgroundColor: tile.tint + '1F', borderColor: tile.tint + '45' }]}>
                    <Ionicons name={tile.icon} size={14} color={tile.tint} />
                  </View>
                  <View style={styles.tileText}>
                    <ThemedText style={[styles.tileLabel, { color: theme.textSecondary }]}>{tile.label}</ThemedText>
                    <ThemedText style={[styles.tileValue, { color: theme.text }]} numberOfLines={1}>
                      {tile.value}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {/* About */}
            <View style={styles.contentSection}>
              <SectionHeading title="About the venue" tint={theme.primary} />
              <View style={[styles.card, cardSurface, Shadows.level1]}>
                <ThemedText style={[styles.bodyText, { color: theme.textSecondary }]}>{details.about}</ThemedText>
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.contentSection}>
              <SectionHeading
                title={`Amenities · ${details.amenities.length} ${details.amenities.length === 1 ? 'feature' : 'features'}`}
                tint={success}
              />
              <View style={[styles.card, cardSurface, Shadows.level1]}>
                <View style={styles.amenityRow}>
                  {details.amenities.map((item, idx) => (
                    <View key={idx} style={[styles.amenityPill, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                      <Ionicons name={item.icon as any} size={13} color={theme.primary} />
                      <ThemedText style={[styles.amenityText, { color: theme.text }]}>{item.title}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Vouchers & offers — dashboard voucher tickets */}
            {turfOffers.length > 0 && (
              <View style={styles.sectionBleed}>
                <View style={styles.sectionInset}>
                  <SectionHeading
                    title={`Vouchers & offers · ${turfOffers.length} active`}
                    tint={pink}
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voucherStrip}>
                  {turfOffers.map((offer) => {
                    const isVenueSpecific = (offer.appliesTo || '').trim().toLowerCase() === details.name.trim().toLowerCase();
                    const discountText = formatDiscount(offer);
                    const limits = [
                      offer.minBooking > 0 ? `Min ₹${offer.minBooking}` : null,
                      offer.maxRedemptions > 0 ? `First ${offer.maxRedemptions} users` : 'Open for all',
                    ].filter(Boolean).join(' · ');
                    return (
                      <VoucherTicket
                        key={offer.id}
                        value={discountText.replace(' OFF', '')}
                        suffix="OFF"
                        title={offer.description || (isVenueSpecific ? details.name : 'Turf Pass')}
                        brand={limits}
                        code={offer.code}
                        tint={isVenueSpecific ? pink : info}
                        onPress={() => handleBookNow(offer.code)}
                      />
                    );
                  })}
                </ScrollView>
                <ThemedText style={[styles.voucherHint, { color: theme.textSecondary }]}>
                  Tap a voucher to book with its code applied.
                </ThemedText>
              </View>
            )}

            {/* Location map preview */}
            <View style={[styles.contentSection, { paddingBottom: 120 }]}>
              <SectionHeading title="Location" tint={info} />
              <View style={[styles.card, cardSurface, Shadows.level1]}>
                <Pressable onPress={openDirections} style={[styles.mapContainer, { backgroundColor: theme.surfaceLow }]}>
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs7ZFxpDuTY0Y20RzzsmBGxAjht8U5AihgJyskprBmTPKVYrEOab08NWaF-4BFy3UjwPr46PMa9oRy0TqoklyqETyaI3T9xbHvBGj0vyYb99qgZn6w5StHhG9_NAMWkvZiyjhoW9QJ4TVDCuUjWD2x6xrp0HlAaAIVRu2xmLKg6V1CrRxUQiNFhiU_n_PBx9V6T9ZF5x3yGwizSIx_I4x5fTWBozUqBJ77o8N5RyeuxUvrf6uWewzXD86IF4X_G5brMzCocIakM-w' }}
                    style={styles.mapImage}
                    contentFit="cover"
                  />
                  <View style={styles.mapMarkerContainer}>
                    <View style={[styles.mapMarker, { backgroundColor: theme.primary }]}>
                      <Ionicons name="location" size={20} color="#ffffff" />
                    </View>
                  </View>
                </Pressable>

                <View style={styles.locationFooter}>
                  <View style={[styles.cardIcon, { backgroundColor: info + '1A' }]}>
                    <Ionicons name="navigate-outline" size={14} color={info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                      {details.location.split(',')[0]}
                    </ThemedText>
                    <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {details.location.split(',').slice(1).join(',').trim() || details.location}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={openDirections}
                    style={({ pressed }) => [styles.ghostBtn, { borderColor: theme.primary + '66', opacity: pressed ? 0.8 : 1 }]}
                  >
                    <ThemedText style={[styles.ghostBtnText, { color: theme.primary }]}>Directions</ThemedText>
                    <Ionicons name="arrow-forward" size={12} color={theme.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </Reanimated.View>

        {/* Sticky action footer */}
        <View style={[styles.footerActions, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable
            onPress={() => setSessionPickerVisible(true)}
            style={({ pressed }) => [
              styles.sessionPill,
              { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '40', opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.sessionIcon, { backgroundColor: theme.primary + '1A' }]}>
              <Ionicons name="calendar-outline" size={14} color={theme.primary} />
            </View>
            <View style={styles.sessionText}>
              <ThemedText style={[styles.footerSessionLabel, { color: theme.textSecondary }]}>SESSION</ThemedText>
              <ThemedText style={[styles.footerSessionDate, { color: theme.text }]} numberOfLines={1}>
                {selectedSessionDate}
              </ThemedText>
            </View>
            <Ionicons name="chevron-down" size={13} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => handleBookNow()}
            style={({ pressed }) => [styles.bookButton, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }, Shadows.level2]}
          >
            <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
            <View style={styles.bookButtonIcon}>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Reviews sheet */}
      <Modal
        visible={reviewsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.outlineVariant }]} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.modalEyebrow, { color: theme.textSecondary }]} numberOfLines={1}>
                  {details.name.toUpperCase()}
                </ThemedText>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Customer Reviews</ThemedText>
              </View>
              <Pressable
                onPress={() => setReviewsVisible(false)}
                hitSlop={6}
                style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
              >
                <Ionicons name="close" size={16} color={theme.text} />
              </Pressable>
            </View>

            {/* Rating summary & breakdown */}
            <View style={[styles.ratingSummaryContainer, cardSurface, Shadows.level1]}>
              <View style={styles.ratingSummaryLeft}>
                <ThemedText style={[styles.ratingBig, { color: theme.text }]}>{details.rating}</ThemedText>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={11} color={accent} />
                  ))}
                </View>
                <ThemedText style={[styles.statusText, { color: theme.textSecondary, marginTop: 4 }]}>{details.reviews}</ThemedText>
              </View>

              <View style={styles.ratingBreakdownRight}>
                {[
                  { stars: 5, pct: '88%', val: 0.88 },
                  { stars: 4, pct: '8%', val: 0.08 },
                  { stars: 3, pct: '3%', val: 0.03 },
                  { stars: 2, pct: '1%', val: 0.01 },
                  { stars: 1, pct: '0%', val: 0.0 },
                ].map((row) => (
                  <View key={row.stars} style={styles.breakdownRow}>
                    <ThemedText style={[styles.breakdownLabel, { color: theme.textSecondary }]}>{row.stars}★</ThemedText>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.outlineVariant + '33' }]}>
                      <View style={[styles.progressBarFill, { width: `${row.val * 100}%`, backgroundColor: accent }]} />
                    </View>
                    <ThemedText style={[styles.breakdownPct, { color: theme.textSecondary }]}>{row.pct}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Reviews list */}
            <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
              {[
                { stars: 5, user: 'Azarudeen', date: '1 day ago', text: 'Absolutely the best turf in Canary Wharf! Surface is top notch.' },
                { stars: 4, user: 'David L.', date: '3 days ago', text: 'Great pitch and floodlights, but booking slots are hard to get.' },
                { stars: 3, user: 'Sarah M.', date: '1 week ago', text: 'Good court, but locker rooms could be cleaner.' },
                { stars: 2, user: 'James W.', date: '2 weeks ago', text: 'Price is a bit high for off-peak hours.' },
                { stars: 1, user: 'Michael K.', date: '3 weeks ago', text: 'Floodlights failed during our match. Disappointing.' },
              ].map((rev, idx) => (
                <View key={idx} style={[styles.reviewCard, cardSurface]}>
                  <View style={styles.reviewHeader}>
                    <View style={[styles.reviewAvatar, { backgroundColor: theme.primary + '1A' }]}>
                      <ThemedText style={[styles.reviewAvatarText, { color: theme.primary }]}>{rev.user.charAt(0)}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.reviewUser, { color: theme.text }]}>{rev.user}</ThemedText>
                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name="star" size={9.5} color={s <= rev.stars ? accent : theme.outlineVariant} />
                        ))}
                      </View>
                    </View>
                    <ThemedText style={[styles.reviewDate, { color: theme.textSecondary }]}>{rev.date}</ThemedText>
                  </View>
                  <ThemedText style={[styles.reviewText, { color: theme.textSecondary }]}>{rev.text}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Session picker sheet */}
      <Modal
        visible={sessionPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSessionPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, maxHeight: 420 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.outlineVariant }]} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.modalEyebrow, { color: theme.textSecondary }]}>NEXT 14 DAYS</ThemedText>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Select Booking Date</ThemedText>
              </View>
              <Pressable
                onPress={() => setSessionPickerVisible(false)}
                hitSlop={6}
                style={[styles.roundBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}
              >
                <Ionicons name="close" size={16} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
              {availableSessionDates.map((dateOption, idx) => {
                const isSelected = dateOption === selectedSessionDate;
                const isToday = idx === 0;
                return (
                  <Pressable
                    key={dateOption}
                    onPress={() => {
                      setSelectedSessionDate(dateOption);
                      setSessionPickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.sessionOption,
                      isSelected
                        ? { backgroundColor: theme.primary + '12', borderColor: theme.primary }
                        : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.sessionIcon, { backgroundColor: isSelected ? theme.primary : theme.surfaceLow }]}>
                      <Ionicons name="calendar-outline" size={13} color={isSelected ? '#ffffff' : theme.textSecondary} />
                    </View>
                    <ThemedText style={[styles.sessionOptionText, { color: isSelected ? theme.primary : theme.text }]}>
                      {dateOption}
                    </ThemedText>
                    {isToday && (
                      <View style={[styles.statusPill, { backgroundColor: success + '1A', marginTop: 0 }]}>
                        <ThemedText style={[styles.statusText, { color: '#047857' }]}>Today</ThemedText>
                      </View>
                    )}
                    {isSelected && <Ionicons name="checkmark-circle" size={17} color={theme.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GradientContainer>
  );
}

const GUTTER = Spacing.containerMargin;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: GUTTER,
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.9 },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 13.5, marginTop: 1 },

  scrollContent: { paddingBottom: 40 },

  // hero image
  heroContainer: { paddingHorizontal: GUTTER, marginTop: 12 },
  heroCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxWidth: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  ratingChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ratingChipText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 11 },
  ratingChipSub: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Sora_400Regular', fontSize: 10 },
  sliderDotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sliderDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.45)' },
  sliderDotActive: { width: 16, backgroundColor: '#ffffff' },
  sliderCounterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sliderCounterText: { color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_500Medium' },
  favFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sliderNavBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sliderNavLeft: { left: 10 },
  sliderNavRight: { right: 10 },

  // title block
  contentSection: { marginTop: Spacing.lg, paddingHorizontal: GUTTER },
  sectionBleed: { marginTop: Spacing.lg },
  sectionInset: { paddingHorizontal: GUTTER },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'Sora_500Medium', fontSize: 15, lineHeight: 23, marginTop: 7 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  locationText: { fontFamily: 'Sora_400Regular', fontSize: 11, lineHeight: 15, flexShrink: 1 },

  // quick facts
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: GUTTER,
    marginTop: 12,
  },
  infoTile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
  },
  tileRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { flex: 1, minWidth: 0 },
  tileLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tileValue: { fontFamily: 'Sora_500Medium', fontSize: 12, marginTop: 1 },

  // cards
  card: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: Spacing.md },
  bodyText: { fontFamily: 'Sora_400Regular', fontSize: 11.5, lineHeight: 17 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  cardSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
  },
  amenityText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // vouchers
  voucherStrip: { gap: 10, paddingHorizontal: GUTTER, paddingTop: 2, paddingBottom: 6 },
  voucherHint: { fontFamily: 'Sora_400Regular', fontSize: 10, paddingHorizontal: GUTTER, marginTop: 4 },

  // location
  mapContainer: { height: 150, borderRadius: BorderRadius.premium, overflow: 'hidden' },
  mapImage: { width: '100%', height: '100%', opacity: 0.55 },
  mapMarkerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapMarker: {
    padding: 8,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  locationFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  ghostBtnText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },

  // sticky footer
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    paddingHorizontal: GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
    zIndex: 100,
  },
  sessionPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  sessionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sessionText: { flex: 1, minWidth: 0 },
  footerSessionLabel: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  footerSessionDate: { fontFamily: 'Sora_500Medium', fontSize: 12.5, marginTop: 1 },
  bookButton: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 20,
    paddingRight: 8,
  },
  bookButtonText: { color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13.5 },
  bookButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // sheets
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: Spacing.xl,
    paddingHorizontal: GUTTER,
    maxHeight: '80%',
    ...Shadows.level3,
  },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 10, opacity: 0.6 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10 },
  modalEyebrow: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.9 },
  modalTitle: { fontFamily: 'Sora_500Medium', fontSize: 15.5, marginTop: 1 },
  ratingSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    marginTop: 4,
  },
  ratingSummaryLeft: { alignItems: 'center', flex: 1.1 },
  ratingBig: { fontFamily: 'Sora_500Medium', fontSize: 23, lineHeight: 36 },
  starRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  ratingBreakdownRight: { flex: 2, gap: 5, marginLeft: Spacing.md },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownLabel: { fontSize: 10, fontFamily: 'Sora_500Medium', width: 22 },
  progressBarBg: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 },
  breakdownPct: { fontSize: 10, fontFamily: 'Sora_400Regular', width: 26, textAlign: 'right' },
  reviewsList: { marginTop: 12 },
  reviewCard: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  reviewAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontFamily: 'Sora_500Medium', fontSize: 12 },
  reviewUser: { fontFamily: 'Sora_500Medium', fontSize: 12.5 },
  reviewDate: { fontFamily: 'Sora_400Regular', fontSize: 10 },
  reviewText: { fontFamily: 'Sora_400Regular', fontSize: 11.5, lineHeight: 16 },
  sessionList: { paddingTop: 4 },
  sessionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 7,
  },
  sessionOptionText: { flex: 1, fontFamily: 'Sora_500Medium', fontSize: 12.5 },
});
