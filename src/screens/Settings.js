import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function SettingsScreen({ navigation }) {
  const settingsSections = [
    {
      title: 'Cuenta',
      items: [
        {
          id: 'profile',
          icon: 'person',
          title: 'Perfil',
          subtitle: 'Información de usuario y configuración',
          onPress: () => navigation.navigate('Profile')
        },
        {
          id: 'users',
          icon: 'people',
          title: 'Usuarios',
          subtitle: 'Administrar usuarios del sistema',
          onPress: () => navigation.navigate('Users')
        },
        {
          id: 'locations',
          icon: 'map',
          title: 'Ubicaciones',
          subtitle: 'Gestionar ubicaciones del rancho',
          onPress: () => navigation.navigate('Locations')
        },
      ]
    },
    {
      title: 'Sistema',
      items: [
        {
          id: 'database',
          icon: 'server',
          title: 'Base de Datos',
          subtitle: 'Pruebas y configuración de base de datos',
          onPress: () => navigation.navigate('DatabaseTest')
        },
        {
          id: 'storage',
          icon: 'cloud-upload',
          title: 'Almacenamiento',
          subtitle: 'Probar conexión de almacenamiento',
          onPress: () => navigation.navigate('StorageTest')
        },
      ]
    },
    {
      title: 'Aplicación',
      items: [
        {
          id: 'help',
          icon: 'help-circle',
          title: 'Ayuda y Soporte',
          subtitle: 'Documentación y asistencia',
          onPress: () => navigation.navigate('Help')
        },
        {
          id: 'about',
          icon: 'information-circle',
          title: 'Acerca de',
          subtitle: 'Versión e información de la app',
          onPress: () => {} // Could navigate to an About screen
        },
      ]
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración</Text>
        <Text style={styles.headerSubtitle}>Ajustes y preferencias de la aplicación</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.settingItemText}>
                      <Text style={styles.settingItemTitle}>{item.title}</Text>
                      <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

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
    paddingTop: Platform.OS === 'ios' ? 64 : 0,
  },
  header: {
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 32,
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
});
