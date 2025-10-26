import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function HelpScreen({ navigation }) {
  const helpSections = [
    {
      title: 'Primeros Pasos',
      icon: 'rocket',
      items: [
        'Cómo agregar un nuevo animal',
        'Registrar servicios y diagnósticos',
        'Configurar tu perfil',
      ]
    },
    {
      title: 'Gestión del Hato',
      icon: 'paw',
      items: [
        'Ver detalles de animales',
        'Actualizar información',
        'Registrar eventos',
      ]
    },
    {
      title: 'Sincronización',
      icon: 'sync',
      items: [
        'Modo offline',
        'Sincronizar con la nube',
        'Resolver conflictos',
      ]
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {helpSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.helpItem,
                    itemIndex < section.items.length - 1 && styles.helpItemBorder
                  ]}
                >
                  <Text style={styles.helpItemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Contact Support */}
        <View style={styles.section}>
          <View style={styles.supportCard}>
            <Ionicons name="help-circle" size={48} color={COLORS.primary} />
            <Text style={styles.supportTitle}>¿Necesitas más ayuda?</Text>
            <Text style={styles.supportText}>
              Contacta a nuestro equipo de soporte para asistencia personalizada
            </Text>
            <TouchableOpacity style={styles.supportButton}>
              <Ionicons name="mail" size={20} color="white" />
              <Text style={styles.supportButtonText}>Contactar Soporte</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>FarmSync v1.0.0</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  helpItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  helpItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  helpItemText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  supportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
