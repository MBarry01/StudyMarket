# 🐛 Debug - Aucune Demande dans Admin

## 🔍 Problème

Le panel admin affiche "0 demandes" et "Aucune demande trouvée".

## ✅ Corrections Appliquées

1. ✅ **Méthode `getAllRequests()`** ajoutée
   - Support filtres (all, pending, approved, rejected)
   - Triage manuel par date

2. ✅ **AdminVerificationsPage** modifié
   - Utilise `getAllRequests()` avec filtre
   - Fetch selon le filtre sélectionné

## 🧪 Comment Vérifier

### 1. Ouvrir la Console Navigateur (F12)
Regarder les erreurs dans la console.

**Erreurs possibles** :
- `FirebaseError: The query requires an index` → Index pas encore créé
- `Error: collection verification_requests not found` → Collection pas créée
- Aucune erreur → Collection vide

### 2. Vérifier dans Firestore Console

Aller sur :
https://console.firebase.google.com/project/annonces-app-44d27/firestore/data

**Chercher** : Collection `verification_requests`

**Si vide** : C'est normal ! Il n'y a pas encore de demandes créées.

**Pour tester** : Créer une demande depuis `/verification`

### 3. Tester Création de Demande

1. Aller sur : http://localhost:5177/StudyMarket/verification
2. Uploader 2-3 documents
3. Cliquer "Envoyer la demande"
4. Retourner sur admin → Devrait voir 1 demande "En attente"

---

## 📊 État Attendu

**Si aucune demande** :
- ✅ Stats : 0, 0, 0, 0
- ✅ Message : "Aucune demande trouvée"

**Si une demande existe** :
- ✅ Stats : 1 Total, 1 En attente
- ✅ Liste affichée avec demande

---

## 🎯 Actions

### Option A : Créer une Demande Test

1. `/verification` → Uploader documents → Soumettre
2. Retour admin → Vérifier affichage

### Option B : Créer Manuellement dans Firestore

Dans Firestore Console :

```
Collection: verification_requests
Document: test123
{
  userId: "VOTRE_USER_ID",
  status: "pending",
  userName: "Test User",
  userEmail: "test@example.com",
  university: "Sorbonne",
  documents: [
    {
      type: "student_card",
      url: "https://example.com/doc.jpg",
      fileName: "carte.jpg",
      size: 1000000,
      uploadedAt: Date.now()
    }
  ],
  requestedAt: new Date(),
  createdAt: new Date()
}
```

Puis rafraîchir admin.

---

**Rafraîchissez la page admin (F5) et dites-moi ce que vous voyez !** 🔍

