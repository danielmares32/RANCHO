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

          // Insert or update in Supabase
          const { data, error } = await supabase
            .from('animales')
            .upsert(supabaseData, {
              onConflict: 'id_interno',
              ignoreDuplicates: false
            })
            .select();

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
}

export default SupabaseService;
