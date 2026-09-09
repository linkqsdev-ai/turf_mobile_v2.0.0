import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useTokens } from '@/hooks/use-scheme';
import { Text } from '@/components/ui/text';

type IconLib = 'ion' | 'mc';

function TabIcon({
  focused,
  name,
  lib = 'ion',
}: {
  focused: boolean;
  name: string;
  lib?: IconLib;
}) {
  const t = useTokens();
  const color = focused ? t.primary : t.mutedForeground;
  return (
    <View
      style={{
        height: 25,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: focused ? t.primary + '18' : 'transparent',
      }}
    >
      {lib === 'ion' ? (
        <Ionicons name={(focused ? name : `${name}-outline`) as any} size={16} color={color} />
      ) : (
        <MaterialCommunityIcons name={name as any} size={18} color={color} />
      )}
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  const t = useTokens();
  const isTurfBook = label === 'Turf Book';
  return (
    <View style={{ alignItems: 'center', marginTop: 0.5 }}>
      <Text
        numberOfLines={1}
        style={{
          fontSize: isTurfBook ? 8 : 8.5,
          fontWeight: focused ? '600' : '500',
          letterSpacing: 0.2,
          textTransform: 'uppercase',
          color: focused ? t.primary : isTurfBook ? t.primary : t.mutedForeground,
        }}
      >
        {label}
      </Text>
      {focused && (
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: t.primary,
            marginTop: 1.5,
          }}
        />
      )}
    </View>
  );
}

/** Centre "Turf Book" action — an animated, floating stadium puck. */
function BookTab({ focused }: { focused: boolean }) {
  const t = useTokens();

  // Floating vertical motion (smooth bobbing up and down)
  const floatY = useSharedValue(0);
  const breathScale = useSharedValue(1);

  // Radial energy pulse
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.55);

  useEffect(() => {
    // 1. Continuous smooth floating up and down
    floatY.value = withRepeat(
      withSequence(
        withTiming(-2.5, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    // 2. Subtle organic breathing / scale pulsation
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // 3. Radial ripple wave expanding outward
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: breathScale.value },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 44, overflow: 'visible' }}>
      {/* Animated pulsating halo behind the puck */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: 39,
            height: 39,
            borderRadius: 19.5,
            backgroundColor: t.primary,
          },
          haloStyle,
        ]}
      />

      {/* Main Elevated Floating Stadium Puck */}
      <Animated.View style={floatStyle}>
        <LinearGradient
          colors={focused ? ['#00FFA3', '#00C878', '#009050'] : [t.primary + '38', t.primary + '14']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{
            width: 39,
            height: 39,
            borderRadius: 19.5,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: focused ? '#82FF78' : t.primary + '65',
            shadowColor: '#00C878',
            shadowOpacity: focused ? 0.55 : 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 5,
          }}
        >
          <MaterialCommunityIcons
            name="stadium-variant"
            size={19}
            color={focused ? '#04140D' : t.primary}
          />

          {/* Live glowing beacon pip */}
          <View
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#82FF78',
              borderWidth: 1,
              borderColor: t.card,
              shadowColor: '#82FF78',
              shadowOpacity: 0.8,
              shadowRadius: 3,
              elevation: 3,
            }}
          />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { profile } = useUserProfile();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const role = profile.role || 'Player';
  const isSuperAdmin = role === 'Super Admin' || role === 'Admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          overflow: 'visible',
          height: (Platform.OS === 'ios' ? 57 : 53) + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 4,
          paddingTop: 3,
          backgroundColor: t.card,
          borderTopWidth: 1,
          borderTopColor: t.border + '50',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -2 },
          elevation: 10,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="home" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="tennisball" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Matches" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarItemStyle: { overflow: 'visible' },
          tabBarIcon: ({ focused }) => <BookTab focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Turf Book" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="trophy" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Cups" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          href: isSuperAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="share-social" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Connect" focused={focused} />
          ),
        }}
      />
      {/* Organizer's create surface. Mirrors how the Owner's tab becomes
          "Add Turf" — the trophy already belongs to the Cups tab, so this uses
          an explicit add glyph rather than a second trophy. */}
      <Tabs.Screen
        name="club"
        options={{
          href: role === 'Organizer' || isSuperAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} lib="mc" name="tournament" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Host" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          href: role === 'Organizer' ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              lib={role === 'Player' ? 'ion' : 'mc'}
              name={role === 'Player' ? 'school' : role === 'Owner' ? 'soccer-field' : 'whistle'}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label={role === 'Player' ? 'Class' : role === 'Owner' ? 'Add Turf' : 'Coach'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
