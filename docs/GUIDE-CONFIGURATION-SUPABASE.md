# 🚀 Configuration Supabase - Guide Rapide

## ✅ Ce qui a été fait automatiquement

### 1. **Fichier .env créé** ✅
- URL Supabase : `https://kbbhglxrcywpcktkamhl.supabase.co`
- Clé API configurée
- Variables Gmail configurées
- Variables Algolia configurées

### 2. **Application redémarrée** ✅
- Variables d'environnement chargées
- Configuration Supabase active

## 🔧 Étapes manuelles à faire dans Supabase Dashboard

### **Étape 1 : Créer la table contact_messages**
1. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor
2. Cliquer sur "New query"
3. Copier et exécuter ce SQL :

```sql
-- Table pour les messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id TEXT,
    status TEXT DEFAULT 'nouveau',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour permettre l'insertion
CREATE POLICY "Allow authenticated users to insert contact messages"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert contact messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Politique pour permettre la lecture (optionnel, pour l'admin)
CREATE POLICY "Allow service role to read contact messages"
ON contact_messages FOR SELECT
TO service_role
WITH CHECK (true);
```

### **Étape 2 : Configurer les variables d'environnement**
1. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/settings/functions
2. Dans "Environment variables", ajouter :

| Variable | Valeur |
|----------|--------|
| `GMAIL_USER` | `barrymohamadou98@gmail.com` |
| `GMAIL_APP_PASSWORD` | `nxyq gklz yluz pebv` |
| `CONTACT_EMAIL` | `barrymohamadou98@gmail.com` |

### **Étape 3 : Déployer la fonction Edge**
1. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions
2. Cliquer sur "Create function"
3. Nom : `contact-email`
4. Copier le contenu de `supabase/functions/send-contact-email/index.ts`

## 🧪 Test de la configuration

### **Test automatique**
```bash
node test-supabase-connection.mjs
```

### **Test manuel**
1. Ouvrir l'application : http://localhost:5173/StudyMarket/
2. Cliquer sur le chatbot (coin bas-droit)
3. Aller dans "Nous contacter"
4. Remplir le formulaire et envoyer
5. Vérifier que le message est sauvegardé dans Supabase

## 🎯 Résultat attendu

Après configuration complète :
- ✅ **Chatbot fonctionnel** : Plus d'erreur "Service temporairement indisponible"
- ✅ **Messages sauvegardés** : Dans la table `contact_messages`
- ✅ **Emails envoyés** : Via Gmail SMTP
- ✅ **Interface propre** : Plus d'indicateur "Mode hors ligne"

## 🚨 En cas de problème

### **Erreur "Table n'existe pas"**
- Vérifier que le SQL a été exécuté dans Supabase
- Vérifier les permissions RLS

### **Erreur "Configuration email manquante"**
- Vérifier les variables d'environnement dans Supabase
- Vérifier que le mot de passe Gmail est correct

### **Erreur de connexion**
- Vérifier l'URL Supabase dans `.env`
- Vérifier la clé API Supabase

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs Supabase dans le dashboard
3. Tester avec `node test-supabase-connection.mjs`

---

**🎉 Une fois terminé, votre chatbot StudyMarket sera 100% fonctionnel !**
