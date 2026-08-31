import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CoinTossModal } from '@/components/coin-toss-modal';
import Reanimated, { FadeIn, withRepeat, withTiming, withSequence, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';

// Import Tabs
import { MatchesHomeTab } from '@/components/matches/MatchesHomeTab';
import { CreateTeamTab } from '@/components/matches/CreateTeamTab';
import { CreatePlayerTab } from '@/components/matches/CreatePlayerTab';
import { BidMatchTab } from '@/components/matches/BidMatchTab';
import { QuickMatchTab } from '@/components/matches/QuickMatchTab';

import { useNotifications } from '@/context/NotificationContext';
import { useBidStore } from '@/store/app-store';

const TABS = ['Home', 'New Team', 'New Player', 'Bid Match', 'Quick Match'];

const getTabIcon = (tab: string, color: string) => {
  switch(tab) {
    case 'Home': return <MaterialIcons name="home" size={20} color={color} />;
    case 'New Team': return <MaterialIcons name="group-add" size={16} color={color} />;
    case 'New Player': return <MaterialIcons name="person-add" size={16} color={color} />;
    case 'Bid Match': return <MaterialIcons name="handshake" size={16} color={color} />;
    case 'Quick Match': return <MaterialIcons name="bolt" size={16} color={color} />;
    default: return null;
  }
};

const AnimatedTabItem = ({ tab, isActive, isLast, onPress, theme }: any) => {
  const isSpecial = tab === 'Bid Match' || tab === 'Quick Match';
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isSpecial && !isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [isSpecial, isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const color = isActive ? theme.primary : (isSpecial ? theme.error : theme.textSecondary);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabItem,
        isActive 
          ? { borderBottomColor: theme.primary } 
          : { borderBottomColor: 'transparent' }
      ]}
    >
      <Reanimated.View style={animatedStyle}>
        <View style={isSpecial && !isActive ? { backgroundColor: theme.error + '1a', padding: 4, borderRadius: 10, marginRight: 2 } : {}}>
          {getTabIcon(tab, color)}
        </View>
      </Reanimated.View>
      {tab !== 'Home' && (
        <ThemedText style={{
          color: color,
          fontFamily: isActive ? 'Sora_800ExtraBold' : (isSpecial ? 'Sora_700Bold' : 'Sora_600SemiBold'),
          fontSize: isSpecial ? 10 : 9,
          marginLeft: 2,
        }}>
          {tab}
        </ThemedText>
      )}
    </Pressable>
  );
};

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState('Home');
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [bidListModalVisible, setBidListModalVisible] = useState(false);
  const { openNotificationModal, unreadCount } = useNotifications();
  const { bids } = useBidStore();

  useEffect(() => {
    if (params.tab && TABS.includes(params.tab)) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const { profile } = useUserProfile();

  const renderActiveTab = () => {
    return (
      <View style={{ flex: 1 }}>
        {activeTab === 'Home' && <MatchesHomeTab />}
        {activeTab === 'New Team' && <CreateTeamTab onNavigate={setActiveTab} />}
        {activeTab === 'New Player' && <CreatePlayerTab />}
        {activeTab === 'Bid Match' && (
          <BidMatchTab
            showBidListModalExternal={bidListModalVisible}
            onCloseBidListModalExternal={() => setBidListModalVisible(false)}
          />
        )}
        {activeTab === 'Quick Match' && <QuickMatchTab onNavigate={setActiveTab} />}
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
                source={getAvatarSource(profile.avatarUrl)}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <ThemedText type="bodyLg" style={{ color: theme.text, fontFamily: 'Sora_700Bold', lineHeight: 18 }}>
                {profile.name}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={12} color={theme.secondary} />
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginLeft: 2, fontSize: 10 }}>
                  {getShortLocation(profile.location)}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            {/* 📋 Bid Match List Icon: only visible in Bid Match Tab and positioned before Notification icon */}
            {activeTab === 'Bid Match' && (
              <Pressable
                style={[styles.iconButton, { position: 'relative' }]}
                onPress={() => setBidListModalVisible(true)}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="clipboard-list-outline" size={22} color={theme.primary} />
                {bids.length > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      backgroundColor: '#EF4444',
                      borderRadius: 6,
                      minWidth: 14,
                      height: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    <ThemedText style={{ color: '#ffffff', fontSize: 8, fontFamily: 'Sora_700Bold' }}>
                      {bids.length}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            )}

            <Pressable style={[styles.iconButton, { position: 'relative' }]} onPress={openNotificationModal}>
              <Ionicons name="notifications-outline" size={20} color={theme.secondary} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: '#EF4444',
                    borderRadius: 6,
                    minWidth: 14,
                    height: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <ThemedText style={{ color: '#ffffff', fontSize: 8, fontFamily: 'Sora_700Bold' }}>
                    {unreadCount}
                  </ThemedText>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setCoinTossVisible(true)}>
              <Image
                source={require('@/assets/images/coin_toss_icon.png')}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>

        {/* Top Tab Bar Navigation */}
        <View style={styles.tabBarWrapper}>
          <View style={[styles.tabBarScroll, { flexDirection: 'row', justifyContent: 'space-between', width: '100%' }]}>
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab;
              const isLast = index === TABS.length - 1;
              return (
                <AnimatedTabItem
                  key={tab}
                  tab={tab}
                  isActive={isActive}
                  isLast={isLast}
                  onPress={() => setActiveTab(tab)}
                  theme={theme}
                />
              );
            })}
          </View>
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
  },
  tabBarScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
});
