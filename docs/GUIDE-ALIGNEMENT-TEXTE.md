# Guide d'alignement du texte - StudyMarket

## 📋 Principe général

**Par défaut, tout le contenu de l'application devrait être aligné à gauche, sauf exceptions spécifiques.**

## ✅ Où utiliser `text-center` (EXCEPTIONS)

### 1. **Page d'accueil (HomePage)** - Sections marketing
- ✅ Hero section (titre principal + description)
- ✅ Catégories étudiantes
- ✅ Pourquoi StudyMarket ?
- ✅ Impact écologique (statistiques)
- ✅ Call-to-action final

### 2. **Messages d'état vides**
- ✅ "Aucune annonce trouvée"
- ✅ "Aucun message"
- ✅ "Connectez-vous pour continuer"

### 3. **Modals et dialogs**
- ✅ Icônes d'état (succès, erreur, warning)
- ✅ Titres de confirmation

### 4. **Boutons d'action isolés**
- ✅ Bouton "Charger plus"
- ✅ Bouton de soumission de formulaire (centré)

### 5. **Cartes de catégories / Quick actions**
- ✅ Icône + texte dans les cartes de catégories
- ✅ Quick actions avec icônes circulaires

## ❌ Où NE PAS utiliser `text-center` (RÈGLE PAR DÉFAUT)

### 1. **Toutes les pages de contenu**
```tsx
// ❌ MAUVAIS
<h1 className="text-3xl font-bold text-center">Mon profil</h1>

// ✅ BON
<h1 className="text-3xl font-bold text-left">Mon profil</h1>
```

### 2. **Paramètres et Notifications**
```tsx
// ✅ Structure correcte
<div className="flex items-start justify-between py-3">
  <div className="flex items-start gap-3 flex-1">
    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
    <div className="text-left">
      <p className="font-medium text-base">Email</p>
      <p className="text-sm text-muted-foreground">
        Recevez des notifications par email
      </p>
    </div>
  </div>
  <Switch checked={...} />
</div>
```

### 3. **Listes et tableaux**
- ❌ Titres de colonnes centrés (sauf colonnes d'actions)
- ✅ Contenu des cellules aligné à gauche
- ✅ Texte descriptif aligné à gauche

### 4. **Formulaires**
```tsx
// ❌ MAUVAIS
<h2 className="text-2xl font-bold text-center">Modifier mon annonce</h2>

// ✅ BON
<h2 className="text-2xl font-bold text-left">Modifier mon annonce</h2>
```

### 5. **Cartes de détails**
- ❌ Titre centré
- ✅ Titre aligné à gauche
- ✅ Description alignée à gauche
- ✅ Métadonnées alignées à gauche

### 6. **Sidebar et navigation**
- ❌ Items de menu centrés
- ✅ Items de menu alignés à gauche avec icône

### 7. **Dashboard admin**
- ✅ Tous les titres alignés à gauche
- ✅ Tous les tableaux alignés à gauche
- ✅ Toutes les statistiques alignées à gauche

## 🎨 Classes Tailwind recommandées

### Pour les conteneurs flex avec icône
```tsx
<div className="flex items-start gap-3 flex-1">
  <Icon className="w-5 h-5 text-primary mt-0.5" />
  <div className="text-left">
    <p className="font-medium text-base">Titre</p>
    <p className="text-sm text-muted-foreground">Description</p>
  </div>
</div>
```

### Pour les titres de page
```tsx
<h1 className="text-3xl font-bold text-left mb-2">Titre de la page</h1>
<p className="text-muted-foreground text-left">Description de la page</p>
```

### Pour le responsive (mobile centré, desktop gauche)
```tsx
// ❌ À ÉVITER (cause des inconsistances)
<p className="text-center sm:text-left">Texte</p>

// ✅ PRÉFÉRER (toujours aligné à gauche)
<p className="text-left">Texte</p>
```

## 🔧 Modifications appliquées

### ✅ SettingsPage.tsx
- Toutes les sections de notifications : `items-start` + `text-left`
- Icônes avec `mt-0.5` pour alignement vertical
- Taille d'icône uniforme : `w-5 h-5`
- Espacement vertical : `py-3`

### ✅ EditListingPage.tsx
- Titre du formulaire : `text-left` au lieu de `text-center`
- Support du dark mode : `dark:bg-card` et `dark:border-border`

### 🔄 À corriger (TODO)
- [ ] CreateListingPage.tsx - Vérifier tous les titres
- [ ] ListingDetailPage.tsx - Alignement des métadonnées
- [ ] CheckoutPage.tsx - Formulaire de paiement
- [ ] PaymentSuccessPage.tsx - Message de succès (peut rester centré)
- [ ] Admin pages - Vérifier cohérence des titres
- [ ] Components UI - Vérifier les modals et dialogs

## 📱 Responsive Design

### Mobile
- ✅ Alignement à gauche par défaut
- ✅ Icônes visibles
- ✅ Espacement adapté

### Desktop
- ✅ Alignement à gauche maintenu
- ✅ Espacement plus généreux
- ✅ Icônes plus grandes si nécessaire

## 🚫 Anti-patterns à éviter

1. **Centrage par défaut et override responsive**
   ```tsx
   // ❌ MAUVAIS
   <div className="text-center sm:text-left md:text-left lg:text-left">
   ```

2. **Mélange d'alignements dans une même section**
   ```tsx
   // ❌ MAUVAIS
   <div>
     <h2 className="text-center">Titre</h2>
     <p className="text-left">Description</p>
   </div>
   ```

3. **Oubli du `flex-1` pour le contenu texte**
   ```tsx
   // ❌ MAUVAIS - le switch peut pousser le texte
   <div className="flex items-center justify-between">
     <div>
       <p>Titre</p>
     </div>
     <Switch />
   </div>

   // ✅ BON
   <div className="flex items-start justify-between">
     <div className="flex-1 text-left">
       <p>Titre</p>
     </div>
     <Switch />
   </div>
   ```

## 📚 Exemples de code

### Exemple complet : Section de paramètres
```tsx
<CardContent className="space-y-6">
  <div className="space-y-4">
    <h3 className="font-medium text-left">Canaux de notification</h3>
    
    <div className="space-y-4">
      <div className="flex items-start justify-between py-3">
        <div className="flex items-start gap-3 flex-1">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-left">
            <p className="font-medium text-base">Email</p>
            <p className="text-sm text-muted-foreground">
              Recevez des notifications par email
            </p>
          </div>
        </div>
        <Switch checked={...} />
      </div>
      
      {/* Autres items... */}
    </div>
  </div>
</CardContent>
```

### Exemple : En-tête de page
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-left mb-2 flex items-center gap-2">
    <SettingsIcon className="w-8 h-8" />
    Paramètres
  </h1>
  <p className="text-muted-foreground text-left">
    Gérez votre profil, vos préférences et votre sécurité
  </p>
</div>
```

## ✨ Checklist de vérification

Avant de valider une page ou un composant :

- [ ] Tous les titres (`h1`, `h2`, `h3`) sont alignés à gauche
- [ ] Les descriptions et paragraphes sont alignés à gauche
- [ ] Les icônes sont alignées avec le texte (utiliser `items-start` et `mt-0.5`)
- [ ] Les sections de paramètres utilisent `flex items-start justify-between`
- [ ] Pas de `text-center` sauf dans les exceptions listées ci-dessus
- [ ] Le responsive ne casse pas l'alignement
- [ ] Le dark mode est pris en compte

## 🎯 Objectif

**Créer une expérience utilisateur cohérente et professionnelle où le contenu est facilement lisible et scannable, avec un alignement à gauche qui suit les conventions de lecture occidentales.**

