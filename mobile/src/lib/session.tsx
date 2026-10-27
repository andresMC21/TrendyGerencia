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
import { tokenStorage } from './storage';

const TOKEN_KEY = 'trendy.token';

type SessionState = {
  loading: boolean;
  token: string | null;
  user: UserProfile | null;
  /** true justo después de crear la cuenta, para mostrar la bienvenida. */
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

  // Restaura la sesión guardada al abrir la app.
  useEffect(() => {
    (async () => {
      const saved = await tokenStorage.get(TOKEN_KEY);
      if (saved) {
        try {
          setUser(await authApi.me(saved));
          setToken(saved);
        } catch {
          await tokenStorage.remove(TOKEN_KEY);
        }
      }
      setLoading(false);
    })();
  }, []);

  const startSession = useCallback(async (newToken: string, profile: UserProfile) => {
    await tokenStorage.set(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(profile);
  }, []);

  const register = useCallback(
    async (body: RegisterBody) => {
      const { token: newToken, ...profile } = await authApi.register(body);
      setIsNewAccount(true);
      await startSession(newToken, profile);
    },
    [startSession],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken } = await authApi.login(email, password);
      const profile = await authApi.me(newToken);
      setIsNewAccount(false);
      await startSession(newToken, profile);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    if (token) {
      await authApi.logout(token).catch(() => undefined);
    }
    await tokenStorage.remove(TOKEN_KEY);
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
