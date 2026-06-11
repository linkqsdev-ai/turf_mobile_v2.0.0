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
}

let globalProfile: UserProfile = {
  name: 'Azarudeen',
  position: 'Forward',
  location: 'London, UK',
  bio: 'Dedicated performance athlete focusing on tactical execution and explosive power. Currently competing in the Diamond League and lead captain of Blue Falcons FC.',
  preferredFoot: 'Right',
  playingStyle: 'Target Man / Poacher',
  memberSince: 'January 2024',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD906cwGePK5tZt4al07polQZxe4OW2sIJ-lhjDewDXct6IJtZetqa2i4lnO9-CMUT1oBiYhGj0BUqSwgzvIHynL-pG1kkY5KzzF9cvL0bxVNlPJEbfv2pHhgwd2mkejpG9vnC4b1XliECQQDedwmy8XfJ0AUw7fpdjFhLXiUdidhARSpLIkMeew198pOXaj0K9g0kbbWaDwJfBtYdJwqD1ztbzBAkeltwyKB0I_eTeM0ksi5qEbR6iQRPKqERd-3DOKAQez21qHyI',
  bannerImage: 'football',
  theme: 'blue',
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
