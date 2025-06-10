import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MailCheck, Loader2 } from "lucide-react";

interface EmailVerificationModalProps {
  open: boolean;
  onResend: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  onResend,
  onCancel,
  loading,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            <MailCheck className="w-5 h-5 text-primary" />
            Vérifie ton email
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm mb-4">
          Un lien de confirmation a été envoyé à ton adresse. Clique dessus pour activer ton compte.
        </p>

        <DialogFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={onResend} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Renvoyer l’email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
