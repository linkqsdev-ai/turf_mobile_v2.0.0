/**
 * squad-modals.tsx
 *
 * The three squad-management popups used across the scoring console. They are
 * deliberately built on ONE shell (`SquadModalShell`) and ONE responsive type
 * ramp (`useTypeRamp`, see lib/typography.ts) so every squad interaction has the
 * same header, body rhythm, footer and text sizing — the structural consistency
 * the console previously lacked, where each modal hand-rolled its own paddings
 * and font sizes. No literal `fontSize` appears below.
 *
 * Entrance animation goes through `@/components/motion`, which resolves to
 * Framer Motion + GSAP on web and Moti/Reanimated on native.
 *
 * The three are a non-overlapping taxonomy:
 *
 *   Swap   — exchange two players who are BOTH already in a slot
 *            (striker <-> non-striker, playing XI <-> bench).
 *   Change — replace whoever holds one slot with someone from the bench.
 *            One-way substitution; the outgoing player returns to the bench.
 *   Edit   — modify a player's own details (name, role, jersey, avatar).
 *            Nobody moves; only the person's record changes.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { MotionView } from '@/components/motion';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { AVATAR_KEYS, getAvatarSource } from '@/constants/avatars';
import { useTheme } from '@/hooks/use-theme';
import { useTypeRamp } from '@/lib/typography';

export interface SquadPlayer {
  id?: string;
  name: string;
  /** Playing role — "Batsman", "Bowler", "All-Rounder", "Keeper". */
  role?: string;
  jerseyNumber?: number | string;
  avatarUrl?: string;
}

/** Squad lists in the console hold either a bare name or a full object. */
export function normalizePlayer(entry: unknown): SquadPlayer | null {
  if (!entry) return null;
  if (typeof entry === 'string') return entry.trim() ? { name: entry.trim() } : null;
  if (typeof entry === 'object') {
    const o = entry as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    if (!name) return null;
    return {
      id: typeof o.id === 'string' ? o.id : undefined,
      name,
      role: typeof o.role === 'string' ? o.role : (typeof o.position === 'string' ? o.position : undefined),
      jerseyNumber: (typeof o.jerseyNumber === 'number' || typeof o.jerseyNumber === 'string')
        ? o.jerseyNumber
        : undefined,
      avatarUrl: typeof o.avatarUrl === 'string' ? o.avatarUrl : undefined,
    };
  }
  return null;
}

const avatarFor = (player: SquadPlayer) => {
  if (player.avatarUrl) return getAvatarSource(player.avatarUrl);
  const key = player.id || player.name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return getAvatarSource(AVATAR_KEYS[hash % AVATAR_KEYS.length]);
};

export const SQUAD_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Keeper'] as const;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared shell — every squad popup is structurally identical                */
/* ────────────────────────────────────────────────────────────────────────── */

function SquadModalShell({
  visible,
  onClose,
  icon,
  title,
  subtitle,
  primaryLabel,
  primaryEnabled = true,
  onPrimary,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryEnabled?: boolean;
  onPrimary: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const type = useTypeRamp();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Tapping the scrim dismisses, matching the app's other sheets. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        {/* MotionView routes to Framer Motion + GSAP on web and Moti/Reanimated
            on native, so the entrance is identical on both without importing a
            DOM-only animation library into a shared component. */}
        <MotionView preset="scale-in" duration={0.22} animateKey={title} style={styles.sheetWrap}>
          <View style={[styles.sheet, { backgroundColor: theme.surfaceLowest }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '33' }]}>
              <View style={[styles.headerIcon, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name={icon} size={15} color={theme.primary} />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={[type.title, { color: theme.text }]} numberOfLines={1}>
                  {title}
                </ThemedText>
                <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]} numberOfLines={2}>
                  {subtitle}
                </ThemedText>
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close" style={styles.closeBtn}>
                <Ionicons name="close" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '33' }]}>
              <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost, { borderColor: theme.outlineVariant + '66' }]}>
                <ThemedText style={[type.bodyStrong, { color: theme.textSecondary }]} numberOfLines={1}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={onPrimary}
                disabled={!primaryEnabled}
                style={[
                  styles.btn,
                  styles.btnPrimary,
                  { backgroundColor: primaryEnabled ? theme.primary : theme.outlineVariant },
                ]}
              >
                <ThemedText style={[type.bodyStrong, { color: '#ffffff' }]} numberOfLines={1}>
                  {primaryLabel}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </MotionView>
      </View>
    </Modal>
  );
}

/** Shared row used by all three popups so a player always looks the same. */
function PlayerRow({
  player,
  selected,
  onPress,
  trailing,
  dense,
}: {
  player: SquadPlayer;
  selected?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
  dense?: boolean;
}) {
  const theme = useTheme();
  const type = useTypeRamp();
  const body = (
    <View
      style={[
        styles.playerRow,
        dense && styles.playerRowDense,
        {
          backgroundColor: selected ? theme.primary + '14' : theme.surfaceLow,
          borderColor: selected ? theme.primary : 'transparent',
        },
      ]}
    >
      <Image source={avatarFor(player)} style={styles.rowAvatar} contentFit="cover" />
      {/* minWidth:0 is what actually lets the text truncate inside a flex row —
          without it a long name pushes the trailing badge out of the card. */}
      <View style={styles.rowText}>
        <ThemedText style={[type.body, { color: theme.text }]} numberOfLines={1}>
          {player.name}
        </ThemedText>
        {(player.role || player.jerseyNumber !== undefined) && (
          <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]} numberOfLines={1}>
            {[player.role, player.jerseyNumber !== undefined ? `#${player.jerseyNumber}` : null]
              .filter(Boolean)
              .join(' · ')}
          </ThemedText>
        )}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const type = useTypeRamp();
  return (
    <ThemedText style={[type.micro, styles.sectionLabel, { color: theme.textSecondary }]}>
      {children}
    </ThemedText>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  1. SWAP — exchange two players who are both already in a slot             */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SwapPlayersModalProps {
  visible: boolean;
  onClose: () => void;
  /** e.g. "Swap Strike" or "Swap With Bench". */
  title?: string;
  leftLabel: string;
  rightLabel: string;
  left: SquadPlayer | null;
  right: SquadPlayer | null;
  /** Optional bench — when given, the right side becomes a pick list. */
  benchOptions?: SquadPlayer[];
  onConfirm: (left: SquadPlayer, right: SquadPlayer) => void;
}

export function SwapPlayersModal({
  visible,
  onClose,
  title = 'Swap Players',
  leftLabel,
  rightLabel,
  left,
  right,
  benchOptions,
  onConfirm,
}: SwapPlayersModalProps) {
  const theme = useTheme();
  const type = useTypeRamp();
  const [picked, setPicked] = useState<SquadPlayer | null>(right);

  useEffect(() => {
    if (visible) setPicked(right);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const usingBench = Array.isArray(benchOptions) && benchOptions.length > 0;
  const target = usingBench ? picked : right;
  const canSwap = Boolean(left && target);

  return (
    <SquadModalShell
      visible={visible}
      onClose={onClose}
      icon="swap-horizontal"
      title={title}
      subtitle={usingBench ? 'Pick who comes in — the two exchange places' : 'The two players exchange places'}
      primaryLabel="Swap"
      primaryEnabled={canSwap}
      onPrimary={() => { if (left && target) onConfirm(left, target); }}
    >
      <SectionLabel>{leftLabel.toUpperCase()}</SectionLabel>
      {left ? <PlayerRow player={left} /> : <EmptySlot label="No player in this slot" />}

      <View style={styles.swapDivider}>
        <View style={[styles.swapLine, { backgroundColor: theme.outlineVariant + '55' }]} />
        <View style={[styles.swapBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
          <Ionicons name="swap-vertical" size={13} color={theme.primary} />
        </View>
        <View style={[styles.swapLine, { backgroundColor: theme.outlineVariant + '55' }]} />
      </View>

      <SectionLabel>{rightLabel.toUpperCase()}</SectionLabel>
      {usingBench ? (
        <View style={{ gap: 6 }}>
          {benchOptions!.map((p, i) => (
            <PlayerRow
              key={p.id || `${p.name}-${i}`}
              player={p}
              selected={picked?.name === p.name}
              onPress={() => setPicked(p)}
              trailing={
                picked?.name === p.name
                  ? <Ionicons name="checkmark-circle" size={17} color={theme.primary} />
                  : undefined
              }
            />
          ))}
        </View>
      ) : right ? (
        <PlayerRow player={right} />
      ) : (
        <EmptySlot label="No player in this slot" />
      )}
    </SquadModalShell>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  2. CHANGE — replace one slot's holder with a bench player                 */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ChangePlayerModalProps {
  visible: boolean;
  onClose: () => void;
  /** e.g. "Change Bowler" / "Substitute Batsman". */
  title?: string;
  /** What the slot is called, e.g. "Current bowler". */
  slotLabel: string;
  current: SquadPlayer | null;
  bench: SquadPlayer[];
  /** Reason shown under the title, e.g. "Over complete — pick the next bowler". */
  reason?: string;
  onConfirm: (incoming: SquadPlayer) => void;
  /** Optional escape hatch to the "create a new player" flow. */
  onCreateNew?: () => void;
}

export function ChangePlayerModal({
  visible,
  onClose,
  title = 'Change Player',
  slotLabel,
  current,
  bench,
  reason,
  onConfirm,
  onCreateNew,
}: ChangePlayerModalProps) {
  const theme = useTheme();
  const type = useTypeRamp();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<SquadPlayer | null>(null);

  useEffect(() => {
    if (visible) { setQuery(''); setPicked(null); }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = bench.filter(p => p.name && p.name !== current?.name);
    return q ? pool.filter(p => p.name.toLowerCase().includes(q)) : pool;
  }, [bench, query, current]);

  return (
    <SquadModalShell
      visible={visible}
      onClose={onClose}
      icon="repeat"
      title={title}
      subtitle={reason || 'Pick a replacement from the bench'}
      primaryLabel="Confirm"
      primaryEnabled={Boolean(picked)}
      onPrimary={() => { if (picked) onConfirm(picked); }}
    >
      <SectionLabel>{slotLabel.toUpperCase()}</SectionLabel>
      {current ? (
        <PlayerRow
          player={current}
          trailing={
            <View style={[styles.outTag, { backgroundColor: theme.error + '1F' }]}>
              <ThemedText style={[type.micro, { color: theme.error }]}>OUT</ThemedText>
            </View>
          }
        />
      ) : (
        <EmptySlot label="Slot is empty" />
      )}

      <SectionLabel>{`AVAILABLE (${filtered.length})`}</SectionLabel>

      <View style={[styles.search, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
        <Ionicons name="search" size={14} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search bench"
          placeholderTextColor={theme.placeholder}
          style={[
            styles.searchInput,
            type.body,
            { color: theme.text },
            Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
          ]}
        />
      </View>

      <View style={{ gap: 6 }}>
        {filtered.map((p, i) => (
          <PlayerRow
            key={p.id || `${p.name}-${i}`}
            player={p}
            selected={picked?.name === p.name}
            onPress={() => setPicked(p)}
            trailing={
              picked?.name === p.name
                ? <Ionicons name="checkmark-circle" size={17} color={theme.primary} />
                : undefined
            }
          />
        ))}
        {filtered.length === 0 && (
          <EmptySlot label={query ? 'No one matches that search' : 'Bench is empty'} />
        )}
      </View>

      {onCreateNew && (
        <Pressable
          onPress={onCreateNew}
          style={[styles.createRow, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '0D' }]}
        >
          <Ionicons name="add-circle-outline" size={15} color={theme.primary} />
          <ThemedText style={[type.bodyStrong, { color: theme.primary }]}>Add a new player</ThemedText>
        </Pressable>
      )}
    </SquadModalShell>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. EDIT — change a player's own details; nobody moves slots               */
/* ────────────────────────────────────────────────────────────────────────── */

export interface EditPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  player: SquadPlayer | null;
  onSave: (updated: SquadPlayer) => void;
}

export function EditPlayerModal({ visible, onClose, player, onSave }: EditPlayerModalProps) {
  const theme = useTheme();
  const type = useTypeRamp();
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(SQUAD_ROLES[0]);
  const [jersey, setJersey] = useState('');
  const [avatarKey, setAvatarKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible && player) {
      setName(player.name || '');
      setRole(player.role && SQUAD_ROLES.includes(player.role as any) ? player.role : SQUAD_ROLES[0]);
      setJersey(player.jerseyNumber !== undefined ? String(player.jerseyNumber) : '');
      setAvatarKey(player.avatarUrl);
    }
  }, [visible, player]);

  const trimmed = name.trim();

  return (
    <SquadModalShell
      visible={visible}
      onClose={onClose}
      icon="create-outline"
      title="Edit Player"
      subtitle="Update details — this does not change who is batting or bowling"
      primaryLabel="Save"
      primaryEnabled={trimmed.length > 0}
      onPrimary={() => {
        if (!trimmed) return;
        onSave({
          ...(player || {}),
          name: trimmed,
          role,
          jerseyNumber: jersey.trim() ? jersey.trim() : undefined,
          avatarUrl: avatarKey,
        });
      }}
    >
      <SectionLabel>NAME</SectionLabel>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Player name"
        placeholderTextColor={theme.placeholder}
        style={[
          styles.input,
          type.body,
          { color: theme.text, backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
          Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
        ]}
      />

      <SectionLabel>ROLE</SectionLabel>
      <View style={styles.chipWrap}>
        {SQUAD_ROLES.map(r => {
          const on = role === r;
          return (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? theme.primary : theme.surfaceLow,
                  borderColor: on ? theme.primary : theme.outlineVariant + '44',
                },
              ]}
            >
              <ThemedText style={[type.small, { color: on ? '#ffffff' : theme.textSecondary }]}>{r}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>JERSEY NUMBER</SectionLabel>
      <TextInput
        value={jersey}
        onChangeText={(t) => setJersey(t.replace(/[^0-9]/g, '').slice(0, 3))}
        placeholder="e.g. 7"
        keyboardType="number-pad"
        placeholderTextColor={theme.placeholder}
        style={[
          styles.input,
          type.body,
          { color: theme.text, backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
          Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
        ]}
      />

      <SectionLabel>AVATAR</SectionLabel>
      <View style={styles.avatarGrid}>
        {AVATAR_KEYS.slice(0, 12).map(key => {
          const on = avatarKey === key;
          return (
            <Pressable key={key} onPress={() => setAvatarKey(key)}>
              <Image
                source={getAvatarSource(key)}
                style={[
                  styles.avatarChoice,
                  { borderColor: on ? theme.primary : 'transparent', borderWidth: on ? 2 : 0 },
                ]}
                contentFit="cover"
              />
            </Pressable>
          );
        })}
      </View>
    </SquadModalShell>
  );
}

function EmptySlot({ label }: { label: string }) {
  const theme = useTheme();
  const type = useTypeRamp();
  return (
    <View style={[styles.emptySlot, { borderColor: theme.outlineVariant + '55' }]}>
      <ThemedText style={[type.small, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  /**
   * Height chain that keeps the body scrollable instead of clipped:
   *   sheetWrap  caps the whole popup (maxHeight lives HERE, on the animated
   *              wrapper, because a percentage maxHeight on a shrink-wrapped
   *              child of it resolved against the wrong box and let the body
   *              run under the footer);
   *   sheet      flexShrink:1 so it gives way rather than overflowing;
   *   bodyScroll flexShrink:1 so the ScrollView takes the leftover space
   *              between the fixed header and footer and scrolls inside it.
   */
  sheetWrap: { width: '100%', maxWidth: 460, alignSelf: 'center', maxHeight: '100%' },
  sheet: {
    borderRadius: BorderRadius.xl,
    flexShrink: 1,
    overflow: 'hidden',
    ...Shadows.level3,
  },
  // flexShrink lets a long title ellipsize instead of pushing the close button
  // off the edge — the overflow this header used to have with long team names.
  headerText: { flex: 1, flexShrink: 1, minWidth: 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
  },
  headerIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },

  bodyScroll: { flexShrink: 1 },
  body: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },

  sectionLabel: { letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: 5 },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  playerRowDense: { paddingVertical: 5 },
  rowAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#00000010' },
  rowText: { flex: 1, minWidth: 0 },

  outTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full },

  swapDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: Spacing.md },
  swapLine: { flex: 1, height: 1 },
  swapBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, height: 34, paddingVertical: 0 },

  input: {
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 11,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  avatarChoice: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00000010' },

  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 10,
  },

  emptySlot: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
  },

  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: BorderRadius.lg,
  },
  btnGhost: { borderWidth: 1 },
  btnPrimary: {},
});
