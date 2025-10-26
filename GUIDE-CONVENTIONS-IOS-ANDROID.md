# Guide des conventions iOS/Android - StudyMarket

## 🎯 Objectif

Appliquer les conventions de design iOS Human Interface Guidelines et Android Material Design 3 à tous les composants de l'application StudyMarket.

## ✅ Déjà implémenté

### 1. Composants UI de base
- ✅ `Button` (`src/components/ui/button.tsx`)
  - Touch targets 44x44px minimum
  - Classes `touch-manipulation` et `active:scale-[0.98]`
  - Hauteur adaptée (h-11 pour default, h-12 pour lg)

### 2. Boutons interactifs
- ✅ `FavoriteButton` (`src/components/ui/FavoriteButton.tsx`)
- ✅ `ShareButton` (`src/components/ui/ShareButton.tsx`)
- ✅ Icônes de taille adaptée (w-5 h-5 standard, w-6 h-6 pour large)

### 3. Header mobile
- ✅ `HeaderMobile` (`src/components/layout/HeaderMobile.tsx`)
- ✅ `SearchModal` (`src/components/ui/SearchModal.tsx`)

### 4. Styles globaux
- ✅ `src/index.css` - Toutes les conventions iOS/Android

## 📋 Checklist d'application

### Étape 1 : Vérifier les touch targets

**Avant :**
```tsx
<button className="px-4 py-2">Cliquer</button>
```

**Après :**
```tsx
<Button className="px-5 py-2.5">Cliquer</Button>
// ou
<button className="px-5 py-2.5 min-h-[44px] touch-manipulation">Cliquer</button>
```

**Règle :** Tous les boutons doivent avoir un minimum de 44x44px (iOS) ou 48x48dp (Android).

### Étape 2 : Ajouter touch-manipulation aux boutons

**Avant :**
```tsx
<button onClick={handleClick}>
```

**Après :**
```tsx
<button onClick={handleClick} className="touch-manipulation">
// ou utiliser le composant Button qui l'a déjà
```

### Étape 3 : Ajuster les tailles d'icônes

**Tailles recommandées :**
- Petite (sm) : `w-4 h-4` (16px)
- Standard : `w-5 h-5` (20px) 
- Large (lg) : `w-6 h-6` (24px)
- Très large : `w-7 h-7` (28px)

**Avant :**
```tsx
<Search className="w-4 h-4" />
```

**Après :**
```tsx
<Search className="w-5 h-5" /> // Pour meilleure visibilité
```

### Étape 4 : Ajouter des animations tactiles

**Avant :**
```tsx
<div onClick={handleClick}>
```

**Après :**
```tsx
<div 
  onClick={handleClick}
  className="touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
>
```

### Étape 5 : Améliorer les cartes

**Avant :**
```tsx
<Card className="hover:shadow-lg">
```

**Après :**
```tsx
<Card className="card-touchable hover:shadow-lg">
// Inclut : cursor-pointer, user-select-none, -webkit-tap-highlight-color
```

## 🔄 Composants à modifier

### Composants UI
- [ ] `ContactButton` (`src/components/messaging/ContactButton.tsx`)
- [ ] `PaymentMethodSelector` (`src/components/payment/PaymentMethodSelector.tsx`)
- [ ] `PaymentStatusCard` (`src/components/payment/PaymentStatusCard.tsx`)
- [ ] `ProfilePhotoUpload` (`src/components/profile/ProfilePhotoUpload.tsx`)
- [ ] `VerificationBadge` (`src/components/ui/VerificationBadge.tsx`)
- [ ] `VerificationProgress` (`src/components/ui/VerificationProgress.tsx`)

### Pages principales
- [ ] `HomePage` (`src/pages/HomePage.tsx`)
- [ ] `ListingsPage` (`src/pages/ListingsPage.tsx`)
- [ ] `ListingDetailPage` (`src/pages/ListingDetailPage.tsx`)
- [ ] `CreateListingPage` (`src/pages/CreateListingPage.tsx`)
- [ ] `ProfilePage` (`src/pages/ProfilePage.tsx`)
- [ ] `SettingsPage` (`src/pages/SettingsPage.tsx`)
- [ ] `FavoritesPage` (`src/pages/FavoritesPage.tsx`)
- [ ] `MessagesPage` (`src/pages/MessagesPage.tsx`)

### Pages admin
- [ ] `AdminDashboardPage` (`src/pages/AdminDashboardPage.tsx`)
- [ ] `AdminVerificationsPage` (`src/pages/AdminVerificationsPage.tsx`)
- [ ] `AdminUsersPage` (`src/pages/AdminUsersPage.tsx`)
- [ ] `AdminListingsPage` (`src/pages/AdminListingsPage.tsx`)

### Checkout
- [ ] `CheckoutPage` (`src/components/checkout/CheckoutPage.tsx`)
- [ ] `CartPage` (`src/components/checkout/CartPage.tsx`)
- [ ] `OrdersPage` (`src/components/checkout/OrdersPage.tsx`)
- [ ] `ProductCard` (`src/components/checkout/ProductCard.tsx`)

### Listing
- [ ] `ListingCard` (`src/components/listing/ListingCard.tsx`)

## 🛠️ Script de migration rapide

### Pour un bouton simple
```tsx
// Rechercher dans votre composant
<button

// Remplacer par
<Button

// ou ajouter les classes
<button className="touch-manipulation min-h-[44px]"
```

### Pour les icônes
```tsx
// Rechercher
<Icon className="w-4 h-4"

// Remplacer par
<Icon className="w-5 h-5"  // Standard
<Icon className="w-6 h-6"  // Large
```

### Pour les cartes cliquables
```tsx
// Rechercher
className="hover:shadow-lg"

// Ajouter
className="card-touchable hover:shadow-lg"
```

## 📐 Règles de taille

### Boutons
- **iOS** : 44x44px minimum
- **Android** : 48x48dp minimum
- **Notre standard** : 44x44px (h-11, w-11)

### Icônes dans boutons
- Dans un bouton 44x44px : 24px (w-6 h-6)
- Dans un bouton 48x48px : 28px (w-7 h-7)
- Standalone : 20px (w-5 h-5)

### Espacement
- Entre éléments tactiles : minimum 8px (gap-2)
- Padding interne : minimum 12px (px-3, py-3)
- Marges verticales : minimum 8px (my-2)

## 🎨 Classes utilitaires disponibles

### Touch manipulation
```tsx
className="touch-manipulation"
```
Améliore la réactivité tactile et supprime le flash iOS.

### Animation tactile
```tsx
className="active:scale-[0.98]"
```
Effet de pressage sur mobile.

### Cartes tactiles
```tsx
className="card-touchable"
```
Comprend : cursor-pointer, user-select-none, -webkit-tap-highlight-color.

### Listes tactiles
```tsx
className="list-item-touchable"
```
Pour les éléments de liste cliquables.

### Overscroll iOS
```tsx
className="overscroll-contain"
```
Évite les rebonds indésirables sur iOS.

### Transitions mobiles
```tsx
className="transition-mobile"
```
Optimisé pour les performances mobiles.

## 🔍 Comment vérifier

### 1. Check responsive
Ouvrir DevTools > Toggle device toolbar > Sélectionner iPhone/Android

### 2. Test tactile
- Vérifier que tous les boutons sont facilement cliquables
- Tester les animations au touch
- Vérifier la réactivité

### 3. Check accessibilité
- Taille des touch targets ≥ 44x44px
- Contrastes suffisants
- Labels ARIA présents

### 4. Performance
- Pas de lag sur les animations
- Scroll fluide
- Pas de flash blanc

## 📝 Exemples complets

### Bouton avec icône
```tsx
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

<Button size="icon" className="touch-manipulation">
  <Plus className="w-6 h-6" />
</Button>
```

### Carte cliquable
```tsx
<Card 
  className="card-touchable hover:shadow-lg"
  onClick={handleClick}
>
  {/* Contenu */}
</Card>
```

### Liste d'éléments
```tsx
<div className="list-item-touchable" onClick={handleClick}>
  {/* Contenu */}
</div>
```

### Input avec toucher
```tsx
<input 
  type="text"
  className="px-4 py-3 min-h-[44px] touch-manipulation"
/>
```

## 🚀 Priorités

### P0 - Critique (à faire immédiatement)
1. Tous les boutons d'action primaire
2. Boutons de navigation
3. FAB (Floating Action Buttons)

### P1 - Important (à faire rapidement)
1. Cartes de listings
2. Boutons dans les listes
3. Formulaires

### P2 - Nice to have
1. Badges et labels
2. Icons standalone
3. Éléments décoratifs

## 📚 Ressources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design 3](https://m3.material.io/)
- [Touch Target Size - WCAG](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## ✅ Checklist finale

Avant de considérer comme terminé, vérifier :
- [ ] Tous les boutons ont une taille ≥ 44x44px
- [ ] Classes `touch-manipulation` ajoutées
- [ ] Animations `active:scale-[0.98]` sur les boutons
- [ ] Icônes de taille appropriée (w-5 h-5 minimum)
- [ ] Cartes cliquables ont la classe `card-touchable`
- [ ] Tests effectués sur device réel iOS/Android
- [ ] Pas d'erreur de lint
- [ ] Performance vérifiée (pas de lag)

---

**Note** : Ce guide est évolutif et sera mis à jour au fur et à mesure des améliorations.
