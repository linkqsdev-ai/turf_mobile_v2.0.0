/**
 * custom-answers.ts
 *
 * Stores answers to Super Admin–added form fields. A copy is always kept on the
 * device (so edit screens can prefill them); accounts signed in with a real
 * server token also send them to the backend, where the console can read them.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, getAuthToken } from '@/services/api-client';
import {
  answersStorageKey,
  cleanAnswers,
  isServerToken,
  type CustomAnswers,
  type FormKey,
  type RemoteField,
} from '@/lib/remote-config';

const STORAGE_KEY = '@turf_custom_answers';

async function readAll(): Promise<Record<string, { values: CustomAnswers; savedAt: string }>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function loadCustomAnswers(form: FormKey, entityType: string, entityId: string): Promise<CustomAnswers> {
  if (!entityId) return {};
  return (await readAll())[answersStorageKey(form, entityType, entityId)]?.values ?? {};
}

/** Never throws: a failed upload leaves the device copy in place. */
export async function saveCustomAnswers(
  form: FormKey,
  entityType: string,
  entityId: string,
  answers: CustomAnswers,
  fields: RemoteField[]
): Promise<void> {
  if (!entityId || fields.length === 0) return;
  const values = cleanAnswers(fields, answers);

  const all = await readAll();
  all[answersStorageKey(form, entityType, entityId)] = { values, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all)).catch(() => {});

  if (Object.keys(values).length === 0 || !isServerToken(await getAuthToken())) return;
  try {
    await apiClient.post(`/config/forms/${form}/values`, { entityType, entityId, values });
  } catch (err: any) {
    console.warn('custom-answers: saved on device only —', err?.message);
  }
}
