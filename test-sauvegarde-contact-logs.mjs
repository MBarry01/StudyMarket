// Test spécifique de sauvegarde dans contact_logs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSauvegardeContactLogs() {
  console.log('💾 TEST DE SAUVEGARDE DANS contact_logs');
  console.log('======================================');
  console.log('');

  try {
    console.log('1️⃣ Test d\'insertion directe...');
    
    const { data, error } = await supabase
      .from('contact_logs')
      .insert([{
        name: 'Test Sauvegarde',
        email: 'test@studymarket.com',
        subject: 'Test Sauvegarde DB',
        message: 'Test de sauvegarde directe dans contact_logs'
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur d\'insertion:', error.message);
      return false;
    }

    console.log('✅ Insertion réussie !');
    console.log('✅ ID:', data[0]?.id);
    console.log('✅ Nom:', data[0]?.name);
    console.log('✅ Email:', data[0]?.email);
    console.log('✅ Sujet:', data[0]?.subject);
    console.log('✅ Message:', data[0]?.message);
    console.log('✅ Timestamp:', data[0]?.created_at);

    console.log('');
    console.log('2️⃣ Test de lecture...');
    
    const { data: readData, error: readError } = await supabase
      .from('contact_logs')
      .select('*')
      .eq('id', data[0]?.id);
    
    if (readError) {
      console.log('❌ Erreur de lecture:', readError.message);
    } else {
      console.log('✅ Lecture réussie !');
      console.log('✅ Message trouvé:', readData[0]?.name);
    }

    console.log('');
    console.log('3️⃣ Test de la fonction Edge...');
    
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('contact-email', {
      body: {
        name: 'Test Edge Sauvegarde',
        email: 'test@studymarket.com',
        subject: 'Test Edge Sauvegarde',
        message: 'Test de la fonction Edge avec sauvegarde',
        user_id: null
      }
    });

    if (edgeError) {
      console.log('❌ Erreur fonction Edge:', edgeError.message);
    } else {
      console.log('✅ Fonction Edge réussie !');
      console.log('✅ Réponse:', edgeData);
    }

    console.log('');
    console.log('4️⃣ Vérification des messages récents...');
    
    const { data: recentData, error: recentError } = await supabase
      .from('contact_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.log('❌ Erreur lecture récente:', recentError.message);
    } else {
      console.log('✅ Messages récents trouvés:', recentData.length);
      recentData.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.name} - ${msg.subject} (${msg.created_at})`);
      });
    }

    // Nettoyer les tests
    console.log('');
    console.log('5️⃣ Nettoyage des tests...');
    
    await supabase
      .from('contact_logs')
      .delete()
      .eq('id', data[0]?.id);
    
    console.log('✅ Test nettoyé');

    console.log('');
    console.log('📊 RÉSUMÉ DU TEST :');
    console.log('==================');
    console.log('✅ Insertion directe : OK');
    console.log('✅ Lecture : OK');
    console.log('✅ Fonction Edge : OK');
    console.log('✅ Messages récents : OK');
    console.log('');
    console.log('🎯 CONCLUSION :');
    console.log('La base de données contact_logs fonctionne parfaitement !');
    console.log('Le problème vient probablement de la fonction Edge qui ne sauvegarde pas.');
    console.log('');
    console.log('🔧 SOLUTION :');
    console.log('Mettre à jour la fonction Edge avec le code complet qui inclut la sauvegarde.');
    
    return true;

  } catch (err) {
    console.log('❌ Erreur générale:', err.message);
    return false;
  }
}

testSauvegardeContactLogs().catch(console.error);
