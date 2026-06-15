import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Import Tabs
import { MatchesHomeTab } from '@/components/matches/MatchesHomeTab';
import { CreateTeamTab } from '@/components/matches/CreateTeamTab';
import { CreatePlayerTab } from '@/components/matches/CreatePlayerTab';
import { BidMatchTab } from '@/components/matches/BidMatchTab';
import { QuickMatchTab } from '@/components/matches/QuickMatchTab';

const TABS = ['Home', 'New Team', 'New Player', 'Bid Match', 'Quick Match'];

const getTabIcon = (tab: string, isActive: boolean) => {
  const color = isActive ? "#ffffff" : "#64748b";
  switch(tab) {
    case 'Home': return <MaterialIcons name="home" size={12} color={color} />;
    case 'New Team': return <MaterialIcons name="group-add" size={12} color={color} />;
    case 'New Player': return <MaterialIcons name="person-add" size={12} color={color} />;
    case 'Bid Match': return <MaterialIcons name="handshake" size={12} color={color} />;
    case 'Quick Match': return <MaterialIcons name="bolt" size={12} color={color} />;
    default: return null;
  }
};

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Home');
  const [coinTossVisible, setCoinTossVisible] = useState(false);

  const renderActiveTab = () => {
    return (
      <View style={{ flex: 1 }}>
        {activeTab === 'Home' && <MatchesHomeTab />}
        {activeTab === 'New Team' && <CreateTeamTab />}
        {activeTab === 'New Player' && <CreatePlayerTab />}
        {activeTab === 'Bid Match' && <BidMatchTab />}
        {activeTab === 'Quick Match' && <QuickMatchTab />}
      </View>
    );
  };

  return (
    <GradientContainer screenName="matches" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.profileIconButton} onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI' }}
                style={styles.headerAvatar}
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 }}>
                Azarudeen
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  London, UK
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/network')}>
              <Ionicons name="pulse" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <FontAwesome5 name="coins" size={16} color={theme.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Top Tab Bar Navigation */}
        <View style={styles.tabBarWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab;
              const isLast = index === TABS.length - 1;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabItem,
                    { marginRight: isLast ? 0 : 4 }, // Use explicit margin instead of gap
                    isActive 
                      ? { backgroundColor: theme.primary, borderColor: 'transparent' } 
                      : { backgroundColor: theme.surfaceHigh, borderColor: 'transparent' }
                  ]}
                >
                  {getTabIcon(tab, isActive)}
                  {tab !== 'Home' && (
                    <ThemedText style={{
                      color: isActive ? '#ffffff' : theme.textSecondary,
                      fontFamily: isActive ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
                      fontSize: 10,
                      marginLeft: 4,
                    }}>
                      {tab}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Tab Content */}
        <Reanimated.View 
          key={activeTab} // Using key to trigger re-animation on tab change
          entering={FadeIn.duration(300)} 
          style={{ flex: 1 }}
        >
          {renderActiveTab()}
        </Reanimated.View>

      </SafeAreaView>
      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </GradientContainer>
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
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#5D68E8',
  },
  headerTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: 4,
  },
  profileIconButton: {
    padding: 2,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    paddingBottom: 10,
  },
  tabBarScroll: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md * 2, // Extra padding to prevent cut off
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 0,
  },
});
