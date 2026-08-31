import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Pressable, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Carousel } from '@/components/carousel';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { SPORTS_LIST } from '@/constants/sports';

const FEATURED_BANNERS = [
  { id: '1', title: 'Summer Football Camp 2026', image: require('@/assets/images/illustrations/football_player.png'), color: '#22c55e' },
  { id: '2', title: 'Kids Cricket Academy', image: require('@/assets/images/illustrations/cricket_player.png'), color: '#0ea5e9' },
  { id: '3', title: 'Weekend Fitness Training', image: require('@/assets/images/illustrations/athletes.png'), color: '#f59e0b' },
  { id: '4', title: 'Women\'s Badminton Camp', image: require('@/assets/images/illustrations/athletes.png'), color: '#ec4899' },
];

const QUICK_CATEGORIES = [
  { id: '1', title: 'Summer Classes', icon: 'school' },
  { id: '2', title: 'Personal Coaching', icon: 'person' },
  { id: '3', title: 'Group Training', icon: 'people' },
  { id: '4', title: 'Kids Academy', icon: 'happy' },
  { id: '5', title: 'Fitness Training', icon: 'fitness' },
  { id: '6', title: 'Weekend Camps', icon: 'calendar' },
];

const FEATURED_COACHES = [
  { id: '1', name: 'Rohan Patel', sport: 'Football', experience: '10 yrs', rating: 4.9, verified: true, price: '₹500/hr', image: require('@/assets/images/illustrations/football_player.png') },
  { id: '2', name: 'Maya Singh', sport: 'Cricket', experience: '8 yrs', rating: 4.8, verified: true, price: '₹600/hr', image: require('@/assets/images/illustrations/cricket_player.png') },
  { id: '3', name: 'Vikram Rao', sport: 'Badminton', experience: '12 yrs', rating: 4.7, verified: true, price: '₹400/hr', image: require('@/assets/images/illustrations/athletes.png') },
  { id: '4', name: 'Sara Lee', sport: 'Tennis', experience: '9 yrs', rating: 4.9, verified: true, price: '₹700/hr', image: require('@/assets/images/illustrations/tennis_player.png') },
];

export default function CoachHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;

  return (
    <GradientContainer screenName="coach">
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="headlineMd">Discover Coaches</ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Find your perfect training match</ThemedText>
            </View>
            <Pressable onPress={() => router.push('/profile')}>
              <Ionicons name="person-circle" size={40} color={theme.secondary} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <Reanimated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                placeholder="Search football coach, cricket academy..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: theme.text }]}
                placeholderTextColor={theme.textSecondary}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </Reanimated.View>

          {/* Filter Chips */}
          <Reanimated.View entering={FadeInDown.duration(400).delay(200)}>
            <View style={styles.filtersSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {SPORTS_LIST.map(sport => {
                  const isSelected = selectedSport === sport.name;
                  return (
                    <Pressable
                      key={sport.name}
                      onPress={() => setSelectedSport(isSelected ? null : sport.name)}
                      style={[
                        styles.filterChip,
                        { backgroundColor: sport.color + '1A', borderColor: sport.color + '40' },
                        isSelected && { backgroundColor: sport.color, borderColor: sport.color },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={sport.icon as any}
                        size={12}
                        color={isSelected ? '#ffffff' : sport.color}
                        style={{ marginRight: 4 }}
                      />
                      <ThemedText
                        type="labelSm"
                        style={{
                          color: isSelected ? '#ffffff' : sport.color,
                          fontFamily: 'Sora_600SemiBold',
                          fontSize: 10,
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
          </Reanimated.View>

          {/* Featured Banners */}
          <Reanimated.View entering={FadeInDown.duration(400).delay(300)}>
            <View style={styles.section}>
              <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Featured</ThemedText>
              <Carousel
                data={FEATURED_BANNERS}
                height={160}
                renderItem={(item) => (
                  <Pressable
                    style={[
                      styles.bannerCard,
                      { width: screenWidth - 40, backgroundColor: item.color }
                    ]}
                    onPress={() => router.push({
                      pathname: '/enroll',
                      params: {
                        title: item.title,
                        price: '₹4,999',
                        dates: 'June - Aug 2026',
                        location: 'Apex Arena',
                        themeColor: item.color,
                      }
                    })}
                  >
                    <View style={styles.bannerContent}>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>
                        {item.title}
                      </ThemedText>
                      <View style={styles.bannerBtn}>
                        <ThemedText type="labelSm" style={{ color: item.color }}>
                          Join Now
                        </ThemedText>
                      </View>
                    </View>
                    <Image source={item.image} style={styles.bannerImage} />
                  </Pressable>
                )}
              />
            </View>
          </Reanimated.View>

          {/* Quick Categories Grid */}
          <Reanimated.View entering={FadeInDown.duration(400).delay(400)}>
            <View style={styles.section}>
              <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Quick Categories</ThemedText>
              <View style={styles.categoryGrid}>
                {QUICK_CATEGORIES.map(cat => (
                  <Pressable key={cat.id} style={[styles.categoryCard, { backgroundColor: theme.surfaceLowest }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={28} color="#22c55e" />
                    <ThemedText type="labelSm" style={{ marginTop: 8, textAlign: 'center' }}>
                      {cat.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </Reanimated.View>

          {/* Featured Coaches */}
          <Reanimated.View entering={FadeInDown.duration(400).delay(500)}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="labelMd">Featured Coaches</ThemedText>
                <Pressable onPress={() => router.push('/coach')}>
                  <ThemedText type="labelSm" style={{ color: '#22c55e' }}>See All</ThemedText>
                </Pressable>
              </View>
              <FlatList
                data={FEATURED_COACHES}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.coachCard, { backgroundColor: theme.surfaceLowest }]}
                    onPress={() => router.push({ pathname: '/coach-profile/[id]', params: { id: item.id } })}
                  >
                    <Image source={item.image} style={styles.coachImage} />
                    <ThemedText type="headlineSm" style={{ marginTop: 8 }}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>
                      {item.sport}
                    </ThemedText>
                    <View style={styles.coachMeta}>
                      <ThemedText type="labelSm">{item.experience}</ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <ThemedText type="labelSm">{item.rating}</ThemedText>
                      </View>
                    </View>
                    <ThemedText type="labelMd" style={{ color: '#22c55e', marginTop: 8 }}>
                      {item.price}
                    </ThemedText>
                    <View style={styles.coachActions}>
                      <Pressable style={styles.profileBtn}>
                        <ThemedText type="labelSm" style={{ color: '#22c55e' }}>Profile</ThemedText>
                      </Pressable>
                      <Pressable style={[styles.bookBtn, { backgroundColor: '#22c55e' }]}>
                        <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Book</ThemedText>
                      </Pressable>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </Reanimated.View>
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.containerMargin, paddingVertical: Spacing.md },
  searchContainer: { marginHorizontal: Spacing.containerMargin, marginVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filtersSection: { marginVertical: Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.containerMargin, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, height: 30, justifyContent: 'center' },
  section: { paddingHorizontal: Spacing.containerMargin, marginVertical: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bannerCard: { marginHorizontal: 20, borderRadius: BorderRadius.xl, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerContent: { flex: 1 },
  bannerBtn: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ffffff', borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  bannerImage: { width: 80, height: 80, borderRadius: BorderRadius.lg },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  categoryCard: { width: '31%', aspectRatio: 1, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', padding: 12 },
  coachCard: { width: 160, borderRadius: BorderRadius.xl, padding: 12 },
  coachImage: { width: '100%', height: 120, borderRadius: BorderRadius.lg },
  coachMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  coachActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  profileBtn: { flex: 1, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  bookBtn: { flex: 1, paddingVertical: 6, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
});
