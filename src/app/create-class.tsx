import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SPORTS_LIST } from '@/constants/sports';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
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
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 — Class Info
  const [className, setClassName] = useState('');
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
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleNext = () => {
    if (currentStep === 0 && (!className || !sportType || !classType)) {
      triggerToast('Please fill class name, sport, and class type.');
      return;
    }
    if (currentStep === 1 && Object.values(selectedDays).every(v => !v)) {
      triggerToast('Please select at least one day.');
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  };

  const handlePublish = () => {
    Alert.alert(
      'Class Published! 🎓',
      `"${className || 'Your Class'}" is now live. Students can enrol now.`,
      [{ text: 'Done', onPress: () => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }}]
    );
  };

  const handleSaveDraft = () => {
    triggerToast('Draft saved successfully!');
  };

  // ─── Step Renderers ────────────────────────────────────────────────────────

  const renderStepOne = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
      {/* Class Name */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Class Name</ThemedText>
        <TextInput
          value={className}
          onChangeText={setClassName}
          placeholder="e.g. Elite Football Academy U16"
          placeholderTextColor={theme.textSecondary + '77'}
          style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
        />
      </View>

      {/* Sport Type */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Sport</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {SPORTS_LIST.map(sport => {
            const isActive = sportType === sport.name;
            return (
              <Pressable
                key={sport.name}
                onPress={() => setSportType(sport.name)}
                style={[
                  styles.chip,
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
                <ThemedText style={[styles.chipText, { color: isActive ? '#fff' : theme.textSecondary }]}>{sport.name}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Class Type */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Class Type</ThemedText>
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
              <Ionicons name={s.icon as any} size={20} color={skillLevel === s.key ? theme.primary : theme.textSecondary} />
              <ThemedText style={[styles.skillText, { color: skillLevel === s.key ? theme.primary : theme.text }]}>{s.label}</ThemedText>
              {skillLevel === s.key && <Ionicons name="checkmark-circle" size={14} color={theme.primary} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Max Students */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Max Students</ThemedText>
        <TextInput
          value={maxStudents}
          onChangeText={setMaxStudents}
          keyboardType="number-pad"
          placeholder="e.g. 20"
          placeholderTextColor={theme.textSecondary + '77'}
          style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
        />
      </View>
      </View>
    </ScrollView>
  );

  const renderStepTwo = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
      {/* Start / End Date */}
      <View style={styles.rowFields}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.fieldLabel}>Start Date</ThemedText>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="DD / MM / YYYY"
            placeholderTextColor={theme.textSecondary + '77'}
            style={[styles.input, styles.dateInput, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
          />
        </View>
        <View style={{ width: Spacing.md }} />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.fieldLabel}>End Date</ThemedText>
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="DD / MM / YYYY"
            placeholderTextColor={theme.textSecondary + '77'}
            style={[styles.input, styles.dateInput, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
          />
        </View>
      </View>

      {/* Days of Week */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Recurring Days</ThemedText>
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
        <ThemedText style={styles.fieldLabel}>Session Time</ThemedText>
        {Object.entries(SESSION_GROUPS).map(([groupName, times]) => (
          <View key={groupName} style={{ marginBottom: Spacing.sm }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 4, textTransform: 'none' }]}>{groupName}</ThemedText>
            <View style={styles.chipRow}>
              {times.map(t => (
                <Pressable
                  key={t}
                  onPress={() => setSessionTime(t)}
                  style={[
                    styles.sessionChip,
                    { backgroundColor: sessionTime === t ? theme.primary : theme.surfaceLow, borderColor: sessionTime === t ? theme.primary : theme.outlineVariant + '44' }
                  ]}
                >
                  <ThemedText style={[styles.sessionChipText, { color: sessionTime === t ? '#fff' : theme.textSecondary }]}>{t}</ThemedText>
                </Pressable>
              ))}
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
              onPress={() => setSessionDuration(d)}
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
        <ThemedText style={styles.fieldLabel}>Venue / Ground</ThemedText>
        <TextInput
          value={venue}
          onChangeText={setVenue}
          placeholder="e.g. Wembley Training Grounds, London"
          placeholderTextColor={theme.textSecondary + '77'}
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
          </View>
          <View style={[styles.previewBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <ThemedText style={styles.previewBadgeText}>{sportType || '—'}</ThemedText>
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
            <ThemedText style={styles.previewMetaText}>{sessionTime || '—'} · {sessionDuration}</ThemedText>
          </View>
        </View>
      </View>

      {/* Fee Structure */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Fee Structure</ThemedText>
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
        <ThemedText style={styles.fieldLabel}>Fee Amount (₹)</ThemedText>
        <TextInput
          value={feeAmount}
          onChangeText={setFeeAmount}
          keyboardType="decimal-pad"
          placeholder="e.g. 2500"
          placeholderTextColor={theme.textSecondary + '77'}
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
          placeholderTextColor={theme.textSecondary + '77'}
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
          style={[styles.draftBtn, { borderColor: theme.outlineVariant }]}
        >
          <Ionicons name="document-text-outline" size={16} color={theme.text} />
          <ThemedText style={[styles.draftBtnText, { color: theme.text }]}>Save Draft</ThemedText>
        </Pressable>
        <Pressable
          onPress={handlePublish}
          style={[styles.publishBtn, { backgroundColor: theme.primary }]}
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
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Create Class
          </ThemedText>
          <View style={[styles.stepBadge, { backgroundColor: theme.primary + '15' }]}>
            <ThemedText style={[styles.stepBadgeText, { color: theme.primary }]}>
              Step {currentStep + 1}/{STEPS.length}
            </ThemedText>
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
                  <Pressable style={styles.stepItem} onPress={() => setCurrentStep(idx)}>
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
                        fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_500Medium' }
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
                <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13, marginLeft: 4 }}>Back</ThemedText>
              </Pressable>
            )}
            <Pressable onPress={handleNext} style={[styles.navBtnFill, { backgroundColor: theme.primary, marginLeft: currentStep > 0 ? Spacing.sm : 0 }]}>
              <ThemedText style={{ color: '#fff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 13, marginRight: 4 }}>
                {currentStep === 1 ? 'Preview & Publish' : 'Next'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Toast */}
        {toastMsg && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: theme.primaryContainer }]}>
            <ThemedText style={{ color: '#fff', fontSize: 12, fontFamily: 'HankenGrotesk_600SemiBold' }}>{toastMsg}</ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  backBtn: { padding: 4 },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 40,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.7,
    marginBottom: Spacing.xs,
    color: '#81919c',
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    borderWidth: 1,
    fontFamily: 'HankenGrotesk_500Medium',
  },
  dateInput: {
    height: 42,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  sessionChipText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 10,
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  previewName: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 20,
    color: '#ffffff',
    lineHeight: 26,
  },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  previewBadgeText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
    color: '#ffffff',
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
    fontFamily: 'HankenGrotesk_500Medium',
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
    fontFamily: 'HankenGrotesk_600SemiBold',
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
    fontFamily: 'HankenGrotesk_700Bold',
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
});
