import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook personnalisé pour gérer l'installation PWA
 * Écoute l'événement `beforeinstallprompt` et fournit une fonction pour déclencher le prompt
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      // Vérifier si on est en mode standalone (app installée)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      // Vérifier sur iOS (Safari)
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Écouter l'événement beforeinstallprompt (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher le prompt automatique
      e.preventDefault();
      
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Déclenche le prompt d'installation
   * @returns Promise qui se résout avec le résultat du choix de l'utilisateur
   */
  const promptInstall = async (): Promise<{ outcome: 'accepted' | 'dismissed' } | null> => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return null;
    }

    try {
      // Afficher le prompt
      await deferredPrompt.prompt();

      // Attendre le choix de l'utilisateur
      const choiceResult = await deferredPrompt.userChoice;

      // Réinitialiser le prompt (il ne peut être utilisé qu'une fois)
      setDeferredPrompt(null);
      setIsInstallable(false);

      return choiceResult;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return null;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}

