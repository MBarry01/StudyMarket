// Test spécifique pour identifier le rôle utilisé
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoleIdentification() {
  console.log('🔍 TEST D\'IDENTIFICATION DU RÔLE');
  console.log('=================================');
  console.log('');

  // Test 1: Vérifier le rôle actuel
  console.log('1️⃣ Test du rôle actuel...');
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', sessionData);
    console.log('Erreur session:', sessionError);
    
    if (sessionData.session) {
      console.log('✅ Utilisateur authentifié');
      console.log('User ID:', sessionData.session.user?.id);
    } else {
      console.log('✅ Utilisateur anonyme (anon)');
    }
  } catch (err) {
    console.log('❌ Erreur session:', err.message);
  }

  // Test 2: Test d'insertion avec diagnostic détaillé
  console.log('');
  console.log('2️⃣ Test d\'insertion avec diagnostic...');
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Test Rôle',
        email: 'test@studymarket.com',
        subject: 'Test Identification Rôle',
        message: 'Test pour identifier le rôle utilisé par le client Supabase'
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      console.log('❌ Code d\'erreur:', error.code);
      console.log('❌ Détails:', error.details);
      console.log('❌ Hint:', error.hint);
      
      console.log('');
      console.log('🔍 ANALYSE :');
      console.log('   - Le client utilise probablement le rôle "anon"');
      console.log('   - La politique "allow_anon_insert_contact_logs" devrait permettre l\'insertion');
      console.log('   - Problème possible : conflit avec d\'autres politiques');
      
      console.log('');
      console.log('🔧 SOLUTION ALTERNATIVE :');
      console.log('1. Désactiver temporairement RLS pour tester :');
      console.log('   ALTER TABLE public.contact_logs DISABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('2. Ou créer une politique plus permissive :');
      console.log('   CREATE POLICY "Allow all insert" ON public.contact_logs FOR INSERT TO public WITH CHECK (true);');
      
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

  // Test 3: Vérifier les politiques actuelles
  console.log('');
  console.log('3️⃣ Recommandation pour vérifier les politiques...');
  console.log('Exécuter dans Supabase Dashboard :');
  console.log('');
  console.log('```sql');
  console.log('SELECT policyname, roles, cmd, qual, with_check');
  console.log('FROM pg_policies');
  console.log('WHERE tablename = \'contact_logs\';');
  console.log('```');
  console.log('');
  console.log('4️⃣ Solution de contournement temporaire :');
  console.log('```sql');
  console.log('-- Désactiver RLS temporairement pour tester');
  console.log('ALTER TABLE public.contact_logs DISABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('-- Ou créer une politique très permissive');
  console.log('CREATE POLICY "Allow all insert contact_logs"');
  console.log('ON public.contact_logs FOR INSERT TO public WITH CHECK (true);');
  console.log('```');
}

testRoleIdentification().catch(console.error);
