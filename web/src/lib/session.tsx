import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi, type RegisterBody, type UserProfile } from './api';

const TOKEN_KEY = 'trendy.token';

const storage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (v: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, v);
    } catch {
      /* sin almacenamiento: la sesión vive en memoria */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignorar */
    }
  },
};

type SessionState = {
  loading: boolean;
  token: string | null;
  user: UserProfile | null;
  /** true justo después de crear la cuenta (HU-01), para dar la bienvenida. */
  isNewAccount: boolean;
  register: (body: RegisterBody) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissWelcome: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isNewAccount, setIsNewAccount] = useState(false);

  useEffect(() => {
    const saved = storage.get();
    if (!saved) {
      setLoading(false);
      return;
    }
    authApi
      .me(saved)
      .then((profile) => {
        setUser(profile);
        setToken(saved);
      })
      .catch(() => storage.clear())
      .finally(() => setLoading(false));
  }, []);

  const start = useCallback((newToken: string, profile: UserProfile) => {
    storage.set(newToken);
    setToken(newToken);
    setUser(profile);
  }, []);

  const register = useCallback(
    async (body: RegisterBody) => {
      const { token: newToken, ...profile } = await authApi.register(body);
      setIsNewAccount(true);
      start(newToken, profile);
    },
    [start],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken } = await authApi.login(email, password);
      const profile = await authApi.me(newToken);
      setIsNewAccount(false);
      start(newToken, profile);
    },
    [start],
  );

  const logout = useCallback(async () => {
    if (token) await authApi.logout(token).catch(() => undefined);
    storage.clear();
    setToken(null);
    setUser(null);
    setIsNewAccount(false);
  }, [token]);

  const value = useMemo(
    () => ({
      loading,
      token,
      user,
      isNewAccount,
      register,
      login,
      logout,
      dismissWelcome: () => setIsNewAccount(false),
    }),
    [loading, token, user, isNewAccount, register, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}
