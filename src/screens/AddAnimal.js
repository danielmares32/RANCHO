import React, { useState } from 'react';
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
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useSync } from '../context/SyncContext';
import { AnimalService } from '../services/DataService';
import StorageService from '../services/StorageService';
import LocalPhotoService from '../services/LocalPhotoService';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

const AddAnimal = ({ navigation, route }) => {
  const { addPendingChange } = useSync();
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [animalData, setAnimalData] = useState({
    nombre: '',
    id_siniiga: '',
    id_interno: '',
    raza: '',
    fecha_nacimiento: '',
    sexo: 'Hembra',
    estado_fisiologico: '',
    estatus: 'Activa'
  });
  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]); // Array of selected images
  const [uploading, setUploading] = useState(false);
  const [locationOptions, setLocationOptions] = useState([
    // Default fallback if none passed
    { label: 'Potrero 1', value: 'Potrero 1' },
    { label: 'Potrero 2', value: 'Potrero 2' },
    { label: 'Corral 1', value: 'Corral 1' },
    { label: 'Corral 2', value: 'Corral 2' },
    { label: 'Sala de Ordeña', value: 'Sala de Ordeña' },
    { label: 'Hospital', value: 'Hospital' },
    { label: 'Otro', value: 'Otro' },
  ]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if we're in edit mode
  const isEditMode = route?.params?.editMode === true;
  const animalId = route?.params?.animalId;

  // Load animal data if in edit mode
  useFocusEffect(
    React.useCallback(() => {
      const loadAnimalData = async () => {
        if (isEditMode && animalId) {
          try {
            setLoading(true);
            console.log('Loading animal data for edit, ID:', animalId);
            const animal = await AnimalService.getAnimalById(animalId);

            if (animal) {
              console.log('Animal found:', animal);
              setAnimalData({
                nombre: animal.nombre || '',
                id_siniiga: animal.id_siniiga || '',
                id_interno: animal.id_interno || '',
                raza: animal.raza || '',
                fecha_nacimiento: animal.fecha_nacimiento || '',
                sexo: animal.sexo || 'Hembra',
                estado_fisiologico: animal.estado_fisiologico || '',
                estatus: animal.estatus || 'Activa'
              });
              setLocation(animal.location || '');
              if (animal.photo) {
                setImage(animal.photo);
              }
            } else {
              console.error('Animal not found with ID:', animalId);
              Alert.alert('Error', 'No se encontró el animal');
              navigation.goBack();
            }
          } catch (error) {
            console.error('Error loading animal:', error);
            Alert.alert('Error', 'No se pudo cargar el animal');
            navigation.goBack();
          } finally {
            setLoading(false);
          }
        }
      };

      loadAnimalData();

      // Try to get locations from navigation params (if coming from LocationsScreen)
      if (route && route.params && route.params.locations) {
        setLocationOptions(route.params.locations.map(l => ({ label: l.name, value: l.name })));
      }
    }, [route, isEditMode, animalId])
  );

  const handleChange = (field, value) => {
    setAnimalData({
      ...animalData,
      [field]: value
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se requiere permiso para acceder a la galería.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reduced for smaller file size
      base64: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImage = result.assets[0].uri;
      console.log('Image picked:', newImage);
      console.log('Image size:', result.assets[0].fileSize, 'bytes');

      // Add to images array for multiple photo support
      setImages(prev => [...prev, newImage]);
      setImage(newImage); // Keep for backward compatibility
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se requiere permiso de cámara para tomar fotos.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reduced for smaller file size
      base64: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImage = result.assets[0].uri;
      console.log('Photo taken:', newImage);
      console.log('Photo size:', result.assets[0].fileSize, 'bytes');

      // Add to images array for multiple photo support
      setImages(prev => [...prev, newImage]);
      setImage(newImage); // Keep for backward compatibility
    }
  };

  const handleSave = async () => {
    // Validar campos obligatorios
    if (!animalData.id_interno || !animalData.nombre || !animalData.raza) {
      Alert.alert('Campos obligatorios', 'Por favor complete los campos obligatorios (ID Interno, Nombre y Raza)');
      return;
    }

    try {
      setUploading(true);
      let photoUri = null;

      if (image) {
        if (Platform.OS === 'web') {
          // Web: Try to upload to Supabase, fallback to local storage if offline
          try {
            photoUri = await StorageService.uploadPhoto(image);
            console.log('Photo uploaded to Supabase Storage (web):', photoUri);
          } catch (uploadError) {
            console.error('Error uploading photo:', uploadError);

            // Check if it's a network error (offline)
            const isNetworkError = uploadError.message?.includes('Failed to fetch') ||
                                   uploadError.message?.includes('Network') ||
                                   uploadError.message?.includes('CONNECTION');

            if (isNetworkError) {
              // Save locally instead when offline
              console.log('Network error detected, saving photo locally...');
              try {
                photoUri = await LocalPhotoService.savePhotoLocally(image);
                console.log('Photo saved locally (web, offline):', photoUri);
              } catch (localSaveError) {
                console.error('Error saving photo locally:', localSaveError);
                Alert.alert(
                  'Error al guardar foto',
                  'No se pudo guardar la foto. ¿Deseas continuar sin foto?',
                  [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setUploading(false) },
                    { text: 'Continuar', onPress: () => saveAnimal(null) }
                  ]
                );
                return;
              }
            } else {
              // Other upload errors
              const errorMessage = uploadError.message || 'Error desconocido';
              Alert.alert(
                'Error al subir foto',
                `${errorMessage}\n\n¿Deseas continuar sin foto?`,
                [
                  { text: 'Cancelar', style: 'cancel', onPress: () => setUploading(false) },
                  { text: 'Continuar', onPress: () => saveAnimal(null) }
                ]
              );
              return;
            }
          }
        } else {
          // Mobile: Save locally, upload later during sync
          try {
            photoUri = await LocalPhotoService.savePhotoLocally(image);
            console.log('Photo saved locally (mobile):', photoUri);
          } catch (saveError) {
            console.error('Error saving photo locally:', saveError);
            Alert.alert(
              'Error al guardar foto',
              'No se pudo guardar la foto localmente. ¿Deseas continuar sin foto?',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => setUploading(false) },
                { text: 'Continuar', onPress: () => saveAnimal(null) }
              ]
            );
            return;
          }
        }
      }

      await saveAnimal(photoUri);
    } catch (error) {
      console.error('Error guardando animal:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el animal');
    } finally {
      setUploading(false);
    }
  };

  const saveAnimal = async (photoUrl) => {
    try {
      if (isEditMode && animalId) {
        // Update existing animal
        console.log('Updating animal with ID:', animalId);
        await AnimalService.updateAnimal({
          id_animal: animalId,
          ...animalData,
          photo: photoUrl !== null ? photoUrl : image, // Keep existing photo if no new one uploaded
          location,
        });
        console.log('Animal actualizado correctamente');

        // Añadir cambio pendiente para sincronización
        addPendingChange();

        // Mostrar mensaje de éxito y regresar
        setSaveSuccessMessage('Animal actualizado correctamente!');
        setTimeout(() => {
          setSaveSuccessMessage('');
          navigation.goBack();
        }, 2000);
      } else {
        // Insert new animal
        const result = await AnimalService.insertAnimal({
          ...animalData,
          photo: photoUrl,
          location,
        });
        console.log('Animal guardado con ID:', result.id_animal);

        // Añadir cambio pendiente para sincronización
        addPendingChange();

        // Mostrar mensaje de éxito y regresar
        setSaveSuccessMessage('Animal agregado correctamente!');
        setTimeout(() => {
          setSaveSuccessMessage('');
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      console.error('Error al guardar animal:', error);
      Alert.alert('Error', 'No se pudo guardar el animal. Intente nuevamente.');
    }
  };

  const renderField = (label, field, placeholder, keyboardType = 'default', required = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.requiredMark}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={animalData[field]}
        onChangeText={(text) => handleChange(field, text)}
        keyboardType={keyboardType}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Cargando datos del animal...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>{isEditMode ? 'Editar Animal' : 'Agregar Animal'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          {/* Animal Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos del Animal</Text>
            {renderField('ID SINIIGA', 'id_siniiga', 'Ingrese ID SINIIGA', 'default')}
            {renderField('ID Interno', 'id_interno', 'Ingrese ID interno', 'default', true)}
            {renderField('Nombre', 'nombre', 'Ingrese nombre', 'default', true)}
            {renderField('Raza', 'raza', 'Ingrese raza', 'default', true)}
            {renderField('Fecha de nacimiento', 'fecha_nacimiento', 'DD/MM/AAAA')}
            {renderField('Estado fisiológico', 'estado_fisiologico', 'Ejemplo: Lactancia, Gestación')}
            
            <Text style={styles.sectionTitle}>Sexo y Estatus</Text>
            
            {/* Sexo Section */}
            <View style={styles.radioSection}>
              <Text style={styles.radioSectionLabel}>Sexo</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radioButton, animalData.sexo === 'Hembra' && styles.radioButtonSelected]} onPress={() => handleChange('sexo', 'Hembra')}>
                  <Text style={[styles.radioText, animalData.sexo === 'Hembra' && styles.radioTextSelected]}>Hembra</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, animalData.sexo === 'Macho' && styles.radioButtonSelected]} onPress={() => handleChange('sexo', 'Macho')}>
                  <Text style={[styles.radioText, animalData.sexo === 'Macho' && styles.radioTextSelected]}>Macho</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Estatus Section */}
            <View style={styles.radioSection}>
              <Text style={styles.radioSectionLabel}>Estatus</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radioButton, animalData.estatus === 'Activa' && styles.radioButtonSelected]} onPress={() => handleChange('estatus', 'Activa')}>
                  <Text style={[styles.radioText, animalData.estatus === 'Activa' && styles.radioTextSelected]}>Activa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, animalData.estatus === 'Vendida' && styles.radioButtonSelected]} onPress={() => handleChange('estatus', 'Vendida')}>
                  <Text style={[styles.radioText, animalData.estatus === 'Vendida' && styles.radioTextSelected]}>Vendida</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, animalData.estatus === 'Muerta' && styles.radioButtonSelected]} onPress={() => handleChange('estatus', 'Muerta')}>
                  <Text style={[styles.radioText, animalData.estatus === 'Muerta' && styles.radioTextSelected]}>Muerta</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radioButton, animalData.estatus === 'Secada' && styles.radioButtonSelected]} onPress={() => handleChange('estatus', 'Secada')}>
                  <Text style={[styles.radioText, animalData.estatus === 'Secada' && styles.radioTextSelected]}>Secada</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, animalData.estatus === 'Enferma' && styles.radioButtonSelected]} onPress={() => handleChange('estatus', 'Enferma')}>
                  <Text style={[styles.radioText, animalData.estatus === 'Enferma' && styles.radioTextSelected]}>Enferma</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Foto del Animal</Text>
            {image && <Image source={{ uri: image }} style={styles.animalImage} />}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                <Text style={styles.photoBtnText}>Tomar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                <Text style={styles.photoBtnText}>Cargar foto</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={location} onValueChange={v => setLocation(v)}>
                <Picker.Item label="Selecciona ubicación" value="" />
                {locationOptions.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </Picker>
            </View>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Ubicaciones')}>
              <Text style={styles.linkText}>Gestionar ubicaciones</Text>
            </TouchableOpacity>
          </View>

          {/* Save Button Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.saveBtn, uploading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveBtnText}>Guardando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {saveSuccessMessage || (isEditMode ? 'Actualizar' : 'Agregar')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 8,
    paddingBottom: 64,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
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
  radioSection: {
    marginBottom: 16,
  },
  radioSectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
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
    marginTop: 32, // More margin to separate from picker
    marginBottom: 32, // More space at bottom
  },
  animalImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  photoBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  pickerContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    marginBottom: 8,
  },
  linkBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddAnimal;
