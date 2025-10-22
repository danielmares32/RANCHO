import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { AnimalService } from '../services/DataService';

const AnimalDetail = ({ route, navigation }) => {
  const { animalId } = route.params;
  const [animal, setAnimal] = useState(null);

  useEffect(() => {
    const loadAnimal = async () => {
      try {
        const data = await AnimalService.getAnimalById(animalId);
        setAnimal(data);
      } catch (error) {
        console.error('Error al cargar detalles del animal:', error);
      }
    };
    loadAnimal();
  }, [animalId]);

  if (!animal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Animal</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>ID Interno:</Text>
        <Text style={styles.value}>{animal.id_interno}</Text>
        <Text style={styles.label}>Nombre:</Text>
        <Text style={styles.value}>{animal.nombre}</Text>
        <Text style={styles.label}>Raza:</Text>
        <Text style={styles.value}>{animal.raza}</Text>
        <Text style={styles.label}>Fecha de Nacimiento:</Text>
        <Text style={styles.value}>{animal.fecha_nacimiento || 'No especificada'}</Text>
        <Text style={styles.label}>Sexo:</Text>
        <Text style={styles.value}>{animal.sexo}</Text>
        <Text style={styles.label}>Estado Fisiológico:</Text>
        <Text style={styles.value}>{animal.estado_fisiologico || 'No especificado'}</Text>
        <Text style={styles.label}>Estatus:</Text>
        <Text style={styles.value}>{animal.estatus}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  eventInfo: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 16,
  },
  value: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default AnimalDetail; 