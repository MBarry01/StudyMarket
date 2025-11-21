import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'pwa-install-banner-dismissed';

/**
 * Bannière discrète pour promouvoir l'installation PWA
 * S'affiche en bas de l'écran (au-dessus de la BottomNav) si l'app est installable
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si la bannière a été fermée précédemment
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsDismissed(dismissed);

    // Afficher la bannière seulement si :
    // - L'app est installable
    // - L'app n'est pas déjà installée
    // - La bannière n'a pas été fermée
    if (isInstallable && !isInstalled && !dismissed) {
      // Petit délai pour une animation fluide
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleInstall = async () => {
    const result = await promptInstall();
    
    if (result?.outcome === 'accepted') {
      // L'utilisateur a accepté, on peut fermer la bannière
      handleDismiss();
    }
  };

  // Ne rien afficher si l'app est installée, non installable, ou si la bannière a été fermée
  if (!isVisible || isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-16 left-0 right-0 z-40 md:bottom-0
        px-4 py-3 mx-4 mb-2 md:mb-4
        bg-card border border-border rounded-lg shadow-lg
        backdrop-blur-sm bg-opacity-95
        animate-in slide-in-from-bottom-4 duration-300
        md:max-w-md md:left-auto md:right-4
        safe-area-inset-bottom
      `}
      role="banner"
      aria-label="Installation de l'application"
    >
      <div className="flex items-center gap-3">
        {/* Icône */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Installez StudyMarket pour un accès plus rapide.
          </p>
        </div>

        {/* Bouton Installer */}
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-shrink-0 h-9 px-4 text-xs font-medium"
        >
          Installer
        </Button>

        {/* Bouton Fermer */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                     text-muted-foreground hover:text-foreground hover:bg-muted
                     transition-colors touch-manipulation active:scale-95"
          aria-label="Fermer la bannière"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

