import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const initialLocations = [
  { id: 1, name: 'Potrero 1' },
  { id: 2, name: 'Potrero 2' },
  { id: 3, name: 'Corral 1' },
  { id: 4, name: 'Corral 2' },
  { id: 5, name: 'Sala de Ordeña' },
  { id: 6, name: 'Hospital' },
];

export default function LocationsScreen() {
  const [locations, setLocations] = useState(initialLocations);
  const [form, setForm] = useState({ name: '' });
  const [editingId, setEditingId] = useState(null);

  const handleChange = (value) => setForm({ name: value });

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Campo obligatorio', 'El nombre es obligatorio.');
      return;
    }
    if (editingId) {
      setLocations(locations.map(l => l.id === editingId ? { ...l, name: form.name } : l));
      setEditingId(null);
    } else {
      setLocations([...locations, { id: Date.now(), name: form.name }]);
    }
    setForm({ name: '' });
  };

  const handleEdit = (loc) => {
    setForm({ name: loc.name });
    setEditingId(loc.id);
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar ubicación', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setLocations(locations.filter(l => l.id !== id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Ubicaciones</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la ubicación"
          value={form.name}
          onChangeText={handleChange}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{editingId ? 'Actualizar' : 'Agregar'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={locations}
        keyExtractor={l => l.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.locationName}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={20} color="#d00" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay ubicaciones.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 64 : 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 0,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  form: {
    marginBottom: 24,
    paddingBottom: 32, // Add extra space at the bottom to prevent overlap
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    marginTop: 8, // Add margin to separate from input
    marginBottom: 16, // Add margin at the bottom
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  locationName: { flex: 1, fontWeight: 'bold' },
  iconBtn: { marginLeft: 10 },
});
