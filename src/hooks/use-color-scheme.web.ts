import { useUserProfile } from './use-user-profile';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' | 'blue' {
  const { profile } = useUserProfile();
  return profile.theme || 'blue';
}
