import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { SPORTS_LIST } from '@/constants/sports';
import { useTheme } from '@/hooks/use-theme';
import { useTurfStore, useOfferStore } from '@/store/app-store';
import { OfferDiscountType } from '@/store/offer-store';
import { getCurrentGPSLocation, cleanLocation } from '@/utils/location';
import { turfApi } from '@/services/turf-api';

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Turf Info', icon: 'football-outline' },
  { title: 'Time Slots', icon: 'time-outline' },
  { title: 'Offers', icon: 'pricetags-outline' },
  { title: 'Publish', icon: 'checkmark-circle-outline' },
];

// Steps are referenced by index in several places; derive them so inserting a
// step never requires hunting down hard-coded numbers again.
const OFFERS_STEP = 2;
const PUBLISH_STEP = STEPS.length - 1;

// Curated high-res voucher banner presets for instant professional binding
const VOUCHER_BANNER_PRESETS = [
  { id: 'arena', label: '🏟️ Arena', uri: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80' },
  { id: 'night', label: '🌙 Night Lights', uri: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=800&q=80' },
  { id: 'turf', label: '⚽ Lush Turf', uri: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=800&q=80' },
  { id: 'cricket', label: '🏏 Pitch Nets', uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80' },
];

// A voucher being edited inside the turf form. `offerId` is present only once
// the row is backed by a saved offer in the global store.
interface TurfOfferDraft {
  localId: string;
  offerId?: string;
  code: string;
  title: string;
  description: string;
  discountType: OfferDiscountType;
  discountValue: string;
  minBooking: string;
  validDays: string;
  /** Cap on total redemptions — "first N users". Blank means unlimited. */
  maxRedemptions: string;
  /** Single banner image URL or uploaded photo per voucher */
  bannerImage?: string;
}

const makeOfferDraft = (): TurfOfferDraft => ({
  localId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  code: '',
  title: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minBooking: '',
  validDays: '30',
  maxRedemptions: '',
  bannerImage: VOUCHER_BANNER_PRESETS[0].uri,
});

const SURFACE_TYPES = ['Natural Grass', 'Artificial Turf', 'Concrete', 'Wooden Court', 'Clay'];
// Slot-duration picker is temporarily hidden from the form; every turf is
// created at DEFAULT_SLOT_DURATION until it comes back.
const SLOT_DURATIONS = ['30 min', '60 min', '90 min'];
const DEFAULT_SLOT_DURATION = '60 min';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// An operating day runs 4 AM through to 3 AM the following morning, so the
// after-midnight blocks sit at the END of the list. Keeping them in operating
// order (not clock order) is what lets a range like 9 PM → 2 AM select
// contiguously instead of wrapping backwards through the whole day.
const TIME_BLOCKS = [
  '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM',
  '8 PM', '9 PM', '10 PM', '11 PM',
  '12 AM', '1 AM', '2 AM', '3 AM',
];

// Blocks that fall after midnight, surfaced in the UI as a "late night" group.
const LATE_NIGHT_BLOCKS = ['12 AM', '1 AM', '2 AM', '3 AM'];

// Stepper geometry — the connector's vertical offset is computed from these,
// so changing the circle size keeps the track aligned automatically.
const STEP_CIRCLE = 26;
const STEP_LABEL_LINE = 12;
const STEP_CONNECTOR_H = 1.5;

const AMENITIES = [
  { key: 'floodlights', label: 'Floodlights', icon: 'flashlight-outline' },
  { key: 'parking', label: 'Parking', icon: 'car-outline' },
  { key: 'changingRooms', label: 'Changing Rooms', icon: 'shirt-outline' },
  { key: 'cafeteria', label: 'Cafeteria', icon: 'restaurant-outline' },
  { key: 'showers', label: 'Showers', icon: 'water-outline' },
  { key: 'firstAid', label: 'First Aid', icon: 'medkit-outline' },
  { key: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
  { key: 'scoreboard', label: 'Scoreboard', icon: 'stats-chart-outline' },
];

const TURF_SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=800&q=80',
];

type SlotState = 'available' | 'blocked' | 'maintenance' | undefined;

const WEB_INPUT: any = Platform.OS === 'web'
  ? { outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' }
  : {};

// Helper: Format phone number as XXXXX XXXXX (10 digits)
export const formatPhoneNumber = (val: string): string => {
  const digits = String(val || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

// Helper: Format Indian currency with commas (e.g. 1,200)
export const formatIndianCurrency = (rawText: string | number): string => {
  const digits = String(rawText ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
};

const normalizeTimeSlot = (tStr: string): string => {
  if (!tStr) return tStr;
  let clean = tStr.trim();
  const ampmMatch = clean.match(/^0?(\d+)\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    return `${ampmMatch[1]} ${ampmMatch[2].toUpperCase()}`;
  }
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const hr = parseInt(parts[0], 10);
    if (!isNaN(hr)) {
      if (hr === 0) return '12 AM';
      if (hr < 12) return `${hr} AM`;
      if (hr === 12) return '12 PM';
      return `${hr - 12} PM`;
    }
  }
  return clean;
};

const createInitialSlotsMap = (): Record<string, SlotState> => {
  const map: Record<string, SlotState> = {};
  const defaultTimes = [
    '6 AM', '7 AM', '8 AM', '9 AM', '10 AM',
    '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
  ];
  DAYS.forEach(day => {
    defaultTimes.forEach(time => {
      map[`${day}-${time}`] = 'available';
    });
  });
  return map;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateTurfScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const params = useLocalSearchParams<{ editId?: string }>();
  const { addTurf, updateTurf, ownedTurfs } = useTurfStore();
  const { offers, addOffer, updateOffer, deleteOffer, isOfferCodeAvailable, offersLoading } =
    useOfferStore();

  // Vouchers attached to this turf. Edits stay local until the turf is
  // published/updated, so abandoning the form doesn't leave stray offers behind.
  const [turfOffers, setTurfOffers] = useState<TurfOfferDraft[]>([]);
  const [initialOfferIds, setInitialOfferIds] = useState<string[]>([]);
  const [offerErrors, setOfferErrors] = useState<Record<string, string>>({});
  // The saved name of the turf being edited — the key existing offers are
  // matched on, and kept separate from the editable `turfName` field so a
  // rename in the form still resolves the originally attached vouchers.
  const [boundTurfName, setBoundTurfName] = useState('');
  const offersPrefilled = useRef(false);
  const [existingTurfsList, setExistingTurfsList] = useState<any[]>([]);

  // Step 1: Info & Media
  const [turfName, setTurfName] = useState('');
  const [sportType, setSportType] = useState('Football');
  const [surfaceType, setSurfaceType] = useState('Artificial Turf');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState('Tiruchirappalli, Tamil Nadu, India');
  const [manualAddress, setManualAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  // Starts blank so the owner enters a real rate — validateStepOne blocks
  // publishing until they do, rather than a placeholder price going live.
  const [pricePerSlot, setPricePerSlot] = useState('');

  // 3 Upload Slots, with pin icon selecting which is Cover
  const [turfImages, setTurfImages] = useState<(string | null)[]>([null, null, null]);
  const [pinnedIndex, setPinnedIndex] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingPitch, setIsLoadingPitch] = useState(false);

  // Step 2: Slot Management
  // Picker is hidden for now; the value is still carried so slots keep a
  // duration and restoring the control needs no other change.
  const [slotDuration, setSlotDuration] = useState(DEFAULT_SLOT_DURATION);
  const [slotsMap, setSlotsMap] = useState<Record<string, SlotState>>(createInitialSlotsMap());
  const [slotDay, setSlotDay] = useState('Mon');
  const [editMode, setEditMode] = useState<SlotState>('available');

  // Step 3: Amenities & Description
  const [amenities, setAmenities] = useState<Record<string, boolean>>({ floodlights: true, parking: true });
  const [description, setDescription] = useState('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  // Fetch remote turfs list on mount for duplicate detection
  useEffect(() => {
    turfApi.listTurfs().then((res: any) => {
      const turfs = Array.isArray(res) ? res : res?.turfs || [];
      if (Array.isArray(turfs) && turfs.length > 0) {
        setExistingTurfsList(turfs);
      }
    }).catch(() => { });
  }, []);

  const STANDARD_VENUE_NAMES = [
    'Skyline Arena Elite',
    'The Grid Sports Complex',
    'Lord’s Indoor Nets',
    'Wembley Powerleague',
    'The Grid Multisport',
    "Lord's View Pavillion",
  ];

  const isDuplicateTurfName = (name: string): boolean => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return false;

    // Check locally owned turfs (excluding the one being edited)
    const inOwned = (ownedTurfs || []).some(
      t => t.id !== params.editId && t.name?.trim().toLowerCase() === trimmed
    );
    if (inOwned) return true;

    // Check remote backend turfs
    const inBackend = (existingTurfsList || []).some(
      t => (t.id !== params.editId && t._id !== params.editId) && t.name?.trim().toLowerCase() === trimmed
    );
    if (inBackend) return true;

    // Check predefined standard sample venues if adding a brand new turf
    if (!params.editId) {
      const inStandard = STANDARD_VENUE_NAMES.some(sn => sn.toLowerCase() === trimmed);
      if (inStandard) return true;
    }

    return false;
  };

  // ─── Bind Data from Manage Pitch (Edit Mode) ──────────────────────────────
  useEffect(() => {
    if (!params.editId) return;

    let isMounted = true;
    setIsLoadingPitch(true);

    async function bindManagePitchData() {
      try {
        let turf: any = (ownedTurfs || []).find(t => t.id === params.editId);

        // Fetch full turf details from remote backend if not in local store or needs refreshed slots
        if (!turf || !turf.slots || turf.slots.length === 0) {
          try {
            const remoteTurf = await turfApi.getTurfDetails(params.editId!);
            if (remoteTurf) turf = remoteTurf;
          } catch {
            const list = await turfApi.listTurfs();
            turf = (list || []).find((t: any) => t.id === params.editId || t._id === params.editId);
          }
        }

        // Predefined fallback for skyline or the-grid
        if (!turf && params.editId === 'skyline') {
          turf = {
            id: 'skyline',
            name: 'Skyline Arena Elite',
            sportType: 'Football',
            surfaceType: 'Artificial Turf',
            address: 'Canary Wharf, East London, E14 5AB',
            contactNumber: '9876543210',
            pricePerSlot: 2500,
            thumbnailImage: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80',
            images: [
              'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=800&q=80',
            ],
            description: "London's premier rooftop football venue featuring professional 5G rubber infill turf.",
            amenities: { floodlights: true, parking: true, showers: true, wifi: true },
          };
        }

        if (turf && isMounted) {
          setTurfName(turf.name || '');
          setSportType(turf.sportType || 'Football');
          setSurfaceType(turf.surfaceType || 'Artificial Turf');

          const cleanAddr = cleanLocation(turf.address || 'Tiruchirappalli, Tamil Nadu, India');
          setDetectedLocation(cleanAddr);
          setManualAddress(cleanAddr);
          setUseCurrentLocation(false);

          // Mobile Number formatted as XXXXX XXXXX
          const rawPhone = String(turf.contactNumber || '');
          setContactNumber(formatPhoneNumber(rawPhone));

          // Price formatted in ₹ with commas (e.g. 1,200)
          // Leave blank when the saved turf has no rate, so the owner supplies
          // one rather than inheriting an invented default.
          const rawPrice = turf.pricePerSlot ? String(turf.pricePerSlot) : '';
          setPricePerSlot(formatIndianCurrency(rawPrice));

          // 3 Upload Slots, with pin selecting cover
          const allImages: string[] = Array.isArray(turf.images) ? turf.images : [];
          const thumb: string = turf.thumbnailImage || allImages[0] || '';

          const slots = [allImages[0] || null, allImages[1] || null, allImages[2] || null];
          setTurfImages(slots);

          const foundIdx = slots.findIndex(u => u === thumb);
          setPinnedIndex(foundIdx !== -1 ? foundIdx : 0);

          // Amenities & Description
          setAmenities(turf.amenities || { floodlights: true, parking: true });
          setDescription(turf.description || '');

          // Slots
          if (turf.slots && turf.slots.length > 0) {
            const smap: Record<string, SlotState> = createInitialSlotsMap();
            turf.slots.forEach((s: any) => {
              const normTime = normalizeTimeSlot(s.time);
              smap[`${s.day}-${normTime}`] = s.status;
            });
            setSlotsMap(smap);
          }

          setBoundTurfName(turf.name || '');
        }
      } catch (err) {
        console.error('Error binding data from Manage Pitch:', err);
      } finally {
        if (isMounted) setIsLoadingPitch(false);
      }
    }

    bindManagePitchData();

    return () => {
      isMounted = false;
    };
  }, [params.editId, ownedTurfs]);

  // Offers hydrate from AsyncStorage independently of the turf, so pull the
  // attached vouchers in once both are available — and only once, so it can't
  // clobber edits the owner has already made in the Offers step.
  useEffect(() => {
    if (!params.editId || offersPrefilled.current) return;
    // Wait for the store to finish hydrating, otherwise an empty `offers`
    // array would be mistaken for "this turf has no vouchers" and latch.
    if (offersLoading || !boundTurfName) return;

    const attached = offers.filter(o => o.appliesTo === boundTurfName);
    offersPrefilled.current = true;
    if (attached.length === 0) return;

    setTurfOffers(
      attached.map(o => ({
        localId: `existing-${o.id}`,
        offerId: o.id,
        code: o.code,
        title: o.title,
        description: o.description,
        discountType: o.discountType,
        discountValue: String(o.discountValue),
        minBooking: o.minBooking ? String(o.minBooking) : '',
        validDays: String(
          Math.max(1, Math.ceil((new Date(o.validTill).getTime() - Date.now()) / 86400000))
        ),
        maxRedemptions: o.maxRedemptions ? String(o.maxRedemptions) : '',
        bannerImage: o.bannerImage || VOUCHER_BANNER_PRESETS[0].uri,
      }))
    );
    setInitialOfferIds(attached.map(o => o.id));
  }, [params.editId, boundTurfName, offers, offersLoading]);

  const handleDetectLocation = async () => {
    setDetectedLocation('Fetching GPS location…');
    const result = await getCurrentGPSLocation();
    if (result.error) {
      triggerToast(`⚠️ ${result.error}`);
    }
    setDetectedLocation(cleanLocation(result.address));
  };

  // Image Upload Handler (3 Slots)
  const handleUploadImage = (slotIndex: number) => {
    const uri = TURF_SAMPLE_IMAGES[slotIndex % TURF_SAMPLE_IMAGES.length];
    setTurfImages(prev => {
      const next = [...prev];
      next[slotIndex] = uri;
      return next;
    });

    // Auto-pin if current pinned slot was empty
    if (!turfImages[pinnedIndex]) {
      setPinnedIndex(slotIndex);
    }
    setErrors(prev => ({ ...prev, turfPhotos: '' }));
  };

  const handleRemoveImage = (slotIndex: number) => {
    setTurfImages(prev => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });

    if (pinnedIndex === slotIndex) {
      const remainingFilled = turfImages.findIndex((img, i) => i !== slotIndex && img !== null);
      if (remainingFilled !== -1) {
        setPinnedIndex(remainingFilled);
      } else {
        setPinnedIndex(0);
      }
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const validateStepOne = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!turfImages.some(Boolean)) {
      newErrors.turfPhotos = 'Please upload at least 1 Turf Image';
    }
    if (!turfName.trim()) {
      newErrors.turfName = 'Turf Name is required';
    } else if (turfName.trim().length > 30) {
      newErrors.turfName = 'Turf Name cannot exceed 30 characters';
    } else if (/\d/.test(turfName)) {
      newErrors.turfName = 'Turf Name cannot contain numbers';
    } else if (isDuplicateTurfName(turfName)) {
      newErrors.turfName = 'A turf with this name already exists. Please choose a unique name.';
    }

    // Mandatory Mobile Number validation (10 digits)
    const cleanPhone = contactNumber.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.contactNumber = 'Mobile Number is mandatory';
    } else if (cleanPhone.length !== 10) {
      newErrors.contactNumber = 'Mobile Number must be 10 digits';
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.contactNumber = 'Mobile Number should start with 6, 7, 8, or 9';
    }

    // Location format validation
    const finalAddress = useCurrentLocation ? detectedLocation : manualAddress;
    if (!finalAddress || !finalAddress.trim()) {
      newErrors.location = 'Turf Location / Address is mandatory';
    } else if (finalAddress.trim().length < 6) {
      newErrors.location = 'Please enter a valid, complete location address';
    }

    if (!sportType) {
      newErrors.sportType = 'Sport Type is required';
    }
    if (!surfaceType) {
      newErrors.surfaceType = 'Surface Type is required';
    }

    const cleanPrice = Number(pricePerSlot.replace(/,/g, ''));
    if (!pricePerSlot.trim() || isNaN(cleanPrice) || cleanPrice <= 0) {
      newErrors.pricePerSlot = 'Valid Price / Slot is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      triggerToast(`⚠️ ${firstError}`);
      return false;
    }
    return true;
  };

  // ─── Slot Management ─────────────────────────────────────────────────────

  const toggleSlot = (day: string, time: string) => {
    const key = `${day}-${time}`;
    setSlotsMap(prev => {
      const currentState = prev[key];
      if (currentState === editMode) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: editMode };
    });
  };

  const toggleAmenity = (key: string) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyTimeRangeSlots = (days: string[], fromTime: string, toTime: string, label: string) => {
    const fromIdx = TIME_BLOCKS.indexOf(fromTime);
    const toIdx = TIME_BLOCKS.indexOf(toTime);
    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return;

    setSlotsMap(prev => {
      const next = { ...prev };
      days.forEach(day => {
        for (let i = fromIdx; i <= toIdx; i++) {
          next[`${day}-${TIME_BLOCKS[i]}`] = 'available';
        }
      });
      return next;
    });

    triggerToast(`Applied ${label} across selected days!`);
  };

  const clearAllSlots = () => {
    setSlotsMap({});
    triggerToast('All slots cleared for this turf.');
  };

  // ─── Offers step helpers ─────────────────────────────────────────────────

  const patchOffer = (localId: string, patch: Partial<TurfOfferDraft>) => {
    setTurfOffers(prev => prev.map(o => (o.localId === localId ? { ...o, ...patch } : o)));
    setOfferErrors(prev => {
      const next = { ...prev };
      Object.keys(patch).forEach(k => delete next[`${localId}.${k}`]);
      return next;
    });
  };

  const addOfferRow = () => {
    setTurfOffers(prev => [...prev, makeOfferDraft()]);
  };

  const pickVoucherBanner = async (localId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted' && Platform.OS !== 'web') {
        triggerToast('⚠️ Photo library permission needed');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        patchOffer(localId, { bannerImage: result.assets[0].uri });
      }
    } catch (err) {
      console.warn('Error picking voucher banner:', err);
    }
  };

  const removeOfferRow = (localId: string) => {
    setTurfOffers(prev => prev.filter(o => o.localId !== localId));
    setOfferErrors(prev => {
      const next = { ...prev };
      Object.keys(next)
        .filter(k => k.startsWith(`${localId}.`))
        .forEach(k => delete next[k]);
      return next;
    });
  };

  /** A row the owner added but never typed into — dropped silently on save. */
  const isBlankOffer = (o: TurfOfferDraft) =>
    !o.code.trim() &&
    !o.title.trim() &&
    !o.description.trim() &&
    !o.discountValue.trim() &&
    !o.minBooking.trim() &&
    !o.maxRedemptions.trim();

  /**
   * Vouchers are optional: no rows, or rows left entirely untouched, are fine.
   * Only a row the owner actually started filling in has to be complete.
   */
  const validateOffers = (): boolean => {
    const errs: Record<string, string> = {};
    const seenCodes = new Set<string>();

    turfOffers.filter(o => !isBlankOffer(o)).forEach(o => {
      const code = o.code.trim().toUpperCase();
      const value = Number(o.discountValue);
      const days = Number(o.validDays);

      if (!code) {
        errs[`${o.localId}.code`] = 'Enter a code.';
      } else if (!/^[A-Z0-9]{3,15}$/.test(code)) {
        errs[`${o.localId}.code`] = '3-15 letters or numbers, no spaces.';
      } else if (seenCodes.has(code)) {
        errs[`${o.localId}.code`] = 'Duplicated in this form.';
      } else if (!isOfferCodeAvailable(code, o.offerId)) {
        errs[`${o.localId}.code`] = 'Already used by another offer.';
      }
      if (code) seenCodes.add(code);

      if (!o.title.trim()) errs[`${o.localId}.title`] = 'Name this offer.';

      if (!o.discountValue.trim() || isNaN(value) || value <= 0) {
        errs[`${o.localId}.discountValue`] = 'Enter a value above 0.';
      } else if (o.discountType === 'percent' && value > 100) {
        errs[`${o.localId}.discountValue`] = 'Max 100%.';
      }

      if (!o.validDays.trim() || isNaN(days) || days < 1) {
        errs[`${o.localId}.validDays`] = 'At least 1 day.';
      }

      // Blank = unlimited; any supplied cap must be a whole number of users.
      if (o.maxRedemptions.trim()) {
        const cap = Number(o.maxRedemptions);
        if (isNaN(cap) || cap < 1) {
          errs[`${o.localId}.maxRedemptions`] = 'At least 1 user, or leave blank.';
        } else if (!Number.isInteger(cap)) {
          errs[`${o.localId}.maxRedemptions`] = 'Whole numbers only.';
        } else if (o.offerId) {
          // Editing an existing offer: the cap can't drop below what has
          // already been claimed, or the counter would read past its own limit.
          const claimed = offers.find(x => x.id === o.offerId)?.redeemedCount ?? 0;
          if (cap < claimed) {
            errs[`${o.localId}.maxRedemptions`] = `${claimed} already redeemed.`;
          }
        }
      }
    });

    setOfferErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Writes the form's voucher rows back to the global offer store:
   * updates rows that already existed, creates new ones, and deletes any the
   * owner removed. `appliesTo` is re-pointed at the turf's current name so a
   * rename carries its vouchers with it.
   */
  const syncOffersToStore = (finalTurfName: string) => {
    const keptIds: string[] = [];

    turfOffers.filter(o => !isBlankOffer(o)).forEach(o => {
      const validTill = new Date();
      validTill.setDate(validTill.getDate() + Number(o.validDays || 30));

      const payload = {
        code: o.code.trim().toUpperCase(),
        title: o.title.trim(),
        description: o.description.trim(),
        discountType: o.discountType,
        discountValue: Number(o.discountValue),
        minBooking: Number(o.minBooking || 0),
        // 0 is the store's "unlimited" sentinel, which is what blank means.
        maxRedemptions: Number(o.maxRedemptions || 0),
        validTill: validTill.toISOString(),
        appliesTo: finalTurfName,
        bannerImage: o.bannerImage,
      };

      if (o.offerId) {
        updateOffer(o.offerId, payload);
        keptIds.push(o.offerId);
      } else {
        addOffer(payload);
      }
    });

    initialOfferIds.filter(id => !keptIds.includes(id)).forEach(deleteOffer);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateStepOne()) return;
    }
    if (currentStep === OFFERS_STEP) {
      if (!validateOffers()) return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  };

  // ─── Publish or Update Turf ──────────────────────────────────────────────

  const handlePublish = async () => {
    if (!validateStepOne()) {
      setCurrentStep(0);
      return;
    }
    if (!validateOffers()) {
      setCurrentStep(OFFERS_STEP);
      triggerToast('Fix the highlighted offer details first.');
      return;
    }

    const address = cleanLocation(useCurrentLocation ? detectedLocation : manualAddress);
    // No fallback price: validateStepOne has already guaranteed a positive
    // number, so silently substituting one here would only mask a bug.
    const priceNum = parseFloat(pricePerSlot.replace(/,/g, ''));
    const cleanPhone = contactNumber.replace(/\D/g, '');

    const validImages = turfImages.filter(Boolean) as string[];
    const coverUri = turfImages[pinnedIndex] || validImages[0] || TURF_SAMPLE_IMAGES[0];
    const sortedImages = [coverUri, ...validImages.filter(u => u !== coverUri)];

    const slotsArr = Object.entries(slotsMap).map(([key, status]) => {
      const [day, time] = key.split('-');
      return { day, time, status: (status || 'available') as 'available' | 'blocked' | 'maintenance' };
    });

    const turfPayload = {
      name: turfName || 'My Turf',
      sportType: sportType || 'Football',
      surfaceType: surfaceType || 'Artificial Turf',
      address: address || '',
      pricePerSlot: priceNum,
      contactNumber: cleanPhone || '',
      slots: slotsArr,
      amenities: amenities,
      images: sortedImages.length > 0 ? sortedImages : [coverUri],
      thumbnailImage: coverUri,
      description: description || '',
      ownerId: 'current-user',
    };

    // Update existing pitch (from Manage Pitch)
    if (params.editId) {
      try {
        await turfApi.updateTurf(params.editId, turfPayload);
        console.log('Turf successfully updated on backend database.');
      } catch (err: any) {
        console.warn('Backend updateTurf failed, updating locally:', err.message);
      }

      updateTurf(params.editId, turfPayload);
      syncOffersToStore(turfPayload.name);
      triggerToast('✅ Pitch updated successfully!');
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/coach');
      }, 500);
      return;
    }

    // Create new turf
    try {
      await turfApi.createTurf({
        name: turfPayload.name,
        sportType: turfPayload.sportType,
        address: turfPayload.address,
        pricePerSlot: turfPayload.pricePerSlot,
        contactNumber: turfPayload.contactNumber,
        amenities: turfPayload.amenities,
        images: turfPayload.images,
        thumbnailImage: turfPayload.thumbnailImage || undefined,
        description: turfPayload.description || undefined,
        slots: turfPayload.slots,
      });
      console.log('Turf successfully published to backend database.');
    } catch (err: any) {
      console.warn('Backend createTurf failed, stored locally:', err.message);
    }

    addTurf(turfPayload);
    syncOffersToStore(turfPayload.name);
    triggerToast('🎉 Turf published successfully!');

    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    }, 500);
  };

  // ─── Step 1: Info & Media ─────────────────────────────────────────────────

  const renderStepOne = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={styles.formCard}>

        {/* 1. Turf Photos (3 Upload Slots with Pin Icon to set Cover) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <ThemedText style={styles.fieldLabel}>
              Turf Photos <ThemedText style={styles.requiredStar}>*</ThemedText>
            </ThemedText>
            <ThemedText style={[styles.fieldLabelSub, { color: theme.textSecondary }]}>
              Tap 📌 on any image to set Cover
            </ThemedText>
          </View>

          <View style={styles.threeImageGrid}>
            {turfImages.map((img, idx) => {
              const isCover = pinnedIndex === idx && !!img;
              if (img) {
                return (
                  <View
                    key={idx}
                    style={[
                      styles.imageCardSlot,
                      { borderColor: isCover ? theme.primary : theme.outlineVariant + '44' },
                      isCover && { borderWidth: 2 }
                    ]}
                  >
                    <Image source={{ uri: img }} style={styles.imagePreviewFull} contentFit="cover" />

                    {/* Cover Badge if Pinned */}
                    {isCover && (
                      <View style={[styles.pinnedCoverBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="pin" size={10} color="#ffffff" style={{ marginRight: 2 }} />
                        <ThemedText style={styles.pinnedCoverBadgeText}>Cover</ThemedText>
                      </View>
                    )}

                    {/* Overlay Action Buttons: Pin Icon + Delete.
                        Icon-only — a "Set Cover" text label made this row wider
                        than the slot, so the delete button was clipped away. */}
                    <View style={styles.imageSlotActionOverlay}>
                      <Pressable
                        onPress={() => setPinnedIndex(idx)}
                        hitSlop={6}
                        accessibilityLabel="Set as cover photo"
                        style={[
                          styles.pinIconButton,
                          { backgroundColor: isCover ? theme.primary : 'rgba(0,0,0,0.65)' }
                        ]}
                      >
                        <Ionicons name={isCover ? 'pin' : 'pin-outline'} size={12} color="#ffffff" />
                      </Pressable>

                      <Pressable
                        onPress={() => handleRemoveImage(idx)}
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
                  onPress={() => handleUploadImage(idx)}
                  style={[
                    styles.imageCardSlot,
                    styles.imageCardPlaceholder,
                    { backgroundColor: theme.surfaceLow, borderColor: errors.turfPhotos ? '#ef4444' : theme.outlineVariant + '44' }
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

          {!!errors.turfPhotos && (
            <ThemedText style={styles.errorText}>{errors.turfPhotos}</ThemedText>
          )}
        </View>

        {/* 2. Turf Name */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            Turf Name <ThemedText style={styles.requiredStar}>*</ThemedText>
          </ThemedText>
          <TextInput
            value={turfName}
            maxLength={30}
            onChangeText={(t) => {
              const filtered = t.replace(/[0-9]/g, '').slice(0, 30);
              setTurfName(filtered);
              if (errors.turfName) setErrors(prev => ({ ...prev, turfName: '' }));
            }}
            onBlur={() => {
              if (turfName.trim() && isDuplicateTurfName(turfName)) {
                setErrors(prev => ({ ...prev, turfName: 'A turf with this name already exists. Please choose a unique name.' }));
              }
            }}
            placeholder="e.g. Skyline Football Arena"
            placeholderTextColor="#94a3b8"
            style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: errors.turfName ? '#ef4444' : theme.outlineVariant + '44' }, WEB_INPUT]}
          />
          {!!errors.turfName && (
            <ThemedText style={styles.errorText}>{errors.turfName}</ThemedText>
          )}
        </View>

        {/* 3. Sport Type (Top 5 filled inline on row 1, remaining filled on row 2) */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            Sport Type <ThemedText style={styles.requiredStar}>*</ThemedText>
          </ThemedText>

          {/* Row 1: Top 5 Sports completely filled */}
          <View style={styles.sportsRow}>
            {SPORTS_LIST.slice(0, 5).map((sport) => {
              const isActive = sportType.toLowerCase() === sport.name.toLowerCase();
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => {
                    setSportType(sport.name);
                    if (errors.sportType) setErrors(prev => ({ ...prev, sportType: '' }));
                  }}
                  style={[
                    styles.sportChipInline,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: isActive ? theme.primary : errors.sportType ? '#ef4444' : theme.outlineVariant + '35',
                    },
                    isActive && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    }
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={14}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.sportChipText,
                      { color: isActive ? '#ffffff' : theme.textSecondary }
                    ]}
                    numberOfLines={1}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Row 2: Remaining sports with matching column widths */}
          <View style={styles.sportsRow}>
            {SPORTS_LIST.slice(5).map((sport) => {
              const isActive = sportType.toLowerCase() === sport.name.toLowerCase();
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => {
                    setSportType(sport.name);
                    if (errors.sportType) setErrors(prev => ({ ...prev, sportType: '' }));
                  }}
                  style={[
                    styles.sportChipInline,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: isActive ? theme.primary : errors.sportType ? '#ef4444' : theme.outlineVariant + '35',
                    },
                    isActive && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    }
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={14}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.sportChipText,
                      { color: isActive ? '#ffffff' : theme.textSecondary }
                    ]}
                    numberOfLines={1}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
            <View style={styles.sportChipSpacer} />
            <View style={styles.sportChipSpacer} />
          </View>

          {!!errors.sportType && (
            <ThemedText style={styles.errorText}>{errors.sportType}</ThemedText>
          )}
        </View>

        {/* 4. Surface Type */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            Surface Type <ThemedText style={styles.requiredStar}>*</ThemedText>
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {SURFACE_TYPES.map(s => {
              const isActive = surfaceType === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    setSurfaceType(s);
                    if (errors.surfaceType) setErrors(prev => ({ ...prev, surfaceType: '' }));
                  }}
                  style={[
                    styles.filterChip,
                    { backgroundColor: theme.surfaceLow, borderColor: isActive ? theme.secondary : errors.surfaceType ? '#ef4444' : theme.outlineVariant + '44' },
                    isActive && { backgroundColor: theme.secondary, borderColor: theme.secondary }
                  ]}
                >
                  <ThemedText style={{ color: isActive ? '#ffffff' : theme.textSecondary, fontFamily: 'Sora_600SemiBold', fontSize: 10, letterSpacing: 0.2 }}>{s}</ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
          {!!errors.surfaceType && (
            <ThemedText style={styles.errorText}>{errors.surfaceType}</ThemedText>
          )}
        </View>

        {/* 5. Location */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <ThemedText style={styles.fieldLabel}>
              Location <ThemedText style={styles.requiredStar}>*</ThemedText>
            </ThemedText>
            <Pressable onPress={() => { const next = !useCurrentLocation; setUseCurrentLocation(next); if (next) handleDetectLocation(); }} style={[styles.togglePill, { backgroundColor: useCurrentLocation ? theme.primary + '18' : theme.surfaceLow, borderColor: useCurrentLocation ? theme.primary + '44' : theme.outlineVariant + '33' }]}>
              <Ionicons name={useCurrentLocation ? 'locate' : 'create-outline'} size={11} color={useCurrentLocation ? theme.primary : theme.textSecondary} />
              <ThemedText style={[styles.togglePillText, { color: useCurrentLocation ? theme.primary : theme.textSecondary }]}>{useCurrentLocation ? 'Current Location' : 'Enter Address'}</ThemedText>
            </Pressable>
          </View>

          {useCurrentLocation ? (
            <Pressable onPress={handleDetectLocation} style={[styles.locationCard, { backgroundColor: theme.surfaceLow, borderColor: errors.location ? '#ef4444' : theme.primary + '33' }]}>
              <View style={[styles.locationIconBg, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="navigate" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{detectedLocation}</ThemedText>
                <ThemedText style={[styles.locationHint, { color: theme.textSecondary }]}>Formatted GPS Location • Tap to refresh</ThemedText>
              </View>
              <Ionicons name="refresh-outline" size={16} color={theme.primary} />
            </Pressable>
          ) : (
            <TextInput
              value={manualAddress}
              onChangeText={(t) => {
                setManualAddress(t);
                if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
              }}
              placeholder="e.g. 12 Bypass Road, Thillai Nagar, Tiruchirappalli - 620018"
              placeholderTextColor="#94a3b8"
              style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: errors.location ? '#ef4444' : theme.outlineVariant + '44' }, WEB_INPUT]}
            />
          )}
          {!!errors.location && (
            <ThemedText style={styles.errorText}>{errors.location}</ThemedText>
          )}
        </View>

        {/* 6. Mobile Number (Formatted with +91 and 10 digits) */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            Mobile Number <ThemedText style={styles.requiredStar}>*</ThemedText>
          </ThemedText>
          <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: errors.contactNumber ? '#ef4444' : theme.outlineVariant + '44' }]}>
            <View style={[styles.countryCodeBadge, { backgroundColor: theme.primary + '18' }]}>
              <ThemedText style={[styles.countryCodeText, { color: theme.primary }]}>+91</ThemedText>
            </View>
            <TextInput
              value={contactNumber}
              maxLength={11} // 10 digits + 1 space
              onChangeText={(t) => {
                const formatted = formatPhoneNumber(t);
                setContactNumber(formatted);
                if (errors.contactNumber) setErrors(prev => ({ ...prev, contactNumber: '' }));
              }}
              placeholder="98765 43210"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              style={[styles.inputRowInner, { color: theme.text }, WEB_INPUT]}
            />
          </View>
          {!!errors.contactNumber && (
            <ThemedText style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.contactNumber}</ThemedText>
          )}
        </View>

        {/* 7. Price / Slot (Formatted with ₹ and comma separators) */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            Price / Slot (₹) <ThemedText style={styles.requiredStar}>*</ThemedText>
          </ThemedText>
          <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: errors.pricePerSlot ? '#ef4444' : theme.outlineVariant + '44' }]}>
            <ThemedText style={[styles.currencyPrefix, { color: theme.secondary }]}>₹</ThemedText>
            <TextInput
              value={pricePerSlot}
              onChangeText={(t) => {
                const formatted = formatIndianCurrency(t);
                setPricePerSlot(formatted);
                if (errors.pricePerSlot) setErrors(prev => ({ ...prev, pricePerSlot: '' }));
              }}
              keyboardType="number-pad"
              placeholder="1,200"
              placeholderTextColor="#94a3b8"
              style={[styles.inputRowInner, { color: theme.text }, WEB_INPUT]}
            />
            <ThemedText style={[styles.inputSuffix, { color: theme.textSecondary }]}>per slot</ThemedText>
          </View>
          {!!errors.pricePerSlot && (
            <ThemedText style={styles.errorText}>{errors.pricePerSlot}</ThemedText>
          )}
        </View>

      </View>
    </ScrollView>
  );

  // ─── Step 2: Slot Grid & Durations ────────────────────────────────────────

  const MORNING_SLOTS = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM'];
  const EVENING_SLOTS = ['6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'];

  const renderStepTwo = () => {
    const configuredCount = Object.keys(slotsMap).filter(k => slotsMap[k] !== undefined).length;
    const isMorningSelected = MORNING_SLOTS.every(t => slotsMap[`${slotDay}-${t}`] !== undefined);
    const isEveningSelected = EVENING_SLOTS.every(t => slotsMap[`${slotDay}-${t}`] !== undefined);
    const isLateNightSelected = LATE_NIGHT_BLOCKS.every(t => slotsMap[`${slotDay}-${t}`] !== undefined);

    const handleToggleLateNightQuick = () => {
      setSlotsMap(prev => {
        const next = { ...prev };
        if (isLateNightSelected) {
          LATE_NIGHT_BLOCKS.forEach(t => {
            delete next[`${slotDay}-${t}`];
          });
          triggerToast(`Deselected Late Night slots for ${slotDay}`);
        } else {
          LATE_NIGHT_BLOCKS.forEach(t => {
            next[`${slotDay}-${t}`] = editMode;
          });
          triggerToast(`Selected Late Night slots (${editMode}) for ${slotDay}`);
        }
        return next;
      });
    };

    const handleToggleMorningQuick = () => {
      setSlotsMap(prev => {
        const next = { ...prev };
        if (isMorningSelected) {
          MORNING_SLOTS.forEach(t => {
            delete next[`${slotDay}-${t}`];
          });
          triggerToast(`Deselected Morning slots for ${slotDay}`);
        } else {
          MORNING_SLOTS.forEach(t => {
            next[`${slotDay}-${t}`] = editMode;
          });
          triggerToast(`Selected Morning slots (${editMode}) for ${slotDay}`);
        }
        return next;
      });
    };

    const handleToggleEveningQuick = () => {
      setSlotsMap(prev => {
        const next = { ...prev };
        if (isEveningSelected) {
          EVENING_SLOTS.forEach(t => {
            delete next[`${slotDay}-${t}`];
          });
          triggerToast(`Deselected Evening slots for ${slotDay}`);
        } else {
          EVENING_SLOTS.forEach(t => {
            next[`${slotDay}-${t}`] = editMode;
          });
          triggerToast(`Selected Evening slots (${editMode}) for ${slotDay}`);
        }
        return next;
      });
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <View style={{ paddingHorizontal: Spacing.containerMargin }}>
          {/* Quick Setup (Dynamic based on slot selection below) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>
                Quick Slot Setup <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold' }}>({slotDay})</ThemedText>
              </ThemedText>
              <Pressable
                onPress={() => {
                  setSlotsMap(prev => {
                    const next = { ...prev };
                    DAYS.forEach(d => {
                      TIME_BLOCKS.forEach(t => {
                        if (prev[`${slotDay}-${t}`]) {
                          next[`${d}-${t}`] = prev[`${slotDay}-${t}`];
                        } else {
                          delete next[`${d}-${t}`];
                        }
                      });
                    });
                    return next;
                  });
                  triggerToast(`Applied ${slotDay}'s schedule to all days!`);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="copy-outline" size={11} color={theme.primary} />
                <ThemedText style={{ color: theme.primary, fontSize: 10.5, fontFamily: 'Sora_700Bold' }}>Copy to All Days</ThemedText>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Pressable
                onPress={handleToggleMorningQuick}
                style={[
                  styles.bulkBtn,
                  {
                    backgroundColor: isMorningSelected ? theme.primary + '20' : theme.surfaceLow,
                    borderColor: isMorningSelected ? theme.primary : theme.outlineVariant + '44',
                    borderWidth: isMorningSelected ? 1.5 : 1,
                  }
                ]}
              >
                <Ionicons
                  name={isMorningSelected ? "sunny" : "sunny-outline"}
                  size={15}
                  color={isMorningSelected ? theme.primary : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.bulkBtnText,
                    {
                      color: isMorningSelected ? theme.primary : theme.text,
                      fontFamily: isMorningSelected ? 'Sora_700Bold' : 'Sora_600SemiBold',
                    }
                  ]}
                >
                  Morning (6–10 AM)
                </ThemedText>
                {isMorningSelected && (
                  <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                )}
              </Pressable>

              <Pressable
                onPress={handleToggleEveningQuick}
                style={[
                  styles.bulkBtn,
                  {
                    backgroundColor: isEveningSelected ? theme.secondary + '20' : theme.surfaceLow,
                    borderColor: isEveningSelected ? theme.secondary : theme.outlineVariant + '44',
                    borderWidth: isEveningSelected ? 1.5 : 1,
                  }
                ]}
              >
                <Ionicons
                  name={isEveningSelected ? "moon" : "moon-outline"}
                  size={15}
                  color={isEveningSelected ? theme.secondary : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.bulkBtnText,
                    {
                      color: isEveningSelected ? theme.secondary : theme.text,
                      fontFamily: isEveningSelected ? 'Sora_700Bold' : 'Sora_600SemiBold',
                    }
                  ]}
                >
                  Evening (6–11 PM)
                </ThemedText>
                {isEveningSelected && (
                  <Ionicons name="checkmark-circle" size={14} color={theme.secondary} />
                )}
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Pressable
                onPress={handleToggleLateNightQuick}
                accessibilityRole="button"
                accessibilityState={{ selected: isLateNightSelected }}
                style={[
                  styles.bulkBtn,
                  {
                    backgroundColor: isLateNightSelected ? '#8b5cf620' : theme.surfaceLow,
                    borderColor: isLateNightSelected ? '#8b5cf6' : theme.outlineVariant + '44',
                    borderWidth: isLateNightSelected ? 1.5 : 1,
                  }
                ]}
              >
                <Ionicons
                  name={isLateNightSelected ? 'cloudy-night' : 'cloudy-night-outline'}
                  size={15}
                  color={isLateNightSelected ? '#8b5cf6' : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.bulkBtnText,
                    {
                      color: isLateNightSelected ? '#8b5cf6' : theme.text,
                      fontFamily: isLateNightSelected ? 'Sora_700Bold' : 'Sora_600SemiBold',
                    }
                  ]}
                >
                  Late Night (12–3 AM)
                </ThemedText>
                {isLateNightSelected && (
                  <Ionicons name="checkmark-circle" size={14} color="#8b5cf6" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Slot Duration picker temporarily removed — every slot is
              DEFAULT_SLOT_DURATION. Restore the SLOT_DURATIONS chip row here
              to bring the choice back. */}

          {/* Unified Day Tabs (Mon - Sun) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.fieldLabel}>Select Day Schedule</ThemedText>
              <ThemedText style={[styles.fieldLabelSub, { color: theme.secondary, fontFamily: 'Sora_700Bold' }]}>
                {configuredCount} Active Slots
              </ThemedText>
            </View>
            <View style={styles.dayTabRow}>
              {DAYS.map(day => {
                const isActive = slotDay === day;
                const count = Object.keys(slotsMap).filter(k => k.startsWith(`${day}-`) && slotsMap[k] !== undefined).length;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSlotDay(day)}
                    style={[
                      styles.dayTab,
                      {
                        backgroundColor: isActive ? theme.primary : theme.surfaceLow,
                        borderColor: isActive ? theme.primary : theme.outlineVariant + '33',
                      }
                    ]}
                  >
                    <ThemedText style={[styles.dayTabText, { color: isActive ? '#fff' : theme.text }]}>
                      {day}
                    </ThemedText>
                    {count > 0 && (
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isActive ? '#fff' : theme.secondary, marginTop: 2 }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Slot Edit Mode Toolbar */}
          <View style={[styles.editToolbar, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
            <ThemedText style={[styles.editToolbarText, { color: theme.textSecondary }]}>
              Tap slot to mark as:
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => setEditMode('available')}
                style={[
                  styles.modeBtn,
                  editMode === 'available'
                    ? { backgroundColor: '#10b98122', borderColor: '#10b981' }
                    : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '44' }
                ]}
              >
                <View style={[styles.modeDot, { backgroundColor: '#10b981' }]} />
                <ThemedText style={[styles.modeBtnText, { color: editMode === 'available' ? '#10b981' : theme.textSecondary }]}>
                  Open
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setEditMode('blocked')}
                style={[
                  styles.modeBtn,
                  editMode === 'blocked'
                    ? { backgroundColor: '#ef444422', borderColor: '#ef4444' }
                    : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '44' }
                ]}
              >
                <View style={[styles.modeDot, { backgroundColor: '#ef4444' }]} />
                <ThemedText style={[styles.modeBtnText, { color: editMode === 'blocked' ? '#ef4444' : theme.textSecondary }]}>
                  Blocked
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setEditMode('maintenance')}
                style={[
                  styles.modeBtn,
                  editMode === 'maintenance'
                    ? { backgroundColor: '#f59e0b22', borderColor: '#f59e0b' }
                    : { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '44' }
                ]}
              >
                <View style={[styles.modeDot, { backgroundColor: '#f59e0b' }]} />
                <ThemedText style={[styles.modeBtnText, { color: editMode === 'maintenance' ? '#f59e0b' : theme.textSecondary }]}>
                  Maint.
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Time Slot Grid for Selected Day */}
          <View style={styles.slotGrid}>
            {TIME_BLOCKS.map(time => {
              const key = `${slotDay}-${time}`;
              const status = slotsMap[key];
              let bg: string = theme.surfaceLow;
              let border: string = theme.outlineVariant + '33';
              let textCol: string = theme.textSecondary;

              if (status === 'available') {
                bg = '#10b98118';
                border = '#10b981';
                textCol = '#10b981';
              } else if (status === 'blocked') {
                bg = '#ef444418';
                border = '#ef4444';
                textCol = '#ef4444';
              } else if (status === 'maintenance') {
                bg = '#f59e0b18';
                border = '#f59e0b';
                textCol = '#f59e0b';
              }

              return (
                <Pressable
                  key={time}
                  onPress={() => toggleSlot(slotDay, time)}
                  style={[styles.slotCell, { backgroundColor: bg, borderColor: border }]}
                >
                  <ThemedText style={[styles.slotCellText, { color: textCol }]}>
                    {time}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
            💡 Tapping a slot applies the current mode ({editMode}). Tapping it again removes the slot.
            Slots 12 AM – 3 AM run after midnight, on the following morning.
          </ThemedText>

          {/* Clear Button */}
          <Pressable onPress={clearAllSlots} style={{ marginTop: Spacing.md, alignSelf: 'flex-start' }}>
            <ThemedText style={{ fontSize: 11, color: '#ef4444', fontFamily: 'Sora_600SemiBold' }}>
              Clear All Slots
            </ThemedText>
          </Pressable>

          {/* Dynamic Price Guider Card (PRO teaser) */}
          <View style={[styles.priceGuiderCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
            <View style={styles.priceGuiderRow}>
              <View style={[styles.priceGuiderIconCircle, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="trending-up-outline" size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.priceGuiderTitle, { color: theme.text }]}>Dynamic Price Guider</ThemedText>
                <ThemedText style={[styles.priceGuiderSub, { color: theme.textSecondary }]}>
                  Automatically optimize peak weekend & night pricing based on local occupancy trends.
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.proNoteText, { color: theme.textSecondary }]}>
              Included with Turf Owner PRO tier
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    );
  };

  // ─── Step 3: Vouchers & Offers ───────────────────────────────────────────

  const renderVoucherDesignCard = (draft: TurfOfferDraft) => {
    const discountVal = draft.discountValue || '20';
    const isPercent = draft.discountType === 'percent';
    const discountLabel = isPercent ? `${discountVal}%` : `₹${discountVal}`;
    const code = (draft.code || 'PROMOCODE').trim().toUpperCase();
    const minBook = Number(draft.minBooking || 0);
    const days = draft.validDays || '30';
    const cap = Number(draft.maxRedemptions || 0);
    const brand = turfName.trim() || 'TURF';

    return (
      <View key={draft.localId} style={styles.kakaoCouponCard}>
        {/* Serrated Perforated Top Teeth Row */}
        <View style={styles.kakaoTeethRow}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.kakaoTooth} />
          ))}
        </View>

        {/* Main Body: with user-selected banner image or consistent fallback color */}
        <View style={styles.kakaoPinkBody}>
          {draft.bannerImage ? (
            <>
              <Image
                source={{ uri: draft.bannerImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(255, 30, 112, 0.84)', 'rgba(219, 10, 85, 0.95)']}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : null}

          {/* Subtle Watermark "SALE" */}
          <ThemedText style={styles.kakaoWatermark}>SALE</ThemedText>

          {/* Header Row: Brand block on left, Yellow circle on right */}
          <View style={styles.kakaoHeaderRow}>
            <View style={styles.kakaoBrandBlock}>
              <ThemedText style={styles.kakaoBrandTitle} numberOfLines={1}>
                {brand.toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.kakaoBrandSub}>STYLE</ThemedText>
              <ThemedText style={styles.kakaoBrandCoupon}>X COUPON</ThemedText>
              <View style={styles.kakaoBrandLine} />
            </View>

            {/* Floating Yellow Circle Badge */}
            <View style={styles.kakaoYellowBadge}>
              <ThemedText style={styles.kakaoYellowBadgeText}>COUPON</ThemedText>
              <ThemedText style={styles.kakaoYellowBadgeText}>CLAIM</ThemedText>
              <Ionicons name="arrow-down" size={13} color="#000000" style={{ marginTop: 1 }} />
            </View>
          </View>

          {/* Center Discount Typography: 20% OFF */}
          <View style={styles.kakaoDiscountCenter}>
            <ThemedText style={styles.kakaoBigDiscount}>
              {discountLabel}
            </ThemedText>
            <ThemedText style={styles.kakaoBigOff}>OFF</ThemedText>
          </View>
        </View>

        {/* Bottom Tear-Off Stub (White) */}
        <View style={styles.kakaoWhiteStub}>
          <ThemedText style={styles.kakaoStubLabel}>VALIDITY PERIOD</ThemedText>
          <ThemedText style={styles.kakaoStubDays}>
            Valid for {days} Days · {cap > 0 ? `Limited to 1st ${cap} Users` : 'All Users'}
          </ThemedText>

          <View style={styles.kakaoStubFooter}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <ThemedText style={styles.kakaoStubCode}>
                Code: <ThemedText style={{ fontFamily: 'Sora_800ExtraBold', color: '#FF1E70' }}>{code}</ThemedText>
                {minBook > 0 ? ` · Min ₹${minBook}` : ''}
              </ThemedText>
              <ThemedText style={styles.kakaoStubDesc} numberOfLines={1}>
                {draft.description.trim() || 'Claim this voucher discount during booking checkout.'}
              </ThemedText>
            </View>

            {/* Barcode Graphic */}
            <View style={styles.kakaoBarcode}>
              {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1].map((w, idx) => (
                <View
                  key={idx}
                  style={{
                    width: w,
                    height: 22,
                    backgroundColor: '#18181b',
                    marginRight: idx % 2 === 0 ? 1.5 : 2,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderStepOffers = () => {
    const offerField = (
      draft: TurfOfferDraft,
      key: keyof TurfOfferDraft,
      label: string,
      opts: { placeholder?: string; numeric?: boolean; multiline?: boolean; caps?: boolean } = {}
    ) => {
      const errKey = `${draft.localId}.${key}`;
      const hasErr = !!offerErrors[errKey];
      return (
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
          <TextInput
            value={draft[key] as string}
            onChangeText={v => patchOffer(draft.localId, { [key]: v } as Partial<TurfOfferDraft>)}
            placeholder={opts.placeholder}
            placeholderTextColor={theme.textSecondary + '99'}
            keyboardType={opts.numeric ? 'numeric' : 'default'}
            autoCapitalize={opts.caps ? 'characters' : 'sentences'}
            multiline={opts.multiline}
            style={[
              styles.input,
              opts.multiline && { height: 74, paddingTop: Spacing.sm, textAlignVertical: 'top' },
              {
                backgroundColor: theme.surfaceLow,
                color: theme.text,
                borderColor: hasErr ? '#ef4444' : theme.outlineVariant + '44',
              },
            ]}
          />
          {hasErr && <ThemedText style={styles.errorText}>{offerErrors[errKey]}</ThemedText>}
        </View>
      );
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 15 }}>
              Vouchers & Offers
            </ThemedText>
            <View style={[styles.optionalTag, { backgroundColor: theme.surfaceLow }]}>
              <ThemedText style={[styles.optionalTagText, { color: theme.textSecondary }]}>
                Optional
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.helperText, { color: theme.textSecondary, marginTop: 4 }]}>
            Add promotional voucher codes with custom banner art that players can redeem when booking this turf.
          </ThemedText>

          {turfOffers.length === 0 ? (
            <View style={styles.offerEmptyBox}>
              <Ionicons name="pricetags-outline" size={26} color={theme.textSecondary} />
              <ThemedText style={[styles.offerEmptyText, { color: theme.textSecondary }]}>
                No vouchers — that&apos;s fine, just continue.
              </ThemedText>
            </View>
          ) : (
            turfOffers.map((draft, idx) => (
              <View
                key={draft.localId}
                style={[
                  styles.offerRowCard,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                ]}
              >
                <View style={styles.offerRowHeader}>
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 12.5 }}>
                    Offer {idx + 1}
                    {draft.offerId ? '' : '  ·  New'}
                  </ThemedText>
                  <Pressable
                    onPress={() => removeOfferRow(draft.localId)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove offer ${idx + 1}`}
                  >
                    <Ionicons name="trash-outline" size={16} color="#b91c1c" />
                  </Pressable>
                </View>

                {/* ── 1. Banner Image Upload Section ── */}
                <View style={{ marginTop: 12 }}>
                  <ThemedText style={styles.fieldLabel}>VOUCHER BANNER ART</ThemedText>
                  <ThemedText style={[styles.uploadHint, { color: theme.textSecondary, marginBottom: 8 }]}>
                    Single banner art displayed on this voucher's ticket &amp; player wallet
                  </ThemedText>

                  {/* Banner Preview & Action Box */}
                  <View style={[styles.voucherBannerPickerCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
                    <Image
                      source={{ uri: draft.bannerImage || VOUCHER_BANNER_PRESETS[0].uri }}
                      style={styles.voucherBannerThumb}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.75)']}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.voucherBannerActions}>
                      <Pressable
                        onPress={() => pickVoucherBanner(draft.localId)}
                        style={[styles.bannerUploadBtn, { backgroundColor: theme.primary }]}
                        accessibilityRole="button"
                        accessibilityLabel="Upload custom banner"
                      >
                        <Ionicons name="cloud-upload-outline" size={14} color="#ffffff" />
                        <ThemedText style={styles.bannerUploadBtnText}>
                          Upload Banner
                        </ThemedText>
                      </Pressable>

                      {draft.bannerImage && (
                        <Pressable
                          onPress={() => patchOffer(draft.localId, { bannerImage: VOUCHER_BANNER_PRESETS[0].uri })}
                          style={styles.bannerRemoveBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Reset banner"
                        >
                          <Ionicons name="refresh-outline" size={13} color="#ffffff" />
                          <ThemedText style={styles.bannerRemoveBtnText}>Reset</ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Quick Curated Preset Selector */}
                  <View style={{ marginTop: 8 }}>
                    <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_600SemiBold', color: theme.textSecondary, marginBottom: 5 }}>
                      Or select a curated sports preset:
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                      {VOUCHER_BANNER_PRESETS.map(p => {
                        const isSelected = draft.bannerImage === p.uri;
                        return (
                          <Pressable
                            key={p.id}
                            onPress={() => patchOffer(draft.localId, { bannerImage: p.uri })}
                            style={[
                              styles.presetChip,
                              {
                                backgroundColor: isSelected ? theme.primary + '22' : theme.surfaceLowest,
                                borderColor: isSelected ? theme.primary : theme.outlineVariant + '44',
                              },
                            ]}
                          >
                            <ThemedText style={[styles.presetChipText, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                              {p.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* ── 2. Voucher Fields ── */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  {offerField(draft, 'code', 'PROMO CODE', { placeholder: 'WEEKDAY20', caps: true })}
                  {offerField(draft, 'title', 'OFFER NAME', { placeholder: 'Weekday Saver' })}
                </View>

                <View style={{ marginTop: 12 }}>
                  <ThemedText style={styles.fieldLabel}>DISCOUNT TYPE</ThemedText>
                  <View style={styles.filterRow}>
                    {(['percent', 'flat'] as OfferDiscountType[]).map(t => {
                      const active = draft.discountType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => patchOffer(draft.localId, { discountType: t })}
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
                              fontSize: 11.5,
                              fontFamily: 'Sora_600SemiBold',
                              color: active ? '#ffffff' : theme.textSecondary,
                            }}
                          >
                            {t === 'percent' ? 'Percent (%)' : 'Flat (₹)'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  {offerField(
                    draft,
                    'discountValue',
                    draft.discountType === 'percent' ? 'DISCOUNT (%)' : 'DISCOUNT (₹)',
                    { placeholder: draft.discountType === 'percent' ? '20' : '150', numeric: true }
                  )}
                  {offerField(draft, 'minBooking', 'MIN BOOKING (₹)', {
                    placeholder: '0',
                    numeric: true,
                  })}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  {offerField(draft, 'validDays', 'VALID (DAYS)', {
                    placeholder: '30',
                    numeric: true,
                  })}
                  {offerField(draft, 'maxRedemptions', 'FIRST N USERS', {
                    placeholder: 'Unlimited',
                    numeric: true,
                  })}
                </View>

                <ThemedText style={[styles.offerHint, { color: theme.textSecondary }]}>
                  {Number(draft.maxRedemptions) > 0
                    ? `Only the first ${Number(draft.maxRedemptions)} player${Number(draft.maxRedemptions) === 1 ? '' : 's'} can redeem this code — it stops working after that.`
                    : 'Leave blank for unlimited redemptions.'}
                </ThemedText>

                <View style={{ marginTop: 12 }}>
                  {offerField(draft, 'description', 'DESCRIPTION', {
                    placeholder: 'What do players get, and when?',
                    multiline: true,
                  })}
                </View>

                {/* ── 3. Live Voucher Design Output (Template Binding) ── */}
                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="color-palette-outline" size={14} color={theme.primary} />
                      <ThemedText style={{ fontFamily: 'Sora_700Bold', fontSize: 11, color: theme.primary, letterSpacing: 0.3 }}>
                        VOUCHER DESIGN OUTPUT
                      </ThemedText>
                    </View>
                    <View style={[styles.livePreviewBadge, { backgroundColor: theme.primary + '18' }]}>
                      <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
                      <ThemedText style={[styles.livePreviewText, { color: theme.primary }]}>
                        Live Bound
                      </ThemedText>
                    </View>
                  </View>

                  {renderVoucherDesignCard(draft)}
                </View>
              </View>
            ))
          )}

          <Pressable
            onPress={addOfferRow}
            accessibilityRole="button"
            accessibilityLabel="Add another voucher"
            style={[styles.addOfferBtn, { borderColor: theme.primary }]}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 12.5 }}>
              {turfOffers.length === 0 ? 'Add a voucher' : 'Add another voucher'}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  // ─── Step 4: Publish & Preview ───────────────────────────────────────────

  const renderStepThree = () => {
    const configuredCount = Object.keys(slotsMap).filter(k => slotsMap[k] !== undefined).length;
    const finalAddress = useCurrentLocation ? detectedLocation : (manualAddress || 'No address specified');
    const validImages = turfImages.filter(Boolean) as string[];
    const displayCover = turfImages[pinnedIndex] || validImages[0] || TURF_SAMPLE_IMAGES[0];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollPad, { paddingBottom: 100 }]}>
        <View style={{ paddingHorizontal: Spacing.containerMargin }}>

          {/* Header Preview Banner */}
          <View style={[styles.previewCard, { backgroundColor: theme.primaryContainer, borderRadius: BorderRadius.xl, overflow: 'hidden', padding: 16 }]}>
            {displayCover ? (
              <Image source={{ uri: displayCover }} style={{ width: '100%', height: 150, borderRadius: BorderRadius.lg, marginBottom: 12 }} contentFit="cover" />
            ) : null}

            <View style={styles.previewCardTop}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.previewSuperLabel, { color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }]}>
                  {sportType || 'Sport'} • {surfaceType || 'Surface'}
                </ThemedText>
                <ThemedText style={[styles.previewName, { fontSize: 20, marginTop: 2 }]}>{turfName || 'Untitled Turf'}</ThemedText>
              </View>
              <View style={{ backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full }}>
                <ThemedText style={{ color: '#fff', fontSize: 12, fontFamily: 'Sora_700Bold' }}>
                  {pricePerSlot ? `₹${pricePerSlot}/slot` : 'Price not set'}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.previewMeta, { marginTop: 12, gap: 6 }]}>
              <View style={styles.previewMetaItem}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
                <ThemedText style={[styles.previewMetaText, { color: '#fff' }]} numberOfLines={2}>{finalAddress}</ThemedText>
              </View>
              <View style={styles.previewMetaItem}>
                <Ionicons name="call" size={13} color="rgba(255,255,255,0.85)" />
                <ThemedText style={[styles.previewMetaText, { color: '#fff' }]}>+91 {contactNumber || '98765 43210'}</ThemedText>
              </View>
              <View style={styles.previewMetaItem}>
                <Ionicons name="time" size={13} color="rgba(255,255,255,0.85)" />
                <ThemedText style={[styles.previewMetaText, { color: '#fff' }]}>{configuredCount} Active Weekly Slots</ThemedText>
              </View>
            </View>
          </View>

          {/* Amenities Selection */}
          <View style={[styles.fieldGroup, { marginTop: Spacing.md }]}>
            <ThemedText style={styles.fieldLabel}>Selected Amenities</ThemedText>
            <View style={styles.amenityGrid}>
              {AMENITIES.map(a => {
                const isSelected = !!amenities[a.key];
                return (
                  <Pressable
                    key={a.key}
                    onPress={() => toggleAmenity(a.key)}
                    style={[
                      styles.amenityChip,
                      {
                        backgroundColor: isSelected ? theme.primary + '18' : theme.surfaceLow,
                        borderColor: isSelected ? theme.primary : theme.outlineVariant + '33',
                      }
                    ]}
                  >
                    <Ionicons name={a.icon as any} size={14} color={isSelected ? theme.primary : theme.textSecondary} />
                    <ThemedText style={[styles.amenityText, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                      {a.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Vouchers going live with this turf */}
          <View style={[styles.fieldGroup, { marginTop: Spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <ThemedText style={styles.fieldLabel}>Vouchers & Offers</ThemedText>
              <Pressable onPress={() => setCurrentStep(OFFERS_STEP)} hitSlop={8} accessibilityRole="button">
                <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_700Bold', fontSize: 11 }}>
                  Edit
                </ThemedText>
              </Pressable>
            </View>

            {turfOffers.filter(o => !isBlankOffer(o)).length === 0 ? (
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontFamily: 'Sora_500Medium' }}>
                No vouchers attached to this turf.
              </ThemedText>
            ) : (
              <View style={{ gap: Spacing.md, marginTop: 6 }}>
                {turfOffers.filter(o => !isBlankOffer(o)).map(o => renderVoucherDesignCard(o))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Venue Description (Optional)</ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. State-of-the-art turf with FIFA-standard shockpad rubber infill and LED night floodlights."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }, WEB_INPUT]}
            />
          </View>

        </View>
      </ScrollView>
    );
  };

  return (
    <GradientContainer screenName="create-turf" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            {params.editId ? 'Manage Pitch' : currentStep === PUBLISH_STEP ? 'Preview & Publish' : 'Create Turf'}
          </ThemedText>
        </View>

        {/* Step Tracker */}
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
                        if (currentStep === 0 && !validateStepOne()) return;
                        setCurrentStep(idx);
                      }
                    }}
                    style={styles.stepItem}
                  >
                    <View style={[styles.stepCircle, isDone ? { backgroundColor: theme.primary, borderColor: theme.primary } : isActive ? { backgroundColor: theme.primary + '20', borderColor: theme.primary } : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' }]}>
                      {isDone ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Ionicons name={step.icon as any} size={12} color={isActive ? theme.primary : theme.textSecondary} />}
                    </View>
                    <View style={styles.stepLabelBox}>
                      <ThemedText
                        numberOfLines={2}
                        style={[styles.stepLabel, { color: isActive ? theme.primary : isDone ? theme.text : theme.textSecondary, fontFamily: isActive ? 'Sora_700Bold' : 'Sora_500Medium' }]}
                      >
                        {step.title}
                      </ThemedText>
                    </View>
                  </Pressable>
                  {idx < STEPS.length - 1 && <View style={[styles.stepConnector, { backgroundColor: isDone ? theme.primary : theme.outlineVariant + '33' }]} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {currentStep === 0 && renderStepOne()}
          {currentStep === 1 && renderStepTwo()}
          {currentStep === OFFERS_STEP && renderStepOffers()}
          {currentStep === PUBLISH_STEP && renderStepThree()}
        </View>

        {/* Fixed Bottom Navigation Bar */}
        <View style={[styles.bottomNav, { borderTopColor: theme.outlineVariant + '22', backgroundColor: theme.surfaceLowest }]}>
          {currentStep > 0 && (
            <Pressable onPress={() => setCurrentStep(currentStep - 1)} style={[styles.navBtnOutline, { borderColor: theme.outlineVariant }]}>
              <Ionicons name="chevron-back" size={16} color={theme.text} />
              <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 13, marginLeft: 4 }}>Back</ThemedText>
            </Pressable>
          )}

          {currentStep === PUBLISH_STEP ? (
            <Pressable onPress={handlePublish} style={[styles.navBtnFill, { backgroundColor: '#10b981', flex: 1, marginLeft: Spacing.sm }]}>
              <Ionicons name={params.editId ? "checkmark-done-circle-outline" : "cloud-upload-outline"} size={18} color="#fff" style={{ marginRight: 6 }} />
              <ThemedText style={{ color: '#fff', fontFamily: 'Sora_700Bold', fontSize: 14 }}>
                {params.editId ? 'Save & Update Pitch' : 'Publish Turf Now'}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable onPress={handleNext} style={[styles.navBtnFill, { backgroundColor: theme.primary, flex: currentStep > 0 ? 1 : undefined, width: currentStep === 0 ? '100%' : undefined, marginLeft: currentStep > 0 ? Spacing.sm : 0 }]}>
              <ThemedText style={{ color: '#fff', fontFamily: 'Sora_700Bold', fontSize: 13, marginRight: 4 }}>
                {currentStep === PUBLISH_STEP - 1 ? (params.editId ? 'Review Updates' : 'Preview & Publish') : 'Next'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          )}
        </View>

        {!!toastMsg && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
            <ThemedText style={{ color: '#fff', fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>{toastMsg}</ThemedText>
          </Animated.View>
        )}
      </SafeAreaView>
    </GradientContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.containerMargin, paddingVertical: Spacing.sm, zIndex: 10 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 17, flex: 1, marginLeft: 10 },
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
  // Steps share the row evenly (flex: 1) so the circles sit at regular
  // intervals no matter how wide each label is — without this, "Time Slots"
  // pushes its neighbours around and the track looks lopsided.
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
  // Derived from the circle geometry rather than eyeballed, so resizing the
  // circle can't silently knock the connector off-centre again.
  stepConnector: {
    width: 14,
    height: STEP_CONNECTOR_H,
    marginTop: STEP_CIRCLE / 2 - STEP_CONNECTOR_H / 2,
    marginHorizontal: 2,
  },
  scrollPad: { paddingBottom: 160, paddingTop: Spacing.xs },
  formCard: {
    marginHorizontal: Spacing.containerMargin,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    // 16 rather than 24: the 3-across photo grid needs the extra horizontal
    // room, otherwise the third slot runs past the card on narrow screens.
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 40,
  },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 11, letterSpacing: 0.2, marginBottom: Spacing.xs, color: '#81919c' },
  requiredStar: { color: '#ef4444', fontFamily: 'Sora_700Bold' },
  errorText: { color: '#ef4444', fontSize: 11, fontFamily: 'Sora_500Medium', marginTop: 4 },
  fieldLabelSub: { fontFamily: 'Sora_400Regular', fontSize: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },

  // 3 Images Grid with Pin
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
    fontFamily: 'Sora_700Bold',
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
    fontFamily: 'Sora_700Bold',
  },
  uploadSlotSub: {
    fontSize: 9,
    fontFamily: 'Sora_400Regular',
  },

  // Sports Rows (Row 1 top 5 filled, Row 2 remaining filled)
  sportsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  sportChipInline: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sportChipSpacer: {
    flex: 1,
  },
  sportChipText: {
    fontSize: 8.5,
    fontFamily: 'Sora_600SemiBold',
    textAlign: 'center',
  },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1, height: 28, justifyContent: 'center' },

  input: { height: 42, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, fontSize: 13, borderWidth: 1, fontFamily: 'Sora_500Medium' },
  inputRow: { height: 42, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  countryCodeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  countryCodeText: { fontSize: 13, fontFamily: 'Sora_700Bold' },
  inputRowInner: { flex: 1, fontSize: 13, fontFamily: 'Sora_500Medium' },
  textArea: { height: 84, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  currencyPrefix: { fontFamily: 'Sora_700Bold', fontSize: 15, marginRight: 6 },
  inputSuffix: { fontFamily: 'Sora_400Regular', fontSize: 11, marginLeft: 4 },

  togglePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  togglePillText: { fontFamily: 'Sora_600SemiBold', fontSize: 10 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md },
  locationIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  locationText: { fontFamily: 'Sora_600SemiBold', fontSize: 13 },
  locationHint: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 2 },

  // Bulk Apply Buttons
  bulkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1 },
  bulkBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },

  // Unified Day Tabs
  dayTabRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, marginBottom: Spacing.sm },
  dayTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginHorizontal: 2, paddingVertical: 7, borderRadius: BorderRadius.md, borderWidth: 1 },
  dayTabText: { fontFamily: 'Sora_700Bold', fontSize: 10 },

  // Slot Edit Mode Toolbar
  editToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm },
  editToolbarText: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm, borderWidth: 1 },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 9 },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotCell: { width: 48, height: 38, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slotCellText: { fontFamily: 'Sora_600SemiBold', fontSize: 10 },
  helperText: { fontSize: 11, lineHeight: 16, marginTop: Spacing.sm },

  // Price Guider
  priceGuiderCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginTop: Spacing.md, marginBottom: Spacing.xs },
  priceGuiderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceGuiderIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  priceGuiderTitle: { fontFamily: 'Sora_700Bold', fontSize: 12 },
  priceGuiderSub: { fontFamily: 'Sora_400Regular', fontSize: 10, marginTop: 1 },
  proNoteText: { fontFamily: 'Sora_400Regular', fontSize: 9.5, marginTop: 6 },

  previewCard: { borderRadius: BorderRadius['2xl'], padding: Spacing.lg, marginBottom: Spacing.lg },
  previewCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  previewSuperLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 9, letterSpacing: 0.4, marginBottom: 4 },
  previewName: { fontFamily: 'Sora_700Bold', fontSize: 20, color: '#ffffff' },
  previewMeta: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  previewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewMetaText: { fontFamily: 'Sora_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: BorderRadius.xl, borderWidth: 1 },
  offerHint: { fontSize: 10.5, lineHeight: 15, fontFamily: 'Sora_400Regular', marginTop: 8 },
  optionalTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  optionalTagText: { fontSize: 9.5, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.3 },
  offerRowCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginTop: Spacing.md },
  offerRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offerEmptyBox: { alignItems: 'center', gap: 8, paddingVertical: Spacing.lg, marginTop: Spacing.sm },
  offerEmptyText: { fontSize: 12, fontFamily: 'Sora_500Medium' },
  addOfferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: BorderRadius.md, borderWidth: 1.5, borderStyle: 'dashed', marginTop: Spacing.md },
  offerPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  offerPreviewCode: { fontSize: 12, fontFamily: 'Sora_700Bold', letterSpacing: 0.8 },
  amenityText: { fontFamily: 'Sora_600SemiBold', fontSize: 11 },
  uploadHint: { fontFamily: 'Sora_400Regular', fontSize: 10 },

  // Voucher Banner Image Picker & Presets
  voucherBannerPickerCard: { height: 105, borderRadius: BorderRadius.md, borderWidth: 1, overflow: 'hidden', position: 'relative', justifyContent: 'flex-end', padding: 8 },
  voucherBannerThumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  voucherBannerActions: { flexDirection: 'row', gap: 8, zIndex: 3 },
  bannerUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  bannerUploadBtnText: { color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 10.5 },
  bannerRemoveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.55)' },
  bannerRemoveBtnText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 10 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1 },
  presetChipText: { fontFamily: 'Sora_600SemiBold', fontSize: 10.5 },

  // Live Output Badges
  livePreviewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  liveDot: { width: 5, height: 5, borderRadius: 2.5 },
  livePreviewText: { fontFamily: 'Sora_700Bold', fontSize: 9.5 },

  // Live Voucher Output Design (Template Binding Card)
  voucherOutputCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  voucherOutputBanner: { height: 110, width: '100%', position: 'relative', justifyContent: 'flex-start', padding: 10 },
  voucherOutputImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  voucherOutputTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  voucherDiscountBadge: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'baseline', gap: 3, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  voucherDiscountValue: { color: '#ffffff', fontFamily: 'Sora_800ExtraBold', fontSize: 13.5 },
  voucherDiscountSuffix: { color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 8.5 },
  voucherBrandPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: BorderRadius.full },
  voucherBrandPillText: { color: '#ffffff', fontFamily: 'Sora_600SemiBold', fontSize: 9.5, letterSpacing: 0.3, textTransform: 'uppercase' },

  // Ticket Perforation Divider
  ticketDividerRow: { flexDirection: 'row', alignItems: 'center', height: 16, position: 'relative' },
  ticketNotchLeft: { width: 10, height: 16, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  ticketDottedLine: { flex: 1, height: 1, borderWidth: 0.8, borderStyle: 'dashed', marginHorizontal: 6 },
  ticketNotchRight: { width: 10, height: 16, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },

  // Ticket Content Body
  voucherOutputBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, paddingTop: 2 },
  voucherOutputTitle: { fontFamily: 'Sora_700Bold', fontSize: 13.5 },
  voucherOutputDesc: { fontFamily: 'Sora_400Regular', fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  voucherOutputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 6 },
  voucherCodePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.md, borderWidth: 1.2, borderStyle: 'dashed' },
  voucherCodeText: { fontFamily: 'Sora_700Bold', fontSize: 12, letterSpacing: 0.8 },
  voucherMetaPills: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  voucherMetaPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full },
  voucherMetaPillText: { fontFamily: 'Sora_600SemiBold', fontSize: 9.5 },

  // KakaoStyle Trendy Ticket Voucher
  kakaoCouponCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF1E70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    marginVertical: 8,
  },
  kakaoTeethRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FF1E70',
    height: 8,
    overflow: 'hidden',
  },
  kakaoTooth: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f1f5f9',
  },
  kakaoPinkBody: {
    backgroundColor: '#FF1E70',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  kakaoWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    fontSize: 88,
    fontFamily: 'Sora_800ExtraBold',
    color: 'rgba(255, 255, 255, 0.13)',
    letterSpacing: 2,
    transform: [{ rotate: '-12deg' }],
  },
  kakaoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  kakaoBrandBlock: {
    alignItems: 'flex-start',
    maxWidth: '65%',
  },
  kakaoBrandTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    letterSpacing: 0.5,
  },
  kakaoBrandSub: {
    fontSize: 11,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    lineHeight: 13,
  },
  kakaoBrandCoupon: {
    fontSize: 10,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    lineHeight: 12,
  },
  kakaoBrandLine: {
    width: 42,
    height: 2.5,
    backgroundColor: '#18181b',
    marginTop: 3,
  },
  kakaoYellowBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFDE00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  kakaoYellowBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Sora_800ExtraBold',
    color: '#18181b',
    lineHeight: 10.5,
    textAlign: 'center',
  },
  kakaoDiscountCenter: {
    marginTop: 12,
    zIndex: 2,
  },
  kakaoBigDiscount: {
    fontSize: 48,
    fontFamily: 'Sora_800ExtraBold',
    color: '#ffffff',
    lineHeight: 48,
    letterSpacing: -1,
  },
  kakaoBigOff: {
    fontSize: 40,
    fontFamily: 'Sora_800ExtraBold',
    color: '#ffffff',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  kakaoWhiteStub: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  kakaoStubLabel: {
    fontSize: 9.5,
    fontFamily: 'Sora_700Bold',
    color: '#FF1E70',
    letterSpacing: 0.4,
  },
  kakaoStubDays: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
    color: '#0f172a',
    marginTop: 2,
  },
  kakaoStubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  kakaoStubCode: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#334155',
  },
  kakaoStubDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 210,
  },
  kakaoBarcode: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bottomNav: { flexDirection: 'row', padding: Spacing.md, paddingHorizontal: Spacing.containerMargin, borderTopWidth: 1 },
  navBtnOutline: { flex: 1, flexDirection: 'row', height: 44, borderRadius: BorderRadius.xl, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  navBtnFill: { flex: 2, flexDirection: 'row', height: 44, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', bottom: 80, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.full },
});
