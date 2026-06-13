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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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

// Mock Data for Sports Categories
const SPORTS = [
  { id: 'all', name: 'All', icon: 'grid', library: 'Ionicons' },
  { id: 'football', name: 'Football', icon: 'soccer', library: 'MaterialCommunityIcons' },
  { id: 'cricket', name: 'Cricket', icon: 'cricket', library: 'MaterialCommunityIcons' },
  { id: 'tennis', name: 'Tennis', icon: 'tennis', library: 'MaterialCommunityIcons' },
  { id: 'swimming', name: 'Swim', icon: 'swim', library: 'MaterialCommunityIcons' },
  { id: 'badminton', name: 'Badminton', icon: 'badminton', library: 'MaterialCommunityIcons' },
  { id: 'event', name: 'Event', icon: 'calendar-star', library: 'MaterialCommunityIcons' },
  { id: 'movie', name: 'Movie', icon: 'movie', library: 'MaterialCommunityIcons' },
  { id: 'resort', name: 'Resort', icon: 'umbrella-beach', library: 'MaterialCommunityIcons' },
];

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  
  const [selectedDate, setSelectedDate] = useState('13');
  const [selectedSport, setSelectedSport] = useState('all');
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
                source={{ uri: profile.avatarUrl }}
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
            <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => triggerToast('No new notifications')}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        <Reanimated.View entering={FadeInDown.duration(600).damping(14)} style={{ flex: 1 }}>
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
                        ? { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1.5 }
                        : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '33', borderWidth: 1.5 },
                    ]}
                  >
                    {sport.library === 'Ionicons' ? (
                      <Ionicons
                        name={sport.icon as any}
                        size={14}
                        color={isActive ? theme.primary : theme.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={sport.icon as any}
                        size={15}
                        color={isActive ? theme.primary : theme.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <ThemedText
                      type="labelMd"
                      style={{ 
                        color: isActive ? theme.primary : theme.textSecondary,
                        fontFamily: 'HankenGrotesk_700Bold',
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
                  backgroundImage: "https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=600&q=80",
                  buttonBackgroundColor: "#ffffff",
                  buttonTextColor: "#1e3a8a",
                  onPress: () => router.push('/booking'),
                },
                {
                  title: "Summer Turf Festival Offer",
                  subtitle: "Play under the stars. Special discounts after 9PM.",
                  buttonText: "Explore Offers",
                  badgeText: "SPECIAL OFFER",
                  backgroundImage: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=600&q=80",
                  buttonBackgroundColor: "#a3e635",
                  buttonTextColor: "#064e3b",
                  onPress: () => router.push('/(tabs)/explore'),
                },
                {
                  title: "YAWAH Turf Special Offer",
                  subtitle: "Get flat 30% OFF on all bookings. Code: YAWAHTURF",
                  buttonText: "Book Now",
                  badgeText: "SPECIAL OFFER",
                  backgroundImage: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80",
                  buttonBackgroundColor: "#5D68E8",
                  buttonTextColor: "#ffffff",
                  onPress: () => router.push('/(tabs)/explore'),
                }
              ]}
            />
          </View>

          {/* Turf List */}
          <View style={[styles.section, { gap: 10, paddingBottom: 100 }]}>
            
            {/* Skyline Arena Elite (AI Recommended) */}
            <Pressable
              onPress={() => handleTurfSelect('skyline', 'Skyline Arena Elite')}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              <View style={styles.imageContainer}>
                {/* AI Recommended Badge */}
                <View style={[styles.aiBadge, { backgroundColor: theme.secondaryContainer + 'E6', borderColor: theme.onSecondaryContainer + '33' }]}>
                  <Ionicons name="sparkles" size={8} color={theme.onSecondaryContainer} />
                  <ThemedText style={[styles.aiBadgeText, { color: theme.onSecondaryContainer }]}>AI</ThemedText>
                </View>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.turfImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ThemedText type="headlineSm" style={[styles.turfTitle, { color: theme.text, marginBottom: 4 }]} numberOfLines={1}>
                      Skyline Arena Elite
                    </ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                        Canary Wharf, East London
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color={theme.secondaryContainer} />
                      <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 2, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold' }}>4.9</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                      <MaterialCommunityIcons name="soccer" size={12} color={theme.secondary} />
                      <MaterialCommunityIcons name="cricket" size={12} color={theme.secondary} />
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' }}>₹25</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>/hr</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable 
                      onPress={() => handleTurfSelect('skyline', 'Skyline Arena Elite')}
                      style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontSize: 11, fontFamily: 'HankenGrotesk_700Bold' }}>Book Now</ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => toggleFavorite('skyline')}
                      style={styles.favButton}
                    >
                      <MaterialCommunityIcons 
                        name={favorites['skyline'] ? 'cards-heart' : 'cards-heart-outline'} 
                        size={16} 
                        color={favorites['skyline'] ? theme.error : theme.textSecondary} 
                      />
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>124</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* The Grid Multisport */}
            <Pressable
              onPress={() => handleTurfSelect('the-grid', 'The Grid Multisport')}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.turfImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ThemedText type="headlineSm" style={[styles.turfTitle, { color: theme.text, marginBottom: 4 }]} numberOfLines={1}>
                      The Grid Multisport
                    </ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                        Stratford Central
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color={theme.secondaryContainer} />
                      <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 2, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold' }}>4.7</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                      <MaterialCommunityIcons name="grid" size={12} color={theme.secondary} />
                      <MaterialCommunityIcons name="soccer" size={12} color={theme.secondary} />
                      <MaterialCommunityIcons name="cricket" size={12} color={theme.secondary} />
                      <MaterialCommunityIcons name="tennis" size={12} color={theme.secondary} />
                      <MaterialCommunityIcons name="basketball" size={12} color={theme.secondary} />
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' }}>₹18</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>/hr</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable 
                      onPress={() => handleTurfSelect('the-grid', 'The Grid Multisport')}
                      style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontSize: 11, fontFamily: 'HankenGrotesk_700Bold' }}>Book Now</ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => toggleFavorite('the-grid')}
                      style={styles.favButton}
                    >
                      <MaterialCommunityIcons 
                        name={favorites['the-grid'] ? 'cards-heart' : 'cards-heart-outline'} 
                        size={16} 
                        color={favorites['the-grid'] ? theme.error : theme.textSecondary} 
                      />
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>89</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Lord's View Pavillion */}
            <Pressable
              onPress={() => handleTurfSelect('lords', "Lord's View Pavillion")}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1518605368461-1e1e38ce7161?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.turfImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ThemedText type="headlineSm" style={[styles.turfTitle, { color: theme.text, marginBottom: 4 }]} numberOfLines={1}>
                      {"Lord's View Pavillion"}
                    </ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {"St John's Wood"}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color={theme.secondaryContainer} />
                      <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 2, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold' }}>4.8</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                      <MaterialCommunityIcons name="cricket" size={12} color={theme.secondary} />
                      <MaterialCommunityIcons name="tennis" size={12} color={theme.secondary} />
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' }}>₹22</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>/hr</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable 
                      onPress={() => handleTurfSelect('lords', "Lord's View Pavillion")}
                      style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontSize: 11, fontFamily: 'HankenGrotesk_700Bold' }}>Book Now</ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => toggleFavorite('lords')}
                      style={styles.favButton}
                    >
                      <MaterialCommunityIcons 
                        name={favorites['lords'] ? 'cards-heart' : 'cards-heart-outline'} 
                        size={16} 
                        color={favorites['lords'] ? theme.error : theme.textSecondary} 
                      />
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>210</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Wembley Turf Hub (New 4th Card) */}
            <Pressable
              onPress={() => handleTurfSelect('wembley', 'Wembley Turf Hub')}
              style={[styles.turfCard, { backgroundColor: theme.surfaceLowest }, Shadows.level2]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.turfImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ThemedText type="headlineSm" style={[styles.turfTitle, { color: theme.text, marginBottom: 4 }]} numberOfLines={1}>
                      Wembley Turf Hub
                    </ThemedText>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={11} color={theme.textSecondary} />
                      <ThemedText type="bodyMd" style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                        Wembley Park, London
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color={theme.secondaryContainer} />
                      <ThemedText type="labelMd" style={{ color: theme.text, marginLeft: 2, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold' }}>4.6</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                      <MaterialCommunityIcons name="soccer" size={12} color={theme.secondary} />
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <ThemedText type="headlineSm" style={{ color: theme.secondary, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' }}>₹30</ThemedText>
                    <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 2 }}>/hr</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable 
                      onPress={() => handleTurfSelect('wembley', 'Wembley Turf Hub')}
                      style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.onSecondaryContainer, fontSize: 11, fontFamily: 'HankenGrotesk_700Bold' }}>Book Now</ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => toggleFavorite('wembley')}
                      style={styles.favButton}
                    >
                      <MaterialCommunityIcons 
                        name={favorites['wembley'] ? 'cards-heart' : 'cards-heart-outline'} 
                        size={16} 
                        color={favorites['wembley'] ? theme.error : theme.textSecondary} 
                      />
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 4 }}>342</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>

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
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 116,
    marginBottom: 0,
  },
  imageContainer: {
    width: 110,
    height: 116,
    position: 'relative',
  },
  turfImage: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
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
    padding: 10,
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
});
