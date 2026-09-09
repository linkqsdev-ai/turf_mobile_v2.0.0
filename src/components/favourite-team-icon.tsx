import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * The app-wide "Favourite Team" glyph — a red bookmark ribbon with a heart
 * cut into it. Built from two stacked Ionicons (no extra vector-icon asset
 * or new dependency needed) so it stays crisp at any size and matches the
 * rest of the icon set's rendering behavior.
 *
 * Use this everywhere a team's favourite status is shown (badges, list rows,
 * toggle buttons) instead of a plain star, so the concept reads consistently
 * across the app.
 */

export const FAVOURITE_TEAM_RIBBON = '#F0453D';
export const FAVOURITE_TEAM_HEART = '#F5F5F5';

export function FavouriteTeamIcon({ size = 16 }: { size?: number }) {
  const heartSize = size * 0.46;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="bookmark" size={size} color={FAVOURITE_TEAM_RIBBON} />
      <Ionicons
        name="heart"
        size={heartSize}
        color={FAVOURITE_TEAM_HEART}
        style={{ position: 'absolute', left: (size - heartSize) / 2, top: size * 0.24 }}
      />
    </View>
  );
}
