import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import { LinearGradient } from 'expo-linear-gradient';
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

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
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
import { registerFoFPlayer, searchFoFDirectory, getFoFConnection, loadFoFDatabase, getFirstDegreePlayers } from '@/services/fof-network';

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
  for (const raw of list) {
    if (!raw) continue;
    const name = typeof raw === 'string' ? raw : raw.name;
    if (!name || !name.trim()) continue;
    const key = name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const p: Player = typeof raw === 'string' ? {
      id: generatePlayerId(),
      name: name.trim(),
      skillLevel: 'Intermediate',
      position: 'All-Rounder',
    } : {
      ...raw,
      id: raw.id || generatePlayerId(),
      name: name.trim(),
    };
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
    canvas: theme.background,
    cardBg: theme.surfaceLowest,
    zoneBg: theme.surfaceLow,
    borderColor: theme.outlineVariant + (isDark ? '55' : '40'),
    textPrimary: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: isDark ? '#64748B' : '#94A3B8',
    // Bottom → top: the app's cream ground with the dashboard's primary wash on top.
    goldenGrad: [theme.background, theme.background, theme.primary + '1C'] as const,
  };
}

const shortCode = (name: string, fallback: string): string => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const avatarSourceFor = (player: Player) => {
  if (!player) return getAvatarSource(AVATAR_KEYS[0]);
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
  const str = String(player.id || player.name || 'player');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return getAvatarSource(AVATAR_KEYS[hash % AVATAR_KEYS.length]);
};

export interface PlayerSelectionModalProps {
  visible: boolean;
  isInitialSetup?: boolean;
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
  lastOverBowlerName?: string;
  maxOversPerBowler?: number | string;
}

export function PlayerSelectionModal({
  visible,
  isInitialSetup,
  teamAName,
  teamBName,
  teamAMascot,
  teamBMascot,
  battingTeamName: propBattingTeam,
  bowlingTeamName: propBowlingTeam,
  activeStrikerName = '',
  activeNonStrikerName = '',
  activeBowlerName = '',
  lastOverBowlerName = '',
  maxOversPerBowler = Infinity,
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
  const { theme, canvas, cardBg, zoneBg, borderColor, textPrimary, textSecondary, textMuted, goldenGrad } = usePalette();

  const isInitialSetupMode = isInitialSetup ?? (!propBattingTeam && !activeStrikerName && !activeBowlerName);

  const maxBowlerLimit = maxOversPerBowler === 'unlimited' ? Infinity : (typeof maxOversPerBowler === 'number' ? maxOversPerBowler : (parseInt(String(maxOversPerBowler || '')) || Infinity));

  const labelA = (teamAName || '').trim() || 'Team A';
  const labelB = (teamBName || '').trim() || 'Team B';
  const codeA = shortCode(labelA, 'TA');
  const codeB = shortCode(labelB, 'TB');

  const [buckets, setBuckets] = useState<Buckets>(() => {
    const teamA = strictDedupe(initialTeamA || []);
    const teamB = strictDedupe(initialTeamB || []).filter(
      (p) => !teamA.some((a) => a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
    );
    const assigned = new Set([...teamA, ...teamB].map((p) => p.name.trim().toLowerCase()));
    const top15FirstDegree: Player[] = getFirstDegreePlayers(15).map(fof => ({
      id: fof.id || generatePlayerId(),
      name: fof.name,
      phone: fof.phone,
      avatarUrl: fof.avatar,
      position: (fof.role?.split('•')[0] || 'All-Rounder').trim(),
      skillLevel: 'Intermediate',
    }));
    return {
      master: strictDedupe([...(initialPool || []), ...top15FirstDegree]).filter((p) => !assigned.has(p.name.trim().toLowerCase())),
      teamA,
      teamB,
    };
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
  const [isPoolExpanded, setIsPoolExpanded] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingPlayer, setDraggingPlayer] = useState<Player | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<DropTargetId | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [creditToast, setCreditToast] = useState<string | null>(null);
  const creditedPhones = useRef<Set<string>>(new Set());

  // Re-seed only when modal opens
  useEffect(() => {
    if (visible) {
      loadFoFDatabase().catch(() => { });
      const teamA = strictDedupe(initialTeamA || []);
      const teamB = strictDedupe(initialTeamB || []).filter(
        (p) => !teamA.some((a) => a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      const assigned = new Set([...teamA, ...teamB].map((p) => p.name.trim().toLowerCase()));
      const top15FirstDegree: Player[] = getFirstDegreePlayers(15).map(fof => ({
        id: fof.id || generatePlayerId(),
        name: fof.name,
        phone: fof.phone,
        avatarUrl: fof.avatar,
        position: (fof.role?.split('•')[0] || 'All-Rounder').trim(),
        skillLevel: 'Intermediate',
      }));
      setBuckets({
        master: strictDedupe([...(initialPool || []), ...top15FirstDegree]).filter((p) => !assigned.has(p.name.trim().toLowerCase())),
        teamA,
        teamB,
      });

      const effectiveBatTeam = propBattingTeam || labelA;
      const isPropBatTeamA = effectiveBatTeam.trim().toLowerCase() === labelA.trim().toLowerCase();
      setCurrentBattingTeam(effectiveBatTeam);

      const batSquad = isPropBatTeamA ? teamA : teamB;
      const bowlSquad = isPropBatTeamA ? teamB : teamA;

      const sOut = (dismissedPlayers || []).find(
        (d) => d && d.name && d.name.trim().toLowerCase() === activeStrikerName.trim().toLowerCase() &&
          d.status !== 'Retired Hurt' && d.status !== 'Retired Not Out' && d.dismissalType !== 'retired_hurt'
      );
      const nsOut = (dismissedPlayers || []).find(
        (d) => d && d.name && d.name.trim().toLowerCase() === activeNonStrikerName.trim().toLowerCase() &&
          d.status !== 'Retired Hurt' && d.status !== 'Retired Not Out' && d.dismissalType !== 'retired_hurt'
      );

      // Check bowler quota limit
      const bStat = bowlerStats[activeBowlerName.trim().toLowerCase()];
      const bOvs = bStat ? parseInt((bStat.overs || '0').split('.')[0], 10) : 0;
      const bQuotaReached = maxBowlerLimit < Infinity && bOvs >= maxBowlerLimit;

      // Only assign striker/nonStriker if they belong to batting team or squad is empty
      const sValid = !sOut && (batSquad.length === 0 || batSquad.some((p) => p.name.trim().toLowerCase() === activeStrikerName.trim().toLowerCase()));
      const nsValid = !nsOut && (batSquad.length === 0 || batSquad.some((p) => p.name.trim().toLowerCase() === activeNonStrikerName.trim().toLowerCase()));
      const bowlValid = !bQuotaReached && (bowlSquad.length === 0 || bowlSquad.some((p) => p.name.trim().toLowerCase() === activeBowlerName.trim().toLowerCase()));

      setStrikerName(sValid ? activeStrikerName : '');
      setNonStrikerName(
        nsValid && activeNonStrikerName.trim().toLowerCase() !== activeStrikerName.trim().toLowerCase() ? activeNonStrikerName : ''
      );
      setBowlerName(bowlValid ? activeBowlerName : '');

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

  // Check if player is permanently OUT (dismissed) in the current innings
  const isPlayerPermanentlyOut = useCallback(
    (playerName?: string | null): { isOut: boolean; reason: string } => {
      if (!playerName) return { isOut: false, reason: '' };
      const pKey = playerName.trim().toLowerCase();

      // 1. Check in dismissedPlayers prop (from match state)
      const dRec = (dismissedPlayers || []).find(
        (d) => d && d.name && d.name.trim().toLowerCase() === pKey
      );
      if (dRec) {
        if (
          dRec.status === 'Retired Hurt' ||
          dRec.dismissalType === 'retired_hurt' ||
          dRec.status === 'Retired Not Out'
        ) {
          return { isOut: false, reason: 'Retired Hurt' }; // Can resume!
        }
        return { isOut: true, reason: dRec.status || dRec.dismissalType || 'Out' };
      }

      // 2. Check local retiredPlayers state for 'Retired Out'
      const retRec = (retiredPlayers || []).find((r) => r.name.toLowerCase() === pKey);
      if (retRec && retRec.type === 'Retired Out') {
        return { isOut: true, reason: 'Retired Out' };
      }

      return { isOut: false, reason: '' };
    },
    [dismissedPlayers, retiredPlayers]
  );

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

  const resolveDropTarget = useCallback((x: number, y: number, fromBucket?: BucketId): DropTargetId | null => {
    if (!isInitialSetupMode) {
      // 1. In-match: Specific crease slots have highest priority
      const specificSlots: DropTargetId[] = ['striker', 'nonStriker', 'bowler'];
      for (const id of specificSlots) {
        const rect = dropZoneRects.current[id];
        if (rect) {
          const padX = 18;
          const padY = 18;
          if (
            x >= rect.x - padX &&
            x <= rect.x + rect.width + padX &&
            y >= rect.y - padY &&
            y <= rect.y + rect.height + padY
          ) {
            return id;
          }
        }
      }

      // 2. In-match: Only allow dropping onto team cards if dragging from 'master' (unassigned bench pool)
      // When dragging from teamA or teamB, do NOT treat other team's card as a drop zone (prevents accidental team hopping)
      if (fromBucket === 'master') {
        const generalBuckets: DropTargetId[] = ['teamA', 'teamB'];
        for (const id of generalBuckets) {
          const rect = dropZoneRects.current[id];
          if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
            return id;
          }
        }
      }
      return null;
    }

    // Initial setup mode: Allow organizing across teamA, teamB, master
    const generalBuckets: DropTargetId[] = ['teamA', 'teamB', 'master'];
    for (const id of generalBuckets) {
      const rect = dropZoneRects.current[id];
      if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return id;
      }
    }
    return null;
  }, [isInitialSetupMode]);

  const moveToBucket = useCallback((player: Player, from: BucketId, to: BucketId) => {
    if (from === to || !player || !player.name) return;
    const playerKey = player.name.trim().toLowerCase();
    setBuckets((prev) => ({
      ...prev,
      [from]: (prev[from] || []).filter((p) => p.name.trim().toLowerCase() !== playerKey),
      [to]: strictDedupe([...(prev[to] || []).filter((p) => p.name.trim().toLowerCase() !== playerKey), player]),
    }));

    if (to !== batTeamBucket) {
      if (player.name.toLowerCase() === strikerName.toLowerCase()) setStrikerName('');
      if (player.name.toLowerCase() === nonStrikerName.toLowerCase()) setNonStrikerName('');
    }
    if (to !== bowlTeamBucket) {
      if (player.name.toLowerCase() === bowlerName.toLowerCase()) setBowlerName('');
    }
  }, [strikerName, nonStrikerName, bowlerName, batTeamBucket, bowlTeamBucket]);

  const handleDeletePlayer = useCallback((player: Player) => {
    if (!player || !player.name) return;
    const playerKey = player.name.trim().toLowerCase();
    setBuckets((prev) => ({
      master: (prev.master || []).filter((p) => p.name.trim().toLowerCase() !== playerKey),
      teamA: (prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== playerKey),
      teamB: (prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== playerKey),
    }));

    if (player.name.toLowerCase() === strikerName.toLowerCase()) setStrikerName('');
    if (player.name.toLowerCase() === nonStrikerName.toLowerCase()) setNonStrikerName('');
    if (player.name.toLowerCase() === bowlerName.toLowerCase()) setBowlerName('');
    if (selectedActionPlayer?.player.name.toLowerCase() === playerKey) {
      setSelectedActionPlayer(null);
    }
  }, [strikerName, nonStrikerName, bowlerName, selectedActionPlayer]);

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
    const outInfo = isPlayerPermanentlyOut(player.name);
    if (outInfo.isOut) {
      setDuplicateWarning(`⛔ ${player.name} is OUT (${outInfo.reason}) and cannot bat!`);
      return;
    }
    const pKey = player.name.trim().toLowerCase();
    setStrikerName(player.name);
    // Strictly clear non-striker if same player
    if (nonStrikerName.toLowerCase() === pKey) {
      setNonStrikerName('');
    }
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== pKey));

    // Ensure player is placed inside the batting team bucket and removed from master & bowling team
    setBuckets((prev) => ({
      master: (prev.master || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
      teamA: isTeamABatting
        ? strictDedupe([...(prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== pKey), player])
        : (prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
      teamB: !isTeamABatting
        ? strictDedupe([...(prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== pKey), player])
        : (prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
    }));

    if (onSetStriker) onSetStriker(player);
  };

  const handleSetNonStriker = (player: Player) => {
    const outInfo = isPlayerPermanentlyOut(player.name);
    if (outInfo.isOut) {
      setDuplicateWarning(`⛔ ${player.name} is OUT (${outInfo.reason}) and cannot bat!`);
      return;
    }
    const pKey = player.name.trim().toLowerCase();
    setNonStrikerName(player.name);
    // Strictly clear striker if same player
    if (strikerName.toLowerCase() === pKey) {
      setStrikerName('');
    }
    setRetiredPlayers((prev) => prev.filter((r) => r.name.toLowerCase() !== pKey));

    // Ensure player is placed inside the batting team bucket and removed from master & bowling team
    setBuckets((prev) => ({
      master: (prev.master || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
      teamA: isTeamABatting
        ? strictDedupe([...(prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== pKey), player])
        : (prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
      teamB: !isTeamABatting
        ? strictDedupe([...(prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== pKey), player])
        : (prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
    }));

    if (onSetNonStriker) onSetNonStriker(player);
  };

  const handleSetBowler = (player: Player) => {
    const pKey = player.name.trim().toLowerCase();
    const bStat = bowlerStats[pKey];
    const bOversCompleted = bStat ? parseInt((bStat.overs || '0').split('.')[0], 10) : 0;
    const isQuotaReached = !isInitialSetup && maxBowlerLimit !== undefined && maxBowlerLimit < Infinity && bOversCompleted >= maxBowlerLimit;
    if (isQuotaReached) {
      setDuplicateWarning(`⛔ ${player.name} has already bowled ${bStat?.overs || bOversCompleted} overs (max ${maxBowlerLimit} ${maxBowlerLimit === 1 ? 'over' : 'overs'} limit) and cannot bowl!`);
      Alert.alert(
        'Max Overs Quota Reached',
        `${player.name} has already bowled ${bStat?.overs || bOversCompleted} overs (max limit is ${maxBowlerLimit} ${maxBowlerLimit === 1 ? 'over' : 'overs'} per bowler). Please select a different bowler.`
      );
      return;
    }
    if (lastOverBowlerName && player.name.trim().toLowerCase() === lastOverBowlerName.trim().toLowerCase()) {
      setDuplicateWarning(`⛔ ${player.name} bowled the previous over and cannot bowl consecutive overs!`);
      Alert.alert(
        'Consecutive Over Not Allowed',
        `${player.name} bowled the previous over. By cricket rules, the same bowler cannot bowl two consecutive overs. Please select a different bowler.`
      );
      return;
    }
    setBowlerName(player.name);

    // Ensure player is placed inside the bowling team bucket and removed from master & batting team
    setBuckets((prev) => ({
      master: (prev.master || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
      teamA: !isTeamABatting
        ? strictDedupe([...(prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== pKey), player])
        : (prev.teamA || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
      teamB: isTeamABatting
        ? strictDedupe([...(prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== pKey), player])
        : (prev.teamB || []).filter((p) => p.name.trim().toLowerCase() !== pKey),
    }));

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

  const handleDragStart = useCallback((player: Player, _from: BucketId) => {
    measureDropZones();
    setDraggingPlayer(player);
    setScrollEnabled(false);
    ghostScale.value = withTiming(1, { duration: 100 });
  }, [measureDropZones, ghostScale]);

  const handleDragUpdate = useCallback((x: number, y: number, from?: BucketId) => {
    const target = resolveDropTarget(x, y, from);
    setActiveDropZone(target);
  }, [resolveDropTarget]);

  const handleDragEnd = useCallback((player: Player, from: BucketId, x: number, y: number) => {
    const target = resolveDropTarget(x, y, from);
    setActiveDropZone(null);
    setDraggingPlayer(null);
    setScrollEnabled(true);

    if (!target) return;

    if (target === 'striker') {
      const outInfo = isPlayerPermanentlyOut(player.name);
      if (outInfo.isOut) {
        setDuplicateWarning(`⛔ ${player.name} is OUT (${outInfo.reason}) and cannot bat again in this innings!`);
        return;
      }
      if (from === bowlTeamBucket) {
        const bowlTeamTitle = bowlTeamBucket === 'teamA' ? labelA : labelB;
        setDuplicateWarning(`⛔ ${player.name} belongs to Bowling Team (${bowlTeamTitle}) and cannot be placed in Batting slots.`);
        return;
      }
      if (from === 'master') {
        moveToBucket(player, 'master', batTeamBucket);
      }
      handleSetStriker(player);
    } else if (target === 'nonStriker') {
      const outInfo = isPlayerPermanentlyOut(player.name);
      if (outInfo.isOut) {
        setDuplicateWarning(`⛔ ${player.name} is OUT (${outInfo.reason}) and cannot bat again in this innings!`);
        return;
      }
      if (from === bowlTeamBucket) {
        const bowlTeamTitle = bowlTeamBucket === 'teamA' ? labelA : labelB;
        setDuplicateWarning(`⛔ ${player.name} belongs to Bowling Team (${bowlTeamTitle}) and cannot be placed in Batting slots.`);
        return;
      }
      if (from === 'master') {
        moveToBucket(player, 'master', batTeamBucket);
      }
      handleSetNonStriker(player);
    } else if (target === 'bowler') {
      const pKey = player.name.trim().toLowerCase();
      const bStat = bowlerStats[pKey];
      const bOversCompleted = bStat ? parseInt((bStat.overs || '0').split('.')[0], 10) : 0;
      const isQuotaReached = !isInitialSetup && maxBowlerLimit !== undefined && maxBowlerLimit < Infinity && bOversCompleted >= maxBowlerLimit;
      if (isQuotaReached) {
        setDuplicateWarning(`⛔ ${player.name} has already bowled ${bStat?.overs || bOversCompleted} overs (max limit is ${maxBowlerLimit} ${maxBowlerLimit === 1 ? 'over' : 'overs'} per bowler).`);
        Alert.alert(
          'Max Overs Quota Reached',
          `${player.name} has already bowled ${bStat?.overs || bOversCompleted} overs (max limit is ${maxBowlerLimit} ${maxBowlerLimit === 1 ? 'over' : 'overs'} per bowler). Please select a different bowler.`
        );
        return;
      }
      if (lastOverBowlerName && player.name.trim().toLowerCase() === lastOverBowlerName.trim().toLowerCase()) {
        setDuplicateWarning(`⛔ ${player.name} bowled the previous over and cannot bowl consecutive overs!`);
        Alert.alert(
          'Consecutive Over Not Allowed',
          `${player.name} bowled the previous over. By cricket rules, the same bowler cannot bowl two consecutive overs. Please select a different bowler.`
        );
        return;
      }
      if (from === batTeamBucket) {
        const batTeamTitle = batTeamBucket === 'teamA' ? labelA : labelB;
        setDuplicateWarning(`⛔ ${player.name} belongs to Batting Team (${batTeamTitle}) and cannot bowl.`);
        return;
      }
      if (from === 'master') {
        moveToBucket(player, 'master', bowlTeamBucket);
      }
      handleSetBowler(player);
    } else {
      if (isInitialSetupMode || from === 'master') {
        moveToBucket(player, from, target as BucketId);
      }
    }
  }, [resolveDropTarget, isPlayerPermanentlyOut, batTeamBucket, bowlTeamBucket, labelA, labelB, lastOverBowlerName, isInitialSetupMode, handleSetStriker, handleSetNonStriker, handleSetBowler, moveToBucket]);

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

      const outCheck = isPlayerPermanentlyOut(trimmed);
      if (outCheck.isOut) {
        setDuplicateWarning(
          `⛔ ${trimmed} was already dismissed (OUT: ${outCheck.reason}) in this match and cannot be added!`
        );
        return;
      }

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
    [isAlreadyIn, isPlayerPermanentlyOut, addWalletFunds]
  );

  const queryClean = (searchQuery || '').trim().toLowerCase();
  const queryDigits = (searchQuery || '').replace(/\D/g, '');
  const queryLooksLikePhone = queryDigits.length >= 6;

  const matchPlayerResults = useMemo(() => {
    if (queryClean.length < 2 && queryDigits.length < 3) return [];
    const results: { player: Player; location: BucketId; locationLabel: string; isOut: boolean; outReason: string }[] = [];

    (buckets.master || []).forEach((p) => {
      if (!p || !p.name) return;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        const outInfo = isPlayerPermanentlyOut(p.name);
        results.push({ player: p, location: 'master', locationLabel: 'Available Pool', isOut: outInfo.isOut, outReason: outInfo.reason });
      }
    });
    (buckets.teamA || []).forEach((p) => {
      if (!p || !p.name) return;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        const outInfo = isTeamABatting ? isPlayerPermanentlyOut(p.name) : { isOut: false, reason: '' };
        results.push({ player: p, location: 'teamA', locationLabel: labelA, isOut: outInfo.isOut, outReason: outInfo.reason });
      }
    });
    (buckets.teamB || []).forEach((p) => {
      if (!p || !p.name) return;
      const pDigits = p.phone ? normalizePhone(p.phone) : '';
      if (p.name.toLowerCase().includes(queryClean) || (queryDigits.length >= 3 && pDigits.includes(queryDigits))) {
        const outInfo = !isTeamABatting ? isPlayerPermanentlyOut(p.name) : { isOut: false, reason: '' };
        results.push({ player: p, location: 'teamB', locationLabel: labelB, isOut: outInfo.isOut, outReason: outInfo.reason });
      }
    });
    return results;
  }, [buckets, queryClean, queryDigits, labelA, labelB, isTeamABatting, isPlayerPermanentlyOut]);

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

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - GHOST_WIDTH / 2 },
      { translateY: dragY.value - GHOST_HEIGHT / 2 },
      { scale: ghostScale.value },
    ],
  }));

  const totalAssigned = (buckets.teamA || []).length + (buckets.teamB || []).length;

  const handleConfirm = () => {
    const sOut = isPlayerPermanentlyOut(strikerName);
    const nsOut = isPlayerPermanentlyOut(nonStrikerName);
    const validStriker = sOut.isOut ? '' : strikerName;
    const validNonStriker = (nsOut.isOut || (validStriker && nonStrikerName.trim().toLowerCase() === validStriker.trim().toLowerCase())) ? '' : nonStrikerName;

    onConfirm(buckets.teamA, buckets.teamB, buckets.master, {
      strikerName: validStriker,
      nonStrikerName: validNonStriker,
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
        <LinearGradient
          colors={goldenGrad as any}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
          {/* Header — dashboard hero card with the team match-up */}
          <View style={styles.header}>
            <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }, Shadows.level2]}>
              <LinearGradient
                colors={[theme.primary + '24', theme.primary + '06', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.heroTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.heroTitleRow}>
                    <ThemedText style={[styles.title, { color: textPrimary }]}>
                      {isInitialSetupMode ? 'Select Playing XI' : 'Manage Squads'}
                    </ThemedText>
                    <View style={[styles.heroBadge, { backgroundColor: theme.primary + '1F' }]}>
                      <ThemedText style={[styles.heroBadgeText, { color: theme.primary }]}>
                        {isInitialSetupMode ? 'PRE-MATCH' : 'LIVE MATCH'}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.subtitle, { color: textSecondary }]} numberOfLines={2}>
                    {isInitialSetupMode
                      ? 'Assign players to both teams · hold to drag or tap to assign'
                      : 'Drag directly into slots or tap player for actions'}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  accessibilityLabel="Close"
                  style={[styles.closeBtn, { backgroundColor: zoneBg, borderColor }]}
                >
                  <Ionicons name="close" size={16} color={textPrimary} />
                </Pressable>
              </View>

              <View style={styles.legend}>
                <LegendPill
                  code={codeA}
                  name={labelA}
                  mascot={teamAMascot}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  textPrimary={textPrimary}
                  roleBadge={isInitialSetupMode ? undefined : (isTeamABatting ? '🏏 Batting' : '🎯 Bowling')}
                  count={(buckets.teamA || []).length}
                  theme={theme}
                />

                {/* Swap Sides Toggle - In-Match Only */}
                {!isInitialSetupMode ? (
                  <View style={styles.swapCol}>
                    <Pressable
                      onPress={handleSwapBatBowl}
                      hitSlop={6}
                      accessibilityLabel="Swap Sides"
                      style={({ pressed }) => [styles.swapBatBowlBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }, Shadows.level1]}
                    >
                      <Ionicons name="swap-horizontal" size={15} color="#ffffff" />
                    </Pressable>
                    <ThemedText style={[styles.swapCaption, { color: theme.primary }]}>SWAP</ThemedText>
                  </View>
                ) : (
                  <View style={[styles.vsBadge, { backgroundColor: zoneBg, borderColor }]}>
                    <ThemedText style={[styles.vsText, { color: textSecondary }]}>VS</ThemedText>
                  </View>
                )}

                <LegendPill
                  code={codeB}
                  name={labelB}
                  mascot={teamBMascot}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  textPrimary={textPrimary}
                  roleBadge={isInitialSetupMode ? undefined : (!isTeamABatting ? '🏏 Batting' : '🎯 Bowling')}
                  count={(buckets.teamB || []).length}
                  theme={theme}
                />
              </View>
            </View>
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
                  backgroundColor: activeDropZone === 'master' ? theme.primary + '0A' : cardBg,
                  borderColor: activeDropZone === 'master' ? theme.primary : borderColor,
                  borderWidth: activeDropZone === 'master' ? 1.5 : 1,
                },
              ]}
            >
              <Pressable
                onPress={() => setIsPoolExpanded((prev) => !prev)}
                style={styles.zoneHeader}
                hitSlop={4}
                accessibilityLabel={isPoolExpanded ? 'Collapse available pool' : 'Expand available pool'}
              >
                <View style={styles.zoneHeaderLeft}>
                  <View style={[styles.zoneIcon, { backgroundColor: theme.primary + '1A' }]}>
                    <Ionicons name="people-outline" size={15} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <ThemedText style={[styles.zoneTitle, { color: textPrimary }]}>Available Pool</ThemedText>
                    <ThemedText style={[styles.zoneSub, { color: textSecondary }]} numberOfLines={1}>
                      {(buckets.master || []).length} unassigned · tap {codeA} / {codeB} to assign
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.chevronBtn, { backgroundColor: zoneBg, borderColor }]}>
                  <Ionicons name={isPoolExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.primary} />
                </View>
              </Pressable>

              {isPoolExpanded && (
                <>
                  {/* Clean Search Input */}
                  <View style={[styles.searchBar, { backgroundColor: zoneBg, borderColor }]}>
                    <Ionicons
                      name={queryLooksLikePhone ? 'call-outline' : 'search-outline'}
                      size={14}
                      color={textSecondary}
                    />
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
                      {matchPlayerResults.map(({ player: p, location, locationLabel, isOut, outReason }) => (
                        <Pressable
                          key={p.id}
                          onPress={() => setSelectedActionPlayer({ player: p, bucketId: location })}
                          style={[
                            styles.suggestRow,
                            { backgroundColor: zoneBg, borderColor: isOut ? '#EF444440' : borderColor },
                            isOut && { opacity: 0.65 },
                          ]}
                        >
                          <Image source={avatarSourceFor(p)} style={[styles.avatarSmall, isOut && { opacity: 0.6 }]} contentFit="cover" />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <ThemedText
                              style={[
                                styles.suggestName,
                                { color: isOut ? textMuted : textPrimary },
                                isOut && { textDecorationLine: 'line-through' },
                              ]}
                              numberOfLines={1}
                            >
                              {p.name}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.suggestMeta,
                                { color: isOut ? '#EF4444' : textSecondary },
                              ]}
                              numberOfLines={1}
                            >
                              {isOut ? `⛔ OUT (${outReason}) · ${locationLabel}` : `${p.phone || 'No phone'} · ${locationLabel}`}
                            </ThemedText>
                          </View>
                          <Ionicons name={isOut ? "lock-closed" : "chevron-forward"} size={14} color={isOut ? '#EF4444' : textMuted} />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {savedPlayerResults.length > 0 && (
                    <View style={styles.suggestList}>
                      {savedPlayerResults.map((s) => {
                        const outCheck = isPlayerPermanentlyOut(s.name);
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => {
                              if (outCheck.isOut) {
                                setDuplicateWarning(`⛔ ${s.name} was already dismissed (OUT: ${outCheck.reason}) in this match and cannot be added back!`);
                                return;
                              }
                              commitPlayer({ name: s.name, phone: s.phone, avatarUrl: s.avatarUrl });
                            }}
                            style={[
                              styles.suggestRow,
                              { backgroundColor: zoneBg, borderColor: outCheck.isOut ? '#EF444440' : borderColor },
                              outCheck.isOut && { opacity: 0.55 },
                            ]}
                          >
                            <Image source={avatarSourceFor(s)} style={[styles.avatarSmall, outCheck.isOut && { opacity: 0.6 }]} contentFit="cover" />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <ThemedText
                                style={[
                                  styles.suggestName,
                                  { color: outCheck.isOut ? textMuted : textPrimary },
                                  outCheck.isOut && { textDecorationLine: 'line-through' },
                                ]}
                                numberOfLines={1}
                              >
                                {s.name}
                              </ThemedText>
                              <ThemedText
                                style={[
                                  styles.suggestMeta,
                                  { color: outCheck.isOut ? '#EF4444' : textSecondary },
                                ]}
                                numberOfLines={1}
                              >
                                {outCheck.isOut
                                  ? `⛔ OUT (${outCheck.reason}) · Dismissed in match`
                                  : `${s.phone || 'Saved Player'} · Tap to Add`}
                              </ThemedText>
                            </View>
                            <Ionicons
                              name={outCheck.isOut ? 'lock-closed' : 'add-circle'}
                              size={16}
                              color={outCheck.isOut ? '#EF4444' : theme.primary}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {directoryResults.length > 0 && (
                    <View style={styles.suggestList}>
                      {directoryResults.map((s) => {
                        const conn = getFoFConnection(s.phone || '');
                        const outCheck = isPlayerPermanentlyOut(s.name);
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => {
                              if (outCheck.isOut) {
                                setDuplicateWarning(`⛔ ${s.name} was already dismissed (OUT: ${outCheck.reason}) in this match and cannot be added back!`);
                                return;
                              }
                              commitPlayer({ name: s.name, phone: s.phone, avatarUrl: s.avatar });
                            }}
                            style={[
                              styles.suggestRow,
                              { backgroundColor: zoneBg, borderColor: outCheck.isOut ? '#EF444440' : borderColor },
                              outCheck.isOut && { opacity: 0.55 },
                            ]}
                          >
                            {s.avatar && (s.avatar.startsWith('http') || s.avatar.startsWith('data:') || s.avatar.startsWith('file:') || s.avatar.startsWith('blob:')) ? (
                              <Image source={{ uri: s.avatar }} style={[styles.avatarSmall, outCheck.isOut && { opacity: 0.6 }]} contentFit="cover" />
                            ) : (
                              <View style={[styles.avatarSmall, { backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center' }]}>
                                <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                                  {getTwoLetterLogo(s.name)}
                                </ThemedText>
                              </View>
                            )}
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <ThemedText
                                style={[
                                  styles.suggestName,
                                  { color: outCheck.isOut ? textMuted : textPrimary },
                                  outCheck.isOut && { textDecorationLine: 'line-through' },
                                ]}
                                numberOfLines={1}
                              >
                                {s.name}
                              </ThemedText>
                              <ThemedText
                                style={[
                                  styles.suggestMeta,
                                  { color: outCheck.isOut ? '#EF4444' : textSecondary },
                                ]}
                                numberOfLines={1}
                              >
                                {outCheck.isOut
                                  ? `⛔ OUT (${outCheck.reason}) · Dismissed in match`
                                  : `${s.phone} · ${conn.degreeBadgeText}`}
                              </ThemedText>
                            </View>
                            <Ionicons
                              name={outCheck.isOut ? 'lock-closed' : 'add-circle'}
                              size={16}
                              color={outCheck.isOut ? '#EF4444' : theme.primary}
                            />
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
                    {displayedMaster.map((player) => {
                      const outInfo = isPlayerPermanentlyOut(player.name);
                      return (
                        <CleanPlayerChip
                          key={player.id}
                          player={player}
                          bucketId="master"
                          cardBg={zoneBg}
                          borderColor={borderColor}
                          textPrimary={textPrimary}
                          textSecondary={textSecondary}
                          theme={theme}
                          isDismissed={outInfo.isOut}
                          dismissalReason={outInfo.reason}
                          roleLabel={outInfo.isOut ? `OUT (${outInfo.reason})` : undefined}
                          onTap={() => setSelectedActionPlayer({ player, bucketId: 'master' })}
                          onRemove={() => handleDeletePlayer(player)}
                          onQuickAssignA={() => {
                            if (isTeamABatting && outInfo.isOut) {
                              setDuplicateWarning(`⛔ ${player.name} is OUT (${outInfo.reason}) and cannot be added to batting team!`);
                              return;
                            }
                            moveToBucket(player, 'master', 'teamA');
                          }}
                          onQuickAssignB={() => {
                            if (!isTeamABatting && outInfo.isOut) {
                              setDuplicateWarning(`⛔ ${player.name} is OUT (${outInfo.reason}) and cannot be added to batting team!`);
                              return;
                            }
                            moveToBucket(player, 'master', 'teamB');
                          }}
                          codeA={codeA}
                          codeB={codeB}
                          dragX={dragX}
                          dragY={dragY}
                          onDragStart={handleDragStart}
                          onDragUpdate={handleDragUpdate}
                          onDragEnd={handleDragEnd}
                          isDragging={draggingPlayer?.id === player.id}
                        />
                      );
                    })}
                    {displayedMaster.length === 0 && !searchQuery.trim() && (
                      <ThemedText style={[styles.emptyLabel, { color: textMuted }]}>
                        No unassigned players. Add new players above.
                      </ThemedText>
                    )}
                  </View>
                </>
              )}
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
              isInitialSetup={isInitialSetupMode}
              maxBowlerLimit={maxBowlerLimit}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              lastOverBowlerName={lastOverBowlerName}
              batsmenStats={batsmenStats}
              bowlerStats={bowlerStats}
              retiredPlayers={retiredPlayers}
              isPlayerPermanentlyOut={isPlayerPermanentlyOut}
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
              isInitialSetup={isInitialSetupMode}
              maxBowlerLimit={maxBowlerLimit}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              lastOverBowlerName={lastOverBowlerName}
              batsmenStats={batsmenStats}
              bowlerStats={bowlerStats}
              retiredPlayers={retiredPlayers}
              isPlayerPermanentlyOut={isPlayerPermanentlyOut}
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

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer — pill actions */}
          <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
            <Pressable
              onPress={isInitialSetupMode ? onSkip : handleClose}
              style={({ pressed }) => [styles.skipBtn, { backgroundColor: zoneBg, borderColor, opacity: pressed ? 0.8 : 1 }]}
            >
              <ThemedText style={[styles.skipText, { color: textSecondary }]}>
                {isInitialSetupMode ? 'Skip for now' : 'Close'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [styles.confirmBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.88 : 1 }, Shadows.level2]}
            >
              <ThemedText style={styles.confirmText} numberOfLines={1}>
                {isInitialSetupMode
                  ? totalAssigned > 0
                    ? `Continue to Match (${totalAssigned})`
                    : 'Continue to Match'
                  : totalAssigned > 0
                    ? `Apply Lineup (${totalAssigned})`
                    : 'Confirm & Resume'}
              </ThemedText>
              <View style={styles.confirmArrow}>
                <Ionicons name="arrow-forward" size={14} color="#ffffff" />
              </View>
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
              isInitialSetup={isInitialSetupMode}
              isTeamABatting={isTeamABatting}
              maxBowlerLimit={maxBowlerLimit}
              labelA={labelA}
              labelB={labelB}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              lastOverBowlerName={lastOverBowlerName}
              batsmenStats={batsmenStats}
              bowlerStats={bowlerStats}
              retiredPlayers={retiredPlayers}
              isPlayerPermanentlyOut={isPlayerPermanentlyOut}
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
              onDeletePlayer={(p) => {
                handleDeletePlayer(p);
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
  isInitialSetup,
  maxBowlerLimit,
  strikerName,
  nonStrikerName,
  bowlerName,
  lastOverBowlerName,
  batsmenStats,
  bowlerStats,
  retiredPlayers,
  isPlayerPermanentlyOut,
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
  onTransferPlayer,
  onRetirePlayer,
  otherTeamCode,
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
  isInitialSetup?: boolean;
  maxBowlerLimit?: number;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  lastOverBowlerName?: string;
  batsmenStats: Record<string, BatsmanLiveStats>;
  bowlerStats: Record<string, BowlerLiveStats>;
  retiredPlayers: { name: string; type: 'Retired Hurt' | 'Retired Out' }[];
  isPlayerPermanentlyOut?: (name?: string | null) => { isOut: boolean; reason: string };
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
  const rawNonStrikerKey = (nonStrikerName || '').trim().toLowerCase();
  const nonStrikerKey = (strikerKey && rawNonStrikerKey === strikerKey) ? '' : rawNonStrikerKey;
  const effectiveNonStrikerName = (strikerKey && rawNonStrikerKey === strikerKey) ? '' : nonStrikerName;
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
          backgroundColor: isZoneHovered ? theme.primary + '0A' : cardBg,
          borderColor: isZoneHovered ? theme.primary : borderColor,
          borderWidth: isZoneHovered ? 1.5 : 1,
        },
      ]}
    >
      {/* Zone Header with Logo */}
      <View style={styles.zoneHeader}>
        <View style={styles.zoneHeaderLeft}>
          <View style={[styles.teamZoneLogoBox, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '33' }]}>
            {teamMascot ? (
              <Image source={getMascotImage(teamMascot)} style={styles.teamZoneLogoImg} contentFit="contain" />
            ) : (
              <ThemedText style={[styles.teamZoneLogoText, { color: theme.primary }]}>
                {teamCode}
              </ThemedText>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ThemedText style={[styles.zoneTitle, { color: textPrimary }]} numberOfLines={1}>
              {teamName}
            </ThemedText>
            <View style={styles.zoneMetaRow}>
              {!isInitialSetup && (
                <View style={[styles.roleTag, { backgroundColor: (isBatting ? '#10B981' : '#F59E0B') + '1F' }]}>
                  <ThemedText style={[styles.roleTagText, { color: isBatting ? '#047857' : '#B45309' }]}>
                    {isBatting ? '🏏 Batting' : '🎯 Bowling'}
                  </ThemedText>
                </View>
              )}
              <ThemedText style={[styles.zoneMeta, { color: textSecondary }]}>
                {uniquePlayers.length} player{uniquePlayers.length === 1 ? '' : 's'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Crease Active Slots (Direct Drag & Drop Targets - In-Match Squad Management Only) */}
      {!isInitialSetup && (
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
                      backgroundColor: isStrikerHovered ? theme.primary + '0D' : cardBg,
                      borderColor: isStrikerHovered ? theme.primary : strikerName ? theme.primary + '55' : borderColor,
                      borderWidth: isStrikerHovered ? 1.5 : 1,
                      borderStyle: strikerName ? 'solid' : 'dashed',
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
                style={[styles.creaseSwapBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              >
                <Ionicons name="swap-horizontal" size={14} color="#ffffff" />
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
                      backgroundColor: isNonStrikerHovered ? theme.primary + '0D' : cardBg,
                      borderColor: isNonStrikerHovered ? theme.primary : effectiveNonStrikerName ? theme.primary + '33' : borderColor,
                      borderWidth: isNonStrikerHovered ? 1.5 : 1,
                      borderStyle: effectiveNonStrikerName ? 'solid' : 'dashed',
                    },
                  ]}
                >
                  <View style={styles.creaseSlotTopRow}>
                    <ThemedText style={[styles.creaseSlotTitle, { color: textSecondary }]}>
                      NON-STRIKER
                    </ThemedText>
                    {effectiveNonStrikerName ? (
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
                    style={[styles.creaseSlotName, { color: effectiveNonStrikerName ? textPrimary : textMuted }]}
                    numberOfLines={1}
                  >
                    {effectiveNonStrikerName || 'Drop Non-Striker'}
                  </ThemedText>
                  {formatBatStats(nonStrikerStats) ? (
                    <ThemedText style={[styles.creaseStatsText, { color: textSecondary }]} numberOfLines={1}>
                      {formatBatStats(nonStrikerStats)}
                    </ThemedText>
                  ) : (
                    <ThemedText style={[styles.creaseStatsMuted, { color: textMuted }]} numberOfLines={1}>
                      {effectiveNonStrikerName ? 'Runner' : 'Drop player here'}
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
                    backgroundColor: isBowlerHovered ? theme.primary + '0D' : cardBg,
                    borderColor: isBowlerHovered ? theme.primary : bowlerName ? '#F59E0B66' : borderColor,
                    borderWidth: isBowlerHovered ? 1.5 : 1,
                    borderStyle: bowlerName ? 'solid' : 'dashed',
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
      )}

      {/* Squad Player Chips */}
      <View style={styles.bubbleWrap}>
        {uniquePlayers.map((player) => {
          const pKey = player.name.trim().toLowerCase();
          const isStriker = !isInitialSetup && isBatting && strikerKey === pKey;
          const isNonStriker = !isInitialSetup && isBatting && nonStrikerKey === pKey;
          const isBowler = !isInitialSetup && !isBatting && bowlerKey === pKey;
          const isLastOverBowler = !isInitialSetup && !isBatting && lastOverBowlerName ? lastOverBowlerName.trim().toLowerCase() === pKey : false;
          const retRec = retiredPlayers.find((r) => r.name.toLowerCase() === pKey);
          const outInfo = !isInitialSetup && isBatting && isPlayerPermanentlyOut ? isPlayerPermanentlyOut(player.name) : { isOut: false, reason: '' };

          const bStat = isBatting ? batsmenStats[pKey] : undefined;
          const bowlStat = !isBatting ? bowlerStats[pKey] : undefined;
          const bOversCompleted = bowlStat ? parseInt((bowlStat.overs || '0').split('.')[0], 10) : 0;
          const isQuotaReached = !isInitialSetup && !isBatting && maxBowlerLimit !== undefined && maxBowlerLimit < Infinity && bOversCompleted >= maxBowlerLimit;

          let roleLabel: string | undefined;
          if (!isInitialSetup) {
            if (outInfo.isOut) {
              roleLabel = `OUT (${outInfo.reason})`;
            } else if (retRec) {
              roleLabel = retRec.type === 'Retired Hurt' ? 'Injured' : 'Retired';
            } else if (isStriker) {
              roleLabel = bStat && (bStat.runs > 0 || bStat.balls > 0) ? `Striker · ${bStat.runs}(${bStat.balls}b)` : 'Striker';
            } else if (isNonStriker) {
              roleLabel = bStat && (bStat.runs > 0 || bStat.balls > 0) ? `Non-Striker · ${bStat.runs}(${bStat.balls}b)` : 'Non-Striker';
            } else if (isQuotaReached) {
              roleLabel = bowlStat && bowlStat.overs !== '0.0' ? `Max Overs (${bowlStat.overs} ov) · ${bowlStat.wickets}/${bowlStat.runs}` : `Max Overs (${maxBowlerLimit} ov)`;
            } else if (isBowler) {
              roleLabel = bowlStat && bowlStat.overs !== '0.0' ? `Bowler · ${bowlStat.wickets}/${bowlStat.runs}` : 'Bowler';
            } else if (isLastOverBowler) {
              roleLabel = bowlStat && bowlStat.overs !== '0.0' ? `Bowled Last Over · ${bowlStat.wickets}/${bowlStat.runs}` : 'Bowled Last Over';
            } else if (bStat && (bStat.runs > 0 || bStat.balls > 0)) {
              roleLabel = `${bStat.runs}(${bStat.balls}b)`;
            } else if (bowlStat && bowlStat.overs !== '0.0') {
              roleLabel = `${bowlStat.wickets}/${bowlStat.runs} (${bowlStat.overs})`;
            }
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
              isDismissed={outInfo.isOut}
              dismissalReason={outInfo.reason}
              isActiveRole={isStriker || isNonStriker || (isBowler && !isQuotaReached)}
              isQuotaReached={isQuotaReached}
              onTap={() => onPlayerTap(player)}
              onRemove={() => onRemovePlayer(player)}
              onSwitchTeam={() => onTransferPlayer(player)}
              otherTeamCode={otherTeamCode}
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
  isDismissed,
  dismissalReason,
  isActiveRole,
  isQuotaReached,
  onTap,
  onRemove,
  onQuickAssignA,
  onQuickAssignB,
  onSwitchTeam,
  otherTeamCode,
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
  isDismissed?: boolean;
  dismissalReason?: string;
  isActiveRole?: boolean;
  isQuotaReached?: boolean;
  onTap: () => void;
  onRemove?: () => void;
  onQuickAssignA?: () => void;
  onQuickAssignB?: () => void;
  onSwitchTeam?: () => void;
  otherTeamCode?: string;
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
        .enabled(!isDismissed && !isQuotaReached)
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
    [player.id, bucketId, isDismissed, isQuotaReached]
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
            borderColor: isDismissed ? '#EF444450' : isQuotaReached ? '#EF444444' : isActiveRole ? theme.primary : borderColor,
            borderWidth: isActiveRole ? 1.5 : 1,
            opacity: isDragging ? 0 : isDismissed ? 0.5 : isQuotaReached ? 0.75 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Image source={avatarSourceFor(player)} style={[styles.avatarSmall, (isDismissed || isQuotaReached) && { opacity: 0.6 }]} contentFit="cover" />
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <ThemedText
              style={[
                styles.chipName,
                { color: isDismissed ? textSecondary : textPrimary },
                isDismissed && { textDecorationLine: 'line-through' },
              ]}
              numberOfLines={1}
            >
              {player.name}
            </ThemedText>
            {isQuotaReached && (
              <Ionicons name="lock-closed" size={10} color="#EF4444" />
            )}
          </View>
          {roleLabel && (
            <ThemedText
              style={[
                styles.chipRoleSub,
                { color: isDismissed || isRetired || isQuotaReached ? '#EF4444' : isActiveRole ? theme.primary : textSecondary },
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
              style={[styles.quickAssignBtn, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '10' }]}
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
              style={[styles.quickAssignBtn, { borderColor: '#3B82F655', backgroundColor: '#3B82F610' }]}
            >
              <ThemedText style={[styles.quickAssignText, { color: '#2563EB' }]}>
                {codeB || 'B'}
              </ThemedText>
            </Pressable>
            {onRemove && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                hitSlop={6}
                style={[
                  styles.chipRemoveBtn,
                  {
                    backgroundColor: '#EF444415',
                    borderRadius: 9999,
                    padding: 2,
                    marginLeft: 2,
                  },
                ]}
                accessibilityLabel="Remove player"
              >
                <Ionicons name="close" size={11} color="#EF4444" />
              </Pressable>
            )}
          </View>
        )}

        {!isMaster && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            {onSwitchTeam && otherTeamCode && !isDismissed ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onSwitchTeam();
                }}
                hitSlop={5}
                style={[
                  styles.teamSwitchBtn,
                  {
                    backgroundColor: theme.primary + '18',
                    borderColor: theme.primary + '44',
                  },
                ]}
                accessibilityLabel={`Switch to ${otherTeamCode}`}
              >
                <Ionicons name="swap-horizontal" size={10} color={theme.primary} />
                <ThemedText style={[styles.teamSwitchText, { color: theme.primary }]}>
                  {otherTeamCode}
                </ThemedText>
              </Pressable>
            ) : null}

            {onRemove && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                hitSlop={6}
                style={styles.chipRemoveBtn}
                accessibilityLabel="Remove player"
              >
                <Ionicons name="close" size={12} color={textSecondary} />
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    </GestureDetector>
  );
}

// ── Clean Legend Pill (team card in the hero) ──────────────────────────────
function LegendPill({
  code,
  name,
  mascot,
  cardBg,
  borderColor,
  textPrimary,
  roleBadge,
  count,
  theme,
}: {
  code: string;
  name: string;
  mascot?: string;
  cardBg: string;
  borderColor: string;
  textPrimary: string;
  roleBadge?: string;
  count: number;
  theme: any;
}) {
  const isBatting = !!roleBadge && roleBadge.includes('Batting');
  return (
    <View style={[styles.legendPill, { backgroundColor: cardBg, borderColor }]}>
      <View style={[styles.legendLogoBox, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '33' }]}>
        {mascot ? (
          <Image source={getMascotImage(mascot)} style={styles.legendMascotImg} contentFit="contain" />
        ) : (
          <ThemedText style={[styles.legendCodeText, { color: theme.primary }]}>{code}</ThemedText>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemedText style={[styles.legendName, { color: textPrimary }]} numberOfLines={1}>
          {name}
        </ThemedText>
        {roleBadge ? (
          <View style={[styles.legendBadge, { backgroundColor: (isBatting ? '#10B981' : '#F59E0B') + '1F' }]}>
            <ThemedText style={[styles.legendBadgeText, { color: isBatting ? '#047857' : '#B45309' }]} numberOfLines={1}>
              {roleBadge}
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={[styles.legendMeta, { color: theme.textSecondary }]}>
            {count} {count === 1 ? 'player' : 'players'}
          </ThemedText>
        )}
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
  isInitialSetup,
  maxBowlerLimit,
  labelA,
  labelB,
  strikerName,
  nonStrikerName,
  bowlerName,
  lastOverBowlerName,
  batsmenStats,
  bowlerStats,
  retiredPlayers,
  isPlayerPermanentlyOut,
  onSetStriker,
  onSetNonStriker,
  onSetBowler,
  onRetireBowler,
  onSwapStrike,
  onRetireClick,
  onUnretire,
  onMoveToTeam,
  onRemoveFromTeam,
  onDeletePlayer,
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
  isInitialSetup?: boolean;
  maxBowlerLimit?: number;
  labelA: string;
  labelB: string;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  lastOverBowlerName?: string;
  batsmenStats: Record<string, BatsmanLiveStats>;
  bowlerStats: Record<string, BowlerLiveStats>;
  retiredPlayers: { name: string; type: 'Retired Hurt' | 'Retired Out' }[];
  isPlayerPermanentlyOut?: (name?: string | null) => { isOut: boolean; reason: string };
  onSetStriker: (p: Player) => void;
  onSetNonStriker: (p: Player) => void;
  onSetBowler: (p: Player) => void;
  onRetireBowler: (p: Player) => void;
  onSwapStrike: () => void;
  onRetireClick: (p: Player) => void;
  onUnretire: (p: Player) => void;
  onMoveToTeam: (p: Player, from: BucketId, to: BucketId) => void;
  onRemoveFromTeam: (p: Player, from: BucketId) => void;
  onDeletePlayer?: (p: Player) => void;
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
  const isLastOverBowler = isBowlingTeam && lastOverBowlerName ? lastOverBowlerName.trim().toLowerCase() === pKey : false;
  const retRec = retiredPlayers.find((r) => r.name.toLowerCase() === pKey);
  const outInfo = isPlayerPermanentlyOut ? isPlayerPermanentlyOut(player.name) : { isOut: false, reason: '' };

  const bStat = batsmenStats[pKey];
  const bowlStat = bowlerStats[pKey];
  const bOversStr = bowlStat?.overs || '0.0';
  const bOversCompleted = parseInt(bOversStr.split('.')[0] || '0', 10);
  const isQuotaReached = !isInitialSetup && isBowlingTeam && maxBowlerLimit !== undefined && maxBowlerLimit < Infinity && bOversCompleted >= maxBowlerLimit;

  const otherBucketId: BucketId = bucketId === 'teamA' ? 'teamB' : 'teamA';
  const otherTeamLabel = bucketId === 'teamA' ? labelB : labelA;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.actionSheet, { backgroundColor: cardBg, borderColor }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.actionSheetHeader, { borderBottomColor: borderColor }]}>
            <View style={[styles.actionSheetAvatarRing, { borderColor: theme.primary }]}>
              <Image source={avatarSourceFor(player)} style={styles.actionSheetAvatar} contentFit="cover" />
            </View>
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
              <View style={styles.profileHead}>
                <View style={[styles.miniPill, { backgroundColor: theme.primary + '1A' }]}>
                  <Ionicons name="person-circle-outline" size={11} color={theme.primary} />
                  <ThemedText style={[styles.miniPillText, { color: theme.primary }]}>Player profile</ThemedText>
                </View>
                <ThemedText style={[styles.profileRole, { color: textSecondary }]} numberOfLines={1}>
                  {player.position || 'All-Rounder'} · {player.skillLevel || 'Intermediate'}
                </ThemedText>
              </View>
              <View style={styles.profileTiles}>
                {[
                  { label: 'H/S', value: `${bStat?.highScore || 78}*` },
                  { label: 'Best Wkts', value: bowlStat?.bestBowling || '3/14' },
                  { label: 'Econ', value: bowlStat?.econ || '6.50' },
                ].map((tile) => (
                  <View key={tile.label} style={[styles.profileTile, { backgroundColor: cardBg, borderColor }]}>
                    <ThemedText style={[styles.profileTileValue, { color: textPrimary }]}>{tile.value}</ThemedText>
                    <ThemedText style={[styles.profileTileLabel, { color: textSecondary }]}>{tile.label}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Live Match Batting Stats (if active or has stats - in-match only) */}
            {!isInitialSetup && bStat && (bStat.runs > 0 || bStat.balls > 0) ? (
              <View style={[styles.actionSheetStatsBox, { backgroundColor: zoneBg, borderColor, borderLeftWidth: 3, borderLeftColor: theme.primary }]}>
                <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                  🏏 LIVE MATCH BATTING
                </ThemedText>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: textPrimary, marginTop: 2 }}>
                  {bStat.runs} runs ({bStat.balls}b) · 4s: {bStat.fours} · 6s: {bStat.sixes} · SR {bStat.sr}
                </ThemedText>
              </View>
            ) : null}

            {/* Live Match Bowling Stats (if active or has stats - in-match only) */}
            {!isInitialSetup && bowlStat && ((bowlStat.overs !== '0.0' && bowlStat.overs !== '') || bowlStat.runs > 0 || bowlStat.wickets > 0) ? (
              <View style={[styles.actionSheetStatsBox, { backgroundColor: zoneBg, borderColor, borderLeftWidth: 3, borderLeftColor: '#F59E0B' }]}>
                <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: '#F59E0B' }}>
                  🎯 LIVE MATCH BOWLING
                </ThemedText>
                <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: textPrimary, marginTop: 2 }}>
                  {bowlStat.overs} ov · {bowlStat.maidens}M · {bowlStat.runs}R · {bowlStat.wickets}W · Econ {bowlStat.econ}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actionSheetList}>
            {isInitialSetup ? (
              <>
                {bucketId === 'master' ? (
                  <>
                    <Pressable
                      onPress={() => {
                        onMoveToTeam(player, 'master', 'teamA');
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="arrow-forward" size={15} color={theme.primary} />
                      <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                        Assign to {labelA}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        onMoveToTeam(player, 'master', 'teamB');
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="arrow-forward" size={15} color={textPrimary} />
                      <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                        Assign to {labelB}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (onDeletePlayer) onDeletePlayer(player);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: '#EF444410', borderColor: '#EF444440' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      <ThemedText style={[styles.sheetActionText, { color: '#EF4444', fontFamily: 'Sora_500Medium' }]}>
                        Remove Player from Pool
                      </ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => {
                        onMoveToTeam(player, bucketId, otherBucketId);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="swap-horizontal" size={15} color={theme.primary} />
                      <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                        Transfer to {otherTeamLabel}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        onRemoveFromTeam(player, bucketId);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                        Remove from Squad
                      </ThemedText>
                    </Pressable>
                  </>
                )}
              </>
            ) : (
              <>
                {isBattingTeam && (
                  <>
                    {outInfo.isOut && (
                      <View style={[styles.actionSheetStatsBox, { backgroundColor: '#EF444415', borderColor: '#EF444450', borderLeftWidth: 3, borderLeftColor: '#EF4444' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="close-circle" size={15} color="#EF4444" />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#EF4444' }}>
                            DISMISSED ({outInfo.reason.toUpperCase()})
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
                          This batsman is out in this innings and cannot bat again or be added to the crease.
                        </ThemedText>
                      </View>
                    )}

                    {retRec && retRec.type === 'Retired Hurt' && (
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

                    {!outInfo.isOut ? (
                      <>
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
                      </>
                    ) : (
                      <View style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor, opacity: 0.55 }]}>
                        <Ionicons name="lock-closed-outline" size={15} color="#EF4444" />
                        <ThemedText style={[styles.sheetActionText, { color: '#EF4444', fontFamily: 'Sora_500Medium' }]}>
                          Batting Disabled (Player is OUT)
                        </ThemedText>
                      </View>
                    )}

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
                    {isQuotaReached && (
                      <View style={[styles.actionSheetStatsBox, { backgroundColor: '#EF444415', borderColor: '#EF444450', borderLeftWidth: 3, borderLeftColor: '#EF4444', marginBottom: 8 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="hand-left" size={15} color="#EF4444" />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#EF4444' }}>
                            MAX OVERS QUOTA REACHED ({maxBowlerLimit} {maxBowlerLimit === 1 ? 'OVER' : 'OVERS'})
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
                          {player.name} has already bowled {bOversStr} overs (max {maxBowlerLimit} {maxBowlerLimit === 1 ? 'over' : 'overs'} per bowler limit). They cannot bowl again in this innings.
                        </ThemedText>
                      </View>
                    )}

                    {isLastOverBowler && !isBowler && !isQuotaReached && (
                      <View style={[styles.actionSheetStatsBox, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B50', borderLeftWidth: 3, borderLeftColor: '#F59E0B', marginBottom: 8 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="alert-circle" size={15} color="#F59E0B" />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#F59E0B' }}>
                            BOWLED PREVIOUS OVER
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
                          In cricket, the same bowler cannot bowl two consecutive overs. Please select a different bowler.
                        </ThemedText>
                      </View>
                    )}

                    <Pressable
                      onPress={() => {
                        if (isQuotaReached) {
                          Alert.alert(
                            'Max Overs Quota Reached',
                            `${player.name} has already bowled ${bOversStr} overs (max limit is ${maxBowlerLimit} ${maxBowlerLimit === 1 ? 'over' : 'overs'} per bowler). Please select a different bowler.`
                          );
                          return;
                        }
                        if (isLastOverBowler && !isBowler) {
                          Alert.alert(
                            'Consecutive Over Not Allowed',
                            `${player.name} bowled the previous over. By cricket rules, the same bowler cannot bowl two consecutive overs. Please select a different bowler.`
                          );
                          return;
                        }
                        onSetBowler(player);
                        onClose();
                      }}
                      style={[
                        styles.sheetActionItem,
                        {
                          backgroundColor: isQuotaReached
                            ? '#EF444410'
                            : isBowler
                              ? theme.primary + '12'
                              : (isLastOverBowler ? '#F59E0B10' : zoneBg),
                          borderColor: isQuotaReached ? '#EF444444' : isLastOverBowler ? '#F59E0B44' : borderColor,
                          opacity: isQuotaReached || (isLastOverBowler && !isBowler) ? 0.6 : 1,
                        }
                      ]}
                    >
                      <Ionicons
                        name={isQuotaReached ? 'lock-closed' : isLastOverBowler && !isBowler ? 'ban-outline' : 'baseball-outline'}
                        size={15}
                        color={isQuotaReached ? '#EF4444' : isLastOverBowler && !isBowler ? '#F59E0B' : theme.primary}
                      />
                      <ThemedText style={[styles.sheetActionText, { color: isQuotaReached ? '#EF4444' : isLastOverBowler && !isBowler ? '#F59E0B' : textPrimary }]}>
                        {isQuotaReached
                          ? `Cannot Bowl (Max ${maxBowlerLimit} ov Reached)`
                          : isBowler
                            ? 'Active Current Bowler'
                            : isLastOverBowler
                              ? 'Cannot Bowl (Bowled Previous Over)'
                              : 'Set as Current Bowler'}
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
                    {outInfo.isOut && (
                      <View style={[styles.actionSheetStatsBox, { backgroundColor: '#EF444415', borderColor: '#EF444450', borderLeftWidth: 3, borderLeftColor: '#EF4444' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="close-circle" size={15} color="#EF4444" />
                          <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: '#EF4444' }}>
                            DISMISSED ({outInfo.reason.toUpperCase()})
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
                          This batsman is out in this innings and cannot bat again or be added to the crease.
                        </ThemedText>
                      </View>
                    )}

                    {!outInfo.isOut ? (
                      <>
                        <Pressable
                          onPress={() => {
                            onSetStriker(player);
                            onClose();
                          }}
                          style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                        >
                          <Ionicons name="flash-outline" size={15} color={theme.primary} />
                          <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                            Set as Striker ({isTeamABatting ? labelA : labelB})
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            onSetNonStriker(player);
                            onClose();
                          }}
                          style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                        >
                          <Ionicons name="walk-outline" size={15} color={theme.primary} />
                          <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                            Set as Non-Striker ({isTeamABatting ? labelA : labelB})
                          </ThemedText>
                        </Pressable>
                      </>
                    ) : (
                      <View style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor, opacity: 0.55 }]}>
                        <Ionicons name="lock-closed-outline" size={15} color="#EF4444" />
                        <ThemedText style={[styles.sheetActionText, { color: '#EF4444', fontFamily: 'Sora_500Medium' }]}>
                          Batting Disabled (Player is OUT)
                        </ThemedText>
                      </View>
                    )}

                    <Pressable
                      onPress={() => {
                        onSetBowler(player);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="baseball-outline" size={15} color={theme.primary} />
                      <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                        Set as Bowler ({!isTeamABatting ? labelA : labelB})
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        onMoveToTeam(player, 'master', 'teamA');
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="arrow-forward" size={15} color={theme.primary} />
                      <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                        Assign to {labelA} ({isTeamABatting ? '🏏 Batting' : '🎯 Bowling'})
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        onMoveToTeam(player, 'master', 'teamB');
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                    >
                      <Ionicons name="arrow-forward" size={15} color={textPrimary} />
                      <ThemedText style={[styles.sheetActionText, { color: textPrimary }]}>
                        Assign to {labelB} ({!isTeamABatting ? '🏏 Batting' : '🎯 Bowling'})
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (onDeletePlayer) onDeletePlayer(player);
                        onClose();
                      }}
                      style={[styles.sheetActionItem, { backgroundColor: '#EF444410', borderColor: '#EF444440' }]}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      <ThemedText style={[styles.sheetActionText, { color: '#EF4444', fontFamily: 'Sora_500Medium' }]}>
                        Remove Player from Pool
                      </ThemedText>
                    </Pressable>
                  </>
                )}

                {bucketId !== 'master' && (
                  <Pressable
                    onPress={() => {
                      onMoveToTeam(player, bucketId, otherBucketId);
                      onClose();
                    }}
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
                    onPress={() => {
                      onRemoveFromTeam(player, bucketId);
                      onClose();
                    }}
                    style={[styles.sheetActionItem, { backgroundColor: zoneBg, borderColor }]}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    <ThemedText style={[styles.sheetActionText, { color: '#EF4444' }]}>
                      Remove from Squad
                    </ThemedText>
                  </Pressable>
                )}
              </>
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
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: textPrimary }}>
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
                <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_500Medium', color: '#EF4444' }}>
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
            <ThemedText style={{ fontSize: 11.5, fontFamily: 'Sora_500Medium', color: textSecondary }}>
              Cancel
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header hero ────────────────────────────────────────────────────────
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xs, paddingBottom: Spacing.sm },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 12, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  heroBadge: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 999 },
  heroBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.8 },
  title: { fontFamily: 'Sora_500Medium', fontSize: 15.5 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 10.5, lineHeight: 14, marginTop: 3 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // ── Team match-up ──────────────────────────────────────────────────────
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  legendPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
  },
  legendLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  legendMascotImg: { width: 24, height: 24 },
  legendCodeText: { fontFamily: 'Sora_500Medium', fontSize: 10.5 },
  legendName: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  legendBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 999, marginTop: 2 },
  legendBadgeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5 },
  legendMeta: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 1 },
  swapCol: { alignItems: 'center', gap: 2 },
  swapBatBowlBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  swapCaption: { fontFamily: 'Sora_500Medium', fontSize: 8, letterSpacing: 0.6 },
  vsBadge: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  vsText: { fontFamily: 'Sora_500Medium', fontSize: 9, letterSpacing: 0.8 },

  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: 2, paddingBottom: Spacing.lg },

  // ── Zone cards ─────────────────────────────────────────────────────────
  zoneCard: {
    borderRadius: CARD_RADIUS,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    ...Shadows.level1,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  zoneHeaderLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  zoneIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  zoneSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  teamZoneLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  teamZoneLogoImg: { width: 26, height: 26 },
  teamZoneLogoText: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  zoneTitle: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  zoneMeta: { fontFamily: 'Sora_400Regular', fontSize: 10 },
  roleTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  roleTagText: { fontFamily: 'Sora_500Medium', fontSize: 9 },

  // ── Crease slots ───────────────────────────────────────────────────────
  creaseBar: {
    borderRadius: 14,
    padding: 6,
    marginBottom: 10,
    borderWidth: 1,
  },
  creaseSlot: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
    minHeight: 58,
    justifyContent: 'center',
  },
  creaseSlotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creaseSlotTitle: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.7 },
  creaseSlotName: { fontFamily: 'Sora_500Medium', fontSize: 12, marginTop: 2 },
  creaseStatsText: { fontFamily: 'Sora_500Medium', fontSize: 9, marginTop: 1.5 },
  creaseStatsMuted: { fontFamily: 'Sora_400Regular', fontSize: 9, marginTop: 1.5 },
  retireBtnText: { fontSize: 9, fontFamily: 'Sora_500Medium', color: '#EF4444' },
  changeBtnText: { fontSize: 9, fontFamily: 'Sora_500Medium' },
  creaseSwapBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },

  // ── Chips ──────────────────────────────────────────────────────────────
  bubbleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 8,
    gap: 6,
    borderWidth: 1,
  },
  avatarSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#00000010' },
  chipName: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  chipRoleSub: { fontFamily: 'Sora_500Medium', fontSize: 8.5 },
  chipRemoveBtn: { padding: 2, marginLeft: 2 },
  teamSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  teamSwitchText: { fontFamily: 'Sora_500Medium', fontSize: 9 },
  quickAssignBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickAssignText: { fontFamily: 'Sora_500Medium', fontSize: 9 },
  emptyLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
  },

  // ── Search ─────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 4,
    height: 38,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 30,
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    includeFontPadding: false,
    paddingVertical: 0,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, paddingHorizontal: 4 },
  warnText: { fontFamily: 'Sora_500Medium', fontSize: 10, flexShrink: 1 },

  // ── Suggestions ────────────────────────────────────────────────────────
  suggestList: { marginBottom: 10, gap: 5 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  suggestName: { fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  suggestMeta: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 1 },
  notFound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  notFoundText: { fontFamily: 'Sora_500Medium', fontSize: 10.5, flex: 1 },

  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  skipBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontFamily: 'Sora_500Medium', fontSize: 12 },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 7,
  },
  confirmText: { flex: 1, textAlign: 'center', fontFamily: 'Sora_500Medium', fontSize: 13, color: '#ffffff' },
  confirmArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

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

  // ── Player action sheet ────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#0000007A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  actionSheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    ...Shadows.level3,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  actionSheetAvatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, padding: 2 },
  actionSheetAvatar: { width: '100%', height: '100%', borderRadius: 20 },
  actionSheetName: { fontFamily: 'Sora_500Medium', fontSize: 14 },
  actionSheetSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
  actionSheetStatsBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  profileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  miniPillText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.5, textTransform: 'uppercase' },
  profileRole: { fontFamily: 'Sora_400Regular', fontSize: 10, flexShrink: 1 },
  profileTiles: { flexDirection: 'row', gap: 6 },
  profileTile: { flex: 1, alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 7 },
  profileTileValue: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  profileTileLabel: { fontFamily: 'Sora_500Medium', fontSize: 8.5, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },
  actionSheetList: { marginTop: 10, gap: 6 },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sheetActionText: { fontFamily: 'Sora_500Medium', fontSize: 12, flexShrink: 1 },

  // ── Retire modal ───────────────────────────────────────────────────────
  retireModal: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    ...Shadows.level3,
  },
  retireIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  retireTitle: { fontFamily: 'Sora_500Medium', fontSize: 14.5, textAlign: 'center' },
  retireSub: { fontFamily: 'Sora_400Regular', fontSize: 10.5, textAlign: 'center', marginTop: 2 },
  retireOptionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 6,
  },
  retireCancelBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
