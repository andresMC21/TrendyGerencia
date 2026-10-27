/** URL de la API: VITE_API_URL o, por defecto, la API local. */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join('\n'));
    this.status = status;
    this.messages = messages;
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
  description: string;
  price: number;
  acceptsBarter: boolean;
  category: string;
  condition: string;
  neighborhoodId: string;
  seller?: { fullName: string; ratingAverage: number };
};

export const authApi = {
  register: (body: RegisterBody) =>
    apiRequest<RegisterResponse>('/user/register', { method: 'POST', body }),
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/user/login', { method: 'POST', body: { email, password } }),
  me: (token: string) => apiRequest<UserProfile>('/user/me', { token }),
  logout: (token: string) =>
    apiRequest<{ message: string }>('/user/logout', { method: 'POST', token }),
};

export const productApi = {
  feed: () => apiRequest<{ items: Product[]; total: number }>('/products?limit=12'),
};
