import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEPS = [
  { title: 'Basic', icon: 'information-circle-outline' },
  { title: 'Schedule', icon: 'calendar-outline' },
  { title: 'Venue', icon: 'map-outline' },
  { title: 'Rules', icon: 'document-text-outline' },
  { title: 'Fees', icon: 'cash-outline' },
  { title: 'Prizes', icon: 'trophy-outline' },
];

export default function CreateTournamentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Form Fields State
  const [form, setForm] = useState({
    // Section 1: Basic
    name: '',
    description: '',
    sportType: 'Football', // Football, Cricket, Tennis
    tournamentType: 'Knockout', // Knockout, League, Round Robin
    organizerName: '',
    organizerContact: '',
    
    // Section 2: Schedule
    regStart: '2026-06-12',
    regEnd: '2026-06-25',
    tournStart: '2026-07-01',
    tournEnd: '2026-07-15',
    
    // Section 3: Venue
    selectedGround: 'Elms Field Ground A',
    address: 'Elms Road, London SE1',
    latLng: '51.5074° N, 0.1278° W',
    
    // Section 4: Rules
    matchDuration: '90 Mins',
    teamSize: '11 players',
    overs: 'N/A',
    pointSystem: '3 pts Win, 1 pt Draw, 0 pts Loss',
    
    // Section 5: Fees
    entryFee: '₹150',
    registrationFee: '₹25',
    deposit: '₹50',
    
    // Section 6: Prizes
    winnerPrize: '₹2,500 + Gold Trophy',
    runnerPrize: '₹1,000 + Silver Medal',
    mvpPrize: '₹200 + Boot Trophy',
  });

  // Action feedback toasts
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

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

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSaveDraft = () => {
    triggerToast('Draft saved successfully!');
  };

  const handlePublish = () => {
    // Validation check
    if (!form.name || !form.organizerName) {
      triggerToast('Please fill out Name and Organizer fields.');
      setCurrentStep(0); // Go to step 1
      return;
    }
    
    triggerToast('Tournament published successfully!');
    setTimeout(() => {
      router.replace('/tournaments');
    }, 1000);
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Step render functions
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepFormContainer}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Basic Information</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Tournament Name *</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. London Summer Slam"
                placeholderTextColor={theme.textSecondary}
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.textArea, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="Describe your tournament, match timings, general guidelines..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                value={form.description}
                onChangeText={(v) => updateField('description', v)}
              />
            </View>

            <View style={styles.rowBetween}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Sport Type</ThemedText>
                <View style={styles.selectorRow}>
                  {['Football', 'Cricket', 'Tennis'].map(s => (
                    <Pressable
                      key={s}
                      onPress={() => updateField('sportType', s)}
                      style={[
                        styles.selectorPill,
                        { backgroundColor: theme.surfaceLow },
                        form.sportType === s && { backgroundColor: theme.primary }
                      ]}
                    >
                      <ThemedText type="labelSm" style={{ color: form.sportType === s ? '#ffffff' : theme.text, fontSize: 10 }}>
                        {s}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Tournament Type</ThemedText>
                <View style={styles.selectorRow}>
                  {['Knockout', 'League'].map(t => (
                    <Pressable
                      key={t}
                      onPress={() => updateField('tournamentType', t)}
                      style={[
                        styles.selectorPill,
                        { backgroundColor: theme.surfaceLow },
                        form.tournamentType === t && { backgroundColor: theme.primary }
                      ]}
                    >
                      <ThemedText type="labelSm" style={{ color: form.tournamentType === t ? '#ffffff' : theme.text, fontSize: 10 }}>
                        {t}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Organizer Name *</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. Apex Sports Club"
                placeholderTextColor={theme.textSecondary}
                value={form.organizerName}
                onChangeText={(v) => updateField('organizerName', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Organizer Contact (Phone / Email)</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. organizer@apexsports.com"
                placeholderTextColor={theme.textSecondary}
                value={form.organizerContact}
                onChangeText={(v) => updateField('organizerContact', v)}
              />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepFormContainer}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Schedule Dates</ThemedText>
            
            <View style={styles.rowBetween}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Registration Start</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  value={form.regStart}
                  onChangeText={(v) => updateField('regStart', v)}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Registration End</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  value={form.regEnd}
                  onChangeText={(v) => updateField('regEnd', v)}
                />
              </View>
            </View>

            <View style={styles.rowBetween}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Tournament Start</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  value={form.tournStart}
                  onChangeText={(v) => updateField('tournStart', v)}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Tournament End</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  value={form.tournEnd}
                  onChangeText={(v) => updateField('tournEnd', v)}
                />
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepFormContainer}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Venue Selector</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Ground / Pitch Selection</ThemedText>
              <View style={styles.selectorRowVertical}>
                {['Elms Field Ground A', 'Regents Cricket Oval', 'West London Multi-Turf'].map(g => (
                  <Pressable
                    key={g}
                    onPress={() => updateField('selectedGround', g)}
                    style={[
                      styles.verticalSelectBtn,
                      { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant },
                      form.selectedGround === g && { backgroundColor: theme.surface, borderColor: theme.secondaryContainer, borderWidth: 2 }
                    ]}
                  >
                    <Ionicons name="checkbox" size={18} color={form.selectedGround === g ? theme.secondaryContainer : theme.outlineVariant} />
                    <ThemedText type="bodySm" style={{ marginLeft: 8, color: theme.text, fontWeight: form.selectedGround === g ? 'bold' : 'normal' }}>{g}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Detailed Address</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                value={form.address}
                onChangeText={(v) => updateField('address', v)}
              />
            </View>

            {/* Map Mock Integration Graphic */}
            <View style={[styles.mapMockContainer, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant }]}>
              <View style={styles.mapGridOverlay}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.mapGridRow} />
                ))}
              </View>
              <View style={[styles.mapMarker, { backgroundColor: theme.secondaryContainer }]}>
                <Ionicons name="location" size={24} color="#ffffff" />
              </View>
              <View style={styles.mapBadge}>
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10 }}>MAP LOCATION PREVIEW</ThemedText>
                <ThemedText type="labelSm" style={{ color: theme.secondaryContainer, fontSize: 9, fontWeight: 'bold' }}>{form.latLng}</ThemedText>
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepFormContainer}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Rules & Point Systems</ThemedText>
            
            <View style={styles.rowBetween}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Match Duration</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="e.g. 90 mins"
                  value={form.matchDuration}
                  onChangeText={(v) => updateField('matchDuration', v)}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Team Size</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="e.g. 11 players"
                  value={form.teamSize}
                  onChangeText={(v) => updateField('teamSize', v)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Overs / Format Rules (if Cricket)</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. 20 Overs, Max 4 overs per bowler"
                value={form.overs}
                onChangeText={(v) => updateField('overs', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Points / Qualification Rules</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. 3 pts for Win, 1 pt Draw"
                value={form.pointSystem}
                onChangeText={(v) => updateField('pointSystem', v)}
              />
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepFormContainer}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Fees Details</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Entry Fee (per Team)</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. ₹150"
                value={form.entryFee}
                onChangeText={(v) => updateField('entryFee', v)}
              />
            </View>

            <View style={styles.rowBetween}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Admin / Reg Fee</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="e.g. ₹25"
                  value={form.registrationFee}
                  onChangeText={(v) => updateField('registrationFee', v)}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <ThemedText type="labelSm" style={styles.inputLabel}>Security Deposit</ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                  placeholder="e.g. ₹50"
                  value={form.deposit}
                  onChangeText={(v) => updateField('deposit', v)}
                />
              </View>
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepFormContainer}>
            <ThemedText type="headlineSm" style={styles.sectionTitle}>Prizes & Rewards</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>First Prize (Winner)</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. ₹2,500 + Cup"
                value={form.winnerPrize}
                onChangeText={(v) => updateField('winnerPrize', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Runner-Up Prize</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. ₹1,000 + Medals"
                value={form.runnerPrize}
                onChangeText={(v) => updateField('runnerPrize', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="labelSm" style={styles.inputLabel}>Individual MVPs / Other Awards</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.outlineVariant, color: theme.text }]}
                placeholder="e.g. MVP ₹200, Golden Boot"
                value={form.mvpPrize}
                onChangeText={(v) => updateField('mvpPrize', v)}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Stack Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineMd" style={{ color: theme.text, flex: 1, marginLeft: 12 }}>
            Create Tournament
          </ThemedText>
          <Pressable style={styles.draftBtn} onPress={handleSaveDraft}>
            <ThemedText type="labelSm" style={{ color: theme.secondaryContainer }}>Save Draft</ThemedText>
          </Pressable>
        </View>

        {/* Horizontal Wizard Progress Tracker - Premium Compact Design */}
        <View style={[styles.progressTracker, { backgroundColor: theme.surfaceLow }]}>
          <View style={styles.wizardContainer}>
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPassed = idx < currentStep;
              return (
                <React.Fragment key={step.title}>
                  <View style={styles.wizardStepCompact}>
                    <View style={[
                      styles.wizardIconCircle,
                      { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant },
                      isPassed && { backgroundColor: theme.primary, borderColor: theme.primary },
                      isActive && { backgroundColor: theme.secondaryContainer, borderColor: theme.secondaryContainer }
                    ]}>
                      <Ionicons 
                        name={(isPassed ? 'checkmark' : step.icon) as any} 
                        size={14} 
                        color={isActive ? '#6b4500' : isPassed ? '#ffffff' : theme.textSecondary} 
                      />
                    </View>
                  </View>
                  {idx < STEPS.length - 1 && (
                    <View style={[
                      styles.wizardLineCompact, 
                      { backgroundColor: isPassed ? theme.primary : theme.outlineVariant }
                    ]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <ThemedText 
            type="labelSm" 
            style={[styles.wizardActiveLabel, { color: theme.text }]}
          >
            {`Step ${currentStep + 1} of 6: ${STEPS[currentStep].title}`}
          </ThemedText>
        </View>

        {/* Wizard Form Area */}
        <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer controls */}
        <View style={[styles.footer, { borderTopColor: theme.outlineVariant + '33' }]}>
          {currentStep > 0 && (
            <Pressable style={[styles.footerBackBtn, { borderColor: theme.outlineVariant }]} onPress={handleBack}>
              <ThemedText type="labelSm" style={{ color: theme.text }}>Back</ThemedText>
            </Pressable>
          )}
          
          <View style={{ flex: 1 }} />

          {currentStep < STEPS.length - 1 ? (
            <Pressable style={[styles.footerNextBtn, { backgroundColor: theme.primary }]} onPress={handleNext}>
              <ThemedText type="labelSm" style={{ color: '#ffffff' }}>Next Step</ThemedText>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </Pressable>
          ) : (
            <Pressable style={[styles.footerNextBtn, { backgroundColor: theme.secondaryContainer }]} onPress={handlePublish}>
              <Ionicons name="cloud-upload-outline" size={16} color="#6b4500" style={{ marginRight: 4 }} />
              <ThemedText type="labelSm" style={{ color: '#6b4500', fontWeight: 'bold' }}>Publish Tournament</ThemedText>
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
    </ThemedView>
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
    paddingVertical: Spacing.md,
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
  progressTracker: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing.containerMargin,
  },
  wizardStepCompact: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardLineCompact: {
    flex: 1,
    height: 2,
    maxHeight: 2,
    minWidth: 10,
    maxWidth: 30,
    marginHorizontal: 4,
  },
  wizardActiveLabel: {
    marginTop: 8,
    fontFamily: 'HankenGrotesk_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    textAlign: 'center',
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
  },
  stepFormContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 14,
    fontFamily: 'HankenGrotesk_400Regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'HankenGrotesk_400Regular',
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
  mapBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(5, 21, 30, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  footerBackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
  },
  footerNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
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
});
