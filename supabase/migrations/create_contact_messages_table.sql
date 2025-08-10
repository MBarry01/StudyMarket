-- Create table for contact messages from chatbot
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id TEXT, -- Firebase UID if user is logged in
    status TEXT DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'lu', 'traité', 'fermé')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for all users (authenticated and anonymous)
CREATE POLICY "Allow insert contact messages" ON contact_messages FOR INSERT 
WITH CHECK (true);

-- Policy: Allow admin users to read all messages
CREATE POLICY "Allow admin read contact messages" ON contact_messages FOR SELECT 
USING (
    -- Add your admin logic here, for now allow authenticated users to read their own messages
    auth.uid()::text = user_id OR 
    -- Or if you have an admin role system:
    -- EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    false
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON contact_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
