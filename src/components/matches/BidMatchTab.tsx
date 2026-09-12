import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FontAwesome5, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { turfApi } from '@/services/turf-api';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/context/NotificationContext';
import { isTimeSlotPassed } from '@/utils/date-utils';
import { FoFPlayerSearchModal } from '@/components/fof/FoFPlayerSearchModal';
import { getFoFConnection, getTeamFoFConnections } from '@/services/fof-network';
import { FoFAvatarStack } from '@/components/fof/FoFAvatarStack';
import { useWalletStore, useBidStore, useTurfStore } from '@/store/app-store';
import { PulseDot } from '@/components/home/dashboard-widgets';

const BID_AMOUNTS = [50, 100, 200, 500];
const QUICK_TURFS = ['Unais Turf', 'Ravi Turf', 'Emerald Green Arena', 'Skyline Arena Elite'];

const TEAMS = [
  // ─── Level 1: Direct Contacts (1st Degree Friends) ───────────────────────────
  {
    id: 'css-team-1',
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
    fofDegree: 1,
    friendName: 'Guna',
    friendRelation: 'Direct Friend (Captain)',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'london-lions-bid',
    name: 'London Lions CC',
    short: 'LL',
    image: require('@/assets/images/mascots/falcon.png'),
    winRate: 80,
    rating: 4.8,
    matches: 56,
    captain: 'Antony',
    captainPhone: '+91 98765 11115',
    division: 'Division 1 • Elite',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Emerald Green Arena',
    fofDegree: 1,
    friendName: 'Antony',
    friendRelation: 'Direct Friend (Captain)',
    mutualFriend: {
      name: 'Antony',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'cst-bid',
    name: 'Chennai Super Turfs',
    short: 'CST',
    image: require('@/assets/images/mascots/eagle.png'),
    winRate: 86,
    rating: 4.9,
    matches: 52,
    captain: 'Praveen',
    captainPhone: '+91 98765 11114',
    division: 'Division 1 • Premier',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'W', 'L'] as const,
    homeGround: 'Skyline Turf 1',
    fofDegree: 1,
    friendName: 'Praveen',
    friendRelation: 'Direct Friend (Captain)',
    mutualFriend: {
      name: 'Praveen',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'ww-bid',
    name: 'Weekend Warriors',
    short: 'WW',
    image: require('@/assets/images/mascots/eagle.png'),
    winRate: 82,
    rating: 4.8,
    matches: 45,
    captain: 'Alex Rivera',
    captainPhone: '+91 98765 11112',
    division: 'Division 1 • Elite',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Apex Turf Arena',
    fofDegree: 1,
    friendName: 'Alex Rivera',
    friendRelation: 'Direct Friend (Captain)',
    mutualFriend: {
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: 'fct-bid',
    name: 'FC Thunder',
    short: 'FCT',
    image: require('@/assets/images/mascots/tiger.png'),
    winRate: 75,
    rating: 4.6,
    matches: 38,
    captain: 'David Miller',
    captainPhone: '+91 98765 11113',
    division: 'Division 2 • Super',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'L', 'W', 'W', 'L'] as const,
    homeGround: 'Vanguard Pitch, OMR',
    fofDegree: 1,
    friendName: 'David Miller',
    friendRelation: 'Direct Friend (Captain)',
    mutualFriend: {
      name: 'David Miller',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },

  // ─── Level 2: Mutual Friends (2nd Degree via Captains) ───────────────────────
  {
    id: 'mbl-bid',
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
    fofDegree: 2,
    friendName: 'Guna',
    friendRelation: 'Mutual via Guna',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'nnk-bid',
    name: 'Neon Knights',
    short: 'NNK',
    image: require('@/assets/images/mascots/panther.png'),
    winRate: 91,
    rating: 4.9,
    matches: 128,
    captain: 'Marcus Vance',
    captainPhone: '+91 98765 22223',
    division: 'Pro Champions League',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'W', 'W'] as const,
    homeGround: 'Metro Futsal Hub',
    fofDegree: 2,
    friendName: 'Guna',
    friendRelation: 'Mutual via Guna',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'knr-bid',
    name: 'Knight Riders',
    short: 'KNR',
    image: require('@/assets/images/mascots/tiger.png'),
    winRate: 74,
    rating: 4.7,
    matches: 40,
    captain: 'Vikram Patel',
    captainPhone: '+91 98765 22224',
    division: 'Division 1 • Super',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'L', 'W', 'L'] as const,
    homeGround: 'Starlight Arena, Adyar',
    fofDegree: 2,
    friendName: 'Guna',
    friendRelation: 'Mutual via Guna',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'bbl-bid',
    name: 'Bangalore Blasters',
    short: 'BBL',
    image: require('@/assets/images/mascots/warrior.png'),
    winRate: 74,
    rating: 4.6,
    matches: 34,
    captain: 'Kavin',
    captainPhone: '+91 98765 11116',
    division: 'Division 2 • Super',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'L', 'W', 'W', 'L'] as const,
    homeGround: 'Titan Ground, Guindy',
    fofDegree: 2,
    friendName: 'Praveen',
    friendRelation: 'Mutual via Praveen',
    mutualFriend: {
      name: 'Praveen',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: 'kk-bid',
    name: 'Kent Kings',
    short: 'KK',
    image: require('@/assets/images/mascots/falcon.png'),
    winRate: 70,
    rating: 4.5,
    matches: 30,
    captain: 'Sri',
    captainPhone: '+91 98765 11117',
    division: 'Division 2 • Metro',
    sport: 'Cricket 🏏',
    recentForm: ['L', 'W', 'W', 'L', 'W'] as const,
    homeGround: 'Marina Turf Hub',
    fofDegree: 2,
    friendName: 'Guna',
    friendRelation: 'Mutual via Guna',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'rr-bid',
    name: 'Royal Rockers',
    short: 'RR',
    image: require('@/assets/images/mascots/tiger.png'),
    winRate: 89,
    rating: 4.9,
    matches: 76,
    captain: 'Sameer Khan',
    captainPhone: '+91 98765 11121',
    division: 'Pro League Elite',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'W', 'W', 'W', 'L'] as const,
    homeGround: 'Emerald Arena Pitch 1',
    fofDegree: 2,
    friendName: 'Guna',
    friendRelation: 'Mutual via Guna',
    mutualFriend: {
      name: 'Guna',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
  {
    id: 'tb-bid',
    name: 'Thunderbolts',
    short: 'TB',
    image: require('@/assets/images/mascots/eagle.png'),
    winRate: 70,
    rating: 4.6,
    matches: 32,
    captain: 'Sarah Jenkins',
    captainPhone: '+91 98765 22225',
    division: 'Division 1 • Premier',
    sport: 'Cricket 🏏',
    recentForm: ['W', 'L', 'W', 'W', 'L'] as const,
    homeGround: 'Pro Shuttle Arena',
    fofDegree: 2,
    friendName: 'Alex Rivera',
    friendRelation: 'Mutual via Alex Rivera',
    mutualFriend: {
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      mutualCount: 1,
    },
  },
  {
    id: 'axi-bid',
    name: 'Antony XI',
    short: 'AXI',
    image: require('@/assets/images/mascots/warrior.png'),
    winRate: 67,
    rating: 4.4,
    matches: 24,
    captain: 'Yogi',
    captainPhone: '+91 98765 11120',
    division: 'Division 2 • Challenger',
    sport: 'Cricket 🏏',
    recentForm: ['L', 'W', 'L', 'W', 'W'] as const,
    homeGround: 'Skyline Arena',
    fofDegree: 2,
    friendName: 'Antony',
    friendRelation: 'Mutual via Antony',
    mutualFriend: {
      name: 'Antony',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      mutualCount: 2,
    },
  },
];

import { useUserProfile } from '@/hooks/use-user-profile';

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
  const { walletBalance, addWalletFunds } = useWalletStore();
  const { profile } = useUserProfile();
  const [showBidListModal, setShowBidListModal] = useState(false);
  const [showFoFSearchModal, setShowFoFSearchModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmountInput, setTopUpAmountInput] = useState('200');

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
  const selectedSport = 'Cricket';
  const [selectedTiming, setSelectedTiming] = useState(getCurrentFormattedTiming());
  const [selectedTurfType, setSelectedTurfType] = useState<'Turf' | 'Ground' | ''>('Turf');
  const [groundName, setGroundName] = useState('');
  const [turfsList, setTurfsList] = useState<string[]>([]);
  const [showTurfDropdown, setShowTurfDropdown] = useState(false);

  const { ownedTurfs } = useTurfStore();

  useEffect(() => {
    const standard = [
      'Unais Turf',
      'Ravi Turf',
      'Emerald Green Arena',
      'Skyline Arena Elite',
      'The Grid Sports Complex',
      "Lord's View Pavillion",
      'Lord’s Indoor Nets',
      'Wembley Powerleague',
      'Apex Turf Arena',
      'Metro Futsal Hub',
      'Turf Park, Guindy',
      'Eden Gardens Turf, Nungambakkam',
      'Skyline Turf, Velachery',
      'Skyline Ground 3',
      'Apex Badminton Arena',
      'Skyline Badminton Hall',
      'Metro Indoor Hoops',
      'Vanguard Basketball Court',
      'Metro Beach & Turf Volley',
      'Skyline Tennis Club',
    ];
    const ownedNames = (ownedTurfs || []).map((t: any) => t.name).filter(Boolean);

    turfApi.listTurfs().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.turfs || [];
      const backendNames = list.map((t: any) => t.name).filter(Boolean);
      setTurfsList(Array.from(new Set([...ownedNames, ...backendNames, ...standard])));
    }).catch(() => {
      setTurfsList(Array.from(new Set([...ownedNames, ...standard])));
    });
  }, [ownedTurfs]);
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [visibleTeamsCount, setVisibleTeamsCount] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reset pagination when searching
  useEffect(() => {
    setVisibleTeamsCount(3);
  }, [searchText]);

  const onRefresh = () => {
    setRefreshing(true);
    setSelectedTiming(getCurrentFormattedTiming());
    setTimeout(() => {
      setRefreshing(false);
      showSuccess('Refreshed', 'Bid Match list & live stakes updated.');
    }, 600);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Automatically trigger load more when within 220px of the list end
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 220;
    if (isCloseToBottom && visibleTeamsCount < filteredTeams.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleTeamsCount((prev) => Math.min(prev + 3, filteredTeams.length));
        setIsLoadingMore(false);
      }, 300);
    }
  };

  // DateTime Picker Control State
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState(todayDate);
  const [tempTime, setTempTime] = useState(() => {
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  });

  // Focus states
  const [isSearchFocused, setIsSearchFocused] = useState(false);

   // Filter opponent teams dynamically (strictly 2 levels of FoF only)
  const filteredTeams = TEAMS.filter((t) => {
    // Strictly 2 levels of FoF: 1st degree direct friends & 2nd degree mutual friends
    const conn = getFoFConnection((t as any).captainPhone || t.captain);
    if (conn.degree !== 1 && conn.degree !== 2) return false;

    const searchClean = searchText.trim().toLowerCase();
    const rawDigits = searchText.replace(/\D/g, '');

    if (!searchClean) return true;

    const tName = (t.name || '').toLowerCase();
    const tShort = (t.short || '').toLowerCase();
    const capName = (t.captain || '').toLowerCase();
    const capPhone = ((t as any).captainPhone || '').replace(/\D/g, '');
    const div = (t.division || '').toLowerCase();
    const ground = (t.homeGround || '').toLowerCase();
    const friend = ((t as any).friendName || '').toLowerCase();

    // Check all team fof player connections for matching name or phone number
    const fofConnections = getTeamFoFConnections(t.name, t.captain);
    const playerMatch = fofConnections.some((c) => {
      const pName = c.targetName.toLowerCase();
      const pPhone = c.targetPhone.replace(/\D/g, '');
      const role = (c.targetRole || '').toLowerCase();
      const chainMatch = c.chainPath.some((n) => 
        n.name.toLowerCase().includes(searchClean) ||
        (rawDigits.length >= 3 && n.phone.replace(/\D/g, '').includes(rawDigits))
      );
      return (
        pName.includes(searchClean) ||
        role.includes(searchClean) ||
        (rawDigits.length >= 3 && pPhone.includes(rawDigits)) ||
        chainMatch
      );
    });

    return (
      tName.includes(searchClean) ||
      tShort.includes(searchClean) ||
      capName.includes(searchClean) ||
      div.includes(searchClean) ||
      ground.includes(searchClean) ||
      friend.includes(searchClean) ||
      (rawDigits.length >= 3 && capPhone.includes(rawDigits)) ||
      playerMatch
    );
  });

  // Effective stake amount and wallet limit check
  const currentStake = bidAmount || parseInt(customBid, 10) || 0;
  const isExceedingWallet = currentStake > walletBalance;
  const isBroadcastEnabled = currentStake > 0 && !isExceedingWallet;
  const isChallengeEnabled = Boolean(selectedTeam) && currentStake > 0 && !isExceedingWallet;

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

    const amount = currentStake;
    if (amount <= 0) {
      return showError('Bid Amount Required *', 'Please select or enter a valid bid stake amount.');
    }
    if (amount > 9999) {
      return showError('Bid Limit Exceeded', 'Custom bid stake cannot exceed ₹9,999.');
    }

    // 3. Wallet Balance Check
    if (amount > walletBalance) {
      showError(
        'Insufficient Wallet Coins 🪙',
        `Your match stake of ₹${amount} exceeds your wallet balance of ₹${walletBalance}. Please top up your wallet.`
      );
      setShowTopUpModal(true);
      return;
    }

    const targetGround = groundName.trim() || 'Skyline Turf Arena, Court #1';
    const targetTeamObj = type === 'friend' ? TEAMS.find(t => t.id === selectedTeam) : null;
    const opponentName = type === 'friend' ? (targetTeamObj?.name || 'Challenger') : 'Open Broadcast';

    // Create & post the new bid into live bids store!
    const newBidItem = {
      id: `bid-${Date.now()}`,
      tournament: type === 'open' ? `Open Bid Challenge: ${selectedSport} 🏏` : `Direct Challenge: ${selectedSport} 🏏`,
      sport: selectedSport || 'Cricket',
      location: targetGround,
      category: selectedTurfType || 'Turf',
      turfType: selectedTurfType || 'Turf',
      venueType: selectedTurfType || 'Turf',
      type: type === 'open' ? 'Broadcast' : 'Direct',
      status: type === 'friend' ? 'Challenged' : 'Accept Bid',
      isMe: true,
      isBid: true,
      playerName: profile?.name || 'Azarudeen',
      avatar: typeof profile?.avatarUrl === 'string' && profile.avatarUrl.startsWith('http') ? profile.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      team1: profile?.name ? `${profile.name.split(' ')[0]} XI` : 'Azar XI',
      team1Code: profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'AZ',
      team2: opponentName,
      opponentTeam: opponentName,
      opponentCaptain: targetTeamObj?.captain || undefined,
      team2Code: type === 'friend' ? (targetTeamObj?.short || 'OP') : 'VS',
      timeText: selectedTiming,
      subText: type === 'open' ? `Broadcast Live • Stake: ₹${amount} (${amount} Coins)` : `Direct Challenge vs ${opponentName} • Stake: ₹${amount} (${amount} Coins)`,
      statusColor: theme.primary,
      section: 'Today',
      bidCoins: amount,
      createdAt: new Date().toISOString(),
    };

    addBid(newBidItem);

    showSuccess(
      type === 'open' ? 'Open Broadcast Live! 🏆' : 'Direct Challenge Sent! ⚡',
      type === 'open'
        ? `Open bid of ₹${amount} for ${selectedSport} is broadcast live. Waiting for challengers!`
        : `Direct challenge of ₹${amount} sent to ${opponentName} (Captain: ${targetTeamObj?.captain})!`
    );

    addNotification({
      title: type === 'open' ? 'New Broadcast Bid Challenge Posted!' : `Direct Challenge sent to ${opponentName}!`,
      body: `${selectedSport} match (${selectedTurfType}) • Stake: ₹${amount} • Venue: ${targetGround} • Time: ${selectedTiming}`,
      targetRole: 'All',
      type: 'bid',
    });
  };

  const handleTopUpConfirm = (amtToAdd: number) => {
    if (amtToAdd <= 0) return;
    addWalletFunds(amtToAdd);
    showSuccess('Wallet Coins Added! 🪙', `₹${amtToAdd} has been credited to your Sports Wallet.`);
    setShowTopUpModal(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: 85 }]}>
      {/* ── Fixed Match Stake Hero Card at Top ─────────────── */}
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: 4, paddingBottom: 2, zIndex: 10 }}>
        <View
          style={[
            styles.stakeHeader,
            {
              backgroundColor: theme.surfaceLowest,
              borderColor: isExceedingWallet ? '#ef444455' : theme.outlineVariant + '33',
              borderRadius: 14,
              borderWidth: 1,
              padding: 12,
              marginBottom: 0,
              overflow: 'hidden',
              position: 'relative',
            },
            Shadows.level2,
          ]}
        >
          <LinearGradient
            colors={[theme.primary + '18', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.stakeTop}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <View style={{ width: 3, height: 11, borderRadius: 2, backgroundColor: theme.primary }} />
                <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold', fontSize: 9.5, letterSpacing: 0.5 }}>
                  MATCH STAKE & REWARD
                </ThemedText>
              </View>
              <View style={styles.amountRow}>
                <ThemedText style={[styles.stakeAmount, { color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 20, lineHeight: 30 }]}>
                  ₹{currentStake}
                </ThemedText>
                <ThemedText style={[styles.stakeUnit, { color: theme.primary, fontFamily: 'Sora_600SemiBold', fontSize: 11 }]}>Coins</ThemedText>
              </View>
            </View>

            {/* Wallet Coins Balance Badge & Quick Top-up Button */}
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: theme.surfaceLow,
                  borderColor: theme.outlineVariant + '40',
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Ionicons name="wallet-outline" size={12} color={theme.primary} />
                <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_500Medium' }}>Wallet:</ThemedText>
                <ThemedText style={{ color: theme.text, fontSize: 10.5, fontFamily: 'Sora_600SemiBold' }}>
                  ₹{walletBalance}
                </ThemedText>
              </View>

              <Pressable
                onPress={() => setShowTopUpModal(true)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: theme.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 3.5,
                    borderRadius: 999,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name="add-circle" size={11} color="#ffffff" />
                <ThemedText style={{ color: '#ffffff', fontSize: 9.5, fontFamily: 'Sora_600SemiBold' }}>
                  + Top Up
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Quick 1-Tap Stake Chips */}
          <View style={[styles.bidRow, { marginTop: 8, gap: 6 }]}>
            {BID_AMOUNTS.map((amt) => {
              const isSelected = bidAmount === amt;
              return (
                <Pressable
                  key={amt}
                  onPress={() => {
                    setBidAmount(amt);
                    setCustomBid('');
                  }}
                  style={({ pressed }) => [
                    styles.bidChip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                      borderColor: isSelected ? theme.primary : theme.outlineVariant + '40',
                      borderWidth: 1,
                      height: 30,
                      borderRadius: 8,
                      opacity: pressed ? 0.85 : 1,
                    }
                  ]}
                >
                  <ThemedText
                    style={{
                      fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                      fontSize: 11,
                      color: isSelected ? '#ffffff' : theme.text,
                    }}
                  >
                    ₹{amt}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Stake Input Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: theme.surfaceLow, borderRadius: 8, borderWidth: 1, borderColor: customBid ? theme.primary : theme.outlineVariant + '35', paddingHorizontal: 10, height: 32 }}>
            <Ionicons name="create-outline" size={13} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_500Medium', fontSize: 10.5, marginRight: 4 }}>Custom:</ThemedText>
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[
                { flex: 1, color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 11.5, padding: 0 },
                Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
              ]}
              placeholder="e.g. 350"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
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
                setBidAmount(0);
              }}
              onFocus={() => { setBidAmount(0); }}
            />
          </View>

          {/* Exceeds Wallet Coin Warning - Simple & Clean without extra link */}
          {isExceedingWallet && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#ef444410',
                borderColor: '#ef444430',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 5,
                marginTop: 8,
              }}
            >
              <Ionicons name="alert-circle" size={13} color="#ef4444" />
              <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#ef4444' }}>
                Exceeds Wallet (₹{walletBalance}). Needs +₹{currentStake - walletBalance}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* ── Scrollable Body for Remaining Content ─────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: 6 }]}
        style={styles.scrollArea}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >

      {/* ── Compact Match Configuration Bento Card ─────────── */}
      <View
        style={[
          styles.bentoCard,
          {
            backgroundColor: theme.surfaceLowest,
            borderColor: theme.outlineVariant + '33',
            borderRadius: 14,
            borderWidth: 1,
            padding: 12,
            marginBottom: 8,
            gap: 10,
          },
          Shadows.level2,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 3, height: 11, borderRadius: 2, backgroundColor: theme.primary }} />
            <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold', fontSize: 10.5, letterSpacing: 0.5 }}>
              MATCH CONFIGURATION
            </ThemedText>
          </View>
          <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
            <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_600SemiBold' }}>
              Cricket 🏏
            </ThemedText>
          </View>
        </View>

        {/* ── 1. Match Timing ── */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0, fontSize: 10 }]}>Match Timing</ThemedText>
              <ThemedText style={{ color: '#ef4444', fontSize: 11, fontFamily: 'Sora_500Medium', marginLeft: 2 }}>*</ThemedText>
            </View>

            <Pressable
              onPress={() => setShowDateTimePicker(true)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4.5,
                  backgroundColor: theme.primary + '14',
                  borderColor: theme.primary + '35',
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 3.5,
                  borderRadius: 999,
                  opacity: pressed ? 0.85 : 1,
                }
              ]}
            >
              <Ionicons name="time-outline" size={11} color={theme.primary} />
              <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_600SemiBold' }}>
                {selectedTiming}
              </ThemedText>
              <Ionicons name="chevron-forward" size={10} color={theme.primary} />
            </Pressable>
          </View>
        </View>

        {/* ── 2. Turf / Ground Type Toggle ── */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0, fontSize: 10 }]}>Type</ThemedText>
            <ThemedText style={{ color: '#ef4444', fontSize: 11, fontFamily: 'Sora_500Medium', marginLeft: 2 }}>*</ThemedText>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
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
                  <ThemedText style={{ color: isActive ? theme.primary : theme.text, fontSize: 11.5, fontFamily: 'Sora_600SemiBold', textAlign: 'center', width: '100%' }}>
                    {tType.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 3. Turf Name with Quick Select Pills & Search List ── */}
        {selectedTurfType === 'Turf' ? (
          <View style={[styles.inputGroup, { zIndex: 30 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0, fontSize: 10 }]}>Turf Name</ThemedText>
              <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_500Medium' }}>Select or Search</ThemedText>
            </View>

            {/* Direct Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLow, borderRadius: 8, borderWidth: 1, borderColor: showTurfDropdown ? theme.primary : theme.outlineVariant + '40', paddingHorizontal: 10, height: 38 }}>
              <Ionicons name="search-outline" size={14} color={theme.primary} style={{ marginRight: 6 }} />
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[
                  { flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 11.5 },
                  Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
                ]}
                placeholder="Search or tap turf below..."
                placeholderTextColor="#94a3b8"
                value={groundName}
                onFocus={() => setShowTurfDropdown(true)}
                onChangeText={(text) => {
                  setGroundName(text);
                  setShowTurfDropdown(true);
                }}
              />
              {groundName ? (
                <Pressable onPress={() => setGroundName('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={14} color={theme.textSecondary} />
                </Pressable>
              ) : (
                <Pressable onPress={() => setShowTurfDropdown(!showTurfDropdown)} style={{ padding: 4 }}>
                  <Ionicons name={showTurfDropdown ? "chevron-up" : "chevron-down"} size={14} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Quick 1-Tap Turf Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {QUICK_TURFS.map((tName, i) => {
                const isSelected = groundName === tName;
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setGroundName(tName);
                      setShowTurfDropdown(false);
                    }}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                        borderColor: isSelected ? theme.primary : theme.outlineVariant + '35',
                        borderWidth: 1,
                        paddingHorizontal: 8,
                        paddingVertical: 3.5,
                        borderRadius: 999,
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <Ionicons name="location-sharp" size={10} color={isSelected ? '#ffffff' : theme.primary} />
                    <ThemedText style={{ fontSize: 10, fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium', color: isSelected ? '#ffffff' : theme.text }}>
                      {tName.split(' ')[0]} Turf
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Dropdown Suggestions List */}
            {showTurfDropdown && (
              <View style={{
                marginTop: 6,
                backgroundColor: theme.surfaceLowest,
                borderRadius: 10,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.outlineVariant + '20', backgroundColor: theme.surfaceLow }}>
                  <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>AVAILABLE TURFS</ThemedText>
                  <Pressable onPress={() => setShowTurfDropdown(false)}>
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>Close ✕</ThemedText>
                  </Pressable>
                </View>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
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
                            paddingVertical: 9,
                            borderBottomWidth: idx < turfsList.length - 1 ? 1 : 0,
                            borderBottomColor: theme.outlineVariant + '20',
                            backgroundColor: pressed ? theme.primary + '15' : theme.surfaceLowest,
                          }
                        ]}
                      >
                        <Ionicons name="location-sharp" size={13} color={theme.primary} />
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.text }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0, fontSize: 10 }]}>Ground Name</ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, fontFamily: 'Sora_400Regular' }}>Optional</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLow, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '40', paddingHorizontal: 10, height: 38 }}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[
                  { flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 11.5 },
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
      </View>

      {/* ── Opponent Team Selection (Strictly 2 Levels of FoF Only) ── */}
      <View style={[styles.inputGroup, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 3.5, height: 13, borderRadius: 2, backgroundColor: theme.primary }} />
            <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold', fontSize: 11, letterSpacing: 0.5 }}>
              FIND & SELECT OPPONENT TEAM
            </ThemedText>
          </View>
          <View style={{ backgroundColor: theme.primary + '14', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
            <ThemedText style={{ color: theme.primary, fontSize: 9.5, fontFamily: 'Sora_600SemiBold' }}>
              2-Level FoF Network
            </ThemedText>
          </View>
        </View>

        {/* Search Box */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.surfaceLowest,
              borderColor: isSearchFocused ? theme.primary : theme.outlineVariant + '35',
              borderRadius: 12,
              height: 44,
            },
            Shadows.level1,
          ]}
        >
          <Ionicons name="search" size={15} color={theme.primary} />
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[
              styles.searchInput,
              { color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 },
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
            ]}
            placeholder="Search by team, captain, friend, or phone..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>

        {/* Floating 2-Level FoF Team Cards List with Redesigned Modern Sports Look */}
        <View style={{ gap: 12, marginTop: 4 }}>
          {filteredTeams.slice(0, visibleTeamsCount).map((team) => {
            const isSelected = selectedTeam === team.id;
            const captainPhone = (team as any).captainPhone || '+91 98765 11111';
            const conn = getFoFConnection(captainPhone);
            const isDirect = conn.degree === 1;
            const friendName = (team as any).friendName || (isDirect ? team.captain : (conn.mutualContactName || team.mutualFriend?.name || 'Guna'));
            const friendLabel = (team as any).friendRelation || (isDirect ? `Direct Friend (${friendName})` : `Mutual via ${friendName}`);

            return (
              <Pressable
                key={team.id}
                onPress={() => setSelectedTeam(team.id)}
                style={[
                  styles.teamCardContainer,
                  {
                    backgroundColor: isSelected ? theme.primary + '0a' : theme.surfaceLowest,
                    borderColor: isSelected ? theme.primary : theme.outlineVariant + '28',
                    borderWidth: isSelected ? 1.5 : 1,
                    borderRadius: 16,
                    padding: 13,
                  },
                  Shadows.level2,
                ]}
              >
                {/* ── Top Header Row: Mascot + Team Name + Badges + Select Indicator ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <View style={[styles.teamMascotWrap, { backgroundColor: theme.surfaceLow, borderColor: isSelected ? theme.primary + '40' : theme.outlineVariant + '25', borderWidth: 1 }]}>
                      <Image source={team.image} style={{ width: 38, height: 38 }} contentFit="contain" />
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 14.5 }} numberOfLines={1}>
                        {team.name}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                          {team.sport}
                        </ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, fontFamily: 'Sora_400Regular' }}>
                          • {team.division}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Radio Selection Pill */}
                  <View style={[styles.selectRadioDot, { borderColor: isSelected ? theme.primary : theme.outlineVariant + '60', backgroundColor: isSelected ? theme.primary : 'transparent' }]}>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={11} color="#ffffff" />
                    ) : null}
                  </View>
                </View>

                {/* ── Friend in Team Badge & Social Graph Relationship Strip ── */}
                <View style={[styles.fofRelationshipStrip, { backgroundColor: isSelected ? theme.primary + '14' : theme.surfaceLow, borderColor: isSelected ? theme.primary + '35' : theme.outlineVariant + '28' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 5 }}>
                    <Ionicons name={isDirect ? "person" : "people"} size={13} color={isDirect ? theme.primary : '#6366f1'} />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: isDirect ? theme.primary : '#6366f1' }} numberOfLines={1}>
                        {isDirect ? `🤝 Friend in Team: ${friendName} (Captain)` : `🔗 Friend in Team: via ${friendName}`}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <FoFAvatarStack
                      teamName={team.name}
                      captainName={team.captain}
                      size={20}
                      showCountBadge={true}
                    />
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        Clipboard.setString(captainPhone);
                        showSuccess('Phone Copied', `${team.captain}'s phone (${captainPhone}) copied.`);
                      }}
                      style={[styles.phoneIconBtn, { backgroundColor: theme.surfaceLowest }]}
                      hitSlop={8}
                    >
                      <Ionicons name="call" size={10} color={theme.primary} />
                    </Pressable>
                  </View>
                </View>

                {/* ── 3-Pillar Bento Metric Tiles ── */}
                <View style={styles.statsTilesRow}>
                  <View style={[styles.statTile, { backgroundColor: isSelected ? theme.primary + '10' : theme.surfaceLow, borderColor: theme.outlineVariant + '20' }]}>
                    <ThemedText style={styles.statTileLabel}>WIN RATE</ThemedText>
                    <ThemedText style={[styles.statTileVal, { color: theme.primary, fontFamily: 'Sora_600SemiBold' }]}>
                      {team.winRate}%
                    </ThemedText>
                  </View>

                  <View style={[styles.statTile, { backgroundColor: isSelected ? theme.primary + '10' : theme.surfaceLow, borderColor: theme.outlineVariant + '20' }]}>
                    <ThemedText style={styles.statTileLabel}>MATCHES</ThemedText>
                    <ThemedText style={[styles.statTileVal, { color: theme.text, fontFamily: 'Sora_600SemiBold' }]}>
                      {team.matches} Played
                    </ThemedText>
                  </View>

                  <View style={[styles.statTile, { backgroundColor: isSelected ? theme.primary + '10' : theme.surfaceLow, borderColor: theme.outlineVariant + '20', flex: 1.2 }]}>
                    <ThemedText style={styles.statTileLabel}>FORM (LAST 5)</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 3.5, marginTop: 3 }}>
                      {team.recentForm.map((res, i) => {
                        const isWin = res === 'W';
                        const isLoss = res === 'L';
                        const badgeBg = isWin ? '#3b82f6' : isLoss ? '#ef4444' : '#f59e0b';

                        return (
                          <View
                            key={i}
                            style={[
                              styles.formBadgePill,
                              { backgroundColor: badgeBg }
                            ]}
                          >
                            <ThemedText style={{ color: '#ffffff', fontSize: 8.5, fontFamily: 'Sora_700Bold' }}>
                              {res}
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* ── Card Footer: Home Venue & Interactive Selection CTA ── */}
                <View style={styles.cardFooterRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <Ionicons name="location-sharp" size={11} color={theme.primary} style={{ marginRight: 3 }} />
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 9.5, fontFamily: 'Sora_400Regular' }} numberOfLines={1}>
                      Home: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium' }}>{team.homeGround}</ThemedText>
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.selectCtaPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                        borderColor: isSelected ? theme.primary : theme.outlineVariant + '40',
                      }
                    ]}
                  >
                    <ThemedText style={{ color: isSelected ? '#ffffff' : theme.text, fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                      {isSelected ? '✓ Ready to Challenge' : 'Select Squad →'}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* ── Auto-Load More Indicator / End of List Footer ── */}
          {filteredTeams.length > visibleTeamsCount ? (
            <View
              style={[
                styles.loadMoreTeamsBtn,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: theme.outlineVariant + '35',
                  gap: 8,
                },
                Shadows.level1,
              ]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'Sora_500Medium' }}>
                {isLoadingMore ? 'Loading more opponents...' : `Scroll to auto-load (${filteredTeams.length - visibleTeamsCount} remaining)`}
              </ThemedText>
            </View>
          ) : filteredTeams.length > 3 ? (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <ThemedText style={{ color: theme.textSecondary + '80', fontSize: 10, fontFamily: 'Sora_400Regular' }}>
                ✓ All {filteredTeams.length} available opponents loaded
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      </ScrollView>

      {/* ── Actions Row (Primary CTA) ────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '25', paddingVertical: 12 }]}>
        <Pressable
          onPress={() => isBroadcastEnabled && handleAction('open')}
          disabled={!isBroadcastEnabled}
          style={[
            styles.secondaryButton,
            {
              borderColor: isBroadcastEnabled ? theme.primary : theme.outlineVariant + '55',
              backgroundColor: isBroadcastEnabled ? theme.primary + '0D' : theme.surfaceLow,
              borderWidth: 1.5,
              borderRadius: 999,
              height: 46,
              marginBottom: 8,
              opacity: isBroadcastEnabled ? 1 : 0.45,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons
              name="broadcast"
              size={17}
              color={isBroadcastEnabled ? theme.primary : theme.textSecondary}
            />
            <ThemedText style={[styles.secondaryButtonText, { color: isBroadcastEnabled ? theme.primary : theme.textSecondary, fontFamily: 'Sora_600SemiBold', fontSize: 13.5 }]}>
              {currentStake > 0 ? `Broadcast Open Bid (₹${currentStake})` : 'Broadcast Open Bid (Enter Bid Value)'}
            </ThemedText>
          </View>
        </Pressable>
        <Pressable
          onPress={() => isChallengeEnabled && handleAction('friend')}
          disabled={!isChallengeEnabled}
          style={[
            styles.primaryButton,
            {
              backgroundColor: isChallengeEnabled ? theme.primary : (theme.outlineVariant + '70'),
              borderRadius: 999,
              height: 46,
              opacity: isChallengeEnabled ? 1 : 0.5,
              justifyContent: 'center',
              alignItems: 'center',
            },
            isChallengeEnabled ? Shadows.level2 : null,
          ]}
        >
          <View style={styles.btnContent}>
            <ThemedText style={[styles.primaryButtonText, { color: isChallengeEnabled ? '#ffffff' : theme.textSecondary, fontFamily: 'Sora_600SemiBold', fontSize: 13.5 }]}>
              {(() => {
                if (!selectedTeam && currentStake <= 0) return 'Select Opponent & Enter Bid';
                if (!selectedTeam) return 'Select Opponent to Challenge';
                if (currentStake <= 0) return 'Enter Bid Value to Challenge';
                return `Send Direct Challenge (₹${currentStake})`;
              })()}
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color={isChallengeEnabled ? '#ffffff' : theme.textSecondary} />
          </View>
        </Pressable>
      </View>

      {/* ── Monthly Calendar + Time Picker Modal Component (With Past Dates Disabled) ── */}
      <Modal visible={showDateTimePicker} transparent animationType="slide" onRequestClose={() => setShowDateTimePicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surfaceLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="calendar" size={18} color={theme.primary} />
                </View>
                <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                  Select Start Date
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowDateTimePicker(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Month Navigation Header */}
            {(() => {
              const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const isCurrentMonthView = viewYear === currentYear && viewMonth === currentMonth;

              // Calendar calculations for viewMonth & viewYear
              const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
              const leadingEmpty = (firstDayIndex + 6) % 7; // Monday = 0
              const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

              return (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 4 }}>
                    <Pressable
                      onPress={() => {
                        if (isCurrentMonthView) return;
                        if (viewMonth === 0) {
                          setViewMonth(11);
                          setViewYear(viewYear - 1);
                        } else {
                          setViewMonth(viewMonth - 1);
                        }
                      }}
                      style={{ padding: 6, opacity: isCurrentMonthView ? 0.3 : 1 }}
                      disabled={isCurrentMonthView}
                    >
                      <Ionicons name="chevron-back" size={20} color={isCurrentMonthView ? theme.textSecondary : theme.text} />
                    </Pressable>
                    <ThemedText style={{ fontSize: 15, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                      {fullMonthNames[viewMonth]} {viewYear}
                    </ThemedText>
                    <Pressable
                      onPress={() => {
                        if (viewMonth === 11) {
                          setViewMonth(0);
                          setViewYear(viewYear + 1);
                        } else {
                          setViewMonth(viewMonth + 1);
                        }
                      }}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name="chevron-forward" size={20} color={theme.text} />
                    </Pressable>
                  </View>

                  {/* Day Names Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 4 }}>
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                      <ThemedText key={day} style={{ width: 36, textAlign: 'center', fontSize: 12, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
                        {day}
                      </ThemedText>
                    ))}
                  </View>

                  {/* Calendar Days Grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {[...Array(leadingEmpty)].map((_, i) => (
                      <View key={`empty-${i}`} style={{ width: '14.28%', height: 38 }} />
                    ))}
                    {[...Array(totalDays)].map((_, i) => {
                      const dayNum = i + 1;
                      const isPast = (viewYear < currentYear) ||
                                     (viewYear === currentYear && viewMonth < currentMonth) ||
                                     (viewYear === currentYear && viewMonth === currentMonth && dayNum < todayDate);
                      const isSelected = selectedDay === dayNum && viewMonth === currentMonth && viewYear === currentYear;

                      return (
                        <Pressable
                          key={`day-${dayNum}`}
                          disabled={isPast}
                          onPress={() => {
                            if (!isPast) {
                              setSelectedDay(dayNum);
                            }
                          }}
                          style={{
                            width: '14.28%',
                            height: 38,
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: isPast ? 0.28 : 1,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <ThemedText
                              style={{
                                fontSize: 12.5,
                                fontFamily: isSelected ? 'Sora_600SemiBold' : isPast ? 'Sora_400Regular' : 'Sora_500Medium',
                                color: isSelected ? '#ffffff' : isPast ? theme.textSecondary : theme.text,
                                textDecorationLine: isPast ? 'line-through' : 'none',
                              }}
                            >
                              {dayNum}
                            </ThemedText>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Time Slot Picker Row */}
                  <View style={{ marginTop: 6, gap: 8 }}>
                    <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
                      Match Time Slot
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                      {[
                        '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
                        '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
                      ].map((tSlot) => {
                        const isSlotSelected = tempTime === tSlot;
                        return (
                          <Pressable
                            key={tSlot}
                            onPress={() => setTempTime(tSlot)}
                            style={[
                              {
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                borderRadius: 999,
                                backgroundColor: isSlotSelected ? theme.primary : theme.surfaceLow,
                                borderColor: isSlotSelected ? theme.primary : theme.outlineVariant + '44',
                                borderWidth: 1,
                              }
                            ]}
                          >
                            <ThemedText
                              style={{
                                fontSize: 11.5,
                                fontFamily: isSlotSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                                color: isSlotSelected ? '#ffffff' : theme.text,
                              }}
                            >
                              {tSlot}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Confirm & Set Date Time Button */}
                  <Pressable
                    onPress={() => {
                      const formatted = `${selectedDay} ${monthNames[viewMonth]} ${viewYear}, ${tempTime}`;
                      setSelectedTiming(formatted);
                      setShowDateTimePicker(false);
                      showSuccess('Match Time Set', `Scheduled for ${formatted}`);
                    }}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: theme.primary,
                        borderRadius: 999,
                        height: 44,
                        marginTop: 6,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                      Shadows.level2,
                    ]}
                  >
                    <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 13.5 }}>
                      Confirm Match Schedule ({selectedDay} {monthNames[viewMonth]}, {tempTime})
                    </ThemedText>
                  </Pressable>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ── Active Bids List Modal (Redesigned based on Player Home Dashboard) ── */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.modalIconBox, { backgroundColor: theme.primary + '18' }]}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                    Active Bids & Challenges
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                    {bids.length} live bid{bids.length !== 1 ? 's' : ''} • Tap card to view details or score
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
                <Ionicons name="close" size={20} color={theme.text} />
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
                      <Ionicons name="hand-left-outline" size={36} color={theme.textSecondary + '60'} />
                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_500Medium', color: theme.text, marginTop: 8 }}>
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
                  const opponentName = bid.opponentTeam || bid.team2 || 'Open Broadcast';
                  const isOpenBroadcast = opponentName === 'Open Broadcast' || opponentName === 'Open Opponent' || bid.type === 'Broadcast';

                  const isFinalized = Boolean(
                    opponentName &&
                    opponentName !== 'Open Broadcast' &&
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
                        styles.dashboardBidCard,
                        {
                          backgroundColor: theme.surfaceLowest,
                          borderColor: theme.outlineVariant + '33',
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        },
                        Shadows.level2,
                      ]}
                    >
                      {/* Ambient Gradient Background Wash like Player Home Dashboard */}
                      <LinearGradient
                        colors={[
                          isOpenBroadcast ? theme.primary + '18' : '#6366f118',
                          '#3b82f608',
                          'transparent'
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />

                      {/* Top Header Row: Live Status Pill with PulseDot + Sport Tag + Coin Stake Pill */}
                      <View style={styles.dashboardCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={[
                              styles.dashboardStatusBadge,
                              {
                                backgroundColor: isOpenBroadcast ? theme.primary + '18' : '#6366f118',
                                borderColor: isOpenBroadcast ? theme.primary + '35' : '#6366f135',
                              }
                            ]}
                          >
                            <PulseDot
                              color={isOpenBroadcast ? theme.primary : '#6366f1'}
                              size={7}
                            />
                            <ThemedText
                              style={{
                                fontSize: 10,
                                fontFamily: 'Sora_600SemiBold',
                                color: isOpenBroadcast ? theme.primary : '#6366f1',
                                letterSpacing: 0.3,
                              }}
                            >
                              {isOpenBroadcast ? 'LIVE BROADCAST' : 'DIRECT CHALLENGE'}
                            </ThemedText>
                          </View>

                          <View style={[styles.dashboardSportTag, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.text }}>
                              {sportInfo.icon} {sportInfo.name}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Bento Coin Stake Pill */}
                        <View style={[styles.dashboardStakePill, { backgroundColor: '#f59e0b16', borderColor: '#f59e0b40' }]}>
                          <Ionicons name="wallet" size={12} color="#f59e0b" />
                          <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: '#d97706' }}>
                            ₹{bid.bidCoins || 100} Coins
                          </ThemedText>
                        </View>
                      </View>

                      {/* Hero Matchup Bento Section: Challenger vs Opponent */}
                      <View style={[styles.dashboardMatchupBento, { backgroundColor: theme.surfaceLow + '60', borderColor: theme.outlineVariant + '25' }]}>
                        {/* Host / Challenger Column */}
                        <View style={styles.dashboardTeamCol}>
                          <View style={styles.dashboardTeamBadgeRow}>
                            <View style={{ width: 3, height: 9, borderRadius: 2, backgroundColor: theme.primary }} />
                            <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_600SemiBold', color: theme.primary, letterSpacing: 0.5 }}>
                              YOU (HOST)
                            </ThemedText>
                          </View>
                          <ThemedText style={[styles.dashboardTeamName, { color: theme.text }]} numberOfLines={1}>
                            {bid.team1 || (profile?.name ? `${profile.name.split(' ')[0]} XI` : 'Azar XI')}
                          </ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Ionicons name="person-circle-outline" size={12} color={theme.textSecondary} />
                            <ThemedText style={[styles.dashboardCaptainText, { color: theme.textSecondary }]} numberOfLines={1}>
                              {bid.playerName || profile?.name || 'Azarudeen'}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Central VS Capsule */}
                        <View style={[styles.dashboardVsCircle, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '35' }]}>
                          <LinearGradient
                            colors={[theme.primary + '20', '#6366f115']}
                            style={StyleSheet.absoluteFill}
                          />
                          <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>
                            VS
                          </ThemedText>
                        </View>

                        {/* Opponent Column */}
                        <View style={[styles.dashboardTeamCol, { alignItems: 'flex-end' }]}>
                          <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_600SemiBold', color: isOpenBroadcast ? '#64748b' : '#6366f1', letterSpacing: 0.5, marginBottom: 2 }}>
                            {isOpenBroadcast ? 'OPEN CHALLENGER' : 'TARGET OPPONENT'}
                          </ThemedText>
                          <ThemedText style={[styles.dashboardTeamName, { color: theme.text, textAlign: 'right' }]} numberOfLines={1}>
                            {isOpenBroadcast ? 'Open Broadcast 🌐' : opponentName}
                          </ThemedText>
                          
                          <View style={{ marginTop: 2, alignItems: 'flex-end' }}>
                            {isOpenBroadcast ? (
                              <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                                Waiting for team ⚡
                              </ThemedText>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <FoFAvatarStack
                                  teamName={opponentName}
                                  captainName={bid.playerName}
                                  size={18}
                                  showCountBadge={false}
                                />
                                <ThemedText style={{ fontSize: 10, color: '#6366f1', fontFamily: 'Sora_600SemiBold' }} numberOfLines={1}>
                                  {bid.opponentCaptain ? bid.opponentCaptain : 'Direct'}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Meta Pill Row (Location, Time, Turf/Ground) */}
                      <View style={styles.dashboardMetaRow}>
                        <View style={styles.dashboardMetaItem}>
                          <Ionicons name="location-sharp" size={11.5} color={theme.secondary} />
                          <ThemedText style={[styles.dashboardMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                            {bid.location || 'Skyline Arena'}
                          </ThemedText>
                        </View>
                        <View style={styles.dashboardMetaDivider} />
                        <View style={styles.dashboardMetaItem}>
                          <Ionicons name="time-outline" size={11.5} color={theme.textSecondary} />
                          <ThemedText style={[styles.dashboardMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                            {bid.timeText || 'Today, 8:00 PM'}
                          </ThemedText>
                        </View>
                        <View style={styles.dashboardMetaDivider} />
                        <View style={styles.dashboardMetaItem}>
                          <ThemedText style={[styles.dashboardMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                            {bid.category || 'Turf'}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Card Action Footer */}
                      <View style={[styles.dashboardFooter, { borderTopColor: theme.outlineVariant + '22' }]}>
                        <View style={styles.dashboardStatusRow}>
                          <View
                            style={[
                              styles.dashboardMatchStatusPill,
                              {
                                backgroundColor: isFinalized ? '#10b98118' : '#f59e0b18',
                                borderColor: isFinalized ? '#10b98135' : '#f59e0b35',
                              }
                            ]}
                          >
                            <PulseDot color={isFinalized ? '#10b981' : '#f59e0b'} size={6} />
                            <ThemedText
                              style={{
                                fontSize: 10.5,
                                fontFamily: 'Sora_600SemiBold',
                                color: isFinalized ? '#059669' : '#d97706',
                              }}
                            >
                              {isFinalized ? 'Match Finalized' : 'Pending Acceptance'}
                            </ThemedText>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.dashboardScoreBtn,
                            {
                              backgroundColor: isFinalized ? theme.primary : theme.surfaceLow,
                              borderColor: isFinalized ? theme.primary : theme.outlineVariant + '44',
                              borderWidth: 1,
                            }
                          ]}
                        >
                          <ThemedText
                            style={{
                              fontSize: 11,
                              fontFamily: 'Sora_600SemiBold',
                              color: isFinalized ? '#ffffff' : theme.textSecondary,
                            }}
                          >
                            {isFinalized ? 'Scoreboard' : 'View Details'}
                          </ThemedText>
                          <Ionicons
                            name={isFinalized ? "arrow-forward" : "chevron-forward"}
                            size={12}
                            color={isFinalized ? '#ffffff' : theme.textSecondary}
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

      {/* 🪙 Top Up Sports Wallet Modal */}
      <Modal
        visible={showTopUpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTopUpModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.bidListModalSheet, { backgroundColor: theme.surfaceLowest, gap: 14 }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalIconBox, { backgroundColor: theme.primary + '14' }]}>
                  <Ionicons name="wallet" size={20} color={theme.primary} />
                </View>
                <View>
                  <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                    Top Up Wallet Coins
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                    Current Balance: ₹{walletBalance} Coins
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={() => setShowTopUpModal(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Current Balance Banner */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.primary + '0f',
                borderColor: theme.primary + '28',
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <View>
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: theme.primary, letterSpacing: 0.5 }}>
                  AVAILABLE BALANCE
                </ThemedText>
                <ThemedText style={{ fontSize: 18, fontFamily: 'Sora_600SemiBold', color: theme.primary, marginTop: 2 }}>
                  ₹{walletBalance} <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>Coins</ThemedText>
                </ThemedText>
              </View>
              <Ionicons name="shield-checkmark" size={22} color={theme.primary} />
            </View>

            {/* Quick Top-Up Preset Chips */}
            <View>
              <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 8 }}>
                SELECT TOP-UP AMOUNT
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[100, 200, 500, 1000].map((amt) => {
                  const isSelected = topUpAmountInput === String(amt);
                  return (
                    <Pressable
                      key={amt}
                      onPress={() => setTopUpAmountInput(String(amt))}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                          borderColor: isSelected ? theme.primary : theme.outlineVariant + '40',
                          borderWidth: 1.5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.85 : 1,
                        }
                      ]}
                    >
                      <ThemedText
                        style={{
                          fontSize: 12.5,
                          fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                          color: isSelected ? '#ffffff' : theme.text,
                        }}
                      >
                        +₹{amt}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Custom Amount Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLow, borderRadius: 10, borderWidth: 1, borderColor: theme.outlineVariant + '40', paddingHorizontal: 12, height: 44 }}>
              <ThemedText style={{ fontSize: 14.5, fontFamily: 'Sora_600SemiBold', color: theme.primary, marginRight: 6 }}>
                ₹
              </ThemedText>
              <TextInput
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[
                  { flex: 1, color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 15 },
                  Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)
                ]}
                placeholder="Enter custom amount"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={5}
                value={topUpAmountInput}
                onChangeText={(val) => setTopUpAmountInput(val.replace(/[^0-9]/g, ''))}
              />
            </View>

            {/* Confirm CTA */}
            <Pressable
              onPress={() => {
                const amt = parseInt(topUpAmountInput, 10);
                if (!amt || amt <= 0) {
                  showError('Invalid Amount', 'Please enter a valid top-up amount.');
                  return;
                }
                handleTopUpConfirm(amt);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: theme.primary,
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 6,
                  opacity: pressed ? 0.85 : 1,
                },
                Shadows.level2,
              ]}
            >
              <ThemedText style={{ color: '#ffffff', fontSize: 14, fontFamily: 'Sora_600SemiBold' }}>
                Add ₹{topUpAmountInput || '0'} to Wallet
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    fontFamily: 'Sora_500Medium',
  },
  stakeLabel: {
    fontFamily: 'Sora_500Medium',
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
    fontFamily: 'Sora_500Medium',
    fontSize: 28,
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
    includeFontPadding: false,
    paddingVertical: 0,
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
    fontFamily: 'Sora_500Medium',
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
    includeFontPadding: false,
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
    fontFamily: 'Sora_500Medium',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
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

  fofRelationshipStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    marginTop: 8,
  },
  statsTilesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },
  statTile: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statTileLabel: {
    fontSize: 8,
    fontFamily: 'Sora_600SemiBold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  statTileVal: {
    fontSize: 11,
    marginTop: 1.5,
  },
  formBadgePill: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
  },
  selectCtaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
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
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontFamily: 'Sora_500Medium',
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
    borderWidth: 1,
    borderColor: '#3b82f635',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Bid List Modal Styles (Player Home Dashboard Design) */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bidListModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '84%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBidsBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Dashboard-style Bid Card */
  dashboardBidCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  dashboardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dashboardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dashboardSportTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  dashboardStakePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dashboardMatchupBento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 9,
  },
  dashboardTeamCol: {
    flex: 1,
  },
  dashboardTeamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  dashboardTeamName: {
    fontSize: 13.5,
    fontFamily: 'Sora_600SemiBold',
    lineHeight: 18,
  },
  dashboardCaptainText: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
  },
  dashboardVsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  dashboardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  dashboardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  dashboardMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94a3b860',
    marginHorizontal: 8,
  },
  dashboardMetaText: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
  },
  dashboardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 9,
  },
  dashboardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardMatchStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dashboardScoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  loadMoreTeamsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 6,
  },
});
