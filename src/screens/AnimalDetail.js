import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { AnimalService } from '../services/DataService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimalDetail = ({ route, navigation }) => {
  const { animalId } = route.params;
  const [animal, setAnimal] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const loadAnimal = async () => {
      try {
        const data = await AnimalService.getAnimalById(animalId);
        setAnimal(data);

        // Parse photos - support both old format (string) and new format (JSON array)
        if (data.photo) {
          try {
            const parsed = JSON.parse(data.photo);
            if (Array.isArray(parsed)) {
              setPhotos(parsed);
            } else if (parsed.url) {
              // Single photo object {url, uploadedAt}
              setPhotos([parsed]);
            } else {
              // Old format - just URL string
              setPhotos([{ url: data.photo, uploadedAt: null }]);
            }
          } catch {
            // Old format - just URL string
            setPhotos([{ url: data.photo, uploadedAt: null }]);
          }
        }
      } catch (error) {
        console.error('Error al cargar detalles del animal:', error);
      }
    };
    loadAnimal();
  }, [animalId]);

  const openFullscreen = (index) => {
    setCurrentPhotoIndex(index);
    setFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
  };

  const goToNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const goToPreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

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

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Photos Section */}
          {photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.sectionTitle}>Fotos ({photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoItem}
                    onPress={() => openFullscreen(index)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: photo.url }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                    <View style={styles.expandIconContainer}>
                      <Ionicons name="expand-outline" size={20} color="#fff" />
                    </View>
                    {photo.uploadedAt && (
                      <Text style={styles.photoDate}>
                        {new Date(photo.uploadedAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

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
      </ScrollView>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeFullscreen}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Photo Counter */}
          <View style={styles.photoCounter}>
            <Text style={styles.photoCounterText}>
              {currentPhotoIndex + 1} / {photos.length}
            </Text>
          </View>

          {/* Fullscreen Image */}
          <Image
            source={{ uri: photos[currentPhotoIndex]?.url }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              {currentPhotoIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={goToPreviousPhoto}
                >
                  <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
              )}

              {currentPhotoIndex < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={goToNextPhoto}
                >
                  <Ionicons name="chevron-forward" size={32} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Photo Date */}
          {photos[currentPhotoIndex]?.uploadedAt && (
            <View style={styles.fullscreenDateContainer}>
              <Text style={styles.fullscreenDate}>
                {new Date(photos[currentPhotoIndex].uploadedAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  backButton: {
    padding: 4,
  },
  photosSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  photosScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  expandIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  photoDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8,
  },
  photoCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 12,
    zIndex: 10,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  fullscreenDateContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  fullscreenDate: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
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