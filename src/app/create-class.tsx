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
import { useRouter } from 'expo-router';
import { useClassStore } from '@/store/app-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SPORTS_LIST } from '@/constants/sports';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Class Info', icon: 'school-outline' },
  { title: 'Schedule', icon: 'calendar-outline' },
  { title: 'Publish', icon: 'checkmark-circle-outline' },
];

const CLASS_TYPES = ['Regular Class', 'Summer Camp', 'Weekend Clinic', 'Trial Session'];
const AGE_GROUPS = ['U8', 'U12', 'U16', 'U19', 'Adults', 'All Ages'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_GROUPS = {
  'Morning Session': ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM'],
  'Noon Session': ['2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'],
  'Evening Session': ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
};
const DURATIONS = ['45 min', '60 min', '90 min', '120 min'];
const FEE_TYPES = ['Per Session', 'Monthly', 'One-Time Package'];

const SKILL_LEVELS = [
  { key: 'beginner', label: 'Beginner', icon: 'leaf-outline' },
  { key: 'intermediate', label: 'Intermediate', icon: 'flame-outline' },
  { key: 'advanced', label: 'Advanced', icon: 'trophy-outline' },
  { key: 'elite', label: 'Elite', icon: 'star-outline' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const getTodayDate = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export default function CreateClassScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { addClass } = useClassStore();
  const [currentStep, setCurrentStep] = useState(0);

  const [datePickerField, setDatePickerField] = useState<'start' | 'end' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date(2026, 5, 27));

  const [draftsModalVisible, setDraftsModalVisible] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [resumeDraftModalVisible, setResumeDraftModalVisible] = useState(false);
  const [pendingResumeDraft, setPendingResumeDraft] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Step 1 — Class Info
  const [className, setClassName] = useState('');
  const [certificates, setCertificates] = useState<string[]>(['BWF Certified Level 2']);
  const [newCertInput, setNewCertInput] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Water Station', 'Training Gear Provided', 'Locker & Shower']);
  const [sportType, setSportType] = useState('');
  const [classType, setClassType] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [skillLevel, setSkillLevel] = useState('');

  // Step 2 — Schedule
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [sessionTime, setSessionTime] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60 min');
  const [venue, setVenue] = useState('');

  // Step 3 — Publish
  const [feeType, setFeeType] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [description, setDescription] = useState('');

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

  const loadDraft = (draft: any) => {
    if (draft.className) setClassName(draft.className);
    if (draft.sportType) setSportType(draft.sportType);
    if (draft.classType) setClassType(draft.classType);
    if (draft.ageGroup) setAgeGroup(draft.ageGroup);
    if (draft.maxStudents) setMaxStudents(draft.maxStudents);
    if (draft.skillLevel) setSkillLevel(draft.skillLevel);
    if (draft.startDate) setStartDate(draft.startDate);
    if (draft.endDate) setEndDate(draft.endDate);
    if (draft.selectedDays) setSelectedDays(draft.selectedDays);
    if (draft.sessionTime) setSessionTime(draft.sessionTime);
    if (draft.sessionDuration) setSessionDuration(draft.sessionDuration);
    if (draft.venue) setVenue(draft.venue);
    if (draft.feeType) setFeeType(draft.feeType);
    if (draft.feeAmount) setFeeAmount(draft.feeAmount);
    if (draft.description) setDescription(draft.description);
    if (typeof draft.currentStep === 'number') setCurrentStep(draft.currentStep);
    
    setDraftsModalVisible(false);
    triggerToast('Draft loaded! 📝');
  };

  const deleteDraft = async (id: string) => {
    try {
      const nextDrafts = savedDrafts.filter(d => d.id !== id);
      await AsyncStorage.setItem('@turf_class_drafts', JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      triggerToast('Draft deleted.');
    } catch (e) {
      console.error(e);
    }
  };

  // Load draft list on mount
  useEffect(() => {
    (async () => {
      try {
        const savedDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
        if (savedDraftsStr) {
          const list = JSON.parse(savedDraftsStr);
          setSavedDrafts(list);
          if (list.length > 0) {
            const latest = list[0];
            setPendingResumeDraft(latest);
            setResumeDraftModalVisible(true);
          }
        }
      } catch (e) {
        console.error('Failed to load drafts', e);
      }
    })();
  }, []);

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

  const getSlotCountFromDuration = (dur: string): number => {
    if (dur.includes('180') || dur.includes('3')) return 3;
    if (dur.includes('120') || dur.includes('2') || dur.includes('90') || dur.includes('1.5')) return 2;
    return 1;
  };

  const handleSelectSessionTime = (time: string, groupName: string) => {
    const currentTimes = sessionTime.split(',').map(s => s.trim()).filter(Boolean);
    let updatedTimes: string[];

    if (currentTimes.includes(time)) {
      // Toggle off slot
      updatedTimes = currentTimes.filter(t => t !== time);
    } else {
      // Toggle on slot
      updatedTimes = [...currentTimes, time];
    }

    setSessionTime(updatedTimes.join(', '));

    // Automatically update session duration matching total 1-hr slots selected!
    const totalSlots = updatedTimes.length;
    if (totalSlots === 1) setSessionDuration('60 min');
    else if (totalSlots === 2) setSessionDuration('120 min');
    else if (totalSlots >= 3) setSessionDuration('180 min');
  };

  const handleDurationSelect = (dur: string) => {
    setSessionDuration(dur);
    const targetSlotsCount = getSlotCountFromDuration(dur);
    const currentTimes = sessionTime.split(',').map(s => s.trim()).filter(Boolean);

    if (currentTimes.length === 0) return;

    if (currentTimes.length === targetSlotsCount) return;

    if (currentTimes.length < targetSlotsCount) {
      const firstTime = currentTimes[0];
      for (const [groupName, groupTimes] of Object.entries(SESSION_GROUPS)) {
        if (groupTimes.includes(firstTime)) {
          const startIndex = groupTimes.indexOf(firstTime);
          if (startIndex !== -1) {
            const nextSlots = groupTimes.slice(startIndex, Math.min(startIndex + targetSlotsCount, groupTimes.length));
            setSessionTime(nextSlots.join(', '));
          }
          break;
        }
      }
    } else if (currentTimes.length > targetSlotsCount) {
      setSessionTime(currentTimes.slice(0, targetSlotsCount).join(', '));
    }
  };

  const isSessionTimeSelected = (t: string) => {
    if (!sessionTime) return false;
    return sessionTime.split(',').map(s => s.trim()).includes(t);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const formatSelectedDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const res = new Date(y, m, d);
    res.setHours(0, 0, 0, 0);
    return isNaN(res.getTime()) ? null : res;
  };

  // Step 0 validation: Class Name (3 to 40 chars), Sport, Class Type are mandatory
  const isStepZeroValid = useMemo(() => {
    const validName = className.trim().length >= 3 && className.trim().length <= 40;
    return Boolean(validName && sportType.trim() && classType.trim());
  }, [className, sportType, classType]);

  // Step 1 validation: Start Date, End Date (must be >= Start Date), Recurring Days, Session Time, Venue (>= 3 chars)
  const isStepOneValid = useMemo(() => {
    const startD = parseDateString(startDate);
    const endD = parseDateString(endDate);
    const validDates = Boolean(startD && endD && endD.getTime() >= startD.getTime());
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
        } else {
          triggerToast('⚠️ Please fill required fields (*): Class Name, Sport, Class Type');
        }
        return;
      }
      if (currentStep === 1 && !isStepOneValid) {
        const startD = parseDateString(startDate);
        const endD = parseDateString(endDate);
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
      if (!isStepZeroValid) {
        triggerToast('⚠️ Please fill required fields (*): Class Name, Sport, Class Type');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      const startD = parseDateString(startDate);
      const endD = parseDateString(endDate);
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

  const handlePublish = () => {
    if (isPublishing) return;
    if (!isStepZeroValid || !isStepOneValid || !isStepTwoValid) {
      triggerToast('⚠️ Please fill all required fields before publishing (*): Fee Structure & Fee Amount');
      return;
    }

    setIsPublishing(true);
    addClass({
      className,
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
    });

    // Clean up draft since it is published
    (async () => {
      try {
        const existingDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
        if (existingDraftsStr) {
          const draftsList = JSON.parse(existingDraftsStr);
          const nextDrafts = draftsList.filter((d: any) => d.className !== className);
          await AsyncStorage.setItem('@turf_class_drafts', JSON.stringify(nextDrafts));
          setSavedDrafts(nextDrafts);
        }
      } catch (e) {
        console.error('Failed to clean up draft after publish', e);
      }
    })();

    if (Platform.OS === 'web') {
      alert(`"${className || 'Your Class'}" is now live. Students can enrol now.`);
      router.replace('/(tabs)');
      return;
    }

    Alert.alert(
      'Class Published! 🎓',
      `"${className || 'Your Class'}" is now live. Students can enrol now.`,
      [{ text: 'Done', onPress: () => {
        router.replace('/(tabs)');
      }}]
    );
  };

  const handleSaveDraft = async () => {
    if (isSavingDraft) return;
    setIsSavingDraft(true);
    try {
      const newDraft = {
        id: `draft-${Date.now()}`,
        dateStr: new Date().toLocaleString(),
        className: className || 'Untitled Class Draft',
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
        currentStep,
      };

      const existingDraftsStr = await AsyncStorage.getItem('@turf_class_drafts');
      const draftsList = existingDraftsStr ? JSON.parse(existingDraftsStr) : [];
      
      const nextDrafts = [newDraft, ...draftsList];
      await AsyncStorage.setItem('@turf_class_drafts', JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      triggerToast('Draft saved successfully! 💾');
    } catch (e) {
      console.error('Failed to save draft class', e);
      triggerToast('Failed to save draft class.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ─── Step Renderers ────────────────────────────────────────────────────────

  const renderStepOne = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
      {/* Class Name */}
      <View style={styles.fieldGroup}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <ThemedText style={styles.fieldLabel}>Class Name <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <ThemedText style={{ fontSize: 10, color: className.length >= 40 ? '#ef4444' : theme.textSecondary, fontFamily: 'Sora_700Bold' }}>
            {className.length}/40
          </ThemedText>
        </View>
        <TextInput
          value={className}
          onChangeText={text => setClassName(text.replace(/[^a-zA-Z\s]/g, ''))}
          maxLength={40}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
          {SPORTS_LIST.map(sport => {
            const isActive = sportType === sport.name;
            return (
              <Pressable
                key={sport.name}
                onPress={() => setSportType(sport.name)}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                  isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <MaterialIcons
                  name={sport.icon as any}
                  size={12}
                  color={isActive ? '#ffffff' : theme.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <ThemedText style={{
                  color: isActive ? '#ffffff' : theme.textSecondary,
                  fontFamily: isActive ? 'Sora_700Bold' : 'Sora_600SemiBold',
                  fontSize: 10,
                  letterSpacing: 0.2,
                }}>
                  {sport.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
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

      {/* Age Group */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Age Group</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {AGE_GROUPS.map(a => (
            <Pressable
              key={a}
              onPress={() => setAgeGroup(a)}
              style={[
                styles.chip,
                { backgroundColor: ageGroup === a ? theme.primary : theme.surfaceLow, borderColor: ageGroup === a ? theme.primary : theme.outlineVariant + '44' }
              ]}
            >
              <ThemedText style={[styles.chipText, { color: ageGroup === a ? '#fff' : theme.textSecondary }]}>{a}</ThemedText>
            </Pressable>
          ))}
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
        <ThemedText style={styles.fieldLabel}>Max Students</ThemedText>
        <TextInput
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
          <TextInput
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
            <ThemedText style={{ color: '#fff', fontSize: 11, fontFamily: 'Sora_700Bold' }}>+ Add</ThemedText>
          </Pressable>
        </View>

        {/* Selected Certificates Tag Chips */}
        {certificates.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {certificates.map((cert, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '18', borderColor: theme.primary + '44', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full }}>
                <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_700Bold', marginRight: 4 }}>
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
        <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 4, fontFamily: 'Sora_700Bold' }}>
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
                <ThemedText style={{ fontSize: 9.5, color: isAdded ? '#ffffff' : theme.textSecondary, fontFamily: 'Sora_600SemiBold' }}>
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
                <ThemedText style={{ fontSize: 9.5, color: isSelected ? theme.primary : theme.textSecondary, fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium' }}>
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
            const parts = startDate.split('/');
            if (parts.length === 3) {
              const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              setPickerDate(isNaN(d.getTime()) ? new Date() : d);
            } else {
              setPickerDate(new Date());
            }
          }}
          style={{ flex: 1 }}
        >
          <ThemedText style={styles.fieldLabel}>Start Date <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <View style={[styles.input, styles.dateInput, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44', justifyContent: 'center' }]}>
            <ThemedText style={{ color: startDate ? theme.text : theme.textSecondary + '77', fontSize: 13 }}>
              {startDate || 'DD/MM/YYYY'}
            </ThemedText>
          </View>
        </Pressable>
        <View style={{ width: Spacing.md }} />
        <Pressable 
          onPress={() => {
            setDatePickerField('end');
            const parts = endDate.split('/');
            if (parts.length === 3) {
              const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              setPickerDate(isNaN(d.getTime()) ? new Date() : d);
            } else {
              setPickerDate(new Date());
            }
          }}
          style={{ flex: 1 }}
        >
          <ThemedText style={styles.fieldLabel}>End Date <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
          <View style={[styles.input, styles.dateInput, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44', justifyContent: 'center' }]}>
            <ThemedText style={{ color: endDate ? theme.text : theme.textSecondary + '77', fontSize: 13 }}>
              {endDate || 'DD/MM/YYYY'}
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
        </View>
        {sessionTime ? (
          <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.md, marginBottom: 8, alignSelf: 'flex-start' }}>
            <ThemedText style={{ fontSize: 10.5, color: theme.primary, fontFamily: 'Sora_700Bold' }}>
              Selected: {getFormattedSessionTime(sessionTime)}
            </ThemedText>
          </View>
        ) : null}
        {Object.entries(SESSION_GROUPS).map(([groupName, times]) => (
          <View key={groupName} style={{ marginBottom: 8 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 4, textTransform: 'none', fontSize: 10.5 }]}>{groupName}</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {times.map(t => {
                const isSelected = isSessionTimeSelected(t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => handleSelectSessionTime(t, groupName)}
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
                      { color: isSelected ? '#ffffff' : theme.textSecondary, fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium' }
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

      {/* Session Duration */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Session Duration</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {DURATIONS.map(d => (
            <Pressable
              key={d}
              onPress={() => handleDurationSelect(d)}
              style={[
                styles.chip,
                { backgroundColor: sessionDuration === d ? theme.primary : theme.surfaceLow, borderColor: sessionDuration === d ? theme.primary : theme.outlineVariant + '44' }
              ]}
            >
              <ThemedText style={[styles.chipText, { color: sessionDuration === d ? '#fff' : theme.textSecondary }]}>{d}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Venue */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Venue / Ground <ThemedText style={{ color: '#ef4444' }}>*</ThemedText></ThemedText>
        <TextInput
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
      {/* Preview Card */}
      <View style={[styles.previewCard, { backgroundColor: theme.primaryContainer }]}>
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
                    <ThemedText style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Sora_700Bold' }}>
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
        <TextInput
          value={feeAmount}
          onChangeText={setFeeAmount}
          keyboardType="decimal-pad"
          placeholder="e.g. 2500"
          placeholderTextColor="#94a3b8"
          style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Class Description</ThemedText>
        <TextInput
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

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={handleSaveDraft}
          disabled={isSavingDraft || isPublishing}
          style={[styles.draftBtn, { borderColor: theme.outlineVariant, opacity: (isSavingDraft || isPublishing) ? 0.6 : 1 }]}
        >
          <Ionicons name="document-text-outline" size={16} color={theme.text} />
          <ThemedText style={[styles.draftBtnText, { color: theme.text }]}>Save Draft</ThemedText>
        </Pressable>
        <Pressable
          onPress={handlePublish}
          disabled={isSavingDraft || isPublishing}
          style={[styles.publishBtn, { backgroundColor: theme.primary, opacity: (isSavingDraft || isPublishing) ? 0.6 : 1 }]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <ThemedText style={styles.publishBtnText}>Publish Class</ThemedText>
        </Pressable>
      </View>
      </View>
    </ScrollView>
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
            Create Class
          </ThemedText>
          <Pressable 
            style={[styles.backBtn, { marginRight: 8 }]} 
            onPress={() => setDraftsModalVisible(true)}
          >
            <Ionicons name="document-text-outline" size={18} color="#111c2c" />
          </Pressable>
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
                      { color: isActive ? theme.primary : isDone ? theme.text : theme.textSecondary,
                        fontFamily: isActive ? 'Sora_700Bold' : 'Sora_500Medium' }
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

        {/* Bottom Navigation */}
        {currentStep < 2 && (
          <View style={[styles.bottomNav, { borderTopColor: theme.outlineVariant + '22', backgroundColor: theme.surfaceLowest }]}>
            {currentStep > 0 && (
              <Pressable onPress={() => setCurrentStep(currentStep - 1)} style={[styles.navBtnOutline, { borderColor: theme.outlineVariant }]}>
                <Ionicons name="chevron-back" size={16} color={theme.text} />
                <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 13, marginLeft: 4 }}>Back</ThemedText>
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
              <ThemedText style={{ color: '#fff', fontFamily: 'Sora_700Bold', fontSize: 13, marginRight: 4 }}>
                {currentStep === 1 ? 'Preview & Publish' : 'Next'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Toast */}
        {toastMsg && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
            <ThemedText style={{ color: '#fff', fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>{toastMsg}</ThemedText>
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
                <Pressable onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))} style={{ padding: 6 }}>
                  <Ionicons name="chevron-back" size={20} color={theme.text} />
                </Pressable>
                <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 14 }}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pickerDate.getMonth()]} {pickerDate.getFullYear()}
                </ThemedText>
                <Pressable onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))} style={{ padding: 6 }}>
                  <Ionicons name="chevron-forward" size={20} color={theme.text} />
                </Pressable>
              </View>

              {/* Days of week labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <ThemedText key={d} style={{ color: theme.textSecondary, width: 40, textAlign: 'center', fontSize: 10, fontWeight: 'bold' }}>
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
                        
                        const dObj = new Date(year, month, cell.day);
                        dObj.setHours(0, 0, 0, 0);
                        const formatted = formatSelectedDate(dObj);
                        const isSelected = (datePickerField === 'start' && startDate === formatted) ||
                                           (datePickerField === 'end' && endDate === formatted);
                        
                        const startD = parseDateString(startDate);
                        const isBeforeStart = datePickerField === 'end' && Boolean(startD && dObj.getTime() < startD.getTime());

                        return (
                          <Pressable
                            key={cIdx}
                            disabled={isBeforeStart}
                            onPress={() => {
                              if (isBeforeStart) {
                                triggerToast(`⚠️ End Date cannot be earlier than Start Date (${startDate})`);
                                return;
                              }
                              if (datePickerField === 'start') {
                                setStartDate(formatted);
                                const newStart = parseDateString(formatted);
                                const currEnd = parseDateString(endDate);
                                if (newStart && currEnd && currEnd.getTime() < newStart.getTime()) {
                                  setEndDate(formatted);
                                  triggerToast('End Date updated to match Start Date 📅');
                                }
                              } else if (datePickerField === 'end') {
                                setEndDate(formatted);
                              }
                              setDatePickerField(null);
                            }}
                            style={[
                              { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
                              isBeforeStart && { opacity: 0.25 },
                              isSelected && { backgroundColor: theme.primary }
                            ]}
                          >
                            <ThemedText style={{
                              color: isBeforeStart ? theme.textSecondary : isSelected ? '#ffffff' : theme.text,
                              fontSize: 13,
                              fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_400Regular',
                              textDecorationLine: isBeforeStart ? 'line-through' : 'none'
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
                <ThemedText type="headlineSm" style={{ fontFamily: 'Sora_700Bold', color: theme.text, textAlign: 'center' }}>
                  Resume Draft? 📝
                </ThemedText>
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  We found a saved draft for <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold', color: theme.text }}>&quot;{pendingResumeDraft?.className || 'Untitled Class'}&quot;</ThemedText>. Would you like to resume editing?
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
                  <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 13 }}>
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
                  <ThemedText style={{ color: '#fff', fontFamily: 'Sora_700Bold', fontSize: 13 }}>
                    Resume
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
                <Ionicons name="document-text-outline" size={20} color={theme.primary} style={{ marginRight: 6 }} />
                <ThemedText type="headlineSm" style={{ color: theme.text, flex: 1 }}>
                  Saved Drafts
                </ThemedText>
                <Pressable style={styles.modalCloseBtn} onPress={() => setDraftsModalVisible(false)}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 300, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
                {savedDrafts.length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>No drafts saved yet.</ThemedText>
                  </View>
                ) : (
                  savedDrafts.map((draft) => (
                    <View 
                      key={draft.id} 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        padding: 12, 
                        backgroundColor: theme.surfaceLow, 
                        borderRadius: BorderRadius.md, 
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: theme.outlineVariant + '22'
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ color: theme.text, fontFamily: 'Sora_700Bold', fontSize: 13 }}>
                          {draft.className}
                        </ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 10, marginTop: 2 }}>
                          {draft.dateStr} • {draft.sportType || 'No Sport'}
                        </ThemedText>
                      </View>
                      <Pressable 
                        onPress={() => loadDraft(draft)}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.primary, borderRadius: BorderRadius.sm, marginRight: 6 }}
                      >
                        <ThemedText style={{ color: '#fff', fontSize: 11, fontFamily: 'Sora_700Bold' }}>Load</ThemedText>
                      </Pressable>
                      <Pressable 
                        onPress={() => deleteDraft(draft.id)}
                        style={{ padding: 6 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>

              <Pressable 
                style={[styles.modalButton, { backgroundColor: theme.primary, width: '100%', height: 48, borderRadius: BorderRadius.xl, marginBottom: 10, opacity: isSavingDraft ? 0.6 : 1 }]} 
                disabled={isSavingDraft}
                onPress={async () => {
                  await handleSaveDraft();
                }}
              >
                <Ionicons name="save-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <ThemedText style={{ color: '#fff', fontFamily: 'Sora_700Bold', fontSize: 13 }}>Save Current Form as Draft</ThemedText>
              </Pressable>
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
    fontFamily: 'Sora_700Bold',
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
  },
  dateInput: {
    height: 38,
  },
  textArea: {
    height: 96,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
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
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 5,
    marginBottom: 5,
  },
  chipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 4,
  },
  skillText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9.5,
    marginHorizontal: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayChipText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
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
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  previewName: {
    fontFamily: 'Sora_700Bold',
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
    fontFamily: 'Sora_600SemiBold',
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
    fontFamily: 'Sora_700Bold',
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
});
