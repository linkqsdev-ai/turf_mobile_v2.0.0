import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In development, change 'localhost' to your local network IP (e.g. '192.168.1.100')
// if testing on a physical mobile device.
const LOCAL_IP = '192.168.1.38';

export const API_BASE_URL = Platform.select({
  android: `http://${LOCAL_IP}:3000/api`,
  ios: `http://${LOCAL_IP}:3000/api`,
  web: `http://localhost:3000/api`,
  default: `http://${LOCAL_IP}:3000/api`,
});

const TOKEN_KEY = '@turf_auth_token';

export async function setAuthToken(token: string | null) {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('API Client: Error saving auth token', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('API Client: Error getting auth token', error);
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

  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    console.log(`[API Request] ${config.method || 'GET'} ${url}`);
    const response = await fetch(url, config);
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      console.error(`[API Error] ${response.status} - ${data.message || response.statusText}`);
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[API Network Error] ${error.message}`);
    throw error;
  }
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
