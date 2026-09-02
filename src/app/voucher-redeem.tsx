import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Share,
  Platform,
  Clipboard,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Reanimated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { getVoucherById } from '@/constants/vouchers';

const BRAND_BLUE = '#2C5CF6';

/**
 * Decorative barcode. Rendering real scannable bars would need an encoder and
 * a scanner contract we don't have, so this is deliberately illustrative — the
 * copyable code is the thing that actually redeems.
 */
function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    // Derive widths from the code so each voucher gets a stable, distinct look.
    const out: number[] = [];
    for (let i = 0; i < 46; i++) {
      const c = seed.charCodeAt(i % seed.length) + i * 7;
      out.push(1 + (c % 3));
    }
    return out;
  }, [seed]);

  return (
    <View style={styles.barcodeRow} accessible accessibilityRole="image" accessibilityLabel="Barcode">
      {bars.map((w, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: i % 7 === 0 ? 44 : 38,
            backgroundColor: i % 5 === 0 ? '#0f172a' : '#1e293b',
            marginRight: 2,
            borderRadius: 0.5,
          }}
        />
      ))}
    </View>
  );
}

export default function VoucherRedeemScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { showSuccess, showError } = useToast();

  const voucher = getVoucherById(params.id);
  const [showBarcode, setShowBarcode] = useState(false);

  // Matches the clipboard approach already used in the wallet screen rather
  // than pulling in expo-clipboard, which isn't a dependency of this project.
  const handleCopy = () => {
    if (!voucher) return;
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard?.writeText(voucher.code);
      } else {
        Clipboard.setString(voucher.code);
      }
      showSuccess('Code copied', `${voucher.code} is on your clipboard.`);
    } catch {
      showError('Could not copy', 'Copy the code manually instead.');
    }
  };

  const handleShare = async () => {
    if (!voucher) return;
    try {
      await Share.share({
        message: `${voucher.title} — use code ${voucher.code} on NonStricker. ${voucher.description}`,
      });
    } catch {
      // Share sheet dismissed; nothing to report.
    }
  };

  if (!voucher) {
    return (
      <View style={[styles.screen, { backgroundColor: BRAND_BLUE }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Voucher</ThemedText>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.missingWrap}>
            <Ionicons name="pricetag-outline" size={44} color="rgba(255,255,255,0.75)" />
            <ThemedText style={styles.missingText}>
              This voucher is no longer available.
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: BRAND_BLUE }]}>
      {Platform.OS === 'android' && <RNStatusBar barStyle="light-content" backgroundColor={BRAND_BLUE} />}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {voucher.brand}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {/* ── Ticket ────────────────────────────────────────────────── */}
          <Reanimated.View entering={FadeInDown.duration(420)} style={styles.ticket}>
            {/* Upper stub */}
            <View style={styles.ticketTop}>
              <View style={styles.logoBox}>
                <Image source={voucher.logo} style={styles.logo} contentFit="contain" />
              </View>
              <View style={styles.discountBox}>
                <ThemedText style={styles.discountValue}>{voucher.discountLabel}</ThemedText>
                <ThemedText style={styles.discountSuffix}>{voucher.discountSuffix}</ThemedText>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.storeName} numberOfLines={2}>
                  {voucher.title}
                </ThemedText>
                <View style={styles.validRow}>
                  <ThemedText style={styles.validText}>
                    Valid until: {voucher.validUntil}
                  </ThemedText>
                  <Ionicons name="information-circle" size={13} color="#94a3b8" />
                </View>
              </View>

              <Pressable
                onPress={handleShare}
                style={styles.shareBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share this voucher"
              >
                <Ionicons name="share-social" size={17} color="#ffffff" />
              </Pressable>
            </View>

            <ThemedText style={styles.terms}>{voucher.terms}</ThemedText>

            {voucher.minBooking > 0 && (
              <View style={styles.minBookingPill}>
                <Ionicons name="wallet-outline" size={12} color={BRAND_BLUE} />
                <ThemedText style={styles.minBookingText}>
                  Minimum booking ₹{voucher.minBooking}
                </ThemedText>
              </View>
            )}

            {/* Perforation — notches bite into the card edges, dashes span the gap */}
            <View style={styles.perforation}>
              <View style={[styles.notch, styles.notchLeft]} />
              <View style={styles.dashRow}>
                {Array.from({ length: 26 }).map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              <View style={[styles.notch, styles.notchRight]} />
            </View>

            {/* Lower stub — the code */}
            <View style={styles.ticketBottom}>
              <ThemedText style={styles.codeLabel}>CODE</ThemedText>

              <View style={styles.codeBox}>
                <ThemedText style={styles.codeText} selectable>
                  {voucher.code}
                </ThemedText>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleCopy}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy code ${voucher.code}`}
                >
                  <Ionicons name="copy-outline" size={19} color="#ffffff" />
                </Pressable>
                <Pressable
                  onPress={() => setShowBarcode(v => !v)}
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showBarcode ? 'Hide barcode' : 'Show barcode'}
                  accessibilityState={{ expanded: showBarcode }}
                >
                  <Ionicons name="barcode-outline" size={21} color="#ffffff" />
                </Pressable>
              </View>

              {showBarcode && (
                <Reanimated.View entering={FadeInUp.duration(260)} style={styles.barcodeWrap}>
                  <Barcode seed={voucher.code} />
                  <ThemedText style={styles.barcodeCaption}>{voucher.code}</ThemedText>
                  <ThemedText style={styles.barcodeHint}>
                    Show this at the venue counter
                  </ThemedText>
                </Reanimated.View>
              )}
            </View>
          </Reanimated.View>

          {/* Primary CTA */}
          <Reanimated.View entering={FadeInUp.delay(140).duration(400)}>
            <Pressable
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.ctaBtn}
              accessibilityRole="button"
              accessibilityLabel="Browse turfs to use this voucher"
            >
              <ThemedText style={styles.ctaText}>Book a turf with this code</ThemedText>
              <Ionicons name="arrow-forward" size={17} color={BRAND_BLUE} />
            </Pressable>
          </Reanimated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const NOTCH = 26;

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Sora_500Medium',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },

  scrollBody: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: 48,
  },

  ticket: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius['2xl'],
    paddingTop: Spacing.lg,
    overflow: 'hidden',
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  logoBox: {
    width: 116,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '100%', height: '100%' },
  discountBox: { alignItems: 'flex-end' },
  discountValue: {
    color: BRAND_BLUE,
    fontSize: 42,
    lineHeight: 46,
    fontFamily: 'Sora_500Medium',
    letterSpacing: -1.5,
  },
  discountSuffix: {
    color: BRAND_BLUE,
    fontSize: 19,
    lineHeight: 22,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.5,
    marginTop: -2,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  storeName: {
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Sora_500Medium',
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  validText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  terms: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: 'Sora_400Regular',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },

  minBookingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  minBookingText: {
    color: BRAND_BLUE,
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
  },

  perforation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    height: NOTCH,
  },
  notch: {
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: BRAND_BLUE,
  },
  notchLeft: { marginLeft: -NOTCH / 2 },
  notchRight: { marginRight: -NOTCH / 2 },
  dashRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  dash: {
    width: 6,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    borderRadius: 1,
  },

  ticketBottom: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  codeLabel: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 1.6,
  },
  codeBox: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  codeText: {
    color: BRAND_BLUE,
    fontSize: 25,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  barcodeWrap: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    alignSelf: 'stretch',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  barcodeCaption: {
    color: '#0f172a',
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 3,
    marginTop: 7,
  },
  barcodeHint: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 3,
  },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    height: 50,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  ctaText: {
    color: BRAND_BLUE,
    fontSize: 14,
    fontFamily: 'Sora_500Medium',
  },

  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: Spacing.xl,
  },
  missingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13.5,
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
});
