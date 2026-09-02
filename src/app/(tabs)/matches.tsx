import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Reanimated, { FadeIn } from 'react-native-reanimated';

import { CoinTossModal } from '@/components/coin-toss-modal';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/use-scheme';
import { useUserProfile, getShortLocation } from '@/hooks/use-user-profile';
import { getAvatarSource } from '@/constants/avatars';

import { MatchesHomeTab } from '@/components/matches/MatchesHomeTab';
import { CreateTeamTab } from '@/components/matches/CreateTeamTab';
import { CreatePlayerTab } from '@/components/matches/CreatePlayerTab';
import { BidMatchTab } from '@/components/matches/BidMatchTab';
import { QuickMatchTab } from '@/components/matches/QuickMatchTab';

import { useNotifications } from '@/context/NotificationContext';
import { useBidStore } from '@/store/app-store';

const TABS = ['Home', 'New Team', 'New Player', 'Bid Match', 'Quick Match'];
const SHOW_CREATE_TABS = false;
const VISIBLE_TABS = SHOW_CREATE_TABS
  ? TABS
  : TABS.filter((t) => t !== 'New Team' && t !== 'New Player');

const TAB_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  'New Team': 'group-add',
  'New Player': 'person-add',
  'Bid Match': 'handshake',
  'Quick Match': 'bolt',
};

function Dot({ count, color }: { count: number; color?: string }) {
  if (count <= 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: color || '#EC4042',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: '500', color: '#FFFFFF' }}>{count}</Text>
    </View>
  );
}

export default function MatchesScreen() {
  const t = useTokens();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState('Home');
  const [coinTossVisible, setCoinTossVisible] = useState(false);
  const [bidListModalVisible, setBidListModalVisible] = useState(false);
  const { openNotificationModal, unreadCount } = useNotifications();
  const { bids } = useBidStore();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (params.tab && TABS.includes(params.tab)) setActiveTab(params.tab);
  }, [params.tab]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      {/* App bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          onPress={() => router.push('/profile')}
        >
          <Image
            source={getAvatarSource(profile.avatarUrl)}
            style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: t.primary }}
            contentFit="cover"
          />
          <View>
            <Text style={{ fontWeight: '500', fontSize: 13, color: t.foreground }}>{profile.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="location-sharp" size={11} color={t.mutedForeground} />
              <Text style={{ fontSize: 11, color: t.mutedForeground }}>{getShortLocation(profile.location)}</Text>
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {activeTab === 'Bid Match' ? (
            <Pressable
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              hitSlop={8}
              onPress={() => setBidListModalVisible(true)}
            >
              <MaterialCommunityIcons name="clipboard-list-outline" size={22} color={t.primary} />
              <Dot count={bids.length} color={t.primary} />
            </Pressable>
          ) : null}
          <Pressable
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            onPress={openNotificationModal}
          >
            <Ionicons name="notifications-outline" size={20} color={t.foreground} />
            <Dot count={unreadCount} color={t.destructive} />
          </Pressable>
          <Pressable
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setCoinTossVisible(true)}
          >
            <Image
              source={require('@/assets/images/coin_toss_icon.png')}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>

      {/* Segmented tab bar */}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          paddingHorizontal: 8,
        }}
      >
        {VISIBLE_TABS.map((tab) => {
          const active = activeTab === tab;
          const special = tab === 'Bid Match' || tab === 'Quick Match';
          const color = active ? t.primary : special ? t.accent : t.mutedForeground;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 12,
                paddingHorizontal: 6,
                borderBottomWidth: 2,
                borderBottomColor: active ? t.primary : 'transparent',
              }}
            >
              <MaterialIcons name={TAB_ICON[tab]} size={16} color={color} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: active ? '600' : '500',
                  color,
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Reanimated.View key={activeTab} entering={FadeIn.duration(260)} style={{ flex: 1 }}>
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
      </Reanimated.View>

      <CoinTossModal visible={coinTossVisible} onClose={() => setCoinTossVisible(false)} />
    </SafeAreaView>
  );
}
