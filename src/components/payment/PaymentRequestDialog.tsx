import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  MapPin, 
  CreditCard, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { usePaymentStore, PaymentMethod } from '../../stores/usePaymentStore';
import { Listing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface PaymentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing;
}

export const PaymentRequestDialog: React.FC<PaymentRequestDialogProps> = ({
  open,
  onOpenChange,
  listing
}) => {
  const { currentUser, userProfile } = useAuth();
  const { createPaymentRequest, loading } = usePaymentStore();
  
  const [step, setStep] = useState<'method' | 'details' | 'confirmation'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod['type'] | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [meetingDetails, setMeetingDetails] = useState({
    location: '',
    date: undefined as Date | undefined,
    time: '',
    notes: ''
  });

  const handleMethodSelect = (method: PaymentMethod['type'], details: any) => {
    setSelectedMethod(method);
    setPaymentDetails(details);
    setStep('details');
  };

  const handleCreateRequest = async () => {
    if (!currentUser || !selectedMethod) return;

    try {
      const meetingDateTime = meetingDetails.date && meetingDetails.time 
        ? new Date(`${format(meetingDetails.date, 'yyyy-MM-dd')} ${meetingDetails.time}`)
        : undefined;

      await createPaymentRequest({
        listingId: listing.id,
        buyerId: currentUser.uid,
        sellerId: listing.sellerId,
        amount: listing.price,
        currency: listing.currency || 'EUR',
        paymentMethod: selectedMethod,
        meetingLocation: meetingDetails.location,
        meetingDateTime,
        paymentDetails,
        notes: meetingDetails.notes
      });

      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
    }
  };

  const resetForm = () => {
    setStep('method');
    setSelectedMethod(null);
    setPaymentDetails({});
    setMeetingDetails({
      location: '',
      date: undefined,
      time: '',
      notes: ''
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  const getMethodName = (method: PaymentMethod['type']) => {
    const methods = {
      cash: 'Espèces',
      transfer: 'Virement bancaire',
      paypal: 'PayPal',
      lydia: 'Lydia'
    };
    return methods[method] || method;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Demande de paiement
          </DialogTitle>
          <DialogDescription>
            Créez une demande de paiement sécurisée pour "{listing.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'method' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'method' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Mode de paiement</span>
            </div>
            <div className="w-8 h-px bg-muted-foreground" />
            <div className={`flex items-center ${step === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'details' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Détails</span>
            </div>
            <div className="w-8 h-px bg-muted-foreground" />
            <div className={`flex items-center ${step === 'confirmation' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'confirmation' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirmation</span>
            </div>
          </div>

          {/* Listing summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              {listing.images?.[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Vendeur : {listing.sellerName} • {listing.sellerUniversity}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatAmount(listing.price, listing.currency || 'EUR')}
                </p>
              </div>
            </div>
          </div>

          {/* Step content */}
          {step === 'method' && (
            <PaymentMethodSelector
              amount={listing.price}
              currency={listing.currency || 'EUR'}
              onMethodSelect={handleMethodSelect}
              selectedMethod={selectedMethod}
            />
          )}

          {step === 'details' && selectedMethod && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Mode de paiement sélectionné : {getMethodName(selectedMethod)}</span>
              </div>

              {/* Meeting details for cash payments */}
              {selectedMethod === 'cash' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Détails de la rencontre
                  </h3>
                  
                  <div>
                    <Label htmlFor="meeting-location">Lieu de rencontre *</Label>
                    <Input
                      id="meeting-location"
                      placeholder="Ex: Bibliothèque universitaire, Hall principal..."
                      value={meetingDetails.location}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, location: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date de rencontre</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {meetingDetails.date ? (
                              format(meetingDetails.date, 'PPP', { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={meetingDetails.date}
                            onSelect={(date) => setMeetingDetails(prev => ({ ...prev, date }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="meeting-time">Heure de rencontre</Label>
                      <Input
                        id="meeting-time"
                        type="time"
                        value={meetingDetails.time}
                        onChange={(e) => setMeetingDetails(prev => ({ ...prev, time: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional notes */}
              <div>
                <Label htmlFor="payment-notes">Notes additionnelles (optionnel)</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Informations complémentaires pour le vendeur..."
                  value={meetingDetails.notes}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Security notice */}
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Sécurité :</strong> Un code de sécurité unique sera généré pour cette transaction. 
                  Partagez-le uniquement avec le vendeur lors de la finalisation du paiement.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1">
                  Retour
                </Button>
                <Button 
                  onClick={() => setStep('confirmation')} 
                  className="flex-1"
                  disabled={selectedMethod === 'cash' && !meetingDetails.location}
                >
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {step === 'confirmation' && selectedMethod && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Récapitulatif de la demande</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mode de paiement :</span>
                    <p className="font-medium">{getMethodName(selectedMethod)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant :</span>
                    <p className="font-medium">{formatAmount(listing.price, listing.currency || 'EUR')}</p>
                  </div>
                  
                  {selectedMethod === 'cash' && meetingDetails.location && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Lieu de rencontre :</span>
                        <p className="font-medium">{meetingDetails.location}</p>
                      </div>
                      {meetingDetails.date && meetingDetails.time && (
                        <div>
                          <span className="text-muted-foreground">Date et heure :</span>
                          <p className="font-medium">
                            {format(meetingDetails.date, 'PPP', { locale: fr })} à {meetingDetails.time}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {meetingDetails.notes && (
                  <div>
                    <span className="text-muted-foreground text-sm">Notes :</span>
                    <p className="text-sm bg-muted/50 p-2 rounded">{meetingDetails.notes}</p>
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  En créant cette demande, vous vous engagez à effectuer le paiement selon les modalités convenues. 
                  Le vendeur recevra une notification et pourra accepter ou refuser votre demande.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                  Retour
                </Button>
                <Button 
                  onClick={handleCreateRequest} 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Créer la demande
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};