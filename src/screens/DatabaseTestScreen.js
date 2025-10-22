import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { AnimalService } from '../services/DataService';

const DatabaseTestScreen = () => {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [newAnimal, setNewAnimal] = useState({
    nombre: '',
    id_interno: '',
    raza: '',
    sexo: 'Hembra',
    estatus: 'Activa'
  });

  // Load animals on component mount
  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      const animalList = await AnimalService.getAnimales();
      setAnimals(animalList);
      setTestResults(prev => [...prev, `✅ Cargados ${animalList.length} animales`]);
    } catch (error) {
      console.error('Error loading animals:', error);
      setTestResults(prev => [...prev, `❌ Error cargando animales: ${error.message}`]);
    }
  };

  const addTestAnimal = async () => {
    try {
      setIsTesting(true);
      setTestResults(prev => [...prev, 'Agregando animal de prueba...']);
      
      const testId = `TEST-${Date.now()}`;
      const testAnimal = {
        nombre: `Vaca ${testId}`,
        id_interno: testId,
        raza: 'Holstein',
        sexo: 'Hembra',
        estatus: 'Activa',
        fecha_nacimiento: '2020-01-01'
      };

      await AnimalService.insertAnimal(testAnimal);
      setTestResults(prev => [...prev, '✅ Animal de prueba agregado exitosamente']);
      await loadAnimals();
    } catch (error) {
      console.error('Error adding test animal:', error);
      setTestResults(prev => [...prev, `❌ Error agregando animal: ${error.message}`]);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddAnimal = async () => {
    if (!newAnimal.id_interno) {
      setTestResults(prev => [...prev, '❌ El ID interno es requerido']);
      return;
    }

    try {
      setIsTesting(true);
      setTestResults(prev => [...prev, 'Agregando animal...']);
      
      await AnimalService.insertAnimal({
        ...newAnimal,
        fecha_nacimiento: newAnimal.fecha_nacimiento || null
      });
      
      setTestResults(prev => [...prev, '✅ Animal agregado exitosamente']);
      setNewAnimal({
        nombre: '',
        id_interno: '',
        raza: '',
        sexo: 'Hembra',
        estatus: 'Activa'
      });
      
      await loadAnimals();
    } catch (error) {
      console.error('Error adding animal:', error);
      setTestResults(prev => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pruebas de Base de Datos</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agregar Animal</Text>
        <TextInput
          style={styles.input}
          placeholder="ID Interno *"
          value={newAnimal.id_interno}
          onChangeText={(text) => setNewAnimal({...newAnimal, id_interno: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={newAnimal.nombre}
          onChangeText={(text) => setNewAnimal({...newAnimal, nombre: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Raza"
          value={newAnimal.raza}
          onChangeText={(text) => setNewAnimal({...newAnimal, raza: text})}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.addButton, isTesting && styles.buttonDisabled]}
            onPress={handleAddAnimal}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>
              {isTesting ? 'Agregando...' : 'Agregar Animal'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.testButton]}
            onPress={addTestAnimal}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Prueba Rápida</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Animales ({animals.length})</Text>
        <ScrollView style={styles.animalsList}>
          {animals.map(animal => (
            <View key={animal.id_animal} style={styles.animalCard}>
              <Text style={styles.animalId}>ID: {animal.id_interno}</Text>
              <Text style={styles.animalName}>{animal.nombre || 'Sin nombre'}</Text>
              <Text style={styles.animalBreed}>{animal.raza || 'Sin raza'}</Text>
              <Text style={styles.animalStatus}>Estado: {animal.estatus}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.resultsTitle}>Registros:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultItem}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: '#2ecc71',
  },
  testButton: {
    backgroundColor: '#3498db',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  animalsList: {
    maxHeight: 200,
    marginBottom: 10,
  },
  animalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  animalId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  animalBreed: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  animalStatus: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 4,
  },
  logsContainer: {
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    padding: 15,
    maxHeight: 150,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#ecf0f1',
  },
  resultItem: {
    fontSize: 12,
    marginBottom: 4,
    color: '#ecf0f1',
    fontFamily: Platform?.OS === 'android' ? 'monospace' : 'Courier New',
  },
});

export default DatabaseTestScreen;
