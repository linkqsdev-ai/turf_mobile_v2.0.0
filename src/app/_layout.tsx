import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f4f4f7', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#05151e" />
      </View>
    );
  }

  // Use custom theme base matching Apex Velocity color specs
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#f4f4f7',
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

  return (
    <ThemeProvider value={customLightTheme}>
      <StatusBar style="dark" />
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
      </Stack>
    </ThemeProvider>
  );
}
