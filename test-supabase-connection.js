// Test de connexion Supabase et création de table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbbhglxrcywpcktkamhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
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
      console.log('📋 Pour créer la table, exécutez ce SQL dans Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor');
      console.log('');
      console.log(`
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id TEXT,
    status TEXT DEFAULT 'nouveau',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert contact messages"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert contact messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);
      `);
    } else {
      console.log('✅ Connexion Supabase réussie !');
      console.log('✅ Table contact_messages existe');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testConnection();
