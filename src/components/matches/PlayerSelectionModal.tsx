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
import { Shadows, Spacing } from '@/constants/theme';
import { AVATAR_KEYS, getAvatarSource } from '@/constants/avatars';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  dedupePlayers,
  generatePlayerId,
  isUsablePhone,
  normalizePhone,
  playerIdentity,
  type Player,
} from '@/store/match-store';
import { useWalletStore } from '@/store/app-store';
import { searchFoFDirectory } from '@/services/fof-network';

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
  /** Short team code, or undefined when `icon` is used instead. */
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color: string;
  hint: string;
  onPress: () => void;
}

const GHOST_WIDTH = 160;
const GHOST_HEIGHT = 40;

/** Warm blush canvas the bubbles sit on (light themes only — see `usePalette`). */
const CANVAS_LIGHT = '#EFE4E0';
/** Slightly deeper blush so a team drop-zone reads as its own area on the canvas. */
const ZONE_LIGHT = '#E7D8D2';

function usePalette() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    theme,
    canvas: isDark ? theme.background : CANVAS_LIGHT,
    zone: isDark ? theme.surfaceLow : ZONE_LIGHT,
    bubble: isDark ? theme.surface : '#FFFFFF',
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
 * Players rarely carry their own `avatarUrl` in a quick match, so fall back to
 * a preset portrait chosen deterministically from the player id — each player
 * then keeps the same face across re-renders and team moves.
 */
const avatarSourceFor = (player: Player) => {
  if (player.avatarUrl) return getAvatarSource(player.avatarUrl);
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
  /** Combined pool of players available to draft (e.g. matched saved-team rosters). */
  initialPool?: Player[];
  initialTeamA?: Player[];
  initialTeamB?: Player[];
  onSkip: () => void;
  onConfirm: (teamA: Player[], teamB: Player[], unassigned: Player[]) => void;
}

export function PlayerSelectionModal({
  visible,
  teamAName,
  teamBName,
  initialPool = [],
  initialTeamA = [],
  initialTeamB = [],
  onSkip,
  onConfirm,
}: PlayerSelectionModalProps) {
  const { theme, canvas, zone, bubble, bubbleText } = usePalette();
  const accentA = theme.primary;
  const accentB = '#E08A3C';

  const labelA = teamAName.trim() || 'Team A';
  const labelB = teamBName.trim() || 'Team B';
  const codeA = shortCode(labelA, 'TA');
  const codeB = shortCode(labelB, 'TB');

  const [buckets, setBuckets] = useState<Buckets>({
    master: initialPool,
    teamA: initialTeamA,
    teamB: initialTeamB,
  });
  // Mobile-number-first entry: one field searches the directory by number or
  // name; `newPlayerPhone` holds a number captured before its owner is named.
  const [playerQuery, setPlayerQuery] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [draggingPlayer, setDraggingPlayer] = useState<Player | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [creditToast, setCreditToast] = useState<string | null>(null);
  /** Numbers already paid out this session — the bonus is once per number. */
  const creditedPhones = useRef<Set<string>>(new Set());
  const { addWalletFunds } = useWalletStore();

  // Re-seed whenever the sheet is (re)opened, so a cancelled session doesn't
  // leak into the next one. Everything is deduped by person (not id) and the
  // already-assigned players are removed from the pool, so nobody can appear in
  // two places at once — the same human is seeded into every team they create
  // and so arrives here once per roster.
  useEffect(() => {
    if (visible) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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
  }, []);

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

  const everyone = useMemo(
    () => [...buckets.master, ...buckets.teamA, ...buckets.teamB],
    [buckets]
  );

  /** Already in this match? Compared on phone-first identity. */
  const isAlreadyIn = useCallback(
    (candidate: { name: string; phone?: string }) => {
      const identity = playerIdentity(candidate);
      return everyone.some((p) => playerIdentity(p) === identity);
    },
    [everyone]
  );

  /**
   * Directory suggestions for the current query. Searching by mobile number is
   * the primary path — `searchFoFDirectory` matches on phone digits (3+) as well
   * as name, and each hit carries its friend-of-friend degree, so adding someone
   * by number also tells you how you know them.
   */
  const suggestions = useMemo(() => {
    const q = playerQuery.trim();
    if (q.length < 3) return [];
    return searchFoFDirectory(q)
      .filter((p) => !isAlreadyIn({ name: p.name, phone: p.phone }))
      .slice(0, 4);
  }, [playerQuery, isAlreadyIn]);

  const queryDigits = playerQuery.replace(/\D/g, '');
  const queryIsPhone = queryDigits.length >= 6;

  /** Adds a player and, when a usable mobile is supplied, pays the 5-credit bonus. */
  const commitPlayer = useCallback(
    (name: string, phone?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (isAlreadyIn({ name: trimmed, phone })) {
        setDuplicateWarning(`${trimmed} is already in this match`);
        return;
      }
      const player: Player = {
        id: generatePlayerId(),
        name: trimmed,
        position: 'Player',
        skillLevel: 'Intermediate',
        ...(isUsablePhone(phone) ? { phone: normalizePhone(phone) } : {}),
      };
      setBuckets((prev) => ({ ...prev, master: [...prev.master, player] }));
      setPlayerQuery('');
      setNewPlayerPhone('');
      setDuplicateWarning(null);

      // The incentive is paid once per number, so re-adding the same person
      // after removing them can't farm credits.
      if (isUsablePhone(phone)) {
        const key = normalizePhone(phone);
        if (!creditedPhones.current.has(key)) {
          creditedPhones.current.add(key);
          addWalletFunds(CREDIT_REWARD);
          setCreditToast(`+${CREDIT_REWARD} credits for adding a mobile number`);
        }
      }
    },
    [isAlreadyIn, addWalletFunds]
  );

  const handleAddTyped = useCallback(() => {
    const q = playerQuery.trim();
    if (!q) return;
    // A bare number needs a name before it can become a player.
    if (queryIsPhone && !newPlayerPhone) {
      setNewPlayerPhone(q);
      setPlayerQuery('');
      return;
    }
    commitPlayer(q, newPlayerPhone);
  }, [playerQuery, queryIsPhone, newPlayerPhone, commitPlayer]);

  /**
   * Every bubble carries explicit one-tap targets for the moves that make
   * sense from where it currently sits, so assigning to a *particular* team is
   * never a guess:
   *   in the pool  -> [ST] [AT]   (assign to either team)
   *   in team A    -> [AT] [x]    (switch to the other team, or send back)
   *   in team B    -> [ST] [x]
   */
  const actionsFor = useCallback(
    (player: Player, from: BucketId): BubbleAction[] => {
      const toA: BubbleAction = {
        key: 'a',
        label: codeA,
        color: accentA,
        hint: `Add ${player.name} to ${labelA}`,
        onPress: () => moveToBucket(player, from, 'teamA'),
      };
      const toB: BubbleAction = {
        key: 'b',
        label: codeB,
        color: accentB,
        hint: `Add ${player.name} to ${labelB}`,
        onPress: () => moveToBucket(player, from, 'teamB'),
      };
      const remove: BubbleAction = {
        key: 'x',
        icon: 'close',
        color: theme.textSecondary,
        hint: `Remove ${player.name} from this team`,
        onPress: () => moveToBucket(player, from, 'master'),
      };

      if (from === 'master') return [toA, toB];
      if (from === 'teamA') return [toB, remove];
      return [toA, remove];
    },
    [codeA, codeB, accentA, accentB, labelA, labelB, theme.textSecondary, moveToBucket]
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
    onConfirm(buckets.teamA, buckets.teamB, buckets.master);
  };

  if (!visible) return null;

  const zoneCommon = {
    draggingId: draggingPlayer?.id ?? null,
    dragX,
    dragY,
    registerRef: (id: BucketId, node: View | null) => { bucketRefs.current[id] = node; },
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    actionsFor,
    bubble,
    bubbleText,
    textSecondary: theme.textSecondary,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onSkip} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: canvas }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.title, { color: bubbleText }]}>Select Players</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                Tap a team code to assign · hold to drag
              </ThemedText>
            </View>
            <Pressable
              onPress={onSkip}
              hitSlop={8}
              accessibilityLabel="Close"
              style={[styles.closeBtn, { backgroundColor: bubble }]}
            >
              <Ionicons name="close" size={15} color={bubbleText} />
            </Pressable>
          </View>

          {/* Legend — ties each team to its code + colour once, so the small
              per-bubble buttons don't need to repeat the full team name. */}
          <View style={styles.legend}>
            <LegendPill code={codeA} name={labelA} color={accentA} bubble={bubble} text={bubbleText} />
            <LegendPill code={codeB} name={labelB} color={accentB} bubble={bubble} text={bubbleText} />
          </View>

          <ScrollView
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Master pool — bubbles sit straight on the canvas ── */}
            <PlayerZone
              {...zoneCommon}
              id="master"
              title="Available Players"
              meta={`${buckets.master.length} unassigned`}
              players={buckets.master}
              emptyLabel="No players yet — add one below."
            >
              {/* A captured number waiting for its owner's name. */}
              {newPlayerPhone !== '' && (
                <View style={[styles.phoneChip, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '44' }]}>
                  <Ionicons name="call" size={11} color={theme.primary} />
                  <ThemedText style={[styles.phoneChipText, { color: theme.primary }]}>
                    {newPlayerPhone}
                  </ThemedText>
                  <Pressable onPress={() => setNewPlayerPhone('')} hitSlop={6} accessibilityLabel="Clear mobile number">
                    <Ionicons name="close-circle" size={13} color={theme.primary} />
                  </Pressable>
                </View>
              )}

              <View style={[styles.addRow, { backgroundColor: bubble }]}>
                <Ionicons
                  name={queryIsPhone ? 'call-outline' : 'search-outline'}
                  size={14}
                  color={theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <TextInput
                  value={playerQuery}
                  onChangeText={(t) => { setPlayerQuery(t); if (duplicateWarning) setDuplicateWarning(null); }}
                  placeholder={newPlayerPhone ? 'Name for this number' : 'Mobile number or name'}
                  placeholderTextColor={theme.placeholder}
                  keyboardType={newPlayerPhone ? 'default' : 'default'}
                  style={[
                    styles.addInput,
                    { color: bubbleText },
                    Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
                  ]}
                  onSubmitEditing={handleAddTyped}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={handleAddTyped}
                  disabled={!playerQuery.trim()}
                  accessibilityLabel={queryIsPhone && !newPlayerPhone ? 'Use this mobile number' : 'Add player'}
                  style={[
                    styles.addBtn,
                    { backgroundColor: playerQuery.trim() ? theme.primary : theme.outlineVariant },
                  ]}
                >
                  <Ionicons
                    name={queryIsPhone && !newPlayerPhone ? 'arrow-forward' : 'add'}
                    size={15}
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              {/* Directory matches — searching by number is the primary path. */}
              {suggestions.length > 0 && (
                <View style={styles.suggestList}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => commitPlayer(s.name, s.phone)}
                      style={({ pressed }) => [
                        styles.suggestRow,
                        { backgroundColor: bubble, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <ThemedText style={[styles.suggestName, { color: bubbleText }]} numberOfLines={1}>
                          {s.name}
                        </ThemedText>
                        <ThemedText style={[styles.suggestMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                          {s.phone} · {s.team}
                        </ThemedText>
                      </View>
                      <Ionicons name="add-circle" size={18} color={theme.primary} />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Incentive — why giving a number is worth it. */}
              <View style={[styles.incentive, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }]}>
                <Ionicons name="gift" size={13} color={theme.primary} />
                <ThemedText style={[styles.incentiveText, { color: theme.primary }]}>
                  Get {CREDIT_REWARD} credits upon entering your mobile number
                </ThemedText>
              </View>
              <ThemedText style={[styles.incentiveSub, { color: theme.textSecondary }]}>
                Optional — but it syncs the squad, keeps score history, and connects friends of friends.
              </ThemedText>

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

            {/* ── Team zones, stacked full width ── */}
            <PlayerZone
              {...zoneCommon}
              id="teamA"
              title={labelA}
              meta={`${buckets.teamA.length} player${buckets.teamA.length === 1 ? '' : 's'}`}
              players={buckets.teamA}
              emptyLabel={`Tap ${codeA} on a player, or drag them here`}
              zoneBg={zone}
              accent={accentA}
            />

            <PlayerZone
              {...zoneCommon}
              id="teamB"
              title={labelB}
              meta={`${buckets.teamB.length} player${buckets.teamB.length === 1 ? '' : 's'}`}
              players={buckets.teamB}
              emptyLabel={`Tap ${codeB} on a player, or drag them here`}
              zoneBg={zone}
              accent={accentB}
            />
          </ScrollView>

          {/* Footer actions */}
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
                {totalAssigned > 0 ? `Confirm Lineup (${totalAssigned})` : 'Confirm Lineup'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Floating drag ghost */}
          {draggingPlayer && (
            <Animated.View
              pointerEvents="none"
              style={[styles.ghost, ghostStyle, { backgroundColor: bubble }]}
            >
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

function LegendPill({
  code,
  name,
  color,
  bubble,
  text,
}: {
  code: string;
  name: string;
  color: string;
  bubble: string;
  text: string;
}) {
  return (
    <View style={[styles.legendPill, { backgroundColor: bubble }]}>
      <View style={[styles.legendCode, { backgroundColor: color }]}>
        <ThemedText style={styles.legendCodeText}>{code}</ThemedText>
      </View>
      <ThemedText style={[styles.legendName, { color: text }]} numberOfLines={1}>
        {name}
      </ThemedText>
    </View>
  );
}

/** One white pill: round portrait + name + explicit assign/remove buttons. */
function PlayerBubble({
  player,
  bucketId,
  isDragging,
  bubble,
  bubbleText,
  actions,
  dragX,
  dragY,
  onDragStart,
  onDragEnd,
}: {
  player: Player;
  bucketId: BucketId;
  isDragging: boolean;
  bubble: string;
  bubbleText: string;
  actions: BubbleAction[];
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  onDragStart: (player: Player, from: BucketId) => void;
  onDragEnd: (player: Player, from: BucketId, x: number, y: number) => void;
}) {
  // Drag only activates on a long press, so quick taps fall through to the
  // action buttons below rather than fighting them for the gesture.
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
      <View style={[styles.bubble, { backgroundColor: bubble, opacity: isDragging ? 0 : 1 }]}>
        <Image source={avatarSourceFor(player)} style={styles.avatar} contentFit="cover" />
        <ThemedText style={[styles.bubbleName, { color: bubbleText }]} numberOfLines={1}>
          {player.name}
        </ThemedText>
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
      </View>
    </GestureDetector>
  );
}

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
  actionsFor,
  emptyLabel,
  bubble,
  bubbleText,
  textSecondary,
  zoneBg,
  accent,
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
  actionsFor: (player: Player, from: BucketId) => BubbleAction[];
  emptyLabel: string;
  bubble: string;
  bubbleText: string;
  textSecondary: string;
  /** Filled drop-zone tint. Omit for the pool, whose bubbles sit bare on the canvas. */
  zoneBg?: string;
  accent?: string;
  children?: React.ReactNode;
}) {
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
        <ThemedText style={[styles.zoneMeta, { color: textSecondary }]}>{meta}</ThemedText>
      </View>

      <View style={styles.bubbleWrap}>
        {players.map((player) => (
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
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {players.length === 0 && (
          <ThemedText style={[styles.emptyLabel, { color: textSecondary }]}>{emptyLabel}</ThemedText>
        )}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  title: { fontFamily: 'Sora_500Medium', fontSize: 14.5, letterSpacing: -0.2 },
  subtitle: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 2 },
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
    paddingRight: 10,
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
  legendCodeText: { fontFamily: 'Sora_500Medium', fontSize: 8.5, color: '#ffffff' },
  legendName: { fontFamily: 'Sora_500Medium', fontSize: 10, flexShrink: 1 },

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
  zoneTitle: { fontFamily: 'Sora_500Medium', fontSize: 11.5, flexShrink: 1 },
  zoneMeta: { fontFamily: 'Sora_500Medium', fontSize: 9.5, marginLeft: 'auto' },

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
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionBtn: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontFamily: 'Sora_500Medium', fontSize: 8, color: '#ffffff' },
  emptyLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: 2,
  },

  // ── Add-player row (pill, matching the bubbles) ────────────────────────
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingLeft: 14,
    paddingRight: 3,
    paddingVertical: 3,
    marginTop: Spacing.sm,
    ...Shadows.level1,
  },
  addInput: { flex: 1, height: 30, fontFamily: 'Sora_500Medium', fontSize: 11.5 },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, paddingHorizontal: 4 },
  warnText: { fontFamily: 'Sora_600SemiBold', fontSize: 10.5, flexShrink: 1 },
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  skipBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 6 },
  skipText: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 9999,
    ...Shadows.primary,
  },
  confirmText: { fontFamily: 'Sora_500Medium', fontSize: 12, color: '#ffffff' },

  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: GHOST_HEIGHT,
    maxWidth: GHOST_WIDTH,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 3,
    paddingRight: 12,
    gap: 6,
    ...Shadows.level3,
    zIndex: 999,
  },
});
