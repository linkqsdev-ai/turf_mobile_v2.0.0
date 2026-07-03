import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useMatchStore } from '@/store/app-store';

import { SPORTS_LIST } from '@/constants/sports';

export function CreateTeamTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const theme = useTheme();
  const { addTeam } = useMatchStore();

  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [homeGround, setHomeGround] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [crestImage, setCrestImage] = useState<any>(require('@/assets/images/mascots/lion.png'));
  const [isFavourite, setIsFavourite] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);
  const [isGroundFocused, setIsGroundFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Validation errors
  const [teamNameError, setTeamNameError] = useState('');
  const [shortNameError, setShortNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (text: string) => {
    // Strip all non-numeric chars except leading +
    const cleaned = text.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '');
    setCaptainPhone(cleaned);
    if (cleaned.length > 0 && cleaned.replace('+', '').length < 7) {
      setPhoneError('Enter a valid phone number (min 7 digits)');
    } else {
      setPhoneError('');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCrestImage(result.assets[0].uri);
    }
  };

  const handleCreateTeam = () => {
    let hasError = false;
    if (!teamName.trim()) { setTeamNameError('Team name is required'); hasError = true; } else { setTeamNameError(''); }
    if (!shortName.trim()) { setShortNameError('Short name is required'); hasError = true; } else { setShortNameError(''); }
    if (!captainPhone.trim()) { setPhoneError('Phone number is required'); hasError = true; }
    else if (captainPhone.replace('+','').length < 7) { setPhoneError('Enter a valid phone number (min 7 digits)'); hasError = true; }
    else { setPhoneError(''); }
    if (hasError) return;

    addTeam({
      name: teamName,
      sport: selectedSport,
      mascot: typeof crestImage === 'string' ? crestImage : 'lion',
      players: [],
      isFavourite: isFavourite,
    });

    Alert.alert('Success', `Team "${teamName}" created successfully!`);
    onNavigate?.('Quick Match');
  };

  return (
    <View style={[styles.container, { paddingBottom: 85 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.scrollArea}
        bounces={false}
      >
      {/* ── Vector Illustration Banner ─────────────────────────────── */}
      <View style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: theme.outlineVariant + '33' }}>
        <Image
          source={require('@/assets/images/illustrations/team_creation_vector.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>

      {/* ── Form Body Bento Card ────────────────────────── */}
      <View style={[styles.bentoCard, Shadows.level2, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
        
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconWrap, { backgroundColor: theme.primary + '11' }]}>
            <Ionicons name="id-card" size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.cardTitle}>Identity & Branding</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Set the foundation for your team.</ThemedText>
          </View>
          <Pressable 
            onPress={() => setIsFavourite(!isFavourite)} 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 4, 
              paddingHorizontal: 8, 
              paddingVertical: 5, 
              borderRadius: BorderRadius.full, 
              backgroundColor: isFavourite ? '#FFE25920' : theme.surfaceLow,
              borderWidth: 1,
              borderColor: isFavourite ? '#FFA751' : theme.outlineVariant + '44'
            }}
          >
            <Ionicons 
              name={isFavourite ? "star" : "star-outline"} 
              size={13} 
              color={isFavourite ? "#FFA751" : theme.textSecondary} 
            />
            <ThemedText style={{ 
              fontFamily: 'HankenGrotesk_700Bold', 
              fontSize: 10, 
              color: isFavourite ? "#FFA751" : theme.textSecondary 
            }}>
              Favourite
            </ThemedText>
          </Pressable>
        </View>

        {/* Sport selection */}
        <View style={[styles.inputGroup, { marginBottom: 20 }]}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Sport</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportList}>
            {SPORTS_LIST.map((sport) => {
              const isActive = selectedSport === sport.name;
              return (
                <Pressable
                  key={sport.name}
                  onPress={() => setSelectedSport(sport.name)}
                  style={[
                    styles.sportChip,
                    { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },
                    isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
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

        {/* Branding top row: Logo + Names */}
        <View style={styles.brandingTopRow}>
          <Pressable style={[styles.logoDropZone, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]} onPress={pickImage}>
            {crestImage ? (
              <Image source={typeof crestImage === 'string' ? { uri: crestImage } : crestImage} style={styles.logoImage} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color={theme.textSecondary} />
                <ThemedText style={[styles.logoUploadTitle, { color: theme.text }]}>Team Logo</ThemedText>
                <ThemedText style={[styles.logoUploadHint, { color: theme.textSecondary }]}>Tap to upload</ThemedText>
              </>
            )}
          </Pressable>

          <View style={styles.nameRow}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Team name <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: teamNameError ? '#ef4444' : isNameFocused ? theme.primary : theme.outlineVariant + '44' }
              ]}
              placeholder="e.g. London Strikers"
              placeholderTextColor={theme.textSecondary + '80'}
              value={teamName}
              onChangeText={(t) => { setTeamName(t); if (t.trim()) setTeamNameError(''); }}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => { setIsNameFocused(false); if (!teamName.trim()) setTeamNameError('Team name is required'); }}
            />
            {!!teamNameError && <ThemedText style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{teamNameError}</ThemedText>}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 3 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Short name <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: shortNameError ? '#ef4444' : isShortFocused ? theme.primary : theme.outlineVariant + '44' }
              ]}
              placeholder="LSR"
              placeholderTextColor={theme.textSecondary + '80'}
              maxLength={4}
              value={shortName}
              onChangeText={(t) => { setShortName(t.toUpperCase()); if (t.trim()) setShortNameError(''); }}
              onFocus={() => setIsShortFocused(true)}
              onBlur={() => { setIsShortFocused(false); if (!shortName.trim()) setShortNameError('Short name is required'); }}
            />
            {!!shortNameError && <ThemedText style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{shortNameError}</ThemedText>}
          </View>
          <View style={{ flex: 7 }}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Phone <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: phoneError ? '#ef4444' : isPhoneFocused ? theme.primary : theme.outlineVariant + '44' }
              ]}
              placeholder="+44 7000"
              placeholderTextColor={theme.textSecondary + '80'}
              keyboardType="phone-pad"
              value={captainPhone}
              onChangeText={handlePhoneChange}
              onFocus={() => setIsPhoneFocused(true)}
              onBlur={() => setIsPhoneFocused(false)}
            />
            {!!phoneError && <ThemedText style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{phoneError}</ThemedText>}
          </View>
        </View>

        <View style={styles.defaultLogosSection}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Or pick a default mascot</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {[
              require('@/assets/images/mascots/lion.png'),
              require('@/assets/images/mascots/warrior.png'),
              require('@/assets/images/mascots/wolf.png'),
              require('@/assets/images/mascots/eagle.png'),
              require('@/assets/images/mascots/panther.png'),
              require('@/assets/images/mascots/shark.png'),
              require('@/assets/images/mascots/bear.png'),
              require('@/assets/images/mascots/rhino.png'),
              require('@/assets/images/mascots/dragon.png'),
              require('@/assets/images/mascots/cobra.png'),
              require('@/assets/images/mascots/tiger.png'),
              require('@/assets/images/mascots/leopard.png'),
              require('@/assets/images/mascots/gorilla.png'),
              require('@/assets/images/mascots/falcon.png'),
              require('@/assets/images/mascots/stallion.png'),
              require('@/assets/images/mascots/bull.png'),
              require('@/assets/images/mascots/crocodile.png')
            ].map((img, i) => (
              <Pressable 
                key={i} 
                onPress={() => setCrestImage(img)} 
                style={[
                  styles.defaultLogoBtn, 
                  { borderColor: crestImage === img ? theme.primary : theme.outlineVariant + '44', backgroundColor: theme.surfaceLow }
                ]}
              >
                <Image source={img} style={styles.defaultLogoImg} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputGroup, { marginTop: 12 }]}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Home ground</ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: isGroundFocused ? theme.primary : theme.outlineVariant + '44' }
            ]}
            placeholder="Apex Arena"
            placeholderTextColor={theme.textSecondary + '80'}
            value={homeGround}
            onChangeText={setHomeGround}
            onFocus={() => setIsGroundFocused(true)}
            onBlur={() => setIsGroundFocused(false)}
          />
        </View>

      </View>
      </ScrollView>

      {/* ── Actions Row (Primary CTA) ────────────────────── */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surfaceLowest }]}>
        <Pressable
          onPress={handleCreateTeam}
          style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: teamName && shortName && captainPhone ? 1 : 0.5 }]}
          disabled={!(teamName && shortName && captainPhone)}
        >
          <View style={styles.btnContent}>
            <ThemedText style={styles.primaryButtonText}>Create Team</ThemedText>
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontFamily: 'HankenGrotesk_500Medium',
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
    color: '#ffffff',
  },

  /* Bento Card Container */
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
  },
  cardSubtitle: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    marginTop: 2,
  },

  brandingTopRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  logoDropZone: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoUploadTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    marginTop: 4,
  },
  logoUploadHint: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 9,
    marginTop: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  defaultLogosSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  defaultLogoBtn: {
    width: 44,
    height: 44,
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
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 13,
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
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 10,
    marginLeft: 4,
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
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
  },
});
