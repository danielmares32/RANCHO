import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
  hasRole: () => false,
});

const AUTH_STORAGE_KEY = '@farmsync:auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        AuthService.currentUser = userData;
        setUser(userData);
      }
    } catch (error) {
      console.error('AuthContext: Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const userData = await AuthService.login(username, password);
      setUser(userData);

      // Guardar sesión
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  };

  const hasPermission = (permission) => {
    return AuthService.hasPermission(permission);
  };

  const hasRole = (role) => {
    return AuthService.hasRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
