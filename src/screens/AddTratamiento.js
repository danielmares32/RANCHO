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
import { TratamientoService } from '../services/DataService';
import PlatformDatePicker from '../components/PlatformDatePicker';
import AnimalPicker from '../components/AnimalPicker';

const AddTratamiento = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const animalIdFromRoute = route.params?.animalId || null;
  const isEditMode = route.params?.isEditMode || false;
  const tratamientoIdToEdit = route.params?.tratamientoId || null;
  
  const [tratamientoData, setTratamientoData] = useState({
    id_animales: animalIdFromRoute ? [animalIdFromRoute] : [], // now an array
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    descripcion: '',
    medicamento: ''
  });
  
  const [headerTitle, setHeaderTitle] = useState(
    isEditMode ? 'Editar Tratamiento' : 'Registrar Tratamiento'
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (isEditMode && tratamientoIdToEdit) {
          setHeaderTitle('Editar Tratamiento');
          const tratamientoToEdit = await TratamientoService.getTratamientoById(tratamientoIdToEdit);
          if (tratamientoToEdit) {
            setTratamientoData({
              id_animales: [tratamientoToEdit.id_animal], // set as array
              fecha_inicio: tratamientoToEdit.fecha_inicio,
              fecha_fin: tratamientoToEdit.fecha_fin || '',
              descripcion: tratamientoToEdit.descripcion || '',
              medicamento: tratamientoToEdit.medicamento || ''
            });
          } else {
            Alert.alert('Error', 'No se pudo cargar el tratamiento para editar.');
            navigation.goBack();
            return;
          }
        } else if (animalIdFromRoute) {
           setTratamientoData(prevData => ({ ...prevData, id_animales: [animalIdFromRoute] }));
        }

      } catch (error) {
        console.error('Error al cargar datos para AddTratamiento:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      }
    };
    
    loadInitialData();
  }, [animalIdFromRoute, isEditMode, tratamientoIdToEdit, navigation]);

  const handleChange = (field, value) => {
    setTratamientoData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const onDateChangeInicio = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleChange('fecha_inicio', formattedDate);
  };

  const onDateChangeFin = (selectedDate) => {
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    handleChange('fecha_fin', formattedDate);
  };

  const handleSave = async () => {
    if (!tratamientoData.id_animales || tratamientoData.id_animales.length === 0 || !tratamientoData.fecha_inicio || !tratamientoData.medicamento) {
      Alert.alert('Campos obligatorios', 'Por favor selecciona al menos un animal y completa los campos obligatorios.');
      return;
    }
    try {
      for (const id_animal of tratamientoData.id_animales) {
        const dataToSave = { ...tratamientoData, id_animal };
        await TratamientoService.insertTratamiento(dataToSave);
      }
      addPendingChange();
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        navigation.navigate('CalendarMain', { eventUpdated: true });
      }, 2000);
    } catch (error) {
      console.error('Error al guardar tratamiento:', error);
      Alert.alert('Error', 'No se pudo guardar el tratamiento. Intente nuevamente.');
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
            value={tratamientoData.id_animales}
            onChange={ids => handleChange('id_animales', ids)}
            label="Animales *"
          />

          <PlatformDatePicker
            date={new Date(tratamientoData.fecha_inicio)} // Ensure date is a Date object
            onChange={onDateChangeInicio}
            label="Fecha de inicio *"
            style={styles.fieldContainer}
          />

          <PlatformDatePicker
            date={tratamientoData.fecha_fin ? new Date(tratamientoData.fecha_fin) : null}
            onChange={onDateChangeFin}
            label="Fecha de fin (opcional)"
            style={styles.fieldContainer}
            allowClear={true}
            onClear={() => handleChange('fecha_fin', '')}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={tratamientoData.descripcion}
              onChangeText={(text) => handleChange('descripcion', text)}
              placeholder="Describa el tratamiento aplicado"
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Medicamento <Text style={styles.requiredMark}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={tratamientoData.medicamento}
              onChangeText={(text) => handleChange('medicamento', text)}
              placeholder="Ej: Penicilina, Ivermectina..."
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={24} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{isEditMode ? 'Actualizar Tratamiento' : 'Guardar Tratamiento'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {showSuccessToast ? (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        ) : null}
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTratamiento;
