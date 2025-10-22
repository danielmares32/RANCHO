import DatabaseService from './DatabaseService';
import supabase from '../config/supabase';
import { Platform } from 'react-native';

/**
 * AuthService - Gestión de autenticación y usuarios
 * Roles: admin, manager, user
 * Permisos: create, read, update, delete
 */

// Definición de permisos por rol
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
};

export const PERMISSIONS = {
  // Animales
  ANIMALS_CREATE: 'animals:create',
  ANIMALS_READ: 'animals:read',
  ANIMALS_UPDATE: 'animals:update',
  ANIMALS_DELETE: 'animals:delete',

  // Registros reproductivos
  RECORDS_CREATE: 'records:create',
  RECORDS_READ: 'records:read',
  RECORDS_UPDATE: 'records:update',
  RECORDS_DELETE: 'records:delete',

  // Usuarios
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Reportes
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
};

// Matriz de permisos por rol
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Todos los permisos
    ...Object.values(PERMISSIONS),
  ],
  [ROLES.MANAGER]: [
    // Animales
    PERMISSIONS.ANIMALS_CREATE,
    PERMISSIONS.ANIMALS_READ,
    PERMISSIONS.ANIMALS_UPDATE,
    // Registros
    PERMISSIONS.RECORDS_CREATE,
    PERMISSIONS.RECORDS_READ,
    PERMISSIONS.RECORDS_UPDATE,
    PERMISSIONS.RECORDS_DELETE,
    // Usuarios (solo lectura)
    PERMISSIONS.USERS_READ,
    // Reportes
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  [ROLES.USER]: [
    // Solo lectura y creación de registros
    PERMISSIONS.ANIMALS_READ,
    PERMISSIONS.RECORDS_CREATE,
    PERMISSIONS.RECORDS_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

class AuthService {
  static currentUser = null;

  /**
   * Inicializar tablas de usuarios en SQLite
   */
  static async initializeUserTables() {
    if (Platform.OS === 'web') return;

    const sql = `
      CREATE TABLE IF NOT EXISTS Users (
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        email TEXT,
        role TEXT CHECK(role IN ('admin', 'manager', 'user')) DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL
      );

      -- Usuario admin por defecto (password: admin123)
      INSERT OR IGNORE INTO Users (username, password_hash, full_name, role, sync_status)
      VALUES ('admin', '$2a$10$rI0zF5qZ8Q0YqVN5xH5xHuP5rZ8Q0YqVN5xH5xHu', 'Administrador', 'admin', 'synced');
    `;

    try {
      await DatabaseService.execAsync(sql);
      console.log('AuthService: User tables initialized');
    } catch (error) {
      console.error('AuthService: Error initializing user tables:', error);
    }
  }

  /**
   * Verificar credenciales (versión simple para demo)
   */
  static async login(username, password) {
    try {
      if (Platform.OS === 'web') {
        // Web: autenticar con Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          throw new Error('Usuario o contraseña incorrectos');
        }

        // En producción, verificar hash de password
        // Por ahora, comparación simple
        if (data.password_hash !== password) {
          throw new Error('Usuario o contraseña incorrectos');
        }

        // Actualizar último login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id_user', data.id_user);

        this.currentUser = data;
        return data;
      } else {
        // Móvil: autenticar con SQLite
        const user = await DatabaseService.getFirstAsync(
          'SELECT * FROM Users WHERE username = ? AND is_active = 1',
          [username]
        );

        if (!user) {
          throw new Error('Usuario o contraseña incorrectos');
        }

        // Verificación simple de password (en producción usar bcrypt)
        if (user.password_hash !== password) {
          throw new Error('Usuario o contraseña incorrectos');
        }

        // Actualizar último login
        await DatabaseService.runAsync(
          'UPDATE Users SET last_login = ? WHERE id_user = ?',
          [new Date().toISOString(), user.id_user]
        );

        this.currentUser = user;
        return user;
      }
    } catch (error) {
      console.error('AuthService: Login error:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout() {
    this.currentUser = null;
  }

  /**
   * Obtener usuario actual
   */
  static getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verificar si tiene un permiso específico
   */
  static hasPermission(permission) {
    if (!this.currentUser) return false;

    const userRole = this.currentUser.role;
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

    return rolePermissions.includes(permission);
  }

  /**
   * Verificar si tiene un rol específico
   */
  static hasRole(role) {
    if (!this.currentUser) return false;
    return this.currentUser.role === role;
  }

  /**
   * Verificar si es administrador
   */
  static isAdmin() {
    return this.hasRole(ROLES.ADMIN);
  }

  /**
   * Obtener todos los permisos del usuario actual
   */
  static getUserPermissions() {
    if (!this.currentUser) return [];
    return ROLE_PERMISSIONS[this.currentUser.role] || [];
  }

  /**
   * Crear nuevo usuario (solo admin)
   */
  static async createUser(userData) {
    if (!this.isAdmin()) {
      throw new Error('No tienes permisos para crear usuarios');
    }

    const { username, password, full_name, email, role } = userData;

    try {
      if (Platform.OS === 'web') {
        const { data, error } = await supabase
          .from('users')
          .insert({
            username,
            password_hash: password, // En producción: hashear
            full_name,
            email,
            role: role || ROLES.USER,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const result = await DatabaseService.runAsync(
          `INSERT INTO Users (username, password_hash, full_name, email, role, sync_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [username, password, full_name, email, role || ROLES.USER, 'pending']
        );
        return result.lastInsertRowId;
      }
    } catch (error) {
      console.error('AuthService: Error creating user:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  static async getUsers() {
    if (!this.hasPermission(PERMISSIONS.USERS_READ)) {
      throw new Error('No tienes permisos para ver usuarios');
    }

    try {
      if (Platform.OS === 'web') {
        const { data, error } = await supabase
          .from('users')
          .select('id_user, username, full_name, email, role, is_active, created_at, last_login')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        return await DatabaseService.getAllAsync(
          'SELECT id_user, username, full_name, email, role, is_active, created_at, last_login FROM Users ORDER BY created_at DESC'
        );
      }
    } catch (error) {
      console.error('AuthService: Error getting users:', error);
      return [];
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(userId, updates) {
    if (!this.hasPermission(PERMISSIONS.USERS_UPDATE)) {
      throw new Error('No tienes permisos para actualizar usuarios');
    }

    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id_user', userId);

        if (error) throw error;
      } else {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), userId];

        await DatabaseService.runAsync(
          `UPDATE Users SET ${fields}, sync_status = 'pending' WHERE id_user = ?`,
          values
        );
      }
    } catch (error) {
      console.error('AuthService: Error updating user:', error);
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  static async deactivateUser(userId) {
    if (!this.hasPermission(PERMISSIONS.USERS_DELETE)) {
      throw new Error('No tienes permisos para desactivar usuarios');
    }

    return await this.updateUser(userId, { is_active: false });
  }

  /**
   * Activar usuario
   */
  static async activateUser(userId) {
    if (!this.hasPermission(PERMISSIONS.USERS_UPDATE)) {
      throw new Error('No tienes permisos para activar usuarios');
    }

    return await this.updateUser(userId, { is_active: true });
  }
}

export default AuthService;
