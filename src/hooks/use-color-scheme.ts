import { useUserProfile } from './use-user-profile';

export function useColorScheme(): 'light' | 'dark' | 'blue' {
  const { profile } = useUserProfile();
  return profile.theme || 'blue';
}
