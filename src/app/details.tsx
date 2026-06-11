import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
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
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  
  // Resolve venue details or fallback to skyline
  const venueId = params.id && VENUE_DETAILS[params.id] ? params.id : 'skyline';
  const details = VENUE_DETAILS[venueId];

  const [reviewsVisible, setReviewsVisible] = React.useState(false);
  const [sessionPickerVisible, setSessionPickerVisible] = React.useState(false);
  const [selectedSessionDate, setSelectedSessionDate] = React.useState('Fri, Oct 24');

  const handleBookNow = () => {
    router.push({
      pathname: '/booking',
      params: { id: venueId, name: details.name, price: details.price, date: selectedSessionDate },
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
          <ThemedText type="headlineSm" style={styles.headerTitle} numberOfLines={1}>
            {details.name}
          </ThemedText>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <View style={[styles.heroCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}>
              <Image source={details.image} style={styles.heroImage} contentFit="cover" />
              
              {/* Premium tag overlayed on top of the image */}
              <View style={styles.heroOverlayTop}>
                <View style={[styles.premiumTag, { backgroundColor: theme.secondaryContainer }]}>
                  <Ionicons name="sparkles" size={10} color={theme.onSecondaryContainer} style={{ marginRight: 4 }} />
                  <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontWeight: '800', fontSize: 9 }}>
                    PREMIUM TURF
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Title & Metadata */}
          <View style={styles.contentSection}>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <ThemedText type="headlineLg" style={{ color: theme.text, flex: 1, fontFamily: 'HankenGrotesk_700Bold' }}>
                {details.name}
              </ThemedText>
              <View style={[styles.sportBadge, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                {details.sportLibrary === 'Ionicons' ? (
                  <Ionicons name={details.sportIcon as any} size={16} color={theme.secondary} />
                ) : (
                  <MaterialCommunityIcons name={details.sportIcon as any} size={16} color={theme.secondary} />
                )}
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.secondary} />
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                {details.location}
              </ThemedText>
              <View style={[styles.dot, { backgroundColor: theme.outlineVariant }]} />
              
              <Pressable onPress={() => setReviewsVisible(true)} style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#feae2c" />
                <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 4, fontWeight: '700' }}>
                  {details.rating}
                </ThemedText>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, textDecorationLine: 'underline' }}>
                  ({details.reviews.split(' ')[0]})
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Bento Quick Stats Grid - Compact Icon-only design */}
          <View style={styles.bentoGrid}>
            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="wallet-outline" size={18} color={theme.secondary} />
              </View>
              <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]}>
                {details.price}
              </ThemedText>
            </View>

            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surfaceLow }]}>
                <MaterialCommunityIcons name="grass" size={18} color={theme.secondary} />
              </View>
              <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]} numberOfLines={1}>
                {details.pitch}
              </ThemedText>
            </View>

            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="time-outline" size={18} color={theme.secondary} />
              </View>
              <ThemedText type="headlineSm" style={[styles.bentoValue, { color: theme.text }]}>
                {details.hours.replace(/\s+/g, '')}
              </ThemedText>
            </View>

            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="people-outline" size={18} color={theme.secondary} />
              </View>
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
              <ThemedText type="bodyLg" style={{ color: theme.textSecondary, lineHeight: 24 }}>
                {details.about}
              </ThemedText>
            </View>
          </View>

          {/* Amenities Section */}
          <View style={styles.contentSection}>
            <View style={[styles.cardContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <ThemedText type="headlineSm" style={styles.cardSectionHeader}>
                Venue Amenities
              </ThemedText>
              <View style={styles.amenitiesGrid}>
                {details.amenities.map((item, idx) => (
                  <View key={idx} style={[styles.amenityRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '1a' }]}>
                    <Ionicons name={item.icon as any} size={15} color={theme.secondary} />
                    <ThemedText type="bodyMd" style={{ marginLeft: 8, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text, fontSize: 12 }} numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Location Map Preview */}
          <View style={[styles.contentSection, { paddingBottom: 120 }]}>
            <View style={[styles.cardContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <ThemedText type="headlineSm" style={styles.cardSectionHeader}>
                Location
              </ThemedText>
              
              {/* Map Placeholder Card using grayscale theme */}
              <View style={styles.mapContainer}>
                {/* Grayscale map image */}
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
              </View>

              <View style={styles.locationFooter}>
                <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>
                  {details.location.split(',')[0]}
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                  {details.location.split(',')[1]}
                </ThemedText>
                
                <Pressable style={styles.directionsLink}>
                  <ThemedText type="labelMd" style={{ color: theme.secondary, fontWeight: '800' }}>
                    Get Directions
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={14} color={theme.secondary} style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
            </View>
          </View>

        </ScrollView>

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
            onPress={handleBookNow}
            style={[styles.bookButton, { backgroundColor: theme.primaryContainer }, Shadows.level2]}
          >
            <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold' }}>
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
              <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Customer Reviews</ThemedText>
              <Pressable onPress={() => setReviewsVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Rating Summary & Progress Bar Breakdown */}
            <View style={[styles.ratingSummaryContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <View style={styles.ratingSummaryLeft}>
                <ThemedText style={{ fontSize: 36, fontFamily: 'HankenGrotesk_800ExtraBold', color: theme.text }}>{details.rating}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={12} color="#feae2c" />
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
                      <View style={[styles.progressBarFill, { width: `${row.val * 100}%`, backgroundColor: '#feae2c' }]} />
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
                          <Ionicons key={s} name="star" size={10} color={s <= rev.stars ? '#feae2c' : '#c3c7cb'} />
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
              <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Select Booking Date</ThemedText>
              <Pressable onPress={() => setSessionPickerVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={{ paddingVertical: Spacing.md }} showsVerticalScrollIndicator={false}>
              {[
                'Fri, Oct 24',
                'Sat, Oct 25',
                'Sun, Oct 26',
                'Mon, Oct 27',
                'Tue, Oct 28',
                'Wed, Oct 29',
                'Thu, Oct 30',
              ].map((dateOption) => {
                const isSelected = dateOption === selectedSessionDate;
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
                      style={[
                        styles.sessionOptionText, 
                        { 
                          color: isSelected ? theme.onSecondaryContainer : theme.text,
                          fontFamily: isSelected ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold'
                        }
                      ]}
                    >
                      {dateOption}
                    </ThemedText>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.onSecondaryContainer} />
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
    fontFamily: 'HankenGrotesk_700Bold',
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
    aspectRatio: 4/3,
    borderRadius: BorderRadius.premium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
  },
  bentoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoValue: {
    fontSize: 12.5,
    fontFamily: 'HankenGrotesk_700Bold',
    flex: 1,
  },
  sportBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  cardContainer: {
    borderRadius: BorderRadius.premium,
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
    fontSize: 15,
    fontFamily: 'HankenGrotesk_700Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    width: '48%',
  },
  mapContainer: {
    height: 160,
    borderRadius: BorderRadius.xl,
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
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontFamily: 'HankenGrotesk_700Bold',
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
  premiumTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroOverlayTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  footerSessionLabel: {
    color: '#81919c',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.8,
  },
  footerSessionDate: {
    color: '#111c2c',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
});
