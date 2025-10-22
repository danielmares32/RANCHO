import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AuthService, { ROLES, PERMISSIONS } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

export default function UsersScreen() {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: ROLES.USER,
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.username || !form.full_name) {
      Alert.alert('Campos obligatorios', 'Completa usuario y nombre completo');
      return;
    }

    if (!editingId && !form.password) {
      Alert.alert('Campo obligatorio', 'La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      if (editingId) {
        // Actualizar usuario existente
        const updates = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
        };

        if (form.password) {
          updates.password_hash = form.password; // En producción: hashear
        }

        await AuthService.updateUser(editingId, updates);
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
        setEditingId(null);
      } else {
        // Crear nuevo usuario
        await AuthService.createUser(form);
        Alert.alert('Éxito', 'Usuario creado correctamente');
      }

      setForm({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: ROLES.USER,
      });

      loadUsers();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEdit = (user) => {
    setForm({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
    setEditingId(user.id_user);
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await AuthService.deactivateUser(user.id_user);
      } else {
        await AuthService.activateUser(user.id_user);
      }
      loadUsers();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: ROLES.USER,
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrador';
      case ROLES.MANAGER:
        return 'Gerente';
      case ROLES.USER:
        return 'Usuario';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return '#e74c3c';
      case ROLES.MANAGER:
        return '#f39c12';
      case ROLES.USER:
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  if (!hasPermission(PERMISSIONS.USERS_READ)) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="lock-closed" size={60} color={COLORS.textSecondary} />
        <Text style={styles.noPermissionText}>No tienes permisos para ver usuarios</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Usuarios</Text>

      {/* Formulario (solo para admin) */}
      {hasPermission(PERMISSIONS.USERS_CREATE) && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Usuario *"
            value={form.username}
            onChangeText={(t) => handleChange('username', t)}
            autoCapitalize="none"
            editable={!editingId} // No editable cuando se está editando
          />

          <TextInput
            style={styles.input}
            placeholder={editingId ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *'}
            value={form.password}
            onChangeText={(t) => handleChange('password', t)}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre completo *"
            value={form.full_name}
            onChangeText={(t) => handleChange('full_name', t)}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(t) => handleChange('email', t)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Rol</Text>
            <Picker
              selectedValue={form.role}
              onValueChange={(v) => handleChange('role', v)}
              style={styles.picker}
            >
              <Picker.Item label="Usuario" value={ROLES.USER} />
              <Picker.Item label="Gerente" value={ROLES.MANAGER} />
              <Picker.Item label="Administrador" value={ROLES.ADMIN} />
            </Picker>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>
                {editingId ? 'Actualizar' : 'Crear Usuario'}
              </Text>
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Lista de usuarios */}
      <FlatList
        data={users}
        keyExtractor={(u) => u.id_user.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <Text style={styles.userUsername}>@{item.username}</Text>
                {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
              </View>

              <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                <Text style={styles.roleBadgeText}>{getRoleLabel(item.role)}</Text>
              </View>
            </View>

            <View style={styles.userFooter}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: item.is_active ? COLORS.success : COLORS.danger }]} />
                <Text style={styles.statusText}>
                  {item.is_active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>

              {/* No permitir editar/desactivar al usuario actual */}
              {item.id_user !== currentUser?.id_user && (
                <View style={styles.userActions}>
                  {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                      <Ionicons name="create-outline" size={22} color={COLORS.secondary} />
                    </TouchableOpacity>
                  )}

                  {hasPermission(PERMISSIONS.USERS_UPDATE) && (
                    <TouchableOpacity
                      onPress={() => handleToggleActive(item)}
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name={item.is_active ? 'ban-outline' : 'checkmark-circle-outline'}
                        size={22}
                        color={item.is_active ? COLORS.danger : COLORS.success}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {item.id_user === currentUser?.id_user && (
                <Text style={styles.currentUserLabel}>(Tú)</Text>
              )}
            </View>

            {item.last_login && (
              <Text style={styles.lastLogin}>
                Último acceso: {new Date(item.last_login).toLocaleDateString('es-MX')}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay usuarios registrados</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 16,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  noPermissionText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    marginBottom: 4,
    fontWeight: '500',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  userCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 15,
  },
  currentUserLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  lastLogin: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textSecondary,
  },
});
