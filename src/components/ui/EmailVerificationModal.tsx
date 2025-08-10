import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MailCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailVerificationModalProps {
  open: boolean;
  onResend: () => void;
  onCancel?: () => void;
  onCheck?: () => void;
  onClose?: () => void;
  loading: boolean;
  email?: string;
  verified?: boolean;
  error?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  onResend,
  onCancel,
  onCheck,
  onClose,
  loading,
  email,
  verified = false,
  error,
}) => {
  const handleCancel = onCancel || onClose;
  
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md text-center" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            {verified ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <MailCheck className="w-5 h-5 text-primary" />
            )}
            {verified ? 'Email vérifié !' : 'Vérifie ton email'}
          </DialogTitle>
        </DialogHeader>
        
        {verified ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-green-600 text-sm mb-4">
              Ton email a été vérifié avec succès ! Tu peux maintenant utiliser ton compte.
            </p>
            <DialogFooter className="flex justify-center">
              <Button onClick={onClose} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                Continuer
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MailCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm mb-4">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>. 
              Clique dessus pour activer ton compte.
            </p>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground space-y-2 mb-4">
              <p><strong>Important :</strong></p>
              <p>• Cliquez sur le lien dans l'email pour activer votre compte</p>
              <p>• Vérifiez votre boîte de réception et vos spams</p>
              <p>• Le lien expire dans 24h</p>
            </div>

            <DialogFooter className="flex justify-center gap-4">
              {handleCancel && (
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  Annuler
                </Button>
              )}
              <Button
                onClick={async () => {
                  if (loading || cooldownSeconds > 0) return;
                  await onResend();
                  setCooldownSeconds(60);
                }}
                disabled={loading || cooldownSeconds > 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {cooldownSeconds > 0 ? `Renvoyer l'email (${cooldownSeconds}s)` : `Renvoyer l'email`}
              </Button>
              {onCheck && (
                <Button variant="outline" onClick={onCheck} disabled={loading}>
                  Vérifier
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
