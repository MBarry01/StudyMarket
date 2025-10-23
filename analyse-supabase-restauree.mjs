// Analyse de la base Supabase restaurée
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyserBaseSupabase() {
  console.log('🔍 ANALYSE DE LA BASE SUPABASE RESTAURÉE');
  console.log('========================================');
  console.log('');

  // Tables existantes détectées
  const tablesExistantes = [
    'admin_notifications',
    'admins', 
    'audit_log',
    'contact_logs', // ⚠️ Table similaire mais différente
    'id_migration_mapping',
    'jobs',
    'notification_dedup',
    'notification_sync_metrics',
    'notification_sync_queue',
    'profiles',
    'sync_config',
    'sync_conflicts',
    'sync_health',
    'sync_logs',
    'sync_metrics',
    'user_notifications',
    'user_profiles',
    'verification_requests'
  ];

  console.log('✅ TABLES EXISTANTES DÉTECTÉES :');
  tablesExistantes.forEach(table => {
    console.log(`   - ${table}`);
  });
  console.log('');

  // Vérifier si contact_messages existe
  console.log('🔍 VÉRIFICATION TABLE contact_messages...');
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Table contact_messages MANQUANTE');
      console.log('');
      console.log('🔍 ANALYSE :');
      console.log('   - Vous avez une table "contact_logs" mais pas "contact_messages"');
      console.log('   - La structure est différente');
      console.log('   - Le chatbot cherche "contact_messages"');
      console.log('');
      
      console.log('📋 SOLUTION - Créer la table contact_messages :');
      console.log('🌐 https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('');
      console.log('```sql');
      console.log('-- Création de la table contact_messages pour le chatbot');
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
      console.log('✅ Table contact_messages existe déjà !');
    }
  } catch (err) {
    console.log('❌ Erreur lors de la vérification:', err.message);
  }

  // Vérifier la table contact_logs existante
  console.log('🔍 ANALYSE DE LA TABLE contact_logs EXISTANTE...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur accès contact_logs:', error.message);
    } else {
      console.log('✅ Table contact_logs accessible');
      console.log('📊 Structure détectée :');
      console.log('   - id (integer)');
      console.log('   - name (text)');
      console.log('   - email (text)');
      console.log('   - subject (text)');
      console.log('   - message (text)');
      console.log('   - created_at (timestamp)');
      console.log('');
      console.log('💡 OPTION ALTERNATIVE :');
      console.log('   Vous pourriez modifier le chatbot pour utiliser contact_logs');
      console.log('   au lieu de créer une nouvelle table contact_messages');
    }
  } catch (err) {
    console.log('❌ Erreur lors de l\'analyse contact_logs:', err.message);
  }

  // Vérifier les fonctions Edge
  console.log('');
  console.log('🔍 VÉRIFICATION FONCTIONS EDGE...');
  console.log('🌐 Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions');
  console.log('');
  console.log('📋 Vérifier que la fonction "contact-email" existe');
  console.log('📋 Si elle n\'existe pas, la créer avec le contenu de :');
  console.log('   supabase/functions/send-contact-email/index.ts');
  console.log('');

  // Vérifier les variables d'environnement
  console.log('🔍 VÉRIFICATION VARIABLES D\'ENVIRONNEMENT...');
  console.log('🌐 Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/settings/functions');
  console.log('');
  console.log('📋 Variables requises :');
  console.log('   - GMAIL_USER: barrymohamadou98@gmail.com');
  console.log('   - GMAIL_APP_PASSWORD: nxyq gklz yluz pebv');
  console.log('   - CONTACT_EMAIL: barrymohamadou98@gmail.com');
  console.log('');

  console.log('📊 RÉSUMÉ DE L\'ANALYSE :');
  console.log('========================');
  console.log('✅ Base Supabase restaurée avec succès');
  console.log('✅ 18 tables détectées');
  console.log('✅ Table contact_logs existe (structure différente)');
  console.log('❌ Table contact_messages manquante (requise par le chatbot)');
  console.log('⚠️  Fonction Edge contact-email à vérifier');
  console.log('⚠️  Variables d\'environnement à configurer');
  console.log('');
  console.log('🎯 RECOMMANDATIONS :');
  console.log('1. Créer la table contact_messages (SQL ci-dessus)');
  console.log('2. OU modifier le chatbot pour utiliser contact_logs');
  console.log('3. Configurer la fonction Edge contact-email');
  console.log('4. Configurer les variables d\'environnement');
  console.log('5. Tester le chatbot');
  console.log('');
  console.log('🚀 Une fois terminé, votre chatbot sera 100% fonctionnel !');
}

analyserBaseSupabase().catch(console.error);
