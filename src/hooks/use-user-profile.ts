import { useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  position: string;
  location: string;
  bio: string;
  preferredFoot: string;
  playingStyle: string;
  memberSince: string;
  avatarUrl: string;
  bannerImage?: string;
  theme?: 'light' | 'dark' | 'blue';
  role: 'Player' | 'Coach' | 'Owner' | 'Organizer';
  pushNotifications?: boolean;
  emailAlerts?: boolean;
  geminiApiKey?: string;
  claudeApiKey?: string;
  aiSuggestionsEnabled?: boolean;
  aiGenerationEnabled?: boolean;
}

let globalProfile: UserProfile = {
  name: 'Azarudeen',
  position: 'Forward',
  location: 'London, UK',
  bio: 'Dedicated performance athlete focusing on tactical execution and explosive power. Currently competing in the Diamond League and lead captain of Blue Falcons FC.',
  preferredFoot: 'Right',
  playingStyle: 'Target Man / Poacher',
  memberSince: 'January 2024',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bannerImage: 'football',
  theme: 'blue',
  role: 'Coach',
  pushNotifications: true,
  emailAlerts: false,
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
  };

  return { profile, updateProfile };
}
