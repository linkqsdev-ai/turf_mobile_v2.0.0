/**
 * club.tsx — the Organizer's "Host" tab.
 *
 * Replaces the old "Elite clubs — coming soon" placeholder. It mirrors the
 * Owner's tab, which becomes an "Add Turf" hub: a prominent create action on
 * top, the organizer's existing tournaments beneath it, so the tab is useful
 * both before and after the first cup exists.
 *
 * Visual language is deliberately the same as Create Turf — white rounded
 * cards on the gradient, a labelled hero action, and the same spacing rhythm.
 */

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTypeRamp } from '@/lib/typography';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useTournamentStore } from '@/store/app-store';
import type { PublishedTournament } from '@/store/tournament-store';

const STATUS_TINT: Record<string, string> = {
  Draft: '#6B7280',
  Registering: '#4F46E5',
  Ongoing: '#10B981',
  Completed: '#94A3B8',
};

/** The same four things the Create Turf hero promises, tuned for a cup. */
const STEPS_PREVIEW = [
  { icon: 'information-circle-outline', label: 'Basics' },
  { icon: 'calendar-outline', label: 'Schedule' },
  { icon: 'map-outline', label: 'Venue' },
  { icon: 'trophy-outline', label: 'Prizes' },
] as const;

export default function CreateCupScreen() {
  const theme = useTheme();
  const type = useTypeRamp();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { publishedTournaments, deleteTournament, updateTournament } = useTournamentStore();
  /**
   * Deleting is confirmed with an in-app modal rather than Alert.alert:
   * react-native-web ignores Alert's button list, so on web the destructive
   * callback never fired and the button looked broken.
   */
  const [pendingDelete, setPendingDelete] = useState<PublishedTournament | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  /** Which card is mid-upload — keeps the spinner on that row only. */
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /**
   * Adds photos straight to a cup's Media tab from its card, so an organizer
   * posting shots from the ground doesn't have to walk the whole edit wizard.
   */
  const addMediaFor = async (t: PublishedTournament) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      flashToast('Photo permission is needed to add media');
      return;
    }
    setUploadingId(t.id);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 8,
        quality: 0.9,
      });
      if (result.canceled) return;
      const uris = (result.assets || []).map(a => a.uri).filter(Boolean);
      if (uris.length === 0) return;
      const existing = t.mediaImages || [];
      // Re-picking the same photo shouldn't duplicate it in the gallery.
      const merged = [...existing, ...uris.filter(u => !existing.includes(u))].slice(0, 12);
      updateTournament(t.id, { mediaImages: merged });
      flashToast(`${merged.length - existing.length} photo${merged.length - existing.length === 1 ? '' : 's'} added to ${t.name}`);
    } finally {
      setUploadingId(null);
    }
  };

  /**
   * Ownership is keyed on the stable `organizerId` stamped at creation, NOT on
   * `organizerName` — that is editable, so renaming the organizer used to drop
   * the tournament out of its own creator's list. Records published before
   * `organizerId` existed fall back to a name match.
   */
  const mine = useMemo<PublishedTournament[]>(() => {
    const list = (publishedTournaments || []) as PublishedTournament[];
    const key = (profile?.phone || '').replace(/\D/g, '').slice(-10)
      || (profile?.email || '').trim().toLowerCase()
      || (profile?.name || '').trim().toLowerCase();
    if (!key) return list;
    // Ownership is the stable `organizerId` stamped at creation. A record from
    // before that field existed has no owner recorded — but this store only
    // ever holds tournaments published on this device, so a legacy record is
    // this organizer's by construction and is kept. Matching the editable
    // `organizerName` instead is what used to make a cup vanish from its own
    // creator's list the moment they renamed the organizer while editing.
    return list.filter((t) => !t.organizerId || t.organizerId === key);
  }, [publishedTournaments, profile]);

  return (
    <GradientContainer screenName="tournaments" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ThemedText style={[type.display, { color: theme.text }]}>Host a Tournament</ThemedText>
          <ThemedText style={[type.small, { color: theme.textSecondary, marginTop: 2 }]}>
            Build the bracket, open registration, crown a winner.
          </ThemedText>

          {/* Hero create action */}
          <Pressable
            onPress={() => router.push('/create-tournament')}
            style={({ pressed }) => [styles.heroCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Image
              source={require('@/assets/images/illustrations/tournament_cover.png')}
              style={styles.heroArt}
              contentFit="contain"
            />
            <View style={[styles.heroIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={22} color="#ffffff" />
            </View>
            <ThemedText style={[type.title, { color: theme.text, marginTop: Spacing.sm }]}>
              New tournament
            </ThemedText>
            <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 2 }]}>
              Six guided steps — the same flow as publishing a turf.
            </ThemedText>

            <View style={styles.stepPreviewRow}>
              {STEPS_PREVIEW.map((s, i) => (
                <React.Fragment key={s.label}>
                  <View style={styles.stepPreviewItem}>
                    <View style={[styles.stepPreviewCircle, { borderColor: theme.outlineVariant + '66', backgroundColor: theme.surfaceLow }]}>
                      <Ionicons name={s.icon as any} size={11} color={theme.textSecondary} />
                    </View>
                    <ThemedText style={[styles.stepPreviewLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                      {s.label}
                    </ThemedText>
                  </View>
                  {i < STEPS_PREVIEW.length - 1 && (
                    <View style={[styles.stepPreviewLine, { backgroundColor: theme.outlineVariant + '44' }]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.heroCta, { backgroundColor: theme.primary }]}>
              <ThemedText style={[type.bodyStrong, { color: '#ffffff' }]}>Start creating</ThemedText>
              <Ionicons name="chevron-forward" size={15} color="#ffffff" />
            </View>
          </Pressable>

          {/* Existing tournaments */}
          <ThemedText style={[type.micro, styles.sectionTitle, { color: theme.textSecondary }]}>
            YOUR TOURNAMENTS ({mine.length})
          </ThemedText>

          {mine.length === 0 ? (
            <View style={[styles.empty, { borderColor: theme.outlineVariant + '55' }]}>
              <Ionicons name="trophy-outline" size={20} color={theme.textSecondary} />
              <ThemedText style={[type.small, { color: theme.textSecondary, textAlign: 'center' }]}>
                No tournaments yet. Your first cup will show up here once published.
              </ThemedText>
            </View>
          ) : (
            mine.map((t) => {
              const filled = t.maxTeams > 0 ? Math.min(1, t.teamsCount / t.maxTeams) : 0;
              const tint = STATUS_TINT[t.status] || '#6B7280';
              return (
                <View
                  key={t.id}
                  style={[styles.cupCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
                >
                  {/* Row 1 — identity and status */}
                  <View style={styles.cupTopRow}>
                    <View style={[styles.cupSportBadge, { backgroundColor: tint + '18' }]}>
                      <Ionicons name="trophy" size={13} color={tint} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemedText style={[type.bodyStrong, { color: theme.text }]} numberOfLines={1}>
                        {t.name}
                      </ThemedText>
                      <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                        {t.sport} · {t.location || 'Venue TBD'}
                      </ThemedText>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: tint + '1F' }]}>
                      <ThemedText style={[type.micro, { color: tint }]}>{t.status}</ThemedText>
                    </View>
                  </View>

                  {/* Row 2 — registration fill, the number an organizer checks first */}
                  <View style={styles.cupProgressRow}>
                    <View style={[styles.cupProgressTrack, { backgroundColor: theme.outlineVariant + '33' }]}>
                      <View style={[styles.cupProgressFill, { width: `${filled * 100}%`, backgroundColor: tint }]} />
                    </View>
                    <ThemedText style={[type.micro, { color: theme.textSecondary }]}>
                      {t.teamsCount}/{t.maxTeams} teams
                    </ThemedText>
                  </View>

                  {/* Row 3 — money and actions */}
                  <View style={[styles.cupFooter, { borderTopColor: theme.outlineVariant + '22' }]}>
                    <View style={styles.cupMeta}>
                      <Ionicons name="cash-outline" size={12} color={theme.textSecondary} />
                      <ThemedText style={[type.micro, { color: theme.textSecondary }]} numberOfLines={1}>
                        Entry ₹{t.entryFee ?? 0}
                      </ThemedText>
                    </View>
                    <View style={styles.cupMeta}>
                      <Ionicons name="trophy-outline" size={12} color={theme.textSecondary} />
                      <ThemedText style={[type.micro, { color: theme.textSecondary }]} numberOfLines={1}>
                        {t.prizePoolAmount ? `₹${Number(t.prizePoolAmount).toLocaleString('en-IN')}` : 'TBD'}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Pressable
                      onPress={() => addMediaFor(t)}
                      hitSlop={6}
                      disabled={uploadingId === t.id}
                      accessibilityLabel={`Add media to ${t.name}`}
                      style={styles.cardAction}
                    >
                      <Ionicons
                        name={uploadingId === t.id ? 'hourglass-outline' : 'images-outline'}
                        size={16}
                        color={uploadingId === t.id ? theme.outlineVariant : theme.primary}
                      />
                      {(t.mediaImages?.length ?? 0) > 0 && (
                        <View style={[styles.mediaCountDot, { backgroundColor: theme.primary }]}>
                          <ThemedText style={styles.mediaCountText}>{t.mediaImages?.length}</ThemedText>
                        </View>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/tournament-details', params: { id: t.id } })}
                      hitSlop={6}
                      accessibilityLabel={`View ${t.name}`}
                      style={styles.cardAction}
                    >
                      <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/create-tournament', params: { editId: t.id } })}
                      hitSlop={6}
                      accessibilityLabel={`Edit ${t.name}`}
                      style={styles.cardAction}
                    >
                      <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                    </Pressable>
                    <Pressable
                      onPress={() => setPendingDelete(t)}
                      hitSlop={6}
                      accessibilityLabel={`Delete ${t.name}`}
                      style={styles.cardAction}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {!!toast && (
          <View style={[styles.toast, { backgroundColor: theme.text }]} pointerEvents="none">
            <ThemedText style={[type.micro, { color: theme.background }]} numberOfLines={2}>{toast}</ThemedText>
          </View>
        )}

        {/* Delete confirmation */}
        <Modal visible={!!pendingDelete} transparent animationType="fade" onRequestClose={() => setPendingDelete(null)}>
          <View style={styles.confirmOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPendingDelete(null)} accessibilityLabel="Dismiss" />
            <View style={[styles.confirmCard, { backgroundColor: theme.surfaceLowest }]}>
              <View style={[styles.confirmIcon, { backgroundColor: '#EF444418' }]}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </View>
              <ThemedText style={[type.title, { color: theme.text, marginTop: Spacing.sm }]}>
                Delete tournament?
              </ThemedText>
              <ThemedText style={[type.small, { color: theme.textSecondary, marginTop: 4 }]}>
                {pendingDelete && pendingDelete.teamsCount > 0
                  ? `${pendingDelete.name} has ${pendingDelete.teamsCount} team${pendingDelete.teamsCount === 1 ? '' : 's'} registered. Deleting removes them too, and cannot be undone.`
                  : `${pendingDelete?.name ?? ''} will be removed permanently.`}
              </ThemedText>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={() => setPendingDelete(null)}
                  style={[styles.confirmBtn, { borderWidth: 1.5, borderColor: theme.outlineVariant }]}
                >
                  <ThemedText style={[type.bodyStrong, { color: theme.text }]}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (pendingDelete) deleteTournament(pendingDelete.id);
                    setPendingDelete(null);
                  }}
                  style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
                >
                  <ThemedText style={[type.bodyStrong, { color: '#ffffff' }]}>Delete</ThemedText>
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
  body: { padding: Spacing.containerMargin, paddingBottom: 120 },

  heroCard: {
    marginTop: Spacing.base,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    overflow: 'hidden',
    ...Shadows.level2,
  },
  heroArt: {
    position: 'absolute',
    right: -18,
    top: -10,
    width: 130,
    height: 130,
    opacity: 0.12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },

  stepPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.base },
  stepPreviewItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepPreviewCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPreviewLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.2, fontFamily: 'Sora_500Medium' },
  stepPreviewLine: { width: 14, height: 1.5, marginTop: 26 / 2 - 0.75, marginHorizontal: 2 },

  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: Spacing.base,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },

  sectionTitle: { letterSpacing: 0.6, marginTop: Spacing.lg, marginBottom: Spacing.sm },

  cupCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
    marginBottom: Spacing.sm,
    ...Shadows.level1,
  },
  cupTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  cupSportBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cupProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  cupProgressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  cupProgressFill: { height: '100%', borderRadius: 3 },
  cupFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 9, borderTopWidth: 1 },
  cupMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: BorderRadius.full },
  cardAction: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  mediaCountDot: {
    position: 'absolute',
    top: 1,
    right: 0,
    minWidth: 13,
    height: 13,
    paddingHorizontal: 2.5,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCountText: { color: '#ffffff', fontSize: 8, fontFamily: 'Sora_600SemiBold', lineHeight: 13 },
  toast: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    bottom: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.level3,
  },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.base },
  confirmCard: { width: '100%', maxWidth: 380, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.level3 },
  confirmIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  confirmActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.base },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: BorderRadius.lg },

  empty: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    gap: 8,
  },
});
