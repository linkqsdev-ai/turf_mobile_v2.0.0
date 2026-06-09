import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mock Sports Categories
const CATEGORIES = [
  { id: 'football', name: 'Football', icon: 'football' },
  { id: 'cricket', name: 'Cricket', icon: 'fitness' },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'futsal', name: 'Futsal', icon: 'shirt-outline' },
];

// Mock Venues Data
const TRENDING_VENUES = [
  { id: 'skyline', name: 'Skyline Arena Elite', location: 'Canary Wharf, London', price: '$25', rating: '4.9', distance: '1.2 miles', image: require('@/assets/images/illustrations/stadium.png'), sport: 'FOOTBALL' },
  { id: 'lords', name: "Lord's View Pavillion", location: "St John's Wood, London", price: '$22', rating: '4.8', distance: '2.5 miles', image: require('@/assets/images/illustrations/cricket_player.png'), sport: 'CRICKET' },
  { id: 'the-grid', name: 'The Grid Multisport', location: 'Stratford Central, London', price: '$18', rating: '4.7', distance: '3.4 miles', image: require('@/assets/images/illustrations/football_player.png'), sport: 'MULTI-SPORT' },
];

export default function ExploreTab() {
  const theme = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('football');

  const handleVenueClick = (id: string, name: string) => {
    router.push({
      pathname: '/details',
      params: { id, name },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable style={styles.locationSelector}>
            <Ionicons name="location" size={16} color={theme.secondary} />
            <ThemedText type="labelMd" style={{ color: theme.secondary, marginLeft: 4 }}>
              London, UK
            </ThemedText>
            <Ionicons name="chevron-down" size={12} color={theme.secondary} style={{ marginLeft: 2 }} />
          </Pressable>
          <ThemedText type="displayLgMobile" style={styles.headerTitle}>
            SPORTS OS
          </ThemedText>
          <Pressable style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color={theme.secondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Search bar */}
          <View style={styles.section}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search venues, sports, or regions..."
                placeholderTextColor={theme.textSecondary + 'aa'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable style={styles.filterButton}>
                <Ionicons name="options-outline" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Horizontal Categories */}
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {CATEGORIES.map(category => {
                const isActive = category.id === selectedCategory;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[
                      styles.categoryTab,
                      isActive
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '1a' },
                    ]}
                  >
                    <Ionicons name={category.icon as any} size={16} color={isActive ? '#ffffff' : theme.textSecondary} />
                    <ThemedText type="labelMd" style={{ color: isActive ? '#ffffff' : theme.textSecondary, marginLeft: 6 }}>
                      {category.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Map View Promo Card */}
          <View style={styles.section}>
            <View style={[styles.mapPromoCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs7ZFxpDuTY0Y20RzzsmBGxAjht8U5AihgJyskprBmTPKVYrEOab08NWaF-4BFy3UjwPr46PMa9oRy0TqoklyqETyaI3T9xbHvBGj0vyYb99qgZn6w5StHhG9_NAMWkvZiyjhoW9QJ4TVDCuUjWD2x6xrp0HlAaAIVRu2xmLKg6V1CrRxUQiNFhiU_n_PBx9V6T9ZF5x3yGwizSIx_I4x5fTWBozUqBJ77o8N5RyeuxUvrf6uWewzXD86IF4X_G5brMzCocIakM-w' }}
                style={styles.mapImage}
                contentFit="cover"
              />
              <View style={styles.mapPromoOverlay}>
                <View style={[styles.mapPromoBadge, { backgroundColor: theme.primaryContainer }]}>
                  <Ionicons name="map" size={14} color="#ffffff" />
                  <ThemedText type="labelSm" style={{ color: '#ffffff', marginLeft: 4, fontWeight: '700' }}>
                    EXPLORE MAP
                  </ThemedText>
                </View>
                <ThemedText type="headlineSm" style={{ color: '#111c2c', marginTop: Spacing.xs }}>
                  Find Venues Near You
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: '#43474b', marginTop: Spacing.half }}>
                  Interactive grid overview of 24 sport courts in Greater London.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Trending Venues Section */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="headlineSm">Trending Venues</ThemedText>
              <Pressable>
                <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
              </Pressable>
            </View>

            <View style={styles.trendingList}>
              {TRENDING_VENUES.map(venue => (
                <Pressable
                  key={venue.id}
                  onPress={() => handleVenueClick(venue.id, venue.name)}
                  style={[styles.venueRowCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}
                >
                  <Image source={venue.image} style={styles.venueRowImage} contentFit="cover" />
                  <View style={styles.venueRowInfo}>
                    <ThemedText type="labelSm" style={{ color: theme.secondary, letterSpacing: 0.5 }}>
                      {venue.sport}
                    </ThemedText>
                    <ThemedText type="headlineSm" numberOfLines={1} style={{ marginTop: 2 }}>
                      {venue.name}
                    </ThemedText>
                    <View style={styles.venueRowSub}>
                      <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                      <ThemedText type="bodySm" numberOfLines={1} style={{ color: theme.textSecondary, marginLeft: 2, flex: 1 }}>
                        {venue.location.split(',')[0]} • {venue.distance}
                      </ThemedText>
                    </View>
                    <View style={styles.venueRowFooter}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>
                        Rate: <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>{venue.price}</ThemedText>/hr
                      </ThemedText>
                      <View style={[styles.ratingTag, { backgroundColor: theme.surface }]}>
                        <Ionicons name="star" size={10} color={theme.secondaryContainer} />
                        <ThemedText type="labelSm" style={{ color: theme.text, marginLeft: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
                          {venue.rating}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 4,
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
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    height: 48,
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
    fontSize: 14,
    paddingVertical: 0,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesScroll: {
    gap: Spacing.xs,
    paddingVertical: Spacing.base,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mapPromoCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    height: 180,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  mapPromoOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mapPromoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.default,
  },
  trendingList: {
    gap: Spacing.md,
  },
  venueRowCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  venueRowImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
  },
  venueRowInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  venueRowSub: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  venueRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
});
