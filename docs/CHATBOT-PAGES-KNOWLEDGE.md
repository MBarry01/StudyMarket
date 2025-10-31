# 📚 Documentation Complète des Pages - Chatbot StudyMarket

## 🎯 Objectif

Documentation exhaustive de **toutes les pages** du site StudyMarket pour que le chatbot devienne un expert sur toutes les fonctionnalités.

---

## 📄 Table des Matières

1. [Pages Publiques](#pages-publiques)
2. [Pages Protégées (Auth Requise)](#pages-protégées)
3. [Pages Admin](#pages-admin)
4. [Catégories](#catégories)
5. [Fonctionnalités Principales](#fonctionnalités-principales)

---

## 🌐 Pages Publiques

### 1. **HomePage** - `/`
**Description** : Page d'accueil principale du site

**Contenu** :
- **Hero Section** : Présentation StudyMarket
- **Statistiques en temps réel** :
  - Nombre d'annonces actives
  - Nombre d'utilisateurs
  - CO₂ économisé globalement
- **Catégories** : 8 catégories principales
  - 📱 Électronique
  - 📚 Livres & Cours
  - 🏠 Mobilier
  - 🏘️ Logement
  - 👥 Services
  - 💼 Jobs & Stages
  - 🎁 Dons
  - 🔄 Troc
- **Annonces récentes** : 12 dernières annonces
- **Section "Comment ça marche"** : Guide rapide
- **Call-to-action** : Créer une annonce

**Réponses chatbot** :
```
"Comment fonctionne le site ?"
→ Explique le concept, les catégories, le processus

"Je veux commencer"
→ Redirige vers /listings ou /create-listing

"Quelles sont les catégories ?"
→ Liste les 8 catégories avec descriptions
```

---

### 2. **ListingsPage** - `/listings`
**Description** : Liste de toutes les annonces avec recherche et filtres

**Fonctionnalités** :
- **Recherche textuelle** : Barre de recherche avec autocomplete
- **Filtres avancés** :
  - Par catégorie (8 catégories)
  - Par prix (min/max)
  - Par état (neuf, comme neuf, bon, correct, mauvais)
  - Par université
  - Par campus
  - Par type de transaction (vente, don, troc, service)
  - Badge "Vérifiés uniquement"
- **Tri** :
  - Pertinence
  - Plus récent
  - Prix croissant
  - Prix décroissant
  - Distance
- **Vues** : Grille / Liste
- **Pagination** : Chargement infini
- **Breadcrumb** : Navigation fil d'Ariane
- **Quick filters** : Boutons rapides

**Réponses chatbot** :
```
"Je cherche un iPhone"
→ Lance recherche "iPhone" sur /listings

"Trouve-moi des livres pas chers"
→ Lance recherche catégorie "books" avec maxPrice: 20

"Annonces autour de Paris"
→ Lance recherche avec location: Paris

"Voir toutes les annonces"
→ Redirige vers /listings
```

---

### 3. **ListingDetailPage** - `/listing/:id`
**Description** : Détails complets d'une annonce

**Contenu** :
- **Images** : Carrousel de photos (1-5 images)
- **Titre & prix** : En évidence
- **Catégorie** : Badge catégorie
- **État** : Badge état
- **Description** : Texte complet
- **Localisation** : Ville, campus, université
- **Informations vendeur** :
  - Nom + avatar
  - Badge vérifié
  - Note moyenne
  - Membre depuis
- **Statistiques** :
  - Nombre de vues
  - Nombre de likes
  - Date de publication
- **Type transaction** : Vente / Don / Troc / Service
- **Actions** :
  - Contacter le vendeur
  - Acheter maintenant
  - Ajouter aux favoris
  - Partager
  - Signaler
- **Annonces similaires** : 4 suggestions

**Réponses chatbot** :
```
"Je veux voir l'annonce MacBook Pro"
→ Lance recherche, affiche preview

"Contacter le vendeur"
→ Crée conversation / Ouvre /messages

"Acheter maintenant"
→ Redirige vers /checkout/:id

"Est-ce fiable ?"
→ Vérifie badge vérifié, note vendeur
```

---

### 4. **AuthPage** - `/auth`
**Description** : Authentification (connexion / inscription)

**Fonctionnalités** :
- **Connexion** :
  - Email + Password
  - Oubli de mot de passe
  - Remember me
- **Inscription** :
  - Email + Password
  - Nom complet
  - Vérification email obligatoire
  - Acceptation CGU
- **Messages d'erreur** : Gestion des erreurs Firebase
- **Redirection** : Après connexion → HomePage
- **Pas d'accès** : Si déjà connecté

**Réponses chatbot** :
```
"Je veux me connecter"
→ Redirige vers /auth?tab=login

"Créer un compte"
→ Redirige vers /auth?tab=register

"J'ai oublié mon mot de passe"
→ Guide vers formulaire récupération
```

---

### 5. **HelpPage** - `/help`
**Description** : Centre d'aide et FAQ

**Contenu** :
- **FAQ** : Questions fréquentes avec réponses
- **Guides** :
  - Comment créer une annonce
  - Comment acheter
  - Comment se faire vérifier
  - Comment contacter un vendeur
- **Contact** : Formulaire de contact
- **Liens utiles** :
  - Comment ça marche
  - Sécurité
  - CGU / Politique de confidentialité

**Réponses chatbot** :
```
"J'ai besoin d'aide"
→ Redirige vers /help

"Comment fonctionne le site ?"
→ Explique processus + liens HelpPage

"Questions fréquentes"
→ Liste FAQ
```

---

### 6. **SafetyPage** - `/safety`
**Description** : Page sécurité et bonnes pratiques

**Contenu** :
- **Vérification étudiants** : Processus de certification
- **Conseils sécurité** :
  - Rencontrer dans lieux publics
  - Vérifier identité
  - Vérifier articles
- **Signalement** : Comment signaler un problème
- **Contacter support** : Formulaire signalement
- **Trust badges** : Badges de confiance

**Réponses chatbot** :
```
"Est-ce sûr ?"
→ Explique sécurité + Redirige /safety

"Comment me protéger ?"
→ Liste conseils sécurité

"Je veux signaler quelqu'un"
→ Guide processus signalement
```

---

### 7. **JobSearchPage** - `/jobs`
**Description** : Page dédiée aux emplois et stages

**Fonctionnalités** :
- **Filtres spécialisés** :
  - Type : Job / Stage / Mission
  - Temps : Temps plein / Partiel / Freelance
  - Salaire min/max
  - Localisation
- **Annonces emploi** : Liste des offres
- **Quick apply** : Candidature rapide

**Réponses chatbot** :
```
"Je cherche un job"
→ Redirige vers /jobs

"Trouve-moi des stages"
→ Recherche filtres "stage"
```

---

### 8. **HousingListingsPage** - `/housing`
**Description** : Page dédiée aux logements

**Fonctionnalités** :
- **Filtres spécialisés** :
  - Type : Chambre / Studio / Colocation
  - Prix (loyer)
  - Surface
  - Meublé / Non meublé
  - Distance du campus
- **Carte interactive** : Affichage sur carte
- **Annonces logement** : Liste des offres

**Réponses chatbot** :
```
"Je cherche un logement"
→ Redirige vers /housing

"Colocation près de Sorbonne"
→ Recherche avec filtres spécifiques
```

---

## 🔐 Pages Protégées (Auth Requise)

### 9. **ProfilePage** - `/profile`
**Description** : Profil utilisateur complet

**Onglets** :
1. **Informations** :
   - Photo de profil
   - Nom, email, université
   - Badge vérifié
   - Bio
   - Statistiques (CO₂, transactions)
2. **Mes annonces** :
   - Anciennes et nouvelles annonces
   - Toutes : Active, Réservée, Vendu
   - Filtres par statut
   - Créer une annonce
   - Modifier / Supprimer
3. **Mes favoris** :
   - Annonces sauvegardées
   - Preview
   - Détails
4. **Mes statistiques** :
   - Revenus totaux
   - Utilisateurs touchés
   - CO₂ économisé
   - Prix moyen
   - Favoris
5. **Impact environnemental** :
   - CO₂ économisé
   - Graphiques mensuels
   - Badges

**Réponses chatbot** :
```
"Mon profil"
→ Redirige vers /profile

"Mes annonces"
→ Redirige vers /profile#listings

"Mes statistiques"
→ Affiche stats personnelles inline

"Modifier mon profil"
→ Ouvre modal édition profil
```

---

### 10. **CreateListingPage** - `/create-listing`
**Description** : Créer une nouvelle annonce

**Formulaire** :
- **Étape 1 - Informations de base** :
  - Titre *
  - Catégorie *
  - Description *
  - État *
  - Prix
- **Étape 2 - Photos** :
  - Upload 1-5 images
  - Aperçu
- **Étape 3 - Localisation** :
  - Carte interactive
  - Sélectionner position
- **Étape 4 - Publication** :
  - Récapitulatif
  - Publier / Sauvegarder brouillon

**Réponses chatbot** :
```
"Créer une annonce"
→ Redirige vers /create-listing avec assistance

"Je veux vendre mon MacBook"
→ Guide création avec suggestions de champs
```

---

### 11. **EditListingPage** - `/edit-listing/:id`
**Description** : Modifier une annonce existante

**Fonctionnalités** :
- Même formulaire que création
- Pré-rempli avec données existantes
- Modifier toutes les infos
- Changer photos
- Retirer des photos
- Supprimer l'annonce

**Réponses chatbot** :
```
"Modifier mon annonce"
→ Redirige vers /edit-listing/:id

"Je veux changer le prix"
→ Ouvre édition avec focus sur prix
```

---

### 12. **MessagesPage** - `/messages`
**Description** : Messagerie complète

**Fonctionnalités** :
- **Liste conversations** :
  - Recherche conversations
  - Nom vendeur/acheteur
  - Preview dernier message
  - Nombre de non lus
  - Date dernière activité
- **Chat** :
  - Messages en temps réel
  - Upload images
  - Envoi messages
  - Indicateurs de lecture
- **Actions** :
  - Bloquer utilisateur
  - Signaler
  - Archiver
  - Supprimer
  - Voir annonce concernée
- **Modal signalement** :
  - Raison
  - Description
  - Envoi

**Réponses chatbot** :
```
"Mes messages"
→ Redirige vers /messages

"Nouveaux messages"
→ Affiche conversations non lues

"Je veux contacter le vendeur"
→ Crée conversation ou ouvre existante

"Je veux signaler quelqu'un"
→ Guide processus signalement
```

---

### 13. **CheckoutPage** - `/checkout/:id`
**Description** : Processus de paiement

**Étapes** :
1. **Récapitulatif** :
   - Article
   - Prix
   - Frais
   - Total
2. **Méthode de paiement** :
   - Carte bancaire (Stripe)
   - PayPal (placeholder)
   - Lydia (placeholder)
   - Espèces (placeholder)
3. **Informations** :
   - Coordonnées
   - Adresse
4. **Confirmation** :
   - Validation
   - Webhook Stripe
   - Succès

**Réponses chatbot** :
```
"Je veux acheter"
→ Redirige vers /checkout/:id

"Mon paiement n'a pas marché"
→ Guide résolution problème

"Combien coûte ?"
→ Affiche prix + frais
```

---

### 14. **OrdersPage** - `/orders`
**Description** : Mes commandes (acheteur)

**Contenu** :
- **Filtres** :
  - Toutes
  - En attente
  - Payées
  - En cours
  - Livrées
  - Annulées
- **Liste commandes** :
  - Numéro commande
  - Article
  - Prix
  - Statut
  - Date
  - Actions
- **Détails** :
  - Informations complètes
  - Suivi
  - Annulation

**Réponses chatbot** :
```
"Mes commandes"
→ Redirige vers /orders

"Où en est ma commande ?"
→ Affiche statut dernière commande

"Je veux annuler"
→ Guide processus annulation
```

---

### 15. **SalesPage** - `/sales`
**Description** : Mes ventes (vendeur)

**Contenu** :
- **Filtres** :
  - Toutes
  - En attente
  - Confirmées
  - Expédiées
  - Livrées
- **Liste ventes** :
  - Article
  - Prix
  - Acheteur
  - Statut
  - Paiement
- **Actions** :
  - Voir détail
  - Confirmer réception paiement
  - Proposer remboursement

**Réponses chatbot** :
```
"Mes ventes"
→ Redirige vers /sales

"Quand je vais être payé ?"
→ Affiche statut paiements

"Confirmer vente"
→ Guide processus confirmation
```

---

### 16. **FavoritesPage** - `/favorites`
**Description** : Annonces favorites

**Contenu** :
- **Liste favoris** :
  - Toutes les annonces sauvegardées
  - Preview
  - Prix
  - Statut
  - Retirer des favoris
- **Tri** :
  - Plus récent
  - Plus ancien
  - Prix croissant
  - Prix décroissant
- **Actions** :
  - Voir détail
  - Contacter vendeur
  - Retirer

**Réponses chatbot** :
```
"Mes favoris"
→ Redirige vers /favorites

"Ajouter aux favoris"
→ Actions sur annonce

"Retirer des favoris"
→ Actions sur favoris
```

---

### 17. **SettingsPage** - `/settings`
**Description** : Paramètres du compte

**Onglets** :
1. **Compte** :
   - Email
   - Mot de passe
   - Supprimer compte
2. **Notifications** :
   - Email
   - Push
   - SMS
   - Alertes prix
3. **Confidentialité** :
   - Visibilité profil
   - Contacts
   - Bloqués
4. **Préférences** :
   - Langue
   - Thème
   - Localisation

**Réponses chatbot** :
```
"Paramètres"
→ Redirige vers /settings

"Je veux changer mon email"
→ Ouvre édition compte

"Modifier notifications"
→ Ouvre onglet notifications
```

---

### 18. **VerificationRequestPage** - `/verification`
**Description** : Demande de certification étudiant

**Contenu** :
- **Processus** :
  - Upload documents
  - Vérification email
  - Photo selfie
  - Soumission
- **Documents requis** :
  - Carte étudiante
  - Certificat de scolarité
  - Carte d'identité
- **Statut** :
  - Soumis
  - En revue
  - Approuvé
  - Rejeté

**Réponses chatbot** :
```
"Je veux être vérifié"
→ Redirige vers /verification

"Mon statut de vérification"
→ Affiche statut actuel

"Combien de temps ?"
→ Explique délais (24-48h)
```

---

### 19. **EnvironmentalImpactPage** - `/impact`
**Description** : Impact environnemental

**Contenu** :
- **CO₂ économisé** : Total utilisateur
- **Graphiques** : Évolution mensuelle
- **Badges** : Accomplissements
- **Comparaisons** : VS moyenne

**Réponses chatbot** :
```
"Mon impact environnemental"
→ Redirige vers /impact

"Combien de CO₂ j'ai économisé ?"
→ Affiche stats inline
```

---

### 20. **PaymentsPage** - `/payments`
**Description** : Historique des paiements

**Contenu** :
- **Transactions** :
  - Achats
  - Ventes
  - Dates
  - Montants
  - Statuts
- **Balance** : Total récupérable
- **Payouts** : Demandes de retrait

**Réponses chatbot** :
```
"Mes paiements"
→ Redirige vers /payments

"Combien j'ai gagné ?"
→ Affiche balance

"Retirer mes gains"
→ Guide processus payout
```

---

### 21. **SavedSearchesPage** - `/saved-searches`
**Description** : Recherches sauvegardées

**Contenu** :
- **Alertes** :
  - Recherches actives
  - Critères
  - Notifications
- **Actions** :
  - Modifier
  - Désactiver
  - Supprimer

**Réponses chatbot** :
```
"Mes alertes"
→ Redirige vers /saved-searches

"Créer une alerte"
→ Guide création

"Modifier une alerte"
→ Ouvre édition
```

---

### 22. **OrderDetailPage** - `/order/:id`
**Description** : Détails d'une commande spécifique

**Contenu** :
- **Informations** :
  - Numéro
  - Date
  - Statut
  - Article
  - Prix
- **Suivi** : Timeline
- **Actions** : Annulation, contact

**Réponses chatbot** :
```
"Commande #ABC123"
→ Affiche détails inline

"Où en est ma commande ?"
→ Affiche statut + timeline
```

---

### 23. **PaymentSuccessPage** - `/payment/success`
**Description** : Confirmation de paiement

**Contenu** :
- **Confirmation** : Paiement réussi
- **Détails** : Commande
- **Prochaines étapes** : Attendre vendeur
- **Actions** : Voir commande

**Réponses chatbot** :
```
"Mon paiement a réussi ?"
→ Vérifie statut dernière commande
```

---

### 24. **CheckoutSuccessPage** - `/checkout/success`
**Description** : Confirmation checkout

**Contenu** :
- **Confirmation** : Commande créée
- **Détails** : Récapitulatif
- **Actions** : Continuer shopping

**Réponses chatbot** :
```
"Ma commande a réussi ?"
→ Vérifie statut
```

---

### 25. **OrderConfirmationPage** - `/order-confirmation/:orderId`
**Description** : Confirmation de commande

**Contenu** :
- **Numéro commande** : En évidence
- **Détails** : Article, prix
- **Actions** : Suivi

**Réponses chatbot** :
```
"Confirmer ma commande"
→ Affiche détails
```

---

## 👨‍💼 Pages Admin

### 26. **AdminOverview** - `/admin`
**Description** : Dashboard admin - Vue d'ensemble

**KPIs** :
- Utilisateurs totaux
- Annonces actives
- Commandes du jour
- Revenus du jour
- Signalements en attente
- Paiements en attente

**Graphiques** :
- Évolution utilisateurs
- Commandes par jour
- Revenus par jour
- Catégories populaires

**Réponses chatbot** :
```
"Dashboard admin"
→ Redirige vers /admin (si admin)
```

---

### 27. **AdminOrdersPage** - `/admin/orders`
**Description** : Gestion des commandes

**Contenu** :
- **Liste commandes** :
  - Filtrer par statut
  - Rechercher
  - Trier
- **Actions** :
  - Rembourser (Stripe)
  - Rejouer webhook
  - Voir détails
  - Changer statut

**Réponses chatbot** :
```
"Commandes admin"
→ Redirige vers /admin/orders (si admin)
```

---

### 28. **AdminListingsPage** - `/admin/listings`
**Description** : Gestion des annonces

**Contenu** :
- **Liste annonces** :
  - Filtrer par statut
  - Rechercher
- **Actions** :
  - Approuver
  - Retirer
  - Supprimer
  - Voir détails

**Réponses chatbot** :
```
"Annonces admin"
→ Redirige vers /admin/listings (si admin)
```

---

### 29. **AdminUsersPage** - `/admin/users`
**Description** : Gestion des utilisateurs

**Contenu** :
- **Liste utilisateurs** :
  - Filtrer par statut
  - Rechercher
- **Actions** :
  - Bloquer
  - Débloquer
  - Vérifier manuellement
  - Changer rôle
  - Voir détails

**Réponses chatbot** :
```
"Utilisateurs admin"
→ Redirige vers /admin/users (si admin)
```

---

### 30. **AdminMessagesPage** - `/admin/messages`
**Description** : Gestion des conversations

**Contenu** :
- **Liste conversations** :
  - Voir toutes
  - Rechercher
- **Actions** :
  - Bloquer
  - Supprimer
  - Voir détails

**Réponses chatbot** :
```
"Messages admin"
→ Redirige vers /admin/messages (si admin)
```

---

### 31. **AdminReportsPage** - `/admin/reports`
**Description** : Gestion des signalements

**Contenu** :
- **Liste signalements** :
  - Filtrer par statut
  - Rechercher
- **Actions** :
  - Rejeter
  - Avertir
  - Bloquer
  - Voir détails

**Réponses chatbot** :
```
"Signalements admin"
→ Redirige vers /admin/reports (si admin)
```

---

### 32. **AdminVerificationsPage** - `/admin/verifications`
**Description** : Gestion des vérifications étudiants

**Contenu** :
- **Liste demandes** :
  - Filtrer par statut
  - Rechercher
- **Actions** :
  - Approuver
  - Rejeter
  - Voir documents

**Réponses chatbot** :
```
"Vérifications admin"
→ Redirige vers /admin/verifications (si admin)
```

---

### 33. **AdminWebhookLogsPage** - `/admin/webhooks`
**Description** : Logs webhook Stripe

**Contenu** :
- **Liste logs** :
  - Filtrer par type
  - Rechercher
- **Actions** :
  - Voir détails
  - Retraiter

**Réponses chatbot** :
```
"Webhooks admin"
→ Redirige vers /admin/webhooks (si admin)
```

---

### 34. **AdminPayoutsPage** - `/admin/payouts`
**Description** : Gestion des payouts vendeurs

**Contenu** :
- **Liste payouts** :
  - Filtrer par statut
  - Rechercher
- **Actions** :
  - Approuver
  - Rejeter
  - Voir détails

**Réponses chatbot** :
```
"Payouts admin"
→ Redirige vers /admin/payouts (si admin)
```

---

### 35. **AdminAuditTrailPage** - `/admin/audit`
**Description** : Audit trail complet

**Contenu** :
- **Liste événements** :
  - Filtrer par type
  - Rechercher
  - Trier par date
- **Actions admin** : Historique complet

**Réponses chatbot** :
```
"Audit admin"
→ Redirige vers /admin/audit (si admin)
```

---

## 📂 Catégories d'Annonces

### Catégories Principales

1. **📱 Electronics (Électronique)**
   - Ordinateurs
   - Smartphones
   - Tablettes
   - Accessoires tech
   - Câbles, chargeurs

2. **📚 Books (Livres & Cours)**
   - Manuels scolaires
   - Livres universitaires
   - Notes de cours
   - Annales
   - Ressources pédagogiques

3. **🏠 Furniture (Mobilier)**
   - Meubles
   - Déco
   - Électroménager
   - Linge de maison
   - Vêtements

4. **🏘️ Housing (Logement)**
   - Chambres
   - Studios
   - Colocations
   - Appartements
   - Foyers étudiants

5. **👥 Services (Services)**
   - Cours particuliers
   - Aide aux devoirs
   - Babysitting
   - Transport
   - Livraison

6. **💼 Jobs (Jobs & Stages)**
   - Emplois
   - Stages
   - Missions
   - Freelance
   - Contrats

7. **🎁 Donations (Dons)**
   - Gratuit
   - Don charité
   - Recyclage
   - Échange solidaire

8. **🔄 Exchange (Troc)**
   - Échanges
   - Contreparties
   - Services échangés

**Réponses chatbot** :
```
"Quelles catégories existent ?"
→ Liste 8 catégories avec descriptions

"Je veux vendre un ordinateur"
→ Catégorie "electronics"

"Chercher des livres"
→ Catégorie "books"

"Où créer une annonce ?"
→ Guide catégories disponibles
```

---

## 🛠️ Fonctionnalités Principales

### 1. **Système de Paiement**

**Stripe** :
- Paiement par carte
- 3DS / SCA
- Webhooks automatiques
- Remboursements
- Payouts vendeurs

**Méthodes** :
- Carte bancaire ✅
- PayPal (placeholder)
- Lydia (placeholder)
- Espèces (placeholder)

**Flux** :
1. Créer commande
2. Sélectionner méthode
3. Paiement Stripe
4. Webhook confirmation
5. Statut mis à jour

**Réponses chatbot** :
```
"Comment payer ?"
→ Explique processus + Méthodes

"Mon paiement n'a pas marché"
→ Guide résolution

"Remboursement"
→ Guide processus
```

---

### 2. **Système de Messagerie**

**Fonctionnalités** :
- Conversations en temps réel
- Envoi messages
- Upload images
- Indicateurs de lecture
- Blocage / Signalement
- Archivage

**Flux** :
1. Contacter vendeur
2. Créer conversation
3. Envoyer messages
4. Décision d'achat

**Réponses chatbot** :
```
"Contacter vendeur"
→ Crée conversation

"Mes messages"
→ Affiche conversations

"Je veux bloquer quelqu'un"
→ Guide processus
```

---

### 3. **Système de Vérification**

**Processus** :
1. Upload documents
2. Vérification email
3. Photo selfie
4. Soumission
5. Auto-vérification ou revue admin
6. Statut mis à jour

**Documents** :
- Carte étudiante
- Certificat scolarité
- Carte identité

**Statuts** :
- Non vérifié
- Documents soumis
- En revue
- Vérifié
- Rejeté
- Suspendu

**Réponses chatbot** :
```
"Je veux être vérifié"
→ Guide processus étape par étape

"Mon statut"
→ Affiche statut actuel

"Combien de temps ?"
→ Explique délais
```

---

### 4. **Système de Recherche**

**Filtres** :
- Catégorie
- Prix min/max
- État
- Localisation
- Campus
- Universités
- Badge vérifié
- Type transaction

**Tri** :
- Pertinence
- Date
- Prix
- Distance
- Note

**Sauvegardes** :
- Alertes prix
- Recherches actives
- Notifications

**Réponses chatbot** :
```
"Je cherche un iPhone"
→ Lance recherche avec paramètres

"Trouve-moi des livres à moins de 20€"
→ Recherche filtres prix

"Alertes pour MacBooks"
→ Crée alerte prix
```

---

### 5. **Système de Favoris**

**Fonctionnalités** :
- Ajouter / Retirer
- Liste favoris
- Accès rapide
- Partage

**Réponses chatbot** :
```
"Ajouter aux favoris"
→ Actions sur annonce

"Mes favoris"
→ Redirige /favorites
```

---

## 🎯 Utilisation Chatbot

### Scénarios Courants

1. **Créer une annonce**
   - User: "Je veux vendre mon MacBook"
   - Bot: Guide création avec suggestions
   - Action: /create-listing + aide

2. **Rechercher**
   - User: "Trouve-moi un iPhone pas cher"
   - Bot: Lance recherche filtres
   - Action: /listings avec résultats

3. **Contacter vendeur**
   - User: "Je veux contacter le vendeur"
   - Bot: Crée conversation
   - Action: /messages

4. **Voir profil**
   - User: "Mes annonces"
   - Bot: Redirige vers profil
   - Action: /profile#listings

5. **Support**
   - User: "J'ai un problème"
   - Bot: Diagnostique + Solutions
   - Action: Escalade si nécessaire

---

## 📊 Résumé des Routes

### Routes Publiques
- `/` - HomePage
- `/listings` - ListingsPage
- `/listing/:id` - ListingDetailPage
- `/auth` - AuthPage
- `/help` - HelpPage
- `/safety` - SafetyPage
- `/jobs` - JobSearchPage
- `/housing` - HousingListingsPage

### Routes Protégées
- `/profile` - ProfilePage
- `/create-listing` - CreateListingPage
- `/edit-listing/:id` - EditListingPage
- `/messages` - MessagesPage
- `/checkout/:id` - CheckoutPage
- `/orders` - OrdersPage
- `/sales` - SalesPage
- `/favorites` - FavoritesPage
- `/settings` - SettingsPage
- `/verification` - VerificationRequestPage
- `/impact` - EnvironmentalImpactPage
- `/payments` - PaymentsPage
- `/saved-searches` - SavedSearchesPage

### Routes Admin
- `/admin` - AdminOverview
- `/admin/orders` - AdminOrdersPage
- `/admin/listings` - AdminListingsPage
- `/admin/users` - AdminUsersPage
- `/admin/messages` - AdminMessagesPage
- `/admin/reports` - AdminReportsPage
- `/admin/verifications` - AdminVerificationsPage
- `/admin/webhooks` - AdminWebhookLogsPage
- `/admin/payouts` - AdminPayoutsPage
- `/admin/audit` - AdminAuditTrailPage

---

**🎉 Documentation complète ! Le chatbot peut maintenant répondre à toutes les questions sur StudyMarket !**

