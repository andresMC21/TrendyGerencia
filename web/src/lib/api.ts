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
  /** HU-03 · URL de la foto de perfil (null si no tiene). */
  photoUrl?: string | null;
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

export type GeoPoint = { lat: number; lng: number };

export type ProductCondition = 'NUEVO' | 'COMO_NUEVO' | 'USADO';

/** HU-08 · Cuerpo de POST /products (vendedor y estado los fija el servidor). */
export type CreateProductBody = {
  title: string;
  description: string;
  category: string;
  condition: ProductCondition;
  location: GeoPoint;
  neighborhoodId: string;
  price?: number;
  acceptsBarter?: boolean;
};

export type Product = {
  id: string;
  sellerId?: string;
  title: string;
  description: string;
  price: number;
  acceptsBarter: boolean;
  category: string;
  condition: string;
  status?: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'REMOVED';
  neighborhoodId: string;
  location?: GeoPoint;
  favoritesCount?: number;
  viewsCount?: number;
  createdAt?: string;
};

/** HU-11 · GET /products/:id (incluye el perfil público del vendedor). */
export type ProductDetail = Product & {
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'REMOVED';
  estimatedWeightKg: number | null;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
  seller: { id: string; fullName: string; ratingAverage: number; reviewsCount: number };
};

/** HU-09 · Filtros del feed público. */
export type FeedFilters = {
  neighborhoodId?: string;
  category?: string;
  condition?: ProductCondition;
  page?: number;
  limit?: number;
};

export const authApi = {
  register: (body: RegisterBody) =>
    apiRequest<RegisterResponse>('/user/register', { method: 'POST', body }),
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/user/login', { method: 'POST', body: { email, password } }),
  me: (token: string) => apiRequest<UserProfile>('/user/me', { token }),
  /** HU-03 · actualizar datos del perfil propio (por ejemplo, la foto). */
  updateMe: (token: string, body: { photoUrl?: string | null; info?: string; fullName?: string }) =>
    apiRequest<UserProfile>('/user/me', { method: 'PATCH', token, body }),
  logout: (token: string) =>
    apiRequest<{ message: string }>('/user/logout', { method: 'POST', token }),
};

export const productApi = {
  feed: ({ limit = 12, ...filters }: FeedFilters = {}) => {
    const query = new URLSearchParams({ limit: String(limit) });
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return apiRequest<{ items: Product[]; total: number }>(`/products?${query}`);
  },
  /** HU-11 · detalle de un producto (público, no requiere token). */
  get: (id: string) => apiRequest<ProductDetail>(`/products/${encodeURIComponent(id)}`),
  /** HU-08 · publicar un producto (requiere token). */
  create: (token: string, body: CreateProductBody) =>
    apiRequest<Product>('/products', { method: 'POST', token, body }),
  /** HU-13 · publicaciones propias en cualquier estado, incluidas las retiradas. */
  mine: (token: string) => apiRequest<Product[]>('/products/mine', { token }),
  /**
   * HU-13 · retirar una publicación (borrado lógico: pasa a REMOVED).
   * 403 si no es del usuario; 409 si está reservada o vendida.
   */
  remove: (token: string, id: string) =>
    apiRequest<void>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
};

export type TransactionStatus = 'PENDING' | 'AGREED_POINT' | 'COMPLETED' | 'CANCELLED';

export type TransactionUser = { id: string; fullName: string };

export type Transaction = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  status: TransactionStatus;
  message: string | null;
  /** HU-16 · punto seguro propuesto o acordado (null mientras no haya propuesta). */
  safePointId?: string | null;
  /** HU-16 · fecha y hora ISO propuesta o acordada (null mientras no haya propuesta). */
  scheduledTime?: string | null;
  /** HU-16 · quién hizo la propuesta vigente; la otra persona debe aceptarla. */
  proposedById?: string | null;
  /** HU-16 · cuándo quedaron de acuerdo los dos (null mientras no haya acuerdo). */
  agreedAt?: string | null;
  /** HU-16 · quién rechazó la última propuesta (null si no hay rechazo pendiente de ver). */
  rejectedById?: string | null;
  rejectedAt?: string | null;
  /** HU-16 · punto y horario de la propuesta rechazada. */
  rejectedSafePointId?: string | null;
  rejectedScheduledTime?: string | null;
  /** HU-17 · cuándo el vendedor marcó «producto vendido» (null si aún no). */
  sellerConfirmedAt?: string | null;
  /** HU-17 · cuándo el comprador marcó «producto recibido» (null si aún no). */
  buyerConfirmedAt?: string | null;
  product?: Product;
  buyer?: TransactionUser;
  seller?: TransactionUser;
  createdAt?: string;
  updatedAt?: string;
};

/** HU-15 · El servidor obtiene comprador del JWT y vendedor del producto. */
export const transactionApi = {
  create: (token: string, productId: string, message?: string) =>
    apiRequest<Transaction>('/transactions', {
      method: 'POST',
      token,
      body: { productId, ...(message ? { message } : {}) },
    }),
  /** Transacciones donde el usuario es comprador o vendedor. */
  list: (token: string) => apiRequest<Transaction[]>('/transactions', { token }),
  /** Solo los participantes pueden consultarla (403 para terceros). */
  get: (token: string, id: string) =>
    apiRequest<Transaction>(`/transactions/${encodeURIComponent(id)}`, { token }),
  /**
   * HU-16 · Proponer o contraproponer punto seguro y horario. La transacción sigue
   * PENDING hasta que la otra persona acepte. 403 si no participa; 409 si ya no está PENDING.
   */
  proposeMeeting: (token: string, id: string, safePointId: string, scheduledTime: string) =>
    apiRequest<Transaction>(`/transactions/${encodeURIComponent(id)}/meeting-proposal`, {
      method: 'POST',
      token,
      body: { safePointId, scheduledTime },
    }),
  /**
   * HU-16 · Aceptar la propuesta de la otra persona (pasa a AGREED_POINT). Se envía
   * la propuesta que se vio: si cambió mientras tanto, el servidor responde 409.
   */
  acceptMeeting: (token: string, id: string, safePointId: string, scheduledTime: string) =>
    apiRequest<Transaction>(`/transactions/${encodeURIComponent(id)}/meeting-proposal/accept`, {
      method: 'POST',
      token,
      body: { safePointId, scheduledTime },
    }),
  /** HU-16 · Rechazar la propuesta de la otra persona; la transacción sigue PENDING. */
  rejectMeeting: (token: string, id: string) =>
    apiRequest<Transaction>(`/transactions/${encodeURIComponent(id)}/meeting-proposal/reject`, {
      method: 'POST',
      token,
    }),
  /**
   * HU-17 · Confirmar mi parte: el vendedor «producto vendido», el comprador «producto
   * recibido». Con las dos confirmaciones queda COMPLETED y el producto SOLD.
   */
  confirmExchange: (token: string, id: string) =>
    apiRequest<Transaction>(`/transactions/${encodeURIComponent(id)}/confirm-exchange`, {
      method: 'POST',
      token,
    }),
  /**
   * HU-17 · Cancelar (CANCELLED → producto AVAILABLE). Solo comprador o vendedor (403);
   * 409 si la transición no aplica.
   */
  updateStatus: (token: string, id: string, status: 'CANCELLED') =>
    apiRequest<Transaction>(`/transactions/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      token,
      body: { status },
    }),
};
