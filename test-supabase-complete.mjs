// Configuration automatisée Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableAndTest() {
  try {
    console.log('🔍 Test de connexion Supabase...');
    
    // Test de connexion basique
    const { data, error } = await supabase
      .from('contact_messages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Table n\'existe pas encore:', error.message);
      console.log('');
      console.log('🚨 ACTION REQUISE :');
      console.log('');
      console.log('1. 🌐 Ouvrir Supabase Dashboard :');
      console.log('   https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('');
      console.log('2. 📊 Exécuter ce SQL dans SQL Editor :');
      console.log('');
      console.log('```sql');
      console.log('-- Table pour les messages de contact');
      console.log('CREATE TABLE IF NOT EXISTS contact_messages (');
      console.log('    id BIGSERIAL PRIMARY KEY,');
      console.log('    name TEXT NOT NULL,');
      console.log('    email TEXT NOT NULL,');
      console.log('    subject TEXT NOT NULL,');
      console.log('    message TEXT NOT NULL,');
      console.log('    user_id TEXT,');
      console.log('    status TEXT DEFAULT \'nouveau\',');
      console.log('    created_at TIMESTAMPTZ DEFAULT NOW()');
      console.log(');');
      console.log('');
      console.log('-- Activer RLS (Row Level Security)');
      console.log('ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Politiques pour permettre l\'insertion');
      console.log('CREATE POLICY "Allow authenticated users to insert contact messages"');
      console.log('ON contact_messages FOR INSERT');
      console.log('TO authenticated');
      console.log('WITH CHECK (true);');
      console.log('');
      console.log('CREATE POLICY "Allow anon users to insert contact messages"');
      console.log('ON contact_messages FOR INSERT');
      console.log('TO anon');
      console.log('WITH CHECK (true);');
      console.log('```');
      console.log('');
      console.log('3. 🔧 Configurer les variables d\'environnement :');
      console.log('   https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/settings/functions');
      console.log('');
      console.log('   Variables à ajouter :');
      console.log('   - GMAIL_USER: barrymohamadou98@gmail.com');
      console.log('   - GMAIL_APP_PASSWORD: nxyq gklz yluz pebv');
      console.log('   - CONTACT_EMAIL: barrymohamadou98@gmail.com');
      console.log('');
      console.log('4. 🚀 Créer la fonction Edge :');
      console.log('   https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions');
      console.log('   - Nom: contact-email');
      console.log('   - Copier le contenu de supabase/functions/send-contact-email/index.ts');
      console.log('');
      console.log('5. 🧪 Tester :');
      console.log('   - Redémarrer l\'app: npm run dev');
      console.log('   - Tester le chatbot');
      console.log('');
      
      return false;
    } else {
      console.log('✅ Connexion Supabase réussie !');
      console.log('✅ Table contact_messages existe');
      
      // Test d'insertion
      console.log('🧪 Test d\'insertion...');
      const { data: insertData, error: insertError } = await supabase
        .from('contact_messages')
        .insert([{
          name: 'Test',
          email: 'test@example.com',
          subject: 'Test de connexion',
          message: 'Ceci est un test automatique',
          user_id: null,
          status: 'nouveau'
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Erreur d\'insertion:', insertError.message);
        return false;
      } else {
        console.log('✅ Insertion réussie !');
        console.log('✅ ID du message:', insertData[0]?.id);
        
        // Nettoyer le test
        await supabase
          .from('contact_messages')
          .delete()
          .eq('id', insertData[0]?.id);
        
        console.log('✅ Test nettoyé');
        return true;
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

createTableAndTest().then(success => {
  if (success) {
    console.log('');
    console.log('🎉 Supabase est correctement configuré !');
    console.log('🎯 Le chatbot devrait maintenant fonctionner.');
  } else {
    console.log('');
    console.log('⚠️ Configuration Supabase requise');
    console.log('📋 Suivez les étapes ci-dessus pour terminer la configuration');
  }
});
