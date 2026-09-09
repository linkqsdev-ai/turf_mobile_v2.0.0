import { useState, useCallback } from 'react';
import { getCurrentGPSLocation, LocationResult } from '@/utils/location';

export function useLocation() {
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async (): Promise<LocationResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCurrentGPSLocation();
      setLocationData(result);
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching location';
      setError(errorMsg);
      const fallbackResult: LocationResult = { address: 'Location Error', error: errorMsg };
      setLocationData(fallbackResult);
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    locationData,
    address: locationData?.address || '',
    error,
    fetchLocation,
  };
}
