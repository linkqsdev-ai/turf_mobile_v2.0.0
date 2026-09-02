import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SPORTS_LIST } from '@/constants/sports';
import { MaterialIcons } from '@expo/vector-icons';
import { useTournamentStore } from '@/store/app-store';
import { generateTournamentId } from '@/store/tournament-store';

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
  const { addTournament } = useTournamentStore();

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

  // Custom cover image & date picker states
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
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
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tournaments');
      }
    }
  };

  const handleSaveDraft = () => {
    const draftId = `draft-${Date.now()}`;
    const newDraft = {
      ...form,
      id: draftId,
      name: form.name || 'Untitled Draft'
    };
    setDrafts(prev => [newDraft, ...prev]);
    triggerToast('Draft saved successfully!');
  };

  const handleSelectDraft = (draft: any) => {
    setForm(draft);
    setDraftsModalVisible(false);
    triggerToast(`Loaded draft: ${draft.name}`);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    triggerToast('Draft deleted.');
  };

  const handlePublish = () => {
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

    // Save to global tournament store
    addTournament({
      id: generateTournamentId(),
      name: form.name,
      sport: form.sportType || 'Football',
      type: form.tournamentType || 'Knockout',
      location: form.selectedGround || 'TBD',
      startDate: form.tournStart || '',
      endDate: form.tournEnd || '',
      prizePool: form.winnerPrize ? `₹${form.winnerPrize}` : 'TBD',
      prizePoolAmount: parseInt(form.winnerPrize || '0', 10),
      entryFee: parseInt(form.entryFee || '0', 10),
      maxTeams: 16,
      teamsCount: 0,
      banner: form.banner || null,
      organizerName: form.organizerName,
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
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepFormContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament name *</ThemedText>
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
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tournament cover image</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {/* Custom Image Upload Option */}
                <Pressable
                  onPress={pickCoverImage}
                  style={[
                    styles.coverPresetCard,
                    { 
                      borderColor: (typeof form.banner === 'object' && form.banner && 'uri' in form.banner) ? theme.primary : '#00000033', 
                      backgroundColor: theme.surfaceLow 
                    }
                  ]}
                >
                  {customImageUri ? (
                    <Image source={{ uri: customImageUri }} style={styles.coverPresetThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.coverPresetThumb, { backgroundColor: theme.surfaceLow, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="cloud-upload-outline" size={18} color={theme.textSecondary} />
                    </View>
                  )}
                  <ThemedText style={[styles.coverPresetLabel, { color: (typeof form.banner === 'object' && form.banner && 'uri' in form.banner) ? theme.primary : theme.textSecondary }]} numberOfLines={1}>
                    {customImageUri ? 'Custom Cover' : 'Upload custom'}
                  </ThemedText>
                  {(typeof form.banner === 'object' && form.banner && 'uri' in form.banner) && (
                    <View style={[styles.coverPresetCheck, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#ffffff" />
                    </View>
                  )}
                </Pressable>

                {COVER_PRESETS.map((preset) => {
                  const isSelected = form.banner === preset.source;
                  return (
                    <Pressable
                      key={preset.name}
                      onPress={() => updateField('banner', preset.source)}
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
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Organizer name *</ThemedText>
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
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Organizer contact</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'organizerContact' ? theme.primary : '#00000033' }]}
                placeholder="e.g. +44 7900 000000"
                placeholderTextColor={theme.textSecondary + '80'}
                keyboardType="phone-pad"
                value={form.organizerContact}
                onChangeText={(v) => {
                  // Strip all non-numeric characters except +, spaces, dashes, parentheses
                  const cleaned = v.replace(/[^0-9+\s\-()]/g, '');
                  updateField('organizerContact', cleaned);
                }}
                onFocus={() => setFocusedField('organizerContact')}
                onBlur={() => setFocusedField(null)}
              />
              {form.organizerContact !== '' && form.organizerContact.replace(/[^0-9]/g, '').length < 7 && (
                <ThemedText style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>Enter a valid phone number (min 7 digits)</ThemedText>
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
                    <ThemedText style={{ marginLeft: 8, color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>{g}</ThemedText>
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
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Overs / format rules (if cricket)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: focusedField === 'overs' ? theme.primary : '#00000033' }]}
                placeholder="e.g. 20 Overs, Max 4 overs per bowler"
                placeholderTextColor={theme.textSecondary + '80'}
                value={form.overs}
                onChangeText={(v) => updateField('overs', v)}
                onFocus={() => setFocusedField('overs')}
                onBlur={() => setFocusedField(null)}
              />
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
          </View>
        );
      case 4:
        return (
          <View style={styles.stepFormContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Entry fee (per team)</ThemedText>
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
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>First prize (winner)</ThemedText>
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
            Create Tournament
          </ThemedText>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            <Pressable style={{ paddingVertical: 4, paddingLeft: 4, paddingRight: 0 }} onPress={() => setDraftsModalVisible(true)}>
              <Ionicons name="folder-open-outline" size={22} color={theme.error} />
            </Pressable>
            
            <Pressable style={[styles.draftBtn, { paddingVertical: 4, paddingLeft: 2, paddingRight: 4 }]} onPress={handleSaveDraft}>
              <ThemedText type="labelSm" style={{ color: theme.secondaryContainer, fontFamily: 'Sora_600SemiBold' }}>Save Draft</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Horizontal Wizard Progress Tracker - Premium Compact Design */}
        <View style={styles.progressTrackerCard}>
          <View style={styles.wizardContainer}>
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPassed = idx < currentStep;
              return (
                <React.Fragment key={step.title}>
                  <Pressable 
                    onPress={() => setCurrentStep(idx)}
                    style={styles.wizardStepCompact}
                  >
                    <View style={[
                      styles.wizardIconCircle,
                      { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant },
                      isPassed && { backgroundColor: theme.primary, borderColor: theme.primary },
                      isActive && { backgroundColor: theme.secondaryContainer, borderColor: theme.secondaryContainer }
                    ]}>
                      <Ionicons 
                        name={(isPassed ? 'checkmark' : step.icon) as any} 
                        size={14} 
                        color={isActive ? '#ffffff' : isPassed ? '#ffffff' : theme.textSecondary} 
                      />
                    </View>
                  </Pressable>
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
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 9, marginLeft: 4, fontWeight: '600' }}>
                    {form.sportType.toUpperCase()}
                  </ThemedText>
                </View>

                <ThemedText type="bodyLg" numberOfLines={1} style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', marginTop: 2, fontSize: 13 }}>
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
                  <ThemedText type="bodyMd" style={{ color: theme.secondary, fontFamily: 'Sora_600SemiBold', fontSize: 12, marginTop: 1 }}>
                    {form.winnerPrize ? form.winnerPrize.split(' ')[0] : 'TBD'}
                  </ThemedText>
                </View>

                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 7 }}>Entry Fee</ThemedText>
                  <ThemedText type="labelSm" style={{ color: theme.text, fontWeight: '600', fontSize: 9 }}>
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
              <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
              <ThemedText type="labelSm" style={{ color: '#ffffff', fontWeight: '600' }}>Publish Tournament</ThemedText>
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
                        <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 13 }} numberOfLines={1}>
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
                        <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 10, fontWeight: '600' }}>Load</ThemedText>
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
              <Pressable style={styles.modalCloseBtn} onPress={() => setDatePickerField(null)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Calendar Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Pressable onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))} style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pickerDate.getMonth()]} {pickerDate.getFullYear()}
              </ThemedText>
              <Pressable onPress={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))} style={{ padding: 6 }}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Days of week labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <ThemedText key={d} style={{ color: theme.textSecondary, width: 40, textAlign: 'center', fontSize: 10, fontWeight: '600' }}>
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
                      
                      return (
                        <Pressable
                          key={cIdx}
                          onPress={() => {
                            if (datePickerField) {
                              updateField(datePickerField, cellDateStr);
                            }
                            setDatePickerField(null);
                          }}
                          style={[
                            { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
                            isSelected && { backgroundColor: theme.primary }
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
  wizardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    fontFamily: 'Sora_600SemiBold',
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
    padding: Spacing.lg,
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
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Sora_400Regular',
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
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
  },
  cardSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
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
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    marginLeft: 4,
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
    fontFamily: 'Sora_600SemiBold',
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
