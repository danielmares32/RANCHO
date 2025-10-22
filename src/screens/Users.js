import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Dummy in-memory user store for demo (replace with real backend integration)
const initialUsers = [
  { id: 1, email: 'admin@farm.com', firstName: 'Admin', lastName: 'User', role: 'admin', active: true },
  { id: 2, email: 'user@farm.com', firstName: 'Farm', lastName: 'Worker', role: 'user', active: true },
];

export default function UsersScreen() {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'user', active: true });
  const [editingId, setEditingId] = useState(null);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleResetPassword = (user) => {
    Alert.alert('Resetear contraseña', `¿Enviar correo de reseteo a ${user.email}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => Alert.alert('Correo enviado', `Se envió un correo de reseteo a ${user.email}`) }
    ]);
  };

  const handleSave = () => {
    if (!form.email || !form.firstName || !form.lastName) {
      Alert.alert('Campos obligatorios', 'Completa todos los campos.');
      return;
    }
    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? { ...u, ...form } : u));
      setEditingId(null);
    } else {
      setUsers([...users, { ...form, id: Date.now() }]);
    }
    setForm({ email: '', firstName: '', lastName: '', role: 'user', active: true });
  };

  const handleEdit = (user) => {
    setForm({ email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, active: user.active });
    setEditingId(user.id);
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar usuario', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setUsers(users.filter(u => u.id !== id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Usuarios</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={t => handleChange('email', t)}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={form.firstName}
          onChangeText={t => handleChange('firstName', t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={form.lastName}
          onChangeText={t => handleChange('lastName', t)}
        />
        <View style={{ marginBottom: 10 }}>
          <Text style={{ marginBottom: 4 }}>Rol</Text>
          <Picker
            selectedValue={form.role}
            onValueChange={v => handleChange('role', v)}
            style={{ backgroundColor: '#f4f4f4', borderRadius: 8 }}
          >
            <Picker.Item label="Usuario" value="user" />
            <Picker.Item label="Administrador" value="admin" />
          </Picker>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ marginRight: 8 }}>Activo</Text>
          <Switch
            value={form.active}
            onValueChange={v => handleChange('active', v)}
            trackColor={{ false: '#ccc', true: '#2ecc71' }}
            thumbColor={form.active ? '#2ecc71' : '#ccc'}
          />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{editingId ? 'Actualizar' : 'Agregar'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        keyExtractor={u => u.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text>{item.firstName} {item.lastName} ({item.role === 'admin' ? 'Administrador' : 'Usuario'})</Text>
              <Text style={{ color: item.active ? '#2ecc71' : '#d00', fontWeight: 'bold' }}>{item.active ? 'Activo' : 'Inactivo'}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={20} color="#d00" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleResetPassword(item)} style={styles.iconBtn}>
              <Ionicons name="key-outline" size={20} color="#888" />
            </TouchableOpacity>
            <Switch
              value={item.active}
              onValueChange={v => setUsers(users.map(u => u.id === item.id ? { ...u, active: v } : u))}
              trackColor={{ false: '#ccc', true: '#2ecc71' }}
              thumbColor={item.active ? '#2ecc71' : '#ccc'}
              style={{ marginLeft: 8 }}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay usuarios.</Text>}
        contentContainerStyle={styles.scrollView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 16, // Increased top padding for iOS
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 32 : 0, // Extra bottom padding for iOS
  },
  scrollView: {
    // Remove flex: 1 here to avoid stretching FlatList
    paddingBottom: Platform.OS === 'ios' ? 32 : 0,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  form: { marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2ecc71', borderRadius: 8, padding: 12, justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userEmail: { fontWeight: 'bold' },
  iconBtn: { marginLeft: 10 },
});
