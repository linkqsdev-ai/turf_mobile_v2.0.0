import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Modal,
  Switch,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';

const BANNERS: Record<string, any> = {
  football: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9H8hZV1gCxBOC9fWHjQyhn5ukWJhiNGuP6cNDATeIj2gP6JceuAOrhkqeTXWFS75Y0nw0QANCmhRdo0NYvbdmh4Xrs2itBjykGtZr0Y91KEzjUMyOoM-B-owetUT1u8vwmIZlGJkcKdkgVfU0TIGzuVVlTN3lhwfdg5OWwHMCKOyPJGWWdIKySwofsCUjnq9pJi4WH0BMDAi73A53u0OeKj_Ufmh6V4PVwghrjz5aX16NlvQZLOkQRC51252maP-4ZXwNw3MwVfU' }, // Premium Football Arena
  multisport: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5UnRgCz_j_xsBoTCePAImR1ZHOP1RfajoZLHKUgxQwU2qFlQ8NWyiYz_-6zqqufh9YnYe3jfTI8tuaUrjmH6obvvea2p2vYA7ndyut0M5-lxcOtwTVQQwh58VRPis3197lvVOpVGsJ6YCx55CCy4Q_1CqZxk1rVqp9mBGHM-rDNwh7PGYSDJt6Vq4tmn6G1gXGiZsm13J0D1BFkKFRb8WvrWqqyLWxu-oSZsnMp6YXOONRG89ypF-GKlh96WMcF3HOikmE9l-g' }, // Indoor Multisport Hub
  cricket: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgd1vfTA0Wj7Aw7aa0JRKzQ5y-6py-pQtMBI-gst90jIWFZoLSiIKBngPK1pn2UxzH_X3pN_lyCt75AnQxS2ssN4J4LUIYpph_JK48kGmSoO16OFhs5uLgsc_Yu3PIrOEneDELuLpKY8BDiUsatTLvRSu0sukxSfAxInyA2XknjvcswWPyUJA2YeNlJ2Vg2t7N807Cydno4uUCtypPyLkI0hi7Xl4DnWaNBueVN4jqiXqkqrc8MEPwQF24g45uu8z8gsXQ9IL87oI' }, // Cricket Pitch Night
  checkout: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrIeKWYsLxon2GlQroYjnKVPqbeEnzeZiUZZ66CS06N5lbQ6MVSfOE-hColTE6vO6R5n1-bbL_cX-FjW9ejhGGsOeF-oZuoniI7zrrjF_Im8cMeI1IQaIPPl2Mm_XTP52C0Hkood--_ZK22d3Y_tQbO8xBHh5eS8yONy6ot93tgSxXVz2H18xWI0l2EBv6WrOWm8NhnH_-kSXo0bhv0p-MeWPtkT0mEOuYpzsvJ9LUe3eu3QC6YZZU6zVrz5F5A68HtNAmq_qmBOw' }, // Cricket Pitch Daylight
  community: { uri: 'https://lh3.googleusercontent.com/aida/AP1WRLsc-p9LNafOZ1s0XNvsry058SauJeeElNyBuxym6ZhiCwUG-0KP3qZ9-Sv9OP3OVnhWKioZVSoN3EOcZ2Kc1OJKGOZSB9ioEnBSpLCgsYN-AgQXrVnc2O42rAutO6l6aFEvLsUgBHN57i3-AzCKTfZRam7oDm5L2CnDWRLIXfdFRBK8iz2MsaYQVAdtk0OH1XwkBTPbr18Wr5zuBBhvwfiVQv44xHBz7SD6kBdiyxqkNCP8zmwoVF8DaWI' }, // Club Community
};

const TABS = ['Performance', 'Feed', 'Ranking', 'Profile'] as const;
type TabType = typeof TABS[number];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<TabType>('Profile');
  const role = profile.role || 'Player';
  // Settings states
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [pushNotify, setPushNotify] = useState(profile.pushNotifications ?? true);
  const [emailAlert, setEmailAlert] = useState(profile.emailAlerts ?? false);
  const [geminiKey, setGeminiKey] = useState(profile.geminiApiKey ?? '');
  const [claudeKey, setClaudeKey] = useState(profile.claudeApiKey ?? '');
  const [aiSuggestions, setAiSuggestions] = useState(profile.aiSuggestionsEnabled ?? true);
  const [aiGeneration, setAiGeneration] = useState(profile.aiGenerationEnabled ?? true);

  // AI model dropdown states
  const [selectedModel, setSelectedModel] = useState<'Gemini' | 'Claude'>('Gemini');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const handleSelectBanner = () => {
    Alert.alert(
      'Change Profile Banner',
      'Select a realistic mock arena cover for your banner:',
      [
        { text: 'Premium Football Arena', onPress: () => updateProfile({ bannerImage: 'football' }) },
        { text: 'Indoor Multisport Hub', onPress: () => updateProfile({ bannerImage: 'multisport' }) },
        { text: 'Cricket Pitch Night', onPress: () => updateProfile({ bannerImage: 'cricket' }) },
        { text: 'Cricket Pitch Daylight', onPress: () => updateProfile({ bannerImage: 'checkout' }) },
        { text: 'Club Community', onPress: () => updateProfile({ bannerImage: 'community' }) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleOpenSettings = () => {
    setPushNotify(profile.pushNotifications ?? true);
    setEmailAlert(profile.emailAlerts ?? false);
    setGeminiKey(profile.geminiApiKey ?? '');
    setClaudeKey(profile.claudeApiKey ?? '');
    setAiSuggestions(profile.aiSuggestionsEnabled ?? true);
    setAiGeneration(profile.aiGenerationEnabled ?? true);
    setSelectedModel((profile.claudeApiKey && !profile.geminiApiKey) ? 'Claude' : 'Gemini');
    setModelDropdownOpen(false);
    setSettingsVisible(true);
  };

  const handleSaveSettings = () => {
    updateProfile({
      pushNotifications: pushNotify,
      emailAlerts: emailAlert,
      geminiApiKey: geminiKey,
      claudeApiKey: claudeKey,
      aiSuggestionsEnabled: aiSuggestions,
      aiGenerationEnabled: aiGeneration,
    });
    setSettingsVisible(false);
    Alert.alert('Settings Saved', 'Preferences have been saved.');
  };
  return (
    <GradientContainer screenName="profile" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            {role === 'Owner' 
              ? 'Arena Owner Profile' 
              : role === 'Coach' 
              ? 'Coach Profile' 
              : role === 'Organizer' 
              ? 'Organizer Profile' 
              : 'Player Profile'}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={handleOpenSettings} style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Fixed Hero Profile Card (Mock-Matched Premium Layout) */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: '#0f1721', borderWidth: 0 }, Shadows.level2]}>
            {/* Banner Image */}
            <Image 
              source={BANNERS[profile.bannerImage || 'football']} 
              style={styles.heroBannerImage} 
              contentFit="cover"
            />
            
            {/* Edit Banner Option */}
            <Pressable 
              onPress={handleSelectBanner}
              style={styles.editBannerBtn}
            >
              <Ionicons name="camera" size={14} color="#ffffff" />
            </Pressable>
            
            {/* Avatar & Floating Actions Overlap Banner */}
            <View style={styles.avatarRow}>
              {/* Left Action Button (Edit Profile - moved from bottom) */}
              <Pressable 
                onPress={() => router.push('/edit-profile')}
                style={[styles.circularActionBtn, { backgroundColor: 'rgba(15, 23, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}
              >
                <Ionicons name="create-outline" size={14} color="#ffffff" />
              </Pressable>

              {/* Central Avatar */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImage}
                />
                <Pressable 
                  onPress={() => router.push('/edit-profile')}
                  style={[styles.avatarUploadBtn, { backgroundColor: theme.secondaryContainer }]}
                >
                  <Ionicons name="camera" size={10} color={theme.onSecondaryContainer} />
                </Pressable>
              </View>

              {/* Right Action Button (Share Stats - moved from bottom) */}
              <Pressable 
                onPress={() => {
                  Alert.alert('Share Stats', 'Your profile stats link has been copied to your clipboard!');
                }}
                style={[styles.circularActionBtn, { backgroundColor: 'rgba(15, 23, 33, 0.85)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}
              >
                <Ionicons name="share-social-outline" size={14} color="#ffffff" />
              </Pressable>
            </View>

            {/* Badges Row */}
            <View style={styles.badgeRow}>
              <View style={[styles.proBadgeCard, { backgroundColor: theme.secondaryContainer }]}>
                <ThemedText type="labelSm" style={{ color: theme.onSecondaryContainer, fontFamily: 'HankenGrotesk_700Bold', fontSize: 9 }}>
                  PRO ELITE
                </ThemedText>
              </View>
              <View style={[styles.diamondBadgeCard, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 }]}>
                <Ionicons name="diamond-outline" size={10} color="#ffffff" style={{ marginRight: 4 }} />
                <ThemedText type="labelSm" style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 9, letterSpacing: 0.5 }}>
                  DIAMOND TIER
                </ThemedText>
              </View>
            </View>

            {/* Member Date */}
            <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 4, fontSize: 10 }}>
              Member since {profile.memberSince.split(' ')[0]} {profile.memberSince.split(' ')[1]}
            </ThemedText>

            {/* Profile Info */}
            <View style={styles.heroInfo}>
              <ThemedText type="headlineMd" style={{ color: '#ffffff', fontSize: 22 }}>{profile.name}</ThemedText>
              <ThemedText type="bodySm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 13 }}>
                {role === 'Owner' 
                  ? 'Arena Owner' 
                  : role === 'Coach' 
                  ? 'Professional Coach' 
                  : role === 'Organizer' 
                  ? 'Tournament Organizer' 
                  : profile.position} • {profile.location}
              </ThemedText>
            </View>

            {/* Card Stats Grid (Mock Reference Alignment) */}
            <View style={[styles.cardStatsRow, { borderTopColor: 'rgba(255, 255, 255, 0.08)', borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
              {role === 'Owner' ? (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>1.2k</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Bookings</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>8.4k</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Visitors</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>3</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Pitches</ThemedText>
                  </View>
                </>
              ) : role === 'Coach' ? (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>48</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Trainees</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>320</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Coached Hrs</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>18</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Batches</ThemedText>
                  </View>
                </>
              ) : role === 'Organizer' ? (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>12</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Leagues</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>96</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Teams</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>24</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Hosted</ThemedText>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>142</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Matches</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>12.4k</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Followers</ThemedText>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
                  <View style={styles.cardStatItem}>
                    <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>89</ThemedText>
                    <ThemedText type="labelSm" style={{ color: '#94a3b8', marginTop: 2, fontSize: 10 }}>Wins</ThemedText>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Fixed Dynamic Tab Navigation Bar */}
        <View style={[styles.tabsContainer, { borderBottomColor: theme.outlineVariant + '22' }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const iconMap: Record<string, string> = {
              'Performance': isActive ? 'bar-chart' : 'bar-chart-outline',
              'Feed': isActive ? 'layers' : 'layers-outline',
              'Ranking': isActive ? 'trophy' : 'trophy-outline',
              'Profile': isActive ? 'person' : 'person-outline',
            };
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  isActive 
                    ? { borderBottomColor: theme.primary } 
                    : { borderBottomColor: 'transparent' }
                ]}
              >
                <Ionicons 
                  name={iconMap[tab] as any} 
                  size={14} 
                  color={isActive ? theme.primary : theme.textSecondary} 
                />
                <ThemedText
                  style={{
                    color: isActive ? theme.primary : theme.textSecondary,
                    fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
                    fontSize: 10,
                    marginLeft: 3,
                    letterSpacing: 0.2,
                  }}
                >
                  {tab}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Scrollable Tab Contents (Separate scroll zones for each tab) */}
        {activeTab === 'Performance' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* Vector Illustration Banner */}
            <View style={styles.section}>
              <Image 
                source={
                  role === 'Owner' 
                    ? require('@/assets/images/illustrations/stadium.png')
                    : role === 'Coach'
                    ? require('@/assets/images/illustrations/athletes.png')
                    : role === 'Organizer'
                    ? require('@/assets/images/illustrations/trophy.png')
                    : require('@/assets/images/illustrations/stadium.png')
                } 
                style={styles.illustrationBanner} 
                contentFit="cover"
              />
            </View>

            {/* Stats Bento Grid */}
            <View style={[styles.section, { marginTop: 0 }]}>
              {/* Tab Header with Icon */}
              <View style={styles.tabHeaderRow}>
                <Ionicons name="stats-chart-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  {role === 'Owner' 
                    ? 'BUSINESS OVERVIEW' 
                    : role === 'Coach' 
                    ? 'COACHING OVERVIEW' 
                    : role === 'Organizer' 
                    ? 'LEAGUE HOST OVERVIEW' 
                    : 'PERFORMANCE OVERVIEW'}
                </ThemedText>
              </View>

              {role === 'Owner' ? (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TURF OCCUPANCY</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>82%</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'HankenGrotesk_700Bold' }}>+8% W/W</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TOTAL BOOKINGS</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>312</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>58 New</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>FACILITY STATUS</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>PLATINUM</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>HOST</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '90%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : role === 'Coach' ? (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>HOURS COACHED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>180</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'HankenGrotesk_700Bold' }}>+15h Mo</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>ACTIVE STUDENTS</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>24</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>Pro Badge</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>COACH RATING</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>4.8</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>UEFA A</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '75%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : role === 'Organizer' ? (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES HOSTED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>18</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'HankenGrotesk_700Bold' }}>3 Active</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TEAMS MANAGED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>112</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>16 New</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>ORGANIZER RANK</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>GOLD</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>COMMISH</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '80%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.bentoContainer}>
                  <View style={styles.bentoRow}>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>MATCHES PLAYED</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>142</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.secondary, fontFamily: 'HankenGrotesk_700Bold' }}>+12% LY</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.bentoCell, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>TOTAL WINS</ThemedText>
                      <View style={styles.bentoValRow}>
                        <ThemedText type="displayLgMobile" style={{ color: theme.text }}>89</ThemedText>
                        <ThemedText type="labelSm" style={{ color: '#16a34a', fontFamily: 'HankenGrotesk_700Bold' }}>62.6% WR</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.skillCard, { backgroundColor: theme.primaryContainer }]}>
                    <Ionicons name="medal" size={80} color="rgba(255,255,255,0.03)" style={styles.skillCardDecor} />
                    <ThemedText type="labelSm" style={{ color: '#ffffff', letterSpacing: 0.5 }}>SKILL RATING</ThemedText>
                    <View style={styles.skillValRow}>
                      <ThemedText type="displayLgMobile" style={{ color: '#ffffff' }}>2,840</ThemedText>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff', marginLeft: Spacing.sm }}>PLATINUM</ThemedText>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <View style={[styles.progressBar, { backgroundColor: '#ffffff', width: '85%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Health Vitals */}
            <View style={[styles.section, { paddingBottom: 40 }]}>
              <View style={[styles.vitalsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <View style={styles.rowBetween}>
                  <ThemedText type="headlineSm">
                    {role === 'Owner' 
                      ? 'Financial Vitals' 
                      : role === 'Coach' 
                      ? 'Class Analytics' 
                      : role === 'Organizer' 
                      ? 'Hosting Vitals' 
                      : 'Health Vitals'}
                  </ThemedText>
                  <Ionicons name="pulse" size={18} color={theme.secondary} />
                </View>
                {role === 'Owner' ? (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Monthly Revenue</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>₹1,82,500</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Unpaid Dues</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#ef4444' }]} numberOfLines={1} adjustsFontSizeToFit>₹8,400</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Expenses (Avg)</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>₹42,000</ThemedText>
                    </View>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Avg Attendance</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>94%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Success Rate</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>88%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Weekly Classes</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>14 Sessions</ThemedText>
                    </View>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Avg Attendance</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>91%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Fair Play Score</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>4.9/5</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Dispute Rate</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>1.2%</ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Recovery Score</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: '#16a34a' }]} numberOfLines={1} adjustsFontSizeToFit>92%</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Heart Rate (Avg)</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>54 BPM</ThemedText>
                    </View>
                    <View style={styles.vitalItem}>
                      <ThemedText style={[styles.vitalLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>Sleep Quality</ThemedText>
                      <ThemedText style={[styles.vitalValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>Optimal</ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Feed' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.section, { paddingBottom: 40 }]}>
              {/* Tab Header with Icon */}
              <View style={styles.tabHeaderRow}>
                <Ionicons name="time-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  RECENT ACTIVITY
                </ThemedText>
              </View>
              
              <View style={styles.feedList}>
                {role === 'Owner' ? (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="construct-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Arena Pitch Refurbished</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Pitch B has been successfully upgraded to high-grade FIFA-pro astro turf. Open for booking!
                        </ThemedText>
                        <View style={styles.feedStatsBadgeRow}>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>PITCH B</ThemedText>
                          </View>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>UPGRADE</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="cash-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Summer Promo Success</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Our Happy Hour Weekday Promo saw a record 45 slot bookings this week, boosting morning occupancy by 32%.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="people-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Staff Training Complete</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Completed match coordinator training for all 6 weekend staff members for better user onboarding.
                        </ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Coach' ? (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="school-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>U-16 Striking Clinic Complete</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Successful 90-minute session training forwards in high-press scenarios and ball placement.
                        </ThemedText>
                        <View style={styles.feedStatsBadgeRow}>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>U16</ThemedText>
                          </View>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>CLINIC</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="trending-up-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Marcus Vance Level Up</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Marcus achieved elite tactical level in target man drills, now preparing for division finals.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="git-branch-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Tactical Blueprint Shared</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Coach shared a new 4-3-3 counter-attacking schema with all academy members.
                        </ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Organizer' ? (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Regents T10 Schedule</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Falcons FC vs Wolves match bracket and referee assignments finalized. Saturday, 15:00.
                        </ThemedText>
                        <View style={styles.feedStatsBadgeRow}>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>CRICKET</ThemedText>
                          </View>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>LEAGUE</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="document-text-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Rules Update: Player Subs</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Official tournament guidelines updated: 5 substitutions now allowed in all futsal cups.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Referee Appointments</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Marcus J. and Alan T. appointed for the upcoming weekend league games.
                        </ThemedText>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11' }]}>
                        <Ionicons name="trophy-outline" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Victory vs Titans XI</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>5 hrs ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Led Blue Falcons FC to a 4-2 win. Scored 2 goals and assisted 1. Named Match MVP!
                        </ThemedText>
                        <View style={styles.feedStatsBadgeRow}>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>2 Goals</ThemedText>
                          </View>
                          <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLow }]}>
                            <ThemedText type="labelSm" style={{ color: theme.text, fontSize: 9 }}>1 Assist</ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="barbell-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Strength Training</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Yesterday</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          Completed 75-minute explosive power session targeting fast-twitch leg muscle groups.
                        </ThemedText>
                      </View>
                    </View>
 
                    <View style={[styles.feedItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11' }]}>
                        <Ionicons name="ribbon-outline" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.feedContent}>
                        <View style={styles.rowBetween}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Achievement Unlocked</ThemedText>
                          <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>3 days ago</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, marginTop: 2, fontSize: 12.5, lineHeight: 18 }}>
                          {"Earned the \"Centurion\" badge for completing 100 competitive bookings this season."}
                        </ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <Pressable style={[styles.loadMoreBtn, { borderColor: theme.outline }]}>
                <ThemedText type="labelMd" style={{ color: theme.text }}>LOAD MORE ACTIVITIES</ThemedText>
              </Pressable>

              {/* Vector Illustration Footer */}
              <View style={[styles.feedFooterCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <Image 
                  source={require('@/assets/images/illustrations/team_huddle.png')} 
                  style={styles.huddleIllustration} 
                  contentFit="contain"
                />
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                  {role === 'Owner'
                    ? "Ensure regular arena sanitation and pitch maintenance for optimal customer reviews."
                    : role === 'Coach'
                    ? "Schedule weekly performance evaluations for your active roster."
                    : role === 'Organizer'
                    ? "Maintain fair play guidelines and referee integrity across all fixtures."
                    : "Stay active and coordinate with your squad for upcoming league games."}
                </ThemedText>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Ranking' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.section, { paddingBottom: 40 }]}>
              {/* Ranking Header Row with Illustration */}
              <View style={styles.rankingHeaderRow}>
                {/* Tab Header with Icon */}
                <View style={styles.tabHeaderRow}>
                  <Ionicons name="trophy-outline" size={18} color={theme.secondary} />
                  <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                    {role === 'Owner' 
                      ? 'TOP ARENA BOOKINGS RATING' 
                      : role === 'Coach' 
                      ? 'CERTIFIED PRO COACHES RATING' 
                      : role === 'Organizer' 
                      ? 'TOP LEAGUE ORGANIZERS RATING' 
                      : 'DIAMOND LEAGUE LEADERBOARD'}
                  </ThemedText>
                </View>
                <Image 
                  source={require('@/assets/images/illustrations/trophy.png')} 
                  style={styles.trophyIllustration} 
                  contentFit="contain"
                />
              </View>

              <View style={styles.leaderboardList}>
                {role === 'Owner' ? (
                  <>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=120&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Wembley Indoor Hub</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.9 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>4,920</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=120&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Chelsea Astro Arena</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.8 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>4,810</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image source={profile.avatarUrl} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>{profile.name} Arena (You)</ThemedText>
                          <View style={[styles.youTag, { backgroundColor: theme.primary }]}>
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 8, fontFamily: 'HankenGrotesk_700Bold' }}>YOU</ThemedText>
                          </View>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.7 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>4,240</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=120&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Stratford Green Fields</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>4.6 Rating • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>3,780</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>BKS</ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Coach' ? (
                  <>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Coach Alan Shearer</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA Pro • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>340</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Coach Alex Ferguson</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA Pro • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>290</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image source={profile.avatarUrl} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>Coach {profile.name} (You)</ThemedText>
                          <View style={[styles.youTag, { backgroundColor: theme.primary }]}>
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 8, fontFamily: 'HankenGrotesk_700Bold' }}>YOU</ThemedText>
                          </View>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA A • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>240</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Coach Pep Guardiola</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>UEFA Pro • Manchester</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>210</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>STUDENTS</ThemedText>
                      </View>
                    </View>
                  </>
                ) : role === 'Organizer' ? (
                  <>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Premier League Org</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Gold Status • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>142</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=120&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>London Futsal Comm.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Gold Status • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>98</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image source={profile.avatarUrl} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>{profile.name} (You)</ThemedText>
                          <View style={[styles.youTag, { backgroundColor: theme.primary }]}>
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 8, fontFamily: 'HankenGrotesk_700Bold' }}>YOU</ThemedText>
                          </View>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Silver Status • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>89</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=120&q=80' }} style={styles.rankAvatar} />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>City Sports Assoc.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Silver Status • Bristol</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>76</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>LEAGUES</ThemedText>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Pressable 
                      onPress={() => router.push('/player-profile')}
                      style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}
                    >
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#eab308' }]}>1</ThemedText>
                      <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Marcus V.</ThemedText>
                          <Ionicons name="checkmark-circle" size={14} color={theme.secondaryContainer} style={{ marginLeft: 4 }} />
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Forward • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>2,980</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </Pressable>

                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#94a3b8' }]}>2</ThemedText>
                      <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Sarah K.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Midfielder • Bristol</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>2,910</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.leaderboardRow, { backgroundColor: theme.primaryContainer + '11', borderColor: theme.primary, borderWidth: 1.5 }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: theme.primary }]}>3</ThemedText>
                      <Image
                        source={profile.avatarUrl}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>{profile.name} (You)</ThemedText>
                          <View style={[styles.youTag, { backgroundColor: theme.primary }]}>
                            <ThemedText type="labelSm" style={{ color: '#ffffff', fontSize: 8, fontFamily: 'HankenGrotesk_700Bold' }}>YOU</ThemedText>
                          </View>
                        </View>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>{profile.position} • {profile.location.split(',')[0]}</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.primary }}>2,840</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.leaderboardRow, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '22' }, Shadows.level2]}>
                      <ThemedText type="headlineSm" style={[styles.rankNumber, { color: '#b45309' }]}>4</ThemedText>
                      <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' }}
                        style={styles.rankAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Elena S.</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Midfielder • London</ThemedText>
                      </View>
                      <View style={styles.rankScoreCol}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', color: theme.text }}>2,780</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>PTS</ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Profile' && (
          <ScrollView 
            style={styles.tabScrollView} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* Bio Details Card */}
            <View style={styles.section}>
              {/* Tab Header with Icon */}
              <View style={styles.tabHeaderRow}>
                <Ionicons name="person-outline" size={18} color={theme.secondary} />
                <ThemedText type="labelMd" style={[styles.tabHeaderTitle, { color: theme.text }]}>
                  {role === 'Owner' 
                    ? 'FACILITY DETAILS & ANNOUNCEMENTS' 
                    : role === 'Coach' 
                    ? 'ACADEMY COACHING DETAILS' 
                    : role === 'Organizer' 
                    ? 'LEAGUE HOSTING DETAILS' 
                    : 'BIO DETAILS & TEAMS'}
                </ThemedText>
              </View>

              <View style={[styles.bioDetailsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                <View style={styles.bioHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="headlineSm">
                      {role === 'Owner' 
                        ? 'Business Details' 
                        : role === 'Coach' 
                        ? 'Coaching Details' 
                        : role === 'Organizer' 
                        ? 'Tournament Scope' 
                        : 'Bio Details'}
                    </ThemedText>
                  </View>
                  <Image 
                    source={
                      role === 'Owner'
                        ? require('@/assets/images/illustrations/stadium.png')
                        : role === 'Coach'
                        ? require('@/assets/images/illustrations/football_player.png')
                        : role === 'Organizer'
                        ? require('@/assets/images/illustrations/trophy.png')
                        : require('@/assets/images/illustrations/football_player.png')
                    } 
                    style={styles.bioIllustration} 
                    contentFit="contain"
                  />
                </View>
                
                {role === 'Owner' ? (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>FACILITY PITCHES</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>3 Astro, 1 Woodcourt</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>CATEGORY</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>Turf Provider</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PEAK HOURS</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>17:00-22:00 Daily</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>OPERATING SINCE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>March 2023</ThemedText>
                    </View>
                  </View>
                ) : role === 'Coach' ? (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>FOCUS AGE GROUP</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>U12, U16, Adults</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>CERTIFICATIONS</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>UEFA A, FA L3</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>TRAINING RATE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>₹800/hr (Indiv)</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>COACHING EXP</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>8+ Years</ThemedText>
                    </View>
                  </View>
                ) : role === 'Organizer' ? (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>TOURNAMENT TYPES</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>Knockout, Leagues</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>HOSTING SCOPE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>Local, Corporate</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>ENTRY FEE RULES</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>Paid / Sponsored</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>EQUIPMENT</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>Refs, Balls, Kits</ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.bioGrid}>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PREFERRED FOOT</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>{profile.preferredFoot}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PLAYING POSITION</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>{profile.position}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>PREFERRED STYLE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>{profile.playingStyle}</ThemedText>
                    </View>
                    <View style={styles.bioGridItem}>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, letterSpacing: 0.5, fontSize: 9 }}>MEMBER SINCE</ThemedText>
                      <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold', marginTop: 4, fontSize: 12 }}>{profile.memberSince}</ThemedText>
                    </View>
                  </View>
                )}
                
                <View style={{ borderTopWidth: 1, borderTopColor: theme.outlineVariant + '33', paddingTop: Spacing.md, marginTop: Spacing.md }}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5, fontSize: 9 }}>
                    {role === 'Owner' 
                      ? 'FACILITY DESCRIPTION' 
                      : role === 'Coach' 
                      ? 'ACADEMY PHILOSOPHY' 
                      : role === 'Organizer' 
                      ? 'LEAGUE STATEMENT' 
                      : 'BIO DESCRIPTION'}
                  </ThemedText>
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary, lineHeight: 18, fontSize: 12 }}>
                    {role === 'Owner' 
                      ? 'Providing premium, state-of-the-art sports facilities with high-grade infill turf and high-intensity LED floodlights for night play. Our courts are sanitized daily.' 
                      : role === 'Coach' 
                      ? 'Passionate about youth athlete development and tactical execution. Specializing in advanced attacking drills, visual positioning, and cognitive speed training.' 
                      : role === 'Organizer' 
                      ? 'Professional organizer dedicated to building clean, competitive leagues. Offering full match-day operations including referee assignments, live score tracking, and tournament brackets.' 
                      : profile.bio}
                  </ThemedText>
                </View>
              </View>
            </View>

            {role === 'Owner' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Active Pitch Reservations</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="football" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Footy Club Match Booking</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Pitch A • 17:00 - 18:00</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialCommunityIcons name="cricket" size={18} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Corporate Cricket Match</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Pitch B • 18:30 - 20:00</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>TODAY'S ESTIMATED REVENUE</ThemedText>
                    <ThemedText type="headlineLg" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'HankenGrotesk_800ExtraBold' }}>
                      ₹20,900
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ffffff', opacity: 0.8, marginTop: 4 }}>
                      12/12 Slots Fully Reserved Today
                    </ThemedText>
                    
                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff', marginTop: Spacing.md }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        VIEW DAILY INVOICES
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : role === 'Coach' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Active Trainee Batches</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="people-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Under-16 Advanced Class</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Pitch A • 15:30 - 17:00</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="person-outline" size={18} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Individual Mentoring Class</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Gym Area • 18:00 - 19:30</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>UPCOMING ACADEMY WORKSHOP</ThemedText>
                    <ThemedText type="labelMd" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'HankenGrotesk_700Bold' }}>
                      SUNDAY, 10:00 GMT
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ffffff', opacity: 0.8, marginTop: 4 }}>
                      Trainee Orientation & Tactical Breakdown
                    </ThemedText>
                    
                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff', marginTop: Spacing.md }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        SHARE SIGNUP LINK
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : role === 'Organizer' ? (
              <>
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">Active Tournament Brackets</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.primaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="trophy-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Regents T10 Super League</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Falcons FC vs Wolves (Bracket)</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <View style={[styles.feedIconBadge, { backgroundColor: theme.secondaryContainer + '11', borderRadius: 6, marginRight: Spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="flag-outline" size={18} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>London Futsal Fete Cup</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Tigers XI vs Mavericks (Futsal)</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>UPCOMING LEAGUE FINALS</ThemedText>
                    <ThemedText type="labelMd" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'HankenGrotesk_700Bold' }}>
                      SATURDAY, 15:00 GMT
                    </ThemedText>
                    <ThemedText type="bodySm" style={{ color: '#ffffff', opacity: 0.8, marginTop: 4 }}>
                      Regents T10 Super League Championship Cup
                    </ThemedText>
                    
                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff', marginTop: Spacing.md }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        VIEW BRACKET & RULES
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Teams Section */}
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="headlineSm">My Teams</ThemedText>
                    <Pressable>
                      <ThemedText type="labelMd" style={{ color: theme.secondary }}>VIEW ALL</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.teamList}>
                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <Image source={require('@/assets/images/illustrations/athletes.png')} style={styles.teamItemLogo} contentFit="cover" />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Elite Tennis Club</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Lead Member • Tier 1</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>

                    <View style={[styles.teamItemCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level2]}>
                      <Image source={require('@/assets/images/illustrations/tennis_player.png')} style={styles.teamItemLogo} contentFit="cover" />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="bodyMd" style={{ fontFamily: 'HankenGrotesk_700Bold' }}>Imperial Badminton</ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Active Pro • Regional</ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.outline} />
                    </View>
                  </View>
                </View>

                {/* Upcoming Matches */}
                <View style={[styles.section, { paddingBottom: 60 }]}>
                  <View style={[styles.upcomingCard, { backgroundColor: theme.primaryContainer }]}>
                    <ThemedText type="labelSm" style={{ color: '#ffffff' }}>UPCOMING MATCH</ThemedText>
                    <ThemedText type="labelMd" style={{ color: '#ffffff', marginTop: Spacing.half, fontFamily: 'HankenGrotesk_700Bold' }}>
                      SATURDAY, 18:30 GMT
                    </ThemedText>
                    
                    <View style={versusContainerStyle()}>
                      <View style={styles.versusTeam}>
                        <View style={styles.teamBadgeText}><ThemedText type="bodySm" style={{ color: '#ffffff', fontWeight: '800' }}>BF</ThemedText></View>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', marginTop: 4 }}>Falcons</ThemedText>
                      </View>
                      <ThemedText type="headlineSm" style={{ color: '#ffffff' }}>VS</ThemedText>
                      <View style={styles.versusTeam}>
                        <View style={styles.teamBadgeText}><ThemedText type="bodySm" style={{ color: '#ffffff', fontWeight: '800' }}>WS</ThemedText></View>
                        <ThemedText type="labelSm" style={{ color: '#ffffff', marginTop: 4 }}>Wolves</ThemedText>
                      </View>
                    </View>

                    <Pressable style={[styles.briefBtn, { backgroundColor: '#ffffff' }]}>
                      <ThemedText type="labelMd" style={{ color: theme.primary, fontWeight: '700' }}>
                        VIEW PRE-MATCH BRIEF
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}

      </SafeAreaView>

      {/* Settings Modal Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={[styles.modalSheet, { backgroundColor: theme.surfaceLowest }]}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', fontSize: 16 }}>Settings & AI Configuration</ThemedText>
                <Pressable onPress={() => setSettingsVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={{ flexShrink: 1 }}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* 1. Theme Section */}
                <View style={styles.modalSection}>
                  <ThemedText type="labelSm" style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>APPLICATION THEME</ThemedText>
                  <View style={styles.themeSelectorRow}>
                    <Pressable 
                      onPress={() => updateProfile({ theme: 'light' })}
                      style={[
                        styles.themeOptionBtn, 
                        profile.theme === 'light' 
                          ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }
                      ]}
                    >
                      <Ionicons 
                        name="sunny-outline" 
                        size={16} 
                        color={profile.theme === 'light' ? theme.onPrimary : theme.text} 
                      />
                      <ThemedText 
                        type="labelMd" 
                        style={[
                          styles.themeOptionText, 
                          { color: profile.theme === 'light' ? theme.onPrimary : theme.text }
                        ]}
                      >
                        Light
                      </ThemedText>
                    </Pressable>

                    <Pressable 
                      onPress={() => updateProfile({ theme: 'dark' })}
                      style={[
                        styles.themeOptionBtn, 
                        profile.theme === 'dark' 
                          ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }
                      ]}
                    >
                      <Ionicons 
                        name="moon-outline" 
                        size={16} 
                        color={profile.theme === 'dark' ? theme.onPrimary : theme.text} 
                      />
                      <ThemedText 
                        type="labelMd" 
                        style={[
                          styles.themeOptionText, 
                          { color: profile.theme === 'dark' ? theme.onPrimary : theme.text }
                        ]}
                      >
                        Dark
                      </ThemedText>
                    </Pressable>

                    <Pressable 
                      onPress={() => updateProfile({ theme: 'blue' })}
                      style={[
                        styles.themeOptionBtn, 
                        (profile.theme === 'blue' || !profile.theme)
                          ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                          : { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }
                      ]}
                    >
                      <Ionicons 
                        name="color-fill-outline" 
                        size={16} 
                        color={(profile.theme === 'blue' || !profile.theme) ? theme.onPrimary : theme.text} 
                      />
                      <ThemedText 
                        type="labelMd" 
                        style={[
                          styles.themeOptionText, 
                          { color: (profile.theme === 'blue' || !profile.theme) ? theme.onPrimary : theme.text }
                        ]}
                      >
                        Blue
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* 2. Notifications Section */}
                <View style={styles.modalSection}>
                  <ThemedText type="labelSm" style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>NOTIFICATIONS</ThemedText>
                  
                  <View style={styles.modalSwitchRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text }}>Push Notifications</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_500Medium', color: theme.textSecondary, marginTop: 2 }}>Receive alerts for matches, bookings, and chats</ThemedText>
                    </View>
                    <Switch
                      value={pushNotify}
                      onValueChange={setPushNotify}
                      trackColor={{ false: theme.surfaceLow, true: theme.primary }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  <View style={[styles.modalSwitchRow, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text }}>Email Alerts</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_500Medium', color: theme.textSecondary, marginTop: 2 }}>Receive weekly summary reports and invoicing</ThemedText>
                    </View>
                    <Switch
                      value={emailAlert}
                      onValueChange={setEmailAlert}
                      trackColor={{ false: theme.surfaceLow, true: theme.primary }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {/* 3. AI Integrations Section */}
                <View style={styles.modalSection}>
                  <ThemedText type="labelSm" style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>AI INTEGRATIONS & SUGGESTIONS</ThemedText>
                  
                  {/* Model Selector Dropdown */}
                  <View style={styles.inputContainer}>
                    <ThemedText type="labelMd" style={[styles.inputLabel, { color: theme.textSecondary }]}>SELECT AI MODEL</ThemedText>
                    <Pressable
                      onPress={() => setModelDropdownOpen(!modelDropdownOpen)}
                      style={[
                        styles.dropdownTrigger,
                        { 
                          backgroundColor: theme.surfaceLow, 
                          borderColor: modelDropdownOpen ? theme.primary : theme.outlineVariant + '44',
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons 
                          name={selectedModel === 'Gemini' ? 'logo-google' : 'sparkles-outline'} 
                          size={16} 
                          color={theme.primary} 
                        />
                        <ThemedText style={[styles.dropdownValue, { color: theme.text }]}>
                          {selectedModel === 'Gemini' ? 'Gemini (Google)' : 'Claude (Anthropic)'}
                        </ThemedText>
                      </View>
                      <Ionicons name={modelDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                    </Pressable>

                    {modelDropdownOpen && (
                      <View 
                        style={[
                          styles.dropdownList,
                          { 
                            backgroundColor: theme.surfaceLow, 
                            borderColor: theme.outlineVariant + '44',
                          }
                        ]}
                      >
                        <Pressable
                          onPress={() => {
                            setSelectedModel('Gemini');
                            setModelDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            {
                              borderBottomWidth: 1,
                              borderBottomColor: theme.outlineVariant + '22',
                              backgroundColor: selectedModel === 'Gemini' ? theme.primary + '11' : 'transparent',
                            }
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="logo-google" size={16} color={selectedModel === 'Gemini' ? theme.primary : theme.textSecondary} />
                            <ThemedText style={[styles.dropdownItemText, { color: theme.text }]}>Gemini (Google)</ThemedText>
                          </View>
                          {selectedModel === 'Gemini' && <Ionicons name="checkmark" size={16} color={theme.primary} />}
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            setSelectedModel('Claude');
                            setModelDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            {
                              backgroundColor: selectedModel === 'Claude' ? theme.primary + '11' : 'transparent',
                            }
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="sparkles-outline" size={16} color={selectedModel === 'Claude' ? theme.primary : theme.textSecondary} />
                            <ThemedText style={[styles.dropdownItemText, { color: theme.text }]}>Claude (Anthropic)</ThemedText>
                          </View>
                          {selectedModel === 'Claude' && <Ionicons name="checkmark" size={16} color={theme.primary} />}
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* API Key Input Container */}
                  <View style={[styles.inputContainer, { marginTop: Spacing.md }]}>
                    <ThemedText type="labelMd" style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      {selectedModel.toUpperCase()} API KEY
                    </ThemedText>
                    <TextInput
                      value={selectedModel === 'Gemini' ? geminiKey : claudeKey}
                      onChangeText={selectedModel === 'Gemini' ? setGeminiKey : setClaudeKey}
                      secureTextEntry
                      style={[styles.textInput, { backgroundColor: theme.surfaceLow, color: theme.text }]}
                      placeholder={`Enter ${selectedModel} API Key...`}
                      placeholderTextColor={theme.textSecondary + '77'}
                    />
                  </View>

                  <View style={[styles.modalSwitchRow, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text }}>AI Suggestions</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_500Medium', color: theme.textSecondary, marginTop: 2 }}>Enable automated description drafting & layouts</ThemedText>
                    </View>
                    <Switch
                      value={aiSuggestions}
                      onValueChange={setAiSuggestions}
                      trackColor={{ false: theme.surfaceLow, true: theme.primary }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  <View style={[styles.modalSwitchRow, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 13, fontFamily: 'HankenGrotesk_600SemiBold', color: theme.text }}>AI Media Tools</ThemedText>
                      <ThemedText style={{ fontSize: 11, fontFamily: 'HankenGrotesk_500Medium', color: theme.textSecondary, marginTop: 2 }}>Enable logo and profile picture generation helpers</ThemedText>
                    </View>
                    <Switch
                      value={aiGeneration}
                      onValueChange={setAiGeneration}
                      trackColor={{ false: theme.surfaceLow, true: theme.primary }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Action buttons */}
              <View style={styles.modalActionRow}>
                <Pressable 
                  onPress={handleSaveSettings} 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: '#ffffff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 13 }}>
                    SAVE CHANGES
                  </ThemedText>
                </Pressable>
                <Pressable 
                  onPress={() => setSettingsVisible(false)} 
                  style={[styles.secondaryActionBtn, { borderColor: theme.outline }]}
                >
                  <ThemedText style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', fontSize: 13 }}>
                    CANCEL
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </GradientContainer>
  );
}

// Helper to resolve scope check
function versusContainerStyle() {
  return styles.versusContainer;
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
  iconButton: {
    padding: 6,
  },
  heroSection: {
    paddingHorizontal: Spacing.containerMargin,
    marginTop: Spacing.xs,
  },
  heroCard: {
    borderRadius: BorderRadius.premium,
    padding: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 80, // Allow banner height layout offset
  },
  heroBannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 115,
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    zIndex: 10,
  },
  circularActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarUploadBtn: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  proBadgeCard: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.md,
  },
  diamondBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 8,
    alignItems: 'center',
  },
  heroInfo: {
    alignItems: 'center',
    marginTop: 6,
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginTop: Spacing.sm,
  },
  cardStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 24,
  },
  heroActionIconsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnOutline: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  editBannerBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 33, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 30,
  },
  
  // Tab Bar Styles
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    gap: 3,
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },

  // Independent Scroll Tab style
  tabScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },

  // Tab Content Header Style
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tabHeaderTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
    letterSpacing: 0.6,
  },

  // Vector Illustration Styles
  illustrationBanner: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.xl,
  },
  trophyIllustration: {
    width: 48,
    height: 48,
  },
  bioIllustration: {
    width: 44,
    height: 44,
    marginTop: -Spacing.xs,
  },
  huddleIllustration: {
    width: 100,
    height: 60,
  },
  feedFooterCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
  },

  // Bento Styles
  bentoContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bentoCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: 12,
  },
  bentoValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.half,
  },
  skillCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  skillCardDecor: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  skillValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Vitals Styles
  vitalsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  vitalItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(93, 104, 232, 0.05)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(93, 104, 232, 0.08)',
  },
  vitalLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  vitalValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    marginTop: 4,
    textAlign: 'center',
  },
 
  // Feed Styles
  feedList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  feedItemCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  feedIconBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  feedContent: {
    flex: 1,
  },
  feedStatsBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  loadMoreBtn: {
    width: '100%',
    height: 38,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
 
  // Leaderboard Styles
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaderboardList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
    fontFamily: 'HankenGrotesk_700Bold',
    marginRight: Spacing.xs,
  },
  rankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rankScoreCol: {
    alignItems: 'flex-end',
  },
  leagueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  youTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
 
  // Bio Details Styles
  bioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  bioDetailsCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: 14,
    marginTop: Spacing.xs,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.md,
    marginTop: Spacing.xs,
  },
  bioGridItem: {
    width: '50%',
    paddingRight: Spacing.sm,
  },
 
  // Team Styles
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  teamList: {
    gap: Spacing.sm,
  },
  teamItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
  },
  teamItemLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  
  // Upcoming Styles
  upcomingCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    alignItems: 'center',
  },
  versusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  versusTeam: {
    alignItems: 'center',
  },
  teamBadgeText: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  briefBtn: {
    width: '100%',
    height: 38,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 11,
    fontFamily: 'HankenGrotesk_700Bold',
  },

  // Modal Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 33, 0.7)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoiding: {
    width: '100%',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.premium,
    borderTopRightRadius: BorderRadius.premium,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: Spacing.sm,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: Spacing.xl,
  },
  modalSection: {
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#00000005',
    paddingBottom: Spacing.md,
  },
  modalSectionLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  textInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
    fontFamily: 'HankenGrotesk_500Medium',
    borderWidth: 1,
    borderColor: '#0000000a',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  primaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownTrigger: {
    height: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 13,
    fontFamily: 'HankenGrotesk_500Medium',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: 'HankenGrotesk_500Medium',
  },
});

