import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mock Data for Dates
const DATES = [
  { id: '12', day: 'MON', date: '12' },
  { id: '13', day: 'TUE', date: '13' }, // Active initially
  { id: '14', day: 'WED', date: '14' },
  { id: '15', day: 'THU', date: '15' },
  { id: '16', day: 'FRI', date: '16' },
  { id: '17', day: 'SAT', date: '17' },
];

// Mock Data for Sports Categories
const SPORTS = [
  { id: 'all', name: 'All Sports', icon: 'apps' },
  { id: 'football', name: 'Football', icon: 'football' },
  { id: 'cricket', name: 'Cricket', icon: 'fitness' },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball' },
];

export default function TurfDiscoveryScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState('13');
  const [selectedSport, setSelectedSport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ 'skyline': false });

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Calendar Picker Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="headlineMd">February</ThemedText>
              <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>2024</ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarContainer}
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
                      }}
                    >
                      {item.day}
                    </ThemedText>
                    <ThemedText
                      type="headlineSm"
                      style={{
                        color: isActive ? theme.text : theme.text,
                        fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
                        marginTop: 4,
                      }}
                    >
                      {item.date}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Search & Filter Section */}
          <View style={styles.section}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
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
              contentContainerStyle={styles.filtersContainer}
            >
              {SPORTS.map((sport) => {
                const isActive = sport.id === selectedSport;
                return (
                  <Pressable
                    key={sport.id}
                    onPress={() => setSelectedSport(sport.id)}
                    style={[
                      styles.filterChip,
                      isActive
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.surfaceHigh, borderColor: theme.outlineVariant + '1a' },
                    ]}
                  >
                    {sport.id !== 'all' && (
                      <Ionicons
                        name={sport.icon as any}
                        size={14}
                        color={isActive ? theme.onPrimary : theme.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <ThemedText
                      type="labelMd"
                      style={{ color: isActive ? theme.onPrimary : theme.textSecondary }}
                    >
                      {sport.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tournaments Section */}
          <View style={styles.section}>
            <View style={[styles.bannerContainer, { backgroundColor: theme.primaryContainer }]}>
              {/* Illustration Accent background */}
              <Image
                source={require('@/assets/images/illustrations/trophy.png')}
                style={styles.bannerIllustration}
                contentFit="contain"
              />
              
              <View style={styles.bannerContent}>
                <View style={styles.bannerBadgeContainer}>
                  <View style={[styles.bannerBadge, { backgroundColor: theme.secondaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontWeight: '800' }}>MAJOR</ThemedText>
                  </View>
                  <ThemedText type="labelSm" style={{ color: theme.onPrimaryContainer, marginLeft: 8 }}>
                    Ends in 2 days
                  </ThemedText>
                </View>

                <ThemedText type="headlineSm" style={styles.bannerTitle}>
                  London Community Cup 2024
                </ThemedText>
                <ThemedText type="bodyMd" style={styles.bannerSub}>
                  Compete with the best local teams and win the championship trophy.
                </ThemedText>

                <Pressable style={[styles.bannerButton, { backgroundColor: theme.secondaryContainer }]}>
                  <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>Join Now</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Turf List */}
          <View style={[styles.section, { gap: Spacing.lg, paddingBottom: 100 }]}>
            
            {/* Skyline Arena Elite (AI Recommended) */}
            <Pressable
              onPress={() => handleTurfSelect('skyline', 'Skyline Arena Elite')}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              {/* AI Recommended Badge */}
              <View style={[styles.aiBadge, { backgroundColor: theme.secondaryContainer }]}>
                <Ionicons name="sparkles" size={10} color={theme.onSecondaryContainer} />
                <ThemedText type="labelMd" style={[styles.aiBadgeText, { color: theme.onSecondaryContainer }]}>AI RECOMMENDED</ThemedText>
              </View>

              <Image
                source={require('@/assets/images/illustrations/stadium.png')}
                style={styles.turfImage}
                contentFit="cover"
              />
              
              <View style={styles.priceTag}>
                <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer }}>$25</ThemedText>
                <ThemedText type="labelSm" style={{ color: '#ffffff' }}>/hr</ThemedText>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <ThemedText type="labelMd" style={{ color: theme.secondary }}>FOOTBALL</ThemedText>
                    <ThemedText type="headlineSm" style={styles.turfTitle}>Skyline Arena Elite</ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.locationText}>Canary Wharf, East London</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: theme.surface }]}>
                    <Ionicons name="star" size={12} color={theme.secondaryContainer} />
                    <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 4 }}>4.9</ThemedText>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable 
                    onPress={() => handleTurfSelect('skyline', 'Skyline Arena Elite')}
                    style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>Instant Book</ThemedText>
                  </Pressable>
                  <Pressable 
                    onPress={() => toggleFavorite('skyline')}
                    style={[styles.favButton, { borderColor: theme.outlineVariant }]}
                  >
                    <Ionicons 
                      name={favorites['skyline'] ? 'heart' : 'heart-outline'} 
                      size={18} 
                      color={favorites['skyline'] ? theme.error : theme.textSecondary} 
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>

            {/* The Grid Multisport */}
            <Pressable
              onPress={() => handleTurfSelect('the-grid', 'The Grid Multisport')}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              <Image
                source={require('@/assets/images/illustrations/football_player.png')}
                style={styles.turfImage}
                contentFit="cover"
              />
              
              <View style={styles.priceTag}>
                <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer }}>$18</ThemedText>
                <ThemedText type="labelSm" style={{ color: '#ffffff' }}>/hr</ThemedText>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <ThemedText type="labelMd" style={{ color: theme.secondary }}>MULTI-SPORT</ThemedText>
                    <ThemedText type="headlineSm" style={styles.turfTitle}>The Grid Multisport</ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.locationText}>Stratford Central</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: theme.surface }]}>
                    <Ionicons name="star" size={12} color={theme.secondaryContainer} />
                    <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 4 }}>4.7</ThemedText>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable style={[styles.actionButton, { backgroundColor: theme.primary, marginRight: 8 }]}>
                    <ThemedText type="labelMd" style={{ color: theme.onPrimary }}>Set Reminder</ThemedText>
                  </Pressable>
                  <Pressable 
                    onPress={() => handleTurfSelect('the-grid', 'The Grid Multisport')}
                    style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>Book Now</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Pressable>

            {/* Lord's View Pavillion */}
            <Pressable
              onPress={() => handleTurfSelect('lords', "Lord's View Pavillion")}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              <Image
                source={require('@/assets/images/illustrations/cricket_player.png')}
                style={styles.turfImage}
                contentFit="cover"
              />
              
              <View style={styles.priceTag}>
                <ThemedText type="headlineSm" style={{ color: theme.secondaryContainer }}>$22</ThemedText>
                <ThemedText type="labelSm" style={{ color: '#ffffff' }}>/hr</ThemedText>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <ThemedText type="labelMd" style={{ color: theme.secondary }}>CRICKET</ThemedText>
                    <ThemedText type="headlineSm" style={styles.turfTitle}>{"Lord's View Pavillion"}</ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={styles.locationText}>{"St John's Wood"}</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: theme.surface }]}>
                    <Ionicons name="star" size={12} color={theme.secondaryContainer} />
                    <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 4 }}>4.8</ThemedText>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable 
                    onPress={() => handleTurfSelect('lords', "Lord's View Pavillion")}
                    style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                  >
                    <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer }}>Instant Book</ThemedText>
                  </Pressable>
                  <Pressable 
                    onPress={() => toggleFavorite('lords')}
                    style={[styles.favButton, { borderColor: theme.outlineVariant }]}
                  >
                    <Ionicons 
                      name={favorites['lords'] ? 'heart' : 'heart-outline'} 
                      size={18} 
                      color={favorites['lords'] ? theme.error : theme.textSecondary} 
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>

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
    marginBottom: Spacing.sm,
  },
  calendarContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  calendarDay: {
    width: 52,
    height: 72,
    borderRadius: BorderRadius.xl,
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
  filtersContainer: {
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
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
    backgroundColor: '#feae2c',
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
    color: '#81919c',
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#feae2c',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  turfCard: {
    borderRadius: BorderRadius.premium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c3c7cb33',
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 5,
    backgroundColor: 'rgba(254, 174, 44, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiBadgeText: {
    color: '#6b4500',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginLeft: 4,
  },
  turfImage: {
    width: '100%',
    height: 196,
  },
  priceTag: {
    position: 'absolute',
    bottom: 120, // positioned over the image
    right: Spacing.md,
    backgroundColor: 'rgba(5, 21, 30, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'baseline',
    zIndex: 5,
  },
  cardInfo: {
    padding: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  turfTitle: {
    color: '#111c2c',
    marginTop: 2,
    fontSize: 18,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: -2,
  },
  locationText: {
    color: '#43474b',
    fontSize: 13,
    marginLeft: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#feae2c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  favButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});
