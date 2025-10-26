import supabase from '../config/supabase';
import DatabaseService from './DatabaseService';
import StorageService from './StorageService';
import LocalPhotoService from './LocalPhotoService';
import { Platform } from 'react-native';

/**
 * SupabaseService - Handles synchronization between local SQLite and Supabase
 */
class SupabaseService {

  /**
   * Sync all pending animals to Supabase
   */
  static async syncAnimales() {
    try {
      console.log('SupabaseService: Starting animals sync...');

      // Get all pending animals from local SQLite
      const pendingAnimals = await DatabaseService.getAllAsync(
        'SELECT * FROM Animales WHERE sync_status = ?',
        ['pending']
      );

      if (pendingAnimals.length === 0) {
        console.log('SupabaseService: No pending animals to sync');
        return { synced: 0, failed: 0 };
      }

      console.log(`SupabaseService: Found ${pendingAnimals.length} pending animals`);

      let synced = 0;
      let failed = 0;

      for (const animal of pendingAnimals) {
        try {
          let photoUrl = animal.photo;

          // If photo is local (not yet uploaded), upload it now
          if (Platform.OS !== 'web' && photoUrl && LocalPhotoService.isLocalPhoto(photoUrl)) {
            try {
              console.log(`SupabaseService: Uploading photo for animal ${animal.id_interno}...`);
              const uploadedUrl = await StorageService.uploadPhoto(photoUrl, animal.id_animal);
              photoUrl = uploadedUrl;

              // Update local database with new URL
              await DatabaseService.runAsync(
                'UPDATE Animales SET photo = ? WHERE id_animal = ?',
                [uploadedUrl, animal.id_animal]
              );

              console.log(`SupabaseService: Photo uploaded successfully for ${animal.id_interno}`);
            } catch (uploadError) {
              console.error(`SupabaseService: Failed to upload photo for ${animal.id_interno}:`, uploadError);
              // Continue without photo rather than failing entire sync
              photoUrl = null;
            }
          }

          // Prepare data for Supabase (convert TEXT dates to proper dates)
          const supabaseData = {
            nombre: animal.nombre,
            id_siniiga: animal.id_siniiga,
            id_interno: animal.id_interno,
            raza: animal.raza,
            fecha_nacimiento: animal.fecha_nacimiento,
            sexo: animal.sexo,
            estado_fisiologico: animal.estado_fisiologico,
            estatus: animal.estatus,
            photo: photoUrl,
            location: animal.location,
            local_id: animal.id_animal.toString(),
          };

          let data, error;
          if (animal.supabase_id) {
            // Update existing animal in Supabase using supabase_id
            console.log(`SupabaseService: Updating existing animal ${animal.id_interno} (Supabase ID: ${animal.supabase_id})`);
            const result = await supabase
              .from('animales')
              .update(supabaseData)
              .eq('id_animal', animal.supabase_id)
              .select();
            data = result.data;
            error = result.error;
          } else {
            // Insert new animal in Supabase
            console.log(`SupabaseService: Inserting new animal ${animal.id_interno}`);
            const result = await supabase
              .from('animales')
              .insert(supabaseData)
              .select();
            data = result.data;
            error = result.error;

            // Update local database with the new supabase_id
            if (data && data.length > 0) {
              await DatabaseService.runAsync(
                'UPDATE Animales SET supabase_id = ? WHERE id_animal = ?',
                [data[0].id_animal, animal.id_animal]
              );
            }
          }

          if (error) throw error;

          // Mark as synced in local database
          await DatabaseService.runAsync(
            'UPDATE Animales SET sync_status = ? WHERE id_animal = ?',
            ['synced', animal.id_animal]
          );

          synced++;
          console.log(`SupabaseService: Synced animal ${animal.id_interno}`);
        } catch (error) {
          console.error(`SupabaseService: Failed to sync animal ${animal.id_interno}:`, error);
          failed++;
        }
      }

      console.log(`SupabaseService: Animals sync complete. Synced: ${synced}, Failed: ${failed}`);
      return { synced, failed };
    } catch (error) {
      console.error('SupabaseService: Error in syncAnimales:', error);
      throw error;
    }
  }

  /**
   * Sync all pending servicios to Supabase
   */
  static async syncServicios() {
    try {
      console.log('SupabaseService: Starting servicios sync...');

      const pendingServicios = await DatabaseService.getAllAsync(
        'SELECT * FROM Servicios WHERE sync_status = ?',
        ['pending']
      );

      if (pendingServicios.length === 0) {
        console.log('SupabaseService: No pending servicios to sync');
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const servicio of pendingServicios) {
        try {
          // Get the animal's Supabase ID by id_interno
          const animal = await DatabaseService.getFirstAsync(
            'SELECT id_interno FROM Animales WHERE id_animal = ?',
            [servicio.id_animal]
          );

          if (!animal) {
            console.error(`SupabaseService: Animal not found for servicio ${servicio.id_servicio}`);
            failed++;
            continue;
          }

          // Get animal's Supabase ID
          const { data: animalData } = await supabase
            .from('animales')
            .select('id_animal')
            .eq('id_interno', animal.id_interno)
            .single();

          if (!animalData) {
            console.error(`SupabaseService: Animal ${animal.id_interno} not found in Supabase`);
            failed++;
            continue;
          }

          const supabaseData = {
            id_animal: animalData.id_animal,
            fecha_servicio: servicio.fecha_servicio,
            tipo_servicio: servicio.tipo_servicio,
            toro: servicio.toro,
            notas: servicio.notas,
          };

          const { error } = await supabase
            .from('servicios')
            .insert(supabaseData);

          if (error) throw error;

          await DatabaseService.runAsync(
            'UPDATE Servicios SET sync_status = ? WHERE id_servicio = ?',
            ['synced', servicio.id_servicio]
          );

          synced++;
        } catch (error) {
          console.error(`SupabaseService: Failed to sync servicio ${servicio.id_servicio}:`, error);
          failed++;
        }
      }

      console.log(`SupabaseService: Servicios sync complete. Synced: ${synced}, Failed: ${failed}`);
      return { synced, failed };
    } catch (error) {
      console.error('SupabaseService: Error in syncServicios:', error);
      throw error;
    }
  }

  /**
   * Sync all pending diagnosticos
   */
  static async syncDiagnosticos() {
    return await this._syncTable('Diagnosticos', 'diagnosticos', 'id_diagnostico');
  }

  /**
   * Sync all pending partos
   */
  static async syncPartos() {
    return await this._syncTable('Partos', 'partos', 'id_parto');
  }

  /**
   * Sync all pending ordenas
   */
  static async syncOrdenas() {
    return await this._syncTable('Ordenas', 'ordenas', 'id_ordena');
  }

  /**
   * Sync all pending tratamientos
   */
  static async syncTratamientos() {
    return await this._syncTable('Tratamientos', 'tratamientos', 'id_tratamiento');
  }

  /**
   * Sync all pending secados
   */
  static async syncSecados() {
    return await this._syncTable('Secados', 'secados', 'id_secado');
  }

  /**
   * Generic sync function for related tables
   */
  static async _syncTable(localTableName, supabaseTableName, idColumnName) {
    try {
      console.log(`SupabaseService: Starting ${supabaseTableName} sync...`);

      const pendingRecords = await DatabaseService.getAllAsync(
        `SELECT * FROM ${localTableName} WHERE sync_status = ?`,
        ['pending']
      );

      if (pendingRecords.length === 0) {
        console.log(`SupabaseService: No pending ${supabaseTableName} to sync`);
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const record of pendingRecords) {
        try {
          // Get the animal's id_interno from local database
          const animal = await DatabaseService.getFirstAsync(
            'SELECT id_interno FROM Animales WHERE id_animal = ?',
            [record.id_animal]
          );

          if (!animal) {
            console.error(`SupabaseService: Animal not found for ${supabaseTableName} record`);
            failed++;
            continue;
          }

          // Get animal's Supabase ID
          const { data: animalData } = await supabase
            .from('animales')
            .select('id_animal')
            .eq('id_interno', animal.id_interno)
            .single();

          if (!animalData) {
            console.error(`SupabaseService: Animal ${animal.id_interno} not found in Supabase`);
            failed++;
            continue;
          }

          // Prepare data (remove local id and sync_status, update id_animal)
          const { [idColumnName]: _, sync_status, id_animal, ...supabaseData } = record;
          supabaseData.id_animal = animalData.id_animal;

          const { error } = await supabase
            .from(supabaseTableName)
            .insert(supabaseData);

          if (error) throw error;

          await DatabaseService.runAsync(
            `UPDATE ${localTableName} SET sync_status = ? WHERE ${idColumnName} = ?`,
            ['synced', record[idColumnName]]
          );

          synced++;
        } catch (error) {
          console.error(`SupabaseService: Failed to sync ${supabaseTableName} record:`, error);
          failed++;
        }
      }

      console.log(`SupabaseService: ${supabaseTableName} sync complete. Synced: ${synced}, Failed: ${failed}`);
      return { synced, failed };
    } catch (error) {
      console.error(`SupabaseService: Error in sync${localTableName}:`, error);
      throw error;
    }
  }

  /**
   * Sync all pending data across all tables
   */
  static async syncAll() {
    try {
      console.log('SupabaseService: Starting full sync...');

      const results = {
        animales: await this.syncAnimales(),
        servicios: await this.syncServicios(),
        diagnosticos: await this.syncDiagnosticos(),
        partos: await this.syncPartos(),
        ordenas: await this.syncOrdenas(),
        tratamientos: await this.syncTratamientos(),
        secados: await this.syncSecados(),
      };

      const totalSynced = Object.values(results).reduce((sum, r) => sum + r.synced, 0);
      const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

      console.log(`SupabaseService: Full sync complete. Total synced: ${totalSynced}, Total failed: ${totalFailed}`);

      return {
        success: totalFailed === 0,
        totalSynced,
        totalFailed,
        details: results,
      };
    } catch (error) {
      console.error('SupabaseService: Error in syncAll:', error);
      throw error;
    }
  }

  /**
   * Get count of pending records across all tables
   */
  static async getPendingCount() {
    try {
      const tables = ['Animales', 'Servicios', 'Diagnosticos', 'Partos', 'Ordenas', 'Tratamientos', 'Secados'];
      let total = 0;

      for (const table of tables) {
        const result = await DatabaseService.getFirstAsync(
          `SELECT COUNT(*) as count FROM ${table} WHERE sync_status = ?`,
          ['pending']
        );
        total += result?.count || 0;
      }

      return total;
    } catch (error) {
      console.error('SupabaseService: Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Test connection to Supabase
   */
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('animales')
        .select('count')
        .limit(1);

      if (error) throw error;

      console.log('SupabaseService: Connection test successful');
      return true;
    } catch (error) {
      console.error('SupabaseService: Connection test failed:', error);
      return false;
    }
  }

  /**
   * Download all animals from Supabase to local SQLite
   */
  static async downloadAnimales() {
    try {
      console.log('SupabaseService: Starting animals download from Supabase...');

      // Fetch all animals from Supabase
      const { data: supabaseAnimals, error } = await supabase
        .from('animales')
        .select('*')
        .order('id_interno', { ascending: true });

      if (error) throw error;

      if (!supabaseAnimals || supabaseAnimals.length === 0) {
        console.log('SupabaseService: No animals found in Supabase');
        return { downloaded: 0, failed: 0 };
      }

      console.log(`SupabaseService: Found ${supabaseAnimals.length} animals in Supabase`);

      let downloaded = 0;
      let failed = 0;

      for (const animal of supabaseAnimals) {
        try {
          // Check if animal already exists locally by id_interno
          const existingAnimal = await DatabaseService.getFirstAsync(
            'SELECT id_animal FROM Animales WHERE id_interno = ?',
            [animal.id_interno]
          );

          if (existingAnimal) {
            // Update existing animal
            await DatabaseService.runAsync(
              `UPDATE Animales SET
                nombre = ?,
                id_siniiga = ?,
                raza = ?,
                fecha_nacimiento = ?,
                sexo = ?,
                estado_fisiologico = ?,
                estatus = ?,
                photo = ?,
                location = ?,
                sync_status = ?,
                supabase_id = ?
              WHERE id_interno = ?`,
              [
                animal.nombre,
                animal.id_siniiga,
                animal.raza,
                animal.fecha_nacimiento,
                animal.sexo,
                animal.estado_fisiologico,
                animal.estatus,
                animal.photo,
                animal.location,
                'synced',
                animal.id_animal,
                animal.id_interno
              ]
            );
            console.log(`SupabaseService: Updated animal ${animal.id_interno}`);
          } else {
            // Insert new animal
            await DatabaseService.runAsync(
              `INSERT INTO Animales (
                nombre, id_siniiga, id_interno, raza, fecha_nacimiento,
                sexo, estado_fisiologico, estatus, photo, location, sync_status, supabase_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                animal.nombre,
                animal.id_siniiga,
                animal.id_interno,
                animal.raza,
                animal.fecha_nacimiento,
                animal.sexo,
                animal.estado_fisiologico,
                animal.estatus,
                animal.photo,
                animal.location,
                'synced',
                animal.id_animal
              ]
            );
            console.log(`SupabaseService: Downloaded animal ${animal.id_interno}`);
          }

          downloaded++;
        } catch (error) {
          console.error(`SupabaseService: Failed to download animal ${animal.id_interno}:`, error);
          failed++;
        }
      }

      console.log(`SupabaseService: Animals download complete. Downloaded: ${downloaded}, Failed: ${failed}`);
      return { downloaded, failed };
    } catch (error) {
      console.error('SupabaseService: Error in downloadAnimales:', error);
      throw error;
    }
  }

  /**
   * Download all servicios from Supabase to local SQLite
   */
  static async downloadServicios() {
    try {
      console.log('SupabaseService: Starting servicios download from Supabase...');

      const { data: supabaseServicios, error } = await supabase
        .from('servicios')
        .select('*');

      if (error) throw error;

      if (!supabaseServicios || supabaseServicios.length === 0) {
        console.log('SupabaseService: No servicios found in Supabase');
        return { downloaded: 0, failed: 0 };
      }

      let downloaded = 0;
      let failed = 0;

      for (const servicio of supabaseServicios) {
        try {
          // Get local animal ID by matching with Supabase animal's id_interno
          const { data: supabaseAnimal } = await supabase
            .from('animales')
            .select('id_interno')
            .eq('id_animal', servicio.id_animal)
            .single();

          if (!supabaseAnimal) {
            console.error(`SupabaseService: Animal not found in Supabase for servicio`);
            failed++;
            continue;
          }

          const localAnimal = await DatabaseService.getFirstAsync(
            'SELECT id_animal FROM Animales WHERE id_interno = ?',
            [supabaseAnimal.id_interno]
          );

          if (!localAnimal) {
            console.error(`SupabaseService: Local animal ${supabaseAnimal.id_interno} not found`);
            failed++;
            continue;
          }

          // Check if servicio already exists (by matching animal and date)
          const existingServicio = await DatabaseService.getFirstAsync(
            'SELECT id_servicio FROM Servicios WHERE id_animal = ? AND fecha_servicio = ? AND tipo_servicio = ?',
            [localAnimal.id_animal, servicio.fecha_servicio, servicio.tipo_servicio]
          );

          if (!existingServicio) {
            await DatabaseService.runAsync(
              `INSERT INTO Servicios (
                id_animal, fecha_servicio, tipo_servicio, toro, notas, sync_status
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                localAnimal.id_animal,
                servicio.fecha_servicio,
                servicio.tipo_servicio,
                servicio.toro,
                servicio.notas,
                'synced'
              ]
            );
            downloaded++;
          }
        } catch (error) {
          console.error('SupabaseService: Failed to download servicio:', error);
          failed++;
        }
      }

      console.log(`SupabaseService: Servicios download complete. Downloaded: ${downloaded}, Failed: ${failed}`);
      return { downloaded, failed };
    } catch (error) {
      console.error('SupabaseService: Error in downloadServicios:', error);
      throw error;
    }
  }

  /**
   * Generic download function for related tables
   */
  static async _downloadTable(supabaseTableName, localTableName, idColumnName) {
    try {
      console.log(`SupabaseService: Starting ${supabaseTableName} download from Supabase...`);

      const { data: supabaseRecords, error } = await supabase
        .from(supabaseTableName)
        .select('*');

      if (error) throw error;

      if (!supabaseRecords || supabaseRecords.length === 0) {
        console.log(`SupabaseService: No ${supabaseTableName} found in Supabase`);
        return { downloaded: 0, failed: 0 };
      }

      let downloaded = 0;
      let failed = 0;

      for (const record of supabaseRecords) {
        try {
          // Get local animal ID
          const { data: supabaseAnimal } = await supabase
            .from('animales')
            .select('id_interno')
            .eq('id_animal', record.id_animal)
            .single();

          if (!supabaseAnimal) {
            failed++;
            continue;
          }

          const localAnimal = await DatabaseService.getFirstAsync(
            'SELECT id_animal FROM Animales WHERE id_interno = ?',
            [supabaseAnimal.id_interno]
          );

          if (!localAnimal) {
            failed++;
            continue;
          }

          // Prepare data for insertion
          const { id_animal, ...recordData } = record;
          const columns = Object.keys(recordData).filter(key => !key.startsWith(idColumnName.replace('id_', '')));
          columns.push('id_animal', 'sync_status');

          const values = columns.map(col => {
            if (col === 'id_animal') return localAnimal.id_animal;
            if (col === 'sync_status') return 'synced';
            return recordData[col];
          });

          const placeholders = columns.map(() => '?').join(', ');
          const columnNames = columns.join(', ');

          await DatabaseService.runAsync(
            `INSERT OR IGNORE INTO ${localTableName} (${columnNames}) VALUES (${placeholders})`,
            values
          );
          downloaded++;
        } catch (error) {
          console.error(`SupabaseService: Failed to download ${supabaseTableName} record:`, error);
          failed++;
        }
      }

      console.log(`SupabaseService: ${supabaseTableName} download complete. Downloaded: ${downloaded}, Failed: ${failed}`);
      return { downloaded, failed };
    } catch (error) {
      console.error(`SupabaseService: Error in download${localTableName}:`, error);
      throw error;
    }
  }

  /**
   * Download diagnosticos from Supabase
   */
  static async downloadDiagnosticos() {
    return await this._downloadTable('diagnosticos', 'Diagnosticos', 'id_diagnostico');
  }

  /**
   * Download partos from Supabase
   */
  static async downloadPartos() {
    return await this._downloadTable('partos', 'Partos', 'id_parto');
  }

  /**
   * Download ordenas from Supabase
   */
  static async downloadOrdenas() {
    return await this._downloadTable('ordenas', 'Ordenas', 'id_ordena');
  }

  /**
   * Download tratamientos from Supabase
   */
  static async downloadTratamientos() {
    return await this._downloadTable('tratamientos', 'Tratamientos', 'id_tratamiento');
  }

  /**
   * Download secados from Supabase
   */
  static async downloadSecados() {
    return await this._downloadTable('secados', 'Secados', 'id_secado');
  }

  /**
   * Download all data from Supabase to local SQLite
   */
  static async downloadAll() {
    try {
      console.log('SupabaseService: Starting full download from Supabase...');

      const results = {
        animales: await this.downloadAnimales(),
        servicios: await this.downloadServicios(),
        diagnosticos: await this.downloadDiagnosticos(),
        partos: await this.downloadPartos(),
        ordenas: await this.downloadOrdenas(),
        tratamientos: await this.downloadTratamientos(),
        secados: await this.downloadSecados(),
      };

      const totalDownloaded = Object.values(results).reduce((sum, r) => sum + r.downloaded, 0);
      const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

      console.log(`SupabaseService: Full download complete. Total downloaded: ${totalDownloaded}, Total failed: ${totalFailed}`);

      return {
        success: totalFailed === 0,
        totalDownloaded,
        totalFailed,
        details: results,
      };
    } catch (error) {
      console.error('SupabaseService: Error in downloadAll:', error);
      throw error;
    }
  }

  /**
   * Delete an animal from Supabase
   */
  static async deleteAnimal(id_animal) {
    try {
      console.log(`SupabaseService: Deleting animal ${id_animal} from Supabase...`);
      const { error } = await supabase
        .from('animales')
        .delete()
        .eq('id_animal', id_animal);

      if (error) {
        console.error(`SupabaseService: Error deleting animal ${id_animal}:`, error);
        throw error;
      }

      console.log(`SupabaseService: Animal ${id_animal} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`SupabaseService: Error deleting animal ${id_animal}:`, error);
      throw error;
    }
  }
}

export default SupabaseService;
