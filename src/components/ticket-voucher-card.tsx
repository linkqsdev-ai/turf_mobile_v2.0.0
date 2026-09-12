import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Shadows, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOfferStore, useClassStore } from '@/store/app-store';
import { formatDiscount, isRedeemable } from '@/store/offer-store';
import {
  CASHBACK_DEALS,
  TOURNAMENT_PASSES,
  type CashbackDeal,
  type PlatformPass,
} from '@/constants/platform-deals';

export const STUB_COLORS = [
  '#6366f1', // Indigo / Purple
  '#f59e0b', // Amber / Orange
  '#ec4899', // Rose Pink
  '#10b981', // Emerald Green
  '#3b82f6', // Ocean Blue
  '#8b5cf6', // Violet
];

export type VoucherCategory = 'coach' | 'turf' | 'tournament' | 'wallet';

export interface TicketVoucherItem {
  id: string;
  code: string;
  title: string;
  appliesTo: string;
  discountText: string;
  discountType?: 'percent' | 'flat';
  discountValue?: number;
  subType?: 'OFF' | 'BACK' | 'SAVE';
  color?: string;
  targetPath?: string;
  rawClassId?: string;
  category?: VoucherCategory;
}

const CATEGORY_META: Record<VoucherCategory, { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; text: string }> = {
  coach: { label: 'CLASS', icon: 'school-outline', bg: '#EEF2FF', text: '#4F46E5' },
  turf: { label: 'TURF', icon: 'football-outline', bg: '#EFF6FF', text: '#2563EB' },
  tournament: { label: 'TOURNAMENT', icon: 'trophy-outline', bg: '#FFF7ED', text: '#EA580C' },
  wallet: { label: 'WALLET', icon: 'wallet-outline', bg: '#ECFDF5', text: '#059669' },
};

const PASS_COLORS = ['#f97316', '#ea580c'];
const CASHBACK_COLORS = ['#10b981', '#059669'];

function passTicket(p: PlatformPass, idx: number): TicketVoucherItem {
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    appliesTo: p.appliesTo,
    discountText: formatDiscount(p),
    discountType: p.discountType,
    discountValue: p.discountValue,
    color: PASS_COLORS[idx % PASS_COLORS.length],
    subType: p.discountType === 'flat' ? 'SAVE' : 'OFF',
    category: 'tournament',
  };
}

function cashbackTicket(c: CashbackDeal, idx: number): TicketVoucherItem {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    appliesTo: c.appliesTo,
    discountText: `₹${c.amount} BACK`,
    discountType: 'flat',
    discountValue: c.amount,
    color: CASHBACK_COLORS[idx % CASHBACK_COLORS.length],
    subType: 'BACK',
    category: 'wallet',
  };
}

export function TicketVoucherCard({
  item,
  index = 0,
  onPress,
}: {
  item: TicketVoucherItem;
  index?: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const color = item.color || STUB_COLORS[index % STUB_COLORS.length];
  const cat = item.category || 'turf';
  const meta = CATEGORY_META[cat];

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (item.rawClassId) {
      router.push({
        pathname: '/enroll',
        params: {
          classId: item.rawClassId,
          title: item.appliesTo || item.title,
        },
      });
      return;
    }

    if (cat === 'coach') {
      router.push('/(tabs)/coach');
      return;
    }

    if (cat === 'tournament') {
      router.push('/(tabs)/tournaments');
      return;
    }

    if (cat === 'wallet') {
      router.push('/wallet');
      return;
    }

    if (item.appliesTo && item.appliesTo !== 'All Turfs' && item.appliesTo !== 'All Classes') {
      router.push({
        pathname: '/explore',
        params: {
          search: item.appliesTo,
        },
      });
    } else {
      router.push('/(tabs)/explore');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: theme.surfaceLowest,
          borderColor: theme.outlineVariant + '33',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        Shadows.level2,
      ]}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel={`Voucher ${item.code}, ${item.title}`}
    >
      {/* ── Left Discount Badge Stub ── */}
      <View style={[styles.stubContainer, { backgroundColor: color }]}>
        <ThemedText style={styles.stubDiscountText}>
          {item.discountText.replace(/\s+/g, '\n')}
        </ThemedText>

        {/* Top Half-circle Cutout Notch */}
        <View style={[styles.notchTop, { backgroundColor: theme.background }]} />

        {/* Bottom Half-circle Cutout Notch */}
        <View style={[styles.notchBottom, { backgroundColor: theme.background }]} />
      </View>

      {/* ── Right Ticket Details Body ── */}
      <View style={styles.bodyContainer}>
        {/* Compact Category Pill Tag */}
        <View style={[styles.categoryPill, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={8} color={meta.text} style={{ marginRight: 2.5 }} />
          <ThemedText style={[styles.categoryPillText, { color: meta.text }]}>
            {meta.label}
          </ThemedText>
        </View>

        <ThemedText style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </ThemedText>

        <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.appliesTo || 'All Partner Turfs & Classes'}
        </ThemedText>

        {/* Dashed Promo Code Pill */}
        <View style={styles.codePillRow}>
          <View style={[styles.dashedCodePill, { borderColor: color + '99' }]}>
            <ThemedText style={[styles.codeText, { color }]}>
              {item.code.toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export interface TicketVoucherCarouselProps {
  title?: string;
  filterType?: 'all' | 'class' | 'turf' | 'turf_tournament_wallet' | 'tournament' | 'wallet';
  onVoucherPress?: (voucher: TicketVoucherItem) => void;
}

/**
 * TicketVoucherCarousel
 * Live vouchers categorized cleanly by type (Coach Class Deals vs Turf, Tournament & Wallet Deals).
 */
export function TicketVoucherCarousel({
  title,
  filterType = 'all',
  onVoucherPress,
}: TicketVoucherCarouselProps) {
  const theme = useTheme();
  const { offers } = useOfferStore();
  const { classes } = useClassStore();

  const voucherList = useMemo<TicketVoucherItem[]>(() => {
    const list: TicketVoucherItem[] = [];
    const seen = new Set<string>();

    if (filterType === 'class') {
      // 1. Gather ONLY vouchers & offers attached directly to coach classes
      (classes || []).forEach((cls: any, cIdx: number) => {
        if (cls.vouchers && Array.isArray(cls.vouchers) && cls.vouchers.length > 0) {
          cls.vouchers.forEach((v: any, vIdx: number) => {
            const code = String(v.code || '').trim().toUpperCase();
            if (!code || seen.has(code)) return;
            seen.add(code);
            const discText = v.discountValue
              ? `${v.discountValue}${v.discountType === 'flat' ? '₹ OFF' : '% OFF'}`
              : '15% OFF';
            list.push({
              id: v.offerId || v.localId || `class-voucher-${cls.id}-${code}-${vIdx}`,
              code,
              title: v.title || `${cls.className || 'Academy'} Voucher`,
              appliesTo: cls.className || 'Coaching Camp',
              discountText: discText,
              discountType: v.discountType || 'percent',
              discountValue: parseFloat(v.discountValue) || 15,
              rawClassId: cls.id,
              color: STUB_COLORS[(cIdx + vIdx) % STUB_COLORS.length],
              subType: v.discountType === 'flat' ? 'SAVE' : 'OFF',
              category: 'coach',
            });
          });
        } else if (cls.className) {
          const cleanPrefix = cls.className.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
          const code = `${cleanPrefix || 'CLASS'}10`;
          if (!seen.has(code)) {
            seen.add(code);
            list.push({
              id: `auto-class-voucher-${cls.id}`,
              code,
              title: `${cls.className} Pass`,
              appliesTo: cls.className,
              discountText: '15% OFF',
              discountType: 'percent',
              discountValue: 15,
              rawClassId: cls.id,
              color: STUB_COLORS[cIdx % STUB_COLORS.length],
              subType: 'OFF',
              category: 'coach',
            });
          }
        }
      });

      if (list.length === 0) {
        list.push(
          {
            id: 'v_class_default_1',
            code: 'COACH20',
            title: 'Academy Pro Deal',
            appliesTo: 'Cricket & Football Camps',
            discountText: '20% OFF',
            color: '#6366f1',
            subType: 'OFF',
            category: 'coach',
          },
          {
            id: 'v_class_default_2',
            code: 'MAMA15',
            title: 'Mama Camp Deal',
            appliesTo: 'Mama Football Camp',
            discountText: '15% OFF',
            color: '#f59e0b',
            subType: 'OFF',
            category: 'coach',
          }
        );
      }
    } else if (filterType === 'turf' || filterType === 'turf_tournament_wallet') {
      // Combined Section: Turf Booking + Tournament + Wallet Vouchers in one place
      // 1. Turf Offers from owner offerStore
      (offers || []).filter(o => isRedeemable(o)).forEach((o, idx) => {
        const code = String(o.code || '').trim().toUpperCase();
        if (!code || seen.has(code)) return;
        seen.add(code);
        list.push({
          id: o.id,
          code,
          title: o.title || `${o.appliesTo || 'Turf'} Deal`,
          appliesTo: o.appliesTo || 'All Partner Turfs',
          discountText: formatDiscount(o),
          discountType: o.discountType,
          discountValue: o.discountValue,
          color: STUB_COLORS[idx % STUB_COLORS.length],
          subType: o.discountType === 'percent' ? 'OFF' : 'BACK',
          category: 'turf',
        });
      });

      // 2. Tournament passes
      TOURNAMENT_PASSES.forEach((p, idx) => list.push(passTicket(p, idx)));

      // 3. Wallet cashback
      CASHBACK_DEALS.forEach((c, idx) => list.push(cashbackTicket(c, idx)));
    } else {
      // 'all': Mix all verified categories with distinct tags
      // 1. Coach class vouchers
      (classes || []).forEach((cls: any, cIdx: number) => {
        if (cls.vouchers && Array.isArray(cls.vouchers)) {
          cls.vouchers.forEach((v: any, vIdx: number) => {
            const code = String(v.code || '').trim().toUpperCase();
            if (!code || seen.has(code)) return;
            seen.add(code);
            list.push({
              id: v.offerId || v.localId || `class-voucher-${cls.id}-${code}`,
              code,
              title: v.title || `${cls.className} Voucher`,
              appliesTo: cls.className || 'Coaching Camp',
              discountText: `${v.discountValue || 15}% OFF`,
              discountType: 'percent',
              discountValue: 15,
              rawClassId: cls.id,
              color: STUB_COLORS[(cIdx + vIdx) % STUB_COLORS.length],
              subType: 'OFF',
              category: 'coach',
            });
          });
        }
      });

      // 2. Turf vouchers from offerStore
      (offers || []).filter(o => isRedeemable(o)).forEach((o, idx) => {
        const code = String(o.code || '').trim().toUpperCase();
        if (!code || seen.has(code)) return;
        seen.add(code);
        list.push({
          id: o.id,
          code,
          title: o.title || 'Turf Special',
          appliesTo: o.appliesTo || 'All Partner Turfs',
          discountText: formatDiscount(o),
          discountType: o.discountType,
          discountValue: o.discountValue,
          color: STUB_COLORS[idx % STUB_COLORS.length],
          subType: o.discountType === 'percent' ? 'OFF' : 'BACK',
          category: 'turf',
        });
      });

      // 3. Tournament & Wallet default vouchers
      list.push(passTicket(TOURNAMENT_PASSES[0], 0), cashbackTicket(CASHBACK_DEALS[0], 0));
    }

    return list;
  }, [filterType, offers, classes]);

  const defaultTitle =
    filterType === 'class'
      ? 'COACHING CLASS OFFERS & PASSES'
      : filterType === 'turf'
      ? 'TURF BOOKING DEALS & OFFERS'
      : filterType === 'tournament'
      ? 'TOURNAMENT REGISTRATION DISCOUNTS'
      : filterType === 'wallet'
      ? 'WALLET CASHBACK & REWARDS'
      : 'EXCLUSIVE OFFERS & VOUCHERS';

  const finalTitle = title !== undefined ? title : defaultTitle;

  return (
    <View style={styles.carouselWrapper}>
      {finalTitle ? (
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {finalTitle}
        </ThemedText>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselScroll}
      >
        {voucherList.map((item, index) => (
          <TicketVoucherCard
            key={item.id || item.code || `v-${index}`}
            item={item}
            index={index}
            onPress={onVoucherPress ? () => onVoucherPress(item) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrapper: {
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  carouselScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  cardContainer: {
    flexDirection: 'row',
    width: 256,
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
  },
  stubContainer: {
    width: 82,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  stubDiscountText: {
    fontSize: 14,
    fontFamily: 'Sora_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: -0.3,
  },
  stubMainText: {
    fontSize: 15.5,
    fontFamily: 'Sora_700Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  stubSubText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  notchTop: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 10,
  },
  notchBottom: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 10,
  },
  bodyContainer: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
  },
  categoryPillText: {
    fontSize: 7.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    marginTop: 1,
  },
  codePillRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dashedCodePill: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.5,
  },
});
