import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
      { icon: 'flashlight', title: 'Professional Floodlights' },
      { icon: 'shirt', title: 'Bibs & Balls Included' },
      { icon: 'lock-closed', title: 'Secure Locker Rooms' },
      { icon: 'water', title: 'Shower Facilities' },
    ],
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
    about: "High-performance indoor multi-sport hub. Perfect for futsal, basketball, or volleyball. Features sprung timber subflooring, acoustic dampening panels, and championship-grade overhead LED lighting. Fully climate-controlled for year-round sports.",
    amenities: [
      { icon: 'thermometer', title: 'Indoor Heating/AC' },
      { icon: 'lock-closed', title: 'Secure Lockers' },
      { icon: 'basketball', title: 'Equipment Rental' },
      { icon: 'cafe', title: 'Refresher Stations' },
    ],
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
      { icon: 'flashlight', title: 'Professional Floodlights' },
      { icon: 'briefcase', title: 'Premium Equipment Hire' },
      { icon: 'lock-closed', title: 'Secure Locker Rooms' },
      { icon: 'water', title: 'Shower Facilities' },
    ],
  },
};

export default function TurfDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  
  // Resolve venue details or fallback to skyline
  const venueId = params.id && VENUE_DETAILS[params.id] ? params.id : 'skyline';
  const details = VENUE_DETAILS[venueId];

  const handleBookNow = () => {
    router.push({
      pathname: '/booking',
      params: { id: venueId, name: details.name, price: details.price },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation TopAppBar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
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
              
              {/* Overlay Tags */}
              <View style={styles.heroOverlay}>
                <View style={[styles.ratingContainer, Shadows.level2]}>
                  <Ionicons name="star" size={14} color={theme.secondaryContainer} />
                  <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 4, fontWeight: '700' }}>
                    {details.rating}
                  </ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    ({details.reviews.split(' ')[0]})
                  </ThemedText>
                </View>
                <View style={[styles.premiumTag, { backgroundColor: theme.primary }]}>
                  <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '800' }}>
                    PREMIUM TURF
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Title & Metadata */}
          <View style={styles.contentSection}>
            <ThemedText type="headlineLg" style={{ color: theme.text }}>
              {details.name}
            </ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={theme.secondaryContainer} />
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                {details.location}
              </ThemedText>
              <View style={[styles.dot, { backgroundColor: theme.outlineVariant }]} />
              <ThemedText type="labelMd" style={{ color: theme.secondary }}>
                OPEN TODAY
              </ThemedText>
            </View>
          </View>

          {/* Bento Quick Stats Grid */}
          <View style={styles.bentoGrid}>
            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name="cash" size={20} color={theme.primaryContainer} />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, textTransform: 'uppercase', fontSize: 9 }}>
                PRICING
              </ThemedText>
              <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: 2 }}>
                {details.price}
              </ThemedText>
            </View>

            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name="football" size={20} color={theme.primaryContainer} />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, textTransform: 'uppercase', fontSize: 9 }}>
                PITCH TYPE
              </ThemedText>
              <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: 2 }} numberOfLines={1}>
                {details.pitch}
              </ThemedText>
            </View>

            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name="time" size={20} color={theme.primaryContainer} />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, textTransform: 'uppercase', fontSize: 9 }}>
                HOURS
              </ThemedText>
              <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: 2 }}>
                {details.hours.split(' ')[0]} - {details.hours.split(' ')[2]}
              </ThemedText>
            </View>

            <View style={[styles.bentoItem, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.bentoIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name="people" size={20} color={theme.primaryContainer} />
              </View>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, textTransform: 'uppercase', fontSize: 9 }}>
                CAPACITY
              </ThemedText>
              <ThemedText type="headlineSm" style={{ color: theme.text, marginTop: 2 }} numberOfLines={1}>
                {details.capacity.split(' ')[0]} Players
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
                    <Ionicons name={item.icon as any} size={18} color={theme.primary} />
                    <ThemedText type="bodyMd" style={{ marginLeft: 10, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text }}>
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
          <View style={styles.footerInfoCol}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>SELECTED SESSION</ThemedText>
            <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>
              Fri, Oct 24
            </ThemedText>
          </View>
          
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
    </ThemedView>
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
  heroOverlay: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#c4c6cf77',
  },
  premiumTag: {
    backgroundColor: '#001b3d',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  bentoItem: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    gap: Spacing.base,
  },
  bentoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardContainer: {
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
    padding: Spacing.lg,
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSectionHeader: {
    color: '#111c2c',
    fontSize: 16,
    fontFamily: 'HankenGrotesk_700Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  amenitiesGrid: {
    gap: Spacing.sm,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
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
});
