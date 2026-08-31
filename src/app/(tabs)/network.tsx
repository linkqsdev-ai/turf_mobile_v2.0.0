import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';
import { CoinTossModal } from '@/components/coin-toss-modal';

// Mock Connected Community Players
const NETWORK_PLAYERS = [
  {
    id: 'p1',
    name: 'Rahul Sharma',
    handle: '@rahul_cricket',
    sport: 'Cricket',
    role: 'All-Rounder',
    skillLevel: 'Pro',
    rating: 4.9,
    distance: '1.2 km away',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mutualCount: 8,
    status: 'Looking for 11s Turf Match',
    online: true,
    badges: ['Top Batter', 'Verified'],
  },
  {
    id: 'p2',
    name: 'Karthik Raja',
    handle: '@karthik_pace',
    sport: 'Cricket',
    role: 'Fast Bowler',
    skillLevel: 'Advanced',
    rating: 4.8,
    distance: '2.5 km away',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mutualCount: 14,
    status: 'Available Today 7:00 PM',
    online: true,
    badges: ['Fastest Bowler', 'MVP'],
  },
  {
    id: 'p3',
    name: 'Samantha Roy',
    handle: '@sam_striker',
    sport: 'Football',
    role: 'Forward / Winger',
    skillLevel: 'Pro',
    rating: 5.0,
    distance: '3.1 km away',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    mutualCount: 6,
    status: 'Leading Diamond League',
    online: false,
    badges: ['Golden Boot'],
  },
  {
    id: 'p4',
    name: 'Vikram Menon',
    handle: '@vikram_spin',
    sport: 'Cricket',
    role: 'Leg Spinner',
    skillLevel: 'Intermediate',
    rating: 4.6,
    distance: '0.8 km away',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    mutualCount: 11,
    status: 'Seeking Weekend Turf Team',
    online: true,
    badges: ['Turf Regular'],
  },
  {
    id: 'p5',
    name: 'Ananya Deshmukh',
    handle: '@ananya_ace',
    sport: 'Badminton',
    role: 'Singles / Doubles',
    skillLevel: 'Advanced',
    rating: 4.9,
    distance: '1.9 km away',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    mutualCount: 4,
    status: 'Ready for Singles Match',
    online: true,
    badges: ['Tournament Finalist'],
  },
];

// Floating Pill Animation Component
function FloatingPill({
  text,
  icon,
  top,
  left,
  right,
  bottom,
  delay = 0,
  badgeBg = '#9333ea',
}: {
  text: string;
  icon: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  delay?: number;
  badgeBg?: string;
}) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200 + delay * 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 2200 + delay * 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 + delay * 150, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 2000 + delay * 150, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  });

  return (
    <Reanimated.View
      style={[
        styles.floatingPill,
        { top, left, right, bottom, backgroundColor: badgeBg },
        animatedStyle,
      ]}
    >
      <Ionicons name={icon as any} size={11} color="#ffffff" style={{ marginRight: 4 }} />
      <ThemedText style={styles.floatingPillText}>{text}</ThemedText>
    </Reanimated.View>
  );
}

// Interactive Network Constellation Visualizer
function AnimatedNetworkVisualizer() {
  const pulseScale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.98, { duration: 2800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: pulseScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.visualizerWrapper}>
      {/* Outer ambient glow halo */}
      <Reanimated.View style={[styles.glowHalo, glowAnimatedStyle]} />

      <Reanimated.View style={[styles.visualizerCard, containerAnimatedStyle]}>
        <Image
          source={require('@/assets/images/connect_network.png')}
          style={styles.networkMainImage}
          contentFit="contain"
          transition={300}
        />

        {/* Floating animated dynamic status chips */}
        <FloatingPill
          text="⚡ 18 Online"
          icon="flash"
          top={12}
          left={14}
          delay={1}
          badgeBg="rgba(126, 34, 206, 0.9)"
        />
        <FloatingPill
          text="🏏 Match Open"
          icon="flame"
          top={28}
          right={16}
          delay={2}
          badgeBg="rgba(147, 51, 234, 0.9)"
        />
        <FloatingPill
          text="🏆 Ranked FoF"
          icon="trophy"
          bottom={24}
          left={20}
          delay={3}
          badgeBg="rgba(93, 104, 232, 0.9)"
        />
        <FloatingPill
          text="📍 CHN Hub"
          icon="location"
          bottom={14}
          right={24}
          delay={4}
          badgeBg="rgba(168, 85, 247, 0.9)"
        />
      </Reanimated.View>
    </View>
  );
}

// ── Player role "Coming Soon" placeholder ────────────────────────────────
// Static layout data (recreated from the connected-avatars reference design)
const COMING_SOON_NODES = [
  { key: 'a', source: require('@/assets/images/avatars/avatar_3.png'), size: 64, left: 116.8, top: 53.6 },
  { key: 'b', source: require('@/assets/images/avatars/avatar_7.png'), size: 64, left: 46.3, top: 116.8 },
  { key: 'c', source: require('@/assets/images/avatars/avatar_10.png'), size: 50, left: 201.6, top: 85.1 },
  { key: 'd', source: require('@/assets/images/avatars/avatar_14.png'), size: 64, left: 131.4, top: 141.2 },
  { key: 'e', source: require('@/assets/images/avatars/avatar_17.png'), size: 50, left: 193.5, top: 199.2 },
  { key: 'f', source: require('@/assets/images/avatars/avatar_20.png'), size: 50, left: 76.1, top: 194.3 },
];

const COMING_SOON_BRIDGES = [
  { left: 66.2, top: 99.2, width: 94.7, height: 36, rotate: '138.1deg' },
  { left: 153.4, top: 180.7, width: 75.1, height: 36, rotate: '42.8deg' },
];

const COMING_SOON_DIAMONDS = [
  { left: 77.6, top: 77.6, size: 16, delay: 0 },
  { left: 224.3, top: 157.1, size: 14, delay: 1 },
  { left: 150.1, top: 240.6, size: 15, delay: 2 },
];

function FloatingDiamond({ left, top, size, delay }: { left: number; top: number; size: number; delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800 + delay * 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 1800 + delay * 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: '45deg' }],
  }));

  return (
    <Reanimated.View style={[styles.diamond, { left, top, width: size, height: size }, animatedStyle]}>
      <LinearGradient colors={['#ede9fe', '#a78bfa']} style={StyleSheet.absoluteFill} />
    </Reanimated.View>
  );
}

function PlayerNetworkComingSoon() {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.comingSoonScreen}>
      <Reanimated.View entering={FadeInDown.duration(500).damping(14)} style={styles.communityBadge}>
        <Ionicons name="sparkles" size={12} color="#FFA751" />
        <ThemedText style={styles.communityBadgeText}>SPORTS CONNECT & COMMUNITY</ThemedText>
      </Reanimated.View>

      <Reanimated.View
        entering={FadeInDown.delay(100).duration(600).damping(14)}
        style={[styles.comingSoonVisual, floatStyle]}
      >
        {COMING_SOON_BRIDGES.map((b, i) => (
          <LinearGradient
            key={`bridge-${i}`}
            colors={['#ddd6fe', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.bridge,
              {
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
                borderRadius: b.height / 2,
                transform: [{ rotate: b.rotate }],
              },
            ]}
          />
        ))}

        {COMING_SOON_NODES.map((n) => (
          <View
            key={n.key}
            style={[
              styles.avatarRing,
              { left: n.left, top: n.top, width: n.size, height: n.size, borderRadius: n.size / 2 },
            ]}
          >
            <Image
              source={n.source}
              style={{ width: '100%', height: '100%', borderRadius: n.size / 2 }}
              contentFit="cover"
            />
          </View>
        ))}

        {COMING_SOON_DIAMONDS.map((d, i) => (
          <FloatingDiamond key={`diamond-${i}`} left={d.left} top={d.top} size={d.size} delay={d.delay} />
        ))}
      </Reanimated.View>

      <Reanimated.View entering={FadeInUp.delay(250).duration(600).damping(14)} style={styles.comingSoonTextGroup}>
        <ThemedText type="displayLg" style={styles.comingSoonTitle}>
          Coming Soon
        </ThemedText>
        <ThemedText type="bodyLg" style={styles.comingSoonSubtitle}>
          We&apos;re building a whole new way for you to connect with players, teams, and friends. Stay tuned!
        </ThemedText>
      </Reanimated.View>
    </View>
  );
}

export default function NetworkScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const isPlayerRole = profile.role === 'Player';
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<'All' | 'Cricket' | 'Football' | 'Badminton'>('All');
  const [connectedIds, setConnectedIds] = useState<Record<string, boolean>>({ p1: true });

  const shortLocation = getShortLocation(profile.location);

  const toggleConnect = (id: string) => {
    setConnectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredPlayers = NETWORK_PLAYERS.filter((player) => {
    const matchesSport = selectedSport === 'All' || player.sport === selectedSport;
    const matchesSearch =
      searchQuery.trim().length === 0 ||
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.sport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  if (isPlayerRole) {
    return (
      <GradientContainer screenName="network" style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <PlayerNetworkComingSoon />
        </SafeAreaView>
      </GradientContainer>
    );
  }

  return (
    <GradientContainer screenName="network" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar with Username (Azarudeen) and Location Short Form */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={getAvatarSource(profile.avatarUrl)}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {shortLocation}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/matches')}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <Image
                source={require('@/assets/images/coin_toss_icon.png')}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section with Community Badge */}
          <Reanimated.View entering={FadeInDown.duration(500).damping(14)} style={styles.heroHeader}>
            <View style={styles.communityBadge}>
              <Ionicons name="sparkles" size={12} color="#FFA751" />
              <ThemedText style={styles.communityBadgeText}>
                SPORTS CONNECT & COMMUNITY
              </ThemedText>
            </View>
            <ThemedText type="headlineLg" style={[styles.mainHeadline, { color: theme.text }]}>
              Player Network & FoF Graph
            </ThemedText>
            <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
              Discover nearby teammates, challenge mutual friends, and join live turf matches.
            </ThemedText>
          </Reanimated.View>

          {/* Animated Interactive Image & Constellation */}
          <Reanimated.View entering={FadeInDown.delay(100).duration(600).damping(14)}>
            <AnimatedNetworkVisualizer />
          </Reanimated.View>

          {/* Search & Filter Bar */}
          <Reanimated.View entering={FadeInDown.delay(200).duration(500).damping(14)} style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
              <Ionicons name="search" size={18} color="#8b5cf6" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search athletes, roles, or sports..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </Pressable>
              )}
            </View>

            {/* Sport Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {(['All', 'Cricket', 'Football', 'Badminton'] as const).map((sport) => {
                const isSelected = selectedSport === sport;
                return (
                  <Pressable
                    key={sport}
                    style={[
                      styles.filterChip,
                      isSelected ? { backgroundColor: '#8b5cf6' } : { backgroundColor: 'rgba(255, 255, 255, 0.75)' },
                    ]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <ThemedText
                      type="labelSm"
                      style={{
                        color: isSelected ? '#ffffff' : '#4b5563',
                        fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_600SemiBold',
                        fontSize: 12,
                      }}
                    >
                      {sport}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Reanimated.View>

          {/* Quick Match Challenge Card */}
          <Reanimated.View entering={FadeInDown.delay(250).duration(500).damping(14)}>
            <LinearGradient
              colors={['#7e22ce', '#581c87']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.challengeBanner}
            >
              <View style={{ flex: 1 }}>
                <ThemedText type="headlineSm" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
                  Host Quick Challenge
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: 'rgba(255, 255, 255, 0.85)', marginTop: 4, fontSize: 11 }}>
                  Broadcast match invites to mutual connections in {shortLocation}.
                </ThemedText>
              </View>
              <Pressable
                style={styles.challengeButton}
                onPress={() => router.push('/new-match')}
              >
                <ThemedText style={styles.challengeButtonText}>CREATE</ThemedText>
                <Ionicons name="arrow-forward" size={14} color="#7e22ce" />
              </Pressable>
            </LinearGradient>
          </Reanimated.View>

          {/* Connected Player Cards List */}
          <View style={styles.playersListSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                Nearby Connections ({filteredPlayers.length})
              </ThemedText>
              <ThemedText type="labelSm" style={{ color: '#8b5cf6', fontFamily: 'Sora_700Bold' }}>
                LIVE RADAR
              </ThemedText>
            </View>

            {filteredPlayers.map((player, idx) => {
              const isConnected = connectedIds[player.id];
              return (
                <Reanimated.View
                  key={player.id}
                  entering={FadeInDown.delay(300 + idx * 80).duration(500).damping(14)}
                  style={styles.playerCard}
                >
                  <View style={styles.playerCardTop}>
                    <View style={styles.playerAvatarContainer}>
                      <Image
                        source={{ uri: player.avatar }}
                        style={styles.playerAvatar}
                        contentFit="cover"
                      />
                      {player.online && <View style={styles.onlineBadge} />}
                    </View>

                    <View style={styles.playerInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <ThemedText type="bodyMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
                          {player.name}
                        </ThemedText>
                        <View style={styles.skillBadge}>
                          <ThemedText style={styles.skillBadgeText}>{player.skillLevel}</ThemedText>
                        </View>
                      </View>

                      <ThemedText style={styles.playerHandle}>
                        {player.sport} • {player.role}
                      </ThemedText>

                      <View style={styles.playerStatsRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="location" size={11} color="#6b7280" />
                          <ThemedText style={styles.metaText}>{player.distance}</ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                          <Ionicons name="people" size={11} color="#8b5cf6" />
                          <ThemedText style={[styles.metaText, { color: '#8b5cf6', fontWeight: '600' }]}>
                            {player.mutualCount} mutual
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Status Banner */}
                  <View style={styles.playerStatusBanner}>
                    <Ionicons name="radio-button-on" size={10} color="#10b981" style={{ marginRight: 6 }} />
                    <ThemedText style={styles.statusText}>{player.status}</ThemedText>
                  </View>

                  {/* Card Action Controls */}
                  <View style={styles.playerActionsRow}>
                    <Pressable
                      style={[
                        styles.connectButton,
                        isConnected ? styles.connectedButton : styles.unconnectedButton,
                      ]}
                      onPress={() => toggleConnect(player.id)}
                    >
                      <Ionicons
                        name={isConnected ? 'checkmark-circle' : 'person-add'}
                        size={14}
                        color={isConnected ? '#059669' : '#ffffff'}
                        style={{ marginRight: 6 }}
                      />
                      <ThemedText
                        style={[
                          styles.connectButtonText,
                          { color: isConnected ? '#059669' : '#ffffff' },
                        ]}
                      >
                        {isConnected ? 'Connected' : 'Connect'}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      style={styles.challengeActionBtn}
                      onPress={() => router.push('/new-match')}
                    >
                      <ThemedText style={styles.challengeActionText}>Challenge</ThemedText>
                      <Ionicons name="trophy-outline" size={14} color="#8b5cf6" />
                    </Pressable>
                  </View>
                </Reanimated.View>
              );
            })}
          </View>
        </ScrollView>

        <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
      </SafeAreaView>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconButton: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: 110,
  },
  heroHeader: {
    marginTop: 14,
    marginBottom: 8,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 167, 81, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  communityBadgeText: {
    color: '#FFA751',
    fontWeight: '800',
    fontSize: 10,
    marginLeft: 4,
    letterSpacing: 1.2,
  },
  mainHeadline: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  visualizerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  glowHalo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
  },
  visualizerCard: {
    width: '100%',
    height: 290,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  networkMainImage: {
    width: '90%',
    height: '90%',
  },
  floatingPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingPillText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: 'Sora_700Bold',
  },
  searchSection: {
    marginVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: 10,
    shadowColor: '#7e22ce',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  challengeButtonText: {
    color: '#7e22ce',
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
  },
  playersListSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  playerCardTop: {
    flexDirection: 'row',
  },
  playerAvatarContainer: {
    position: 'relative',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#c084fc',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  playerHandle: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 1,
  },
  skillBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  skillBadgeText: {
    color: '#7e22ce',
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
  },
  playerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 11,
    marginLeft: 3,
  },
  playerStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginTop: 10,
  },
  statusText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: 'Sora_600SemiBold',
  },
  playerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  connectButton: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unconnectedButton: {
    backgroundColor: '#8b5cf6',
  },
  connectedButton: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  connectButtonText: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
  },
  challengeActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 6,
  },
  challengeActionText: {
    color: '#8b5cf6',
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
  },
  comingSoonScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerMargin,
  },
  comingSoonVisual: {
    width: 300,
    height: 300,
    position: 'relative',
    marginVertical: Spacing.lg,
  },
  bridge: {
    position: 'absolute',
  },
  avatarRing: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  diamond: {
    position: 'absolute',
    borderRadius: 3,
    overflow: 'hidden',
  },
  comingSoonTextGroup: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  comingSoonTitle: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  comingSoonSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    paddingHorizontal: Spacing.lg,
  },
});
