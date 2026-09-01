import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  position: string;
  location: string;
  bio: string;
  preferredFoot: string;
  playingStyle: string;
  jerseyNumber?: number;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  memberSince: string;
  // A preset key (e.g. "avatar_7") or a real photo URI — see
  // @/constants/avatars for why this must never be a raw require() result.
  avatarUrl: any;
  bannerImage?: string;
  theme?: 'light' | 'dark' | 'blue';
  // "Admin" and "Super Admin" are the same platform superuser; the backend may
  // send either spelling depending on how the account was provisioned.
  role: 'Player' | 'Coach' | 'Owner' | 'Organizer' | 'Admin' | 'Super Admin';
  pushNotifications?: boolean;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  matchReminders?: boolean;
  promoOffers?: boolean;
  profileVisibility?: 'public' | 'private';
  locationSharingEnabled?: boolean;
  language?: string;
  geminiApiKey?: string;
  claudeApiKey?: string;
  aiSuggestionsEnabled?: boolean;
  aiGenerationEnabled?: boolean;
}

const PROFILE_STORAGE_KEY = '@turf_user_profile';

export function getShortLocation(location?: string): string {
  if (!location) return 'CHN, TN';
  const loc = location.trim();
  if (loc.toLowerCase().includes('chennai') || loc.toLowerCase().includes('tamil nadu')) return 'CHN, TN';
  if (loc.toLowerCase().includes('bangalore') || loc.toLowerCase().includes('bengaluru') || loc.toLowerCase().includes('karnataka')) return 'BLR, KA';
  if (loc.toLowerCase().includes('mumbai') || loc.toLowerCase().includes('maharashtra')) return 'MUM, MH';
  if (loc.toLowerCase().includes('delhi')) return 'DEL, DL';
  if (loc.toLowerCase().includes('london') || loc.toLowerCase().includes('uk')) return 'LDN, UK';
  if (loc.toLowerCase().includes('dubai') || loc.toLowerCase().includes('uae')) return 'DXB, UAE';
  if (loc.toLowerCase().includes('hyderabad') || loc.toLowerCase().includes('telangana')) return 'HYD, TS';
  if (loc.toLowerCase().includes('california') || loc.toLowerCase().includes('san francisco')) return 'SF, CA';
  if (loc.toLowerCase().includes('new york')) return 'NYC, NY';
  
  // If already short or has comma, keep first 2 segments compact
  const parts = loc.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const city = parts[0].length > 6 ? parts[0].substring(0, 3).toUpperCase() : parts[0];
    const state = parts[1].length > 4 ? parts[1].substring(0, 2).toUpperCase() : parts[1].toUpperCase();
    return `${city}, ${state}`;
  }
  return loc.length > 8 ? loc.substring(0, 3).toUpperCase() : loc;
}

let globalProfile: UserProfile = {
  name: 'Azarudeen',
  email: 'azarudeen@nonstricker.com',
  phone: '',
  position: 'Forward',
  location: 'CHN, TN',
  bio: 'Dedicated performance athlete focusing on tactical execution and explosive power. Currently competing in the Diamond League and lead captain of Blue Falcons FC.',
  preferredFoot: 'Right',
  playingStyle: 'Target Man / Poacher',
  jerseyNumber: undefined,
  skillLevel: 'Intermediate',
  memberSince: 'January 2024',
  avatarUrl: 'avatar_1',
  bannerImage: 'football',
  theme: 'blue',
  role: 'Player',
  pushNotifications: true,
  emailAlerts: false,
  smsAlerts: false,
  matchReminders: true,
  promoOffers: false,
  profileVisibility: 'public',
  locationSharingEnabled: true,
  language: 'English',
  geminiApiKey: '',
  claudeApiKey: '',
  aiSuggestionsEnabled: true,
  aiGenerationEnabled: true,
};

const listeners = new Set<(profile: UserProfile) => void>();

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(globalProfile);

  useEffect(() => {
    const listener = (newProfile: UserProfile) => {
      setProfile(newProfile);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    globalProfile = { ...globalProfile, ...newProfile };
    listeners.forEach((listener) => listener(globalProfile));
    // Persist every update — previously only a narrow snapshot taken at
    // login time ever reached storage, so settings like theme and
    // notification preferences silently reset on every app restart.
    AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(globalProfile)).catch((err) => {
      console.error('useUserProfile: Failed to persist profile', err);
    });
  };

  return { profile, updateProfile };
}
