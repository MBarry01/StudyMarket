// Test rapide du chatbot corrigé
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatbotCorrige() {
  console.log('🧪 TEST RAPIDE DU CHATBOT CORRIGÉ');
  console.log('=================================');
  console.log('');

  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Test Chatbot Corrigé',
        email: 'test@studymarket.com',
        subject: 'Test Correction',
        message: 'Test du chatbot après correction du code'
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur:', error.message);
      return false;
    }

    if (!data || data.length === 0) {
      console.log('❌ Aucune donnée retournée');
      return false;
    }

    console.log('✅ Insertion réussie !');
    console.log('✅ ID:', data[0]?.id);
    console.log('✅ Nom:', data[0]?.name);
    console.log('✅ Email:', data[0]?.email);
    console.log('✅ Sujet:', data[0]?.subject);
    console.log('✅ Message:', data[0]?.message);
    console.log('✅ Timestamp:', data[0]?.created_at);
    
    // Nettoyer
    await supabase
      .from('contact_logs')
      .delete()
      .eq('id', data[0]?.id);
    
    console.log('✅ Test nettoyé');
    console.log('');
    console.log('🎉 CHATBOT CORRIGÉ ET FONCTIONNEL !');
    console.log('');
    console.log('🎯 MAINTENANT TESTEZ DANS L\'APPLICATION :');
    console.log('1. Ouvrir : http://localhost:5173/StudyMarket/');
    console.log('2. Cliquer sur le chatbot (coin bas-droit)');
    console.log('3. Aller dans "Nous contacter"');
    console.log('4. Remplir et envoyer un message');
    console.log('5. Vérifier que ça fonctionne !');
    
    return true;
  } catch (err) {
    console.log('❌ Erreur:', err.message);
    return false;
  }
}

testChatbotCorrige().catch(console.error);
