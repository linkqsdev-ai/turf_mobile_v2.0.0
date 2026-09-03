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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  dedupePlayers,
  generatePlayerId,
  getTwoLetterLogo,
  isUsablePhone,
  normalizePhone,
  playerIdentity,
  type Player,
} from '@/store/match-store';
import { useMatchStore, useWalletStore } from '@/store/app-store';
import { AddPlayerModal } from '@/components/scoring/squad-modals';
import { registerFoFPlayer, searchFoFDirectory, getFoFConnection, loadFoFDatabase } from '@/services/fof-network';

/** Wallet credits paid the first time a player is added with a mobile number. */
const CREDIT_REWARD = 5;

type BucketId = 'master' | 'teamA' | 'teamB';

type Buckets = Record<BucketId, Player[]>;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One tap-target rendered on the right of a bubble (assign / move / remove). */
interface BubbleAction {
  key: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color: string;
  hint: string;
  onPress: () => void;
}

const GHOST_WIDTH = 160;
const GHOST_HEIGHT = 40;

function usePalette() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    theme,
    canvas: isDark ? theme.background : theme.surfaceLow,
    zone: isDark ? theme.surfaceLowest : theme.surfaceLowest,
    bubble: isDark ? theme.surfaceLow : '#FFFFFF',
    bubbleText: isDark ? theme.text : '#1D1B1A',
  };
}

/** "Siva Team" -> "ST", "Strikers" -> "ST" — the code shown on assign buttons. */
const shortCode = (name: string, fallback: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Players can have custom uploaded photos or fallback to preset portraits.
 */
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
  battingTeamName?: string;
  bowlingTeamName?: string;
  activeStrikerName?: string;
  activeNonStrikerName?: string;
  activeBowlerName?: string;
  dismissedPlayers?: { name: string; status: string; dismissalType?: string }[];
  /** Combined pool of players available to draft (e.g. matched saved-team rosters). */
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
  battingTeamName: propBattingTeam,
  bowlingTeamName: propBowlingTeam,
  activeStrikerName = '',
  activeNonStrikerName = '',
  activeBowlerName = '',
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
  const { theme, canvas, zone, bubble, bubbleText } = usePalette();

  const labelA = teamAName.trim() || 'Team A';
  const labelB = teamBName.trim() || 'Team B';
  const codeA = shortCode(labelA, 'TA');
  const codeB = shortCode(labelB, 'TB');

  const [buckets, setBuckets] = useState<Buckets>({
    master: initialPool,
    teamA: initialTeamA,
    teamB: initialTeamB,
  });

  // Batting / Bowling side tracking
  const [currentBattingTeam, setCurrentBattingTeam] = useState<string>(propBattingTeam || labelA);
  const isTeamABatting = currentBattingTeam.trim().toLowerCase() === labelA.trim().toLowerCase();

  // On-pitch active players
  const [strikerName, setStrikerName] = useState<string>(activeStrikerName);
  const [nonStrikerName, setNonStrikerName] = useState<string>(activeNonStrikerName);
  const [bowlerName, setBowlerName] = useState<string>(activeBowlerName);

  // Retired batsmen tracking
  const [retiredPlayers, setRetiredPlayers] = useState<{ name: string; type: 'Retired Hurt' | 'Retired Out' }[]>([]);

  // Action Menu Sheet for a clicked player
  const [selectedActionPlayer, setSelectedActionPlayer] = useState<{ player: Player; bucketId: BucketId } | null>(null);

  // Retire dialog state
  const [retireConfirmPlayer, setRetireConfirmPlayer] = useState<Player | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSeed, setAddSeed] = useState<{ name: string; phone: string }>({ name: '', phone: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingPlayer, setDraggingPlayer] = useState<Player | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [creditToast, setCreditToast] = useState<string | null>(null);
  const creditedPhones = useRef<Set<string>>(new Set());

  // Re-seed whenever the modal opens
  useEffect(() => {
    if (visible) {
      loadFoFDatabase().catch(() => {});
      const teamA = dedupePlayers(initialTeamA);
      const teamB = dedupePlayers(initialTeamB).filter(
        (p) => !teamA.some((a) => playerIdentity(a) === playerIdentity(p))
      );
      const assigned = new Set([...teamA, ...teamB].map(playerIdentity));
      setBuckets({
        master: dedupePlayers(initialPool).filter((p) => !assigned.has(playerIdentity(p))),
        teamA,
        teamB,
      });

      setCurrentBattingTeam(propBattingTeam || labelA);
      setStrikerName(activeStrikerName);
      setNonStrikerName(activeNonStrikerName);
      setBowlerName(activeBowlerName);

      // Extract retired players
      const initRetired: { name: string; type: 'Retired Hurt' | 'Retired Out' }[] = [];
      dismissedPlayers.forEach((d) => {
        if (d.status === 'Retired Hurt' || d.dismissalType === 'retired_hurt') {
          initRetired.push({ name: d.name, type: 'Retired Hurt' });
        } else if (d.status === 'Retired Out' || d.dismissalType === 'retired_out' || d.status === 'Retired') {
          initRetired.push({ name: d.name, type: 'Retired Out' });
        }
      });
      setRetiredPlayers(initRetired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, propBattingTeam, activeStrikerName, activeNonStrikerName, activeBowlerName]);

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const ghostScale = useSharedValue(0.94);

  const bucketRefs = useRef<Record<BucketId, View | null>>({ master: null, teamA: null, teamB: null });
  const bucketRects = useRef<Partial<Record<BucketId, Rect>>>({});

  const measureBuckets = useCallback(() => {
    (Object.keys(bucketRefs.current) as BucketId[]).forEach((id) => {
      const node = bucketRefs.current[id];
      node?.measureInWindow((x, y, width, height) => {
        bucketRects.current[id] = { x, y, width, height };
      });
    });
  }, []);

  const resolveDropTarget = useCallback((x: number, y: number): BucketId | null => {
    const entries = Object.entries(bucketRects.current) as [BucketId, Rect][];
    for (const [id, rect] of entries) {
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return id;
      }
    }
    return null;
  }, []);

  const moveToBucket = useCallback((player: Player, from: BucketId, to: BucketId) => {
    if (from === to) return;
    setBuckets((prev) => ({
      ...prev,
      [from]: prev[from].filter((p) => p.id !== player.id),
      [to]: [...prev[to], player],
    }));

    // If active player is moved or unassigned, update role slots
    if (player.name === strikerName) setStrikerName('');
    if (player.name === nonStrikerName) setNonStrikerName('');
    if (player.name === bowlerName) setBowlerName('');
  }, [strikerName, nonStrikerName, bowlerName]);

  const handleDragStart = useCallback((player: Player, _from: BucketId) => {
    measureBuckets();
    setDraggingPlayer(player);
    setScrollEnabled(false);
    ghostScale.value = withTiming(1, { duration: 120 });
  }, [measureBuckets, ghostScale]);

  const handleDragEnd = useCallback((player: Player, from: BucketId, x: number, y: number) => {
    const target = resolveDropTarget(x, y);
    if (target) moveToBucket(player, from, target);
    setDraggingPlayer(null);
    setScrollEnabled(true);
  }, [resolveDropTarget, moveToBucket]);

  const { teams: savedTeams } = useMatchStore();
  const { addWalletFunds } = useWalletStore();

  const everyone = useMemo(
    () => [...buckets.master, ...buckets.teamA, ...buckets.teamB],
    [buckets]
  );

  const isAlreadyIn = useCallback(
    (candidate: { name: string; phone?: string | null }) =>
      everyone.some((p) => playerIdentity(p) === playerIdentity({ name: candidate.name, phone: candidate.phone ?? undefined })),
    [everyone]
  );

  const commitPlayer = useCallback(
    (fields: { name: string; phone?: string | null; avatarUrl?: string }) => {
      const trimmed = fields.name.trim();
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
        master: [player, ...prev.master],
      }));

      // Register with FoF
      registerFoFPlayer({
        name: player.name,
        phone: player.phone,
        avatar: player.avatarUrl,
        sport: 'Cricket 🏏',
      });

      setSearchQuery('');
      setDuplicateWarning(null);

      // Award bonus if phone provided
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

  const queryClean = searchQuery.trim().toLowerCase();
  const queryDigits = searchQuery.replace(/\D/g, '');
  const queryLooksLikePhone = queryDigits.length >= 6;

  /** Current match players matching search query */
  const matchPlayerResults = useMemo(() => {
    if (queryClean.length < 2 && queryDigits.length < 3) return [];
    const results: { player: Player; location: BucketId; locationLabel: string }[] = [];

    buckets.master.forEach((p) => {
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        results.push({ player: p, location: 'master', locationLabel: 'Available Pool' });
      }
    });
    buckets.teamA.forEach((p) => {
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        results.push({ player: p, location: 'teamA', locationLabel: labelA });
      }
    });
    buckets.teamB.forEach((p) => {
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        results.push({ player: p, location: 'teamB', locationLabel: labelB });
      }
    });
    return results;
  }, [buckets, queryClean, queryDigits, labelA, labelB]);

  /** Saved Team Players matching query */
  const savedPlayerResults = useMemo(() => {
    if (queryClean.length < 2 && queryDigits.length < 3) return [];
    const allSavedPlayers: Player[] = [];
    savedTeams.forEach((t) => {
      t.players.forEach((p) => allSavedPlayers.push(p));
    });
    return dedupePlayers(allSavedPlayers)
      .filter((p) => !isAlreadyIn(p))
      .filter((p) => {
        const pDigits = p.phone ? normalizePhone(p.phone) : '';
        return p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits));
      })
      .slice(0, 4);
  }, [savedTeams, queryClean, queryDigits, isAlreadyIn]);

  /** FoF Directory search results */
  const directoryResults = useMemo(() => {
    if (queryClean.length < 2 && queryDigits.length < 3) return [];
    const savedIds = new Set(savedPlayerResults.map((p) => playerIdentity(p)));
    return searchFoFDirectory(searchQuery)
      .filter((p) => !isAlreadyIn({ name: p.name, phone: p.phone }))
      .filter((p) => !savedIds.has(playerIdentity({ name: p.name, phone: p.phone })))
      .slice(0, 6);
  }, [searchQuery, queryClean, queryDigits, isAlreadyIn, savedPlayerResults]);

  const exactMatchInPool = useMemo(() => {
    if (!queryClean && !queryDigits) return null;
    return everyone.find((p) => {
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (queryDigits.length >= 10 && pDigits === queryDigits) return true;
      if (queryClean.length >= 2 && p.name.toLowerCase() === queryClean) return true;
      return false;
    });
  }, [everyone, queryClean, queryDigits]);

  const displayedMaster = useMemo(() => {
    if (!queryClean && !queryDigits) return buckets.master;
    return buckets.master.filter((p) => {
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      return p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits));
    });
  }, [buckets.master, queryClean, queryDigits]);

  const openAddPlayer = useCallback((seed: string) => {
    const q = seed.trim();
    const digits = q.replace(/\D/g, '');
    setAddSeed(
      digits.length >= 6 ? { name: '', phone: q } : { name: q, phone: '' }
    );
    setAddModalOpen(true);
  }, []);

  // Team swap toggle
  const handleSwapBatBowl = () => {
    setCurrentBattingTeam((prev) => (prev === labelA ? labelB : labelA));
  };

  // Crease strike swap
  const handleSwapStrike = () => {
    setStrikerName((prev) => {
      const oldStriker = prev;
      setNonStrikerName(oldStriker);
      return nonStrikerName;
    });
    if (onSwapStrike) onSwapStrike();
  };

  // Set Striker
  const handleSetStriker = (player: Player) => {
    setStrikerName(player.name);
    if (nonStrikerName.toLowerCase() === player.name.toLowerCase()) {
      setNonStrikerName('');
    }
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
    if (onSetStriker) onSetStriker(player);
  };

  // Set Non-Striker
  const handleSetNonStriker = (player: Player) => {
    setNonStrikerName(player.name);
    if (strikerName.toLowerCase() === player.name.toLowerCase()) {
      setStrikerName('');
    }
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
    if (onSetNonStriker) onSetNonStriker(player);
  };

  // Set Bowler
  const handleSetBowler = (player: Player) => {
    setBowlerName(player.name);
    if (onSetBowler) onSetBowler(player);
  };

  // Retire Bowler
  const handleRetireBowler = (player: Player) => {
    if (bowlerName.toLowerCase() === player.name.toLowerCase()) {
      setBowlerName('');
    }
    if (onRetireBowler) onRetireBowler(player);
  };

  // Retire Batsman Execution
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

  // Unretire / Resume Batting
  const handleUnretire = (player: Player) => {
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== player.name.toLowerCase()));
    if (!strikerName) {
      setStrikerName(player.name);
    } else if (!nonStrikerName) {
      setNonStrikerName(player.name);
    }
  };

  const accentA = '#4F46E5';
  const accentB = '#EA580C';

  /** Action pills displayed on each bubble */
  const actionsFor = useCallback(
    (player: Player, from: BucketId): BubbleAction[] => {
      const isPlayerInBattingTeam =
        (from === 'teamA' && isTeamABatting) || (from === 'teamB' && !isTeamABatting);
      const isPlayerInBowlingTeam =
        (from === 'teamA' && !isTeamABatting) || (from === 'teamB' && isTeamABatting);

      const isStriker = strikerName.trim().toLowerCase() === player.name.trim().toLowerCase();
      const isNonStriker = nonStrikerName.trim().toLowerCase() === player.name.trim().toLowerCase();
      const isBowler = bowlerName.trim().toLowerCase() === player.name.trim().toLowerCase();
      const retiredInfo = retiredPlayers.find((r) => r.name.toLowerCase() === player.name.toLowerCase());

      const toA: BubbleAction = {
        key: 'a',
        label: codeA,
        color: accentA,
        hint: `Move ${player.name} to ${labelA}`,
        onPress: () => moveToBucket(player, from, 'teamA'),
      };
      const toB: BubbleAction = {
        key: 'b',
        label: codeB,
        color: accentB,
        hint: `Move ${player.name} to ${labelB}`,
        onPress: () => moveToBucket(player, from, 'teamB'),
      };
      const remove: BubbleAction = {
        key: 'x',
        icon: 'close',
        color: theme.textSecondary,
        hint: `Remove ${player.name} from squad`,
        onPress: () => moveToBucket(player, from, 'master'),
      };

      if (from === 'master') return [toA, toB];

      const actions: BubbleAction[] = [];

      // Batting team specific actions
      if (isPlayerInBattingTeam) {
        if (retiredInfo) {
          if (retiredInfo.type === 'Retired Hurt') {
            actions.push({
              key: 'resume',
              icon: 'refresh',
              color: '#10B981',
              hint: `Resume Batting (${player.name})`,
              onPress: () => handleUnretire(player),
            });
          }
        } else if (isStriker) {
          actions.push({
            key: 'swap-strike',
            icon: 'swap-horizontal',
            color: '#10B981',
            hint: 'Swap Strike',
            onPress: handleSwapStrike,
          });
          actions.push({
            key: 'retire',
            icon: 'hand-left-outline',
            color: '#EF4444',
            hint: `Retire ${player.name}`,
            onPress: () => setRetireConfirmPlayer(player),
          });
        } else if (isNonStriker) {
          actions.push({
            key: 'make-striker',
            icon: 'flash',
            color: '#F59E0B',
            hint: `Make Striker (${player.name})`,
            onPress: () => handleSetStriker(player),
          });
          actions.push({
            key: 'retire',
            icon: 'hand-left-outline',
            color: '#EF4444',
            hint: `Retire ${player.name}`,
            onPress: () => setRetireConfirmPlayer(player),
          });
        } else {
          // Bench batsman
          actions.push({
            key: 'b1',
            label: 'B1',
            color: '#10B981',
            hint: `Set as Striker (${player.name})`,
            onPress: () => handleSetStriker(player),
          });
          actions.push({
            key: 'b2',
            label: 'B2',
            color: '#3B82F6',
            hint: `Set as Non-Striker (${player.name})`,
            onPress: () => handleSetNonStriker(player),
          });
        }
      }

      // Bowling team specific actions
      if (isPlayerInBowlingTeam) {
        if (isBowler) {
          actions.push({
            key: 'retire-bowler',
            icon: 'hand-left-outline',
            color: '#EF4444',
            hint: `Retire / Change Bowler (${player.name})`,
            onPress: () => handleRetireBowler(player),
          });
        } else {
          actions.push({
            key: 'set-bowler',
            icon: 'baseball-outline',
            color: '#8B5CF6',
            hint: `Set as Current Bowler (${player.name})`,
            onPress: () => handleSetBowler(player),
          });
        }
      }

      // Swap team action (to other team)
      if (from === 'teamA') actions.push(toB);
      if (from === 'teamB') actions.push(toA);

      // Remove from team action
      actions.push(remove);

      return actions;
    },
    [
      isTeamABatting,
      strikerName,
      nonStrikerName,
      bowlerName,
      retiredPlayers,
      codeA,
      codeB,
      accentA,
      accentB,
      labelA,
      labelB,
      theme.textSecondary,
      moveToBucket,
    ]
  );

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - GHOST_WIDTH / 2 },
      { translateY: dragY.value - GHOST_HEIGHT / 2 },
      { scale: ghostScale.value },
    ],
  }));

  const totalAssigned = buckets.teamA.length + buckets.teamB.length;

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

  const zoneCommon = {
    draggingId: draggingPlayer?.id ?? null,
    dragX,
    dragY,
    registerRef: (id: BucketId, node: View | null) => {
      bucketRefs.current[id] = node;
    },
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onPlayerTap: (player: Player, bucketId: BucketId) => {
      setSelectedActionPlayer({ player, bucketId });
    },
    actionsFor,
    bubble,
    bubbleText,
    textSecondary: theme.textSecondary,
    strikerName,
    nonStrikerName,
    bowlerName,
    retiredPlayers,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: canvas }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.title, { color: bubbleText }]}>Manage Match Squads</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                Swap teams · Assign batting / bowling · Retire batsmen
              </ThemedText>
            </View>

            {/* Quick Swap Batting / Bowling Sides */}
            <Pressable
              onPress={handleSwapBatBowl}
              hitSlop={6}
              style={[styles.swapBatBowlBtn, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]}
            >
              <Ionicons name="swap-horizontal" size={13} color={theme.primary} />
              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>
                Swap Sides
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleClose}
              hitSlop={8}
              accessibilityLabel="Close"
              style={[styles.closeBtn, { backgroundColor: bubble }]}
            >
              <Ionicons name="close" size={15} color={bubbleText} />
            </Pressable>
          </View>

          {/* Legend / Status Badges */}
          <View style={styles.legend}>
            <LegendPill
              code={codeA}
              name={labelA}
              color={accentA}
              bubble={bubble}
              text={bubbleText}
              roleBadge={isTeamABatting ? '🏏 Batting' : '🎯 Bowling'}
              roleColor={isTeamABatting ? '#10B981' : '#8B5CF6'}
            />
            <LegendPill
              code={codeB}
              name={labelB}
              color={accentB}
              bubble={bubble}
              text={bubbleText}
              roleBadge={!isTeamABatting ? '🏏 Batting' : '🎯 Bowling'}
              roleColor={!isTeamABatting ? '#10B981' : '#8B5CF6'}
            />
          </View>

          <ScrollView
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Available Players Pool ── */}
            <PlayerZone
              {...zoneCommon}
              id="master"
              title="Available Players"
              meta={`${buckets.master.length} unassigned`}
              players={displayedMaster}
              emptyLabel={searchQuery.trim() ? 'No matching available players found.' : 'No players yet — add one below.'}
            >
              {/* Search & Add Player Bar */}
              <View style={[styles.addRow, { backgroundColor: bubble }]}>
                <Ionicons
                  name={queryLooksLikePhone ? 'call-outline' : 'search-outline'}
                  size={14}
                  color={theme.textSecondary}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={(t) => {
                    setSearchQuery(t);
                    if (duplicateWarning) setDuplicateWarning(null);
                  }}
                  placeholder="Search by mobile number or name"
                  placeholderTextColor={theme.placeholder}
                  style={[
                    styles.addInput,
                    { color: bubbleText },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
                  returnKeyType="search"
                />
                <Pressable
                  onPress={() => openAddPlayer(searchQuery)}
                  accessibilityLabel="Add a new player"
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="person-add" size={14} color="#ffffff" />
                </Pressable>
              </View>

              {/* 1. In-Match Search Matches */}
              {matchPlayerResults.length > 0 && searchQuery.trim().length > 0 && (
                <View style={styles.suggestList}>
                  {matchPlayerResults.map(({ player: p, location, locationLabel }) => (
                    <View key={p.id} style={[styles.suggestRow, { backgroundColor: bubble }]}>
                      <Image source={avatarSourceFor(p)} style={styles.avatar} contentFit="cover" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <ThemedText style={[styles.suggestName, { color: bubbleText }]} numberOfLines={1}>
                          {p.name}
                        </ThemedText>
                        <ThemedText style={[styles.suggestMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                          {p.phone || 'No phone'} ·{' '}
                          <ThemedText style={{ color: location === 'master' ? theme.primary : accentA, fontFamily: 'Sora_600SemiBold' }}>
                            {locationLabel}
                          </ThemedText>
                        </ThemedText>
                      </View>
                      <View style={styles.actionRow}>
                        {actionsFor(p, location).map((action) => (
                          <Pressable
                            key={action.key}
                            onPress={action.onPress}
                            hitSlop={5}
                            accessibilityLabel={action.hint}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              {
                                backgroundColor: action.icon ? 'transparent' : action.color,
                                borderColor: action.color + (action.icon ? '66' : '00'),
                                borderWidth: action.icon ? 1 : 0,
                                opacity: pressed ? 0.6 : 1,
                              },
                            ]}
                          >
                            {action.icon ? (
                              <Ionicons name={action.icon} size={11} color={action.color} />
                            ) : (
                              <ThemedText style={styles.actionText}>{action.label}</ThemedText>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* 2. Saved Team Roster Matches */}
              {savedPlayerResults.length > 0 && (
                <View style={styles.suggestList}>
                  {savedPlayerResults.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => commitPlayer({ name: s.name, phone: s.phone, avatarUrl: s.avatarUrl })}
                      style={({ pressed }) => [
                        styles.suggestRow,
                        { backgroundColor: bubble, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Image source={avatarSourceFor(s)} style={styles.avatar} contentFit="cover" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <ThemedText style={[styles.suggestName, { color: bubbleText }]} numberOfLines={1}>
                          {s.name}
                        </ThemedText>
                        <ThemedText style={[styles.suggestMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                          {s.phone || 'Saved Player'} · Tap to Add
                        </ThemedText>
                      </View>
                      <Ionicons name="add-circle" size={18} color={theme.primary} />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* 3. FoF Directory Matches */}
              {directoryResults.length > 0 && (
                <View style={styles.suggestList}>
                  {directoryResults.map((s) => {
                    const conn = getFoFConnection(s.phone);
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => commitPlayer({ name: s.name, phone: s.phone, avatarUrl: s.avatar })}
                        style={({ pressed }) => [
                          styles.suggestRow,
                          { backgroundColor: bubble, opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        {s.avatar && (s.avatar.startsWith('http') || s.avatar.startsWith('data:') || s.avatar.startsWith('file:') || s.avatar.startsWith('blob:')) ? (
                          <Image source={{ uri: s.avatar }} style={styles.avatar} contentFit="cover" />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }]}>
                            <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_700Bold', color: theme.primary }}>
                              {getTwoLetterLogo(s.name)}
                            </ThemedText>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText style={[styles.suggestName, { color: bubbleText }]} numberOfLines={1}>
                            {s.name}
                          </ThemedText>
                          <ThemedText style={[styles.suggestMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                            {s.phone} ·{' '}
                            <ThemedText style={{ color: conn.badgeColor || theme.primary, fontFamily: 'Sora_600SemiBold' }}>
                              {conn.degreeBadgeText}
                            </ThemedText>
                          </ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary + '14', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                          <Ionicons name="add-circle" size={14} color={theme.primary} />
                          <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>Add</ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Exact match info */}
              {exactMatchInPool && (
                <View style={styles.warnRow}>
                  <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                  <ThemedText style={[styles.warnText, { color: theme.primary }]}>
                    {`${exactMatchInPool.name}${exactMatchInPool.phone ? ` (${exactMatchInPool.phone})` : ''} is already in the match.`}
                  </ThemedText>
                </View>
              )}

              {/* Nothing matched */}
              {searchQuery.trim().length >= 3 &&
                !exactMatchInPool &&
                matchPlayerResults.length === 0 &&
                savedPlayerResults.length === 0 &&
                directoryResults.length === 0 && (
                  <Pressable
                    onPress={() => openAddPlayer(searchQuery)}
                    style={({ pressed }) => [
                      styles.notFound,
                      { borderColor: theme.primary + '55', opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Ionicons name="person-add" size={14} color={theme.primary} />
                    <ThemedText style={[styles.notFoundText, { color: theme.primary }]} numberOfLines={1}>
                      {queryLooksLikePhone
                        ? `Add player with ${searchQuery.trim()}`
                        : `Add “${searchQuery.trim()}” as new player`}
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                  </Pressable>
                )}

              {creditToast && (
                <View style={styles.warnRow}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <ThemedText style={[styles.warnText, { color: '#10B981' }]}>{creditToast}</ThemedText>
                </View>
              )}
              {duplicateWarning && (
                <View style={styles.warnRow}>
                  <Ionicons name="alert-circle" size={12} color={theme.error} />
                  <ThemedText style={[styles.warnText, { color: theme.error }]}>
                    {duplicateWarning}
                  </ThemedText>
                </View>
              )}
            </PlayerZone>

            {/* ── Team A Zone ── */}
            <PlayerZone
              {...zoneCommon}
              id="teamA"
              title={labelA}
              meta={`${buckets.teamA.length} player${buckets.teamA.length === 1 ? '' : 's'}`}
              players={buckets.teamA}
              emptyLabel={`Tap ${codeA} on an available player or drag them here`}
              zoneBg={zone}
              accent={accentA}
              roleBadge={isTeamABatting ? '🏏 Batting' : '🎯 Bowling'}
              roleColor={isTeamABatting ? '#10B981' : '#8B5CF6'}
              isBattingTeam={isTeamABatting}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              onSwapStrike={handleSwapStrike}
              onRetireStriker={() => {
                const p = buckets.teamA.find((pl) => pl.name.toLowerCase() === strikerName.toLowerCase());
                if (p) setRetireConfirmPlayer(p);
              }}
              onRetireNonStriker={() => {
                const p = buckets.teamA.find((pl) => pl.name.toLowerCase() === nonStrikerName.toLowerCase());
                if (p) setRetireConfirmPlayer(p);
              }}
              onRetireBowler={() => {
                const p = buckets.teamA.find((pl) => pl.name.toLowerCase() === bowlerName.toLowerCase());
                if (p) handleRetireBowler(p);
              }}
            />

            {/* ── Team B Zone ── */}
            <PlayerZone
              {...zoneCommon}
              id="teamB"
              title={labelB}
              meta={`${buckets.teamB.length} player${buckets.teamB.length === 1 ? '' : 's'}`}
              players={buckets.teamB}
              emptyLabel={`Tap ${codeB} on an available player or drag them here`}
              zoneBg={zone}
              accent={accentB}
              roleBadge={!isTeamABatting ? '🏏 Batting' : '🎯 Bowling'}
              roleColor={!isTeamABatting ? '#10B981' : '#8B5CF6'}
              isBattingTeam={!isTeamABatting}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              onSwapStrike={handleSwapStrike}
              onRetireStriker={() => {
                const p = buckets.teamB.find((pl) => pl.name.toLowerCase() === strikerName.toLowerCase());
                if (p) setRetireConfirmPlayer(p);
              }}
              onRetireNonStriker={() => {
                const p = buckets.teamB.find((pl) => pl.name.toLowerCase() === nonStrikerName.toLowerCase());
                if (p) setRetireConfirmPlayer(p);
              }}
              onRetireBowler={() => {
                const p = buckets.teamB.find((pl) => pl.name.toLowerCase() === bowlerName.toLowerCase());
                if (p) handleRetireBowler(p);
              }}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={onSkip} style={styles.skipBtn}>
              <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
                Skip for now
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.confirmText}>
                {totalAssigned > 0 ? `Apply & Continue (${totalAssigned})` : 'Continue to Match'}
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

          {/* Player Quick Action Bottom Sheet / Modal */}
          {selectedActionPlayer && (
            <PlayerActionModal
              visible={!!selectedActionPlayer}
              item={selectedActionPlayer}
              onClose={() => setSelectedActionPlayer(null)}
              theme={theme}
              bubble={bubble}
              bubbleText={bubbleText}
              isTeamABatting={isTeamABatting}
              labelA={labelA}
              labelB={labelB}
              codeA={codeA}
              codeB={codeB}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              retiredPlayers={retiredPlayers}
              onSetStriker={handleSetStriker}
              onSetNonStriker={handleSetNonStriker}
              onSetBowler={handleSetBowler}
              onRetireBowler={handleRetireBowler}
              onSwapStrike={handleSwapStrike}
              onRetireClick={(player) => {
                setSelectedActionPlayer(null);
                setRetireConfirmPlayer(player);
              }}
              onUnretire={handleUnretire}
              onMoveToTeam={(player, from, to) => {
                moveToBucket(player, from, to);
                setSelectedActionPlayer(null);
              }}
              onRemoveFromTeam={(player, from) => {
                moveToBucket(player, from, 'master');
                setSelectedActionPlayer(null);
              }}
            />
          )}

          {/* Retire Batsman Modal (Retired Hurt vs Retired Out) */}
          {retireConfirmPlayer && (
            <RetireConfirmationModal
              visible={!!retireConfirmPlayer}
              player={retireConfirmPlayer}
              onClose={() => setRetireConfirmPlayer(null)}
              theme={theme}
              bubble={bubble}
              bubbleText={bubbleText}
              onConfirmRetire={(type) => handleExecuteRetire(retireConfirmPlayer, type)}
            />
          )}

          {/* Floating Drag Ghost */}
          {draggingPlayer && (
            <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle, { backgroundColor: bubble }]}>
              <Image source={avatarSourceFor(draggingPlayer)} style={styles.avatar} contentFit="cover" />
              <ThemedText style={[styles.bubbleName, { color: bubbleText }]} numberOfLines={1}>
                {draggingPlayer.name}
              </ThemedText>
            </Animated.View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ── Legend Pill ─────────────────────────────────────────────────────────────
function LegendPill({
  code,
  name,
  color,
  bubble,
  text,
  roleBadge,
  roleColor,
}: {
  code: string;
  name: string;
  color: string;
  bubble: string;
  text: string;
  roleBadge?: string;
  roleColor?: string;
}) {
  return (
    <View style={[styles.legendPill, { backgroundColor: bubble }]}>
      <View style={[styles.legendCode, { backgroundColor: color }]}>
        <ThemedText style={styles.legendCodeText}>{code}</ThemedText>
      </View>
      <ThemedText style={[styles.legendName, { color: text }]} numberOfLines={1}>
        {name}
      </ThemedText>
      {roleBadge && (
        <View style={[styles.roleBadge, { backgroundColor: (roleColor || color) + '18' }]}>
          <ThemedText style={[styles.roleBadgeText, { color: roleColor || color }]}>
            {roleBadge}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// ── Player Bubble ───────────────────────────────────────────────────────────
function PlayerBubble({
  player,
  bucketId,
  isDragging,
  bubble,
  bubbleText,
  actions,
  dragX,
  dragY,
  roleTag,
  roleTagColor,
  onDragStart,
  onDragEnd,
  onTap,
}: {
  player: Player;
  bucketId: BucketId;
  isDragging: boolean;
  bubble: string;
  bubbleText: string;
  actions: BubbleAction[];
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  roleTag?: string;
  roleTagColor?: string;
  onDragStart: (player: Player, from: BucketId) => void;
  onDragEnd: (player: Player, from: BucketId, x: number, y: number) => void;
  onTap?: (player: Player, bucketId: BucketId) => void;
}) {
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(180)
        .onStart((e) => {
          dragX.value = e.absoluteX;
          dragY.value = e.absoluteY;
          runOnJS(onDragStart)(player, bucketId);
        })
        .onUpdate((e) => {
          dragX.value = e.absoluteX;
          dragY.value = e.absoluteY;
        })
        .onEnd((e) => {
          runOnJS(onDragEnd)(player, bucketId, e.absoluteX, e.absoluteY);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player.id, bucketId]
  );

  return (
    <GestureDetector gesture={pan}>
      <Pressable
        onPress={() => onTap && onTap(player, bucketId)}
        style={[styles.bubble, { backgroundColor: bubble, opacity: isDragging ? 0 : 1 }]}
      >
        <Image source={avatarSourceFor(player)} style={styles.avatar} contentFit="cover" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
          <ThemedText style={[styles.bubbleName, { color: bubbleText }]} numberOfLines={1}>
            {player.name}
          </ThemedText>
          {roleTag && (
            <View style={[styles.bubbleRolePill, { backgroundColor: (roleTagColor || '#4F46E5') + '20' }]}>
              <ThemedText style={[styles.bubbleRolePillText, { color: roleTagColor || '#4F46E5' }]}>
                {roleTag}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              hitSlop={5}
              accessibilityLabel={action.hint}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: action.icon ? 'transparent' : action.color,
                  borderColor: action.color + (action.icon ? '66' : '00'),
                  borderWidth: action.icon ? 1 : 0,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              {action.icon ? (
                <Ionicons name={action.icon} size={11} color={action.color} />
              ) : (
                <ThemedText style={styles.actionText}>{action.label}</ThemedText>
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </GestureDetector>
  );
}

// ── Player Zone ─────────────────────────────────────────────────────────────
function PlayerZone({
  id,
  title,
  meta,
  players,
  draggingId,
  dragX,
  dragY,
  registerRef,
  onDragStart,
  onDragEnd,
  onPlayerTap,
  actionsFor,
  emptyLabel,
  bubble,
  bubbleText,
  textSecondary,
  zoneBg,
  accent,
  roleBadge,
  roleColor,
  isBattingTeam,
  strikerName = '',
  nonStrikerName = '',
  bowlerName = '',
  retiredPlayers = [],
  onSwapStrike,
  onRetireStriker,
  onRetireNonStriker,
  onRetireBowler,
  children,
}: {
  id: BucketId;
  title: string;
  meta: string;
  players: Player[];
  draggingId: string | null;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  registerRef: (id: BucketId, node: View | null) => void;
  onDragStart: (player: Player, from: BucketId) => void;
  onDragEnd: (player: Player, from: BucketId, x: number, y: number) => void;
  onPlayerTap?: (player: Player, bucketId: BucketId) => void;
  actionsFor: (player: Player, from: BucketId) => BubbleAction[];
  emptyLabel: string;
  bubble: string;
  bubbleText: string;
  textSecondary: string;
  zoneBg?: string;
  accent?: string;
  roleBadge?: string;
  roleColor?: string;
  isBattingTeam?: boolean;
  strikerName?: string;
  nonStrikerName?: string;
  bowlerName?: string;
  retiredPlayers?: { name: string; type: 'Retired Hurt' | 'Retired Out' }[];
  onSwapStrike?: () => void;
  onRetireStriker?: () => void;
  onRetireNonStriker?: () => void;
  onRetireBowler?: () => void;
  children?: React.ReactNode;
}) {
  const isTeamZone = id === 'teamA' || id === 'teamB';

  return (
    <View
      ref={(node) => registerRef(id, node)}
      style={[styles.zone, zoneBg ? { backgroundColor: zoneBg } : null]}
    >
      <View style={styles.zoneHeader}>
        {accent ? <View style={[styles.zoneDot, { backgroundColor: accent }]} /> : null}
        <ThemedText style={[styles.zoneTitle, { color: bubbleText }]} numberOfLines={1}>
          {title}
        </ThemedText>
        {roleBadge && (
          <View style={[styles.roleBadge, { backgroundColor: (roleColor || accent || '#4F46E5') + '18' }]}>
            <ThemedText style={[styles.roleBadgeText, { color: roleColor || accent || '#4F46E5' }]}>
              {roleBadge}
            </ThemedText>
          </View>
        )}
        <ThemedText style={[styles.zoneMeta, { color: textSecondary }]}>{meta}</ThemedText>
      </View>

      {/* Crease / Active Slots Bar for Team Zones */}
      {isTeamZone && (
        <View style={[styles.creaseBar, { backgroundColor: bubble }]}>
          {isBattingTeam ? (
            <View style={{ gap: 6 }}>
              {/* Striker & Non-Striker Slots */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* Striker Slot */}
                <View style={[styles.creaseSlot, { flex: 1, borderColor: '#10B98144', backgroundColor: '#10B9810C' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_700Bold', color: '#10B981' }}>
                      🏏 STRIKER (B1)
                    </ThemedText>
                    {strikerName ? (
                      <Pressable onPress={onRetireStriker} hitSlop={4}>
                        <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_600SemiBold', color: '#EF4444' }}>
                          Retire
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                  <ThemedText
                    style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: strikerName ? bubbleText : textSecondary, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {strikerName || 'Select Striker'}
                  </ThemedText>
                </View>

                {/* Swap Strike Button */}
                <Pressable
                  onPress={onSwapStrike}
                  hitSlop={6}
                  style={[styles.creaseSwapBtn, { backgroundColor: '#10B98120' }]}
                >
                  <Ionicons name="swap-horizontal" size={14} color="#10B981" />
                </Pressable>

                {/* Non-Striker Slot */}
                <View style={[styles.creaseSlot, { flex: 1, borderColor: '#3B82F644', backgroundColor: '#3B82F60C' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_700Bold', color: '#3B82F6' }}>
                      🏃 NON-STRIKER (B2)
                    </ThemedText>
                    {nonStrikerName ? (
                      <Pressable onPress={onRetireNonStriker} hitSlop={4}>
                        <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_600SemiBold', color: '#EF4444' }}>
                          Retire
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                  <ThemedText
                    style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: nonStrikerName ? bubbleText : textSecondary, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {nonStrikerName || 'Select Non-Striker'}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : (
            /* Bowling Slot */
            <View style={[styles.creaseSlot, { borderColor: '#8B5CF644', backgroundColor: '#8B5CF60C' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_700Bold', color: '#8B5CF6' }}>
                  🎯 ACTIVE BOWLER
                </ThemedText>
                {bowlerName ? (
                  <Pressable onPress={onRetireBowler} hitSlop={4}>
                    <ThemedText style={{ fontSize: 8.5, fontFamily: 'Sora_600SemiBold', color: '#EF4444' }}>
                      Change / Retire
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <ThemedText
                style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: bowlerName ? bubbleText : textSecondary, marginTop: 2 }}
                numberOfLines={1}
              >
                {bowlerName || 'Select Bowler'}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Squad Player Bubbles */}
      <View style={styles.bubbleWrap}>
        {players.map((player) => {
          const isStriker = isBattingTeam && strikerName.trim().toLowerCase() === player.name.trim().toLowerCase();
          const isNonStriker = isBattingTeam && nonStrikerName.trim().toLowerCase() === player.name.trim().toLowerCase();
          const isBowler = !isBattingTeam && bowlerName.trim().toLowerCase() === player.name.trim().toLowerCase();
          const retRec = retiredPlayers.find((r) => r.name.toLowerCase() === player.name.toLowerCase());

          let roleTag: string | undefined;
          let roleTagColor: string | undefined;

          if (retRec) {
            roleTag = retRec.type === 'Retired Hurt' ? 'Injured' : 'Retired';
            roleTagColor = '#EF4444';
          } else if (isStriker) {
            roleTag = '🏏 Striker';
            roleTagColor = '#10B981';
          } else if (isNonStriker) {
            roleTag = '🏃 B2';
            roleTagColor = '#3B82F6';
          } else if (isBowler) {
            roleTag = '🎯 Bowler';
            roleTagColor = '#8B5CF6';
          }

          return (
            <PlayerBubble
              key={player.id}
              player={player}
              bucketId={id}
              isDragging={draggingId === player.id}
              bubble={bubble}
              bubbleText={bubbleText}
              actions={actionsFor(player, id)}
              dragX={dragX}
              dragY={dragY}
              roleTag={roleTag}
              roleTagColor={roleTagColor}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onTap={onPlayerTap}
            />
          );
        })}
        {players.length === 0 && (
          <ThemedText style={[styles.emptyLabel, { color: textSecondary }]}>{emptyLabel}</ThemedText>
        )}
      </View>

      {children}
    </View>
  );
}

// ── Player Action Sheet Modal ───────────────────────────────────────────────
function PlayerActionModal({
  visible,
  item,
  onClose,
  theme,
  bubble,
  bubbleText,
  isTeamABatting,
  labelA,
  labelB,
  codeA,
  codeB,
  strikerName,
  nonStrikerName,
  bowlerName,
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
  bubble: string;
  bubbleText: string;
  isTeamABatting: boolean;
  labelA: string;
  labelB: string;
  codeA: string;
  codeB: string;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
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

  const isBattingTeam =
    (bucketId === 'teamA' && isTeamABatting) || (bucketId === 'teamB' && !isTeamABatting);
  const isBowlingTeam =
    (bucketId === 'teamA' && !isTeamABatting) || (bucketId === 'teamB' && isTeamABatting);

  const isStriker = strikerName.toLowerCase() === player.name.toLowerCase();
  const isNonStriker = nonStrikerName.toLowerCase() === player.name.toLowerCase();
  const isBowler = bowlerName.toLowerCase() === player.name.toLowerCase();
  const retRec = retiredPlayers.find((r) => r.name.toLowerCase() === player.name.toLowerCase());

  const otherBucketId: BucketId = bucketId === 'teamA' ? 'teamB' : 'teamA';
  const otherTeamLabel = bucketId === 'teamA' ? labelB : labelA;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.actionSheet, { backgroundColor: bubble }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.actionSheetHeader}>
            <Image source={avatarSourceFor(player)} style={styles.actionSheetAvatar} contentFit="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText style={[styles.actionSheetName, { color: bubbleText }]} numberOfLines={1}>
                {player.name}
              </ThemedText>
              <ThemedText style={[styles.actionSheetSub, { color: theme.textSecondary }]}>
                {player.phone || 'Player'}{' '}
                <ThemedText style={{ color: conn.badgeColor || theme.primary, fontFamily: 'Sora_600SemiBold' }}>
                  · {conn.degreeBadgeText}
                </ThemedText>
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeBtn, { backgroundColor: theme.surfaceLow }]}>
              <Ionicons name="close" size={14} color={bubbleText} />
            </Pressable>
          </View>

          {/* Action List */}
          <View style={styles.actionSheetList}>
            {/* Batting Team Actions */}
            {isBattingTeam && (
              <>
                {retRec ? (
                  retRec.type === 'Retired Hurt' && (
                    <Pressable
                      onPress={() => {
                        onUnretire(player);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: '#10B98114' }]}
                    >
                      <Ionicons name="refresh" size={16} color="#10B981" />
                      <ThemedText style={[styles.sheetActionText, { color: '#10B981' }]}>
                        Resume Batting (Unretire)
                      </ThemedText>
                    </Pressable>
                  )
                ) : (
                  <>
                    <Pressable
                      onPress={() => {
                        onSetStriker(player);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: isStriker ? '#10B98122' : theme.surfaceLow }]}
                    >
                      <Ionicons name="flash" size={16} color="#10B981" />
                      <ThemedText style={[styles.sheetActionText, { color: bubbleText }]}>
                        {isStriker ? 'Currently on Strike (Striker 🏏)' : 'Set as Striker (On Strike 🏏)'}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        onSetNonStriker(player);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: isNonStriker ? '#3B82F622' : theme.surfaceLow }]}
                    >
                      <Ionicons name="walk" size={16} color="#3B82F6" />
                      <ThemedText style={[styles.sheetActionText, { color: bubbleText }]}>
                        {isNonStriker ? 'Currently Non-Striker (🏃)' : 'Set as Non-Striker (Runner 🏃)'}
                      </ThemedText>
                    </Pressable>

                    {(isStriker || isNonStriker) && (
                      <Pressable
                        onPress={() => {
                          onSwapStrike();
                          onClose();
                        }}
                        style={[styles.sheetActionItem, { backgroundColor: theme.surfaceLow }]}
                      >
                        <Ionicons name="swap-horizontal" size={16} color="#10B981" />
                        <ThemedText style={[styles.sheetActionText, { color: bubbleText }]}>
                          Swap Strike Ends (B1 ⇄ B2)
                        </ThemedText>
                      </Pressable>
                    )}

                    {(isStriker || isNonStriker) && (
                      <Pressable
                        onPress={() => onRetireClick(player)}
                        style={[styles.sheetActionItem, { backgroundColor: '#EF444414' }]}
                      >
                        <Ionicons name="hand-left-outline" size={16} color="#EF4444" />
                        <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                          Retire Batsman (Hurt / Out)
                        </ThemedText>
                      </Pressable>
                    )}
                  </>
                )}
              </>
            )}

            {/* Bowling Team Actions */}
            {isBowlingTeam && (
              <>
                <Pressable
                  onPress={() => {
                    onSetBowler(player);
                    onClose();
                  }}
                  style={[styles.sheetActionItem, { backgroundColor: isBowler ? '#8B5CF622' : theme.surfaceLow }]}
                >
                  <Ionicons name="baseball-outline" size={16} color="#8B5CF6" />
                  <ThemedText style={[styles.sheetActionText, { color: bubbleText }]}>
                    {isBowler ? 'Active Current Bowler 🎯' : 'Set as Current Bowler 🎯'}
                  </ThemedText>
                </Pressable>

                {isBowler && (
                  <Pressable
                    onPress={() => {
                      onRetireBowler(player);
                      onClose();
                    }}
                    style={[styles.sheetActionItem, { backgroundColor: '#EF444414' }]}
                  >
                    <Ionicons name="hand-left-outline" size={16} color="#EF4444" />
                    <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                      Retire / Step Down from Bowling
                    </ThemedText>
                  </Pressable>
                )}
              </>
            )}

            {/* Transfer / Swap Team */}
            {bucketId !== 'master' && (
              <Pressable
                onPress={() => onMoveToTeam(player, bucketId, otherBucketId)}
                style={[styles.sheetActionItem, { backgroundColor: theme.surfaceLow }]}
              >
                <Ionicons name="swap-horizontal" size={16} color={theme.primary} />
                <ThemedText style={[styles.sheetActionText, { color: theme.primary }]}>
                  Transfer to {otherTeamLabel}
                </ThemedText>
              </Pressable>
            )}

            {/* Remove from Squad */}
            {bucketId !== 'master' && (
              <Pressable
                onPress={() => onRemoveFromTeam(player, bucketId)}
                style={[styles.sheetActionItem, { backgroundColor: theme.surfaceLow }]}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                  Remove from Team Squad
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
  bubble,
  bubbleText,
  onConfirmRetire,
}: {
  visible: boolean;
  player: Player;
  onClose: () => void;
  theme: any;
  bubble: string;
  bubbleText: string;
  onConfirmRetire: (type: 'Retired Hurt' | 'Retired Out') => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.retireModal, { backgroundColor: bubble }]} onPress={(e) => e.stopPropagation()}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.retireIconCircle, { backgroundColor: '#EF444418' }]}>
              <Ionicons name="hand-left" size={24} color="#EF4444" />
            </View>
            <ThemedText style={[styles.retireTitle, { color: bubbleText }]}>
              Retire {player.name}
            </ThemedText>
            <ThemedText style={[styles.retireSub, { color: theme.textSecondary }]}>
              Choose the retirement status for this batsman:
            </ThemedText>
          </View>

          {/* Option 1: Retired Hurt */}
          <Pressable
            onPress={() => onConfirmRetire('Retired Hurt')}
            style={({ pressed }) => [
              styles.retireOptionCard,
              { backgroundColor: '#F59E0B10', borderColor: '#F59E0B44', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="medkit-outline" size={18} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: '#F59E0B' }}>
                  Retired Hurt (Injured)
                </ThemedText>
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 1 }}>
                  Not out. Player can return to bat later if needed.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#F59E0B" />
            </View>
          </Pressable>

          {/* Option 2: Retired Out */}
          <Pressable
            onPress={() => onConfirmRetire('Retired Out')}
            style={({ pressed }) => [
              styles.retireOptionCard,
              { backgroundColor: '#EF444410', borderColor: '#EF444444', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="exit-outline" size={18} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 12.5, fontFamily: 'Sora_700Bold', color: '#EF4444' }}>
                  Retired Out (Dismissed)
                </ThemedText>
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 1 }}>
                  Permanent dismissal. Cannot bat again this innings.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#EF4444" />
            </View>
          </Pressable>

          {/* Cancel */}
          <Pressable onPress={onClose} style={[styles.retireCancelBtn, { borderColor: theme.border }]}>
            <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary }}>
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
    paddingHorizontal: 8,
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
    ...Shadows.level1,
  },

  // ── Legend ─────────────────────────────────────────────────────────────
  legend: {
    flexDirection: 'row',
    gap: 6,
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
    ...Shadows.level1,
  },
  legendCode: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendCodeText: { fontFamily: 'Sora_600SemiBold', fontSize: 8.5, color: '#ffffff' },
  legendName: { fontFamily: 'Sora_600SemiBold', fontSize: 10, flexShrink: 1 },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  roleBadgeText: { fontFamily: 'Sora_700Bold', fontSize: 8.5 },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.lg },

  // ── Zones ──────────────────────────────────────────────────────────────
  zone: {
    borderRadius: 16,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 5 },
  zoneDot: { width: 7, height: 7, borderRadius: 4 },
  zoneTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 11.5, flexShrink: 1 },
  zoneMeta: { fontFamily: 'Sora_500Medium', fontSize: 9.5, marginLeft: 'auto' },

  // ── Crease Active Bar ──────────────────────────────────────────────────
  creaseBar: {
    borderRadius: 12,
    padding: 8,
    marginBottom: Spacing.sm,
    ...Shadows.level1,
  },
  creaseSlot: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  creaseSwapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bubbles ────────────────────────────────────────────────────────────
  bubbleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 4,
    gap: 6,
    ...Shadows.level1,
  },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#00000010' },
  bubbleName: { fontFamily: 'Sora_500Medium', fontSize: 11, letterSpacing: -0.1 },
  bubbleRolePill: {
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  bubbleRolePillText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 7.5,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionBtn: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: 'Sora_600SemiBold', fontSize: 8, color: '#ffffff' },
  emptyLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: 2,
  },

  // ── Search / Add Bar ───────────────────────────────────────────────────
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingLeft: 12,
    paddingRight: 3,
    paddingVertical: 3,
    marginTop: Spacing.sm,
    ...Shadows.level1,
  },
  addInput: { flex: 1, minWidth: 0, height: 30, fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, paddingHorizontal: 4 },
  warnText: { fontFamily: 'Sora_600SemiBold', fontSize: 10.5, flexShrink: 1 },

  // ── Suggest Results ────────────────────────────────────────────────────
  suggestList: { marginTop: 6, gap: 5 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  suggestName: { fontFamily: 'Sora_600SemiBold', fontSize: 11.5 },
  suggestMeta: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },

  notFound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 6,
  },
  notFoundText: { fontFamily: 'Sora_500Medium', fontSize: 11, flex: 1 },

  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 8 },
  skipText: { fontFamily: 'Sora_600SemiBold', fontSize: 12 },
  confirmBtn: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  confirmText: { fontFamily: 'Sora_700Bold', fontSize: 12.5, color: '#ffffff' },

  ghost: {
    position: 'absolute',
    width: GHOST_WIDTH,
    height: GHOST_HEIGHT,
    borderRadius: 9999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level3,
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
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.level3,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  actionSheetAvatar: { width: 36, height: 36, borderRadius: 18 },
  actionSheetName: { fontFamily: 'Sora_700Bold', fontSize: 13 },
  actionSheetSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  actionSheetList: { marginTop: Spacing.sm, gap: 6 },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sheetActionText: { fontFamily: 'Sora_600SemiBold', fontSize: 11.5 },

  // ── Retire Modal ───────────────────────────────────────────────────────
  retireModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.level3,
  },
  retireIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  retireTitle: { fontFamily: 'Sora_700Bold', fontSize: 14.5, textAlign: 'center' },
  retireSub: { fontFamily: 'Sora_400Regular', fontSize: 11, textAlign: 'center', marginTop: 3 },
  retireOptionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  retireCancelBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
