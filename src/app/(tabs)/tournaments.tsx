import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

// Mock Tournaments Data
const INITIAL_TOURNAMENTS = [
  {
    id: 't1',
    name: 'London Cup 2026',
    sport: 'Football',
    type: 'Knockout',
    location: 'Elms Field Arena, London',
    startDate: '2026-06-15',
    endDate: '2026-06-22',
    registrationStatus: 'Registering',
    teamsCount: 12,
    maxTeams: 16,
    prizePool: '₹2,500',
    prizePoolAmount: 2500,
    status: 'Registering',
    isLive: false,
    isSponsored: true,
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 't2',
    name: 'T20 Cricket Blast League',
    sport: 'Cricket',
    type: 'League + Playoffs',
    location: 'Regents Cricket Ground, London',
    startDate: '2026-07-01',
    endDate: '2026-07-20',
    registrationStatus: 'Filling Fast',
    teamsCount: 8,
    maxTeams: 8,
    prizePool: '₹5,000',
    prizePoolAmount: 5000,
    status: 'Ongoing',
    isLive: true,
    isSponsored: false,
    banner: 'https://images.unsplash.com/photo-1531415080290-bc98545ab3ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 't3',
    name: 'Futsal Summer Championship',
    sport: 'Football',
    type: 'Group + Knockout',
    location: 'Urban Turf Center, London',
    startDate: '2026-06-25',
    endDate: '2026-06-28',
    registrationStatus: 'Registering',
    teamsCount: 6,
    maxTeams: 10,
    prizePool: '₹1,000',
    prizePoolAmount: 1000,
    status: 'Registering',
    isLive: false,
    isSponsored: false,
    banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 't4',
    name: 'Wimbledon Amateur Open',
    sport: 'Tennis',
    type: 'Single Elimination',
    location: 'West London Tennis Club',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    registrationStatus: 'Upcoming',
    teamsCount: 0,
    maxTeams: 32,
    prizePool: '₹1,500',
    prizePoolAmount: 1500,
    status: 'Upcoming',
    isLive: false,
    isSponsored: true,
    banner: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 't5',
    name: 'City Corporate Cricket Cup',
    sport: 'Cricket',
    type: 'Knockout',
    location: 'Hyde Park Oval, London',
    startDate: '2026-05-10',
    endDate: '2026-05-15',
    registrationStatus: 'Closed',
    teamsCount: 16,
    maxTeams: 16,
    prizePool: '₹3,000',
    prizePoolAmount: 3000,
    status: 'Finished',
    isLive: false,
    isSponsored: false,
    banner: 'https://images.unsplash.com/photo-1608962714006-25c2d3a3d5e2?auto=format&fit=crop&w=800&q=80',
  }
];

const formatDateRange = (start: string, end: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return `${start} - ${end}`;
  }
  const startMonth = months[startDate.getMonth()];
  const startDay = startDate.getDate();
  const endMonth = months[endDate.getMonth()];
  const endDay = endDate.getDate();
  
  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

export default function TournamentsTab() {
  const theme = useTheme();
  const router = useRouter();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Date'); // 'Date' or 'Prize'
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['t1']);
  
  // Simulator Controls
  const [simulateEmpty, setSimulateEmpty] = useState(false);

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  };

  const handleProfilePress = () => router.push('/profile');
  const handleNetworkPress = () => router.push('/network');

  const toggleBookmark = (id: string) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(item => item !== id));
      triggerToast('Removed from bookmarks');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      triggerToast('Tournament bookmarked!');
    }
  };

  const handleShare = (name: string) => {
    triggerToast(`Shared tournament: ${name}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSport('All');
    setSelectedStatus('All');
    setSortBy('Date');
    setSimulateEmpty(false);
  };

  // Filter and Sort Logic
  const filteredTournaments = tournaments.filter(t => {
    if (simulateEmpty) return false;
    
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSport = selectedSport === 'All' || t.sport === selectedSport;
    
    const matchesStatus = selectedStatus === 'All' || 
                          (selectedStatus === 'Registering' && t.status === 'Registering') ||
                          (selectedStatus === 'Ongoing' && t.status === 'Ongoing') ||
                          (selectedStatus === 'Finished' && t.status === 'Finished') ||
                          (selectedStatus === 'Upcoming' && t.status === 'Upcoming');

    return matchesSearch && matchesSport && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'Prize') {
      return b.prizePoolAmount - a.prizePoolAmount;
    } else {
      // Sort by startDate
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    }
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={handleProfilePress}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                Azarudeen
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondaryContainer} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  London, UK
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={handleNetworkPress}>
              <Ionicons name="pulse" size={20} color={theme.secondaryContainer} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondaryContainer} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondaryContainer} />
            </Pressable>
          </View>
        </View>

        {/* Simulator controls - Premium HUD style */}
        <View style={[styles.simulatorPanel, { backgroundColor: theme.primaryContainer, borderColor: theme.outlineVariant }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: 'bold', marginRight: 10 }}>SIMULATE:</ThemedText>
          
          <Pressable 
            style={[styles.simButton, simulateLoading && styles.simButtonActive]} 
            onPress={() => setSimulateLoading(!simulateLoading)}
          >
            <Ionicons name="sync" size={12} color={simulateLoading ? '#05151e' : '#feae2c'} style={{ marginRight: 4 }} />
            <ThemedText type="labelSm" style={{ color: simulateLoading ? '#05151e' : '#feae2c', fontSize: 10 }}>Loading</ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.simButton, simulateEmpty && styles.simButtonActive]} 
            onPress={() => setSimulateEmpty(!simulateEmpty)}
          >
            <Ionicons name="alert-circle-outline" size={12} color={simulateEmpty ? '#05151e' : '#feae2c'} style={{ marginRight: 4 }} />
            <ThemedText type="labelSm" style={{ color: simulateEmpty ? '#05151e' : '#feae2c', fontSize: 10 }}>Empty</ThemedText>
          </Pressable>

          <View style={{ flex: 1 }} />
          
          <Pressable 
            style={[styles.createBtn, { backgroundColor: theme.secondaryContainer }]}
            onPress={() => router.push('/create-tournament')}
          >
            <Ionicons name="add" size={14} color="#6b4500" />
            <ThemedText type="labelSm" style={{ color: '#6b4500', fontWeight: 'bold' }}>Create</ThemedText>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header section with description */}
          <View style={styles.welcomeSection}>
            <View style={styles.rowBetween}>
              <ThemedText type="headlineLg" style={{ color: theme.text }}>
                Tournaments
              </ThemedText>
              <Pressable style={styles.viewToggle} onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={theme.text} />
              </Pressable>
            </View>
            <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
              Register your team, track brackets, and claim ultimate glory.
            </ThemedText>
          </View>

          {/* Search and Sorting */}
          <View style={styles.searchBarSection}>
            <View style={[styles.searchBar, { backgroundColor: theme.surfaceLow }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search tournaments or venues..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Sorting select */}
            <View style={styles.sortingRow}>
              <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Sort by:</ThemedText>
              <Pressable 
                style={[styles.sortPill, sortBy === 'Date' && { backgroundColor: theme.primary }]}
                onPress={() => setSortBy('Date')}
              >
                <ThemedText type="labelSm" style={{ color: sortBy === 'Date' ? '#ffffff' : theme.text }}>Date</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.sortPill, sortBy === 'Prize' && { backgroundColor: theme.primary }]}
                onPress={() => setSortBy('Prize')}
              >
                <ThemedText type="labelSm" style={{ color: sortBy === 'Prize' ? '#ffffff' : theme.text }}>Prize Pool</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Sport Categories Horizontal Scroller */}
          <View style={styles.categoriesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {['All', 'Football', 'Cricket', 'Tennis'].map((sport) => {
                const isSelected = selectedSport === sport;
                return (
                  <Pressable
                    key={sport}
                    onPress={() => setSelectedSport(sport)}
                    style={[
                      styles.categoryPill,
                      { backgroundColor: theme.surfaceLow },
                      isSelected && { backgroundColor: theme.secondaryContainer }
                    ]}
                  >
                    <ThemedText
                      type="labelSm"
                      style={{
                        color: isSelected ? '#6b4500' : theme.text,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                    >
                      {sport}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Status Categories */}
          <View style={styles.statusFiltersSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {['All', 'Registering', 'Ongoing', 'Finished', 'Upcoming'].map((status) => {
                const isSelected = selectedStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => setSelectedStatus(status)}
                    style={[
                      styles.statusPill,
                      { borderColor: theme.outlineVariant },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                  >
                    <ThemedText
                      type="labelSm"
                      style={{
                        color: isSelected ? '#ffffff' : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                    >
                      {status}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Content Area */}
          <View style={[styles.listSection, { paddingBottom: 110 }]}>
            {simulateLoading ? (
              // Beautiful Skeleton Cards
              <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                {[1, 2, 3].map((key) => (
                  <View 
                    key={key} 
                    style={[
                      styles.skeletonCard, 
                      { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                      viewMode === 'grid' ? styles.gridCardWidth : null
                    ]}
                  >
                    <View style={[styles.skeletonImage, { backgroundColor: theme.surfaceLow }, viewMode === 'grid' && { height: 80 }]} />
                    <View style={styles.skeletonContent}>
                      <View style={[styles.skeletonTextLine, { width: '40%', backgroundColor: theme.surfaceLow }]} />
                      <View style={[styles.skeletonTextLine, { width: '80%', marginTop: 8, backgroundColor: theme.surfaceLow }]} />
                      <View style={[styles.skeletonTextLine, { width: '60%', marginTop: 8, backgroundColor: theme.surfaceLow }]} />
                      <View style={[styles.skeletonButton, { marginTop: 12, backgroundColor: theme.surfaceLow }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : filteredTournaments.length === 0 ? (
              // Empty State
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={theme.outlineVariant} />
                <ThemedText type="headlineSm" style={{ marginTop: 16, color: theme.text }}>
                  No Tournaments Found
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                  {"We couldn't find any matches. Try resetting your search filters or check back later!"}
                </ThemedText>
                <Pressable style={[styles.resetBtn, { backgroundColor: theme.primary }]} onPress={handleResetFilters}>
                  <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Reset Filters</ThemedText>
                </Pressable>
              </View>
            ) : (
              // List / Grid Render
              <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                {filteredTournaments.map((t) => {
                  const isBookmarked = bookmarkedIds.includes(t.id);
                  return (
                    <Pressable
                      key={t.id}
                      style={[
                        styles.tournamentCard,
                        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                        Shadows.level1,
                        viewMode === 'grid' ? styles.gridCardWidth : null
                      ]}
                      onPress={() => router.push({
                        pathname: '/tournament-details',
                        params: { id: t.id, name: t.name, sport: t.sport, prize: t.prizePool }
                      })}
                    >
                      {/* Banner and Badges */}
                      <View style={[styles.cardHeader, viewMode === 'grid' && { height: 95 }]}>
                        <Image source={t.banner} style={styles.tournamentCardImage} contentFit="cover" />
                        
                        {/* Live Badge */}
                        {t.isLive && (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>LIVE</ThemedText>
                          </View>
                        )}

                        {/* Sponsored Badge */}
                        {t.isSponsored && (
                          <View style={styles.sponsoredBadge}>
                            <Ionicons name="sparkles" size={10} color="#feae2c" style={{ marginRight: 2 }} />
                            <ThemedText type="labelSm" style={{ color: '#feae2c', fontSize: 9, fontWeight: '800' }}>SPONSORED</ThemedText>
                          </View>
                        )}

                        {/* Quick Action Overlay (Bookmark & Share) */}
                        <View style={styles.cardActionsOverlay}>
                          <Pressable style={styles.roundActionBtn} onPress={() => toggleBookmark(t.id)}>
                            <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={16} color={isBookmarked ? '#feae2c' : '#ffffff'} />
                          </Pressable>
                          <Pressable style={styles.roundActionBtn} onPress={() => handleShare(t.name)}>
                            <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                          </Pressable>
                        </View>
                      </View>

                      {/* Card Info */}
                      <View style={[styles.tournamentCardInfo, viewMode === 'grid' && { padding: 10 }]}>
                        <View style={styles.rowBetween}>
                          <View style={[styles.sportBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.primary, textTransform: 'uppercase', fontSize: 9, fontWeight: 'bold' }}>
                              {t.sport}
                            </ThemedText>
                          </View>
                          
                          {/* Reg Status Badge */}
                          <View style={[
                            styles.statusLabel,
                            t.registrationStatus === 'Registering' && { backgroundColor: '#e2f9ec' },
                            t.registrationStatus === 'Filling Fast' && { backgroundColor: '#fff4e5' },
                            t.registrationStatus === 'Upcoming' && { backgroundColor: '#e6f0fa' },
                            t.registrationStatus === 'Closed' && { backgroundColor: '#f0f0f2' }
                          ]}>
                            <ThemedText type="labelSm" style={[
                              { fontSize: viewMode === 'grid' ? 8 : 10, fontWeight: '700' },
                              t.registrationStatus === 'Registering' && { color: '#0f9f58' },
                              t.registrationStatus === 'Filling Fast' && { color: '#e67e22' },
                              t.registrationStatus === 'Upcoming' && { color: '#2980b9' },
                              t.registrationStatus === 'Closed' && { color: '#7f8c8d' }
                            ]}>
                              {t.registrationStatus}
                            </ThemedText>
                          </View>
                        </View>

                        <ThemedText 
                          type={viewMode === 'grid' ? 'bodyMd' : 'headlineSm'} 
                          numberOfLines={1} 
                          style={{ marginTop: Spacing.xs, color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}
                        >
                          {t.name}
                        </ThemedText>

                        {/* Location */}
                        <View style={[styles.iconInfoRow, { marginTop: viewMode === 'grid' ? 4 : 8 }]}>
                          <Ionicons name="location-outline" size={viewMode === 'grid' ? 12 : 14} color={theme.textSecondary} />
                          <ThemedText 
                            type={viewMode === 'grid' ? 'labelSm' : 'bodySm'} 
                            numberOfLines={1} 
                            style={{ color: theme.textSecondary, marginLeft: 4, flex: 1, fontSize: viewMode === 'grid' ? 11 : 12 }}
                          >
                            {t.location}
                          </ThemedText>
                        </View>

                        {/* Dates */}
                        <View style={styles.iconInfoRow}>
                          <Ionicons name="calendar-outline" size={viewMode === 'grid' ? 12 : 14} color={theme.textSecondary} />
                          <ThemedText 
                            type={viewMode === 'grid' ? 'labelSm' : 'bodySm'} 
                            numberOfLines={1} 
                            style={{ color: theme.textSecondary, marginLeft: 4, fontSize: viewMode === 'grid' ? 11 : 12 }}
                          >
                            {formatDateRange(t.startDate, t.endDate)}
                          </ThemedText>
                        </View>

                        {/* Teams & Format */}
                        <View style={[styles.teamsRow, { marginBottom: viewMode === 'grid' ? 4 : Spacing.xs }]}>
                          <Ionicons name="people-outline" size={viewMode === 'grid' ? 12 : 14} color={theme.textSecondary} />
                          <ThemedText 
                            type={viewMode === 'grid' ? 'labelSm' : 'bodySm'} 
                            numberOfLines={1} 
                            style={{ color: theme.textSecondary, marginLeft: 4, fontSize: viewMode === 'grid' ? 11 : 12 }}
                          >
                            {t.teamsCount}/{t.maxTeams} Teams {viewMode === 'grid' ? '' : `• ${t.type}`}
                          </ThemedText>
                        </View>

                        {/* Footer Section */}
                        <View style={[
                          styles.tournamentCardFooter, 
                          { borderTopColor: theme.outlineVariant + '33' },
                          viewMode === 'grid' && { marginTop: 8, paddingTop: 8 }
                        ]}>
                          <View>
                            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: viewMode === 'grid' ? 9 : 11 }}>PRIZE POOL</ThemedText>
                            <ThemedText 
                              type={viewMode === 'grid' ? 'bodyMd' : 'bodyLg'} 
                              style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.secondaryContainer, fontSize: viewMode === 'grid' ? 13 : 16 }}
                            >
                              {t.prizePool}
                            </ThemedText>
                          </View>

                          <View style={styles.cardFooterActions}>
                            <Pressable 
                              style={[
                                styles.registerBtnInCard, 
                                { backgroundColor: theme.primary },
                                viewMode === 'grid' && { paddingHorizontal: 8, paddingVertical: 4 }
                              ]}
                              onPress={() => router.push({
                                pathname: '/team-registration',
                                params: { id: t.id, name: t.name }
                              })}
                            >
                              <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: viewMode === 'grid' ? 10 : 12 }}>Register</ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>{toastMessage}</ThemedText>
        </Animated.View>
      )}
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#feae2c', // Gold ring around avatar
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
  simulatorPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.containerMargin,
    borderBottomWidth: 1,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#feae2c',
    marginRight: 6,
  },
  simButtonActive: {
    backgroundColor: '#feae2c',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  welcomeSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
  },
  viewToggle: {
    padding: 4,
  },
  searchBarSection: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.xl,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 14,
    paddingVertical: 8,
  },
  sortingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#c3c7cb55',
    flexShrink: 0,
  },
  categoriesSection: {
    marginTop: Spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  statusFiltersSection: {
    marginTop: Spacing.sm,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  listSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
  },
  listContainer: {
    gap: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  gridCardWidth: {
    width: '48%',
  },
  tournamentCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardHeader: {
    position: 'relative',
    height: 130,
    width: '100%',
  },
  tournamentCardImage: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff1744',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 4,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#05151e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#feae2c33',
  },
  cardActionsOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  roundActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 21, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentCardInfo: {
    padding: Spacing.md,
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.default,
  },
  statusLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
  iconInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: Spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tournamentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registerBtnInCard: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // Skeleton styles
  skeletonCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  skeletonImage: {
    height: 120,
    width: '100%',
    borderRadius: BorderRadius.lg,
    opacity: 0.6,
  },
  skeletonContent: {
    marginTop: 12,
  },
  skeletonTextLine: {
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  skeletonButton: {
    height: 32,
    width: 100,
    borderRadius: BorderRadius.full,
    opacity: 0.6,
  },
});
