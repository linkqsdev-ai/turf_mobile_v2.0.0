/**
 * turf-store.ts
 * Manages owned turfs and their slot configurations.
 */

export interface TurfSlotConfig {
  day: string;       // 'Mon', 'Tue', ...
  time: string;      // '6 AM', '7 AM', ...
  status: 'available' | 'blocked' | 'maintenance';
}

export interface PublishedTurf {
  id: string;
  name: string;
  sportType: string;
  address: string;
  pricePerSlot: number;
  contactNumber: string;
  rating: number;
  slots: TurfSlotConfig[];
  amenities: Record<string, boolean>;
  images: string[];
  thumbnailImage: string;
  description: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
}

export function generateTurfId(): string {
  return `turf-${Date.now()}`;
}

export function createTurf(params: Omit<PublishedTurf, 'id' | 'rating' | 'isActive' | 'createdAt'>): PublishedTurf {
  return {
    ...params,
    id: generateTurfId(),
    rating: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}
