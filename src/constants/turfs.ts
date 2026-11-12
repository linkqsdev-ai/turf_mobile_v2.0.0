/**
 * turfs.ts
 *
 * The bookable venues that ship with the app. Shared by Explore's turf list and
 * the tournament venue picker, so an organiser can host at the same grounds a
 * player can book. Slot availability is computed per screen, not stored here.
 */

export interface StaticTurf {
  id: string;
  name: string;
  location: string;
  rating: number;
  favCount: number;
  image: { uri: string };
  badge: string;
  sport: string;
  surfaceType: string;
  price: number;
  amenitiesIcons: string[];
  createdAt: string;
}

export const STATIC_TURFS: StaticTurf[] = [
  {
    id: 'skyline',
    name: 'Skyline Arena Elite',
    location: 'Canary Wharf, East London',
    rating: 4.9,
    favCount: 124,
    image: { uri: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80' },
    badge: '💸 BEST VALUE',
    sport: 'Football',
    surfaceType: '5G Rubber Infill',
    price: 2500,
    amenitiesIcons: ['flashlight-outline', 'car-outline', 'wifi-outline'],
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'the-grid',
    name: 'The Grid Sports Complex',
    location: 'Stratford, London',
    rating: 4.7,
    favCount: 89,
    image: { uri: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80' },
    badge: '🔥 POPULAR',
    sport: 'Cricket',
    surfaceType: 'Astro Turf Pitch',
    price: 2000,
    amenitiesIcons: ['flashlight-outline', 'shirt-outline', 'water-outline'],
    createdAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 'lords',
    name: 'Lord’s Indoor Nets',
    location: 'St John’s Wood, London',
    rating: 4.95,
    favCount: 312,
    image: { uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80' },
    badge: '🏆 PREMIUM',
    sport: 'Cricket',
    surfaceType: 'Indoor Woodcourt',
    price: 3500,
    amenitiesIcons: ['flashlight-outline', 'lock-closed-outline', 'car-outline'],
    createdAt: '2025-01-03T00:00:00.000Z',
  },
  {
    id: 'wembley',
    name: 'Wembley Powerleague',
    location: 'Wembley, London',
    rating: 4.8,
    favCount: 205,
    image: { uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80' },
    badge: '⭐ 5.0 RATED',
    sport: 'Football',
    surfaceType: 'Synthetic Grass',
    price: 3000,
    amenitiesIcons: ['flashlight-outline', 'car-outline', 'wifi-outline'],
    createdAt: '2025-01-04T00:00:00.000Z',
  },
];
