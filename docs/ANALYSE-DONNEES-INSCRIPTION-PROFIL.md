# 🔍 Analyse - Récupération des Données d'Inscription sur le Profil

## 📊 État Actuel du Flux

### **Flux d'Inscription**
```
1. User remplit formulaire (firstName, lastName, university, fieldOfStudy, graduationYear)
   ↓
2. createUserWithEmailAndPassword()
   ↓
3. Données sauvegardées dans localStorage (!):
   localStorage.setItem('pendingUserData', JSON.stringify(userDataToSave))
   ↓
4. Email de vérification envoyé
   ↓
5. User clique sur lien dans email
   ↓
6. useEffect détecte emailVerified = true
   ↓
7. Lecture localStorage
   ↓
8. Création profil Firestore avec les données
   ↓
9. localStorage nettoyé
```

---

## ⚠️ Problèmes Identifiés

### **Problème 1 : Dépendance à localStorage**

**Risques** :
- ❌ Si localStorage est vidé → données perdues
- ❌ Si user change de navigateur → données perdues
- ❌ Si user change d'appareil → données perdues
- ❌ Mode privé / incognito → localStorage non persistant

**Impact** :
```
User s'inscrit sur ordinateur
  → Valide email sur téléphone
  → localStorage vide sur téléphone
  → Profil créé SANS données (university, fieldOfStudy, etc.)
```

---

### **Problème 2 : Timing de Sauvegarde**

**Actuellement** :
```typescript
// AuthPage.tsx ligne ~688
const userDataToSave = {
  firstName, lastName, displayName,
  university: universityToSave,
  fieldOfStudy: fieldOfStudyToSave,
  graduationYear: parseInt(data.graduationYear),
  email: data.email,
  createdAt: new Date().toISOString(),
  emailVerified: false,
  isStudent: true,
  provider: 'email'
};

// Stockage TEMPORAIRE en localStorage
localStorage.setItem('pendingUserData', JSON.stringify(userDataToSave));
```

**Problème** :
- Données pas en Firestore immédiatement
- Profil créé seulement après validation email
- Si échec de validation → données perdues

---

### **Problème 3 : Affichage sur ProfilePage**

**Code actuel (ProfilePage.tsx ligne ~436)** :
```typescript
let university = profileData?.university || userProfile?.university || fallbackData.university || '';
let fieldOfStudy = profileData?.fieldOfStudy || userProfile?.fieldOfStudy || fallbackData.fieldOfStudy || '';
const graduationYear = profileData?.graduationYear || userProfile?.graduationYear || fallbackData.graduationYear || '';
```

**Problème** :
- Dépend de `userProfile` qui vient du `AuthContext`
- Si données pas dans Firestore → affichage vide
- Fallback pas toujours fiable

---

## ✅ Solutions Recommandées

### **Solution 1 : Créer Profil Firestore Immédiatement** (Recommandé)

```typescript
// ✅ MEILLEURE APPROCHE
const handleSignUp = async (data: SignUpFormData) => {
  setLoading(true);
  try {
    // 1. Créer compte Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    // 2. Préparer données
    const universityToSave = data.university === 'Autre université' 
      ? data.otherUniversity 
      : data.university;
    const fieldOfStudyToSave = data.fieldOfStudy === 'Autre' 
      ? data.otherFieldOfStudy 
      : data.fieldOfStudy;
    
    const userDataToSave = {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      university: universityToSave,
      otherUniversity: data.university === 'Autre université' ? data.otherUniversity : null,
      fieldOfStudy: fieldOfStudyToSave,
      otherFieldOfStudy: data.fieldOfStudy === 'Autre' ? data.otherFieldOfStudy : null,
      graduationYear: parseInt(data.graduationYear),
      email: data.email,
      createdAt: new Date().toISOString(),
      emailVerified: false, // Sera mis à true après validation
      profileCompleted: false, // Sera mis à true après validation
      isStudent: true,
      provider: 'email'
    };
    
    // 3. ✅ SAUVEGARDER IMMÉDIATEMENT DANS FIRESTORE
    await setDoc(doc(db, 'users', user.uid), userDataToSave);
    
    // 4. Envoyer email de vérification
    await sendEmailVerification(user, emailConfig.actionCodeSettings);
    
    // 5. Afficher écran de vérification
    setUserEmail(data.email);
    setEmailSent(true);
    
    // ✅ PAS DE localStorage !
    
  } catch (error) {
    // Gestion erreurs
  }
};
```

**Bénéfices** :
- ✅ Données sauvegardées immédiatement
- ✅ Pas de dépendance localStorage
- ✅ Fonctionne sur tous les appareils
- ✅ Profil toujours complet

---

### **Solution 2 : Améliorer useEffect de Vérification**

```typescript
// AuthPage.tsx - useEffect ligne ~193
useEffect(() => {
  const checkUserProfile = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        // Utilisateur sans profil - NE DEVRAIT PAS ARRIVER si Solution 1
        console.error('User profile not found!');
        return;
      }
      
      const userData = userDoc.data();
      
      // Si email validé, mettre à jour le profil
      if (currentUser.emailVerified && !userData.emailVerified) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          emailVerified: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        });
        
        // Rafraîchir pour afficher profil complet
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  checkUserProfile();
}, [currentUser]);
```

---

### **Solution 3 : Affichage Robuste sur ProfilePage**

```typescript
// ProfilePage.tsx - Améliorer l'affichage
const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      
      try {
        // Toujours fetch depuis Firestore pour avoir les dernières données
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
        } else {
          console.error('Profile not found in Firestore');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [currentUser]);
  
  // Affichage
  const university = profileData?.university || 'Université non spécifiée';
  const fieldOfStudy = profileData?.fieldOfStudy || 'Filière non spécifiée';
  const graduationYear = profileData?.graduationYear || 'Non spécifiée';
  
  // ...
};
```

---

## 📊 Comparaison Solutions

| Aspect | Actuel (localStorage) | Solution 1 (Firestore direct) |
|--------|----------------------|-------------------------------|
| **Sécurité données** | ⚠️ Faible (peut être perdu) | ✅ Élevée (persistant) |
| **Multi-appareils** | ❌ Ne fonctionne pas | ✅ Fonctionne partout |
| **Simplicité** | ⚠️ Complexe (2 étapes) | ✅ Simple (1 étape) |
| **Fiabilité** | ⚠️ Moyenne | ✅ Élevée |
| **Performance** | ✅ Rapide (local) | ✅ Rapide (1 write) |
| **Coût Firebase** | ✅ 0 writes initial | ⚠️ 1 write initial |

---

## 🎯 Plan d'Implémentation

### **Phase 1 : Sauvegarder dans Firestore Immédiatement**

**Fichier** : `src/pages/AuthPage.tsx`

**Modifications** :
1. Dans `handleSignUp` (ligne ~670) :
   - ✅ Remplacer `localStorage.setItem` par `setDoc(doc(db, 'users', user.uid), ...)`
   - ✅ Retirer lignes localStorage

2. Dans `useEffect` (ligne ~193) :
   - ✅ Simplifier la logique
   - ✅ Retirer lecture localStorage
   - ✅ Juste mettre à jour `emailVerified: true` après validation

**Temps estimé** : 30 minutes

---

### **Phase 2 : Améliorer AuthContext**

**Fichier** : `src/contexts/AuthContext.tsx`

**Modifications** :
1. Dans `createUserProfile` (ligne ~46) :
   - ✅ S'assurer que les données sont bien récupérées
   - ✅ Ajouter logs pour debugging

**Temps estimé** : 15 minutes

---

### **Phase 3 : Tester**

**Tests à effectuer** :
1. ✅ S'inscrire avec données complètes
2. ✅ Vérifier Firestore → profil créé immédiatement
3. ✅ Valider email
4. ✅ Vérifier Firestore → `emailVerified: true`
5. ✅ Aller sur `/profile`
6. ✅ Vérifier que toutes les données s'affichent

**Temps estimé** : 15 minutes

---

## 🔍 Comment Débugger Actuellement

### **1. Vérifier données dans localStorage**
```javascript
// Console navigateur
console.log(localStorage.getItem('pendingUserData'));
console.log(localStorage.getItem('pendingUserEmail'));
```

### **2. Vérifier profil Firestore**
```javascript
// Console Firebase
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

const checkProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  console.log('Profile exists:', userDoc.exists());
  console.log('Profile data:', userDoc.data());
};
```

### **3. Vérifier AuthContext**
```javascript
// Dans ProfilePage
console.log('Current User:', currentUser);
console.log('User Profile:', userProfile);
```

---

## ✅ Résumé

### **Problème Principal**
Les données d'inscription sont stockées dans `localStorage` temporairement et ne sont transférées vers Firestore qu'après validation email, ce qui peut causer des pertes de données.

### **Solution Recommandée**
Créer le profil Firestore **immédiatement** lors de l'inscription avec `emailVerified: false`, puis le mettre à jour après validation.

### **Impact**
- ✅ Plus fiable (données toujours sauvegardées)
- ✅ Fonctionne sur tous les appareils
- ✅ Code plus simple
- ⚠️ +1 write Firestore par inscription (~négligeable)

---

**Voulez-vous que j'implémente la Solution 1 ?** 🚀

