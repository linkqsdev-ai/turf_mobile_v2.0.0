import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FontAwesome5, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { turfApi } from '@/services/turf-api';
import {
  Alert,
  Clipboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { SPORTS_LIST } from '@/constants/sports';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/context/NotificationContext';
import { isTimeSlotPassed } from '@/utils/date-utils';
import { FoFPlayerSearchModal } from '@/components/fof/FoFPlayerSearchModal';
import { getFoFConnection } from '@/services/fof-network';
import { FoFAvatarStack } from '@/components/fof/FoFAvatarStack';

const BID_AMOUNTS = [50, 100, 200, 500];

const TEAMS = [
  {
    id: '1',
    name: 'Chennai Super Strikers',
    short: 'CSS',
    image: require('@/assets/images/mascots/warrior.png'),
    winRate: 78,
    rating: 4.8,
    matches: 45,
    captain: 'Guna',
    captainPhone: '+91 98765 11111',
    division: 'Division 1 • Elite',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Skyline Turf, Velachery',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: '2',
    name: 'Marina Blasters',
    short: 'MBL',
    image: require('@/assets/images/mascots/panther.png'),
    winRate: 85,
    rating: 4.9,
    matches: 62,
    captain: 'Siva',
    captainPhone: '+91 98765 22222',
    division: 'Division 2 • Premier',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'L', 'W', 'W'] as const,
    homeGround: 'Turf Park, Guindy',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: '3',
    name: 'Royals XI',
    short: 'RXI',
    image: require('@/assets/images/mascots/tiger.png'),
    winRate: 88,
    rating: 4.9,
    matches: 94,
    captain: 'Asif',
    captainPhone: '+91 98765 33333',
    division: 'Pro League Super',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'W', 'W'] as const,
    homeGround: 'Eden Gardens Turf, Nungambakkam',
    mutualFriend: {
      name: 'Siva',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      mutualCount: 3,
    },
  },
  {
    id: '4',
    name: 'Weekend Warriors',
    short: 'WW',
    image: require('@/assets/images/mascots/eagle.png'),
    winRate: 82,
    rating: 4.8,
    matches: 45,
    captain: 'Alex Rivera',
    captainPhone: '+91 98765 11112',
    division: 'Division 1 • Elite',
    sport: 'Football ⚽',
    recentForm: ['W', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Apex Turf Arena',
    mutualFriend: {
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: '5',
    name: 'Neon Knights',
    short: 'NNK',
    image: require('@/assets/images/mascots/panther.png'),
    winRate: 91,
    rating: 4.9,
    matches: 128,
    captain: 'Marcus Vance',
    captainPhone: '+91 98765 22223',
    division: 'Pro Champions League',
    sport: 'Futsal ⚽',
    recentForm: ['W', 'W', 'W', 'W', 'W'] as const,
    homeGround: 'Metro Futsal Hub',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: '6',
    name: 'Rahul XI',
    short: 'RHL',
    image: require('@/assets/images/mascots/warrior.png'),
    winRate: 65,
    rating: 4.6,
    matches: 28,
    captain: 'Rahul Sharma',
    captainPhone: '+91 98765 33334',
    division: 'Division 3 • Challenger',
    sport: 'Cricket 🏏',
    recentForm: ['L', 'W', 'L', 'W', 'W'] as const,
    homeGround: 'Skyline Ground 3',
    mutualFriend: {
      name: 'Siva',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      mutualCount: 3,
    },
  },
  {
    id: '7',
    name: 'Smash Masters',
    short: 'SMM',
    image: require('@/assets/images/mascots/eagle.png'),
    winRate: 84,
    rating: 4.8,
    matches: 52,
    captain: 'Sarah Jenkins',
    captainPhone: '+91 98765 11114',
    division: 'Division 1 • Premier',
    sport: 'Badminton 🏸',
    recentForm: ['W', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Apex Badminton Arena',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: '8',
    name: 'Apex Shuttle Club',
    short: 'ASC',
    image: require('@/assets/images/mascots/panther.png'),
    winRate: 77,
    rating: 4.7,
    matches: 38,
    captain: 'Priya Sundaram',
    captainPhone: '+91 98765 22224',
    division: 'Division 2 • Super',
    sport: 'Badminton 🏸',
    recentForm: ['W', 'L', 'W', 'W', 'W'] as const,
    homeGround: 'Skyline Badminton Hall',
    mutualFriend: {
      name: 'Siva',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: '9',
    name: 'Dunk Kings',
    short: 'DKG',
    image: require('@/assets/images/mascots/warrior.png'),
    winRate: 89,
    rating: 4.9,
    matches: 76,
    captain: 'Kevin Hayes',
    captainPhone: '+91 98765 11115',
    division: 'Pro League Elite',
    sport: 'Basketball 🏀',
    recentForm: ['W', 'W', 'W', 'W', 'L'] as const,
    homeGround: 'Metro Indoor Hoops',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: '10',
    name: 'Hoop Legends',
    short: 'HLG',
    image: require('@/assets/images/mascots/tiger.png'),
    winRate: 72,
    rating: 4.5,
    matches: 44,
    captain: 'Antony',
    captainPhone: '+91 98765 33335',
    division: 'Division 1 • Metro',
    sport: 'Basketball 🏀',
    recentForm: ['L', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Vanguard Basketball Court',
    mutualFriend: {
      name: 'Asif',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      mutualCount: 3,
    },
  },
  {
    id: '11',
    name: 'Thunder Spikers',
    short: 'TSP',
    image: require('@/assets/images/mascots/eagle.png'),
    winRate: 80,
    rating: 4.7,
    matches: 35,
    captain: 'Vikram Patel',
    captainPhone: '+91 98765 22225',
    division: 'Division 1 • Elite',
    sport: 'Volleyball 🏐',
    recentForm: ['W', 'W', 'L', 'W', 'W'] as const,
    homeGround: 'Metro Beach & Turf Volley',
    mutualFriend: {
      name: 'Siva',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: '12',
    name: 'Ace Smashers',
    short: 'ASM',
    image: require('@/assets/images/mascots/panther.png'),
    winRate: 86,
    rating: 4.8,
    matches: 48,
    captain: 'Elena Rostova',
    captainPhone: '+91 98765 33336',
    division: 'Pro Grand Slam',
    sport: 'Tennis 🎾',
    recentForm: ['W', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Skyline Tennis Club',
    mutualFriend: {
      name: 'Asif',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      mutualCount: 3,
    },
  },
];

import { useBidStore } from '@/store/app-store';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Modal } from 'react-native';

export interface BidMatchTabProps {
  showBidListModalExternal?: boolean;
  onCloseBidListModalExternal?: () => void;
}

export function BidMatchTab({
  showBidListModalExternal = false,
  onCloseBidListModalExternal,
}: BidMatchTabProps = {}) {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { addNotification } = useNotifications();
  const { bids, addBid } = useBidStore();
  const { profile } = useUserProfile();
  const [showBidListModal, setShowBidListModal] = useState(false);
  const [showFoFSearchModal, setShowFoFSearchModal] = useState(false);

  const getCurrentFormattedTiming = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  const [bidAmount, setBidAmount] = useState(100);
  const [customBid, setCustomBid] = useState('');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [selectedTiming, setSelectedTiming] = useState(getCurrentFormattedTiming());
  const [selectedTurfType, setSelectedTurfType] = useState<'Turf' | 'Ground' | ''>('Turf');
  const [groundName, setGroundName] = useState('');
  const [turfsList, setTurfsList] = useState<string[]>([]);
  const [showTurfDropdown, setShowTurfDropdown] = useState(false);

  useEffect(() => {
    turfApi.listTurfs().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.turfs || [];
      const names = list.map((t: any) => t.name).filter(Boolean);
      const standard = [
        'Unais Turf',
        'Ravi Turf',
        'Emerald Green Arena',
        'Skyline Arena Elite',
        'The Grid Sports Complex',
        "Lord's View Pavillion",
      ];
      setTurfsList(Array.from(new Set([...names, ...standard])));
    }).catch(() => {
      setTurfsList([
        'Unais Turf',
        'Ravi Turf',
        'Emerald Green Arena',
        'Skyline Arena Elite',
        'The Grid Sports Complex',
      ]);
    });
  }, []);
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // DateTime Picker Control State
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [tempTime, setTempTime] = useState(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  });

  // Focus states
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter opponent teams dynamically by selected sport and search text
  const filteredTeams = TEAMS.filter((t) => {
    const matchesSearch =
      !searchText ||
      t.name.toLowerCase().includes(searchText.toLowerCase()) ||
      t.captain.toLowerCase().includes(searchText.toLowerCase()) ||
      ((t as any).captainPhone || '').includes(searchText);

    if (!selectedSport) return matchesSearch;
    const sportClean = selectedSport.toLowerCase();
    const teamSport = (t.sport || '').toLowerCase();
    const matchesSport =
      teamSport.includes(sportClean) ||
      (sportClean === 'football' && teamSport.includes('futsal')) ||
      (sportClean === 'futsal' && teamSport.includes('football'));

    return matchesSearch && matchesSport;
  });

  const handleAction = (type: 'open' | 'friend') => {
    // 1. Required Field: Match Timing
    if (!selectedTiming || !selectedTiming.trim()) {
      return showError('Match Timing Required *', 'Please select or pick a match timing.');
    }

    // 2. Required Field: Type (Turf or Ground)
    if (!selectedTurfType) {
      return showError('Type Required *', 'Please select either Turf or Ground for your bid match.');
    }

    if (type === 'friend' && !selectedTeam) {
      return showError('Opponent Required', 'Please select an opponent team to challenge.');
    }

    const amount = bidAmount || parseInt(customBid, 10) || 0;
    if (amount <= 0) {
      return showError('Bid Amount Required *', 'Please select or enter a valid bid stake amount.');
    }
    if (amount > 9999) {
      return showError('Bid Limit Exceeded', 'Custom bid stake cannot exceed ₹9,999.');
    }

    const targetGround = groundName.trim() || 'Skyline Turf Arena, Court #1';
    const opponentName = type === 'friend' ? TEAMS.find(t => t.id === selectedTeam)?.name || 'Challenger' : 'Open Opponent';

    // Create & post the new bid into live bids store!
    const newBidItem = {
      id: `bid-${Date.now()}`,
      tournament: `Bid Challenge: ${selectedSport}`,
      sport: selectedSport || 'Cricket',
      location: targetGround,
      category: selectedTurfType || 'Turf',
      turfType: selectedTurfType || 'Turf',
      venueType: selectedTurfType || 'Turf',
      type: 'Bid',
      status: type === 'friend' ? 'Challenge' : 'Accept Bid',
      isMe: true,
      isBid: true,
      playerName: profile?.name || 'Azarudeen',
      avatar: typeof profile?.avatarUrl === 'string' && profile.avatarUrl.startsWith('http') ? profile.avatarUrl : 'https://randomuser.me/api/portraits/men/45.jpg',
      team1: profile?.name ? `${profile.name.split(' ')[0]} XI` : 'Azar XI',
      team1Code: profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'AZ',
      team2: opponentName,
      opponentTeam: opponentName,
      team2Code: type === 'friend' ? 'OP' : 'VS',
      timeText: selectedTiming,
      subText: `Bid Active • Stake: ₹${amount} (${amount} Coins)`,
      statusColor: '#8b5cf6',
      section: 'Today',
      bidCoins: amount,
      createdAt: new Date().toISOString(),
    };

    addBid(newBidItem);

    showSuccess(
      type === 'open' ? 'Bid Challenge Live! 🏆' : 'Direct Challenge Sent! ⚡',
      `Bid of ₹${amount} for ${selectedSport} (${selectedTurfType}) at ${targetGround} is live in the Matches list!`
    );

    addNotification({
      title: type === 'open' ? 'New Broadcast Bid Challenge Posted!' : `Direct Challenge sent to ${opponentName}!`,
      body: `${selectedSport} match (${selectedTurfType}) • Stake: ₹${amount} • Venue: ${targetGround} • Time: ${selectedTiming}`,
      targetRole: 'All',
      type: 'bid',
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: 85 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={false}
      >
      {/* ── Stakes Header (Primary Container) ─────────────── */}
      <View style={[styles.stakeHeader, { backgroundColor: theme.primaryContainer }]}>
        <View style={styles.stakeTop}>
          <View>
            <ThemedText style={[styles.stakeLabel, { color: theme.onPrimaryContainer + 'b0' }]}>BID</ThemedText>
            <View style={styles.amountRow}>
              <ThemedText style={[styles.stakeAmount, { color: theme.onPrimaryContainer }]}>{bidAmount || customBid || 0}</ThemedText>
              <ThemedText style={[styles.stakeUnit, { color: theme.onPrimaryContainer + 'd0' }]}>Rupees</ThemedText>
            </View>
          </View>
        </View>

        {/* Bid amount selector */}
        <View style={styles.bidRow}>
          {BID_AMOUNTS.map((amt) => {
            const isActive = bidAmount === amt;
            return (
              <Pressable
                key={amt}
                onPress={() => {
                  setBidAmount(amt);
                  setCustomBid('');
                }}
                style={[
                  styles.bidChip,
                  isActive
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.onPrimaryContainer + '11', borderColor: theme.onPrimaryContainer + '22' }
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontFamily: isActive ? 'Sora_700Bold' : 'Sora_500Medium',
                    color: isActive ? '#ffffff' : theme.onPrimaryContainer,
                  }}
                >
                  {amt}
                </ThemedText>
              </Pressable>
            );
          })}
          <TextInput
            style={[
              styles.bidChip,
              { color: theme.onPrimaryContainer, borderColor: theme.onPrimaryContainer + '22', fontFamily: 'Sora_500Medium', fontSize: 12, textAlign: 'center' },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
            ]}
            placeholder="Custom"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={4}
            value={customBid}
            onChangeText={(val) => {
              const digits = val.replace(/[^0-9]/g, '').slice(0, 4);
              if (!digits) {
                setCustomBid('');
                setBidAmount(0);
                return;
              }
              const num = parseInt(digits, 10);
              const capped = num > 9999 ? '9999' : String(num);
              setCustomBid(capped);
              setBidAmount(0); // Clear preset selection when custom is typed
            }}
            onFocus={() => { setBidAmount(0); }}
          />
        </View>
      </View>

      {/* ── Form Body Bento Card ────────────────────────── */}
      <View style={styles.bentoCard}>

        {/* Sport selection */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sport</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportList}>
            {SPORTS_LIST.map((sport) => {
              const isActive = selectedSport === sport.name;
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => {
                    setSelectedSport(sport.name);
                    const matching = TEAMS.find(t => t.sport.toLowerCase().includes(sport.name.toLowerCase()));
                    if (matching) setSelectedTeam(matching.id);
                  }}
                  style={[
                    styles.sportChip,
                    {
                      backgroundColor: isActive ? theme.primary : theme.surfaceLow,
                      borderColor: isActive ? theme.primary : theme.outlineVariant + '40',
                      borderWidth: isActive ? 1.5 : 1,
                    },
                    Shadows.level1,
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={13}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.sportChipText,
                      { color: isActive ? '#ffffff' : theme.text },
                      isActive && { fontFamily: 'Sora_800ExtraBold' }
                    ]}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.formDivider, { backgroundColor: theme.outlineVariant + '44' }]} />



        {/* ── 1. Match Timing (Details Displayed in Top Label) ── */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Match Timing</ThemedText>
              <ThemedText style={{ color: '#ef4444', fontSize: 13, fontFamily: 'Sora_800ExtraBold', marginLeft: 3 }}>*</ThemedText>
            </View>

            <Pressable
              onPress={() => setShowDateTimePicker(true)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: theme.primary + '14',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  opacity: pressed ? 0.85 : 1,
                }
              ]}
            >
              <Ionicons name="time-outline" size={13} color={theme.primary} />
              <ThemedText style={{ color: theme.primary, fontSize: 12, fontFamily: 'Sora_700Bold' }}>
                {selectedTiming}
              </ThemedText>
              <Ionicons name="chevron-forward" size={12} color={theme.primary} />
            </Pressable>
          </View>
        </View>

        {/* ── 2. Turf / Ground Type Toggle (Reduced Compact Size) ── */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Type</ThemedText>
            <ThemedText style={{ color: '#ef4444', fontSize: 13, fontFamily: 'Sora_800ExtraBold', marginLeft: 3 }}>*</ThemedText>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Turf 🌿', value: 'Turf' as const },
              { label: 'Ground 🏟️', value: 'Ground' as const }
            ].map((tType) => {
              const isActive = selectedTurfType === tType.value;
              return (
                <Pressable
                  key={tType.value}
                  onPress={() => setSelectedTurfType(tType.value)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 5.5,
                      borderRadius: 8,
                      backgroundColor: isActive ? theme.primary + '18' : theme.surfaceLow,
                      borderColor: isActive ? theme.primary : theme.outlineVariant + '40',
                      borderWidth: isActive ? 1.5 : 1,
                      opacity: pressed ? 0.85 : 1,
                    }
                  ]}
                >
                  <ThemedText style={{ color: isActive ? theme.primary : theme.text, fontSize: 11.5, fontFamily: isActive ? 'Sora_700Bold' : 'Sora_600SemiBold', textAlign: 'center', width: '100%' }}>
                    {tType.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 3. Turf Name (Searchable Dropdown) or Ground Name ── */}
        {selectedTurfType === 'Turf' ? (
          <View style={[styles.inputGroup, { zIndex: 30, position: 'relative' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Turf Name</ThemedText>
              <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>Search & Select</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLow, borderRadius: 8, borderWidth: 1, borderColor: showTurfDropdown ? theme.primary : theme.outlineVariant + '40', paddingHorizontal: 12, height: 42 }}>
              <Ionicons name="search-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[
                  { flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 },
                  Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
                ]}
                placeholder="Search or select turf..."
                placeholderTextColor="#94a3b8"
                value={groundName}
                onFocus={() => setShowTurfDropdown(true)}
                onChangeText={(text) => {
                  setGroundName(text);
                  setShowTurfDropdown(true);
                }}
              />
              <Pressable onPress={() => setShowTurfDropdown(!showTurfDropdown)} style={{ padding: 4 }}>
                <Ionicons name={showTurfDropdown ? "chevron-up" : "chevron-down"} size={15} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Dropdown Suggestions: in-flow collapsible with solid background */}
            {showTurfDropdown && (
              <View style={{
                marginTop: 8,
                backgroundColor: '#ffffff',
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: theme.primary,
                maxHeight: 150,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 8,
                overflow: 'hidden',
              }}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {turfsList
                    .filter(t => !groundName || t.toLowerCase().includes(groundName.toLowerCase()))
                    .map((tName, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setGroundName(tName);
                          setShowTurfDropdown(false);
                        }}
                        style={({ pressed }) => [
                          {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderBottomWidth: idx < turfsList.length - 1 ? 1 : 0,
                            borderBottomColor: '#f1f5f9',
                            backgroundColor: pressed ? '#f1f5f9' : '#ffffff',
                          }
                        ]}
                      >
                        <Ionicons name="location-sharp" size={14} color={theme.primary} />
                        <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_600SemiBold', color: '#0f172a' }}>
                          {tName}
                        </ThemedText>
                      </Pressable>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Ground Name</ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>Optional</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLow, borderRadius: 12, borderWidth: 1, borderColor: theme.outlineVariant + '40', paddingHorizontal: 12, height: 42 }}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[
                  { flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 },
                  Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
                ]}
                placeholder="e.g. Skyline Turf Arena, Court #1"
                placeholderTextColor="#94a3b8"
                value={groundName}
                onChangeText={setGroundName}
              />
            </View>
          </View>
        )}

        <View style={[styles.formDivider, { backgroundColor: theme.outlineVariant + '44' }]} />

        {/* Team list with Phone Number & 3-Chain FoF Network */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
              Find & Select Opponent Team
            </ThemedText>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.surfaceLowest, borderColor: isSearchFocused ? theme.primary : theme.outlineVariant + '44' }
            ]}
          >
            <Ionicons name="search" size={14} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
                { color: theme.text },
                Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
              ]}
              placeholder="Search by team, captain, or phone number..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>

          {/* Floating Team Cards List with 3-Chain FoF Network */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {filteredTeams.map((team) => {
              const isSelected = selectedTeam === team.id;
              const captainPhone = (team as any).captainPhone || '+91 98765 11111';

              return (
                <Pressable
                  key={team.id}
                  onPress={() => setSelectedTeam(team.id)}
                  style={[
                    styles.teamCardContainer,
                    {
                      backgroundColor: isSelected ? theme.primaryContainer + '15' : theme.surfaceLowest,
                      borderColor: isSelected ? theme.primary : theme.outlineVariant + '35',
                      borderWidth: isSelected ? 2 : 1,
                    },
                    Shadows.level2,
                  ]}
                >
                  {/* Header Row: Mascot Crest, Name, Division, Radio */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Crest Container with Mascot */}
                    <View style={[styles.teamMascotWrap, { backgroundColor: isSelected ? theme.primaryContainer + '25' : theme.surfaceLow }]}>
                      <Image source={team.image} style={{ width: 38, height: 38 }} contentFit="contain" />
                    </View>

                    {/* Team Main Info */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_800ExtraBold', fontSize: 15, flex: 1, marginRight: 8 }} numberOfLines={1}>
                          {team.name}
                        </ThemedText>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {/* Multiple Player FoF Stack View (Click to inspect popup) */}
                          <FoFAvatarStack
                            teamName={team.name}
                            captainName={team.captain}
                            size={22}
                            showCountBadge={true}
                          />

                          <View style={[styles.selectRadioDot, { borderColor: isSelected ? theme.primary : theme.outlineVariant }]}>
                            {isSelected && <View style={[styles.selectRadioDotInner, { backgroundColor: theme.primary }]} />}
                          </View>
                        </View>
                      </View>

                      <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_700Bold', marginTop: 1 }}>
                        {team.sport} • <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>{team.division}</ThemedText>
                      </ThemedText>

                      {/* Captain & Icon-Only Phone and Chain Controls */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>
                          Captain: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>{team.captain}</ThemedText>
                        </ThemedText>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {/* Phone Icon Only Button (Don't show phone number text) */}
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              Clipboard.setString(captainPhone);
                              showSuccess('Phone Copied', `${team.captain}'s phone (${captainPhone}) copied.`);
                            }}
                            style={styles.phoneIconBtn}
                            hitSlop={6}
                          >
                            <Ionicons name="call" size={11} color={theme.primary} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Stats Grid Bar */}
                  <View style={[styles.teamStatsBar, { backgroundColor: isSelected ? theme.primaryContainer + '1F' : theme.surfaceLow }]}>
                    <View style={styles.statCol}>
                      <ThemedText style={styles.statLabel}>WIN RATE</ThemedText>
                      <ThemedText style={[styles.statVal, { color: team.winRate >= 80 ? '#16a34a' : theme.text }]}>
                        {team.winRate}%
                      </ThemedText>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                      <ThemedText style={styles.statLabel}>MATCHES</ThemedText>
                      <ThemedText style={[styles.statVal, { color: theme.text }]}>
                        {team.matches} Played
                      </ThemedText>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                      <ThemedText style={styles.statLabel}>FORM (LAST 5)</ThemedText>
                      <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
                        {team.recentForm.map((res, i) => (
                          <View
                            key={i}
                            style={[
                              styles.formDot,
                              { backgroundColor: res === 'W' ? '#22c55e' : '#ef4444' }
                            ]}
                          >
                            <ThemedText style={{ color: '#ffffff', fontSize: 7.5, fontFamily: 'Sora_800ExtraBold' }}>
                              {res}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Home Ground Footer */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={11} color={theme.textSecondary} style={{ marginRight: 3 }} />
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>
                        Home: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>{team.homeGround}</ThemedText>
                      </ThemedText>
                    </View>
                    <ThemedText style={{ color: isSelected ? theme.primary : theme.textSecondary, fontSize: 10, fontFamily: 'Sora_700Bold' }}>
                      {isSelected ? '✓ Ready to Bid' : 'Tap to Select'}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

      </View>
      </ScrollView>

      {/* ── Actions Row (Primary CTA) ────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest }]}>
        <Pressable
          onPress={() => handleAction('open')}
          style={[styles.secondaryButton, { borderColor: theme.primary, borderWidth: 1, marginBottom: 10 }]}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: theme.primary }]}>
            Broadcast Open Bid
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => handleAction('friend')}
          style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: selectedTeam ? 1 : 0.5 }]}
          disabled={!selectedTeam}
        >
          <View style={styles.btnContent}>
            <ThemedText style={styles.primaryButtonText}>
              {selectedTeam ? 'Send Challenge' : 'Select Opponent to Challenge'}
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </View>
        </Pressable>
      </View>

      {/* ── Monthly Calendar + Time Picker Modal Component ── */}
      <Modal visible={showDateTimePicker} transparent animationType="slide" onRequestClose={() => setShowDateTimePicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surfaceLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="calendar" size={18} color={theme.primary} />
                </View>
                <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                  Select Start Date
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowDateTimePicker(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            {/* Month Navigation Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 4 }}>
              <Pressable style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                August 2026
              </ThemedText>
              <Pressable style={{ padding: 6 }}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Day Names Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 4 }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                <ThemedText key={day} style={{ width: 36, textAlign: 'center', fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
                  {day}
                </ThemedText>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {/* August 2026 starts on Saturday -> 5 empty cells for Mo-Fr */}
              {[...Array(5)].map((_, i) => (
                <View key={`empty-${i}`} style={{ width: '14.28%', height: 38 }} />
              ))}
              {[...Array(31)].map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;
                const todayDate = new Date().getDate();
                const isPastDay = dayNum < todayDate;
                return (
                  <View key={dayNum} style={{ width: '14.28%', height: 38, justifyContent: 'center', alignItems: 'center' }}>
                    <Pressable
                      disabled={isPastDay}
                      onPress={() => {
                        setSelectedDay(dayNum);
                        const matchTimes = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];
                        const targetD = new Date(new Date().getFullYear(), new Date().getMonth(), dayNum);
                        if (isTimeSlotPassed(tempTime, targetD)) {
                          const firstValid = matchTimes.find(t => !isTimeSlotPassed(t, targetD));
                          if (firstValid) setTempTime(firstValid);
                        }
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: isPastDay ? 0.35 : 1,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: isSelected ? '#ffffff' : isPastDay ? theme.textSecondary : theme.text,
                          fontSize: 13,
                          fontFamily: isSelected ? 'Sora_800ExtraBold' : 'Sora_500Medium',
                        }}
                      >
                        {dayNum}
                      </ThemedText>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: theme.outlineVariant + '30', marginVertical: 2 }} />

            {/* Time Selection Header & Slots */}
            <View>
              <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_700Bold', color: theme.textSecondary, marginBottom: 8 }}>
                SELECT MATCH TIME
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map((t) => {
                  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth(), selectedDay);
                  const isPassed = isTimeSlotPassed(t, targetDate);
                  const isSelected = tempTime === t;

                  return (
                    <Pressable
                      key={t}
                      disabled={isPassed}
                      onPress={() => setTempTime(t)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 6,
                        backgroundColor: isSelected ? theme.primary + '20' : theme.surfaceLow,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : theme.outlineVariant + '40',
                        opacity: isPassed ? 0.35 : 1,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: isSelected ? theme.primary : isPassed ? theme.textSecondary : theme.text,
                          fontSize: 11.5,
                          fontFamily: 'Sora_700Bold',
                          textDecorationLine: isPassed ? 'line-through' : 'none',
                        }}
                      >
                        {t}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Confirm Button */}
            <Pressable
              onPress={() => {
                setSelectedTiming(`${selectedDay} Aug 2026, ${tempTime}`);
                setShowDateTimePicker(false);
              }}
              style={{ backgroundColor: theme.primary, paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 4 }}
            >
              <ThemedText style={{ color: '#ffffff', fontSize: 13.5, fontFamily: 'Sora_800ExtraBold' }}>
                Confirm Timing ({selectedDay} Aug 2026, {tempTime})
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Active Bids List Modal (With Scoreboard Navigation) ── */}
      <Modal
        visible={showBidListModal || showBidListModalExternal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowBidListModal(false);
          onCloseBidListModalExternal?.();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.bidListModalSheet, { backgroundColor: theme.surfaceLowest }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalIconBox, { backgroundColor: theme.primary + '18' }]}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <ThemedText style={{ fontSize: 16, fontFamily: 'Sora_800ExtraBold', color: theme.text }}>
                    Active Bids & Challenges
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                    {bids.length} challenge{bids.length !== 1 ? 's' : ''} live • Tap any card to open Scoreboard
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setShowBidListModal(false);
                  onCloseBidListModalExternal?.();
                }}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            {/* Bids List Scroll Filtered by Selected Sport */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 12 }}>
              {(() => {
                const sportFilteredBids = bids.filter((b) => {
                  if (!selectedSport) return true;
                  const s1 = (b.sport || b.tournament || '').toLowerCase();
                  const s2 = selectedSport.toLowerCase();
                  return s1.includes(s2) || (s2 === 'football' && s1.includes('futsal')) || (s2 === 'futsal' && s1.includes('football'));
                });

                if (sportFilteredBids.length === 0) {
                  return (
                    <View style={styles.emptyBidsBox}>
                      <Ionicons name="hand-left-outline" size={44} color={theme.textSecondary + '60'} />
                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_700Bold', color: theme.text, marginTop: 8 }}>
                        No Active {selectedSport} Bids Found
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11.5, color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                        Broadcast an open bid or challenge a {selectedSport} team above to activate a match!
                      </ThemedText>
                    </View>
                  );
                }

                return sportFilteredBids.map((bid) => {
                  const sportInfo = (() => {
                    const combined = `${bid.sport || ''} ${bid.tournament || ''}`.toLowerCase();
                    if (combined.includes('football')) return { name: 'Football', icon: '⚽', color: '#3b82f6' };
                    if (combined.includes('futsal')) return { name: 'Futsal', icon: '⚽', color: '#06b6d4' };
                    if (combined.includes('badminton')) return { name: 'Badminton', icon: '🏸', color: '#ec4899' };
                    if (combined.includes('tennis')) return { name: 'Tennis', icon: '🎾', color: '#eab308' };
                    if (combined.includes('basketball')) return { name: 'Basketball', icon: '🏀', color: '#f97316' };
                    if (combined.includes('volleyball')) return { name: 'Volleyball', icon: '🏐', color: '#8b5cf6' };
                    return { name: 'Cricket', icon: '🏏', color: '#10b981' };
                  })();

                  const isAcceptBid = (bid.status || '').toLowerCase().includes('accept');
                  const opponentName = bid.opponentTeam || bid.team2 || 'Open Opponent';

                  const isFinalized = Boolean(
                    opponentName &&
                    opponentName !== 'Open Opponent' &&
                    opponentName !== 'VS' &&
                    !isAcceptBid &&
                    bid.status !== 'Requested'
                  );

                  return (
                    <Pressable
                      key={bid.id}
                      onPress={() => {
                        if (!isFinalized) {
                          Alert.alert(
                            'Opponent Not Finalized ⏳',
                            'This bid challenge is waiting for an opponent to accept. You can navigate to the scoreboard once an opponent has accepted and finalized the match.'
                          );
                          return;
                        }

                        setShowBidListModal(false);
                        onCloseBidListModalExternal?.();
                        router.push({
                          pathname: '/scoring',
                          params: {
                            matchId: bid.id,
                            sport: sportInfo.name,
                            teamA: bid.team1 || 'Team 1',
                            teamB: opponentName,
                          },
                        });
                      }}
                      style={({ pressed }) => [
                        styles.bidItemCard,
                        {
                          backgroundColor: theme.surfaceLow,
                          borderColor: theme.outlineVariant + '40',
                          opacity: pressed ? 0.9 : 1,
                        },
                        Shadows.level1,
                      ]}
                    >
                      {/* Top Row: FoF Stack & Bid Stake */}
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {/* Multiple Player FoF Stack View */}
                          <FoFAvatarStack
                            teamName={opponentName}
                            captainName={bid.playerName}
                            size={20}
                            showCountBadge={true}
                          />

                          {/* Bid Stake Coins */}
                          <View style={[styles.bidStakePill, { backgroundColor: '#8b5cf618', borderColor: '#8b5cf640' }]}>
                            <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_800ExtraBold', color: '#8b5cf6' }}>
                              ₹{bid.bidCoins || 100} Coins
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      {/* Matchup Banner with Explicit Opponent Team Name */}
                      <View style={styles.matchupRow}>
                        {/* Challenger */}
                        <View style={styles.teamCol}>
                          <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', color: '#64748b', letterSpacing: 0.6, marginBottom: 1 }}>
                            CHALLENGER
                          </ThemedText>
                          <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_800ExtraBold', color: theme.text }} numberOfLines={1}>
                            {bid.team1 || 'Rahul XI'}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 9.5, color: theme.textSecondary, marginTop: 1 }}>
                            {bid.playerName || 'Challenger'}
                          </ThemedText>
                        </View>

                        {/* VS Badge */}
                        <View style={[styles.vsBadge, { backgroundColor: theme.primary + '18' }]}>
                          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_800ExtraBold', color: theme.primary }}>
                            VS
                          </ThemedText>
                        </View>

                        {/* Opponent Team */}
                        <View style={[styles.teamCol, { alignItems: 'flex-end' }]}>
                          <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_800ExtraBold', color: '#64748b', letterSpacing: 0.6, marginBottom: 1 }}>
                            OPPONENT TEAM
                          </ThemedText>
                          <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_800ExtraBold', color: theme.text, textAlign: 'right' }} numberOfLines={1}>
                            {opponentName}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 9.5, color: opponentName !== 'Open Opponent' ? theme.primary : theme.textSecondary, marginTop: 1, fontFamily: 'Sora_700Bold' }}>
                            {opponentName !== 'Open Opponent' ? 'Direct Challenge' : 'Awaiting Challenger'}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Timing & Venue */}
                      <View style={styles.bidMetaRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                          <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                          <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }} numberOfLines={1}>
                            {bid.timeText || 'Today, 8:00 PM'}
                          </ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
                          <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                          <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary }} numberOfLines={1}>
                            {bid.location || 'Turf Arena'}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Action Bar (Scoreboard) */}
                      <View style={[styles.bidCardFooter, { borderTopColor: theme.outlineVariant + '25', justifyContent: 'flex-end' }]}>
                        <View style={styles.scoreNavBtn}>
                          <ThemedText style={{
                            fontSize: 11.5,
                            fontFamily: 'Sora_800ExtraBold',
                            color: isFinalized ? theme.primary : theme.textSecondary,
                            marginRight: 3
                          }}>
                            {isFinalized ? 'Scoreboard' : 'Pending ⏳'}
                          </ThemedText>
                          <Ionicons
                            name={isFinalized ? "arrow-forward-circle" : "time-outline"}
                            size={17}
                            color={isFinalized ? theme.primary : theme.textSecondary}
                          />
                        </View>
                      </View>
                    </Pressable>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🌐 3-Chain FoF Network Player Search Modal */}
      <FoFPlayerSearchModal
        visible={showFoFSearchModal}
        onClose={() => setShowFoFSearchModal(false)}
        onSelectPlayer={(player) => {
          setSearchText(player.name);
          setShowFoFSearchModal(false);
          showSuccess('Player Selected', `Selected ${player.name} (${player.phone}) from 3-Chain network.`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  /* Stake Header */
  stakeHeader: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  stakeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bidIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bidIconBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bidIconBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Sora_800ExtraBold',
  },
  stakeLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#cbd5e1b0',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  stakeAmount: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 36,
    lineHeight: 40,
    color: '#ffffff',
  },
  stakeUnit: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    color: '#ffc703',
    marginBottom: 4,
  },
  bidRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bidChip: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Bento Card Container */
  bentoCard: {
    padding: 0,
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.1,
    marginBottom: 3,
    color: '#64748b',
  },
  formDivider: {
    height: 1,
    marginVertical: 12,
  },
  sportList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  sportChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    marginLeft: 4,
  },

  /* Find Team Styles & Floating Cards */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    marginLeft: 8,
    ...({ outlineStyle: 'none', outlineWidth: 0 } as any),
  },
  teamCardContainer: {
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  teamMascotWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectRadioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectRadioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 8,
    fontFamily: 'Sora_700Bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 11,
    fontFamily: 'Sora_800ExtraBold',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#cbd5e150',
  },
  formDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Actions container */
  actionsContainer: {
    flexDirection: 'column',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
  },
  primaryButton: {
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level2,
  },
  secondaryButton: {
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 13,
  },

  /* Profile Icon Only Styles for Ask Bid Card */
  profileIconWrap: {
    position: 'relative',
    width: 26,
    height: 26,
  },
  profileIconImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e1',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  profileIconDot: {
    position: 'absolute',
    bottom: -1,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  phoneIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f618',
    borderWidth: 1,
    borderColor: '#3b82f635',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Bid List Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bidListModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBidsBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidItemCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  bidStakePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  teamCol: {
    flex: 1,
  },
  vsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  bidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bidCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  scoreNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
