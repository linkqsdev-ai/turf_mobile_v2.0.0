import React from 'react';
import { Redirect } from 'expo-router';

export default function CoachIndexRedirect() {
  return <Redirect href="/(tabs)/coach" />;
}
