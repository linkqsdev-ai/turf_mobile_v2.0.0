import { useColorScheme } from './use-color-scheme';
import { tokens, type Scheme } from '@/lib/tokens';

/** Collapses the app's `light | dark | blue` preference to the two token sets. */
export function useScheme(): Scheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** Raw colour tokens for the active scheme — for non-className consumers. */
export function useTokens() {
  return tokens[useScheme()];
}
