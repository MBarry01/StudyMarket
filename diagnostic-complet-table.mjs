// Test de diagnostic complet de la table contact_logs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticCompletTable() {
  console.log('🔍 DIAGNOSTIC COMPLET DE LA TABLE contact_logs');
  console.log('=============================================');
  console.log('');

  // Test 1: Vérifier la structure de la table
  console.log('1️⃣ Test de structure de la table...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur de lecture:', error.message);
      console.log('❌ Code:', error.code);
    } else {
      console.log('✅ Lecture réussie');
      if (data && data.length > 0) {
        console.log('📊 Structure détectée:', Object.keys(data[0]));
      } else {
        console.log('📊 Table vide, structure par défaut :');
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
  }

  // Test 2: Test d'insertion avec données minimales
  console.log('');
  console.log('2️⃣ Test d\'insertion avec données minimales...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Test',
        email: 'test@test.com',
        subject: 'Test',
        message: 'Test'
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      console.log('❌ Code:', error.code);
      console.log('❌ Détails:', error.details);
      console.log('❌ Hint:', error.hint);
      
      console.log('');
      console.log('🔍 ANALYSE :');
      if (error.message.includes('row-level security')) {
        console.log('   - RLS est encore activé malgré la désactivation');
        console.log('   - Problème possible : cache ou politique persistante');
      }
      if (error.message.includes('permission denied')) {
        console.log('   - Problème de permissions au niveau de la base de données');
        console.log('   - Possible : utilisateur anon n\'a pas les droits INSERT');
      }
      
      console.log('');
      console.log('🔧 SOLUTIONS ALTERNATIVES :');
      console.log('1. Vérifier que RLS est vraiment désactivé :');
      console.log('   SELECT relrowsecurity FROM pg_class WHERE relname = \'contact_logs\';');
      console.log('');
      console.log('2. Donner les permissions directement à anon :');
      console.log('   GRANT INSERT ON public.contact_logs TO anon;');
      console.log('');
      console.log('3. Utiliser une autre table temporaire :');
      console.log('   CREATE TABLE contact_logs_temp AS SELECT * FROM contact_logs;');
      
    } else {
      console.log('✅ Insertion réussie !');
      console.log('✅ ID:', data[0]?.id);
      
      // Nettoyer
      await supabase
        .from('contact_logs')
        .delete()
        .eq('id', data[0]?.id);
      
      console.log('✅ Test nettoyé');
    }
  } catch (err) {
    console.log('❌ Erreur lors de l\'insertion:', err.message);
  }

  // Test 3: Vérifier les permissions
  console.log('');
  console.log('3️⃣ Recommandations pour vérifier les permissions...');
  console.log('Exécuter dans Supabase Dashboard :');
  console.log('');
  console.log('```sql');
  console.log('-- Vérifier si RLS est vraiment désactivé');
  console.log('SELECT relrowsecurity FROM pg_class WHERE relname = \'contact_logs\';');
  console.log('');
  console.log('-- Vérifier les permissions sur la table');
  console.log('SELECT grantee, privilege_type');
  console.log('FROM information_schema.table_privileges');
  console.log('WHERE table_name = \'contact_logs\';');
  console.log('');
  console.log('-- Donner les permissions à anon si nécessaire');
  console.log('GRANT INSERT ON public.contact_logs TO anon;');
  console.log('GRANT SELECT ON public.contact_logs TO anon;');
  console.log('```');
}

diagnosticCompletTable().catch(console.error);
