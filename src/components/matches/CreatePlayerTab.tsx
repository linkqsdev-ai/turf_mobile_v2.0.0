import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

const ROLES = [
  { id: 'Batsman', icon: 'baseball-outline' as const, desc: 'Top order striker' },
  { id: 'Bowler', icon: 'flame-outline' as const, desc: 'Strike weapon' },
  { id: 'All-Rounder', icon: 'star-outline' as const, desc: 'Dual threat' },
  { id: 'Keeper', icon: 'hand-left-outline' as const, desc: 'Behind the stumps' },
];

const BATTING_STYLES = ['Right Hand Bat', 'Left Hand Bat'];
const BOWLING_STYLES = [
  'None / Not Applicable',
  'Right-arm Fast',
  'Right-arm Off-break',
  'Left-arm Orthodox',
  'Left-arm Chinaman',
];

export function CreatePlayerTab() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [jerseyNo, setJerseyNo] = useState('');
  const [playingRole, setPlayingRole] = useState('Batsman');
  const [battingStyle, setBattingStyle] = useState('Right Hand Bat');
  const [bowlingStyle, setBowlingStyle] = useState('None / Not Applicable');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Selection modals/states for dropdowns
  const [showBattingModal, setShowBattingModal] = useState(false);
  const [showBowlingModal, setShowBowlingModal] = useState(false);

  // Focus states for input fields
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isJerseyFocused, setIsJerseyFocused] = useState(false);

  const initials = fullName
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '—';

  const pickImage = () => {
    Alert.alert(
      'Upload Portrait',
      'Choose profile photo source:',
      [
        {
          text: 'Upload Custom Photo',
          onPress: () => {
            // Simulate image picker success using the design mockup professional profile portrait URL
            setProfileImage('https://lh3.googleusercontent.com/aida-public/AB6AXuBmqCEtkBNt2WgKbUQccnUzA_prLeiCR1C2YltOh79BuUDY7z4AjQnqOqj0rY7ffI4d0iTssz71mr0m1DFJFvNb5FpTkJd3heKN-j1KPh4Z6fwpfrcEXdC0BS9WDPu4DqzaMM8T1e9_Fs4Yw3IG3BRkdavsYcVbNSVpuiARsC3VT7T8bzqZOwJhWROH1lC9zhFyUIZoyNKlYZ_-97-0LHFeeUguG81o-EQiVGdZRefeW2-Ro3pDf7TbiDG77bvJJ6UNWDbJ2s2_Bb4');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleCreate = () => {
    if (!fullName.trim()) {
      return Alert.alert('Required', 'Enter your full name to continue.');
    }
    Alert.alert('Success', `Player profile for "${fullName}" has been created!`);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={{ backgroundColor: '#f7f9fb' }}
      bounces={false}
    >
      {/* ── Visual Brand Hero Section ──────────────────── */}
      <View style={styles.heroCard}>
        {/* Watermark Illustration */}
        <Image
          source={require('@/assets/images/illustrations/cricket_player.png')}
          style={styles.heroWatermark}
          contentFit="contain"
        />
        <View style={styles.heroContent}>
          <View style={styles.badgeRow}>
            <View style={styles.newRegBadge}>
              <ThemedText style={styles.newRegBadgeText}>NEW REGISTRATION</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.heroTitle}>Build Your Legacy</ThemedText>
          <ThemedText style={styles.heroDescription}>
            Create a professional profile. Input precise athletic data to ensure peak performance tracking across the APEX ecosystem.
          </ThemedText>
        </View>
      </View>

      {/* ── Requirement Checklist ─────────────────────── */}
      <View style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <Ionicons name="information-circle" size={18} color="#ffc703" />
          <ThemedText style={styles.checklistTitle}>Requirement Checklist</ThemedText>
        </View>

        <View style={styles.checklistItems}>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color="#ffc703" style={styles.checkIcon} />
            <ThemedText style={styles.checkText}>Legal full name for official records</ThemedText>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color="#ffc703" style={styles.checkIcon} />
            <ThemedText style={styles.checkText}>Verified primary playing role</ThemedText>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color="#ffc703" style={styles.checkIcon} />
            <ThemedText style={styles.checkText}>Technical style specifications</ThemedText>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color="#ffc703" style={styles.checkIcon} />
            <ThemedText style={styles.checkText}>High-resolution profile imagery</ThemedText>
          </View>
        </View>
      </View>

      {/* ── Bento Form Container ───────────────────────── */}
      <View style={[styles.bentoForm, Shadows.level2]}>

        {/* Profile Picture Section */}
        <View style={styles.photoUploadRow}>
          <Pressable onPress={pickImage} style={styles.photoContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="add-circle-outline" size={28} color="#74777f" />
                <ThemedText style={styles.uploadBtnLabel}>UPLOAD</ThemedText>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <MaterialCommunityIcons name="pencil-outline" size={12} color="#191c1e" />
            </View>
          </Pressable>
          <View style={styles.photoTextGroup}>
            <ThemedText style={styles.photoTitle}>Player Portrait</ThemedText>
            <ThemedText style={styles.photoDescription}>
              Upload a high-quality photo. JPG or PNG, max 5MB. Recommended ratio 1:1.
            </ThemedText>
          </View>
        </View>

        <View style={styles.formDivider} />

        {/* Identity Information Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color="#765b00" />
            <ThemedText style={styles.sectionTitleLabel}>IDENTITY INFORMATION</ThemedText>
          </View>

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.fieldLabel}>FULL NAME</ThemedText>
            <TextInput
              style={[
                styles.underlinedInput,
                { borderBottomColor: isNameFocused ? '#001b3d' : '#c4c6cf' }
              ]}
              placeholder="e.g. Rahul S. Dravid"
              placeholderTextColor="#74777f80"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
            />
          </View>

          {/* Jersey Number Input */}
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <ThemedText style={styles.fieldLabel}>JERSEY NUMBER (OPTIONAL)</ThemedText>
            <TextInput
              style={[
                styles.underlinedInput,
                { borderBottomColor: isJerseyFocused ? '#001b3d' : '#c4c6cf' }
              ]}
              placeholder="e.g. 19"
              placeholderTextColor="#74777f80"
              value={jerseyNo}
              onChangeText={setJerseyNo}
              keyboardType="number-pad"
              maxLength={3}
              onFocus={() => setIsJerseyFocused(true)}
              onBlur={() => setIsJerseyFocused(false)}
            />
          </View>
        </View>

        <View style={styles.formDivider} />

        {/* Performance Profile Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={16} color="#765b00" />
            <ThemedText style={styles.sectionTitleLabel}>PERFORMANCE PROFILE</ThemedText>
          </View>

          {/* Playing Role Select Grid */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.fieldLabel}>PLAYING ROLE</ThemedText>
            <View style={styles.roleGrid}>
              {ROLES.map((role) => {
                const isSelected = playingRole === role.id;
                return (
                  <Pressable
                    key={role.id}
                    onPress={() => setPlayingRole(role.id)}
                    style={[
                      styles.roleCard,
                      isSelected
                        ? { backgroundColor: '#ffc703', borderColor: '#ffc703' }
                        : { backgroundColor: '#ffffff', borderColor: '#c4c6cf' }
                    ]}
                  >
                    <Ionicons
                      name={role.icon}
                      size={16}
                      color={isSelected ? '#594400' : '#44474e'}
                    />
                    <ThemedText
                      style={[
                        styles.roleCardText,
                        { color: isSelected ? '#594400' : '#191c1e' }
                      ]}
                    >
                      {role.id}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Batting Style Select */}
          <View style={[styles.inputGroup, { marginTop: 18 }]}>
            <ThemedText style={styles.fieldLabel}>BATTING STYLE</ThemedText>
            <Pressable
              onPress={() => setShowBattingModal(true)}
              style={styles.dropdownTrigger}
            >
              <ThemedText style={styles.dropdownValue}>{battingStyle}</ThemedText>
              <Ionicons name="chevron-down" size={16} color="#74777f" />
            </Pressable>

            {showBattingModal && (
              <View style={styles.inlinePickerList}>
                {BATTING_STYLES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setBattingStyle(item);
                      setShowBattingModal(false);
                    }}
                    style={[
                      styles.pickerItem,
                      battingStyle === item && { backgroundColor: '#eceef0' }
                    ]}
                  >
                    <ThemedText style={styles.pickerItemText}>{item}</ThemedText>
                    {battingStyle === item && (
                      <Ionicons name="checkmark" size={16} color="#001b3d" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Bowling Style Select */}
          <View style={[styles.inputGroup, { marginTop: 18 }]}>
            <ThemedText style={styles.fieldLabel}>BOWLING STYLE</ThemedText>
            <Pressable
              onPress={() => setShowBowlingModal(true)}
              style={styles.dropdownTrigger}
            >
              <ThemedText style={styles.dropdownValue}>{bowlingStyle}</ThemedText>
              <Ionicons name="chevron-down" size={16} color="#74777f" />
            </Pressable>

            {showBowlingModal && (
              <View style={styles.inlinePickerList}>
                {BOWLING_STYLES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setBowlingStyle(item);
                      setShowBowlingModal(false);
                    }}
                    style={[
                      styles.pickerItem,
                      bowlingStyle === item && { backgroundColor: '#eceef0' }
                    ]}
                  >
                    <ThemedText style={styles.pickerItemText}>{item}</ThemedText>
                    {bowlingStyle === item && (
                      <Ionicons name="checkmark" size={16} color="#001b3d" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

      </View>

      {/* ── Actions Row ────────────────────────────────── */}
      <View style={styles.actionsContainer}>
        <Pressable
          onPress={handleCreate}
          style={[styles.primaryButton, { backgroundColor: '#001b3d' }]}
        >
          <ThemedText style={styles.primaryButtonText}>Create Player Profile</ThemedText>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Saved', 'Draft has been successfully saved.')}
        >
          <ThemedText style={styles.secondaryButtonText}>Save Draft</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.containerMargin,
    paddingBottom: 48,
  },

  /* Visual Brand Hero Card */
  heroCard: {
    backgroundColor: '#001b3d',
    borderRadius: 8, // Soft rounded radius per shape design guidelines
    padding: 24,
    height: 190,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  heroWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    width: 220,
    height: 220,
    opacity: 0.35,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  newRegBadge: {
    backgroundColor: 'rgba(255, 199, 3, 0.15)',
    borderColor: '#ffc703',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  newRegBadgeText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    color: '#ffc703',
  },
  heroTitle: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 4,
  },
  heroDescription: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#cbd5e1e0',
    maxWidth: '85%',
  },

  /* Checklist Card */
  checklistCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    padding: 16,
    marginBottom: 20,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 14,
    color: '#191c1e',
    marginLeft: 8,
  },
  checklistItems: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  checkText: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    color: '#44474e',
  },

  /* Bento Form Container */
  bentoForm: {
    backgroundColor: '#ffffff',
    borderRadius: 24, // Premium card visual style
    borderWidth: 1,
    borderColor: '#e0e3e5',
    padding: 20,
    marginBottom: 24,
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 4,
  },
  photoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#74777f',
    backgroundColor: '#f7f9fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnLabel: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 8,
    color: '#74777f',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffc703',
    borderColor: '#ffffff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoTextGroup: {
    flex: 1,
  },
  photoTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 15,
    color: '#191c1e',
    marginBottom: 2,
  },
  photoDescription: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#44474e',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#eceef0',
    marginVertical: 18,
  },
  formSection: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitleLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#765b00',
  },
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#44474e',
    marginBottom: 4,
  },
  underlinedInput: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 14,
    color: '#191c1e',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    width: '48%',
  },
  roleCardText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#c4c6cf',
    paddingVertical: 8,
    marginTop: 4,
  },
  dropdownValue: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 14,
    color: '#191c1e',
  },
  inlinePickerList: {
    backgroundColor: '#f7f9fb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eceef0',
  },
  pickerItemText: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 13,
    color: '#191c1e',
  },

  /* Action Buttons */
  actionsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  primaryButton: {
    height: 48,
    borderRadius: 4, // 4px button border radius per design guidelines
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#001b3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#c4c6cf',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
  },
  secondaryButtonText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 14,
    color: '#44474e',
  },
});
