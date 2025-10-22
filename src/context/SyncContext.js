import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS } from '../constants/colors';
import { AnimalService, ServicioService, DiagnosticoService, PartoService, OrdenaService, TratamientoService, SecadoService } from '../services/DataService';
import SupabaseService from '../services/SupabaseService';

export const SyncContext = createContext({
  isConnected: true,
  isSyncing: false,
  lastSync: null,
  pendingChanges: 0,
  syncData: () => {},
  addPendingChange: () => {},
  getSyncStatus: () => ({}),
  getOfflineData: () => {},
});

export const SyncProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  // Cargar el número de cambios pendientes al iniciar
  useEffect(() => {
    loadPendingChangesCount();
  }, []);

  // Cargar el conteo de cambios pendientes desde la base de datos
  const loadPendingChangesCount = async () => {
    try {
      // On web, no pending changes (direct Supabase)
      if (Platform.OS === 'web') {
        setPendingChanges(0);
        return;
      }

      // On native, use SupabaseService to get pending count
      const totalPendientes = await SupabaseService.getPendingCount();
      setPendingChanges(totalPendientes);
    } catch (error) {
      console.error('Error al cargar cambios pendientes:', error);
    }
  };

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      // If we just reconnected and have pending changes, trigger sync
      if (state.isConnected && pendingChanges > 0) {
        syncData();
      }
    });

    return () => unsubscribe();
  }, [pendingChanges]);

  const syncData = async () => {
    // On web, no sync needed (direct Supabase access)
    if (Platform.OS === 'web') {
      console.log('SyncContext: Web platform - no sync needed (direct Supabase)');
      return;
    }

    if (!isConnected || isSyncing || pendingChanges === 0) return;

    setIsSyncing(true);

    try {
      console.log('SyncContext: Iniciando sincronización con Supabase...');

      // Sincronizar todos los datos pendientes con Supabase
      const result = await SupabaseService.syncAll();

      console.log('SyncContext: Sincronización completada:', result);

      // Actualizar el estado después de sincronizar
      setLastSync(new Date());
      await loadPendingChangesCount(); // Recargar el conteo actualizado

      if (result.success) {
        console.log(`SyncContext: ✅ ${result.totalSynced} registros sincronizados exitosamente`);
      } else {
        console.warn(`SyncContext: ⚠️ ${result.totalSynced} sincronizados, ${result.totalFailed} fallidos`);
      }
    } catch (error) {
      console.error('SyncContext: Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addPendingChange = () => {
    setPendingChanges(prev => prev + 1);
  };

  const getOfflineData = async (tipo) => {
    try {
      switch (tipo) {
        case 'animales':
          return await AnimalService.getAnimales();
        case 'servicios':
          return await ServicioService.getServicios();
        case 'diagnosticos':
          return await DiagnosticoService.getDiagnosticos();
        case 'partos':
          return await PartoService.getPartos();
        case 'ordenas':
          return await OrdenaService.getOrdenas();
        case 'tratamientos':
          return await TratamientoService.getTratamientos();
        case 'secados':
          return await SecadoService.getSecados();
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error al obtener datos offline de ${tipo}:`, error);
      return [];
    }
  };

  const getSyncStatus = () => {
    if (isSyncing) return { status: 'syncing', color: COLORS.syncing, text: 'Sincronizando...' };
    if (pendingChanges > 0 && isConnected) return { status: 'pending', color: COLORS.pending, text: `${pendingChanges} pendiente(s)` };
    if (pendingChanges > 0 && !isConnected) return { status: 'offline', color: COLORS.offline, text: 'Sin conexión' };
    return { status: 'synced', color: COLORS.synced, text: 'Sincronizado' };
  };

  return (
    <SyncContext.Provider
      value={{
        isConnected,
        isSyncing,
        lastSync,
        pendingChanges,
        syncData,
        addPendingChange,
        getSyncStatus,
        getOfflineData,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
