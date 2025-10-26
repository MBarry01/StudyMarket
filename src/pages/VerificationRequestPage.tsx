import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { VerificationProgress } from '@/components/ui/VerificationProgress';
import { VerificationTimeline } from '@/components/ui/VerificationTimeline';
import { VerificationService, VerificationRequest } from '@/services/verificationService';
import { UploadService } from '@/services/uploadService';
import { NotificationService } from '@/services/notificationService';
import { VerificationStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const VerificationRequestPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [studentId, setStudentId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const fetchStatus = async () => {
      if (!currentUser) return;
      
      try {
        const status = await VerificationService.getVerificationStatus(currentUser.uid);
        setVerificationStatus(status);
      } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validation nombre max
      if (files.length + selectedFiles.length > 5) {
        toast.error('Maximum 5 fichiers autorisés');
        return;
      }
      
      // Validation types et tailles
      for (const file of selectedFiles) {
        if (!UploadService.validateFileType(file)) {
          toast.error(`Type de fichier non autorisé : ${file.name}`);
          return;
        }
        
        if (!UploadService.validateFileSize(file, 10)) {
          toast.error(`Fichier trop volumineux : ${file.name} (max 10MB)`);
          return;
        }
      }
      
      setFiles(prev => [...prev, ...selectedFiles]);
      NotificationService.notifyDocumentUpload(selectedFiles.length);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !userProfile) {
      toast.error('Vous devez être connecté pour demander la vérification');
      return;
    }

    if (files.length === 0) {
      toast.error('Veuillez téléverser au moins un document');
      return;
    }

    setLoading(true);

    try {
      // Upload des fichiers avec progress tracking
      const uploadedDocs: { type: string; url: string; filename: string; size: number; uploadedAt: Date }[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = UploadService.getVerificationDocumentPath(
          currentUser.uid,
          'document',
          file.name
        );
        
        const url = await UploadService.uploadFile(
          file,
          path,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [i]: progress.percentage }));
          }
        );
        
        uploadedDocs.push({
          type: file.type.includes('pdf') ? 'enrollment_certificate' : 'student_card',
          url,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date(),
        });
      }

      // Soumettre la demande
      await VerificationService.requestVerification(
        currentUser.uid,
        {
          email: currentUser.email || '',
          displayName: userProfile.displayName,
          university: userProfile.university || '',
          studentId: studentId || undefined,
          graduationYear: userProfile.graduationYear,
          fieldOfStudy: userProfile.fieldOfStudy,
          campus: userProfile.campus,
        },
        files
      );

      // Notifier le changement de statut
      const status = await VerificationService.getVerificationStatus(currentUser.uid);
      setVerificationStatus(status);
      
      if (status) {
        NotificationService.notifyVerificationStatusChange(status.status);
      }

      setFiles([]);
      setStudentId('');
      setUploadProgress({});
    } catch (error) {
      console.error('Erreur lors de la demande:', error);
      UploadService.notifyUploadError();
    } finally {
      setLoading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusMessage = () => {
    if (!verificationStatus) return null;

    switch (verificationStatus.status) {
      case 'pending':
        return (
          <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-300">
              Votre demande de vérification est en attente d'examen par un administrateur.
            </AlertDescription>
          </Alert>
        );
      case 'approved':
        return (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              Félicitations ! Votre compte est maintenant vérifié.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              <div className="font-semibold mb-1">Votre demande a été rejetée</div>
              {verificationStatus.rejectionReason && (
                <div className="mt-2">{verificationStatus.rejectionReason}</div>
              )}
              <div className="mt-2">Vous pouvez soumettre une nouvelle demande.</div>
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Vérification du compte étudiant</h1>
        <p className="text-muted-foreground">
          Vérifiez votre statut d'étudiant pour accéder à toutes les fonctionnalités et gagner la confiance des autres utilisateurs.
        </p>
      </div>

      {/* Statut actuel */}
      {verificationStatus && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Statut de vérification</span>
              <VerificationBadge status={verificationStatus.status} size="lg" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getStatusMessage()}
            <VerificationProgress status={verificationStatus.status} />
            <VerificationTimeline 
              currentStatus={verificationStatus.status}
              submittedAt={verificationStatus.submittedAt}
              reviewedAt={verificationStatus.reviewedAt}
            />
          </CardContent>
        </Card>
      )}

      {/* Formulaire de demande */}
      {(!verificationStatus || verificationStatus.status === 'rejected') && (
        <Card>
          <CardHeader>
            <CardTitle>Demande de vérification</CardTitle>
            <CardDescription>
              Téléversez vos documents pour prouver votre statut d'étudiant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Numéro étudiant (optionnel) */}
              <div className="space-y-2">
                <label htmlFor="studentId" className="text-sm font-medium">
                  Numéro d'étudiant (optionnel)
                </label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Ex: 123456789"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              {/* Upload de fichiers */}
              <div className="space-y-2">
                <label htmlFor="documents" className="text-sm font-medium block">
                  Documents à téléverser
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="documents" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Cliquez pour sélectionner ou glissez-déposez
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PDF, JPG, PNG (max 5 fichiers, 5MB chacun)
                      </div>
                    </div>
                  </label>
                </div>

                {/* Liste des fichiers */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Supprimer
                          </Button>
                        </div>
                        {uploadProgress[index] !== undefined && (
                          <div className="space-y-1">
                            <div className="w-full bg-background rounded-full h-1">
                              <div
                                className="bg-primary h-1 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[index]}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                              {uploadProgress[index].toFixed(0)}% uploadé
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents acceptés */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Documents acceptés :</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Carte étudiante</li>
                    <li>Certificat d'inscription</li>
                    <li>Relevé de notes officiel</li>
                    <li>Carte d'identité (en complément)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Bouton submit */}
              <Button
                type="submit"
                disabled={loading || files.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

