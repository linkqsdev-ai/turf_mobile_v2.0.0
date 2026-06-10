import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();

  // Local state initialized with current profile
  const [name, setName] = useState(profile.name);
  const [position, setPosition] = useState(profile.position);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [preferredFoot, setPreferredFoot] = useState(profile.preferredFoot);
  const [playingStyle, setPlayingStyle] = useState(profile.playingStyle);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Full Name is required.');
      return;
    }

    updateProfile({
      name,
      position,
      location,
      bio,
      preferredFoot,
      playingStyle,
    });

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
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
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
          {/* Section 1: Portrait */}
          <View style={styles.section}>
            <View style={[styles.portraitCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                <View style={[styles.editIconBadge, { backgroundColor: theme.secondaryContainer }]}>
                  <Ionicons name="camera" size={14} color={theme.onSecondaryContainer} />
                </View>
              </View>
              <View style={styles.portraitTextCol}>
                <ThemedText type="headlineSm">Player Portrait</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 2 }}>
                  JPG or PNG, Max 5MB size limit.
                </ThemedText>
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
                  placeholderTextColor={theme.textSecondary + '77'}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>PLAYING POSITION</ThemedText>
                <TextInput
                  value={position}
                  onChangeText={setPosition}
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="e.g. Forward, Midfielder"
                  placeholderTextColor={theme.textSecondary + '77'}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>LOCATION</ThemedText>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="e.g. London, UK"
                  placeholderTextColor={theme.textSecondary + '77'}
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
              <View style={styles.inputContainer}>
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
                            fontFamily: isSelected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                          }}
                        >
                          {foot}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>PLAYING STYLE</ThemedText>
                <TextInput
                  value={playingStyle}
                  onChangeText={setPlayingStyle}
                  style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="e.g. Target Man / Poacher"
                  placeholderTextColor={theme.textSecondary + '77'}
                />
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
              <View style={styles.inputContainer}>
                <ThemedText type="labelMd" style={styles.inputLabel}>BIO DESCRIPTION</ThemedText>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.multilineInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                  placeholder="Tell us about your sporting focus..."
                  placeholderTextColor={theme.textSecondary + '77'}
                />
              </View>
            </View>
          </View>

          {/* Actions buttons */}
          <View style={[styles.actionSection, { paddingBottom: 60 }]}>
            <Pressable onPress={handleSave} style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}>
              <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'PlusJakartaSans_700Bold' }}>
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
              <ThemedText type="labelMd" style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>
                CANCEL
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    fontFamily: 'HankenGrotesk_700Bold',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  portraitTextCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitleText: {
    fontFamily: 'PlusJakartaSans_700Bold',
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
  inputLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
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
});
