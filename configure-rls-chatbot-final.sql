-- Configuration RLS parfaite pour le chatbot StudyMarket
-- Basé sur la structure réelle de contact_logs (sans user_id)

-- ============================================
-- 1. ACTIVATION RLS (déjà fait)
-- ============================================
-- ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. SUPPRESSION DES POLITIQUES EXISTANTES (si nécessaire)
-- ============================================
-- DROP POLICY IF EXISTS contact_logs_insert_by_authenticated ON public.contact_logs;
-- DROP POLICY IF EXISTS contact_logs_select_authenticated ON public.contact_logs;
-- DROP POLICY IF EXISTS contact_logs_select_own ON public.contact_logs;
-- DROP POLICY IF EXISTS contact_logs_update_own ON public.contact_logs;
-- DROP POLICY IF EXISTS contact_logs_delete_own ON public.contact_logs;
-- DROP POLICY IF EXISTS contact_logs_admin_modify ON public.contact_logs;

-- ============================================
-- 3. POLITIQUES RLS OPTIMALES POUR LE CHATBOT
-- ============================================

-- Politique INSERT : Permettre aux utilisateurs authentifiés ET anonymes
-- (nécessaire pour le chatbot qui peut être utilisé sans connexion)
CREATE POLICY "Allow authenticated users to insert contact_logs"
ON public.contact_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert contact_logs"
ON public.contact_logs FOR INSERT
TO anon
WITH CHECK (true);

-- Politique SELECT : Lecture pour les admins uniquement
-- (les messages de contact sont privés, seuls les admins peuvent les voir)
CREATE POLICY "Allow admins to read contact_logs"
ON public.contact_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins a 
    WHERE a.user_id = (SELECT auth.uid())::text
  )
);

-- Politique SELECT pour le service role (nécessaire pour les fonctions Edge)
CREATE POLICY "Allow service role to read contact_logs"
ON public.contact_logs FOR SELECT
TO service_role
WITH CHECK (true);

-- ============================================
-- 4. INDEX DE PERFORMANCE
-- ============================================

-- Index pour les requêtes par date (tri chronologique)
CREATE INDEX IF NOT EXISTS idx_contact_logs_created_at
ON public.contact_logs (created_at DESC);

-- Index pour les requêtes par email (recherche)
CREATE INDEX IF NOT EXISTS idx_contact_logs_email
ON public.contact_logs (email);

-- ============================================
-- 5. TEST DE CONFIGURATION
-- ============================================

-- Test d'insertion anonyme (simulation chatbot)
-- INSERT INTO public.contact_logs (name, email, subject, message)
-- VALUES ('Test Chatbot', 'test@studymarket.com', 'Test Configuration', 'Test automatique');

-- ============================================
-- 6. VÉRIFICATION DES POLITIQUES
-- ============================================

-- Pour vérifier les politiques créées :
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'contact_logs';

-- ============================================
-- RÉSUMÉ DE LA CONFIGURATION
-- ============================================

-- ✅ RLS activé
-- ✅ Politique INSERT pour authenticated (utilisateurs connectés)
-- ✅ Politique INSERT pour anon (utilisateurs anonymes = chatbot)
-- ✅ Politique SELECT pour admins (lecture sécurisée)
-- ✅ Politique SELECT pour service_role (fonctions Edge)
-- ✅ Index de performance créés
-- ✅ Configuration optimale pour le chatbot

-- Le chatbot peut maintenant :
-- 1. Insérer des messages même sans connexion utilisateur
-- 2. Les admins peuvent lire tous les messages
-- 3. Les fonctions Edge peuvent accéder aux données
-- 4. Performance optimisée avec les index
