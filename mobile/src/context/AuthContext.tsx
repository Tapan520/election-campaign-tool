import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, LoginResponse } from '../api/auth';

interface AuthContextType {
  user: LoginResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadStoredUser(); }, []);

  const loadStoredUser = async () => {
    try {
      const [stored, token] = await AsyncStorage.multiGet(['auth_user', 'auth_token']);
      if (stored[1] && token[1]) setUser(JSON.parse(stored[1]));
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password);
    await AsyncStorage.setItem('auth_token', response.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(response));
    setUser(response);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
