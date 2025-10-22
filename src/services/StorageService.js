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
      console.log('Local URI:', localUri);
      console.log('Animal ID:', animalId);

      if (!localUri) {
        throw new Error('No se proporcionó una URI de imagen');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileExt = localUri.split('.').pop() || 'jpg';
      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      const filePath = animalId ? `animals/${animalId}/${fileName}` : `temp/${fileName}`;

      console.log('File path:', filePath);
      console.log('File extension:', fileExt);

      // Convert local URI to blob for upload
      console.log('Converting URI to blob...');
      const blob = await this.uriToBlob(localUri);
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

      // Check file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (blob.size > MAX_SIZE) {
        throw new Error(`Imagen muy grande (${(blob.size / 1024 / 1024).toFixed(2)}MB). Máximo: 5MB`);
      }

      // Upload to Supabase Storage
      console.log('Uploading to Supabase Storage...');
      console.log('Bucket:', this.BUCKET_NAME);
      console.log('Path:', filePath);
      console.log('Content-Type:', this.getMimeType(fileExt));

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: this.getMimeType(fileExt),
          upsert: false,
        });

      if (error) {
        console.error('=== Supabase Storage Error ===');
        console.error('Error object:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error status:', error.statusCode);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      console.log('Upload successful, data:', data);

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
      console.error('Error stack:', error.stack);
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

      if (Platform.OS === 'web') {
        // Web: Handle blob URLs from image picker
        console.log('Platform: web');

        // Fetch the blob URL
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('Original blob:', blob.size, 'bytes,', blob.type);

        // If blob is too large, compress it
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (blob.size > MAX_SIZE) {
          console.log('Blob too large, compressing...');
          return await this.compressBlob(blob);
        }

        return blob;
      } else {
        // Native: read file and convert to blob
        console.log('Platform: native');
        const response = await fetch(uri);
        const blob = await response.blob();
        console.log('Blob created:', blob.size, 'bytes,', blob.type);
        return blob;
      }
    } catch (error) {
      console.error('Error in uriToBlob:', error);
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

      // Create a small test blob (1x1 pixel PNG)
      const testBlob = new Blob(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82])],
        { type: 'image/png' }
      );

      const testPath = `test/test_${Date.now()}.png`;
      console.log('Test path:', testPath);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(testPath, testBlob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.error('Test upload failed:', error);
        return false;
      }

      console.log('Test upload successful:', data);

      // Clean up test file
      await supabase.storage.from(this.BUCKET_NAME).remove([testPath]);

      return true;
    } catch (error) {
      console.error('Test upload error:', error);
      return false;
    }
  }
}

export default StorageService;
