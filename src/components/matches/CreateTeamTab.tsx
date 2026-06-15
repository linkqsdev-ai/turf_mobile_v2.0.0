import { ThemedText } from '@/components/themed-text';
import { Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const SPORTS = [
  { name: 'Football', icon: 'sports-soccer' },
  { name: 'Basketball', icon: 'sports-basketball' },
  { name: 'Cricket', icon: 'sports-cricket' },
  { name: 'Rugby', icon: 'sports-rugby' },
];

export function CreateTeamTab() {
  const theme = useTheme();
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [selectedSport, setSelectedSport] = useState('Football');
  const [homeGround, setHomeGround] = useState('');
  const [crestImage, setCrestImage] = useState<string | null>(null);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isShortFocused, setIsShortFocused] = useState(false);
  const [isGroundFocused, setIsGroundFocused] = useState(false);

  const pickImage = () => {
    Alert.alert(
      'Upload Crest',
      'Choose logo/crest source:',
      [
        {
          text: 'Upload Custom Crest Logo',
          onPress: () => {
            setCrestImage('https://lh3.googleusercontent.com/aida-public/AB6AXuBBw-4P6Sarj_JWrpBQTQN1qPB7_qfFBuMUHMn-KCC2wKP9Geo1TQktr-gYmylaiuxwiQdZlcRL2It_FwPlayback');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: '#f7f9fb' }}
      contentContainerStyle={styles.scroll}
    >
      {/* ── Top Hero Card ────────────────────────────── */}
      <View style={[styles.heroCard, Shadows.level2]}>
        <View style={styles.heroContent}>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>FOUNDATION</ThemedText>
          </View>
          <ThemedText style={styles.heroTitle}>Build Your Legacy</ThemedText>
          <ThemedText style={styles.heroDescription}>
            Define the core identity of your squad. From home grounds to visual branding, every detail counts in the pursuit of peak performance.
          </ThemedText>
          
          <View style={styles.heroActionBtn}>
            <MaterialIcons name="security" size={14} color="#ffc703" />
            <ThemedText style={styles.heroActionText}>Apex Professional Standards</ThemedText>
          </View>
        </View>
        
        {/* Background Graphic Illustration - Abstract overlay */}
        <View style={styles.heroGraphicOverlay}>
            <Ionicons name="people-circle" size={120} color="rgba(255,255,255,0.05)" />
        </View>
      </View>

      {/* ── Identity & Branding Card ───────────────────── */}
      <View style={[styles.bentoCard, Shadows.level2]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <MaterialIcons name="branding-watermark" size={18} color="#1c1c1e" />
          </View>
          <View>
            <ThemedText style={styles.cardTitle}>Identity & Branding</ThemedText>
            <ThemedText style={styles.cardSubtitle}>How the world recognizes your team.</ThemedText>
          </View>
        </View>

        <View style={styles.compactRow}>
          {/* Crest Upload */}
          <View style={styles.crestUploadWrapper}>
            <Pressable style={styles.crestBox} onPress={pickImage}>
              {crestImage ? (
                <Image source={{ uri: crestImage }} style={styles.crestImage} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color="#74777f" />
                  <ThemedText style={styles.crestLabelText}>CREST</ThemedText>
                </>
              )}
              <View style={styles.editBadge}>
                <MaterialIcons name="edit" size={10} color="#594400" />
              </View>
            </Pressable>
          </View>
          
          <View style={styles.crestTextWrapper}>
            <ThemedText style={styles.fieldLabelBlack}>Team crest / logo</ThemedText>
            <ThemedText style={styles.cardSubtitle}>Upload PNG/JPG crest (min 200x200px)</ThemedText>
          </View>
        </View>

        <View style={styles.formDivider} />

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.fieldLabel}>Team Name</ThemedText>
          <TextInput
            style={[styles.underlinedInput, isNameFocused && styles.underlinedInputFocused]}
            placeholder="e.g. London Strikers"
            placeholderTextColor="#8e8e93"
            value={teamName}
            onChangeText={setTeamName}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />
        </View>

        <View style={styles.twoColumnInputs}>
          <View style={styles.halfInput}>
            <ThemedText style={styles.fieldLabel}>Short Name</ThemedText>
            <TextInput
              style={[styles.underlinedInput, isShortFocused && styles.underlinedInputFocused]}
              placeholder="e.g. LSR"
              placeholderTextColor="#8e8e93"
              value={shortName}
              onChangeText={setShortName}
              maxLength={4}
              autoCapitalize="characters"
              onFocus={() => setIsShortFocused(true)}
              onBlur={() => setIsShortFocused(false)}
            />
          </View>
          
          <View style={styles.halfInput}>
            <ThemedText style={styles.fieldLabel}>Sport</ThemedText>
            <View style={styles.sportIconRow}>
              {SPORTS.map((sport) => {
                const isActive = selectedSport === sport.name;
                return (
                  <Pressable 
                    key={sport.name} 
                    onPress={() => setSelectedSport(sport.name)}
                    style={[styles.sportIconButton, isActive && styles.sportIconActive]}
                  >
                    <MaterialIcons 
                      name={sport.icon as any} 
                      size={20} 
                      color={isActive ? '#ffffff' : '#74777f'} 
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* ── Venue Card ─────────────────────────────────── */}
      <View style={[styles.bentoCard, Shadows.level2]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <MaterialIcons name="stadium" size={18} color="#1c1c1e" />
          </View>
          <View>
            <ThemedText style={styles.cardTitle}>Venue</ThemedText>
            <ThemedText style={styles.cardSubtitle}>Where you defend your pride.</ThemedText>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.fieldLabel}>Home Ground Name</ThemedText>
          <TextInput
            style={[styles.underlinedInput, isGroundFocused && styles.underlinedInputFocused]}
            placeholder="e.g. Apex Central Arena"
            placeholderTextColor="#8e8e93"
            value={homeGround}
            onChangeText={setHomeGround}
            onFocus={() => setIsGroundFocused(true)}
            onBlur={() => setIsGroundFocused(false)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  /* Hero Card */
  heroCard: {
    backgroundColor: '#001b3d',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGraphicOverlay: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.8,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffc703',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: '#ffc703',
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  heroTitle: {
    // Top card font style should be same as dashboard
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 8,
  },
  heroDescription: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: '85%',
  },
  heroActionBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  heroActionText: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontSize: 11,
    color: '#ffffff',
  },

  /* Bento Cards */
  bentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 15,
    color: '#1c1c1e',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: 'HankenGrotesk_400Regular',
    fontSize: 12,
    color: '#74777f',
  },

  /* Compact Forms */
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  crestUploadWrapper: {
    position: 'relative',
  },
  crestBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c4c6cf',
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crestImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  crestLabelText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 9,
    color: '#74777f',
    marginTop: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffc703',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  crestTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  fieldLabelBlack: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 13,
    color: '#1c1c1e',
    marginBottom: 2,
  },
  formDivider: {
    height: 1,
    backgroundColor: '#f2f4f6',
    marginVertical: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 11,
    color: '#44474e',
    marginBottom: 6,
  },
  underlinedInput: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 14,
    color: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#c4c6cf',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  underlinedInputFocused: {
    borderBottomColor: '#001b3d',
  },
  twoColumnInputs: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  halfInput: {
    flex: 1,
  },
  sportIconRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  sportIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f2f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportIconActive: {
    backgroundColor: '#001b3d',
  },
});
