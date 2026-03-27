import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetMe, getGetMeQueryKey, type User } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('raha_token'));

  const { data: user, isLoading, refetch } = useGetMe({
    query: { enabled: !!token, queryKey: getGetMeQueryKey() },
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('raha_token', token);
    } else {
      localStorage.removeItem('raha_token');
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
    setTimeout(() => refetch(), 100);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user: token ? (user || null) : null,
      isLoading: isLoading && !!token,
      login,
      logout,
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
