import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import DatabaseService from '../services/DatabaseService';

// Crear el contexto
export const DatabaseContext = createContext({
  isDbInitialized: false,
  initializeDatabase: () => {},
});

// Proveedor del contexto
export const DatabaseProvider = ({ children }) => {
  const [isDbInitialized, setIsDbInitialized] = useState(Platform.OS === 'web'); // Web doesn't need SQLite init

  // Inicializar la base de datos al montar el componente
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Método para inicializar la base de datos
  const initializeDatabase = async () => {
    // On web, skip SQLite initialization (using Supabase directly)
    if (Platform.OS === 'web') {
      setIsDbInitialized(true);
      console.log('Web platform: Skipping SQLite, using Supabase directly');
      return;
    }

    try {
      // Native platforms: Initialize SQLite
      await DatabaseService.initialize();
      setIsDbInitialized(true);
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      setIsDbInitialized(false);
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        isDbInitialized,
        initializeDatabase,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

// Hook personalizado para acceder al contexto
export const useDatabase = () => useContext(DatabaseContext);
