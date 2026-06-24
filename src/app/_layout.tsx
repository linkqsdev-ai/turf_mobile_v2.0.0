import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const theme = useColorScheme();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    // Alias all previous font names to Plus Jakarta Sans to automatically capture all hardcoded styles
    HankenGrotesk_400Regular: PlusJakartaSans_400Regular,
    HankenGrotesk_500Medium: PlusJakartaSans_500Medium,
    HankenGrotesk_600SemiBold: PlusJakartaSans_600SemiBold,
    HankenGrotesk_700Bold: PlusJakartaSans_700Bold,
    HankenGrotesk_800ExtraBold: PlusJakartaSans_800ExtraBold,
    Figtree_400Regular: PlusJakartaSans_400Regular,
    Figtree_500Medium: PlusJakartaSans_500Medium,
    Figtree_600SemiBold: PlusJakartaSans_600SemiBold,
    Figtree_700Bold: PlusJakartaSans_700Bold,
    Figtree_800ExtraBold: PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#05151e" />
      </View>
    );
  }

  // Use custom theme base matching Apex Velocity color specs
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
      card: '#ffffff',
      text: '#111c2c',
      border: '#c3c7cb',
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0d1d26',
      card: '#12202a',
      text: '#f9f9ff',
      border: '#43474b',
    },
  };

  const customBlueTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F5F6FA',
      card: '#ffffff',
      text: '#2D2D2D',
      border: '#cbd5e1',
    },
  };

  const activeNavigationTheme = theme === 'blue'
    ? customBlueTheme
    : theme === 'dark'
      ? customDarkTheme
      : customLightTheme;

  const isDark = theme === 'dark';

  return (
    <ThemeProvider value={activeNavigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="details" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="booking" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="book-coach" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="scoring" 
          options={{ 
            animation: 'slide_from_bottom', 
            presentation: 'modal' 
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="player-profile" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="network" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="edit-profile" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="enroll" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="create-tournament" 
          options={{ 
            animation: 'slide_from_bottom', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="tournament-details" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="team-registration" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="team-management" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
        <Stack.Screen 
          name="fixture-management" 
          options={{ 
            animation: 'slide_from_right', 
            presentation: 'card' 
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
