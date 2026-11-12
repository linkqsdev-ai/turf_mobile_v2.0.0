/**
 * cup-cards.tsx
 *
 * The Cups list and grid cards, built from the shared dashboard kit: the
 * tournament's banner, name and status headline, location/date/next-fixture
 * rows, a slim registration bar, and a hairline footer with the prize and a
 * compact Register action. Replaces the ticket-stub cards.
 *
 * Presentation only — status, prize and progress come from utils/cup-display.ts.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DashboardCard, ProgressPill } from '@/components/dashboard/analytics-kit';
import { ACCENTS, type Accent } from '@/constants/dashboard-accents';
import { sportEmoji, sportIcon, teamsProgress } from '@/utils/cup-display';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface CupCardProps {
  name: string;
  sport: string;
  banner: any;
  onBannerError: () => void;
  status: { label: string; accent: Accent };
  location: string;
  dateRange: string;
  nextFixture: { label: string; live: boolean } | null;
  teams: { taken: number; max: number };
  prize: string;
  cashbackTag?: string;
  register: { label: string; blocked: boolean; accessibilityLabel: string; onPress: () => void };
  onPress: () => void;
}

const describe = (p: CupCardProps) =>
  `${p.name}. ${p.status.label}. ${p.sport}. ${p.location}. ${p.dateRange}. ${p.teams.taken} of ${p.teams.max} teams. Prize ${p.prize}.`;

function MetaRow({ icon, text, color, strong }: { icon: IoniconName; text: string; color?: string; strong?: boolean }) {
  const theme = useTheme();
  const tint = color ?? theme.textSecondary;
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={12} color={tint} />
      <ThemedText
        style={[styles.metaText, { color: tint, fontFamily: strong ? 'Sora_500Medium' : 'Sora_400Regular' }]}
        numberOfLines={1}
      >
        {text}
      </ThemedText>
    </View>
  );
}

function RegisterButton({
  label,
  blocked,
  accessibilityLabel,
  onPress,
  compact,
}: CupCardProps['register'] & { compact?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.register,
        compact && styles.registerCompact,
        { backgroundColor: blocked ? ACCENTS.slate.main : theme.primary, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {!compact && <Ionicons name={blocked ? 'lock-closed' : 'add-circle-outline'} size={13} color="#ffffff" />}
      <ThemedText style={styles.registerText} numberOfLines={1}>{label}</ThemedText>
    </Pressable>
  );
}

function Meta({ p, short }: { p: CupCardProps; short?: boolean }) {
  return (
    <View style={styles.metaBlock}>
      <MetaRow icon="location-outline" text={short ? p.location.split(',')[0] : p.location} />
      <MetaRow icon="calendar-outline" text={p.dateRange} />
      {p.nextFixture && (
        <MetaRow
          icon={p.nextFixture.live ? 'radio-outline' : 'git-network-outline'}
          text={p.nextFixture.label}
          color={p.nextFixture.live ? ACCENTS.red.main : ACCENTS.primary.main}
          strong
        />
      )}
    </View>
  );
}

export function CupListCard(p: CupCardProps) {
  const accent = p.status.accent;
  return (
    <DashboardCard
      title={p.name}
      metric={p.status.label}
      tag={`${sportEmoji(p.sport)} ${p.sport}`}
      accent={accent}
      leading={<Image source={p.banner} style={styles.thumb} contentFit="cover" onError={p.onBannerError} />}
      trailing={
        <View style={[styles.sportTile, { backgroundColor: accent.main + '1A' }]}>
          <MaterialCommunityIcons name={sportIcon(p.sport) as any} size={18} color={accent.main} />
        </View>
      }
      onPress={p.onPress}
      accessibilityLabel={describe(p)}
      footer={{ label: 'Prize pool', value: p.prize, status: <RegisterButton {...p.register} /> }}
    >
      <Meta p={p} />
      {p.cashbackTag && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#10b98115', borderColor: '#10b98144', borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, marginVertical: 2 }}>
          <Ionicons name="gift" size={11} color="#10b981" />
          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: '#10b981' }}>
            {p.cashbackTag}
          </ThemedText>
        </View>
      )}
      <ProgressPill
        progress={teamsProgress(p.teams.taken, p.teams.max)}
        accent={accent}
        label="Teams registered"
        value={`${p.teams.taken}/${p.teams.max}`}
      />
    </DashboardCard>
  );
}

export function CupGridCard(p: CupCardProps) {
  const theme = useTheme();
  const accent = p.status.accent;
  return (
    <DashboardCard
      style={styles.gridCard}
      media={<Image source={p.banner} style={styles.gridImage} contentFit="cover" onError={p.onBannerError} />}
      title={p.name}
      metric={p.status.label}
      accent={accent}
      onPress={p.onPress}
      accessibilityLabel={describe(p)}
      footer={{
        left: (
          <ThemedText style={[styles.gridPrize, { color: theme.text }]} numberOfLines={1}>
            {p.prize}
          </ThemedText>
        ),
        status: <RegisterButton {...p.register} compact />,
      }}
    >
      <Meta p={p} short />
      {p.cashbackTag && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: '#10b98115', borderColor: '#10b98144', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
          <Ionicons name="gift" size={10} color="#10b981" />
          <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_600SemiBold', color: '#10b981' }}>
            {p.cashbackTag}
          </ThemedText>
        </View>
      )}
      <ProgressPill
        progress={teamsProgress(p.teams.taken, p.teams.max)}
        accent={accent}
        label="Teams"
        value={`${p.teams.taken}/${p.teams.max}`}
      />
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 48, height: 48, borderRadius: 10 },
  sportTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metaBlock: { gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 10.5, flex: 1, minWidth: 0 },
  register: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  registerCompact: { height: 28, paddingHorizontal: 9 },
  registerText: { color: '#ffffff', fontSize: 11, fontFamily: 'Sora_600SemiBold' },
  gridCard: { width: '48%', padding: 12, gap: 10 },
  gridImage: { width: '100%', height: 84, borderRadius: 8 },
  gridPrize: { fontSize: 11, fontFamily: 'Sora_600SemiBold', flexShrink: 1 },
});
