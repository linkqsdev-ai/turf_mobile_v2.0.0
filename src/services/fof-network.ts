/**
 * 3-Chain Friend of Friend (FoF) Network Engine
 * Indexed & resolved by Player Phone Number.
 * 
 * Example Graph:
 * [You / Azar: +91 98765 00001]
 *    └── (1st Degree: Direct Contact)
 *          └── [Guna: +91 98765 11111]
 *                └── (2nd Degree: Friend of Guna)
 *                      └── [Siva: +91 98765 22222]
 *                            └── (3rd Degree: Friend of Siva)
 *                                  └── [Asif: +91 98765 33333]
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type FoFDegree = 1 | 2 | 3 | 'outside';

export interface FoFPlayer {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: string;
  team: string;
  sport: string;
  rating: number;
  winRate: number;
  location: string;
  directFriends: string[]; // Phone numbers of direct contacts
}

export interface FoFNode {
  name: string;
  phone: string;
  avatar?: string;
  role?: string;
  degree: number; // 0 = You, 1 = Direct, 2 = 2nd Degree, 3 = 3rd Degree
  stepLabel: string;
}

export interface FoFConnectionResult {
  targetName: string;
  targetPhone: string;
  targetAvatar: string;
  targetRole: string;
  targetTeam: string;
  degree: FoFDegree;
  degreeLabel: string;
  degreeBadgeText: string;
  chainPath: FoFNode[];
  chainSummary: string;
  mutualContactName?: string;
  mutualContactPhone?: string;
  intermediateChainNames: string[];
  trustScore: number;
  badgeColor: string;
  badgeBg: string;
  icon: string;
  description: string;
}

// Current Logged-in User (Root of 3-Chain Social Graph)
export const CURRENT_USER_NODE: FoFNode = {
  name: 'Azar',
  phone: '+91 98765 00001',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  role: 'Captain / All-Rounder',
  degree: 0,
  stepLabel: 'You (Host / Challenger)',
};

// Comprehensive Phone-Indexed Players Database with 3-Chain Connections
export const FOF_PLAYERS_DATABASE: FoFPlayer[] = [
  // ─── 1st Degree: Direct Friends of Azar (Top 15+ Direct Contacts) ──────
  {
    id: 'fof-p1',
    name: 'Guna',
    phone: '+91 98765 11111',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    role: 'All-Rounder • Division 1',
    team: 'Chennai Super Strikers',
    sport: 'Cricket 🏏',
    rating: 4.8,
    winRate: 78,
    location: 'Skyline Turf, Velachery',
    directFriends: ['+91 98765 00001', '+91 98765 22222', '+91 98765 22223', '+91 98765 22224'],
  },
  {
    id: 'fof-p2',
    name: 'Alex Rivera',
    phone: '+91 98765 11112',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    role: 'Captain • Midfielder',
    team: 'Weekend Warriors',
    sport: 'Football ⚽',
    rating: 4.8,
    winRate: 82,
    location: 'Apex Arena, Anna Nagar',
    directFriends: ['+91 98765 00001', '+91 98765 22225'],
  },
  {
    id: 'fof-p3',
    name: 'David Miller',
    phone: '+91 98765 11113',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    role: 'Fast Bowler • Pro Level',
    team: 'FC Thunder',
    sport: 'Cricket 🏏',
    rating: 4.5,
    winRate: 68,
    location: 'Vanguard Pitch, OMR',
    directFriends: ['+91 98765 00001', '+91 98765 22226'],
  },
  {
    id: 'fof-p4',
    name: 'Praveen',
    phone: '+91 98765 11114',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'Top Order Batsman • Division 1',
    team: 'Chennai Super Turfs',
    sport: 'Cricket 🏏',
    rating: 4.9,
    winRate: 86,
    location: 'Skyline Turf 1',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p5',
    name: 'Antony',
    phone: '+91 98765 11115',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    role: 'Wicket-Keeper Batsman • Pro',
    team: 'London Lions',
    sport: 'Cricket 🏏',
    rating: 4.7,
    winRate: 80,
    location: 'Emerald Green Arena',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p6',
    name: 'Kavin',
    phone: '+91 98765 11116',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'All-Rounder • Level 8',
    team: 'Bangalore Blasters',
    sport: 'Cricket 🏏',
    rating: 4.6,
    winRate: 74,
    location: 'Titan Ground, Guindy',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p7',
    name: 'Sri',
    phone: '+91 98765 11117',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    role: 'Off-Spinner • Division 2',
    team: 'Kent Kings',
    sport: 'Cricket 🏏',
    rating: 4.5,
    winRate: 70,
    location: 'Marina Turf Hub',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p8',
    name: 'Siva',
    phone: '+91 98765 11118',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    role: 'Opening Batsman • Level 9',
    team: 'Siva Strikers',
    sport: 'Cricket 🏏',
    rating: 4.9,
    winRate: 85,
    location: 'Turf Park, Guindy',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p9',
    name: 'Dinesh',
    phone: '+91 98765 11119',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    role: 'Fast Bowler • Pro Level',
    team: 'Chennai Super Turfs',
    sport: 'Cricket 🏏',
    rating: 4.6,
    winRate: 72,
    location: 'Emerald Pitch 2',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p10',
    name: 'Yogi',
    phone: '+91 98765 11120',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    role: 'All-Rounder • Division 2',
    team: 'Antony XI',
    sport: 'Cricket 🏏',
    rating: 4.4,
    winRate: 67,
    location: 'Skyline Arena',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p11',
    name: 'Messi Player',
    phone: '+91 98765 11121',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'Striker & All-Rounder • Pro',
    team: 'Royal Rockers',
    sport: 'Cricket 🏏',
    rating: 4.9,
    winRate: 89,
    location: 'Emerald Arena Pitch 1',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p12',
    name: 'Seshu',
    phone: '+91 98765 11122',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    role: 'Middle Order Batsman • Elite',
    team: 'Royal Rockers',
    sport: 'Cricket 🏏',
    rating: 4.7,
    winRate: 77,
    location: 'Emerald Arena Pitch 1',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p13',
    name: 'Asif',
    phone: '+91 98765 11123',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    role: 'Top Order Batsman • Captain',
    team: 'Knights Riders',
    sport: 'Cricket 🏏',
    rating: 4.9,
    winRate: 88,
    location: 'Eden Gardens Turf',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p14',
    name: 'Rakesh Kumar',
    phone: '+91 98765 11124',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'Pacer • Division 1',
    team: 'Starlight XI',
    sport: 'Cricket 🏏',
    rating: 4.6,
    winRate: 73,
    location: 'Velachery Turf Park',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p15',
    name: 'Suresh Raina',
    phone: '+91 98765 11125',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    role: 'Middle Order Batsman • Pro',
    team: 'Super Strikers',
    sport: 'Cricket 🏏',
    rating: 4.8,
    winRate: 84,
    location: 'Adyar Cricket Ground',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p16',
    name: 'Rohit Verma',
    phone: '+91 98765 11126',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    role: 'Opening Batsman • Division 1',
    team: 'Marina Lions',
    sport: 'Cricket 🏏',
    rating: 4.7,
    winRate: 79,
    location: 'OMR Turf Park',
    directFriends: ['+91 98765 00001'],
  },
  {
    id: 'fof-p17',
    name: 'Ashwin Raj',
    phone: '+91 98765 11127',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    role: 'Off-Spinner • All-Rounder',
    team: 'Marina Blasters',
    sport: 'Cricket 🏏',
    rating: 4.8,
    winRate: 81,
    location: 'Guindy Arena',
    directFriends: ['+91 98765 00001'],
  },

  // ─── 2nd Degree: Friends of Guna (Direct Friends of 1st Degree) ───
  {
    id: 'fof-p4',
    name: 'Siva',
    phone: '+91 98765 22222',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'Opening Batsman • Level 9',
    team: 'Marina Blasters',
    sport: 'Cricket 🏏',
    rating: 4.9,
    winRate: 85,
    location: 'Turf Park, Guindy',
    directFriends: ['+91 98765 11111', '+91 98765 33333', '+91 98765 33334', '+91 98765 33335'],
  },
  {
    id: 'fof-p5',
    name: 'Marcus Vance',
    phone: '+91 98765 22223',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    role: 'Striker • Pro League',
    team: 'Neon Knights',
    sport: 'Futsal ⚽',
    rating: 4.9,
    winRate: 91,
    location: 'Metro Futsal Hub',
    directFriends: ['+91 98765 11111', '+91 98765 33336'],
  },
  {
    id: 'fof-p6',
    name: 'Vikram Patel',
    phone: '+91 98765 22224',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    role: 'Goalkeeper • Elite',
    team: 'Knight Riders',
    sport: 'Football ⚽',
    rating: 4.7,
    winRate: 74,
    location: 'Starlight Arena, Adyar',
    directFriends: ['+91 98765 11111', '+91 98765 33337'],
  },
  {
    id: 'fof-p7',
    name: 'Sarah Jenkins',
    phone: '+91 98765 22225',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    role: 'Playmaker • Level 8',
    team: 'Thunderbolts',
    sport: 'Badminton 🏸',
    rating: 4.6,
    winRate: 70,
    location: 'Pro Shuttle Arena',
    directFriends: ['+91 98765 11112', '+91 98765 33338'],
  },

  // ─── 3rd Degree: Friends of Siva (Connected via Siva ➔ Guna ➔ Azar) ───
  {
    id: 'fof-p8',
    name: 'Asif',
    phone: '+91 98765 33333',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    role: 'Top Order Batsman • Captain',
    team: 'Royals XI',
    sport: 'Cricket 🏏',
    rating: 4.9,
    winRate: 88,
    location: 'Eden Gardens Turf, Nungambakkam',
    directFriends: ['+91 98765 22222'],
  },
  {
    id: 'fof-p9',
    name: 'Rahul Sharma',
    phone: '+91 98765 33334',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'Spinner • Level 7',
    team: 'Rahul XI',
    sport: 'Cricket 🏏',
    rating: 4.6,
    winRate: 65,
    location: 'Skyline Ground 3',
    directFriends: ['+91 98765 22222'],
  },
  {
    id: 'fof-p10',
    name: 'Sarah Connor',
    phone: '+91 98765 33335',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    role: 'Pacer • Division 3',
    team: 'Urban Legends',
    sport: 'Cricket 🏏',
    rating: 4.2,
    winRate: 54,
    location: 'Starlight Ground 2',
    directFriends: ['+91 98765 22222'],
  },
  {
    id: 'fof-p11',
    name: 'Priya Sundaram',
    phone: '+91 98765 33336',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    role: 'Defender • Level 8',
    team: 'Phoenix Strikers',
    sport: 'Football ⚽',
    rating: 4.5,
    winRate: 69,
    location: 'Titan Ground, T. Nagar',
    directFriends: ['+91 98765 22223'],
  },
];

// Storage Key for Persisted FoF Network Players
const FOF_STORAGE_KEY = '@turf_fof_custom_players';

// Immediately attempt to hydrate from AsyncStorage
let isFoFHydrated = false;

export async function loadFoFDatabase(): Promise<FoFPlayer[]> {
  try {
    const raw = await AsyncStorage.getItem(FOF_STORAGE_KEY);
    if (raw) {
      const stored: FoFPlayer[] = JSON.parse(raw);
      if (Array.isArray(stored)) {
        stored.forEach(sp => {
          const spDigits = (sp.phone || '').replace(/\D/g, '').slice(-10);
          const existingIdx = FOF_PLAYERS_DATABASE.findIndex(p => {
            const pDigits = (p.phone || '').replace(/\D/g, '').slice(-10);
            return (spDigits.length >= 10 && pDigits.length >= 10 && spDigits === pDigits) ||
                   p.name.trim().toLowerCase() === sp.name.trim().toLowerCase();
          });
          if (existingIdx >= 0) {
            FOF_PLAYERS_DATABASE[existingIdx] = { ...FOF_PLAYERS_DATABASE[existingIdx], ...sp };
          } else {
            FOF_PLAYERS_DATABASE.unshift(sp);
          }
        });
      }
    }
    isFoFHydrated = true;
  } catch (err) {
    console.warn('Failed to load FoF database from storage', err);
  }
  return FOF_PLAYERS_DATABASE;
}

// Trigger background hydration
loadFoFDatabase();

/**
 * Resolve the 3-Chain Friend of Friend connection between You (Azar) and any target player
 * by Phone Number or Name.
 */
export function getFoFConnection(targetQuery: string): FoFConnectionResult {
  const normalizedQuery = (targetQuery || '').trim().toLowerCase();
  const rawDigits = (targetQuery || '').replace(/[^0-9]/g, '');
  const digits10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

  // Find player in database
  const targetPlayer = FOF_PLAYERS_DATABASE.find(p => {
    const pDigits = (p.phone || '').replace(/[^0-9]/g, '');
    const pDigits10 = pDigits.length >= 10 ? pDigits.slice(-10) : pDigits;
    return (
      p.name.toLowerCase() === normalizedQuery ||
      p.name.toLowerCase().includes(normalizedQuery) ||
      (rawDigits.length >= 3 && (pDigits.includes(rawDigits) || pDigits10.includes(digits10))) ||
      (p.team && p.team.toLowerCase().includes(normalizedQuery))
    );
  }) || {
    id: 'unknown',
    name: targetQuery || 'Challenger Player',
    phone: '+91 98765 99999',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'Player • Division 2',
    team: 'Challenger Squad',
    sport: 'Sports 🏆',
    rating: 4.5,
    winRate: 60,
    location: 'Local Arena',
    directFriends: [],
  };

  const targetPhone = targetPlayer.phone;
  const targetName = targetPlayer.name;

  // ─── 1st Degree: Direct Contact of Azar (+91 98765 00001) ───
  if (
    targetPhone === '+91 98765 11111' || // Guna
    targetPhone === '+91 98765 11112' || // Alex Rivera
    targetPhone === '+91 98765 11113' || // David Miller
    targetPlayer.directFriends.includes(CURRENT_USER_NODE.phone)
  ) {
    const chainPath: FoFNode[] = [
      CURRENT_USER_NODE,
      {
        name: targetName,
        phone: targetPhone,
        avatar: targetPlayer.avatar,
        role: targetPlayer.role,
        degree: 1,
        stepLabel: '1st Degree (Direct Contact)',
      },
    ];

    return {
      targetName,
      targetPhone,
      targetAvatar: targetPlayer.avatar,
      targetRole: targetPlayer.role,
      targetTeam: targetPlayer.team,
      degree: 1,
      degreeLabel: '1st Degree • Direct Friend',
      degreeBadgeText: '🤝 Direct Friend (1st Degree)',
      chainPath,
      chainSummary: `You (${CURRENT_USER_NODE.phone}) ➔ ${targetName} (${targetPhone})`,
      mutualContactName: targetName,
      mutualContactPhone: targetPhone,
      intermediateChainNames: [],
      trustScore: 99,
      badgeColor: '#10B981',
      badgeBg: '#10B98118',
      icon: 'people',
      description: `${targetName} is saved directly in your phone contacts.`,
    };
  }

  // ─── 2nd Degree: Mutual Friend (Azar ➔ Guna ➔ Target) ───
  if (
    targetPhone === '+91 98765 22222' || // Siva
    targetPhone === '+91 98765 22223' || // Marcus Vance
    targetPhone === '+91 98765 22224' || // Vikram Patel
    targetPhone === '+91 98765 22225' || // Sarah Jenkins
    targetPlayer.directFriends.includes('+91 98765 11111') ||
    targetPlayer.directFriends.includes('+91 98765 11112') ||
    targetPlayer.directFriends.includes('+91 98765 11113')
  ) {
    const intermediateFriend = targetPhone === '+91 98765 22225'
      ? { name: 'Alex Rivera', phone: '+91 98765 11112', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' }
      : { name: 'Guna', phone: '+91 98765 11111', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80' };

    const chainPath: FoFNode[] = [
      CURRENT_USER_NODE,
      {
        name: intermediateFriend.name,
        phone: intermediateFriend.phone,
        avatar: intermediateFriend.avatar,
        role: 'Direct Friend',
        degree: 1,
        stepLabel: `1st Degree (${intermediateFriend.name})`,
      },
      {
        name: targetName,
        phone: targetPhone,
        avatar: targetPlayer.avatar,
        role: targetPlayer.role,
        degree: 2,
        stepLabel: `2nd Degree (Friend of ${intermediateFriend.name})`,
      },
    ];

    return {
      targetName,
      targetPhone,
      targetAvatar: targetPlayer.avatar,
      targetRole: targetPlayer.role,
      targetTeam: targetPlayer.team,
      degree: 2,
      degreeLabel: `2nd Degree • via ${intermediateFriend.name}`,
      degreeBadgeText: `🔗 2nd Degree (via ${intermediateFriend.name})`,
      chainPath,
      chainSummary: `You ➔ ${intermediateFriend.name} (${intermediateFriend.phone}) ➔ ${targetName} (${targetPhone})`,
      mutualContactName: intermediateFriend.name,
      mutualContactPhone: intermediateFriend.phone,
      intermediateChainNames: [intermediateFriend.name],
      trustScore: 89,
      badgeColor: '#5D68E8',
      badgeBg: '#5D68E818',
      icon: 'git-network-outline',
      description: `${targetName} is a direct contact of your friend ${intermediateFriend.name} (${intermediateFriend.phone}).`,
    };
  }

  // ─── 3rd Degree: 3-Chain Friend of Friend (Azar ➔ Guna ➔ Siva ➔ Asif / Target) ───
  const gunaNode = { name: 'Guna', phone: '+91 98765 11111', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80' };
  const sivaNode = { name: 'Siva', phone: '+91 98765 22222', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' };

  const chainPath: FoFNode[] = [
    CURRENT_USER_NODE,
    {
      name: gunaNode.name,
      phone: gunaNode.phone,
      avatar: gunaNode.avatar,
      role: 'Direct Contact',
      degree: 1,
      stepLabel: '1st Degree (Guna)',
    },
    {
      name: sivaNode.name,
      phone: sivaNode.phone,
      avatar: sivaNode.avatar,
      role: 'Friend of Guna',
      degree: 2,
      stepLabel: '2nd Degree (Siva)',
    },
    {
      name: targetName,
      phone: targetPhone,
      avatar: targetPlayer.avatar,
      role: targetPlayer.role,
      degree: 3,
      stepLabel: '3rd Degree (Friend of Siva)',
    },
  ];

  return {
    targetName,
    targetPhone,
    targetAvatar: targetPlayer.avatar,
    targetRole: targetPlayer.role,
    targetTeam: targetPlayer.team,
    degree: 3,
    degreeLabel: `3rd Degree • via ${sivaNode.name} ➔ ${gunaNode.name}`,
    degreeBadgeText: `🌐 3-Chain FoF (via Siva ➔ Guna)`,
    chainPath,
    chainSummary: `You ➔ Guna (${gunaNode.phone}) ➔ Siva (${sivaNode.phone}) ➔ ${targetName} (${targetPhone})`,
    mutualContactName: `${sivaNode.name} (${gunaNode.name})`,
    mutualContactPhone: sivaNode.phone,
    intermediateChainNames: [gunaNode.name, sivaNode.name],
    trustScore: 78,
    badgeColor: '#8B5CF6',
    badgeBg: '#8B5CF618',
    icon: 'share-social-outline',
    description: `${targetName} is connected through your 3-Chain network: Azar ➔ Guna (+91 98765 11111) ➔ Siva (+91 98765 22222) ➔ ${targetName}.`,
  };
}

/**
 * Resolves multiple FoF connections for a specific team or player context.
 * Returns an array of FoFConnectionResult objects for all mutual players in that team.
 */
export function getTeamFoFConnections(teamNameOrQuery: string, fallbackCaptain?: string): FoFConnectionResult[] {
  const queryClean = (teamNameOrQuery || '').toLowerCase();
  
  // Find all players in the database that match this team or query
  const matchingPlayers = FOF_PLAYERS_DATABASE.filter(p => {
    const tLower = (p.team || '').toLowerCase();
    const nLower = (p.name || '').toLowerCase();
    return (
      (queryClean && (tLower.includes(queryClean) || queryClean.includes(tLower))) ||
      (fallbackCaptain && nLower.includes(fallbackCaptain.toLowerCase()))
    );
  });

  if (matchingPlayers.length >= 2) {
    return matchingPlayers.map(p => getFoFConnection(p.phone));
  }

  // If 1 or 0 matching, resolve primary plus realistic mutual player connections in that squad
  const primary = getFoFConnection(fallbackCaptain || teamNameOrQuery || '+91 98765 11111');
  const pool = FOF_PLAYERS_DATABASE.filter(p => p.phone !== primary.targetPhone);
  
  // Pick related players in the 3-chain network
  const extra1 = pool.find(p => p.directFriends.includes(primary.targetPhone) || primary.chainPath.some(n => n.phone === p.phone)) || pool[0];
  const extra2 = pool.find(p => p.phone !== extra1?.phone && p.phone !== primary.targetPhone) || pool[1];

  const results: FoFConnectionResult[] = [primary];
  if (extra1) results.push(getFoFConnection(extra1.phone));
  if (extra2) results.push(getFoFConnection(extra2.phone));

  return results;
}

/**
 * Register a player under the logged-in user to build the 3-Chain FoF network.
 */
export function registerFoFPlayer(player: {
  name: string;
  phone?: string;
  avatar?: string;
  role?: string;
  team?: string;
  sport?: string;
}): FoFPlayer {
  const trimmedName = (player.name || '').trim();
  const rawDigits = (player.phone || '').replace(/\D/g, '');
  const digits10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

  const normPhone = player.phone && digits10.length >= 10
    ? `+91 ${digits10.slice(0, 5)} ${digits10.slice(5)}`
    : (player.phone?.trim() || `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`);

  const existing = FOF_PLAYERS_DATABASE.find(p => {
    const pDigits = (p.phone || '').replace(/\D/g, '');
    const pDigits10 = pDigits.length >= 10 ? pDigits.slice(-10) : pDigits;
    return (digits10.length >= 10 && pDigits10 === digits10) ||
           (trimmedName.length > 0 && p.name.trim().toLowerCase() === trimmedName.toLowerCase());
  });

  let resultPlayer: FoFPlayer;

  if (existing) {
    if (player.phone && digits10.length >= 10) existing.phone = normPhone;
    if (player.avatar) existing.avatar = player.avatar;
    if (player.role) existing.role = player.role;
    if (player.team) existing.team = player.team;
    if (player.sport) existing.sport = player.sport;
    if (!existing.directFriends.includes(CURRENT_USER_NODE.phone)) {
      existing.directFriends.push(CURRENT_USER_NODE.phone);
    }
    resultPlayer = existing;
  } else {
    const newFoF: FoFPlayer = {
      id: `fof-user-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name: trimmedName || 'Player',
      phone: normPhone,
      avatar: player.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: player.role || 'Player • All-Rounder',
      team: player.team || 'Local Club',
      sport: player.sport || 'Cricket 🏏',
      rating: 4.8,
      winRate: 75,
      location: 'Chennai Turf Network',
      directFriends: [CURRENT_USER_NODE.phone], // Connected directly as 1st-degree friend to logged user (Azar)
    };
    FOF_PLAYERS_DATABASE.unshift(newFoF);
    resultPlayer = newFoF;
  }

  // Persist all custom registered players
  try {
    const custom = FOF_PLAYERS_DATABASE.filter(p => p.id.startsWith('fof-user-') || p.directFriends.includes(CURRENT_USER_NODE.phone));
    AsyncStorage.setItem(FOF_STORAGE_KEY, JSON.stringify(custom)).catch(() => {});
  } catch {}

  return resultPlayer;
}

/**
 * Bulk sync a list of players into the FoF Network under logged-in user (Azar).
 */
export function syncPlayersToFoF(players: Array<{ name: string; phone?: string; avatar?: string; role?: string; team?: string; sport?: string }>) {
  if (!Array.isArray(players) || players.length === 0) return;
  players.forEach(p => {
    if (p && p.name && p.name.trim().length > 0) {
      registerFoFPlayer(p);
    }
  });
}

/**
 * Filter & Search FoF Players by Phone Number, Name, Sport, or Chain Degree.
 */
export function searchFoFDirectory(query: string, degreeFilter?: number): FoFPlayer[] {
  const q = (query || '').trim().toLowerCase();
  const rawDigits = (query || '').replace(/[^0-9]/g, '');
  const digits10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

  return FOF_PLAYERS_DATABASE.filter(player => {
    const conn = getFoFConnection(player.phone);
    if (degreeFilter && conn.degree !== degreeFilter) {
      return false;
    }

    if (!q && !rawDigits) return true;

    const pDigits = (player.phone || '').replace(/[^0-9]/g, '');
    const pDigits10 = pDigits.length >= 10 ? pDigits.slice(-10) : pDigits;

    return (
      player.name.toLowerCase().includes(q) ||
      (player.team && player.team.toLowerCase().includes(q)) ||
      (player.sport && player.sport.toLowerCase().includes(q)) ||
      (player.role && player.role.toLowerCase().includes(q)) ||
      (rawDigits.length >= 3 && (pDigits.includes(rawDigits) || pDigits10.includes(digits10) || digits10.includes(pDigits10)))
    );
  });
}

/**
 * Returns the top 1st Degree (Direct Contact) FoF players for the logged-in user.
 */
export function getFirstDegreePlayers(limit = 15): FoFPlayer[] {
  return FOF_PLAYERS_DATABASE.filter(player => {
    const conn = getFoFConnection(player.phone);
    return conn.degree === 1;
  }).slice(0, limit);
}

