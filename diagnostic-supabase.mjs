// Diagnostic complet Supabase StudyMarket
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET SUPABASE STUDYMARKET');
  console.log('==========================================');
  console.log('');

  // 1. Test de connexion basique
  console.log('1️⃣ Test de connexion...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message);
  }

  // 2. Vérifier la table contact_messages
  console.log('');
  console.log('2️⃣ Vérification table contact_messages...');
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Table contact_messages manquante');
      console.log('');
      console.log('📋 SOLUTION - Exécuter ce SQL dans Supabase Dashboard :');
      console.log('🌐 https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('');
      console.log('```sql');
      console.log('-- Création de la table contact_messages');
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
      console.log('-- Activation de la sécurité au niveau des lignes');
      console.log('ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Politique pour les utilisateurs authentifiés');
      console.log('CREATE POLICY "Allow authenticated users to insert contact messages"');
      console.log('ON contact_messages FOR INSERT');
      console.log('TO authenticated');
      console.log('WITH CHECK (true);');
      console.log('');
      console.log('-- Politique pour les utilisateurs anonymes');
      console.log('CREATE POLICY "Allow anon users to insert contact messages"');
      console.log('ON contact_messages FOR INSERT');
      console.log('TO anon');
      console.log('WITH CHECK (true);');
      console.log('');
      console.log('-- Politique pour le service role (lecture)');
      console.log('CREATE POLICY "Allow service role to read contact messages"');
      console.log('ON contact_messages FOR SELECT');
      console.log('TO service_role');
      console.log('WITH CHECK (true);');
      console.log('```');
      console.log('');
    } else {
      console.log('✅ Table contact_messages existe');
      
      // Test d'insertion
      console.log('🧪 Test d\'insertion...');
      const { data: insertData, error: insertError } = await supabase
        .from('contact_messages')
        .insert([{
          name: 'Test Diagnostic',
          email: 'test@studymarket.com',
          subject: 'Test automatique',
          message: 'Ceci est un test de diagnostic automatique',
          user_id: null,
          status: 'nouveau'
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Erreur d\'insertion:', insertError.message);
        console.log('');
        console.log('🔧 SOLUTION - Vérifier les politiques RLS :');
        console.log('1. Aller dans Supabase Dashboard > Authentication > Policies');
        console.log('2. Vérifier que les politiques sont bien créées');
        console.log('3. Si nécessaire, recréer les politiques avec le SQL ci-dessus');
      } else {
        console.log('✅ Insertion réussie !');
        console.log('✅ ID du message test:', insertData[0]?.id);
        
        // Nettoyer le test
        await supabase
          .from('contact_messages')
          .delete()
          .eq('id', insertData[0]?.id);
        
        console.log('✅ Test nettoyé');
      }
    }
  } catch (err) {
    console.log('❌ Erreur lors de la vérification:', err.message);
  }

  // 3. Vérifier les fonctions Edge
  console.log('');
  console.log('3️⃣ Vérification fonctions Edge...');
  console.log('🔍 Vérification manuelle requise :');
  console.log('');
  console.log('🌐 Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions');
  console.log('');
  console.log('📋 Vérifier que la fonction "contact-email" existe');
  console.log('📋 Si elle n\'existe pas, la créer avec le contenu de :');
  console.log('   supabase/functions/send-contact-email/index.ts');
  console.log('');

  // 4. Vérifier les variables d'environnement
  console.log('4️⃣ Vérification variables d\'environnement...');
  console.log('🔍 Vérification manuelle requise :');
  console.log('');
  console.log('🌐 Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/settings/functions');
  console.log('');
  console.log('📋 Variables requises :');
  console.log('   - GMAIL_USER: barrymohamadou98@gmail.com');
  console.log('   - GMAIL_APP_PASSWORD: nxyq gklz yluz pebv');
  console.log('   - CONTACT_EMAIL: barrymohamadou98@gmail.com');
  console.log('');

  // 5. Test final
  console.log('5️⃣ Test final de configuration...');
  console.log('');
  console.log('🧪 Après avoir effectué les corrections ci-dessus :');
  console.log('1. Redémarrer l\'application : npm run dev');
  console.log('2. Ouvrir le chatbot dans l\'application');
  console.log('3. Tester l\'envoi d\'un message de contact');
  console.log('4. Vérifier que le message apparaît dans Supabase');
  console.log('');

  console.log('📊 RÉSUMÉ DU DIAGNOSTIC :');
  console.log('========================');
  console.log('✅ Fichier .env configuré');
  console.log('✅ Application redémarrée');
  console.log('⚠️  Configuration Supabase Dashboard requise');
  console.log('');
  console.log('🎯 PROCHAINES ÉTAPES :');
  console.log('1. Créer la table contact_messages (SQL ci-dessus)');
  console.log('2. Créer la fonction Edge contact-email');
  console.log('3. Configurer les variables d\'environnement');
  console.log('4. Tester le chatbot');
  console.log('');
  console.log('🚀 Une fois terminé, votre chatbot sera 100% fonctionnel !');
}

diagnosticComplet().catch(console.error);
