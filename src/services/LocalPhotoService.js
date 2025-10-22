import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * LocalPhotoService - Manages local photo storage for offline support
 *
 * Photos are stored in the app's document directory on mobile devices
 * and tracked in SQLite for later upload to Supabase
 */
class LocalPhotoService {
  // Directory where photos are stored locally
  static PHOTOS_DIR = `${FileSystem.documentDirectory}animal_photos/`;

  /**
   * Initialize the photos directory
   * @returns {Promise<void>}
   */
  static async initializePhotoDirectory() {
    if (Platform.OS === 'web') {
      return; // Not needed on web
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(this.PHOTOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.PHOTOS_DIR, { intermediates: true });
        console.log('Photo directory created:', this.PHOTOS_DIR);
      }
    } catch (error) {
      console.error('Error creating photo directory:', error);
      throw error;
    }
  }

  /**
   * Save a photo locally (copy from temp location to app directory)
   * @param {string} sourceUri - Original URI from ImagePicker
   * @param {string} animalId - Optional animal ID
   * @returns {Promise<string>} - Local file URI
   */
  static async savePhotoLocally(sourceUri, animalId = null) {
    if (Platform.OS === 'web') {
      // On web, just return the original URI (blob URL)
      return sourceUri;
    }

    try {
      await this.initializePhotoDirectory();

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileExt = sourceUri.split('.').pop() || 'jpg';
      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      const destUri = `${this.PHOTOS_DIR}${fileName}`;

      // Copy file to permanent location
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destUri,
      });

      console.log('Photo saved locally:', destUri);
      return destUri;
    } catch (error) {
      console.error('Error saving photo locally:', error);
      throw new Error(`No se pudo guardar la foto localmente: ${error.message}`);
    }
  }

  /**
   * Delete a local photo
   * @param {string} localUri - Local file URI to delete
   * @returns {Promise<boolean>}
   */
  static async deleteLocalPhoto(localUri) {
    if (Platform.OS === 'web' || !localUri) {
      return false;
    }

    try {
      // Only delete if it's in our app's photo directory
      if (!localUri.startsWith(this.PHOTOS_DIR)) {
        console.log('Not a local photo, skipping deletion:', localUri);
        return false;
      }

      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localUri);
        console.log('Local photo deleted:', localUri);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting local photo:', error);
      return false;
    }
  }

  /**
   * Check if a URI is a local photo (not yet uploaded)
   * @param {string} uri
   * @returns {boolean}
   */
  static isLocalPhoto(uri) {
    if (!uri || Platform.OS === 'web') {
      return false;
    }
    return uri.startsWith('file://') || uri.startsWith(this.PHOTOS_DIR);
  }

  /**
   * Check if a URI is a Supabase URL (already uploaded)
   * @param {string} uri
   * @returns {boolean}
   */
  static isSupabasePhoto(uri) {
    if (!uri) return false;
    return uri.includes('supabase.co/storage');
  }

  /**
   * Get file size of local photo
   * @param {string} localUri
   * @returns {Promise<number>} - Size in bytes
   */
  static async getPhotoSize(localUri) {
    if (Platform.OS === 'web' || !localUri) {
      return 0;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('Error getting photo size:', error);
      return 0;
    }
  }

  /**
   * Get all local photos in the directory
   * @returns {Promise<Array>} - Array of file URIs
   */
  static async getAllLocalPhotos() {
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      await this.initializePhotoDirectory();
      const files = await FileSystem.readDirectoryAsync(this.PHOTOS_DIR);
      return files.map(file => `${this.PHOTOS_DIR}${file}`);
    } catch (error) {
      console.error('Error reading photo directory:', error);
      return [];
    }
  }

  /**
   * Clean up orphaned photos (photos not referenced in database)
   * @param {Array<string>} referencedUris - Array of URIs that should be kept
   * @returns {Promise<number>} - Number of files deleted
   */
  static async cleanupOrphanedPhotos(referencedUris = []) {
    if (Platform.OS === 'web') {
      return 0;
    }

    try {
      const allPhotos = await this.getAllLocalPhotos();
      let deletedCount = 0;

      for (const photoUri of allPhotos) {
        if (!referencedUris.includes(photoUri)) {
          const deleted = await this.deleteLocalPhoto(photoUri);
          if (deleted) deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} orphaned photos`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up photos:', error);
      return 0;
    }
  }
}

export default LocalPhotoService;
