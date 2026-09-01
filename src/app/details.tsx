import React from 'react';
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

  const userTurf = remoteTurf || (ownedTurfs || []).find(t => t.id === params.id);

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
    const list: (string | any)[] = [];
    if (userTurf) {
      if (Array.isArray(userTurf.images) && userTurf.images.length > 0) {
        userTurf.images.forEach((img: any) => {
          const uri = typeof img === 'string' ? img : img?.uri;
          if (uri && !list.includes(uri)) list.push(uri);
        });
      }
      if (userTurf.thumbnailImage && !list.includes(userTurf.thumbnailImage)) {
        list.unshift(userTurf.thumbnailImage);
      }
    }
    if (list.length === 0) {
      if (details.image) list.push(details.image);
    }
    return list;
  }, [userTurf, details.image]);

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

  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [heroCardWidth, setHeroCardWidth] = React.useState(0);
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

  return (
    <GradientContainer screenName="details" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation TopAppBar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={[styles.headerTitle, { fontSize: 14 }]} numberOfLines={1}>
            {details.name}
          </ThemedText>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
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
            {/* Hero Image Section - Interactive Slider */}
            <View style={styles.heroContainer}>
              <View 
                style={[styles.heroCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  if (width > 0) setHeroCardWidth(width);
                }}
              >
                {galleryImages.length > 1 ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      const w = heroCardWidth || 1;
                      const page = Math.round(e.nativeEvent.contentOffset.x / w);
                      setActiveImageIndex(page);
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {galleryImages.map((img, idx) => (
                      <Image
                        key={idx}
                        source={typeof img === 'string' ? { uri: img } : img}
                        style={{ width: heroCardWidth || '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Image 
                    source={typeof galleryImages[0] === 'string' ? { uri: galleryImages[0] } : galleryImages[0] || details.image} 
                    style={styles.heroImage} 
                    contentFit="cover" 
                  />
                )}

                {/* Pagination Dots & Counter when multiple images exist */}
                {galleryImages.length > 1 && (
                  <>
                    <View style={styles.sliderDotsRow}>
                      {galleryImages.map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.sliderDot,
                            idx === activeImageIndex && styles.sliderDotActive,
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.sliderCounterBadge}>
                      <ThemedText style={styles.sliderCounterText}>
                        {activeImageIndex + 1}/{galleryImages.length}
                      </ThemedText>
                    </View>
                  </>
                )}

                {/* Fav Button top right */}
                <Pressable style={[styles.favFab, Shadows.level2]}>
                  <Ionicons name="heart" size={20} color="#ff4757" />
                </Pressable>
              </View>
            </View>

            {/* Title & Metadata */}
            <View style={styles.contentSection}>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <ThemedText type="headlineLg" style={{ color: theme.text, flex: 1, fontFamily: 'Sora_700Bold', fontSize: 18, lineHeight: 25 }}>
                  {details.name}
                </ThemedText>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={theme.secondary} />
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
                  {details.location}
                </ThemedText>
                <View style={[styles.dot, { backgroundColor: theme.outlineVariant }]} />

                <Pressable onPress={() => setReviewsVisible(true)} style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#5D68E8" />
                  <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 4, fontWeight: '700', fontSize: 11 }}>
                    {details.rating}
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, textDecorationLine: 'underline', fontSize: 10 }}>
                    ({details.reviews.split(' ')[0]})
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Bento Quick Stats Grid - Clean Badge-free Design */}
            <View style={styles.bentoGrid}>
              <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Ionicons name="wallet-outline" size={16} color={theme.primary} />
                <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]}>
                  {details.price}
                </ThemedText>
              </View>

              <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <MaterialCommunityIcons name="cricket" size={18} color={theme.primary} />
                <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]} numberOfLines={1}>
                  {details.pitch}
                </ThemedText>
              </View>

              <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Ionicons name="time-outline" size={16} color={theme.primary} />
                <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]}>
                  {details.hours.replace(/\s+/g, '')}
                </ThemedText>
              </View>

              <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                <Ionicons name="people-outline" size={16} color={theme.primary} />
                <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]} numberOfLines={1}>
                  {details.capacity.split(' ')[0]} Plrs
                </ThemedText>
              </View>
            </View>

            {/* About Section */}
            <View style={styles.contentSection}>
              <View style={[styles.cardContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <ThemedText type="headlineSm" style={styles.cardSectionHeader}>
                  About the Venue
                </ThemedText>
                <ThemedText type="bodyLg" style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 13 }}>
                  {details.about}
                </ThemedText>
              </View>
            </View>

            {/* Amenities Section - Clean Chip Badges with Icon + Label */}
            <View style={styles.contentSection}>
              <View style={[styles.cardContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: Spacing.sm }}>
                  <ThemedText type="headlineSm" style={[styles.cardSectionHeader, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0, flexShrink: 1 }]}>
                    Venue Amenities
                  </ThemedText>
                  <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
                    {details.amenities.length} {details.amenities.length === 1 ? 'Feature' : 'Features'}
                  </ThemedText>
                </View>

                {/* Clean inline chips with icon & label */}
                <View style={styles.amenityRow}>
                  {details.amenities.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.amenityPill,
                        {
                          backgroundColor: theme.surfaceLow,
                          borderColor: theme.outlineVariant + '33',
                        },
                      ]}
                    >
                      <Ionicons name={item.icon as any} size={14} color={theme.primary} style={{ marginRight: 6 }} />
                      <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                        {item.title}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Vouchers & Offers Section */}
            {turfOffers.length > 0 && (
              <View style={styles.contentSection}>
                <View style={[styles.cardContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                    <ThemedText type="headlineSm" style={[styles.cardSectionHeader, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                      Vouchers & Offers
                    </ThemedText>
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_700Bold', color: '#10b981' }}>
                      {turfOffers.length} Active {turfOffers.length === 1 ? 'Offer' : 'Offers'}
                    </ThemedText>
                  </View>

                  {turfOffers.map((offer) => {
                    const isVenueSpecific = (offer.appliesTo || '').trim().toLowerCase() === details.name.trim().toLowerCase();
                    const brand = isVenueSpecific ? details.name.toUpperCase() : 'TURF PASS';
                    const discountText = formatDiscount(offer);
                    return (
                      <View key={offer.id} style={styles.kakaoCouponCard}>
                        {/* Serrated Perforated Top Teeth Row */}
                        <View style={styles.kakaoTeethRow}>
                          {Array.from({ length: 18 }).map((_, i) => (
                            <View key={i} style={styles.kakaoTooth} />
                          ))}
                        </View>

                        {/* Main Body: with user-selected banner image or fallback color */}
                        <View style={styles.kakaoPinkBody}>
                          {offer.bannerImage ? (
                            <>
                              <Image
                                source={{ uri: offer.bannerImage }}
                                style={StyleSheet.absoluteFill}
                                contentFit="cover"
                              />
                              <LinearGradient
                                colors={['rgba(255, 30, 112, 0.84)', 'rgba(219, 10, 85, 0.95)']}
                                style={StyleSheet.absoluteFill}
                              />
                            </>
                          ) : null}

                          {/* Subtle Watermark "SALE" */}
                          <ThemedText style={styles.kakaoWatermark}>SALE</ThemedText>

                          {/* Header Row: Brand block on left, Yellow circle on right */}
                          <View style={styles.kakaoHeaderRow}>
                            <View style={styles.kakaoBrandBlock}>
                              <ThemedText style={styles.kakaoBrandTitle} numberOfLines={1}>
                                {brand}
                              </ThemedText>
                              <ThemedText style={styles.kakaoBrandSub}>STYLE</ThemedText>
                              <ThemedText style={styles.kakaoBrandCoupon}>X COUPON</ThemedText>
                              <View style={styles.kakaoBrandLine} />
                            </View>

                            {/* Floating Yellow Circle Badge - Click to Apply */}
                            <Pressable
                              onPress={() => handleBookNow(offer.code)}
                              style={styles.kakaoYellowBadge}
                            >
                              <ThemedText style={styles.kakaoYellowBadgeText}>COUPON</ThemedText>
                              <ThemedText style={styles.kakaoYellowBadgeText}>CLAIM</ThemedText>
                              <Ionicons name="arrow-down" size={13} color="#000000" style={{ marginTop: 1 }} />
                            </Pressable>
                          </View>

                          {/* Center Discount Typography: 20% OFF */}
                          <View style={styles.kakaoDiscountCenter}>
                            <ThemedText style={styles.kakaoBigDiscount}>
                              {discountText.replace(' OFF', '')}
                            </ThemedText>
                            <ThemedText style={styles.kakaoBigOff}>OFF</ThemedText>
                          </View>
                        </View>

                        {/* Bottom Tear-Off Stub (White) */}
                        <View style={styles.kakaoWhiteStub}>
                          <ThemedText style={styles.kakaoStubLabel}>VALIDITY PERIOD</ThemedText>
                          <ThemedText style={styles.kakaoStubDays}>
                            Valid Offer · {offer.maxRedemptions > 0 ? `Limited to 1st ${offer.maxRedemptions} Users` : 'Open for All Users'}
                          </ThemedText>

                          <View style={styles.kakaoStubFooter}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <ThemedText style={styles.kakaoStubCode}>
                                Code: <ThemedText style={{ fontFamily: 'Sora_800ExtraBold', color: '#FF1E70' }}>{offer.code}</ThemedText>
                                {offer.minBooking > 0 ? ` · Min ₹${offer.minBooking}` : ''}
                              </ThemedText>
                              <ThemedText style={styles.kakaoStubDesc} numberOfLines={1}>
                                {offer.description || 'Claim this voucher discount during booking checkout.'}
                              </ThemedText>
                            </View>

                            <Pressable
                              onPress={() => handleBookNow(offer.code)}
                              style={styles.kakaoApplyBtn}
                            >
                              <ThemedText style={styles.kakaoApplyBtnText}>Apply →</ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Location Map Preview */}
            <View style={[styles.contentSection, { paddingBottom: 120 }]}>
              <View style={[styles.cardContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <ThemedText type="headlineSm" style={styles.cardSectionHeader}>
                  Location
                </ThemedText>

                {/* Map Placeholder Card */}
                <Pressable
                  onPress={() => {
                    const query = encodeURIComponent(details.name + ', ' + details.location);
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
                      Alert.alert('Maps Error', 'Could not open Google Maps.');
                    });
                  }}
                  style={styles.mapContainer}
                >
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs7ZFxpDuTY0Y20RzzsmBGxAjht8U5AihgJyskprBmTPKVYrEOab08NWaF-4BFy3UjwPr46PMa9oRy0TqoklyqETyaI3T9xbHvBGj0vyYb99qgZn6w5StHhG9_NAMWkvZiyjhoW9QJ4TVDCuUjWD2x6xrp0HlAaAIVRu2xmLKg6V1CrRxUQiNFhiU_n_PBx9V6T9ZF5x3yGwizSIx_I4x5fTWBozUqBJ77o8N5RyeuxUvrf6uWewzXD86IF4X_G5brMzCocIakM-w' }}
                    style={styles.mapImage}
                    contentFit="cover"
                  />
                  <View style={styles.mapMarkerContainer}>
                    <View style={[styles.mapMarker, { backgroundColor: theme.primaryContainer }]}>
                      <Ionicons name="location" size={24} color="#ffffff" />
                    </View>
                  </View>
                </Pressable>

                <View style={styles.locationFooter}>
                  <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>
                    {details.location.split(',')[0]}
                  </ThemedText>
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                    {details.location.split(',').slice(1).join(',').trim() || details.location}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => {
                    const query = encodeURIComponent(details.name + ', ' + details.location);
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
                      Alert.alert('Maps Error', 'Could not open Google Maps.');
                    });
                  }}
                  style={styles.directionsLink}
                >
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontWeight: '800' }}>
                    Get Directions
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={14} color={theme.secondary} style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Reanimated.View>

        {/* Sticky Action Footer */}
        <View style={[styles.footerActions, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable
            onPress={() => setSessionPickerVisible(true)}
            style={styles.footerInfoCol}
          >
            <ThemedText style={styles.footerSessionLabel}>SELECTED SESSION ▾</ThemedText>
            <ThemedText style={styles.footerSessionDate}>
              {selectedSessionDate}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => handleBookNow()}
            style={[styles.bookButton, { backgroundColor: theme.primaryContainer }, Shadows.level2]}
          >
            <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
              Book Now
            </ThemedText>
          </Pressable>
        </View>

      </SafeAreaView>

      {/* Reviews Modal */}
      <Modal
        visible={reviewsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ fontFamily: 'Sora_700Bold' }}>Customer Reviews</ThemedText>
              <Pressable onPress={() => setReviewsVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Rating Summary & Progress Bar Breakdown */}
            <View style={[styles.ratingSummaryContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <View style={styles.ratingSummaryLeft}>
                <ThemedText style={{ fontSize: 36, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>{details.rating}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={12} color="#5D68E8" />
                  ))}
                </View>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 4 }}>{details.reviews}</ThemedText>
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
                    <ThemedText style={styles.breakdownLabel}>{row.stars}★</ThemedText>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${row.val * 100}%`, backgroundColor: '#5D68E8' }]} />
                    </View>
                    <ThemedText style={styles.breakdownPct}>{row.pct}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Reviews List */}
            <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
              {[
                { stars: 5, user: 'Azarudeen', date: '1 day ago', text: 'Absolutely the best turf in Canary Wharf! Surface is top notch.' },
                { stars: 4, user: 'David L.', date: '3 days ago', text: 'Great pitch and floodlights, but booking slots are hard to get.' },
                { stars: 3, user: 'Sarah M.', date: '1 week ago', text: 'Good court, but locker rooms could be cleaner.' },
                { stars: 2, user: 'James W.', date: '2 weeks ago', text: 'Price is a bit high for off-peak hours.' },
                { stars: 1, user: 'Michael K.', date: '3 weeks ago', text: 'Floodlights failed during our match. Disappointing.' },
              ].map((rev, idx) => (
                <View key={idx} style={[styles.reviewCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                  <View style={styles.reviewHeader}>
                    <View>
                      <ThemedText style={styles.reviewUser}>{rev.user}</ThemedText>
                      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name="star" size={10} color={s <= rev.stars ? '#5D68E8' : '#c3c7cb'} />
                        ))}
                      </View>
                    </View>
                    <ThemedText style={styles.reviewDate}>{rev.date}</ThemedText>
                  </View>
                  <ThemedText style={styles.reviewText}>{rev.text}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Session Picker Modal */}
      <Modal
        visible={sessionPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSessionPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, maxHeight: 350 }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="headlineSm" style={{ fontFamily: 'Sora_700Bold' }}>Select Booking Date</ThemedText>
              <Pressable onPress={() => setSessionPickerVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={{ paddingVertical: Spacing.md }} showsVerticalScrollIndicator={false}>
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
                    style={[
                      styles.sessionOption,
                      {
                        backgroundColor: isSelected ? theme.secondaryContainer : theme.surfaceLowest,
                        borderColor: isSelected ? theme.secondary : theme.outlineVariant + '33'
                      }
                    ]}
                  >
                    <ThemedText
                      type="bodyLg"
                      style={{
                        color: isSelected ? theme.onSecondaryContainer : theme.text,
                        fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium',
                        fontSize: 13,
                      }}
                    >
                      {isToday ? `${dateOption} (Today)` : dateOption}
                    </ThemedText>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={theme.secondary} />
                    )}
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
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    marginHorizontal: Spacing.sm,
  },
  iconButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  heroCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  sliderDotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  sliderDotActive: {
    width: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  sliderCounterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sliderCounterText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
  },
  contentSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
    gap: 10,
  },
  bentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  bentoValue: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
    flex: 1,
  },
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.md,
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSectionHeader: {
    color: '#111c2c',
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
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
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  locationFooter: {
    marginTop: Spacing.md,
  },
  directionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
    paddingTop: Spacing.md,
  },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    paddingHorizontal: Spacing.containerMargin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
    zIndex: 100,
  },
  footerInfoCol: {
    flexDirection: 'column',
  },
  bookButton: {
    width: '60%',
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modals & Enhanced Features styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.premium,
    borderTopRightRadius: BorderRadius.premium,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.containerMargin,
    maxHeight: '80%',
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  closeButton: {
    padding: 4,
  },
  ratingSummaryContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingSummaryLeft: {
    alignItems: 'center',
    flex: 1.2,
  },
  ratingBreakdownRight: {
    flex: 2,
    gap: 4,
    marginLeft: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
    width: 22,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0000000d',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownPct: {
    fontSize: 10,
    color: '#81919c',
    width: 24,
    textAlign: 'right',
  },
  reviewsList: {
    marginTop: Spacing.md,
  },
  reviewCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  reviewUser: {
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
  },
  reviewDate: {
    fontSize: 11,
    color: '#81919c',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#43474b',
  },
  sessionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  sessionOptionText: {
    fontSize: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSessionLabel: {
    color: '#81919c',
    fontSize: 9,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.8,
  },
  footerSessionDate: {
    color: '#111c2c',
    fontSize: 15,
    fontFamily: 'Sora_700Bold',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  favFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // Ticket-style Voucher & Offers
  voucherCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  voucherTopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
  },
  voucherDiscountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  voucherDiscountText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: 0.3,
  },
  voucherBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voucherBrandPillText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.4,
  },
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    overflow: 'hidden',
  },
  ticketNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  ticketDottedLine: {
    flex: 1,
    borderStyle: 'dashed',
    borderBottomWidth: 1.5,
    marginHorizontal: 4,
  },
  ticketNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: -8,
  },
  voucherBody: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  voucherTitle: {
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.2,
  },
  voucherDesc: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },
  voucherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  voucherCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  voucherCodeText: {
    fontSize: 11,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: 0.5,
  },
  voucherMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherMetaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  voucherMetaText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
  },
  voucherApplyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  voucherApplyBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: 'Sora_700Bold',
  },
  // KakaoStyle Trendy Ticket Voucher
  kakaoCouponCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF1E70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    marginVertical: 8,
  },
  kakaoTeethRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FF1E70',
    height: 8,
    overflow: 'hidden',
  },
  kakaoTooth: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f1f5f9',
  },
  kakaoPinkBody: {
    backgroundColor: '#FF1E70',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  kakaoWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    fontSize: 88,
    fontFamily: 'Sora_800ExtraBold',
    color: 'rgba(255, 255, 255, 0.13)',
    letterSpacing: 2,
    transform: [{ rotate: '-12deg' }],
  },
  kakaoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  kakaoBrandBlock: {
    alignItems: 'flex-start',
    maxWidth: '65%',
  },
  kakaoBrandTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    letterSpacing: 0.5,
  },
  kakaoBrandSub: {
    fontSize: 11,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    lineHeight: 13,
  },
  kakaoBrandCoupon: {
    fontSize: 10,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    lineHeight: 12,
  },
  kakaoBrandLine: {
    width: 42,
    height: 2.5,
    backgroundColor: '#18181b',
    marginTop: 3,
  },
  kakaoYellowBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDE00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  kakaoYellowBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    lineHeight: 10.5,
    textAlign: 'center',
  },
  kakaoDiscountCenter: {
    marginTop: 12,
    zIndex: 2,
  },
  kakaoBigDiscount: {
    fontSize: 48,
    fontFamily: 'Sora_800ExtraBold',
    color: '#ffffff',
    lineHeight: 48,
    letterSpacing: -1,
  },
  kakaoBigOff: {
    fontSize: 40,
    fontFamily: 'Sora_800ExtraBold',
    color: '#ffffff',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  kakaoWhiteStub: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  kakaoStubLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_700Bold',
    color: '#FF1E70',
    letterSpacing: 0.4,
  },
  kakaoStubDays: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
    color: '#0f172a',
    marginTop: 2,
  },
  kakaoStubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  kakaoStubCode: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#334155',
  },
  kakaoStubDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 210,
  },
  kakaoApplyBtn: {
    backgroundColor: '#FF1E70',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kakaoApplyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
  },
});
