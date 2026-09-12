import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Live Production VPS Backend (Secure HTTPS on Hostinger VPS)
const PRODUCTION_VPS_URL = 'https://srv1939048.hstgr.cloud/api';

// Point the app at another backend — e.g. your machine while developing — by
// setting EXPO_PUBLIC_API_URL in .env.local (http://192.168.1.20:3000/api) and
// reloading. Expo inlines it into the bundle, so it must never hold a secret.
const OVERRIDE_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

export const API_BASE_URL = OVERRIDE_API_URL || PRODUCTION_VPS_URL;

function getCandidateBaseUrls(): string[] {
  return [API_BASE_URL];
}

const TOKEN_KEY = '@turf_auth_token';

export async function setAuthToken(token: string | null) {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.warn('API Client: Error saving auth token', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.warn('API Client: Error getting auth token', error);
    return null;
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request(endpoint: string, options: FetchOptions = {}) {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const queryParams = options.params ? `?${new URLSearchParams(options.params).toString()}` : '';

  const config: RequestInit = {
    ...options,
    headers,
  };

  let lastError: any = null;
  const candidates = getCandidateBaseUrls();

  // Try candidate URLs with resilient fallback
  for (const baseUrl of candidates) {
    const fullUrl = `${baseUrl}${endpoint}${queryParams}`;
    try {
      console.log(`[API Request] ${config.method || 'GET'} ${fullUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(fullUrl, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        console.warn(`[API Error] ${response.status} - ${data.message || response.statusText}`);
        // The server answered, so another candidate URL would only repeat it.
        // Retrying replaced messages like "Current password is incorrect" with
        // the network error of the last, unreachable candidate.
        const error: any = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.fromServer = true;
        throw error;
      }

      return data;
    } catch (err: any) {
      if (err?.fromServer) throw err;
      lastError = err;
      console.warn(`[API Candidate Failed] (${fullUrl}): ${err.message}. Trying next candidate...`);
    }
  }

  console.warn(`[API Network Exhausted] Endpoint: ${endpoint} failed on all candidates: ${lastError?.message}`);
  throw lastError || new Error('Network connection failed on all backend candidates');
}

export const apiClient = {
  get: (endpoint: string, params?: Record<string, string>, options: FetchOptions = {}) =>
    request(endpoint, { ...options, method: 'GET', params }),
  
  post: (endpoint: string, body?: any, options: FetchOptions = {}) =>
    request(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  
  put: (endpoint: string, body?: any, options: FetchOptions = {}) =>
    request(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  
  delete: (endpoint: string, options: FetchOptions = {}) =>
    request(endpoint, { ...options, method: 'DELETE' }),
};
