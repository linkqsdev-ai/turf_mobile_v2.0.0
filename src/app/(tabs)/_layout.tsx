import React, { useEffect, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ThemedText } from '@/components/themed-text';

function TabIcon({ 
  focused, 
  color, 
  iconName, 
  library = 'Ionicons',
  isBook = false
}: { 
  focused: boolean; 
  color: any; 
  iconName: string; 
  library?: 'Ionicons' | 'MaterialCommunityIcons';
  isBook?: boolean;
}) {
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (isBook) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isBook]);

  return (
    <Animated.View 
      style={[
        styles.iconContainer, 
        isBook && styles.iconContainerBook,
        isBook && { transform: [{ translateY: -12 }, { scale: pulseAnim }] }
      ]}
    >
      <View style={[
        styles.iconWrapper,
        focused && styles.iconWrapperActive,
        isBook && styles.iconWrapperBook,
        isBook && focused && styles.iconWrapperBookActive
      ]}>
        {library === 'Ionicons' ? (
          <Ionicons 
            name={focused ? iconName as any : `${iconName}-outline` as any} 
            size={20} 
            color={isBook ? (focused ? '#5D68E8' : '#00ffd0') : color} 
          />
        ) : (
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={24} 
            color={isBook ? (focused ? '#5D68E8' : '#00ffd0') : color} 
          />
        )}
      </View>
      {focused && !isBook && <View style={styles.activeDot} />}
    </Animated.View>
  );
}

export default function TabLayout() {
  const { profile } = useUserProfile();
  const role = profile.role || 'Player';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff', // White
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)', // Muted White
        tabBarStyle: {
          backgroundColor: '#5D68E8', // Primary Blue
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.15)', // Premium subtle border
          height: Platform.OS === 'ios' ? 90 : 76,
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
          paddingTop: 8,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 15,
        },
        tabBarLabelStyle: {
          fontFamily: 'Sora_500Medium', // Premium attractive regular font
          fontSize: 8.8, // Slightly reduced to fit "TOURNAMENT" fully on all devices
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="calendar-number" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: ({ focused }) => (
            <ThemedText 
              style={{ 
                color: focused ? '#00ffd0' : '#a7f3d0', 
                fontFamily: focused ? 'Sora_800ExtraBold' : 'Sora_700Bold', 
                fontSize: 8.8, 
                letterSpacing: 0.5, 
                textTransform: 'uppercase', 
                marginTop: 4,
                textAlign: 'center'
              }}
            >
              Turf Book
            </ThemedText>
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              iconName="stadium" 
              library="MaterialCommunityIcons" 
              isBook={true} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournament',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="trophy" />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          href: (role === 'Player' || role === 'Super Admin') ? undefined : null,
          title: 'Connect',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="share-social" />
          ),
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          href: (role === 'Organizer' || role === 'Super Admin') ? undefined : null,
          title: 'Club',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="shield-checkmark" />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          href: (role === 'Owner' || role === 'Coach' || role === 'Super Admin') ? undefined : null,
          title: role === 'Owner' ? 'Add Turf' : 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              iconName={role === 'Owner' ? 'soccer-field' : 'account-tie'}
              library="MaterialCommunityIcons"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 60,
  },
  iconContainerBook: {
    transform: [{ translateY: -12 }], // Floating Central Button shift up
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 52,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Premium soft white glow backdrop
  },
  iconWrapperBook: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 255, 208, 0.15)', // Semi-transparent neon green
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 208, 0.4)',
    // Shadow for premium floating look
    shadowColor: '#00ffd0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrapperBookActive: {
    backgroundColor: '#00ffd0',
    borderColor: '#00ffd0',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff', // Sleek white active dot
  },
});
