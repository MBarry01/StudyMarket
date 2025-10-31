# 🚀 Chatbot Intelligent - Quick Start Guide

## 📋 Vue d'Ensemble Rapide

Chatbot **multifonctionnel** et **intelligent** pour StudyMarket avec :
- ✅ Compréhension contextuelle avancée
- ✅ Actions directes (créer, rechercher, naviguer)
- ✅ Suggestions intelligentes
- ✅ Previews inline
- ✅ Apprentissage utilisateur

---

## 🎯 Paramètres Clés

### Configuration Actuelle
```typescript
// src/components/ui/ChatbotWidget.tsx
MAX_MESSAGES = 100
SAVE_DEBOUNCE_MS = 2000
BOT_TYPING_DELAY = 800
```

### Configuration Future (À Ajouter)
```typescript
// Nouveau : src/lib/chatbot/config.ts
NLP_ENABLED = true
CONTEXT_WINDOW = 10 messages
LEARNING_ENABLED = true
SENTIMENT_ANALYSIS = true
SMART_SUGGESTIONS = true
QUICK_ACTIONS = true
```

---

## 🧠 Intelligence à Ajouter

### 1. NLP Engine (Natural Language Processing)
**Rôle** : Comprendre l'intention et extraire les entités

**Exemple** :
```
Input: "Je veux vendre mon MacBook à 1600 euros"
Output: {
  intent: "create_listing",
  entities: {
    item: "MacBook",
    price: 1600,
    action: "vendre"
  },
  confidence: 0.95
}
```

### 2. Context Manager (Gestion du Contexte)
**Rôle** : Retenir les 10 derniers messages pour comprendre la conversation

**Exemple** :
```
Message 1: "Je cherche un iPhone"
Bot: "Quel modèle ?"
Message 2: "13 Pro"
Bot: [Comprend] "iPhone 13 Pro" dans le contexte
```

### 3. Action Dispatcher (Exécuteur d'Actions)
**Rôle** : Exécuter des actions basées sur l'intention

**Exemples** :
- Créer annonce → `useListingStore.createListing()`
- Rechercher → `useListingStore.search()`
- Voir commande → `useOrderStore.fetchOrder()`

### 4. Smart Suggestions (Suggestions Intelligentes)
**Rôle** : Proposer des actions contextuelles

**Exemple** :
```
<User sur annonce>
Suggestions: [Contacter] [Ajouter favoris] [Comparer] [Partager]
```

---

## 📁 Nouveaux Fichiers à Créer

### 1. NLP Engine
```bash
src/lib/chatbot/nlpEngine.ts
```
- Extraction d'intents
- Extraction d'entités
- Détection sentiment
- Niveaux de confiance

### 2. Context Manager
```bash
src/lib/chatbot/contextManager.ts
```
- Mémoire des messages
- Compréhension historique
- Suivi conversation

### 3. Action Dispatcher
```bash
src/lib/chatbot/actionDispatcher.ts
```
- Mapping intent → action
- Intégration stores
- Execution actions

### 4. Configuration
```bash
src/lib/chatbot/config.ts
```
- Paramètres chatbot
- Intents & entités
- Seuils de confiance

### 5. Types
```bash
src/types/chatbot.ts
```
- Interfaces TypeScript
- Types de réponses
- Types d'actions

### 6. Smart Suggestions
```bash
src/components/ui/SmartSuggestions.tsx
```
- Boutons d'action rapide
- Suggestions contextuelles

### 7. Previews
```bash
src/components/ui/previews/
- ListingPreview.tsx
- MessagePreview.tsx
- OrderPreview.tsx
```

---

## 🔗 Intégrations Nécessaires

### Stores Zustand (Existant)
- ✅ `useListingStore` : Annonces
- ✅ `useMessageStore` : Messages
- ✅ `useOrderStore` : Commandes
- ✅ `useFavoritesStore` : Favoris
- ✅ `useAuthContext` : Auth

### API Backend (Existant)
- ✅ `POST /api/orders`
- ✅ `POST /api/create-payment-intent`
- ✅ `GET /api/verification`
- (Toutes les routes documentées)

### Firebase (Existant)
- ✅ Firestore collections
- ✅ Real-time listeners

---

## 🎨 Exemples d'Usage

### Exemple 1 : Créer une Annonce
```
User: "Je veux vendre mon MacBook"
Bot: [NLP] → intent: create_listing, item: MacBook
      [Action] → Ouvre modal création avec champs pré-remplis
      [Suggestion] → Guide step-by-step
      
      ✅ Modèle: MacBook
      ? Prix: [Suggestion: 1200-1800€]
      ? État: [Buttons: Comme neuf / Bon / Acceptable]
      ? Photos: [Upload]
```

### Exemple 2 : Recherche Intelligente
```
User: "Trouve-moi un iPhone pas cher"
Bot: [NLP] → intent: search_listing, item: iPhone, filter: price
      [Action] → useListingStore.search({category: 'electronics', maxPrice: 500})
      [Preview] → Affiche 3-5 résultats inline
      
      ┌─ iPhone 13 Pro - €550 ─┐
      │ Comme neuf • Paris     │
      │ ⭐ 4.8                  │
      └─────────────────────────┘
```

### Exemple 3 : Support Contextuel
```
User: "Problème avec ma commande"
Bot: [Context] → Récupère dernière commande
      [Action] → useOrderStore.fetchLatest()
      [Preview] → Affiche détails + statut
      
      Commande #ABC123
      MacBook Pro - €1,200
      Statut: PENDING_PAYMENT
      
      [Options] → Réessayer paiement / Changer méthode / Annuler
```

---

## 📊 Intents Principaux

### Annonces
- `create_listing` : Créer une annonce
- `edit_listing` : Modifier une annonce
- `delete_listing` : Supprimer une annonce
- `search_listing` : Rechercher des annonces
- `view_listing` : Voir une annonce

### Paiements
- `checkout` : Procéder au paiement
- `payment_status` : Voir statut paiement
- `refund` : Demander remboursement

### Messagerie
- `contact_seller` : Contacter vendeur
- `view_messages` : Voir messages
- `block_user` : Bloquer utilisateur
- `report_user` : Signaler utilisateur

### Profil
- `view_profile` : Voir profil
- `update_profile` : Modifier profil
- `verification` : Demander vérification

### Navigation
- `go_home` : Aller à l'accueil
- `go_listings` : Aller aux annonces
- `go_profile` : Aller au profil
- `go_messages` : Aller aux messages

### Support
- `help` : Besoin d'aide
- `report` : Signaler problème
- `contact` : Contacter support

---

## 🎯 Prochaines Étapes

### Étape 1 : Setup NLP Engine
```bash
# Créer le fichier
src/lib/chatbot/nlpEngine.ts

# Implémenter
- Function extractIntent(userInput)
- Function extractEntities(userInput)
- Function detectSentiment(userInput)
```

### Étape 2 : Context Manager
```bash
# Créer le fichier
src/lib/chatbot/contextManager.ts

# Implémenter
- Class ContextManager
- Method addMessage(message)
- Method getContext(window)
- Method isReferencing(message, context)
```

### Étape 3 : Action Dispatcher
```bash
# Créer le fichier
src/lib/chatbot/actionDispatcher.ts

# Implémenter
- Function dispatchAction(intent, entities, context)
- Integration with stores
- Action mappings
```

### Étape 4 : Smart Suggestions
```bash
# Créer le composant
src/components/ui/SmartSuggestions.tsx

# Intégrer dans ChatbotWidget
<SmartSuggestions context={context} onAction={handleAction} />
```

### Étape 5 : Previews
```bash
# Créer les composants
src/components/ui/previews/ListingPreview.tsx
src/components/ui/previews/MessagePreview.tsx
src/components/ui/previews/OrderPreview.tsx
```

---

## 📖 Documentation Complète

Pour plus de détails :
- **[Specifications complètes](CHATBOT-SPECIFICATIONS.md)** : Tous les paramètres
- **[Résumé d'implémentation](CHATBOT-RESUME-IMPLEMENTATION.md)** : Plan détaillé
- **[Architecture chatbot](ARCHITECTURE.md)** : Design technique

---

## ✅ Checklist Démarrage

- [ ] Créer dossier `src/lib/chatbot/`
- [ ] Créer `config.ts` avec paramètres de base
- [ ] Créer `nlpEngine.ts` avec extraction d'intents
- [ ] Créer `contextManager.ts` avec gestion contexte
- [ ] Créer `actionDispatcher.ts` avec mapping actions
- [ ] Créer `types/chatbot.ts` avec interfaces
- [ ] Créer `SmartSuggestions.tsx` composant
- [ ] Créer previews dans `previews/` folder
- [ ] Intégrer dans `ChatbotWidget.tsx`
- [ ] Tests & optimisation

---

**🚀 Prêt à commencer l'implémentation !**

**Next** : Créer le NLP Engine pour la compréhension intelligente.

