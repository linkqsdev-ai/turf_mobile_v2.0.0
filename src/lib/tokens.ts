/**
 * tokens.ts
 * JS-side mirror of the "Floodlight" CSS variables defined in `global.css`.
 * Use these ONLY where a raw colour string is unavoidable — navigation theme,
 * StatusBar, `<ActivityIndicator>`, expo-linear-gradient, chart libraries,
 * vector-icon `color` props. Everything else should use Tailwind classes.
 */

export type Scheme = 'light' | 'dark';

export const tokens = {
  light: {
    background: '#F7F8F5',
    foreground: '#121815',
    card: '#FFFFFF',
    cardForeground: '#121815',
    cardElevated: '#FFFFFF',
    popover: '#FFFFFF',
    popoverForeground: '#121815',
    primary: '#00C878',
    primaryForeground: '#04140D',
    primaryMuted: '#E0F9EE',
    secondary: '#ECF0E9',
    secondaryForeground: '#1E2923',
    muted: '#EEF1EC',
    mutedForeground: '#64746C',
    accent: '#FF7A1A',
    accentForeground: '#201004',
    destructive: '#EC4042',
    destructiveForeground: '#FFFFFF',
    success: '#00B06A',
    successForeground: '#FFFFFF',
    warning: '#F5B020',
    warningForeground: '#281A00',
    info: '#3B9EFF',
    infoForeground: '#FFFFFF',
    border: '#E0E3DD',
    input: '#E0E3DD',
    ring: '#00C878',
    floodlight: '#82FF78',
    pitch: '#00A85B',
  },
  dark: {
    background: '#0A0F0D',
    foreground: '#F0F4F1',
    card: '#121815',
    cardForeground: '#F0F4F1',
    cardElevated: '#1A231F',
    popover: '#121815',
    popoverForeground: '#F0F4F1',
    primary: '#12E68A',
    primaryForeground: '#04140D',
    primaryMuted: '#142E24',
    secondary: '#1E2823',
    secondaryForeground: '#E2E8E4',
    muted: '#1A231F',
    mutedForeground: '#96A59D',
    accent: '#FF8A33',
    accentForeground: '#201004',
    destructive: '#FF6363',
    destructiveForeground: '#180808',
    success: '#12E68A',
    successForeground: '#04140D',
    warning: '#FFBD4A',
    warningForeground: '#281A00',
    info: '#60B2FF',
    infoForeground: '#06121E',
    border: '#26302B',
    input: '#2A3630',
    ring: '#12E68A',
    floodlight: '#96FF82',
    pitch: '#00C878',
  },
} as const;

export type TokenName = keyof typeof tokens.light;

export function token(name: TokenName, scheme: Scheme = 'dark'): string {
  return tokens[scheme][name];
}

/** Sport → accent colour, used on cards, chips and score headers. */
export const sportColors: Record<string, string> = {
  Football: '#00C878',
  Cricket: '#3B9EFF',
  Basketball: '#FF7A1A',
  Tennis: '#C6FF3D',
  Badminton: '#A66BFF',
  Volleyball: '#FF5CA8',
  Hockey: '#FF9F1C',
  default: '#00C878',
};

export function sportColor(sport?: string | null): string {
  if (!sport) return sportColors.default;
  return sportColors[sport] ?? sportColors.default;
}
