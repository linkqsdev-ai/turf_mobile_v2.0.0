import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Live Production VPS Backend (Secure HTTPS on Hostinger VPS)
const PRODUCTION_VPS_URL = 'https://srv1939048.hstgr.cloud/api';

export const API_BASE_URL = PRODUCTION_VPS_URL;

// Dynamically discover Metro dev machine IP for Expo Go on physical phones
function getCandidateBaseUrls(): string[] {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any)?.manifest?.debuggerHost;

  const devMachineIp = debuggerHost ? debuggerHost.split(':')[0] : '192.168.1.12';

  const urls: string[] = [];

  // In development, prefer the live local backend (running port 5070 with latest OTP routes)
  if (__DEV__) {
    urls.push('http://localhost:5070/api');
    urls.push('http://127.0.0.1:5070/api');
    if (devMachineIp) {
      urls.push(`http://${devMachineIp}:5070/api`);
    }
    urls.push('http://192.168.1.38:5070/api');
    urls.push('http://192.168.1.12:5070/api');
  }

  // Live Production VPS
  urls.push(PRODUCTION_VPS_URL);

  return [...new Set(urls)];
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
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err: any) {
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
