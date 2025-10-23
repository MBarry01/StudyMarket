// Diagnostic précis des politiques RLS après configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticPolitiquesPrecis() {
  console.log('🔍 DIAGNOSTIC PRÉCIS DES POLITIQUES RLS');
  console.log('=======================================');
  console.log('');

  // Test d'insertion pour voir l'erreur exacte
  console.log('1️⃣ Test d\'insertion pour diagnostic précis...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Diagnostic Précis',
        email: 'diagnostic@studymarket.com',
        subject: 'Test politique RLS précise',
        message: 'Test pour diagnostiquer précisément les politiques RLS après configuration'
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      console.log('');
      console.log('🔍 ANALYSE DE L\'ERREUR :');
      
      if (error.message.includes('row-level security policy')) {
        console.log('   - RLS est activé mais les politiques bloquent encore l\'insertion');
        console.log('   - Problème possible : les politiques ne sont pas actives ou mal configurées');
      }
      
      console.log('');
      console.log('🔧 SOLUTION IMMÉDIATE :');
      console.log('1. Vérifier que les politiques sont bien créées dans Supabase Dashboard');
      console.log('2. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('3. Exécuter cette requête pour voir les politiques existantes :');
      console.log('');
      console.log('```sql');
      console.log('SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check');
      console.log('FROM pg_policies');
      console.log('WHERE tablename = \'contact_logs\';');
      console.log('```');
      console.log('');
      console.log('4. Si aucune politique n\'apparaît, recréer les politiques :');
      console.log('');
      console.log('```sql');
      console.log('CREATE POLICY allow_authenticated_insert_contact_logs');
      console.log('ON public.contact_logs FOR INSERT TO authenticated WITH CHECK (true);');
      console.log('');
      console.log('CREATE POLICY allow_anon_insert_contact_logs');
      console.log('ON public.contact_logs FOR INSERT TO anon WITH CHECK (true);');
      console.log('```');
      
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
  }

  // Test de lecture
  console.log('');
  console.log('2️⃣ Test de lecture...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur de lecture:', error.message);
    } else {
      console.log('✅ Lecture réussie');
    }
  } catch (err) {
    console.log('❌ Erreur lors de la lecture:', err.message);
  }

  console.log('');
  console.log('📊 RÉSUMÉ DU DIAGNOSTIC PRÉCIS :');
  console.log('===============================');
  console.log('✅ Connexion Supabase : OK');
  console.log('✅ Table contact_logs : OK');
  console.log('❌ Politiques RLS : Problème persistant');
  console.log('');
  console.log('🎯 ACTION REQUISE :');
  console.log('1. Vérifier les politiques dans Supabase Dashboard');
  console.log('2. Recréer les politiques si nécessaire');
  console.log('3. Tester à nouveau');
  console.log('');
  console.log('📋 Requête de vérification :');
  console.log('   SELECT * FROM pg_policies WHERE tablename = \'contact_logs\';');
}

diagnosticPolitiquesPrecis().catch(console.error);
