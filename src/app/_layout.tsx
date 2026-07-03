import { Stack, ThemeProvider, DarkTheme, DefaultTheme, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppStoreProvider } from '@/store/app-store';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProfile } from '@/hooks/use-user-profile';

// ── Nested layout navigation component with auth gating ─────────────────────────
function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { updateProfile } = useUserProfile();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('@turf_auth_token');
        const userProfileStr = await AsyncStorage.getItem('@turf_user_profile');

        if (userProfileStr) {
          try {
            const storedUser = JSON.parse(userProfileStr);
            updateProfile({
              name: storedUser.name,
              role: storedUser.role,
              location: storedUser.location || 'London, UK',
              avatarUrl: storedUser.avatarUrl || require('@/assets/images/avatars/avatar_1.png'),
            });
          } catch (err) {
            console.error('RootNavigation: Failed to parse user profile', err);
          }
        }

        const inAuthGroup = segments[0] === '(auth)';

        if (!token) {
          // If not authenticated and not already in (auth) group, redirect to landing
          if (!inAuthGroup) {
            router.replace('/(auth)/landing');
          }
        } else {
          // If authenticated and in (auth) group, redirect to dashboard (tabs)
          if (inAuthGroup) {
            router.replace('/(tabs)');
          }
        }
      } catch (e) {
        console.error('RootNavigation: Failed to check auth status', e);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [segments]);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1d26', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5D68E8" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
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
        name="booking-confirmation" 
        options={{ 
          animation: 'slide_from_bottom', 
          presentation: 'modal' 
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
  );
}

export default function RootLayout() {
  const theme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'rn-web-autofill-fix';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.type = 'text/css';
        style.innerHTML = `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #F8F7F4 inset !important;
            -webkit-text-fill-color: #1a1a2e !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
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
    <AppStoreProvider>
      <ThemeProvider value={activeNavigationTheme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <RootNavigation />
      </ThemeProvider>
    </AppStoreProvider>
  );
}

