import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function TabIcon({ 
  focused, 
  color, 
  iconName, 
  library = 'Ionicons' 
}: { 
  focused: boolean; 
  color: any; 
  iconName: string; 
  library?: 'Ionicons' | 'MaterialCommunityIcons';
}) {
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.iconWrapperActive
      ]}>
        {library === 'Ionicons' ? (
          <Ionicons 
            name={focused ? iconName as any : `${iconName}-outline` as any} 
            size={20} 
            color={color} 
          />
        ) : (
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={22} 
            color={color} 
          />
        )}
      </View>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#feae2c', // Gold
        tabBarInactiveTintColor: '#81919c', // Muted Navy Gray
        tabBarStyle: {
          backgroundColor: '#05151e', // Dark Navy background (Technical OS contrast)
          borderTopWidth: 1,
          borderTopColor: 'rgba(254, 174, 44, 0.08)', // Premium subtle border
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
          fontFamily: 'PlusJakartaSans_700Bold',
          fontSize: 10,
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
            <TabIcon focused={focused} color={color} iconName="football" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Book',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="soccer-field" library="MaterialCommunityIcons" />
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
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} iconName="people" />
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
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 52,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(254, 174, 44, 0.15)', // Premium soft gold glow backdrop
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#feae2c', // Sleek gold active dot
  },
});
