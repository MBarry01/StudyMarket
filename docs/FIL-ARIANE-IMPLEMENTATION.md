# 🍞 Implémentation du Fil d'Ariane (Breadcrumb)

## 📋 Résumé

Un composant de fil d'Ariane réutilisable a été créé, conforme aux conventions iOS/Android et optimisé pour mobile.

## ✨ Caractéristiques

### 1. **Conventions iOS/Android**

#### Bouton Retour Mobile
- ✅ Bouton "◀ Retour" visible uniquement sur mobile (< 768px)
- ✅ Navigation intelligente vers la page précédente dans le fil d'Ariane
- ✅ Fallback sur `navigate(-1)` si pas de route précédente

#### Troncature Intelligente
- 📱 **Mobile** : Affiche Home + "..." + 2 derniers items
- 💻 **Desktop** : Affiche jusqu'à `maxItems` items (défaut: 4)

#### Position Sticky
- ✅ Suit le scroll sur mobile (sous la navbar)
- ✅ Fixe en haut sur desktop
- ✅ z-index approprié pour rester au-dessus du contenu

### 2. **Responsive Design**

#### Mobile (< 768px)
```tsx
- Icône Home plus grande (w-3.5 h-3.5)
- Taille texte : text-xs
- Bouton retour visible
- Max-width labels : 150px
- Troncature agressive
```

#### Desktop (≥ 768px)
```tsx
- Icône Home standard (w-4 h-4)
- Taille texte : text-sm
- Bouton retour masqué
- Max-width labels : 200px
- Troncature modérée
```

### 3. **Accessibilité**

- ✅ `aria-label="Breadcrumb"` sur le `<nav>`
- ✅ `aria-current="page"` sur l'item actif
- ✅ `aria-label="Retour"` sur le bouton retour
- ✅ Navigation au clavier possible
- ✅ Liens sémantiques avec `<Link>` et `<li>`

## 📍 Utilisation

### Dans ListingDetailPage

```tsx
import { Breadcrumb } from '../components/ui/Breadcrumb';

<Breadcrumb 
  items={[
    { label: 'Accueil', to: '/' },
    { label: 'Annonces', to: '/listings' },
    { label: listing.title }
  ]}
  maxItems={3}
  showHome={false}
  showBackButton={true}
/>
```

### Props

```typescript
interface BreadcrumbProps {
  items?: BreadcrumbItem[];      // Items personnalisés (optionnel)
  maxItems?: number;               // Nombre max d'items visibles (défaut: 4)
  showHome?: boolean;              // Afficher l'icône Home (défaut: true)
  showBackButton?: boolean;        // Bouton retour mobile (défaut: true)
}
```

### Breadcrumbs par Défaut

Le composant gère automatiquement les breadcrumbs pour ces routes :

```typescript
- /listings     → Accueil / Annonces
- /listing/:id  → Accueil / Annonces / Détail
- /create       → Accueil / Créer une annonce
- /messages     → Accueil / Messages
- /favorites    → Accueil / Favoris
- /profile      → Accueil / Profil
- /admin        → Accueil / Admin
- /checkout     → Accueil / Panier / Paiement
- /cart         → Accueil / Panier
```

## 🎨 Exemples Visuels

### Mobile (< 768px)

```
[◀] Accueil / Annonces / MacBook Pro...
```

Avec troncature (6 items):
```
[◀] 🏠 / Item 1 / ... / Item 5 / Item 6
```

### Desktop (≥ 768px)

```
🏠 / Accueil / Annonces / MacBook Pro 13' M1
```

Sans bouton retour, navigation complète visible.

## 🔧 Implémentation Technique

### Détection Mobile

```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### Troncature Intelligente

```typescript
const visibleItems = shouldTruncate && isMobile
  ? [
      breadcrumbItems[0],        // Home
      { label: '...', to: undefined },
      ...breadcrumbItems.slice(-2) // 2 derniers
    ]
  : shouldTruncate
  ? breadcrumbItems.slice(0, maxItems - 1).concat([
      { label: '...', to: undefined },
      ...breadcrumbItems.slice(-1)
    ])
  : breadcrumbItems;
```

### Navigation Retour

```typescript
const handleBack = () => {
  if (breadcrumbItems.length > 1 && breadcrumbItems[breadcrumbItems.length - 2]?.to) {
    navigate(breadcrumbItems[breadcrumbItems.length - 2].to!);
  } else {
    navigate(-1);
  }
};
```

## 🎯 Avantages

### ✅ UX Améliorée
- Navigation intuitive
- Position claire dans l'application
- Retour rapide vers les niveaux supérieurs

### ✅ Convention iOS/Android
- Bouton retour mobile standard
- Comportement natif attendu
- Feedback visuel approprié

### ✅ Accessibilité
- ARIA labels complets
- Navigation clavier
- Contrastes respectés

### ✅ Performances
- Détection resize optimisée
- Troncature intelligente
- Styles inline minimisés

## 📱 Exemple Concret

### Sur Listing Detail Page

**Avant** :
```html
Accueil / Annonces / MacBook Pro...
```

**Après** (Mobile) :
```
[◀] 🏠 / Annonces / MacBook Pro...
     ↑ Bouton retour iOS/Android
```

**Après** (Desktop) :
```
🏠 / Accueil / Annonces / MacBook Pro 13' M1
```

## 🚀 Prochaines Étapes

1. ✅ Composant créé et testé
2. ✅ Intégré dans ListingDetailPage
3. ⏳ Ajouter dans CreateListingPage
4. ⏳ Ajouter dans MessagesPage
5. ⏳ Ajouter dans FavoritesPage
6. ⏳ Ajouter dans ProfilePage

---

**Date** : 2024-12-29  
**Fichier** : `src/components/ui/Breadcrumb.tsx`  
**Statut** : ✅ Implémenté et prêt à utiliser

