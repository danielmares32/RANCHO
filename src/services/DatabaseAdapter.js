import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Adaptador de base de datos para mantener la misma API tanto para SQLite como para IndexedDB
class DatabaseAdapter {
  constructor() {
    console.log('[DatabaseAdapter] Platform.OS:', Platform.OS);
    this.isWeb = Platform.OS === 'web';
    this.db = null;
    this.indexedDB = this.isWeb ? window.indexedDB : null;
    this.dbName = 'farmsync';
    this.isInitialized = false;
    
    // No inicializar en el constructor para evitar problemas de sincronización
  }

  // Método para inicializar la base de datos según la plataforma
  async initializeDatabase() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      if (this.isWeb) {
        console.log('Usando IndexedDB para entorno web');
        this.db = await this.openIndexedDB();
      } else {
        console.log('Usando expo-sqlite para entorno nativo');
        
        // Usar la API correcta de expo-sqlite
        this.db = SQLite.openDatabase('farmsync.db');
        
        if (!this.db) {
          throw new Error('No se pudo abrir la base de datos SQLite');
        }
        
        console.log('Base de datos SQLite abierta correctamente');
        
        // Crear las tablas necesarias
        await this.createTables();
      }
      
      this.isInitialized = true;
      return this.db;
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  // Método para crear tablas en SQLite
  async createTables() {
    if (this.isWeb) return; // IndexedDB maneja esto en onupgradeneeded

    const tables = [
      `CREATE TABLE IF NOT EXISTS Animales (
        id_animal INTEGER PRIMARY KEY AUTOINCREMENT,
        id_interno TEXT,
        nombre TEXT,
        raza TEXT,
        fecha_nacimiento TEXT,
        sexo TEXT,
        estado TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS Servicios (
        id_servicio INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER,
        fecha_servicio TEXT,
        tipo_servicio TEXT,
        toro TEXT,
        observaciones TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_animal) REFERENCES Animales (id_animal)
      )`,
      
      `CREATE TABLE IF NOT EXISTS Diagnosticos (
        id_diagnostico INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER,
        fecha_diagnostico TEXT,
        resultado TEXT,
        observaciones TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_animal) REFERENCES Animales (id_animal)
      )`,
      
      `CREATE TABLE IF NOT EXISTS Partos (
        id_parto INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER,
        fecha_parto TEXT,
        tipo_parto TEXT,
        crias_vivas INTEGER,
        crias_muertas INTEGER,
        observaciones TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_animal) REFERENCES Animales (id_animal)
      )`,
      
      `CREATE TABLE IF NOT EXISTS Ordenas (
        id_ordena INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER,
        fecha_ordena TEXT,
        litros_producidos REAL,
        observaciones TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_animal) REFERENCES Animales (id_animal)
      )`,
      
      `CREATE TABLE IF NOT EXISTS Tratamientos (
        id_tratamiento INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        medicamento TEXT,
        dosis TEXT,
        via_administracion TEXT,
        observaciones TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_animal) REFERENCES Animales (id_animal)
      )`,
      
      `CREATE TABLE IF NOT EXISTS Secados (
        id_secado INTEGER PRIMARY KEY AUTOINCREMENT,
        id_animal INTEGER,
        fecha_secado TEXT,
        observaciones TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_animal) REFERENCES Animales (id_animal)
      )`
    ];

    try {
      for (const tableSQL of tables) {
        await this.executeSql(tableSQL);
      }
      console.log('Todas las tablas creadas exitosamente');
    } catch (error) {
      console.error('Error al crear tablas:', error);
      throw error;
    }
  }
  
  // Método para obtener la base de datos (mantener compatibilidad)
  async openDatabase() {
    if (this.db && this.isInitialized) {
      return this.db;
    }
    return this.initializeDatabase();
  }

  // Método para abrir IndexedDB en entorno web
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!this.indexedDB) {
        return reject(new Error('IndexedDB no está disponible en este navegador'));
      }

      const request = this.indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        reject(new Error('Error al abrir IndexedDB: ' + event.target.errorCode));
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Crear objetos para cada tabla
        if (!db.objectStoreNames.contains('Animales')) {
          const animalStore = db.createObjectStore('Animales', { keyPath: 'id_animal', autoIncrement: true });
          animalStore.createIndex('id_interno', 'id_interno', { unique: false });
          animalStore.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('Servicios')) {
          const servicioStore = db.createObjectStore('Servicios', { keyPath: 'id_servicio', autoIncrement: true });
          servicioStore.createIndex('id_animal', 'id_animal', { unique: false });
          servicioStore.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('Diagnosticos')) {
          const diagnosticoStore = db.createObjectStore('Diagnosticos', { keyPath: 'id_diagnostico', autoIncrement: true });
          diagnosticoStore.createIndex('id_animal', 'id_animal', { unique: false });
          diagnosticoStore.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('Partos')) {
          const partoStore = db.createObjectStore('Partos', { keyPath: 'id_parto', autoIncrement: true });
          partoStore.createIndex('id_animal', 'id_animal', { unique: false });
          partoStore.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('Ordenas')) {
          const ordenaStore = db.createObjectStore('Ordenas', { keyPath: 'id_ordena', autoIncrement: true });
          ordenaStore.createIndex('id_animal', 'id_animal', { unique: false });
          ordenaStore.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('Tratamientos')) {
          const tratamientoStore = db.createObjectStore('Tratamientos', { keyPath: 'id_tratamiento', autoIncrement: true });
          tratamientoStore.createIndex('id_animal', 'id_animal', { unique: false });
          tratamientoStore.createIndex('sync_status', 'sync_status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('Secados')) {
          const secadoStore = db.createObjectStore('Secados', { keyPath: 'id_secado', autoIncrement: true });
          secadoStore.createIndex('id_animal', 'id_animal', { unique: false });
          secadoStore.createIndex('sync_status', 'sync_status', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
    });
  }

  // Método para ejecutar consultas SQL (compatible con SQLite y simulación en IndexedDB)
  async executeSql(sql, params = []) {
    try {
      console.log('Executing SQL:', sql, 'with params:', params);
      const db = await this.openDatabase();
      
      if (this.isWeb) {
        console.log('Executing SQL for IndexedDB:', sql);
        return this.executeIndexedDB(sql, params);
      } else {
        // Usar la API correcta de expo-sqlite con promesas
        return new Promise((resolve, reject) => {
          db.transaction(
            (tx) => {
              tx.executeSql(
                sql,
                params,
                (_, result) => {
                  console.log('SQL executed successfully');
                  
                  // Convertir el resultado al formato esperado
                  const rows = [];
                  if (result.rows) {
                    for (let i = 0; i < result.rows.length; i++) {
                      rows.push(result.rows.item(i));
                    }
                  }
                  
                  // Para operaciones que no son SELECT, obtener el número de filas afectadas
                  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
                  const rowsAffected = isSelect ? 0 : (result.rowsAffected || 0);
                  
                  const resultWithRowsAffected = {
                    ...result,
                    rowsAffected: rowsAffected,
                    insertId: result.insertId || undefined,
                    rows: {
                      length: result.rows ? result.rows.length : 0,
                      item: (index) => result.rows ? result.rows.item(index) : null,
                      _array: rows
                    }
                  };
                  
                  resolve([resultWithRowsAffected]);
                },
                (_, error) => {
                  console.error('Error en executeSql:', { sql, params, error });
                  reject(error);
                  return false; // Importante para manejar el error correctamente
                }
              );
            },
            (error) => {
              console.error('Transaction error:', error);
              reject(error);
            },
            () => {
              console.log('Transaction completed successfully');
            }
          );
        });
      }
    } catch (error) {
      console.error('Error en executeSql:', { sql, params, error });
      throw error;
    }
  }

  // Método para extraer el nombre de la tabla de una consulta SQL
  extractTableName(sql, db) {
    // Primero intentar extraer el nombre de la tabla de la consulta SQL
    let tableName = null;
    
    // Intentar extraer el nombre de la tabla de la consulta SQL
    const fromMatch = sql.match(/FROM\s+([^\s,;)]+)/i);
    if (fromMatch && fromMatch[1]) {
      tableName = fromMatch[1].replace(/[`'"\[\]]/g, ''); // Eliminar comillas y backticks
      
      // Verificar si el nombre de la tabla existe exactamente como está
      if (db && db.objectStoreNames && db.objectStoreNames.contains(tableName)) {
        return tableName;
      }
      
      // Si no existe, buscar coincidencia insensible a mayúsculas
      if (db && db.objectStoreNames) {
        for (let i = 0; i < db.objectStoreNames.length; i++) {
          const storeName = db.objectStoreNames[i];
          if (storeName.toLowerCase() === tableName.toLowerCase()) {
            console.log(`Usando store con nombre similar: ${storeName}`);
            return storeName; // Devolver el nombre exacto del store
          }
        }
      }
    }
    
    // Extraer el nombre de la tabla de la consulta SQL (case insensitive)
    const patterns = [
      { regex: /(?:FROM|INTO|UPDATE|DELETE\s+FROM)\s+([^\s,;()]+)/i, group: 1 },
      { regex: /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([^\s(,;]+)/i, group: 1 },
      { regex: /FROM\s+"([^"]+)"/i, group: 1 },
      { regex: /FROM\s+`([^`]+)`/i, group: 1 },
      { regex: /FROM\s+\[([^\]]+)\]/i, group: 1 }
    ];
    
    for (const { regex, group } of patterns) {
      const match = sql.match(regex);
      if (match && match[group]) {
        tableName = match[group].trim();
        break;
      }
    }
    
    if (!tableName) return null;
    
    // Si tenemos acceso al objeto db, intentar hacer coincidir con el case correcto
    if (db && db.objectStoreNames) {
      const storeNames = Array.from(db.objectStoreNames);
      const matchedStore = storeNames.find(
        store => store.toLowerCase() === tableName.toLowerCase()
      );
      
      if (matchedStore) {
        console.log(`Matched table name '${tableName}' to store '${matchedStore}'`);
        return matchedStore; // Devuelve el nombre con el case correcto
      }
    }
    
    // Si no se encontró coincidencia exacta, devolver el nombre original
    return tableName;
  }

  // Método para simular executeSql en IndexedDB
  async executeIndexedDB(sql, params = []) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Executing IndexedDB query:', { sql, params });
        const db = await this.openDatabase();
        
        // Extraer el nombre de la tabla de la consulta SQL
        let tableName = this.extractTableName(sql, db);
        
        // Si es una consulta CREATE TABLE, simplemente devolver éxito
        if (sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
          console.log('CREATE TABLE statement handled by onupgradeneeded');
          resolve([{ rowsAffected: 0 }]);
          return;
        }
        
        if (!tableName) {
          console.warn('No se pudo determinar la tabla en la consulta SQL, devolviendo éxito vacío');
          resolve([{ rowsAffected: 0, rows: { length: 0, item: () => null, _array: [] } }]);
          return;
        }
        
        // Verificar si el object store existe (case sensitive)
        if (!db.objectStoreNames.contains(tableName)) {
          console.error(`El object store '${tableName}' no existe en la base de datos`);
          console.log('Object stores disponibles:', Array.from(db.objectStoreNames));
          
          // Intentar encontrar el store ignorando mayúsculas/minúsculas
          const storeNames = Array.from(db.objectStoreNames);
          const matchedStore = storeNames.find(
            store => store.toLowerCase() === tableName.toLowerCase()
          );
          
          if (matchedStore) {
            console.log(`Usando store con nombre similar: ${matchedStore}`);
            tableName = matchedStore;
          } else {
            throw new Error(`La tabla '${tableName}' no existe`);
          }
        }
        
        console.log(`Using table/collection: ${tableName}`);
        
        // Manejar diferentes tipos de consultas
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          await this.handleIndexedDBSelect(db, tableName, sql, params, resolve, reject);
        } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
          await this.handleIndexedDBInsert(db, tableName, sql, params, resolve, reject);
        } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
          await this.handleIndexedDBUpdate(db, tableName, sql, params, resolve, reject);
        } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
          await this.handleIndexedDBDelete(db, tableName, sql, params, resolve, reject);
        } else {
          console.warn('Consulta no manejada completamente:', sql);
          const result = {
            rows: { length: 0, item: () => null, _array: [] },
            rowsAffected: 0,
            insertId: undefined
          };
          resolve([result]);
        }
      } catch (error) {
        console.error('Error en executeIndexedDB:', { sql, params, error });
        reject(error);
      }
    });    
  }

  // Manejar SELECT en IndexedDB
  async handleIndexedDBSelect(db, tableName, sql, params, resolve, reject) {
    const transaction = db.transaction([tableName], 'readonly');
    const store = transaction.objectStore(tableName);
    
    if (params.length === 0 || !sql.includes('WHERE')) {
      // SELECT * FROM tabla
      const request = store.getAll();
      
      request.onsuccess = () => {
        const rows = request.result;
        console.log(`Found ${rows.length} rows in ${tableName}`);
        
        const result = {
          rows: {
            length: rows.length,
            item: (index) => rows[index],
            _array: rows
          },
          rowsAffected: 0,
          insertId: undefined
        };
        resolve([result]);
      };
      
      request.onerror = (event) => {
        console.error('Error en SELECT (getAll):', event.target.error);
        reject(event.target.error);
      };
    } else {
      // SELECT con WHERE
      const id = params[0];
      const request = store.get(id);
      
      request.onsuccess = () => {
        const row = request.result;
        console.log('Found row:', row);
        
        const result = {
          rows: {
            length: row ? 1 : 0,
            item: () => row,
            _array: row ? [row] : []
          },
          rowsAffected: 0,
          insertId: undefined
        };
        resolve([result]);
      };
      
      request.onerror = (event) => {
        console.error('Error en SELECT (get):', event.target.error);
        reject(event.target.error);
      };
    }
  }

  // Manejar INSERT en IndexedDB
  async handleIndexedDBInsert(db, tableName, sql, params, resolve, reject) {
    const insertTransaction = db.transaction([tableName], 'readwrite');
    const insertStore = insertTransaction.objectStore(tableName);
    
    // Extraer los valores de la consulta INSERT
    const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!valuesMatch) {
      reject(new Error('No se pudieron extraer los valores de la consulta INSERT'));
      return;
    }
    
    // Crear un objeto con los valores a insertar
    const columnMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
    if (!columnMatch) {
      reject(new Error('No se pudieron extraer las columnas de la consulta INSERT'));
      return;
    }
    
    const columns = columnMatch[1].split(',').map(col => col.trim());
    const values = params;
    
    if (columns.length !== values.length) {
      reject(new Error(`El número de columnas (${columns.length}) no coincide con el número de valores (${values.length})`));
      return;
    }
    
    const data = {};
    columns.forEach((col, index) => {
      data[col] = values[index];
    });
    
    // Asegurar sync_status si no existe
    if (!data.sync_status) {
      data.sync_status = 'pending';
    }
    
    console.log('Inserting data into', tableName, ':', data);
    
    const request = insertStore.add(data);
    
    request.onsuccess = () => {
      console.log('Insert successful, ID:', request.result);
      const result = {
        rows: {
          length: 1,
          item: () => ({ id: request.result, ...data }),
          _array: [{ id: request.result, ...data }]
        },
        rowsAffected: 1,
        insertId: request.result
      };
      resolve([result]);
    };
    
    request.onerror = (event) => {
      console.error('Error en INSERT:', event.target.error);
      reject(event.target.error);
    };
  }

  // Manejar UPDATE en IndexedDB
  async handleIndexedDBUpdate(db, tableName, sql, params, resolve, reject) {
    const updateTransaction = db.transaction([tableName], 'readwrite');
    const updateStore = updateTransaction.objectStore(tableName);

    // El último parámetro típicamente es el ID para la cláusula WHERE
    const idToUpdate = params[params.length - 1];

    const getRequest = updateStore.get(idToUpdate);

    getRequest.onerror = (event) => {
      console.error('Error fetching record for update:', event.target.error);
      reject(event.target.error);
    };

    getRequest.onsuccess = () => {
      const currentRecord = getRequest.result;
      if (!currentRecord) {
        console.warn(`Record with ID ${idToUpdate} not found in ${tableName} for update.`);
        resolve([{ rowsAffected: 0, rows: { length: 0, item: () => null, _array: [] } }]);
        return;
      }

      const updatedRecord = { ...currentRecord };

      // Parse SET clause
      const setClauseMatch = sql.match(/SET\s+([\s\S]*?)\s+WHERE/i);
      if (!setClauseMatch || !setClauseMatch[1]) {
        reject(new Error('Could not parse SET clause from UPDATE statement'));
        return;
      }
      
      const setAssignmentsString = setClauseMatch[1];
      const assignments = setAssignmentsString.split(',').map(a => a.trim());
      
      let paramIndex = 0;
      assignments.forEach(assignment => {
        const parts = assignment.split('=').map(p => p.trim());
        const columnName = parts[0];
        let valueToSet;

        if (parts[1] === '?') {
          if (paramIndex >= params.length - 1) { // -1 porque el último parámetro es para WHERE
            console.error('Mismatch in SET clause parameters for UPDATE');
            return; 
          }
          valueToSet = params[paramIndex];
          paramIndex++;
        } else {
          // Valor literal, ej: sync_status = 'pending'
          const literalValue = parts[1];
          if (literalValue.startsWith("'") && literalValue.endsWith("'")) {
            valueToSet = literalValue.substring(1, literalValue.length - 1);
          } else if (!isNaN(literalValue)) {
            valueToSet = parseFloat(literalValue);
          } else {
            valueToSet = literalValue;
          }
        }
        updatedRecord[columnName] = valueToSet;
      });

      const putRequest = updateStore.put(updatedRecord);
      
      putRequest.onerror = (event) => {
        console.error('Error putting updated record:', event.target.error);
        reject(event.target.error);
      };
      
      putRequest.onsuccess = () => {
        resolve([{ rowsAffected: 1, rows: { length: 0, item: () => null, _array: [] } }]);
      };
    };
  }

  // Manejar DELETE en IndexedDB
  async handleIndexedDBDelete(db, tableName, sql, params, resolve, reject) {
    const deleteTransaction = db.transaction([tableName], 'readwrite');
    const deleteStore = deleteTransaction.objectStore(tableName);

    if (params && params.length > 0) {
      const id = params[0];
      const request = deleteStore.delete(id);
      
      request.onsuccess = () => {
        resolve([{ rowsAffected: 1 }]);
      };
      
      request.onerror = (event) => {
        console.error('Error al eliminar en IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    } else {
      resolve([{ rowsAffected: 0 }]);
    }
  }

  // Métodos de conveniencia para operaciones comunes
  async getAllAnimales() {
    try {
      const result = await this.executeSql('SELECT * FROM Animales');
      return result[0].rows._array;
    } catch (error) {
      console.error('Error al obtener animales:', error);
      return [];
    }
  }

  async getAnimalById(id) {
    try {
      const result = await this.executeSql('SELECT * FROM Animales WHERE id_animal = ?', [id]);
      return result[0].rows._array[0] || null;
    } catch (error) {
      console.error('Error al obtener animal por ID:', error);
      return null;
    }
  }

  async insertAnimal(animalData) {
    try {
      const columns = Object.keys(animalData).join(', ');
      const placeholders = Object.keys(animalData).map(() => '?').join(', ');
      const values = Object.values(animalData);
      
      const sql = `INSERT INTO Animales (${columns}) VALUES (${placeholders})`;
      const result = await this.executeSql(sql, values);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al insertar animal:', error);
      throw error;
    }
  }

  async updateAnimal(id, animalData) {
    try {
      const setClause = Object.keys(animalData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(animalData), id];
      
      const sql = `UPDATE Animales SET ${setClause} WHERE id_animal = ?`;
      const result = await this.executeSql(sql, values);
      return result[0].rowsAffected > 0;
    } catch (error) {
      console.error('Error al actualizar animal:', error);
      throw error;
    }
  }

  async deleteAnimal(id) {
    try {
      const result = await this.executeSql('DELETE FROM Animales WHERE id_animal = ?', [id]);
      return result[0].rowsAffected > 0;
    } catch (error) {
      console.error('Error al eliminar animal:', error);
      throw error;
    }
  }

  // Métodos para sincronización
  async getPendingSync(tableName) {
    try {
      const result = await this.executeSql(`SELECT * FROM ${tableName} WHERE sync_status = 'pending'`);
      return result[0].rows._array;
    } catch (error) {
      console.error(`Error al obtener registros pendientes de ${tableName}:`, error);
      return [];
    }
  }

  async markAsSynced(tableName, id, idColumn) {
    try {
      const result = await this.executeSql(
        `UPDATE ${tableName} SET sync_status = 'synced' WHERE ${idColumn} = ?`, 
        [id]
      );
      return result[0].rowsAffected > 0;
    } catch (error) {
      console.error(`Error al marcar como sincronizado en ${tableName}:`, error);
      throw error;
    }
  }
}

// Exportar una instancia única del adaptador
export default new DatabaseAdapter();