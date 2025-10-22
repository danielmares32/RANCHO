import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useSync } from '../context/SyncContext';
import { DiagnosticoService } from '../services/DataService';
import PlatformDatePicker from '../components/PlatformDatePicker';
import AnimalPicker from '../components/AnimalPicker';

const AddDiagnostico = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const animalId = route.params?.animalId || null;
  
  const [diagnosticoData, setDiagnosticoData] = useState({
    id_animales: animalId ? [animalId] : [], // now an array
    fecha_diagnostico: new Date().toISOString().split('T')[0],
    resultado: 'Preñada',
    dias_post_servicio: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Actualizar título de la pantalla
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'
    });
  }, [navigation, isEditMode]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar si estamos en modo edición
        const { diagnosticoId } = route.params || {};
        
        if (diagnosticoId) {
          // Modo edición: cargar datos del diagnóstico existente
          setIsEditMode(true);
          const existingDiagnostico = await DiagnosticoService.getDiagnosticoById(diagnosticoId);
          console.log('existingDiagnostico:', existingDiagnostico);
          
          if (existingDiagnostico) {
            setDiagnosticoData(prev => ({
              ...prev,
              ...existingDiagnostico,
              dias_post_servicio: existingDiagnostico.dias_post_servicio?.toString() || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    
    loadData();
  }, [animalId, route.params]);

  const handleChange = (field, value) => {
    setDiagnosticoData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const onDateChange = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleChange('fecha_diagnostico', formattedDate);
  };

  const handleSave = async () => {
    if (!diagnosticoData.id_animales || diagnosticoData.id_animales.length === 0 || !diagnosticoData.fecha_diagnostico || !diagnosticoData.resultado) {
      Alert.alert('Campos obligatorios', 'Por favor selecciona al menos un animal y completa los campos obligatorios.');
      return;
    }
    try {
      for (const id_animal of diagnosticoData.id_animales) {
        const dataToSave = { ...diagnosticoData, id_animal };
        await DiagnosticoService.insertDiagnostico(dataToSave);
      }
      addPendingChange();
      navigation.navigate('CalendarMain', { eventUpdated: true });
    } catch (error) {
      console.error('Error al guardar diagnóstico:', error);
      Alert.alert('Error', 'No se pudo guardar el diagnóstico. Intente nuevamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.formContainer}>
          <AnimalPicker
            value={diagnosticoData.id_animales}
            onChange={ids => handleChange('id_animales', ids)}
            label="Animales *"
          />
          
          {/* Selector de fecha */}
          <PlatformDatePicker
            date={new Date(diagnosticoData.fecha_diagnostico)}
            onChange={onDateChange}
            label="Fecha de diagnóstico *"
            style={styles.fieldContainer}
          />
          
          {/* Resultado */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Resultado <Text style={styles.requiredMark}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={diagnosticoData.resultado}
              onChangeText={text => handleChange('resultado', text)}
              placeholder="Resultado"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          
          {/* Días post servicio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Días post servicio</Text>
            <TextInput
              style={styles.input}
              value={diagnosticoData.dias_post_servicio}
              onChangeText={text => handleChange('dias_post_servicio', text)}
              placeholder="Días post servicio"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Ionicons name="save-outline" size={24} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{isEditMode ? 'Actualizar Diagnóstico' : 'Guardar Diagnóstico'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  formContainer: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  requiredMark: {
    color: COLORS.danger,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddDiagnostico;