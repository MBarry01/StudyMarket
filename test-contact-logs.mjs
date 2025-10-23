// Alternative : Utiliser la table contact_logs existante
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testerContactLogs() {
  console.log('🔍 TEST DE LA TABLE contact_logs EXISTANTE');
  console.log('==========================================');
  console.log('');

  try {
    // Test de lecture
    console.log('1️⃣ Test de lecture...');
    const { data: readData, error: readError } = await supabase
      .from('contact_logs')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.log('❌ Erreur de lecture:', readError.message);
      return false;
    } else {
      console.log('✅ Lecture réussie');
      console.log('📊 Structure détectée :');
      if (readData && readData.length > 0) {
        console.log('   Colonnes:', Object.keys(readData[0]));
      } else {
        console.log('   Table vide, structure par défaut :');
        console.log('   - id (integer)');
        console.log('   - name (text)');
        console.log('   - email (text)');
        console.log('   - subject (text)');
        console.log('   - message (text)');
        console.log('   - created_at (timestamp)');
      }
    }

    // Test d'insertion
    console.log('');
    console.log('2️⃣ Test d\'insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Test Chatbot',
        email: 'test@studymarket.com',
        subject: 'Test automatique',
        message: 'Ceci est un test du chatbot avec la table contact_logs existante'
      }])
      .select();
    
    if (insertError) {
      console.log('❌ Erreur d\'insertion:', insertError.message);
      console.log('');
      console.log('🔧 SOLUTION - Configurer les politiques RLS :');
      console.log('🌐 https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('');
      console.log('```sql');
      console.log('-- Activer RLS sur contact_logs');
      console.log('ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Politique pour les utilisateurs authentifiés');
      console.log('CREATE POLICY "Allow authenticated users to insert contact_logs"');
      console.log('ON contact_logs FOR INSERT');
      console.log('TO authenticated');
      console.log('WITH CHECK (true);');
      console.log('');
      console.log('-- Politique pour les utilisateurs anonymes');
      console.log('CREATE POLICY "Allow anon users to insert contact_logs"');
      console.log('ON contact_logs FOR INSERT');
      console.log('TO anon');
      console.log('WITH CHECK (true);');
      console.log('');
      console.log('-- Politique pour le service role (lecture)');
      console.log('CREATE POLICY "Allow service role to read contact_logs"');
      console.log('ON contact_logs FOR SELECT');
      console.log('TO service_role');
      console.log('WITH CHECK (true);');
      console.log('```');
      return false;
    } else {
      console.log('✅ Insertion réussie !');
      console.log('✅ ID du message test:', insertData[0]?.id);
      
      // Nettoyer le test
      await supabase
        .from('contact_logs')
        .delete()
        .eq('id', insertData[0]?.id);
      
      console.log('✅ Test nettoyé');
      return true;
    }

  } catch (err) {
    console.log('❌ Erreur générale:', err.message);
    return false;
  }
}

testerContactLogs().then(success => {
  console.log('');
  if (success) {
    console.log('🎉 TABLE contact_logs FONCTIONNELLE !');
    console.log('');
    console.log('💡 RECOMMANDATION :');
    console.log('   Modifier le chatbot pour utiliser contact_logs');
    console.log('   au lieu de créer une nouvelle table contact_messages');
    console.log('');
    console.log('🔧 MODIFICATION REQUISE :');
    console.log('   1. Modifier ChatbotWidget.tsx');
    console.log('   2. Changer "contact_messages" en "contact_logs"');
    console.log('   3. Adapter la structure des données');
    console.log('   4. Tester le chatbot');
  } else {
    console.log('⚠️ TABLE contact_logs NÉCESSITE CONFIGURATION');
    console.log('');
    console.log('🔧 ÉTAPES REQUISES :');
    console.log('   1. Configurer les politiques RLS (SQL ci-dessus)');
    console.log('   2. OU créer la table contact_messages');
    console.log('   3. Configurer la fonction Edge contact-email');
    console.log('   4. Configurer les variables d\'environnement');
  }
});
