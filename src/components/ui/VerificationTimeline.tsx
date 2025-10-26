import React from 'react';
import { VerificationStatus } from '@/types';
import { Upload, Eye, CheckCircle2, Clock, XCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: VerificationStatus;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface VerificationTimelineProps {
  currentStatus: VerificationStatus | 'unverified';
  submittedAt?: Date;
  reviewedAt?: Date;
}

export const VerificationTimeline: React.FC<VerificationTimelineProps> = ({
  currentStatus,
  submittedAt,
  reviewedAt,
}) => {
  const steps: TimelineStep[] = [
    {
      status: VerificationStatus.UNVERIFIED,
      label: 'Non vérifié',
      icon: <Clock className="h-4 w-4" />,
      completed: false,
    },
    {
      status: VerificationStatus.DOCUMENTS_SUBMITTED,
      label: 'Documents soumis',
      icon: <Upload className="h-4 w-4" />,
      completed: currentStatus !== VerificationStatus.UNVERIFIED,
    },
    {
      status: VerificationStatus.UNDER_REVIEW,
      label: 'En revue',
      icon: <Eye className="h-4 w-4" />,
      completed: [VerificationStatus.UNDER_REVIEW, VerificationStatus.VERIFIED].includes(currentStatus as VerificationStatus),
    },
    {
      status: VerificationStatus.VERIFIED,
      label: 'Vérifié',
      icon: <CheckCircle2 className="h-4 w-4" />,
      completed: currentStatus === VerificationStatus.VERIFIED,
    },
  ];

  const getCurrentStepIndex = (): number => {
    switch (currentStatus) {
      case VerificationStatus.VERIFIED:
        return 3;
      case VerificationStatus.UNDER_REVIEW:
        return 2;
      case VerificationStatus.DOCUMENTS_SUBMITTED:
        return 1;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Progression de la vérification</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = step.completed;

            return (
              <div key={step.status} className="relative flex items-start gap-4">
                {/* Icône */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-border text-muted-foreground'
                  )}
                >
                  {step.icon}
                </div>

                {/* Contenu */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </p>
                    {isActive && currentStatus !== VerificationStatus.UNVERIFIED && (
                      <span className="text-xs text-muted-foreground">En cours...</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* États spéciaux */}
      {currentStatus === VerificationStatus.REJECTED && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-medium">Demande rejetée</p>
            <p className="text-xs mt-1">Vous pouvez soumettre une nouvelle demande</p>
          </div>
        </div>
      )}

      {currentStatus === VerificationStatus.SUSPENDED && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
          <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <div className="text-sm text-orange-800 dark:text-orange-300">
            <p className="font-medium">Compte suspendu</p>
            <p className="text-xs mt-1">Contactez le support pour plus d'informations</p>
          </div>
        </div>
      )}
    </div>
  );
};

