import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CreateTeamScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [selectedSport, setSelectedSport] = useState('Football');
  const [homeGround, setHomeGround] = useState('');

  const handleCreateTeam = () => {
    if (!teamName.trim()) {
      Alert.alert('Team name required', 'Please enter a team name.');
      return;
    }
    Alert.alert(
      'Success',
      'Team Created!',
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_800ExtraBold', letterSpacing: -0.5 }}>
              APEX VELOCITY
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.avatarMini}>
              <Ionicons name="person" size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Section */}
          <View style={[styles.heroCard, { backgroundColor: '#001b3d' }, Shadows.level3]}>
            <View style={styles.heroBadge}>
              <ThemedText style={{ color: '#feae2c', fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Foundation
              </ThemedText>
            </View>
            <ThemedText type="headlineLg" style={{ color: '#ffffff', marginBottom: 12, marginTop: 12 }}>
              Build Your Legacy
            </ThemedText>
            <ThemedText type="bodyMd" style={{ color: '#75859d', lineHeight: 22, marginBottom: Spacing.xl }}>
              Define the core identity of your squad. From home grounds to visual branding, every detail counts in the pursuit of peak performance.
            </ThemedText>

            <View style={styles.proBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#feae2c" />
              <ThemedText style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, marginLeft: 8 }}>
                Apex Professional Standards
              </ThemedText>
            </View>
          </View>

          {/* Step 1: Identity & Branding */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="id-card-outline" size={24} color={theme.primary} />
              </View>
              <View>
                <ThemedText type="headlineSm">Identity & Branding</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>How the world recognizes your team.</ThemedText>
              </View>
            </View>

            {/* Crest Upload */}
            <View style={styles.crestUploadContainer}>
              <ThemedText style={styles.inputLabel}>Team Crest</ThemedText>
              <View style={[styles.crestUpload, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '60' }]}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={theme.textSecondary} />
                <ThemedText style={{ fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary, marginTop: 4, textTransform: 'uppercase' }}>Upload</ThemedText>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Team Name</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40' }]}
                placeholder="e.g. London Strikers"
                placeholderTextColor={theme.textSecondary + '80'}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={styles.inputLabel}>Short Name</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40' }]}
                  placeholder="LSR"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={shortName}
                  onChangeText={setShortName}
                  maxLength={4}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={styles.inputLabel}>Sport</ThemedText>
                <View style={[styles.pickerMock, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40' }]}>
                  <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_400Regular' }}>{selectedSport}</ThemedText>
                  <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                </View>
              </View>
            </View>
          </View>

          {/* Step 2: Venue */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }, Shadows.level1]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="football-outline" size={24} color={theme.primary} />
              </View>
              <View>
                <ThemedText type="headlineSm">Venue</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Where you defend your pride.</ThemedText>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Home Ground Name</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40' }]}
                placeholder="e.g. Apex Central Arena"
                placeholderTextColor={theme.textSecondary + '80'}
                value={homeGround}
                onChangeText={setHomeGround}
              />
            </View>

            {/* Stadium Visual */}
            <View style={[styles.venueImageContainer, { borderColor: theme.outlineVariant + '60' }]}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?q=80&w=600' }}
                style={styles.venueImage}
              >
                <View style={styles.venueOverlay}>
                  <Pressable style={styles.setLocationBtn}>
                    <Ionicons name="location" size={14} color="#ffffff" />
                    <ThemedText style={{ color: '#ffffff', fontSize: 12, fontFamily: 'HankenGrotesk_600SemiBold', marginLeft: 6 }}>
                      Set Location
                    </ThemedText>
                  </Pressable>
                </View>
              </ImageBackground>
            </View>
          </View>

          {/* Finalize Action */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', flexDirection: 'column' }, Shadows.level1]}>
            <View style={[styles.cardHeader, { marginBottom: Spacing.xl }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="settings-outline" size={24} color={theme.primary} />
              </View>
              <View>
                <ThemedText type="headlineSm">Finalize Team</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Review settings and launch your club.</ThemedText>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={[styles.draftBtn, { borderColor: theme.outlineVariant }]}>
                <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_600SemiBold' }}>Save Draft</ThemedText>
              </Pressable>
              <Pressable style={styles.createBtn} onPress={handleCreateTeam}>
                <ThemedText style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_600SemiBold' }}>Create Team</ThemedText>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarMini: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#001b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.premium,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 280,
    justifyContent: 'center',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.full,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.premium,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 16,
  },
  iconContainer: {
    width: 48, height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crestUploadContainer: {
    marginBottom: Spacing.lg,
  },
  crestUpload: {
    width: 100, height: 100,
    borderRadius: BorderRadius.premium,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 12,
    color: '#74777f',
    marginBottom: 8,
  },
  textInput: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  pickerMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  venueImageContainer: {
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  venueImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  venueOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  setLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  draftBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
});
