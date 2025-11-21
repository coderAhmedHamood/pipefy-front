import React, { createContext, useContext, useEffect, useState, useReducer } from 'react';
import { User } from '../types/workflow';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  hasProcessPermission: (resource: string, action: string, processId: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  refreshToken: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    isAuthenticated: false
  });

  // التحقق من وجود مستخدم مسجل عند تحميل التطبيق
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // التحقق من وجود توكن
        if (authService.isAuthenticated()) {
          // التحقق من صحة التوكن
          const isValid = await authService.verifyToken();

          if (isValid) {
            const user = authService.getCurrentUser();
            if (user) {
              dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            } else {
              dispatch({ type: 'LOGOUT' });
            }
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('خطأ في تهيئة المصادقة:', error);
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const loginResponse = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: loginResponse.user });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_ERROR' });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    } finally {
      // إزالة العملية المختارة من localStorage
      localStorage.removeItem('selected_process_id');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const newToken = await authService.refreshToken();
      return !!newToken;
    } catch (error) {
      console.error('خطأ في تجديد التوكن:', error);
      dispatch({ type: 'LOGOUT' });
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error: any) {
      throw error;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return authService.hasPermission(resource, action);
  };

  const hasProcessPermission = (resource: string, action: string, processId: string): boolean => {
    return authService.hasProcessPermission(resource, action, processId);
  };

  const hasRole = (roleName: string): boolean => {
    return authService.hasRole(roleName);
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  const value: AuthContextType = {
    user: state.user,
    login,
    logout,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    hasPermission,
    hasProcessPermission,
    hasRole,
    isAdmin,
    refreshToken,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};