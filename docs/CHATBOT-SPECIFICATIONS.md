# 🤖 Spécifications Chatbot Intelligent StudyMarket

## 📋 Vue d'Ensemble

Chatbot multifonctionnel et intelligent pour StudyMarket avec compréhension contextuelle, personnalisation et IA avancée.

---

## 🎯 Objectifs

1. **Assistant multi-cas d'usage** : Annonces, paiements, messagerie, profil, sécurité
2. **Intelligence contextuelle** : Comprend les besoins et la navigation
3. **Personnalisation** : Réponses adaptées au profil et à l'historique
4. **Actions directes** : Suggestions, redirections, déclenchements
5. **Apprentissage** : Historique et préférences utilisateur

---

## 🔧 Paramètres de Configuration

### 1. **Paramètres de Base**

```typescript
interface ChatbotConfig {
  // Noyau
  name: string;                    // "StudyMarket Assistant"
  version: string;                 // "2.0.0"
  defaultLanguage: string;         // "fr"
  
  // Performances
  maxMessages: number;             // 100
  messageDebounce: number;         // 2000ms
  typingDelay: number;             // 800-1500ms
  cacheExpiry: number;             // 3600000ms (1h)
  
  // Intelligence
  nlpEnabled: boolean;             // true
  contextWindow: number;           // 10 messages précédents
  learningEnabled: boolean;        // true
  sentimentAnalysis: boolean;      // true
  
  // Fonctionnalités
  quickActionsEnabled: boolean;    // true
  smartSuggestions: boolean;       // true
  proactiveHelp: boolean;          // true
  voiceInputEnabled: boolean;      // false (future)
  
  // Personnalisation
  rememberConversations: boolean;  // true
  useRealName: boolean;            // true
  adaptToBehavior: boolean;        // true
  
  // Sécurité
  rateLimitPerMinute: number;      // 30
  blockSpam: boolean;              // true
  dataRetention: number;           // 90 jours
}
```

### 2. **Paramètres NLP (Compréhension)**

```typescript
interface NLPConfig {
  // Langues supportées
  languages: string[];             // ['fr', 'en']
  
  // Intents (intentions)
  intents: {
    // Annonces
    create_listing: string[];      // ['créer', 'publier', 'vendre', 'mettre en ligne']
    edit_listing: string[];        // ['modifier', 'éditer', 'changer']
    delete_listing: string[];      // ['supprimer', 'enlever', 'retirer']
    search_listing: string[];      // ['chercher', 'trouver', 'rechercher']
    view_listing: string[];        // ['voir', 'consulter', 'afficher']
    
    // Paiements
    checkout: string[];            // ['payer', 'acheter', 'checkout']
    payment_status: string[];      // ['statut', 'suivi', 'où en est']
    refund: string[];              // ['rembourser', 'remboursement']
    
    // Messagerie
    contact_seller: string[];      // ['contacter', 'écrire', 'message']
    view_messages: string[];       // ['messages', 'discussion', 'conversation']
    
    // Profil
    view_profile: string[];        // ['profil', 'compte', 'informations']
    update_profile: string[];      // ['modifier', 'mettre à jour', 'changer']
    verification: string[];        // ['vérifier', 'certifier', 'validation']
    
    // Favoris
    favorite: string[];            // ['favori', 'sauvegarder', 'mettre de côté']
    view_favorites: string[];      // ['favoris', 'sauvegardés']
    
    // Support
    help: string[];                // ['aide', 'help', 'support']
    report: string[];              // ['signaler', 'rapport', 'problème']
    contact: string[];             // ['contacter', 'écrire', 'email']
    
    // Navigation
    go_home: string[];             // ['accueil', 'home', 'retour']
    go_listings: string[];         // ['annonces', 'listings', 'marché']
    go_profile: string[];          // ['profil', 'compte']
    go_messages: string[];         // ['messages', 'discussions']
    
    // Informations
    about_platform: string[];      // ['à propos', 'comment ça marche', 'fonctionnement']
    pricing_info: string[];        // ['prix', 'coût', 'gratuit', 'tarif']
    security_info: string[];       // ['sécurité', 'confiance', 'sûr']
    categories_info: string[];     // ['catégories', 'types', 'sections']
  };
  
  // Entités (extraction)
  entities: {
    categories: string[];          // ['electronics', 'books', 'furniture', ...]
    conditions: string[];          // ['new', 'like-new', 'good', 'fair', 'poor']
    transactionTypes: string[];    // ['sale', 'donation', 'exchange', 'service']
    locations: string[];           // Noms de villes, campus, universités
    prices: RegExp;                // Regex pour extraire les prix
    keywords: string[];            // Mots-clés importants
  };
  
  // Niveaux de confiance
  confidenceThresholds: {
    high: number;                  // 0.8
    medium: number;                // 0.5
    low: number;                   // 0.3
  };
}
```

### 3. **Paramètres de Conversation**

```typescript
interface ConversationConfig {
  // Contextual
  contextDepth: number;            // Nombre de messages pour contexte (10)
  rememberUserPreferences: boolean; // true
  adaptToUserMood: boolean;        // true
  
  // Suggestions
  suggestCount: number;            // Nombre de suggestions (3-5)
  suggestionTypes: string[];       // ['action', 'info', 'nav']
  
  // Réponses
  responseStyle: 'friendly' | 'professional' | 'casual'; // 'friendly'
  useEmojis: boolean;              // true (modérable)
  maxResponseLength: number;       // 200 caractères
  provideExamples: boolean;        // true
  
  // Escalation
  escalateToHuman: boolean;        // true
  escalationTriggers: string[];    // ['angry', 'complex', 'payment_issue']
  escalationMessage: string;       // Message de transition
}
```

### 4. **Paramètres d'Intégration**

```typescript
interface IntegrationConfig {
  // APIs externes
  firebase: {
    enabled: boolean;              // true
    collections: string[];         // ['listings', 'users', 'conversations']
  };
  
  supabase: {
    enabled: boolean;              // true (contact form)
    functions: string[];           // ['contact-email']
  };
  
  // Stores Zustand
  availableStores: string[];       // ['useListingStore', 'useMessageStore', ...]
  
  // Pages accessibles
  accessiblePages: string[];       // Toutes les routes de l'app
}
```

---

## 🧠 Fonctionnalités Intelligentes

### 1. **Compréhension Contextuelle**

Le chatbot comprend :
- **Où se trouve l'utilisateur** (page actuelle)
- **Son historique** (annonces, achats, recherches)
- **Son profil** (vérifié, université, préférences)
- **Son intention** (créer, acheter, informer)
- **Sa navigation** (d'où il vient, où il va)

**Exemple** :
```
User: "J'ai un problème avec ma commande"
Bot: [Comprend] -> Contexte : User a une commande récente
      -> Action : Cherche la dernière commande
      -> Affichage : "Je vois ta commande #123 pour 'MacBook Pro' du 15/01"
      -> Suggestion : Voir le statut / Contacter vendeur / Signaler problème
```

### 2. **Actions Intelligentes**

Le chatbot peut :
- **Créer/Modifier/Supprimer des annonces** via API
- **Lancer des recherches** avec filtres intelligents
- **Rediriger** vers les bonnes pages avec contexte
- **Afficher des previews** d'annonces, commandes, messages
- **Pré-remplir des formulaires** (créer annonce, contacter)
- **Afficher des statistiques** personnelles

**Exemple** :
```
User: "Crée une annonce pour mon MacBook"
Bot: [Action] -> Ouvre modal créer annonce avec champs pré-remplis
      -> Title: "MacBook Pro"
      -> Category: "electronics"
      -> Suggeste prix moyen: 1200€
      -> Guide l'utilisateur à travers les étapes
```

### 3. **Suggestions Proactives**

Le chatbot suggère :
- **Actions contextuelles** basées sur la page
- **Annonces similaires** ou recommandées
- **Informations pertinentes** (guides, astuces)
- **Prochaines étapes** naturelles
- **Optimisations** (prix, photos, description)

**Exemple** :
```
User est sur une annonce "MacBook Pro"
Bot: [Suggestion] -> "Veux-tu contacter le vendeur ?"
                   -> "Voici d'autres MacBooks similaires : [3 annonces]"
                   -> "Conseil : Vérifie que l'acheteur est certifié 🛡️"
```

### 4. **Apprentissage Utilisateur**

Le chatbot apprend :
- **Préférences** (catégories favorites, budget)
- **Comportement** (fréquence, patterns)
- **Historique** (recherches, achats, ventes)
- **Style de communication** (formel/casual)
- **Suggestions réussies** (feedback)

**Exemple** :
```
User aime les livres, budget 10-20€
Bot: [Learning] -> Mémorise préférences
      -> Prochain message: "Je te montre les livres entre 10-20€ ! 📚"
      -> Suggestions adaptées aux goûts
```

---

## 📊 Fonctionnalités Multifonctionnelles

### 1. **Module Annonces**

#### Comprendre
- Créer/modifier/supprimer des annonces
- Rechercher des annonces
- Gérer les favoris
- Voir l'historique

#### Actions
- Créer annonce avec assistance
- Recherche intelligente avec filtres
- Suggestions de prix
- Optimisation de titre/description
- Afficher previews

#### Exemples de Réponses
```
"Crée une annonce pour un MacBook"
→ Guide step-by-step avec suggestions

"Trouve-moi des livres pas chers"
→ Recherche + Affiche résultats inline

"Combien vaut mon iPhone 13 ?"
→ Estimation de prix + Conseils
```

### 2. **Module Paiements**

#### Comprendre
- Statut des commandes
- Méthodes de paiement
- Historique des achats
- Remboursements

#### Actions
- Affichage statut en temps réel
- Guide checkout
- Rappel paiements en attente
- Confirmation réception

#### Exemples de Réponses
```
"Où en est ma commande ?"
→ Affiche statut + Timeline

"Je n'ai pas reçu mon argent"
→ Connexe transactions + Actions

"Comment payer ?"
→ Guide pas à pas checkout
```

### 3. **Module Messagerie**

#### Comprendre
- Nouvelles conversations
- Messages non lus
- Blocage/signalement
- Historique

#### Actions
- Créer conversation
- Afficher previews messages
- Rappels non lus
- Propositions de rencontre

#### Exemples de Réponses
```
"Je veux contacter le vendeur"
→ Pré-rempli message + Ouvre chat

"J'ai un message"
→ Montre previews + Actions rapides

"Je veux signaler quelqu'un"
→ Guide signalement
```

### 4. **Module Profil**

#### Comprendre
- Informations profil
- Vérification étudiant
- Statistiques
- Paramètres

#### Actions
- Afficher stats personnelles
- Guide vérification
- Suggestions amélioration
- Mise à jour profil

#### Exemples de Réponses
```
"Comment être vérifié ?"
→ Guide certification étape par étape

"Mes statistiques"
→ Affiche : Ventes, CO₂, Reviews, Badges

"Je veux changer mon université"
→ Ouvre modal édition
```

### 5. **Module Support**

#### Comprendre
- Questions générales
- Problèmes techniques
- Signalements
- Contact support

#### Actions
- Guide solutions
- Formulaires de contact
- Création tickets
- Escalade humaine

#### Exemples de Réponses
```
"Comment fonctionne StudyMarket ?"
→ Explication + Quick tour

"J'ai un bug"
→ Questions diagnostic + Solutions

"Je veux parler à un humain"
→ Transfère au support
```

### 6. **Module Navigation**

#### Comprendre
- Déplacement entre pages
- Recherche de fonctionnalités
- Quick access

#### Actions
- Redirections avec contexte
- Navigation guidée
- Raccourcis

#### Exemples de Réponses
```
"Je veux acheter"
→ Redirige vers /listings avec filtres

"Où sont mes annonces ?"
→ Redirige vers /profile#listings

"Messages urgents"
→ Redirige vers /messages (triés)
```

### 7. **Module Sécurité**

#### Comprendre
- Signalements
- Conseils sécurité
- Vérifications
- Blocages

#### Actions
- Guide sécurité
- Création signalements
- Statut vérification
- Mesures préventives

#### Exemples de Réponses
```
"Est-ce sûr d'acheter ?"
→ Conseils + Badges vérifiés

"Je veux signaler"
→ Processus signalement

"Comment me protéger ?"
→ Guide sécurité
```

### 8. **Module Découverte**

#### Comprendre
- Nouveautés
- Recommandations
- Tendances
- Alerts personnalisées

#### Actions
- Suggestions personnalisées
- Alertes prix
- Nouveautés catégories
- Annonces tendance

#### Exemples de Réponses
```
"Que me proposes-tu ?"
→ Suggestions basées sur historique

"Alertes pour MacBooks"
→ Configure alertes prix

"Quoi de neuf ?"
→ Nouveautés pertinentes
```

---

## 🎨 Interface Utilisateur

### 1. **Quick Actions (Actions Rapides)**

Boutons d'action rapides contextuels :
```typescript
interface QuickAction {
  label: string;           // "Créer annonce"
  icon: string;            // Lucide icon
  action: string;          // 'create_listing'
  color: string;           // 'blue'
  visible: boolean;        // Conditions
}

// Exemples
QuickActions = [
  { label: "Créer annonce", icon: "plus", action: "create" },
  { label: "Mes messages", icon: "message", action: "messages" },
  { label: "Rechercher", icon: "search", action: "search" },
  { label: "Aide", icon: "help", action: "help" }
]
```

### 2. **Previews Intelligentes**

Afficher des previews inline :
- **Annonces** : Titre, image, prix, statut
- **Messages** : Contenu, expéditeur, non lus
- **Commandes** : Articles, statut, date
- **Statistiques** : Graphiques, KPIs

**Exemple** :
```
User: "Montre-moi mes annonces"
Bot: [Preview]
┌─────────────────────────────┐
│ 📱 MacBook Pro 2021         │
│ €1,200 • 3 vues            │
│ [ACTIVE]                    │
│ ─────────────────────────── │
│ 🎓 Livre Histoire de France │
│ €15 • 12 vues              │
│ [ACTIVE]                    │
└─────────────────────────────┘
```

### 3. **Rich Responses**

Réponses enrichies :
- **Liens cliquables** avec prévisualisation
- **Images** inline (annonces, catégories)
- **Formulaires** interactifs (créer, modifier)
- **Graphiques** (stats, tendances)
- **Timeline** (commandes, vérification)

### 4. **Typing Indicators**

Indicateurs de frappe avec :
- Animation réaliste (3 points)
- Simule temps de réflexion
- Messages "En train de chercher..." pour actions longues

---

## 🔗 Intégrations

### 1. **Firebase Firestore**

Collections accessibles :
- `listings` : Annonces
- `users` : Profils
- `orders` : Commandes
- `conversations` : Messages
- `favorites` : Favoris

### 2. **Zustand Stores**

Stores disponibles :
- `useListingStore` : Gestion annonces
- `useMessageStore` : Gestion messages
- `useOrderStore` : Gestion commandes
- `useFavoritesStore` : Gestion favoris
- `useAuthContext` : Authentification

### 3. **Backend API**

Endpoints disponibles :
- `/api/orders` : Commandes
- `/api/create-payment-intent` : Paiements
- `/api/verification` : Vérification
- (Tous les endpoints documentés)

### 4. **Navigation Router**

Routes accessibles :
- Toutes les routes publiques
- Routes protégées (si connecté)
- Routes admin (si admin)

---

## 📈 Métriques & Analytics

### 1. **Métriques Chatbot**

```typescript
interface ChatbotMetrics {
  // Utilisation
  totalConversations: number;
  averageSessionLength: number;
  messagesPerSession: number;
  uniqueUsers: number;
  
  // Performance
  responseTime: number;
  satisfactionScore: number;        // 0-5
  escalationRate: number;
  successRate: number;
  
  // Intelligence
  intentAccuracy: number;
  contextRetention: number;
  suggestionClickRate: number;
  
  // Actions
  actionsTriggered: {
    createListing: number;
    navigate: number;
    search: number;
    // ...
  };
}
```

### 2. **Feedback Utilisateur**

```typescript
interface Feedback {
  messageId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  helpful: boolean;
  suggestion: string;
  timestamp: Date;
}
```

### 3. **Analytics Événements**

Événements trackés :
- `chatbot_opened`
- `message_sent`
- `action_triggered`
- `suggestion_clicked`
- `escalation_requested`
- `feedback_submitted`

---

## 🚀 Implémentation

### Phase 1 : Foundation (Actuel ✅)
- UI de base
- Persistance messages
- Réponses simples par mots-clés

### Phase 2 : Intelligence (À venir)
- Système NLP
- Compréhension contextuelle
- Suggestions intelligentes

### Phase 3 : Actions (À venir)
- Intégration stores/API
- Actions directes
- Previews inline

### Phase 4 : Apprentissage (Futur)
- Machine learning
- Personnalisation avancée
- Prédictions

---

## 🎯 Priorités

### **Priorité 1 : Essentiel**
1. ✅ UI fonctionnelle
2. ⚠️ Compréhension avancée
3. ⚠️ Actions de base (créer, chercher, naviguer)
4. ⚠️ Suggestions contextuelles

### **Priorité 2 : Important**
5. Previews intelligentes
6. Apprentissage basique
7. Feedback utilisateur
8. Analytics

### **Priorité 3 : Amélioration**
9. Voice input
10. Machine learning
11. Multi-langues avancé
12. Intégrations externes

---

## 📝 Exemples de Dialogues

### Exemple 1 : Création d'Annonce
```
User: "Je veux vendre mon MacBook"
Bot: "Parfait ! 🎉 Je vais t'aider à créer une annonce pour ton MacBook.
      Commençons par quelques détails :"
      
      [Preview form]
      ✅ Modèle : MacBook Pro
      ✅ Catégorie : Électronique
      ⚠️ Prix : ?
      ⚠️ État : ?
      ⚠️ Photos : 0
      
      "Quel est le modèle exact de ton MacBook ? (ex: M1 Pro, Intel i7)"
      
User: "M1 Pro 14 pouces"
Bot: "Super ! 🎯 MacBook Pro M1 14". Pour quel prix veux-tu le vendre ?
      💡 Conseils :
      - Neuf : ~2,200€
      - Comme neuf : ~1,800€
      - Bon état : ~1,400€"
      
User: "1600 euros"
Bot: "Parfait ! 1,600€ 💰 Quel est l'état de ton MacBook ?
      [Quick buttons: Comme neuf / Bon / Acceptable]
      
User: [Clic] "Comme neuf"
Bot: "Excellent ! 📸 Maintenant, tu as des photos à ajouter ?
      Tu peux uploader jusqu'à 5 photos."
      [Upload buttons]
      
User: [Upload 3 photos]
Bot: "Top ! 📷 Maintenant ajoute une description (optionnel mais recommandé) :
      [Textarea]
      💡 Exemple : 'MacBook Pro M1 14" en excellent état, toutes fonctionnalités OK, garantie jusqu'en juin 2026'"
      
User: [Écrit description]
Bot: "Parfait ! 🎉 Ta annonce est prête !
      [Final preview avec tous les détails]
      Publier maintenant ? [YES] [EDIT]
      
User: [YES]
Bot: ✅ "Annonce publiée ! Elle est maintenant visible sur StudyMarket.
      Tu peux la voir sur : /listing/abc123
      📊 Statistiques disponibles dans ton profil."
```

### Exemple 2 : Recherche Intelligente
```
User: "Je cherche un iPhone pas cher"
Bot: "Bien sûr ! 📱 Je cherche des iPhones pour toi...
      Voici ce que j'ai trouvé :"
      
      [Preview 3 annonces]
      ┌─ iPhone 13 Pro - €550 ─┐
      │ Comme neuf • Paris 6e  │
      │ ⭐ 4.8 (12 avis)       │
      └─────────────────────────┘
      
      ┌─ iPhone 12 - €400 ──────┐
      │ Bon état • Saclay      │
      │ ⭐ 4.5 (8 avis)        │
      └──────────────────────────┘
      
      ┌─ iPhone SE 2022 - €350 ─┐
      │ Comme neuf • Paris 1er  │
      │ ⭐ 4.9 (3 avis)         │
      └─────────────────────────┘
      
      "Quelle annonce t'intéresse ?"
      
User: "La première"
Bot: "Super choix ! 🎯 Voici les détails complets :
      [Full listing preview]
      
      💡 Recommandations :
      • Vendeur vérifié ✅
      • Membre depuis 2023
      • 12 transactions réussies
      
      Que veux-tu faire ?
      [Contacter] [Ajouter aux favoris] [Comparer]"
```

### Exemple 3 : Support Contextuel
```
User: "J'ai un problème avec ma commande"
Bot: "Je t'aide tout de suite ! 🔍 Laisse-moi vérifier..."
      [Loading... Recherche de tes commandes récentes]
      
      "J'ai trouvé ta dernière commande 📦"
      ┌─ Commande #ABC123 ───────────┐
      │ MacBook Pro 2021            │
      │ €1,200 • 15 Jan 2025        │
      │ Statut : PAYMENT_PENDING    │
      └──────────────────────────────┘
      
      "Il semble que ton paiement soit en attente. Que se passe-t-il ?
      [Options]
      • Problème paiement
      • Transaction non reconnue
      • Remboursement
      • Autre"
      
User: "Le paiement n'a pas marché"
Bot: "Je comprends 🙏 Voici ce que je peux faire :
      1. Réessayer le paiement
      2. Changer de méthode de paiement
      3. Annuler la commande
      4. Contacter le support Stripe
      
      Quelle option préfères-tu ?"
      
User: "Réessayer"
Bot: "Parfait ! Redirection vers le paiement...
      [Redirects to /checkout/abc123]
      💡 Si ça ne marche toujours pas, je peux t'aider à changer de méthode."
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Foundation ✅
- [x] UI Chatbot responsive
- [x] Persistance messages (Firestore + LocalStorage)
- [x] Navigation entre vues (Menu/Chat/Contact)
- [x] Réponses basiques par mots-clés
- [x] Formulaire contact Supabase

### Phase 2 : Intelligence ⚠️
- [ ] Système NLP (intents + entities)
- [ ] Compréhension contextuelle (10 messages)
- [ ] Détection sentiment
- [ ] Suggestions intelligentes
- [ ] Adaptabilité au comportement

### Phase 3 : Actions ⚠️
- [ ] Intégration useListingStore
- [ ] Intégration useMessageStore
- [ ] Intégration useOrderStore
- [ ] Actions de création/modification
- [ ] Navigation contextuelle

### Phase 4 : Previews ⚠️
- [ ] Preview annonces inline
- [ ] Preview messages
- [ ] Preview commandes
- [ ] Preview statistiques
- [ ] Quick actions

### Phase 5 : Apprentissage 🔲
- [ ] Machine learning
- [ ] Personnalisation avancée
- [ ] Prédictions utilisateur
- [ ] Optimisation continue

---

## 📞 Support & Contribution

Pour toute question ou contribution :
- Documentation : `/docs/`
- Issues : GitHub
- Contact : barrymohamadou98@gmail.com

---

**🚀 Prêt à construire le chatbot le plus intelligent de StudyMarket !**

