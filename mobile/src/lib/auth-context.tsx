import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import { apiGet, apiPost } from './api';

const TOKEN_KEY = 'seeneyu_session_token';

// Safe SecureStore wrapper — falls back to in-memory on failure
let _memoryStore: Record<string, string> = {};

async function getSecureItem(key: string): Promise<string | null> {
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  } catch {
    return _memoryStore[key] ?? null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  } catch {
    _memoryStore[key] = value;
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  } catch {
    delete _memoryStore[key];
  }
}

type User = {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  plan?: string;
  status?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getSecureItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          // API returns { user: {...} }
          const res = await apiGet<{ user: User } | User>('/api/user/me', stored);
          const userData = (res as any)?.user ?? res;
          if (userData?.id) {
            setUser(userData);
          } else {
            // Invalid response — clear token
            await deleteSecureItem(TOKEN_KEY);
          }
        }
      } catch {
        // Token expired or invalid
        try {
          await deleteSecureItem(TOKEN_KEY);
        } catch {
          // Ignore cleanup errors
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{ token: string; user: User }>(
      '/api/mobile/login',
      { email, password }
    );

    if (!res?.token) {
      throw new Error((res as any)?.error || 'Login failed');
    }

    await setSecureItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await deleteSecureItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
