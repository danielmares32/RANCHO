import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { AnimalService } from '../services/DataService';

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
  const searchInputRef = useRef(null);

  // Cargar animales desde la base de datos
  const loadAnimals = async () => {
    try {
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

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1000);
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
      <TouchableOpacity
        style={styles.animalCard}
        onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id_animal })}
      >
        <View style={styles.animalCardContent}>
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
