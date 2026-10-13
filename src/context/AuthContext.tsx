import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, getToken, getStoredUser, clearToken } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await api.register(email, password);
      setUser(data.user);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  const signOut = () => {
    api.logout();
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
