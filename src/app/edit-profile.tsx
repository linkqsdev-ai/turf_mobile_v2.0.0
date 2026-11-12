import React, { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiClient } from '@/services/api-client';
import { useUserProfile, UserProfile } from '@/hooks/use-user-profile';
import { AVATAR_IMAGES, AVATAR_KEYS, getAvatarSource } from '@/constants/avatars';
import { getCurrentGPSLocation } from '@/utils/location';
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';
import { useFormConfig } from '@/context/RemoteConfigContext';
import { CustomFieldsSection } from '@/components/forms/CustomFieldsSection';
import { loadCustomAnswers, saveCustomAnswers } from '@/services/custom-answers';
import { missingRequired, validateCustomAnswers, type CustomAnswers, type FieldView } from '@/lib/remote-config';

const SKILL_LEVELS: NonNullable<UserProfile['skillLevel']>[] = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();

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
  const [isLocating, setIsLocating] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Super Admin layout for the Sign Up & Profile form: renamed, hidden and
  // required fields, plus any fields the admin added.
  const form = useFormConfig('signup_profile');
  const f = {
    name: form.field('name', { label: 'Full Name', placeholder: 'e.g. Rahul S. Dravid' }),
    email: form.field('email', { label: 'Email Address', placeholder: 'you@example.com' }),
    phone: form.field('phone', { label: 'Phone Number', placeholder: '98765 43210' }),
    position: form.field('position', { label: 'Playing Position', placeholder: 'e.g. Batsman, All-Rounder, Wicket Keeper' }),
    location: form.field('location', { label: 'Home Location', placeholder: 'e.g. London, UK' }),
    preferredFoot: form.field('preferredFoot', { label: 'Preferred Hand / Foot' }),
    skillLevel: form.field('skillLevel', { label: 'Skill Level' }),
    jerseyNumber: form.field('jerseyNumber', { label: 'Jersey Number', placeholder: 'e.g. 7' }),
    playingStyle: form.field('playingStyle', { label: 'Playing Style', placeholder: 'e.g. Aggressive Opener' }),
    bio: form.field('bio', { label: 'Bio Description', placeholder: 'Tell us about your sporting journey and career highlights...' }),
  };
  const labelFor = (view: FieldView) => (view.required ? `${view.label} *` : view.label);
  const showPerformance = f.preferredFoot.visible || f.skillLevel.visible || f.jerseyNumber.visible || f.playingStyle.visible;

  // Answers are keyed by the account's email (or phone), matching sign-up.
  const answersOwner = profile.email || profile.phone || '';
  const [customAnswers, setCustomAnswers] = useState<CustomAnswers>({});
  useEffect(() => {
    loadCustomAnswers('signup_profile', 'user', answersOwner).then(setCustomAnswers);
  }, [answersOwner]);

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

  const handleSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Full Name is required.');
      } else {
        Alert.alert('Error', 'Full Name is required.');
      }
      return;
    }

    const problems = [
      ...missingRequired([
        { view: f.email, value: email },
        { view: f.phone, value: phone },
        { view: f.position, value: position },
        { view: f.location, value: location },
        { view: f.jerseyNumber, value: jerseyNumber },
        { view: f.playingStyle, value: playingStyle },
        { view: f.bio, value: bio },
      ]).map((label) => `${label} is required.`),
      ...validateCustomAnswers(form.customFields, customAnswers),
    ];
    if (problems.length > 0) {
      if (Platform.OS === 'web') {
        alert(problems.join('\n'));
      } else {
        Alert.alert('Missing details', problems.join('\n'));
      }
      return;
    }

    if (phone.trim()) {
      const phoneErr = getPhoneValidationError(phone, false);
      if (phoneErr) {
        if (Platform.OS === 'web') {
          alert(phoneErr);
        } else {
          Alert.alert('Invalid Mobile Number', phoneErr);
        }
        return;
      }
    }

    const parsedJersey = jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : undefined;

    updateProfile({
      avatarUrl,
      name,
      email: email.trim(),
      phone: phone.trim() ? formatPhoneNumber(phone) : '',
      position,
      location,
      bio,
      preferredFoot,
      playingStyle,
      jerseyNumber: parsedJersey !== undefined && !isNaN(parsedJersey) ? parsedJersey : undefined,
      skillLevel,
      role: profile.role,
    });

    await saveCustomAnswers(
      'signup_profile',
      'user',
      email.trim() || (phone.trim() ? formatPhoneNumber(phone) : ''),
      customAnswers,
      form.customFields
    );

    try {
      await apiClient.put('/auth/me', {
        name: name.trim(),
        ...(phone.trim() ? { phone: formatPhoneNumber(phone) } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
      });
    } catch (err: any) {
      const msg =
        'Saved on this device, but syncing to your account failed' +
        (err?.message ? `: ${err.message}` : '.') +
        ' Your changes may not appear on other devices.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Profile not synced', msg);
      }
    }

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
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            }}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Edit Profile
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Portrait */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.verticalIndicator, { backgroundColor: '#5D68E8' }]} />
              <ThemedText style={[styles.sectionTitleText, { color: theme.textSecondary }]}>
                PLAYER PORTRAIT
              </ThemedText>
            </View>

            <View
              style={[
                styles.portraitCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <LinearGradient
                colors={['#5D68E812', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Pressable style={styles.avatarWrapper} onPress={() => setAvatarPickerVisible(true)}>
                <Image
                  source={getAvatarSource(avatarUrl)}
                  style={[styles.avatarImage, { borderColor: theme.primary + '55' }]}
                />
                <View style={[styles.editIconBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="camera" size={13} color="#ffffff" />
                </View>
              </Pressable>
              <View style={styles.portraitTextCol}>
                <ThemedText style={[styles.portraitTitle, { color: theme.text }]}>Profile Photo</ThemedText>
                <ThemedText style={[styles.portraitSubtitle, { color: theme.textSecondary }]}>
                  Pick a preset avatar or upload your custom photo.
                </ThemedText>
                <Pressable
                  style={({ pressed }) => [
                    styles.changePhotoBtn,
                    { backgroundColor: theme.primary + '18' },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setAvatarPickerVisible(true)}
                >
                  <Ionicons name="image-outline" size={13} color={theme.primary} />
                  <ThemedText style={[styles.changePhotoBtnText, { color: theme.primary }]}>
                    Change Photo
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Section 2: Identity Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.verticalIndicator, { backgroundColor: '#10B981' }]} />
              <ThemedText style={[styles.sectionTitleText, { color: theme.textSecondary }]}>
                IDENTITY INFORMATION
              </ThemedText>
            </View>

            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.name)}</ThemedText>
                <View
                  style={[
                    styles.textInputBox,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: focusedField === 'name' ? theme.primary : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <Ionicons name="person-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder={f.name.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, !f.email.visible && styles.hidden]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.email)}</ThemedText>
                <View
                  style={[
                    styles.textInputBox,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: focusedField === 'email' ? theme.primary : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <Ionicons name="mail-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder={f.email.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, !f.phone.visible && styles.hidden]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.phone)}</ThemedText>
                <View
                  style={[
                    styles.textInputBox,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: focusedField === 'phone' ? theme.primary : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <Ionicons name="call-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={phone}
                    onChangeText={(t) => setPhone(formatPhoneNumber(t))}
                    keyboardType="phone-pad"
                    maxLength={11}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder={f.phone.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, !f.position.visible && styles.hidden]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.position)}</ThemedText>
                <View
                  style={[
                    styles.textInputBox,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: focusedField === 'position' ? theme.primary : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <Ionicons name="shirt-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={position}
                    onChangeText={setPosition}
                    onFocus={() => setFocusedField('position')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder={f.position.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { marginBottom: 0 }, !f.location.visible && styles.hidden]}>
                <View style={styles.locationHeaderRow}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                    {labelFor(f.location)}
                  </ThemedText>
                  <Pressable
                    onPress={handleDetectGPSLocation}
                    disabled={isLocating}
                    style={({ pressed }) => [
                      styles.gpsDetectBtn,
                      { backgroundColor: theme.primary + '18' },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Ionicons name="locate" size={12} color={theme.primary} />
                    <ThemedText style={[styles.gpsDetectText, { color: theme.primary }]}>
                      {isLocating ? 'Detecting...' : 'GPS Auto-Detect'}
                    </ThemedText>
                  </Pressable>
                </View>
                <View
                  style={[
                    styles.textInputBox,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: focusedField === 'location' ? theme.primary : theme.outlineVariant + '33',
                      marginTop: 6,
                    },
                  ]}
                >
                  <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={location}
                    onChangeText={setLocation}
                    onFocus={() => setFocusedField('location')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.textInput, { color: theme.text }]}
                    placeholder={f.location.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Section 3: Performance Profile */}
          <View style={[styles.section, !showPerformance && styles.hidden]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.verticalIndicator, { backgroundColor: '#F59E0B' }]} />
              <ThemedText style={[styles.sectionTitleText, { color: theme.textSecondary }]}>
                PERFORMANCE PROFILE
              </ThemedText>
            </View>

            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <View style={[styles.inputContainer, !f.preferredFoot.visible && styles.hidden]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.preferredFoot)}</ThemedText>
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
                            borderColor: isSelected ? theme.primary : theme.outlineVariant + '33',
                            backgroundColor: isSelected ? theme.primary + '18' : theme.surfaceLow,
                          },
                        ]}
                      >
                        <ThemedText
                          style={{
                            color: isSelected ? theme.primary : theme.textSecondary,
                            fontFamily: isSelected ? 'Sora_500Medium' : 'Sora_400Regular',
                            fontSize: 11,
                          }}
                        >
                          {foot}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.inputContainer, !f.skillLevel.visible && styles.hidden]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.skillLevel)}</ThemedText>
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
                            borderColor: isSelected ? theme.primary : theme.outlineVariant + '33',
                            backgroundColor: isSelected ? theme.primary + '18' : theme.surfaceLow,
                          },
                        ]}
                      >
                        <ThemedText
                          style={{
                            color: isSelected ? theme.primary : theme.textSecondary,
                            fontFamily: isSelected ? 'Sora_500Medium' : 'Sora_400Regular',
                            fontSize: 10.5,
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
                <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }, !f.jerseyNumber.visible && styles.hidden]}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.jerseyNumber)}</ThemedText>
                  <View
                    style={[
                      styles.textInputBox,
                      {
                        backgroundColor: theme.surfaceLow,
                        borderColor: focusedField === 'jersey' ? theme.primary : theme.outlineVariant + '33',
                      },
                    ]}
                  >
                    <TextInput
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={jerseyNumber}
                      onChangeText={(t) => setJerseyNumber(t.replace(/\D/g, '').slice(0, 3))}
                      keyboardType="number-pad"
                      onFocus={() => setFocusedField('jersey')}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder={f.jerseyNumber.placeholder}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
                <View style={[styles.inputContainer, { flex: 1.6, marginBottom: 0 }, !f.playingStyle.visible && styles.hidden]}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.playingStyle)}</ThemedText>
                  <View
                    style={[
                      styles.textInputBox,
                      {
                        backgroundColor: theme.surfaceLow,
                        borderColor: focusedField === 'style' ? theme.primary : theme.outlineVariant + '33',
                      },
                    ]}
                  >
                    <TextInput
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      value={playingStyle}
                      onChangeText={setPlayingStyle}
                      onFocus={() => setFocusedField('style')}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder={f.playingStyle.placeholder}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Bio Description */}
          <View style={[styles.section, !f.bio.visible && styles.hidden]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.verticalIndicator, { backgroundColor: '#8B5CF6' }]} />
              <ThemedText style={[styles.sectionTitleText, { color: theme.textSecondary }]}>
                BIOGRAPHY
              </ThemedText>
            </View>

            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                Shadows.level2,
              ]}
            >
              <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{labelFor(f.bio)}</ThemedText>
                <View
                  style={[
                    styles.multilineInputBox,
                    {
                      backgroundColor: theme.surfaceLow,
                      borderColor: focusedField === 'bio' ? theme.primary : theme.outlineVariant + '33',
                    },
                  ]}
                >
                  <TextInput
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    onFocus={() => setFocusedField('bio')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.multilineInput, { color: theme.text }]}
                    placeholder={f.bio.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>
          </View>
          {/* Section 5: Fields added by the Super Admin */}
          {form.customFields.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.verticalIndicator, { backgroundColor: '#0EA5E9' }]} />
                <ThemedText style={[styles.sectionTitleText, { color: theme.textSecondary }]}>
                  MORE DETAILS
                </ThemedText>
              </View>
              <View
                style={[
                  styles.formCard,
                  { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
                  Shadows.level2,
                ]}
              >
                <CustomFieldsSection
                  fields={form.customFields}
                  values={customAnswers}
                  onChange={(key, value) => setCustomAnswers((prev) => ({ ...prev, [key]: value }))}
                  labelStyle={styles.inputLabel}
                  palette={{
                    label: theme.textSecondary,
                    text: theme.text,
                    placeholder: '#94a3b8',
                    fieldBg: theme.surfaceLow,
                    border: theme.outlineVariant + '33',
                    accent: theme.primary,
                  }}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons Fixed at Bottom */}
        <View style={[styles.actionSection, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.primaryActionBtn,
              { backgroundColor: theme.primary },
              Shadows.level2,
              pressed && { opacity: 0.85 },
            ]}
          >
            <ThemedText style={styles.primaryActionText}>
              SAVE CHANGES
            </ThemedText>
            <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          </Pressable>

          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/profile');
              }
            }}
            style={({ pressed }) => [
              styles.secondaryActionBtn,
              { borderColor: theme.outlineVariant + '55', backgroundColor: theme.surfaceLow },
              pressed && { opacity: 0.75 },
            ]}
          >
            <ThemedText style={[styles.secondaryActionText, { color: theme.text }]}>
              CANCEL
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Avatar Picker Modal */}
      <Modal
        visible={avatarPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setAvatarPickerVisible(false)}>
          <Pressable
            style={[
              styles.pickerSheet,
              { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
              Shadows.level2,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.pickerHandle, { backgroundColor: theme.outlineVariant + '55' }]} />
            <View style={styles.pickerHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.verticalIndicator, { backgroundColor: '#5D68E8' }]} />
                <ThemedText style={[styles.pickerTitle, { color: theme.text }]}>Change Photo</ThemedText>
              </View>
              <Pressable onPress={() => setAvatarPickerVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.pickerActionsRow}>
              <Pressable
                style={[styles.pickerActionBtn, { backgroundColor: theme.surfaceLow }]}
                onPress={pickFromCamera}
              >
                <View style={[styles.pickerActionIcon, { backgroundColor: theme.primary + '18' }]}>
                  <Ionicons name="camera" size={18} color={theme.primary} />
                </View>
                <ThemedText style={[styles.pickerActionBtnText, { color: theme.text }]}>
                  Take Photo
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.pickerActionBtn, { backgroundColor: theme.surfaceLow }]}
                onPress={pickFromGallery}
              >
                <View style={[styles.pickerActionIcon, { backgroundColor: '#10B98118' }]}>
                  <Ionicons name="images" size={18} color="#10B981" />
                </View>
                <ThemedText style={[styles.pickerActionBtnText, { color: theme.text }]}>
                  Gallery
                </ThemedText>
              </Pressable>
            </View>

            <ThemedText style={[styles.inputLabel, { marginTop: Spacing.md, marginBottom: Spacing.sm, color: theme.textSecondary }]}>
              OR SELECT PRESET AVATAR
            </ThemedText>
            <ScrollView contentContainerStyle={styles.presetGrid} showsVerticalScrollIndicator={false}>
              {AVATAR_KEYS.map((key) => {
                const isSelected = avatarUrl === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setAvatarUrl(key);
                      setAvatarPickerVisible(false);
                    }}
                    style={[
                      styles.presetAvatarWrap,
                      {
                        borderColor: isSelected ? theme.primary : 'transparent',
                        backgroundColor: theme.surfaceLow,
                      },
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
  hidden: {
    display: 'none',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 15,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  verticalIndicator: {
    width: 3.5,
    height: 13,
    borderRadius: 2,
    marginRight: 7,
  },
  sectionTitleText: {
    fontFamily: 'Sora_500Medium',
    letterSpacing: 0.8,
    fontSize: 9.5,
    textTransform: 'uppercase',
  },

  portraitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  portraitTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  portraitTitle: {
    fontSize: 13,
    fontFamily: 'Sora_500Medium',
  },
  portraitSubtitle: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
    lineHeight: 14,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  changePhotoBtnText: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
  },

  formCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
  },
  inputContainer: {
    marginBottom: 12,
  },
  rowPair: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 9.5,
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 11,
    borderWidth: 1.2,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 12.5,
    fontFamily: 'Sora_400Regular',
  },
  multilineInputBox: {
    borderRadius: 12,
    padding: 11,
    borderWidth: 1.2,
    height: 90,
  },
  multilineInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Sora_400Regular',
    textAlignVertical: 'top',
  },

  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  gpsDetectText: {
    fontSize: 9.5,
    fontFamily: 'Sora_400Regular',
  },

  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedBtn: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 13,
    borderTopWidth: 1,
    gap: 8,
  },
  primaryActionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  secondaryActionBtn: {
    width: '100%',
    height: 40,
    borderRadius: 999,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
  },

  // Avatar picker modal
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 21, 30, 0.65)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    padding: 18,
    maxHeight: '75%',
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 14,
    fontFamily: 'Sora_500Medium',
  },
  pickerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 13,
    gap: 10,
  },
  pickerActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerActionBtnText: {
    fontSize: 11.5,
    fontFamily: 'Sora_400Regular',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  presetAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  presetAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  presetCheckBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
