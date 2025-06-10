import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  currentPhotoURL?: string;
  displayName: string;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoURL,
  displayName
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
      // Créer une référence unique pour l'image
      const fileName = `profile-photos/${currentUser.uid}-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);

      // Upload du fichier
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Mettre à jour le profil Firebase Auth
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });

      // Mettre à jour le profil utilisateur dans Firestore
      await updateUserProfile({
        photoURL: downloadURL
      });

      toast.success('Photo de profil mise à jour !');
      setIsOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de la mise à jour de la photo');
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
        photoURL: null
      });

      // Mettre à jour le profil utilisateur dans Firestore
      await updateUserProfile({
        photoURL: null
      });

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
            <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-secondary text-white">
              {displayName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
            <Camera className="w-3 h-3 text-white" />
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
                <div className="text-sm text-muted-foreground text-center">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={resetSelection}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className="flex-1"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Confirmer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Conseils */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Formats acceptés : JPG, PNG, GIF</p>
            <p>• Taille maximale : 5MB</p>
            <p>• Recommandé : image carrée, minimum 200x200px</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};