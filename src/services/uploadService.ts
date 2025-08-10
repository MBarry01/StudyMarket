import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadProgress {
  progress: number;
  isComplete: boolean;
  downloadURL?: string;
  error?: string;
}

export class UploadService {
  
  static async uploadProfilePhoto(
    userId: string, 
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    
    // Validation
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('L\'image ne peut pas dépasser 5MB');
    }
    
    // Créer une référence unique
    const timestamp = Date.now();
    const fileName = `profile_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `users/${userId}/${fileName}`);
    
    // Upload avec progression
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=3600',
        customMetadata: {
          'uploadedAt': new Date().toISOString(),
          'userId': userId
        }
      });
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            isComplete: false
          });
        },
        (error) => {
          console.error('Upload error:', error);
          let errorMessage = 'Erreur lors de l\'upload';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'Vous n\'êtes pas autorisé à upload ce fichier';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload annulé';
              break;
            case 'storage/quota-exceeded':
              errorMessage = 'Quota de stockage dépassé';
              break;
            case 'storage/invalid-format':
              errorMessage = 'Format de fichier invalide';
              break;
          }
          
          onProgress?.({
            progress: 0,
            isComplete: false,
            error: errorMessage
          });
          
          reject(new Error(errorMessage));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            onProgress?.({
              progress: 100,
              isComplete: true,
              downloadURL
            });
            
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }
  
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Ne pas throw l'erreur pour ne pas bloquer l'UI
    }
  }
  
  static async uploadListingImages(
    listingId: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `image_${index}_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `listings/${listingId}/${fileName}`);
      
      return new Promise<string>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          cacheControl: 'public,max-age=3600'
        });
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(index, {
              progress,
              isComplete: false
            });
          },
          (error) => {
            onProgress?.(index, {
              progress: 0,
              isComplete: false,
              error: error.message
            });
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(index, {
              progress: 100,
              isComplete: true,
              downloadURL
            });
            resolve(downloadURL);
          }
        );
      });
    });
    
    return Promise.all(uploadPromises);
  }
  
  // Méthode pour uploader des images avec compression
  static async uploadCompressedImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculer les nouvelles dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback si la compression échoue
            }
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}
