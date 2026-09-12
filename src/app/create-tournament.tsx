import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SPORTS_LIST } from '@/constants/sports';
import { FieldLabel } from '@/components/field-label';
import { getCurrentGPSLocation } from '@/utils/location';
import {
  TOURNAMENT_SPORTS,
  MAX_TOURNAMENT_NAME_LENGTH,
  MAX_ORGANIZER_NAME_LENGTH,
  nameLengthIssue,
  coerceTournamentSport,
  TournamentSport,
  digitsOnly,
  supportsOvers,
  MAX_DURATION_DIGITS,
  MAX_TEAM_SIZE_DIGITS,
  MAX_OVERS_DIGITS,
  MAX_MONEY_DIGITS,
  RULE_PRESET_LIMIT,
  MAX_VENUE_NAME_LENGTH,
  MAX_SPONSOR_NAME_LENGTH,
  MAX_SPONSOR_TIER_LENGTH,
  MAX_VOUCHER_CODE_LENGTH,
  MAX_OFFER_TITLE_LENGTH,
  MAX_OFFER_TERMS_LENGTH,
  MAX_TEAM_PRESETS,
  MAX_TEAMS_DIGITS,
  MIN_TEAMS,
  todayIso,
  isoDaysFromToday,
  formatIsoDate,
  TOURNAMENT_VOUCHER_BANNERS,
  TournamentVoucherDraft,
} from '@/constants/tournament';
import { MaterialIcons } from '@expo/vector-icons';
import { useTournamentStore, useOfferStore, useTurfStore } from '@/store/app-store';
import { STATIC_TURFS } from '@/constants/turfs';
import { turfVenueOptions, filterTurfVenues, TurfVenueOption } from '@/utils/turf-venues';
import { generateTournamentId, rulePresetsForSport, TournamentSponsor, formatDefaultsFor, voucherMaxDays, renameFixtureVenue, StoredFixture } from '@/store/tournament-store';
import { toPersistableImage, durableImages } from '@/utils/persist-image';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DashboardCard, DashboardSectionLabel, DashboardStepper, StatTiles } from '@/components/dashboard/analytics-kit';
import { useFormConfig } from '@/context/RemoteConfigContext';
import { CustomFieldsSection } from '@/components/forms/CustomFieldsSection';
import { saveCustomAnswers } from '@/services/custom-answers';
import { validateCustomAnswers, type CustomAnswers } from '@/lib/remote-config';
import { ACCENTS } from '@/constants/dashboard-accents';
import { prizeLabel, sportEmoji } from '@/utils/cup-display';
import { CashbackOutputCard } from '@/components/cashback-output-card';
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';

/** Where saved tournament drafts persist between sessions. */
const DRAFTS_KEY = '@turf_tournament_drafts';


const STEPS = [
  { title: 'Basic', short: 'Basic', icon: 'information-circle-outline' },
  { title: 'Schedule', short: 'Schedule', icon: 'calendar-outline' },
  { title: 'Venue', short: 'Venue', icon: 'map-outline' },
  { title: 'Rules', short: 'Rules', icon: 'document-text-outline' },
  { title: 'Fees', short: 'Fees', icon: 'cash-outline' },
  { title: 'Prizes & Media', short: 'Prizes', icon: 'trophy-outline' },
];



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
  const { ownedTurfs } = useTurfStore();
  const { addOffer } = useOfferStore();
  const { profile } = useUserProfile();
  /** Phone is the canonical identity elsewhere in the app; email/name back it up. */
  const ownerKey = (profile?.phone || '').replace(/\D/g, '').slice(-10)
    || (profile?.email || '').trim().toLowerCase()
    || (profile?.name || '').trim().toLowerCase();
  /** Present when the organizer opened this wizard to fix a published cup. */
  const params = useLocalSearchParams<{ editId?: string; draftId?: string }>();
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
    sportType: TOURNAMENT_SPORTS[0] as string, // see constants/tournament.ts
    tournamentType: 'Knockout', // Knockout, League, Round Robin
    organizerName: profile?.name || '',
    organizerContact: profile?.phone ? formatPhoneNumber(profile.phone) : '',
    banner: require('@/assets/images/illustrations/tournament_cover.png'), // Default cover banner
    
    // Section 2: Schedule
    // Seeded relative to today. These were fixed 2026 dates, so every new
    // tournament opened with a registration window already in the past.
    regStart: todayIso(),
    regEnd: isoDaysFromToday(14),
    tournStart: isoDaysFromToday(21),
    tournEnd: isoDaysFromToday(28),
    
    // Section 3: Venue
    /** Hosted at a listed turf, or at a ground the organiser types in. */
    venueType: 'Turf' as 'Turf' | 'Ground',
    /** The listed turf this is hosted at; '' for a ground. */
    turfId: '',
    selectedGround: '',
    address: '',
    latLng: '',
    
    // Section 4: Rules
    matchDuration: '90',
    teamSize: '11',
    overs: '',
    pointSystem: '3 pts Win, 1 pt Draw, 0 pts Loss',
    // Ticked rules, plus any the organizer wrote themselves.
    rules: [] as string[],
    customRules: [] as string[],
    // Gallery images shown under the tournament's Media tab.
    mediaImages: [] as string[],
    sponsors: [] as TournamentSponsor[],
    
    // Section 5: Fees
    maxTeams: '16',
    entryFee: '150',
    registrationFee: '25',
    deposit: '50',
    
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
      sportType: coerceTournamentSport(t.sport ?? prev.sportType),
      tournamentType: t.type ?? prev.tournamentType,
      organizerName: t.organizerName ?? prev.organizerName,
      organizerContact: t.organizerContact ?? prev.organizerContact,
      regStart: t.regStart ?? prev.regStart,
      regEnd: t.regEnd ?? prev.regEnd,
      tournStart: t.startDate ?? prev.tournStart,
      tournEnd: t.endDate ?? prev.tournEnd,
      // Older cups carry no type: a saved turf means Turf, a typed venue Ground.
      venueType: t.venueType ?? (t.turfId ? 'Turf' : t.location ? 'Ground' : 'Turf'),
      turfId: t.turfId ?? '',
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
      // Anything ticked that isn't one of the presets we still OFFER belongs in
      // the custom list. Comparing against the full preset book instead would
      // silently drop rules that used to be presets before the list was
      // trimmed to RULE_PRESET_LIMIT — they'd match neither list and vanish
      // from the form while remaining on the saved tournament.
      customRules: Array.isArray(t.rules)
        ? t.rules.filter(
            (r: string) =>
              !rulePresetsForSport(t.sport || '')
                .slice(0, RULE_PRESET_LIMIT)
                .includes(r)
          )
        : prev.customRules,
      // Drop photos stored as revoked blob: URLs — they render as empty boxes
      // and re-saving them would carry the dead reference forward.
      mediaImages: Array.isArray(t.mediaImages) ? durableImages(t.mediaImages) : prev.mediaImages,
      sponsors: Array.isArray(t.sponsors) ? t.sponsors : prev.sponsors,
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
    if (t.cashbackEnabled !== undefined) setCashbackEnabled(Boolean(t.cashbackEnabled));
    if (t.cashbackType) setCashbackType(t.cashbackType);
    if (t.cashbackAmount) {
      setCashbackAmount(String(t.cashbackAmount));
      if (t.cashbackEnabled === undefined && Number(t.cashbackAmount) > 0) setCashbackEnabled(true);
    }
    if (t.cashbackName) setCashbackName(t.cashbackName);
    if (t.cashbackCode) setCashbackCode(t.cashbackCode);
    if (t.cashbackMaxAmount) setCashbackMaxAmount(String(t.cashbackMaxAmount));
    if (t.cashbackOneTime !== undefined) setCashbackOneTime(Boolean(t.cashbackOneTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, publishedTournaments.length]);

  // Sync logged user profile details when creating a new tournament
  useEffect(() => {
    if (!isEditing && profile) {
      setForm(prev => {
        const updates: Partial<typeof prev> = {};
        if (!prev.organizerName && profile.name) updates.organizerName = profile.name;
        if (!prev.organizerContact && profile.phone) updates.organizerContact = formatPhoneNumber(profile.phone);
        if (Object.keys(updates).length > 0) return { ...prev, ...updates };
        return prev;
      });
    }
  }, [profile?.name, profile?.phone, isEditing]);

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
  const [isLocatingVenue, setIsLocatingVenue] = useState(false);
  /** The draft this form was loaded from, cleared once it is published. */
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [turfListOpen, setTurfListOpen] = useState(false);
  const [turfQuery, setTurfQuery] = useState('');

  // Cashback Reward State
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [cashbackType, setCashbackType] = useState<'flat' | 'percent'>('flat');
  const [cashbackAmount, setCashbackAmount] = useState('');
  const [cashbackName, setCashbackName] = useState('');
  const [cashbackCode, setCashbackCode] = useState('');
  const [cashbackMaxAmount, setCashbackMaxAmount] = useState('');
  const [cashbackOneTime, setCashbackOneTime] = useState(true);

  const activeCashbackCode = useMemo(() => {
    if (cashbackCode.trim()) return cashbackCode.trim().toUpperCase();
    const clean = form.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return clean ? `${clean.slice(0, 6)}50` : 'CUP50';
  }, [cashbackCode, form.name]);

  const handleCopyCashbackCode = async (codeToCopy: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard) {
      try {
        await (navigator as any).clipboard.writeText(codeToCopy);
      } catch {}
    }
    triggerToast(`📋 Code ${codeToCopy} copied to clipboard!`);
  };

  /**
   * Turf or Ground, normalised: drafts saved before the toggle existed carry
   * no type, so infer it from what they hold.
   */
  const venueType: 'Turf' | 'Ground' =
    form.venueType === 'Turf' || form.venueType === 'Ground'
      ? form.venueType
      : form.turfId ? 'Turf' : form.selectedGround ? 'Ground' : 'Turf';

  /** Turfs created in the app, then the venues that ship with it. */
  const turfOptions = turfVenueOptions(ownedTurfs || [], STATIC_TURFS);
  // While a turf is picked the box shows its name, so list everything.
  const shownTurfOptions = filterTurfVenues(form.turfId ? '' : turfQuery, turfOptions);

  /** A ground typed before switching to Turf, restored on switching back. */
  const groundDraft = useRef({ selectedGround: '', address: '', latLng: '' });

  const switchVenueType = (type: 'Turf' | 'Ground') => {
    if (type === venueType) return;
    if (type === 'Turf') {
      groundDraft.current = { selectedGround: form.selectedGround, address: form.address, latLng: form.latLng };
      setForm(prev => ({ ...prev, venueType: 'Turf', turfId: '', selectedGround: '', address: '', latLng: '' }));
    } else {
      setForm(prev => ({ ...prev, venueType: 'Ground', turfId: '', ...groundDraft.current }));
    }
    setUseCurrentLocation(false);
    setTurfListOpen(false);
    setTurfQuery('');
  };

  /** Host at a listed turf: its name and address become the venue. */
  const selectTurfVenue = (option: TurfVenueOption) => {
    setForm(prev => ({
      ...prev,
      venueType: 'Turf',
      turfId: option.id,
      selectedGround: option.name.slice(0, MAX_VENUE_NAME_LENGTH),
      address: option.address,
      latLng: '',
    }));
    setTurfListOpen(false);
    setTurfQuery('');
  };

  const handleTurfSearch = (text: string) => {
    setTurfQuery(text);
    setTurfListOpen(true);
    // Typing over a picked turf means looking for another one.
    if (form.turfId) setForm(prev => ({ ...prev, turfId: '', selectedGround: '', address: '' }));
  };

  const clearTurfSelection = () => {
    setTurfQuery('');
    setForm(prev => ({ ...prev, turfId: '', selectedGround: '', address: '' }));
  };

  /**
   * Vouchers drafted for this tournament. Published into the offer store on
   * save with `appliesTo` set to the tournament name, so the registration
   * screen finds them and the "first N users" cap is enforced in the one place
   * that owns it (`redeemOffer`).
   */
  const [voucherDrafts, setVoucherDrafts] = useState<TournamentVoucherDraft[]>([]);

  const addVoucherDraft = () => {
    setVoucherDrafts(prev => {
      if (prev.length >= 4) return prev;
      const idx = prev.length;
      return [
        ...prev,
        {
          localId: `tv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: '',
          title: '',
          description: '',
          discountType: 'percent',
          discountValue: '10',
          minBooking: '0',
          maxRedemptions: '50',
          validDays: '30',
          bannerImage: TOURNAMENT_VOUCHER_BANNERS[idx % TOURNAMENT_VOUCHER_BANNERS.length].uri,
        },
      ];
    });
  };

  const patchVoucher = (localId: string, patch: Partial<TournamentVoucherDraft>) => {
    setVoucherDrafts(prev => prev.map(v => (v.localId === localId ? { ...v, ...patch } : v)));
  };

  const removeVoucher = (localId: string) => {
    setVoucherDrafts(prev => prev.filter(v => v.localId !== localId));
  };

  /** Upload custom art for a voucher's coupon card. */
  const pickVoucherBanner = async (localId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      triggerToast('Photo permission is needed to add a banner');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const persisted = toPersistableImage(result.assets[0] as any);
    if (!persisted.ok && persisted.reason === 'too-large') {
      triggerToast('That banner is too large — try a smaller image');
      return;
    }
    const uri = persisted.ok ? persisted.uri : persisted.uri;
    if (uri) patchVoucher(localId, { bannerImage: uri });
  };

  /**
   * Fill the address from the device's GPS.
   *
   * The address is still editable afterwards — a reverse-geocoded string is
   * rarely how an organiser would write their own ground — and the
   * coordinates are kept separately so the pin survives an edit to the text.
   */
  const handleUseCurrentLocation = async () => {
    if (isLocatingVenue) return;
    setIsLocatingVenue(true);
    try {
      const result = await getCurrentGPSLocation();
      if (result.error) {
        Alert.alert('Location unavailable', result.error);
        return;
      }
      updateField('address', result.address);
      if (typeof result.latitude === 'number' && typeof result.longitude === 'number') {
        updateField('latLng', `${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)}`);
      }
    } catch (err: any) {
      Alert.alert('Location unavailable', err?.message || 'Could not read your location.');
    } finally {
      setIsLocatingVenue(false);
    }
  };
  const [datePickerField, setDatePickerField] = useState<'regStart' | 'regEnd' | 'tournStart' | 'tournEnd' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

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
  // Only the first few presets are offered as tick boxes; anything else the
  // organiser writes themselves.
  const rulePresets = rulePresetsForSport(form.sportType).slice(0, RULE_PRESET_LIMIT);
  const oversEnabled = supportsOvers(form.sportType);
  /** Longest a voucher can run: until the tournament's last day. */
  const maxVoucherDays = voucherMaxDays(form.tournEnd);

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
      // Needed to store something durable: on web the picker returns a
      // URL.createObjectURL() blob that is revoked on reload, so the gallery
      // came back empty next launch.
      base64: true,
    });
    if (result.canceled) return;
    const uris: string[] = [];
    let skipped = 0;
    for (const asset of result.assets || []) {
      const persisted = toPersistableImage(asset as any);
      if (persisted.ok) uris.push(persisted.uri);
      else if (persisted.reason === 'too-large') skipped += 1;
      else if (persisted.uri) uris.push(persisted.uri);
    }
    if (skipped > 0) {
      triggerToast(`${skipped} image${skipped === 1 ? ' was' : 's were'} too large to save`);
    }
    setForm(prev => {
      // De-duplicate: re-picking the same photo shouldn't add it twice.
      const merged = [...prev.mediaImages, ...uris.filter(u => !prev.mediaImages.includes(u))];
      return { ...prev, mediaImages: merged.slice(0, 12) };
    });
    triggerToast(`${uris.length} image${uris.length === 1 ? '' : 's'} added`);
  };

  /** Adds a sponsor from a picked logo. Name and tier are edited in place. */
  const pickSponsorLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      triggerToast('Photo permission is needed to add a sponsor logo');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const persisted = toPersistableImage(result.assets[0] as any);
    if (!persisted.ok && persisted.reason === 'too-large') {
      triggerToast('That logo is too large — try a smaller image');
      return;
    }
    const logo = persisted.ok ? persisted.uri : persisted.uri || '';
    if (!logo) return;

    setForm(prev => ({
      ...prev,
      sponsors: [
        ...prev.sponsors,
        { id: `sponsor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', tier: 'Sponsor', logo },
      ].slice(0, 8),
    }));
  };

  const patchSponsor = (id: string, patch: Partial<{ name: string; tier: string }>) => {
    setForm(prev => ({
      ...prev,
      sponsors: prev.sponsors.map(sp => (sp.id === id ? { ...sp, ...patch } : sp)),
    }));
  };

  const removeSponsor = (id: string) => {
    setForm(prev => ({ ...prev, sponsors: prev.sponsors.filter(sp => sp.id !== id) }));
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
  // Super Admin layout for the Create Tournament form: renamed, hidden and
  // required fields, plus any fields the admin added (shown on the first step).
  const cupForm = useFormConfig('create_tournament');
  const cf = {
    name: cupForm.field('name', { label: 'Tournament name', placeholder: 'e.g. London Summer Slam', required: true }),
    description: cupForm.field('description', {
      label: 'Description',
      placeholder: 'Describe your tournament, match timings, general guidelines...',
    }),
    organizer: cupForm.field('organizerName', { label: 'Organizer name', placeholder: 'e.g. Apex Sports Club', required: true }),
    contact: cupForm.field('organizerPhone', { label: 'Organizer contact', placeholder: '98765 43210', required: true }),
    entryFee: cupForm.field('entryFee', { label: 'Entry fee (per team)', placeholder: '150', required: true }),
  };
  const hiddenStyle = { display: 'none' } as const;
  const [customAnswers, setCustomAnswers] = useState<CustomAnswers>({});

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
      const nameIssue = nameLengthIssue('Tournament name', form.name, MAX_TOURNAMENT_NAME_LENGTH);
      if (nameIssue) return nameIssue;
      if (cf.description.visible && cf.description.required && !form.description.trim()) {
        return `${cf.description.label} is required`;
      }
      const checkOrganizer = cf.organizer.visible && (cf.organizer.required || !!form.organizerName.trim());
      const organizerIssue = checkOrganizer
        ? nameLengthIssue('Organizer name', form.organizerName, MAX_ORGANIZER_NAME_LENGTH)
        : null;
      if (organizerIssue) return organizerIssue;
      const phoneErr = cf.contact.visible ? getPhoneValidationError(form.organizerContact, cf.contact.required) : null;
      if (phoneErr) return phoneErr;
      const customIssue = validateCustomAnswers(cupForm.customFields, customAnswers)[0];
      if (customIssue) return customIssue;
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
      if (venueType === 'Turf') return form.turfId ? null : 'Pick a turf from the list';
      if (!form.selectedGround.trim()) return 'Enter the ground name';
      return null;
    }
    if (step === 3) {
      // Only cricket needs an over count; other sports have no equivalent.
      if (form.sportType === 'Cricket' && !form.overs.trim()) return 'Overs per innings is required for cricket';
      return null;
    }
    if (step === 4) {
      // The draw size is now editable, so it has to be checked. A tournament
      // of one team is not a tournament.
      const teams = parseAmount(form.maxTeams);
      if (teams < MIN_TEAMS) return `A tournament needs at least ${MIN_TEAMS} teams`;
      // A voucher for "the first 20 teams" in a 16-team cup promises places
      // that do not exist.
      const overCap = voucherDrafts.find(v => Number(v.maxRedemptions) > teams);
      if (overCap) {
        return `Voucher ${overCap.code || ''} is limited to ${overCap.maxRedemptions} teams, but only ${teams} can enter`.replace('  ', ' ');
      }
      if (cf.entryFee.required && parseAmount(form.entryFee) <= 0) return 'Entry fee is required';
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
    form.organizerContact.trim()
      ? getPhoneValidationError(form.organizerContact, false) || ''
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
      cashbackEnabled,
      cashbackType,
      cashbackAmount,
      cashbackName,
      cashbackCode,
      cashbackMaxAmount,
      cashbackOneTime,
    };
    setDrafts(prev => {
      const next = [newDraft, ...prev];
      persistDrafts(next);
      return next;
    });
    triggerToast('Draft saved successfully!');
  };

  // Arriving from the host screen's "saved drafts" banner opens the picker
  // straight away, rather than making the organiser find the folder icon.
  const handleSelectDraft = (draft: any) => {
    // `banner` is stripped when a draft is saved (a require()'d asset id does
    // not survive a reload), so keep whatever the form already holds.
    setForm(prev => ({ ...prev, ...draft, banner: prev.banner }));
    if (draft.cashbackEnabled !== undefined) setCashbackEnabled(Boolean(draft.cashbackEnabled));
    if (draft.cashbackType) setCashbackType(draft.cashbackType);
    if (draft.cashbackAmount) {
      setCashbackAmount(String(draft.cashbackAmount));
      if (draft.cashbackEnabled === undefined && Number(draft.cashbackAmount) > 0) setCashbackEnabled(true);
    }
    if (draft.cashbackName) setCashbackName(draft.cashbackName);
    if (draft.cashbackCode) setCashbackCode(draft.cashbackCode);
    if (draft.cashbackMaxAmount) setCashbackMaxAmount(String(draft.cashbackMaxAmount));
    if (draft.cashbackOneTime !== undefined) setCashbackOneTime(Boolean(draft.cashbackOneTime));
    setLoadedDraftId(draft.id);
    triggerToast(`Loaded draft: ${draft.name}`);
  };

  /**
   * Arriving with a `draftId` loads that draft straight into the form.
   *
   * This used to open the drafts picker on top of an empty wizard, so
   * "Create Tournament" flashed up before the draft was even chosen. The
   * choice now happens on the host screen and this screen opens populated.
   */
  const draftLoaded = React.useRef(false);
  React.useEffect(() => {
    if (!params.draftId || draftLoaded.current) return;
    const match = drafts.find((d: any) => d.id === params.draftId);
    if (!match) return;
    draftLoaded.current = true;
    handleSelectDraft(match);
  }, [params.draftId, drafts]);

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
    if (cf.organizer.visible && cf.organizer.required && !form.organizerName.trim()) {
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

    const parsedCashback = parseFloat(cashbackAmount) || 0;
    const isCashbackActive = cashbackEnabled && parsedCashback > 0;

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
      venueType,
      turfId: venueType === 'Turf' ? form.turfId : '',
      matchDuration: form.matchDuration,
      teamSize: form.teamSize,
      overs: form.overs,
      pointSystem: form.pointSystem,
      // Stored as parsed numbers, matching entryFee above. Keeping the raw
      // form string here is what let "₹25" reach the registration screen.
      registrationFee: String(parseAmount(form.registrationFee)),
      deposit: String(parseAmount(form.deposit)),
      winnerPrize: form.winnerPrize,
      runnerPrize: form.runnerPrize,
      mvpPrize: form.mvpPrize,
      rules: form.rules,
      mediaImages: form.mediaImages,
      sponsors: form.sponsors,
      coverImages: tournamentImages,
      coverIndex: pinnedIndex,
      cashbackEnabled: isCashbackActive,
      cashbackType,
      cashbackAmount: isCashbackActive ? parsedCashback : undefined,
      cashbackName: isCashbackActive ? (cashbackName.trim() || `${form.name || 'Tournament'} Cashback`) : undefined,
      cashbackCode: isCashbackActive ? (cashbackCode.trim() || activeCashbackCode) : undefined,
      cashbackMaxAmount: isCashbackActive && cashbackMaxAmount ? parseFloat(cashbackMaxAmount) : undefined,
      cashbackOneTime: isCashbackActive ? cashbackOneTime : undefined,
    };

    if (isEditing && editId) {
      // teamsCount and status are owned by the registration/lifecycle flows —
      // an edit must not reset a cup that already has teams in it.
      // Moving the venue moves the draw with it, so fixtures don't keep
      // pointing at a ground the tournament no longer uses.
      const before: any = publishedTournaments.find((x: any) => x.id === editId);
      const movedFixtures = renameFixtureVenue<StoredFixture>(before?.fixtures, before?.location, record.location);
      updateTournament(editId, movedFixtures ? { ...record, fixtures: movedFixtures } : record);
      void saveCustomAnswers('create_tournament', 'tournament', editId, customAnswers, cupForm.customFields);
      triggerToast('Tournament updated!');
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/tournaments');
      }, 1200);
      return;
    }

    // Publish the drafted vouchers as offers scoped to this tournament, so the
    // registration screen finds them and redemption caps are enforced by
    // `redeemOffer` — the one place that owns that rule.
    voucherDrafts.forEach((v) => {
      const value = parseAmount(v.discountValue);
      if (!v.code.trim() || value <= 0) return;
      // Never past the tournament's end, whatever was typed.
      const days = Math.min(parseInt(v.validDays, 10) || 30, voucherMaxDays(form.tournEnd) ?? Number.MAX_SAFE_INTEGER);
      addOffer({
        code: v.code.trim().toUpperCase(),
        title: v.title.trim() || `${form.name} Voucher`,
        description: v.description.trim() || `Discount for teams registering for ${form.name}`,
        discountType: v.discountType,
        discountValue: value,
        minBooking: parseAmount(v.minBooking),
        maxRedemptions: parseInt(v.maxRedemptions, 10) || 0,
        validTill: new Date(Date.now() + days * 86400000).toISOString(),
        appliesTo: form.name.trim(),
        bannerImage: v.bannerImage,
      });
    });

    // A published tournament is no longer a draft. Leaving it behind meant the
    // organiser saw a stale copy in the drafts list beside the real thing.
    if (loadedDraftId) {
      setDrafts(prev => {
        const next = prev.filter(d => d.id !== loadedDraftId);
        persistDrafts(next);
        return next;
      });
      setLoadedDraftId(null);
    }

    const publishedId = generateTournamentId();
    addTournament({
      ...record,
      // Stamped once, from the signed-in profile. Deliberately absent from the
      // edit patch above so renaming the organizer can never change ownership.
      organizerId: ownerKey,
      id: publishedId,
      teamsCount: 0,
      status: 'Registering',
      createdAt: new Date().toISOString(),
    });

    void saveCustomAnswers('create_tournament', 'tournament', publishedId, customAnswers, cupForm.customFields);
    triggerToast('Tournament published successfully!');
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/tournaments');
    }, 1200);
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Switching sport resets the format to that sport's defaults. The points
   * line stayed "3 pts Win, 1 pt Draw" on a cricket tournament, and rules
   * ticked for one sport carried over to the other.
   */
  const handleSportChange = (sport: TournamentSport) => {
    const defaults = formatDefaultsFor(sport);
    const presets = rulePresetsForSport(sport).slice(0, RULE_PRESET_LIMIT);
    setForm(prev => {
      if (prev.sportType === sport) return prev;
      return {
        ...prev,
        sportType: sport,
        pointSystem: defaults.pointSystem,
        matchDuration: defaults.matchDuration,
        teamSize: defaults.teamSize,
        overs: sport === 'Cricket' ? prev.overs || '20' : '',
        rules: prev.rules.filter((r: string) => presets.includes(r)),
      };
    });
  };

  // Step render functions
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Step render functions

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepFormContainer}>
            <DashboardSectionLabel label="Identity" color={ACCENTS.primary.main} style={styles.stepSectionFirst} />
            <View style={styles.inputGroup}>
              <FieldLabel
                label={cf.name.label}
                required
                current={form.name.length}
                max={MAX_TOURNAMENT_NAME_LENGTH}
              />
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'name' ? theme.primary : '#00000033' }]}
                placeholder={cf.name.placeholder}
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.name}
                maxLength={MAX_TOURNAMENT_NAME_LENGTH}
                onChangeText={(v) => updateField('name', v)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }, !cf.description.visible && hiddenStyle]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {cf.description.label}
                {cf.description.required && <ThemedText style={styles.requiredStar}> *</ThemedText>}
              </ThemedText>
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'description' ? theme.primary : '#00000033', height: 80, paddingVertical: 10, textAlignVertical: 'top' }]}
                placeholder={cf.description.placeholder}
                placeholderTextColor={theme.textSecondary + '80'}
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(v) => updateField('description', v)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <DashboardSectionLabel label="Format" color={ACCENTS.green.main} style={styles.stepSection} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sport type</ThemedText>
                <View style={styles.sportList}>
                  {TOURNAMENT_SPORTS.map(s => {
                    const isActive = form.sportType === s;
                    const sportObj = SPORTS_LIST.find(sp => sp.name === s) || { icon: 'sports' };
                    return (
                      <Pressable
                        key={s}
                        onPress={() => handleSportChange(s)}
                        style={[
                          styles.sportChip,
                          { backgroundColor: 'transparent', borderColor: '#00000033' },
                          isActive && [{ backgroundColor: theme.surfaceLowest, borderColor: ACCENTS.primary.main + '55' }, Shadows.level1]
                        ]}
                      >
                        <MaterialIcons
                          name={sportObj.icon as any}
                          size={12}
                          color={isActive ? ACCENTS.primary.dark : theme.textSecondary}
                        />
                        <ThemedText style={[styles.sportChipText, { color: isActive ? ACCENTS.primary.dark : theme.textSecondary, fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium' }]}>
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
                          isActive && [{ backgroundColor: theme.surfaceLowest, borderColor: ACCENTS.primary.main + '55' }, Shadows.level1]
                        ]}
                      >
                        <MaterialIcons
                          name={t === 'Knockout' ? 'star' : 'format-list-bulleted'}
                          size={12}
                          color={isActive ? ACCENTS.primary.dark : theme.textSecondary}
                        />
                        <ThemedText style={[styles.sportChipText, { color: isActive ? ACCENTS.primary.dark : theme.textSecondary, fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium' }]}>
                          {t}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <DashboardSectionLabel label="Organizer" color={ACCENTS.orange.main} style={styles.stepSection} />
            <View style={[styles.inputGroup, !cf.organizer.visible && hiddenStyle]}>
              <FieldLabel
                label={cf.organizer.label}
                required={cf.organizer.required}
                current={form.organizerName.length}
                max={MAX_ORGANIZER_NAME_LENGTH}
              />
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'organizerName' ? theme.primary : '#00000033' }]}
                placeholder={cf.organizer.placeholder}
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.organizerName}
                maxLength={MAX_ORGANIZER_NAME_LENGTH}
                onChangeText={(v) => updateField('organizerName', v)}
                onFocus={() => setFocusedField('organizerName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }, !cf.contact.visible && hiddenStyle]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {cf.contact.label} {cf.contact.required && <ThemedText style={styles.requiredStar}>*</ThemedText>}
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
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[styles.inputRowInner, { color: theme.text }]}
                  placeholder={cf.contact.placeholder}
                  placeholderTextColor={theme.textSecondary + '80'}
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={form.organizerContact}
                  onChangeText={(v) => updateField('organizerContact', formatPhoneNumber(v))}
                  onFocus={() => setFocusedField('organizerContact')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {!!contactError && (
                <ThemedText style={styles.errorText}>{contactError}</ThemedText>
              )}
            </View>

            {cupForm.customFields.length > 0 && (
              <>
                <DashboardSectionLabel label="More Details" color={ACCENTS.green.main} style={styles.stepSection} />
                <CustomFieldsSection
                  fields={cupForm.customFields}
                  values={customAnswers}
                  onChange={(key, value) => setCustomAnswers((prev) => ({ ...prev, [key]: value }))}
                  labelStyle={[styles.fieldLabel, { color: theme.textSecondary }]}
                  palette={{
                    label: theme.textSecondary,
                    text: theme.text,
                    placeholder: theme.textSecondary + '80',
                    fieldBg: theme.surfaceLow,
                    border: '#00000033',
                    accent: theme.primary,
                  }}
                />
              </>
            )}
          </View>
        );
      case 1:
        return (
          <View style={styles.stepFormContainer}>
            <DashboardSectionLabel label="Registration Window" color={ACCENTS.primary.main} style={styles.stepSectionFirst} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Registration start</ThemedText>
                <Pressable
                  onPress={() => {
                    setDatePickerField('regStart');
                    const parsed = form.regStart ? new Date(form.regStart) : new Date();
                    setPickerDate(isNaN(parsed.getTime()) ? new Date() : parsed);
                  }}
                  style={[styles.input, { backgroundColor: theme.surfaceLow, borderColor: '#00000033', justifyContent: 'center', position: 'relative' }]}
                >
                  <ThemedText style={{ color: form.regStart ? theme.text : theme.textSecondary + '80', fontSize: 13 }}>
                    {formatIsoDate(form.regStart) || 'Select a date'}
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
                    {formatIsoDate(form.regEnd) || 'Select a date'}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ position: 'absolute', right: 12 }} />
                </Pressable>
              </View>
            </View>

            <DashboardSectionLabel label="Tournament Dates" color={ACCENTS.green.main} style={styles.stepSection} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
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
                    {formatIsoDate(form.tournStart) || 'Select a date'}
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
                    {formatIsoDate(form.tournEnd) || 'Select a date'}
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
            <DashboardSectionLabel label="Venue" color={ACCENTS.primary.main} style={styles.stepSectionFirst} />
            {/* Type — a listed turf, or a ground typed in. Same toggle as match
                creation (BidMatchTab), so organisers see a familiar control. */}
            <View style={[styles.inputGroup, { marginBottom: 14 }]}>
              <View style={styles.venueLabelRow}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Type</ThemedText>
                <ThemedText style={styles.requiredStar}>*</ThemedText>
              </View>
              <View style={styles.venueTypeRow}>
                {([
                  { label: 'Turf 🌿', value: 'Turf' },
                  { label: 'Ground 🏟️', value: 'Ground' },
                ] as const).map((opt) => {
                  const active = venueType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => switchVenueType(opt.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${opt.value} venue`}
                      style={({ pressed }) => [
                        styles.venueTypeCard,
                        {
                          backgroundColor: active ? theme.primary + '18' : theme.surfaceLow,
                          borderColor: active ? theme.primary : theme.outlineVariant + '40',
                          borderWidth: active ? 1.5 : 1,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.venueTypeText, { color: active ? theme.primary : theme.text }]}>
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {venueType === 'Turf' ? (
              <View style={[styles.inputGroup, { marginBottom: 16, zIndex: 30 }]}>
                <View style={styles.venueLabelRowBetween}>
                  <View style={styles.venueLabelRow}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Turf Name</ThemedText>
                    <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </View>
                  <Pressable onPress={() => setTurfListOpen(open => !open)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Select or search turfs">
                    <ThemedText style={[styles.venueLink, { color: theme.primary }]}>Select or Search</ThemedText>
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.venueSearchBox,
                    { backgroundColor: theme.surfaceLow, borderColor: turfListOpen ? theme.primary : theme.outlineVariant + '40' },
                  ]}
                >
                  <Ionicons name="search-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.venueSearchInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)]}
                    placeholder="Search or tap turf below..."
                    placeholderTextColor="#94a3b8"
                    value={form.turfId ? form.selectedGround : turfQuery}
                    onFocus={() => setTurfListOpen(true)}
                    onChangeText={handleTurfSearch}
                    accessibilityLabel="Search turfs"
                  />
                  {form.turfId || turfQuery ? (
                    <Pressable onPress={clearTurfSelection} hitSlop={6} style={{ padding: 4 }} accessibilityRole="button" accessibilityLabel="Clear turf">
                      <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setTurfListOpen(open => !open)}
                      hitSlop={6}
                      style={{ padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={turfListOpen ? 'Hide turf list' : 'Show turf list'}
                    >
                      <Ionicons name={turfListOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>

                {/* One-tap turf pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.turfPillRow}>
                  {turfOptions.slice(0, 8).map((option) => {
                    const selected = form.turfId === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => selectTurfVenue(option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Host at ${option.name}`}
                        style={({ pressed }) => [
                          styles.turfPill,
                          {
                            backgroundColor: selected ? theme.primary : theme.surfaceLow,
                            borderColor: selected ? theme.primary : theme.outlineVariant + '35',
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Ionicons name="location-sharp" size={11} color={selected ? '#ffffff' : theme.primary} />
                        <ThemedText
                          numberOfLines={1}
                          style={[
                            styles.turfPillText,
                            { color: selected ? '#ffffff' : theme.text, fontFamily: selected ? 'Sora_600SemiBold' : 'Sora_500Medium' },
                          ]}
                        >
                          {option.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {turfListOpen && (
                  <View style={[styles.turfList, { backgroundColor: theme.surfaceLowest, borderColor: theme.primary }]}>
                    <View style={[styles.turfListHeader, { backgroundColor: theme.surfaceLow, borderBottomColor: theme.outlineVariant + '20' }]}>
                      <ThemedText style={[styles.turfListTitle, { color: theme.textSecondary }]}>AVAILABLE TURFS</ThemedText>
                      <Pressable onPress={() => setTurfListOpen(false)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Close turf list">
                        <ThemedText style={[styles.turfListTitle, { color: theme.primary }]}>Close ✕</ThemedText>
                      </Pressable>
                    </View>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
                      {shownTurfOptions.map((option, idx) => {
                        const selected = form.turfId === option.id;
                        return (
                          <Pressable
                            key={option.id}
                            onPress={() => selectTurfVenue(option)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`${option.name}${option.address ? `, ${option.address}` : ''}`}
                            style={({ pressed }) => [
                              styles.turfListRow,
                              {
                                borderBottomWidth: idx < shownTurfOptions.length - 1 ? 1 : 0,
                                borderBottomColor: theme.outlineVariant + '20',
                                backgroundColor: pressed || selected ? theme.primary + '15' : theme.surfaceLowest,
                              },
                            ]}
                          >
                            <Ionicons name="location-sharp" size={14} color={theme.primary} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <ThemedText numberOfLines={1} style={[styles.turfListName, { color: theme.text }]}>{option.name}</ThemedText>
                              <ThemedText numberOfLines={1} style={[styles.turfListAddress, { color: theme.textSecondary }]}>
                                {[option.address, option.source === 'owned' ? 'Your turf' : null].filter(Boolean).join(' · ') || 'Address not listed'}
                              </ThemedText>
                            </View>
                            {selected && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
                          </Pressable>
                        );
                      })}
                      {shownTurfOptions.length === 0 && (
                        <ThemedText style={[styles.turfListAddress, { color: theme.textSecondary, textAlign: 'center', paddingVertical: 14, paddingHorizontal: 12 }]}>
                          No turf matches “{turfQuery.trim()}”. Switch Type to Ground to enter it yourself.
                        </ThemedText>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.inputGroup, { marginBottom: 16 }]}>
                <FieldLabel
                  label="Ground Name"
                  required
                  current={form.selectedGround.length}
                  max={MAX_VENUE_NAME_LENGTH}
                />
                <View
                  style={[
                    styles.venueSearchBox,
                    { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'selectedGround' ? theme.primary : theme.outlineVariant + '40' },
                  ]}
                >
                  <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.venueSearchInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any)]}
                    placeholder="e.g. Anna Stadium Ground"
                    placeholderTextColor="#94a3b8"
                    value={form.selectedGround}
                    maxLength={MAX_VENUE_NAME_LENGTH}
                    onChangeText={(v) => updateField('selectedGround', v)}
                    onFocus={() => setFocusedField('selectedGround')}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel="Ground name"
                  />
                </View>
              </View>
            )}

            {/* Address — the same two-mode picker create-turf uses: detect via
                GPS, or type it. A single "use my location" button left it
                ambiguous whether the field was still editable. */}
            {(venueType === 'Ground' || !!form.turfId) && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Detailed address <ThemedText style={styles.requiredStar}>*</ThemedText>
                </ThemedText>
                {!form.turfId && (
                <Pressable
                  onPress={() => {
                    const next = !useCurrentLocation;
                    setUseCurrentLocation(next);
                    if (next) handleUseCurrentLocation();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    useCurrentLocation ? 'Switch to entering the address manually' : 'Use my current location'
                  }
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: useCurrentLocation ? theme.primary + '18' : theme.surfaceLow,
                      borderColor: useCurrentLocation ? theme.primary + '44' : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <Ionicons
                    name={useCurrentLocation ? 'locate' : 'create-outline'}
                    size={11}
                    color={useCurrentLocation ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.togglePillText,
                      { color: useCurrentLocation ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {useCurrentLocation ? 'Current Location' : 'Enter Address'}
                  </ThemedText>
                </Pressable>
                )}
              </View>

              {form.turfId ? (
                <View style={[styles.locationCard, { backgroundColor: theme.surfaceLow, borderColor: theme.primary + '33' }]}>
                  <View style={[styles.locationIconBg, { backgroundColor: theme.primary + '18' }]}>
                    <Ionicons name="location" size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.locationText, { color: theme.text }]} numberOfLines={2}>
                      {form.address || 'Address not listed for this turf'}
                    </ThemedText>
                    <ThemedText style={[styles.locationHint, { color: theme.textSecondary }]}>
                      From the selected turf • change the turf above
                    </ThemedText>
                  </View>
                </View>
              ) : useCurrentLocation ? (
                <Pressable
                  onPress={handleUseCurrentLocation}
                  disabled={isLocatingVenue}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh the detected location"
                  style={[
                    styles.locationCard,
                    { backgroundColor: theme.surfaceLow, borderColor: theme.primary + '33' },
                  ]}
                >
                  <View style={[styles.locationIconBg, { backgroundColor: theme.primary + '18' }]}>
                    <Ionicons name="navigate" size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.locationText, { color: theme.text }]} numberOfLines={2}>
                      {isLocatingVenue ? 'Locating…' : form.address || 'Tap to detect your location'}
                    </ThemedText>
                    <ThemedText style={[styles.locationHint, { color: theme.textSecondary }]}>
                      {form.latLng
                        ? `Pinned at ${form.latLng} • Tap to refresh`
                        : 'Formatted GPS Location • Tap to refresh'}
                    </ThemedText>
                  </View>
                  <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                </Pressable>
              ) : (
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[
                    styles.input,
                    styles.addressInput,
                    { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'address' ? theme.primary : '#00000033' },
                  ]}
                  placeholder="e.g. 12 Bypass Road, Thillai Nagar, Tiruchirappalli - 620018"
                  placeholderTextColor={theme.textSecondary + '80'}
                  multiline
                  value={form.address}
                  onChangeText={(v) => updateField('address', v)}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                />
              )}
            </View>
            )}

            {/* ── Promotional Vouchers ──────────────────────────────────
                Same card design as the class voucher builder, so an organiser
                who has published a class recognises this immediately. */}
            <View style={[styles.inputGroup, { marginTop: 20 }]}>
              <View style={styles.labelRowBetween}>
                <ThemedText style={[styles.fieldLabel, { fontSize: 10.5, color: theme.primary, letterSpacing: 0.6, marginBottom: 0 }]}>
                  PROMOTIONAL VOUCHERS ({voucherDrafts.length})
                </ThemedText>
                <Pressable
                  onPress={addVoucherDraft}
                  disabled={voucherDrafts.length >= 4}
                  accessibilityRole="button"
                  accessibilityLabel="Add a voucher"
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: theme.primary + '15',
                    paddingHorizontal: 9, paddingVertical: 4,
                    borderRadius: BorderRadius.full,
                    opacity: voucherDrafts.length >= 4 ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="add-circle" size={13} color={theme.primary} />
                  <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                    Add Voucher
                  </ThemedText>
                </Pressable>
              </View>

              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 4, marginBottom: 10 }}>
                Create discounts with custom banner art that teams can redeem when registering for this tournament.
              </ThemedText>

              {voucherDrafts.length === 0 ? (
                <View style={[styles.voucherEmptyBox, { backgroundColor: theme.surfaceLow }]}>
                  <Ionicons name="pricetags-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={[styles.voucherEmptyText, { color: theme.textSecondary }]}>
                    No vouchers added. Tap &apos;+ Add Voucher&apos; to create one.
                  </ThemedText>
                </View>
              ) : (
                voucherDrafts.map((v, idx) => (
                  <View
                    key={v.localId}
                    style={[styles.voucherRowCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                  >
                    <View style={styles.voucherRowHeader}>
                      <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 }}>
                        Voucher {idx + 1} · New
                      </ThemedText>
                      <Pressable
                        onPress={() => removeVoucher(v.localId)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove voucher ${v.code || idx + 1}`}
                      >
                        <Ionicons name="trash-outline" size={15} color="#ef4444" />
                      </Pressable>
                    </View>

                    <ThemedText style={styles.voucherFieldLabel}>VOUCHER BANNER ART</ThemedText>
                    <View style={styles.voucherBannerWrap}>
                      <Image source={{ uri: v.bannerImage }} style={styles.voucherBannerImg} contentFit="cover" />
                      <View style={styles.voucherBannerActions}>
                        <Pressable onPress={() => pickVoucherBanner(v.localId)} style={styles.voucherBannerBtn} accessibilityRole="button" accessibilityLabel="Upload a banner">
                          <Ionicons name="cloud-upload-outline" size={13} color="#ffffff" />
                          <ThemedText style={styles.voucherBannerBtnText}>Upload Banner</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => patchVoucher(v.localId, { bannerImage: TOURNAMENT_VOUCHER_BANNERS[idx % TOURNAMENT_VOUCHER_BANNERS.length].uri })}
                          style={styles.voucherBannerBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Reset the banner"
                        >
                          <Ionicons name="refresh" size={13} color="#ffffff" />
                          <ThemedText style={styles.voucherBannerBtnText}>Reset</ThemedText>
                        </Pressable>
                      </View>
                    </View>

                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 8, marginBottom: 6 }}>
                      Or select a curated sports preset:
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {TOURNAMENT_VOUCHER_BANNERS.map((preset) => {
                        const active = v.bannerImage === preset.uri;
                        return (
                          <Pressable
                            key={preset.id}
                            onPress={() => patchVoucher(v.localId, { bannerImage: preset.uri })}
                            style={[styles.bannerChip, { borderColor: active ? theme.primary : theme.outlineVariant + '55', backgroundColor: active ? theme.primary + '14' : 'transparent' }]}
                          >
                            <ThemedText style={[styles.bannerChipText, { color: active ? theme.primary : theme.textSecondary }]}>
                              {preset.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.voucherFieldRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.voucherFieldLabel}>PROMO CODE</ThemedText>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.voucherInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="CUP10"
                          placeholderTextColor={theme.textSecondary + '80'}
                          autoCapitalize="characters"
                          maxLength={MAX_VOUCHER_CODE_LENGTH}
                          value={v.code}
                          onChangeText={(t) => patchVoucher(v.localId, { code: t.toUpperCase().replace(/\s/g, '') })}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.voucherFieldLabel}>OFFER NAME</ThemedText>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.voucherInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="Early Bird Entry"
                          placeholderTextColor={theme.textSecondary + '80'}
                          maxLength={MAX_OFFER_TITLE_LENGTH}
                          value={v.title}
                          onChangeText={(t) => patchVoucher(v.localId, { title: t })}
                        />
                      </View>
                    </View>

                    <ThemedText style={styles.voucherFieldLabel}>DISCOUNT TYPE</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['percent', 'flat'] as const).map((t) => {
                        const active = v.discountType === t;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => patchVoucher(v.localId, { discountType: t })}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            style={[styles.discountTypeBtn, { backgroundColor: active ? theme.primary : 'transparent', borderColor: active ? theme.primary : theme.outlineVariant + '55' }]}
                          >
                            <ThemedText style={[styles.discountTypeText, { color: active ? '#ffffff' : theme.textSecondary }]}>
                              {t === 'percent' ? 'Percent (%)' : 'Flat (₹)'}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.voucherFieldRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.voucherFieldLabel}>
                          {v.discountType === 'percent' ? 'DISCOUNT (%)' : 'DISCOUNT (₹)'}
                        </ThemedText>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.voucherInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="10"
                          placeholderTextColor={theme.textSecondary + '80'}
                          keyboardType="number-pad"
                          maxLength={4}
                          value={v.discountValue}
                          onChangeText={(t) => patchVoucher(v.localId, { discountValue: digitsOnly(t, 4) })}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.voucherFieldLabel}>MIN FEE (₹)</ThemedText>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.voucherInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="0"
                          placeholderTextColor={theme.textSecondary + '80'}
                          keyboardType="number-pad"
                          maxLength={MAX_MONEY_DIGITS}
                          value={v.minBooking}
                          onChangeText={(t) => patchVoucher(v.localId, { minBooking: digitsOnly(t, MAX_MONEY_DIGITS) })}
                        />
                      </View>
                    </View>

                    <View style={styles.voucherFieldRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.voucherFieldLabel}>VALID (DAYS)</ThemedText>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.voucherInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="30"
                          placeholderTextColor={theme.textSecondary + '80'}
                          keyboardType="number-pad"
                          maxLength={3}
                          value={v.validDays}
                          onChangeText={(t) => {
                            const n = digitsOnly(t, 3);
                            const capped = maxVoucherDays !== null && Number(n) > maxVoucherDays ? String(maxVoucherDays) : n;
                            patchVoucher(v.localId, { validDays: capped });
                          }}
                        />
                        {maxVoucherDays !== null && (
                          <ThemedText style={styles.voucherLimitHint}>
                            Max {maxVoucherDays} {maxVoucherDays === 1 ? 'day' : 'days'} · ends {formatIsoDate(form.tournEnd)}
                          </ThemedText>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.voucherFieldLabel}>FIRST N TEAMS</ThemedText>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.voucherInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="0 = unlimited"
                          placeholderTextColor={theme.textSecondary + '80'}
                          keyboardType="number-pad"
                          maxLength={4}
                          value={v.maxRedemptions}
                          onChangeText={(t) => patchVoucher(v.localId, { maxRedemptions: digitsOnly(t, 4) })}
                        />
                        {Number(v.maxRedemptions) > parseAmount(form.maxTeams) && parseAmount(form.maxTeams) > 0 && (
                          <ThemedText style={styles.voucherLimitWarn}>
                            Only {parseAmount(form.maxTeams)} teams can enter — lower this to {parseAmount(form.maxTeams)} or fewer.
                          </ThemedText>
                        )}
                      </View>
                    </View>

                    <ThemedText style={styles.voucherFieldLabel}>DESCRIPTION / TERMS</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[styles.voucherInput, styles.voucherTermsInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                      placeholder="Claim this voucher discount during tournament registration."
                      placeholderTextColor={theme.textSecondary + '80'}
                      multiline
                      maxLength={MAX_OFFER_TERMS_LENGTH}
                      value={v.description}
                      onChangeText={(t) => patchVoucher(v.localId, { description: t })}
                    />
                  </View>
                ))
              )}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepFormContainer}>
            <DashboardSectionLabel label="Match Format" color={ACCENTS.primary.main} style={styles.stepSectionFirst} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Match duration</ThemedText>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'matchDuration' ? theme.primary : '#00000033' }]}>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.inputRowInner, { color: theme.text }]}
                    placeholder="90"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="number-pad"
                    maxLength={MAX_DURATION_DIGITS}
                    value={form.matchDuration}
                    onChangeText={(v) => updateField('matchDuration', digitsOnly(v, MAX_DURATION_DIGITS))}
                    onFocus={() => setFocusedField('matchDuration')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <ThemedText style={styles.unitSuffix}>mins</ThemedText>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Team size</ThemedText>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'teamSize' ? theme.primary : '#00000033' }]}>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.inputRowInner, { color: theme.text }]}
                    placeholder="11"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="number-pad"
                    maxLength={MAX_TEAM_SIZE_DIGITS}
                    value={form.teamSize}
                    onChangeText={(v) => updateField('teamSize', digitsOnly(v, MAX_TEAM_SIZE_DIGITS))}
                    onFocus={() => setFocusedField('teamSize')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <ThemedText style={styles.unitSuffix}>players</ThemedText>
                </View>
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Overs per innings {oversEnabled ? <ThemedText style={styles.requiredStar}>*</ThemedText> : '(cricket only)'}
              </ThemedText>
              {/* Digits only: an over count is a number, and the free-text
                  field previously accepted "dkfjdljfd" and defaulted to "N/A",
                  which then had to be parsed downstream. */}
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.surfaceLow,
                    borderColor: focusedField === 'overs' ? theme.primary : '#00000033',
                    opacity: oversEnabled ? 1 : 0.45,
                  },
                ]}
              >
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[styles.inputRowInner, { color: theme.text }]}
                  placeholder={oversEnabled ? '20' : 'Cricket only'}
                  placeholderTextColor={theme.textSecondary + '80'}
                  keyboardType="number-pad"
                  maxLength={MAX_OVERS_DIGITS}
                  editable={oversEnabled}
                  value={oversEnabled ? form.overs : ''}
                  onChangeText={(v) => updateField('overs', digitsOnly(v, MAX_OVERS_DIGITS))}
                  onFocus={() => setFocusedField('overs')}
                  onBlur={() => setFocusedField(null)}
                />
                <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_400Regular', fontSize: 11 }}>overs</ThemedText>
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Points / qualification rules</ThemedText>
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
            <DashboardSectionLabel label="Match Rules" color={ACCENTS.green.main} style={styles.stepSection} />
            <View style={styles.inputGroup}>
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
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
            <DashboardSectionLabel label="Teams" color={ACCENTS.primary.main} style={styles.stepSectionFirst} />
            {/* Max teams was published as a fixed 16 with no way to change it —
                the field existed on the record but had no input. */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Max teams allowed <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <View style={styles.maxTeamsRow}>
                {MAX_TEAM_PRESETS.map((n) => {
                  const active = String(n) === String(form.maxTeams).trim();
                  return (
                    <Pressable
                      key={n}
                      onPress={() => updateField('maxTeams', String(n))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.maxTeamsChip,
                        {
                          backgroundColor: active ? theme.surfaceLowest : 'transparent',
                          borderColor: active ? ACCENTS.primary.main + '55' : theme.outlineVariant + '55',
                        },
                        active && Shadows.level1,
                      ]}
                    >
                      <ThemedText
                        style={[styles.maxTeamsChipText, { color: active ? ACCENTS.primary.dark : theme.textSecondary }]}
                      >
                        {n}
                      </ThemedText>
                    </Pressable>
                  );
                })}

                <View
                  style={[
                    styles.inputRow,
                    styles.maxTeamsCustom,
                    { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'maxTeams' ? theme.primary : '#00000033' },
                  ]}
                >
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.inputRowInner, styles.maxTeamsInput, { color: theme.text }]}
                    placeholder="Custom"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="number-pad"
                    maxLength={MAX_TEAMS_DIGITS}
                    value={form.maxTeams}
                    onChangeText={(v) => updateField('maxTeams', digitsOnly(v, MAX_TEAMS_DIGITS))}
                    onFocus={() => setFocusedField('maxTeams')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
              <ThemedText style={[styles.voucherHint, { marginTop: 6, marginBottom: 0 }]}>
                A knockout draw works best with a power of two. Minimum 2.
              </ThemedText>
            </View>

            <DashboardSectionLabel label="Fees" color={ACCENTS.orange.main} style={styles.stepSection} />
            <View style={styles.inputGroup}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{cf.entryFee.label} {cf.entryFee.required && <ThemedText style={styles.requiredStar}>*</ThemedText>}</ThemedText>
              <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'entryFee' ? theme.primary : '#00000033' }]}>
                <ThemedText style={styles.unitPrefix}>₹</ThemedText>
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[styles.inputRowInner, { color: theme.text }]}
                  placeholder={cf.entryFee.placeholder}
                  placeholderTextColor={theme.textSecondary + '80'}
                  keyboardType="number-pad"
                  maxLength={MAX_MONEY_DIGITS}
                  value={form.entryFee}
                  onChangeText={(v) => updateField('entryFee', digitsOnly(v, MAX_MONEY_DIGITS))}
                  onFocus={() => setFocusedField('entryFee')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Admin / reg fee</ThemedText>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'registrationFee' ? theme.primary : '#00000033' }]}>
                  <ThemedText style={styles.unitPrefix}>₹</ThemedText>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.inputRowInner, { color: theme.text }]}
                    placeholder="25"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="number-pad"
                    maxLength={MAX_MONEY_DIGITS}
                    value={form.registrationFee}
                    onChangeText={(v) => updateField('registrationFee', digitsOnly(v, MAX_MONEY_DIGITS))}
                    onFocus={() => setFocusedField('registrationFee')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Security deposit</ThemedText>
                <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: focusedField === 'deposit' ? theme.primary : '#00000033' }]}>
                  <ThemedText style={styles.unitPrefix}>₹</ThemedText>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[styles.inputRowInner, { color: theme.text }]}
                    placeholder="50"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="number-pad"
                    maxLength={MAX_MONEY_DIGITS}
                    value={form.deposit}
                    onChangeText={(v) => updateField('deposit', digitsOnly(v, MAX_MONEY_DIGITS))}
                    onFocus={() => setFocusedField('deposit')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* What a team pays at registration, at a glance. */}
            <View style={{ marginTop: 16 }}>
              <StatTiles
                items={[
                  { value: prizeLabel(parseAmount(form.entryFee), '₹0'), label: 'Entry', color: ACCENTS.green.dark },
                  { value: prizeLabel(parseAmount(form.registrationFee), '₹0'), label: 'Admin fee' },
                  { value: prizeLabel(parseAmount(form.deposit), '₹0'), label: 'Deposit' },
                  { value: String(form.maxTeams || '–'), label: 'Teams' },
                ]}
              />
            </View>

            {/* ── Cashback Reward Section ── */}
            <View style={[styles.inputGroup, { marginTop: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="wallet-outline" size={16} color="#10b981" />
                  <ThemedText style={[styles.fieldLabel, { fontSize: 10.5, color: '#10b981', letterSpacing: 0.6, marginBottom: 0 }]}>
                    CASHBACK REWARD (WALLET CREDIT)
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setCashbackEnabled(!cashbackEnabled)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: cashbackEnabled ? '#10b98118' : theme.surfaceLow,
                    borderWidth: 1,
                    borderColor: cashbackEnabled ? '#10b981' : theme.outlineVariant + '44',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: BorderRadius.full,
                  }}
                >
                  <Ionicons
                    name={cashbackEnabled ? "checkbox" : "square-outline"}
                    size={14}
                    color={cashbackEnabled ? '#10b981' : theme.textSecondary}
                  />
                  <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: cashbackEnabled ? '#10b981' : theme.textSecondary }}>
                    {cashbackEnabled ? 'Enabled' : 'Enable Cashback'}
                  </ThemedText>
                </Pressable>
              </View>
              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginBottom: 8 }}>
                Give teams a cashback incentive when they complete tournament registration. Cashback is credited directly to their Sport Wallet.
              </ThemedText>

              {cashbackEnabled && (
                <View style={{ backgroundColor: theme.surfaceLow, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.outlineVariant + '33', gap: 12 }}>
                  {/* 1. Cashback Title Input */}
                  <View>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                      Cashback Title / Campaign Name
                    </ThemedText>
                    <TextInput
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={cashbackName}
                      onChangeText={setCashbackName}
                      placeholder={`e.g. ${form.name.trim().slice(0, 14) || 'Tournament'} Cashback Reward`}
                      placeholderTextColor="#94a3b8"
                      style={[styles.input, { backgroundColor: theme.surfaceLowest, color: theme.text, height: 42 }]}
                    />
                  </View>

                  {/* 2. Cashback Code Input + Copy Button */}
                  <View>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                      Cashback Code (Optional Custom Code)
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '44', paddingHorizontal: 10, height: 42, gap: 8 }}>
                      <Ionicons name="pricetag-outline" size={15} color="#10b981" />
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        value={cashbackCode}
                        onChangeText={(val) => setCashbackCode(val.toUpperCase())}
                        placeholder={`e.g. ${activeCashbackCode}`}
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        style={{ flex: 1, fontSize: 13, fontFamily: 'Sora_600SemiBold', color: '#10b981', height: 40, letterSpacing: 0.8, ...({ outlineStyle: 'none' } as any) }}
                      />
                      <Pressable
                        onPress={() => handleCopyCashbackCode(activeCashbackCode)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                      >
                        <Ionicons name="copy-outline" size={12} color="#10b981" />
                        <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: '#10b981' }}>
                          Copy
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  {/* 3. Type Switcher: Flat ₹ vs Percentage % */}
                  <View>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                      Cashback Type
                    </ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={() => setCashbackType('flat')}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 9,
                          borderRadius: 8,
                          backgroundColor: cashbackType === 'flat' ? '#10b98118' : theme.surfaceLowest,
                          borderWidth: 1.5,
                          borderColor: cashbackType === 'flat' ? '#10b981' : theme.outlineVariant + '33',
                        }}
                      >
                        <Ionicons name="cash-outline" size={15} color={cashbackType === 'flat' ? '#10b981' : theme.textSecondary} />
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: cashbackType === 'flat' ? '#10b981' : theme.text }}>
                          Flat Amount (₹)
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={() => setCashbackType('percent')}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 9,
                          borderRadius: 8,
                          backgroundColor: cashbackType === 'percent' ? '#10b98118' : theme.surfaceLowest,
                          borderWidth: 1.5,
                          borderColor: cashbackType === 'percent' ? '#10b981' : theme.outlineVariant + '33',
                        }}
                      >
                        <Ionicons name="pie-chart-outline" size={15} color={cashbackType === 'percent' ? '#10b981' : theme.textSecondary} />
                        <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: cashbackType === 'percent' ? '#10b981' : theme.text }}>
                          Percentage (%)
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  {/* 4. Cashback Amount Input */}
                  <View>
                    <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                      {cashbackType === 'flat' ? 'Cashback Amount (₹)' : 'Cashback Percentage (%)'}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '44', paddingHorizontal: 10, height: 42 }}>
                      <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_600SemiBold', color: '#10b981', marginRight: 6 }}>
                        {cashbackType === 'flat' ? '₹' : '%'}
                      </ThemedText>
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        value={cashbackAmount}
                        onChangeText={(val) => setCashbackAmount(val.replace(/[^0-9.]/g, ''))}
                        placeholder={cashbackType === 'flat' ? 'e.g. 100' : 'e.g. 15'}
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                        style={{ flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13, height: 40, ...({ outlineStyle: 'none' } as any) }}
                      />
                    </View>
                  </View>

                  {/* 5. Max Cashback Cap (if percentage) */}
                  {cashbackType === 'percent' && (
                    <View>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 6 }}>
                        Max Cashback Cap (₹) (Optional)
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceLowest, borderRadius: 8, borderWidth: 1, borderColor: theme.outlineVariant + '44', paddingHorizontal: 10, height: 42 }}>
                        <ThemedText style={{ fontSize: 14, fontFamily: 'Sora_600SemiBold', color: '#10b981', marginRight: 6 }}>₹</ThemedText>
                        <TextInput
                          maxFontSizeMultiplier={MAX_FONT_SCALE}
                          value={cashbackMaxAmount}
                          onChangeText={(val) => setCashbackMaxAmount(val.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g. 200 (Leave empty for no limit)"
                          placeholderTextColor="#94a3b8"
                          keyboardType="decimal-pad"
                          style={{ flex: 1, color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13, height: 40, ...({ outlineStyle: 'none' } as any) }}
                        />
                      </View>
                    </View>
                  )}

                  {/* 6. One-Time Usage Switch */}
                  <Pressable
                    onPress={() => setCashbackOneTime(!cashbackOneTime)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: theme.surfaceLowest,
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.outlineVariant + '33',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <ThemedText style={{ fontSize: 12, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                        One-Time Use Per Team
                      </ThemedText>
                      <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginTop: 2 }}>
                        Restrict cashback claim to first-time team registration only
                      </ThemedText>
                    </View>
                    <Ionicons
                      name={cashbackOneTime ? "toggle" : "toggle-outline"}
                      size={22}
                      color={cashbackOneTime ? '#10b981' : theme.textSecondary}
                    />
                  </Pressable>

                  {/* 7. Live Preview Card Output */}
                  {Boolean(cashbackAmount && parseFloat(cashbackAmount) > 0) && (
                    <View style={{ marginTop: 6 }}>
                      <ThemedText style={{ fontSize: 10.5, fontFamily: 'Sora_600SemiBold', color: '#10b981', letterSpacing: 0.5, marginBottom: 6 }}>
                        LIVE CASHBACK OUTPUT PREVIEW
                      </ThemedText>
                      <CashbackOutputCard
                        sourceTitle={form.name.trim() || 'Tournament Registration'}
                        cashbackTitle={cashbackName.trim() || `${form.name.trim() || 'Tournament'} Cashback Reward`}
                        cashbackCode={cashbackCode.trim().toUpperCase() || activeCashbackCode}
                        cashbackAmount={parseFloat(cashbackAmount) || 0}
                        cashbackType={cashbackType}
                        cashbackMaxAmount={cashbackMaxAmount ? parseFloat(cashbackMaxAmount) : undefined}
                        cashbackOneTime={cashbackOneTime}
                        calculatedReward={cashbackType === 'flat' ? (parseFloat(cashbackAmount) || 0) : Math.min(cashbackMaxAmount ? parseFloat(cashbackMaxAmount) : Infinity, Math.round(((parseAmount(form.entryFee) || 150) * (parseFloat(cashbackAmount) || 0)) / 100))}
                        variant="full"
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepFormContainer}>
            <DashboardSectionLabel label="Sponsors" color={ACCENTS.orange.main} style={styles.stepSectionFirst} />
            {/* Sponsors — a logo plus the name and tier shown beneath it on the
                tournament's Overview strip and Sponsors tab. */}
            <View style={[styles.inputGroup, { marginBottom: 20 }]}>
              <View style={styles.labelRowBetween}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Sponsors ({form.sponsors.length}/8)
                </ThemedText>
                <Pressable onPress={pickSponsorLogo} accessibilityLabel="Add a sponsor logo">
                  <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_500Medium', fontSize: 11 }}>
                    + Add sponsor
                  </ThemedText>
                </Pressable>
              </View>

              {form.sponsors.length === 0 ? (
                <Pressable
                  onPress={pickSponsorLogo}
                  style={[styles.mediaEmpty, { borderColor: theme.outlineVariant + '66' }]}
                >
                  <Ionicons name="ribbon-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={{ color: theme.textSecondary, fontFamily: 'Sora_400Regular', fontSize: 11 }}>
                    Add a sponsor logo, then name it and set its tier
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={{ gap: 10 }}>
                  {form.sponsors.map((sp) => (
                    <View
                      key={sp.id}
                      style={[
                        styles.sponsorRow,
                        { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                      ]}
                    >
                      <Image source={{ uri: sp.logo }} style={styles.sponsorRowLogo} contentFit="contain" />

                      <View style={{ flex: 1, gap: 6 }}>
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.sponsorRowInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="Sponsor name"
                          placeholderTextColor={theme.textSecondary + '80'}
                          value={sp.name}
                          maxLength={MAX_SPONSOR_NAME_LENGTH}
                          onChangeText={(v) => patchSponsor(sp.id, { name: v })}
                        />
                        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                          style={[styles.sponsorRowInput, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33', color: theme.text }]}
                          placeholder="Tier, e.g. Title Sponsor"
                          placeholderTextColor={theme.textSecondary + '80'}
                          value={sp.tier}
                          maxLength={MAX_SPONSOR_TIER_LENGTH}
                          onChangeText={(v) => patchSponsor(sp.id, { tier: v })}
                        />
                      </View>

                      <Pressable
                        onPress={() => removeSponsor(sp.id)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove sponsor ${sp.name || 'without a name'}`}
                      >
                        <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <DashboardSectionLabel label="Media Gallery" color={ACCENTS.primary.main} style={styles.stepSection} />
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

            <DashboardSectionLabel label="Prizes" color={ACCENTS.green.main} style={styles.stepSection} />
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>First prize (winner) <ThemedText style={styles.requiredStar}>*</ThemedText></ThemedText>
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
              <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            {isEditing ? 'Edit Tournament' : 'Create Tournament'}
          </ThemedText>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {/* Host screen first, then drafts — both icon-only, so the header
                stays readable next to a long tournament title. */}
            <Pressable
              onPress={() => router.push('/(tabs)/club')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go to your host screen"
            >
              <Ionicons name="megaphone-outline" size={21} color={theme.secondaryContainer} />
            </Pressable>

            {/* Drafts belong to creation only. When editing, the tournament is
                already published — saving a draft there would fork a second,
                half-finished copy of a live record. */}
            {!isEditing && (
              <Pressable
                onPress={handleSaveDraft}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Save this tournament as a draft"
              >
                <Ionicons name="save-outline" size={21} color={theme.secondaryContainer} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Step tracker — the dashboard card: where you are, how far along,
            and every step as a tappable segment. A forward jump still needs
            the current step to validate. */}
        <DashboardCard
          style={styles.trackerCard}
          title={`Step ${currentStep + 1} of ${STEPS.length} · ${STEPS[currentStep].title}`}
          metric={`${Math.round(((currentStep + 1) / STEPS.length) * 100)}% complete`}
          tag={canAdvance ? '✅ Step complete' : '⚠️ Details needed'}
          icon={STEPS[currentStep].icon as any}
          accent={ACCENTS.primary}
        >
          <DashboardStepper
            steps={STEPS.map((step) => step.short)}
            current={currentStep}
            onSelect={(idx) => {
              if (idx < currentStep) {
                setCurrentStep(idx);
              } else if (idx > currentStep) {
                if (!validateStep(currentStep)) return;
                setCurrentStep(idx);
              }
            }}
          />
        </DashboardCard>

        {/* Ticket preview, pinned above the scrolling form so it stays in view —
            in the same card language as the tournament's Cups card. */}
        <View style={[styles.previewPinned, { borderBottomColor: theme.outlineVariant + '33' }]}>
          <DashboardSectionLabel label="Live Ticket Preview" color={ACCENTS.orange.main} style={{ marginBottom: 8 }} />
          <DashboardCard
            style={styles.previewCard}
            title={form.name || 'Unnamed Tournament'}
            metric={`${formatIsoDate(form.tournStart) || 'Start TBC'} – ${formatIsoDate(form.tournEnd) || 'End TBC'}`}
            tag={`${sportEmoji(form.sportType)} ${form.sportType}`}
            accent={ACCENTS.primary}
            leading={<Image source={form.banner} style={styles.previewThumb} contentFit="cover" />}
            footer={{
              label: 'Prize pool',
              value: prizeLabel(parseAmount(form.winnerPrize), form.winnerPrize),
              status: `${form.selectedGround || 'No venue selected'} · Entry ${prizeLabel(parseAmount(form.entryFee), 'Free')}`,
            }}
          />
        </View>

        {/* Wizard Form Area */}
        <ScrollView 
          style={styles.formScroll} 
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: Spacing.containerMargin }} 
          showsVerticalScrollIndicator={false}
        >
          <DashboardCard
            style={{ marginBottom: 20 }}
            title={getStepHeader().title}
            metric={getStepHeader().subtitle}
            icon={getStepHeader().icon as any}
            accent={ACCENTS.primary}
          >
            {renderStepContent()}
          </DashboardCard>
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
  // Steps share the row evenly (flex: 1) so the circles sit at regular
  // intervals no matter how wide each label is — six steps otherwise drift.
  // Fixed two-line box keeps every circle on the same baseline even when one
  // label wraps and the others don't.
  // Derived from the circle geometry rather than eyeballed.
  trackerCard: {
    marginHorizontal: Spacing.containerMargin,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: 12,
    gap: 10,
  },
  previewCard: { padding: 12, gap: 10 },
  previewThumb: { width: 44, height: 44, borderRadius: 10 },
  stepSectionFirst: { marginBottom: 10 },
  stepSection: { marginTop: 18, marginBottom: 10 },
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
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 999,
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
  addressInput: { height: 64, textAlignVertical: 'top', paddingTop: 10 },
  venueLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 6 },
  venueLabelRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  venueLink: { fontSize: 11, fontFamily: 'Sora_500Medium', marginBottom: 6 },
  venueTypeRow: { flexDirection: 'row', gap: 8 },
  venueTypeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  venueTypeText: { fontSize: 13, fontFamily: 'Sora_600SemiBold', textAlign: 'center' },
  venueSearchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 46 },
  venueSearchInput: { flex: 1, minWidth: 0, fontSize: 13, fontFamily: 'Sora_500Medium' },
  turfPillRow: { flexDirection: 'row', gap: 6, marginTop: 8, paddingRight: 8 },
  turfPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, maxWidth: 190 },
  turfPillText: { fontSize: 11, flexShrink: 1 },
  turfList: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  turfListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 1 },
  turfListTitle: { fontSize: 10.5, fontFamily: 'Sora_600SemiBold' },
  turfListRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  turfListName: { fontSize: 12.5, fontFamily: 'Sora_500Medium' },
  turfListAddress: { fontSize: 10.5, fontFamily: 'Sora_400Regular', marginTop: 1 },
  togglePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  togglePillText: { fontFamily: 'Sora_500Medium', fontSize: 10 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md },
  locationIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  locationText: { fontFamily: 'Sora_500Medium', fontSize: 13 },
  locationHint: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 2 },

  // Bulk Apply Buttons
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },

  // 3 Images Grid with Pin
  threeImageGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
  },
  maxTeamsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 },
  // Chips and the custom box share one height. Padding-derived chips came out
  // ~34px against inputRow's 42px, so the row sat visibly out of line.
  maxTeamsChip: {
    minWidth: 46,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxTeamsChipText: { fontSize: 13, fontFamily: 'Sora_500Medium' },
  maxTeamsCustom: { width: 96, paddingHorizontal: 0 },
  // textAlign alone never centred this: on web a TextInput renders an <input>
  // with an intrinsic min-width (~150px), wider than this 96px box, so the
  // centred text sat right of the visible centre. The input must be allowed
  // to shrink to the box.
  maxTeamsInput: { width: '100%', minWidth: 0, paddingHorizontal: 0, textAlign: 'center' },
  // ── Voucher builder, mirroring the class voucher card ────────────────────
  voucherEmptyBox: {
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.md,
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  voucherEmptyText: { fontSize: 11, fontFamily: 'Sora_400Regular', textAlign: 'center' },
  voucherRowCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  voucherRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  voucherFieldLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_500Medium',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 5,
  },
  voucherFieldRow: { flexDirection: 'row', gap: 8 },
  voucherBannerWrap: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  voucherBannerImg: { width: '100%', height: 96 },
  voucherBannerActions: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  voucherBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(15,23,42,0.78)',
  },
  voucherBannerBtnText: { color: '#ffffff', fontSize: 10.5, fontFamily: 'Sora_500Medium' },
  discountTypeBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountTypeText: { fontSize: 11.5, fontFamily: 'Sora_500Medium' },
  numericInput: { textAlign: 'center' },
  previewPinned: {
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  voucherLimitHint: { fontSize: 9.5, fontFamily: 'Sora_400Regular', color: '#64748b', marginTop: 4 },
  voucherLimitWarn: { fontSize: 9.5, fontFamily: 'Sora_500Medium', color: '#DC2626', marginTop: 4 },
  voucherTermsInput: { height: 58, textAlignVertical: 'top', paddingTop: 9 },
  bannerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  bannerChipText: { fontSize: 10, fontFamily: 'Sora_500Medium' },
  voucherInput: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
    includeFontPadding: false,
    paddingVertical: 0,
    ...({ outlineStyle: 'none' } as any),
  },
  voucherHint: { fontSize: 9.5, fontFamily: 'Sora_400Regular', color: '#64748b', marginBottom: 4 },
  sponsorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  sponsorRowLogo: { width: 42, height: 42, borderRadius: 8, flexShrink: 0 },
  sponsorRowInput: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    includeFontPadding: false,
    paddingVertical: 0,
    ...({ outlineStyle: 'none' } as any),
  },
  unitPrefix: { fontFamily: 'Sora_500Medium', fontSize: 12, color: '#64748b', marginRight: 2 },
  unitSuffix: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#64748b' },
  inputRowInner: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
    includeFontPadding: false,
  },
  requiredStar: { color: '#ef4444', fontFamily: 'Sora_500Medium' },
  errorText: { color: '#ef4444', fontSize: 11, fontFamily: 'Sora_500Medium', marginTop: 4 },
  input: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    includeFontPadding: false,
    paddingVertical: 0,
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
  fieldLabelSub: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
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
});
