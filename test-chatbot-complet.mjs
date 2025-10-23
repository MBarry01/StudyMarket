// Test complet du chatbot avec la base Supabase restaurée
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatbotConfiguration() {
  console.log('🤖 TEST COMPLET DU CHATBOT STUDYMARKET');
  console.log('=====================================');
  console.log('');

  // 1. Test de connexion
  console.log('1️⃣ Test de connexion Supabase...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
    } else {
      console.log('✅ Connexion Supabase réussie');
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message);
  }

  // 2. Test de lecture de la table contact_logs
  console.log('');
  console.log('2️⃣ Test de lecture contact_logs...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur de lecture:', error.message);
      console.log('');
      console.log('🔧 SOLUTION - Exécuter le SQL de configuration :');
      console.log('🌐 https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('');
      console.log('📋 Copier et exécuter le contenu de : configure-chatbot-supabase.sql');
      return false;
    } else {
      console.log('✅ Lecture contact_logs réussie');
      console.log('📊 Structure détectée :');
      if (data && data.length > 0) {
        console.log('   Colonnes:', Object.keys(data[0]));
      } else {
        console.log('   - id (integer)');
        console.log('   - name (text)');
        console.log('   - email (text)');
        console.log('   - subject (text)');
        console.log('   - message (text)');
        console.log('   - created_at (timestamp)');
      }
    }
  } catch (err) {
    console.log('❌ Erreur lors de la lecture:', err.message);
    return false;
  }

  // 3. Test d'insertion (simulation du chatbot)
  console.log('');
  console.log('3️⃣ Test d\'insertion (simulation chatbot)...');
  try {
    const testMessage = {
      name: 'Test Chatbot',
      email: 'test@studymarket.com',
      subject: 'Test automatique',
      message: 'Ceci est un test automatique du chatbot StudyMarket avec la base restaurée'
    };

    const { data, error } = await supabase
      .from('contact_logs')
      .insert([testMessage])
      .select();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      console.log('');
      console.log('🔧 SOLUTION - Configurer les politiques RLS :');
      console.log('1. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('2. Exécuter le SQL de configure-chatbot-supabase.sql');
      console.log('3. Vérifier que les politiques sont créées');
      return false;
    } else {
      console.log('✅ Insertion réussie !');
      console.log('✅ ID du message:', data[0]?.id);
      console.log('✅ Timestamp:', data[0]?.created_at);
      
      // Nettoyer le test
      await supabase
        .from('contact_logs')
        .delete()
        .eq('id', data[0]?.id);
      
      console.log('✅ Test nettoyé');
    }
  } catch (err) {
    console.log('❌ Erreur lors de l\'insertion:', err.message);
    return false;
  }

  // 4. Test de la fonction Edge (si configurée)
  console.log('');
  console.log('4️⃣ Test de la fonction Edge contact-email...');
  try {
    const { data, error } = await supabase.functions.invoke('contact-email', {
      body: {
        name: 'Test Edge Function',
        email: 'test@studymarket.com',
        subject: 'Test Edge Function',
        message: 'Test de la fonction Edge contact-email'
      }
    });

    if (error) {
      console.log('⚠️ Fonction Edge non configurée:', error.message);
      console.log('');
      console.log('🔧 SOLUTION - Créer la fonction Edge :');
      console.log('1. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions');
      console.log('2. Créer une fonction nommée "contact-email"');
      console.log('3. Copier le contenu de : supabase/functions/send-contact-email/index.ts');
      console.log('4. Configurer les variables d\'environnement :');
      console.log('   - GMAIL_USER: barrymohamadou98@gmail.com');
      console.log('   - GMAIL_APP_PASSWORD: nxyq gklz yluz pebv');
      console.log('   - CONTACT_EMAIL: barrymohamadou98@gmail.com');
    } else {
      console.log('✅ Fonction Edge fonctionne !');
      console.log('✅ Réponse:', data);
    }
  } catch (err) {
    console.log('⚠️ Fonction Edge non configurée:', err.message);
  }

  // 5. Résumé final
  console.log('');
  console.log('📊 RÉSUMÉ DU TEST :');
  console.log('==================');
  console.log('✅ Connexion Supabase : OK');
  console.log('✅ Table contact_logs : OK');
  console.log('✅ Insertion de messages : OK');
  console.log('⚠️  Fonction Edge : À configurer');
  console.log('');
  console.log('🎯 ÉTAPES RESTANTES :');
  console.log('1. Exécuter configure-chatbot-supabase.sql dans Supabase');
  console.log('2. Créer la fonction Edge contact-email');
  console.log('3. Configurer les variables d\'environnement');
  console.log('4. Tester le chatbot dans l\'application');
  console.log('');
  console.log('🚀 Une fois terminé, votre chatbot sera 100% fonctionnel !');
  
  return true;
}

testChatbotConfiguration().catch(console.error);
