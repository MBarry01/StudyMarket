import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building2,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { usePaymentStore, PaymentMethod } from '../../stores/usePaymentStore';
import { StripePaymentProvider } from './StripePaymentProvider';

interface PaymentMethodSelectorProps {
  amount: number;
  currency: string;
  onMethodSelect: (method: PaymentMethod['type'] | 'card', details: any) => void;
  selectedMethod?: PaymentMethod['type'] | 'card';
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  currency,
  onMethodSelect,
  selectedMethod
}) => {
  const { paymentMethods, calculateFees } = usePaymentStore();
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stripePaymentId, setStripePaymentId] = useState<string | null>(null);

  // Add card payment method
  const allPaymentMethods = [
    {
      id: 'card',
      type: 'card' as const,
      name: 'Carte bancaire',
      icon: CreditCard,
      description: 'Paiement sécurisé par carte',
      fees: 1.5,
      processingTime: 'Immédiat',
      securityLevel: 'high' as const,
      available: true
    },
    ...paymentMethods
  ];

  const getMethodIcon = (type: PaymentMethod['type'] | 'card') => {
    switch (type) {
      case 'card': return CreditCard;
      case 'cash': return Banknote;
      case 'transfer': return Building2;
      case 'paypal': return CreditCard;
      case 'lydia': return Smartphone;
      default: return CreditCard;
    }
  };

  const getSecurityColor = (level: PaymentMethod['securityLevel']) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const validateDetails = (method: PaymentMethod['type'] | 'card', details: any) => {
    const newErrors: Record<string, string> = {};

    switch (method) {
      case 'card':
        // Stripe handles card validation
        return true;
        
      case 'transfer':
        if (!details.bankDetails?.iban) {
          newErrors.iban = 'IBAN requis';
        } else if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/.test(details.bankDetails.iban.replace(/\s/g, ''))) {
          newErrors.iban = 'Format IBAN invalide';
        }
        if (!details.bankDetails?.accountName) {
          newErrors.accountName = 'Nom du titulaire requis';
        }
        break;

      case 'paypal':
        if (!details.paypalEmail) {
          newErrors.paypalEmail = 'Email PayPal requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.paypalEmail)) {
          newErrors.paypalEmail = 'Format email invalide';
        }
        break;

      case 'lydia':
        if (!details.lydiaPhone) {
          newErrors.lydiaPhone = 'Numéro de téléphone requis';
        } else if (!/^(\+33|0)[1-9](\d{8})$/.test(details.lydiaPhone.replace(/\s/g, ''))) {
          newErrors.lydiaPhone = 'Format de téléphone invalide';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMethodSelect = (method: PaymentMethod['type'] | 'card') => {
    if (method === 'card') {
      onMethodSelect(method, {});
      return;
    }
    
    const details = paymentDetails[method] || {};
    
    if (method === 'cash' || validateDetails(method, details)) {
      onMethodSelect(method, details);
    }
  };

  const updatePaymentDetails = (method: PaymentMethod['type'], field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value
      }
    }));
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  const handleStripePaymentSuccess = (paymentId: string) => {
    setStripePaymentId(paymentId);
    onMethodSelect('card', { stripePaymentId: paymentId });
  };

  const handleStripePaymentError = (error: string) => {
    console.error('Stripe payment error:', error);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Choisissez votre mode de paiement</h3>
        <p className="text-muted-foreground">
          Montant à payer : <span className="font-semibold text-primary">{formatAmount(amount, currency)}</span>
        </p>
      </div>

      {selectedMethod === 'card' ? (
        <StripePaymentProvider 
          amount={amount}
          currency={currency}
          onPaymentSuccess={handleStripePaymentSuccess}
          onPaymentError={handleStripePaymentError}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPaymentMethods.map((method) => {
            const Icon = getMethodIcon(method.type);
            const fees = method.type === 'card' ? (amount * method.fees) / 100 : calculateFees(amount, method.type as PaymentMethod['type']);
            const totalAmount = amount + fees;
            const isSelected = selectedMethod === method.type;

            return (
              <Card 
                key={method.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => method.available && handleMethodSelect(method.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {method.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Method details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{method.processingTime}</span>
                    </div>
                    <Badge className={getSecurityColor(method.securityLevel)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {method.securityLevel === 'high' ? 'Très sécurisé' : 
                       method.securityLevel === 'medium' ? 'Sécurisé' : 'Basique'}
                    </Badge>
                  </div>

                  {/* Fees */}
                  {fees > 0 && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Montant :</span>
                        <span>{formatAmount(amount, currency)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Frais ({method.fees}%) :</span>
                        <span>{formatAmount(fees, currency)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total :</span>
                        <span>{formatAmount(totalAmount, currency)}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment details form */}
                  {isSelected && method.type !== 'cash' && method.type !== 'card' && (
                    <div className="space-y-3 pt-3 border-t">
                      {method.type === 'transfer' && (
                        <>
                          <div>
                            <Label htmlFor={`iban-${method.id}`}>IBAN *</Label>
                            <Input
                              id={`iban-${method.id}`}
                              placeholder="FR76 1234 5678 9012 3456 7890 123"
                              value={paymentDetails[method.type]?.bankDetails?.iban || ''}
                              onChange={(e) => updatePaymentDetails(method.type, 'bankDetails', {
                                ...paymentDetails[method.type]?.bankDetails,
                                iban: e.target.value
                              })}
                              className={errors.iban ? 'border-red-500' : ''}
                            />
                            {errors.iban && (
                              <p className="text-sm text-red-500 mt-1">{errors.iban}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`account-name-${method.id}`}>Nom du titulaire *</Label>
                            <Input
                              id={`account-name-${method.id}`}
                              placeholder="Jean Dupont"
                              value={paymentDetails[method.type]?.bankDetails?.accountName || ''}
                              onChange={(e) => updatePaymentDetails(method.type, 'bankDetails', {
                                ...paymentDetails[method.type]?.bankDetails,
                                accountName: e.target.value
                              })}
                              className={errors.accountName ? 'border-red-500' : ''}
                            />
                            {errors.accountName && (
                              <p className="text-sm text-red-500 mt-1">{errors.accountName}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`bic-${method.id}`}>BIC (optionnel)</Label>
                            <Input
                              id={`bic-${method.id}`}
                              placeholder="BNPAFRPP"
                              value={paymentDetails[method.type]?.bankDetails?.bic || ''}
                              onChange={(e) => updatePaymentDetails(method.type, 'bankDetails', {
                                ...paymentDetails[method.type]?.bankDetails,
                                bic: e.target.value
                              })}
                            />
                          </div>
                        </>
                      )}

                      {method.type === 'paypal' && (
                        <div>
                          <Label htmlFor={`paypal-email-${method.id}`}>Email PayPal *</Label>
                          <Input
                            id={`paypal-email-${method.id}`}
                            type="email"
                            placeholder="votre.email@example.com"
                            value={paymentDetails[method.type]?.paypalEmail || ''}
                            onChange={(e) => updatePaymentDetails(method.type, 'paypalEmail', e.target.value)}
                            className={errors.paypalEmail ? 'border-red-500' : ''}
                          />
                          {errors.paypalEmail && (
                            <p className="text-sm text-red-500 mt-1">{errors.paypalEmail}</p>
                          )}
                        </div>
                      )}

                      {method.type === 'lydia' && (
                        <div>
                          <Label htmlFor={`lydia-phone-${method.id}`}>Numéro de téléphone *</Label>
                          <Input
                            id={`lydia-phone-${method.id}`}
                            type="tel"
                            placeholder="06 12 34 56 78"
                            value={paymentDetails[method.type]?.lydiaPhone || ''}
                            onChange={(e) => updatePaymentDetails(method.type, 'lydiaPhone', e.target.value)}
                            className={errors.lydiaPhone ? 'border-red-500' : ''}
                          />
                          {errors.lydiaPhone && (
                            <p className="text-sm text-red-500 mt-1">{errors.lydiaPhone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Method-specific alerts */}
                  {isSelected && method.type !== 'card' && (
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {method.type === 'cash' && (
                          "Rencontrez-vous dans un lieu public et vérifiez l'objet avant de payer."
                        )}
                        {method.type === 'transfer' && (
                          "Le virement sera effectué après confirmation de la transaction. Délai : 1-2 jours ouvrés."
                        )}
                        {method.type === 'paypal' && (
                          "Utilisez l'option 'Biens et services' pour bénéficier de la protection PayPal."
                        )}
                        {method.type === 'lydia' && (
                          "Le paiement Lydia est instantané. Vérifiez le numéro avant d'envoyer."
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Security notice */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Conseils de sécurité :</strong> Ne communiquez jamais vos informations bancaires par message. 
          Utilisez uniquement les canaux sécurisés de StudyMarket pour les transactions.
        </AlertDescription>
      </Alert>
    </div>
  );
};