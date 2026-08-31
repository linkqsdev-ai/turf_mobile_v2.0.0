export const SPORTS_LIST = [
  { name: 'Cricket', icon: 'sports-cricket', color: '#ea580c' },
  { name: 'Football', icon: 'sports-soccer', color: '#22c55e' },
  { name: 'Badminton', icon: 'sports-tennis', color: '#3b82f6' },
  { name: 'Basketball', icon: 'sports-basketball', color: '#f59e0b' },
  { name: 'Volleyball', icon: 'sports-volleyball', color: '#ec4899' },
  { name: 'Swimming', icon: 'pool', color: '#06b6d4' },
  { name: 'Shuttlecock', icon: 'sports-tennis', color: '#8b5cf6' },
  { name: 'Tennis', icon: 'sports-tennis', color: '#10b981' },
];

// Per-sport illustration artwork — single source of truth so every screen
// picks the right image instead of scattering their own sport-name checks.
const SPORT_ILLUSTRATIONS = {
  cricket: require('@/assets/images/illustrations/cricket_player.png'),
  football: require('@/assets/images/illustrations/football_player.png'),
  futsal: require('@/assets/images/illustrations/football_player.png'),
  badminton: require('@/assets/images/illustrations/badminton_player.png'),
  shuttlecock: require('@/assets/images/illustrations/badminton_player.png'),
  basketball: require('@/assets/images/illustrations/basketball_player.png'),
  volleyball: require('@/assets/images/illustrations/volleyball_player.png'),
  swimming: require('@/assets/images/illustrations/swimming_player.png'),
  tennis: require('@/assets/images/illustrations/tennis_player.png'),
};

const DEFAULT_SPORT_ILLUSTRATION = require('@/assets/images/illustrations/athletes.png');

export function getSportIllustration(sportName?: string) {
  if (!sportName) return DEFAULT_SPORT_ILLUSTRATION;
  const key = sportName.trim().toLowerCase();
  for (const [sportKey, source] of Object.entries(SPORT_ILLUSTRATIONS)) {
    if (key.includes(sportKey)) return source;
  }
  return DEFAULT_SPORT_ILLUSTRATION;
}
