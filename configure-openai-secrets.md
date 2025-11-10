# 🤖 Configuration OpenAI pour GitHub Pages

## 🎯 Ajouter vos secrets OpenAI dans GitHub

### Étape 1 : Aller sur GitHub Settings

1. Ouvrir votre navigateur
2. Aller sur : https://github.com/MBarry01/StudyMarket/settings/secrets/actions
3. Cliquer sur **"New repository secret"**

### Étape 2 : Ajouter la clé API OpenAI

**Name** : `VITE_OPENAI_API_KEY`

**Secret** : 
```
VOTRE_CLE_API_OPENAI_ICI
```

Cliquer **"Add secret"**

### Étape 3 : Activer OpenAI

**Name** : `VITE_OPENAI_ENABLED`

**Secret** : `true`

Cliquer **"Add secret"**

---

## ✅ Vérification

Une fois les secrets ajoutés :

1. **Push un commit** pour déclencher le déploiement :
   ```bash
   git add .
   git commit -m "Add OpenAI configuration"
   git push origin main
   ```

2. **Vérifier le déploiement** :
   - Aller sur : https://github.com/MBarry01/StudyMarket/actions
   - Vérifier que le workflow "Deploy to GitHub Pages" est réussi

3. **Tester le chatbot** :
   - Ouvrir votre site : https://MBarry01.github.io/StudyMarket
   - Ouvrir le chatbot
   - Taper quelque chose que le NLP ne comprend pas
   - Le chatbot devrait utiliser OpenAI GPT pour répondre

---

## 🎊 Résultat

✅ Le chatbot est maintenant **100% intelligent** avec OpenAI GPT !

- **NLP local** : Réponses rapides pour les intentions claires
- **OpenAI GPT** : Réponses intelligentes pour les cas complexes

---

## 📝 Notes importantes

⚠️ **Sécurité** : Ne JAMAIS commiter la clé API dans le code !
- ✅ Utiliser GitHub Secrets (comme ci-dessus)
- ❌ Ne PAS mettre dans `.env` qui est commité
- ✅ Utiliser `.env` UNIQUEMENT en local

🔐 **Coûts** : OpenAI GPT coûte de l'argent
- ~$0.002 par conversation
- Surveiller l'utilisation sur https://platform.openai.com/usage





