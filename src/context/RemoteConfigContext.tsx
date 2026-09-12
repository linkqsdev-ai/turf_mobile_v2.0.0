/**
 * RemoteConfigContext.tsx
 *
 * Loads the Super Admin's feature switches and form layouts. The last copy for
 * the current role is cached, so the app starts with the admin's settings even
 * offline; a fresh copy is fetched on launch, when the role changes and each
 * time the app returns to the foreground.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api-client';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  EMPTY_CONFIG,
  REMOTE_CONFIG_CACHE_PREFIX,
  customFieldsFor,
  fieldView,
  isFeatureOn,
  parseRemoteConfig,
  type FieldFallback,
  type FormKey,
  type RemoteConfig,
} from '@/lib/remote-config';

interface RemoteConfigValue {
  config: RemoteConfig;
  refresh: () => Promise<void>;
}

const RemoteConfigContext = createContext<RemoteConfigValue>({ config: EMPTY_CONFIG, refresh: async () => {} });

export function RemoteConfigProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const role = profile.role || 'Player';
  const cacheKey = REMOTE_CONFIG_CACHE_PREFIX + role;
  const [config, setConfig] = useState<RemoteConfig>(EMPTY_CONFIG);

  // Start from the cached copy for this role.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(cacheKey)
      .then((stored) => {
        const cached = stored ? parseRemoteConfig(JSON.parse(stored)) : null;
        if (alive) setConfig(cached ?? EMPTY_CONFIG);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [cacheKey]);

  const refresh = useCallback(async () => {
    try {
      const fresh = parseRemoteConfig(await apiClient.get('/config', { role }));
      if (!fresh) return;
      setConfig(fresh);
      AsyncStorage.setItem(cacheKey, JSON.stringify(fresh)).catch(() => {});
    } catch {
      // Offline or backend unavailable: keep the cached settings.
    }
  }, [role, cacheKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(() => ({ config, refresh }), [config, refresh]);
  return <RemoteConfigContext.Provider value={value}>{children}</RemoteConfigContext.Provider>;
}

export const useRemoteConfig = () => useContext(RemoteConfigContext);

/** Whether the Super Admin has this feature on for the signed-in role. */
export function useFeature(key: string): boolean {
  return isFeatureOn(useContext(RemoteConfigContext).config, key);
}

/** A form's field views and its admin-added fields. */
export function useFormConfig(form: FormKey) {
  const { config } = useContext(RemoteConfigContext);
  return useMemo(
    () => ({
      field: (key: string, fallback: FieldFallback) => fieldView(config, form, key, fallback),
      customFields: customFieldsFor(config, form),
    }),
    [config, form]
  );
}
