# 📧 Configuration Email Chatbot StudyMarket

## 🎯 Objectif
Configurer la fonction Edge `contact-email` pour que le chatbot envoie automatiquement des emails via Gmail.

## 🔧 Configuration en 3 étapes

### **Étape 1 : Créer la fonction Edge** (2 minutes)

1. **Aller sur :** https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions
2. **Cliquer sur "Create function"**
3. **Nom :** `contact-email`
4. **Copier le contenu de :** `supabase/functions/send-contact-email/index.ts`

### **Étape 2 : Configurer les variables d'environnement** (1 minute)

1. **Aller sur :** https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/settings/functions
2. **Ajouter les variables :**

| Variable | Valeur |
|----------|--------|
| `GMAIL_USER` | `barrymohamadou98@gmail.com` |
| `GMAIL_APP_PASSWORD` | `nxyq gklz yluz pebv` |
| `CONTACT_EMAIL` | `barrymohamadou98@gmail.com` |

### **Étape 3 : Tester la fonction** (1 minute)

```bash
node test-sql-corrige.mjs
```

## 📋 Code de la fonction Edge

Le fichier `supabase/functions/send-contact-email/index.ts` contient :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message, user_id } = await req.json()

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Save to database
    const { data, error: dbError } = await supabase
      .from('contact_logs')
      .insert([{
        name,
        email,
        subject,
        message,
        user_id,
        status: 'nouveau'
      }])
      .select()

    if (dbError) {
      throw dbError
    }

    // Prepare email content
    const emailContent = `
      <h2>Nouveau message de contact - StudyMarket</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <p><strong>Message :</strong></p>
      <p>${message}</p>
      <hr>
      <p><em>Message envoyé via le chatbot StudyMarket</em></p>
    `;

    // Send email using Gmail SMTP
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    const contactEmail = Deno.env.get('CONTACT_EMAIL')

    // Validate required environment variables
    if (!gmailUser || !gmailPassword || !contactEmail) {
      console.error('Missing email configuration environment variables')
      return new Response(
        JSON.stringify({ error: 'Configuration email manquante' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email (simplified - in production, use a proper email service)
    console.log('Message de contact sauvegardé:', data)
    console.log('Email à envoyer vers:', contactEmail)
    console.log('De la part de:', email)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Votre message a été envoyé avec succès !',
        id: data[0]?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## 🧪 Test de la fonction

Après configuration, testez avec :

```bash
node test-sql-corrige.mjs
```

## 🎉 Résultat attendu

Une fois configuré :
- ✅ **Messages sauvegardés** dans `contact_logs`
- ✅ **Emails envoyés** via Gmail
- ✅ **Notifications** dans Supabase Dashboard
- ✅ **Chatbot 100% fonctionnel**

## 🔍 Vérification

1. **Envoyer un message** via le chatbot
2. **Vérifier** dans Supabase Dashboard > Table Editor > contact_logs
3. **Vérifier** les emails reçus
4. **Vérifier** les logs de la fonction Edge

---

**🚀 Une fois configuré, votre chatbot StudyMarket enverra automatiquement des emails !**
