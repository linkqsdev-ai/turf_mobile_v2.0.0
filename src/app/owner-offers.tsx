import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { EditIcon } from '@/components/ui/edit-icon';
import { GradientContainer } from '@/components/gradient-container';
import { Shadows } from '@/constants/theme';
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

  const effectiveStatus = (o: OwnerOffer): FilterKey => {
    if (isExpired(o)) return 'expired';
    return o.status === 'paused' ? 'paused' : 'active';
  };

  const visibleOffers = useMemo(() => {
    const list = filter === 'all' ? offers : offers.filter((o) => effectiveStatus(o) === filter);
    const rank: Record<FilterKey, number> = { active: 0, paused: 1, expired: 2, all: 3 };
    return [...list].sort((a, b) => rank[effectiveStatus(a)] - rank[effectiveStatus(b)]);
  }, [offers, filter]);

  const stats = useMemo(() => {
    const live = offers.filter((o) => effectiveStatus(o) === 'active').length;
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
    else if (!/^[A-Za-z0-9]{3,15}$/.test(code))
      next.code = 'Use 3-15 letters or numbers, no spaces.';
    else if (!isOfferCodeAvailable(code, editingId ?? undefined))
      next.code = 'That code is already in use.';

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
      `${offer.code} will stop working immediately for players.`,
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
    () => ['All Turfs', ...ownedTurfs.map((t) => t.name)],
    [ownedTurfs]
  );

  const renderOfferCard = (offer: OwnerOffer, index: number) => {
    const status = effectiveStatus(offer);
    const left = redemptionsLeft(offer);
    const capped = left === 0;
    const statusColor =
      status === 'active'
        ? capped
          ? '#F59E0B'
          : '#10B981'
        : status === 'paused'
        ? '#64748B'
        : '#EF4444';
    const statusLabel =
      status === 'expired'
        ? 'Expired'
        : status === 'paused'
        ? 'Paused'
        : capped
        ? 'Fully claimed'
        : 'Live';

    const usedPct =
      offer.maxRedemptions > 0
        ? Math.min(100, Math.round((offer.redeemedCount / offer.maxRedemptions) * 100))
        : 0;

    return (
      <Reanimated.View
        key={offer.id}
        entering={FadeInDown.delay(index * 50).duration(350)}
        style={[
          styles.offerCard,
          {
            backgroundColor: theme.surfaceLowest,
            borderColor: theme.outlineVariant + '33',
            opacity: status === 'expired' ? 0.72 : 1,
          },
          Shadows.level1,
        ]}
      >
        <View style={styles.offerTopRow}>
          <View style={[styles.discountTile, { backgroundColor: theme.primary + '14' }]}>
            <ThemedText style={[styles.discountValue, { color: theme.primary }]}>
              {offer.discountType === 'percent'
                ? `${offer.discountValue}%`
                : `₹${offer.discountValue}`}
            </ThemedText>
            <ThemedText style={[styles.discountOff, { color: theme.primary }]}>OFF</ThemedText>
          </View>

          <View style={styles.offerHeadings}>
            <ThemedText style={[styles.offerTitle, { color: theme.text }]} numberOfLines={2}>
              {offer.title}
            </ThemedText>
            <ThemedText
              style={[styles.offerDesc, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {offer.description || 'Valid on turf bookings.'}
            </ThemedText>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <ThemedText style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.codeStrip,
            { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
          ]}
        >
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={15}
            color={theme.primary}
          />
          <ThemedText style={[styles.codeText, { color: theme.text }]}>{offer.code}</ThemedText>
          <View style={{ flex: 1 }} />
          <ThemedText style={[styles.codeMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {offer.appliesTo}
          </ThemedText>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
              Min Booking
            </ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {offer.minBooking > 0 ? `₹${offer.minBooking}` : 'None'}
            </ThemedText>
          </View>
          <View style={styles.metaCell}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
              Valid Till
            </ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {formatValidTill(offer.validTill)}
            </ThemedText>
          </View>
          <View style={styles.metaCell}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>
              Redeemed
            </ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {offer.maxRedemptions > 0
                ? `${offer.redeemedCount}/${offer.maxRedemptions}`
                : `${offer.redeemedCount}`}
            </ThemedText>
          </View>
        </View>

        {offer.maxRedemptions > 0 && (
          <View style={[styles.usageTrack, { backgroundColor: theme.outlineVariant + '33' }]}>
            <View
              style={[
                styles.usageFill,
                { width: `${usedPct}%`, backgroundColor: capped ? '#F59E0B' : theme.primary },
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
            accessibilityLabel={
              offer.status === 'active' ? `Pause ${offer.code}` : `Resume ${offer.code}`
            }
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.surfaceLow,
                borderColor: theme.outlineVariant + '44',
                opacity: status === 'expired' ? 0.45 : pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name={offer.status === 'active' ? 'pause' : 'play'}
              size={12}
              color={theme.text}
              style={{ marginRight: 4 }}
            />
            <ThemedText style={[styles.actionBtnText, { color: theme.text }]}>
              {offer.status === 'active' ? 'Pause' : 'Resume'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => openEdit(offer)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${offer.code}`}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.surfaceLow,
                borderColor: theme.outlineVariant + '44',
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <View style={{ marginRight: 4 }}>
              <EditIcon size={12} />
            </View>
            <ThemedText style={[styles.actionBtnText, { color: theme.text }]}>Edit</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => confirmDelete(offer)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${offer.code}`}
            style={({ pressed }) => [
              styles.deleteBtn,
              { borderColor: '#EF444433', backgroundColor: '#EF444415' },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
          </Pressable>
        </View>
      </Reanimated.View>
    );
  };

  const renderField = (
    label: string,
    key: keyof DraftState,
    opts: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric';
      multiline?: boolean;
      autoCapitalize?: 'none' | 'characters' | 'sentences';
    } = {}
  ) => (
    <View style={styles.fieldBlock}>
      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <TextInput
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        value={draft[key] as string}
        onChangeText={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
        placeholder={opts.placeholder}
        placeholderTextColor={theme.placeholder}
        keyboardType={opts.keyboardType ?? 'default'}
        multiline={opts.multiline}
        autoCapitalize={opts.autoCapitalize ?? 'sentences'}
        style={[
          styles.input,
          opts.multiline && styles.inputMultiline,
          {
            backgroundColor: theme.surfaceLow,
            color: theme.text,
            borderColor: errors[key] ? '#EF4444' : theme.outlineVariant + '44',
          },
        ]}
      />
      {!!errors[key] && <ThemedText style={styles.errorText}>{errors[key]}</ThemedText>}
    </View>
  );

  return (
    <GradientContainer screenName="wallet" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Vouchers & Offers
          </ThemedText>
          <Pressable
            onPress={openCreate}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerActionBtn,
              { backgroundColor: theme.primary + '18' },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create offer"
          >
            <Ionicons name="add" size={20} color={theme.primary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ambient Header Floodlight Wash */}
          <LinearGradient
            colors={[theme.primary + '18', theme.primary + '04', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ambientWash}
            pointerEvents="none"
          />

          {/* Summary Bento Card */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.surfaceLowest,
                borderColor: theme.outlineVariant + '33',
              },
              Shadows.level1,
            ]}
          >
            <View style={styles.summaryCell}>
              <ThemedText style={[styles.summaryValue, { color: '#10B981' }]}>
                {stats.live}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                LIVE NOW
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryDivider,
                { backgroundColor: theme.outlineVariant + '22' },
              ]}
            />
            <View style={styles.summaryCell}>
              <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>
                {stats.redemptions}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                REDEMPTIONS
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryDivider,
                { backgroundColor: theme.outlineVariant + '22' },
              ]}
            />
            <View style={styles.summaryCell}>
              <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
                {stats.total}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                TOTAL OFFERS
              </ThemedText>
            </View>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((item) => {
              const active = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceLow,
                      borderColor: active ? theme.primary : theme.outlineVariant + '44',
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      { color: active ? '#ffffff' : theme.textSecondary },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section Indicator Bar Header */}
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIndicatorBar, { backgroundColor: theme.primary }]} />
            <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              YOUR OFFERS
            </ThemedText>
            <View style={[styles.countBadge, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText style={[styles.countBadgeText, { color: theme.textSecondary }]}>
                {visibleOffers.length}
              </ThemedText>
            </View>
          </View>

          {visibleOffers.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: theme.outlineVariant + '33',
                },
              ]}
            >
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceLow }]}>
                <MaterialCommunityIcons
                  name="ticket-percent-outline"
                  size={22}
                  color={theme.textSecondary}
                />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No Offers Found
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Create promotional discount codes for players booking your turf slots.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.offersList}>{visibleOffers.map(renderOfferCard)}</View>
          )}
        </ScrollView>

        {/* Create / Edit Modal */}
        <Modal
          visible={editorOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setEditorOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.modalHeaderRow}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                  {editingId ? 'Edit Offer' : 'Create New Offer'}
                </ThemedText>
                <Pressable
                  onPress={() => setEditorOpen(false)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
              >
                {renderField('Promo Code', 'code', {
                  placeholder: 'e.g. MON10',
                  autoCapitalize: 'characters',
                })}
                {renderField('Offer Title', 'title', {
                  placeholder: 'e.g. 10% Off Weekdays',
                })}
                {renderField('Description', 'description', {
                  placeholder: 'Terms & conditions or details',
                  multiline: true,
                })}

                {/* Discount Type Selector */}
                <View style={styles.fieldBlock}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    Discount Type
                  </ThemedText>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['percent', 'fixed'] as OfferDiscountType[]).map((t) => {
                      const active = draft.discountType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setDraft((prev) => ({ ...prev, discountType: t }))}
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor: active ? theme.primary : theme.surfaceLow,
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.typeChipText,
                              { color: active ? '#ffffff' : theme.textSecondary },
                            ]}
                          >
                            {t === 'percent' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {renderField(
                  draft.discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (₹)',
                  'discountValue',
                  { placeholder: 'e.g. 15', keyboardType: 'numeric' }
                )}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    {renderField('Min Booking (₹)', 'minBooking', {
                      placeholder: '0 for none',
                      keyboardType: 'numeric',
                    })}
                  </View>
                  <View style={{ flex: 1 }}>
                    {renderField('Redemption Limit', 'maxRedemptions', {
                      placeholder: '0 for unlimited',
                      keyboardType: 'numeric',
                    })}
                  </View>
                </View>

                {renderField('Valid Duration (Days)', 'validTillDays', {
                  placeholder: '30',
                  keyboardType: 'numeric',
                })}

                {/* Turf Scope Selector */}
                <View style={styles.fieldBlock}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    Applies To Turf
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                  >
                    {turfOptions.map((opt) => {
                      const active = draft.appliesTo === opt;
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => setDraft((prev) => ({ ...prev, appliesTo: opt }))}
                          style={[
                            styles.scopeChip,
                            {
                              backgroundColor: active ? theme.primary : theme.surfaceLow,
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.scopeChipText,
                              { color: active ? '#ffffff' : theme.text },
                            ]}
                          >
                            {opt}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    {
                      borderColor: theme.outlineVariant + '55',
                      backgroundColor: theme.surfaceLow,
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setEditorOpen(false)}
                >
                  <ThemedText style={[styles.modalBtnText, { color: theme.text }]}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleSave}
                >
                  <ThemedText style={[styles.modalBtnText, { color: '#ffffff' }]}>
                    {editingId ? 'Save Changes' : 'Publish Offer'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  ambientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14.5,
  },
  summaryLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  filterChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionIndicatorBar: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    marginRight: 7,
  },
  sectionLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  countBadgeText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
  },
  offersList: {
    gap: 12,
  },
  offerCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
  },
  offerTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  discountTile: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14.5,
  },
  discountOff: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8,
    letterSpacing: 0.6,
  },
  offerHeadings: {
    flex: 1,
    minWidth: 0,
  },
  offerTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14,
  },
  offerDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
  },
  codeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  codeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  codeMeta: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaCell: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
  },
  metaValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    marginTop: 1,
  },
  usageTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 2,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  fieldBlock: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
    includeFontPadding: false,
  },
  inputMultiline: {
    height: 64,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10.5,
    color: '#EF4444',
    marginTop: 3,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  typeChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  scopeChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14.5,
  },
  emptySubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
