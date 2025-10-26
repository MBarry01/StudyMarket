# 🔐 Guide d'accès au système de vérification

## 📍 Comment accéder à la vérification ?

### Pour les utilisateurs :

**Option 1 - Depuis le profil (RECOMMANDÉ) :**
1. Allez sur votre profil : **Menu > Profil**
2. Cliquez sur l'onglet **"Paramètres"**
3. Dans la section **"Vérification du compte"**, cliquez sur **"Demander la vérification"**

**Option 2 - Accès direct :**
- URL : http://localhost:5177/StudyMarket/verification
- Ou allez sur : Menu > Profil > Onglet Paramètres > Bouton "Demander la vérification"

### Pour les administrateurs :

**Option 1 - Depuis le dashboard admin (RECOMMANDÉ) :**
1. Allez sur : **Dashboard Admin**
2. Dans la sidebar, cliquez sur **"Vérifications"**
3. Vous verrez toutes les demandes en attente

**Option 2 - URL directe :**
- http://localhost:5177/StudyMarket/admin/verifications

## 🎯 Carte d'accès

| Utilisateur | Lien | Description |
|------------|------|-------------|
| **Utilisateur** | `/verification` | Formulaire de demande |
| **Admin** | `/admin/verifications` | Gestion des demandes |
| **Profil** | `/profile` (onglet Paramètres) | Section vérification |

## 📱 Interface utilisateur

### Section dans le profil
- ✅ Badge de statut visible (Vérifié / En attente / Non vérifié)
- ✅ Bouton d'action contextuel :
  - Si non vérifié : "Demander la vérification"
  - Si vérifié : "Voir le statut"
- ✅ Message explicatif des avantages

### Page de demande
- ✅ Formulaire upload documents
- ✅ Statut actuel affiché
- ✅ Instructions claires
- ✅ Liste des fichiers acceptés

## 🔧 Test rapide

### Scénario 1 : Utilisateur non vérifié
1. Connectez-vous
2. Allez sur votre profil
3. Onglet **"Paramètres"**
4. Vous verrez : "Votre compte n'est pas encore vérifié"
5. Cliquez sur **"Demander la vérification"**
6. Vous êtes redirigé vers `/verification`

### Scénario 2 : Utilisateur vérifié
1. Connectez-vous (compte déjà vérifié)
2. Allez dans **"Paramètres"** du profil
3. Vous verrez : "Votre compte est vérifié" avec badge ✅
4. Cliquez sur **"Voir le statut"** pour les détails

### Scénario 3 : Administrateur
1. Connectez-vous comme admin
2. Allez sur **Dashboard Admin**
3. Sidebar > **"Vérifications"**
4. Vous verrez la liste des demandes
5. Actions disponibles : Voir docs / Approuver / Rejeter

## 🎨 Éléments visuels

### Badge de vérification
- 🟡 **En attente** : Badge jaune avec icône horloge
- 🟢 **Vérifié** : Badge vert avec icône check
- 🔴 **Rejeté** : Badge rouge avec icône croix

### Icônes utilisées
- 🛡️ `Shield` : Section vérification
- ✅ `CheckCircle2` : Bouton d'action
- 📎 Bouton documents : Voir docs

## ✅ Checklist d'accès

- [x] Section ajoutée dans profil > Paramètres
- [x] Badge de statut visible
- [x] Bouton d'action contextuel
- [x] Lien vers page de demande
- [x] Route `/verification` fonctionnelle
- [x] Route `/admin/verifications` fonctionnelle
- [x] Navigation admin mise à jour

---

**🎉 La vérification est maintenant accessible depuis le profil !**

Visitez http://localhost:5177/StudyMarket/profile et allez dans l'onglet "Paramètres" !

