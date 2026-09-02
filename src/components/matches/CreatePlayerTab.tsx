import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { SPORTS_LIST } from '@/constants/sports';

const SPORT_ROLES: Record<string, { id: string, icon: any, desc: string }[]> = {
  'Cricket': [
    { id: 'Batsman', icon: 'baseball-outline', desc: 'Top order striker' },
    { id: 'Bowler', icon: 'flame-outline', desc: 'Strike weapon' },
    { id: 'All-Rounder', icon: 'star-outline', desc: 'Dual threat' },
    { id: 'Keeper', icon: 'hand-left-outline', desc: 'Behind the stumps' },
  ],
  'Football': [
    { id: 'Forward', icon: 'football-outline', desc: 'Goal scorer' },
    { id: 'Midfielder', icon: 'walk-outline', desc: 'Playmaker' },
    { id: 'Defender', icon: 'shield-outline', desc: 'Backline guard' },
    { id: 'Goalkeeper', icon: 'hand-left-outline', desc: 'Shot stopper' },
  ],
  'Basketball': [
    { id: 'Point Guard', icon: 'basketball-outline', desc: 'Floor general' },
    { id: 'Shooting Guard', icon: 'flame-outline', desc: 'Sharpshooter' },
    { id: 'Forward', icon: 'body-outline', desc: 'Versatile scorer' },
    { id: 'Center', icon: 'shield-outline', desc: 'Paint protector' },
  ],
  'Badminton': [
    { id: 'Singles', icon: 'person-outline', desc: 'Solo specialist' },
    { id: 'Doubles', icon: 'people-outline', desc: 'Team player' },
  ]
};

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
  const [mobileNo, setMobileNo] = useState('');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [playingRole, setPlayingRole] = useState(SPORT_ROLES['Cricket'][0].id);
  const [battingStyle, setBattingStyle] = useState('Right Hand Bat');
  const [bowlingStyle, setBowlingStyle] = useState('None / Not Applicable');
  const [profileImage, setProfileImage] = useState<any>(require('@/assets/images/avatars/avatar_1.png'));

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBattingModal, setShowBattingModal] = useState(false);
  const [showBowlingModal, setShowBowlingModal] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isJerseyFocused, setIsJerseyFocused] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [jerseyError, setJerseyError] = useState('');
  const [mobileError, setMobileError] = useState('');

  const handleJerseyChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setJerseyNo(cleaned);
    setJerseyError('');
  };

  const handleMobileChange = (text: string) => {
    const cleaned = text.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '');
    setMobileNo(cleaned);
    if (cleaned.length > 0 && cleaned.replace('+', '').length < 7) {
      setMobileError('Enter a valid phone number (min 7 digits)');
    } else {
      setMobileError('');
    }
  };

  // Auto-update playing role when sport changes
  useEffect(() => {
    const roles = SPORT_ROLES[selectedSport] || SPORT_ROLES['Football'];
    setPlayingRole(roles[0].id);
  }, [selectedSport]);

  const pickImage = () => {
    Alert.alert(
      'Upload Player Photo',
      'Choose an option to upload or capture player picture:',
      [
        {
          text: '📷 Take Photo (Camera)',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Required', 'Camera access is needed to capture photo.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setProfileImage(result.assets[0].uri);
              }
            } catch (err) {
              console.log('Error capturing photo', err);
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Required', 'Gallery access is needed to pick photo.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setProfileImage(result.assets[0].uri);
              }
            } catch (err) {
              console.log('Error picking gallery image', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCreatePlayer = () => {
    let hasError = false;
    if (!fullName.trim()) { setNameError('Full name is required'); hasError = true; } else { setNameError(''); }
    if (mobileNo && mobileNo.replace('+', '').length < 7) { setMobileError('Enter a valid phone number (min 7 digits)'); hasError = true; } else { setMobileError(''); }
    if (hasError) return;
    Alert.alert('Success', `Player profile for "${fullName}" created successfully!`);
  };

  const currentRoles = SPORT_ROLES[selectedSport] || SPORT_ROLES['Football'];

  return (
    <View style={[styles.container, { paddingBottom: 85 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={false}
      >
      {/* ── Vector Illustration Banner ─────────────────────────────── */}
      <View style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: theme.outlineVariant + '33' }}>
        <Image
          source={require('@/assets/images/illustrations/player_illustration.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>

      {/* ── Form Body Bento Card ────────────────────────── */}
      <View style={styles.bentoCard}>
        
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconWrap, { backgroundColor: theme.primary + '11' }]}>
            <Ionicons name="person-circle-outline" size={13} color={theme.primary} />
          </View>
          <View>
            <ThemedText style={styles.cardTitle}>Player Identity</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Set your core athletic data.</ThemedText>
          </View>
        </View>

        {/* Sport selection */}
        <View style={[styles.inputGroup, { marginBottom: 20 }]}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sport</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportList}>
            {SPORTS_LIST.map((sport) => {
              const isActive = selectedSport === sport.name;
              const isDisabled = sport.name !== 'Cricket';
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => {
                    if (isDisabled) {
                      Alert.alert('Cricket Only Mode', `${sport.name} player profiles will be enabled in a future update.`);
                      return;
                    }
                    setSelectedSport(sport.name);
                  }}
                  style={[
                    styles.sportChip,
                    { backgroundColor: 'transparent', borderColor: '#00000033' },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                    isDisabled && { opacity: 0.45 },
                  ]}
                >
                  <MaterialIcons
                    name={sport.icon as any}
                    size={12}
                    color={isActive ? '#ffffff' : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.sportChipText,
                      { color: theme.textSecondary },
                      isActive && { color: '#ffffff' }
                    ]}
                  >
                    {sport.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Branding top row: Photo + Names */}
        <View style={styles.brandingTopRow}>
          <Pressable style={[styles.logoDropZone, { backgroundColor: 'transparent', borderColor: '#00000033' }]} onPress={pickImage}>
            {profileImage ? (
              <Image source={typeof profileImage === 'string' ? { uri: profileImage } : profileImage} style={styles.logoImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color={theme.textSecondary} />
                <ThemedText style={[styles.logoUploadTitle, { color: theme.text }]}>Photo</ThemedText>
                <ThemedText style={[styles.logoUploadHint, { color: theme.textSecondary }]}>Tap to upload</ThemedText>
              </>
            )}
          </Pressable>

          <View style={styles.nameRow}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Full Name <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: 'transparent', color: theme.text, borderColor: isNameFocused ? theme.primary : '#00000033' }
              ]}
              placeholder="e.g. Rahul S."
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
            />
          </View>
        </View>

        <View style={styles.defaultLogosSection}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Or pick a default avatar</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {[
              require('@/assets/images/avatars/avatar_1.png'),
              require('@/assets/images/avatars/avatar_2.png'),
              require('@/assets/images/avatars/avatar_3.png'),
              require('@/assets/images/avatars/avatar_4.png'),
              require('@/assets/images/avatars/avatar_5.png'),
              require('@/assets/images/avatars/avatar_6.png'),
              require('@/assets/images/avatars/avatar_7.png'),
              require('@/assets/images/avatars/avatar_8.png'),
              require('@/assets/images/avatars/avatar_9.png'),
              require('@/assets/images/avatars/avatar_10.png'),
              require('@/assets/images/avatars/avatar_11.png'),
              require('@/assets/images/avatars/avatar_12.png'),
              require('@/assets/images/avatars/avatar_13.png'),
              require('@/assets/images/avatars/avatar_14.png'),
              require('@/assets/images/avatars/avatar_15.png'),
              require('@/assets/images/avatars/avatar_16.png'),
              require('@/assets/images/avatars/avatar_17.png'),
              require('@/assets/images/avatars/avatar_18.png'),
              require('@/assets/images/avatars/avatar_19.png'),
              require('@/assets/images/avatars/avatar_20.png')
            ].map((img, i) => (
              <Pressable 
                key={i} 
                onPress={() => setProfileImage(img)} 
                style={[
                  styles.defaultLogoBtn, 
                  { borderColor: profileImage === img ? theme.primary : '#00000033', backgroundColor: 'transparent' }
                ]}
              >
                <Image source={img} style={styles.defaultLogoImg} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 2 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Jersey No
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: 'transparent', color: theme.text, borderColor: jerseyError ? '#ef4444' : isJerseyFocused ? theme.primary : '#00000033' }
              ]}
              placeholder="10"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={3}
              value={jerseyNo}
              onChangeText={handleJerseyChange}
              onFocus={() => setIsJerseyFocused(true)}
              onBlur={() => setIsJerseyFocused(false)}
            />
            {!!jerseyError && <ThemedText style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{jerseyError}</ThemedText>}
          </View>
          <View style={{ flex: 8 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Mobile No
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: 'transparent', color: theme.text, borderColor: mobileError ? '#ef4444' : isMobileFocused ? theme.primary : '#00000033' }
              ]}
              placeholder="+91..."
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={mobileNo}
              onChangeText={handleMobileChange}
              onFocus={() => setIsMobileFocused(true)}
              onBlur={() => setIsMobileFocused(false)}
            />
            {!!mobileError && <ThemedText style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{mobileError}</ThemedText>}
          </View>
        </View>

        <View style={[styles.formDivider, { backgroundColor: theme.outlineVariant + '44' }]} />

        {/* Playing Role Selector */}
        <View style={[styles.inputGroup, { marginTop: 4 }]}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Playing Role</ThemedText>
          <Pressable
            onPress={() => setShowRoleModal(true)}
            style={[styles.dropdownTrigger, styles.input, { backgroundColor: 'transparent', borderColor: '#00000033' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {playingRole ? (
                <>
                  <Ionicons name={currentRoles.find(r => r.id === playingRole)?.icon as any} size={16} color={theme.primary} />
                  <ThemedText style={[styles.dropdownValue, { color: theme.text }]}>{playingRole}</ThemedText>
                </>
              ) : (
                <ThemedText style={[styles.dropdownValue, { color: theme.textSecondary }]}>Select Role</ThemedText>
              )}
            </View>
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Role Modal */}
        <Modal visible={showRoleModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.outlineVariant + '44' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Select Playing Role</ThemedText>
                <Pressable onPress={() => setShowRoleModal(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.roleList}>
                  {currentRoles.map((role) => {
                    const isSelected = playingRole === role.id;
                    return (
                      <Pressable
                        key={role.id}
                        onPress={() => {
                          setPlayingRole(role.id);
                          setShowRoleModal(false);
                        }}
                        style={[
                          styles.roleListItem,
                          { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                          isSelected && { backgroundColor: theme.primary + '11', borderColor: theme.primary }
                        ]}
                      >
                        <View style={[styles.roleIconWrap, { backgroundColor: isSelected ? theme.primary : theme.surfaceLowest }]}>
                          <Ionicons
                            name={role.icon}
                            size={16}
                            color={isSelected ? '#ffffff' : theme.textSecondary}
                          />
                        </View>
                        <View style={styles.roleTextWrap}>
                          <ThemedText
                            style={[
                              styles.roleTitle,
                              { color: theme.text },
                              isSelected && { color: theme.primary }
                            ]}
                          >
                            {role.id}
                          </ThemedText>
                          <ThemedText style={[styles.roleDesc, { color: theme.textSecondary }]}>
                            {role.desc}
                          </ThemedText>
                        </View>
                        <View style={[styles.radioCircle, { borderColor: isSelected ? theme.primary : theme.outlineVariant + '80' }]}>
                          {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Conditional rendering for Cricket styles */}
        {selectedSport === 'Cricket' && (
          <>
            <View style={[styles.inputGroup, { marginTop: 18 }]}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Batting Style</ThemedText>
              <Pressable
                onPress={() => setShowBattingModal(!showBattingModal)}
                style={[styles.dropdownTrigger, styles.input, { backgroundColor: 'transparent', borderColor: '#00000033' }]}
              >
                <ThemedText style={[styles.dropdownValue, { color: theme.text }]}>{battingStyle}</ThemedText>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </Pressable>

              {showBattingModal && (
                <View style={[styles.inlinePickerList, { backgroundColor: 'transparent', borderColor: '#00000033' }]}>
                  {BATTING_STYLES.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setBattingStyle(item);
                        setShowBattingModal(false);
                      }}
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: theme.outlineVariant + '44' },
                        battingStyle === item && { backgroundColor: theme.primary + '1a' }
                      ]}
                    >
                      <ThemedText style={[styles.pickerItemText, { color: theme.text }]}>{item}</ThemedText>
                      {battingStyle === item && (
                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { marginTop: 18 }]}> 
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Bowling Style</ThemedText>
              <Pressable
                onPress={() => setShowBowlingModal(!showBowlingModal)}
                style={[styles.dropdownTrigger, styles.input, { backgroundColor: 'transparent', borderColor: '#00000033' }]}
              >
                <ThemedText style={[styles.dropdownValue, { color: theme.text }]}>{bowlingStyle}</ThemedText>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </Pressable>

              {showBowlingModal && (
                <View style={[styles.inlinePickerList, { backgroundColor: 'transparent', borderColor: theme.outlineVariant + '66' }]}>
                  {BOWLING_STYLES.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setBowlingStyle(item);
                        setShowBowlingModal(false);
                      }}
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: theme.outlineVariant + '44' },
                        bowlingStyle === item && { backgroundColor: theme.primary + '1a' }
                      ]}
                    >
                      <ThemedText style={[styles.pickerItemText, { color: theme.text }]}>{item}</ThemedText>
                      {bowlingStyle === item && (
                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

      </View>
      </ScrollView>

      {/* ── Actions Row (Primary CTA) ────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest }]}>
        <Pressable
          onPress={handleCreatePlayer}
          style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: fullName ? 1 : 0.5 }]}
          disabled={!fullName}
        >
          <View style={styles.btnContent}>
            <ThemedText style={styles.primaryButtonText}>Create Player</ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  /* Banner Card */
  bannerCard: {
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#1a2a33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  bannerBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-15deg' }],
  },
  badgeWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 13,
    color: '#ffffffe0',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: '85%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  featureText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },

  /* Bento Card Container */
  bentoCard: {
    padding: 0,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
  },
  cardSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 9.5,
    marginTop: 1,
  },

  formDivider: {
    height: 1,
    marginVertical: 16,
  },

  brandingTopRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  logoDropZone: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoUploadTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 9,
    marginTop: 2,
  },
  logoUploadHint: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8,
    marginTop: 1,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  defaultLogosSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  defaultLogoBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultLogoImg: {
    width: '100%',
    height: '100%',
  },
  nameRow: {
    flex: 1,
  },

  /* Inputs & Selectors */
  inputGroup: {
    flexDirection: 'column',
  },
  fieldLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9,
    letterSpacing: 0.1,
    marginBottom: 3,
    color: '#64748b',
  },
  input: {
    height: 35,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
  },
  sportList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  sportChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    marginLeft: 4,
  },
  
  /* Role List */
  roleList: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  roleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  roleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    marginBottom: 2,
  },
  roleDesc: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* Dropdowns */
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValue: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
  },
  inlinePickerList: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
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
  },
  pickerItemText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
  },

  /* Actions container */
  actionsContainer: {
    flexDirection: 'column',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0000000a',
  },
  primaryButton: {
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000a0',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
  },
  modalClose: {
    padding: 4,
  },
});
