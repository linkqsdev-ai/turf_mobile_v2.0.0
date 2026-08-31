import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, UserProfile } from '@/hooks/use-user-profile';
import { AVATAR_IMAGES, AVATAR_KEYS, getAvatarSource } from '@/constants/avatars';
import { getCurrentGPSLocation } from '@/utils/location';

const SKILL_LEVELS: NonNullable<UserProfile['skillLevel']>[] = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];

// Lets a user switch their own role (Player / Coach / Owner / Organizer /
// Super Admin) from Edit Profile. Hidden for now — flip to `true` to bring the
// picker back. The role itself is still loaded from the profile and saved
// unchanged while this is off, so hiding it never rewrites anyone's role.
const SHOW_ROLE_SWITCHER = false;

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();

  // Local state initialized with current profile
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [position, setPosition] = useState(profile.position);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [preferredFoot, setPreferredFoot] = useState(profile.preferredFoot);
  const [playingStyle, setPlayingStyle] = useState(profile.playingStyle);
  const [jerseyNumber, setJerseyNumber] = useState(profile.jerseyNumber !== undefined ? String(profile.jerseyNumber) : '');
  const [skillLevel, setSkillLevel] = useState<NonNullable<UserProfile['skillLevel']>>(profile.skillLevel ?? 'Intermediate');
  const [role, setRole] = useState(profile.role || 'Player');
  const [isLocating, setIsLocating] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);

  const handleDetectGPSLocation = async () => {
    setIsLocating(true);
    const result = await getCurrentGPSLocation();
    setIsLocating(false);
    if (result.error) {
      Alert.alert('Location Error', result.error);
    } else {
      setLocation(result.address);
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets?.length) {
        setAvatarUrl(result.assets[0].uri);
        setAvatarPickerVisible(false);
      }
    } catch (err) {
      console.error('EditProfile: Failed to capture photo', err);
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to pick a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        setAvatarUrl(result.assets[0].uri);
        setAvatarPickerVisible(false);
      }
    } catch (err) {
      console.error('EditProfile: Failed to pick gallery image', err);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Full Name is required.');
      } else {
        Alert.alert('Error', 'Full Name is required.');
      }
      return;
    }

    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : undefined;

    updateProfile({
      avatarUrl,
      name,
      email: email.trim(),
      phone: phone.trim(),
      position,
      location,
      bio,
      preferredFoot,
      playingStyle,
      jerseyNumber: parsedJersey !== undefined && !isNaN(parsedJersey) ? parsedJersey : undefined,
      skillLevel,
      role,
    });

    if (Platform.OS === 'web') {
      alert('Your player profile details have been successfully saved.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } else {
      Alert.alert(
        'Profile Updated',
        'Your player profile details have been successfully saved.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <GradientContainer screenName="edit-profile" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Edit Profile
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Portrait — hero treatment, avatar picker now actually works */}
          <View style={styles.section}>
            <View style={[styles.portraitCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <Pressable style={styles.avatarWrapper} onPress={() => setAvatarPickerVisible(true)}>
                <Image source={getAvatarSource(avatarUrl)} style={[styles.avatarImage, { borderColor: theme.primary + '55' }]} />
                <View style={[styles.editIconBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="camera" size={14} color="#ffffff" />
                </View>
              </Pressable>
              <View style={styles.portraitTextCol}>
                <ThemedText type="headlineSm">Player Portrait</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  Pick a preset avatar or upload your own photo.
                </ThemedText>
                <Pressable style={[styles.changePhotoBtn, { backgroundColor: theme.primary + '15' }]} onPress={() => setAvatarPickerVisible(true)}>
                  <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_700Bold' }}>Change Photo</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Section 2: Identity Information */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person" size={16} color={theme.secondary} />
              <ThemedText type="labelMd" style={[styles.sectionTitleText, { color: theme.secondary }]}>
                IDENTITY INFORMATION
              </ThemedText>
            </View>

            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>FULL NAME</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="e.g. Rahul S. Dravid"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.rowPair}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <ThemedText type="labelMd" style={styles.inputLabel}>EMAIL</ThemedText>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>PHONE NUMBER</ThemedText>
                <TextInput
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^0-9+\s-]/g, ''))}
                  keyboardType="phone-pad"
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {SHOW_ROLE_SWITCHER && (
                <View style={styles.inputContainer}>
                  <ThemedText type="labelMd" style={styles.inputLabel}>USER ROLE</ThemedText>
                  <View style={styles.segmentedRow}>
                    {['Player', 'Coach', 'Owner', 'Organizer', 'Super Admin'].map((r) => {
                      const isSelected = role === r;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => setRole(r as any)}
                          style={[
                            styles.segmentedBtn,
                            {
                              borderColor: isSelected ? theme.secondaryContainer : theme.outlineVariant + '33',
                              backgroundColor: isSelected ? theme.secondaryContainer + '15' : 'transparent',
                            },
                          ]}
                        >
                          <ThemedText
                            type="labelMd"
                            style={{
                              color: isSelected ? theme.secondary : theme.textSecondary,
                              fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium',
                            }}
                          >
                            {r}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>PLAYING POSITION</ThemedText>
                <TextInput
                  value={position}
                  onChangeText={setPosition}
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="e.g. Forward, Midfielder"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                  <ThemedText type="labelMd" style={styles.inputLabel}>LOCATION</ThemedText>
                  <Pressable
                    onPress={handleDetectGPSLocation}
                    disabled={isLocating}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: theme.primary + '18' }}
                  >
                    <Ionicons name="locate" size={11} color={theme.primary} />
                    <ThemedText style={{ color: theme.primary, fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                      {isLocating ? 'Fetching GPS...' : 'GPS Auto-Detect'}
                    </ThemedText>
                  </Pressable>
                </View>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="e.g. London, UK"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* Section 3: Performance Profile */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="football" size={16} color={theme.secondary} />
              <ThemedText type="labelMd" style={[styles.sectionTitleText, { color: theme.secondary }]}>
                PERFORMANCE PROFILE
              </ThemedText>
            </View>

            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={styles.rowPair}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="labelMd" style={styles.inputLabel}>PREFERRED FOOT</ThemedText>
                  <View style={styles.segmentedRow}>
                    {['Right', 'Left', 'Both'].map((foot) => {
                      const isSelected = preferredFoot === foot;
                      return (
                        <Pressable
                          key={foot}
                          onPress={() => setPreferredFoot(foot)}
                          style={[
                            styles.segmentedBtn,
                            {
                              borderColor: isSelected ? theme.secondaryContainer : theme.outlineVariant + '33',
                              backgroundColor: isSelected ? theme.secondaryContainer + '15' : 'transparent',
                            },
                          ]}
                        >
                          <ThemedText
                            type="labelMd"
                            style={{
                              color: isSelected ? theme.secondary : theme.textSecondary,
                              fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium',
                            }}
                          >
                            {foot}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={[styles.inputContainer, { marginTop: Spacing.md }]}>
                <ThemedText type="labelMd" style={styles.inputLabel}>SKILL LEVEL</ThemedText>
                <View style={styles.segmentedRow}>
                  {SKILL_LEVELS.map((lvl) => {
                    const isSelected = skillLevel === lvl;
                    return (
                      <Pressable
                        key={lvl}
                        onPress={() => setSkillLevel(lvl)}
                        style={[
                          styles.segmentedBtn,
                          {
                            borderColor: isSelected ? theme.secondaryContainer : theme.outlineVariant + '33',
                            backgroundColor: isSelected ? theme.secondaryContainer + '15' : 'transparent',
                          },
                        ]}
                      >
                        <ThemedText
                          type="labelSm"
                          style={{
                            color: isSelected ? theme.secondary : theme.textSecondary,
                            fontFamily: isSelected ? 'Sora_700Bold' : 'Sora_500Medium',
                            fontSize: 10,
                          }}
                        >
                          {lvl}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.rowPair}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <ThemedText type="labelMd" style={styles.inputLabel}>JERSEY NUMBER</ThemedText>
                  <TextInput
                    value={jerseyNumber}
                    onChangeText={(t) => setJerseyNumber(t.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                    placeholder="e.g. 7"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1.6 }]}>
                  <ThemedText type="labelMd" style={styles.inputLabel}>PLAYING STYLE</ThemedText>
                  <TextInput
                    value={playingStyle}
                    onChangeText={setPlayingStyle}
                    style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                    placeholder="e.g. Target Man / Poacher"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Bio Description */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="book" size={16} color={theme.secondary} />
              <ThemedText type="labelMd" style={[styles.sectionTitleText, { color: theme.secondary }]}>
                BIOGRAPHY
              </ThemedText>
            </View>

            <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                <ThemedText type="labelMd" style={styles.inputLabel}>BIO DESCRIPTION</ThemedText>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.multilineInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="Tell us about your sporting focus..."
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Actions buttons Fixed at Bottom */}
        <View style={[styles.actionSection, { paddingBottom: Spacing.md }]}>
          <Pressable onPress={handleSave} style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}>
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold' }}>
              SAVE CHANGES
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            }}
            style={[styles.secondaryActionBtn, { borderColor: theme.outline }]}
          >
            <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'Sora_700Bold' }}>
              CANCEL
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Avatar Picker Sheet */}
      <Modal visible={avatarPickerVisible} transparent animationType="slide" onRequestClose={() => setAvatarPickerVisible(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setAvatarPickerVisible(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: theme.surfaceLowest }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeaderRow}>
              <ThemedText type="headlineSm" style={{ color: theme.text }}>Change Photo</ThemedText>
              <Pressable onPress={() => setAvatarPickerVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.pickerActionsRow}>
              <Pressable style={[styles.pickerActionBtn, { backgroundColor: theme.surfaceLow }]} onPress={pickFromCamera}>
                <Ionicons name="camera-outline" size={18} color={theme.primary} />
                <ThemedText style={{ color: theme.text, fontSize: 12, fontFamily: 'Sora_600SemiBold', marginLeft: 8 }}>Take Photo</ThemedText>
              </Pressable>
              <Pressable style={[styles.pickerActionBtn, { backgroundColor: theme.surfaceLow }]} onPress={pickFromGallery}>
                <Ionicons name="image-outline" size={18} color={theme.primary} />
                <ThemedText style={{ color: theme.text, fontSize: 12, fontFamily: 'Sora_600SemiBold', marginLeft: 8 }}>Choose from Gallery</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="labelMd" style={[styles.inputLabel, { marginTop: Spacing.md, marginBottom: Spacing.sm }]}>OR PICK A PRESET AVATAR</ThemedText>
            <ScrollView contentContainerStyle={styles.presetGrid} showsVerticalScrollIndicator={false}>
              {AVATAR_KEYS.map((key) => {
                const isSelected = avatarUrl === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => { setAvatarUrl(key); setAvatarPickerVisible(false); }}
                    style={[
                      styles.presetAvatarWrap,
                      { borderColor: isSelected ? theme.primary : 'transparent', backgroundColor: theme.surfaceLow },
                    ]}
                  >
                    <Image source={AVATAR_IMAGES[key]} style={styles.presetAvatarImage} />
                    {isSelected && (
                      <View style={[styles.presetCheckBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark" size={10} color="#ffffff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  portraitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  portraitTextCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  changePhotoBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitleText: {
    fontFamily: 'Sora_700Bold',
    letterSpacing: 1,
    fontSize: 10,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  rowPair: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    color: '#73787b',
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#0000000a',
  },
  multilineInput: {
    height: 100,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    textAlignVertical: 'top',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segmentedBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.containerMargin,
    gap: Spacing.sm,
  },
  primaryActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  secondaryActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Avatar picker sheet
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: BorderRadius.premium,
    borderTopRightRadius: BorderRadius.premium,
    padding: Spacing.lg,
    maxHeight: '75%',
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00000022',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pickerActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pickerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: BorderRadius.lg,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: Spacing.md,
  },
  presetAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  presetAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  presetCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
