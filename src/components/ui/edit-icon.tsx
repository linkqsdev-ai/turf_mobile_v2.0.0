import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export function EditIcon({
  size = 14,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={require('@/assets/images/icons/edit_icon.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}

export default EditIcon;
