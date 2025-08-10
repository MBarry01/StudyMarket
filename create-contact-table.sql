-- Table pour les messages de contact
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

-- Activer RLS (Row Level Security)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour permettre l'insertion
CREATE POLICY "Allow authenticated users to insert contact messages"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert contact messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Politique pour permettre la lecture (optionnel, pour l'admin)
CREATE POLICY "Allow service role to read contact messages"
ON contact_messages FOR SELECT
TO service_role
WITH CHECK (true);
