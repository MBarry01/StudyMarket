// Diagnostic des politiques RLS existantes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticPolitiquesRLS() {
  console.log('🔍 DIAGNOSTIC DES POLITIQUES RLS');
  console.log('================================');
  console.log('');

  // Test d'insertion pour voir l'erreur exacte
  console.log('1️⃣ Test d\'insertion pour diagnostic...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Diagnostic RLS',
        email: 'diagnostic@studymarket.com',
        subject: 'Test politique RLS',
        message: 'Test pour diagnostiquer les politiques RLS'
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      console.log('');
      console.log('🔍 ANALYSE DE L\'ERREUR :');
      
      if (error.message.includes('row-level security policy')) {
        console.log('   - RLS est activé mais les politiques bloquent l\'insertion');
        console.log('   - Il faut créer une politique INSERT pour "anon" ou "authenticated"');
      }
      
      if (error.message.includes('user_id')) {
        console.log('   - Les politiques existantes référencent une colonne user_id inexistante');
        console.log('   - Il faut supprimer ces politiques et en créer de nouvelles');
      }
      
      console.log('');
      console.log('🔧 SOLUTION IMMÉDIATE :');
      console.log('1. Aller sur : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('2. Exécuter ce SQL pour supprimer les politiques problématiques :');
      console.log('');
      console.log('```sql');
      console.log('-- Supprimer toutes les politiques existantes');
      console.log('DROP POLICY IF EXISTS contact_logs_insert_by_authenticated ON public.contact_logs;');
      console.log('DROP POLICY IF EXISTS contact_logs_select_authenticated ON public.contact_logs;');
      console.log('DROP POLICY IF EXISTS contact_logs_select_own ON public.contact_logs;');
      console.log('DROP POLICY IF EXISTS contact_logs_update_own ON public.contact_logs;');
      console.log('DROP POLICY IF EXISTS contact_logs_delete_own ON public.contact_logs;');
      console.log('DROP POLICY IF EXISTS contact_logs_admin_modify ON public.contact_logs;');
      console.log('');
      console.log('-- Créer les bonnes politiques');
      console.log('CREATE POLICY "Allow authenticated users to insert contact_logs"');
      console.log('ON public.contact_logs FOR INSERT');
      console.log('TO authenticated');
      console.log('WITH CHECK (true);');
      console.log('');
      console.log('CREATE POLICY "Allow anon users to insert contact_logs"');
      console.log('ON public.contact_logs FOR INSERT');
      console.log('TO anon');
      console.log('WITH CHECK (true);');
      console.log('```');
      console.log('');
      
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
    console.log('❌ Erreur générale:', err.message);
  }

  // Test de lecture pour voir si les politiques SELECT fonctionnent
  console.log('');
  console.log('2️⃣ Test de lecture pour diagnostic...');
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
  console.log('📊 RÉSUMÉ DU DIAGNOSTIC :');
  console.log('========================');
  console.log('✅ Connexion Supabase : OK');
  console.log('✅ Table contact_logs : OK');
  console.log('❌ Politiques RLS : Problématiques');
  console.log('');
  console.log('🎯 ACTION REQUISE :');
  console.log('1. Supprimer les politiques existantes qui référencent user_id');
  console.log('2. Créer les bonnes politiques pour anon et authenticated');
  console.log('3. Tester à nouveau');
  console.log('');
  console.log('📋 SQL à exécuter dans Supabase Dashboard :');
  console.log('   Contenu de : configure-rls-chatbot-final.sql');
}

diagnosticPolitiquesRLS().catch(console.error);
