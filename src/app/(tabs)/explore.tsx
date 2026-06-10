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

// Booking Asset Categories
const ASSET_CATEGORIES = [
  { id: 'turf', name: 'Turf', icon: 'football-outline', desc: 'Football, Cricket, Tennis' },
  { id: 'pool', name: 'Swimming Pool', icon: 'water-outline', desc: 'Olympic-size, Heated' },
  { id: 'event', name: 'Event Hall', icon: 'calendar-outline', desc: 'Tourneys & Matches' },
  { id: 'gym', name: 'Gym & Fitness', icon: 'barbell-outline', desc: 'Workouts, Training' },
];

// Mock Venues classified by Category
const BOOKING_VENUES: Record<string, any[]> = {
  turf: [
    { id: 'skyline', name: 'Skyline Arena Elite', location: 'Canary Wharf, London', price: '$25', rating: '4.9', distance: '1.2 miles', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9H8hZV1gCxBOC9fWHjQyhn5ukWJhiNGuP6cNDATeIj2gP6JceuAOrhkqeTXWFS75Y0nw0QANCmhRdo0NYvbdmh4Xrs2itBjykGtZr0Y91KEzjUMyOoM-B-owetUT1u8vwmIZlGJkcKdkgVfU0TIGzuVVlTN3lhwfdg5OWwHMCKOyPJGWWdIKySwofsCUjnq9pJi4WH0BMDAi73A53u0OeKj_Ufmh6V4PVwghrjz5aX16NlvQZLOkQRC51252maP-4ZXwNw3MwVfU', sport: 'FOOTBALL' },
    { id: 'lords', name: "Lord's View Pavillion", location: "St John's Wood, London", price: '$22', rating: '4.8', distance: '2.5 miles', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI', sport: 'CRICKET' },
    { id: 'the-grid', name: 'The Grid Multisport', location: 'Stratford Central, London', price: '$18', rating: '4.7', distance: '3.4 miles', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g', sport: 'MULTI-SPORT' },
  ],
  pool: [
    { id: 'aquatic', name: 'Olympic Aquatic Center', location: 'Stratford Park, London', price: '$35', rating: '4.9', distance: '3.6 miles', image: require('@/assets/images/illustrations/athletes.png'), sport: 'SWIMMING' },
    { id: 'hydro', name: 'Hydro Splash Arena', location: 'Greenwich, London', price: '$30', rating: '4.6', distance: '4.8 miles', image: require('@/assets/images/illustrations/tennis_player.png'), sport: 'SWIMMING' },
  ],
  event: [
    { id: 'pavilion', name: 'Wembley Exhibition Hall', location: 'Wembley, London', price: '$120', rating: '4.9', distance: '8.2 miles', image: require('@/assets/images/illustrations/team_huddle.png'), sport: 'EVENT HALL' },
  ],
  gym: [
    { id: 'iron', name: 'Iron Club Fitness', location: 'Covent Garden, London', price: '$15', rating: '4.8', distance: '0.8 miles', image: require('@/assets/images/illustrations/basketball_player.png'), sport: 'FITNESS' },
  ],
};

export default function ExploreTab() {
  const theme = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('turf');

  const handleVenueClick = (id: string, name: string) => {
    // If the venue is one of our details-supported lookups (skyline, the-grid, lords), navigate to details
    const supportedIds = ['skyline', 'the-grid', 'lords'];
    const targetId = supportedIds.includes(id) ? id : 'skyline';
    router.push({
      pathname: '/details',
      params: { id: targetId, name },
    });
  };

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/network');

  const activeVenues = BOOKING_VENUES[selectedCategory] || [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar with new layout specifications */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerLeft}>
            <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
              Azarudeen
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Ionicons name="location-sharp" size={12} color={theme.secondary} />
              <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                London, UK
              </ThemedText>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={handleNetworkPress}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.profileIconButton} onPress={handleProfilePress}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
                style={styles.headerAvatar}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Search bar */}
          <View style={styles.section}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search courts, pools, halls, or gyms..."
                placeholderTextColor={theme.textSecondary + 'aa'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable style={styles.filterButton}>
                <Ionicons name="options-outline" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Booking Categories Bento Grid */}
          <View style={styles.section}>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
              SELECT ASSET TYPE
            </ThemedText>
            
            <View style={styles.assetGrid}>
              {ASSET_CATEGORIES.map(category => {
                const isActive = category.id === selectedCategory;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[
                      styles.assetCell,
                      { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                      isActive && { borderColor: theme.secondaryContainer, borderWidth: 2 },
                      Shadows.level1
                    ]}
                  >
                    <View style={[styles.assetIconWrap, { backgroundColor: isActive ? theme.secondaryContainer + '1a' : theme.surface }]}>
                      <Ionicons name={category.icon as any} size={22} color={isActive ? theme.secondary : theme.text} />
                    </View>
                    <ThemedText type="labelMd" style={{ color: theme.text, marginTop: Spacing.xs, fontFamily: 'HankenGrotesk_700Bold' }}>
                      {category.name}
                    </ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                      {category.desc}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Trending Venues / Results list */}
          <View style={[styles.section, { paddingBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="headlineSm">Available Venues</ThemedText>
              <Pressable>
                <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
              </Pressable>
            </View>

            <View style={styles.trendingList}>
              {activeVenues.map(venue => (
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

              {activeVenues.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={48} color={theme.textSecondary + '44'} />
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                    No venues found in this category.
                  </ThemedText>
                </View>
              )}
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
  headerLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c3c7cb',
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
    padding: 4,
    marginLeft: 4,
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
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  assetCell: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  assetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
});
