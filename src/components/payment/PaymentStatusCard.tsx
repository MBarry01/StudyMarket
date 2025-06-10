import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  Shield,
  Info
} from 'lucide-react';
import { PaymentRequest, usePaymentStore } from '../../stores/usePaymentStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface PaymentStatusCardProps {
  request: PaymentRequest;
  userRole: 'buyer' | 'seller';
  onStatusUpdate?: (status: PaymentRequest['status']) => void;
}

export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  request,
  userRole,
  onStatusUpdate
}) => {
  const { updatePaymentStatus, getPaymentInstructions } = usePaymentStore();

  const getStatusIcon = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'disputed': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'disputed': return 'Litige';
      default: return status;
    }
  };

  const getMethodName = (method: PaymentRequest['paymentMethod']) => {
    const methods = {
      cash: 'Espèces',
      transfer: 'Virement bancaire',
      paypal: 'PayPal',
      lydia: 'Lydia'
    };
    return methods[method] || method;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papiers`);
  };

  const handleStatusUpdate = async (newStatus: PaymentRequest['status']) => {
    try {
      await updatePaymentStatus(request.id, newStatus);
      onStatusUpdate?.(newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const StatusIcon = getStatusIcon(request.status);
  const instructions = getPaymentInstructions(request.paymentMethod, request);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Paiement {getMethodName(request.paymentMethod)}
              </CardTitle>
              <CardDescription>
                {formatAmount(request.amount, request.currency)} • {userRole === 'buyer' ? 'Achat' : 'Vente'}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(request.status)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {getStatusLabel(request.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Créé le :</span>
            <p className="font-medium">
              {format(request.createdAt, 'PPP à HH:mm', { locale: fr })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Dernière mise à jour :</span>
            <p className="font-medium">
              {format(request.updatedAt, 'PPP à HH:mm', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Meeting details for cash payments */}
        {request.paymentMethod === 'cash' && request.meetingLocation && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Détails de la rencontre
            </h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div>
                <span className="text-muted-foreground text-sm">Lieu :</span>
                <p className="font-medium">{request.meetingLocation}</p>
              </div>
              {request.meetingDateTime && (
                <div>
                  <span className="text-muted-foreground text-sm">Date et heure :</span>
                  <p className="font-medium">
                    {format(request.meetingDateTime, 'PPP à HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security code */}
        {request.securityCode && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Code de sécurité
            </h4>
            <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
              <code className="font-mono text-lg font-bold">{request.securityCode}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(request.securityCode!, 'Code de sécurité')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Partagez ce code uniquement avec votre interlocuteur lors de la finalisation du paiement.
            </p>
          </div>
        )}

        {/* Payment instructions */}
        {request.status === 'confirmed' && instructions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Instructions de paiement</h4>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <ul className="space-y-1 text-sm">
                {instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Notes */}
        {request.notes && (
          <div className="space-y-2">
            <h4 className="font-medium">Notes</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{request.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {userRole === 'seller' && request.status === 'pending' && (
            <>
              <Button
                onClick={() => handleStatusUpdate('confirmed')}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accepter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('cancelled')}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Refuser
              </Button>
            </>
          )}

          {userRole === 'buyer' && request.status === 'confirmed' && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer comme payé
            </Button>
          )}

          {userRole === 'seller' && request.status === 'confirmed' && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer la réception
            </Button>
          )}

          {(request.status === 'pending' || request.status === 'confirmed') && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('disputed')}
              className="text-orange-600 hover:text-orange-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signaler un problème
            </Button>
          )}
        </div>

        {/* Status-specific alerts */}
        {request.status === 'pending' && userRole === 'buyer' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Votre demande de paiement a été envoyée au vendeur. Vous recevrez une notification dès qu'il l'aura acceptée.
            </AlertDescription>
          </Alert>
        )}

        {request.status === 'confirmed' && userRole === 'buyer' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Le vendeur a accepté votre demande ! Suivez les instructions ci-dessus pour effectuer le paiement.
            </AlertDescription>
          </Alert>
        )}

        {request.status === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Transaction terminée avec succès ! Merci d'avoir utilisé StudyMarket.
            </AlertDescription>
          </Alert>
        )}

        {request.status === 'disputed' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Un litige a été signalé. Notre équipe support va examiner la situation et vous contacter sous 24h.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};