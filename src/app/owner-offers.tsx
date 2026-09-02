import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOfferStore, useTurfStore } from '@/store/app-store';
import { useToast } from '@/context/ToastContext';
import {
  OwnerOffer,
  OfferDiscountType,
  formatValidTill,
  isExpired,
  redemptionsLeft,
} from '@/store/offer-store';

type FilterKey = 'all' | 'active' | 'paused' | 'expired';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Live' },
  { key: 'paused', label: 'Paused' },
  { key: 'expired', label: 'Expired' },
];

interface DraftState {
  code: string;
  title: string;
  description: string;
  discountType: OfferDiscountType;
  discountValue: string;
  minBooking: string;
  maxRedemptions: string;
  validTillDays: string;
  appliesTo: string;
}

const EMPTY_DRAFT: DraftState = {
  code: '',
  title: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minBooking: '',
  maxRedemptions: '',
  validTillDays: '30',
  appliesTo: 'All Turfs',
};

export default function OwnerOffersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess, showInfo } = useToast();
  const { offers, addOffer, updateOffer, deleteOffer, toggleOfferStatus, isOfferCodeAvailable } =
    useOfferStore();
  const { ownedTurfs } = useTurfStore();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // An offer's *effective* state: a stored 'active' offer whose date has passed
  // reads as expired here without needing a background job to rewrite it.
  const effectiveStatus = (o: OwnerOffer): FilterKey => {
    if (isExpired(o)) return 'expired';
    return o.status === 'paused' ? 'paused' : 'active';
  };

  const visibleOffers = useMemo(() => {
    const list = filter === 'all' ? offers : offers.filter(o => effectiveStatus(o) === filter);
    // Live first, then paused, expired last — the owner cares about running promos.
    const rank: Record<FilterKey, number> = { active: 0, paused: 1, expired: 2, all: 3 };
    return [...list].sort((a, b) => rank[effectiveStatus(a)] - rank[effectiveStatus(b)]);
  }, [offers, filter]);

  const stats = useMemo(() => {
    const live = offers.filter(o => effectiveStatus(o) === 'active').length;
    const redemptions = offers.reduce((sum, o) => sum + o.redeemedCount, 0);
    return { live, redemptions, total: offers.length };
  }, [offers]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setEditorOpen(true);
  };

  const openEdit = (offer: OwnerOffer) => {
    const msLeft = new Date(offer.validTill).getTime() - Date.now();
    setEditingId(offer.id);
    setDraft({
      code: offer.code,
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      minBooking: String(offer.minBooking),
      maxRedemptions: offer.maxRedemptions ? String(offer.maxRedemptions) : '',
      validTillDays: String(Math.max(1, Math.ceil(msLeft / 86400000))),
      appliesTo: offer.appliesTo,
    });
    setErrors({});
    setEditorOpen(true);
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const code = draft.code.trim();
    const value = Number(draft.discountValue);
    const days = Number(draft.validTillDays);

    if (!code) next.code = 'Enter a promo code.';
    else if (!/^[A-Za-z0-9]{3,15}$/.test(code)) next.code = 'Use 3-15 letters or numbers, no spaces.';
    else if (!isOfferCodeAvailable(code, editingId ?? undefined)) next.code = 'That code is already in use.';

    if (!draft.title.trim()) next.title = 'Give the offer a name.';

    if (!draft.discountValue.trim() || isNaN(value) || value <= 0) {
      next.discountValue = 'Enter a discount greater than 0.';
    } else if (draft.discountType === 'percent' && value > 100) {
      next.discountValue = 'A percentage cannot exceed 100.';
    }

    if (draft.minBooking.trim() && Number(draft.minBooking) < 0) {
      next.minBooking = 'Minimum booking cannot be negative.';
    }
    if (draft.maxRedemptions.trim() && Number(draft.maxRedemptions) < 0) {
      next.maxRedemptions = 'Redemption limit cannot be negative.';
    }
    if (!draft.validTillDays.trim() || isNaN(days) || days < 1) {
      next.validTillDays = 'Run the offer for at least 1 day.';
    }
    return next;
  };

  const handleSave = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const validTill = new Date();
    validTill.setDate(validTill.getDate() + Number(draft.validTillDays));

    const payload = {
      code: draft.code.trim().toUpperCase(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue),
      minBooking: Number(draft.minBooking || 0),
      maxRedemptions: Number(draft.maxRedemptions || 0),
      validTill: validTill.toISOString(),
      appliesTo: draft.appliesTo,
    };

    if (editingId) {
      updateOffer(editingId, payload);
      showSuccess('Offer updated', `${payload.code} has been saved.`);
    } else {
      addOffer(payload);
      showSuccess('Offer published', `${payload.code} is now live for players.`);
    }
    setEditorOpen(false);
  };

  const confirmDelete = (offer: OwnerOffer) => {
    Alert.alert(
      'Delete offer?',
      `${offer.code} will stop working immediately for anyone who has it saved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteOffer(offer.id);
            showInfo('Offer deleted', `${offer.code} is no longer redeemable.`);
          },
        },
      ]
    );
  };

  const turfOptions = useMemo(
    () => ['All Turfs', ...ownedTurfs.map(t => t.name)],
    [ownedTurfs]
  );

  const renderOfferCard = (offer: OwnerOffer, index: number) => {
    const status = effectiveStatus(offer);
    const left = redemptionsLeft(offer);
    const capped = left === 0;
    const statusColor =
      status === 'active' ? (capped ? '#d97706' : '#0f9f58') : status === 'paused' ? '#64748b' : '#b91c1c';
    const statusLabel =
      status === 'expired' ? 'Expired' : status === 'paused' ? 'Paused' : capped ? 'Fully claimed' : 'Live';

    const usedPct =
      offer.maxRedemptions > 0
        ? Math.min(100, Math.round((offer.redeemedCount / offer.maxRedemptions) * 100))
        : 0;

    return (
      <Reanimated.View
        key={offer.id}
        entering={FadeInDown.delay(index * 60).duration(400)}
        style={[
          styles.offerCard,
          {
            backgroundColor: theme.surfaceLowest,
            borderColor: theme.outlineVariant + '33',
            opacity: status === 'expired' ? 0.72 : 1,
          },
          Shadows.level2,
        ]}
      >
        <View style={styles.offerTopRow}>
          <View style={[styles.discountTile, { backgroundColor: theme.primary + '14' }]}>
            <ThemedText style={[styles.discountValue, { color: theme.primary }]}>
              {offer.discountType === 'percent' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
            </ThemedText>
            <ThemedText style={[styles.discountOff, { color: theme.primary }]}>OFF</ThemedText>
          </View>

          <View style={styles.offerHeadings}>
            <ThemedText
              style={[styles.offerTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {offer.title}
            </ThemedText>
            <ThemedText
              style={[styles.offerDesc, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {offer.description || 'No description added.'}
            </ThemedText>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <ThemedText style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.codeStrip, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
          <MaterialCommunityIcons name="ticket-confirmation-outline" size={15} color={theme.primary} />
          <ThemedText style={[styles.codeText, { color: theme.text }]}>{offer.code}</ThemedText>
          <View style={{ flex: 1 }} />
          <ThemedText style={[styles.codeMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {offer.appliesTo}
          </ThemedText>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Min booking</ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {offer.minBooking > 0 ? `₹${offer.minBooking}` : 'None'}
            </ThemedText>
          </View>
          <View style={styles.metaCell}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Valid till</ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {formatValidTill(offer.validTill)}
            </ThemedText>
          </View>
          <View style={styles.metaCell}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Redeemed</ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {offer.maxRedemptions > 0
                ? `${offer.redeemedCount} / ${offer.maxRedemptions}`
                : `${offer.redeemedCount}`}
            </ThemedText>
          </View>
        </View>

        {offer.maxRedemptions > 0 && (
          <View style={[styles.usageTrack, { backgroundColor: theme.outlineVariant + '33' }]}>
            <View
              style={[
                styles.usageFill,
                { width: `${usedPct}%`, backgroundColor: capped ? '#d97706' : theme.primary },
              ]}
            />
          </View>
        )}

        <View style={styles.offerActions}>
          <Pressable
            onPress={() => toggleOfferStatus(offer.id)}
            disabled={status === 'expired'}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={offer.status === 'active' ? `Pause ${offer.code}` : `Resume ${offer.code}`}
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.surfaceLow,
                borderColor: theme.outlineVariant + '44',
                opacity: status === 'expired' ? 0.45 : 1,
              },
            ]}
          >
            <Ionicons
              name={offer.status === 'active' ? 'pause' : 'play'}
              size={13}
              color={theme.text}
            />
            <ThemedText style={[styles.actionText, { color: theme.text }]}>
              {offer.status === 'active' ? 'Pause' : 'Resume'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => openEdit(offer)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${offer.code}`}
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="create-outline" size={13} color="#ffffff" />
            <ThemedText style={[styles.actionText, { color: '#ffffff' }]}>Edit</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => confirmDelete(offer)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${offer.code}`}
            style={[styles.deleteBtn, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}
          >
            <Ionicons name="trash-outline" size={14} color="#b91c1c" />
          </Pressable>
        </View>
      </Reanimated.View>
    );
  };

  const field = (
    label: string,
    key: keyof DraftState,
    opts: { placeholder?: string; keyboardType?: 'default' | 'numeric'; multiline?: boolean; autoCapitalize?: 'none' | 'characters' | 'sentences' } = {}
  ) => (
    <View style={styles.fieldBlock}>
      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <TextInput
        value={draft[key] as string}
        onChangeText={v => setDraft(prev => ({ ...prev, [key]: v }))}
        placeholder={opts.placeholder}
        placeholderTextColor={theme.textSecondary + '99'}
        keyboardType={opts.keyboardType ?? 'default'}
        multiline={opts.multiline}
        autoCapitalize={opts.autoCapitalize ?? 'sentences'}
        style={[
          styles.input,
          opts.multiline && styles.inputMultiline,
          {
            backgroundColor: theme.surfaceLow,
            color: theme.text,
            borderColor: errors[key] ? '#ef4444' : theme.outlineVariant + '44',
          },
        ]}
      />
      {!!errors[key] && (
        <ThemedText style={styles.errorText}>{errors[key]}</ThemedText>
      )}
    </View>
  );

  return (
    <GradientContainer screenName="wallet" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="headlineLg" style={{ color: theme.text }}>
              Vouchers & Offers
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
              Promo codes players can redeem at your turf
            </ThemedText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary */}
          <Reanimated.View
            entering={FadeInDown.duration(400)}
            style={[styles.summaryCard, { backgroundColor: theme.primaryContainer }, Shadows.level3]}
          >
            <View style={styles.summaryCell}>
              <ThemedText style={styles.summaryValue}>{stats.live}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Live now</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <ThemedText style={styles.summaryValue}>{stats.redemptions}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Redemptions</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <ThemedText style={styles.summaryValue}>{stats.total}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Total offers</ThemedText>
            </View>
          </Reanimated.View>

          {/* Create button */}
          <Pressable
            onPress={openCreate}
            accessibilityRole="button"
            accessibilityLabel="Create a new offer"
            style={[styles.createBtn, { backgroundColor: theme.primary }, Shadows.primary]}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <ThemedText style={styles.createBtnText}>Create New Offer</ThemedText>
          </Pressable>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceLowest,
                      borderColor: active ? theme.primary : theme.outlineVariant + '44',
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      fontFamily: active ? 'Sora_600SemiBold' : 'Sora_600SemiBold',
                      color: active ? '#ffffff' : theme.textSecondary,
                    }}
                  >
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* List */}
          {visibleOffers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={46}
                color={theme.textSecondary}
              />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                {filter === 'all' ? 'No offers yet' : `No ${filter} offers`}
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
                {filter === 'all'
                  ? 'Create a promo code to fill quiet slots and bring teams back.'
                  : 'Try a different filter to see your other offers.'}
              </ThemedText>
            </View>
          ) : (
            visibleOffers.map(renderOfferCard)
          )}
        </ScrollView>

        {/* Create / Edit editor */}
        <Modal
          visible={editorOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setEditorOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.outlineVariant + '33' }]}>
                <ThemedText type="headlineLg" style={{ color: theme.text }}>
                  {editingId ? 'Edit Offer' : 'New Offer'}
                </ThemedText>
                <Pressable
                  onPress={() => setEditorOpen(false)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
              >
                {field('Promo code', 'code', {
                  placeholder: 'WEEKDAY20',
                  autoCapitalize: 'characters',
                })}
                {field('Offer name', 'title', { placeholder: 'Weekday Morning Saver' })}
                {field('Description', 'description', {
                  placeholder: 'What do players get, and when?',
                  multiline: true,
                })}

                {/* Discount type */}
                <View style={styles.fieldBlock}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    Discount type
                  </ThemedText>
                  <View style={styles.segmented}>
                    {(['percent', 'flat'] as OfferDiscountType[]).map(t => {
                      const active = draft.discountType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setDraft(prev => ({ ...prev, discountType: t }))}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          style={[
                            styles.segment,
                            {
                              backgroundColor: active ? theme.primary : theme.surfaceLow,
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                            },
                          ]}
                        >
                          <ThemedText
                            style={{
                              fontSize: 12,
                              fontFamily: 'Sora_500Medium',
                              color: active ? '#ffffff' : theme.textSecondary,
                            }}
                          >
                            {t === 'percent' ? 'Percentage (%)' : 'Flat amount (₹)'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {field(
                  draft.discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)',
                  'discountValue',
                  { placeholder: draft.discountType === 'percent' ? '20' : '150', keyboardType: 'numeric' }
                )}
                {field('Minimum booking (₹) — optional', 'minBooking', {
                  placeholder: '0',
                  keyboardType: 'numeric',
                })}
                {field('Redemption limit — blank for unlimited', 'maxRedemptions', {
                  placeholder: 'Unlimited',
                  keyboardType: 'numeric',
                })}
                {field('Run for (days)', 'validTillDays', {
                  placeholder: '30',
                  keyboardType: 'numeric',
                })}

                {/* Applies to */}
                <View style={styles.fieldBlock}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    Applies to
                  </ThemedText>
                  <View style={styles.chipWrap}>
                    {turfOptions.map(name => {
                      const active = draft.appliesTo === name;
                      return (
                        <Pressable
                          key={name}
                          onPress={() => setDraft(prev => ({ ...prev, appliesTo: name }))}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          style={[
                            styles.turfChip,
                            {
                              backgroundColor: active ? theme.primary : theme.surfaceLow,
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                            },
                          ]}
                        >
                          <ThemedText
                            style={{
                              fontSize: 11.5,
                              fontFamily: 'Sora_500Medium',
                              color: active ? '#ffffff' : theme.textSecondary,
                            }}
                          >
                            {name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.outlineVariant + '33' }]}>
                <Pressable
                  onPress={() => setEditorOpen(false)}
                  style={[styles.footerBtn, { backgroundColor: theme.surfaceLow }]}
                  accessibilityRole="button"
                >
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.footerBtn, { backgroundColor: theme.primary, flex: 1.4 }]}
                  accessibilityRole="button"
                >
                  <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                    {editingId ? 'Save changes' : 'Publish offer'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 4 },
  scrollContent: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: 60,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: Spacing.xs,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Sora_500Medium',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Sora_500Medium',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },

  offerCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  offerTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  discountTile: {
    width: 62,
    height: 62,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountValue: {
    fontSize: 17,
    fontFamily: 'Sora_500Medium',
  },
  discountOff: {
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  offerHeadings: { flex: 1 },
  offerTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Sora_500Medium',
  },
  offerDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'Sora_400Regular',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
  },

  codeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  codeText: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
    letterSpacing: 1,
  },
  codeMeta: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
    maxWidth: '48%',
  },

  metaGrid: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  metaCell: { flex: 1 },
  metaLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
  },

  usageTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  usageFill: { height: '100%', borderRadius: 2 },

  offerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Sora_500Medium',
    marginTop: 14,
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Sora_400Regular',
    textAlign: 'center',
    marginTop: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalBody: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 16,
    paddingBottom: 24,
  },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  inputMultiline: {
    height: 82,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
    marginTop: 5,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  turfChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
