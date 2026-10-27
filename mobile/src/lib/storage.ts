import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** SecureStore en el celular; localStorage en el navegador (SecureStore no existe en web). */
export const tokenStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // almacenamiento no disponible: la sesión vive solo en memoria
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // ignorar
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
