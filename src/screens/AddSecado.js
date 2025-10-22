import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Keyboard,
  ToastAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useSync } from '../context/SyncContext';
import { SecadoService } from '../services/DataService';
import PlatformDatePicker from '../components/PlatformDatePicker';
import AnimalPicker from '../components/AnimalPicker';

const AddSecado = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const animalIdFromRoute = route.params?.animalId || null;
  const isEditMode = route.params?.isEditMode || false;
  const secadoIdToEdit = route.params?.secadoId || null;
  
  const [secadoData, setSecadoData] = useState({
    id_animales: animalIdFromRoute ? [animalIdFromRoute] : [], // now an array
    fecha_planeada: new Date().toISOString().split('T')[0],
    fecha_real: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState(
    isEditMode ? 'Editar Secado' : 'Registrar Secado'
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        if (isEditMode && secadoIdToEdit) {
          setHeaderTitle('Editar Secado');
          const secadoToEdit = await SecadoService.getSecadoById(secadoIdToEdit);
          if (secadoToEdit) {
            setSecadoData({
              id_animales: [secadoToEdit.id_animal], // set as array
              fecha_planeada: secadoToEdit.fecha_planeada,
              fecha_real: secadoToEdit.fecha_real || '',
            });
          } else {
            Alert.alert('Error', 'No se pudo cargar el secado para editar.');
            navigation.goBack();
            return;
          }
        } else if (animalIdFromRoute) {
           setSecadoData(prevData => ({ ...prevData, id_animales: [animalIdFromRoute] }));
        }
      } catch (error) {
        console.error('Error al cargar datos para AddSecado:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [animalIdFromRoute, isEditMode, secadoIdToEdit, navigation]);

  const handleChange = (field, value) => {
    setSecadoData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const onDateChangePlaneada = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleChange('fecha_planeada', formattedDate);
  };

  const onDateChangeReal = (selectedDate) => {
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    handleChange('fecha_real', formattedDate);
  };

  const handleSave = async () => {
    if (!secadoData.id_animales || secadoData.id_animales.length === 0 || !secadoData.fecha_planeada) {
      Alert.alert('Campos obligatorios', 'Por favor selecciona al menos un animal y completa los campos obligatorios.');
      return;
    }
    try {
      for (const id_animal of secadoData.id_animales) {
        const dataToSave = { ...secadoData, id_animal };
        await SecadoService.insertSecado(dataToSave);
      }
      addPendingChange();
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        navigation.navigate('CalendarMain', { eventUpdated: true });
      }, 2000);
    } catch (error) {
      console.error('Error al guardar secado:', error);
      Alert.alert('Error', 'No se pudo guardar el secado. Intente nuevamente.');
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
            value={secadoData.id_animales}
            onChange={ids => handleChange('id_animales', ids)}
            label="Animales *"
          />
          
          <PlatformDatePicker
            date={new Date(secadoData.fecha_planeada)} // Ensure date is a Date object
            onChange={onDateChangePlaneada}
            label="Fecha planeada *"
            style={styles.fieldContainer}
          />
          
          <PlatformDatePicker
            date={secadoData.fecha_real ? new Date(secadoData.fecha_real) : null}
            onChange={onDateChangeReal}
            label="Fecha real (opcional)"
            style={styles.fieldContainer}
            allowClear={true}
            onClear={() => handleChange('fecha_real', '')}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={24} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{isEditMode ? 'Actualizar Secado' : 'Guardar Secado'}</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
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

export default AddSecado;
