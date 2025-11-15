# 🤖 Configuration DeepSeek pour le Chatbot

## 🎯 Vue d'ensemble

Le chatbot StudyMarket utilise maintenant **DeepSeek AI** comme LLM principal pour des réponses plus robustes et intelligentes.

## ✨ Améliorations apportées

### Robustesse
- ✅ **Retry logic** : 3 tentatives automatiques en cas d'échec
- ✅ **Timeout protection** : 30 secondes maximum par requête
- ✅ **Rate limit handling** : Gestion intelligente avec backoff exponentiel
- ✅ **Fallback automatique** : Retour au NLP si l'API échoue

### Intelligence
- ✅ **Prompt système amélioré** : Contexte complet de la plateforme
- ✅ **Compréhension contextuelle** : Utilise l'historique de conversation
- ✅ **Adaptation au contexte** : S'adapte à la page actuelle de l'utilisateur
- ✅ **Réponses naturelles** : Langage plus humain et adaptatif

## 🔧 Configuration

### Étape 1 : Créer/Modifier le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet (ou modifiez votre `.env` existant) :

```env
# DeepSeek AI Configuration
VITE_DEEPSEEK_API_KEY=sk-585efd7af14b42ea87a06ca2238526f8
VITE_DEEPSEEK_ENABLED=true
VITE_DEEPSEEK_MODEL=deepseek-chat
```

### Étape 2 : Redémarrer le serveur de développement

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### Étape 3 : Vérifier l'activation

Ouvrez la console du navigateur (F12) et cherchez :
```
✅ DeepSeek LLM enabled
🔑 API Key configured: sk-585efd7af14b...
📦 Model: deepseek-chat
```

## 🎛️ Options de configuration

### Modèles disponibles

- `deepseek-chat` (par défaut) - Modèle conversationnel standard
- `deepseek-coder` - Optimisé pour le code (si besoin)

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `VITE_DEEPSEEK_API_KEY` | Clé API DeepSeek | (requis) |
| `VITE_DEEPSEEK_ENABLED` | Activer DeepSeek | `true` |
| `VITE_DEEPSEEK_MODEL` | Modèle à utiliser | `deepseek-chat` |

## 🔄 Fallback automatique

Le système utilise une hiérarchie de fallback :

1. **DeepSeek** (si activé et clé configurée)
2. **OpenAI** (si DeepSeek non disponible mais OpenAI activé)
3. **NLP Engine** (système local, toujours disponible)

## 🧪 Test

### Test manuel

1. Ouvrir l'application
2. Cliquer sur le chatbot (coin bas-droit)
3. Poser une question complexe : "t'es qui ?"
4. Vérifier que la réponse est intelligente et contextuelle

### Test dans la console

```javascript
// Vérifier que le service est activé
console.log('DeepSeek enabled:', import.meta.env.VITE_DEEPSEEK_ENABLED);
```

## 🐛 Dépannage

### Le chatbot ne répond pas intelligemment

1. Vérifier que `VITE_DEEPSEEK_ENABLED=true`
2. Vérifier que la clé API est correcte
3. Vérifier la console pour les erreurs
4. Redémarrer le serveur de développement

### Erreurs de rate limit

Le système gère automatiquement les rate limits avec retry. Si le problème persiste :
- Vérifier votre quota DeepSeek
- Attendre quelques minutes
- Le système basculera automatiquement sur le NLP

### Timeout errors

Si vous voyez des erreurs de timeout :
- Vérifier votre connexion internet
- Le système retentera automatiquement 3 fois
- Après 3 échecs, bascule sur le NLP

## 📊 Métriques

Le chatbot enregistre automatiquement :
- Taux de succès des appels API
- Temps de réponse moyen
- Nombre de retries
- Taux de fallback vers NLP

## 🔒 Sécurité

⚠️ **Important** : Ne jamais commiter le fichier `.env.local` avec votre clé API dans Git.

Le fichier `.env.local` est déjà dans `.gitignore` par défaut.

## 📚 Documentation DeepSeek

- [Documentation officielle](https://platform.deepseek.com/docs)
- [Modèles disponibles](https://platform.deepseek.com/docs/models)
- [Tarification](https://platform.deepseek.com/pricing)

