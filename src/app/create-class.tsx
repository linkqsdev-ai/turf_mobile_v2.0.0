import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { toPersistableImage, sanitiseStoredImageUri } from '@/utils/persist-image';
import { useClassStore, useOfferStore } from '@/store/app-store';
import { OfferDiscountType } from '@/store/offer-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentGPSLocation, cleanLocation } from '@/utils/location';

import { SPORTS_LIST } from '@/constants/sports';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { TicketVoucherCard, STUB_COLORS } from '@/components/ticket-voucher-card';

// ─── Constants ────────────────────────────────────────────────────────────────

export const VOUCHER_BANNER_PRESETS = [
  { id: 'gift_card', label: 'Sports Gift Card', uri: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80' },
  { id: 'happy_hour', label: 'Academy Pro Pass', uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80' },
  { id: 'summer_promo', label: 'Summer Camp Deal', uri: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80' },
  { id: 'night_match', label: 'Elite Training Pass', uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80' },
  { id: 'cashback', label: 'Weekend Clinic Offer', uri: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80' },
];

export interface ClassOfferDraft {
  localId: string;
  offerId?: string;
  code: string;
  title: string;
  description: string;
  discountType: OfferDiscountType;
  discountValue: string;
  minBooking: string;
  maxRedemptions: string;
  validDays: string;
  bannerImage: string;
}

const STEPS = [
  { title: 'Class Info', icon: 'school-outline' },
  { title: 'Schedule', icon: 'calendar-outline' },
  { title: 'Publish', icon: 'checkmark-circle-outline' },
];

const CLASS_TYPES = ['Regular Class', 'Summer Camp', 'Weekend Clinic', 'Trial Session'];
const AGE_GROUPS = ['U8', 'U12', 'U16', 'U19', 'Adults', 'All Ages'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Every time chip represents a session of this length; multiple chips mean
// multiple sessions, not one longer block.
const SESSION_SLOT_MINUTES = 60;
const SESSION_SLOT_LABEL = `${SESSION_SLOT_MINUTES} min`;

const SESSION_GROUPS = {
  'Morning Session': ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'],
  'Noon Session': ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
  'Evening Session': ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
};
const DURATIONS = ['60 min', '120 min'];
const FEE_TYPES = ['Per Session', 'Monthly', 'One-Time Package'];

const SKILL_LEVELS = [
  { key: 'beginner', label: 'Beginner', icon: 'leaf-outline' },
  { key: 'intermediate', label: 'Intermediate', icon: 'flame-outline' },
  { key: 'advanced', label: 'Advanced', icon: 'trophy-outline' },
  { key: 'elite', label: 'Elite', icon: 'star-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatSelectedDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mmm = MONTH_NAMES[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}/${mmm}/${yyyy}`;
};

const getTodayDate = () => {
  return formatSelectedDate(new Date());
};

export default function CreateClassScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const params = useLocalSearchParams<{ editId?: string; id?: string; draftId?: string }>();
  const editId = params.editId || params.id;
  const { classes, addClass, updateClass, isClassEditable, enrollmentCountForClass } = useClassStore();
  const { addOffer, offers } = useOfferStore();
  const [currentStep, setCurrentStep] = useState(0);

  const [datePickerField, setDatePickerField] = useState<'start' | 'end' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  const [activeDraftId, setActiveDraftId] = useState<string | null>(params.draftId || null);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [resumeDraftModalVisible, setResumeDraftModalVisible] = useState(false);
  const [pendingResumeDraft, setPendingResumeDraft] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Step 1 — Class Info
  const [className, setClassName] = useState('');
  const [certificates, setCertificates] = useState<string[]>(['BWF Certified Level 2']);
  const [newCertInput, setNewCertInput] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Water Station', 'Training Gear Provided', 'Locker & Shower']);
  const [sportType, setSportType] = useState('Football');
  const [classType, setClassType] = useState('');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const ageGroup = useMemo(() => selectedAgeGroups.join(', '), [selectedAgeGroups]);

  const toggleAgeGroup = (group: string) => {
    if (group === 'All Ages') {
      if (selectedAgeGroups.includes('All Ages')) {
        setSelectedAgeGroups([]);
      } else {
        setSelectedAgeGroups(['All Ages']);
      }
      return;
    }
    setSelectedAgeGroups(prev => {
      const withoutAll = prev.filter(g => g !== 'All Ages');
      if (withoutAll.includes(group)) {
        return withoutAll.filter(g => g !== group);
      } else {
        return [...withoutAll, group];
      }
    });
  };

  const setAgeGroupFromData = (data: any) => {
    if (!data) {
      setSelectedAgeGroups([]);
      return;
    }
    if (Array.isArray(data)) {
      setSelectedAgeGroups(data.map(String));
    } else if (typeof data === 'string') {
      setSelectedAgeGroups(
        data
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      );
    }
  };

  const [maxStudents, setMaxStudents] = useState('');
  const [skillLevel, setSkillLevel] = useState('');

  // Step 2 — Schedule
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [sessionTime, setSessionTime] = useState('');
  // Each selectable time is one fixed-length session. Retained (not chosen) so
  // the saved record and anything reading it keep working.
  const [sessionDuration] = useState(SESSION_SLOT_LABEL);
  const [venue, setVenue] = useState('');

  // Step 3 — Publish & Vouchers
  const [feeType, setFeeType] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [description, setDescription] = useState('');
  const [classBannerImage, setClassBannerImage] = useState<string>('');
  const [classOffers, setClassOffers] = useState<ClassOfferDraft[]>([]);

  // Check if any class data has been entered to prevent saving empty drafts
  const hasDraftContent = useMemo(() => {
    const hasName = Boolean(className && className.trim());
    const hasClassType = Boolean(classType && classType.trim());
    const hasDesc = Boolean(description && description.trim());
    const hasVenue = Boolean(venue && venue.trim());
    const hasFee = Boolean(feeAmount && feeAmount.trim());
    const hasMaxStudents = Boolean(maxStudents && maxStudents.trim());
    const hasSessionTime = Boolean(sessionTime && sessionTime.trim());
    const hasSkill = Boolean(skillLevel && skillLevel.trim());
    const hasAge = selectedAgeGroups.length > 0;
    const hasDays = Object.values(selectedDays || {}).some(Boolean);
    const hasBanner = Boolean(classBannerImage);
    const hasOffers = (classOffers || []).length > 0;

    return (
      hasName ||
      hasClassType ||
      hasDesc ||
      hasVenue ||
      hasFee ||
      hasMaxStudents ||
      hasSessionTime ||
      hasSkill ||
      hasAge ||
      hasDays ||
      hasBanner ||
      hasOffers
    );
  }, [
    className,
    classType,
    description,
    venue,
    feeAmount,
    maxStudents,
    sessionTime,
    skillLevel,
    selectedAgeGroups,
    selectedDays,
    classBannerImage,
    classOffers,
  ]);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useMemo(() => new Animated.Value(0), []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  // Pulse animation for back button
  const backBtnPulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(backBtnPulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(backBtnPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [backBtnPulse]);

  const addOfferRow = () => {
    const newIdx = classOffers.length + 1;
    const computedDays = calculateScheduleDays(startDate, endDate);
    const assignedCap = maxStudents.trim() && !isNaN(parseInt(maxStudents, 10)) && parseInt(maxStudents, 10) > 0
      ? maxStudents.trim()
      : '50';
    const newDraft: ClassOfferDraft = {
      localId: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: `CLASS${newIdx * 10}`.toUpperCase(),
      title: `Special ${newIdx}`.slice(0, 12),
      description: 'Claim this voucher discount during academy enrollment checkout.',
      discountType: 'percent',
      discountValue: '15',
      minBooking: '0',
      maxRedemptions: assignedCap,
      validDays: String(computedDays),
      bannerImage: VOUCHER_BANNER_PRESETS[(newIdx - 1) % VOUCHER_BANNER_PRESETS.length].uri,
    };
    setClassOffers(prev => [...prev, newDraft]);
    triggerToast('Voucher added! 🎟️');
  };

  const removeOfferRow = (localId: string) => {
    setClassOffers(prev => prev.filter(o => o.localId !== localId));
    triggerToast('Voucher removed.');
  };

  const patchOffer = (localId: string, partial: Partial<ClassOfferDraft>) => {
    setClassOffers(prev =>
      prev.map(o => (o.localId === localId ? { ...o, ...partial } : o))
    );
  };

  const pickVoucherBanner = async (localId: string) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to pick a voucher banner.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        // Quality is deliberately modest: the picked image is persisted inline
        // as base64, so a full-quality photo would bloat AsyncStorage.
        quality: 0.5,
        // Without this the picker only returns a transient handle (a blob: URL
        // on web, a cache-dir path on native) which is dead by the time the
        // class is reopened — that's what made saved banners fail to load.
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const picked = toPersistableImage(result.assets[0]);

      if (picked.ok) {
        patchOffer(localId, { bannerImage: picked.uri });
        triggerToast('Voucher banner updated! 🎨');
        return;
      }

      if (picked.reason === 'too-large') {
        Alert.alert(
          'Image too large',
          'Pick a smaller or less detailed image — this one is too big to store with the class.'
        );
        return;
      }

      // No base64 came back. Use the raw uri so the pick isn't lost, but say
      // plainly that it won't survive, rather than failing silently later.
      patchOffer(localId, { bannerImage: result.assets[0].uri });
      triggerToast('Banner set, but it may not reload after you leave.');
    } catch (err) {
      console.warn('Error picking voucher banner:', err);
      Alert.alert('Could not load image', 'Something went wrong picking that image.');
    }
  };

  const pickClassBanner = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to pick a class background banner.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const picked = toPersistableImage(result.assets[0]);
      if (picked.ok) {
        setClassBannerImage(picked.uri);
        triggerToast('Class background banner updated! 🎨');
        return;
      }

      if (picked.reason === 'too-large') {
        Alert.alert('Image too large', 'Pick a smaller image — this one is too big to store with the class.');
        return;
      }

      setClassBannerImage(result.assets[0].uri);
      triggerToast('Background banner updated! 🎨');
    } catch (err) {
      console.warn('Error picking class banner:', err);
      Alert.alert('Could not load image', 'Something went wrong picking that banner.');
    }
  };

  const loadDraft = (draft: any) => {
    if (draft.className) setClassName(draft.className);
    if (draft.sportType) setSportType(draft.sportType);
    if (draft.classType) setClassType(draft.classType);
    if (draft.ageGroup) setAgeGroupFromData(draft.ageGroup);
    if (draft.maxStudents) setMaxStudents(draft.maxStudents);
    if (draft.skillLevel) setSkillLevel(draft.skillLevel);
    if (draft.startDate) setStartDate(draft.startDate);
    if (draft.endDate) setEndDate(draft.endDate);
    if (draft.selectedDays) setSelectedDays(draft.selectedDays);
    if (draft.sessionTime) setSessionTime(draft.sessionTime);
    if (draft.venue) setVenue(draft.venue);
    if (draft.feeType) setFeeType(draft.feeType);
    if (draft.feeAmount) setFeeAmount(draft.feeAmount);
    if (draft.description) setDescription(draft.description);
    if (draft.bannerImage || draft.image || draft.classBannerImage) {
      setClassBannerImage(draft.bannerImage || draft.image || draft.classBannerImage);
    }
    if (draft.classOffers && Array.isArray(draft.classOffers)) {
      setClassOffers(
        draft.classOffers.map((v: any, idx: number) => ({
          ...v,
          bannerImage:
            v?.bannerImage ||
            v?.image ||
            VOUCHER_BANNER_PRESETS[idx % VOUCHER_BANNER_PRESETS.length].uri,
        }))
      );
    }
    if (typeof draft.currentStep === 'number') setCurrentStep(draft.currentStep);
    if (draft.id) setActiveDraftId(draft.id);

    triggerToast('Draft loaded! 📝');
  };

  const deleteDraft = async (id: string) => {
    try {
      const nextDrafts = savedDrafts.filter(d => d.id !== id);
      await AsyncStorage.setItem('@turf_class_drafts', JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      if (activeDraftId === id) setActiveDraftId(null);
      triggerToast('Draft deleted.');
    } catch (e) {
      console.error(e);
    }
  };

  // Load draft by draftId or bind edit data on mount
  useEffect(() => {
    if (params.draftId) {
      (async () => {
        try {
          const savedDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
          if (savedDraftsStr) {
            const list = JSON.parse(savedDraftsStr);
            const found = list.find((d: any) => d.id === params.draftId);
            if (found) {
              loadDraft(found);
              setActiveDraftId(found.id);
            }
          }
        } catch (e) {
          console.error('Failed to load draft by draftId', e);
        }
      })();
      return;
    }

    if (editId) {
      const existing = (classes || []).find((c: any) => c.id === editId);
      if (existing) {
        if (existing.className) setClassName(existing.className);
        if (existing.sportType) setSportType(existing.sportType);
        if (existing.classType) setClassType(existing.classType);
        if (existing.ageGroup) setAgeGroupFromData(existing.ageGroup);
        if (existing.maxStudents) setMaxStudents(String(existing.maxStudents));
        if (existing.skillLevel) setSkillLevel(existing.skillLevel);
        if (existing.startDate) setStartDate(existing.startDate);
        if (existing.endDate) setEndDate(existing.endDate);
        if (existing.selectedDays) setSelectedDays(existing.selectedDays);
        if (existing.sessionTime) setSessionTime(existing.sessionTime);
        if (existing.venue) setVenue(existing.venue);
        if (existing.feeType) setFeeType(existing.feeType);
        if (existing.feeAmount) setFeeAmount(String(existing.feeAmount));
        if (existing.description) setDescription(existing.description);
        if (existing.bannerImage || existing.image || existing.classBannerImage) {
          setClassBannerImage(existing.bannerImage || existing.image || existing.classBannerImage);
        }
        
        const matchingOffers = (offers || []).filter(
          (o: any) => o.appliesTo && existing.className && o.appliesTo.toLowerCase() === existing.className.toLowerCase()
        );
        const sourceVouchers =
          existing.vouchers && Array.isArray(existing.vouchers) && existing.vouchers.length > 0
            ? existing.vouchers
            : matchingOffers;

        if (sourceVouchers && sourceVouchers.length > 0) {
          setClassOffers(
            sourceVouchers.map((v: any, idx: number) => ({
              localId: v.localId || `offer-${idx + 1}`,
              offerId: v.offerId || v.id,
              code: v.code || '',
              title: v.title || '',
              description: v.description || '',
              discountType: v.discountType || 'percent',
              discountValue: String(v.discountValue || ''),
              minBooking: String(v.minBooking || ''),
              maxRedemptions: String(v.maxRedemptions || ''),
              validDays: String(v.validDays || '30'),
              bannerImage:
                v?.bannerImage ||
                v?.image ||
                VOUCHER_BANNER_PRESETS[idx % VOUCHER_BANNER_PRESETS.length].uri,
            }))
          );
        }
        if (existing.certificates && Array.isArray(existing.certificates)) setCertificates(existing.certificates);
        if (existing.amenities && Array.isArray(existing.amenities)) setSelectedAmenities(existing.amenities);
      }
    } else {
      (async () => {
        try {
          const savedDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
          if (savedDraftsStr) {
            const list = JSON.parse(savedDraftsStr);
            setSavedDrafts(list);
          }
        } catch (e) {
          console.error('Failed to load drafts', e);
        }
      })();
    }
  }, [editId, params.draftId, classes]);

  const handleFetchVenueLocation = async () => {
    if (isFetchingLocation) return;
    try {
      setIsFetchingLocation(true);
      const res = await getCurrentGPSLocation();
      if (res && res.address) {
        setVenue(cleanLocation(res.address));
        triggerToast('Location auto-detected! 📍');
      }
    } catch (err) {
      console.warn(err);
      triggerToast('Could not fetch GPS location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const getFormattedSessionTime = (rawSessionTime: string): string => {
    if (!rawSessionTime) return '';
    const selectedList = rawSessionTime.split(',').map(s => s.trim()).filter(Boolean);
    if (selectedList.length === 0) return '';

    const results: string[] = [];

    for (const [groupName, groupTimes] of Object.entries(SESSION_GROUPS)) {
      const categoryName = groupName.replace(' Session', '');
      const inGroup = groupTimes.filter(t => selectedList.includes(t));
      if (inGroup.length === 0) continue;

      if (inGroup.length === 1) {
        results.push(`${categoryName} ${inGroup[0]}`);
      } else {
        const first = inGroup[0];
        const last = inGroup[inGroup.length - 1];
        results.push(`${categoryName} ${first} - ${last}`);
      }
    }

    return results.join(', ');
  };

  /**
   * Every listed time is one 60-minute session, and a coach may run several —
   * a morning batch and an evening batch on the same days is normal. So this is
   * a plain toggle with no cross-group restriction: tap to add, tap to remove.
   *
   * The stored value is kept in canonical clock order (morning → noon →
   * evening) rather than tap order, so the summary and the saved record read
   * sensibly however the coach clicked.
   */
  const handleSelectSessionTime = (time: string) => {
    const selected = new Set(
      sessionTime ? sessionTime.split(',').map(t => t.trim()).filter(Boolean) : []
    );

    if (selected.has(time)) selected.delete(time);
    else selected.add(time);

    const ordered = Object.values(SESSION_GROUPS)
      .flat()
      .filter(t => selected.has(t));

    setSessionTime(ordered.join(', '));
  };

  /** How many separate sessions the coach has picked. */
  const selectedSessionCount = React.useMemo(
    () => (sessionTime ? sessionTime.split(',').filter(t => t.trim()).length : 0),
    [sessionTime]
  );

  const isSessionTimeSelected = (t: string) => {
    if (!sessionTime) return false;
    return sessionTime.split(',').map(s => s.trim()).includes(t);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
      return null;
    }
    const d = parseInt(parts[0], 10);
    const mStr = parts[1];
    let m = -1;
    const numMonth = parseInt(mStr, 10);
    if (!isNaN(numMonth) && numMonth >= 1 && numMonth <= 12) {
      m = numMonth - 1;
    } else {
      m = MONTH_NAMES.findIndex(month => month.toLowerCase() === mStr.toLowerCase());
    }
    const y = parseInt(parts[2], 10);
    if (isNaN(d) || m < 0 || isNaN(y)) return null;
    const res = new Date(y, m, d);
    res.setHours(0, 0, 0, 0);
    return isNaN(res.getTime()) ? null : res;
  };

  const calculateScheduleDays = (startStr: string, endStr: string): number => {
    const start = parseDateString(startStr);
    const end = parseDateString(endStr);
    if (start && end && end.getTime() >= start.getTime()) {
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diffDays);
    }
    return 30;
  };

  // Step 0 validation: Class Name (3 to 25 chars), Sport, Class Type, Max Students (> 0) are mandatory
  const isStepZeroValid = useMemo(() => {
    const validName = className.trim().length >= 3 && className.trim().length <= 25;
    const validMaxStudents =
      Boolean(maxStudents.trim()) && !isNaN(parseInt(maxStudents, 10)) && parseInt(maxStudents, 10) > 0;
    return Boolean(validName && sportType.trim() && classType.trim() && validMaxStudents);
  }, [className, sportType, classType, maxStudents]);

  // Step 1 validation: Start Date (>= Today), End Date (>= Start Date), Recurring Days, Session Time, Venue (>= 3 chars)
  const isStepOneValid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startD = parseDateString(startDate);
    const endD = parseDateString(endDate);
    const validDates = Boolean(startD && endD && startD.getTime() >= today.getTime() && endD.getTime() >= startD.getTime());
    const hasDays = Object.values(selectedDays).some(Boolean);
    const validVenue = venue.trim().length >= 3;
    return Boolean(validDates && hasDays && sessionTime.trim() && validVenue);
  }, [startDate, endDate, selectedDays, sessionTime, venue]);

  // Step 2 validation: Fee Type, Fee Amount (> 0)
  const isStepTwoValid = useMemo(() => {
    const validAmount = Boolean(feeAmount.trim()) && !isNaN(parseFloat(feeAmount)) && parseFloat(feeAmount) > 0;
    return Boolean(feeType.trim() && validAmount);
  }, [feeType, feeAmount]);

  const handleStepHeaderPress = (targetIdx: number) => {
    if (targetIdx === currentStep) return;
    if (targetIdx > currentStep) {
      if (currentStep === 0 && !isStepZeroValid) {
        if (className.trim().length > 0 && className.trim().length < 3) {
          triggerToast('⚠️ Class Name must be at least 3 characters long.');
        } else if (!maxStudents.trim() || isNaN(parseInt(maxStudents, 10)) || parseInt(maxStudents, 10) <= 0) {
          triggerToast('⚠️ Please enter a valid number of Max Students (*)');
        } else {
          triggerToast('⚠️ Please fill required fields (*): Class Name, Sport, Class Type, Max Students');
        }
        return;
      }
      if (currentStep === 1 && !isStepOneValid) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startD = parseDateString(startDate);
        const endD = parseDateString(endDate);
        if (startD && startD.getTime() < today.getTime()) {
          triggerToast('⚠️ Start Date cannot be in the past.');
          return;
        }
        if (startD && endD && endD.getTime() < startD.getTime()) {
          triggerToast(`⚠️ End Date (${endDate}) cannot be earlier than Start Date (${startDate})`);
          return;
        }
        triggerToast('⚠️ Please fill required fields (*): Dates, Recurring Days, Session Time, Venue');
        return;
      }
      if (targetIdx === 2 && (!isStepZeroValid || !isStepOneValid)) {
        triggerToast('⚠️ Please complete all previous mandatory fields first (*)');
        return;
      }
    }
    setCurrentStep(targetIdx);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (className.trim().length > 0 && className.trim().length < 3) {
        triggerToast('⚠️ Class Name must be at least 3 characters long.');
        return;
      }
      if (!maxStudents.trim() || isNaN(parseInt(maxStudents, 10)) || parseInt(maxStudents, 10) <= 0) {
        triggerToast('⚠️ Please enter a valid number of Max Students (*)');
        return;
      }
      if (!isStepZeroValid) {
        triggerToast('⚠️ Please fill required fields (*): Class Name, Sport, Class Type, Max Students');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startD = parseDateString(startDate);
      const endD = parseDateString(endDate);
      if (startD && startD.getTime() < today.getTime()) {
        triggerToast('⚠️ Start Date cannot be in the past.');
        return;
      }
      if (startD && endD && endD.getTime() < startD.getTime()) {
        triggerToast(`⚠️ End Date (${endDate}) cannot be earlier than Start Date (${startDate})`);
        return;
      }
      if (!isStepOneValid) {
        triggerToast('⚠️ Please fill required fields (*): Dates, Recurring Days, Session Time, Venue');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  };

  const isAllValid = Boolean(isStepZeroValid && isStepOneValid && isStepTwoValid);

  const handlePublish = () => {
    if (isPublishing) return;
    if (!isAllValid) {
      triggerToast('⚠️ Please fill all required fields before publishing (*)');
      return;
    }

    setIsPublishing(true);

    // Register active promotional vouchers in offerStore
    classOffers.forEach(o => {
      const discountVal = parseFloat(o.discountValue) || 0;
      if (o.code.trim() && discountVal > 0) {
        const validDaysNum = parseInt(o.validDays, 10) || 30;
        const validTillIso = new Date(Date.now() + validDaysNum * 86400000).toISOString();
        addOffer({
          code: o.code.trim().toUpperCase(),
          title: o.title.trim() || `${className} Voucher`,
          description: o.description.trim() || `Promotional discount for ${className}`,
          discountType: o.discountType,
          discountValue: discountVal,
          minBooking: parseFloat(o.minBooking) || 0,
          maxRedemptions: parseInt(o.maxRedemptions, 10) || 0,
          validTill: validTillIso,
          appliesTo: className.trim(),
          bannerImage: o.bannerImage,
        });
      }
    });

    const classPayload = {
      className,
      coachName: profile?.name || 'Coach Specialist',
      avatar: profile?.avatarUrl,
      sportType,
      classType,
      ageGroup,
      maxStudents,
      skillLevel,
      startDate,
      endDate,
      selectedDays,
      sessionTime,
      sessionDuration,
      venue,
      feeType,
      feeAmount,
      description,
      bannerImage: classBannerImage,
      image: classBannerImage,
      vouchers: classOffers,
      certificates,
      amenities: selectedAmenities,
      isActive: true,
    };

    if (editId) {
      // Last line of defence: the coach tab hides Edit once a class has
      // enrolments, but this screen is reachable by deep link and the class
      // could also have gained its first student while the form was open.
      if (!isClassEditable(editId)) {
        const enrolled = enrollmentCountForClass(editId);
        const msg = `This class can no longer be edited — ${enrolled} student${enrolled === 1 ? ' has' : 's have'} already enrolled.`;
        if (Platform.OS === 'web') {
          alert(msg);
        } else {
          Alert.alert('Class locked', msg);
        }
        return;
      }

      updateClass(editId, classPayload);
      router.replace({
        pathname: '/(tabs)/coach',
        params: { toast: `"${className || 'Class'}" updated successfully! 🎓` },
      });
      return;
    }

    addClass(classPayload);

    // Clean up draft since it is published
    (async () => {
      try {
        const existingDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
        if (existingDraftsStr) {
          const draftsList = JSON.parse(existingDraftsStr);
          const nextDrafts = draftsList.filter(
            (d: any) =>
              d.id !== activeDraftId &&
              d.id !== params.draftId &&
              d.className !== className
          );
          await AsyncStorage.setItem('@turf_class_drafts', JSON.stringify(nextDrafts));
          setSavedDrafts(nextDrafts);
        }
      } catch (e) {
        console.error('Failed to clean up draft after publish', e);
      }
    })();

    router.replace({
      pathname: '/(tabs)/coach',
      params: { toast: `"${className || 'Class'}" published live! 🎓` },
    });
  };

  const handleSaveDraft = async () => {
    if (!hasDraftContent) {
      Alert.alert(
        'Empty Draft',
        'Please enter some class details (such as class name, schedule, or fee) before saving a draft.'
      );
      return;
    }
    if (isSavingDraft) return;
    setIsSavingDraft(true);
    try {
      const newDraft = {
        id: `draft-${Date.now()}`,
        dateStr: new Date().toLocaleString(),
        className: className.trim() || 'Untitled Class Draft',
        coachName: profile?.name || 'Coach Specialist',
        avatar: profile?.avatarUrl,
        sportType,
        classType,
        ageGroup,
        maxStudents,
        skillLevel,
        startDate,
        endDate,
        selectedDays,
        sessionTime,
        sessionDuration,
        venue,
        feeType,
        feeAmount,
        description,
        bannerImage: classBannerImage,
        image: classBannerImage,
        classOffers,
        certificates,
        selectedAmenities,
        isActive: true,
        currentStep,
      };

      const existingDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
      const draftsList = existingDraftsStr ? JSON.parse(existingDraftsStr) : [];

      const nextDrafts = [newDraft, ...draftsList];
      await AsyncStorage.setItem('@turf_class_drafts', JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      triggerToast('Draft saved successfully! 💾');
      router.replace('/(tabs)/coach');
    } catch (e) {
      console.error('Failed to save draft class', e);
      triggerToast('Failed to save draft class.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const renderVoucherDesignCard = (draft: ClassOfferDraft, idx: number = 0) => {
    const code = draft.code.trim().toUpperCase() || 'PROMOCODE';
    const val = Number(draft.discountValue) || 15;
    const discountText = draft.discountType === 'percent' ? `${val}% OFF` : `₹${val} OFF`;
    const computedDays = calculateScheduleDays(startDate, endDate);
    const days = parseInt(draft.validDays, 10) || computedDays;
    const defaultCap = maxStudents.trim() && !isNaN(parseInt(maxStudents, 10)) ? parseInt(maxStudents, 10) : 50;
    const cap = parseInt(draft.maxRedemptions, 10) || defaultCap;
    const minBook = parseFloat(draft.minBooking) || 0;
    const color = STUB_COLORS[idx % STUB_COLORS.length];
    const voucherTitle = draft.title.trim().slice(0, 12) || `${className.trim().slice(0, 12) || 'Class'} Voucher`;
    const appliesTo = className.trim() || 'Coaching Academy Class';

    return (
      <View style={{ alignItems: 'center', marginVertical: 6, width: '100%' }}>
        <TicketVoucherCard
          item={{
            id: draft.localId,
            code,
            title: voucherTitle,
            appliesTo,
            discountText,
            color,
            subType: draft.discountType === 'flat' ? 'SAVE' : 'OFF',
            category: 'coach',
          }}
          index={idx}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 280, marginTop: 5, paddingHorizontal: 4 }}>
          <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary }}>
            Valid for {days} days {cap > 0 ? `· 1st ${cap} students` : '· Unlimited'}
          </ThemedText>
          {minBook > 0 ? (
            <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_600SemiBold', color: theme.primary }}>
              Min ₹{minBook}
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  };

  const renderVoucherDetailsOutput = (draft: ClassOfferDraft, idx: number = 0) => {
    const code = draft.code.trim().toUpperCase() || 'PROMOCODE';
    const val = Number(draft.discountValue) || 15;
    const discountText = draft.discountType === 'percent' ? `${val}% OFF` : `₹${val} OFF`;
    const computedDays = calculateScheduleDays(startDate, endDate);
    const days = parseInt(draft.validDays, 10) || computedDays;
    const defaultCap = maxStudents.trim() && !isNaN(parseInt(maxStudents, 10)) ? parseInt(maxStudents, 10) : 50;
    const cap = parseInt(draft.maxRedemptions, 10) || defaultCap;
    const minBook = parseFloat(draft.minBooking) || 0;
    const bannerUri = draft.bannerImage || VOUCHER_BANNER_PRESETS[idx % VOUCHER_BANNER_PRESETS.length].uri;
    const voucherTitle = draft.title.trim().slice(0, 12) || 'Special Offer';
    const appliesTo = className.trim() || 'Coaching Academy Class';

    return (
      <View
        style={[
          styles.voucherDetailOutputCard,
          { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
          Shadows.level1,
        ]}
      >
        {/* Banner with Overlay */}
        <View style={styles.voucherDetailBannerWrap}>
          <Image source={{ uri: bannerUri }} style={styles.voucherDetailBannerImg} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Badges */}
          <View style={styles.voucherDetailTopRow}>
            <View style={styles.voucherDetailCategoryBadge}>
              <Ionicons name="school-outline" size={11} color="#ffffff" />
              <ThemedText style={styles.voucherDetailCategoryText}>COACH CLASS</ThemedText>
            </View>
            <View style={[styles.voucherDetailDiscountTag, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.voucherDetailDiscountTagText}>{discountText}</ThemedText>
            </View>
          </View>

          {/* Banner Title & Code */}
          <View style={styles.voucherDetailBottomContent}>
            <ThemedText style={styles.voucherDetailTitle} numberOfLines={1}>
              {voucherTitle}
            </ThemedText>
            <ThemedText style={styles.voucherDetailSub} numberOfLines={1}>
              {appliesTo}
            </ThemedText>
          </View>
        </View>

        {/* Details Spec Body */}
        <View style={styles.voucherDetailBody}>
          {/* Promo Code Copy Row */}
          <View style={[styles.voucherDetailCodeRow, { backgroundColor: theme.surfaceLow, borderColor: theme.primary + '33' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="pricetag-outline" size={13} color={theme.primary} />
              <ThemedText style={[styles.voucherDetailCodeText, { color: theme.primary }]}>
                {code}
              </ThemedText>
            </View>
            <View style={[styles.voucherDetailCopyBadge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.voucherDetailCopyText}>COUPON CODE</ThemedText>
            </View>
          </View>

          {/* Terms / Description */}
          {draft.description ? (
            <ThemedText style={[styles.voucherDetailTerms, { color: theme.textSecondary }]} numberOfLines={2}>
              &ldquo;{draft.description}&rdquo;
            </ThemedText>
          ) : null}

          {/* Key Metrics Grid */}
          <View style={[styles.voucherDetailGrid, { borderTopColor: theme.outlineVariant + '22' }]}>
            <View style={styles.voucherDetailMetric}>
              <ThemedText style={[styles.voucherDetailMetricLabel, { color: theme.textSecondary }]}>VALIDITY</ThemedText>
              <ThemedText style={[styles.voucherDetailMetricVal, { color: theme.text }]} numberOfLines={1}>
                {days} Days {endDate ? `(till ${endDate})` : ''}
              </ThemedText>
            </View>

            <View style={styles.voucherDetailMetric}>
              <ThemedText style={[styles.voucherDetailMetricLabel, { color: theme.textSecondary }]}>STUDENT LIMIT</ThemedText>
              <ThemedText style={[styles.voucherDetailMetricVal, { color: theme.text }]}>
                1st {cap} Students
              </ThemedText>
            </View>

            <View style={styles.voucherDetailMetric}>
              <ThemedText style={[styles.voucherDetailMetricLabel, { color: theme.textSecondary }]}>MIN FEE</ThemedText>
              <ThemedText style={[styles.voucherDetailMetricVal, { color: theme.text }]}>
                {minBook > 0 ? `₹${minBook}` : 'No Min'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Step Renderers ────────────────────────────────────────────────────────

  const renderStepOne = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
        {/* Class Name */}
        <View style={styles.fieldGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <ThemedText style={styles.fieldLabel}>Class Name <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
            <ThemedText style={{ fontSize: 10, color: className.length >= 25 ? '#ef4444' : theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
              {className.length}/25
            </ThemedText>
          </View>
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            value={className}
            onChangeText={text => setClassName(text.replace(/[^a-zA-Z\s]/g, ''))}
            maxLength={25}
            placeholder="e.g. Elite Football Academy"
            placeholderTextColor="#94a3b8"
            style={[
              styles.input,
              { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' },
              className.length > 0 && className.length < 3 && { borderColor: '#ef4444' }
            ]}
          />
          {className.length > 0 && className.length < 3 && (
            <ThemedText style={{ fontSize: 10, color: '#ef4444', marginTop: 3 }}>
              Class name must contain only letters (at least 3 chars).
            </ThemedText>
          )}
        </View>

        {/* Sport Type */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Sport <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>

          {/* Row 1: Top 5 Sports */}
          <View style={styles.sportsRow}>
            {SPORTS_LIST.slice(0, 5).map((sport) => {
              const isActive = sportType.toLowerCase() === sport.name.toLowerCase();
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => setSportType(sport.name)}
                  style={[
                    styles.sportChipInline,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: isActive ? theme.primary : theme.outlineVariant + '35',
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
                      { color: isActive ? '#ffffff' : theme.textSecondary, fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_600SemiBold' }
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
                  onPress={() => setSportType(sport.name)}
                  style={[
                    styles.sportChipInline,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: isActive ? theme.primary : theme.outlineVariant + '35',
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
                      { color: isActive ? '#ffffff' : theme.textSecondary, fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_600SemiBold' }
                    ]}
                    numberOfLines={1}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
            {Array.from({ length: Math.max(0, 5 - SPORTS_LIST.slice(5).length) }).map((_, i) => (
              <View key={`spacer-${i}`} style={styles.sportChipSpacer} />
            ))}
          </View>
        </View>

        {/* Class Type */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Class Type <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {CLASS_TYPES.map(t => (
              <Pressable
                key={t}
                onPress={() => setClassType(t)}
                style={[
                  styles.chip,
                  { backgroundColor: classType === t ? theme.primary : theme.surfaceLow, borderColor: classType === t ? theme.primary : theme.outlineVariant + '44' }
                ]}
              >
                <ThemedText style={[styles.chipText, { color: classType === t ? '#fff' : theme.textSecondary }]}>{t}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Age Group (Multi-select) */}
        <View style={styles.fieldGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <ThemedText style={styles.fieldLabel}>Age Group</ThemedText>
            {selectedAgeGroups.length > 0 && (
              <ThemedText style={[styles.fieldLabel, { color: theme.primary, fontSize: 10.5, fontFamily: 'Sora_500Medium' }]}>
                {selectedAgeGroups.length} selected
              </ThemedText>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {AGE_GROUPS.map(a => {
              const isSelected = selectedAgeGroups.includes(a);
              return (
                <Pressable
                  key={a}
                  onPress={() => toggleAgeGroup(a)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                      borderColor: isSelected ? theme.primary : theme.outlineVariant + '44',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }
                  ]}
                >
                  <ThemedText style={[styles.chipText, { color: isSelected ? '#fff' : theme.textSecondary }]}>{a}</ThemedText>
                  {isSelected && <Ionicons name="checkmark-circle" size={11} color="#fff" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Skill Level */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Skill Level</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {SKILL_LEVELS.map(s => (
              <Pressable
                key={s.key}
                onPress={() => setSkillLevel(s.key)}
                style={[
                  styles.skillCard,
                  {
                    backgroundColor: skillLevel === s.key ? theme.primary + '15' : theme.surfaceLow,
                    borderColor: skillLevel === s.key ? theme.primary : theme.outlineVariant + '44',
                  }
                ]}
              >
                <Ionicons name={s.icon as any} size={12} color={skillLevel === s.key ? theme.primary : theme.textSecondary} />
                <ThemedText style={[styles.skillText, { color: skillLevel === s.key ? theme.primary : theme.text }]}>{s.label}</ThemedText>
                {skillLevel === s.key && <Ionicons name="checkmark-circle" size={10} color={theme.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Max Students */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>
            Max Students <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
          </ThemedText>
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            value={maxStudents}
            onChangeText={text => setMaxStudents(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="e.g. 20"
            placeholderTextColor="#94a3b8"
            style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
          />
        </View>

        {/* Multiple Certificates / Accreditations Selector */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Coach Certificates & Accreditations</ThemedText>

          {/* Input + Add button */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={newCertInput}
              onChangeText={setNewCertInput}
              placeholder="Type cert (e.g. BWF Level 2) & tap + Add"
              placeholderTextColor="#94a3b8"
              style={[styles.input, { flex: 1, backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
            />
            <Pressable
              onPress={() => {
                if (newCertInput.trim() && !certificates.includes(newCertInput.trim())) {
                  setCertificates(prev => [...prev, newCertInput.trim()]);
                  setNewCertInput('');
                }
              }}
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: 12,
                borderRadius: BorderRadius.md,
                justifyContent: 'center',
                alignItems: 'center',
                height: 38,
              }}
            >
              <ThemedText style={{ color: '#fff', fontSize: 11, fontFamily: 'Sora_500Medium' }}>+ Add</ThemedText>
            </Pressable>
          </View>

          {/* Selected Certificates Tag Chips */}
          {certificates.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {certificates.map((cert, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '18', borderColor: theme.primary + '44', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full }}>
                  <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_500Medium', marginRight: 4 }}>
                    🏅 {cert}
                  </ThemedText>
                  <Pressable onPress={() => setCertificates(prev => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="close-circle" size={13} color={theme.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Quick Presets */}
          <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 4, fontFamily: 'Sora_500Medium' }}>
            QUICK ADD PRESETS:
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
            {['BWF Level 2', 'UEFA B License', 'USPTA Elite', 'CPR Certified', 'National Coach'].map(preset => {
              const isAdded = certificates.includes(preset);
              return (
                <Pressable
                  key={preset}
                  onPress={() => {
                    if (isAdded) setCertificates(prev => prev.filter(c => c !== preset));
                    else setCertificates(prev => [...prev, preset]);
                  }}
                  style={{
                    backgroundColor: isAdded ? theme.primary : theme.surfaceLow,
                    borderColor: isAdded ? theme.primary : theme.outlineVariant + '44',
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 3.5,
                    borderRadius: BorderRadius.full,
                  }}
                >
                  <ThemedText style={{ fontSize: 9.5, color: isAdded ? '#ffffff' : theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                    {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Amenities & Facilities Selection */}
        <View style={[styles.fieldGroup, { marginTop: 8 }]}>
          <ThemedText style={styles.fieldLabel}>Class Amenities & Facilities</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {[
              { id: 'water', label: 'Water Station', icon: 'water-outline' },
              { id: 'gear', label: 'Training Gear Provided', icon: 'football-outline' },
              { id: 'locker', label: 'Locker & Shower', icon: 'lock-closed-outline' },
              { id: 'parking', label: 'Parking Available', icon: 'car-outline' },
              { id: 'lights', label: 'Night Floodlights', icon: 'flash-outline' },
              { id: 'firstaid', label: 'First Aid Kit', icon: 'medkit-outline' },
              { id: 'wifi', label: 'Free Wi-Fi', icon: 'wifi-outline' },
              { id: 'cafe', label: 'Refreshments & Cafe', icon: 'cafe-outline' },
            ].map(a => {
              const isSelected = selectedAmenities.includes(a.label);
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    setSelectedAmenities(prev =>
                      prev.includes(a.label) ? prev.filter(item => item !== a.label) : [...prev, a.label]
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 8,
                    paddingVertical: 4.5,
                    borderRadius: BorderRadius.full,
                    borderWidth: 1,
                    backgroundColor: isSelected ? theme.primary + '18' : theme.surfaceLow,
                    borderColor: isSelected ? theme.primary : theme.outlineVariant + '44',
                  }}
                >
                  <Ionicons name={a.icon as any} size={11.5} color={isSelected ? theme.primary : theme.textSecondary} style={{ marginRight: 3.5 }} />
                  <ThemedText style={{ fontSize: 9.5, color: isSelected ? theme.primary : theme.textSecondary, fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium' }}>
                    {a.label}
                  </ThemedText>
                  {isSelected && <Ionicons name="checkmark" size={10} color={theme.primary} style={{ marginLeft: 3 }} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStepTwo = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
        {/* Start / End Date */}
        <View style={styles.rowFields}>
          <Pressable
            onPress={() => {
              setDatePickerField('start');
              const d = parseDateString(startDate);
              setPickerDate(d || new Date());
            }}
            style={{ flex: 1 }}
          >
            <ThemedText style={styles.fieldLabel}>Start Date <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
            <View style={[styles.input, styles.dateInput, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44', justifyContent: 'center' }]}>
              <ThemedText style={{ color: startDate ? theme.text : theme.textSecondary + '77', fontSize: 13 }}>
                {startDate || '09/Sep/2026'}
              </ThemedText>
            </View>
          </Pressable>
          <View style={{ width: Spacing.md }} />
          <Pressable
            onPress={() => {
              setDatePickerField('end');
              const d = parseDateString(endDate);
              setPickerDate(d || new Date());
            }}
            style={{ flex: 1 }}
          >
            <ThemedText style={styles.fieldLabel}>End Date <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
            <View style={[styles.input, styles.dateInput, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44', justifyContent: 'center' }]}>
              <ThemedText style={{ color: endDate ? theme.text : theme.textSecondary + '77', fontSize: 13 }}>
                {endDate || '09/Sep/2026'}
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Days of Week */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Recurring Days <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <View style={styles.dayRow}>
            {DAYS_OF_WEEK.map(day => (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={[
                  styles.dayChip,
                  { backgroundColor: selectedDays[day] ? theme.primary : theme.surfaceLow, borderColor: selectedDays[day] ? theme.primary : theme.outlineVariant + '44' }
                ]}
              >
                <ThemedText style={[styles.dayChipText, { color: selectedDays[day] ? '#fff' : theme.textSecondary }]}>{day}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Session Time */}
        <View style={styles.fieldGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <ThemedText style={styles.fieldLabel}>Session Time <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
            <ThemedText style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'Sora_400Regular' }}>
              Pick one or more
            </ThemedText>
          </View>
          {sessionTime ? (
            <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.md, marginBottom: 8, alignSelf: 'flex-start' }}>
              <ThemedText style={{ fontSize: 10.5, color: theme.primary, fontFamily: 'Sora_500Medium' }}>
                {selectedSessionCount} session{selectedSessionCount === 1 ? '' : 's'} · {getFormattedSessionTime(sessionTime)}
              </ThemedText>
            </View>
          ) : (
            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontSize: 10.5, color: theme.textSecondary, fontFamily: 'Sora_400Regular' }}>
                Tap any times below — you can mix morning, noon and evening.
              </ThemedText>
            </View>
          )}
          {Object.entries(SESSION_GROUPS).map(([groupName, times]) => (
            <View key={groupName} style={{ marginBottom: 8 }}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 4, textTransform: 'none', fontSize: 10.5 }]}>{groupName}</ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {times.map(t => {
                  const isSelected = isSessionTimeSelected(t);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => handleSelectSessionTime(t)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${t} ${groupName.replace(' Session', '')} session`}
                      style={[
                        styles.sessionChipNoScroll,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surfaceLow,
                          borderColor: isSelected ? theme.primary : theme.outlineVariant + '44'
                        }
                      ]}
                    >
                      <ThemedText style={[
                        styles.sessionChipText,
                        { color: isSelected ? '#ffffff' : theme.textSecondary, fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium' }
                      ]}>
                        {t}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Session Duration picker removed: each listed time IS a
            SESSION_SLOT_MINUTES session, and picking several means several
            sessions rather than one longer one. */}

        {/* Venue */}
        <View style={styles.fieldGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <ThemedText style={styles.fieldLabel}>Venue / Ground <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
            <Pressable
              onPress={handleFetchVenueLocation}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: theme.primary + '18',
                borderColor: theme.primary + '44',
                borderWidth: 1,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Ionicons name="navigate" size={11} color={theme.primary} />
              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                {isFetchingLocation ? 'Detecting...' : '📍 Fetch Location'}
              </ThemedText>
            </Pressable>
          </View>
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            value={venue}
            onChangeText={setVenue}
            placeholder="e.g. Wembley Training Grounds, London"
            placeholderTextColor="#94a3b8"
            style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStepThree = () => (
    <View style={{ flex: 1 }}>
      {/* Fixed Summary Preview Card at top */}
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: 4, paddingBottom: 6, backgroundColor: theme.background, zIndex: 10 }}>
        <View style={[styles.previewCard, { backgroundColor: theme.primaryContainer, overflow: 'hidden', marginBottom: 0 }]}>
          {classBannerImage ? (
            <Image
              source={{ uri: classBannerImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : null}
          <LinearGradient
            colors={
              classBannerImage
                ? ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']
                : [theme.primary, theme.primaryContainer]
            }
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.previewCardTop}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.previewLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                {classType?.toUpperCase() || 'CLASS'}
              </ThemedText>
              <ThemedText style={styles.previewName} numberOfLines={2}>
                {className || 'Untitled Class'}
              </ThemedText>
              {certificates.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {certificates.map((cert, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="ribbon-outline" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                      <ThemedText style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Sora_500Medium' }}>
                        {cert}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.previewMetaRow}>
            <View style={styles.previewMetaItem}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.7)" />
              <ThemedText style={styles.previewMetaText}>{ageGroup || 'All Ages'} · Max {maxStudents || '—'}</ThemedText>
            </View>
            <View style={styles.previewMetaItem}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
              <ThemedText style={styles.previewMetaText}>{venue || 'TBD'}</ThemedText>
            </View>
            <View style={styles.previewMetaItem}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
              <ThemedText style={styles.previewMetaText}>{getFormattedSessionTime(sessionTime) || sessionTime || '—'} · {sessionDuration}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollPad, { paddingTop: 6 }]}>
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
          {/* Upload Class Background Banner Controls */}
          <View style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <ThemedText style={[styles.fieldLabel, { fontSize: 10.5, color: theme.primary, letterSpacing: 0.6 }]}>
              CLASS BACKGROUND BANNER
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={pickClassBanner}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full }}
              >
                <Ionicons name="cloud-upload-outline" size={12} color="#ffffff" />
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: '#ffffff' }}>
                  {classBannerImage ? 'Change Banner' : 'Upload Banner'}
                </ThemedText>
              </Pressable>
              {classBannerImage ? (
                <Pressable
                  onPress={() => {
                    setClassBannerImage('');
                    triggerToast('Banner reset to default.');
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.surfaceLow, paddingHorizontal: 8, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: theme.outlineVariant + '55' }}
                >
                  <Ionicons name="refresh-outline" size={11} color={theme.textSecondary} />
                  <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary }}>Reset</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginBottom: 8 }}>
            Or select a curated sports preset:
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
            {VOUCHER_BANNER_PRESETS.map((p, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setClassBannerImage(p.uri);
                  triggerToast(`Banner set to ${p.label}! 🎨`);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: BorderRadius.full,
                  backgroundColor: classBannerImage === p.uri ? theme.primary + '20' : theme.surfaceLow,
                  borderWidth: 1,
                  borderColor: classBannerImage === p.uri ? theme.primary : theme.outlineVariant + '55',
                }}
              >
                <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: classBannerImage === p.uri ? theme.primary : theme.text }}>
                  {p.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Fee Structure */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Fee Structure <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {FEE_TYPES.map(f => (
              <Pressable
                key={f}
                onPress={() => setFeeType(f)}
                style={[
                  styles.chip,
                  { backgroundColor: feeType === f ? theme.primary : theme.surfaceLow, borderColor: feeType === f ? theme.primary : theme.outlineVariant + '44' }
                ]}
              >
                <ThemedText style={[styles.chipText, { color: feeType === f ? '#fff' : theme.textSecondary }]}>{f}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Fee Amount (₹) <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            value={feeAmount}
            onChangeText={setFeeAmount}
            keyboardType="decimal-pad"
            placeholder="e.g. 2500"
            placeholderTextColor="#94a3b8"
            style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
          />
        </View>

        {/* ── Promotional Vouchers Section ── */}
        <View style={[styles.fieldGroup, { marginTop: Spacing.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <ThemedText style={[styles.fieldLabel, { fontSize: 10.5, color: theme.primary, letterSpacing: 0.6 }]}>
              PROMOTIONAL VOUCHERS ({classOffers.length})
            </ThemedText>
            <Pressable
              onPress={addOfferRow}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary + '15', paddingHorizontal: 9, paddingVertical: 4, borderRadius: BorderRadius.full }}
            >
              <Ionicons name="add-circle" size={13} color={theme.primary} />
              <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                Add Voucher
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText style={{ fontSize: 10, fontFamily: 'Sora_400Regular', color: theme.textSecondary, marginBottom: 10 }}>
            Create discounts with custom banner art that students can redeem when enrolling in this class.
          </ThemedText>

          {classOffers.length === 0 ? (
            <View style={[styles.offerEmptyBox, { backgroundColor: theme.surfaceLow, borderRadius: BorderRadius.md }]}>
              <Ionicons name="pricetags-outline" size={24} color={theme.textSecondary} />
              <ThemedText style={[styles.offerEmptyText, { color: theme.textSecondary }]}>
                No vouchers added. Tap &apos;+ Add Voucher&apos; to create one.
              </ThemedText>
            </View>
          ) : (
            classOffers.map((draft, idx) => (
              <View
                key={draft.localId}
                style={[
                  styles.offerRowCard,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' },
                ]}
              >
                <View style={styles.offerRowHeader}>
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 12 }}>
                    Voucher {idx + 1}
                    {draft.offerId ? '' : ' · New'}
                  </ThemedText>
                  <Pressable
                    onPress={() => removeOfferRow(draft.localId)}
                    hitSlop={10}
                  >
                    <Ionicons name="trash-outline" size={15} color="#ef4444" />
                  </Pressable>
                </View>

                {/* Banner Image Upload & Preset */}
                <View style={{ marginTop: 10 }}>
                  <ThemedText style={styles.fieldLabel}>VOUCHER BANNER ART</ThemedText>
                  <View style={[styles.voucherBannerPickerCard, { backgroundColor: theme.surface, borderColor: theme.outlineVariant + '44' }]}>
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
                      >
                        <Ionicons name="cloud-upload-outline" size={13} color="#ffffff" />
                        <ThemedText style={styles.bannerUploadBtnText}>Upload Banner</ThemedText>
                      </Pressable>

                      {draft.bannerImage && (
                        <Pressable
                          onPress={() => patchOffer(draft.localId, { bannerImage: VOUCHER_BANNER_PRESETS[0].uri })}
                          style={styles.bannerRemoveBtn}
                        >
                          <Ionicons name="refresh-outline" size={12} color="#ffffff" />
                          <ThemedText style={styles.bannerRemoveBtnText}>Reset</ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Preset Banner Selector */}
                  <View style={{ marginTop: 8 }}>
                    <ThemedText style={{ fontSize: 9.5, fontFamily: 'Sora_500Medium', color: theme.textSecondary, marginBottom: 4 }}>
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
                                backgroundColor: isSelected ? theme.primary + '22' : theme.surface,
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

                {/* Promo Code & Title */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.fieldLabel}>PROMO CODE</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={draft.code}
                      onChangeText={v => patchOffer(draft.localId, { code: v.toUpperCase() })}
                      placeholder="COACH20"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="characters"
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText style={styles.fieldLabel}>OFFER NAME</ThemedText>
                      <ThemedText style={{ fontSize: 9, color: (draft.title?.length || 0) >= 12 ? '#ef4444' : theme.textSecondary, fontFamily: 'Sora_500Medium' }}>
                        {draft.title?.length || 0}/12
                      </ThemedText>
                    </View>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={draft.title}
                      onChangeText={v => patchOffer(draft.localId, { title: v.slice(0, 12) })}
                      maxLength={12}
                      placeholder="Early Bird"
                      placeholderTextColor="#94a3b8"
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    />
                  </View>
                </View>

                {/* Discount Type */}
                <View style={{ marginTop: 10 }}>
                  <ThemedText style={styles.fieldLabel}>DISCOUNT TYPE</ThemedText>
                  <View style={styles.filterRow}>
                    {(['percent', 'flat'] as OfferDiscountType[]).map(t => {
                      const active = draft.discountType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => patchOffer(draft.localId, { discountType: t })}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: active ? theme.primary : theme.surface,
                              borderColor: active ? theme.primary : theme.outlineVariant + '44',
                              paddingVertical: 4,
                            },
                          ]}
                        >
                          <ThemedText
                            style={{
                              fontSize: 10.5,
                              fontFamily: 'Sora_500Medium',
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

                {/* Discount Value & Min Booking */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.fieldLabel}>{draft.discountType === 'percent' ? 'DISCOUNT (%)' : 'DISCOUNT (₹)'}</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={draft.discountValue}
                      onChangeText={v => patchOffer(draft.localId, { discountValue: v.replace(/[^0-9]/g, '') })}
                      placeholder={draft.discountType === 'percent' ? '20' : '200'}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.fieldLabel}>MIN FEE (₹)</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={draft.minBooking}
                      onChangeText={v => patchOffer(draft.localId, { minBooking: v.replace(/[^0-9]/g, '') })}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    />
                  </View>
                </View>

                {/* Validity Days & Max Redemptions */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.fieldLabel}>VALID (DAYS)</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={draft.validDays}
                      onChangeText={v => patchOffer(draft.localId, { validDays: v.replace(/[^0-9]/g, '') })}
                      placeholder={String(calculateScheduleDays(startDate, endDate))}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.fieldLabel}>FIRST N STUDENTS</ThemedText>
                    <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={draft.maxRedemptions}
                      onChangeText={v => patchOffer(draft.localId, { maxRedemptions: v.replace(/[^0-9]/g, '') })}
                      placeholder={maxStudents.trim() ? `Max ${maxStudents.trim()}` : 'Unlimited'}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: 10 }}>
                  <ThemedText style={styles.fieldLabel}>DESCRIPTION / TERMS</ThemedText>
                  <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={draft.description}
                    onChangeText={v => patchOffer(draft.localId, { description: v })}
                    placeholder="What students get (e.g. 20% discount on academy enrollment)..."
                    placeholderTextColor="#94a3b8"
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                  />
                </View>

                {/* 1. Live Voucher Design Card Output */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="ticket-outline" size={13} color={theme.primary} />
                      <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 10.5, color: theme.primary, letterSpacing: 0.3 }}>
                        VOUCHER CARD OUTPUT
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full }}>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.primary }} />
                      <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                        Live Bound
                      </ThemedText>
                    </View>
                  </View>

                  {renderVoucherDesignCard(draft, idx)}
                </View>

                {/* 2. Live Voucher Details Output (Full Terms & Banner View) */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="document-text-outline" size={13} color={theme.primary} />
                      <ThemedText style={{ fontFamily: 'Sora_500Medium', fontSize: 10.5, color: theme.primary, letterSpacing: 0.3 }}>
                        VOUCHER DETAILS OUTPUT
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full }}>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.primary }} />
                      <ThemedText style={{ fontSize: 9, fontFamily: 'Sora_500Medium', color: theme.primary }}>
                        Live Bound
                      </ThemedText>
                    </View>
                  </View>

                  {renderVoucherDetailsOutput(draft, idx)}
                </View>
              </View>
            ))
          )}

          <Pressable
            onPress={addOfferRow}
            style={[styles.addOfferButton, { borderColor: theme.outlineVariant + '66', backgroundColor: theme.surfaceLow }]}
          >
            <Ionicons name="add-circle-outline" size={15} color={theme.primary} />
            <ThemedText style={[styles.addOfferButtonText, { color: theme.primary }]}>
              {classOffers.length === 0 ? 'Add a Voucher' : 'Add Another Voucher'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Class Description</ThemedText>
          <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the class — training focus, what students will learn, requirements..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }
            ]}
          />
        </View>

      </View>
    </ScrollView>
  </View>
  );

  return (
    <GradientContainer screenName="create-class" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: backBtnPulse }] }}>
            <Pressable style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#111c2c" />
            </Pressable>
          </Animated.View>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            {editId ? 'Edit Coaching Class' : 'Create Class'}
          </ThemedText>

          {/* Stepper Header Actions: Coach icon before Draft icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Coach Icon - Click to navigate back to Coach tab */}
            <Pressable
              onPress={() => router.replace('/(tabs)/coach')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back to Coach"
              style={[styles.headerIconBtn, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}
            >
              <Ionicons name="school-outline" size={20} color={theme.primary} />
            </Pressable>

            {/* Draft Icon - Click to save draft (only enabled if data is entered) */}
            {!editId && (
              <Pressable
                onPress={handleSaveDraft}
                disabled={!hasDraftContent || isSavingDraft || isPublishing}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Save Class Draft"
                style={[
                  styles.headerIconBtn,
                  {
                    backgroundColor: theme.surfaceLowest,
                    borderColor: theme.outlineVariant + '33',
                    opacity: (!hasDraftContent || isSavingDraft || isPublishing) ? 0.35 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={hasDraftContent ? theme.text : theme.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Step Progress Tracker */}
        <View style={styles.progressTrackerCard}>
          <View style={styles.stepRow}>
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              return (
                <React.Fragment key={step.title}>
                  <Pressable style={styles.stepItem} onPress={() => handleStepHeaderPress(idx)}>
                    <View style={[
                      styles.stepCircle,
                      isDone
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : isActive
                          ? { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                          : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' }
                    ]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={12} color="#fff" />
                        : <Ionicons name={step.icon as any} size={12} color={isActive ? theme.primary : theme.textSecondary} />
                      }
                    </View>
                    <ThemedText style={[
                      styles.stepLabel,
                      {
                        color: isActive ? theme.primary : isDone ? theme.text : theme.textSecondary,
                        fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium'
                      }
                    ]}>
                      {step.title}
                    </ThemedText>
                  </Pressable>
                  {idx < STEPS.length - 1 && (
                    <View style={[styles.stepConnector, { backgroundColor: isDone ? theme.primary : theme.outlineVariant + '33' }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Step Content */}
        <View style={{ flex: 1 }}>
          {currentStep === 0 && renderStepOne()}
          {currentStep === 1 && renderStepTwo()}
          {currentStep === 2 && renderStepThree()}
        </View>

        {/* Publish step keeps its actions pinned, exactly like the Back/Next bar
            on the earlier steps — they were scrolling away with the form. */}
        {currentStep === 2 && (
          <View style={[styles.bottomNav, { borderTopColor: theme.outlineVariant + '22', backgroundColor: theme.surfaceLowest }]}>
            <Pressable
              onPress={handleSaveDraft}
              disabled={!hasDraftContent || isSavingDraft || isPublishing}
              style={[
                styles.draftBtn,
                {
                  borderColor: theme.outlineVariant,
                  opacity: (!hasDraftContent || isSavingDraft || isPublishing) ? 0.4 : 1,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={hasDraftContent ? theme.text : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.draftBtnText,
                  { color: hasDraftContent ? theme.text : theme.textSecondary },
                ]}
              >
                Save Draft
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handlePublish}
              disabled={isSavingDraft || isPublishing || !isAllValid}
              style={[
                styles.publishBtn,
                { backgroundColor: theme.primary, marginLeft: Spacing.sm },
                (!isAllValid || isSavingDraft || isPublishing) && { opacity: 0.45, backgroundColor: theme.outlineVariant + '77' }
              ]}
            >
              <Ionicons name={editId ? "save-outline" : "checkmark-circle"} size={18} color="#fff" />
              <ThemedText style={styles.publishBtnText}>
                {isPublishing ? 'Publishing...' : editId ? 'Update Class 🎓' : 'Publish Class 🎓'}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Bottom Navigation */}
        {currentStep < 2 && (
          <View style={[styles.bottomNav, { borderTopColor: theme.outlineVariant + '22', backgroundColor: theme.surfaceLowest }]}>
            {currentStep > 0 && (
              <Pressable onPress={() => setCurrentStep(currentStep - 1)} style={[styles.navBtnOutline, { borderColor: theme.outlineVariant }]}>
                <Ionicons name="chevron-back" size={16} color={theme.text} />
                <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13, marginLeft: 4 }}>Back</ThemedText>
              </Pressable>
            )}
            <Pressable
              onPress={handleNext}
              style={[
                styles.navBtnFill,
                {
                  backgroundColor: theme.primary,
                  marginLeft: currentStep > 0 ? Spacing.sm : 0,
                  opacity: (currentStep === 0 ? isStepZeroValid : isStepOneValid) ? 1 : 0.55,
                }
              ]}
            >
              <ThemedText style={{ color: '#fff', fontFamily: 'Sora_500Medium', fontSize: 13, marginRight: 4 }}>
                {currentStep === 1 ? 'Preview & Publish' : 'Next'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Toast */}
        {toastMsg && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
            <ThemedText style={{ color: '#fff', fontSize: 12, fontFamily: 'Sora_500Medium' }}>{toastMsg}</ThemedText>
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
                  {datePickerField === 'start' ? 'Select Start Date' : 'Select End Date'}
                </ThemedText>
                <Pressable style={styles.modalCloseBtn} onPress={() => setDatePickerField(null)}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </Pressable>
              </View>

              {/* Calendar Controls */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                {(() => {
                  const now = new Date();
                  const isCurrentOrPastMonth = pickerDate.getFullYear() < now.getFullYear() ||
                    (pickerDate.getFullYear() === now.getFullYear() && pickerDate.getMonth() <= now.getMonth());
                  return (
                    <Pressable
                      disabled={isCurrentOrPastMonth}
                      onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))}
                      style={[{ padding: 6 }, isCurrentOrPastMonth && { opacity: 0.25 }]}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.text} />
                    </Pressable>
                  );
                })()}
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
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
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

                        const dObj = new Date(year, month, cell.day);
                        dObj.setHours(0, 0, 0, 0);
                        const formatted = formatSelectedDate(dObj);
                        const isSelected = (datePickerField === 'start' && startDate === formatted) ||
                          (datePickerField === 'end' && endDate === formatted);

                        const isPastDate = dObj.getTime() < today.getTime();
                        const startD = parseDateString(startDate);
                        const isBeforeStart = datePickerField === 'end' && Boolean(startD && dObj.getTime() < startD.getTime());
                        const isDisabled = isPastDate || isBeforeStart;

                        return (
                          <Pressable
                            key={cIdx}
                            disabled={isDisabled}
                            onPress={() => {
                              if (isPastDate) {
                                triggerToast('⚠️ Cannot select a past date.');
                                return;
                              }
                              if (isBeforeStart) {
                                triggerToast(`⚠️ End Date cannot be earlier than Start Date (${startDate})`);
                                return;
                              }
                              if (datePickerField === 'start') {
                                setStartDate(formatted);
                                const newStart = parseDateString(formatted);
                                const currEnd = parseDateString(endDate);
                                const targetEnd = (newStart && currEnd && currEnd.getTime() < newStart.getTime()) ? formatted : endDate;
                                if (newStart && currEnd && currEnd.getTime() < newStart.getTime()) {
                                  setEndDate(formatted);
                                  triggerToast('End Date updated to match Start Date 📅');
                                }
                                const newDays = calculateScheduleDays(formatted, targetEnd);
                                setClassOffers(prev => prev.map(o => ({ ...o, validDays: String(newDays) })));
                              } else if (datePickerField === 'end') {
                                setEndDate(formatted);
                                const newDays = calculateScheduleDays(startDate, formatted);
                                setClassOffers(prev => prev.map(o => ({ ...o, validDays: String(newDays) })));
                              }
                              setDatePickerField(null);
                            }}
                            style={[
                              { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
                              isDisabled && { opacity: 0.25 },
                              isSelected && { backgroundColor: theme.primary }
                            ]}
                          >
                            <ThemedText style={{
                              color: isDisabled ? theme.textSecondary : isSelected ? '#ffffff' : theme.text,
                              fontSize: 13,
                              fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_400Regular',
                              textDecorationLine: isDisabled ? 'line-through' : 'none'
                            }}>
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

        {/* Custom Resume Draft Modal */}
        <Modal
          visible={resumeDraftModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setResumeDraftModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44', padding: 24, maxWidth: 340 }]}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ backgroundColor: theme.primary + '15', padding: 12, borderRadius: BorderRadius.full, marginBottom: 12 }}>
                  <Ionicons name="document-text" size={36} color={theme.primary} />
                </View>
                <ThemedText type="headlineSm" style={{ fontFamily: 'Sora_500Medium', color: theme.text, textAlign: 'center' }}>
                  Resume Draft? 📝
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  We found a saved draft for <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_500Medium', color: theme.text }}>&quot;{pendingResumeDraft?.className || 'Untitled Class'}&quot;</ThemedText>. Would you like to resume editing?
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Pressable
                  style={[styles.modalButton, { flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'transparent' }]}
                  onPress={() => {
                    setResumeDraftModalVisible(false);
                    setPendingResumeDraft(null);
                  }}
                >
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                    Discard
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { flex: 1, backgroundColor: theme.primary }]}
                  onPress={() => {
                    if (pendingResumeDraft) {
                      loadDraft(pendingResumeDraft);
                    }
                    setResumeDraftModalVisible(false);
                    setPendingResumeDraft(null);
                  }}
                >
                  <ThemedText style={{ color: '#fff', fontFamily: 'Sora_500Medium', fontSize: 13 }}>
                    Resume
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 9,
    letterSpacing: 0.2,
  },
  stepConnector: {
    flex: 1,
    height: 1.5,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  scrollPad: {
    paddingBottom: 160,
    paddingTop: Spacing.xs,
  },
  formCard: {
    marginHorizontal: Spacing.containerMargin,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 40,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
    letterSpacing: 0.5,
    marginBottom: 4,
    color: '#81919c',
  },
  input: {
    height: 38,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 12.5,
    borderWidth: 1,
    fontFamily: 'Sora_500Medium',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  dateInput: {
    height: 38,
  },
  textArea: {
    height: 96,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chipScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
    marginHorizontal: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    width: '100%',
  },
  dayChip: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayChipText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
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
    fontFamily: 'Sora_500Medium',
    textAlign: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sessionChipNoScroll: {
    width: '18.5%',
    paddingVertical: 5,
    paddingHorizontal: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionChipText: {
    fontSize: 9.5,
    textAlign: 'center',
  },
  previewCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  previewLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  previewName: {
    fontFamily: 'Sora_500Medium',
    fontSize: 20,
    color: '#ffffff',
    lineHeight: 26,
  },
  previewMetaRow: {
    gap: Spacing.xs,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewMetaText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  // Retained: the publish actions now live in the pinned bottomNav bar.
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  draftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: 6,
  },
  draftBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
  },
  publishBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.xl,
    gap: 6,
  },
  publishBtnText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    color: '#ffffff',
  },
  bottomNav: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingHorizontal: Spacing.containerMargin,
    borderTopWidth: 1,
  },
  navBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnFill: {
    flex: 2,
    flexDirection: 'row',
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius['xl'],
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    width: '100%',
  },
  modalButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // ── Voucher Styles ──
  kakaoCouponContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
    backgroundColor: '#ffffff',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  kakaoVisualHalf: {
    height: 140,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 14,
  },
  kakaoBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  kakaoTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  kakaoBrandCol: {
    alignItems: 'flex-start',
  },
  kakaoBrandTitle: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    letterSpacing: 0.5,
    maxWidth: 200,
  },
  kakaoBrandSub: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.4,
    marginTop: 1,
  },
  kakaoBrandCoupon: {
    color: '#FEE500',
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  kakaoBrandLine: {
    width: 28,
    height: 2,
    backgroundColor: '#FEE500',
    marginTop: 3,
    borderRadius: 1,
  },
  kakaoYellowBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE500',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoYellowBadgeText: {
    color: '#000000',
    fontFamily: 'Sora_700Bold',
    fontSize: 7.5,
    lineHeight: 9,
    letterSpacing: 0.1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  kakaoDiscountCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    zIndex: 2,
  },
  kakaoBigDiscount: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 28,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  kakaoBigOff: {
    color: '#FEE500',
    fontFamily: 'Sora_500Medium',
    fontSize: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  kakaoWhiteStub: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#F4F4F5',
    borderStyle: 'dashed',
  },
  kakaoStubLabel: {
    color: '#A1A1AA',
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  kakaoStubDays: {
    color: '#27272A',
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  kakaoStubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  kakaoStubCode: {
    color: '#52525B',
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  kakaoStubDesc: {
    color: '#71717A',
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  kakaoBarcode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  voucherBannerPickerCard: {
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 8,
  },
  voucherBannerThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  voucherBannerActions: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 3,
  },
  bannerUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  bannerUploadBtnText: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
  },
  bannerRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bannerRemoveBtnText: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
  },
  presetChip: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
  },
  offerRowCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  offerRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 8,
  },
  offerEmptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  offerEmptyText: {
    fontSize: 11.5,
    fontFamily: 'Sora_500Medium',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  addOfferButtonText: {
    fontSize: 12,
    fontFamily: 'Sora_500Medium',
  },
  voucherDetailOutputCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6,
    width: '100%',
  },
  voucherDetailBannerWrap: {
    height: 100,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
    padding: Spacing.sm,
  },
  voucherDetailBannerImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  voucherDetailTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  voucherDetailCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  voucherDetailCategoryText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.4,
  },
  voucherDetailDiscountTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherDetailDiscountTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
  },
  voucherDetailBottomContent: {
    zIndex: 2,
  },
  voucherDetailTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Sora_700Bold',
  },
  voucherDetailSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    marginTop: 1,
  },
  voucherDetailBody: {
    padding: Spacing.sm,
    gap: 8,
  },
  voucherDetailCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  voucherDetailCodeText: {
    fontSize: 12,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.8,
  },
  voucherDetailCopyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  voucherDetailCopyText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'Sora_700Bold',
  },
  voucherDetailTerms: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  voucherDetailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  voucherDetailMetric: {
    flex: 1,
  },
  voucherDetailMetricLabel: {
    fontSize: 8,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.3,
  },
  voucherDetailMetricVal: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 2,
  },
});
