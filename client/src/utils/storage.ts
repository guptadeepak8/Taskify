import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'taskify_auth_token';
const USER_KEY = 'taskify_auth_user';

// In-memory fallback for environments where SecureStore may not be available (e.g. standard web/tests)
const memoryStore: Record<string, string> = {};

export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      memoryStore[TOKEN_KEY] = token;
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return memoryStore[TOKEN_KEY] || null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      delete memoryStore[TOKEN_KEY];
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove auth token:', error);
  }
}

export async function saveUserData(user: any): Promise<void> {
  try {
    const raw = JSON.stringify(user);
    if (Platform.OS === 'web') {
      memoryStore[USER_KEY] = raw;
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, raw);
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

export async function getUserData<T = any>(): Promise<T | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = memoryStore[USER_KEY] || null;
    } else {
      raw = await SecureStore.getItemAsync(USER_KEY);
    }
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await removeToken();
  try {
    if (Platform.OS === 'web') {
      delete memoryStore[USER_KEY];
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}
