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
import { OrdenaService, AnimalService } from '../services/DataService';
import PlatformDatePicker from '../components/PlatformDatePicker';

const AddOrdena = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const animalId = route.params?.animalId || null;
  
  const [ordenaData, setOrdenaData] = useState({
    id_animal: animalId,
    fecha: new Date().toISOString().split('T')[0],
    litros_am: '',
    litros_pm: '',
    dias_en_leche: ''
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animales, setAnimales] = useState([]);
  const [selectedAnimalName, setSelectedAnimalName] = useState('');
  const [totalLitros, setTotalLitros] = useState('0.0');

  // Calcular total de litros cuando cambian los valores AM o PM
  useEffect(() => {
    const am = parseFloat(ordenaData.litros_am) || 0;
    const pm = parseFloat(ordenaData.litros_pm) || 0;
    setTotalLitros((am + pm).toFixed(1));
  }, [ordenaData.litros_am, ordenaData.litros_pm]);

  // Cargar lista de animales
  useEffect(() => {
    const fetchAnimales = async () => {
      try {
        const animalesData = await AnimalService.getAnimales();
        setAnimales(animalesData);
        
        // Si hay un animalId, buscar el nombre del animal
        if (animalId) {
          const animal = animalesData.find(a => a.id_animal === animalId);
          if (animal) {
            setSelectedAnimalName(animal.nombre);
          }
        }
      } catch (error) {
        console.error('Error al cargar animales:', error);
      }
    };
    
    fetchAnimales();
  }, [animalId]);

  const handleChange = (field, value) => {
    setOrdenaData({
      ...ordenaData,
      [field]: value
    });
  };

  const onDateChange = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleChange('fecha', formattedDate);
  };

  const handleSave = async () => {
    // Validar campos obligatorios
    if (!ordenaData.id_animal || !ordenaData.fecha) {
      Alert.alert('Campos obligatorios', 'Por favor complete los campos obligatorios');
      return;
    }

    if (!ordenaData.litros_am && !ordenaData.litros_pm) {
      Alert.alert('Campos obligatorios', 'Debe ingresar al menos la producción de una ordeña (AM o PM)');
      return;
    }

    try {
      // Guardar en la base de datos SQLite
      const result = await OrdenaService.insertOrdena({
        ...ordenaData,
        litros_am: ordenaData.litros_am || '0',
        litros_pm: ordenaData.litros_pm || '0',
        dias_en_leche: ordenaData.dias_en_leche ? parseInt(ordenaData.dias_en_leche) : null
      });
      console.log('Ordeña guardada con ID:', result.id_ordeña);
      
      // Añadir cambio pendiente para sincronización
      addPendingChange();

      // Mostrar mensaje de éxito y regresar
      Alert.alert('Éxito', 'Producción de leche registrada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error al guardar ordeña:', error);
      Alert.alert('Error', 'No se pudo guardar el registro. Intente nuevamente.');
    }
  };

  const showAnimalSelector = () => {
    if (animalId) return; // Si ya tenemos un animal seleccionado, no mostrar selector
    
    Alert.alert(
      'Seleccionar Animal',
      'Esta funcionalidad permitirá seleccionar un animal de la lista. Por ahora, use la opción desde la pantalla de detalles del animal.',
      [{ text: 'OK' }]
    );
  };

  // formatDate ya no es necesario ya que PlatformDatePicker maneja el formato

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
          <Text style={styles.headerTitle}>Registrar Producción de Leche</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.formContainer}>
          {/* Selector de animal */}
          <TouchableOpacity 
            style={styles.animalSelector}
            onPress={showAnimalSelector}
            disabled={!!animalId}
          >
            <View style={styles.animalSelectorContent}>
              <Ionicons name="paw" size={24} color={COLORS.primary} />
              <View style={styles.animalInfo}>
                <Text style={styles.animalSelectorLabel}>Animal</Text>
                <Text style={styles.selectedAnimal}>
                  {selectedAnimalName || 'Seleccionar animal...'}
                </Text>
              </View>
            </View>
            {!animalId && (
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
          
          {/* Selector de fecha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Fecha <Text style={styles.requiredMark}>*</Text></Text>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formatDate(ordenaData.fecha)}
              </Text>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={new Date(ordenaData.fecha)}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>
          
          <View style={styles.productionContainer}>
            {/* Producción AM */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Litros AM</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                value={ordenaData.litros_am}
                onChangeText={(text) => handleChange('litros_am', text)}
                keyboardType="decimal-pad"
              />
            </View>
            
            {/* Producción PM */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Litros PM</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                value={ordenaData.litros_pm}
                onChangeText={(text) => handleChange('litros_pm', text)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total del día:</Text>
            <Text style={styles.totalValue}>{totalLitros} litros</Text>
          </View>
          
          {/* Días en leche */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Días en leche</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de días en lactancia"
              value={ordenaData.dias_en_leche}
              onChangeText={(text) => handleChange('dias_en_leche', text)}
              keyboardType="number-pad"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Guardar Registro</Text>
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
  animalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  animalSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalInfo: {
    marginLeft: 12,
  },
  animalSelectorLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedAnimal: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 20,
    flex: 1,
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
  productionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary + '15',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
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

export default AddOrdena;
