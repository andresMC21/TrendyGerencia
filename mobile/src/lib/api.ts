import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL de la API.
 * - EXPO_PUBLIC_API_URL tiene prioridad (por ejemplo la de Render).
 * - En el celular con Expo Go se usa la IP del computador que sirve la app
 *   (la misma de Metro), puerto 3000.
 * - En el navegador se usa localhost:3000.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri; // p. ej. "192.168.1.20:8081"
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:3000/api`;
  }

  return 'http://localhost:3000/api';
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages.join('\n'));
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, [
      `No pudimos conectar con el servidor (${API_URL}). Revisa que la API esté encendida.`,
    ]);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const raw = data?.message ?? response.statusText;
    throw new ApiError(response.status, Array.isArray(raw) ? raw : [String(raw)]);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Tipos que devuelve la API
// ---------------------------------------------------------------------------

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  info: string | null;
  role: ('USER' | 'ADMIN' | 'MODERATOR')[];
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isActive: boolean;
  ratingAverage?: number;
  reviewsCount: number;
  createdAt: string;
};

export type RegisterBody = { fullName: string; email: string; password: string };
export type RegisterResponse = UserProfile & { token: string };
export type LoginResponse = { id: string; email: string; token: string };

export type Product = {
  id: string;
  title: string;
  price: number;
  acceptsBarter: boolean;
  category: string;
  condition: string;
  neighborhoodId: string;
  distanceKm?: number;
  seller?: { fullName: string; ratingAverage: number };
};

export const authApi = {
  register: (body: RegisterBody) =>
    apiRequest<RegisterResponse>('/user/register', { method: 'POST', body }),
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/user/login', {
      method: 'POST',
      body: { email, password },
    }),
  me: (token: string) => apiRequest<UserProfile>('/user/me', { token }),
  logout: (token: string) =>
    apiRequest<{ message: string }>('/user/logout', { method: 'POST', token }),
};

export const productApi = {
  feed: () =>
    apiRequest<{ items: Product[]; total: number }>('/products?limit=10'),
};
