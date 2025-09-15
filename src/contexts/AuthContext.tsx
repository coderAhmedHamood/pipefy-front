import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/workflow';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاكاة تحميل بيانات المستخدم
    const mockUser: User = {
      id: '1',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      role: {
        id: 'admin',
        name: 'مدير النظام',
        description: 'صلاحيات كاملة',
        permissions: [],
        is_system_role: true
      },
      permissions: [],
      created_at: new Date().toISOString(),
      is_active: true
    };

    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 1000);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    // محاكاة عملية تسجيل الدخول
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser: User = {
      id: '1',
      name: 'أحمد محمد',
      email,
      role: {
        id: 'admin',
        name: 'مدير النظام',
        description: 'صلاحيات كاملة',
        permissions: [],
        is_system_role: true
      },
      permissions: [],
      created_at: new Date().toISOString(),
      is_active: true
    };
    
    setUser(mockUser);
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};