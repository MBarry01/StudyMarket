# ✅ CHECKLIST - Prochaines Étapes

## 🎯 **Objectif : Finaliser la configuration et tester les uploads**

---

## 📋 **Tâches à effectuer**

### **Phase 1 : Configuration CORS** 🔧
- [ ] **Exécuter le script PowerShell** : `.\apply-cors.ps1`
- [ ] **Vérifier que CORS est appliqué** dans la console Firebase
- [ ] **Confirmer** que le bucket Storage accepte les requêtes cross-origin

### **Phase 2 : Tests d'Upload** 🧪
- [ ] **Tester l'upload de photo de profil**
  - [ ] Se connecter à l'application
  - [ ] Aller dans le profil utilisateur
  - [ ] Essayer d'uploader une image
  - [ ] Vérifier qu'il n'y a plus d'erreur `storage/unauthorized`
- [ ] **Tester l'upload d'images d'annonces**
  - [ ] Créer une nouvelle annonce
  - [ ] Ajouter des images
  - [ ] Vérifier que les uploads fonctionnent

### **Phase 3 : Vérification des Index** 📊
- [ ] **Utiliser IndexService.generateIndexReport()**
- [ ] **Identifier les index manquants** dans Firestore
- [ ] **Créer les index requis** dans la console Firebase
- [ ] **Vérifier** que les requêtes complexes fonctionnent

### **Phase 4 : Optimisations** 🚀
- [ ] **Tester la performance** des uploads
- [ ] **Vérifier la gestion des erreurs** réseau
- [ ] **Tester** avec différents types de fichiers
- [ ] **Valider** la sécurité des règles Storage

---

## 🚨 **Points d'attention**

### **Si erreur CORS persiste :**
- Vérifier que `gsutil` est installé
- Vérifier les permissions sur le bucket
- Contacter le support Firebase si nécessaire

### **Si erreur Storage persiste :**
- Vérifier que les règles sont bien publiées
- Vérifier la syntaxe des règles
- Tester avec un utilisateur authentifié

### **Si erreur Index :**
- Créer les index manquants un par un
- Attendre que les index soient construits
- Tester après construction complète

---

## 📞 **En cas de problème**

1. **Vérifier les logs** dans la console Firebase
2. **Consulter la documentation** Firebase
3. **Tester avec des règles simplifiées** temporairement
4. **Contacter le support** si le problème persiste

---

## 🎉 **Objectifs de la session**

- [x] ✅ Résoudre l'erreur `auth/invalid-api-key`
- [x] ✅ Résoudre l'erreur `storage/unauthorized`
- [x] ✅ Créer des règles Storage avancées
- [x] ✅ Optimiser la structure Firestore
- [x] ✅ Créer les services backend
- [ ] 🔄 Appliquer la configuration CORS
- [ ] 🔄 Tester les uploads d'images
- [ ] 🔄 Vérifier les index Firestore

---

*Checklist créée le 10 Août 2025* 📝
