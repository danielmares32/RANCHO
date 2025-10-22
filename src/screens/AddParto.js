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
import { PartoService } from '../services/DataService';
import PlatformDatePicker from '../components/PlatformDatePicker';
import AnimalPicker from '../components/AnimalPicker';

const AddParto = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const animalIdFromRoute = route.params?.animalId || null;
  const isEditMode = route.params?.isEditMode || false;
  const partoIdToEdit = route.params?.partoId || null;

  const [partoData, setPartoData] = useState({
    id_animales: animalIdFromRoute ? [animalIdFromRoute] : [], // now an array
    fecha_parto: new Date().toISOString().split('T')[0],
    no_parto: '',
    problemas: '',
    dias_abiertos: ''
  });
  
  const [headerTitle, setHeaderTitle] = useState(
    isEditMode ? 'Editar Parto' : 'Registrar Parto'
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (isEditMode && partoIdToEdit) {
          setHeaderTitle('Editar Parto');
          const partoToEdit = await PartoService.getPartoById(partoIdToEdit);
          if (partoToEdit) {
            setPartoData({
              id_animales: [partoToEdit.id_animal], // set as array
              fecha_parto: partoToEdit.fecha_parto,
              no_parto: partoToEdit.no_parto !== null ? String(partoToEdit.no_parto) : '',
              problemas: partoToEdit.problemas || '',
              dias_abiertos: partoToEdit.dias_abiertos !== null ? String(partoToEdit.dias_abiertos) : '',
            });
          } else {
            Alert.alert('Error', 'No se pudo cargar el parto para editar.');
            navigation.goBack();
            return;
          }
        } else if (animalIdFromRoute) {
           setPartoData(prevData => ({ ...prevData, id_animales: [animalIdFromRoute] }));
        }

      } catch (error) {
        console.error('Error al cargar datos para AddParto:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      }
    };
    
    loadInitialData();
  }, [animalIdFromRoute, isEditMode, partoIdToEdit, navigation]);

  const handleChange = (field, value) => {
    setPartoData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const onDateChange = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleChange('fecha_parto', formattedDate);
  };

  const handleSave = async () => {
    if (!partoData.id_animales || partoData.id_animales.length === 0 || !partoData.fecha_parto) {
      Alert.alert('Campos obligatorios', 'Por favor selecciona al menos un animal y completa los campos obligatorios.');
      return;
    }
    try {
      for (const id_animal of partoData.id_animales) {
        const dataToSave = { ...partoData, id_animal };
        await PartoService.insertParto(dataToSave);
      }
      addPendingChange();
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        navigation.navigate('CalendarMain', { eventUpdated: true });
      }, 2000);
    } catch (error) {
      console.error('Error al guardar parto:', error);
      Alert.alert('Error', 'No se pudo guardar el parto. Intente nuevamente.');
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
            value={partoData.id_animales}
            onChange={ids => handleChange('id_animales', ids)}
            label="Animales *"
          />
          <PlatformDatePicker
            date={new Date(partoData.fecha_parto)} // Ensure date is a Date object
            onChange={onDateChange}
            label="Fecha de parto *"
            style={styles.fieldContainer}
          />
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>No. de parto</Text>
            <TextInput
              style={styles.input}
              value={partoData.no_parto}
              onChangeText={text => handleChange('no_parto', text)}
              placeholder="Número de parto"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Problemas</Text>
            <TextInput
              style={styles.input}
              value={partoData.problemas}
              onChangeText={text => handleChange('problemas', text)}
              placeholder="Problemas"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Días abiertos</Text>
            <TextInput
              style={styles.input}
              value={partoData.dias_abiertos}
              onChangeText={text => handleChange('dias_abiertos', text)}
              placeholder="Días abiertos"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={24} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{isEditMode ? 'Actualizar Parto' : 'Guardar Parto'}</Text>
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
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  toastIcon: {
    marginRight: 8,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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

export default AddParto;
