import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { UploadService, UploadProgress } from '../../services/uploadService';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  currentPhotoURL?: string;
  displayName: string;
  onPhotoUpdate?: (url: string | undefined) => void;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoURL,
  displayName,
  onPhotoUpdate
}) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setSelectedFile(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    setIsUploading(true);

    try {
      // Upload vers Firebase Storage avec UploadService
      const downloadURL = await UploadService.uploadProfilePhoto(
        currentUser.uid,
        selectedFile,
        (progress: UploadProgress) => {
          // Gérer la progression si nécessaire
          if (progress.error) {
            toast.error(progress.error);
          }
        }
      );

      // Mettre à jour le profil Firebase Auth
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });

      // Mettre à jour le profil utilisateur dans Firestore
      await updateUserProfile({ photoURL: downloadURL });

      // Appeler le callback si fourni
      if (onPhotoUpdate) {
        onPhotoUpdate(downloadURL);
      }

      toast.success('Photo de profil mise à jour avec succès !');
      setIsOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);

    } catch (error: unknown) {
      console.error('Erreur lors de l\'upload:', error);
      
      let message = 'Erreur lors de la mise à jour de la photo';
      
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        if (error.message.includes('duplicate')) {
          message = 'Une photo avec ce nom existe déjà, réessayez';
        } else if (error.message.includes('size')) {
          message = 'Fichier trop volumineux';
        } else if (error.message.includes('type')) {
          message = 'Type de fichier non supporté';
        }
      }
      
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser) return;

    setIsUploading(true);

    try {
      // Mettre à jour le profil Firebase Auth
      await updateProfile(currentUser, {
        photoURL: undefined
      });

      // Mettre à jour le profil utilisateur dans Firestore
      await updateUserProfile({
        photoURL: undefined
      });

      // Appeler le callback si fourni
      if (onPhotoUpdate) {
        onPhotoUpdate(undefined);
      }

      toast.success('Photo de profil supprimée');
      setIsOpen(false);

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="h-20 w-20">
            <AvatarImage src={currentPhotoURL || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-semibold">
              {displayName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo de profil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aperçu actuel ou nouveau */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl || currentPhotoURL || ''} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                {displayName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Sélection de fichier */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir une photo
                </Button>

                {currentPhotoURL && (
                  <Button
                    onClick={handleRemovePhoto}
                    variant="outline"
                    disabled={isUploading}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Supprimer la photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground ">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Upload en cours...' : 'Uploader'}
                  </Button>

                  <Button
                    onClick={resetSelection}
                    variant="outline"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};