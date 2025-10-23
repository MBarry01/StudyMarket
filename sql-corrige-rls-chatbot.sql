-- SQL corrigé pour les politiques RLS du chatbot StudyMarket
-- Basé sur l'analyse détaillée de Supabase

-- Remove old policies (safe)
DROP POLICY IF EXISTS contact_logs_insert_by_authenticated ON public.contact_logs;
DROP POLICY IF EXISTS contact_logs_select_authenticated ON public.contact_logs;
DROP POLICY IF EXISTS contact_logs_select_own ON public.contact_logs;
DROP POLICY IF EXISTS contact_logs_update_own ON public.contact_logs;
DROP POLICY IF EXISTS contact_logs_delete_own ON public.contact_logs;
DROP POLICY IF EXISTS contact_logs_admin_modify ON public.contact_logs;

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert contact_logs"
  ON public.contact_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anon users to insert
CREATE POLICY "Allow anon users to insert contact_logs"
  ON public.contact_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admins can read contact_logs (check user_id exists in admins)
CREATE POLICY "Allow admins to read contact_logs"
  ON public.contact_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = (SELECT auth.uid())::text
    )
  );

-- Service role: no policy needed — requests using the service_role key bypass RLS automatically.
-- If you intended to allow a specific DB role named "my_service_role", use:
-- CREATE POLICY "Allow my_service_role to read contact_logs"
--   ON public.contact_logs
--   FOR SELECT
--   TO "my_service_role"
--   USING (true);

-- Index de performance (optionnel mais recommandé)
CREATE INDEX IF NOT EXISTS idx_contact_logs_created_at
ON public.contact_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_logs_email
ON public.contact_logs (email);

-- Test d'insertion (à exécuter pour vérifier)
-- INSERT INTO public.contact_logs (name, email, subject, message)
-- VALUES ('Test Chatbot', 'test@studymarket.com', 'Test Configuration', 'Test automatique avec SQL corrigé');
