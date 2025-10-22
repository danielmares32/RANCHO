import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimalService } from '../services/DataService';

// Multi-select animal picker with checkboxes and select all
export default function AnimalPicker({ value = [], onChange, label = 'Animales', style }) {
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    let mounted = true;
    AnimalService.getAnimales()
      .then(data => {
        if (mounted) setAnimales(data);
      })
      .catch(() => setAnimales([]))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const toggleAnimal = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const allIds = animales.map(a => a.id_animal);
  const isAllSelected = allIds.length > 0 && value.length === allIds.length;
  const isSomeSelected = value.length > 0 && value.length < allIds.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allIds);
    }
  };

  if (loading) {
    return (
      <View style={{ marginVertical: 8 }}>
        <Text>{label}</Text>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={[{ marginVertical: 8 }, style]}>
      <Text style={{ marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity onPress={() => setShowList(!showList)} style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: 'white' }}>
        <Text>
          {value.length === 0 ? 'Selecciona animales...' : animales.filter(a => value.includes(a.id_animal)).map(a => a.nombre ? `${a.nombre} (${a.id_interno})` : a.id_interno).join(', ')}
        </Text>
        <Ionicons name={showList ? 'chevron-up' : 'chevron-down'} size={20} style={{ position: 'absolute', right: 12, top: 14 }} />
      </TouchableOpacity>
      {showList && (
        <ScrollView style={{ maxHeight: 240, marginTop: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: 'white' }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }} onPress={toggleSelectAll}>
            <Ionicons name={isAllSelected ? 'checkbox' : isSomeSelected ? 'remove-circle-outline' : 'square-outline'} size={22} color={isAllSelected ? '#007AFF' : isSomeSelected ? '#007AFF' : '#888'} />
            <Text style={{ marginLeft: 10, fontWeight: 'bold' }}>{isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}</Text>
          </TouchableOpacity>
          {animales.map(animal => (
            <TouchableOpacity key={animal.id_animal} style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }} onPress={() => toggleAnimal(animal.id_animal)}>
              <Ionicons name={value.includes(animal.id_animal) ? 'checkbox' : 'square-outline'} size={22} color={value.includes(animal.id_animal) ? '#007AFF' : '#888'} />
              <Text style={{ marginLeft: 10 }}>{animal.nombre ? `${animal.nombre} (${animal.id_interno})` : animal.id_interno}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
