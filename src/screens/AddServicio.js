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
import { ServicioService } from '../services/DataService';
import PlatformDatePicker from '../components/PlatformDatePicker';
import AnimalPicker from '../components/AnimalPicker';

const AddServicio = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const animalIdFromRoute = route.params?.animalId || null;
  const isEditMode = route.params?.isEditMode || false;
  const servicioIdToEdit = route.params?.servicioId || null;

  const [servicioData, setServicioData] = useState({
    id_animales: animalIdFromRoute ? [animalIdFromRoute] : [], // now an array
    fecha_servicio: new Date().toISOString().split('T')[0],
    tipo_servicio: 'Inseminación',
    toro: ''
  });
  
  const [headerTitle, setHeaderTitle] = useState(
    isEditMode ? 'Editar Servicio' : 'Registrar Servicio'
  );
  const [showSuccessToast, setShowSuccessToast] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (isEditMode && servicioIdToEdit) {
          setHeaderTitle('Editar Servicio');
          const servicioToEdit = await ServicioService.getServicioById(servicioIdToEdit);
          if (servicioToEdit) {
            setServicioData({
              id_animal: servicioToEdit.id_animal,
              fecha_servicio: servicioToEdit.fecha_servicio,
              tipo_servicio: servicioToEdit.tipo_servicio,
              toro: servicioToEdit.toro || '',
            });
          } else {
            Alert.alert('Error', 'No se pudo cargar el servicio para editar.');
            navigation.goBack();
            return;
          }
        } else if (animalIdFromRoute) {
           setServicioData(prevData => ({ ...prevData, id_animal: animalIdFromRoute }));
        }

      } catch (error) {
        console.error('Error al cargar datos para AddServicio:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      }
    };
    
    loadInitialData();
  }, [animalIdFromRoute, isEditMode, servicioIdToEdit, navigation]);

  // Update handleChange for array
  const handleChange = (field, value) => {
    setServicioData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const onDateChange = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleChange('fecha_servicio', formattedDate);
  };

  const handleSave = async () => {
    if (!servicioData.id_animales || servicioData.id_animales.length === 0 || !servicioData.fecha_servicio || !servicioData.tipo_servicio) {
      Alert.alert('Campos obligatorios', 'Por favor selecciona al menos un animal y completa los campos obligatorios.');
      return;
    }
    try {
      for (const id_animal of servicioData.id_animales) {
        const dataToSave = { ...servicioData, id_animal };
        await ServicioService.insertServicio(dataToSave);
      }
      setShowSuccessToast('Servicio(s) registrado(s) correctamente');
      addPendingChange();
      setTimeout(() => {
        setShowSuccessToast('');
        navigation.navigate('CalendarMain', { eventUpdated: true });
      }, 2000);
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      Alert.alert('Error', 'No se pudo guardar el servicio. Intente nuevamente.');
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
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.formContainer}>
          <AnimalPicker
            value={servicioData.id_animales}
            onChange={ids => handleChange('id_animales', ids)}
            label="Animales *"
          />
          
          <PlatformDatePicker
            date={new Date(servicioData.fecha_servicio)} 
            onChange={onDateChange}
            label="Fecha de servicio *"
            style={styles.fieldContainer}
          />
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tipo de servicio <Text style={styles.requiredMark}>*</Text></Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={[
                  styles.radioButton, 
                  servicioData.tipo_servicio === 'Inseminación' && styles.radioButtonSelected
                ]}
                onPress={() => handleChange('tipo_servicio', 'Inseminación')}
              >
                <Text 
                  style={[
                    styles.radioText, 
                    servicioData.tipo_servicio === 'Inseminación' && styles.radioTextSelected
                  ]}
                >
                  Inseminación
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.radioButton, 
                  servicioData.tipo_servicio === 'Monta' && styles.radioButtonSelected
                ]}
                onPress={() => handleChange('tipo_servicio', 'Monta')}
              >
                <Text 
                  style={[
                    styles.radioText, 
                    servicioData.tipo_servicio === 'Monta' && styles.radioTextSelected
                  ]}
                >
                  Monta
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Toro</Text>
            <TextInput
              style={styles.input}
              value={servicioData.toro}
              onChangeText={(text) => handleChange('toro', text)}
              placeholder="Nombre o ID del toro"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={24} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{isEditMode ? 'Actualizar Servicio' : 'Guardar Servicio'}</Text>
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
    backgroundColor: 'white',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20', // 20% opacity
  },
  radioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  radioTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
});

export default AddServicio;