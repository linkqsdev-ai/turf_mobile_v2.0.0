import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface CashbackOutputCardProps {
  entityName?: string;
  sourceTitle?: string;
  entityType?: 'class' | 'turf' | 'tournament';
  cashbackAmount: number;
  cashbackType?: 'flat' | 'percent';
  cashbackName?: string;
  cashbackTitle?: string;
  cashbackCode?: string;
  cashbackMaxAmount?: number;
  cashbackOneTime?: boolean;
  calculatedReward?: number;
  variant?: 'full' | 'compact';
  onCopySuccess?: (code: string) => void;
  style?: any;
}

export function CashbackOutputCard({
  entityName,
  sourceTitle,
  entityType = 'turf',
  cashbackAmount,
  cashbackType = 'flat',
  cashbackName,
  cashbackTitle,
  cashbackMaxAmount,
  cashbackOneTime = false,
  style,
}: CashbackOutputCardProps) {
  const theme = useTheme();

  const name = (entityName || sourceTitle || '').trim();
  const title = (cashbackName || cashbackTitle || '').trim();
  const isPercent = cashbackType === 'percent';
  const displayAmount = isPercent ? `${cashbackAmount}%` : `₹${cashbackAmount}`;
  const resolvedTitle = title || (name ? `${name} Cashback Reward` : 'Wallet Cashback Reward');

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceLowest, borderColor: '#10b98133' },
          Shadows.level2,
        ]}
      >
        {/* Emerald Header Banner */}
        <LinearGradient
          colors={['#064e3b', '#065f46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Ionicons name="wallet" size={13} color="#10b981" />
              <ThemedText style={styles.badgeText}>CASHBACK ADDED TO WALLET</ThemedText>
            </View>
            <View style={styles.amountPill}>
              <ThemedText style={styles.amountPillText}>+{displayAmount}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.bannerTitle} numberOfLines={1}>
            {resolvedTitle}
          </ThemedText>
          <ThemedText style={styles.bannerSub} numberOfLines={1}>
            Credited directly to wallet • Usable for any class or turf
          </ThemedText>
        </LinearGradient>

        {/* Card Body */}
        <View style={styles.body}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Ionicons name="checkmark-circle" size={15} color="#10b981" />
              <ThemedText style={styles.statusText}>DIRECT WALLET CREDIT</ThemedText>
            </View>
            <View style={styles.instantPill}>
              <ThemedText style={styles.instantPillText}>INSTANT</ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.terms, { color: theme.textSecondary }]}>
            Cashback of {displayAmount} is credited directly to your universal wallet balance upon payment and can be used towards any turf booking, tournament, or coaching class.
          </ThemedText>

          {/* Metric Summary Grid */}
          <View style={[styles.grid, { borderTopColor: theme.outlineVariant + '22' }]}>
            <View style={styles.metric}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>REWARD TYPE</ThemedText>
              <ThemedText style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>
                {isPercent ? 'Percentage (%)' : 'Flat (₹)'}
              </ThemedText>
            </View>

            <View style={styles.metric}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>CASHBACK</ThemedText>
              <ThemedText style={[styles.metricValue, { color: '#10b981' }]} numberOfLines={1}>
                +{displayAmount}
              </ThemedText>
            </View>

            <View style={styles.metric}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>MAX CAP</ThemedText>
              <ThemedText style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>
                {cashbackMaxAmount ? `₹${cashbackMaxAmount}` : 'No Limit'}
              </ThemedText>
            </View>

            <View style={styles.metric}>
              <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>USAGE</ThemedText>
              <ThemedText style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>
                {cashbackOneTime ? '1x per User' : 'Universal'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: 'Sora_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  amountPill: {
    backgroundColor: '#10b981',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  amountPillText: {
    fontSize: 11,
    fontFamily: 'Sora_700Bold',
    color: '#ffffff',
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
    marginTop: 2,
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  body: {
    padding: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#10b981',
    letterSpacing: 0.4,
  },
  instantPill: {
    backgroundColor: '#10b98118',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b98133',
  },
  instantPillText: {
    fontSize: 9.5,
    fontFamily: 'Sora_700Bold',
    color: '#10b981',
    letterSpacing: 0.4,
  },
  terms: {
    fontSize: 11.5,
    lineHeight: 16.5,
    fontFamily: 'Sora_400Regular',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 8.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
  },
});
