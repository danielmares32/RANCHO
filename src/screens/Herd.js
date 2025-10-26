import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, Image, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { COLORS } from '../constants/colors';
import { AnimalService } from '../services/DataService';
import SupabaseService from '../services/SupabaseService';

// Mock data
const categories = [
  { id: 'all', name: 'Todo el hato' },
  { id: 'pregnant', name: 'Preñadas' },
  { id: 'lactating', name: 'En producción' },
  { id: 'dry', name: 'Secas' },
  { id: 'heifers', name: 'Villona' },
];

export default function HerdScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cattleData, setCattleData] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const searchInputRef = useRef(null);
  const syncInProgressRef = useRef(false);

  // Cargar animales desde la base de datos
  const loadAnimals = async () => {
    try {
      // On native platforms (Android/iOS), download from Supabase first if online
      if (Platform.OS !== 'web') {
        // Check internet connectivity
        const netInfo = await NetInfo.fetch();
        const isConnected = netInfo.isConnected && netInfo.isInternetReachable !== false;

        setIsOffline(!isConnected);

        // Only sync if online AND not already syncing
        if (isConnected && !syncInProgressRef.current) {
          syncInProgressRef.current = true;
          try {
            console.log('Herd: Downloading data from Supabase...');
            await SupabaseService.downloadAll();
            console.log('Herd: Download complete');
          } catch (syncError) {
            console.error('Herd: Sync error, loading local data:', syncError);
            // Continue to load local data even if sync fails
          } finally {
            syncInProgressRef.current = false;
          }
        } else if (!isConnected) {
          console.log('Herd: Offline mode - loading local data only');
        }
      }

      // Always load local data (either freshly synced or cached)
      const animales = await AnimalService.getAnimales();
      setCattleData(animales);
    } catch (error) {
      console.error('Error al cargar animales:', error);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  // Recargar cuando se regresa a la pantalla o se guarda un animal
  useEffect(() => {
    if (route?.params?.focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    // Si se navega de regreso desde AddAnimal, recargar
    const unsubscribe = navigation.addListener('focus', () => {
      loadAnimals();
    });
    return unsubscribe;
  }, [route?.params?.focusSearch, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnimals();
    setRefreshing(false);
  };

  const filteredCattle = cattleData.filter(animal => {
    const matchesSearch = (animal.id_interno || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (animal.nombre || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || (animal.estado_fisiologico || '') === activeCategory || (animal.category === activeCategory);
    return matchesSearch && matchesCategory;
  });

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item.id && styles.activeCategoryItem
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Text 
        style={[
          styles.categoryText,
          activeCategory === item.id && styles.activeCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const handleDeleteAnimal = async (animal) => {
    console.log('=== DELETE BUTTON PRESSED ===');
    console.log('Animal object:', JSON.stringify(animal, null, 2));
    console.log('Animal ID:', animal.id_animal);
    console.log('Animal ID Interno:', animal.id_interno);

    // Web compatibility: use window.confirm for web, Alert.alert for native
    const confirmDelete = async () => {
      console.log('=== DELETE CONFIRMED ===');
      console.log('About to delete animal ID:', animal.id_animal);
      try {
        console.log('Calling AnimalService.deleteAnimal...');
        const result = await AnimalService.deleteAnimal(animal.id_animal);
        console.log('Delete result:', result);
        console.log('Animal deleted successfully, reloading list...');
        await loadAnimals();
        console.log('List reloaded');

        if (Platform.OS === 'web') {
          window.alert('Animal eliminado correctamente');
        } else {
          Alert.alert('Éxito', 'Animal eliminado correctamente');
        }
      } catch (error) {
        console.error('=== DELETE ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (Platform.OS === 'web') {
          window.alert(`No se pudo eliminar el animal: ${error.message}`);
        } else {
          Alert.alert('Error', `No se pudo eliminar el animal: ${error.message}`);
        }
      }
    };

    if (Platform.OS === 'web') {
      // Use window.confirm on web
      const confirmed = window.confirm(
        `¿Estás seguro que deseas eliminar a ${animal.nombre || animal.id_interno}?`
      );
      if (confirmed) {
        await confirmDelete();
      } else {
        console.log('Delete cancelled');
      }
    } else {
      // Use Alert.alert on native platforms
      Alert.alert(
        'Eliminar Animal',
        `¿Estás seguro que deseas eliminar a ${animal.nombre || animal.id_interno}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled')
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: confirmDelete
          }
        ]
      );
    }
  };

  const handleEditAnimal = (animal) => {
    console.log('Edit button pressed for animal:', animal.id_animal, animal.id_interno);
    navigation.navigate('AddAnimal', { animalId: animal.id_animal, editMode: true });
  };

  const getFirstPhotoUrl = (photoData) => {
    if (!photoData) return null;

    try {
      const parsed = JSON.parse(photoData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].url;
      } else if (parsed.url) {
        return parsed.url;
      }
    } catch {
      // Old format - just URL string
      return photoData;
    }
    return null;
  };

  const renderAnimalItem = ({ item }) => {
    const photoUrl = getFirstPhotoUrl(item.photo);

    return (
      <View style={styles.animalCard}>
        <TouchableOpacity
          style={styles.animalCardContent}
          onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id_animal })}
        >
          {/* Photo Thumbnail */}
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.animalPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.animalPhotoPlaceholder}>
              <Ionicons name="image-outline" size={24} color={COLORS.textSecondary} />
            </View>
          )}

          {/* Animal Info */}
          <View style={styles.animalInfo}>
            <View style={styles.animalHeader}>
              <Text style={styles.animalTag}>{item.id_interno}</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: item.estatus === 'Activa' ? COLORS.success : COLORS.warning }
              ]} />
            </View>
            <Text style={styles.animalName}>{item.nombre}</Text>
            <View style={styles.animalDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="pricetag" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{item.raza}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{item.fecha_nacimiento || 'Sin fecha'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={(e) => {
              console.log('EDIT BUTTON TAPPED');
              e?.stopPropagation?.();
              handleEditAnimal(item);
            }}
            activeOpacity={0.6}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              console.log('DELETE BUTTON TAPPED');
              e?.stopPropagation?.();
              handleDeleteAnimal(item);
            }}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Indicator */}
      {isOffline && Platform.OS !== 'web' && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="white" />
          <Text style={styles.offlineText}>Modo sin conexión - Mostrando datos guardados</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por arete o nombre..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          ref={searchInputRef}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Animal List */}
      <FlatList
        data={filteredCattle}
        renderItem={renderAnimalItem}
        keyExtractor={item => item.id_animal?.toString() || item.id_interno || Math.random().toString()}
        contentContainerStyle={styles.animalsList}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No se encontraron animales</Text>
            <Text style={styles.emptyStateSubtext}>Intenta con otro término de búsqueda</Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddAnimal')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  offlineIndicator: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: COLORS.text,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  activeCategoryItem: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 14,
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: '600',
  },
  animalsList: {
    padding: 16,
    paddingBottom: 80,
  },
  animalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  animalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  editButton: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  deleteButton: {
    borderColor: COLORS.danger,
    backgroundColor: '#fef2f2',
  },
  animalPhoto: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  animalPhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalInfo: {
    flex: 1,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  animalTag: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  animalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
