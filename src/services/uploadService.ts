import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export class UploadService {
  /**
   * Upload un fichier vers Firebase Storage
   */
  static async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            onProgress?.(progress);
          },
          (error) => {
            console.error('Erreur upload:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Erreur upload file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple fichiers
   */
  static async uploadMultipleFiles(
    files: File[],
    basePath: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploads = files.map(async (file, index) => {
      const path = `${basePath}/${Date.now()}_${file.name}`;
      return this.uploadFile(file, path, (progress) => onProgress?.(index, progress));
    });

    return Promise.all(uploads);
  }

  /**
   * Supprimer un fichier
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      throw error;
    }
  }

  /**
   * Valider les types de fichiers autorisés
   */
  static validateFileType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    return allowedTypes.includes(file.type);
  }

  /**
   * Valider la taille maximale (10MB par défaut)
   */
  static validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Générer un chemin unique pour un document de vérification
   */
  static getVerificationDocumentPath(
    userId: string,
    docType: string,
    filename: string
  ): string {
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `verifications/${userId}/${docType}_${timestamp}_${safeFilename}`;
  }
}
