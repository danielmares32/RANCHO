import { supabase } from '../config/supabase';
import { Platform } from 'react-native';

/**
 * StorageService - Manages photo uploads to Supabase Storage
 *
 * Storage bucket: 'animal-photos'
 * File naming: {timestamp}_{randomId}.jpg
 */
class StorageService {
  static BUCKET_NAME = 'animal-photos';

  /**
   * Upload a photo to Supabase Storage
   * @param {string} localUri - Local file URI from ImagePicker
   * @param {string} animalId - Optional animal ID for organizing files
   * @returns {Promise<Object>} - Object with url and timestamp
   */
  static async uploadPhoto(localUri, animalId = null) {
    try {
      console.log('=== Starting photo upload ===');
      console.log('Platform:', Platform.OS);
      console.log('Local URI:', localUri);
      console.log('Animal ID:', animalId);

      if (!localUri) {
        throw new Error('No se proporcionó una URI de imagen');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);

      // Extract file extension properly (handle data URIs)
      let fileExt = 'jpg';
      if (localUri.startsWith('data:')) {
        // Data URI format: data:image/png;base64,xxx
        const match = localUri.match(/data:image\/(\w+);/);
        fileExt = match ? match[1] : 'jpg';
      } else if (localUri.startsWith('blob:')) {
        // Blob URL - default to jpg
        fileExt = 'jpg';
      } else {
        // Regular file path
        const ext = localUri.split('.').pop();
        fileExt = ext && ext.length < 5 ? ext : 'jpg';
      }

      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      const filePath = animalId ? `animals/${animalId}/${fileName}` : `temp/${fileName}`;

      console.log('File path:', filePath);
      console.log('File extension:', fileExt);

      // Convert local URI to blob for upload
      console.log('Converting URI to blob...');
      const blob = await this.uriToBlob(localUri);
      console.log('Blob created successfully');
      console.log('- Size:', blob.size, 'bytes (', (blob.size / 1024).toFixed(2), 'KB )');
      console.log('- Type:', blob.type);

      // Check file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (blob.size > MAX_SIZE) {
        throw new Error(`Imagen muy grande (${(blob.size / 1024 / 1024).toFixed(2)}MB). Máximo: 5MB`);
      }

      // Ensure blob has correct MIME type
      const mimeType = this.getMimeType(fileExt);
      const correctBlob = blob.type ? blob : new Blob([blob], { type: mimeType });

      console.log('=== Uploading to Supabase Storage ===');
      console.log('Bucket:', this.BUCKET_NAME);
      console.log('Path:', filePath);
      console.log('Content-Type:', mimeType);
      console.log('Final blob type:', correctBlob.type);
      console.log('Final blob size:', correctBlob.size);

      // Get the storage URL for debugging
      const storageUrl = supabase.storage.from(this.BUCKET_NAME).getPublicUrl('test').data.publicUrl;
      const storageBaseUrl = storageUrl.split('/object/public/')[0];
      console.log('Storage base URL:', storageBaseUrl);

      // Convert blob to ArrayBuffer for Android compatibility
      // React Native Android has issues with Blob uploads to Supabase
      let uploadData = correctBlob;
      if (Platform.OS === 'android') {
        console.log('Converting blob to ArrayBuffer for Android using FileReader...');
        uploadData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('ArrayBuffer created, size:', reader.result.byteLength);
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(correctBlob);
        });
      }

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, uploadData, {
          contentType: mimeType,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('=== Supabase Storage Error ===');
        console.error('Error object:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error statusCode:', error.statusCode);
        console.error('Error name:', error.name);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      console.log('Upload successful!');
      console.log('Upload data:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen');
      }

      console.log('=== Photo uploaded successfully ===');
      console.log('Public URL:', publicUrlData.publicUrl);

      // Return photo object with URL and timestamp
      return {
        url: publicUrlData.publicUrl,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('=== Error in uploadPhoto ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Delete a photo from Supabase Storage
   * @param {string} photoUrl - Public URL of the photo to delete
   * @returns {Promise<boolean>}
   */
  static async deletePhoto(photoUrl) {
    try {
      if (!photoUrl || !photoUrl.includes(this.BUCKET_NAME)) {
        return false; // Not a Supabase Storage URL
      }

      // Extract file path from URL
      const urlParts = photoUrl.split(`${this.BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        throw new Error('URL de imagen inválida');
      }
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting from Supabase Storage:', error);
        throw new Error(`Error al eliminar imagen: ${error.message}`);
      }

      console.log('Photo deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('Error in deletePhoto:', error);
      return false;
    }
  }

  /**
   * Update animal's photo (delete old, upload new)
   * @param {string} oldPhotoUrl - URL of old photo to delete
   * @param {string} newLocalUri - Local URI of new photo
   * @param {string} animalId - Animal ID
   * @returns {Promise<string>} - Public URL of new photo
   */
  static async updatePhoto(oldPhotoUrl, newLocalUri, animalId) {
    try {
      // Delete old photo if exists
      if (oldPhotoUrl) {
        await this.deletePhoto(oldPhotoUrl);
      }

      // Upload new photo
      return await this.uploadPhoto(newLocalUri, animalId);
    } catch (error) {
      console.error('Error in updatePhoto:', error);
      throw error;
    }
  }

  /**
   * Convert local URI to Blob for upload
   * @param {string} uri - Local file URI
   * @returns {Promise<Blob>}
   */
  static async uriToBlob(uri) {
    try {
      console.log('uriToBlob: Starting conversion for URI:', uri);

      // Validate URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('URI inválida o vacía');
      }

      if (Platform.OS === 'web') {
        // Web: Handle blob URLs from image picker
        console.log('Platform: web');
        console.log('URI type:', uri.startsWith('blob:') ? 'blob URL' : uri.startsWith('data:') ? 'data URL' : 'other');

        // Check if it's a blob URL that might have been revoked
        if (uri.startsWith('blob:')) {
          console.log('Detected blob URL, attempting to fetch...');
        }

        // Fetch the blob URL with timeout
        let response;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          response = await fetch(uri, { signal: controller.signal });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          console.error('Fetch error details:', fetchError);
          if (fetchError.name === 'AbortError') {
            throw new Error('Tiempo de espera agotado al cargar la imagen. Verifica tu conexión a internet.');
          }
          throw new Error(`No se pudo cargar la imagen. Verifica tu conexión a internet. Detalle: ${fetchError.message}`);
        }

        if (!response.ok) {
          throw new Error(`Error al obtener imagen: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('Original blob:', blob.size, 'bytes,', blob.type);

        // Validate blob
        if (!blob || blob.size === 0) {
          throw new Error('La imagen está vacía o no se pudo cargar');
        }

        // If blob is too large, compress it
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (blob.size > MAX_SIZE) {
          console.log('Blob too large, compressing...');
          return await this.compressBlob(blob);
        }

        return blob;
      } else {
        // Native (Android/iOS): read file and convert to blob
        console.log('Platform: native (Android/iOS)');
        console.log('URI:', uri);

        try {
          // Fetch works with both file:// URIs and content:// URIs on native
          const response = await fetch(uri);

          if (!response.ok) {
            console.error('Fetch response not OK:', response.status, response.statusText);
            throw new Error(`Error al leer archivo: ${response.status}`);
          }

          const blob = await response.blob();
          console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

          // Validate blob
          if (!blob || blob.size === 0) {
            throw new Error('El archivo está vacío o no se pudo leer');
          }

          // Ensure blob has a MIME type
          if (!blob.type || blob.type === '') {
            // Guess MIME type from URI
            const ext = uri.split('.').pop()?.toLowerCase();
            const mimeType = this.getMimeType(ext || 'jpg');
            console.log('Blob missing MIME type, setting to:', mimeType);
            return new Blob([blob], { type: mimeType });
          }

          return blob;
        } catch (fetchError) {
          console.error('Error fetching file on native:', fetchError);
          throw new Error(`No se pudo leer el archivo: ${fetchError.message}`);
        }
      }
    } catch (error) {
      console.error('Error in uriToBlob:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(`Error convirtiendo imagen: ${error.message}`);
    }
  }

  /**
   * Compress blob if too large (web only)
   * @param {Blob} blob - Original blob
   * @returns {Promise<Blob>}
   */
  static async compressBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > height && width > maxDimension) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              console.log('Compressed:', compressedBlob.size, 'bytes');
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Get MIME type from file extension
   * @param {string} extension - File extension
   * @returns {string}
   */
  static getMimeType(extension) {
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Check if storage bucket exists and is accessible
   * @returns {Promise<boolean>}
   */
  static async checkBucketExists() {
    try {
      console.log('Checking if bucket exists:', this.BUCKET_NAME);
      const { data, error } = await supabase.storage.getBucket(this.BUCKET_NAME);

      if (error) {
        console.error('Storage bucket error:', error);
        return false;
      }

      console.log('Bucket exists:', !!data);
      console.log('Bucket data:', data);
      return !!data;
    } catch (error) {
      console.error('Error checking bucket:', error);
      return false;
    }
  }

  /**
   * Test upload with a small dummy file
   * @returns {Promise<boolean>}
   */
  static async testUpload() {
    try {
      console.log('=== Testing Storage Upload ===');
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Bucket name:', this.BUCKET_NAME);

      // First check if bucket exists
      console.log('Checking bucket accessibility...');
      const bucketCheck = await this.checkBucketExists();
      console.log('Bucket exists:', bucketCheck);

      // Create a small test blob (1x1 pixel red PNG)
      const testBlob = new Blob(
        [new Uint8Array([
          137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
          0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222,
          0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0,
          3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68,
          174, 66, 96, 130
        ])],
        { type: 'image/png' }
      );

      const testPath = `test/test_${Date.now()}.png`;
      console.log('Test path:', testPath);
      console.log('Test blob size:', testBlob.size, 'bytes');

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(testPath, testBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.error('Test upload failed:');
        console.error('Error message:', error.message);
        console.error('Error status:', error.statusCode);
        console.error('Full error:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('Test upload successful:', data);

      // Try to get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(testPath);

      console.log('Public URL:', publicUrlData?.publicUrl);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([testPath]);

      if (deleteError) {
        console.warn('Failed to delete test file:', deleteError);
      } else {
        console.log('Test file cleaned up successfully');
      }

      return true;
    } catch (error) {
      console.error('Test upload error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      return false;
    }
  }
}

export default StorageService;
