import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Info, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../../contexts/AuthContext';
import { useMessageStore } from '../../stores/useMessageStore';
import { PaymentRequestDialog } from '../payment/PaymentRequestDialog';
import { Listing } from '../../types';
import toast from 'react-hot-toast';

interface ContactButtonProps {
  listing: Listing;
  className?: string;
}

export const ContactButton: React.FC<ContactButtonProps> = ({ listing, className }) => {
  const { currentUser, userProfile } = useAuth();
  const { createConversation, setCurrentConversation, conversations } = useMessageStore();
  const navigate = useNavigate();
  
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't show button if user is the seller
  if (currentUser?.uid === listing.sellerId) {
    return null;
  }

  // Check if conversation already exists
  const existingConversation = conversations.find(conv => 
    conv.listingId === listing.id && 
    conv.participants.includes(currentUser?.uid || '') &&
    conv.participants.includes(listing.sellerId)
  );

  const handleContact = () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    // If conversation already exists, navigate directly to it
    if (existingConversation) {
      setCurrentConversation(existingConversation);
      navigate('/messages');
      return;
    }
    
    // Pre-fill the contact message for new conversation
    const defaultMessage = `Bonjour ${listing.sellerName},

Je suis intéressé(e) par votre annonce "${listing.title}".

Pourriez-vous me donner plus d'informations ? Je suis disponible pour un rendez-vous si nécessaire.

Cordialement,
${userProfile?.displayName || 'Un étudiant intéressé'}`;

    setContactMessage(defaultMessage);
    setContactEmail(userProfile?.email || '');
    setShowContactModal(true);
  };

  const handlePaymentRequest = () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    setShowPaymentModal(true);
  };

  const handleSendContactMessage = async () => {
    if (!contactMessage.trim() || !contactEmail.trim() || !currentUser || !userProfile) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create conversation and send initial message
      const conversationId = await createConversation(
        listing.id,
        listing.title,
        listing.price,
        listing.images?.[0],
        currentUser.uid,
        listing.sellerId,
        {
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
          university: userProfile.university,
          isVerified: userProfile.isVerified,
          email: userProfile.email,
        },
        {
          sellerName: listing.sellerName,
          sellerAvatar: listing.sellerAvatar,
          sellerUniversity: listing.sellerUniversity,
          sellerVerified: listing.sellerVerified,
          email: listing.sellerEmail || null,
        },
        contactMessage.trim()
      );

      setShowContactModal(false);
      
      // Show success message with option to continue conversation
      toast.success(
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="font-medium">Message envoyé !</div>
            <div className="text-sm text-muted-foreground">
              📧 {listing.sellerName} recevra une notification email
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              toast.dismiss();
              navigate('/messages');
            }}
            className="ml-2 text-xs"
          >
            Voir la conversation
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>,
        { 
          duration: 6000,
          style: {
            minWidth: '350px',
          }
        }
      );
      
      // Auto-redirect after a delay if user doesn't click
      setTimeout(() => {
        navigate('/messages');
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency?: string) => {
    if (listing.transactionType === 'donation') return 'Gratuit';
    if (listing.transactionType === 'exchange') return 'Échange';
    if (listing.transactionType === 'service') return `${price.toFixed(2)}€/h`;
    
    const currencyCode = currency || 'EUR';
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
      }).format(price);
    } catch (error) {
      return `${price} €`;
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button 
          onClick={handleContact}
          className={`flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 ${className}`}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {existingConversation ? 'Continuer la conversation' : 'Contacter le vendeur'}
        </Button>

        {/* Payment request button for sales only */}
        {listing.transactionType === 'sale' && listing.price > 0 && (
          <Button 
            onClick={handlePaymentRequest}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Payer
          </Button>
        )}
      </div>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contacter le vendeur
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Listing Preview */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={listing.sellerAvatar || undefined} />
                  <AvatarFallback>{listing.sellerName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{listing.sellerName}</p>
                  <p className="text-xs text-muted-foreground">{listing.sellerUniversity}</p>
                </div>
              </div>
              <p className="text-sm font-medium">{listing.title}</p>
              <p className="text-sm text-primary font-semibold">
                {formatPrice(listing.price, listing.currency)}
              </p>
            </div>

            {/* Contact Form */}
            <div>
              <Label htmlFor="contact-email">Votre email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="votre.email@universite.fr"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact-message">Votre message</Label>
              <Textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Décrivez votre intérêt pour cette annonce..."
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Enhanced Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">📧 Notification automatique</p>
                  <p>
                    Votre message sera envoyé via la messagerie StudyMarket ET {listing.sellerName} recevra une notification email pour répondre rapidement.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowContactModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendContactMessage}
                disabled={isSubmitting || !contactMessage.trim() || !contactEmail.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer + Notifier
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Request Modal */}
      <PaymentRequestDialog
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        listing={listing}
      />
    </>
  );
};