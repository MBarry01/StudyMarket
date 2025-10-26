import React from 'react';
import { VerificationStatus } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Upload, Eye, CheckCircle2, Clock } from 'lucide-react';

interface VerificationProgressProps {
  status: VerificationStatus | 'unverified';
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({ status }) => {
  const getProgress = () => {
    switch (status) {
      case VerificationStatus.UNVERIFIED:
        return 0;
      case VerificationStatus.DOCUMENTS_SUBMITTED:
        return 50;
      case VerificationStatus.UNDER_REVIEW:
        return 75;
      case VerificationStatus.VERIFIED:
        return 100;
      case VerificationStatus.REJECTED:
      case VerificationStatus.SUSPENDED:
        return 0;
      default:
        return 0;
    }
  };

  const getIcon = () => {
    switch (status) {
      case VerificationStatus.DOCUMENTS_SUBMITTED:
        return <Upload className="h-4 w-4" />;
      case VerificationStatus.UNDER_REVIEW:
        return <Eye className="h-4 w-4" />;
      case VerificationStatus.VERIFIED:
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMessage = () => {
    switch (status) {
      case VerificationStatus.UNVERIFIED:
        return 'Commencez la vérification de votre compte étudiant';
      case VerificationStatus.DOCUMENTS_SUBMITTED:
        return 'Vos documents ont été soumis avec succès';
      case VerificationStatus.UNDER_REVIEW:
        return 'Votre demande est en cours de revue par un administrateur';
      case VerificationStatus.VERIFIED:
        return 'Votre compte est certifié ✅';
      case VerificationStatus.REJECTED:
        return 'Votre demande a été rejetée. Vous pouvez réessayer.';
      case VerificationStatus.SUSPENDED:
        return 'Votre compte a été suspendu. Contactez le support.';
      default:
        return 'Statut de vérification';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{getMessage()}</span>
        <span className="font-medium">{getProgress()}%</span>
      </div>
      <Progress value={getProgress()} className="h-2" />
    </div>
  );
};

