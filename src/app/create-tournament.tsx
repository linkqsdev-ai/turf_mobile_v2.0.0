import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SPORTS_LIST } from '@/constants/sports';
import { MaterialIcons } from '@expo/vector-icons';
import { useTournamentStore } from '@/store/app-store';
import { generateTournamentId, rulePresetsForSport } from '@/store/tournament-store';
import { useUserProfile } from '@/hooks/use-user-profile';

/** Where saved tournament drafts persist between sessions. */
const DRAFTS_KEY = '@turf_tournament_drafts';

// Step-tracker geometry, matching Create Turf so both wizards read identically.
const STEP_CIRCLE = 26;
const STEP_LABEL_LINE = 12;
const STEP_CONNECTOR_H = 1.5;

const STEPS = [
  { title: 'Basic', icon: 'information-circle-outline' },
  { title: 'Schedule', icon: 'calendar-outline' },
  { title: 'Venue', icon: 'map-outline' },
  { title: 'Rules', icon: 'document-text-outline' },
  { title: 'Fees', icon: 'cash-outline' },
  { title: 'Prizes', icon: 'trophy-outline' },
];

/**
 * Digits only, capped at 10, grouped 5+5 — "98765 43210".
 * Mirrors formatPhoneNumber in create-turf so both wizards store the same shape.
 */
function formatPhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** An Indian mobile is exactly 10 digits and never starts 0-5. */
function isValidPhone(value: string): boolean {
  const digits = String(value || '').replace(/\D/g, '');
  return /^[6-9][0-9]{9}$/.test(digits);
}

/**
 * Pulls the first number out of a free-text money field.
 * "₹2,500 + Gold Trophy" -> 2500 · "150" -> 150 · "" / "TBD" -> 0
 */
function parseAmount(value?: string): number {
  const match = (value || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? Math.round(parseFloat(match[0])) : 0;
}

/** Keeps exactly one ₹ on the display label, whatever the user typed. */
function formatPrizeLabel(value?: string): string {
  const v = (value || '').trim();
  if (!v) return 'TBD';
  return v.startsWith('₹') ? v : `₹${v}`;
}

export default function CreateTournamentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { addTournament, updateTournament, publishedTournaments } = useTournamentStore();
  const { profile } = useUserProfile();
  /** Phone is the canonical identity elsewhere in the app; email/name back it up. */
  const ownerKey = (profile?.phone || '').replace(/\D/g, '').slice(-10)
    || (profile?.email || '').trim().toLowerCase()
    || (profile?.name || '').trim().toLowerCase();
  /** Present when the organizer opened this wizard to fix a published cup. */
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = typeof params.editId === 'string' ? params.editId : undefined;
  const isEditing = Boolean(editId);

  // Cover Presets for Tournament Sample Image
  const COVER_PRESETS = [
    { name: 'Tournament Cover', source: require('@/assets/images/illustrations/tournament_cover.png') },
    { name: 'Football Arena', source: require('@/assets/images/illustrations/football_player.png') },
    { name: 'Stadium Turf', source: require('@/assets/images/illustrations/stadium.png') },
    { name: 'Cricket Field', source: require('@/assets/images/illustrations/cricket_player.png') },
    { name: 'Tennis Grass', source: require('@/assets/images/illustrations/tennis_player.png') },
    { name: 'Team Huddle', source: require('@/assets/images/illustrations/team_huddle.png') },
  ];

  // Drafts State
  const [draftsModalVisible, setDraftsModalVisible] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([
    {
      id: 'draft-1',
      name: 'London Winter Cup',
      description: 'Upcoming winter indoor football cup.',
      sportType: 'Football',
      tournamentType: 'Knockout',
      organizerName: 'Azarudeen',
      organizerContact: 'azar@career.com',
      regStart: '2026-11-01',
      regEnd: '2026-11-20',
      tournStart: '2026-12-01',
      tournEnd: '2026-12-10',
      selectedGround: 'Elms Field Ground A',
      address: 'Elms Road, London SE1',
      latLng: '51.5074° N, 0.1278° W',
      matchDuration: '60 Mins',
      teamSize: '7 players',
      overs: 'N/A',
      pointSystem: '3 pts Win, 1 pt Draw',
      entryFee: '₹100',
      registrationFee: '₹15',
      deposit: '₹30',
      winnerPrize: '₹1,500',
      runnerPrize: '₹500',
      mvpPrize: '₹100',
      banner: require('@/assets/images/illustrations/stadium.png'),
    },
    {
      id: 'draft-2',
      name: 'Regents T10 Super League',
      description: 'Cricket net tournament at Regents ground.',
      sportType: 'Cricket',
      tournamentType: 'League',
      organizerName: 'London Cricket Guild',
      organizerContact: 'guild@cricket.com',
      regStart: '2026-08-01',
      regEnd: '2026-08-15',
      tournStart: '2026-09-01',
      tournEnd: '2026-09-10',
      selectedGround: 'Regents Cricket Oval',
      address: 'Regents Ground, London',
      latLng: '51.5300° N, 0.1500° W',
      matchDuration: '90 Mins',
      teamSize: '11 players',
      overs: '10 Overs',
      pointSystem: '2 pts Win, 0 pts Loss',
      entryFee: '₹200',
      registrationFee: '₹20',
      deposit: '₹50',
      winnerPrize: '₹3,000',
      runnerPrize: '₹1,500',
      mvpPrize: '₹300',
      banner: require('@/assets/images/illustrations/cricket_player.png'),
    }
  ]);

  // Form Fields State
  const [form, setForm] = useState({
    // Section 1: Basic
    name: '',
    description: '',
    sportType: 'Football', // Football, Cricket, Tennis
    tournamentType: 'Knockout', // Knockout, League, Round Robin
    organizerName: '',
    organizerContact: '',
    banner: require('@/assets/images/illustrations/tournament_cover.png'), // Default cover banner
    
    // Section 2: Schedule
    regStart: '2026-06-12',
    regEnd: '2026-06-25',
    tournStart: '2026-07-01',
    tournEnd: '2026-07-15',
    
    // Section 3: Venue
    selectedGround: '',
    address: '',
    latLng: '',
    
    // Section 4: Rules
    matchDuration: '90 Mins',
    teamSize: '11 players',
    overs: '',
    pointSystem: '3 pts Win, 1 pt Draw, 0 pts Loss',
    // Ticked rules, plus any the organizer wrote themselves.
    rules: [] as string[],
    customRules: [] as string[],
    // Gallery images shown under the tournament's Media tab.
    mediaImages: [] as string[],
    
    // Section 5: Fees
    maxTeams: '16',
    entryFee: '₹150',
    registrationFee: '₹25',
    deposit: '₹50',
    
    // Section 6: Prizes
    winnerPrize: '₹2,500 + Gold Trophy',
    runnerPrize: '₹1,000 + Silver Medal',
    mvpPrize: '₹200 + Boot Trophy',
  });

  // Restore any drafts this device saved earlier.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFTS_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length > 0) {
          setDrafts(prev => {
            const seenIds = new Set(stored.map((d: any) => d.id));
            return [...stored, ...prev.filter((d: any) => !seenIds.has(d.id))];
          });
        }
      } catch {
        // A corrupt draft blob shouldn't stop the wizard opening.
      }
    })();
  }, []);

  // Load the tournament being edited into the form. Only the fields the
  // record actually carries are overwritten, so a cup published before the
  // model was extended keeps the wizard's defaults rather than blanking out.
  useEffect(() => {
    if (!editId) return;
    const t = publishedTournaments.find((x: any) => x.id === editId);
    if (!t) return;
    setForm(prev => ({
      ...prev,
      name: t.name ?? prev.name,
      description: t.description ?? prev.description,
      sportType: t.sport ?? prev.sportType,
      tournamentType: t.type ?? prev.tournamentType,
      organizerName: t.organizerName ?? prev.organizerName,
      organizerContact: t.organizerContact ?? prev.organizerContact,
      regStart: t.regStart ?? prev.regStart,
      regEnd: t.regEnd ?? prev.regEnd,
      tournStart: t.startDate ?? prev.tournStart,
      tournEnd: t.endDate ?? prev.tournEnd,
      selectedGround: t.location ?? prev.selectedGround,
      address: t.venueAddress ?? prev.address,
      matchDuration: t.matchDuration ?? prev.matchDuration,
      teamSize: t.teamSize ?? prev.teamSize,
      overs: t.overs ?? prev.overs,
      pointSystem: t.pointSystem ?? prev.pointSystem,
      maxTeams: t.maxTeams != null ? String(t.maxTeams) : prev.maxTeams,
      entryFee: t.entryFee != null ? `₹${t.entryFee}` : prev.entryFee,
      registrationFee: t.registrationFee ?? prev.registrationFee,
      deposit: t.deposit ?? prev.deposit,
      winnerPrize: t.winnerPrize ?? t.prizePool ?? prev.winnerPrize,
      runnerPrize: t.runnerPrize ?? prev.runnerPrize,
      mvpPrize: t.mvpPrize ?? prev.mvpPrize,
      banner: t.banner ?? prev.banner,
      rules: Array.isArray(t.rules) ? t.rules : prev.rules,
      // Anything ticked that isn't a preset for this sport must have been the
      // organizer's own rule, so it belongs back in the custom list.
      customRules: Array.isArray(t.rules)
        ? t.rules.filter((r: string) => !rulePresetsForSport(t.sport || '').includes(r))
        : prev.customRules,
      mediaImages: Array.isArray(t.mediaImages) ? t.mediaImages : prev.mediaImages,
    }));

    // Rebuild the photo grid exactly as it was saved, so an edit that touches
    // nothing else re-publishes the same cover.
    if (Array.isArray(t.coverImages)) {
      const slots = [0, 1, 2].map(i => (t.coverImages as (string | null)[])[i] ?? null);
      setTournamentImages(slots);
      const pinned = typeof t.coverIndex === 'number' && slots[t.coverIndex] ? t.coverIndex : slots.findIndex(Boolean);
      setPinnedIndex(pinned === -1 ? 0 : pinned);
    }
    if (t.banner && typeof t.banner === 'object' && 'uri' in t.banner) {
      setCustomImageUri((t.banner as { uri: string }).uri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, publishedTournaments.length]);

  // Action feedback toasts
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  // Custom cover image & date picker states
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  /**
   * Three photo slots, mirroring create-turf. Positions are meaningful — a
   * `null` is an empty slot, not a missing photo — so the grid stays stable
   * while the organizer swaps individual images around.
   */
  const [tournamentImages, setTournamentImages] = useState<(string | null)[]>([null, null, null]);
  const [pinnedIndex, setPinnedIndex] = useState<number>(0);
  const [customRuleText, setCustomRuleText] = useState('');
  const [datePickerField, setDatePickerField] = useState<'regStart' | 'regEnd' | 'tournStart' | 'tournEnd' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date(2026, 5, 23));

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload custom covers!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.95,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setCustomImageUri(uri);
      setForm(prev => ({ ...prev, banner: { uri } }));
    }
  };

  /** Fills one of the three cover slots from the photo library. */
  const pickSlotImage = async (slotIndex: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      triggerToast('Photo permission is needed to add images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setTournamentImages(prev => {
      const next = [...prev];
      next[slotIndex] = uri;
      // Pin the first photo added, so a cover always exists without the
      // organizer having to think about it.
      if (!prev.some(Boolean) || !prev[pinnedIndex]) {
        setPinnedIndex(slotIndex);
        setCustomImageUri(uri);
        setForm(f => ({ ...f, banner: { uri } }));
      }
      return next;
    });
  };

  const removeSlotImage = (slotIndex: number) => {
    setTournamentImages(prev => {
      const next = [...prev];
      next[slotIndex] = null;
      if (pinnedIndex === slotIndex) {
        // Fall back to whatever photo is still there; if none, the preset
        // cover takes over again.
        const remaining = next.findIndex(Boolean);
        setPinnedIndex(remaining === -1 ? 0 : remaining);
        const fallback = remaining === -1 ? null : next[remaining];
        setCustomImageUri(fallback);
        setForm(f => ({ ...f, banner: fallback ? { uri: fallback } : COVER_PRESETS[0].source }));
      }
      return next;
    });
  };

  const pinSlotImage = (slotIndex: number) => {
    const uri = tournamentImages[slotIndex];
    if (!uri) return;
    setPinnedIndex(slotIndex);
    setCustomImageUri(uri);
    setForm(prev => ({ ...prev, banner: { uri } }));
  };

  /** Presets follow the sport, so switching sport re-offers the right list. */
  const rulePresets = rulePresetsForSport(form.sportType);

  const toggleRule = (rule: string) => {
    setForm(prev => ({
      ...prev,
      rules: prev.rules.includes(rule)
        ? prev.rules.filter(r => r !== rule)
        : [...prev.rules, rule],
    }));
  };

  const addCustomRule = () => {
    const text = customRuleText.trim();
    if (!text) return;
    if ([...form.rules, ...form.customRules].includes(text)) {
      triggerToast('That rule is already on the list');
      return;
    }
    // A custom rule is added already ticked — writing it *is* the decision to
    // include it, so making the organizer tick it again would be busywork.
    setForm(prev => ({
      ...prev,
      customRules: [...prev.customRules, text],
      rules: [...prev.rules, text],
    }));
    setCustomRuleText('');
  };

  const removeCustomRule = (rule: string) => {
    setForm(prev => ({
      ...prev,
      customRules: prev.customRules.filter(r => r !== rule),
      rules: prev.rules.filter(r => r !== rule),
    }));
  };

  /** Adds one or more photos to the tournament gallery. */
  const pickMediaImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      triggerToast('Photo permission is needed to add images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.9,
    });
    if (result.canceled) return;
    const uris = (result.assets || []).map(a => a.uri).filter(Boolean);
    setForm(prev => {
      // De-duplicate: re-picking the same photo shouldn't add it twice.
      const merged = [...prev.mediaImages, ...uris.filter(u => !prev.mediaImages.includes(u))];
      return { ...prev, mediaImages: merged.slice(0, 12) };
    });
    triggerToast(`${uris.length} image${uris.length === 1 ? '' : 's'} added`);
  };

  const removeMediaImage = (uri: string) => {
    setForm(prev => ({ ...prev, mediaImages: prev.mediaImages.filter(u => u !== uri) }));
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMsg(null));
  };

  /**
   * Per-step required fields. Create Turf gates each step this way; without it
   * a tournament could be published with no name, no organizer and no venue,
   * and the broken record only surfaced on the public listing.
   *
   * Dates and fees ship with sensible defaults, so those steps validate on
   * ordering/sanity rather than presence.
   */
  /**
   * The first problem with the current step, or null when it is complete.
   *
   * Returning the reason (rather than a bare boolean) lets one source of truth
   * drive three things at once: whether the button is enabled, what the toast
   * says if someone taps anyway, and which inline error is shown. Previously
   * validation only ran on tap, so the button always looked available and the
   * form could be walked through end-to-end while empty.
   */
  const stepIssue = (step: number): string | null => {
    if (step === 0) {
      if (!form.name.trim()) return 'Tournament name is required';
      if (!form.organizerName.trim()) return 'Organizer name is required';
      if (!form.organizerContact.trim()) return 'Organizer contact is required';
      if (!isValidPhone(form.organizerContact)) return 'Enter a valid 10-digit mobile number';
      return null;
    }
    if (step === 1) {
      const regS = new Date(form.regStart).getTime();
      const regE = new Date(form.regEnd).getTime();
      const tS = new Date(form.tournStart).getTime();
      const tE = new Date(form.tournEnd).getTime();
      if (![regS, regE, tS, tE].every(Number.isFinite)) return 'All four dates are required';
      if (regE < regS) return 'Registration must close after it opens';
      if (tE < tS) return 'Tournament must end after it starts';
      // Teams cannot register once play has begun.
      if (tS < regS) return 'Tournament cannot start before registration opens';
      return null;
    }
    if (step === 2) {
      if (!form.selectedGround.trim()) return 'Pick a venue for the tournament';
      return null;
    }
    if (step === 3) {
      // Only cricket needs an over count; other sports have no equivalent.
      if (form.sportType === 'Cricket' && !form.overs.trim()) return 'Overs per innings is required for cricket';
      return null;
    }
    if (step === 4) {
      if (parseAmount(form.entryFee) <= 0) return 'Entry fee is required';
      return null;
    }
    if (step === 5) {
      if (!form.winnerPrize.trim()) return 'A winner prize is required';
      return null;
    }
    return null;
  };

  /**
   * Earliest date the field currently being picked may take. Enforced in the
   * calendar itself so an invalid ordering can never be *selected* — catching
   * it afterwards with a toast left the user staring at a date they had
   * already chosen, wondering which one was wrong.
   *
   *   regEnd     >= regStart      registration can't close before it opens
   *   tournStart >= regStart      teams must be able to register before play
   *   tournEnd   >= tournStart    a cup can't end before it begins
   */
  const minDateForField = (field: typeof datePickerField): string | null => {
    if (field === 'regEnd') return form.regStart || null;
    if (field === 'tournStart') return form.regStart || null;
    if (field === 'tournEnd') return form.tournStart || null;
    return null;
  };

  /** ISO yyyy-mm-dd strings compare correctly lexicographically. */
  const isDateDisabled = (iso: string): boolean => {
    const min = minDateForField(datePickerField);
    return !!min && iso < min;
  };

  const currentIssue = stepIssue(currentStep);
  const canAdvance = currentIssue === null;

  /** Inline error under the contact field, shown only once something is typed. */
  const contactError =
    form.organizerContact.trim() && !isValidPhone(form.organizerContact)
      ? 'Enter a valid 10-digit mobile number'
      : '';

  const validateStep = (step: number): boolean => {
    const issue = stepIssue(step);
    if (issue) {
      triggerToast(issue);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tournaments');
      }
    }
  };

  /**
   * Drafts live in AsyncStorage, not just component state. Previously the UI
   * promised "Save Draft ... to keep it here" while holding them in useState,
   * so every draft vanished on reload.
   */
  const persistDrafts = (next: any[]) => {
    AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next)).catch(() => {
      triggerToast('Could not save the draft to this device');
    });
  };

  const handleSaveDraft = () => {
    const draftId = `draft-${Date.now()}`;
    const newDraft = {
      ...form,
      // A require()'d image is an opaque asset id that will not survive a
      // reload, so drafts keep only serialisable fields.
      banner: undefined,
      id: draftId,
      name: form.name || 'Untitled Draft',
      savedAt: new Date().toISOString(),
    };
    setDrafts(prev => {
      const next = [newDraft, ...prev];
      persistDrafts(next);
      return next;
    });
    triggerToast('Draft saved successfully!');
  };

  const handleSelectDraft = (draft: any) => {
    setForm(draft);
    setDraftsModalVisible(false);
    triggerToast(`Loaded draft: ${draft.name}`);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => {
      const next = prev.filter(d => d.id !== id);
      persistDrafts(next);
      return next;
    });
    triggerToast('Draft deleted.');
  };

  const handlePublish = () => {
    // Re-check every step, not just this one: a user can jump backwards and
    // clear a required field on an earlier step before hitting publish.
    for (let i = 0; i < STEPS.length; i++) {
      const issue = stepIssue(i);
      if (issue) {
        triggerToast(issue);
        setCurrentStep(i);
        return;
      }
    }

    // Validation check
    if (!form.name.trim()) {
      triggerToast('Tournament name is required.');
      setCurrentStep(0);
      return;
    }
    if (!form.organizerName.trim()) {
      triggerToast('Organizer name is required.');
      setCurrentStep(0);
      return;
    }
    if (form.organizerContact && !/^[+0-9 \-()]+$/.test(form.organizerContact)) {
      triggerToast('Organizer contact must be a valid phone number (digits only).');
      setCurrentStep(0);
      return;
    }
    if (form.organizerContact && form.organizerContact.replace(/[^0-9]/g, '').length < 7) {
      triggerToast('Organizer contact must be at least 7 digits.');
      setCurrentStep(0);
      return;
    }

    // The full wizard answer set. Everything the organizer typed is stored,
    // not just the fields the public card shows, so reopening this wizard to
    // edit round-trips instead of resetting the untracked fields.
    const record = {
      name: form.name,
      sport: form.sportType || 'Football',
      type: form.tournamentType || 'Knockout',
      location: form.selectedGround || 'TBD',
      startDate: form.tournStart || '',
      endDate: form.tournEnd || '',
      prizePool: formatPrizeLabel(form.winnerPrize),
      prizePoolAmount: parseAmount(form.winnerPrize),
      entryFee: parseAmount(form.entryFee),
      maxTeams: Math.max(2, parseAmount(form.maxTeams) || 16),
      banner: form.banner || null,
      organizerName: form.organizerName,
      description: form.description,
      organizerContact: form.organizerContact,
      regStart: form.regStart,
      regEnd: form.regEnd,
      venueAddress: form.address,
      matchDuration: form.matchDuration,
      teamSize: form.teamSize,
      overs: form.overs,
      pointSystem: form.pointSystem,
      registrationFee: form.registrationFee,
      deposit: form.deposit,
      winnerPrize: form.winnerPrize,
      runnerPrize: form.runnerPrize,
      mvpPrize: form.mvpPrize,
      rules: form.rules,
      mediaImages: form.mediaImages,
      coverImages: tournamentImages,
      coverIndex: pinnedIndex,
    };

    if (isEditing && editId) {
      // teamsCount and status are owned by the registration/lifecycle flows —
      // an edit must not reset a cup that already has teams in it.
      updateTournament(editId, record);
      triggerToast('Tournament updated!');
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/tournaments');
      }, 1200);
      return;
    }

    addTournament({
      ...record,
      // Stamped once, from the signed-in profile. Deliberately absent from the
      // edit patch above so renaming the organizer can never change ownership.
      organizerId: ownerKey,
      id: generateTournamentId(),
      teamsCount: 0,
      status: 'Registering',
      createdAt: new Date().toISOString(),
    });

    triggerToast('Tournament published successfully!');
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/tournaments');
    }, 1200);
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Step render functions
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Step render functions
  const hasSlotPhotos = tournamentImages.some(Boolean);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepFormContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament name <ThemedText style={styles.requiredStar}>*</ThemedText></ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'name' ? theme.primary : '#00000033' }]}
                placeholder="e.g. London Summer Slam"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Description</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'description' ? theme.primary : '#00000033', height: 80, paddingVertical: 10, textAlignVertical: 'top' }]}
                placeholder="Describe your tournament, match timings, general guidelines..."
                placeholderTextColor={theme.textSecondary + '80'}
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(v) => updateField('description', v)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament photos</ThemedText>
                <ThemedText style={[styles.fieldLabelSub, { color: theme.textSecondary }]}>
                  Tap 📌 to set Cover
                </ThemedText>
              </View>

              <View style={styles.threeImageGrid}>
                {tournamentImages.map((img, idx) => {
                  const isCover = pinnedIndex === idx && !!img;
                  if (img) {
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.imageCardSlot,
                          { borderColor: isCover ? theme.primary : '#00000022' },
                          isCover && { borderWidth: 2 },
                        ]}
                      >
                        <Image source={{ uri: img }} style={styles.imagePreviewFull} contentFit="cover" />

                        {isCover && (
                          <View style={[styles.pinnedCoverBadge, { backgroundColor: theme.primary }]}>
                            <Ionicons name="pin" size={10} color="#ffffff" style={{ marginRight: 2 }} />
                            <ThemedText style={styles.pinnedCoverBadgeText}>Cover</ThemedText>
                          </View>
                        )}

                        {/* Icon-only actions: a text label made this row wider
                            than the slot and clipped the delete button. */}
                        <View style={styles.imageSlotActionOverlay}>
                          <Pressable
                            onPress={() => pinSlotImage(idx)}
                            hitSlop={6}
                            accessibilityLabel="Set as cover photo"
                            style={[
                              styles.pinIconButton,
                              { backgroundColor: isCover ? theme.primary : 'rgba(0,0,0,0.65)' },
                            ]}
                          >
                            <Ionicons name={isCover ? 'pin' : 'pin-outline'} size={12} color="#ffffff" />
                          </Pressable>

                          <Pressable
                            onPress={() => removeSlotImage(idx)}
                            hitSlop={6}
                            accessibilityLabel="Remove photo"
                            style={[styles.deleteIconButton, { backgroundColor: '#ef4444cc' }]}
                          >
                            <Ionicons name="trash-outline" size={12} color="#ffffff" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => pickSlotImage(idx)}
                      style={[
                        styles.imageCardSlot,
                        styles.imageCardPlaceholder,
                        { backgroundColor: theme.surfaceLow, borderColor: '#00000022' },
                      ]}
                    >
                      <View style={[styles.uploadIconCircle, { backgroundColor: theme.primary + '16' }]}>
                        <Ionicons name="camera-outline" size={20} color={theme.primary} />
                      </View>
                      <ThemedText style={[styles.uploadSlotTitle, { color: theme.primary }]}>Upload</ThemedText>
                      <ThemedText style={[styles.uploadSlotSub, { color: theme.textSecondary }]}>Photo {idx + 1}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Presets remain as the no-photo fallback: a cup published from
                  a desk still needs a cover. Selecting one un-pins the photos. */}
              <ThemedText style={[styles.fieldLabelSub, { color: theme.textSecondary, marginTop: 12 }]}>
                {hasSlotPhotos ? 'Or use a preset cover instead' : 'No photo? Pick a preset cover'}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {COVER_PRESETS.map((preset) => {
                  const isSelected = form.banner === preset.source;
                  return (
                    <Pressable
                      key={preset.name}
                      onPress={() => {
                        updateField('banner', preset.source);
                        setCustomImageUri(null);
                      }}
                      style={[
                        styles.coverPresetCard,
                        { borderColor: isSelected ? theme.primary : '#00000033', backgroundColor: theme.surfaceLow }
                      ]}
                    >
                      <Image source={preset.source} style={styles.coverPresetThumb} contentFit="cover" />
                      <ThemedText style={[styles.coverPresetLabel, { color: isSelected ? theme.primary : theme.textSecondary }]} numberOfLines={1}>
                        {preset.name}
                      </ThemedText>
                      {isSelected && (
                        <View style={[styles.coverPresetCheck, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={10} color="#ffffff" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sport type</ThemedText>
                <View style={styles.sportList}>
                  {['Football', 'Cricket', 'Tennis'].map(s => {
                    const isActive = form.sportType === s;
                    const sportObj = SPORTS_LIST.find(sp => sp.name === s) || { icon: 'sports' };
                    return (
                      <Pressable
                        key={s}
                        onPress={() => updateField('sportType', s)}
                        style={[
                          styles.sportChip,
                          { backgroundColor: 'transparent', borderColor: '#00000033' },
                          isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                      >
                        <MaterialIcons
                          name={sportObj.icon as any}
                          size={12}
                          color={isActive ? '#ffffff' : theme.textSecondary}
                        />
                        <ThemedText style={[styles.sportChipText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                          {s}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament type</ThemedText>
                <View style={styles.sportList}>
                  {['Knockout', 'League'].map(t => {
                    const isActive = form.tournamentType === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => updateField('tournamentType', t)}
                        style={[
                          styles.sportChip,
                          { backgroundColor: 'transparent', borderColor: '#00000033' },
                          isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                      >
                        <MaterialIcons
                          name={t === 'Knockout' ? 'star' : 'format-list-bulleted'}
                          size={12}
                          color={isActive ? '#ffffff' : theme.textSecondary}
                        />
                        <ThemedText style={[styles.sportChipText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                          {t}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Organizer name <ThemedText style={styles.requiredStar}>*</ThemedText></ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'organizerName' ? theme.primary : '#00000033' }]}
                placeholder="e.g. Apex Sports Club"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.organizerName}
                onChangeText={(v) => updateField('organizerName', v)}
                onFocus={() => setFocusedField('organizerName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Organizer contact <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              {/* Fixed +91 country code with a formatted, hard-capped 10-digit
                  field — the same control Create Turf uses. The old free-text
                  input accepted "+", spaces, dashes and brackets in any
                  quantity, so "((((" passed the "non-empty" check and a
                  25-digit string was storable. */}
              <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: contactError ? '#ef4444' : focusedField === 'organizerContact' ? theme.primary : '#00000033' }]}>
                <View style={[styles.countryCodeBadge, { backgroundColor: theme.primary + '18' }]}>
                  <ThemedText style={[styles.countryCodeText, { color: theme.primary }]}>+91</ThemedText>
                </View>
                <TextInput
                  style={[styles.inputRowInner, { color: theme.text }]}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.textSecondary + '80'}
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={form.organizerContact}
                  onChangeText={(v) => updateField('organizerContact', formatPhone(v))}
                  onFocus={() => setFocusedField('organizerContact')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {!!contactError && (
                <ThemedText style={styles.errorText}>{contactError}</ThemedText>
              )}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepFormContainer}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Registration start</ThemedText>
                <Pressable
                  onPress={() => {
                    setDatePickerField('regStart');
                    const parsed = form.regStart ? new Date(form.regStart) : new Date(2026, 5, 23);
                    setPickerDate(isNaN(parsed.getTime()) ? new Date(2026, 5, 23) : parsed);
                  }}
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: '#00000033', justifyContent: 'center', position: 'relative' }]}
                >
                  <ThemedText style={{ color: form.regStart ? theme.text : theme.textSecondary + '80', fontSize: 13 }}>
                    {form.regStart || 'YYYY-MM-DD'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ position: 'absolute', right: 12 }} />
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Registration end</ThemedText>
                <Pressable
                  onPress={() => {
                    setDatePickerField('regEnd');
                    const parsed = form.regEnd ? new Date(form.regEnd) : new Date(2026, 5, 25);
                    setPickerDate(isNaN(parsed.getTime()) ? new Date(2026, 5, 25) : parsed);
                  }}
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: '#00000033', justifyContent: 'center', position: 'relative' }]}
                >
                  <ThemedText style={{ color: form.regEnd ? theme.text : theme.textSecondary + '80', fontSize: 13 }}>
                    {form.regEnd || 'YYYY-MM-DD'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ position: 'absolute', right: 12 }} />
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament start</ThemedText>
                <Pressable
                  onPress={() => {
                    setDatePickerField('tournStart');
                    const parsed = form.tournStart ? new Date(form.tournStart) : new Date(2026, 6, 1);
                    setPickerDate(isNaN(parsed.getTime()) ? new Date(2026, 6, 1) : parsed);
                  }}
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: '#00000033', justifyContent: 'center', position: 'relative' }]}
                >
                  <ThemedText style={{ color: form.tournStart ? theme.text : theme.textSecondary + '80', fontSize: 13 }}>
                    {form.tournStart || 'YYYY-MM-DD'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ position: 'absolute', right: 12 }} />
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament end</ThemedText>
                <Pressable
                  onPress={() => {
                    setDatePickerField('tournEnd');
                    const parsed = form.tournEnd ? new Date(form.tournEnd) : new Date(2026, 6, 15);
                    setPickerDate(isNaN(parsed.getTime()) ? new Date(2026, 6, 15) : parsed);
                  }}
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: '#00000033', justifyContent: 'center', position: 'relative' }]}
                >
                  <ThemedText style={{ color: form.tournEnd ? theme.text : theme.textSecondary + '80', fontSize: 13 }}>
                    {form.tournEnd || 'YYYY-MM-DD'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ position: 'absolute', right: 12 }} />
                </Pressable>
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepFormContainer}>
            <View style={[styles.inputGroup, { marginBottom: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Ground selection</ThemedText>
              <View style={styles.selectorRowVertical}>
                {['Elms Field Ground A', 'Regents Cricket Oval', 'West London Multi-Turf'].map(g => (
                  <Pressable
                    key={g}
                    onPress={() => updateField('selectedGround', g)}
                    style={[
                      styles.verticalSelectBtn,
                      { backgroundColor: theme.surfaceLow, borderColor: form.selectedGround === g ? theme.primary : '#00000033' }
                    ]}
                  >
                    <Ionicons name={form.selectedGround === g ? "checkmark-circle" : "ellipse-outline"} size={16} color={form.selectedGround === g ? theme.primary : theme.textSecondary} />
                    <ThemedText style={{ marginLeft: 8, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13 }}>{g}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Detailed address</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'address' ? theme.primary : '#00000033' }]}
                value={form.address}
                onChangeText={(v) => updateField('address', v)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Map Mock Graphic */}
            <View style={[styles.mapMockContainer, { backgroundColor: theme.surfaceLow, borderColor: '#00000033' }]}>
              <View style={styles.mapGridOverlay}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.mapGridRow} />
                ))}
              </View>
              <View style={[styles.mapMarker, { backgroundColor: theme.secondaryContainer }]}>
                <Ionicons name="location" size={24} color="#ffffff" />
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepFormContainer}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Match duration</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'matchDuration' ? theme.primary : '#00000033' }]}
                  placeholder="e.g. 90 mins"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={form.matchDuration}
                  onChangeText={(v) => updateField('matchDuration', v)}
                  onFocus={() => setFocusedField('matchDuration')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Team size</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'teamSize' ? theme.primary : '#00000033' }]}
                  placeholder="e.g. 11 players"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={form.teamSize}
                  onChangeText={(v) => updateField('teamSize', v)}
                  onFocus={() => setFocusedField('teamSize')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Overs per innings {form.sportType === 'Cricket' ? <ThemedText style={styles.requiredStar}>*</ThemedText> : '(cricket only)'}
              </ThemedText>
              {/* Digits only: an over count is a number, and the free-text
                  field previously accepted "dkfjdljfd" and defaulted to "N/A",
                  which then had to be parsed downstream. */}
              <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'overs' ? theme.primary : '#00000033' }]}>
                <TextInput
                  style={[styles.inputRowInner, { color: theme.text }]}
                  placeholder="20"
                  placeholderTextColor={theme.textSecondary + '80'}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={form.overs}
                  onChangeText={(v) => updateField('overs', v.replace(/\D/g, '').slice(0, 3))}
                  onFocus={() => setFocusedField('overs')}
                  onBlur={() => setFocusedField(null)}
                />
                <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_400Regular', fontSize: 11 }}>overs</ThemedText>
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Points / qualification rules</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'pointSystem' ? theme.primary : '#00000033' }]}
                placeholder="e.g. 3 pts for Win, 1 pt Draw"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.pointSystem}
                onChangeText={(v) => updateField('pointSystem', v)}
                onFocus={() => setFocusedField('pointSystem')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Tournament rules — tick the ones that apply. The preset list
                follows the sport, so cricket gets its own conditions. */}
            <View style={[styles.inputGroup, { marginTop: 20 }]}>
              <View style={styles.labelRowBetween}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Match rules ({form.rules.length} selected)
                </ThemedText>
                <Pressable
                  onPress={() =>
                    setForm(prev => ({
                      ...prev,
                      rules: prev.rules.length === rulePresets.length + prev.customRules.length
                        ? []
                        : [...rulePresets, ...prev.customRules],
                    }))
                  }
                >
                  <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_500Medium', fontSize: 11 }}>
                    {form.rules.length > 0 ? 'Clear all' : 'Select all'}
                  </ThemedText>
                </Pressable>
              </View>

              {rulePresets.map((rule) => {
                const checked = form.rules.includes(rule);
                return (
                  <Pressable
                    key={rule}
                    onPress={() => toggleRule(rule)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    style={[
                      styles.ruleRow,
                      { borderColor: checked ? theme.primary + '55' : '#00000018', backgroundColor: checked ? theme.primary + '0D' : theme.surfaceLow },
                    ]}
                  >
                    <View style={[styles.ruleCheckbox, { borderColor: checked ? theme.primary : theme.outlineVariant, backgroundColor: checked ? theme.primary : 'transparent' }]}>
                      {checked && <Ionicons name="checkmark" size={11} color="#ffffff" />}
                    </View>
                    <ThemedText style={[styles.ruleText, { color: checked ? theme.text : theme.textSecondary }]}>
                      {rule}
                    </ThemedText>
                  </Pressable>
                );
              })}

              {/* Organizer's own rules, listed with the same checkbox affordance. */}
              {form.customRules.map((rule) => {
                const checked = form.rules.includes(rule);
                return (
                  <View
                    key={rule}
                    style={[styles.ruleRow, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '0D' }]}
                  >
                    <Pressable onPress={() => toggleRule(rule)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
                      <View style={[styles.ruleCheckbox, { borderColor: checked ? theme.primary : theme.outlineVariant, backgroundColor: checked ? theme.primary : 'transparent' }]}>
                        {checked && <Ionicons name="checkmark" size={11} color="#ffffff" />}
                      </View>
                    </Pressable>
                    <ThemedText style={[styles.ruleText, { color: theme.text }]}>{rule}</ThemedText>
                    <Pressable onPress={() => removeCustomRule(rule)} hitSlop={8} accessibilityLabel="Remove rule">
                      <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                );
              })}

              <View style={[styles.inputRow, { marginTop: 10, backgroundColor: theme.surfaceLow, borderColor: focusedField === 'customRule' ? theme.primary : '#00000033' }]}>
                <TextInput
                  style={[styles.inputRowInner, { color: theme.text }]}
                  placeholder="Add your own rule"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={customRuleText}
                  onChangeText={setCustomRuleText}
                  onSubmitEditing={addCustomRule}
                  returnKeyType="done"
                  onFocus={() => setFocusedField('customRule')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable
                  onPress={addCustomRule}
                  disabled={!customRuleText.trim()}
                  accessibilityLabel="Add custom rule"
                  style={[styles.ruleAddBtn, { backgroundColor: customRuleText.trim() ? theme.primary : theme.outlineVariant }]}
                >
                  <Ionicons name="add" size={15} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepFormContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Entry fee (per team) <ThemedText style={styles.requiredStar}>*</ThemedText></ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'entryFee' ? theme.primary : '#00000033' }]}
                placeholder="e.g. ₹150"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.entryFee}
                onChangeText={(v) => updateField('entryFee', v)}
                onFocus={() => setFocusedField('entryFee')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Admin / reg fee</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'registrationFee' ? theme.primary : '#00000033' }]}
                  placeholder="e.g. ₹25"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={form.registrationFee}
                  onChangeText={(v) => updateField('registrationFee', v)}
                  onFocus={() => setFocusedField('registrationFee')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Security deposit</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'deposit' ? theme.primary : '#00000033' }]}
                  placeholder="e.g. ₹50"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={form.deposit}
                  onChangeText={(v) => updateField('deposit', v)}
                  onFocus={() => setFocusedField('deposit')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepFormContainer}>
            {/* Gallery — multi-select upload; these appear under the
                tournament's Media tab once published. */}
            <View style={[styles.inputGroup, { marginBottom: 20 }]}>
              <View style={styles.labelRowBetween}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Media gallery ({form.mediaImages.length}/12)
                </ThemedText>
                <Pressable onPress={pickMediaImages} accessibilityLabel="Add media images">
                  <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_500Medium', fontSize: 11 }}>+ Add photos</ThemedText>
                </Pressable>
              </View>

              {form.mediaImages.length === 0 ? (
                <Pressable
                  onPress={pickMediaImages}
                  style={[styles.mediaEmpty, { borderColor: theme.outlineVariant + '66' }]}
                >
                  <Ionicons name="images-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_400Regular', fontSize: 11 }}>
                    Upload match photos — you can pick several at once
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={styles.mediaThumbGrid}>
                  {form.mediaImages.map((uri) => (
                    <View key={uri} style={styles.mediaThumbWrap}>
                      <Image source={{ uri }} style={styles.mediaThumb} contentFit="cover" />
                      <Pressable
                        onPress={() => removeMediaImage(uri)}
                        hitSlop={6}
                        accessibilityLabel="Remove image"
                        style={styles.mediaThumbRemove}
                      >
                        <Ionicons name="close" size={11} color="#ffffff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>First prize (winner) <ThemedText style={styles.requiredStar}>*</ThemedText></ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'winnerPrize' ? theme.primary : '#00000033' }]}
                placeholder="e.g. ₹2,500 + Cup"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.winnerPrize}
                onChangeText={(v) => updateField('winnerPrize', v)}
                onFocus={() => setFocusedField('winnerPrize')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Runner-up prize</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'runnerPrize' ? theme.primary : '#00000033' }]}
                placeholder="e.g. ₹1,000 + Medals"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.runnerPrize}
                onChangeText={(v) => updateField('runnerPrize', v)}
                onFocus={() => setFocusedField('runnerPrize')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Individual MVPs / other awards</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'mvpPrize' ? theme.primary : '#00000033' }]}
                placeholder="e.g. MVP ₹200, Golden Boot"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.mvpPrize}
                onChangeText={(v) => updateField('mvpPrize', v)}
                onFocus={() => setFocusedField('mvpPrize')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const getStepHeader = () => {
    switch (currentStep) {
      case 0:
        return {
          icon: 'information-circle-outline',
          title: 'Basic Information',
          subtitle: 'Set name, sport type, and contact details.',
        };
      case 1:
        return {
          icon: 'calendar-outline',
          title: 'Schedule Dates',
          subtitle: 'Define registration and tournament timelines.',
        };
      case 2:
        return {
          icon: 'map-outline',
          title: 'Venue Selector',
          subtitle: 'Choose a ground and verify its address.',
        };
      case 3:
        return {
          icon: 'document-text-outline',
          title: 'Rules & Format',
          subtitle: 'Establish match durations and points.',
        };
      case 4:
        return {
          icon: 'cash-outline',
          title: 'Fees Details',
          subtitle: 'Set entry fees, admin fees, and deposits.',
        };
      case 5:
        return {
          icon: 'trophy-outline',
          title: 'Prizes & Rewards',
          subtitle: 'Specify tournament winnings and MVPs.',
        };
      default:
        return {
          icon: 'information-circle-outline',
          title: 'Tournament Setup',
          subtitle: 'Complete details to publish.',
        };
    }
  };

  return (
    <GradientContainer screenName="create-tournament" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            {isEditing ? 'Edit Tournament' : 'Create Tournament'}
          </ThemedText>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            <Pressable style={{ paddingVertical: 4, paddingLeft: 4, paddingRight: 0 }} onPress={() => setDraftsModalVisible(true)}>
              <Ionicons name="folder-open-outline" size={22} color={theme.error} />
            </Pressable>
            
            <Pressable style={[styles.draftBtn, { paddingVertical: 4, paddingLeft: 2, paddingRight: 4 }]} onPress={handleSaveDraft}>
              <ThemedText type="labelSm" style={{ color: theme.secondaryContainer, fontFamily: 'Sora_500Medium' }}>Save Draft</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Step Tracker — same pattern as Create Turf: every step is named
            under its own circle, evenly spaced, and a forward jump is gated on
            the current step validating. */}
        <View style={styles.progressTrackerCard}>
          <View style={styles.stepRow}>
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              return (
                <React.Fragment key={step.title}>
                  <Pressable
                    onPress={() => {
                      if (idx < currentStep) {
                        setCurrentStep(idx);
                      } else if (idx > currentStep) {
                        if (!validateStep(currentStep)) return;
                        setCurrentStep(idx);
                      }
                    }}
                    style={styles.stepItem}
                  >
                    <View style={[
                      styles.stepCircle,
                      isDone
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : isActive
                          ? { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                          : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
                    ]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={12} color="#fff" />
                        : <Ionicons name={step.icon as any} size={12} color={isActive ? theme.primary : theme.textSecondary} />}
                    </View>
                    <View style={styles.stepLabelBox}>
                      <ThemedText
                        numberOfLines={2}
                        style={[styles.stepLabel, {
                          color: isActive ? theme.primary : isDone ? theme.text : theme.textSecondary,
                          fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                        }]}
                      >
                        {step.title}
                      </ThemedText>
                    </View>
                  </Pressable>
                  {idx < STEPS.length - 1 && (
                    <View style={[styles.stepConnector, { backgroundColor: isDone ? theme.primary : theme.outlineVariant + '33' }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Wizard Form Area */}
        <ScrollView 
          style={styles.formScroll} 
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: Spacing.containerMargin }} 
          showsVerticalScrollIndicator={false}
        >
          {/* Live Preview / Highlights Card */}
          <View style={{ marginBottom: Spacing.md }}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              LIVE TICKET PREVIEW
            </ThemedText>
            
            <View style={[
              styles.previewTicketCard,
              { backgroundColor: theme.surfaceLowest, borderColor: theme.secondaryContainer, borderStyle: 'dashed', borderWidth: 1.5 },
            ]}>
              {/* Cutout Notches */}
              <View style={[styles.previewCutoutTop, { backgroundColor: theme.background }]} />
              <View style={[styles.previewCutoutBottom, { backgroundColor: theme.background }]} />

              {/* Banner Image */}
              <Image 
                source={form.banner} 
                style={styles.previewTicketLeftImage} 
                contentFit="cover" 
              />

              {/* Left Details */}
              <View style={styles.previewTicketLeft}>
                <View style={styles.previewSportBadgeRow}>
                  {form.sportType === 'Football' && <MaterialCommunityIcons name="soccer" size={11} color={theme.secondary} />}
                  {form.sportType === 'Cricket' && <MaterialCommunityIcons name="cricket" size={11} color={theme.secondary} />}
                  {form.sportType === 'Tennis' && <MaterialCommunityIcons name="tennis" size={11} color={theme.secondary} />}
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 4, fontWeight: '500' }}>
                    {form.sportType.toUpperCase()}
                  </ThemedText>
                </View>

                <ThemedText type="bodyLg" numberOfLines={1} style={{ color: theme.text, fontFamily: 'Sora_500Medium', marginTop: 2, fontSize: 13 }}>
                  {form.name || 'Unnamed Tournament'}
                </ThemedText>

                <View style={styles.previewMetaRow}>
                  <Ionicons name="location-outline" size={10} color={theme.textSecondary} />
                  <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 2, flex: 1 }}>
                    {form.selectedGround || 'No venue selected'}
                  </ThemedText>
                </View>

                <View style={styles.previewMetaRow}>
                  <Ionicons name="calendar-outline" size={10} color={theme.textSecondary} />
                  <ThemedText type="labelSm" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 2 }}>
                    {form.tournStart} to {form.tournEnd}
                  </ThemedText>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.previewVerticalDivider, { borderColor: theme.outlineVariant + '44' }]} />

              {/* Right Section */}
              <View style={styles.previewTicketRight}>
                <View style={{ alignItems: 'center' }}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 7 }}>Prize Pool</ThemedText>
                  <ThemedText type="bodyMd" style={{ color: theme.secondary, fontFamily: 'Sora_500Medium', fontSize: 12, marginTop: 1 }}>
                    {form.winnerPrize ? form.winnerPrize.split(' ')[0] : 'TBD'}
                  </ThemedText>
                </View>

                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 7 }}>Entry Fee</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '500', fontSize: 9 }}>
                    {form.entryFee || 'Free'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.bentoCard, Shadows.level2, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44', marginBottom: 20 }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: theme.primary + '11' }]}>
                <Ionicons name={getStepHeader().icon as any} size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.cardTitle}>{getStepHeader().title}</ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{getStepHeader().subtitle}</ThemedText>
              </View>
            </View>
            {renderStepContent()}
          </View>
        </ScrollView>

        {/* Footer controls */}
        <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '33' }]}>
          {currentStep > 0 && (
            <Pressable style={[styles.footerBackBtn, { borderColor: theme.outlineVariant }]} onPress={handleBack}>
              <Ionicons name="chevron-back" size={16} color={theme.text} />
              <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13, marginLeft: 4 }}>Back</ThemedText>
            </Pressable>
          )}

          {/* Disabled until the current step's mandatory fields are satisfied.
              `accessibilityState` keeps screen readers in step with the visual
              state, and the tap handler still runs so the toast can explain
              WHY it is disabled rather than the button silently doing nothing. */}
          {currentStep < STEPS.length - 1 ? (
            <Pressable
              accessibilityState={{ disabled: !canAdvance }}
              style={[
                styles.footerNextBtn,
                {
                  backgroundColor: canAdvance ? theme.primary : theme.outlineVariant,
                  opacity: canAdvance ? 1 : 0.7,
                  // Full width on step 1 where there is no Back button, then a
                  // 1:2 split alongside it — the Create Turf behaviour.
                  flex: currentStep > 0 ? 2 : undefined,
                  width: currentStep === 0 ? '100%' : undefined,
                  marginLeft: currentStep > 0 ? Spacing.sm : 0,
                },
              ]}
              onPress={handleNext}
            >
              <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 13, marginRight: 4 }}>Next</ThemedText>
              <Ionicons name={canAdvance ? 'chevron-forward' : 'lock-closed'} size={16} color="#ffffff" />
            </Pressable>
          ) : (
            <Pressable
              accessibilityState={{ disabled: !canAdvance }}
              style={[
                styles.footerNextBtn,
                {
                  backgroundColor: canAdvance ? '#10b981' : theme.outlineVariant,
                  opacity: canAdvance ? 1 : 0.7,
                  marginLeft: Spacing.sm,
                },
              ]}
              onPress={handlePublish}
            >
              <Ionicons name={canAdvance ? 'cloud-upload-outline' : 'lock-closed'} size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText style={{ color: '#ffffff', fontFamily: 'Sora_500Medium', fontSize: 14 }}>
                {isEditing ? 'Save Changes' : 'Publish Tournament'}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
          <ThemedText type="labelSm" style={{ color: '#ffffff' }}>{toastMsg}</ThemedText>
        </Animated.View>
      )}

      {/* Drafts List Modal */}
      <Modal
        visible={draftsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDraftsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="folder-open-outline" size={20} color={theme.error} style={{ marginRight: 6 }} />
              <ThemedText type="headlineSm" style={{ color: theme.text, flex: 1 }}>
                Saved Drafts
              </ThemedText>
              <Pressable style={styles.modalCloseBtn} onPress={() => setDraftsModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Modal Body */}
            {drafts.length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Ionicons name="folder-open-outline" size={48} color={theme.textSecondary + '44'} />
                <ThemedText style={{ color: theme.textSecondary, marginTop: 12, textAlign: 'center', fontSize: 13 }}>
                  No drafts saved yet. Create a tournament and click {"\"Save Draft\""} to keep it here.
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {drafts.map((draft) => (
                  <View 
                    key={draft.id} 
                    style={[styles.draftCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                  >
                    <View style={styles.draftCardLeft}>
                      <View style={[styles.draftSportCircle, { backgroundColor: theme.primary + '1a' }]}>
                        {draft.sportType === 'Football' && <MaterialCommunityIcons name="soccer" size={16} color={theme.primary} />}
                        {draft.sportType === 'Cricket' && <MaterialCommunityIcons name="cricket" size={16} color={theme.primary} />}
                        {draft.sportType === 'Tennis' && <MaterialCommunityIcons name="tennis" size={16} color={theme.primary} />}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13 }} numberOfLines={1}>
                          {draft.name || 'Untitled Draft'}
                        </ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }}>
                          {draft.sportType} • {draft.selectedGround.split(',')[0]}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.draftCardActions}>
                      <Pressable 
                        style={[styles.draftLoadBtn, { backgroundColor: theme.primary }]}
                        onPress={() => handleSelectDraft(draft)}
                      >
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontWeight: '500' }}>Load</ThemedText>
                      </Pressable>
                      <Pressable 
                        style={styles.draftDeleteBtn}
                        onPress={() => handleDeleteDraft(draft.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerField !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerField(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 6 }} />
              <ThemedText type="headlineSm" style={{ color: theme.text, flex: 1 }}>
                {datePickerField === 'regStart' && 'Registration start'}
                {datePickerField === 'regEnd' && 'Registration end'}
                {datePickerField === 'tournStart' && 'Tournament start'}
                {datePickerField === 'tournEnd' && 'Tournament end'}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontFamily: 'Sora_400Regular', marginLeft: 6 }}>
                {minDateForField(datePickerField) ? `on or after ${minDateForField(datePickerField)}` : ''}
              </ThemedText>
              <Pressable style={styles.modalCloseBtn} onPress={() => setDatePickerField(null)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Calendar Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Pressable onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))} style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 14 }}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pickerDate.getMonth()]} {pickerDate.getFullYear()}
              </ThemedText>
              <Pressable onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))} style={{ padding: 6 }}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Days of week labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <ThemedText key={d} style={{ color: theme.textSecondary, width: 40, textAlign: 'center', fontSize: 10, fontWeight: '500' }}>
                  {d}
                </ThemedText>
              ))}
            </View>

            {/* Weeks and days */}
            <View style={{ paddingBottom: 20 }}>
              {(() => {
                const year = pickerDate.getFullYear();
                const month = pickerDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDayIndex = new Date(year, month, 1).getDay();
                const startPadding = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
                
                const cells = [];
                for (let i = 0; i < startPadding; i++) {
                  cells.push({ day: 0 });
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  cells.push({ day: d });
                }
                
                const weeksList = [];
                for (let i = 0; i < cells.length; i += 7) {
                  weeksList.push(cells.slice(i, i + 7));
                }
                
                return weeksList.map((week, wIdx) => (
                  <View key={wIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    {week.map((cell, cIdx) => {
                      if (!cell || cell.day === 0) {
                        return <View key={cIdx} style={{ width: 40, height: 40 }} />;
                      }
                      
                      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                      const isSelected = datePickerField && form[datePickerField] === cellDateStr;
                      const disabled = isDateDisabled(cellDateStr);

                      return (
                        <Pressable
                          key={cIdx}
                          disabled={disabled}
                          onPress={() => {
                            if (disabled) return;
                            if (datePickerField) {
                              updateField(datePickerField, cellDateStr);
                            }
                            setDatePickerField(null);
                          }}
                          style={[
                            { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
                            isSelected && { backgroundColor: theme.primary },
                            // Dimmed so the unavailable range is visible, not
                            // just silently unresponsive.
                            disabled && { opacity: 0.28 },
                          ]}
                        >
                          <ThemedText style={{ color: isSelected ? '#ffffff' : theme.text, fontSize: 13, fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_400Regular' }}>
                            {cell.day}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                    {/* Fill up remaining spaces in the last week row if needed */}
                    {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, padIdx) => (
                      <View key={`pad-last-${padIdx}`} style={{ width: 40, height: 40 }} />
                    ))}
                  </View>
                ));
              })()}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
  },
  draftBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  progressTrackerCard: {
    marginHorizontal: Spacing.containerMargin,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTracker: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Steps share the row evenly (flex: 1) so the circles sit at regular
  // intervals no matter how wide each label is — six steps otherwise drift.
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepCircle: {
    width: STEP_CIRCLE,
    height: STEP_CIRCLE,
    borderRadius: STEP_CIRCLE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fixed two-line box keeps every circle on the same baseline even when one
  // label wraps and the others don't.
  stepLabelBox: { height: STEP_LABEL_LINE * 2, justifyContent: 'flex-start' },
  stepLabel: { fontSize: 9, letterSpacing: 0.2, lineHeight: STEP_LABEL_LINE, textAlign: 'center' },
  // Derived from the circle geometry rather than eyeballed.
  stepConnector: {
    width: 10,
    height: STEP_CONNECTOR_H,
    marginTop: STEP_CIRCLE / 2 - STEP_CONNECTOR_H / 2,
    marginHorizontal: 1,
  },
  wizardActiveLabel: {
    marginTop: 8,
    fontFamily: 'Sora_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    textAlign: 'center',
  },
  formScroll: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  stepFormContainer: {
    paddingBottom: 0,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    // Spacing.md, matching Create Turf — Spacing.lg left noticeably more
    // gutter inside the card than the turf wizard's equivalent.
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: 3,
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    color: '#64748b',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    fontSize: 12,
    fontFamily: 'Sora_400Regular',
  },
  textArea: {
    height: 84,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
    textAlignVertical: 'top',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  selectorRowVertical: {
    flexDirection: 'column',
    gap: 8,
  },
  verticalSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  mapMockContainer: {
    height: 160,
    borderRadius: BorderRadius.xl,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  mapGridOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  mapGridRow: {
    height: 1,
    backgroundColor: '#05151e',
    width: '100%',
  },
  mapMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  // Same geometry as Create Turf: a fixed 44pt bar split 1:2, with the xl
  // radius rather than a pill, so both wizards' footers read identically.
  footerBackBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNextBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 44,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.premium,
    zIndex: 999,
  },
  previewTicketCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    height: 110,
    marginBottom: Spacing.sm,
  },
  previewCutoutTop: {
    position: 'absolute',
    top: -6,
    right: '25%',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 10,
  },
  previewCutoutBottom: {
    position: 'absolute',
    bottom: -6,
    right: '25%',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 10,
  },
  previewTicketLeftImage: {
    width: 80,
    height: '100%',
  },
  previewTicketLeft: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
  },
  previewSportBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  previewVerticalDivider: {
    width: 1,
    height: '100%',
    borderStyle: 'dashed',
    borderWidth: 1,
    position: 'absolute',
    right: '25%',
  },
  previewTicketRight: {
    width: '25%',
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  bentoCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 16,
  },
  cardSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    letterSpacing: 0.2,
    marginBottom: Spacing.xs,
    color: '#81919c',
  },
  // Phone row + required/error affordances, matching Create Turf.
  mediaEmpty: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: BorderRadius.md,
    paddingVertical: 22, alignItems: 'center', gap: 6,
  },
  mediaThumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  mediaThumbWrap: { position: 'relative' },
  mediaThumb: { width: 72, height: 72, borderRadius: BorderRadius.md, backgroundColor: '#00000010' },
  mediaThumbRemove: {
    position: 'absolute', top: -5, right: -5,
    width: 19, height: 19, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  labelRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 6,
  },
  ruleCheckbox: {
    width: 17, height: 17, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  ruleText: { flex: 1, minWidth: 0, fontFamily: 'Sora_400Regular', fontSize: 11.5, lineHeight: 16 },
  ruleAddBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  inputRow: { height: 42, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  countryCodeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  countryCodeText: { fontSize: 13, fontFamily: 'Sora_500Medium' },
  inputRowInner: { flex: 1, fontSize: 13, fontFamily: 'Sora_500Medium' },
  requiredStar: { color: '#ef4444', fontFamily: 'Sora_500Medium' },
  errorText: { color: '#ef4444', fontSize: 11, fontFamily: 'Sora_500Medium', marginTop: 4 },
  input: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  sportList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sportChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabelSub: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
  },
  threeImageGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
  },
  imageCardSlot: {
    flex: 1,
    // Without this a child's intrinsic width can push the row past the card,
    // clipping the third slot off the right edge on narrow screens.
    minWidth: 0,
    height: 96,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreviewFull: {
    width: '100%',
    height: '100%',
  },
  pinnedCoverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  pinnedCoverBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
  },
  imageSlotActionOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinIconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  deleteIconButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCardPlaceholder: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  uploadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSlotTitle: {
    fontSize: 10.5,
    fontFamily: 'Sora_500Medium',
  },
  uploadSlotSub: {
    fontSize: 9.5,
    fontFamily: 'Sora_400Regular',
  },
  coverPresetCard: {
    width: 100,
    height: 64,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  coverPresetThumb: {
    width: '100%',
    height: 46,
    borderRadius: BorderRadius.sm,
  },
  coverPresetLabel: {
    fontSize: 9,
    fontFamily: 'Sora_500Medium',
    marginTop: 3,
    textAlign: 'center',
  },
  coverPresetCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.premium,
    borderTopRightRadius: BorderRadius.premium,
    borderWidth: 1,
    maxHeight: '75%',
    padding: Spacing.md,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    marginVertical: Spacing.sm,
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 10,
  },
  draftCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  draftSportCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftLoadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  draftDeleteBtn: {
    padding: 6,
  },
});
