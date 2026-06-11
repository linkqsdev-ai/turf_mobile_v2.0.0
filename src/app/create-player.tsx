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
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CreatePlayerScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [playingRole, setPlayingRole] = useState('Batsman');
  const [battingStyle, setBattingStyle] = useState('Right Hand Bat');
  const [bowlingStyle, setBowlingStyle] = useState('None / Not Applicable');

  const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'];

  const handleCreate = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    Alert.alert('Success', 'Player Profile Created Successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <GradientContainer screenName="create-player" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="headlineSm" style={{ fontFamily: 'HankenGrotesk_800ExtraBold', letterSpacing: -0.5 }}>
              APEX VELOCITY
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={24} color={theme.textSecondary} />
            <View style={styles.avatarMini}>
              <Ionicons name="person" size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: '#001b3d' }, Shadows.level3]}>
            <View style={styles.heroBadge}>
              <ThemedText style={{ color: '#feae2c', fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 }}>
                NEW REGISTRATION
              </ThemedText>
            </View>
            <ThemedText type="headlineLg" style={{ color: '#ffffff', marginBottom: 8, marginTop: 12 }}>
              Build Your Legacy
            </ThemedText>
            <ThemedText type="bodyMd" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 22 }}>
              Create a professional profile for Non-Stricker. Input precise athletic data to ensure peak performance tracking across the APEX ecosystem.
            </ThemedText>
          </View>

          {/* Checklist */}
          <View style={[styles.checklistCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '30' }]}>
            <View style={styles.checklistHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#feae2c" />
              <ThemedText type="headlineSm" style={{ color: theme.text, marginLeft: 8 }}>
                Requirement Checklist
              </ThemedText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#feae2c" />
              <ThemedText style={{ color: theme.textSecondary, marginLeft: 8, fontSize: 14 }}>Legal full name for official records</ThemedText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#feae2c" />
              <ThemedText style={{ color: theme.textSecondary, marginLeft: 8, fontSize: 14 }}>Verified primary playing role</ThemedText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#feae2c" />
              <ThemedText style={{ color: theme.textSecondary, marginLeft: 8, fontSize: 14 }}>Technical style specifications</ThemedText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#feae2c" />
              <ThemedText style={{ color: theme.textSecondary, marginLeft: 8, fontSize: 14 }}>High-resolution profile imagery</ThemedText>
            </View>
          </View>

          {/* Main Form Card */}
          <View style={[styles.formCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '60' }, Shadows.level1]}>
            
            {/* Portrait Upload */}
            <View style={styles.portraitSection}>
              <View style={[styles.portraitUpload, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
                <MaterialCommunityIcons name="camera-plus-outline" size={32} color={theme.textSecondary} />
                <View style={[styles.editBadge, { backgroundColor: '#feae2c' }]}>
                  <Ionicons name="pencil" size={12} color="#6b4500" />
                </View>
              </View>
              <View style={styles.portraitText}>
                <ThemedText type="headlineSm" style={{ marginBottom: 4 }}>Player Portrait</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
                  Upload a high-quality photo. JPG or PNG, max 5MB. Recommended ratio 1:1.
                </ThemedText>
              </View>
            </View>

            {/* Identity Info */}
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={16} color="#feae2c" />
              <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 1, fontSize: 12, marginLeft: 8, textTransform: 'uppercase' }}>
                Identity Information
              </ThemedText>
            </View>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>FULL NAME</ThemedText>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
                placeholder="e.g. Rahul S. Dravid"
                placeholderTextColor={theme.textSecondary + '80'}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Performance Profile */}
            <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
              <MaterialCommunityIcons name="cricket" size={16} color="#feae2c" />
              <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 1, fontSize: 12, marginLeft: 8, textTransform: 'uppercase' }}>
                Performance Profile
              </ThemedText>
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>PLAYING ROLE</ThemedText>
              <View style={styles.rolesGrid}>
                {ROLES.map(role => {
                  const isActive = playingRole === role;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setPlayingRole(role)}
                      style={[
                        styles.roleBtn,
                        { borderColor: isActive ? '#feae2c' : theme.outlineVariant + '60' },
                        isActive && { backgroundColor: '#feae2c15' }
                      ]}
                    >
                      <ThemedText style={{
                        color: isActive ? '#835500' : theme.text,
                        fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
                        fontSize: 13,
                        textAlign: 'center'
                      }}>
                        {role}
                      </ThemedText>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>BATTING STYLE</ThemedText>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
                value={battingStyle}
                onChangeText={setBattingStyle}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>BOWLING STYLE</ThemedText>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderBottomColor: theme.outlineVariant }]}
                value={bowlingStyle}
                onChangeText={setBowlingStyle}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleCreate}
                style={[styles.primaryBtn, { backgroundColor: '#001b3d' }, Shadows.level2]}
              >
                <ThemedText style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 16 }}>
                  Create Player Profile
                </ThemedText>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, { backgroundColor: theme.surface, borderColor: theme.outlineVariant + '40' }]}>
                <ThemedText style={{ color: theme.textSecondary, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16 }}>
                  Save Draft
                </ThemedText>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
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
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.premium,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#feae2c20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  checklistCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  portraitSection: {
    flexDirection: 'column',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  portraitUpload: {
    width: 100, height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 28, height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 4,
  },
  portraitText: {
    alignItems: 'center',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#73787b',
    marginBottom: 8,
  },
  textInput: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleBtn: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    gap: 12,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
