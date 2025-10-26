# Header Mobile - Conventions Android/iOS

## 📱 Composants créés

### 1. `SearchModal.tsx` (`src/components/ui/SearchModal.tsx`)
Modal de recherche optimisée pour mobile avec :
- Recherche en temps réel
- Historique des recherches récentes
- Tendances de recherche
- Animations fluides iOS/Android

### 2. `HeaderMobile.tsx` (`src/components/layout/HeaderMobile.tsx`)
Header mobile optimisé selon les conventions Android Material Design 3 et iOS Human Interface Guidelines.

## 🎨 Conventions respectées

### Android Material Design 3
- **Touch targets** : 48x48dp minimum (boutons adaptés)
- **Header height** : 56dp (56px)
- **Icon size** : 24dp pour les actions, 40dp pour le logo
- **FAB** : 56dp, positionné en bas à droite
- **Shadows** : ombres douces (elevation)
- **Animations** : transitions fluides sans décrochage

### iOS Human Interface Guidelines
- **Touch targets** : 44x44px minimum
- **Header height** : 44px standard
- **Icon size** : 28px pour une meilleure visibilité
- **Bordures** : arrondies (rounded-xl, rounded-2xl)
- **Overscroll** : comportement iOS natif
- **Animations** : effet de rebond léger

## 🚀 Améliorations techniques

### Performance mobile
- `touch-action: manipulation` pour améliorer la réactivité
- `-webkit-tap-highlight-color: transparent` pour supprimer le flash sur tap iOS
- Animations CSS uniquement (pas de JavaScript)
- Overscroll containment pour éviter les rebonds indésirables

### Accessibilité
- Labels ARIA sur tous les boutons
- Navigation au clavier
- Contrastes respectés (WCAG AA)
- Touch targets suffisants pour une utilisation facile

### Responsivité
- Header fixe qui reste visible au scroll
- Menu drawer qui prend 85% de la largeur
- Backdrop blur pour effet de profondeur
- Scrollable content avec padding en bas pour le FAB

## 📋 Structure du menu

### Sections principales
1. **Profil utilisateur**
   - Avatar avec badge de vérification
   - Nom et université
   - Impact écologique (CO₂ économisé)

2. **Catégories** (9 catégories)
   - Toutes les annonces
   - Livres & Cours
   - Électronique
   - Mobilier
   - Logement & Colocation
   - Services étudiants
   - Jobs & Stages
   - Dons entre étudiants
   - Troc & Échanges

3. **Mon compte** (si connecté)
   - Publier une annonce
   - Messages
   - Favoris
   - Alertes sauvegardées

4. **Gestion** (si connecté)
   - Mon profil
   - Mes commandes
   - Mes ventes
   - Paramètres

5. **Administration** (si admin)
   - Administration

6. **Autres**
   - Impact écologique
   - Aide & Support

7. **Déconnexion** (si connecté)

## 🎯 Utilisation

```tsx
import { HeaderMobile } from '@/components/layout/HeaderMobile';

// Dans votre composant
const MyComponent = () => {
  const handleOpenPublish = () => {
    // Ouvrir le formulaire de publication
  };

  return (
    <>
      <HeaderMobile onOpenPublish={handleOpenPublish} />
      {/* Votre contenu */}
    </>
  );
};
```

## 🔧 Personnalisation

### Modifier les couleurs
Les couleurs suivent la palette du thème Tailwind :
- `primary` / `secondary` pour les gradients
- `muted` pour les backgrounds
- `foreground` pour le texte
- `destructive` pour les actions de suppression

### Ajuster les touch targets
Les boutons utilisent des tailles minimum de 44px (iOS) ou 48px (Android) :
```tsx
className="w-10 h-10" // 40px + 4px padding
className="py-3.5"    // 14px de padding vertical
```

### Modifier le FAB
Le FAB est en bas à droite par défaut (convention Android) :
```tsx
className="fixed right-4 bottom-6" // Position Android
// Pour iOS, utiliser: className="fixed left-4 bottom-6"
```

## 📝 Notes importantes

1. **Supports uniquement mobile** : Ce header ne s'affiche que sur mobile (`md:hidden`)
2. **Backend required** : Nécessite le contexte AuthContext pour fonctionner
3. **Admin check** : Vérifie les UIDs et emails admin depuis les variables d'environnement
4. **Local storage** : Stocke les recherches récentes dans le navigateur

## 🐛 Troubleshooting

### Le menu ne s'ouvre pas
- Vérifier que `menuOpen` est dans le state
- Vérifier les z-index (menu à z-50, backdrop à z-50)

### Les animations ne fonctionnent pas
- Vérifier que Tailwind CSS est configuré
- Installer `tailwindcss-animate` si nécessaire

### Le FAB n'apparaît pas
- Vérifier que l'utilisateur est connecté (`currentUser`)
- Vérifier le z-index (FAB à z-40)

