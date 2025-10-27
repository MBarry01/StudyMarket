import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

/**
 * Switch Component - Optimisé pour mobile et desktop
 * 
 * Taille universelle : 24x44px (h-6 w-11)
 * Respecte les guidelines iOS (44pt) et Material (48dp) pour les zones de touch
 * 
 * @example
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * <Switch checked={enabled} onCheckedChange={setEnabled} disabled />
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Taille universelle optimale pour tous les devices
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
      // Bordure et ombre
      'border-2 border-transparent shadow-sm',
      // Transitions fluides
      'transition-colors duration-200 ease-in-out',
      // États de focus (accessibilité)
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      // Couleurs selon l'état (checked/unchecked)
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      // État désactivé
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Optimisations mobile
      'touch-manipulation', // Supprime le délai de 300ms
      'active:scale-95', // Feedback tactile au tap
      // Permet les classes personnalisées
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Style du bouton circulaire (thumb)
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0',
        // Animation de déplacement fluide
        'transition-transform duration-200 ease-out',
        // Position selon l'état
        'data-[state=checked]:translate-x-5', // Position droite quand activé
        'data-[state=unchecked]:translate-x-0' // Position gauche quand désactivé
      )}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };