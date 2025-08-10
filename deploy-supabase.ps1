# Script de deploiement simple
Write-Host "Deploiement Supabase - StudyMarket" -ForegroundColor Green

# Aller dans le dossier de la fonction
Set-Location "supabase/functions/send-contact-email"

Write-Host "Dossier actuel : $(Get-Location)" -ForegroundColor Yellow
Write-Host "Mot de passe : Studymarket@2025" -ForegroundColor Cyan
Write-Host ""

# Deployer la fonction
Write-Host "Deploiement en cours..." -ForegroundColor Yellow
npx supabase functions deploy send-contact-email

# Retourner au dossier racine
Set-Location ../../..

Write-Host ""
Write-Host "Deploiement termine !" -ForegroundColor Green
Write-Host "Verifier : https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions" -ForegroundColor Blue