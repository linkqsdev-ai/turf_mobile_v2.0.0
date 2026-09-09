import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationResult {
  address: string;
  city?: string;
  district?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  error?: string;
}

/**
 * Cleans and deduplicates address strings.
 * Removes Plus Codes (e.g. "PMVW+QQ6, "), removes repeated consecutive or redundant
 * address tokens (e.g. "Thendral Nagar, Thendral Nagar, Tamil Nadu, India" -> "Thendral Nagar, Tamil Nadu, India"),
 * and formats clean comma-separated locations.
 */
export function cleanLocation(loc?: string | null): string {
  if (!loc || typeof loc !== 'string') return 'Tiruchirappalli, Tamil Nadu';

  // 1. Remove Google Plus Code prefixes (e.g. "PMVW+QQ6, " or "8F52+X2, ")
  let cleaned = loc.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}(,\s*|\s+)/i, '').trim();

  // 2. Split by comma and trim each part
  const segments = cleaned.split(',').map(s => s.trim()).filter(Boolean);

  // 3. Deduplicate case-insensitively while preserving original casing
  const uniqueSegments: string[] = [];
  const seen = new Set<string>();

  for (const seg of segments) {
    const lower = seg.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueSegments.push(seg);
    }
  }

  if (uniqueSegments.length === 0) return 'Tiruchirappalli, Tamil Nadu';
  return uniqueSegments.join(', ');
}

/**
 * OpenStreetMap Nominatim reverse geocoding fallback API
 * Converts latitude and longitude into a detailed street address.
 */
async function fetchNominatimReverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'TurfAppMobile/2.0',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.address) {
      const a = data.address;
      const parts = [
        a.building || a.amenity || a.road || a.pedestrian || a.suburb || a.neighbourhood || a.residential,
        a.city || a.town || a.district || a.subregion || a.county || a.state_district,
        a.state || a.postcode,
        a.country,
      ].filter(Boolean);

      if (parts.length > 0) {
        return cleanLocation(parts.join(', '));
      }
      if (data.display_name) {
        // Return first 3 comma-separated components of display_name
        return cleanLocation(data.display_name.split(', ').slice(0, 3).join(', '));
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode fetch failed:', err);
  }
  return null;
}

/**
 * Requests location permissions and fetches current GPS position with reverse geocoding.
 */
export async function getCurrentGPSLocation(): Promise<LocationResult> {
  try {
    // 1. Request foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        address: 'Permission Denied',
        error: 'Location permission was denied. Please enable location permissions in settings.',
      };
    }

    // 2. Fetch current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // 3. Perform reverse geocoding via Expo Location first
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const isPlusCode = (val?: string | null) => val ? /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}$/i.test(val.trim()) : false;
        const cleanName = isPlusCode(place.name) ? undefined : place.name;

        const parts = [
          place.street || cleanName,
          place.district || place.subregion || place.city,
          place.region,
          place.country,
        ].filter((item) => Boolean(item) && !item?.includes('°') && !isPlusCode(item));

        if (parts.length > 0) {
          const formattedAddress = cleanLocation(parts.join(', '));
          return {
            address: formattedAddress,
            city: place.city || place.district || place.subregion || undefined,
            district: place.district || place.subregion || undefined,
            country: place.country || undefined,
            latitude,
            longitude,
          };
        }
      }
    } catch (geocodingError) {
      console.warn('Expo reverseGeocodeAsync notice:', geocodingError);
    }

    // 4. Fallback to OpenStreetMap Nominatim reverse geocode API if Expo geocoder returns raw lat/long or empty
    const nominatimAddress = await fetchNominatimReverseGeocode(latitude, longitude);
    if (nominatimAddress) {
      return {
        address: cleanLocation(nominatimAddress),
        latitude,
        longitude,
      };
    }

    // Ultimate fallback if both geocoders return empty
    return {
      address: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
      latitude,
      longitude,
    };
  } catch (err: any) {
    console.error('GPS Location Fetch Error:', err);

    // Fallback for Web / Browser Geolocation if native Expo Location encounters issues
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise<LocationResult>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const webAddress = await fetchNominatimReverseGeocode(latitude, longitude);
            resolve({
              address: webAddress || `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
              latitude,
              longitude,
            });
          },
          (webError) => {
            resolve({
              address: 'Location Unavailable',
              error: webError.message || 'Unable to fetch location from browser.',
            });
          },
          { timeout: 10000 }
        );
      });
    }

    return {
      address: 'Location Error',
      error: err.message || 'Failed to fetch GPS location.',
    };
  }
}
