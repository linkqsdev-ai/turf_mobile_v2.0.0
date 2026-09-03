import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { AVATAR_KEYS, getAvatarSource } from '@/constants/avatars';
import { getMascotImage } from '@/constants/mascots';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  generatePlayerId,
  getTwoLetterLogo,
  isUsablePhone,
  normalizePhone,
  type Player,
} from '@/store/match-store';
import { useMatchStore, useWalletStore } from '@/store/app-store';
import { AddPlayerModal } from '@/components/scoring/squad-modals';
import { registerFoFPlayer, searchFoFDirectory, getFoFConnection, loadFoFDatabase } from '@/services/fof-network';

const CREDIT_REWARD = 5;

type BucketId = 'master' | 'teamA' | 'teamB';
type DropTargetId = BucketId | 'striker' | 'nonStriker' | 'bowler';
type Buckets = Record<BucketId, Player[]>;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GHOST_WIDTH = 140;
const GHOST_HEIGHT = 36;

export interface BatsmanLiveStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
  highScore?: number;
}

export interface BowlerLiveStats {
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  econ: string;
  bestBowling?: string;
}

export const strictDedupe = (list: Player[]): Player[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: Player[] = [];
  for (const p of list) {
    if (!p || !p.name || !p.name.trim()) continue;
    const key = p.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
};

function usePalette() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    theme,
    isDark,
    canvas: isDark ? theme.background : '#F8FAFC',
    cardBg: isDark ? theme.surfaceLow : '#FFFFFF',
    zoneBg: isDark ? theme.surfaceLowest : '#F1F5F9',
    borderColor: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? theme.text : '#0F172A',
    textSecondary: isDark ? theme.textSecondary : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
  };
}

const shortCode = (name: string, fallback: string): string => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const avatarSourceFor = (player: Player) => {
  if (player.avatarUrl) {
    if (
      player.avatarUrl.startsWith('http') ||
      player.avatarUrl.startsWith('file:') ||
      player.avatarUrl.startsWith('blob:') ||
      player.avatarUrl.startsWith('data:') ||
      player.avatarUrl.includes('/')
    ) {
      return { uri: player.avatarUrl };
    }
    return getAvatarSource(player.avatarUrl);
  }
  let hash = 0;
  for (let i = 0; i < player.id.length; i++) {
    hash = (hash * 31 + player.id.charCodeAt(i)) >>> 0;
  }
  return getAvatarSource(AVATAR_KEYS[hash % AVATAR_KEYS.length]);
};

export interface PlayerSelectionModalProps {
  visible: boolean;
  teamAName: string;
  teamBName: string;
  teamAMascot?: string;
  teamBMascot?: string;
  battingTeamName?: string;
  bowlingTeamName?: string;
  activeStrikerName?: string;
  activeNonStrikerName?: string;
  activeBowlerName?: string;
  batsmenStats?: Record<string, BatsmanLiveStats>;
  bowlerStats?: Record<string, BowlerLiveStats>;
  dismissedPlayers?: { name: string; status: string; dismissalType?: string }[];
  initialPool?: Player[];
  initialTeamA?: Player[];
  initialTeamB?: Player[];
  onClose?: () => void;
  onSkip: () => void;
  onConfirm: (
    teamA: Player[],
    teamB: Player[],
    unassigned: Player[],
    meta?: {
      strikerName?: string;
      nonStrikerName?: string;
      bowlerName?: string;
      battingTeamName?: string;
      bowlingTeamName?: string;
      retiredPlayer?: { name: string; type: 'Retired Hurt' | 'Retired Out' };
    }
  ) => void;
  onRetireBatsman?: (player: Player, type: 'Retired Hurt' | 'Retired Out') => void;
  onSwapStrike?: () => void;
  onSetStriker?: (player: Player) => void;
  onSetNonStriker?: (player: Player) => void;
  onSetBowler?: (player: Player) => void;
  onRetireBowler?: (player: Player) => void;
}

export function PlayerSelectionModal({
  visible,
  teamAName,
  teamBName,
  teamAMascot,
  teamBMascot,
  battingTeamName: propBattingTeam,
  bowlingTeamName: propBowlingTeam,
  activeStrikerName = '',
  activeNonStrikerName = '',
  activeBowlerName = '',
  batsmenStats = {},
  bowlerStats = {},
  dismissedPlayers = [],
  initialPool = [],
  initialTeamA = [],
  initialTeamB = [],
  onClose,
  onSkip,
  onConfirm,
  onRetireBatsman,
  onSwapStrike,
  onSetStriker,
  onSetNonStriker,
  onSetBowler,
  onRetireBowler,
}: PlayerSelectionModalProps) {
  const { theme, canvas, cardBg, zoneBg, borderColor, textPrimary, textSecondary, textMuted } = usePalette();

  const labelA = (teamAName || '').trim() || 'Team A';
  const labelB = (teamBName || '').trim() || 'Team B';
  const codeA = shortCode(labelA, 'TA');
  const codeB = shortCode(labelB, 'TB');

  const [buckets, setBuckets] = useState<Buckets>({
    master: strictDedupe(initialPool || []),
    teamA: strictDedupe(initialTeamA || []),
    teamB: strictDedupe(initialTeamB || []),
  });

  const [currentBattingTeam, setCurrentBattingTeam] = useState<string>(propBattingTeam || labelA);
  const isTeamABatting = currentBattingTeam.trim().toLowerCase() === labelA.trim().toLowerCase();
  const batTeamBucket: BucketId = isTeamABatting ? 'teamA' : 'teamB';
  const bowlTeamBucket: BucketId = isTeamABatting ? 'teamB' : 'teamA';

  const [strikerName, setStrikerName] = useState<string>(activeStrikerName);
  // Ensure same player is NEVER in both striker and non-striker
  const [nonStrikerName, setNonStrikerName] = useState<string>(
    activeNonStrikerName.trim().toLowerCase() === activeStrikerName.trim().toLowerCase() ? '' : activeNonStrikerName
  );
  const [bowlerName, setBowlerName] = useState<string>(activeBowlerName);

  const [retiredPlayers, setRetiredPlayers] = useState<{ name: string; type: 'Retired Hurt' | 'Retired Out' }[]>([]);
  const [selectedActionPlayer, setSelectedActionPlayer] = useState<{ player: Player; bucketId: BucketId } | null>(null);
  const [retireConfirmPlayer, setRetireConfirmPlayer] = useState<Player | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSeed, setAddSeed] = useState<{ name: string; phone: string }>({ name: '', phone: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingPlayer, setDraggingPlayer] = useState<Player | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<DropTargetId | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [creditToast, setCreditToast] = useState<string | null>(null);
  const creditedPhones = useRef<Set<string>>(new Set());

  // Re-seed only when modal opens
  useEffect(() => {
    if (visible) {
      loadFoFDatabase().catch(() => {});
      const teamA = strictDedupe(initialTeamA || []);
      const teamB = strictDedupe(initialTeamB || []).filter(
        (p) => !teamA.some((a) => a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      const assigned = new Set([...teamA, ...teamB].map((p) => p.name.trim().toLowerCase()));
      setBuckets({
        master: strictDedupe(initialPool || []).filter((p) => !assigned.has(p.name.trim().toLowerCase())),
        teamA,
        teamB,
      });

      setCurrentBattingTeam(propBattingTeam || labelA);
      setStrikerName(activeStrikerName);
      setNonStrikerName(
        activeNonStrikerName.trim().toLowerCase() === activeStrikerName.trim().toLowerCase() ? '' : activeNonStrikerName
      );
      setBowlerName(activeBowlerName);

      const initRetired: { name: string; type: 'Retired Hurt' | 'Retired Out' }[] = [];
      (dismissedPlayers || []).forEach((d) => {
        if (!d || !d.name) return;
        if (d.status === 'Retired Hurt' || d.dismissalType === 'retired_hurt') {
          initRetired.push({ name: d.name, type: 'Retired Hurt' });
        } else if (d.status === 'Retired Out' || d.dismissalType === 'retired_out' || d.status === 'Retired') {
          initRetired.push({ name: d.name, type: 'Retired Out' });
        }
      });
      setRetiredPlayers(initRetired);
    }
  }, [visible]);

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const ghostScale = useSharedValue(0.95);

  const dropZoneRefs = useRef<Record<DropTargetId, View | null>>({
    master: null,
    teamA: null,
    teamB: null,
    striker: null,
    nonStriker: null,
    bowler: null,
  });
  const dropZoneRects = useRef<Partial<Record<DropTargetId, Rect>>>({});

  const measureDropZones = useCallback(() => {
    (Object.keys(dropZoneRefs.current) as DropTargetId[]).forEach((id) => {
      const node = dropZoneRefs.current[id];
      node?.measureInWindow((x, y, width, height) => {
        dropZoneRects.current[id] = { x, y, width, height };
      });
    });
  }, []);

  const resolveDropTarget = useCallback((x: number, y: number): DropTargetId | null => {
    const specificSlots: DropTargetId[] = ['striker', 'nonStriker', 'bowler'];
    for (const id of specificSlots) {
      const rect = dropZoneRects.current[id];
      if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return id;
      }
    }
    const generalBuckets: DropTargetId[] = ['teamA', 'teamB', 'master'];
    for (const id of generalBuckets) {
      const rect = dropZoneRects.current[id];
      if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return id;
      }
    }
    return null;
  }, []);

  const moveToBucket = useCallback((player: Player, from: BucketId, to: BucketId) => {
    if (from === to || !player || !player.name) return;
    const playerKey = player.name.trim().toLowerCase();
    setBuckets((prev) => ({
      ...prev,
      [from]: (prev[from] || []).filter((p) => p.name.trim().toLowerCase() !== playerKey),
      [to]: strictDedupe([...(prev[to] || []).filter((p) => p.name.trim().toLowerCase() !== playerKey), player]),
    }));

    if (player.name.toLowerCase() === strikerName.toLowerCase()) setStrikerName('');
    if (player.name.toLowerCase() === nonStrikerName.toLowerCase()) setNonStrikerName('');
    if (player.name.toLowerCase() === bowlerName.toLowerCase()) setBowlerName('');
  }, [strikerName, nonStrikerName, bowlerName]);

  const handleDragStart = useCallback((player: Player, _from: BucketId) => {
    measureDropZones();
    setDraggingPlayer(player);
    setScrollEnabled(false);
    ghostScale.value = withTiming(1, { duration: 100 });
  }, [measureDropZones, ghostScale]);

  const handleDragUpdate = useCallback((x: number, y: number) => {
    const target = resolveDropTarget(x, y);
    setActiveDropZone(target);
  }, [resolveDropTarget]);

  const handleDragEnd = useCallback((player: Player, from: BucketId, x: number, y: number) => {
    const target = resolveDropTarget(x, y);
    setActiveDropZone(null);
    setDraggingPlayer(null);
    setScrollEnabled(true);

    if (!target) return;

    if (target === 'striker') {
      if (from !== batTeamBucket) {
        moveToBucket(player, from, batTeamBucket);
      }
      setStrikerName(player.name);
      // Strictly prevent duplicate assignment across ends
      if (nonStrikerName.toLowerCase() === player.name.toLowerCase()) setNonStrikerName('');
      setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
      if (onSetStriker) onSetStriker(player);
    } else if (target === 'nonStriker') {
      if (from !== batTeamBucket) {
        moveToBucket(player, from, batTeamBucket);
      }
      setNonStrikerName(player.name);
      // Strictly prevent duplicate assignment across ends
      if (strikerName.toLowerCase() === player.name.toLowerCase()) setStrikerName('');
      setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
      if (onSetNonStriker) onSetNonStriker(player);
    } else if (target === 'bowler') {
      if (from !== bowlTeamBucket) {
        moveToBucket(player, from, bowlTeamBucket);
      }
      setBowlerName(player.name);
      if (onSetBowler) onSetBowler(player);
    } else {
      moveToBucket(player, from, target as BucketId);
    }
  }, [resolveDropTarget, batTeamBucket, bowlTeamBucket, nonStrikerName, strikerName, onSetStriker, onSetNonStriker, onSetBowler, moveToBucket]);

  const { teams: savedTeams } = useMatchStore();
  const { addWalletFunds } = useWalletStore();

  const everyone = useMemo(
    () => [...(buckets.master || []), ...(buckets.teamA || []), ...(buckets.teamB || [])],
    [buckets]
  );

  const isAlreadyIn = useCallback(
    (candidate: { name: string; phone?: string | null }) => {
      if (!candidate || !candidate.name) return false;
      const candidateKey = candidate.name.trim().toLowerCase();
      return everyone.some((p) => p && p.name && p.name.trim().toLowerCase() === candidateKey);
    },
    [everyone]
  );

  const commitPlayer = useCallback(
    (fields: { name: string; phone?: string | null; avatarUrl?: string }) => {
      const trimmed = (fields.name || '').trim();
      if (!trimmed) return;

      if (isAlreadyIn(fields)) {
        setDuplicateWarning(
          `${trimmed}${fields.phone ? ` (${fields.phone})` : ''} is already in the match pool.`
        );
        return;
      }

      const player: Player = {
        id: generatePlayerId(),
        name: trimmed,
        phone: fields.phone ? normalizePhone(fields.phone) : undefined,
        avatarUrl: fields.avatarUrl,
        position: 'All-Rounder',
        skillLevel: 'Intermediate',
      };

      setBuckets((prev) => ({
        ...prev,
        master: strictDedupe([player, ...(prev.master || [])]),
      }));

      registerFoFPlayer({
        name: player.name,
        phone: player.phone,
        avatar: player.avatarUrl,
        sport: 'Cricket 🏏',
      });

      setAddModalOpen(false);
      setSearchQuery('');
      setDuplicateWarning(null);

      const rawDigits = fields.phone ? normalizePhone(fields.phone) : '';
      if (
        isUsablePhone(fields.phone) &&
        rawDigits &&
        !creditedPhones.current.has(rawDigits)
      ) {
        creditedPhones.current.add(rawDigits);
        addWalletFunds(CREDIT_REWARD);
        setCreditToast(`+₹${CREDIT_REWARD} reward added to wallet for player profile!`);
        setTimeout(() => setCreditToast(null), 3000);
      }
    },
    [isAlreadyIn, addWalletFunds]
  );

  const queryClean = (searchQuery || '').trim().toLowerCase();
  const queryDigits = (searchQuery || '').replace(/\D/g, '');
  const queryLooksLikePhone = queryDigits.length >= 6;

  const matchPlayerResults = useMemo(() => {
    if (queryClean.length < 2 && queryDigits.length < 3) return [];
    const results: { player: Player; location: BucketId; locationLabel: string }[] = [];

    (buckets.master || []).forEach((p) => {
      if (!p || !p.name) return;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        results.push({ player: p, location: 'master', locationLabel: 'Available Pool' });
      }
    });
    (buckets.teamA || []).forEach((p) => {
      if (!p || !p.name) return;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        results.push({ player: p, location: 'teamA', locationLabel: labelA });
      }
    });
    (buckets.teamB || []).forEach((p) => {
      if (!p || !p.name) return;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        results.push({ player: p, location: 'teamB', locationLabel: labelB });
      }
    });
    return results;
  }, [buckets, queryClean, queryDigits, labelA, labelB]);

  const savedPlayerResults = useMemo(() => {
    if (!savedTeams || (queryClean.length < 2 && queryDigits.length < 3)) return [];
    const allSavedPlayers: Player[] = [];
    (savedTeams || []).forEach((t) => {
      (t?.players || []).forEach((p) => {
        if (p && p.name && p.name.trim()) allSavedPlayers.push(p);
      });
    });
    return strictDedupe(allSavedPlayers)
      .filter((p) => !isAlreadyIn(p))
      .filter((p) => {
        const pDigits = p.phone ? normalizePhone(p.phone) : '';
        return (p.name && p.name.toLowerCase().includes(queryClean)) || (queryDigits.length >= 3 && pDigits.includes(queryDigits));
      })
      .slice(0, 4);
  }, [savedTeams, queryClean, queryDigits, isAlreadyIn]);

  const directoryResults = useMemo(() => {
    if (queryClean.length < 2 && queryDigits.length < 3) return [];
    const savedIds = new Set((savedPlayerResults || []).map((p) => p.name.trim().toLowerCase()));
    return (searchFoFDirectory(searchQuery || '') || [])
      .filter((p) => p && p.name && !isAlreadyIn({ name: p.name, phone: p.phone }))
      .filter((p) => p && p.name && !savedIds.has(p.name.trim().toLowerCase()))
      .slice(0, 6);
  }, [searchQuery, queryClean, queryDigits, isAlreadyIn, savedPlayerResults]);

  const exactMatchInPool = useMemo(() => {
    if (!queryClean && !queryDigits) return null;
    return everyone.find((p) => {
      if (!p || !p.name) return false;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (queryDigits.length >= 10 && pDigits === queryDigits) return true;
      if (queryClean.length >= 2 && p.name.toLowerCase() === queryClean) return true;
      return false;
    });
  }, [everyone, queryClean, queryDigits]);

  const displayedMaster = useMemo(() => {
    if (!queryClean && !queryDigits) return buckets.master || [];
    return (buckets.master || []).filter((p) => {
      if (!p || !p.name) return false;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      return p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits));
    });
  }, [buckets.master, queryClean, queryDigits]);

  const openAddPlayer = useCallback((seed: string) => {
    const q = (seed || '').trim();
    const digits = q.replace(/\D/g, '');
    setAddSeed(
      digits.length >= 6 ? { name: '', phone: q } : { name: q, phone: '' }
    );
    setAddModalOpen(true);
  }, []);

  const handleSwapBatBowl = () => {
    setCurrentBattingTeam((prev) => (prev === labelA ? labelB : labelA));
  };

  const handleSwapStrike = () => {
    const oldStriker = strikerName;
    setStrikerName(nonStrikerName);
    setNonStrikerName(oldStriker);
    if (onSwapStrike) onSwapStrike();
  };

  const handleSetStriker = (player: Player) => {
    setStrikerName(player.name);
    // Strictly clear non-striker if same player
    if (nonStrikerName.toLowerCase() === player.name.toLowerCase()) {
      setNonStrikerName('');
    }
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
    if (onSetStriker) onSetStriker(player);
  };

  const handleSetNonStriker = (player: Player) => {
    setNonStrikerName(player.name);
    // Strictly clear striker if same player
    if (strikerName.toLowerCase() === player.name.toLowerCase()) {
      setStrikerName('');
    }
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
    if (onSetNonStriker) onSetNonStriker(player);
  };

  const handleSetBowler = (player: Player) => {
    setBowlerName(player.name);
    if (onSetBowler) onSetBowler(player);
  };

  const handleRetireBowler = (player: Player) => {
    if (bowlerName.toLowerCase() === player.name.toLowerCase()) {
      setBowlerName('');
    }
    if (onRetireBowler) onRetireBowler(player);
  };

  const handleExecuteRetire = (player: Player, type: 'Retired Hurt' | 'Retired Out') => {
    setRetiredPlayers((prev) => [
      ...prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()),
      { name: player.name, type },
    ]);
    if (strikerName.toLowerCase() === player.name.toLowerCase()) {
      setStrikerName('');
    }
    if (nonStrikerName.toLowerCase() === player.name.toLowerCase()) {
      setNonStrikerName('');
    }
    if (onRetireBatsman) onRetireBatsman(player, type);
    setRetireConfirmPlayer(null);
    setSelectedActionPlayer(null);
  };

  const handleUnretire = (player: Player) => {
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
    if (!strikerName) {
      setStrikerName(player.name);
      if (onSetStriker) onSetStriker(player);
    } else if (!nonStrikerName && strikerName.toLowerCase() !== player.name.toLowerCase()) {
      setNonStrikerName(player.name);
      if (onSetNonStriker) onSetNonStriker(player);
    }
  };

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - GHOST_WIDTH / 2 },
      { translateY: dragY.value - GHOST_HEIGHT / 2 },
      { scale: ghostScale.value },
    ],
  }));

  const totalAssigned = (buckets.teamA || []).length + (buckets.teamB || []).length;

  const handleConfirm = () => {
    onConfirm(buckets.teamA, buckets.teamB, buckets.master, {
      strikerName,
      nonStrikerName,
      bowlerName,
      battingTeamName: currentBattingTeam,
      bowlingTeamName: currentBattingTeam === labelA ? labelB : labelA,
    });
  };

  const handleClose = () => {
    if (onClose) onClose();
    else onSkip();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: canvas }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.title, { color: textPrimary }]}>Manage Squads</ThemedText>
              <ThemedText style={[styles.subtitle, { color: textSecondary }]} numberOfLines={1}>
                Drag directly into slots or tap player for actions
              </ThemedText>
            </View>

            {/* Swap Sides Toggle */}
            <Pressable
              onPress={handleSwapBatBowl}
              hitSlop={6}
              style={[styles.swapBatBowlBtn, { backgroundColor: cardBg, borderColor }]}
            >
              <Ionicons name="swap-horizontal" size={13} color={theme.primary} />
              <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>
                Swap Sides
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleClose}
              hitSlop={8}
              accessibilityLabel="Close"
              style={[styles.closeBtn, { backgroundColor: cardBg, borderColor }]}
            >
              <Ionicons name="close" size={15} color={textPrimary} />
            </Pressable>
          </View>

          {/* Clean Legend Pill Overview */}
          <View style={styles.legend}>
            <LegendPill
              code={codeA}
              name={labelA}
              mascot={teamAMascot}
              cardBg={cardBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              roleBadge={isTeamABatting ? '🏏 Batting' : '🎯 Bowling'}
              theme={theme}
            />
            <LegendPill
              code={codeB}
              name={labelB}
              mascot={teamBMascot}
              cardBg={cardBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              roleBadge={!isTeamABatting ? '🏏 Batting' : '🎯 Bowling'}
              theme={theme}
            />
          </View>

          <ScrollView
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Available Pool Section ── */}
            <View
              ref={(node) => { dropZoneRefs.current.master = node; }}
              style={[
                styles.zoneCard,
                {
                  backgroundColor: cardBg,
                  borderColor: activeDropZone === 'master' ? theme.primary : borderColor,
                  borderWidth: activeDropZone === 'master' ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.zoneHeader}>
                <ThemedText style={[styles.zoneTitle, { color: textPrimary }]}>
                  Available Pool
                </ThemedText>
                <ThemedText style={[styles.zoneMeta, { color: textSecondary }]}>
                  {(buckets.master || []).length} unassigned
                </ThemedText>
              </View>

              {/* Clean Search Input */}
              <View style={[styles.searchBar, { backgroundColor: zoneBg, borderColor }]}>
                <Ionicons
                  name={queryLooksLikePhone ? 'call-outline' : 'search-outline'}
                  size={14}
                  color={textSecondary}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={(t) => {
                    setSearchQuery(t);
                    if (duplicateWarning) setDuplicateWarning(null);
                  }}
                  placeholder="Search player name or phone..."
                  placeholderTextColor={textMuted}
                  style={[
                    styles.searchInput,
                    { color: textPrimary },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
                  returnKeyType="search"
                />
                <Pressable
                  onPress={() => openAddPlayer(searchQuery)}
                  accessibilityLabel="Add player"
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="person-add" size={13} color="#ffffff" />
                </Pressable>
              </View>

              {/* Suggestions */}
              {matchPlayerResults.length > 0 && searchQuery.trim().length > 0 && (
                <View style={styles.suggestList}>
                  {matchPlayerResults.map(({ player: p, location, locationLabel }) => (
                    <Pressable
                      key={p.id}
                      onPress={() => setSelectedActionPlayer({ player: p, bucketId: location })}
                      style={[styles.suggestRow, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Image source={avatarSourceFor(p)} style={styles.avatarSmall} contentFit="cover" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <ThemedText style={[styles.suggestName, { color: textPrimary }]} numberOfLines={1}>
                          {p.name}
                        </ThemedText>
                        <ThemedText style={[styles.suggestMeta, { color: textSecondary }]} numberOfLines={1}>
                          {p.phone || 'No phone'} · {locationLabel}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}

              {savedPlayerResults.length > 0 && (
                <View style={styles.suggestList}>
                  {savedPlayerResults.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => commitPlayer({ name: s.name, phone: s.phone, avatarUrl: s.avatarUrl })}
                      style={[styles.suggestRow, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Image source={avatarSourceFor(s)} style={styles.avatarSmall} contentFit="cover" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <ThemedText style={[styles.suggestName, { color: textPrimary }]} numberOfLines={1}>
                          {s.name}
                        </ThemedText>
                        <ThemedText style={[styles.suggestMeta, { color: textSecondary }]} numberOfLines={1}>
                          {s.phone || 'Saved Player'} · Tap to Add
                        </ThemedText>
                      </View>
                      <Ionicons name="add-circle" size={16} color={theme.primary} />
                    </Pressable>
                  ))}
                </View>
              )}

              {directoryResults.length > 0 && (
                <View style={styles.suggestList}>
                  {directoryResults.map((s) => {
                    const conn = getFoFConnection(s.phone || '');
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => commitPlayer({ name: s.name, phone: s.phone, avatarUrl: s.avatar })}
                        style={[styles.suggestRow, { backgroundColor: zoneBg, borderColor }]}
                      >
                        {s.avatar && (s.avatar.startsWith('http') || s.avatar.startsWith('data:') || s.avatar.startsWith('file:') || s.avatar.startsWith('blob:')) ? (
                          <Image source={{ uri: s.avatar }} style={styles.avatarSmall} contentFit="cover" />
                        ) : (
                          <View style={[styles.avatarSmall, { backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }]}>
                            <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                              {getTwoLetterLogo(s.name)}
                            </ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText style={[styles.suggestName, { color: textPrimary }]} numberOfLines={1}>
                            {s.name}
                          </ThemedText>
                          <ThemedText style={[styles.suggestMeta, { color: textSecondary }]} numberOfLines={1}>
                            {s.phone} · {conn.degreeBadgeText}
                          </ThemedText>
                        </View>
                        <Ionicons name="add-circle" size={16} color={theme.primary} />
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {exactMatchInPool && (
                <View style={styles.warnRow}>
                  <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                  <ThemedText style={[styles.warnText, { color: theme.primary }]}>
                    {`${exactMatchInPool.name} is in match squad.`}
                  </ThemedText>
                </View>
              )}

              {searchQuery.trim().length >= 3 &&
                !exactMatchInPool &&
                matchPlayerResults.length === 0 &&
                savedPlayerResults.length === 0 &&
                directoryResults.length === 0 && (
                  <Pressable
                    onPress={() => openAddPlayer(searchQuery)}
                    style={[styles.notFound, { borderColor: theme.primary + '55' }]}
                  >
                    <Ionicons name="person-add" size={13} color={theme.primary} />
                    <ThemedText style={[styles.notFoundText, { color: theme.primary }]} numberOfLines={1}>
                      {queryLooksLikePhone
                        ? `Add player with ${searchQuery.trim()}`
                        : `Add “${searchQuery.trim()}” as new player`}
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={13} color={theme.primary} />
                  </Pressable>
                )}

              {/* Pool Chips */}
              <View style={styles.bubbleWrap}>
                {displayedMaster.map((player) => (
                  <CleanPlayerChip
                    key={player.id}
                    player={player}
                    bucketId="master"
                    cardBg={zoneBg}
                    borderColor={borderColor}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    theme={theme}
                    onTap={() => setSelectedActionPlayer({ player, bucketId: 'master' })}
                    onQuickAssignA={() => moveToBucket(player, 'master', 'teamA')}
                    onQuickAssignB={() => moveToBucket(player, 'master', 'teamB')}
                    codeA={codeA}
                    codeB={codeB}
                    dragX={dragX}
                    dragY={dragY}
                    onDragStart={handleDragStart}
                    onDragUpdate={handleDragUpdate}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingPlayer?.id === player.id}
                  />
                ))}
                {displayedMaster.length === 0 && !searchQuery.trim() && (
                  <ThemedText style={[styles.emptyLabel, { color: textMuted }]}>
                    No unassigned players. Add new players above.
                  </ThemedText>
                )}
              </View>
            </View>

            {/* ── Team A Zone ── */}
            <TeamZoneCard
              refNode={(node) => { dropZoneRefs.current.teamA = node; }}
              dropZoneRefs={dropZoneRefs}
              activeDropZone={activeDropZone}
              teamBucket="teamA"
              teamName={labelA}
              teamCode={codeA}
              teamMascot={teamAMascot}
              otherTeamCode={codeB}
              players={buckets.teamA}
              isBatting={isTeamABatting}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              batsmenStats={batsmenStats}
              bowlerStats={bowlerStats}
              retiredPlayers={retiredPlayers}
              cardBg={cardBg}
              zoneBg={zoneBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
              theme={theme}
              onSwapStrike={handleSwapStrike}
              onPlayerTap={(p) => setSelectedActionPlayer({ player: p, bucketId: 'teamA' })}
              onRemovePlayer={(p) => moveToBucket(p, 'teamA', 'master')}
              onTransferPlayer={(p) => moveToBucket(p, 'teamA', 'teamB')}
              onRetirePlayer={(p) => setRetireConfirmPlayer(p)}
              dragX={dragX}
              dragY={dragY}
              onDragStart={handleDragStart}
              onDragUpdate={handleDragUpdate}
              onDragEnd={handleDragEnd}
              draggingId={draggingPlayer?.id ?? null}
            />

            {/* ── Team B Zone ── */}
            <TeamZoneCard
              refNode={(node) => { dropZoneRefs.current.teamB = node; }}
              dropZoneRefs={dropZoneRefs}
              activeDropZone={activeDropZone}
              teamBucket="teamB"
              teamName={labelB}
              teamCode={codeB}
              teamMascot={teamBMascot}
              otherTeamCode={codeA}
              players={buckets.teamB}
              isBatting={!isTeamABatting}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              batsmenStats={batsmenStats}
              bowlerStats={bowlerStats}
              retiredPlayers={retiredPlayers}
              cardBg={cardBg}
              zoneBg={zoneBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
              theme={theme}
              onSwapStrike={handleSwapStrike}
              onPlayerTap={(p) => setSelectedActionPlayer({ player: p, bucketId: 'teamB' })}
              onRemovePlayer={(p) => moveToBucket(p, 'teamB', 'master')}
              onTransferPlayer={(p) => moveToBucket(p, 'teamB', 'teamA')}
              onRetirePlayer={(p) => setRetireConfirmPlayer(p)}
              dragX={dragX}
              dragY={dragY}
              onDragStart={handleDragStart}
              onDragUpdate={handleDragUpdate}
              onDragEnd={handleDragEnd}
              draggingId={draggingPlayer?.id ?? null}
            />
          </ScrollView>

          {/* Clean Footer Bar */}
          <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
            <Pressable onPress={onSkip} style={styles.skipBtn}>
              <ThemedText style={[styles.skipText, { color: textSecondary }]}>
                Skip
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.confirmText}>
                {totalAssigned > 0 ? `Apply Lineup (${totalAssigned})` : 'Continue'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Add Player Modal */}
          <AddPlayerModal
            visible={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            existing={everyone}
            creditReward={CREDIT_REWARD}
            initialName={addSeed.name}
            initialPhone={addSeed.phone}
            onAdd={commitPlayer}
          />

          {/* Clean Action Modal */}
          {selectedActionPlayer && (
            <PlayerActionModal
              visible={!!selectedActionPlayer}
              item={selectedActionPlayer}
              onClose={() => setSelectedActionPlayer(null)}
              theme={theme}
              cardBg={cardBg}
              zoneBg={zoneBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
              isTeamABatting={isTeamABatting}
              labelA={labelA}
              labelB={labelB}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              batsmenStats={batsmenStats}
              bowlerStats={bowlerStats}
              retiredPlayers={retiredPlayers}
              onSetStriker={handleSetStriker}
              onSetNonStriker={handleSetNonStriker}
              onSetBowler={handleSetBowler}
              onRetireBowler={handleRetireBowler}
              onSwapStrike={handleSwapStrike}
              onRetireClick={(p) => {
                setSelectedActionPlayer(null);
                setRetireConfirmPlayer(p);
              }}
              onUnretire={handleUnretire}
              onMoveToTeam={(p, from, to) => {
                moveToBucket(p, from, to);
                setSelectedActionPlayer(null);
              }}
              onRemoveFromTeam={(p, from) => {
                moveToBucket(p, from, 'master');
                setSelectedActionPlayer(null);
              }}
            />
          )}

          {/* Retire Batsman Modal */}
          {retireConfirmPlayer && (
            <RetireConfirmationModal
              visible={!!retireConfirmPlayer}
              player={retireConfirmPlayer}
              onClose={() => setRetireConfirmPlayer(null)}
              theme={theme}
              cardBg={cardBg}
              zoneBg={zoneBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              onConfirmRetire={(type) => handleExecuteRetire(retireConfirmPlayer, type)}
            />
          )}

          {/* Drag Ghost */}
          {draggingPlayer && (
            <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle, { backgroundColor: cardBg, borderColor }]}>
              <Image source={avatarSourceFor(draggingPlayer)} style={styles.avatarSmall} contentFit="cover" />
              <ThemedText style={[styles.chipName, { color: textPrimary }]} numberOfLines={1}>
                {draggingPlayer.name}
              </ThemedText>
            </Animated.View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ── Format Helper for Live Stats ────────────────────────────────────────────
function formatBatStats(stat?: BatsmanLiveStats): string | null {
  if (!stat || (stat.runs === 0 && stat.balls === 0)) return null;
  return `${stat.runs} (${stat.balls}b) · 4s:${stat.fours} 6s:${stat.sixes} · SR ${stat.sr}`;
}

function formatBowlStats(stat?: BowlerLiveStats): string | null {
  if (!stat || stat.overs === '0.0' || (!stat.overs && stat.runs === 0 && stat.wickets === 0)) return null;
  return `${stat.overs} ov · ${stat.wickets}/${stat.runs} · Econ ${stat.econ}`;
}

// ── Team Zone Card ──────────────────────────────────────────────────────────
function TeamZoneCard({
  refNode,
  dropZoneRefs,
  activeDropZone,
  teamBucket,
  teamName,
  teamCode,
  teamMascot,
  players,
  isBatting,
  strikerName,
  nonStrikerName,
  bowlerName,
  batsmenStats,
  bowlerStats,
  retiredPlayers,
  cardBg,
  zoneBg,
  borderColor,
  textPrimary,
  textSecondary,
  textMuted,
  theme,
  onSwapStrike,
  onPlayerTap,
  onRemovePlayer,
  onRetirePlayer,
  dragX,
  dragY,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  draggingId,
}: {
  refNode: (node: View | null) => void;
  dropZoneRefs: React.MutableRefObject<Record<DropTargetId, View | null>>;
  activeDropZone: DropTargetId | null;
  teamBucket: BucketId;
  teamName: string;
  teamCode: string;
  teamMascot?: string;
  otherTeamCode: string;
  players: Player[];
  isBatting: boolean;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  batsmenStats: Record<string, BatsmanLiveStats>;
  bowlerStats: Record<string, BowlerLiveStats>;
  retiredPlayers: { name: string; type: 'Retired Hurt' | 'Retired Out' }[];
  cardBg: string;
  zoneBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  theme: any;
  onSwapStrike: () => void;
  onPlayerTap: (p: Player) => void;
  onRemovePlayer: (p: Player) => void;
  onTransferPlayer: (p: Player) => void;
  onRetirePlayer: (p: Player) => void;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  onDragStart: (player: Player, from: BucketId) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: (player: Player, from: BucketId, x: number, y: number) => void;
  draggingId: string | null;
}) {
  const uniquePlayers = useMemo(() => strictDedupe(players), [players]);

  const strikerKey = (strikerName || '').trim().toLowerCase();
  const nonStrikerKey = (nonStrikerName || '').trim().toLowerCase();
  const bowlerKey = (bowlerName || '').trim().toLowerCase();

  const strikerStats = strikerKey ? batsmenStats[strikerKey] : undefined;
  const nonStrikerStats = nonStrikerKey ? batsmenStats[nonStrikerKey] : undefined;
  const activeBowlerStats = bowlerKey ? bowlerStats[bowlerKey] : undefined;

  const isZoneHovered = activeDropZone === teamBucket;
  const isStrikerHovered = activeDropZone === 'striker';
  const isNonStrikerHovered = activeDropZone === 'nonStriker';
  const isBowlerHovered = activeDropZone === 'bowler';

  return (
    <View
      ref={refNode}
      style={[
        styles.zoneCard,
        {
          backgroundColor: cardBg,
          borderColor: isZoneHovered ? theme.primary : borderColor,
          borderWidth: isZoneHovered ? 1.5 : 1,
        },
      ]}
    >
      {/* Zone Header with Logo */}
      <View style={styles.zoneHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
          <View style={[styles.teamZoneLogoBox, { backgroundColor: zoneBg, borderColor }]}>
            {teamMascot ? (
              <Image source={getMascotImage(teamMascot)} style={styles.teamZoneLogoImg} contentFit="contain" />
            ) : (
              <ThemedText style={[styles.teamZoneLogoText, { color: theme.primary }]}>
                {teamCode}
              </ThemedText>
            )}
          </View>
          <ThemedText style={[styles.zoneTitle, { color: textPrimary }]} numberOfLines={1}>
            {teamName}
          </ThemedText>
          <View style={[styles.roleTag, { backgroundColor: zoneBg, borderColor }]}>
            <ThemedText style={[styles.roleTagText, { color: textPrimary }]}>
              {isBatting ? '🏏 Batting' : '🎯 Bowling'}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.zoneMeta, { color: textSecondary }]}>
          {uniquePlayers.length} player{uniquePlayers.length === 1 ? '' : 's'}
        </ThemedText>
      </View>

      {/* Crease Active Slots (Direct Drag & Drop Targets - No B1/B2 abbreviation) */}
      <View style={[styles.creaseBar, { backgroundColor: zoneBg, borderColor }]}>
        {isBatting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Striker Slot Drop Target */}
            <View
              ref={(node) => { dropZoneRefs.current.striker = node; }}
              style={{ flex: 1 }}
            >
              <Pressable
                onPress={() => {
                  const p = uniquePlayers.find((pl) => pl.name.toLowerCase() === strikerKey);
                  if (p) onPlayerTap(p);
                }}
                style={[
                  styles.creaseSlot,
                  {
                    backgroundColor: cardBg,
                    borderColor: isStrikerHovered ? theme.primary : borderColor,
                    borderWidth: isStrikerHovered ? 1.5 : 1,
                  },
                ]}
              >
                <View style={styles.creaseSlotTopRow}>
                  <ThemedText style={[styles.creaseSlotTitle, { color: theme.primary }]}>
                    STRIKER
                  </ThemedText>
                  {strikerName ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        const p = uniquePlayers.find((pl) => pl.name.toLowerCase() === strikerKey);
                        if (p) onRetirePlayer(p);
                      }}
                      hitSlop={4}
                    >
                      <ThemedText style={styles.retireBtnText}>Retire</ThemedText>
                    </Pressable>
                  ) : null}
                </View>
                <ThemedText
                  style={[styles.creaseSlotName, { color: strikerName ? textPrimary : textMuted }]}
                  numberOfLines={1}
                >
                  {strikerName || 'Drop Striker'}
                </ThemedText>
                {formatBatStats(strikerStats) ? (
                  <ThemedText style={[styles.creaseStatsText, { color: textSecondary }]} numberOfLines={1}>
                    {formatBatStats(strikerStats)}
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.creaseStatsMuted, { color: textMuted }]} numberOfLines={1}>
                    {strikerName ? 'On Strike' : 'Drop player here'}
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {/* Swap Strike Button */}
            <Pressable
              onPress={onSwapStrike}
              hitSlop={6}
              style={[styles.creaseSwapBtn, { backgroundColor: cardBg, borderColor }]}
            >
              <Ionicons name="swap-horizontal" size={14} color={theme.primary} />
            </Pressable>

            {/* Non-Striker Slot Drop Target */}
            <View
              ref={(node) => { dropZoneRefs.current.nonStriker = node; }}
              style={{ flex: 1 }}
            >
              <Pressable
                onPress={() => {
                  const p = uniquePlayers.find((pl) => pl.name.toLowerCase() === nonStrikerKey);
                  if (p) onPlayerTap(p);
                }}
                style={[
                  styles.creaseSlot,
                  {
                    backgroundColor: cardBg,
                    borderColor: isNonStrikerHovered ? theme.primary : borderColor,
                    borderWidth: isNonStrikerHovered ? 1.5 : 1,
                  },
                ]}
              >
                <View style={styles.creaseSlotTopRow}>
                  <ThemedText style={[styles.creaseSlotTitle, { color: textSecondary }]}>
                    NON-STRIKER
                  </ThemedText>
                  {nonStrikerName ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        const p = uniquePlayers.find((pl) => pl.name.toLowerCase() === nonStrikerKey);
                        if (p) onRetirePlayer(p);
                      }}
                      hitSlop={4}
                    >
                      <ThemedText style={styles.retireBtnText}>Retire</ThemedText>
                    </Pressable>
                  ) : null}
                </View>
                <ThemedText
                  style={[styles.creaseSlotName, { color: nonStrikerName ? textPrimary : textMuted }]}
                  numberOfLines={1}
                >
                  {nonStrikerName || 'Drop Non-Striker'}
                </ThemedText>
                {formatBatStats(nonStrikerStats) ? (
                  <ThemedText style={[styles.creaseStatsText, { color: textSecondary }]} numberOfLines={1}>
                    {formatBatStats(nonStrikerStats)}
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.creaseStatsMuted, { color: textMuted }]} numberOfLines={1}>
                    {nonStrikerName ? 'Runner' : 'Drop player here'}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          /* Active Bowler Drop Target */
          <View ref={(node) => { dropZoneRefs.current.bowler = node; }}>
            <Pressable
              onPress={() => {
                const p = uniquePlayers.find((pl) => pl.name.toLowerCase() === bowlerKey);
                if (p) onPlayerTap(p);
              }}
              style={[
                styles.creaseSlot,
                {
                  backgroundColor: cardBg,
                  borderColor: isBowlerHovered ? theme.primary : borderColor,
                  borderWidth: isBowlerHovered ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.creaseSlotTopRow}>
                <ThemedText style={[styles.creaseSlotTitle, { color: theme.primary }]}>
                  ACTIVE BOWLER
                </ThemedText>
                {bowlerName ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      const p = uniquePlayers.find((pl) => pl.name.toLowerCase() === bowlerKey);
                      if (p) onPlayerTap(p);
                    }}
                    hitSlop={4}
                  >
                    <ThemedText style={[styles.changeBtnText, { color: textSecondary }]}>
                      Change
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <ThemedText
                style={[styles.creaseSlotName, { color: bowlerName ? textPrimary : textMuted }]}
                numberOfLines={1}
              >
                {bowlerName || 'Drop Bowler'}
              </ThemedText>
              {formatBowlStats(activeBowlerStats) ? (
                <ThemedText style={[styles.creaseStatsText, { color: textSecondary }]} numberOfLines={1}>
                  {formatBowlStats(activeBowlerStats)}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.creaseStatsMuted, { color: textMuted }]} numberOfLines={1}>
                  {bowlerName ? 'Current Bowler' : 'Drop player here'}
                </ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Squad Player Chips */}
      <View style={styles.bubbleWrap}>
        {uniquePlayers.map((player) => {
          const pKey = player.name.trim().toLowerCase();
          const isStriker = isBatting && strikerKey === pKey;
          const isNonStriker = isBatting && nonStrikerKey === pKey;
          const isBowler = !isBatting && bowlerKey === pKey;
          const retRec = retiredPlayers.find((r) => r.name.toLowerCase() === pKey);

          const bStat = isBatting ? batsmenStats[pKey] : undefined;
          const bowlStat = !isBatting ? bowlerStats[pKey] : undefined;

          let roleLabel: string | undefined;
          if (retRec) {
            roleLabel = retRec.type === 'Retired Hurt' ? 'Injured' : 'Retired';
          } else if (isStriker) {
            roleLabel = bStat && (bStat.runs > 0 || bStat.balls > 0) ? `Striker · ${bStat.runs}(${bStat.balls}b)` : 'Striker';
          } else if (isNonStriker) {
            roleLabel = bStat && (bStat.runs > 0 || bStat.balls > 0) ? `Non-Striker · ${bStat.runs}(${bStat.balls}b)` : 'Non-Striker';
          } else if (isBowler) {
            roleLabel = bowlStat && bowlStat.overs !== '0.0' ? `Bowler · ${bowlStat.wickets}/${bowlStat.runs}` : 'Bowler';
          } else if (bStat && (bStat.runs > 0 || bStat.balls > 0)) {
            roleLabel = `${bStat.runs}(${bStat.balls}b)`;
          } else if (bowlStat && bowlStat.overs !== '0.0') {
            roleLabel = `${bowlStat.wickets}/${bowlStat.runs} (${bowlStat.overs})`;
          }

          return (
            <CleanPlayerChip
              key={player.id}
              player={player}
              bucketId={teamBucket}
              cardBg={zoneBg}
              borderColor={borderColor}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              theme={theme}
              roleLabel={roleLabel}
              isRetired={!!retRec}
              isActiveRole={isStriker || isNonStriker || isBowler}
              onTap={() => onPlayerTap(player)}
              onRemove={() => onRemovePlayer(player)}
              dragX={dragX}
              dragY={dragY}
              onDragStart={onDragStart}
              onDragUpdate={onDragUpdate}
              onDragEnd={onDragEnd}
              isDragging={draggingId === player.id}
            />
          );
        })}
        {uniquePlayers.length === 0 && (
          <ThemedText style={[styles.emptyLabel, { color: textMuted }]}>
            No players assigned yet. Drag players here or add from pool.
          </ThemedText>
        )}
      </View>
    </View>
  );
}

// ── Clean Single Player Chip ────────────────────────────────────────────────
function CleanPlayerChip({
  player,
  bucketId,
  cardBg,
  borderColor,
  textPrimary,
  textSecondary,
  theme,
  roleLabel,
  isRetired,
  isActiveRole,
  onTap,
  onRemove,
  onQuickAssignA,
  onQuickAssignB,
  codeA,
  codeB,
  dragX,
  dragY,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  isDragging,
}: {
  player: Player;
  bucketId: BucketId;
  cardBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  theme: any;
  roleLabel?: string;
  isRetired?: boolean;
  isActiveRole?: boolean;
  onTap: () => void;
  onRemove?: () => void;
  onQuickAssignA?: () => void;
  onQuickAssignB?: () => void;
  codeA?: string;
  codeB?: string;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  onDragStart: (player: Player, from: BucketId) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: (player: Player, from: BucketId, x: number, y: number) => void;
  isDragging: boolean;
}) {
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(2)
        .onStart((e) => {
          dragX.value = e.absoluteX;
          dragY.value = e.absoluteY;
          runOnJS(onDragStart)(player, bucketId);
        })
        .onUpdate((e) => {
          dragX.value = e.absoluteX;
          dragY.value = e.absoluteY;
          runOnJS(onDragUpdate)(e.absoluteX, e.absoluteY);
        })
        .onEnd((e) => {
          runOnJS(onDragEnd)(player, bucketId, e.absoluteX, e.absoluteY);
        }),
    [player.id, bucketId]
  );

  const isMaster = bucketId === 'master';

  return (
    <GestureDetector gesture={pan}>
      <Pressable
        onPress={onTap}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: cardBg,
            borderColor: isActiveRole ? theme.primary : borderColor,
            borderWidth: isActiveRole ? 1.5 : 1,
            opacity: isDragging ? 0 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Image source={avatarSourceFor(player)} style={styles.avatarSmall} contentFit="cover" />
        <View style={{ flexShrink: 1 }}>
          <ThemedText style={[styles.chipName, { color: textPrimary }]} numberOfLines={1}>
            {player.name}
          </ThemedText>
          {roleLabel && (
            <ThemedText
              style={[
                styles.chipRoleSub,
                { color: isRetired ? '#EF4444' : isActiveRole ? theme.primary : textSecondary },
              ]}
              numberOfLines={1}
            >
              {roleLabel}
            </ThemedText>
          )}
        </View>

        {isMaster && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (onQuickAssignA) onQuickAssignA();
              }}
              hitSlop={4}
              style={[styles.quickAssignBtn, { borderColor }]}
            >
              <ThemedText style={[styles.quickAssignText, { color: theme.primary }]}>
                {codeA || 'A'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (onQuickAssignB) onQuickAssignB();
              }}
              hitSlop={4}
              style={[styles.quickAssignBtn, { borderColor }]}
            >
              <ThemedText style={[styles.quickAssignText, { color: textSecondary }]}>
                {codeB || 'B'}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {!isMaster && onRemove && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            hitSlop={6}
            style={styles.chipRemoveBtn}
          >
            <Ionicons name="close" size={12} color={textSecondary} />
          </Pressable>
        )}
      </Pressable>
    </GestureDetector>
  );
}

// ── Clean Legend Pill ───────────────────────────────────────────────────────
function LegendPill({
  code,
  name,
  mascot,
  cardBg,
  borderColor,
  textPrimary,
  roleBadge,
  theme,
}: {
  code: string;
  name: string;
  mascot?: string;
  cardBg: string;
  borderColor: string;
  textPrimary: string;
  roleBadge: string;
  theme: any;
}) {
  return (
    <View style={[styles.legendPill, { backgroundColor: cardBg, borderColor }]}>
      <View style={[styles.legendLogoBox, { backgroundColor: theme.primary + '14', borderColor }]}>
        {mascot ? (
          <Image source={getMascotImage(mascot)} style={styles.legendMascotImg} contentFit="contain" />
        ) : (
          <ThemedText style={[styles.legendCodeText, { color: theme.primary }]}>{code}</ThemedText>
        )}
      </View>
      <ThemedText style={[styles.legendName, { color: textPrimary }]} numberOfLines={1}>
        {name}
      </ThemedText>
      <View style={styles.legendBadge}>
        <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
          {roleBadge}
        </ThemedText>
      </View>
    </View>
  );
}

// ── Player Action Sheet Modal ───────────────────────────────────────────────
function PlayerActionModal({
  visible,
  item,
  onClose,
  theme,
  cardBg,
  zoneBg,
  borderColor,
  textPrimary,
  textSecondary,
  textMuted,
  isTeamABatting,
  labelA,
  labelB,
  strikerName,
  nonStrikerName,
  bowlerName,
  batsmenStats,
  bowlerStats,
  retiredPlayers,
  onSetStriker,
  onSetNonStriker,
  onSetBowler,
  onRetireBowler,
  onSwapStrike,
  onRetireClick,
  onUnretire,
  onMoveToTeam,
  onRemoveFromTeam,
}: {
  visible: boolean;
  item: { player: Player; bucketId: BucketId };
  onClose: () => void;
  theme: any;
  cardBg: string;
  zoneBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  isTeamABatting: boolean;
  labelA: string;
  labelB: string;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  batsmenStats: Record<string, BatsmanLiveStats>;
  bowlerStats: Record<string, BowlerLiveStats>;
  retiredPlayers: { name: string; type: 'Retired Hurt' | 'Retired Out' }[];
  onSetStriker: (p: Player) => void;
  onSetNonStriker: (p: Player) => void;
  onSetBowler: (p: Player) => void;
  onRetireBowler: (p: Player) => void;
  onSwapStrike: () => void;
  onRetireClick: (p: Player) => void;
  onUnretire: (p: Player) => void;
  onMoveToTeam: (p: Player, from: BucketId, to: BucketId) => void;
  onRemoveFromTeam: (p: Player, from: BucketId) => void;
}) {
  const { player, bucketId } = item;
  const conn = getFoFConnection(player.phone || '');
  const pKey = player.name.trim().toLowerCase();

  const isBattingTeam =
    (bucketId === 'teamA' && isTeamABatting) || (bucketId === 'teamB' && !isTeamABatting);
  const isBowlingTeam =
    (bucketId === 'teamA' && !isTeamABatting) || (bucketId === 'teamB' && isTeamABatting);

  const isStriker = (strikerName || '').toLowerCase() === pKey;
  const isNonStriker = (nonStrikerName || '').toLowerCase() === pKey;
  const isBowler = (bowlerName || '').toLowerCase() === pKey;
  const retRec = retiredPlayers.find((r) => r.name.toLowerCase() === pKey);

  const bStat = batsmenStats[pKey];
  const bowlStat = bowlerStats[pKey];

  const otherBucketId: BucketId = bucketId === 'teamA' ? 'teamB' : 'teamA';
  const otherTeamLabel = bucketId === 'teamA' ? labelB : labelA;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.actionSheet, { backgroundColor: cardBg, borderColor }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.actionSheetHeader, { borderBottomColor: borderColor }]}>
            <Image source={avatarSourceFor(player)} style={styles.actionSheetAvatar} contentFit="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText style={[styles.actionSheetName, { color: textPrimary }]} numberOfLines={1}>
                {player.name}
              </ThemedText>
              <ThemedText style={[styles.actionSheetSub, { color: textSecondary }]}>
                {player.phone || 'Match Player'}{' '}
                {conn.degreeBadgeText ? `· ${conn.degreeBadgeText}` : ''}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeBtn, { backgroundColor: zoneBg, borderColor }]}>
              <Ionicons name="close" size={14} color={textPrimary} />
            </Pressable>
          </View>

          {/* Unified Player Profile Overview (Career & Match) */}
          <View style={{ gap: 6, marginTop: Spacing.xs }}>
            {/* Career / Overall Player Profile */}
            <View style={[styles.actionSheetStatsBox, { backgroundColor: zoneBg, borderColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="person-circle-outline" size={14} color={theme.primary} />
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_700Bold', color: theme.primary, letterSpacing: 0.5 }}>
                    PLAYER PROFILE
                  </ThemedText>
                </View>
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: textSecondary }}>
                  {player.position || 'All-Rounder'} · {player.skillLevel || 'Intermediate'}
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 2 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: textSecondary }}>
                    H/S
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: textPrimary, marginTop: 1 }}>
                    {bStat?.highScore || 78}*
                  </ThemedText>
                </View>

                <View style={{ width: 1, height: 18, backgroundColor: borderColor }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: textSecondary }}>
                    Best Wkts
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: textPrimary, marginTop: 1 }}>
                    {bowlStat?.bestBowling || '3/14'}
                  </ThemedText>
                </View>

                <View style={{ width: 1, height: 18, backgroundColor: borderColor }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: textSecondary }}>
                    Econ
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: textPrimary, marginTop: 1 }}>
                    {bowlStat?.econ || '6.50'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Live Match Batting Stats (if active or has stats) */}
            {bStat && (bStat.runs > 0 || bStat.balls > 0) ? (
              <View style={[styles.actionSheetStatsBox, { backgroundColor: zoneBg, borderColor, borderLeftWidth: 3, borderLeftColor: theme.primary }]}>
                <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                  🏏 LIVE MATCH BATTING
                </ThemedText>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: textPrimary, marginTop: 2 }}>
                  {bStat.runs} runs ({bStat.balls}b) · 4s: {bStat.fours} · 6s: {bStat.sixes} · SR {bStat.sr}
                </ThemedText>
              </View>
            ) : null}

            {/* Live Match Bowling Stats (if active or has stats) */}
            {bowlStat && (bowlStat.overs !== '0.0' && bowlStat.overs !== '' || bowlStat.runs > 0 || bowlStat.wickets > 0) ? (
              <View style={[styles.actionSheetStatsBox, { backgroundColor: zoneBg, borderColor, borderLeftWidth: 3, borderLeftColor: '#F59E0B' }]}>
                <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_700Bold', color: '#F59E0B' }}>
                  🎯 LIVE MATCH BOWLING
                </ThemedText>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: textPrimary, marginTop: 2 }}>
                  {bowlStat.overs} ov · {bowlStat.maidens}M · {bowlStat.runs}R · {bowlStat.wickets}W · Econ {bowlStat.econ}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actionSheetList}>
            {isBattingTeam && (
              <>
                {retRec && (
                  <Pressable
                    onPress={() => {
                      onUnretire(player);
                      onClose();
                    }}
                    style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor: theme.primary }]}
                  >
                    <Ionicons name="refresh" size={15} color={theme.primary} />
                    <ThemedText style={[styles.sheetActionText, { color: theme.primary }]}>
                      Resume Batting (Unretire)
                    </ThemedText>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    onSetStriker(player);
                    onClose();
                  }}
                  style={[styles.sheetActionItem, { backgroundColor: isStriker ? theme.primary + '12' : zoneBg, borderColor }]}
                >
                  <Ionicons name="flash-outline" size={15} color={theme.primary} />
                  <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                    {isStriker ? 'Currently on Strike (Striker)' : 'Set as Striker'}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    onSetNonStriker(player);
                    onClose();
                  }}
                  style={[styles.sheetActionItem, { backgroundColor: isNonStriker ? theme.primary + '12' : zoneBg, borderColor }]}
                >
                  <Ionicons name="walk-outline" size={15} color={theme.primary} />
                  <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                    {isNonStriker ? 'Currently Non-Striker (Runner)' : 'Set as Non-Striker'}
                  </ThemedText>
                </Pressable>

                {(isStriker || isNonStriker) && (
                  <Pressable
                    onPress={() => {
                      onSwapStrike();
                      onClose();
                    }}
                    style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                  >
                    <Ionicons name="swap-horizontal" size={15} color={theme.primary} />
                    <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                      Swap Strike Ends
                    </ThemedText>
                  </Pressable>
                )}

                {(isStriker || isNonStriker) && !retRec && (
                  <Pressable
                    onPress={() => onRetireClick(player)}
                    style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                  >
                    <Ionicons name="hand-left-outline" size={15} color="#EF4444" />
                    <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                      Retire Batsman
                    </ThemedText>
                  </Pressable>
                )}
              </>
            )}

            {isBowlingTeam && (
              <>
                <Pressable
                  onPress={() => {
                    onSetBowler(player);
                    onClose();
                  }}
                  style={[styles.sheetActionItem, { backgroundColor: isBowler ? theme.primary + '12' : zoneBg, borderColor }]}
                >
                  <Ionicons name="baseball-outline" size={15} color={theme.primary} />
                  <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                    {isBowler ? 'Active Current Bowler' : 'Set as Current Bowler'}
                  </ThemedText>
                </Pressable>

                {isBowler && (
                  <Pressable
                    onPress={() => {
                      onRetireBowler(player);
                      onClose();
                    }}
                    style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                  >
                    <Ionicons name="hand-left-outline" size={15} color="#EF4444" />
                    <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                      Change / Step Down from Bowling
                    </ThemedText>
                  </Pressable>
                )}
              </>
            )}

            {bucketId === 'master' && (
              <>
                <Pressable
                  onPress={() => onMoveToTeam(player, 'master', 'teamA')}
                  style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                >
                  <Ionicons name="arrow-forward" size={15} color={theme.primary} />
                  <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                    Assign to {labelA}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => onMoveToTeam(player, 'master', 'teamB')}
                  style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                >
                  <Ionicons name="arrow-forward" size={15} color={textPrimary} />
                  <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                    Assign to {labelB}
                  </ThemedText>
                </Pressable>
              </>
            )}

            {bucketId !== 'master' && (
              <Pressable
                onPress={() => onMoveToTeam(player, bucketId, otherBucketId)}
                style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
              >
                <Ionicons name="swap-horizontal" size={15} color={theme.primary} />
                <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                  Transfer to {otherTeamLabel}
                </ThemedText>
              </Pressable>
            )}

            {bucketId !== 'master' && (
              <Pressable
                onPress={() => onRemoveFromTeam(player, bucketId)}
                style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                  Remove from Squad
                </ThemedText>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Retire Batsman Confirmation Modal ───────────────────────────────────────
function RetireConfirmationModal({
  visible,
  player,
  onClose,
  theme,
  cardBg,
  zoneBg,
  borderColor,
  textPrimary,
  textSecondary,
  onConfirmRetire,
}: {
  visible: boolean;
  player: Player;
  onClose: () => void;
  theme: any;
  cardBg: string;
  zoneBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  onConfirmRetire: (type: 'Retired Hurt' | 'Retired Out') => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.retireModal, { backgroundColor: cardBg, borderColor }]} onPress={(e) => e.stopPropagation()}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.retireIconCircle, { backgroundColor: zoneBg, borderColor }]}>
              <Ionicons name="hand-left-outline" size={20} color={theme.primary} />
            </View>
            <ThemedText style={[styles.retireTitle, { color: textPrimary }]}>
              Retire {player.name}
            </ThemedText>
            <ThemedText style={[styles.retireSub, { color: textSecondary }]}>
              Select retirement status for this batsman:
            </ThemedText>
          </View>

          <Pressable
            onPress={() => onConfirmRetire('Retired Hurt')}
            style={({ pressed }) => [
              styles.retireOptionCard,
              { backgroundColor: zoneBg, borderColor, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="medkit-outline" size={17} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: textPrimary }}>
                  Retired Hurt (Injured)
                </ThemedText>
                <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_400Regular', color: textSecondary, marginTop: 1 }}>
                  Eligible to return and bat again later.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={14} color={textSecondary} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => onConfirmRetire('Retired Out')}
            style={({ pressed }) => [
              styles.retireOptionCard,
              { backgroundColor: zoneBg, borderColor, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="exit-outline" size={17} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: '#EF4444' }}>
                  Retired Out (Dismissed)
                </ThemedText>
                <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_400Regular', color: textSecondary, marginTop: 1 }}>
                  Dismissed for this innings.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={14} color={textSecondary} />
            </View>
          </Pressable>

          <Pressable onPress={onClose} style={[styles.retireCancelBtn, { borderColor }]}>
            <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_600SemiBold', color: textSecondary }}>
              Cancel
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  title: { fontFamily: 'Sora_600SemiBold', fontSize: 14.5, letterSpacing: -0.2 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  swapBatBowlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // ── Legend ─────────────────────────────────────────────────────────────
  legend: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  legendPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingLeft: 3,
    paddingRight: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  legendLogoBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  legendMascotImg: { width: 18, height: 18 },
  legendCodeText: { fontFamily: 'Sora_700Bold', fontSize: 9 },
  legendName: { fontFamily: 'Sora_600SemiBold', fontSize: 10.5, flexShrink: 1 },
  legendBadge: { marginLeft: 'auto' },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.lg },

  // ── Zone Cards ─────────────────────────────────────────────────────────
  zoneCard: {
    borderRadius: 14,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  teamZoneLogoBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  teamZoneLogoImg: { width: 20, height: 20 },
  teamZoneLogoText: { fontFamily: 'Sora_700Bold', fontSize: 9.5 },
  zoneTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  zoneMeta: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTagText: { fontFamily: 'Sora_600SemiBold', fontSize: 9 },

  // ── Crease Active Bar ──────────────────────────────────────────────────
  creaseBar: {
    borderRadius: 10,
    padding: 6,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  creaseSlot: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 56,
    justifyContent: 'center',
  },
  creaseSlotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creaseSlotTitle: { fontFamily: 'Sora_700Bold', fontSize: 8.5, letterSpacing: 0.2 },
  creaseSlotName: { fontFamily: 'Sora_600SemiBold', fontSize: 11, marginTop: 1.5 },
  creaseStatsText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, marginTop: 1.5 },
  creaseStatsMuted: { fontFamily: 'Sora_400Regular', fontSize: 8.5, marginTop: 1.5 },
  retireBtnText: { fontSize: 8.5, fontFamily: 'Sora_600SemiBold', color: '#EF4444' },
  changeBtnText: { fontSize: 8.5, fontFamily: 'Sora_600SemiBold' },
  creaseSwapBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Chips ──────────────────────────────────────────────────────────────
  bubbleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 8,
    gap: 6,
    borderWidth: 1,
  },
  avatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#00000010' },
  chipName: { fontFamily: 'Sora_500Medium', fontSize: 11, letterSpacing: -0.1 },
  chipRoleSub: { fontFamily: 'Sora_600SemiBold', fontSize: 8 },
  chipRemoveBtn: { padding: 2, marginLeft: 2 },
  quickAssignBtn: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickAssignText: { fontFamily: 'Sora_700Bold', fontSize: 8 },
  emptyLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
  },

  // ── Search Bar ─────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingLeft: 10,
    paddingRight: 3,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: { flex: 1, minWidth: 0, height: 28, fontFamily: 'Sora_500Medium', fontSize: 11 },
  addBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, paddingHorizontal: 4 },
  warnText: { fontFamily: 'Sora_600SemiBold', fontSize: 10, flexShrink: 1 },

  // ── Suggest Results ────────────────────────────────────────────────────
  suggestList: { marginBottom: Spacing.sm, gap: 4 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  suggestName: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },
  suggestMeta: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 1 },

  notFound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  notFoundText: { fontFamily: 'Sora_500Medium', fontSize: 10.5, flex: 1 },

  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 8 },
  skipText: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  confirmBtn: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontFamily: 'Sora_700Bold', fontSize: 12, color: '#ffffff' },

  ghost: {
    position: 'absolute',
    width: GHOST_WIDTH,
    height: GHOST_HEIGHT,
    borderRadius: 9999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    ...Shadows.level2,
  },

  // ── Action Sheet Modal ─────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  actionSheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    ...Shadows.level3,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  actionSheetAvatar: { width: 34, height: 34, borderRadius: 17 },
  actionSheetName: { fontFamily: 'Sora_700Bold', fontSize: 13 },
  actionSheetSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  actionSheetStatsBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: Spacing.xs,
  },
  actionSheetList: { marginTop: Spacing.sm, gap: 5 },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  sheetActionText: { fontFamily: 'Sora_600SemiBold', fontSize: 11.5 },

  // ── Retire Modal ───────────────────────────────────────────────────────
  retireModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    ...Shadows.level3,
  },
  retireIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  retireTitle: { fontFamily: 'Sora_700Bold', fontSize: 13.5, textAlign: 'center' },
  retireSub: { fontFamily: 'Sora_400Regular', fontSize: 10, textAlign: 'center', marginTop: 2 },
  retireOptionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 9,
    marginBottom: 6,
  },
  retireCancelBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
