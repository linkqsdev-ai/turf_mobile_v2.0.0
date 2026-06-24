import React, { useState, useRef } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { SPORTS_LIST } from '@/constants/sports';
import { useTheme } from '@/hooks/use-theme';
import { useTurfStore } from '@/store/app-store';

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Turf Info', icon: 'football-outline' },
  { title: 'Time Slots', icon: 'time-outline' },
  { title: 'Publish', icon: 'checkmark-circle-outline' },
];

const SURFACE_TYPES = ['Natural Grass', 'Artificial Turf', 'Concrete', 'Wooden Court', 'Clay'];
const SLOT_DURATIONS = ['30 min', '60 min', '90 min'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Expanded from 4 AM to 11 PM to accommodate weekend early slots
const TIME_BLOCKS = [
  '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM',
  '8 PM', '9 PM', '10 PM', '11 PM',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKENDS = ['Sat', 'Sun'];

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

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=400&q=80',
];

interface TurfImage {
  uri: string;
  isThumbnail: boolean;
}

type SlotState = 'available' | 'blocked' | 'maintenance' | undefined;

const WEB_INPUT: any = Platform.OS === 'web'
  ? { outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' }
  : {};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateTurfScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { addTurf } = useTurfStore();

  // Step 1
  const [turfName, setTurfName] = useState('');
  const [sportType, setSportType] = useState('');
  const [surfaceType, setSurfaceType] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState('Canary Wharf, East London, E14 5AB');
  const [manualAddress, setManualAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [pricePerSlot, setPricePerSlot] = useState('');
  const [turfImages, setTurfImages] = useState<(TurfImage | null)[]>([null, null, null]);

  // Step 2
  const [slotDuration, setSlotDuration] = useState('60 min');
  // Record key: `${day}-${time}`
  const [slotsMap, setSlotsMap] = useState<Record<string, SlotState>>({});
  const [slotDay, setSlotDay] = useState('Mon');
  const [editMode, setEditMode] = useState<SlotState>('available');

  // Step 3
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);

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

  const handleDetectLocation = () => {
    setDetectedLocation('Fetching GPS…');
    setTimeout(() => setDetectedLocation('Canary Wharf, East London, E14 5AB'), 1200);
  };

  const uploadImage = (slotIndex: number) => {
    const uri = SAMPLE_IMAGES[slotIndex % SAMPLE_IMAGES.length];
    setTurfImages(prev => {
      const next = [...prev];
      const hasThumb = next.some(i => i?.isThumbnail);
      next[slotIndex] = { uri, isThumbnail: !hasThumb };
      return next;
    });
  };

  const removeImage = (slotIndex: number) => {
    setTurfImages(prev => {
      const next = [...prev];
      const wasThumb = next[slotIndex]?.isThumbnail;
      next[slotIndex] = null;
      if (wasThumb) {
        const firstFilled = next.findIndex(i => i !== null);
        if (firstFilled !== -1) next[firstFilled] = { ...next[firstFilled]!, isThumbnail: true };
      }
      return next;
    });
  };

  const setThumbnail = (slotIndex: number) => {
    setTurfImages(prev => prev.map((img, i) => img ? { ...img, isThumbnail: i === slotIndex } : null));
  };

  // ─── Slot Management ─────────────────────────────────────────────────────

  const toggleSlot = (day: string, time: string) => {
    const key = `${day}-${time}`;
    setSlotsMap(prev => {
      const currentState = prev[key];
      // If tapping a slot that already has the current editMode state, clear it
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

  const applyBulkSlots = (days: string[], startHour: number, endHour: number) => {
    const startIndex = TIME_BLOCKS.findIndex(t => t.startsWith(`${startHour}`));
    const endIndex = TIME_BLOCKS.findIndex(t => t.startsWith(`${endHour}`));
    if (startIndex === -1 || endIndex === -1) return;

    setSlotsMap(prev => {
      const next = { ...prev };
      days.forEach(day => {
        for (let i = startIndex; i <= endIndex; i++) {
          next[`${day}-${TIME_BLOCKS[i]}`] = 'available';
        }
      });
      return next;
    });
    triggerToast(`Applied slots to ${days.length > 2 ? 'Weekdays' : 'Weekends'}`);
  };

  const handleNext = () => {
    if (currentStep === 0 && (!turfName || !sportType)) {
      triggerToast('Please fill in Turf Name and select a Sport Type.');
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
    // Save to global turf store
    const address = useCurrentLocation ? detectedLocation : manualAddress;
    addTurf({
      name: turfName || 'My Turf',
      sportType: sportType || 'Football',
      address: address || '',
      pricePerSlot: parseFloat(pricePerSlot || '0'),
      contactNumber: contactNumber || '',
      slots: Object.entries(slotsMap).map(([key, status]) => {
        const [day, time] = key.split('-');
        return { day, time, status: status as 'available' | 'blocked' | 'maintenance' };
      }),
      amenities: amenities,
      images: turfImages.filter(Boolean).map(img => img!.uri),
      thumbnailImage: turfImages.find(img => img?.isThumbnail)?.uri || turfImages.find(Boolean)?.uri || '',
      description: description || '',
      ownerId: 'current-user',
    });

    // Navigate back on success
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  // ─── Renderers ───────────────────────────────────────────────────────────

  const renderStepOne = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={[styles.formCard, { backgroundColor: theme.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }]}>
      {/* Photos */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <ThemedText style={styles.fieldLabel}>Turf Photos</ThemedText>
          <ThemedText style={[styles.fieldLabelSub, { color: theme.textSecondary }]}>Tap cover (★) to set thumbnail</ThemedText>
        </View>

        <View style={styles.imageGrid}>
          {turfImages.map((img, idx) => {
            if (img) {
              return (
                <View key={idx} style={[styles.imageSlot, { borderColor: img.isThumbnail ? theme.primary : theme.outlineVariant + '44' }]}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} contentFit="cover" />
                  {img.isThumbnail && (
                    <View style={[styles.thumbBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="star" size={8} color="#fff" />
                      <ThemedText style={styles.thumbBadgeText}>Cover</ThemedText>
                    </View>
                  )}
                  <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                    {!img.isThumbnail && (
                      <Pressable onPress={() => setThumbnail(idx)} style={[styles.imgActionBtn, { backgroundColor: theme.primary }]}>
                        <Ionicons name="star-outline" size={10} color="#fff" />
                        <ThemedText style={styles.imgActionText}>Cover</ThemedText>
                      </Pressable>
                    )}
                    <Pressable onPress={() => removeImage(idx)} style={[styles.imgActionBtn, { backgroundColor: '#ef4444cc' }]}>
                      <Ionicons name="trash-outline" size={10} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              );
            }
            return (
              <Pressable
                key={idx}
                onPress={() => uploadImage(idx)}
                style={[styles.imageSlot, styles.imagePlaceholder, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}
              >
                <View style={[styles.uploadIconWrap, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="camera-outline" size={22} color={theme.primary} />
                </View>
                <ThemedText style={[styles.uploadLabel, { color: theme.primary }]}>Upload</ThemedText>
                <ThemedText style={[styles.uploadHint, { color: theme.textSecondary }]}>Photo {idx + 1}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Info */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Turf Name</ThemedText>
        <TextInput value={turfName} onChangeText={setTurfName} placeholder="e.g. Skyline Football Arena" placeholderTextColor={theme.textSecondary + '77'} style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }, WEB_INPUT]} />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Sport Type</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {SPORTS_LIST.map(sport => {
            const isActive = sportType === sport.name;
            return (
              <Pressable
                key={sport.name}
                onPress={() => setSportType(sport.name)}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                  isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                <MaterialIcons name={sport.icon as any} size={12} color={isActive ? theme.surface : theme.textSecondary} style={{ marginRight: 4 }} />
                <ThemedText style={{ color: isActive ? theme.surface : theme.textSecondary, fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 0.2 }}>{sport.name}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Surface Type</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {SURFACE_TYPES.map(s => {
            const isActive = surfaceType === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSurfaceType(s)}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                  isActive && { backgroundColor: theme.secondary, borderColor: theme.secondary }
                ]}
              >
                <ThemedText style={{ color: isActive ? '#ffffff' : theme.textSecondary, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10, letterSpacing: 0.2 }}>{s}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <ThemedText style={styles.fieldLabel}>Location</ThemedText>
          <Pressable onPress={() => { const next = !useCurrentLocation; setUseCurrentLocation(next); if (next) handleDetectLocation(); }} style={[styles.togglePill, { backgroundColor: useCurrentLocation ? theme.primary + '18' : theme.surfaceLow, borderColor: useCurrentLocation ? theme.primary + '44' : theme.outlineVariant + '33' }]}>
            <Ionicons name={useCurrentLocation ? 'locate' : 'create-outline'} size={11} color={useCurrentLocation ? theme.primary : theme.textSecondary} />
            <ThemedText style={[styles.togglePillText, { color: useCurrentLocation ? theme.primary : theme.textSecondary }]}>{useCurrentLocation ? 'Current Location' : 'Enter Address'}</ThemedText>
          </Pressable>
        </View>

        {useCurrentLocation ? (
          <Pressable onPress={handleDetectLocation} style={[styles.locationCard, { backgroundColor: theme.surfaceLow, borderColor: theme.primary + '33' }]}>
            <View style={[styles.locationIconBg, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="navigate" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{detectedLocation}</ThemedText>
              <ThemedText style={[styles.locationHint, { color: theme.textSecondary }]}>Tap to refresh GPS location</ThemedText>
            </View>
            <Ionicons name="refresh-outline" size={16} color={theme.primary} />
          </Pressable>
        ) : (
          <TextInput value={manualAddress} onChangeText={setManualAddress} placeholder="e.g. 12 East London, E1 6RF" placeholderTextColor={theme.textSecondary + '77'} style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }, WEB_INPUT]} />
        )}
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Contact Number</ThemedText>
        <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
          <Ionicons name="call-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput value={contactNumber} onChangeText={setContactNumber} placeholder="e.g. +91 98765 43210" placeholderTextColor={theme.textSecondary + '77'} keyboardType="phone-pad" style={[styles.inputRowInner, { color: theme.text }, WEB_INPUT]} />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Price / Slot (₹)</ThemedText>
        <View style={[styles.inputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
          <ThemedText style={[styles.currencyPrefix, { color: theme.secondary }]}>₹</ThemedText>
          <TextInput value={pricePerSlot} onChangeText={setPricePerSlot} keyboardType="decimal-pad" placeholder="e.g. 1200" placeholderTextColor={theme.textSecondary + '77'} style={[styles.inputRowInner, { color: theme.text }, WEB_INPUT]} />
          <ThemedText style={[styles.inputSuffix, { color: theme.textSecondary }]}>per slot</ThemedText>
        </View>
      </View>
      </View>
    </ScrollView>
  );

  const renderStepTwo = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <View style={{ paddingHorizontal: Spacing.containerMargin }}>
        {/* Slot Duration */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Slot Duration</ThemedText>
          <View style={styles.filterRow}>
            {SLOT_DURATIONS.map(d => {
              const isActive = slotDuration === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setSlotDuration(d)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: isActive ? theme.primary : theme.surfaceLow, borderColor: isActive ? theme.primary : theme.outlineVariant + '44' },
                  ]}
                >
                  <ThemedText style={{ color: isActive ? '#fff' : theme.textSecondary, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10 }}>
                    {d}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Quick Defaults */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Quick Setup</ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Pressable
              onPress={() => applyBulkSlots(WEEKDAYS, 6, 11)}
              style={[styles.bulkBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}
            >
              <Ionicons name="sunny-outline" size={14} color={theme.primary} />
              <ThemedText style={[styles.bulkBtnText, { color: theme.text }]}>Weekdays (6 AM - 11 PM)</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => applyBulkSlots(WEEKENDS, 4, 11)}
              style={[styles.bulkBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}
            >
              <Ionicons name="partly-sunny-outline" size={14} color={theme.secondary} />
              <ThemedText style={[styles.bulkBtnText, { color: theme.text }]}>Weekends (4 AM - 11 PM)</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Day Tabs */}
        <View style={styles.fieldGroup}>
          <ThemedText style={styles.fieldLabel}>Configure Days & Slots</ThemedText>
          <View style={styles.dayTabRow}>
            {DAYS.map(day => {
              const count = TIME_BLOCKS.filter(t => slotsMap[`${day}-${t}`] !== undefined).length;
              const isSelected = slotDay === day;
              return (
                <Pressable
                  key={day}
                  onPress={() => setSlotDay(day)}
                  style={[
                    styles.dayTab,
                    { backgroundColor: isSelected ? theme.primary : theme.surfaceLow, borderColor: isSelected ? theme.primary : theme.outlineVariant + '44' },
                  ]}
                >
                  <ThemedText style={[styles.dayTabText, { color: isSelected ? '#fff' : theme.textSecondary }]}>{day}</ThemedText>
                  {count > 0 && (
                    <View style={[styles.dayTabBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : theme.primaryContainer }]}>
                      <ThemedText style={[styles.dayTabBadgeText, { color: isSelected ? '#fff' : theme.primary }]}>{count}</ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Edit Mode Toolbar */}
          <View style={[styles.editToolbar, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
            <ThemedText style={[styles.editToolbarText, { color: theme.textSecondary }]}>Set mode:</ThemedText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['available', 'blocked', 'maintenance'] as SlotState[]).map((mode) => {
                const isActive = editMode === mode;
                let activeColor: string = theme.primary;
                let label = 'Available';
                if (mode === 'blocked') { activeColor = '#ef4444'; label = 'Blocked'; }
                if (mode === 'maintenance') { activeColor = '#f59e0b'; label = 'Maintenance'; }

                return (
                  <Pressable
                    key={mode}
                    onPress={() => setEditMode(mode)}
                    style={[
                      styles.modeBtn,
                      { backgroundColor: isActive ? activeColor : 'transparent', borderColor: isActive ? activeColor : theme.outlineVariant + '44' }
                    ]}
                  >
                    <View style={[styles.modeDot, { backgroundColor: isActive ? '#fff' : activeColor }]} />
                    <ThemedText style={[styles.modeBtnText, { color: isActive ? '#fff' : theme.textSecondary }]}>{label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Slot Grid */}
          <View style={styles.slotGrid}>
            {TIME_BLOCKS.map(time => {
              const state = slotsMap[`${slotDay}-${time}`];
              
              let bgColor: string = theme.surfaceLow;
              let borderColor: string = theme.outlineVariant + '33';
              let textColor: string = theme.textSecondary;

              if (state === 'available') {
                bgColor = theme.primary; borderColor = theme.primary; textColor = '#fff';
              } else if (state === 'blocked') {
                bgColor = '#ef4444'; borderColor = '#ef4444'; textColor = '#fff';
              } else if (state === 'maintenance') {
                bgColor = '#f59e0b'; borderColor = '#f59e0b'; textColor = '#fff';
              }

              return (
                <Pressable
                  key={time}
                  onPress={() => toggleSlot(slotDay, time)}
                  style={[
                    styles.slotCell,
                    { backgroundColor: bgColor, borderColor: borderColor },
                  ]}
                >
                  <ThemedText style={[styles.slotCellText, { color: textColor }]}>{time}</ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
            Select a mode above, then tap slots to apply. Tap again to clear.
          </ThemedText>

          {/* Save Changes Button */}
          <Pressable 
            style={[styles.publishBtn, { backgroundColor: theme.primary, marginTop: Spacing.xl, height: 48, borderRadius: BorderRadius.md }]}
            onPress={() => {
              triggerToast('Changes Saved Successfully');
            }}
          >
            <ThemedText style={[styles.publishBtnText, { fontSize: 13 }]}>Save Changes</ThemedText>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    );
  };

  const renderStepThree = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={{ paddingHorizontal: Spacing.containerMargin }}>
      {/* Preview Card */}
      <View style={[styles.previewCard, { backgroundColor: theme.primaryContainer }]}>
        <View style={styles.previewCardTop}>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.previewSuperLabel, { color: 'rgba(255,255,255,0.7)' }]}>Turf Name</ThemedText>
            <ThemedText style={styles.previewName}>{turfName || 'Untitled Turf'}</ThemedText>
          </View>
          <View style={[styles.previewBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <ThemedText style={styles.previewBadgeText}>{sportType || '—'}</ThemedText>
          </View>
        </View>
        <View style={styles.previewMeta}>
          {[
            { icon: 'location-outline', label: useCurrentLocation ? detectedLocation : (manualAddress || 'No location') },
            { icon: 'cash-outline', label: `₹${pricePerSlot || '0'} / slot` },
            { icon: 'call-outline', label: contactNumber || 'No contact' },
          ].map((item, i) => (
            <View key={i} style={styles.previewMetaItem}>
              <Ionicons name={item.icon as any} size={11} color="rgba(255,255,255,0.7)" />
              <ThemedText style={styles.previewMetaText} numberOfLines={1}>{item.label}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Star Rating */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Initial Rating</ThemedText>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <Pressable key={star} onPress={() => setRating(star)}>
              <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={28} color={star <= rating ? '#f59e0b' : theme.textSecondary} />
            </Pressable>
          ))}
          {rating > 0 && <ThemedText style={[styles.ratingLabel, { color: theme.textSecondary }]}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</ThemedText>}
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Amenities</ThemedText>
        <View style={styles.amenityGrid}>
          {AMENITIES.map(a => (
            <Pressable
              key={a.key}
              onPress={() => toggleAmenity(a.key)}
              style={[styles.amenityChip, { backgroundColor: amenities[a.key] ? theme.primary + '15' : theme.surfaceLow, borderColor: amenities[a.key] ? theme.primary : theme.outlineVariant + '44' }]}
            >
              <Ionicons name={a.icon as any} size={14} color={amenities[a.key] ? theme.primary : theme.textSecondary} />
              <ThemedText style={[styles.amenityText, { color: amenities[a.key] ? theme.primary : theme.text }]}>{a.label}</ThemedText>
              {amenities[a.key] && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <ThemedText style={styles.fieldLabel}>Turf Description</ThemedText>
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe your turf — surface, nearby landmarks, special facilities…" placeholderTextColor={theme.textSecondary + '77'} multiline numberOfLines={4} style={[styles.input, styles.textArea, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }, WEB_INPUT]} />
      </View>

      <Pressable onPress={handlePublish} style={[styles.publishBtn, { backgroundColor: theme.primary }]}>
        <Ionicons name="checkmark-circle" size={18} color="#fff" />
        <ThemedText style={styles.publishBtnText}>Publish Turf</ThemedText>
      </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <GradientContainer screenName="create-turf" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Create Turf</ThemedText>
          <View style={[styles.stepBadge, { backgroundColor: theme.primary + '15' }]}>
            <ThemedText style={[styles.stepBadgeText, { color: theme.primary }]}>Step {currentStep + 1}/{STEPS.length}</ThemedText>
          </View>
        </View>

        {/* Step Tracker */}
        <View style={styles.progressTrackerCard}>
          <View style={styles.stepRow}>
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              return (
                <React.Fragment key={step.title}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, isDone ? { backgroundColor: theme.primary, borderColor: theme.primary } : isActive ? { backgroundColor: theme.primary + '20', borderColor: theme.primary } : { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' }]}>
                      {isDone ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Ionicons name={step.icon as any} size={12} color={isActive ? theme.primary : theme.textSecondary} />}
                    </View>
                    <ThemedText style={[styles.stepLabel, { color: isActive ? theme.primary : isDone ? theme.text : theme.textSecondary, fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_500Medium' }]}>{step.title}</ThemedText>
                  </View>
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
          {currentStep === 2 && renderStepThree()}
        </View>

        {/* Bottom Nav */}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.containerMargin, paddingVertical: Spacing.sm, zIndex: 10 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 17, flex: 1, marginLeft: 10 },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  stepBadgeText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 11 },
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
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 9, letterSpacing: 0.2 },
  stepConnector: { flex: 1, height: 1.5, marginBottom: 14, marginHorizontal: 4 },
  scrollPad: { paddingBottom: 160, paddingTop: Spacing.xs },
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
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11, letterSpacing: 0.2, marginBottom: Spacing.xs, color: '#81919c' },
  fieldLabelSub: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },

  imageGrid: { flexDirection: 'row', gap: 10 },
  imageSlot: { flex: 1, height: 96, borderRadius: BorderRadius.lg, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  thumbBadge: { position: 'absolute', top: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  thumbBadgeText: { color: '#fff', fontSize: 8, fontFamily: 'HankenGrotesk_700Bold' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 5, gap: 4 },
  imgActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  imgActionText: { color: '#fff', fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 9 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 4, borderStyle: 'dashed' },
  uploadIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  uploadLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
  uploadHint: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 9 },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, height: 30, justifyContent: 'center' },

  input: { height: 48, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 14, borderWidth: 1, fontFamily: 'HankenGrotesk_500Medium' },
  inputRow: { height: 48, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  inputRowInner: { flex: 1, fontSize: 14, fontFamily: 'HankenGrotesk_500Medium' },
  textArea: { height: 96, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  currencyPrefix: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 15, marginRight: 6 },
  inputSuffix: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, marginLeft: 4 },

  togglePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  togglePillText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md },
  locationIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  locationText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 13 },
  locationHint: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 10, marginTop: 2 },

  // Bulk Apply Buttons
  bulkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1 },
  bulkBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },

  // Unified Day Tabs
  dayTabRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, marginBottom: Spacing.sm },
  dayTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginHorizontal: 2, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1 },
  dayTabText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 10 },
  dayTabBadge: { minWidth: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  dayTabBadgeText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 8 },

  // Slot Edit Mode Toolbar
  editToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm },
  editToolbarText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm, borderWidth: 1 },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeBtnText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 9 },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotCell: { width: 50, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  slotCellText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 10 },
  helperText: { fontSize: 11, lineHeight: 16, marginTop: Spacing.sm },

  previewCard: { borderRadius: BorderRadius['2xl'], padding: Spacing.lg, marginBottom: Spacing.lg },
  previewCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  previewSuperLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 9, letterSpacing: 0.4, marginBottom: 4 },
  previewName: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 20, color: '#ffffff' },
  previewBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  previewBadgeText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 11, color: '#ffffff' },
  previewMeta: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  previewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewMetaText: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  starRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingLabel: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, marginLeft: 4 },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: BorderRadius.xl, borderWidth: 1 },
  amenityText: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.xl, gap: Spacing.xs, marginTop: Spacing.md },
  publishBtnText: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 14, color: '#ffffff' },
  bottomNav: { flexDirection: 'row', padding: Spacing.md, paddingHorizontal: Spacing.containerMargin, borderTopWidth: 1 },
  navBtnOutline: { flex: 1, flexDirection: 'row', height: 48, borderRadius: BorderRadius.xl, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  navBtnFill: { flex: 2, flexDirection: 'row', height: 48, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', bottom: 80, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.full },
});
