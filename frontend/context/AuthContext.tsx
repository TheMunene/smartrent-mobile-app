import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

type Tenant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  unitNumber: string;
  unitId?: string;
  avatar: string;
  status?: string;
};

type AuthContextType = {
  tenant: Tenant | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTenantData: (tenant: Tenant, token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  tenant: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setTenantData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('tenant_token');
      const storedTenant = await AsyncStorage.getItem('tenant_data');
      if (storedToken && storedTenant) {
        setToken(storedToken);
        setTenant(JSON.parse(storedTenant));
      }
    } catch (e) {
      console.log('Failed to load auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/tenant/auth/login', { email, password });
    const { token: newToken, tenant: tenantData } = res.data;
    await AsyncStorage.setItem('tenant_token', newToken);
    await AsyncStorage.setItem('tenant_data', JSON.stringify(tenantData));
    setToken(newToken);
    setTenant(tenantData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('tenant_token');
    await AsyncStorage.removeItem('tenant_data');
    setToken(null);
    setTenant(null);
  };

  const setTenantData = async (tenantData: Tenant, newToken: string) => {
    await AsyncStorage.setItem('tenant_token', newToken);
    await AsyncStorage.setItem('tenant_data', JSON.stringify(tenantData));
    setToken(newToken);
    setTenant(tenantData);
  };

  return (
    <AuthContext.Provider value={{ tenant, token, loading, login, logout, setTenantData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
