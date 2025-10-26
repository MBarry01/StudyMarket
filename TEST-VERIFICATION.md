# 🔍 Test de la Section Vérification

## 📍 URLs de Test

### Serveurs actifs :
- **Dev** : http://localhost:5177/StudyMarket/
- **Preview** : http://localhost:4173/StudyMarket/

### Pages à tester :

#### 1. Page de Profil (Section Vérification)
**URL** : http://localhost:5177/StudyMarket/profile

**Instructions** :
1. Connectez-vous
2. Allez sur **Menu > Profil** (ou cliquez sur votre avatar)
3. Onglet **"Paramètres"** (dernier onglet à droite)
4. Vous DEVRIEZ voir en PREMIER une carte "Vérification du compte"

**Ce que vous devriez voir** :
- 🛡️ Titre : "Vérification du compte"
- Badge de statut (vert si vérifié, orange si non vérifié)
- Bouton "Demander la vérification" ou "Voir le statut"
- Message : "Les comptes vérifiés bénéficient..."

#### 2. Page de Demande de Vérification
**URL** : http://localhost:5177/StudyMarket/verification

**Instructions** :
1. Cliquez sur le bouton depuis le profil
2. Ou accédez directement à l'URL

**Ce que vous devriez voir** :
- Titre : "Vérification du compte étudiant"
- Badge de statut actuel
- Formulaire upload documents
- Bouton "Envoyer la demande"

#### 3. Page Admin de Vérifications
**URL** : http://localhost:5177/StudyMarket/admin/verifications

**Instructions** :
1. Connectez-vous comme admin
2. Dashboard Admin
3. Sidebar > **"Vérifications"**

**Ce que vous devriez voir** :
- Statistiques (Total, En attente, Approuvées, Rejetées)
- Filtres par statut
- Liste des demandes

## 🐛 Si la section n'apparaît PAS

### Vérification 1 : Console du navigateur
1. Appuyez sur **F12** pour ouvrir la console
2. Onglet **Console**
3. Recherchez les erreurs en rouge
4. Copiez-collez les erreurs ici

### Vérification 2 : Hot reload
1. Le serveur tourne déjà sur port 5177
2. Si vous ne voyez pas les changements, faites **Ctrl + F5** (hard refresh)

### Vérification 3 : Onglet correct
- Assurez-vous d'être dans l'onglet **"Paramètres"**
- Les 4 onglets sont : Mes Annonces | Avis Reçus | Favoris | **Paramètres**

### Vérification 4 : Structure de la page
Regardez si vous voyez :
- "Paramètres du profil" ✅
- SI OUI : La section vérification devrait être AVANT cette section
- SI NON : Ouvrez la console et dites-moi l'erreur

## 📸 Screenshot attendu

Dans l'onglet Paramètres du profil, vous devriez voir :

```
┌────────────────────────────────────────┐
│  🛡️ Vérification du compte            │
│                                        │
│  [Badge] Votre compte est vérifié     │
│             [Voir le statut]           │
│                                        │
│  Les comptes vérifiés bénéficient...  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Paramètres du profil                  │
│  [Formulaire prénom/nom]               │
└────────────────────────────────────────┘
```

## ✅ Checklist

- [ ] Ouvrez http://localhost:5177/StudyMarket/profile
- [ ] Cliquez sur l'onglet "Paramètres"
- [ ] Dites-moi ce que vous voyez EXACTEMENT
- [ ] Ouvrez la console (F12) et dites-moi s'il y a des erreurs

---

**💡 Astuce** : La section vérification est au TOUT DÉBUT de l'onglet Paramètres, AVANT "Paramètres du profil"

