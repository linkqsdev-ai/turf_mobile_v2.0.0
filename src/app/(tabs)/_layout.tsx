import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';

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
  return (
    <View style={[styles.iconContainer, isBook && styles.iconContainerBook]}>
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
            color={isBook && focused ? '#05151e' : color} 
          />
        ) : (
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={24} 
            color={isBook ? (focused ? '#05151e' : '#feae2c') : color} 
          />
        )}
      </View>
      {focused && !isBook && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
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
          fontFamily: 'HankenGrotesk_700Bold', // Premium attractive font family
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
          title: 'Book',
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
    backgroundColor: 'rgba(254, 174, 44, 0.15)', // Premium soft gold glow backdrop
  },
  iconWrapperBook: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: '#12202a',
    borderWidth: 1.5,
    borderColor: 'rgba(254, 174, 44, 0.4)',
    // Shadow for premium floating look
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrapperBookActive: {
    backgroundColor: '#feae2c',
    borderColor: '#feae2c',
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
