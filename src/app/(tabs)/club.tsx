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
import { toPersistableImage, durableImages } from '@/utils/persist-image';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { EditIcon } from '@/components/ui/edit-icon';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTypeRamp } from '@/lib/typography';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useTournamentStore } from '@/store/app-store';
import type { PublishedTournament } from '@/store/tournament-store';
import { hostTournamentStatus } from '@/store/tournament-store';

const STATUS_TINT: Record<string, string> = {
  Draft: '#6B7280',
  Upcoming: '#0EA5E9',
  Registering: '#4F46E5',
  Full: '#F59E0B',
  'Registration closed': '#64748B',
  Ongoing: '#10B981',
  Completed: '#94A3B8',
  Cancelled: '#EF4444',
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
  const { publishedTournaments, registrations, deleteTournament, updateTournament } = useTournamentStore();
  /**
   * Deleting is confirmed with an in-app modal rather than Alert.alert:
   * react-native-web ignores Alert's button list, so on web the destructive
   * callback never fired and the button looked broken.
   */
  const [pendingDelete, setPendingDelete] = useState<PublishedTournament | null>(null);
  const [mediaFor, setMediaFor] = useState<PublishedTournament | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);

  /** Teams actually registered — a rejection frees its place. */
  const registeredCount = (t: PublishedTournament) =>
    (registrations || []).filter((r: any) => r.tournamentId === t.id && r.status !== 'rejected').length;

  /**
   * A tournament whose roster has filled, from real registrations. Taking the
   * larger of this and the stored `teamsCount` let a stale counter lock a
   * tournament that still had places, and disagree with the card's own count.
   */
  const isFull = (t: PublishedTournament) => {
    const max = Number(t.maxTeams) || 0;
    return max > 0 && registeredCount(t) >= max;
  };

  /**
   * Open a draft straight into the wizard.
   *
   * The banner used to push to /create-tournament and open the picker on top,
   * so an empty "Create Tournament" appeared before the draft was chosen. The
   * draft is picked here, and the wizard opens already populated.
   */
  const openDraft = (draft: any) => {
    setDraftsOpen(false);
    router.push({ pathname: '/create-tournament', params: { draftId: draft.id } });
  };

  const deleteDraft = (id: string) => {
    const next = drafts.filter(d => d.id !== id);
    setDrafts(next);
    AsyncStorage.setItem('@turf_tournament_drafts', JSON.stringify(next)).catch(() => {});
  };

  // Drafts live in AsyncStorage, written by the create wizard. Re-read on focus
  // so publishing one makes the banner disappear without a restart.
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      AsyncStorage.getItem('@turf_tournament_drafts')
        .then(raw => {
          if (!alive) return;
          const parsed = raw ? JSON.parse(raw) : [];
          setDrafts(Array.isArray(parsed) ? parsed : []);
        })
        .catch(() => setDrafts([]));
      return () => {
        alive = false;
      };
    }, [])
  );

  /**
   * Only the photos that can still render. A gallery saved before the picker
   * started base64-encoding holds revoked blob: URLs, which drew as empty grey
   * boxes with a remove button and no image.
   */
  const mediaShown = useMemo(() => durableImages(mediaFor?.mediaImages), [mediaFor]);
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
  /**
   * Add photos to the tournament open in the media manager.
   *
   * Images are converted to data URIs before storage: the picker returns a
   * `blob:` uri on web that is revoked on reload, so a gallery saved from here
   * came back empty next launch.
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
        base64: true,
      });
      if (result.canceled) return;

      const uris: string[] = [];
      let tooLarge = 0;
      for (const asset of result.assets || []) {
        const persisted = toPersistableImage(asset as any);
        if (persisted.ok) uris.push(persisted.uri);
        else if (persisted.reason === 'too-large') tooLarge += 1;
        else if (persisted.uri) uris.push(persisted.uri);
      }
      if (uris.length === 0) {
        flashToast(tooLarge > 0 ? 'Those images are too large to save' : 'Nothing was added');
        return;
      }

      const existing = t.mediaImages || [];
      // Re-picking the same photo shouldn't duplicate it in the gallery.
      const merged = [...existing, ...uris.filter(u => !existing.includes(u))].slice(0, 12);
      updateTournament(t.id, { mediaImages: merged });
      setMediaFor(prev => (prev && prev.id === t.id ? { ...prev, mediaImages: merged } : prev));

      const added = merged.length - existing.length;
      flashToast(
        tooLarge > 0
          ? `${added} added · ${tooLarge} too large to save`
          : `${added} photo${added === 1 ? '' : 's'} added to ${t.name}`
      );
    } finally {
      setUploadingId(null);
    }
  };

  /** Drop one photo from the tournament's gallery. */
  const removeMediaFrom = (t: PublishedTournament, uri: string) => {
    const next = (t.mediaImages || []).filter(u => u !== uri);
    updateTournament(t.id, { mediaImages: next });
    setMediaFor(prev => (prev && prev.id === t.id ? { ...prev, mediaImages: next } : prev));
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
              <Ionicons name="add" size={20} color="#ffffff" />
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

          {/* Saved drafts — unfinished tournaments were only reachable from
              inside the create wizard, so an organiser who left the screen had
              no way back to them. */}
          {drafts.length > 0 && (
            <Pressable
              onPress={() => setDraftsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Continue from ${drafts.length} saved draft${drafts.length === 1 ? '' : 's'}`}
              style={({ pressed }) => [
                styles.draftBanner,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55', opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={[styles.draftIconBg, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="folder-open-outline" size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText style={[type.bodyStrong, { color: theme.text }]} numberOfLines={1}>
                  {drafts.length} saved draft{drafts.length === 1 ? '' : 's'}
                </ThemedText>
                <ThemedText style={[type.small, { color: theme.textSecondary }]} numberOfLines={1}>
                  Pick up where you left off — {drafts[0]?.name || 'Untitled Draft'}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          )}

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
              const taken = registeredCount(t);
              const filled = t.maxTeams > 0 ? Math.min(1, taken / t.maxTeams) : 0;
              // From dates and registrations; the stored status never moves on.
              const status = hostTournamentStatus(t, taken);
              const tint = STATUS_TINT[status] || '#6B7280';
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
                      <ThemedText style={[type.micro, { color: tint }]} numberOfLines={1}>{status}</ThemedText>
                    </View>
                  </View>

                  {/* Row 2 — registration fill, the number an organizer checks first */}
                  <View style={styles.cupProgressRow}>
                    <View style={[styles.cupProgressTrack, { backgroundColor: theme.outlineVariant + '33' }]}>
                      <View style={[styles.cupProgressFill, { width: `${filled * 100}%`, backgroundColor: tint }]} />
                    </View>
                    <ThemedText style={[type.micro, { color: theme.textSecondary }]}>
                      {taken}/{t.maxTeams} teams
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
                      onPress={() => setMediaFor(t)}
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
                      {durableImages(t.mediaImages).length > 0 && (
                        <View style={[styles.mediaCountDot, { backgroundColor: theme.primary }]}>
                          <ThemedText style={styles.mediaCountText}>
                            {durableImages(t.mediaImages).length}
                          </ThemedText>
                        </View>
                      )}
                    </Pressable>
                    {/* Fixtures — opens the planner to view, generate or update the
                        draw. The badge counts the matches already drawn. */}
                    <Pressable
                      onPress={() => router.push({ pathname: '/fixture-management', params: { tournamentId: t.id } })}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`${(t.fixtures?.length ?? 0) > 0 ? 'Update' : 'Open'} fixtures for ${t.name}`}
                      style={styles.cardAction}
                    >
                      <Ionicons name="git-network-outline" size={16} color={theme.primary} />
                      {(t.fixtures?.length ?? 0) > 0 && (
                        <View style={[styles.mediaCountDot, { backgroundColor: '#10B981' }]}>
                          <ThemedText style={styles.mediaCountText}>{t.fixtures!.length}</ThemedText>
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
                      <EditIcon size={16} />
                    </Pressable>
                    {/* Deleting is blocked once the roster is full: those teams
                        have paid to enter, and removing the tournament would
                        take their fixtures and entry fees with it. */}
                    <Pressable
                      onPress={() =>
                        isFull(t)
                          ? flashToast(`${t.name} is full — it can no longer be deleted`)
                          : setPendingDelete(t)
                      }
                      hitSlop={6}
                      disabled={isFull(t)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isFull(t) }}
                      accessibilityLabel={
                        isFull(t)
                          ? `${t.name} is full and cannot be deleted`
                          : `Delete ${t.name}`
                      }
                      style={[styles.cardAction, isFull(t) && { opacity: 0.35 }]}
                    >
                      <Ionicons
                        name={isFull(t) ? 'lock-closed-outline' : 'trash-outline'}
                        size={16}
                        color={isFull(t) ? theme.textSecondary : '#EF4444'}
                      />
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

        {/* Media manager — opened from a tournament card's photo icon.
            Tapping the icon used to launch the OS picker straight away, so
            there was no way to see or remove what had already been added. */}
        <Modal
          visible={!!mediaFor}
          transparent
          animationType="fade"
          onRequestClose={() => setMediaFor(null)}
        >
          <View style={styles.confirmOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setMediaFor(null)}
              accessibilityLabel="Close media manager"
            />
            <View style={[styles.mediaCard, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.mediaHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText style={[type.title, { color: theme.text }]} numberOfLines={1}>
                    Media gallery
                  </ThemedText>
                  <ThemedText style={[type.small, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                    {mediaFor?.name} · {mediaShown.length}/12 photos
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setMediaFor(null)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: 320 }}
                contentContainerStyle={styles.mediaGrid}
                showsVerticalScrollIndicator={false}
              >
                {mediaShown.length === 0 ? (
                  <Pressable
                    onPress={() => mediaFor && addMediaFor(mediaFor)}
                    style={[styles.mediaEmpty, { borderColor: theme.outlineVariant }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add the first photos"
                  >
                    <Ionicons name="images-outline" size={20} color={theme.textSecondary} />
                    <ThemedText style={[type.small, { color: theme.textSecondary, textAlign: 'center', marginTop: 6 }]}>
                      No photos yet. Add match shots, the ground, or your poster —
                      they appear under the tournament's Media tab.
                    </ThemedText>
                  </Pressable>
                ) : (
                  mediaShown.map((uri) => (
                    <View key={uri} style={styles.mediaThumbWrap}>
                      <Image source={{ uri }} style={styles.mediaThumb} contentFit="cover" />
                      <Pressable
                        onPress={() => mediaFor && removeMediaFrom(mediaFor, uri)}
                        style={styles.mediaRemove}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Remove this photo"
                      >
                        <Ionicons name="close" size={12} color="#ffffff" />
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>

              <Pressable
                onPress={() => mediaFor && addMediaFor(mediaFor)}
                disabled={uploadingId === mediaFor?.id || mediaShown.length >= 12}
                style={({ pressed }) => [
                  styles.mediaAddBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity:
                      pressed || uploadingId === mediaFor?.id || mediaShown.length >= 12 ? 0.6 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add photos"
              >
                <Ionicons
                  name={uploadingId === mediaFor?.id ? 'hourglass-outline' : 'add'}
                  size={17}
                  color="#ffffff"
                />
                <ThemedText style={[type.bodyStrong, { color: '#ffffff' }]}>
                  {uploadingId === mediaFor?.id
                    ? 'Adding…'
                    : mediaShown.length >= 12
                      ? 'Gallery full (12)'
                      : 'Add photos'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Saved drafts picker */}
        <Modal
          visible={draftsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDraftsOpen(false)}
        >
          <View style={styles.confirmOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setDraftsOpen(false)}
              accessibilityLabel="Close drafts"
            />
            <View style={[styles.mediaCard, { backgroundColor: theme.surfaceLowest }]}>
              <View style={styles.mediaHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText style={[type.title, { color: theme.text }]}>Saved drafts</ThemedText>
                  <ThemedText style={[type.small, { color: theme.textSecondary, marginTop: 2 }]}>
                    Pick one to carry on where you left off
                  </ThemedText>
                </View>
                <Pressable onPress={() => setDraftsOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {drafts.map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() => openDraft(d)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open draft ${d.name || 'Untitled Draft'}`}
                    style={({ pressed }) => [
                      styles.draftRow,
                      { borderColor: theme.outlineVariant + '44', opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.draftIconBg, { backgroundColor: theme.primary + '18' }]}>
                      <Ionicons name="document-text-outline" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemedText style={[type.bodyStrong, { color: theme.text }]} numberOfLines={1}>
                        {d.name || 'Untitled Draft'}
                      </ThemedText>
                      <ThemedText style={[type.small, { color: theme.textSecondary }]} numberOfLines={1}>
                        {[d.sportType, d.selectedGround].filter(Boolean).join(' · ') || 'No details yet'}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => deleteDraft(d.id)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete draft ${d.name || 'Untitled'}`}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
                {pendingDelete && registeredCount(pendingDelete) > 0
                  ? `${pendingDelete.name} has ${registeredCount(pendingDelete)} team${registeredCount(pendingDelete) === 1 ? '' : 's'} registered. Deleting removes them too, and cannot be undone.`
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
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.base,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: 8,
  },
  draftIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.level3,
  },
  mediaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.sm },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  mediaEmpty: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  mediaThumbWrap: { width: 84, height: 84, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  mediaThumb: { width: '100%', height: '100%' },
  mediaRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
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
