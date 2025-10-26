import * as SQLite from 'expo-sqlite';

class DatabaseService {
  static dbInstance = null;
  static initPromise = null;
  static isInitialized = false;
  static queryQueue = Promise.resolve();

  static async getDB() {
    if (!DatabaseService.dbInstance) {
      console.log('DatabaseService: Opening database connection...');
      DatabaseService.dbInstance = await SQLite.openDatabaseAsync('farmsync.db', {
        useNewConnection: true
      });
      console.log('DatabaseService: Connection opened successfully to farmsync.db with useNewConnection');
    }
    return DatabaseService.dbInstance;
  }

  // Serialize all database operations to prevent concurrent access
  static async withQueue(operation) {
    const currentQueue = DatabaseService.queryQueue;
    let resolver;
    DatabaseService.queryQueue = new Promise(resolve => {
      resolver = resolve;
    });

    try {
      await currentQueue;
      const result = await operation();
      return result;
    } finally {
      resolver();
    }
  }

  static async initialize() {
    if (DatabaseService.isInitialized) {
      console.log('DatabaseService: Already initialized');
      return true;
    }

    if (DatabaseService.initPromise) {
      console.log('DatabaseService: Waiting for ongoing initialization...');
      return DatabaseService.initPromise;
    }

    DatabaseService.initPromise = this.withQueue(async () => {
      try {
        const db = await DatabaseService.getDB();
        await DatabaseService.initDatabase(db);
        DatabaseService.isInitialized = true;
        console.log('DatabaseService: Initialization complete');
        return true;
      } catch (error) {
        console.error('DatabaseService: Failed to initialize:', error);
        DatabaseService.initPromise = null; // Reset on failure
        throw error;
      }
    });

    return DatabaseService.initPromise;
  }

  static async initDatabase(db) {
    if (!db) {
      throw new Error('DB instance not available');
    }

    console.log('DatabaseService: Starting database schema initialization...');

    const schemaStatements = [
      `CREATE TABLE IF NOT EXISTS Animales (
        id_animal INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        id_siniiga TEXT,
        id_interno TEXT UNIQUE NOT NULL,
        raza TEXT,
        fecha_nacimiento TEXT,
        sexo TEXT CHECK(sexo IN ('Hembra', 'Macho')),
        estado_fisiologico TEXT,
        estatus TEXT CHECK(estatus IN ('Activa', 'Vendida', 'Muerta', 'Secada', 'Enferma')),
        photo TEXT,
        location TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        local_id TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS Servicios (
        id_servicio INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER NOT NULL,
        fecha_servicio TEXT,
        tipo_servicio TEXT,
        toro TEXT,
        notas TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (id_animal) REFERENCES Animales(id_animal) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Diagnosticos (
        id_diagnostico INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER NOT NULL,
        fecha_diagnostico TEXT,
        resultado TEXT,
        dias_post_servicio INTEGER,
        notas TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (id_animal) REFERENCES Animales(id_animal) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Partos (
        id_parto INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER NOT NULL,
        fecha_parto TEXT,
        no_parto INTEGER,
        problemas TEXT,
        dias_abiertos INTEGER,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (id_animal) REFERENCES Animales(id_animal) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Ordenas (
        id_ordena INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER NOT NULL,
        fecha_ordena TEXT,
        litros_am REAL,
        litros_pm REAL,
        total_litros REAL,
        dias_en_leche INTEGER,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (id_animal) REFERENCES Animales(id_animal) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Tratamientos (
        id_tratamiento INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER NOT NULL,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        descripcion TEXT,
        medicamento TEXT,
        dosis TEXT,
        frecuencia TEXT,
        notas TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (id_animal) REFERENCES Animales(id_animal) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Secados (
        id_secado INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER NOT NULL,
        fecha_planeada TEXT,
        fecha_real TEXT,
        motivo TEXT,
        notas TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (id_animal) REFERENCES Animales(id_animal) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Users (
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
      );`,
      `INSERT OR IGNORE INTO Users (username, password_hash, full_name, role, sync_status)
       VALUES ('admin', 'admin123', 'Administrador', 'admin', 'synced');`
    ];

    try {
      // Run all schema statements in a single transaction
      await db.withTransactionAsync(async () => {
        for (const statement of schemaStatements) {
          if (statement.trim().startsWith('INSERT')) {
            await db.runAsync(statement);
          } else {
            await db.execAsync(statement);
          }
        }
      });
      console.log('DatabaseService: Database schema initialization completed successfully.');
    } catch (error) {
      console.error('DatabaseService: Error during schema initialization:', error);
      throw error;
    }
  }

  static async runAsync(sql, params = []) {
    return this.withQueue(async () => {
      const db = await this.getDB();
      try {
        // Use withTransactionAsync for more stable execution on Android
        let result;
        await db.withTransactionAsync(async () => {
          result = await db.runAsync(sql, params);
        });
        return result;
      } catch (error) {
        console.error('DatabaseService: SQL Error with runAsync:', { sql, params, error });
        throw error;
      }
    });
  }

  static async getFirstAsync(sql, params = []) {
    return this.withQueue(async () => {
      const db = await this.getDB();
      try {
        // Use withTransactionAsync for more stable execution on Android
        let result;
        await db.withTransactionAsync(async () => {
          result = await db.getFirstAsync(sql, params);
        });
        return result;
      } catch (error) {
        console.error('DatabaseService: SQL Error with getFirstAsync:', { sql, params, error });
        throw error;
      }
    });
  }

  static async getAllAsync(sql, params = []) {
    return this.withQueue(async () => {
      const db = await this.getDB();
      try {
        // Use withTransactionAsync for more stable execution on Android
        let result;
        await db.withTransactionAsync(async () => {
          result = await db.getAllAsync(sql, params);
        });
        return result;
      } catch (error) {
        console.error('DatabaseService: SQL Error with getAllAsync:', { sql, params, error });
        throw error;
      }
    });
  }

  static async execAsync(sql) {
    return this.withQueue(async () => {
      const db = await this.getDB();
      try {
        await db.withTransactionAsync(async () => {
          await db.execAsync(sql);
        });
      } catch (error) {
        console.error('DatabaseService: SQL Error with execAsync:', { sql, error });
        throw error;
      }
    });
  }
}

// Animal Service
export class AnimalService {
  static async getAnimales() {
    try {
      const animales = await DatabaseService.getAllAsync('SELECT * FROM Animales ORDER BY id_interno ASC');
      return animales || [];
    } catch (error) {
      console.error('AnimalService: Error getting animales:', error);
      return [];
    }
  }

  static async insertAnimal(animal) {
    const { nombre, id_siniiga, id_interno, raza, fecha_nacimiento, sexo, estado_fisiologico, estatus, photo, location } = animal;
    if (!id_interno || id_interno.trim() === '') throw new Error('El ID interno es obligatorio.');
    if (sexo && !['Hembra', 'Macho'].includes(sexo)) throw new Error('El sexo debe ser "Hembra" o "Macho".');
    const validStatuses = ['Activa', 'Vendida', 'Muerta', 'Secada', 'Enferma'];
    if (estatus && !validStatuses.includes(estatus)) throw new Error(`Estatus no válido: ${estatus}. Debe ser uno de: ${validStatuses.join(', ')}`);
    
    let formattedDate = fecha_nacimiento;
    if (fecha_nacimiento && typeof fecha_nacimiento === 'string' && fecha_nacimiento.includes('/')) {
      const parts = fecha_nacimiento.split('/'); // DD/MM/YYYY
      if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; // YYYY-MM-DD
    }

    const sql = `INSERT INTO Animales (nombre, id_siniiga, id_interno, raza, fecha_nacimiento, sexo, estado_fisiologico, estatus, photo, location, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      nombre || null,
      id_siniiga || null,
      id_interno,
      raza || null,
      formattedDate || null,
      sexo || 'Hembra', // Default to Hembra if not specified
      estado_fisiologico || null,
      estatus || 'Activa', // Default to Activa if not specified
      photo || null,
      location || null,
      'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('AnimalService: Error inserting animal:', { error, animalData: animal });
      if (error.message && error.message.toLowerCase().includes('unique constraint failed')) {
        throw new Error(`Ya existe un animal con el ID interno: ${id_interno}.`);
      }
      throw error;
    }
  }

  static async getPendingSyncAnimales() {
    try {
      const animales = await DatabaseService.getAllAsync('SELECT * FROM Animales WHERE sync_status = ?', ['pending']);
      return animales;
    } catch (error) {
      console.error('AnimalService: Error getting pending sync animals:', error);
      throw error;
    }
  }

  static async markAsSynced(id_animal) {
    try {
      await DatabaseService.runAsync('UPDATE Animales SET sync_status = ? WHERE id_animal = ?', ['synced', id_animal]);
      console.log(`AnimalService: Animal ${id_animal} marked as synced.`);
    } catch (error) {
      console.error(`AnimalService: Error marking animal ${id_animal} as synced:`, error);
      throw error;
    }
  }

  static async getAnimalById(id_animal) {
    try {
      // Ensure LIMIT 1 for getFirstAsync if the query could potentially return more without it
      const animal = await DatabaseService.getFirstAsync('SELECT * FROM Animales WHERE id_animal = ? LIMIT 1', [id_animal]);
      return animal; // Returns the animal object or null
    } catch (error) {
      console.error(`AnimalService: Error getting animal by ID ${id_animal}:`, error);
      throw error;
    }
  }
  
  static async updateAnimal(animalData) {
    const { id_animal, nombre, id_siniiga, id_interno, raza, fecha_nacimiento, sexo, estado_fisiologico, estatus, photo, location } = animalData;
    if (!id_animal) throw new Error('ID del animal es requerido para actualizar.');
    if (!id_interno || id_interno.trim() === '') throw new Error('El ID interno es obligatorio.');

    let formattedDate = fecha_nacimiento;
    if (fecha_nacimiento && typeof fecha_nacimiento === 'string' && fecha_nacimiento.includes('/')) {
      const parts = fecha_nacimiento.split('/');
      if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }

    const sql = `UPDATE Animales SET
                    nombre = ?,
                    id_siniiga = ?,
                    id_interno = ?,
                    raza = ?,
                    fecha_nacimiento = ?,
                    sexo = ?,
                    estado_fisiologico = ?,
                    estatus = ?,
                    photo = ?,
                    location = ?,
                    sync_status = 'pending'
                 WHERE id_animal = ?`;
    const params = [
        nombre || null,
        id_siniiga || null,
        id_interno,
        raza || null,
        formattedDate || null,
        sexo || 'Hembra',
        estado_fisiologico || null,
        estatus || 'Activa',
        photo || null,
        location || null,
        id_animal
    ];
    try {
        const result = await DatabaseService.runAsync(sql, params);
        return result.changes; // Number of rows affected
    } catch (error) {
        console.error('AnimalService: Error updating animal:', { error, animalData });
        if (error.message && error.message.toLowerCase().includes('unique constraint failed')) {
            throw new Error(`Ya existe otro animal con el ID interno: ${id_interno}.`);
        }
        throw error;
    }
  }

  static async deleteAnimal(id_animal) {
    try {
        const result = await DatabaseService.runAsync('DELETE FROM Animales WHERE id_animal = ?', [id_animal]);
        console.log(`AnimalService: Animal ${id_animal} deleted. Rows affected: ${result.changes}`);
        return result.changes; // Number of rows affected
    } catch (error) {
        console.error(`AnimalService: Error deleting animal ${id_animal}:`, error);
        throw error;
    }
  }
}

// Add missing service classes for other tables
export class ServicioService {
  static async getServicios() {
    try {
      const result = await DatabaseService.getAllAsync('SELECT * FROM Servicios');
      return result || [];
    } catch (error) {
      console.error('ServicioService: Error getting servicios:', error);
      return [];
    }
  }

  static async insertServicio(servicio) {
    const { id_animal, fecha_servicio, tipo_servicio, toro, notas } = servicio;
    if (!id_animal) throw new Error('El ID del animal es obligatorio.');
    const sql = `INSERT INTO Servicios (id_animal, fecha_servicio, tipo_servicio, toro, notas, sync_status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
      id_animal,
      fecha_servicio || null,
      tipo_servicio || null,
      toro || null,
      notas || null,
      'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('ServicioService: Error inserting servicio:', { error, servicio });
      throw error;
    }
  }
}

export class DiagnosticoService {
  static async getDiagnosticos() {
    try {
      const result = await DatabaseService.getAllAsync('SELECT * FROM Diagnosticos');
      return result || [];
    } catch (error) {
      console.error('DiagnosticoService: Error getting diagnosticos:', error);
      return [];
    }
  }

  static async insertDiagnostico(diagnostico) {
    const { id_animal, fecha_diagnostico, resultado, dias_post_servicio, notas } = diagnostico;
    if (!id_animal) throw new Error('El ID del animal es obligatorio.');
    const sql = `INSERT INTO Diagnosticos (id_animal, fecha_diagnostico, resultado, dias_post_servicio, notas, sync_status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
      id_animal,
      fecha_diagnostico || null,
      resultado || null,
      dias_post_servicio || null,
      notas || null,
      'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('DiagnosticoService: Error inserting diagnostico:', { error, diagnostico });
      throw error;
    }
  }
}

export class PartoService {
  static async getPartos() {
    try {
      const result = await DatabaseService.getAllAsync('SELECT * FROM Partos');
      return result || [];
    } catch (error) {
      console.error('PartoService: Error getting partos:', error);
      return [];
    }
  }

  static async insertParto(parto) {
    const { id_animal, fecha_parto, no_parto, problemas, dias_abiertos, sync_status } = parto;
    if (!id_animal) throw new Error('El ID del animal es obligatorio.');
    const sql = `INSERT INTO Partos (id_animal, fecha_parto, no_parto, problemas, dias_abiertos, sync_status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
      id_animal,
      fecha_parto || null,
      no_parto || null,
      problemas || null,
      dias_abiertos || null,
      sync_status || 'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('PartoService: Error inserting parto:', { error, parto });
      throw error;
    }
  }
}

export class TratamientoService {
  static async getTratamientos() {
    try {
      const result = await DatabaseService.getAllAsync('SELECT * FROM Tratamientos');
      return result || [];
    } catch (error) {
      console.error('TratamientoService: Error getting tratamientos:', error);
      return [];
    }
  }

  static async insertTratamiento(tratamiento) {
    const { id_animal, fecha_inicio, fecha_fin, descripcion, medicamento, dosis, frecuencia, notas } = tratamiento;
    if (!id_animal) throw new Error('El ID del animal es obligatorio.');
    const sql = `INSERT INTO Tratamientos (id_animal, fecha_inicio, fecha_fin, descripcion, medicamento, dosis, frecuencia, notas, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      id_animal,
      fecha_inicio || null,
      fecha_fin || null,
      descripcion || null,
      medicamento || null,
      dosis || null,
      frecuencia || null,
      notas || null,
      'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('TratamientoService: Error inserting tratamiento:', { error, tratamiento });
      throw error;
    }
  }
}

export class SecadoService {
  static async getSecados() {
    try {
      const result = await DatabaseService.getAllAsync('SELECT * FROM Secados');
      return result || [];
    } catch (error) {
      console.error('SecadoService: Error getting secados:', error);
      return [];
    }
  }

  static async insertSecado(secado) {
    const { id_animal, fecha_planeada, fecha_real, motivo, notas } = secado;
    if (!id_animal) throw new Error('El ID del animal es obligatorio.');
    const sql = `INSERT INTO Secados (id_animal, fecha_planeada, fecha_real, motivo, notas, sync_status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
      id_animal,
      fecha_planeada || null,
      fecha_real || null,
      motivo || null,
      notas || null,
      'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('SecadoService: Error inserting secado:', { error, secado });
      throw error;
    }
  }
}

export class OrdenaService {
  static async getOrdenas() {
    try {
      const result = await DatabaseService.getAllAsync('SELECT * FROM Ordenas');
      return result || [];
    } catch (error) {
      console.error('OrdenaService: Error getting ordenas:', error);
      return [];
    }
  }

  static async insertOrdena(ordena) {
    const { id_animal, fecha_ordena, litros_am, litros_pm, total_litros, dias_en_leche } = ordena;
    if (!id_animal) throw new Error('El ID del animal es obligatorio.');
    const sql = `INSERT INTO Ordenas (id_animal, fecha_ordena, litros_am, litros_pm, total_litros, dias_en_leche, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      id_animal,
      fecha_ordena || null,
      litros_am || null,
      litros_pm || null,
      total_litros || null,
      dias_en_leche || null,
      'pending'
    ];
    try {
      const result = await DatabaseService.runAsync(sql, params);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('OrdenaService: Error inserting ordena:', { error, ordena });
      throw error;
    }
  }
}

// Export DatabaseService as default
export default DatabaseService;