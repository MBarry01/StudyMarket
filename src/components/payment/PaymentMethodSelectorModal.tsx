import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type PaymentMethodType = 'stripe' | 'paypal' | 'lydia' | 'cash';

interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  comingSoon?: boolean;
}

interface PaymentMethodSelectorModalProps {
  onSelect: (method: PaymentMethodType) => void;
  onCancel: () => void;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Carte Bancaire',
    description: 'Paiement sécurisé par carte (Visa, Mastercard, etc.)',
    icon: CreditCard,
    enabled: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Payez avec votre compte PayPal',
    icon: CreditCard,
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'lydia',
    name: 'Lydia',
    description: 'Paiement instantané entre étudiants',
    icon: Smartphone,
    enabled: false,
    comingSoon: true,
  },
  {
    id: 'cash',
    name: 'Espèces',
    description: 'Paiement en main propre lors du rendez-vous',
    icon: Banknote,
    enabled: false,
    comingSoon: true,
  },
];

export const PaymentMethodSelectorModal: React.FC<PaymentMethodSelectorModalProps> = ({
  onSelect,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);

  const handleMethodSelect = (methodId: PaymentMethodType) => {
    if (!paymentMethods.find(m => m.id === methodId)?.enabled) return;
    setSelectedMethod(methodId);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choisissez votre mode de paiement</h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez la méthode qui vous convient le mieux
        </p>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isDisabled = !method.enabled;

          return (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              disabled={isDisabled}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all text-left',
                'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary',
                isSelected && 'border-primary bg-primary/5',
                !isSelected && !isDisabled && 'border-border hover:bg-accent',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'p-3 rounded-full',
                  isSelected ? 'bg-primary text-white' : 'bg-muted'
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{method.name}</h4>
                    {method.comingSoon && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Bientôt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {method.description}
                  </p>
                </div>

                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedMethod}
          className="flex-1"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};






