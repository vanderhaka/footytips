import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSession, signIn as authSignIn, signOut as authSignOut } from '../lib/auth';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const signIn = useCallback(async (pin: string) => {
    await authSignIn(pin);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
