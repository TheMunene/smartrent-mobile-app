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
  profileComplete?: boolean;
  propertyName?: string;
  propertyCode?: string;
};

type SavedProperty = {
  propertyCode: string;
  propertyName: string;
};

type AuthContextType = {
  tenant: Tenant | null;
  token: string | null;
  loading: boolean;
  savedProperty: SavedProperty | null;
  login: (email: string, password: string, propertyCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  setTenantData: (tenant: Tenant, token: string) => Promise<void>;
  clearSavedProperty: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  tenant: null,
  token: null,
  loading: true,
  savedProperty: null,
  login: async () => {},
  logout: async () => {},
  setTenantData: async () => {},
  clearSavedProperty: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedProperty, setSavedProperty] = useState<SavedProperty | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('tenant_token');
      const storedTenant = await AsyncStorage.getItem('tenant_data');
      const storedProperty = await AsyncStorage.getItem('smartrent_property');
      if (storedToken && storedTenant) {
        setToken(storedToken);
        setTenant(JSON.parse(storedTenant));
      }
      if (storedProperty) {
        setSavedProperty(JSON.parse(storedProperty));
      }
    } catch (e) {
      console.log('Failed to load auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, propertyCode?: string) => {
    const res = await api.post('/tenant/auth/login', {
      email,
      password,
      ...(propertyCode ? { propertyCode } : {}),
    });
    const { token: newToken, tenant: tenantData } = res.data;
    await AsyncStorage.setItem('tenant_token', newToken);
    await AsyncStorage.setItem('tenant_data', JSON.stringify(tenantData));
    if (tenantData.propertyCode && tenantData.propertyName) {
      const sp: SavedProperty = {
        propertyCode: tenantData.propertyCode,
        propertyName: tenantData.propertyName,
      };
      await AsyncStorage.setItem('smartrent_property', JSON.stringify(sp));
      setSavedProperty(sp);
    }
    setToken(newToken);
    setTenant(tenantData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('tenant_token');
    await AsyncStorage.removeItem('tenant_data');
    await AsyncStorage.removeItem('smartrent_property');
    setToken(null);
    setTenant(null);
    setSavedProperty(null);
  };

  const setTenantData = async (tenantData: Tenant, newToken: string) => {
    await AsyncStorage.setItem('tenant_token', newToken);
    await AsyncStorage.setItem('tenant_data', JSON.stringify(tenantData));
    setToken(newToken);
    setTenant(tenantData);
  };

  const clearSavedProperty = async () => {
    await AsyncStorage.removeItem('smartrent_property');
    setSavedProperty(null);
  };

  return (
    <AuthContext.Provider value={{ tenant, token, loading, savedProperty, login, logout, setTenantData, clearSavedProperty }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
