import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../context/SyncContext';
import { COLORS } from '../constants/colors';

// Mock user data
const userData = {
  name: 'Juan Pérez',
  email: 'juan.perez@rancho.com',
  farm: 'Rancho Los Pinos',
  location: 'Zacatecas, México',
  animalsCount: 125,
  lastSync: '2023-06-01T14:30:00',
};

export default function ProfileScreen({ navigation }) {
  const { isConnected, syncData, getSyncStatus } = useSync();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  const syncStatus = getSyncStatus();

  const handleSync = async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    try {
      await syncData();
    } finally {
      setSyncInProgress(false);
    }
  };

  const menuItems = [
    { 
      id: 'animals', 
      icon: 'paw', 
      title: 'Mis Animales', 
      onPress: () => navigation.navigate('Herd') 
    },
    { 
      id: 'calendar', 
      icon: 'calendar', 
      title: 'Calendario', 
      onPress: () => navigation.navigate('Calendar') 
    },
    { 
      id: 'reports', 
      icon: 'document-text', 
      title: 'Reportes',
      onPress: () => navigation.navigate('Reports') 
    },
    { 
      id: 'settings', 
      icon: 'settings', 
      title: 'Configuración',
      onPress: () => navigation.navigate('Settings') 
    },
    { 
      id: 'database', 
      icon: 'server', 
      title: 'Pruebas de Base de Datos',
      onPress: () => navigation.navigate('DatabaseTest')
    },
    { 
      id: 'help', 
      icon: 'help-circle', 
      title: 'Ayuda y Soporte',
      onPress: () => navigation.navigate('Help') 
    },
    { 
      id: 'logout', 
      icon: 'log-out', 
      title: 'Cerrar Sesión',
      titleColor: COLORS.danger,
      onPress: () => console.log('Logout') 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} 
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
        
        <View style={styles.farmInfo}>
          <Ionicons name="business" size={16} color={COLORS.textSecondary} />
          <Text style={styles.farmName}>{userData.farm}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={12} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{userData.location}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Sync Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Estado de Sincronización</Text>
            <View style={[styles.statusBadge, { backgroundColor: syncStatus.color }]}>
              <Text style={styles.statusText}>{syncStatus.text}</Text>
            </View>
          </View>
          
          <View style={styles.syncInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="paw" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{userData.animalsCount} animales registrados</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                Última sincronización: {new Date(userData.lastSync).toLocaleString()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.syncButton, { opacity: syncStatus.status === 'synced' ? 0.7 : 1 }]}
            onPress={handleSync}
            disabled={syncStatus.status === 'synced' || syncInProgress}
          >
            <Ionicons 
              name={syncInProgress ? 'sync' : 'sync-outline'} 
              size={20} 
              color="white" 
              style={syncInProgress && styles.rotateIcon}
            />
            <Text style={styles.syncButtonText}>
              {syncInProgress ? 'Sincronizando...' : 'Sincronizar ahora'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferencias de la App</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color={COLORS.text} />
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="white"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={20} color={COLORS.text} />
              <Text style={styles.settingText}>Modo Oscuro</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.card}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons 
                  name={item.icon} 
                  size={22} 
                  color={item.titleColor || COLORS.text} 
                />
                <Text style={[styles.menuItemText, item.titleColor && { color: item.titleColor }]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>FarmSync v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2023 FarmSync. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 64 : 0, // Increased top padding for iOS
  },
  scrollView: {
    flex: 1,
    // Add extra bottom padding for iOS
    paddingBottom: Platform.OS === 'ios' ? 32 : 0,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  farmInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginVertical: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  syncInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  rotateIcon: {
    transform: [{ rotate: '360deg' }],
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  rotateAnimation: {
    transform: [{ rotate: '360deg' }],
  },
});
