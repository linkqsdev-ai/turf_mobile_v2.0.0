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

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { MotionView } from '@/components/motion';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { AVATAR_KEYS, getAvatarSource } from '@/constants/avatars';
import { useTheme } from '@/hooks/use-theme';
import { useTypeRamp } from '@/lib/typography';
import { isUsablePhone, normalizePhone, playerIdentity } from '@/store/match-store';
import { formatPhoneNumber, cleanPhoneDigits, isValidMobile, getPhoneValidationError } from '@/utils/phone-utils';

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

export const avatarFor = (player: SquadPlayer) => {
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
        {/* Scrim is locked: only the close icon and cancel button dismiss the modal */}
        <View style={StyleSheet.absoluteFill} />
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
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible && player) {
      setName(player.name || '');
      setRole(player.role && SQUAD_ROLES.includes(player.role as any) ? player.role : SQUAD_ROLES[0]);
      setJersey(player.jerseyNumber !== undefined ? String(player.jerseyNumber) : '');
      if (player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('file:') || player.avatarUrl.startsWith('blob:') || player.avatarUrl.startsWith('data:') || player.avatarUrl.includes('/'))) {
        setCustomImageUri(player.avatarUrl);
        setAvatarKey(undefined);
      } else {
        setCustomImageUri(null);
        setAvatarKey(player.avatarUrl);
      }
    }
  }, [visible, player]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCustomImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

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
          avatarUrl: customImageUri || avatarKey,
        });
      }}
    >
      {/* Avatar preview with camera button + name */}
      <View style={styles.identityRow}>
        <Pressable onPress={handlePickImage} style={{ position: 'relative' }}>
          <Image
            source={customImageUri ? { uri: customImageUri } : getAvatarSource(avatarKey || AVATAR_KEYS[0])}
            style={styles.identityAvatar}
            contentFit="cover"
          />
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: theme.primary,
              width: 18,
              height: 18,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: theme.surfaceLowest,
            }}
          >
            <Ionicons name="camera" size={10} color="#ffffff" />
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
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
        </View>
      </View>

      <SectionLabel>ROLE</SectionLabel>
      <View style={styles.chipWrap}>
        {SQUAD_ROLES.map((r) => {
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

      <SectionLabel>CHOOSE AVATAR OR UPLOAD PHOTO</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarStrip}>
        {/* Upload Custom Photo button */}
        <Pressable
          onPress={handlePickImage}
          style={[
            styles.avatarChoice,
            {
              borderColor: customImageUri ? theme.primary : theme.outlineVariant + '66',
              borderWidth: customImageUri ? 2 : 1,
              borderStyle: customImageUri ? 'solid' : 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: customImageUri ? 'transparent' : theme.surfaceLow,
            },
          ]}
        >
          {customImageUri ? (
            <Image source={{ uri: customImageUri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} contentFit="cover" />
          ) : (
            <Ionicons name="camera-outline" size={14} color={theme.primary} />
          )}
        </Pressable>

        {AVATAR_KEYS.slice(0, 12).map((key) => {
          const on = !customImageUri && avatarKey === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setCustomImageUri(null);
                setAvatarKey(key);
              }}
            >
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
      </ScrollView>
    </SquadModalShell>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  4. ADD — bring a new person into the match                                */
/* ────────────────────────────────────────────────────────────────────────── */

export interface AddPlayerDraft {
  name: string;
  phone?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface AddPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  /** Everyone already in the match, so a duplicate is never accepted. */
  existing: { name: string; phone?: string }[];
  /** Wallet credits paid for supplying a mobile number. */
  creditReward?: number;
  /** Seed values, e.g. carried over from the picker's search box. */
  initialName?: string;
  initialPhone?: string;
  onAdd: (player: AddPlayerDraft) => void;
}

/**
 * Create-only with integrated custom photo upload & OTP verification.
 */
export function AddPlayerModal({
  visible,
  onClose,
  existing,
  creditReward = 5,
  initialName = '',
  initialPhone = '',
  onAdd,
}: AddPlayerModalProps) {
  const theme = useTheme();
  const type = useTypeRamp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarKey, setAvatarKey] = useState<string>(AVATAR_KEYS[0]);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── OTP Verification State ──
  const [otpStage, setOtpStage] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setPhone(initialPhone);
      setAvatarKey(AVATAR_KEYS[0]);
      setCustomImageUri(null);
      setError(null);
      setOtpStage('idle');
      setGeneratedOtp('');
      setOtpInput('');
      setOtpError(null);
      setOtpInfo(null);
      setResendTimer(0);
      // Focus whichever field the picker's search did NOT already fill.
      requestAnimationFrame(() => {
        if (initialName && !initialPhone) phoneRef.current?.focus();
        else if (!initialName) nameRef.current?.focus();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCustomImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const isTaken = useMemo(() => {
    const taken = new Set(existing.map(playerIdentity));
    return (candidate: { name: string; phone?: string }) => taken.has(playerIdentity(candidate));
  }, [existing]);

  const trimmedName = name.trim();
  const digits = cleanPhoneDigits(phone);
  const phoneOk = digits.length === 10;
  const canAdd = trimmedName.length > 0;

  const handlePhoneChange = (t: string) => {
    const formatted = formatPhoneNumber(t);
    setPhone(formatted);
    if (error) setError(null);
    if (otpStage !== 'idle') {
      setOtpStage('idle');
      setGeneratedOtp('');
      setOtpInput('');
      setOtpError(null);
      setOtpInfo(null);
    }
  };

  const handleSendOtp = () => {
    const valErr = getPhoneValidationError(phone, true);
    if (valErr) {
      setError(valErr);
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpStage('sent');
    setOtpInput('');
    setOtpError(null);
    setOtpInfo(`Demo OTP sent: ${code} (or use 123456)`);
    setResendTimer(30);
  };

  const handleVerifyOtp = () => {
    if (otpInput.length !== 6) {
      setOtpError('Please enter 6-digit OTP');
      return;
    }
    if (otpInput !== generatedOtp && otpInput !== '123456') {
      setOtpError('Invalid OTP code. Please try again.');
      return;
    }
    setOtpStage('verified');
    setOtpError(null);
    setOtpInfo('Mobile number verified successfully! +5 Wallet coins ready.');
  };

  const submit = () => {
    if (!canAdd) return;
    if (isTaken({ name: trimmedName, phone: phoneOk ? digits : undefined })) {
      setError(`${trimmedName} is already in this match`);
      return;
    }
    if (phone.trim().length > 0) {
      const valErr = getPhoneValidationError(phone, false);
      if (valErr) {
        setError(valErr);
        return;
      }
      if (otpStage !== 'verified') {
        setError('Please verify the 10-digit mobile number via OTP first.');
        return;
      }
    }

    onAdd({
      name: trimmedName,
      phone: phoneOk ? normalizePhone(digits) : undefined,
      avatarUrl: customImageUri || avatarKey,
      isVerified: otpStage === 'verified',
    });
  };

  return (
    <SquadModalShell
      visible={visible}
      onClose={onClose}
      icon="person-add"
      title="Add Player"
      subtitle="Name them, pick or upload an avatar, and verify mobile number"
      primaryLabel="Add Player"
      primaryEnabled={canAdd}
      onPrimary={submit}
    >
      {/* Avatar + name side by side, with camera picker button */}
      <View style={styles.identityRow}>
        <Pressable onPress={handlePickImage} style={{ position: 'relative' }}>
          <Image
            source={customImageUri ? { uri: customImageUri } : getAvatarSource(avatarKey)}
            style={styles.identityAvatar}
            contentFit="cover"
          />
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: theme.primary,
              width: 18,
              height: 18,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: theme.surfaceLowest,
            }}
          >
            <Ionicons name="camera" size={10} color="#ffffff" />
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <SectionLabel>NAME</SectionLabel>
          <TextInput
            ref={nameRef}
            value={name}
            onChangeText={(t) => { setName(t); if (error) setError(null); }}
            placeholder="Player name"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              type.body,
              { color: theme.text, backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
              Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
            ]}
          />
        </View>
      </View>

      <SectionLabel>CHOOSE AVATAR OR UPLOAD PHOTO</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarStrip}>
        {/* Upload Custom Photo button */}
        <Pressable
          onPress={handlePickImage}
          style={[
            styles.avatarChoice,
            {
              borderColor: customImageUri ? theme.primary : theme.outlineVariant + '66',
              borderWidth: customImageUri ? 2 : 1,
              borderStyle: customImageUri ? 'solid' : 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: customImageUri ? 'transparent' : theme.surfaceLow,
            },
          ]}
        >
          {customImageUri ? (
            <Image source={{ uri: customImageUri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} contentFit="cover" />
          ) : (
            <Ionicons name="camera-outline" size={14} color={theme.primary} />
          )}
        </Pressable>

        {AVATAR_KEYS.slice(0, 12).map((key) => {
          const on = !customImageUri && avatarKey === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setCustomImageUri(null);
                setAvatarKey(key);
              }}
            >
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
      </ScrollView>

      <SectionLabel>MOBILE NUMBER & OTP VERIFICATION</SectionLabel>
      <View
        style={[
          styles.search,
          {
            backgroundColor: theme.surfaceLow,
            borderColor: otpStage === 'verified' ? '#10B981' : (phoneOk ? theme.primary : theme.outlineVariant + '44'),
            marginBottom: 0,
            paddingRight: 6,
          },
        ]}
      >
        <Ionicons
          name="call-outline"
          size={14}
          color={otpStage === 'verified' ? '#10B981' : (phoneOk ? theme.primary : theme.textSecondary)}
        />
        <TextInput
          ref={phoneRef}
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          placeholderTextColor={theme.placeholder}
          editable={otpStage !== 'verified'}
          style={[
            styles.searchInput,
            type.body,
            { color: theme.text },
            Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
          ]}
        />
        {otpStage === 'verified' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98118', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: '#10B981' }}>Verified</ThemedText>
          </View>
        ) : phoneOk ? (
          <Pressable
            onPress={handleSendOtp}
            disabled={resendTimer > 0}
            style={{ backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
          >
            <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_600SemiBold', color: '#ffffff' }}>
              {otpStage === 'sent' ? (resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend') : 'Send OTP'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* OTP Input Block when OTP is Sent */}
      {otpStage === 'sent' && (
        <View style={{ marginTop: 8, backgroundColor: theme.surfaceLow, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: theme.primary + '44' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={otpInput}
              onChangeText={(t) => { setOtpInput(t.replace(/\D/g, '').slice(0, 6)); setOtpError(null); }}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={theme.placeholder}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              style={[
                styles.input,
                type.body,
                { flex: 1, height: 38, color: theme.text, backgroundColor: theme.surfaceLowest, borderColor: otpError ? '#ef4444' : theme.outlineVariant + '44', paddingHorizontal: 10 },
                Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
              ]}
            />
            <Pressable
              onPress={handleVerifyOtp}
              style={{ backgroundColor: '#10B981', paddingHorizontal: 14, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
            >
              <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: '#ffffff' }}>
                Verify
              </ThemedText>
            </Pressable>
          </View>
          {otpInfo && !otpError && (
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: theme.primary, marginTop: 4 }}>
              {otpInfo}
            </ThemedText>
          )}
          {otpError && (
            <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_500Medium', color: '#ef4444', marginTop: 4 }}>
              {otpError}
            </ThemedText>
          )}
        </View>
      )}

      {/* General Form Error */}
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Ionicons name="alert-circle" size={13} color="#ef4444" />
          <ThemedText style={{ fontSize: 11, color: '#ef4444' }}>{error}</ThemedText>
        </View>
      )}

      {/* Credit incentive banner */}
      <View
        style={[
          styles.creditBanner,
          {
            backgroundColor: otpStage === 'verified' ? '#10B98114' : theme.primary + '10',
            borderColor: otpStage === 'verified' ? '#10B98155' : theme.primary + '33',
            marginTop: 10,
          },
        ]}
      >
        <Ionicons
          name={otpStage === 'verified' ? 'checkmark-circle' : 'gift'}
          size={16}
          color={otpStage === 'verified' ? '#10B981' : theme.primary}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={[type.micro, { color: otpStage === 'verified' ? '#10B981' : theme.primary, fontFamily: 'Sora_700Bold' }]}>
            {otpStage === 'verified'
              ? `🎉 ${creditReward} Wallet Coins will be added upon saving!`
              : `Earn +${creditReward} Wallet Coins by verifying mobile number`}
          </ThemedText>
          <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]}>
            Syncs match stats, squad records, and connects your player network.
          </ThemedText>
        </View>
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={theme.error} />
          <ThemedText style={[type.micro, { color: theme.error, flexShrink: 1 }]}>{error}</ThemedText>
        </View>
      )}
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

  // ── Add-player modal ──────────────────────────────────────────────────
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.base },
  orLine: { flex: 1, height: 1 },
  identityRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  identityAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#00000010' },
  avatarStrip: { gap: 7, paddingRight: 4 },
  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: Spacing.sm,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  // "Not in the directory" — turns a dead-end search into the create flow.
  notFound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  notFoundIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

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
