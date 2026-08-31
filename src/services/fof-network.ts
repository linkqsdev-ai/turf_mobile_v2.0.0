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
  // ─── 1st Degree: Direct Friends of Azar ──────────────────────
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

/**
 * Resolve the 3-Chain Friend of Friend connection between You (Azar) and any target player
 * by Phone Number or Name.
 */
export function getFoFConnection(targetQuery: string): FoFConnectionResult {
  const normalizedQuery = (targetQuery || '').trim().toLowerCase();
  const rawDigits = (targetQuery || '').replace(/[^0-9]/g, '');

  // Find player in database
  const targetPlayer = FOF_PLAYERS_DATABASE.find(p => {
    const pDigits = p.phone.replace(/[^0-9]/g, '');
    return (
      p.name.toLowerCase() === normalizedQuery ||
      p.name.toLowerCase().includes(normalizedQuery) ||
      (rawDigits.length >= 4 && pDigits.includes(rawDigits)) ||
      p.team.toLowerCase().includes(normalizedQuery)
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
 * Filter & Search FoF Players by Phone Number, Name, Sport, or Chain Degree.
 */
export function searchFoFDirectory(query: string, degreeFilter?: number): FoFPlayer[] {
  const q = (query || '').trim().toLowerCase();
  const digits = q.replace(/[^0-9]/g, '');

  return FOF_PLAYERS_DATABASE.filter(player => {
    const conn = getFoFConnection(player.phone);
    if (degreeFilter && conn.degree !== degreeFilter) {
      return false;
    }

    if (!q) return true;

    const pDigits = player.phone.replace(/[^0-9]/g, '');
    return (
      player.name.toLowerCase().includes(q) ||
      player.team.toLowerCase().includes(q) ||
      player.sport.toLowerCase().includes(q) ||
      player.role.toLowerCase().includes(q) ||
      (digits.length >= 3 && pDigits.includes(digits))
    );
  });
}
