import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ImageBackground,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CreateTeamScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [selectedSport] = useState('Football');
  const [homeGround, setHomeGround] = useState('');

  // Spring scale animations for buttons
  const [scaleCreateAnim] = useState(new Animated.Value(1));
  const [scaleDraftAnim] = useState(new Animated.Value(1));

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1.0,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

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
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={{ fontSize: 17, fontFamily: 'HankenGrotesk_700Bold', color: theme.text, letterSpacing: -0.3 }}>
              Create Team
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
            </Pressable>
            <Pressable style={[styles.iconBtn, styles.avatarMini]}>
              <Ionicons name="person" size={15} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Compact Hero Section */}
          <View style={[styles.heroCard, { backgroundColor: '#001b3d' }, Shadows.level3]}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadge}>
                  <ThemedText style={{ color: '#feae2c', fontSize: 9, fontFamily: 'HankenGrotesk_800ExtraBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Foundation
                  </ThemedText>
                </View>
                <ThemedText style={{ color: '#ffffff', fontSize: 15, fontFamily: 'HankenGrotesk_800ExtraBold', marginTop: 2, marginBottom: 2, lineHeight: 20 }}>
                  Build Your Legacy
                </ThemedText>
                <ThemedText style={{ color: '#75859d', fontSize: 11, fontFamily: 'HankenGrotesk_400Regular', lineHeight: 15 }}>
                  Define your squad's core identity.
                </ThemedText>
                <ThemedText style={{ color: '#75859d', fontSize: 11, fontFamily: 'HankenGrotesk_400Regular', lineHeight: 15 }}>
                  Set the name, logo, sport and home ground.
                </ThemedText>
              </View>
              <View style={styles.proBadgeCompact}>
                <Ionicons name="shield-checkmark" size={18} color="#feae2c" />
              </View>
            </View>
          </View>

          {/* Step 1: Identity & Branding */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="id-card-outline" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={{ fontSize: 16, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Identity & Branding</ThemedText>
                <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_400Regular', color: theme.textSecondary }}>How the world recognizes your team.</ThemedText>
              </View>
            </View>

            {/* Logo Upload Row */}
            <View style={styles.crestUploadContainer}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <ThemedText style={styles.inputLabel}>Team Logo</ThemedText>
                <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_400Regular', color: theme.textSecondary }}>
                  Upload a square JPEG or PNG image as your team logo.
                </ThemedText>
              </View>
              <View style={[styles.crestUpload, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '60' }]}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={theme.textSecondary} />
                <ThemedText style={{ fontSize: 8, fontFamily: 'HankenGrotesk_700Bold', color: theme.textSecondary, marginTop: 2, textTransform: 'uppercase' }}>Upload</ThemedText>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Team Name</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40', color: theme.text }]}
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
                  style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40', color: theme.text }]}
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
                  <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_400Regular', fontSize: 14 }}>{selectedSport}</ThemedText>
                  <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
                </View>
              </View>
            </View>
          </View>

          {/* Step 2: Venue */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="football-outline" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={{ fontSize: 16, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Venue</ThemedText>
                <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_400Regular', color: theme.textSecondary }}>Where you defend your pride.</ThemedText>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Home Ground Name</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.outlineVariant + '40', color: theme.text }]}
                placeholder="e.g. Apex Central Arena"
                placeholderTextColor={theme.textSecondary + '80'}
                value={homeGround}
                onChangeText={setHomeGround}
              />
            </View>

            {/* Compact Stadium Visual */}
            <View style={[styles.venueImageContainer, { borderColor: theme.outlineVariant + '60' }]}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?q=80&w=600' }}
                style={styles.venueImage}
              >
                <View style={styles.venueOverlay}>
                  <Pressable style={styles.setLocationBtn}>
                    <Ionicons name="location" size={12} color="#ffffff" />
                    <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'HankenGrotesk_600SemiBold', marginLeft: 4 }}>
                      Set Location
                    </ThemedText>
                  </Pressable>
                </View>
              </ImageBackground>
            </View>
          </View>

          {/* Finalize Action */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40', ...styles.navyShadow }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLow }]}>
                <Ionicons name="settings-outline" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={{ fontSize: 16, fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>Finalize Team</ThemedText>
                <ThemedText style={{ fontSize: 12, fontFamily: 'HankenGrotesk_400Regular', color: theme.textSecondary }}>Review settings and launch your club.</ThemedText>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Animated.View style={{ transform: [{ scale: scaleDraftAnim }], flex: 1 }}>
                <Pressable
                  onPressIn={() => handlePressIn(scaleDraftAnim)}
                  onPressOut={() => handlePressOut(scaleDraftAnim)}
                  style={[styles.draftBtn, { borderColor: theme.outlineVariant, backgroundColor: theme.surfaceLow }]}
                  onPress={() => Alert.alert('Success', 'Draft saved successfully!')}
                >
                  <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 14 }}>Save Draft</ThemedText>
                </Pressable>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ scale: scaleCreateAnim }], flex: 1 }}>
                <Pressable
                  onPressIn={() => handlePressIn(scaleCreateAnim)}
                  onPressOut={() => handlePressOut(scaleCreateAnim)}
                  style={styles.createBtnContainer}
                  onPress={handleCreateTeam}
                >
                  <LinearGradient
                    colors={['#feae2c', '#ff8c00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createBtnGradient}
                  >
                    <ThemedText style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 14 }}>Create Team</ThemedText>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
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
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMini: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#001b3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingBottom: 24,
    gap: 12,
  },
  heroCard: {
    padding: 12,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 80,
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(254, 174, 44, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  proBadgeCompact: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  formCard: {
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
  },
  navyShadow: {
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  iconContainer: {
    width: 32, height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crestUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 8,
    borderRadius: 12,
  },
  crestUpload: {
    width: 54, height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
    color: '#74777f',
    marginBottom: 4,
  },
  textInput: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  pickerMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  venueImageContainer: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  venueImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  venueOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    alignItems: 'flex-start',
  },
  setLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  draftBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnContainer: {
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    // Premium soft gold shadow
    shadowColor: '#feae2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

