import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GradientContainerProps {
  children: React.ReactNode;
  screenName: string;
  style?: ViewStyle;
}

export function GradientContainer({ children, screenName, style }: GradientContainerProps) {
  const theme = useColorScheme(); // 'light' | 'dark' | 'blue'

  // Define gradients per screen and theme
  let colors: [string, string, ...string[]] = ['#ffffff', '#ffffff'];

  if (theme === 'dark') {
    switch (screenName) {
      case 'home':
        colors = ['#0d1d26', '#08131a'];
        break;
      case 'matches':
        colors = ['#16102b', '#0d081f'];
        break;
      case 'explore':
        colors = ['#0a1829', '#060f1c'];
        break;
      case 'tournaments':
        colors = ['#0d1d26', '#08131a'];
        break;
      case 'teams':
      case 'network':
        colors = ['#07221d', '#03110e'];
        break;
      case 'booking':
      case 'create-tournament':
      case 'team-registration':
      case 'create-team':
      case 'create-player':
        colors = ['#0d1d26', '#122430', '#08131a'];
        break;
      case 'details':
      case 'tournament-details':
      case 'player-profile':
      case 'team-management':
      case 'fixture-management':
        colors = ['#0d1d26', '#0d1d26'];
        break;
      case 'profile':
      case 'edit-profile':
        colors = ['#150d28', '#0c071a'];
        break;
      case 'scoring':
        colors = ['#0a0f12', '#050708'];
        break;
      default:
        colors = ['#0d1d26', '#08131a'];
    }
  } else {
    // Light & Blue Themes: Premium light gray gradient for all screens background
    colors = ['#ffffff', '#f5f6fa', '#e4e7eb'];
  }

  return (
    <LinearGradient
      colors={colors}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
