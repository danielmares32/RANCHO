import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../context/SyncContext';
import { COLORS, ALERT_PRIORITY } from '../constants/colors';

// Mock data
const mockAlerts = [
  { id: '1', type: 'HIGH', title: 'Vacas en celo', description: '3 vacas detectadas en celo hoy', time: 'Hace 30 min' },
  { id: '2', type: 'MEDIUM', title: 'Próximo parto', description: 'Vaca #123 - Esperado en 2 días', time: 'Hace 2 horas' },
  { id: '3', type: 'LOW', title: 'Recordatorio', description: 'Revisar peso de terneros', time: 'Ayer' },
];

const quickActions = [
  { id: '1', icon: 'add-circle', label: 'Nuevo servicio', screen: 'AddServicio' },
  { id: '2', icon: 'medical', label: 'Registrar parto', screen: 'AddParto' },
  { id: '3', icon: 'medkit', label: 'Nuevo tratamiento', screen: 'AddTratamiento' },
  { id: '4', icon: 'search', label: 'Buscar animal', screen: 'Herd' },
];

export default function HomeScreen({ navigation }) {
  const { isConnected, getSyncStatus, syncData } = useSync();
  const syncStatus = getSyncStatus();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncData();
    setRefreshing(false);
  };

  const renderAlertItem = ({ item }) => (
    <View style={[styles.alertCard, { borderLeftColor: ALERT_PRIORITY[item.type] }]}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertTime}>{item.time}</Text>
      </View>
      <Text style={styles.alertDescription}>{item.description}</Text>
    </View>
  );

  // Función de navegación mejorada para manejar la navegación entre pestañas y stacks
  const navigateTo = (screenName) => {
    // Si el usuario quiere buscar animal, navegar a la pestaña Hato y pasar un parámetro para enfocar el input
    if (screenName === 'Herd') {
      navigation.navigate('Hato', { focusSearch: true });
      return;
    }
    // Determinar a qué pestaña corresponde cada pantalla
    let tabName;
    if (screenName === 'AddServicio' || screenName === 'AddDiagnostico') {
      tabName = 'Calendario';
    } else if (screenName === 'AddAnimal' || screenName === 'AddParto' ||
               screenName === 'AddTratamiento' || screenName === 'AddSecado' ||
               screenName === 'AddOrdena') {
      tabName = 'Hato';
    }
    if (tabName && tabName !== 'Inicio') {
      navigation.navigate(tabName, { screen: screenName });
    } else {
      navigation.navigate(screenName);
    }
  };

  const renderQuickAction = ({ item }) => (
    <TouchableOpacity 
      style={styles.quickAction}
      onPress={() => navigateTo(item.screen)}
    >
      <Ionicons name={item.icon} size={32} color={COLORS.primary} />
      <Text style={styles.quickActionText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection Status Banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-off" size={16} color="white" />
          <Text style={styles.offlineText}>Sin conexión - Trabajando en modo local</Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
      >
        {/* Sync Status Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <Text style={styles.syncTitle}>Estado de sincronización</Text>
            <View style={[styles.syncStatus, { backgroundColor: syncStatus.color }]}>
              <Text style={styles.syncStatusText}>{syncStatus.text}</Text>
            </View>
          </View>
          
          <Text style={styles.syncDescription}>
            {syncStatus.status === 'synced' 
              ? 'Todos los datos están actualizados.' 
              : syncStatus.status === 'pending'
                ? 'Tienes cambios pendientes por sincronizar.'
                : 'Sincronizando tus datos...'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.syncButton, { opacity: syncStatus.status === 'synced' ? 0.6 : 1 }]} 
            onPress={syncData}
            disabled={syncStatus.status === 'synced' || syncStatus.status === 'syncing'}
          >
            <Ionicons name="sync" size={20} color="white" />
            <Text style={styles.syncButtonText}>
              {syncStatus.status === 'syncing' ? 'Sincronizando...' : 'Sincronizar ahora'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <FlatList
          data={quickActions}
          renderItem={renderQuickAction}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContainer}
        />

        {/* Alerts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertas recientes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todo</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={mockAlerts}
          renderItem={renderAlertItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.alertsContainer}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  syncCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  syncStatus: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  syncStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  syncDescription: {
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    transition: 'opacity 0.3s ease',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.text,
  },
  alertsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    transform: [{ translateY: 0 }],
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '500',
  },
  alertDescription: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingLeft: 2,
    opacity: 0.9,
  },
});
