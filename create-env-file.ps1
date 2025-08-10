# Script PowerShell pour créer le fichier .env
# Exécuter : .\create-env-file.ps1

Write-Host "🚀 Création du fichier .env pour StudyMarket" -ForegroundColor Green
Write-Host ""

# Contenu du fichier .env
$envContent = @"
# Configuration Email - StudyMarket
# Ce fichier permet l'envoi d'emails de vérification

# Gmail SMTP (Service de fallback principal)
VITE_GMAIL_USER=votre.email@gmail.com
VITE_GMAIL_APP_PASSWORD=votre_mot_de_passe_application

# Resend (Alternative - 3000 emails/mois gratuits)
# VITE_RESEND_API_KEY=re_votre_cle_api

# Supabase (Si vous utilisez Supabase)
# VITE_SUPABASE_URL=https://votre-projet.supabase.co
# VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Configuration Firebase (déjà dans le code)
# VITE_FIREBASE_API_KEY=AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4
# VITE_FIREBASE_AUTH_DOMAIN=annonces-app-44d27.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=annonces-app-44d27

# Mode développement
VITE_USE_FIREBASE_EMULATORS=false
"@

# Créer le fichier .env
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Fichier .env créé avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Étapes suivantes :" -ForegroundColor Yellow
Write-Host "1. Ouvrir le fichier .env" -ForegroundColor White
Write-Host "2. Remplacer 'votre.email@gmail.com' par votre vrai email" -ForegroundColor White
Write-Host "3. Remplacer 'votre_mot_de_passe_application' par votre mot de passe Gmail" -ForegroundColor White
Write-Host "4. Sauvegarder le fichier" -ForegroundColor White
Write-Host "5. Redémarrer l'application (npm run dev)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Guide complet : CONFIGURATION-EMAIL-URGENT.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT : Activez l'authentification à 2 facteurs sur Gmail" -ForegroundColor Red
Write-Host "   et générez un mot de passe d'application pour StudyMarket" -ForegroundColor Red
