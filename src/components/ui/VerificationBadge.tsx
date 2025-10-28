import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Shield, Upload, Eye } from 'lucide-react';
import { VerificationStatus } from '@/types';

interface VerificationBadgeProps {
  status: VerificationStatus | 'pending' | 'verified' | 'rejected' | 'unverified' | 'documents_submitted' | 'under_review' | 'suspended' | boolean; // Support ancien format
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'md',
  showText = true,
}) => {
  // Gérer le cas boolean (ancien format)
  const verificationStatus = typeof status === 'boolean' 
    ? (status ? 'verified' : 'unverified')
    : status;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm',
    lg: 'h-6 w-6 text-base',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getBadgeContent = () => {
    switch (verificationStatus) {
      case VerificationStatus.VERIFIED:
      case 'verified':
        return {
          variant: 'success' as const,
          icon: <CheckCircle2 className={iconSize[size]} />,
          text: 'Vérifié',
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case VerificationStatus.DOCUMENTS_SUBMITTED:
        return {
          variant: 'secondary' as const,
          icon: <Upload className={iconSize[size]} />,
          text: 'En cours',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case VerificationStatus.UNDER_REVIEW:
        return {
          variant: 'secondary' as const,
          icon: <Eye className={iconSize[size]} />,
          text: 'En revue',
          className: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case VerificationStatus.REJECTED:
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className={iconSize[size]} />,
          text: 'Rejeté',
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      case VerificationStatus.SUSPENDED:
        return {
          variant: 'destructive' as const,
          icon: <Shield className={iconSize[size]} />,
          text: 'Suspendu',
          className: 'bg-orange-100 text-orange-800 border-orange-200',
        };
      case VerificationStatus.UNVERIFIED:
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className={iconSize[size]} />,
          text: 'Non vérifié',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const content = getBadgeContent();

  if (!showText) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full ${content.className} ${sizeClasses[size]} p-1 flex-shrink-0`}
        title={content.text}
      >
        {content.icon}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-md border pl-2 pr-10 py-1 text-xs font-semibold whitespace-nowrap ${content.className}`}
    >
      {content.icon}
      <span className={sizeClasses[size]}>{content.text}</span>
    </div>
  );
};

